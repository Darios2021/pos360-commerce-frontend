// src/app/services/warehouses.service.js
import http from "../api/http";

export const WarehousesService = {
  async list() {
    const { data } = await http.get("/warehouses");
    if (!data?.ok) throw new Error(data?.message || "WAREHOUSES_LIST_FAILED");
    return data;
  },
};
