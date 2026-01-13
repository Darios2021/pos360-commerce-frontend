// src/app/api/http.js
import axios from "axios";
import { loadAuth, clearAuth } from "../utils/storage";

const raw = (import.meta.env.VITE_API_BASE_URL || "").trim();

// ✅ Si NO hay env, asumimos same-origin y que el backend está en /api/v1
const baseURL = raw || "/api/v1";

if (!raw) {
  console.warn("⚠️ VITE_API_BASE_URL no está definido. Usando:", baseURL);
}

const http = axios.create({
  baseURL,
  timeout: 60000,
});

// Attach token
http.interceptors.request.use((config) => {
  const auth = loadAuth();
  const token = auth?.accessToken || auth?.token || auth?.access_token || auth?.jwt;

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;

    // ✅ Debug útil (solo dev)
    if (import.meta.env.DEV) {
      console.log("[HTTP AUTH] ->", config.method?.toUpperCase(), config.url, "token: YES");
    }
  } else {
    if (import.meta.env.DEV) {
      console.log("[HTTP AUTH] ->", config.method?.toUpperCase(), config.url, "token: NO");
    }
  }

  return config;
});

// Normalize errors + auto logout on 401
http.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;

    if (status === 401) {
      clearAuth();
    }

    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.code ||
      err?.message ||
      "Network Error";

    return Promise.reject(Object.assign(err, { friendlyMessage: msg }));
  }
);

export default http;
