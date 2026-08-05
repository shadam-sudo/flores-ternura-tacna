// Endpoint público (sin ADMIN_PASSWORD) para que el cliente vea el estado
// de su propio pedido. El id del pedido (uuid de Postgres, 122 bits de
// entropía) ES el token de acceso — mismo modelo que un link de pago de
// Stripe o de reserva de Calendly. Por eso este endpoint SOLO puede
// devolver el pedido de un id exacto, nunca una lista — nunca agregar un
// filtro que permita enumerar pedidos aquí. Y solo expone campos seguros
// para el cliente: nunca verification_error ni mp_payment_id, que son
// señales internas del panel admin, no del cliente.
const { sql } = require("../lib/db");
const { checkRateLimit } = require("../lib/rate-limit");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await checkRateLimit(`order-status:${ip}`, { limit: 30, windowSeconds: 60 });
  if (!allowed) {
    res.status(429).json({ error: "Demasiados intentos, espera un momento." });
    return;
  }

  const id = req.query?.id;
  if (!id || !UUID_RE.test(id)) {
    res.status(400).json({ error: "Pedido no encontrado." });
    return;
  }

  try {
    const rows = await sql`
      SELECT fecha, items, monto, metodo, estado
      FROM orders WHERE id = ${id};
    `;
    if (!rows.length) {
      res.status(404).json({ error: "Pedido no encontrado." });
      return;
    }
    const o = rows[0];
    let items = o.items;
    if (typeof items === "string") {
      try { items = JSON.parse(items); } catch { items = []; }
    }
    res.status(200).json({
      ok: true,
      order: { fecha: o.fecha, items, monto: o.monto, metodo: o.metodo, estado: o.estado },
    });
  } catch (err) {
    console.error("order-status: error", err.message);
    res.status(500).json({ error: "Error al leer el pedido." });
  }
};
