// src/app/api/http.js
// ✅ COPY-PASTE FINAL COMPLETO (APP / Backoffice)
// - BaseURL: same-origin por defecto (/api/v1)
// - Permite override con VITE_API_BASE_URL
// - Adjunta Authorization si hay token
// - Friendly errors + limpia auth en 401

import axios from "axios";
import { loadAuth, clearAuth } from "../utils/storage";

const raw = String(import.meta.env.VITE_API_BASE_URL || "").trim();
const baseURL = raw || "/api/v1";

if (!raw && typeof window !== "undefined") {
  console.log("✅ [APP http] usando same-origin:", baseURL);
}

const http = axios.create({
  baseURL,
  timeout: 60000,
});

// Attach token (solo APP)
http.interceptors.request.use((config) => {
  const auth = loadAuth?.();
  const token = auth?.accessToken || auth?.token || auth?.access_token || auth?.jwt;

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Friendly errors
http.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = Number(err?.response?.status || 0);

    if (status === 401) {
      try {
        clearAuth?.();
      } catch {}
    }

    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.code ||
      err?.response?.data?.detail ||
      err?.message ||
      "Network Error";

    return Promise.reject(Object.assign(err, { friendlyMessage: String(msg), status }));
  }
);

export default http;
