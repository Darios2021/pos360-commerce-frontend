// Estado de la conexion con el servidor, para que el POS pueda avisarlo.
//
// Sin esto, cuando se corta internet el cajero ve la pantalla igual que
// siempre: los botones responden, el carrito suma, y recien se entera al
// intentar cobrar. Peor todavia, no sabe si la venta entro o no. La primera
// medida no es guardar la venta para despues: es que la pantalla lo diga.
//
// No alcanza con navigator.onLine. El navegador lo pone en true con solo tener
// una placa de red conectada: el router puede estar sin internet, o el servidor
// caido, y onLine sigue diciendo que si. Por eso el estado tambien mira como le
// va a las llamadas reales: si una se cae por red, se marca caido; si otra
// vuelve con respuesta, se marca en linea.

import { reactive, readonly } from "vue";

const estado = reactive({
  enLinea: typeof navigator === "undefined" ? true : navigator.onLine !== false,
  // Momento del ultimo corte, para poder decir hace cuanto.
  desde: null,
  // Cuantas llamadas fallaron por red desde el ultimo exito.
  fallasSeguidas: 0,
});

function marcarCaido() {
  estado.fallasSeguidas += 1;
  if (estado.enLinea) {
    estado.enLinea = false;
    estado.desde = Date.now();
  }
}

function marcarEnLinea() {
  estado.fallasSeguidas = 0;
  if (!estado.enLinea) {
    estado.enLinea = true;
    estado.desde = null;
  }
}

/**
 * Un error de axios sin `response` es de red: la request nunca llego o nunca
 * volvio. Un 500 no cuenta: ahi el servidor contesto, el problema es otro y
 * decirle al cajero "sin conexion" lo mandaria a revisar el router al pedo.
 */
function esFalloDeRed(err) {
  if (!err) return false;
  if (err.response) return false;
  const codigo = String(err.code || "");
  if (codigo === "ECONNABORTED" || codigo === "ERR_NETWORK") return true;
  return /network|timeout|failed to fetch/i.test(String(err.message || ""));
}

function escucharAlNavegador() {
  if (typeof window === "undefined") return;
  window.addEventListener("offline", marcarCaido);
  // El evento "online" del navegador es optimista: dice que hay red, no que el
  // servidor conteste. Se limpia el contador y se deja que la proxima llamada
  // real confirme.
  window.addEventListener("online", () => {
    estado.fallasSeguidas = 0;
    if (typeof navigator !== "undefined" && navigator.onLine) marcarEnLinea();
  });
}

escucharAlNavegador();

export const conexion = readonly(estado);
export { marcarCaido, marcarEnLinea, esFalloDeRed };
