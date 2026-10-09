// src/app/utils/clienteMayorista.js
//
// Cliente mayorista: se le cobra el precio "Revendedor" del producto
// (price_reseller). La marca vive en las etiquetas del cliente (`tags`, texto
// separado por comas), con la etiqueta "mayorista": asi no hace falta columna
// nueva en la base. Se prende y se apaga desde la ficha del cliente.

export const ETIQUETA_MAYORISTA = "mayorista";

function etiquetas(tags) {
  return String(tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function esMayorista(cliente) {
  const tags = typeof cliente === "string" ? cliente : cliente?.tags;
  return etiquetas(tags).some((t) => t.toLowerCase() === ETIQUETA_MAYORISTA);
}

/** Las etiquetas con la marca de mayorista puesta o sacada; el resto queda igual. */
export function conMayorista(tags, activo) {
  const resto = etiquetas(tags).filter((t) => t.toLowerCase() !== ETIQUETA_MAYORISTA);
  if (activo) resto.push(ETIQUETA_MAYORISTA);
  return resto.join(", ");
}
