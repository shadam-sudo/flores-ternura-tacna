// Clave de deduplicación de ventana corta, compartida entre el registro
// manual del admin (log-order.js) y la creación automática desde el
// checkout público (public-order.js) — mismo teléfono + monto en los
// últimos 30s se trata como el mismo envío (doble clic o reintento de
// red), no como un segundo pedido.
const crypto = require("crypto");

function buildDedupeKey(telefono, monto) {
  return crypto
    .createHash("sha256")
    .update(`${telefono}:${Number(monto).toFixed(2)}:${Math.floor(Date.now() / 30000)}`)
    .digest("hex");
}

module.exports = { buildDedupeKey };
