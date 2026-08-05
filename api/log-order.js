// Registra un pedido pagado por Yape/Plin/transferencia — métodos que hoy
// no dejan ningún rastro automático en el sistema, solo WhatsApp.
const crypto = require("crypto");
const { sql } = require("../lib/db");
const { checkRateLimit } = require("../lib/rate-limit");
const { normalizePhone } = require("../lib/phone");

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

  // Deduplicación de ventana corta: mismo teléfono + monto en los últimos
  // 30s se trata como el mismo envío (doble clic o reintento de red), no
  // como un segundo pedido.
  const dedupeKey = crypto
    .createHash("sha256")
    .update(`${telefono}:${Number(monto).toFixed(2)}:${Math.floor(Date.now() / 30000)}`)
    .digest("hex");

  try {
    const existing = await sql`SELECT id FROM orders WHERE dedupe_key = ${dedupeKey} LIMIT 1;`;
    if (existing.length) {
      res.status(200).json({ ok: true, deduped: true });
      return;
    }

    await sql`
      INSERT INTO orders (cliente_nombre, cliente_telefono, items, monto, metodo, estado, dedupe_key)
      VALUES (${cliente_nombre}, ${telefono}, ${JSON.stringify(items || [])}::jsonb, ${Number(monto)}, ${metodo}, 'confirmado', ${dedupeKey});
    `;
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("log-order: error al guardar", err.message);
    res.status(500).json({ error: "Error al guardar el pedido." });
  }
};
