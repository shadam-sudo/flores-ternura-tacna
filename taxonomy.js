// Categorías y ocasiones — lista fija (no se edita desde el panel).
// Si quieres agregar una categoría u ocasión nueva, dímelo y te ayudo a añadirla aquí.
const OCASIONES = [
  { key: "enamorados",   label: "Enamorados / San Valentín" },
  { key: "aniversario",  label: "Aniversario" },
  { key: "cumpleanos",   label: "Cumpleaños" },
  { key: "nacimiento",   label: "Nacimiento" },
  { key: "graduacion",   label: "Graduación" },
  { key: "condolencias", label: "Condolencias" },
  { key: "amistad",      label: "Amistad" },
  { key: "agradecimiento", label: "Agradecimiento" }
];

const CATEGORIAS = [
  { key: "flores",     label: "Flores" },
  { key: "chocolates", label: "Chocolates" },
  { key: "peluches",   label: "Peluches" },
  { key: "combos",     label: "Combos" }
];

// Distritos de la provincia de Tacna — respaldo por si products.json aún no los tiene.
// En cuanto publiques cambios desde el panel, esta lista queda guardada en products.json.
const DEFAULT_ZONAS = [
  { distrito: "Tacna (Cercado)", precio: 0 },
  { distrito: "Alto de la Alianza", precio: 0 },
  { distrito: "Ciudad Nueva", precio: 0 },
  { distrito: "Coronel Gregorio Albarracín Lanchipa", precio: 0 },
  { distrito: "Pocollay", precio: 0 },
  { distrito: "Calana", precio: 0 },
  { distrito: "Pachía", precio: 0 },
  { distrito: "Palca", precio: 0 },
  { distrito: "Inclán", precio: 0 },
  { distrito: "Sama (Las Yaras)", precio: 0 },
  { distrito: "La Yarada - Los Palos", precio: 0 }
];
