const { sql } = require("./db");

// Contador de intentos persistente en la base de datos (no en memoria) —
// un contador en memoria se resetea en cada cold start de la función
// serverless y no protege nada. Ventana fija simple: si se excede el
// límite dentro de windowSeconds, bloquea hasta que la ventana expire.
async function checkRateLimit(bucket, { limit = 10, windowSeconds = 300 } = {}) {
  const { rows } = await sql`
    INSERT INTO rate_limits (bucket, attempts, window_start)
    VALUES (${bucket}, 1, now())
    ON CONFLICT (bucket) DO UPDATE SET
      attempts = CASE
        WHEN rate_limits.window_start < now() - (${windowSeconds}::text || ' seconds')::interval
          THEN 1
        ELSE rate_limits.attempts + 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start < now() - (${windowSeconds}::text || ' seconds')::interval
          THEN now()
        ELSE rate_limits.window_start
      END
    RETURNING attempts;
  `;
  const attempts = rows[0]?.attempts ?? 1;
  return { allowed: attempts <= limit, attempts };
}

module.exports = { checkRateLimit };
