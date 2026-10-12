// src/modules/cargador/services/conteos.service.js
//
// Conteos de stock. Contrato: docs/conteos-y-codigo.md de pos360-commerce-api
// (rama cargador-api). Todo lo que depende del contrato vive en este archivo.
//
//   POST /stock/counts                 { warehouse_id, motivo?, items? }        -> { ok, count }
//   GET  /stock/counts?status=&warehouse_id=                                    -> { counts, count_by_status, ... }
//   GET  /stock/counts/:id                                                       -> { ok, count }
//   PUT  /stock/counts/:id             { mode: sumar|reemplazar|reemplazar_todo, items, remove_product_ids?, motivo? }
//   POST /stock/counts/:id/submit      { motivo? }  draft -> pending (cajero)
//   POST /stock/counts/:id/apply       { motivo? }  draft|pending -> applied (sólo administrador)
//   POST /stock/counts/:id/cancel
//
// Estados: draft, pending, applied, cancelled. counted_qty, system_qty y
// diff_qty llegan como texto decimal ("8.000").
// Con la API vieja (sin /stock/counts: 404 NOT_FOUND de ruta) el conteo queda
// en el teléfono y el dueño aplica por /stock/init, producto por producto.
import http from "@/app/api/http";

const conteoDe = (data) => data?.count || data?.data || null;

export class ErrorConteo extends Error {
  constructor(code, message, extra = {}) {
    super(message || code);
    this.code = code;
    Object.assign(this, extra);
  }
}

function traducir(e) {
  const d = e?.response?.data || {};
  const code = d.code || (e?.response ? `HTTP_${e.response.status}` : "RED");
  // Ruta inexistente: API sin conteos.
  const sinApi = e?.response?.status === 404 && code === "NOT_FOUND" && /Ruta no encontrada/i.test(String(d.message || ""));
  return new ErrorConteo(sinApi ? "SIN_API" : code, d.message || e?.message, { product_id: d.product_id, status: e?.response?.status });
}

async function pedir(fn) {
  try { return await fn(); } catch (e) { throw traducir(e); }
}

export const crearConteo = ({ warehouse_id, motivo, items = [] }) =>
  pedir(async () => conteoDe((await http.post("/stock/counts", { warehouse_id, motivo: motivo || undefined, items })).data));

export const obtenerConteo = (id) => pedir(async () => conteoDe((await http.get(`/stock/counts/${id}`)).data));

export const listarConteos = (params = {}) => pedir(async () => (await http.get("/stock/counts", { params })).data);

/** Una lectura del lector: +1 (dos teléfonos pueden sumar a la vez). */
export const sumarUno = (id, product_id) =>
  pedir(async () => conteoDe((await http.put(`/stock/counts/${id}`, { mode: "sumar", items: [{ product_id, counted_qty: 1 }] })).data));

/** El stepper de la pantalla: fija la cantidad de un producto. */
export const fijarCantidad = (id, product_id, counted_qty) =>
  pedir(async () => conteoDe((await http.put(`/stock/counts/${id}`, { mode: "reemplazar", items: [{ product_id, counted_qty }] })).data));

export const quitarProducto = (id, product_id) =>
  pedir(async () => conteoDe((await http.put(`/stock/counts/${id}`, { remove_product_ids: [product_id] })).data));

export const enviarConteo = (id, motivo) =>
  pedir(async () => conteoDe((await http.post(`/stock/counts/${id}/submit`, { motivo })).data));

export const aplicarConteo = (id, motivo) =>
  pedir(async () => {
    const { data } = await http.post(`/stock/counts/${id}/apply`, { motivo });
    return { count: conteoDe(data), movements: data?.movements || [], summary: data?.summary || null };
  });

export const cancelarConteo = (id) => pedir(async () => conteoDe((await http.post(`/stock/counts/${id}/cancel`)).data));

/** Stock del sistema de un producto en un depósito (API vieja y derivaciones). */
export async function stockEnDeposito(warehouseId, producto) {
  const q = producto?.barcode || producto?.sku || producto?.code || producto?.name || "";
  const { data } = await http.get("/stock", { params: { warehouse_id: warehouseId, q } });
  const filas = Array.isArray(data) ? data : data?.items || data?.data || data?.rows || [];
  const f = filas.find((r) => Number(r.product_id ?? r.product?.id ?? r.id) === Number(producto.id));
  return f ? Number(f.qty ?? f.quantity ?? f.stock ?? 0) || 0 : 0;
}

/** API vieja: fija la cantidad contada (sólo administrador). */
export async function fijarStock({ product_id, warehouse_id, qty }) {
  const { data } = await http.post("/stock/init", { product_id, warehouse_id, qty });
  if (data && data.ok === false) throw new Error(data.message || "No se pudo fijar el stock");
  return data;
}

/** Textos de los rechazos de la API para la pantalla. */
export function textoError(e, d = "No se pudo guardar") {
  const c = e?.code;
  if (c === "PRODUCT_NO_STOCK_TRACK") return "No controla stock";
  if (c === "PRODUCT_NOT_FOUND") return "Producto no encontrado";
  if (c === "MOTIVO_REQUIRED") return "Falta el motivo";
  if (c === "COUNT_EMPTY") return "Sin productos contados";
  if (c === "COUNT_NOT_OPEN") return "El conteo ya está cerrado";
  if (c === "FORBIDDEN") return "Sin permiso";
  if (c === "FORBIDDEN_BRANCH") return "Depósito de otra sucursal";
  if (c === "QTY_INVALID") return "Cantidad inválida";
  if (c === "RED") return "Sin conexión";
  return e?.message || d;
}
