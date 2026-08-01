// Carrito — persistido en localStorage del navegador del cliente
const CART_KEY = "flt_cart";

function getCart(){
  try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch(e){ return []; }
}

function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function addToCart(productId, qty = 1, opciones = {}){
  const product = PRODUCTS.find(p => p.id === productId);
  if(!product) return;
  const cart = getCart();

  // Si trae dedicatoria/fecha/horario, se agrega como línea nueva (no se combina con otras)
  const tieneOpciones = opciones.dedicatoria || opciones.fecha || opciones.horario;
  const existing = !tieneOpciones ? cart.find(i => i.id === productId && !i.dedicatoria && !i.fecha) : null;

  if(existing){
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      nombre: product.nombre,
      precio: product.precio,
      img: product.img,
      qty,
      dedicatoria: opciones.dedicatoria || "",
      fecha: opciones.fecha || "",
      horario: opciones.horario || "",
      cartItemId: Date.now() + Math.random().toString(36).slice(2,7)
    });
  }
  saveCart(cart);
  showToast(`${product.nombre} agregado al carrito`);
}

function updateQty(cartItemId, delta){
  const cart = getCart();
  const item = cart.find(i => String(i.cartItemId || i.id) === String(cartItemId));
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0){
    saveCart(cart.filter(i => String(i.cartItemId || i.id) !== String(cartItemId)));
  } else {
    saveCart(cart);
  }
  if(document.getElementById("cart-page")) renderCartPage();
}

function removeFromCart(cartItemId){
  saveCart(getCart().filter(i => String(i.cartItemId || i.id) !== String(cartItemId)));
  if(document.getElementById("cart-page")) renderCartPage();
}

function cartTotal(){
  return getCart().reduce((sum, i) => sum + i.precio * i.qty, 0);
}

function cartCount(){
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function updateCartCount(){
  document.querySelectorAll(".cart-count").forEach(el => el.textContent = cartCount());
}

function showToast(msg){
  let t = document.getElementById("toast");
  if(!t){
    t = document.createElement("div");
    t.id = "toast";
    t.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#2B2320;color:#fff;padding:12px 20px;border-radius:30px;font-size:.9rem;z-index:999;opacity:0;transition:opacity .25s ease;";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = "1";
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.style.opacity = "0", 1800);
}

document.addEventListener("DOMContentLoaded", updateCartCount);
