// ---------- Render de tarjeta de producto ----------
function productCardHTML(p){
  const imgs = (p.imagenes && p.imagenes.length) ? p.imagenes : [p.img || "ph-flor.svg"];
  return `
    <div class="prod-card">
      <a href="producto.html?id=${p.id}" class="prod-img" data-imgs='${JSON.stringify(imgs)}'><img src="${imgs[0]}" alt="${p.nombre}" loading="lazy"></a>
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

function attachHoverCycle(container){
  if(!container) return;
  container.querySelectorAll(".prod-img[data-imgs]").forEach(el => {
    let imgs;
    try{ imgs = JSON.parse(el.dataset.imgs); } catch(e){ return; }
    if(!imgs || imgs.length <= 1) return;
    const imgEl = el.querySelector("img");
    let idx = 0, timer = null;
    el.addEventListener("mouseenter", () => {
      timer = setInterval(() => {
        idx = (idx + 1) % imgs.length;
        imgEl.src = imgs[idx];
      }, 900);
    });
    el.addEventListener("mouseleave", () => {
      clearInterval(timer);
      idx = 0;
      imgEl.src = imgs[0];
    });
  });
}

// ---------- Home: destacados ----------
function renderFeatured(){
  const el = document.getElementById("featured-grid");
  if(!el) return;
  const featured = PRODUCTS.slice(0, 8);
  el.innerHTML = featured.map(productCardHTML).join("");
  attachHoverCycle(el);
}

// ---------- Catálogo con filtros ----------
let activeCategoria = "todas";
let activeOcasion = "todas";

function renderCatalogFilters(){
  const catParam = new URLSearchParams(window.location.search).get("cat");
  if(catParam && CATEGORIAS.some(c => c.key === catParam)) activeCategoria = catParam;

  const catWrap = document.getElementById("cat-filters");
  const ocWrap = document.getElementById("oc-filters");
  if(!catWrap || !ocWrap) return;

  catWrap.innerHTML = [`<button class="chip ${activeCategoria === "todas" ? "active" : ""}" data-cat="todas">Todas las categorías</button>`]
    .concat(CATEGORIAS.map(c => `<button class="chip ${activeCategoria === c.key ? "active" : ""}" data-cat="${c.key}">${c.label}</button>`)).join("");

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
  attachHoverCycle(grid);
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
    <div class="cart-item-card">
      <img src="${i.img}" alt="${i.nombre}">
      <div class="cart-item-info">
        <div class="cart-item-name">${i.nombre}</div>
        <div class="cart-item-unit">S/ ${i.precio.toFixed(2)} c/u</div>
        ${detalles.length ? `<div class="cart-item-tags">${detalles.join(" · ")}</div>` : ""}
        <div class="qty">
          <button onclick="updateQty('${cid}',-1)">−</button>
          <span>${i.qty}</span>
          <button onclick="updateQty('${cid}',1)">+</button>
          <button class="remove-link" onclick="removeFromCart('${cid}')">🗑 Eliminar</button>
        </div>
      </div>
      <div class="cart-item-subtotal">S/ ${(i.precio*i.qty).toFixed(2)}</div>
    </div>`;
  }).join("");

  const subtotal = cartTotal();
  const promo = SITE.promo || {};
  const codigoAplicado = (sessionStorage.getItem("flt_promo") || "").toUpperCase();
  const promoValida = promo.codigo && codigoAplicado === promo.codigo.toUpperCase();
  const descuento = promoValida ? subtotal * (promo.porcentaje / 100) : 0;
  const zonaSel = getZonaSeleccionada();
  const envio = zonaSel ? zonaSel.precio : 0;
  const total = subtotal - descuento + envio;

  const pagos = SITE.pagos || {};
  const metodosAlt = [];
  if(pagos.yape) metodosAlt.push({ id:"yape", label:"Yape", num: pagos.yape, titular: pagos.yapeNombre });
  if(pagos.plin) metodosAlt.push({ id:"plin", label:"Plin", num: pagos.plin, titular: pagos.plinNombre });
  if(pagos.bcp) metodosAlt.push({ id:"bcp", label:"BCP", num: pagos.bcp, cci: pagos.bcpCci, titular: pagos.bcpTitular });
  if(pagos.bn) metodosAlt.push({ id:"bn", label:"Banco de la Nación", num: pagos.bn, titular: pagos.bnTitular });
  if(pagos.interbank) metodosAlt.push({ id:"interbank", label:"Interbank", num: pagos.interbank, titular: pagos.interbankTitular });

  const miniItemsHTML = cart.map(i => `
    <div class="mini-order-item">
      <div class="mini-order-thumb"><img src="${i.img}" alt=""><span class="mini-order-badge">${i.qty}</span></div>
      <div>
        <div style="font-weight:600;font-size:.88rem;">${i.nombre}</div>
        ${i.fecha ? `<div style="font-size:.76rem;color:#6b5f57;">Entrega: ${i.fecha}</div>` : ""}
        ${i.horario ? `<div style="font-size:.76rem;color:#6b5f57;">Horario: ${i.horario === "9am-1pm" ? "9am – 1pm" : "1pm – 6pm"}</div>` : ""}
      </div>
      <div style="margin-left:auto;font-weight:700;color:var(--wine);font-size:.88rem;">S/ ${(i.precio*i.qty).toFixed(2)}</div>
    </div>`).join("");

  container.innerHTML = `
    <div class="cart-layout">
      <div>${itemsHTML}</div>
      <div class="summary">
        <h3>Resumen del pedido</h3>
        <div class="mini-order-list">${miniItemsHTML}</div>

        <div class="promo-row">
          <input type="text" id="promo-input" placeholder="Código de descuento" value="${codigoAplicado}" style="text-transform:uppercase;">
          <button class="mini-btn" onclick="aplicarPromo()">Usar</button>
        </div>
        ${promoValida ? `<div style="color:#2c7a3e;font-size:.82rem;margin-top:-8px;margin-bottom:10px;">✓ Código "${promo.codigo}" aplicado (-${promo.porcentaje}%)</div>` : ""}
        ${codigoAplicado && !promoValida ? `<div style="color:#a12a2a;font-size:.82rem;margin-top:-8px;margin-bottom:10px;">Código no válido</div>` : ""}

        <div class="summary-line"><span>Subtotal</span><span>S/ ${subtotal.toFixed(2)}</span></div>
        ${promoValida ? `<div class="summary-line" style="color:#2c7a3e;"><span>Descuento</span><span>− S/ ${descuento.toFixed(2)}</span></div>` : ""}
        <div class="summary-line">
          <span>Envío${zonaSel ? ` (${zonaSel.distrito})` : ""}</span>
          <span>${zonaSel ? (envio > 0 ? "S/ " + envio.toFixed(2) : "Gratis") : "Por definir"}</span>
        </div>
        <button class="mini-btn" style="width:100%;margin-bottom:10px;" onclick="toggleZonaPicker()">${zonaSel ? "Cambiar distrito" : "Elegir distrito de entrega"}</button>
        <div id="cart-zona-picker" class="zona-box" style="display:none;margin-bottom:14px;padding:14px;">
          <input type="text" id="zona-search" class="zona-input" placeholder="Escribe tu distrito..." oninput="filtrarZonas()" onfocus="filtrarZonas()">
          <div id="zona-results" class="zona-results" style="max-height:180px;"></div>
        </div>
        <div class="total-row"><span>Total</span><span>S/ ${total.toFixed(2)}</span></div>

        <div class="field" style="margin-top:6px;">
          <label>Método de pago</label>
          <div class="pago-option selected" id="opt-mp" onclick="selectMetodo('mp')">
            <div class="pago-option-head">
              <input type="radio" name="metodo-pago" value="mp" checked>
              Tarjeta (Mercado Pago)
            </div>
          </div>
          ${metodosAlt.length ? `
          <div class="pago-option" id="opt-alt" onclick="selectMetodo('alt')">
            <div class="pago-option-head">
              <input type="radio" name="metodo-pago" value="alt">
              Yape / Plin / Transferencia
            </div>
          </div>` : ""}
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

function toggleZonaPicker(){
  const el = document.getElementById("cart-zona-picker");
  if(!el) return;
  const open = el.style.display !== "none";
  el.style.display = open ? "none" : "block";
  if(!open) filtrarZonas();
}

function aplicarPromo(){
  const val = document.getElementById("promo-input").value.trim().toUpperCase();
  sessionStorage.setItem("flt_promo", val);
  renderCartPage();
}

function selectMetodo(valor){
  document.getElementById("opt-mp").classList.toggle("selected", valor === "mp");
  document.getElementById("opt-mp").querySelector("input").checked = valor === "mp";
  const optAlt = document.getElementById("opt-alt");
  if(optAlt){
    optAlt.classList.toggle("selected", valor === "alt");
    optAlt.querySelector("input").checked = valor === "alt";
  }
  document.getElementById("pago-mp-block").style.display = valor === "alt" ? "none" : "block";
  document.getElementById("pago-alt-block").style.display = valor === "alt" ? "block" : "none";
  if(valor === "alt") renderMetodoPago();
}

function renderMetodoPago(){
    const list = document.getElementById("metodos-alt-list");
    if(!list) return;
    list.innerHTML = (window._metodosAlt || []).map(m => `
      <div style="background:var(--cream);border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin-bottom:10px;">
        <b>${m.label}</b><br>
        <span style="font-family:monospace;font-size:1rem;">${m.num}</span>
        ${m.cci ? `<br><span style="font-size:.8rem;color:#6b5f57;">CCI: ${m.cci}</span>` : ""}
        ${m.titular ? `<br><span style="font-size:.8rem;color:#6b5f57;">A nombre de: ${m.titular}</span>` : ""}
      </div>`).join("");
}

function confirmarPagoWhatsApp(){
  const cart = getCart();
  const total = window._cartTotal || cartTotal();
  const zonaSel = getZonaSeleccionada();
  const resumen = cart.map(i => `- ${i.nombre} x${i.qty}`).join("%0A");
  const envioLine = zonaSel ? `%0AEnvío a ${zonaSel.distrito}: ${zonaSel.precio > 0 ? "S/ " + zonaSel.precio.toFixed(2) : "Gratis"}` : "";
  const msg = `Hola! Acabo de realizar el pago de mi pedido (S/ ${total.toFixed(2)}):%0A${resumen}${envioLine}%0A%0AAdjunto la captura del pago.`;
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
    const promo = SITE.promo || {};
    const codigoAplicado = (sessionStorage.getItem("flt_promo") || "").toUpperCase();
    const promoValida = promo.codigo && codigoAplicado === promo.codigo.toUpperCase();
    const factor = promoValida ? (1 - promo.porcentaje / 100) : 1;
    const items = cart.map(i => {
      let title = i.nombre;
      if(i.fecha) title += ` (Entrega: ${i.fecha}, ${i.horario === "9am-1pm" ? "9am-1pm" : "1pm-6pm"})`;
      if(promoValida) title += ` [${promo.codigo} -${promo.porcentaje}%]`;
      return { title, qty: i.qty, price: Math.round(i.precio * factor * 100) / 100 };
    });
    const zonaSel = getZonaSeleccionada();
    if(zonaSel && zonaSel.precio > 0){
      items.push({ title: `Envío a ${zonaSel.distrito}`, qty: 1, price: zonaSel.precio });
    }
    const res = await fetch("/api/create-preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items })
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
  const imgs = (p.imagenes && p.imagenes.length) ? p.imagenes : [p.img || "ph-flor.svg"];

  container.innerHTML = `
    <div class="pd-layout">
      <div>
        <div class="pd-image"><img src="${imgs[0]}" alt="${p.nombre}" id="pd-main-img"></div>
        ${imgs.length > 1 ? `
        <div class="pd-thumbs">
          ${imgs.map((im, i) => `<button class="pd-thumb ${i===0 ? "active" : ""}" onclick="cambiarFotoProducto('${im}', this)"><img src="${im}" alt=""></button>`).join("")}
        </div>` : ""}
      </div>
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

        <div class="zona-box">
          <div class="zona-header">🚚 ¿Cuánto cuesta el envío a tu distrito?</div>
          <input type="text" id="zona-search" class="zona-input" placeholder="Escribe tu distrito: Pocollay, Cercado, Alto de la Alianza..." oninput="filtrarZonas()" onfocus="filtrarZonas()">
          <div id="zona-results" class="zona-results"></div>
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

