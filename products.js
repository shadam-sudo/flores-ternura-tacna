// Catálogo de productos — Flores & Ternura Tacna
// Reemplaza "img" por la ruta real de tu foto cuando la tengas (ej: "images/rosas-1.jpg")
const PRODUCTS = [
  { id: 1,  nombre: "Ramo de 12 Rosas Rojas", categoria: "flores", ocasiones: ["enamorados","aniversario"], precio: 89, img: "ph-flor.svg", desc: "Ramo clásico de 12 rosas rojas frescas, envuelto en papel kraft con cinta." },
  { id: 2,  nombre: "Box Floral Mixto", categoria: "flores", ocasiones: ["cumpleanos","amistad"], precio: 79, img: "ph-flor.svg", desc: "Caja redonda con rosas, tulipanes y follaje de temporada." },
  { id: 3,  nombre: "Ramo de Girasoles (6 un.)", categoria: "flores", ocasiones: ["cumpleanos","graduacion"], precio: 69, img: "ph-flor.svg", desc: "6 girasoles frescos con follaje verde, ideal para alegrar el día." },
  { id: 4,  nombre: "Arreglo de Condolencias", categoria: "flores", ocasiones: ["condolencias"], precio: 149, img: "ph-flor.svg", desc: "Arreglo floral blanco en base, para acompañar en momentos difíciles." },
  { id: 5,  nombre: "Ramo Nacimiento Bebé", categoria: "flores", ocasiones: ["nacimiento"], precio: 99, img: "ph-flor.svg", desc: "Flores en tonos pastel con detalle de cigüeña, para celebrar un nacimiento." },
  { id: 6,  nombre: "Caja de Bombones Premium (12 pz)", categoria: "chocolates", ocasiones: ["enamorados","aniversario","cumpleanos"], precio: 45, img: "ph-chocolate.svg", desc: "Selección de 12 bombones rellenos, presentación en caja rígida." },
  { id: 7,  nombre: "Chocolate Artesanal 70% Cacao", categoria: "chocolates", ocasiones: ["amistad","agradecimiento"], precio: 25, img: "ph-chocolate.svg", desc: "Barra de chocolate artesanal semi-amargo, 100 g." },
  { id: 8,  nombre: "Set Chocolates + Fresas Cubiertas", categoria: "chocolates", ocasiones: ["enamorados"], precio: 65, img: "ph-chocolate.svg", desc: "6 fresas cubiertas de chocolate + mini bombones surtidos." },
  { id: 9,  nombre: "Oso de Peluche Grande (60 cm)", categoria: "peluches", ocasiones: ["enamorados","cumpleanos","nacimiento"], precio: 79, img: "ph-peluche.svg", desc: "Oso de peluche suave de 60 cm, ideal para regalar acompañado de flores." },
  { id: 10, nombre: "Oso de Peluche Mediano (35 cm)", categoria: "peluches", ocasiones: ["cumpleanos","amistad"], precio: 45, img: "ph-peluche.svg", desc: "Peluche mediano de 35 cm, disponible en varios colores." },
  { id: 11, nombre: "Set Bebé: Peluche + Manta", categoria: "peluches", ocasiones: ["nacimiento"], precio: 89, img: "ph-peluche.svg", desc: "Peluche pequeño con manta suave, perfecto para baby shower." },
  { id: 12, nombre: "Combo Amor: Rosas + Bombones + Peluche", categoria: "combos", ocasiones: ["enamorados","aniversario"], precio: 179, img: "ph-flor.svg", desc: "12 rosas rojas, caja de bombones premium y oso mediano." }
];

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
