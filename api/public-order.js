// Crea un pedido SIN CONFIRMAR cuando un cliente hace clic en "Ya pagué,
// confirmar por WhatsApp" en el checkout público (Yape/Plin/Transferencia).
// A diferencia de log-order.js (que requiere ADMIN_PASSWORD porque el
// dueño ya vio la captura de pago real), este endpoint es público — por
// eso SIEMPRE guarda el pedido en estado "pendiente", nunca "confirmado".
// El dueño confirma con un clic en el panel cuando ve el pago de verdad.
const { sql } = require("../lib/db");
const { checkRateLimit } = require("../lib/rate-limit");
const { normalizePhone } = require("../lib/phone");
const { buildDedupeKey } = require("../lib/dedupe");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
  // Límite más estricto que log-order.js (endpoint del admin): este es
  // público, sin contraseña, así que necesita más resguardo contra spam.
  const { allowed } = await checkRateLimit(`public-order:${ip}`, { limit: 10, windowSeconds: 60 });
  if (!allowed) {
    res.status(429).json({ error: "Demasiados intentos, espera un momento." });
    return;
  }

  const { cliente_nombre, cliente_telefono, items, monto, metodo } = req.body || {};

  if (!cliente_nombre || !cliente_telefono || !monto || !metodo) {
    res.status(400).json({ error: "Faltan datos del pedido (nombre, teléfono, monto, método)." });
    return;
  }
  if (!["yape", "plin", "transferencia"].includes(metodo)) {
    res.status(400).json({ error: "Método inválido." });
    return;
  }

  const telefono = normalizePhone(cliente_telefono);
  if (!telefono) {
    res.status(400).json({ error: "Teléfono inválido — usa 9 dígitos o +51 seguido de 9 dígitos." });
    return;
  }

  const dedupeKey = buildDedupeKey(telefono, monto);

  try {
    const rows = await sql`
      INSERT INTO orders (cliente_nombre, cliente_telefono, items, monto, metodo, estado, dedupe_key)
      VALUES (${cliente_nombre}, ${telefono}, ${JSON.stringify(items || [])}::jsonb, ${Number(monto)}, ${metodo}, 'pendiente', ${dedupeKey})
      ON CONFLICT (dedupe_key) DO NOTHING
      RETURNING id;
    `;
    res.status(200).json({ ok: true, deduped: rows.length === 0 });
  } catch (err) {
    console.error("public-order: error al guardar", err.message);
    res.status(500).json({ error: "Error al guardar el pedido." });
  }
};
