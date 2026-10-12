// src/modules/cargador/state/persistir.js
// Estado del teléfono que tiene que sobrevivir a la navegación (y a recargar):
// un reactive único por clave, copiado a localStorage en cada cambio.
import { reactive, watch } from "vue";

const vivos = new Map();

export function persistido(clave, inicial) {
  if (vivos.has(clave)) return vivos.get(clave);
  let guardado = null;
  try { guardado = JSON.parse(localStorage.getItem(clave) || "null"); } catch { guardado = null; }
  const st = reactive({ ...structuredClone(inicial), ...(guardado && typeof guardado === "object" ? guardado : {}) });
  watch(st, (v) => {
    try { localStorage.setItem(clave, JSON.stringify(v)); } catch { /* modo privado: queda en memoria */ }
  }, { deep: true });
  vivos.set(clave, st);
  return st;
}

export function reiniciar(st, inicial) {
  for (const k of Object.keys(st)) delete st[k];
  Object.assign(st, structuredClone(inicial));
}
