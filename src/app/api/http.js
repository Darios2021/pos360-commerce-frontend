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
import { marcarCaido, marcarEnLinea, esFalloDeRed } from "@/app/store/conexion.state";
import * as catalogoOffline from "@/app/native/catalogoOffline";

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

  // Log de bootstrap solo en dev — en producción ensucia la consola sin aportar.
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[APP http]", { host, raw: raw || "(empty)", baseURL, sameOrigin });
  }
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

// Una sola vez aunque fallen varios pedidos juntos (el tablero dispara muchos).
let cerrandoSesion = false;
async function cerrarSesionVencida() {
  if (cerrandoSesion) return;
  cerrandoSesion = true;
  try {
    const [{ useAuthStore }, { default: router }] = await Promise.all([
      import("@/app/store/auth.store"),
      import("@/app/router"),
    ]);
    useAuthStore().logout();
    const actual = router.currentRoute.value;
    if (actual?.name !== "login" && !actual?.meta?.public) {
      await router.replace({ name: "login" });
    }
  } catch {
    /* sin router todavia: el guard lo resuelve en la proxima navegacion */
  } finally {
    cerrandoSesion = false;
  }
}

// Friendly errors
http.interceptors.response.use(
  (r) => {
    // El servidor contesto: haya lo que haya pasado con la red antes, ahora hay
    // conexion. Es la unica senal confiable, mas que navigator.onLine.
    marcarEnLinea();
    // APK: copia del catalogo para buscar sin conexion (app/native/catalogoOffline.js)
    if (catalogoOffline.esBusquedaDeCatalogo(r.config)) catalogoOffline.refrescarSiHaceFalta(http, r.config);
    return r;
  },
  async (err) => {
    const status = Number(err?.response?.status || 0);

    if (esFalloDeRed(err)) {
      marcarCaido();
      // APK sin red: la busqueda del POS se contesta con la copia del catalogo.
      if (catalogoOffline.esBusquedaDeCatalogo(err.config)) {
        const copia = await catalogoOffline.respuestaSinConexion(err.config);
        if (copia) return copia;
      }
    } else marcarEnLinea();

    if (status === 401) {
      try {
        clearAuth?.();
      } catch {}
      // Sesion vencida: el pedido llevaba token y el servidor lo rechazo.
      // Borrar solo el localStorage dejaba el store "authed" y la pantalla
      // mostrando el 401; se cierra la sesion y se vuelve al ingreso.
      const llevabaToken = !!(err?.config?.headers?.Authorization || err?.config?.headers?.authorization);
      if (llevabaToken) cerrarSesionVencida();
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
