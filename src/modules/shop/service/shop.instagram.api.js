// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/shop/service/shop.instagram.api.js

export async function getInstagramLatest(limit = 10) {
  const API_BASE =
    (import.meta?.env?.VITE_API_BASE_URL && String(import.meta.env.VITE_API_BASE_URL)) ||
    "https://pos360-commerce-api.cingulado.org";

  // 🔒 no permitimos que el base traiga /api/v1
  const safeBase = API_BASE.replace(/\/api\/v1\/?$/i, "").replace(/\/+$/, "");

  const qs = new URLSearchParams({ limit: String(limit) }).toString();
  const url = `${safeBase}/api/v1/public/instagram/latest?${qs}`;

  const r = await fetch(url, { headers: { Accept: "application/json" } });
  const text = await r.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Respuesta no JSON (HTTP ${r.status})`);
  }

  if (!r.ok || !data?.ok) {
    throw new Error(data?.error || `HTTP ${r.status}`);
  }

  return Array.isArray(data.items) ? data.items : [];
}
