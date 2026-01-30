// src/app/api/http.js
// ✅ COPY-PASTE FINAL COMPLETO (APP / Backoffice)
// - BaseURL: same-origin por defecto (/api/v1)
// - Permite override con VITE_API_BASE_URL
// - ✅ FIX CLAVE: normaliza /api -> /api/v1 (y https://x/api -> https://x/api/v1)
// - Adjunta Authorization si hay token
// - Friendly errors + limpia auth en 401
// - Anti-preflight: elimina cache-control/pragma

import axios from "axios";
import { loadAuth, clearAuth } from "../utils/storage";

function trimEndSlashes(s) {
  return String(s || "").replace(/\/+$/, "");
}

function normalizeApiV1Base(input) {
  let s = trimEndSlashes(String(input || "").trim());
  if (!s) return "/api/v1";

  // Relativo
  if (s.startsWith("/")) {
    // "/api" -> "/api/v1"
    if (/^\/api$/i.test(s)) return "/api/v1";
    // "/api/v1" ok
    if (/^\/api\/v\d+$/i.test(s)) return s;
    return s;
  }

  // Absoluto
  try {
    const u = new URL(s);
    const p = trimEndSlashes(u.pathname || "");

    // ".../api" -> ".../api/v1"
    if (/^\/api$/i.test(p)) {
      u.pathname = "/api/v1";
      return trimEndSlashes(u.toString());
    }

    // ".../api/v1" ok
    if (/^\/api\/v\d+$/i.test(p)) return trimEndSlashes(u.toString());

    return trimEndSlashes(u.toString());
  } catch {
    // si vino algo raro, lo devolvemos tal cual
    return s;
  }
}

const raw = String(import.meta.env.VITE_API_BASE_URL || "").trim();
const baseURL = normalizeApiV1Base(raw) || "/api/v1";

if (typeof window !== "undefined") {
  const host = String(window.location.hostname || "").toLowerCase();
  const sameOrigin = !raw || baseURL.startsWith("/");

  // log útil
  // eslint-disable-next-line no-console
  console.log("✅ [APP http]", {
    host,
    raw: raw || "(empty)",
    baseURL,
    sameOrigin,
  });
}

const http = axios.create({
  baseURL,
  timeout: 60000,
});

// ✅ Anti-preflight por headers “cache-control/pragma”
http.interceptors.request.use((config) => {
  const h = config.headers || {};
  delete h["Cache-Control"];
  delete h["cache-control"];
  delete h["Pragma"];
  delete h["pragma"];
  config.headers = h;

  // Attach token (solo APP)
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
