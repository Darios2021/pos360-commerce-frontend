// src/modules/cargador/state/recepcion.js
// Lo contado al recibir una derivación, por número de ítem. Se guarda en el
// teléfono hasta confirmar (Recibir y lector por lote lo comparten).
import { persistido } from "./persistir";

const st = persistido("pos360.cargador.recepciones", { porDerivacion: {} });

export function recepcionDe(transferId) {
  const k = String(transferId);
  if (!st.porDerivacion[k]) st.porDerivacion[k] = { items: {}, actualizada: Date.now() };
  return st.porDerivacion[k];
}

export function contado(transferId, itemId) {
  return Number(recepcionDe(transferId).items[String(itemId)]?.cont || 0);
}

export function fijarContado(transferId, itemId, cont) {
  const r = recepcionDe(transferId);
  const k = String(itemId);
  r.items[k] = { ...(r.items[k] || { nota: "" }), cont: Math.max(0, Number(cont) || 0) };
  r.actualizada = Date.now();
}

export function fijarNota(transferId, itemId, nota) {
  const r = recepcionDe(transferId);
  const k = String(itemId);
  r.items[k] = { ...(r.items[k] || { cont: 0 }), nota: String(nota || "") };
}

export function notaDe(transferId, itemId) {
  return recepcionDe(transferId).items[String(itemId)]?.nota || "";
}

export function olvidarRecepcion(transferId) {
  delete st.porDerivacion[String(transferId)];
}
