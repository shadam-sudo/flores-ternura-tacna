// Carga el catálogo y los datos del sitio desde products.json en tiempo real.
// Así el panel de administración puede actualizar la tienda sin tocar código.
let PRODUCTS = [];
let SITE = { nombre: "Flores & Ternura Tacna", whatsapp: "51900000000", email: "" };

async function loadCatalog(){
  try{
    const res = await fetch("products.json?t=" + Date.now()); // evita caché vieja
    const data = await res.json();
    PRODUCTS = data.products || [];
    SITE = Object.assign(SITE, data.site || {});
  } catch(e){
    console.error("No se pudo cargar products.json", e);
  }
  return { products: PRODUCTS, site: SITE };
}
