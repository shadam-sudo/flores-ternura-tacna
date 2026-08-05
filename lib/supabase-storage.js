// Cliente de Supabase Storage compartido, para subir fotos de productos.
// Usa la SERVICE_ROLE key — nunca exponerla al navegador, solo se usa aquí,
// del lado del servidor (funciones serverless de Vercel). El bucket
// "product-images" debe existir y estar marcado como público en el
// dashboard de Supabase (lectura pública, igual que hoy con
// raw.githubusercontent.com) — la escritura solo es posible con esta key.
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const BUCKET = "product-images";

module.exports = { supabase, BUCKET };
