// src/modules/cargador/state/lecturas.js
// Últimas lecturas del lector (Inicio). Viven en el teléfono, sin API.
import { persistido } from "./persistir";
import { codigoDe, imagenDe, precioDe, stockDe } from "../lib/formato";

const st = persistido("pos360.cargador.lecturas", { items: [] });

export const lecturas = st;

export function anotarLectura(p) {
  if (!p?.id) return;
  const fila = {
    id: p.id,
    name: p.name || "",
    code: codigoDe(p),
    price: precioDe(p),
    stock: stockDe(p),
    image: imagenDe(p),
    at: Date.now(),
  };
  st.items = [fila, ...st.items.filter((x) => x.id !== p.id)].slice(0, 10);
}

export function lecturasDeHoy() {
  const hoy = new Date().toDateString();
  return st.items.filter((x) => new Date(x.at).toDateString() === hoy);
}
