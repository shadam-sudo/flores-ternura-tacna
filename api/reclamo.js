// Guarda un reclamo/queja del Libro de Reclamaciones Virtual en reclamos.json.
// Endpoint público (sin contraseña) porque lo usan los clientes.
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const data = req.body || {};
  if (!data.nombres || !data.email || !data.detalle) {
    res.status(400).json({ error: "Faltan datos obligatorios." });
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token || !repo) {
    res.status(500).json({ error: "Falta configurar GITHUB_TOKEN o GITHUB_REPO en Vercel." });
    return;
  }

  const filePath = "reclamos.json";
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "User-Agent": "flores-ternura-reclamos",
    "Content-Type": "application/json",
  };

  try {
    let reclamos = [];
    let sha = null;

    const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers });
    if (getRes.ok) {
      const getData = await getRes.json();
      sha = getData.sha;
      const decoded = Buffer.from(getData.content, "base64").toString("utf-8");
      reclamos = JSON.parse(decoded);
    }

    const numero = reclamos.length + 1;
    reclamos.push({
      numero,
      fecha: new Date().toISOString(),
      tipo: data.tipo || "reclamo",
      nombres: data.nombres,
      dni: data.dni || "",
      telefono: data.telefono || "",
      email: data.email,
      domicilio: data.domicilio || "",
      bienContratado: data.bienContratado || "",
      monto: data.monto || "",
      detalle: data.detalle,
      pedido: data.pedido || "",
      estado: "pendiente",
    });

    const content = JSON.stringify(reclamos, null, 2);
    const contentBase64 = Buffer.from(content, "utf-8").toString("base64");

    const body = {
      message: `Nuevo ${data.tipo || "reclamo"} #${numero} de ${data.nombres}`,
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
      throw new Error(err.message || "No se pudo guardar el reclamo.");
    }

    res.status(200).json({ ok: true, numero });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error al registrar el reclamo." });
  }
};
