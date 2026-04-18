// src/modules/dashboard/service/dashboard.api.js
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

// ─── Analytics endpoints ────────────────────────────────────────────────────
export function analyticsCash(params = {}) {
  return http.get("analytics/cash", { params });
}
export function analyticsSales(params = {}) {
  return http.get("analytics/sales", { params });
}
export function analyticsProducts(params = {}) {
  return http.get("analytics/products", { params });
}
export function analyticsStockMovements(params = {}) {
  return http.get("analytics/stock-movements", { params });
}
