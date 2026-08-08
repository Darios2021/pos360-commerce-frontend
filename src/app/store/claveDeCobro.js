// La clave de idempotencia del cobro, con memoria entre recargas.
//
// El problema que cierra: la clave vivia solo en memoria. Si el POST de la
// venta fallaba por red y el cajero recargaba la pagina (o se le colgaba el
// navegador, o se corto la luz de la maquina), la clave se perdia. Como el
// carrito tampoco se persiste, el cajero rearmaba la venta y cobraba de nuevo
// con una clave nueva. Si el primer intento habia entrado igual del lado del
// servidor, el cliente terminaba pagando dos veces y la idempotencia no servia
// de nada, porque justo el caso que tiene que cubrir es ese.
//
// Ahora la clave se guarda junto a una huella del cobro. Al volver a cobrar:
//   - misma huella  -> se reusa la clave, y el servidor devuelve la venta que
//                      ya habia registrado en vez de crear otra
//   - otra huella   -> clave nueva, porque es OTRA venta
//
// La huella importa tanto como la clave. Reusarla a ciegas seria peor que no
// tenerla: si el cliente agrega un producto y se cobra de nuevo, con la clave
// vieja el servidor devolveria la venta anterior y esa diferencia no se cobra.

const CLAVE_LS = "pos.cobro.pendiente";

// Un cobro pendiente de mas de 12 horas no es un reintento, es basura de otro
// turno. Se descarta para que no se cruce con la venta de mañana.
const VENCE_EN_MS = 12 * 60 * 60 * 1000;

function ahora() {
  return Date.now();
}

/** Huella estable del cobro: los mismos renglones dan la misma cadena. */
export function huellaDelCobro(payload) {
  const items = (payload?.items || [])
    .map((i) => `${i.product_id}x${i.quantity}@${i.unit_price}`)
    .sort()
    .join("|");
  const pagos = (payload?.payments || [])
    .map((p) => `${p.method}:${p.amount}`)
    .sort()
    .join("|");
  return `${items}#${pagos}`;
}

function leer() {
  try {
    const crudo = localStorage.getItem(CLAVE_LS);
    if (!crudo) return null;
    const d = JSON.parse(crudo);
    if (!d?.clave || !d?.huella) return null;
    if (ahora() - Number(d.ts || 0) > VENCE_EN_MS) {
      localStorage.removeItem(CLAVE_LS);
      return null;
    }
    return d;
  } catch {
    return null;
  }
}

function generar() {
  const azar =
    globalThis.crypto?.randomUUID?.() ??
    `${ahora().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  return `pos-${azar}`.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
}

/**
 * Devuelve la clave a usar para este cobro. Reusa la guardada solo si es el
 * mismo cobro; si no, arranca una nueva.
 */
export function claveParaCobro(payload) {
  const huella = huellaDelCobro(payload);
  const guardada = leer();

  if (guardada && guardada.huella === huella) return guardada.clave;

  const clave = generar();
  try {
    localStorage.setItem(CLAVE_LS, JSON.stringify({ clave, huella, ts: ahora() }));
  } catch {
    // Modo privado o almacenamiento lleno: se sigue igual. Sin persistencia la
    // clave protege dentro de la misma pestaña, que ya es la mayoria de los casos.
  }
  return clave;
}

/** La venta entro: el pendiente deja de existir. */
export function cobroConfirmado() {
  try {
    localStorage.removeItem(CLAVE_LS);
  } catch {
    /* nada que hacer */
  }
}

/** Para mostrarlo o para pruebas. */
export function cobroPendiente() {
  return leer();
}
