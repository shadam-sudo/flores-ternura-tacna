const { sql } = require("./db");

// Contador de intentos persistente en la base de datos (no en memoria) —
// un contador en memoria se resetea en cada cold start de la función
// serverless y no protege nada. Ventana fija simple: si se excede el
// límite dentro de windowSeconds, bloquea hasta que la ventana expire.
async function checkRateLimit(bucket, { limit = 10, windowSeconds = 300 } = {}) {
  // Falla ABIERTO si la base de datos falla — no cerrado. Un rate limiter
  // roto no debe tumbar todo el sitio (login, checkout, todo) por sí solo;
  // eso ya pasó una vez (contraseña mal puesta en SUPABASE_DB_URL) y el
  // síntoma visible fue "no se puede ni entrar al panel", no "el rate
  // limit no funciona". Cada caller ya tenía esta llamada SIN try/catch
  // propio, así que el fix vive una sola vez aquí en vez de en los 6
  // endpoints que la usan.
  try {
    const rows = await sql`
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
  } catch (err) {
    console.error(`checkRateLimit: fallo de base de datos en bucket "${bucket}", dejando pasar la solicitud`, err.message);
    return { allowed: true, attempts: 0, error: true };
  }
}

module.exports = { checkRateLimit };
