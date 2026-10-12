// src/modules/cargador/state/conteo.js
//
// Conteo en curso. Vive en el servidor (/stock/counts): se puede retomar en
// otro teléfono y cargar entre dos. Acá queda el espejo para pintar y el id.
// Si la API no tiene conteos (versión vieja), `local` = true y el conteo se
// arma sólo en el teléfono.
import { persistido, reiniciar } from "./persistir";
import * as api from "../services/conteos.service";
import { imagenDe } from "../lib/formato";

const INICIAL = {
  servidorId: null,
  numero: "",
  estado: "draft",
  local: false,
  warehouseId: null,
  categoryId: null,
  motivo: "",
  // [{ product_id, name, code, image, sistema, contado }]
  lineas: [],
  // product_id -> category_id, para el filtro por rubro (los renglones del servidor no lo traen)
  rubros: {},
};

export const conteo = persistido("pos360.cargador.conteo", INICIAL);

export function nuevoConteo(warehouseId = null) {
  reiniciar(conteo, INICIAL);
  conteo.warehouseId = warehouseId;
}

const n = (v) => Number(String(v ?? 0).replace(",", ".")) || 0;

/** Copia el conteo del servidor al espejo del teléfono. */
export function tomarDelServidor(c) {
  if (!c) return;
  conteo.servidorId = c.id;
  conteo.numero = c.number || "";
  conteo.estado = c.status || "draft";
  conteo.local = false;
  if (c.warehouse_id) conteo.warehouseId = c.warehouse_id;
  if (c.motivo && !conteo.motivo) conteo.motivo = c.motivo;
  if (Array.isArray(c.items)) {
    conteo.lineas = c.items.map((it) => {
      const p = it.product || {};
      return {
        product_id: it.product_id,
        name: p.name || `Producto ${it.product_id}`,
        code: p.barcode || p.sku || p.code || "",
        image: imagenDe(p),
        sistema: n(it.system_qty),
        contado: n(it.counted_qty),
      };
    });
  }
}

export function lineaConteo(productId) {
  return conteo.lineas.find((l) => Number(l.product_id) === Number(productId)) || null;
}

/**
 * Una lectura: +1. Crea el conteo en el servidor si todavía no hay.
 * `sistemaLocal()` sólo se usa con la API vieja. Tira ErrorConteo.
 */
export async function sumarUnoAlConteo(p, sistemaLocal) {
  const cat = Number(p.category_id || p.category?.id || 0);
  if (cat) conteo.rubros = { ...conteo.rubros, [p.id]: cat };
  if (!conteo.local) {
    try {
      const c = conteo.servidorId
        ? await api.sumarUno(conteo.servidorId, p.id)
        : await api.crearConteo({ warehouse_id: conteo.warehouseId, motivo: conteo.motivo, items: [{ product_id: p.id, counted_qty: 1 }] });
      tomarDelServidor(c);
      return lineaConteo(p.id);
    } catch (e) {
      if (e.code !== "SIN_API") throw e;
      conteo.local = true;
    }
  }
  let l = lineaConteo(p.id);
  if (!l) {
    conteo.lineas.unshift({ product_id: p.id, name: p.name || "", code: p.barcode || p.sku || p.code || "", image: imagenDe(p), sistema: Number(await sistemaLocal()) || 0, contado: 0 });
    l = lineaConteo(p.id);
  }
  l.contado = Number(l.contado || 0) + 1;
  return l;
}

/** Stepper de la pantalla: fija la cantidad. */
export async function fijarContado(productId, cantidad) {
  const q = Math.max(0, Number(cantidad) || 0);
  if (!conteo.local && conteo.servidorId) {
    tomarDelServidor(await api.fijarCantidad(conteo.servidorId, productId, q));
    return;
  }
  const l = lineaConteo(productId);
  if (l) l.contado = q;
}

/** Trae del servidor lo que cargó otro teléfono. Si ya se cerró, empieza de nuevo. */
export async function refrescarConteo() {
  if (conteo.local || !conteo.servidorId) return;
  try {
    const c = await api.obtenerConteo(conteo.servidorId);
    if (!c || !["draft", "pending"].includes(c.status)) nuevoConteo(conteo.warehouseId);
    else tomarDelServidor(c);
  } catch (e) {
    if (e.status === 404) nuevoConteo(conteo.warehouseId);
  }
}

/** Sin conteo en este teléfono: retoma el borrador abierto del depósito, si hay. */
export async function retomarBorrador({ esAdmin = false } = {}) {
  if (conteo.servidorId || conteo.local || !conteo.warehouseId) return;
  try {
    // El administrador retoma también los enviados para aprobar (los aplica él).
    const r = await api.listarConteos({ status: esAdmin ? "draft,pending" : "draft", warehouse_id: conteo.warehouseId, limit: 1 });
    const c = (r?.counts || [])[0];
    if (c?.id) tomarDelServidor(await api.obtenerConteo(c.id));
  } catch { /* sin API de conteos o sin red: se sigue en el teléfono */ }
}

export const diferencia = (l) => Number(l.contado || 0) - Number(l.sistema || 0);
export const conDiferencia = () => conteo.lineas.filter((l) => diferencia(l) !== 0);
