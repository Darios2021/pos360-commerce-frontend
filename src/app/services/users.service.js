// src/app/services/users.service.js
import http from "@/app/api/http";

export const UsersService = {
  async meta() {
    const { data } = await http.get("/admin/users/meta");
    return data?.data || data || {};
  },

  async list() {
    const { data } = await http.get("/admin/users");
    return data?.data || data || [];
  },

  async create(payload) {
    const { data } = await http.post("/admin/users", payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await http.put(`/admin/users/${id}`, payload);
    return data;
  },

  async toggleActive(id) {
    const { data } = await http.patch(`/admin/users/${id}/toggle-active`);
    return data;
  },

  async resetPassword(id, payload) {
    const { data } = await http.post(`/admin/users/${id}/reset-password`, payload);
    return data;
  },
};
