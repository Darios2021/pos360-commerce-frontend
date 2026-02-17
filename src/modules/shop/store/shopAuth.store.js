// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/shop/store/shopAuth.store.js
// - Maneja Shop Auth (cookie httpOnly) vía /api/v1/public/auth/*
// - fetchMe() / loginGoogle() / logout()
// - ✅ credentials include (necesario para cookies Secure)

// Pinia
import { defineStore } from "pinia";

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
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
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
      return this.customer;
    },

    async logout() {
      try {
        await api("/public/auth/logout", { method: "POST" });
      } catch {}
      this.customer = null;
      this.lastFetchedAt = Date.now();
      this.status = "ready";
    },
  },
});
