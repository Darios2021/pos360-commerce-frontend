// src/app/api/http.js
import axios from "axios";

function getApiBase() {
  const env = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");
  // same-origin si no hay env
  return env || "";
}

function getTokenSafe() {
  // ✅ soporta varios nombres típicos (por si en algún momento lo guardaste distinto)
  const keys = ["pos360_token", "pos360_access_token", "access_token", "token"];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v && typeof v === "string" && v.trim().length > 10) return v.trim();
  }

  // ✅ fallback: auth json
  try {
    const raw = localStorage.getItem("auth");
    if (raw) {
      const j = JSON.parse(raw);
      const t = j?.token || j?.access_token || j?.accessToken;
      if (t && String(t).trim().length > 10) return String(t).trim();
    }
  } catch {}

  return "";
}

const apiBase = getApiBase();

// ✅ PRIVATE/AUTH API (POS, admin, backoffice)
const http = axios.create({
  baseURL: `${apiBase}/api/v1`,
  withCredentials: false,
  timeout: 25000,
});

// ✅ Adjunta Bearer si existe token
http.interceptors.request.use(
  (config) => {
    const token = getTokenSafe();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// ✅ log simple opcional (si querés ver rápido qué baseURL está usando)
// console.log("[AUTH API] baseURL =", http.defaults.baseURL);

http.interceptors.response.use(
  (r) => r,
  (err) => Promise.reject(err)
);

export default http;
