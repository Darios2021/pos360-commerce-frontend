// src/app/services/categories.service.js
import http from "../api/http";

export const CategoriesService = {
  async list() {
    const { data } = await http.get("/categories");
    return data;
  },

  async create(payload) {
    const { data } = await http.post("/categories", payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await http.put(`/categories/${id}`, payload);
    return data;
  },
};
