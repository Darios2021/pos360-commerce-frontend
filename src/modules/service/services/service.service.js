// src/modules/service/services/service.service.js
//
// Servicio tecnico: ordenes de reparacion y lista de precios.
import http from "@/app/api/http";

// Por defecto el listado trae solo la serie nueva. Las 645 ordenes migradas del
// libro SERV_TEC se piden con incluir_historico: 1 — el mostrador quiere ver el
// trabajo del dia, no el historico entero.
export const listOrders = (params = {}) => http.get("/admin/service/orders", { params });

export const getOrderStats = (params = {}) =>
  http.get("/admin/service/orders/stats", { params });

export const getOrder = (id) => http.get(`/admin/service/orders/${id}`);

export const createOrder = (data = {}) => http.post("/admin/service/orders", data);

export const updateOrder = (id, data) => http.put(`/admin/service/orders/${id}`, data);

export const deleteOrder = (id) => http.delete(`/admin/service/orders/${id}`);

export const addOrderItem = (id, data) => http.post(`/admin/service/orders/${id}/items`, data);

export const updateOrderItem = (id, itemId, data) =>
  http.put(`/admin/service/orders/${id}/items/${itemId}`, data);

export const deleteOrderItem = (id, itemId) =>
  http.delete(`/admin/service/orders/${id}/items/${itemId}`);

// Buscador de la lista de precios por modelo. Es lo que el Excel resolvia con
// la hoja MODULOS: se tipea el equipo y sale el precio con el desglose.
export const searchPrices = (params = {}) => http.get("/admin/service/prices", { params });

// Crea (o reusa) el producto de catalogo para poder cobrar la reparacion por
// POS. La lista de precios sigue siendo la fuente de verdad del precio: el
// producto es el espejo que el POS necesita para cobrar.
export const mirrorPrice = (id) => http.post(`/admin/service/prices/${id}/espejo`);

// Estados compartidos entre el listado y el editor. El orden es el del
// recorrido real de un equipo por el taller.
export const SERVICE_STATUS = [
  { value: "recibido", label: "Recibido", color: "info", icon: "mdi-inbox-arrow-down" },
  { value: "diagnostico", label: "En diagnostico", color: "info", icon: "mdi-magnify" },
  { value: "presupuestado", label: "Presupuestado", color: "warning", icon: "mdi-cash-clock" },
  { value: "aprobado", label: "Aprobado", color: "warning", icon: "mdi-check-decagram-outline" },
  { value: "en_reparacion", label: "En reparacion", color: "primary", icon: "mdi-wrench-outline" },
  { value: "reparado", label: "Reparado, a entregar", color: "success", icon: "mdi-package-variant-closed-check" },
  { value: "entregado", label: "Entregado", color: "teal", icon: "mdi-hand-coin-outline" },
  { value: "sin_solucion", label: "Sin solucion", color: "error", icon: "mdi-close-octagon-outline" },
  { value: "no_retirado", label: "Sin retirar", color: "grey", icon: "mdi-clock-alert-outline" },
];

export function statusLabel(v) {
  return SERVICE_STATUS.find((s) => s.value === v)?.label || v || "";
}
export function statusColor(v) {
  return SERVICE_STATUS.find((s) => s.value === v)?.color || "default";
}
export function statusIcon(v) {
  return SERVICE_STATUS.find((s) => s.value === v)?.icon || "mdi-help-circle-outline";
}
