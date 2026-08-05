-- Esquema de pedidos para Flores & Ternura Tacna.
-- Ejecutar una sola vez contra la base de datos Postgres del proyecto
-- (Vercel Postgres -> tab "Query" del dashboard, o `psql "$POSTGRES_URL"`).

-- gen_random_uuid() viene incluido en Postgres 13+ (y en el Postgres de
-- Vercel/Neon) sin necesitar extensión — esta línea es solo un respaldo
-- por si la base de datos es más antigua.
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
