// Cliente de base de datos compartido, apuntando al Postgres de Supabase.
// Módulo-nivel singleton reusado entre invocaciones "warm" — no crear un
// cliente nuevo por request (agotar conexiones es el incidente de
// producción más probable de este proyecto, ver Constraints del design doc).
//
// SUPABASE_DB_URL debe ser la cadena de conexión del "Transaction pooler"
// (puerto 6543, Supavisor/pgbouncer) — no la conexión directa (puerto 5432).
// El pooler es obligatorio en serverless: cada invocación fría abriría su
// propia conexión directa y agotaría el límite del proyecto bajo tráfico
// concurrente. `prepare: false` es requerido con el Transaction pooler:
// pgbouncer en modo transacción no soporta prepared statements a nivel de
// sesión, y postgres.js los usa por defecto.
const postgres = require("postgres");

const sql = postgres(process.env.SUPABASE_DB_URL, { prepare: false });

module.exports = { sql };
