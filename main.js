// ---------- Render de tarjeta de producto ----------
function productCardHTML(p){
  return `
    <div class="prod-card">
      <a href="producto.html?id=${p.id}" class="prod-img"><img src="${p.img}" alt="${p.nombre}" loading="lazy"></a>
      <div class="prod-body">
        <div class="prod-tags">
          <span class="tag">${CATEGORIAS.find(c=>c.key===p.categoria)?.label || p.categoria}</span>
        </div>
        <h3><a href="producto.html?id=${p.id}" style="color:inherit;">${p.nombre}</a></h3>
        <div class="price">S/ ${p.precio.toFixed(2)}</div>
        <div class="prod-actions">
          <a href="producto.html?id=${p.id}" class="btn-add" style="text-align:center;text-decoration:none;">Ver y personalizar</a>
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

  const itemsHTML = cart.map(i => {
    const cid = i.cartItemId || i.id;
    const detalles = [];
    if(i.fecha) detalles.push(`📅 ${i.fecha}`);
    if(i.horario) detalles.push(`🕐 ${i.horario === "9am-1pm" ? "9am – 1pm" : "1pm – 6pm"}`);
    if(i.dedicatoria) detalles.push(`💌 "${i.dedicatoria}"`);
    return `
    <div class="cart-item">
      <img src="${i.img}" alt="${i.nombre}">
      <div>
        <div style="font-weight:600;">${i.nombre}</div>
        <div style="color:#6b5f57;font-size:.9rem;">S/ ${i.precio.toFixed(2)} c/u</div>
        ${detalles.length ? `<div style="font-size:.8rem;color:var(--sage);margin-top:2px;">${detalles.join(" · ")}</div>` : ""}
        <div class="qty">
          <button onclick="updateQty('${cid}',-1)">−</button>
          <span>${i.qty}</span>
          <button onclick="updateQty('${cid}',1)">+</button>
          <button class="remove-link" onclick="removeFromCart('${cid}')">Eliminar</button>
        </div>
      </div>
      <div style="font-weight:700;color:var(--wine);">S/ ${(i.precio*i.qty).toFixed(2)}</div>
    </div>`;
  }).join("");

  const total = cartTotal();
  const pagos = SITE.pagos || {};
  const metodosAlt = [];
  if(pagos.yape) metodosAlt.push({ id:"yape", label:"Yape", num: pagos.yape, titular: pagos.yapeNombre });
  if(pagos.plin) metodosAlt.push({ id:"plin", label:"Plin", num: pagos.plin, titular: pagos.plinNombre });
  if(pagos.bcp) metodosAlt.push({ id:"bcp", label:"BCP", num: pagos.bcp, cci: pagos.bcpCci, titular: pagos.bcpTitular });
  if(pagos.bn) metodosAlt.push({ id:"bn", label:"Banco de la Nación", num: pagos.bn, titular: pagos.bnTitular });
  if(pagos.interbank) metodosAlt.push({ id:"interbank", label:"Interbank", num: pagos.interbank, titular: pagos.interbankTitular });

  container.innerHTML = `
    <div class="cart-layout">
      <div>${itemsHTML}</div>
      <div class="summary">
        <h3>Resumen del pedido</h3>
        <div style="font-size:.9rem;color:#6b5f57;">Envío: se coordina por WhatsApp según distrito de Tacna.</div>
        <div class="total-row"><span>Total</span><span>S/ ${total.toFixed(2)}</span></div>

        <div class="field" style="margin-top:6px;">
          <label>Método de pago</label>
          <select id="metodo-pago" onchange="renderMetodoPago()">
            <option value="mp">Tarjeta (Mercado Pago)</option>
            ${metodosAlt.length ? `<option value="alt">Yape / Plin / Transferencia</option>` : ""}
          </select>
        </div>

        <div id="pago-mp-block">
          <button class="pay-btn" id="pay-btn" onclick="pagarConMercadoPago()">Pagar con Mercado Pago</button>
          <p style="font-size:.78rem;color:#9c8f86;margin-top:10px;">Pago procesado de forma segura por Mercado Pago. Aceptamos tarjetas.</p>
        </div>

        <div id="pago-alt-block" style="display:none;">
          <div id="metodos-alt-list"></div>
          <button class="pay-btn" onclick="confirmarPagoWhatsApp()">Ya pagué, confirmar por WhatsApp</button>
          <p style="font-size:.78rem;color:#9c8f86;margin-top:10px;">Realiza el pago a los datos de arriba y envíanos la captura por WhatsApp para confirmar tu pedido.</p>
        </div>
      </div>
    </div>`;

  window._metodosAlt = metodosAlt;
  window._cartTotal = total;
  renderMetodoPago();
}

function renderMetodoPago(){
  const sel = document.getElementById("metodo-pago");
  if(!sel) return;
  const esAlt = sel.value === "alt";
  document.getElementById("pago-mp-block").style.display = esAlt ? "none" : "block";
  document.getElementById("pago-alt-block").style.display = esAlt ? "block" : "none";
  if(esAlt){
    const list = document.getElementById("metodos-alt-list");
    list.innerHTML = (window._metodosAlt || []).map(m => `
      <div style="background:var(--cream);border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin-bottom:10px;">
        <b>${m.label}</b><br>
        <span style="font-family:monospace;font-size:1rem;">${m.num}</span>
        ${m.cci ? `<br><span style="font-size:.8rem;color:#6b5f57;">CCI: ${m.cci}</span>` : ""}
        ${m.titular ? `<br><span style="font-size:.8rem;color:#6b5f57;">A nombre de: ${m.titular}</span>` : ""}
      </div>`).join("");
  }
}

function confirmarPagoWhatsApp(){
  const cart = getCart();
  const total = window._cartTotal || cartTotal();
  const resumen = cart.map(i => `- ${i.nombre} x${i.qty}`).join("%0A");
  const msg = `Hola! Acabo de realizar el pago de mi pedido (S/ ${total.toFixed(2)}):%0A${resumen}%0A%0AAdjunto la captura del pago.`;
  window.open(`https://wa.me/${SITE.whatsapp}?text=${msg}`, "_blank");
  localStorage.removeItem("flt_cart");
  window.location.href = "gracias.html";
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
        items: cart.map(i => {
          let title = i.nombre;
          if(i.fecha) title += ` (Entrega: ${i.fecha}, ${i.horario === "9am-1pm" ? "9am-1pm" : "1pm-6pm"})`;
          return { title, qty: i.qty, price: i.precio };
        })
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

// ---------- Página de producto individual ----------
function getQueryId(){
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get("id"), 10);
}

