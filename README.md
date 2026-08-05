# Flores & Ternura Tacna — Guía de publicación y administración

## Ya tienes funcionando
- Sitio publicado en Vercel, conectado a GitHub.
- Pago con Mercado Pago (si ya configuraste `MP_ACCESS_TOKEN`).

## Nuevo: Panel de administración
Ahora puedes agregar/editar/eliminar productos, cambiar precios, subir fotos y
actualizar tu WhatsApp/correo desde una página privada — sin tocar código.

### 1. Sube estos archivos nuevos/actualizados a tu repositorio de GitHub
En la raíz del repo (junto a `index.html`):
- `admin.html` (nuevo)
- `products.json` (nuevo)
- `taxonomy.js` (nuevo)
- `products.js` (reemplaza el anterior)
- `main.js` (reemplaza el anterior)
- `index.html`, `catalogo.html`, `carrito.html`, `gracias.html` (reemplazan los anteriores)

Dentro de la carpeta `api/` (junto a `create-preference.js`):
- `admin-login.js` (nuevo)
- `admin-save.js` (nuevo)
- `admin-upload-image.js` (nuevo)

**Cómo subirlos:** en GitHub, clic en "Add file" → "Upload files" → arrastra todos estos archivos (los que van en `api/` los arrastras dentro de esa carpeta, entrando primero a `api/` en el repo) → Commit changes.

### 2. Crea un token de GitHub (para que el panel pueda guardar cambios)
1. Ve a https://github.com/settings/tokens?type=beta
2. **"Generate new token"**
3. Nombre: `admin-flores-tacna`
4. **Repository access:** "Only select repositories" → elige tu repo (`flores-ternura-tacna`)
5. **Permissions → Contents:** cambia a **"Read and write"**
6. **Generate token** → copia el token (empieza con `github_pat_...`), **solo se muestra una vez**.

### 3. Configura las variables de entorno en Vercel
Ve a tu proyecto en Vercel → **Settings → Environment Variables** → agrega:

| Variable | Valor |
|---|---|
| `ADMIN_PASSWORD` | La contraseña que tú elijas para entrar al panel |
| `GITHUB_TOKEN` | El token que copiaste en el paso 2 |
| `GITHUB_REPO` | `tu-usuario/tu-repo` (ej: `shadam-sudo/flores-ternura-tacna`) |
| `GITHUB_BRANCH` | `main` |

Luego: **Deployments → ⋯ → Redeploy**.

### 4. Usa el panel
Entra a `https://tu-sitio.vercel.app/admin.html`, ingresa tu contraseña, y ya puedes:
- Agregar productos (nombre, precio, categoría, ocasiones, foto, descripción)
- Editar o eliminar productos existentes
- Cambiar tu número de WhatsApp y correo
- Clic en **"Publicar cambios en la tienda"** → en ~1 minuto se actualiza el sitio público.

**Importante:** no compartas el link de `admin.html` ni la contraseña públicamente.

---

## Nuevo: Pedidos + verificación real de Mercado Pago

Antes, el checkout solo redirigía al navegador del cliente a `gracias.html`
cuando Mercado Pago aprobaba — sin confirmar nada del lado del servidor, y sin
ningún registro de pedidos por Yape/Plin/transferencia. Ahora el panel tiene
una pestaña **Pedidos** con todos los pedidos (cualquier método de pago) en un
solo lugar, y Mercado Pago se verifica de verdad contra la API de pagos.

### 1. Sube estos archivos nuevos/actualizados

Nuevos en `api/`: `mp-webhook.js`, `log-order.js`, `list-orders.js`,
`update-order-status.js`. Nuevos en `lib/`: `db.js`, `phone.js`,
`rate-limit.js`. Nuevo en `sql/`: `schema.sql`. Actualizados: `admin.html`,
`main.js`, `carrito.html` (sin cambios de contenido, pero revisa que cargue
`main.js` actualizado), `api/create-preference.js`, `package.json`.

### 2. Conecta la base de datos Postgres de Supabase

1. En tu proyecto de Supabase → **Project Settings → Database → Connection
   string** → elige el modo **Transaction** (pooler, puerto `6543`). Copia
   esa cadena de conexión y reemplaza `[YOUR-PASSWORD]` por tu contraseña de
   base de datos (la que pusiste al crear el proyecto, o resetéala ahí
   mismo si no la recuerdas).
   **Importante:** este proyecto usa el connection string de Postgres, NO
   la clave publicable ni la clave secreta de la API de Supabase — esas dos
   son para Auth/Storage/REST, no para conectarse directo a la base de datos.
2. En Vercel → tu proyecto → **Settings → Environment Variables**, agrega
   `SUPABASE_DB_URL` con esa cadena de conexión. El modo Transaction es
   obligatorio en serverless (el modo directo agota el límite de conexiones
   del proyecto bajo tráfico concurrente — ver `lib/db.js`).
3. En Supabase → **SQL Editor**, pega el contenido completo de
   `sql/schema.sql` → ejecútalo una sola vez. Esto crea las tablas `orders`
   y `rate_limits`, con Row Level Security activado (así nadie puede leer
   pedidos vía la API pública de Supabase con la clave publicable — solo la
   propia app, conectada directo con la contraseña de la base de datos).

### 3. Registra el webhook en tu aplicación de Mercado Pago

1. Ve a https://www.mercadopago.com.pe/developers/panel → tu aplicación →
   **Webhooks** → **Configurar notificaciones**.
2. URL del webhook: `https://tu-sitio.vercel.app/api/mp-webhook`
3. Evento a suscribir: **Pagos** (payments).
4. Mercado Pago te muestra una **"Clave secreta"** — cópiala.

### 4. Agrega esta variable de entorno nueva en Vercel

| Variable | Valor |
|---|---|
| `MP_WEBHOOK_SECRET` | La "Clave secreta" del paso 3 |

(`SUPABASE_DB_URL` la agregaste tú mismo en el paso 2; las demás variables —
`ADMIN_PASSWORD`, `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`,
`MP_ACCESS_TOKEN` — ya existían.)

Luego: **Deployments → ⋯ → Redeploy**.

### 5. Usa la pestaña Pedidos

Entra a `admin.html` — la primera sección ahora es **Pedidos**: los que
necesitan tu atención (pendientes o rechazados sin revisar) aparecen primero.
Los pedidos de Mercado Pago aparecen solos cuando el cliente paga (verificado
de verdad, no solo por el redirect). Para Yape/Plin/transferencia, regístralos
tú mismo con el formulario "Registrar pedido manual" — toma menos de 30
segundos. Desde cada pedido puedes marcarlo "en preparación" → "entregado", y
enviar un WhatsApp directo al cliente con el botón de la tarjeta.

**Nota de alcance:** este cambio no toca el archivo huérfano `admin ok.html`
(un fix de compresión de imágenes que quedó sin aplicar al `admin.html` real)
— es un bug aparte, pendiente.

---

## Notas
- El carrito de compras se guarda en el navegador de cada cliente.
- Las categorías y ocasiones (Flores, Chocolates, Peluches, Combos, etc.) son fijas por ahora — si quieres agregar una nueva, dímelo y la incorporamos.
- Las fotos que subas desde el panel quedan guardadas en la carpeta `uploads/` de tu repositorio de GitHub.
- Nunca compartas tu `GITHUB_TOKEN` ni tu `MP_ACCESS_TOKEN` fuera del panel de Vercel.
