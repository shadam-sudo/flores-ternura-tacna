// Fase 2: avanzar el estado de cumplimiento de un pedido (confirmado ->
// en_preparación -> entregado). Estos son pasos manuales del dueño, no
// eventos de pago — por eso este endpoint solo permite esas dos transiciones,
// nunca escribe estados de pago (confirmado/rechazado/reembolsado), que
// siguen siendo exclusivos del webhook.
const { sql } = require("../lib/db");
const { checkRateLimit } = require("../lib/rate-limit");

const ALLOWED_TRANSITIONS = {
  en_preparacion: ["confirmado"],
  entregado: ["en_preparacion"],
};

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

  const requiredFrom = ALLOWED_TRANSITIONS[nuevo_estado];
  if (!id || !requiredFrom) {
    res.status(400).json({ error: "Transición de estado inválida." });
    return;
  }

  try {
    const result = await sql`
      UPDATE orders SET estado = ${nuevo_estado}
      WHERE id = ${id} AND estado = ANY(${requiredFrom});
    `;
    if (!result.count) {
      res.status(409).json({ error: "El pedido ya no está en el estado esperado — refresca la vista." });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("update-order-status: error", err.message);
    res.status(500).json({ error: "Error al actualizar el pedido." });
  }
};
