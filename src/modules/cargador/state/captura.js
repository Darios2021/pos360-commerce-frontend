// src/modules/cargador/state/captura.js
// El lector abierto desde un campo "Código de barras" devuelve el código acá
// y vuelve atrás; el formulario lo toma al montarse.
import { ref } from "vue";

export const codigoCapturado = ref("");

export function tomarCodigoCapturado() {
  const c = codigoCapturado.value;
  codigoCapturado.value = "";
  return c;
}
