// Lista pedidos con paginación y filtros reales — leer la tabla completa
// degradaría con el volumen, que es la razón por la que se eligió una base
// de datos en vez de archivos en GitHub.
const { sql } = require("../lib/db");
const { checkRateLimit } = require("../lib/rate-limit");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await checkRateLimit(`list-orders:${ip}`, { limit: 60, windowSeconds: 60 });
  if (!allowed) {
    res.status(429).json({ error: "Demasiados intentos, espera un momento." });
    return;
  }

  const { password, estado, metodo, desde, hasta, limit, offset } = req.body || {};

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "Contraseña incorrecta." });
    return;
  }

  const lim = Math.min(Number(limit) || 50, 200);
  const off = Number(offset) || 0;

  try {
    // Orden por defecto: pendientes/rechazados sin revisar primero, luego
    // por fecha reciente — no cronológico puro. Ese default es lo que evita
    // repetir la falla original (un pedido confundido entre los demás).
    const { rows } = await sql`
      SELECT id, fecha, cliente_nombre, cliente_telefono, items, monto, metodo, estado, verification_error, mp_payment_id
      FROM orders
      WHERE (${estado ?? null}::text IS NULL OR estado = ${estado ?? null})
        AND (${metodo ?? null}::text IS NULL OR metodo = ${metodo ?? null})
        AND (${desde ?? null}::timestamptz IS NULL OR fecha >= ${desde ?? null}::timestamptz)
        AND (${hasta ?? null}::timestamptz IS NULL OR fecha <= ${hasta ?? null}::timestamptz)
      ORDER BY
        CASE WHEN estado IN ('pendiente', 'rechazado') OR verification_error THEN 0 ELSE 1 END,
        fecha DESC
      LIMIT ${lim} OFFSET ${off};
    `;
    res.status(200).json({ ok: true, orders: rows });
  } catch (err) {
    console.error("list-orders: error al leer", err.message);
    res.status(500).json({ error: "Error al leer los pedidos." });
  }
};
