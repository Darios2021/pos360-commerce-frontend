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

  // ✅ update robusto: intenta PATCH (normal) y si el backend no lo tiene, cae a PUT
  async update(id, payload) {
    const url = `/categories/${id}`;

    try {
      const { data } = await http.patch(url, payload);
      return data;
    } catch (e) {
      const status = e?.response?.status;

      // 404/405 => backend no tiene PATCH (o no está definido), probamos PUT
      if (status === 404 || status === 405) {
        const { data } = await http.put(url, payload);
        return data;
      }

      throw e;
    }
  },

  // ✅ opcional: delete real (solo si tu backend lo soporta)
  async remove(id) {
    const { data } = await http.delete(`/categories/${id}`);
    return data;
  },
};
