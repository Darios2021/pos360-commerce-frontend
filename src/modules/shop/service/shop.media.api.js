// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/shop/service/shop.media.api.js
//
// FIX: NO usar window.location.origin (en DEV rompe si no hay proxy)
// Usa VITE_API_BASE_URL y normaliza "/api" -> "/api/v1"
// Incluye timeout real con AbortController

function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function trimSlashesEnd(s) {
  return String(s || "").replace(/\/+$/, "");
}

function normalizeApiV1Base(input) {
  let s = trimSlashesEnd(input);
  if (!s) return "/api/v1";

  if (s.startsWith("/")) {
    if (/^\/api$/i.test(s)) return "/api/v1";
    if (/^\/api\/v\d+$/i.test(s)) return s;
    if (/^\/api\/v\d+\//i.test(s)) return trimSlashesEnd(s);
    if (/\/api\/v\d+/i.test(s)) return trimSlashesEnd(s);
    return s;
  }

  try {
    const u = new URL(s);
    const p = trimSlashesEnd(u.pathname || "");
    if (/^\/api$/i.test(p)) {
      u.pathname = "/api/v1";
      return trimSlashesEnd(u.toString());
    }
    if (/^\/api\/v\d+$/i.test(p)) return trimSlashesEnd(u.toString());
    if (/\/api\/v\d+/i.test(p)) return trimSlashesEnd(u.toString());
    return trimSlashesEnd(u.origin + "/api/v1");
  } catch {
    return "/api/v1";
  }
}

const ENV_SAME_ORIGIN = String(import.meta.env.VITE_SHOP_API_SAME_ORIGIN || "").trim();
const FORCE_SAME_ORIGIN = ENV_SAME_ORIGIN === "1" || ENV_SAME_ORIGIN.toLowerCase() === "true";

let basePath = normalizeApiV1Base(String(import.meta.env.VITE_API_BASE_URL || "").trim());

if (typeof window !== "undefined") {
  const host = String(window.location.hostname || "").toLowerCase();

  // prod -> same origin
  if (host === "sanjuantecnologia.com" || host === "www.sanjuantecnologia.com") {
    basePath = "/api/v1";
  }
  if (FORCE_SAME_ORIGIN) basePath = "/api/v1";

  basePath = normalizeApiV1Base(basePath);
}

const PUBLIC_BASE = `${trimSlashesEnd(basePath)}/public`; // .../api/v1/public

function buildUrl(path) {
  const p = String(path || "").startsWith("/") ? String(path) : `/${path}`;
  return `${PUBLIC_BASE}${p}`;
}

async function fetchJson(url, { timeoutMs = 8000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), Math.max(1000, Number(timeoutMs) || 8000));

  try {
    const r = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "omit",
      signal: ctrl.signal,
    });

    if (!r.ok) {
      const err = new Error(String(r.status));
      err.status = r.status;
      throw err;
    }

    return await r.json();
  } catch (e) {
    if (e?.name === "AbortError") {
      const err = new Error(`Timeout ${timeoutMs}ms`);
      err.code = "TIMEOUT";
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}

/**
 * FEED público global de videos (desde BD)
 * GET /api/v1/public/videos/feed?limit=18&offset=0
 *
 * Respuesta:
 * { ok:true, data:[...], meta:{...} }
 */
export async function getHomeShorts({ limit = 18, offset = 0, timeoutMs = 8000 } = {}) {
  const safeLimit = clamp(limit, 1, 60);
  const safeOffset = Math.max(0, Number(offset) || 0);

  const url = buildUrl(`/videos/feed?limit=${safeLimit}&offset=${safeOffset}`);

  const payload = await fetchJson(url, { timeoutMs });

  // normaliza formas posibles
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;

  return [];
}
