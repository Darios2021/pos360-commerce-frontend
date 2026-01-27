// src/modules/shop/service/admin.shopBranding.api.js
// ✅ COPY-PASTE FINAL COMPLETO
// Usa tu http (baseURL = /api/v1)
//
// Endpoints:
// GET  /api/v1/admin/shop/branding
// PUT  /api/v1/admin/shop/branding
// POST /api/v1/admin/shop/branding/logo        (multipart: file)
// POST /api/v1/admin/shop/branding/favicon     (multipart: file)
// POST /api/v1/admin/shop/branding/og-image    (multipart: file)

import http from "@/app/api/http";

export async function getShopBranding() {
  const r = await http.get("/admin/shop/branding");
  return r.data?.item || null;
}

export async function updateShopBranding(payload = {}) {
  const r = await http.put("/admin/shop/branding", payload);
  return r.data?.item || null;
}

export async function uploadShopLogo(file) {
  const fd = new FormData();
  fd.append("file", file);

  const r = await http.post("/admin/shop/branding/logo", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return r.data?.item || null;
}

export async function uploadShopFavicon(file) {
  const fd = new FormData();
  fd.append("file", file);

  const r = await http.post("/admin/shop/branding/favicon", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return r.data?.item || null;
}

// ✅ NUEVO: OG Image (preview WhatsApp) 1200x630
export async function uploadShopOgImage(file) {
  const fd = new FormData();
  fd.append("file", file);

  const r = await http.post("/admin/shop/branding/og-image", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return r.data?.item || null;
}