function guardarZonaSeleccionada(distrito, precio){
  localStorage.setItem("flt_zona", JSON.stringify({ distrito, precio }));
}

function getZonaSeleccionada(){
  try{ return JSON.parse(localStorage.getItem("flt_zona")) || null; }
  catch(e){ return null; }
}

function seleccionarZona(distrito, precio){
  guardarZonaSeleccionada(distrito, precio);
  filtrarZonas();
  if(document.getElementById("cart-page")) renderCartPage();
}

function filtrarZonas(){
  const input = document.getElementById("zona-search");
  const resultsEl = document.getElementById("zona-results");
  if(!input || !resultsEl) return;
  const query = input.value.trim().toLowerCase();
  const zonas = (SITE.zonasEnvio && SITE.zonasEnvio.length) ? SITE.zonasEnvio : DEFAULT_ZONAS;
  const filtradas = query ? zonas.filter(z => z.distrito.toLowerCase().includes(query)) : zonas;
  const seleccionada = getZonaSeleccionada();

  if(!filtradas.length){
    resultsEl.innerHTML = `<div class="zona-empty">No encontramos ese distrito. Escríbenos por WhatsApp y coordinamos.</div>`;
    return;
  }

  resultsEl.innerHTML = filtradas.map(z => `
    <div class="zona-item ${seleccionada && seleccionada.distrito === z.distrito ? "zona-item-selected" : ""}" onclick="seleccionarZona('${z.distrito.replace(/'/g,"\\'")}', ${z.precio})">
      <span>${seleccionada && seleccionada.distrito === z.distrito ? "✓ " : ""}${z.distrito}</span>
      <span class="zona-price">${z.precio > 0 ? "S/ " + z.precio.toFixed(2) : "Gratis"}</span>
    </div>`).join("");
}

