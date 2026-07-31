// Verifica la contraseña del panel de administración.
// La contraseña real vive SOLO en la variable de entorno ADMIN_PASSWORD (Vercel).
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
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
