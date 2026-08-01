// Guarda un correo de newsletter en subscribers.json dentro del repositorio.
// Es un endpoint público (sin contraseña) porque lo usan los visitantes de la tienda.
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Correo inválido." });
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token || !repo) {
    res.status(500).json({ error: "Falta configurar GITHUB_TOKEN o GITHUB_REPO en Vercel." });
    return;
  }

  const filePath = "subscribers.json";
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "User-Agent": "flores-ternura-newsletter",
    "Content-Type": "application/json",
  };

  try {
    let subscribers = [];
    let sha = null;

    const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers });
    if (getRes.ok) {
      const getData = await getRes.json();
      sha = getData.sha;
      const decoded = Buffer.from(getData.content, "base64").toString("utf-8");
      subscribers = JSON.parse(decoded);
    }

    if (!subscribers.some((s) => s.email.toLowerCase() === email.toLowerCase())) {
      subscribers.push({ email, fecha: new Date().toISOString() });
    }

    const content = JSON.stringify(subscribers, null, 2);
    const contentBase64 = Buffer.from(content, "utf-8").toString("base64");

    const body = {
      message: `Nueva suscripción: ${email}`,
      content: contentBase64,
      branch,
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      throw new Error(err.message || "No se pudo guardar la suscripción.");
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error al suscribir." });
  }
};
