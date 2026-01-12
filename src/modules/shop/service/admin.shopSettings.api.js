// src/modules/shop/service/admin.shopSettings.api.js
// ✅ COPY-PASTE FINAL COMPLETO (ALINEADO AL PROYECTO)
// Admin Shop Settings (con AUTH) usando el http real del proyecto.
//
// Backend:
//   GET /api/v1/admin/shop/settings/:key
//   PUT /api/v1/admin/shop/settings/:key
//
// Keys: orders | shipping | pickup | payments | notify
//
// 🔥 FIX 401 "Invalid token":
// - NO creamos axios propio
// - Usamos "@/app/api/http" (la misma capa que usa el resto del admin)

import http from "@/app/api/http";

const ALLOWED_KEYS = new Set(["orders", "shipping", "pickup", "payments", "notify"]);

function cleanKey(k) {
  return String(k || "").trim().toLowerCase();
}

function assertKey(k) {
  const key = cleanKey(k);
  if (!ALLOWED_KEYS.has(key)) {
    throw new Error(`Key inválida "${key}". Allowed: ${Array.from(ALLOWED_KEYS).join(", ")}`);
  }
  return key;
}

/**
 * Devuelve SIEMPRE:
 * { key, value, updated_at, created_at }
 */
export async function getShopSetting(key) {
  const k = assertKey(key);

  const { data } = await http.get(`/admin/shop/settings/${encodeURIComponent(k)}`);

  const item = data?.item || null;
  return {
    key: item?.key || k,
    value: item?.value && typeof item.value === "object" ? item.value : {},
    updated_at: item?.updated_at || null,
    created_at: item?.created_at || null,
  };
}

/**
 * Acepta:
 * - value objeto directo  (ej: { transfer_enabled: true, ... })
 * - o payload { value: {...} } (por compat)
 *
 * y manda SIEMPRE { value: {...} } al backend.
 */
export async function putShopSetting(key, valueOrPayload) {
  const k = assertKey(key);

  const raw =
    valueOrPayload && typeof valueOrPayload === "object" && "value" in valueOrPayload
      ? valueOrPayload.value
      : valueOrPayload;

  const value = raw && typeof raw === "object" ? raw : {};

  const { data } = await http.put(`/admin/shop/settings/${encodeURIComponent(k)}`, { value });

  const item = data?.item || null;
  return {
    key: item?.key || k,
    value: item?.value && typeof item.value === "object" ? item.value : value,
    updated_at: item?.updated_at || null,
    created_at: item?.created_at || null,
  };
}
