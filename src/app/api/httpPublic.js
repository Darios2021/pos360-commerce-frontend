// src/app/api/httpPublic.js
// SHOP/Checkout público.
// - Same-origin por defecto: /api/v1
// - withCredentials: true → manda cookies httpOnly (web).
// - Si hay un token guardado en Preferences/localStorage (mobile),
//   lo envía como Authorization: Bearer (el backend lo prioriza
//   junto con la cookie). Esto cubre el caso Capacitor donde la
//   cookie httpOnly no es confiable entre cierres del WebView.
// - Permite override por env (DEV) con VITE_PUBLIC_API_BASE_URL.

import axios from "axios";
import { getToken } from "@/app/utils/tokenStorage";

const raw = String(import.meta.env.VITE_PUBLIC_API_BASE_URL || "").trim();
const baseURL = raw || "/api/v1";

if (!raw && typeof window !== "undefined" && import.meta.env?.DEV) {
  console.debug("[httpPublic] same-origin:", baseURL, "origin:", window.location.origin);
}

const httpPublic = axios.create({
  baseURL,
  timeout: 60000,
  withCredentials: true,
});

// Inyecta el Bearer si tenemos token guardado (mobile).
httpPublic.interceptors.request.use(async (config) => {
  try {
    const tok = await getToken();
    if (tok) {
      config.headers = config.headers || {};
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${tok}`;
      }
    }
  } catch {}
  return config;
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
