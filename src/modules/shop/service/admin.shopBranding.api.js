// src/modules/shop/service/admin.shopBranding.api.js
// ✅ COPY-PASTE FINAL (sin depender de "@/app/api")

import axios from "axios";

const baseURL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

const api = axios.create({
  baseURL,
  withCredentials: true,
});

// ✅ Agarra token desde localStorage si lo guardás ahí
// Ajustá la key si usás otra (ej: "pos360_auth")
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("auth") || localStorage.getItem("pos360_auth") || "";
    const parsed = raw ? JSON.parse(raw) : null;
    const token = parsed?.token || parsed?.accessToken || parsed?.access_token || "";
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // ignore
  }
  return config;
});

export async function getShopBranding() {
  const r = await api.get("/admin/shop/branding");
  return r.data?.item || null;
}

export async function updateShopBranding(payload = {}) {
  const r = await api.put("/admin/shop/branding", payload);
  return r.data?.item || null;
}

export async function uploadShopLogo(file) {
  const fd = new FormData();
  fd.append("file", file);

  const r = await api.post("/admin/shop/branding/logo", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return r.data?.item || null;
}

export async function uploadShopFavicon(file) {
  const fd = new FormData();
  fd.append("file", file);

  const r = await api.post("/admin/shop/branding/favicon", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return r.data?.item || null;
}
