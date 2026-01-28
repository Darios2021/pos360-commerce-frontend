// src/app/api/httpPublic.js
// ✅ COPY-PASTE FINAL (SHOP/Checkout público)
// - Same-origin por defecto: /api/v1
// - NO agrega Authorization
// - Permite override por env (DEV) con VITE_PUBLIC_API_BASE_URL

import axios from "axios";

const raw = String(import.meta.env.VITE_PUBLIC_API_BASE_URL || "").trim();
const baseURL = raw || "/api/v1";

if (!raw && typeof window !== "undefined") {
  console.log("✅ httpPublic usando same-origin:", baseURL, "origin:", window.location.origin);
}

const httpPublic = axios.create({
  baseURL,
  timeout: 60000,
});

// Mensaje amigable en errores
httpPublic.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;

    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.code ||
      err?.response?.data?.detail ||
      err?.message ||
      "Network Error";

    return Promise.reject(Object.assign(err, { friendlyMessage: msg, status }));
  }
);

export default httpPublic;
