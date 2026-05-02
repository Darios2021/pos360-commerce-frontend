// src/modules/shop/store/shopAuth.store.js
// - Maneja Shop Auth vía /api/v1/public/auth/*
// - Web: cookie httpOnly (credentials: include).
// - Mobile (Capacitor): además persiste el session token en
//   @capacitor/preferences y lo manda como Authorization: Bearer.
//   Necesario porque las cookies httpOnly no son confiables entre
//   cierres del WebView.

import { defineStore } from "pinia";
import { getToken, setToken, clearToken } from "@/app/utils/tokenStorage";

function trimEndSlashes(s) {
  return String(s || "").replace(/\/+$/, "");
}

function normalizeApiV1Base(input) {
  let s = trimEndSlashes(String(input || "").trim());
  if (!s) return "/api/v1";

  if (s.startsWith("/")) {
    if (/^\/api$/i.test(s)) return "/api/v1";
    if (/^\/api\/v\d+$/i.test(s)) return s;
    return s;
  }

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

const RAW = String(import.meta.env.VITE_API_BASE_URL || "").trim();
const API_BASE = normalizeApiV1Base(RAW) || "/api/v1";

async function api(path, { method = "GET", body } = {}) {
  const url = `${trimEndSlashes(API_BASE)}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = { "Content-Type": "application/json" };

  // Si tenemos token guardado (típicamente mobile / Capacitor), lo
  // mandamos como Bearer. El backend prioriza la cookie pero acepta
  // este header como fallback.
  try {
    const tok = await getToken();
    if (tok) headers.Authorization = `Bearer ${tok}`;
  } catch {}

  const res = await fetch(url, {
    method,
    credentials: "include",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text().catch(() => "");
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.message || data?.error || `${res.status} ${res.statusText}`.trim();
    const err = new Error(String(msg));
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

function cap(s) {
  const x = String(s || "").trim();
  if (!x) return "";
  return x.charAt(0).toUpperCase() + x.slice(1);
}

export const useShopAuthStore = defineStore("shopAuth", {
  state: () => ({
    customer: null,
    status: "idle", // idle | loading | ready
    lastFetchedAt: 0,
  }),

  getters: {
    isLogged: (s) => !!s.customer?.id,
    fullName: (s) => {
      const fn = cap(s.customer?.first_name);
      const ln = cap(s.customer?.last_name);
      return String(`${fn} ${ln}`).trim() || s.customer?.email || "Mi cuenta";
    },
    initials: (s) => {
      const fn = cap(s.customer?.first_name);
      const ln = cap(s.customer?.last_name);
      const a = (fn[0] || "").toUpperCase();
      const b = (ln[0] || "").toUpperCase();
      return (a + b) || (String(s.customer?.email || "?")[0] || "?").toUpperCase();
    },
  },

  actions: {
    async fetchMe({ force = false } = {}) {
      const now = Date.now();
      if (!force && this.status === "ready" && now - this.lastFetchedAt < 15_000) return this.customer;

      this.status = "loading";
      try {
        const r = await api("/public/auth/me");
        this.customer = r?.customer || null;
        this.lastFetchedAt = Date.now();
        this.status = "ready";
        return this.customer;
      } catch (e) {
        this.customer = null;
        this.status = "ready";
        return null;
      }
    },

    async loginGoogle({ credential }) {
      if (!credential) throw new Error("MISSING_CREDENTIAL");
      const r = await api("/public/auth/google", { method: "POST", body: { credential } });
      this.customer = r?.customer || null;
      this.lastFetchedAt = Date.now();
      this.status = "ready";

      // Persistir token de sesión (para mobile principalmente).
      const token = r?.session?.token;
      const expiresIn = Number(r?.session?.expires_in || 0);
      if (token) {
        try { await setToken(token, expiresIn); } catch {}
      }

      return this.customer;
    },

    async logout() {
      try {
        await api("/public/auth/logout", { method: "POST" });
      } catch {}
      try { await clearToken(); } catch {}
      this.customer = null;
      this.lastFetchedAt = Date.now();
      this.status = "ready";
    },

    /**
     * Hidratación al boot: si tenemos token guardado, lo usamos para
     * llamar /me. Si responde OK, quedamos logueados sin pasar por
     * el login screen. Llamado desde main.js / App.vue al arrancar.
     */
    async hydrate() {
      try {
        const tok = await getToken();
        // En web sin token, igual intentamos /me por si existe la cookie
        // httpOnly. En Capacitor sin token directamente saltamos /me
        // (no hay cookie persistente).
        if (!tok) {
          if (typeof window !== "undefined" && !window.Capacitor?.isNativePlatform?.()) {
            return await this.fetchMe({ force: true });
          }
          this.status = "ready";
          return null;
        }
        return await this.fetchMe({ force: true });
      } catch {
        this.status = "ready";
        return null;
      }
    },
  },
});
