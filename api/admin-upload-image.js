// Sube una foto de producto al repositorio de GitHub (carpeta /uploads) y
// devuelve la URL pública para usarla de inmediato en el catálogo.
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const { password, filename, contentBase64 } = req.body || {};

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "Contraseña incorrecta." });
    return;
  }
  if (!filename || !contentBase64) {
    res.status(400).json({ error: "Falta la imagen." });
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token || !repo) {
    res.status(500).json({ error: "Falta configurar GITHUB_TOKEN o GITHUB_REPO en Vercel." });
    return;
  }

  const safeName = `uploads/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${safeName}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "User-Agent": "flores-ternura-admin",
    "Content-Type": "application/json",
  };

  try {
    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: `Subir imagen ${safeName}`,
        content: contentBase64,
        branch,
      }),
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      throw new Error(err.message || "GitHub rechazó la imagen.");
    }

    // URL pública inmediata (no necesita esperar el redeploy de Vercel)
    const url = `https://raw.githubusercontent.com/${repo}/${branch}/${safeName}`;
    res.status(200).json({ ok: true, url });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error al subir la imagen." });
  }
};
