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

// Seguimiento: nota interna y avisos al cliente. `tipo` es "comprobante" (al
// recibir el equipo) o "estado" (el estado actual de la orden). Devuelve
// `link` (wa.me, lo abre el mostrador) o `enviado` si salio por Cloud API.
export const addOrderNote = (id, nota) => http.post(`/admin/service/orders/${id}/notes`, { nota });

export const sendOrderWhatsapp = (id, tipo) =>
  http.post(`/admin/service/orders/${id}/whatsapp`, { tipo });

// Tecnicos: la lista para derivar (cualquiera) y la marca de quien es tecnico
// (solo admin).
export const listTechnicians = () => http.get("/admin/service/technicians");

export const listTechnicianUsers = () => http.get("/admin/service/technicians/usuarios");

export const setTechnician = (userId, esTecnico) =>
  http.put(`/admin/service/technicians/${userId}`, { es_tecnico: esTecnico });

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

// Renglones del seguimiento: como se titula cada tipo y su icono.
export const EVENT_KIND = {
  ingreso: { label: "Ingreso", icon: "mdi-inbox-arrow-down", color: "info" },
  estado: { label: "Estado", icon: "mdi-swap-horizontal", color: "primary" },
  tecnico: { label: "Derivado", icon: "mdi-account-wrench-outline", color: "indigo" },
  nota: { label: "Nota", icon: "mdi-note-text-outline", color: "grey" },
  aviso: { label: "WhatsApp", icon: "mdi-whatsapp", color: "success" },
};
