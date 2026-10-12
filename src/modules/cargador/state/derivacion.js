// src/modules/cargador/state/derivacion.js
// Derivación en armado en el teléfono: origen (depósito), destino (sucursal),
// líneas y nota. La comparten Nueva derivación y el lector por lote.
import { persistido, reiniciar } from "./persistir";

const INICIAL = {
  borradorId: null,
  origenWarehouseId: null,
  destinoBranchId: null,
  nota: "",
  // [{ product_id, name, code, image, qty, stock }]  stock = en el origen
  lineas: [],
};

export const derivacion = persistido("pos360.cargador.derivacion", INICIAL);

export function nuevaDerivacion() {
  reiniciar(derivacion, INICIAL);
}

export function lineaDe(productId) {
  return derivacion.lineas.find((l) => Number(l.product_id) === Number(productId)) || null;
}

/** Suma 1 (o crea la línea). Devuelve la línea. */
export function sumarALaDerivacion(p, stockOrigen) {
  let l = lineaDe(p.id);
  if (!l) {
    l = { product_id: p.id, name: p.name || "", code: p.barcode || p.sku || p.code || "", image: p.image || null, qty: 0, stock: Number(stockOrigen) || 0 };
    derivacion.lineas.push(l);
    l = lineaDe(p.id);
  } else if (stockOrigen != null) {
    l.stock = Number(stockOrigen) || 0;
  }
  if (l.stock > 0) l.qty = Math.min(l.stock, Number(l.qty || 0) + 1);
  return l;
}

export function quitarDeLaDerivacion(productId) {
  derivacion.lineas = derivacion.lineas.filter((l) => Number(l.product_id) !== Number(productId));
}

export const lineasValidas = () => derivacion.lineas.filter((l) => l.stock > 0 && l.qty > 0);
export const unidadesDerivacion = () => lineasValidas().reduce((a, l) => a + Number(l.qty || 0), 0);
