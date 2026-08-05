// Normaliza un teléfono peruano a solo-dígitos con prefijo 51, el formato
// que exige un deep link de wa.me (wa.me/<solo-digitos>). Enmascarar con
// "+51" en el formulario no basta — wa.me rompe con espacios, guiones o un
// prefijo de país duplicado, así que la normalización se hace de nuevo aquí,
// en el servidor, no solo en el input del panel.
function normalizePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("51") && digits.length === 11) return digits;
  if (digits.length === 9) return `51${digits}`;
  return null; // formato no reconocible — el caller decide cómo fallar
}

module.exports = { normalizePhone };
