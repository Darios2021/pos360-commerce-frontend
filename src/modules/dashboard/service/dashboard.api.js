// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/dashboard/service/dashboard.api.js

// 🔥 IMPORTANTE:
// Dashboard (/app) => endpoints protegidos => usar http (con token)
import http from "@/app/api/http";

export function dashboardOverview(params = {}) {
  return http.get("dashboard/overview", { params });
}

export function dashboardSales(params = {}) {
  return http.get("dashboard/sales", { params });
}

export function dashboardStock(params = {}) {
  return http.get("dashboard/stock", { params });
}

export function dashboardInventory(params = {}) {
  return http.get("dashboard/inventory", { params });
}

export function listBranches(params = {}) {
  return http.get("branches", { params: { limit: 200, ...params } });
}