// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/shop/service/shop.auth.public.api.js
//
// Axios público para SHOP AUTH (cookie httpOnly)
// - withCredentials: true (CLAVE para que viaje la cookie)
// - Normaliza VITE_API_BASE_URL (/api -> /api/v1)
//
// Endpoints:
// - GET  /public/auth/me
// - POST /public/auth/logout
// - POST /public/auth/google  { credential }

import axios from "axios";

function trimEndSlashes(s) {
  return String(s || "").replace(/\/+$/, "");
}

function normalizeApiV1Base(input) {
  let s = trimEndSlashes(String(input || "").trim());
  if (!s) return "/api/v1";

  // Relativo
  if (s.startsWith("/")) {
    if (/^\/api$/i.test(s)) return "/api/v1";
    if (/^\/api\/v\d+$/i.test(s)) return s;
    return s;
  }

  // Absoluto
  try {
    const u = new URL(s);
    const p = trimEndSlashes(u.pathname || "");

    if (/^\/api$/i.test(p)) {
      u.pathname = "/api/v1";
      return trimEndSlashes(u.toString());
    }
    if (/^\/api\/v\d+$/i.test(p)) return trimEndSlashes(u.toString());

    return trimEndSlashes(u.toString());
  } catch {
    return s;
  }
}

const raw = String(import.meta.env.VITE_API_BASE_URL || "").trim();
const baseURL = normalizeApiV1Base(raw) || "/api/v1";

const httpShop = axios.create({
  baseURL,
  timeout: 60000,
  withCredentials: true, // ✅ CLAVE
});

// Friendly errors
httpShop.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = Number(err?.response?.status || 0);
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.code ||
      err?.response?.data?.error ||
      err?.message ||
      "Network Error";

    return Promise.reject(Object.assign(err, { friendlyMessage: String(msg), status }));
  }
);

export async function authMe() {
  const r = await httpShop.get("public/auth/me");
  return r.data;
}

export async function authLogout() {
  const r = await httpShop.post("public/auth/logout");
  return r.data;
}

export async function authGoogle({ credential }) {
  const r = await httpShop.post("public/auth/google", { credential });
  return r.data;
}

/**
 * PATCH /public/auth/profile — completa o actualiza datos del cliente.
 * payload: { first_name, last_name, phone, password? }
 * Si password es null/undefined/"" el backend NO la cambia.
 */
export async function authUpdateProfile(payload) {
  const r = await httpShop.patch("public/auth/profile", payload || {});
  return r.data;
}

export default httpShop;