function cambiarFotoProducto(src, btn){
  document.getElementById("pd-main-img").src = src;
  document.querySelectorAll(".pd-thumb").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
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
  showAddedModal(productId);
}

// ---------- Modal "Añadido al carrito" con sugerencias cruzadas ----------
function pickSuggestions(baseProductId){
  const base = PRODUCTS.find(p => p.id === baseProductId);
  if(!base) return [];
  const otras = PRODUCTS.filter(p => p.id !== baseProductId && p.categoria !== base.categoria);
  // prioriza chocolates y peluches como complemento de flores, y viceversa
  const prioridad = ["chocolates", "peluches", "flores", "combos"];
  otras.sort((a,b) => prioridad.indexOf(a.categoria) - prioridad.indexOf(b.categoria));
  return otras.slice(0, 3);
}

function showAddedModal(productId){
  const product = PRODUCTS.find(p => p.id === productId);
  if(!product) return;
  closeAddedModal();

  const sugerencias = pickSuggestions(productId);

  const overlay = document.createElement("div");
  overlay.className = "cart-modal-overlay";
  overlay.id = "cart-modal-overlay";
  overlay.onclick = (e) => { if(e.target === overlay) closeAddedModal(); };

  overlay.innerHTML = `
    <div class="cart-modal">
      <div class="cart-modal-head">✓ ¡Añadido a tu carrito!</div>
      <div class="cart-modal-item">
        <img src="${product.img}" alt="${product.nombre}">
        <div>
          <div style="font-weight:600;">${product.nombre}</div>
          <div style="color:var(--wine);font-weight:700;">S/ ${product.precio.toFixed(2)}</div>
        </div>
      </div>

      ${sugerencias.length ? `
      <div class="cart-modal-suggest-title">Completa tu regalo</div>
      <p style="font-size:.8rem;color:#6b5f57;margin:-6px 0 12px;">Se lo llevamos junto, sin costo de envío extra.</p>
      <div class="cart-modal-suggest-grid" id="cart-modal-suggest-grid">
        ${sugerencias.map(s => `
          <div class="suggest-card" id="suggest-${s.id}">
            <img src="${s.img}" alt="${s.nombre}">
            <div class="suggest-name">${s.nombre}</div>
            <div class="suggest-price">S/ ${s.precio.toFixed(2)}</div>
            <button class="mini-btn" onclick="addSuggestion(${s.id})">+ Añadir</button>
          </div>`).join("")}
      </div>` : ""}

      <div class="cart-modal-total">
        <span>Subtotal</span>
        <span id="cart-modal-subtotal">S/ ${cartTotal().toFixed(2)}</span>
      </div>
      <a class="pay-btn" style="display:block;text-align:center;text-decoration:none;" href="carrito.html">Ir a pagar</a>
      <button class="cart-modal-continue" onclick="closeAddedModal()">Seguir comprando</button>
    </div>`;

  document.body.appendChild(overlay);
}

