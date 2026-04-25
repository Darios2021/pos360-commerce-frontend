// src/modules/admin/services/customers.service.js
import http from "@/app/api/http";

export const listCustomers = (params = {}) =>
  http.get("/admin/customers", { params });

export const getCustomer = (id) =>
  http.get(`/admin/customers/${id}`);

export const createCustomer = (data) =>
  http.post("/admin/customers", data);

export const updateCustomer = (id, data) =>
  http.put(`/admin/customers/${id}`, data);

export const deleteCustomer = (id, { force = false } = {}) =>
  http.delete(`/admin/customers/${id}${force ? "?force=1" : ""}`);

export const mergeCustomers = ({ target_id, source_ids }) =>
  http.post("/admin/customers/merge", { target_id, source_ids });

export const backfillCustomers = ({ dryRun = false } = {}) =>
  http.post(`/admin/customers/backfill${dryRun ? "?dry_run=1" : ""}`);
