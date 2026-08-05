// Webhook de Mercado Pago. Verifica pagos server-side de verdad — antes de
// esto, el checkout solo confiaba en el redirect del navegador del cliente
// a gracias.html, que cualquiera puede visitar sin haber pagado.
//
// Requiere dos variables de entorno además de MP_ACCESS_TOKEN (ya existente):
//   MP_WEBHOOK_SECRET  -> "Clave secreta" que Mercado Pago genera al
//                          registrar la URL del webhook en tu aplicación
//                          (Tus integraciones -> [tu app] -> Webhooks).
//   SUPABASE_DB_URL     -> cadena de conexión "Transaction pooler" de
//                          Supabase (Project Settings -> Database), agregada
//                          a mano en Vercel.
const crypto = require("crypto");
const { sql } = require("../lib/db");
const { checkRateLimit } = require("../lib/rate-limit");
const { normalizePhone } = require("../lib/phone");

function mapMpStatus(mpStatus) {
  switch (mpStatus) {
    case "approved": return "confirmado";
    case "pending":
    case "in_process": return "pendiente";
    case "rejected": return "rechazado";
    case "refunded":
    case "charged_back": return "reembolsado";
    default: return "pendiente";
  }
}

// Valida x-signature siguiendo el esquema documentado por Mercado Pago:
// manifest = "id:<data.id>;request-id:<x-request-id>;ts:<ts>;", firmado con
// HMAC-SHA256 usando la clave secreta del webhook. Verificar esto ANTES de
// llamar a la API de Pagos evita que un atacante agote el rate limit de MP
// bombardeando el endpoint con payment_id falsos.
function verifySignature(req, dataId) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return false; // sin secreto configurado, no se puede verificar — rechazar

  const signatureHeader = req.headers["x-signature"] || "";
  const requestId = req.headers["x-request-id"] || "";
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => p.trim().split("=").map((s) => s.trim()))
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(v1, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function fetchPaymentWithTimeout(paymentId, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`MP Payments API respondió ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  // MP puede enviar el tipo en el body (nuevo formato) o en query (viejo).
  const topic = req.body?.type || req.query?.topic || req.query?.type;
  if (topic !== "payment") {
    res.status(200).json({ ok: true, ignored: topic || "sin topic" });
    return;
  }

  // Mercado Pago documenta el manifest de la firma con el data.id de la
  // URL (query string), no del body — priorizarlo evita rechazar por firma
  // inválida una notificación legítima donde el id del body no coincide
  // exactamente con el de la query.
  const dataId = req.query?.["data.id"] || req.query?.id || req.body?.data?.id;
  if (!dataId) {
    res.status(400).json({ error: "Falta data.id" });
    return;
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await checkRateLimit(`webhook:${ip}`, { limit: 30, windowSeconds: 60 });
  if (!allowed) {
    res.status(429).json({ error: "Demasiadas solicitudes" });
    return;
  }

  if (!verifySignature(req, dataId)) {
    res.status(401).json({ error: "Firma inválida" });
    return;
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    res.status(500).json({ error: "MP_ACCESS_TOKEN no está configurado en Vercel." });
    return;
  }

  let payment;
  let verificationError = false;
  try {
    payment = await fetchPaymentWithTimeout(dataId);
  } catch (err) {
    // No fallar en silencio: si la verificación real falla (MP caído,
    // timeout), el pedido queda visible en el panel como "verificación
    // pendiente por error" en vez de desaparecer sin rastro.
    console.error("mp-webhook: fallo al verificar pago", dataId, err.message);
    verificationError = true;
  }

  const estado = payment ? mapMpStatus(payment.status) : "pendiente";
  const meta = payment?.metadata || {};
  const clienteNombre = meta.cliente_nombre || payment?.payer?.first_name || "Cliente Mercado Pago";
  // Normalizar aquí también, no solo en log-order.js — sin esto, el botón
  // de WhatsApp del panel queda roto para todo pedido pagado por Mercado
  // Pago (la mayoría), porque el checkout no obliga ningún formato de
  // teléfono al cliente. cliente_telefono es NOT NULL en el esquema — si
  // el cliente escribió algo no normalizable (número extranjero, formato
  // raro), guardamos el texto crudo en vez de null: el pago ya se cobró,
  // el pedido no puede perderse solo porque el teléfono no calza el
  // formato peruano. El botón de WhatsApp simplemente no se mostrará para
  // esos casos (ver admin.html).
  const rawTelefono = meta.cliente_telefono || "";
  const clienteTelefono = normalizePhone(rawTelefono) || rawTelefono;
  let items = [];
  try { items = meta.items ? JSON.parse(meta.items) : []; } catch { items = []; }
  const monto = payment?.transaction_amount ?? 0;

  try {
    await sql`
      INSERT INTO orders (cliente_nombre, cliente_telefono, items, monto, metodo, mp_payment_id, estado, verification_error)
      VALUES (${clienteNombre}, ${clienteTelefono}, ${JSON.stringify(items)}::jsonb, ${monto}, 'mercadopago', ${String(dataId)}, ${estado}, ${verificationError})
      ON CONFLICT (mp_payment_id) DO UPDATE SET
        estado = EXCLUDED.estado,
        -- Una notificación reintentada con el MISMO estado (no un cambio
        -- real) no debe encender el error de verificación si ya estaba
        -- apagado — eso convertiría un pedido ya visto en "verificación
        -- pendiente por error" solo porque ESTA llamada puntual a la API
        -- de Pagos falló, sin que haya pasado nada nuevo con el pago.
        -- Una verificación exitosa siempre limpia el error.
        verification_error = CASE
          WHEN EXCLUDED.verification_error = false THEN false
          WHEN EXCLUDED.estado IS DISTINCT FROM orders.estado THEN true
          ELSE orders.verification_error
        END
      WHERE orders.estado NOT IN ('en_preparacion', 'entregado')
        AND (
          CASE EXCLUDED.estado WHEN 'pendiente' THEN 1 WHEN 'confirmado' THEN 2 WHEN 'rechazado' THEN 3 WHEN 'reembolsado' THEN 3 ELSE 0 END
          >=
          CASE orders.estado WHEN 'pendiente' THEN 1 WHEN 'confirmado' THEN 2 WHEN 'rechazado' THEN 3 WHEN 'reembolsado' THEN 3 ELSE 0 END
        );
    `;
  } catch (err) {
    console.error("mp-webhook: fallo al guardar el pedido", dataId, err.message);
    res.status(500).json({ error: "Error al guardar el pedido" });
    return;
  }

  // Responder rápido y 2xx — MP reintenta si no. La verificación ya se hizo
  // arriba con timeout corto; si falló, el pedido ya quedó marcado como error.
  res.status(200).json({ ok: true });
};
