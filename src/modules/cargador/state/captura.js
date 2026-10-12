// src/modules/cargador/state/captura.js
// El lector abierto desde un campo "Código de barras" devuelve el código acá
// y vuelve atrás; el formulario lo toma al montarse.
// Las fotos tomadas en el formulario también esperan acá mientras tanto: un
// File no entra en sessionStorage, pero sí sobrevive en memoria a la ida y
// vuelta al lector (la app no se recarga).
import { ref } from "vue";

export const codigoCapturado = ref("");

export function tomarCodigoCapturado() {
  const c = codigoCapturado.value;
  codigoCapturado.value = "";
  return c;
}

// { ruta, files: File[] } del formulario que fue al lector.
let fotosPendientes = null;

export function guardarFotosPendientes(ruta, files) {
  fotosPendientes = files?.length ? { ruta, files: [...files] } : null;
}

/** Las fotos guardadas para esa ruta (y las olvida). Otra ruta: ninguna. */
export function tomarFotosPendientes(ruta) {
  const p = fotosPendientes;
  fotosPendientes = null;
  return p && p.ruta === ruta ? p.files : [];
}
