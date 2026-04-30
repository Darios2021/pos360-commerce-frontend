// src/modules/admin/services/branches.api.js
//
// CRUD de sucursales (admin / super_admin).
// Endpoints (montados bajo /api/v1/branches):
//   GET    /branches              → list (admin: todas | user normal: activas)
//   POST   /branches              → create (super_admin)
//   PUT    /branches/:id          → update (super_admin)
//   DELETE /branches/:id          → soft delete is_active=0 (super_admin)

import http from "@/app/api/http";

function normalizeItem(b) {
  if (!b) return null;
  return {
    id: Number(b.id),
    code: String(b.code || "").trim(),
    name: String(b.name || "").trim(),
    address: b.address || "",
    city: b.city || "",
    province: b.province || "",
    latitude: b.latitude !== null && b.latitude !== undefined ? Number(b.latitude) : null,
    longitude: b.longitude !== null && b.longitude !== undefined ? Number(b.longitude) : null,
    phone: b.phone || "",
    hours: b.hours || "",
    maps_url: b.maps_url || "",
    is_active: Number(b.is_active ?? 1) === 1,
    created_at: b.created_at || null,
    updated_at: b.updated_at || null,
  };
}

export async function listBranches() {
  const r = await http.get("/branches");
  const data = Array.isArray(r.data?.data)
    ? r.data.data
    : Array.isArray(r.data?.items)
    ? r.data.items
    : [];
  return data.map(normalizeItem);
}

export async function createBranch(payload) {
  const body = buildBody(payload);
  const r = await http.post("/branches", body);
  return normalizeItem(r.data?.data || r.data?.item || r.data);
}

export async function updateBranch(id, payload) {
  const body = buildBody(payload);
  const r = await http.put(`/branches/${Number(id)}`, body);
  return normalizeItem(r.data?.data || r.data?.item || r.data);
}

export async function deleteBranch(id) {
  const r = await http.delete(`/branches/${Number(id)}`);
  return r.data?.ok ?? true;
}

function toFloatOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function buildBody(p = {}) {
  return {
    code: p.code ?? undefined,
    name: p.name ?? undefined,
    address: p.address ?? "",
    city: p.city ?? "",
    province: p.province ?? "",
    latitude: toFloatOrNull(p.latitude ?? p.lat),
    longitude: toFloatOrNull(p.longitude ?? p.lng),
    phone: p.phone ?? "",
    hours: p.hours ?? "",
    maps_url: p.maps_url ?? "",
    is_active:
      p.is_active === undefined || p.is_active === null
        ? undefined
        : p.is_active === true || p.is_active === 1 || p.is_active === "1"
        ? 1
        : 0,
  };
}
