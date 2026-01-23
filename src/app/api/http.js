// src/app/api/http.js
import axios from "axios";
import { loadAuth, clearAuth } from "../utils/storage";

// ✅ App (admin) puede ir a same-origin /api/v1 si no hay env
const raw = (import.meta.env.VITE_API_BASE_URL || "").trim();
const baseURL = raw || "/api/v1";

if (!raw) console.warn("⚠️ VITE_API_BASE_URL no definido (APP). Usando:", baseURL);

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
  }

  return config;
});

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
