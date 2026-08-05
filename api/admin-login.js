// Verifica la contraseña del panel de administración.
// La contraseña real vive SOLO en la variable de entorno ADMIN_PASSWORD (Vercel).
const { checkRateLimit } = require("../lib/rate-limit");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  // El panel ahora expone historial de pedidos y datos de clientes detrás
  // de esta misma contraseña única — sin límite de intentos, es fuerza
  // bruta abierta contra PII real, no solo contra el catálogo.
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await checkRateLimit(`admin-login:${ip}`, { limit: 10, windowSeconds: 300 });
  if (!allowed) {
    res.status(429).json({ error: "Demasiados intentos, espera unos minutos." });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    res.status(500).json({ error: "ADMIN_PASSWORD no está configurado en Vercel." });
    return;
  }
  const { password } = req.body || {};
  if (password === adminPassword) {
    res.status(200).json({ ok: true });
  } else {
    res.status(401).json({ error: "Contraseña incorrecta." });
  }
};
