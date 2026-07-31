// Guarda el catálogo (products.json) directamente en tu repositorio de GitHub.
// Al hacer commit, Vercel vuelve a publicar el sitio automáticamente (~1 minuto).
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const { password, site, products } = req.body || {};

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "Contraseña incorrecta." });
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;       // ej: "shadam-sudo/flores-ternura-tacna"
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token || !repo) {
    res.status(500).json({ error: "Falta configurar GITHUB_TOKEN o GITHUB_REPO en Vercel." });
    return;
  }

  const filePath = "products.json";
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "User-Agent": "flores-ternura-admin",
    "Content-Type": "application/json",
  };

  try {
    // 1) Obtener el sha actual del archivo (lo exige GitHub para poder actualizarlo)
    const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers });
    if (!getRes.ok) throw new Error("No se pudo leer products.json actual en GitHub.");
    const getData = await getRes.json();

    // 2) Subir la nueva versión
    const content = JSON.stringify({ site, products }, null, 2);
    const contentBase64 = Buffer.from(content, "utf-8").toString("base64");

    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: "Actualizar catálogo desde el panel de administración",
        content: contentBase64,
        sha: getData.sha,
        branch,
      }),
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      throw new Error(err.message || "GitHub rechazó el guardado.");
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error al guardar los cambios." });
  }
};
