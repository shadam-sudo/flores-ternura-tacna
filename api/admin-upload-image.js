// Sube una foto de producto a Supabase Storage (bucket público) y devuelve
// la URL pública para usarla de inmediato en el catálogo. Antes esto
// commiteaba el archivo al repo de GitHub — las fotos ya subidas por ese
// camino se quedan sirviéndose desde ahí, esto solo cambia las NUEVAS.
const { supabase, BUCKET } = require("../lib/supabase-storage");

// Duplicado a propósito de CATEGORIAS en taxonomy.js (ese archivo es un
// script de navegador sin module.exports) — sirve solo para no dejar que
// un valor arbitrario de categoria termine como parte de la ruta del
// archivo en Storage.
const CATEGORIAS_VALIDAS = ["flores", "chocolates", "peluches", "combos"];

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const { password, filename, contentBase64, contentType, categoria } = req.body || {};

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "Contraseña incorrecta." });
    return;
  }
  if (!filename || !contentBase64) {
    res.status(400).json({ error: "Falta la imagen." });
    return;
  }
  if (contentType && !contentType.startsWith("image/")) {
    res.status(400).json({ error: "El archivo debe ser una imagen." });
    return;
  }

  const carpeta = CATEGORIAS_VALIDAS.includes(categoria) ? categoria : "otros";
  const safeName = `${carpeta}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;
  const buffer = Buffer.from(contentBase64, "base64");

  try {
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(safeName, buffer, { contentType: contentType || "application/octet-stream", upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(safeName);
    res.status(200).json({ ok: true, url: data.publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error al subir la imagen." });
  }
};
