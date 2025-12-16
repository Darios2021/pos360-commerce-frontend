// src/app/services/products.service.js
import http from "../api/http";

export const ProductsService = {
  async list({ page = 1, limit = 20, q = "" } = {}) {
    const { data } = await http.get("/products", { params: { page, limit, q } });
    if (!data?.ok) throw new Error(data?.message || "PRODUCTS_LIST_FAILED");
    return data;
  },

  async create(payload) {
    const { data } = await http.post("/products", payload);
    if (!data?.ok) throw new Error(data?.message || "PRODUCT_CREATE_FAILED");
    return data;
  },

  async update(id, payload) {
    const { data } = await http.patch(`/products/${id}`, payload);
    if (!data?.ok) throw new Error(data?.message || "PRODUCT_UPDATE_FAILED");
    return data;
  },
};
