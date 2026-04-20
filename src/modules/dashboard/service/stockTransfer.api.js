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
export const searchProducts   = (p = {}) => http.get("products", { params: { limit: 50, ...p } });
