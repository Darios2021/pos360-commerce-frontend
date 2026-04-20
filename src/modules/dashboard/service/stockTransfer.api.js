// src/modules/dashboard/service/stockTransfer.api.js
import http from "@/app/api/http";

export const listTransfers  = (p = {}) => http.get("stock/transfers", { params: p });
export const getTransfer    = (id)     => http.get(`stock/transfers/${id}`);
export const createTransfer = (data)   => http.post("stock/transfers", data);
export const updateTransfer = (id, d)  => http.put(`stock/transfers/${id}`, d);
export const dispatchTransfer = (id)   => http.post(`stock/transfers/${id}/dispatch`);
export const receiveTransfer  = (id, d)=> http.post(`stock/transfers/${id}/receive`, d);
export const cancelTransfer   = (id)   => http.post(`stock/transfers/${id}/cancel`);

export const listBranchesApi  = (p = {}) => http.get("branches", { params: { limit: 200, ...p } });
// Búsqueda de productos para el formulario de derivación
// El controller de products usa el parámetro `q` para buscar por nombre/sku/barcode/código
export const searchProducts = ({ search, limit = 12 } = {}) =>
  http.get("products", { params: { q: search, limit, include_inactive: 0 } });
