// Elimina un pedido del panel — borrado real, no soft-delete. Para casos de
// prueba o pedidos duplicados/erróneos. Requiere ADMIN_PASSWORD igual que
// los demás endpoints admin.
const { sql } = require("../lib/db");
const { checkRateLimit } = require("../lib/rate-limit");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await checkRateLimit(`delete-order:${ip}`, { limit: 30, windowSeconds: 60 });
  if (!allowed) {
    res.status(429).json({ error: "Demasiados intentos, espera un momento." });
    return;
  }

  const { password, id } = req.body || {};

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "Contraseña incorrecta." });
    return;
  }

  if (!id) {
    res.status(400).json({ error: "Falta el id del pedido." });
    return;
  }

  try {
    const result = await sql`DELETE FROM orders WHERE id = ${id};`;
    if (!result.count) {
      res.status(404).json({ error: "Pedido no encontrado." });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("delete-order: error", err.message);
    res.status(500).json({ error: "Error al eliminar el pedido." });
  }
};