function addSuggestion(productId){
  addToCart(productId, 1, {});
  const card = document.getElementById(`suggest-${productId}`);
  if(card){ card.querySelector("button").textContent = "Añadido ✓"; card.querySelector("button").disabled = true; }
  const subtotalEl = document.getElementById("cart-modal-subtotal");
  if(subtotalEl) subtotalEl.textContent = "S/ " + cartTotal().toFixed(2);
}

function closeAddedModal(){
  const el = document.getElementById("cart-modal-overlay");
  if(el) el.remove();
}

// ---------- Zonas de entrega (home) ----------
function renderZonasHome(){
  const el = document.getElementById("zonas-home-grid");
  if(!el) return;
  const zonas = (SITE.zonasEnvio && SITE.zonasEnvio.length) ? SITE.zonasEnvio : DEFAULT_ZONAS;
  el.innerHTML = zonas.map(z => `
    <div><b>${z.distrito}</b>Entrega ${z.tiempo === "2-4 horas" ? "en 2–4 horas" : "el mismo día"}</div>`).join("");
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
  renderFooterSocial();
}

function renderFooterSocial(){
  const el = document.getElementById("footer-social");
  if(!el) return;
  const social = SITE.social || {};
  const iconos = [];
  if(social.instagram) iconos.push(`<a href="${social.instagram}" target="_blank" rel="noopener" aria-label="Instagram">📷</a>`);
  if(social.facebook) iconos.push(`<a href="${social.facebook}" target="_blank" rel="noopener" aria-label="Facebook">📘</a>`);
  if(social.tiktok) iconos.push(`<a href="${social.tiktok}" target="_blank" rel="noopener" aria-label="TikTok">🎵</a>`);
  el.innerHTML = iconos.join("");
}

async function suscribirNewsletter(e){
  e.preventDefault();
  const email = document.getElementById("newsletter-email").value.trim();
  const msgEl = document.getElementById("newsletter-msg");
  if(!email) return false;
  msgEl.textContent = "Enviando...";
  try{
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if(data.ok){
      const promo = SITE.promo || {};
      if(promo.codigo && promo.porcentaje > 0){
        msgEl.textContent = `✓ ¡Gracias por suscribirte! Tu código: ${promo.codigo} (-${promo.porcentaje}%). Úsalo en tu carrito.`;
      } else {
        msgEl.textContent = "✓ ¡Gracias por suscribirte!";
      }
      document.getElementById("newsletter-email").value = "";
    } else {
      msgEl.textContent = "No se pudo suscribir, intenta de nuevo.";
    }
  } catch(err){
    msgEl.textContent = "Error de conexión.";
  }
  return false;
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadCatalog();
  applySiteConfig();
  renderFeatured();
  renderZonasHome();
  renderCatalogFilters();
  renderCatalogGrid();
  renderCartPage();
  renderProductPage();
});
