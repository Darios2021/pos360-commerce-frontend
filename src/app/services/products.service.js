// src/app/services/products.service.js
import http from "../api/http";

function normalizeApiError(err) {
  const status = err?.response?.status ?? 0;
  const data = err?.response?.data;

  const isHtmlString = typeof data === "string" && /<html|<!doctype/i.test(data);

  const message =
    (data && typeof data === "object" && (data.message || data.error)) ||
    (isHtmlString ? "Error interno del servidor (respuesta HTML). Revisá logs del backend." : null) ||
    err?.message ||
    "Error desconocido";

  const code = (data && typeof data === "object" && data.code) || "ERROR";
  const errors = (data && typeof data === "object" && Array.isArray(data.errors) && data.errors) || [];

  return { ok: false, status, code, message, errors, raw: data };
}

export const ProductsService = {
  async list(params = {}) {
    try {
      const { data } = await http.get("/products", { params });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  async getOne(id, params = {}) {
    try {
      const { data } = await http.get(`/products/${id}`, { params });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  async create(payload) {
    try {
      const { data } = await http.post("/products", payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  async update(id, payload, params = {}) {
    try {
      const { data } = await http.patch(`/products/${id}`, payload, { params });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
