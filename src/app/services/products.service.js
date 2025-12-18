// src/app/services/products.service.js
import http from "../api/http";

export const ProductsService = {
  async list(params = {}) {
    const { data } = await http.get("/products", { params });
    return data;
  },

  async getOne(id) {
    const { data } = await http.get(`/products/${id}`);
    return data;
  },

  async create(payload) {
    const { data } = await http.post("/products", payload);
    return data;
  },

  // ✅ robusto: intenta PUT y si tu backend no lo tiene, cae a PATCH
  async update(id, payload) {
    try {
      const { data } = await http.put(`/products/${id}`, payload);
      return data;
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404 || status === 405) {
        const { data } = await http.patch(`/products/${id}`, payload);
        return data;
      }
      throw e;
    }
  },
};
