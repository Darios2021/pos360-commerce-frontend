// src/app/services/stock.service.js
import http from "../api/http";

export const StockService = {
  async getStock({ warehouse_id, q } = {}) {
    const { data } = await http.get("/stock", {
      params: { warehouse_id, q: q || undefined },
    });
    if (!data?.ok) throw new Error(data?.message || data?.code || "STOCK_FAILED");
    return data;
  },

  async listMovements({ warehouse_id } = {}) {
    const { data } = await http.get("/stock/movements", {
      params: { warehouse_id: warehouse_id || undefined },
    });
    if (!data?.ok) throw new Error(data?.message || "MOVEMENTS_LIST_FAILED");
    return data;
  },

  async createMovement(payload) {
    const { data } = await http.post("/stock/movements", payload);
    if (!data?.ok) throw new Error(data?.message || data?.code || "MOVEMENT_CREATE_FAILED");
    return data;
  },
};
