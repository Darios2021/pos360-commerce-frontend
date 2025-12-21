// src/app/api/http.js
import axios from "axios";
import { loadAuth, clearAuth } from "../utils/storage";

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  (import.meta.env.DEV ? "/api/v1" : "/api/v1");

if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn("⚠️ VITE_API_BASE_URL no está definido. Usando:", baseURL);
}

const http = axios.create({
  baseURL,
  timeout: 60000, // ✅ 60s para debug (antes 20s)
});

// Attach token
http.interceptors.request.use((config) => {
  const auth = loadAuth();
  const token = auth?.accessToken;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
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
