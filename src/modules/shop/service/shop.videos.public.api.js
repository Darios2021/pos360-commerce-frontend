// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/shop/service/shop.videos.public.api.js
//
// ✅ FIX CRÍTICO + OPTIMIZACIÓN:
// - NO usar "/public/..." (con slash) porque con Axios puede romper baseURL si baseURL incluye /api/v1
// - Usar "public/..." (sin slash) para que SIEMPRE concatene con VITE_API_BASE_URL
//
// ✅ Mantiene hidratación (getProduct) pero evita 404 spam:
// - Cachea productos OK
// - Cachea "missing" (404) para NO reintentar mil veces
// - Permite apagar hidratación por ENV si querés (sin redeploy de código)
//
// Extras:
// - Respeta limit alto (cap por ENV VITE_PUBLIC_VIDEOS_FEED_MAX)
// - Soporta offset para paginar (si el backend lo soporta)
// - Debug opcional VITE_DEBUG_VIDEOS_FEED=1
// - Concurrencia de hidratación limitada (para no matar red)
//
// ENV opcionales:
// - VITE_PUBLIC_VIDEOS_FEED_MAX=200
// - VITE_DEBUG_VIDEOS_FEED=1
// - VITE_VIDEOS_HYDRATE_PRODUCTS=1   (default 1)
// - VITE_VIDEOS_HYDRATE_CONCURRENCY=6 (default 6)

import http from "@/app/api/http";
import { getProduct } from "@/modules/shop/service/shop.public.api"; // ✅ el mismo que usa ShopProduct.vue

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

function s(x) {
  return String(x || "").trim();
}

/* =========================
   Detectar si el producto ya trae imagen (criterio ProductGallery)
========================= */
function hasAnyImage(p) {
  if (!p || typeof p !== "object") return false;

  if (Array.isArray(p.images) && p.images.length) return true;
  if (Array.isArray(p.image_urls) && p.image_urls.length) return true;

  if (s(p.image_url)) return true;
  if (s(p.cover_url)) return true;
  if (s(p.image_url_2)) return true;

  // por si vienen keys
  if (s(p.image_key)) return true;
  if (s(p.main_image_key)) return true;
  if (s(p.storage_key)) return true;
  if (s(p.object_key)) return true;
  if (s(p.file_key)) return true;

  return false;
}

/* =========================
   Cache de productos (hidratación)
========================= */
const _prodCache = new Map(); // id -> product
const _inflight = new Map(); // id -> Promise
const _missing = new Set(); // ids que dieron 404 (no reintentar)

/**
 * getProduct seguro:
 * - Si 404 => marca missing y devuelve null
 * - Si otro error => devuelve null (sin romper feed)
 */
async function safeGetProduct(pid) {
  try {
    const p = await getProduct(pid);
    if (p && typeof p === "object") return p;
    return null;
  } catch (e) {
    // axios style: e.response.status
    const st = e?.response?.status;
    if (st === 404) {
      _missing.add(pid);
      return null;
    }
    return null;
  }
}

async function hydrateProductById(productId) {
  const pid = toInt(productId, 0);
  if (!pid) return null;

  // si ya sabemos que no existe, no reintentar
  if (_missing.has(pid)) return null;

  if (_prodCache.has(pid)) return _prodCache.get(pid);
  if (_inflight.has(pid)) return _inflight.get(pid);

  const prom = (async () => {
    try {
      const p = await safeGetProduct(pid);

      if (p && typeof p === "object") {
        _prodCache.set(pid, p);
        return p;
      }

      // si safeGetProduct marcó missing, listo.
      return null;
    } finally {
      _inflight.delete(pid);
    }
  })();

  _inflight.set(pid, prom);
  return prom;
}

async function mapLimit(arr, limit, fn) {
  const out = new Array(arr.length);
  let i = 0;

  const workers = new Array(Math.max(1, limit)).fill(0).map(async () => {
    while (i < arr.length) {
      const idx = i++;
      out[idx] = await fn(arr[idx], idx);
    }
  });

  await Promise.all(workers);
  return out;
}

/**
 * Devuelve: { ok:true, data:[...] }
 * Soporta offset (si tu backend lo soporta): public/videos/feed?limit=16&offset=16
 */
export async function publicVideosFeed({ limit = 12, offset = 0 } = {}) {
  const HARD_MAX = toInt(import.meta?.env?.VITE_PUBLIC_VIDEOS_FEED_MAX, 200);
  const DEBUG = String(import.meta?.env?.VITE_DEBUG_VIDEOS_FEED) === "1";

  const HYDRATE_ENABLED =
    String(import.meta?.env?.VITE_VIDEOS_HYDRATE_PRODUCTS ?? "1") !== "0";

  const HYDRATE_CONCURRENCY = Math.max(
    1,
    toInt(import.meta?.env?.VITE_VIDEOS_HYDRATE_CONCURRENCY, 6)
  );

  let lim = toInt(limit, 12);
  if (!lim || lim < 1) lim = 12;
  if (lim > HARD_MAX) lim = HARD_MAX;

  let off = toInt(offset, 0);
  if (!Number.isFinite(off) || off < 0) off = 0;

  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log("[publicVideosFeed] requesting:", {
      lim,
      off,
      HARD_MAX,
      HYDRATE_ENABLED,
      HYDRATE_CONCURRENCY,
    });
  }

  // ✅ CLAVE: SIN "/" inicial
  const { data } = await http.get(`public/videos/feed`, {
    params: { limit: lim, offset: off },
  });

  // normalizar lista
  const list = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : [];

  // Si no queremos hidratar, devolvemos tal cual
  if (!HYDRATE_ENABLED) {
    if (data && typeof data === "object" && "ok" in data) return { ...data, data: list };
    return { ok: true, data: list };
  }

  // Hidratar solo los que:
  // - tienen productId
  // - y NO traen imagen
  const hydrated = await mapLimit(list, HYDRATE_CONCURRENCY, async (it) => {
    const prod = it?.product && typeof it.product === "object" ? it.product : null;
    const pid = toInt(it?.product_id ?? prod?.id ?? 0, 0);

    if (!pid) return it;

    // Si ya viene producto con imagen, no tocamos
    if (prod && hasAnyImage(prod)) return it;

    // Si ya sabemos que no existe, no tocamos
    if (_missing.has(pid)) return it;

    const full = await hydrateProductById(pid);
    if (full && typeof full === "object") return { ...it, product: full };

    return it;
  });

  if (DEBUG) {
    const missingCount = _missing.size;
    // eslint-disable-next-line no-console
    console.log("[publicVideosFeed] received:", list.length, "hydrated:", hydrated.length, "missing:", missingCount);
  }

  // devolver manteniendo formato
  if (data && typeof data === "object" && "ok" in data) {
    return { ...data, data: hydrated };
  }

  return { ok: true, data: hydrated };
}
