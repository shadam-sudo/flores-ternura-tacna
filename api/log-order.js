// Registra un pedido pagado por Yape/Plin/transferencia, confirmado por el
// dueño (requiere ADMIN_PASSWORD) después de ver la captura de pago real.
// Para el registro automático (sin confirmar) que crea el checkout público
// al hacer clic en "Ya pagué, confirmar por WhatsApp", ver public-order.js.
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
  const { allowed } = await checkRateLimit(`log-order:${ip}`, { limit: 20, windowSeconds: 60 });
  if (!allowed) {
    res.status(429).json({ error: "Demasiados intentos, espera un momento." });
    return;
  }

  const { password, cliente_nombre, cliente_telefono, items, monto, metodo } = req.body || {};

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "Contraseña incorrecta." });
    return;
  }

  if (!cliente_nombre || !cliente_telefono || !monto || !metodo) {
    res.status(400).json({ error: "Faltan datos del pedido (nombre, teléfono, monto, método)." });
    return;
  }
  if (!["yape", "plin", "transferencia"].includes(metodo)) {
    res.status(400).json({ error: "Método inválido para registro manual." });
    return;
  }

  const telefono = normalizePhone(cliente_telefono);
  if (!telefono) {
    res.status(400).json({ error: "Teléfono inválido — usa 9 dígitos o +51 seguido de 9 dígitos." });
    return;
  }

  const dedupeKey = buildDedupeKey(telefono, monto);

  try {
    // Upsert atómico: ON CONFLICT DO NOTHING contra la restricción UNIQUE
    // de dedupe_key cierra la condición de carrera de dos solicitudes casi
    // simultáneas — un check-then-insert por separado no la cierra.
    const rows = await sql`
      INSERT INTO orders (cliente_nombre, cliente_telefono, items, monto, metodo, estado, dedupe_key)
      VALUES (${cliente_nombre}, ${telefono}, ${JSON.stringify(items || [])}::jsonb, ${Number(monto)}, ${metodo}, 'confirmado', ${dedupeKey})
      ON CONFLICT (dedupe_key) DO NOTHING
      RETURNING id;
    `;
    res.status(200).json({ ok: true, deduped: rows.length === 0 });
  } catch (err) {
    console.error("log-order: error al guardar", err.message);
    res.status(500).json({ error: "Error al guardar el pedido." });
  }
};
