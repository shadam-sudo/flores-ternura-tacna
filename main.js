// ---------- Render de tarjeta de producto ----------
function productCardHTML(p){
  const ocasionLabel = (p.ocasiones[0] || "");
  return `
    <div class="prod-card">
      <div class="prod-img"><img src="${p.img}" alt="${p.nombre}" loading="lazy"></div>
      <div class="prod-body">
        <div class="prod-tags">
          <span class="tag">${CATEGORIAS.find(c=>c.key===p.categoria)?.label || p.categoria}</span>
        </div>
        <h3>${p.nombre}</h3>
        <div class="price">S/ ${p.precio.toFixed(2)}</div>
        <div class="prod-actions">
          <button class="btn-add" onclick="addToCart(${p.id})">Agregar</button>
        </div>
      </div>
    </div>`;
}

// ---------- Home: destacados ----------
function renderFeatured(){
  const el = document.getElementById("featured-grid");
  if(!el) return;
  const featured = PRODUCTS.slice(0, 8);
  el.innerHTML = featured.map(productCardHTML).join("");
}

// ---------- Catálogo con filtros ----------
let activeCategoria = "todas";
let activeOcasion = "todas";

function renderCatalogFilters(){
  const catWrap = document.getElementById("cat-filters");
  const ocWrap = document.getElementById("oc-filters");
  if(!catWrap || !ocWrap) return;

  catWrap.innerHTML = ['<button class="chip active" data-cat="todas">Todas las categorías</button>']
    .concat(CATEGORIAS.map(c => `<button class="chip" data-cat="${c.key}">${c.label}</button>`)).join("");

  ocWrap.innerHTML = ['<button class="chip active" data-oc="todas">Todas las ocasiones</button>']
    .concat(OCASIONES.map(o => `<button class="chip" data-oc="${o.key}">${o.label}</button>`)).join("");

  catWrap.querySelectorAll("[data-cat]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategoria = btn.dataset.cat;
      catWrap.querySelectorAll(".chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderCatalogGrid();
    });
  });
  ocWrap.querySelectorAll("[data-oc]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeOcasion = btn.dataset.oc;
      ocWrap.querySelectorAll(".chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderCatalogGrid();
    });
  });
}

function renderCatalogGrid(){
  const grid = document.getElementById("catalog-grid");
  if(!grid) return;
  let list = PRODUCTS;
  if(activeCategoria !== "todas") list = list.filter(p => p.categoria === activeCategoria);
  if(activeOcasion !== "todas") list = list.filter(p => p.ocasiones.includes(activeOcasion));
  grid.innerHTML = list.length
    ? list.map(productCardHTML).join("")
    : `<p style="grid-column:1/-1;text-align:center;color:#6b5f57;padding:40px 0;">No hay productos con esos filtros. Prueba con otro.</p>`;
}

// ---------- Carrito: página ----------
function renderCartPage(){
  const container = document.getElementById("cart-page");
  if(!container) return;
  const cart = getCart();

  if(!cart.length){
    container.innerHTML = `
      <div class="empty-cart">
        <h2>Tu carrito está vacío</h2>
        <p>Explora nuestro catálogo y agrega flores, chocolates o peluches.</p>
        <a class="btn btn-primary" href="catalogo.html">Ir al catálogo</a>
      </div>`;
    return;
  }

  const itemsHTML = cart.map(i => `
    <div class="cart-item">
      <img src="${i.img}" alt="${i.nombre}">
      <div>
        <div style="font-weight:600;">${i.nombre}</div>
        <div style="color:#6b5f57;font-size:.9rem;">S/ ${i.precio.toFixed(2)} c/u</div>
        <div class="qty">
          <button onclick="updateQty(${i.id},-1)">−</button>
          <span>${i.qty}</span>
          <button onclick="updateQty(${i.id},1)">+</button>
          <button class="remove-link" onclick="removeFromCart(${i.id})">Eliminar</button>
        </div>
      </div>
      <div style="font-weight:700;color:var(--wine);">S/ ${(i.precio*i.qty).toFixed(2)}</div>
    </div>`).join("");

  const total = cartTotal();

  container.innerHTML = `
    <div class="cart-layout">
      <div>${itemsHTML}</div>
      <div class="summary">
        <h3>Resumen del pedido</h3>
        <div style="font-size:.9rem;color:#6b5f57;">Envío: se coordina por WhatsApp según distrito de Tacna.</div>
        <div class="total-row"><span>Total</span><span>S/ ${total.toFixed(2)}</span></div>
        <button class="pay-btn" id="pay-btn" onclick="pagarConMercadoPago()">Pagar con Mercado Pago</button>
        <p style="font-size:.78rem;color:#9c8f86;margin-top:10px;">Pago procesado de forma segura por Mercado Pago. Aceptamos tarjetas y Yape.</p>
      </div>
    </div>`;
}

// ---------- Checkout: Mercado Pago ----------
async function pagarConMercadoPago(){
  const btn = document.getElementById("pay-btn");
  const cart = getCart();
  if(!cart.length) return;
  btn.disabled = true;
  btn.textContent = "Redirigiendo a Mercado Pago...";
  try{
    const res = await fetch("/api/create-preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map(i => ({ title: i.nombre, qty: i.qty, price: i.precio }))
      })
    });
    if(!res.ok) throw new Error("Error al crear la preferencia de pago");
    const data = await res.json();
    if(data.init_point){
      window.location.href = data.init_point;
    } else {
      throw new Error(data.error || "No se pudo iniciar el pago");
    }
  } catch(err){
    alert("No se pudo conectar con Mercado Pago. Verifica que MP_ACCESS_TOKEN esté configurado en Vercel, o inténtalo más tarde.\n\n" + err.message);
    btn.disabled = false;
    btn.textContent = "Pagar con Mercado Pago";
  }
}

// ---------- Aplica WhatsApp / correo cargados desde products.json ----------
function applySiteConfig(){
  document.querySelectorAll("[data-wa-link]").forEach(a => {
    a.href = "https://wa.me/" + SITE.whatsapp;
  });
  document.querySelectorAll(".wa-display").forEach(el => {
    el.textContent = "WhatsApp: " + SITE.whatsapp;
  });
  document.querySelectorAll(".email-link").forEach(el => {
    if(SITE.email){ el.href = "mailto:" + SITE.email; el.textContent = SITE.email; }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadCatalog();
  applySiteConfig();
  renderFeatured();
  renderCatalogFilters();
  renderCatalogGrid();
  renderCartPage();
});