function minDeliveryDate(){
  const d = new Date();
  d.setDate(d.getDate() + 1); // entrega mínima: mañana
  return d.toISOString().split("T")[0];
}

let selectedHorario = "9am-1pm";

function renderProductPage(){
  const container = document.getElementById("product-page");
  if(!container) return;

  const id = getQueryId();
  const p = PRODUCTS.find(x => x.id === id);

  if(!p){
    container.innerHTML = `<div class="empty-cart"><h2>Producto no encontrado</h2><a class="btn btn-primary" href="catalogo.html">Volver al catálogo</a></div>`;
    return;
  }

  document.title = `${p.nombre} | ${SITE.nombre || "Flores & Ternura Tacna"}`;

  container.innerHTML = `
    <div class="pd-layout">
      <div class="pd-image"><img src="${p.img}" alt="${p.nombre}"></div>
      <div>
        <div class="prod-tags"><span class="tag">${CATEGORIAS.find(c=>c.key===p.categoria)?.label || p.categoria}</span></div>
        <h1 style="margin-top:10px;">${p.nombre}</h1>
        <div class="pd-price price">S/ ${p.precio.toFixed(2)}</div>
        <p style="color:#544943;line-height:1.6;">${p.desc || ""}</p>

        <div class="pd-trust">
          <span>🚚 Entrega en Tacna</span>
          <span>🔒 Pago seguro con Mercado Pago</span>
          <span>💬 Coordinamos por WhatsApp</span>
        </div>

        <div class="panel-card">
          <div class="field">
            <label>Tu dedicatoria (opcional) — va en una tarjeta con tu pedido</label>
            <input type="text" id="pd-dedicatoria" maxlength="200" placeholder="Escribe unas líneas y firma para que sepan de quién es 💜">
          </div>
          <div class="row2">
            <div class="field">
              <label>Fecha de entrega</label>
              <input type="date" id="pd-fecha" min="${minDeliveryDate()}">
            </div>
            <div class="field">
              <label>Horario de entrega</label>
              <div class="horario-group">
                <button type="button" class="horario-btn active" id="horario-manana" onclick="setHorario('9am-1pm')">9am – 1pm</button>
                <button type="button" class="horario-btn" id="horario-tarde" onclick="setHorario('1pm-6pm')">1pm – 6pm</button>
              </div>
            </div>
          </div>
          <button class="pd-cta" onclick="addProductFromPage(${p.id})">Agregar al carrito · S/ ${p.precio.toFixed(2)}</button>
          <p class="pd-note">Entrega solo en Tacna · Pago 100% seguro con Mercado Pago</p>
        </div>

        <div class="acc-card">
          <button class="acc-toggle" onclick="toggleAcc('acc-incluye')">¿Qué incluye este arreglo? <span>+</span></button>
          <div class="acc-body" id="acc-incluye" style="display:none;">
            <p>${p.incluye || "Producto + tarjeta de dedicatoria (opcional)."}</p>
          </div>
        </div>
        <div class="acc-card">
          <button class="acc-toggle" onclick="toggleAcc('acc-faq')">Preguntas frecuentes <span>+</span></button>
          <div class="acc-body" id="acc-faq" style="display:none;">
            <p><b>¿Puedo cambiar la fecha después de pedir?</b><br>Sí, escríbenos por WhatsApp y coordinamos.</p>
            <p><b>¿Hacen entregas el mismo día?</b><br>Sí, si confirmas antes de las 4:00 p.m., según tu distrito en Tacna.</p>
            <p><b>¿El producto es exactamente igual a la foto?</b><br>Foto referencial — el follaje y color de envoltura pueden variar levemente según disponibilidad.</p>
          </div>
        </div>
      </div>
    </div>`;
}

function setHorario(valor){
  selectedHorario = valor;
  document.getElementById("horario-manana").classList.toggle("active", valor === "9am-1pm");
  document.getElementById("horario-tarde").classList.toggle("active", valor === "1pm-6pm");
}

function toggleAcc(id){
  const el = document.getElementById(id);
  const open = el.style.display !== "none";
  el.style.display = open ? "none" : "block";
  const btn = el.previousElementSibling;
  btn.querySelector("span").textContent = open ? "+" : "−";
}

function addProductFromPage(productId){
  const dedicatoria = document.getElementById("pd-dedicatoria").value.trim();
  const fecha = document.getElementById("pd-fecha").value;
  addToCart(productId, 1, { dedicatoria, fecha, horario: selectedHorario });
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
  renderProductPage();
});
