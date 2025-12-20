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

  async update(id, payload) {
    const { data } = await http.put(`/products/${id}`, payload);
    return data;
  },
};
