-- Esquema de pedidos para Flores & Ternura Tacna.
-- Ejecutar una sola vez en Supabase -> SQL Editor del dashboard del proyecto
-- (o `psql "$SUPABASE_DB_URL"`).

-- gen_random_uuid() viene incluido en Postgres 13+ sin necesitar extensión
-- — esta línea es solo un respaldo por si acaso.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS orders (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha              timestamptz NOT NULL DEFAULT now(),
  cliente_nombre     text NOT NULL,
  cliente_telefono   text NOT NULL,           -- normalizado: solo dígitos, con 51 al inicio
  items              jsonb NOT NULL DEFAULT '[]'::jsonb,
  monto              numeric(10,2) NOT NULL,
  metodo             text NOT NULL CHECK (metodo IN ('mercadopago', 'yape', 'plin', 'transferencia')),
  mp_payment_id      text UNIQUE,             -- solo pedidos de mercadopago
  estado             text NOT NULL DEFAULT 'pendiente'
                       CHECK (estado IN ('pendiente','confirmado','en_preparacion','entregado','rechazado','reembolsado')),
  verification_error boolean NOT NULL DEFAULT false, -- true = la API de Pagos de MP falló al verificar, requiere revisión manual
  dedupe_key         text,                    -- solo pedidos manuales: hash(telefono+monto+ventana de tiempo)
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_estado_fecha ON orders (estado, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_orders_metodo ON orders (metodo);
CREATE INDEX IF NOT EXISTS idx_orders_dedupe_key ON orders (dedupe_key) WHERE dedupe_key IS NOT NULL;

-- Contador de intentos fallidos de login/acciones admin, persistente entre
-- invocaciones serverless (a diferencia de un contador en memoria).
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket     text PRIMARY KEY,   -- ej: "admin-login:<ip>" o "webhook:<ip>"
  attempts   integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

-- Supabase expone automáticamente cualquier tabla del schema "public" vía
-- su API REST (PostgREST) a quien tenga la clave publicable/anon — sin
-- esto, cualquiera con esa clave (pensada para ser pública, embebida en el
-- navegador) podría leer nombres, teléfonos e historial de pedidos
-- directamente, sin pasar por los endpoints ni el rate limiting de la
-- app. La app se conecta con el rol "postgres" (el connection string
-- pooled), que sigue teniendo acceso total — RLS solo bloquea el acceso
-- vía la API REST con las claves anon/service_role. Sin políticas
-- definidas, RLS activado significa "denegado por defecto" para esa vía.
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
