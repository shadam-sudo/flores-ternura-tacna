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

## Notas
- El carrito de compras se guarda en el navegador de cada cliente.
- Las categorías y ocasiones (Flores, Chocolates, Peluches, Combos, etc.) son fijas por ahora — si quieres agregar una nueva, dímelo y la incorporamos.
- Las fotos que subas desde el panel quedan guardadas en la carpeta `uploads/` de tu repositorio de GitHub.
- Nunca compartas tu `GITHUB_TOKEN` ni tu `MP_ACCESS_TOKEN` fuera del panel de Vercel.
