// src/modules/shop/service/admin.shopOrders.api.js
// ✅ API Admin - Shop Orders
// Usa la instancia central de http (baseURL ya incluye /api/v1)

import http from "@/app/api/http";

export async function adminListShopOrders(params = {}) {
  const { data } = await http.get("/admin/shop/orders", { params });
  return data;
}

export async function adminGetShopOrderById(id) {
  const { data } = await http.get(`/admin/shop/orders/${id}`);
  return data;
}
