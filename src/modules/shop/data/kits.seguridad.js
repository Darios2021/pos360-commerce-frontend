// src/modules/shop/data/kits.seguridad.js
//
// Kits de seguridad electronica armados con productos REALES del catalogo.
//
// Cada kit es una lista de product_id + cantidad. Los precios NO se escriben
// aca: se calculan en vivo desde el catalogo, asi un cambio de lista se
// refleja solo y no queda un precio viejo pegado en el codigo.
//
// Los componentes de cada kit son compatibles entre si a proposito: los
// sensores AX Home van con el hub AX Home, los perifericos X28 con la central
// X28. Mezclarlos daria un kit que no funciona.
//
// ⚠ Estos kits son una vista del front: NO son productos con is_kit=1 en la
// base. El modelo lo soporta (products.is_kit + product_kit_items) y el
// detalle publico ya los devuelve, pero no hay ninguno cargado. Mientras sean
// solo de front, el kit no tiene SKU propio ni se vende como unidad en el POS:
// al carrito entran sus componentes sueltos.

export const KITS_SEGURIDAD = [
  {
    id: "cctv-hogar-4",
    nombre: "Kit CCTV Hogar 4 camaras",
    resumen:
      "Videovigilancia Turbo HD para una casa: grabador de 4 canales, cuatro camaras exteriores y todo el material de instalacion.",
    icono: "mdi-home-outline",
    etiqueta: "Mas elegido",
    ideal: "Casas y locales chicos",
    componentes: [
      { product_id: 597, qty: 1, nota: "Grabador 4 canales" },
      { product_id: 608, qty: 4, nota: "Camaras bullet exterior 2MP" },
      { product_id: 598, qty: 1, nota: "Disco 1TB para CCTV" },
      { product_id: 706, qty: 1, nota: "Fuente 12V 5A" },
      { product_id: 707, qty: 1, nota: "Cable UTP exterior" },
      { product_id: 600, qty: 4, nota: "Balunes de video" },
      { product_id: 711, qty: 1, nota: "Fichas de alimentacion" },
    ],
  },
  {
    id: "cctv-comercio-8",
    nombre: "Kit CCTV Comercio 8 camaras",
    resumen:
      "Color VU para negocios: imagen a color de noche, grabador de 8 canales y disco de 2TB para mas dias de grabacion.",
    icono: "mdi-store-outline",
    ideal: "Comercios y depositos",
    componentes: [
      { product_id: 605, qty: 1, nota: "Grabador 8 canales" },
      { product_id: 599, qty: 8, nota: "Camaras Color VU bullet" },
      { product_id: 697, qty: 1, nota: "Disco 2TB para CCTV" },
      { product_id: 706, qty: 2, nota: "Fuentes 12V 5A" },
      { product_id: 707, qty: 2, nota: "Cable UTP exterior" },
      { product_id: 600, qty: 8, nota: "Balunes de video" },
    ],
  },
  {
    id: "alarma-axhome",
    nombre: "Kit Alarma inalambrica AX Home",
    resumen:
      "Alarma sin cables Hikvision: hub con WiFi y 4G, sensores de movimiento y de apertura, sirena y teclado. Se maneja desde el celular.",
    icono: "mdi-shield-home-outline",
    etiqueta: "Sin obra",
    ideal: "Casas habitadas, sin romper paredes",
    componentes: [
      { product_id: 603, qty: 1, nota: "Hub AX Home WiFi" },
      { product_id: 590, qty: 3, nota: "Sensores de movimiento" },
      { product_id: 593, qty: 3, nota: "Sensores magneticos de apertura" },
      { product_id: 592, qty: 1, nota: "Sirena interior" },
      { product_id: 591, qty: 1, nota: "Teclado" },
      { product_id: 594, qty: 2, nota: "Controles remotos" },
    ],
  },
  {
    id: "alarma-x28",
    nombre: "Kit Alarma cableada X28",
    resumen:
      "Central X28 de 8 zonas con teclado y sirenas interior y exterior. La opcion clasica para obra nueva o instalacion prolija.",
    icono: "mdi-alarm-light-outline",
    ideal: "Obra nueva y refacciones",
    componentes: [
      { product_id: 643, qty: 1, nota: "Central 8 zonas" },
      { product_id: 645, qty: 1, nota: "Teclado LED 8 zonas" },
      { product_id: 646, qty: 1, nota: "Sirena exterior con flash" },
      { product_id: 647, qty: 1, nota: "Sirena interior con luz" },
    ],
  },
  {
    id: "cerco-perimetral",
    nombre: "Kit Cerco electrico perimetral",
    resumen:
      "Energizador de 3,1 km con todo el herraje: parantes, esquineros, aisladores, hilo de 500 m, puesta a tierra y carteleria.",
    icono: "mdi-fence",
    ideal: "Perimetros de hasta 100 m",
    componentes: [
      { product_id: 623, qty: 1, nota: "Energizador 0,5J 3,1km" },
      { product_id: 652, qty: 1, nota: "Hilo electroplastico 500m" },
      { product_id: 689, qty: 2, nota: "Parantes de inicio" },
      { product_id: 691, qty: 4, nota: "Postes esquineros" },
      { product_id: 688, qty: 20, nota: "Varillas intermedias" },
      { product_id: 629, qty: 60, nota: "Aisladores doble pin" },
      { product_id: 677, qty: 1, nota: "Cable de alta tension 50m" },
      { product_id: 693, qty: 1, nota: "Jabalina de puesta a tierra" },
      { product_id: 694, qty: 1, nota: "Tomacable" },
      { product_id: 676, qty: 2, nota: "Carteles de peligro" },
      { product_id: 625, qty: 1, nota: "Control remoto" },
    ],
  },
];

/** Todos los product_id que participan de algun kit, sin repetir. */
export function idsDeKits() {
  const s = new Set();
  for (const k of KITS_SEGURIDAD) for (const c of k.componentes) s.add(Number(c.product_id));
  return [...s];
}

export default KITS_SEGURIDAD;
