// src/modules/dashboard/service/stockTransfer.api.js
import http from "@/app/api/http";

export const listTransfers  = (p = {}) => http.get("stock/transfers", { params: p });
export const getTransfer    = (id)     => http.get(`stock/transfers/${id}`);
export const createTransfer = (data)   => http.post("stock/transfers", data);
export const updateTransfer = (id, d)  => http.put(`stock/transfers/${id}`, d);
export const dispatchTransfer = (id)   => http.post(`stock/transfers/${id}/dispatch`);
export const receiveTransfer  = (id, d)=> http.post(`stock/transfers/${id}/receive`, d);
export const cancelTransfer   = (id)   => http.post(`stock/transfers/${id}/cancel`);
export const deleteTransfer   = (id)   => http.delete(`stock/transfers/${id}`);

// Operaciones bulk
export const bulkReceiveTransfers = (ids) => http.post("stock/transfers/bulk/receive", { ids });
export const bulkDeleteTransfers  = (ids) => http.post("stock/transfers/bulk/delete",  { ids });

export const listBranchesApi  = (p = {}) => http.get("branches", { params: { limit: 200, ...p } });
// Búsqueda de productos para el formulario de derivación
// branch_id: scopa al depósito origen (solo muestra productos con stock > 0 ahí)
export const searchProducts = ({ search, limit = 12, branchId } = {}) =>
  http.get("products", {
    params: {
      q: search,
      limit,
      include_inactive: 0,
      in_stock: 1,                    // solo con stock > 0
      ...(branchId ? { branch_id: branchId } : {}),  // scopa al origen
    },
  });
