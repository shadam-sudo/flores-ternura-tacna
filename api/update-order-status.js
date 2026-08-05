// Cambia el estado de un pedido desde el panel admin — flujo completo
// (pendiente -> confirmado -> recibido -> en_preparacion -> en_camino ->
// entregado, más rechazado/cancelado/reembolsado como alternos). A
// diferencia de la versión anterior (solo 2 transiciones fijas), esto
// acepta cualquier estado válido: el dueño puede saltar pasos, retroceder,
// o reactivar un pedido rechazado/cancelado — es un panel de un solo admin
// autenticado, no hace falta una máquina de estados estricta del lado del
// servidor. `confirmado`/`rechazado`/`reembolsado` también los puede
// escribir el webhook de MP automáticamente (ver mp-webhook.js) — ambos
// caminos escriben la misma columna sin conflicto.
const { sql } = require("../lib/db");
const { checkRateLimit } = require("../lib/rate-limit");

const VALID_ESTADOS = [
  "pendiente", "confirmado", "recibido", "en_preparacion",
  "en_camino", "entregado", "rechazado", "cancelado", "reembolsado",
];

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await checkRateLimit(`update-order-status:${ip}`, { limit: 60, windowSeconds: 60 });
  if (!allowed) {
    res.status(429).json({ error: "Demasiados intentos, espera un momento." });
    return;
  }

  const { password, id, nuevo_estado } = req.body || {};

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "Contraseña incorrecta." });
    return;
  }

  if (!id || !VALID_ESTADOS.includes(nuevo_estado)) {
    res.status(400).json({ error: "Estado inválido." });
    return;
  }

  try {
    const result = await sql`
      UPDATE orders SET estado = ${nuevo_estado} WHERE id = ${id};
    `;
    if (!result.count) {
      res.status(404).json({ error: "Pedido no encontrado." });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("update-order-status: error", err.message);
    res.status(500).json({ error: "Error al actualizar el pedido." });
  }
};
