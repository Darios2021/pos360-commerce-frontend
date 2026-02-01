// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/shop/service/shop.videos.public.api.js
//
// Feed: GET /api/v1/public/videos/feed?limit=12
// Problema: el feed trae el video pero NO siempre trae imágenes del producto.
// Solución correcta: hidratar usando el MISMO getProduct() que usa ShopProduct.vue (ya probado).
//
// Importante:
// - Nunca sobreescribe it.product con null
// - Cachea productos por id

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

async function hydrateProductById(productId) {
  const pid = toInt(productId, 0);
  if (!pid) return null;

  if (_prodCache.has(pid)) return _prodCache.get(pid);
  if (_inflight.has(pid)) return _inflight.get(pid);

  const prom = (async () => {
    try {
      // ✅ este llamado ya funciona en ShopProduct.vue
      const p = await getProduct(pid);
      if (p && typeof p === "object") {
        _prodCache.set(pid, p);
        return p;
      }
      return null;
    } catch {
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
 */
export async function publicVideosFeed({ limit = 12 } = {}) {
  let lim = toInt(limit, 12);
  if (!lim || lim < 1) lim = 12;
  if (lim > 60) lim = 60;

  const { data } = await http.get(`/public/videos/feed`, {
    params: { limit: lim },
  });

  // normalizar lista
  const list = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : [];

  // Hidratar solo los que:
  // - tienen productId
  // - y NO traen imagen
  const hydrated = await mapLimit(list, 6, async (it) => {
    const prod = it?.product && typeof it.product === "object" ? it.product : null;
    const pid = it?.product_id ?? prod?.id ?? null;

    // Si no hay producto id, NO tocamos nada
    if (!pid) return it;

    // Si ya hay producto con imagen, NO tocamos nada
    if (prod && hasAnyImage(prod)) return it;

    // Intentar hidratar usando el getProduct real
    const full = await hydrateProductById(pid);

    // Si conseguimos producto completo, lo pegamos
    if (full && typeof full === "object") {
      return { ...it, product: full };
    }

    // Si no se pudo, devolvemos el item original SIN romperlo
    return it;
  });

  // devolver manteniendo formato
  if (data && typeof data === "object" && "ok" in data) {
    return { ...data, data: hydrated };
  }

  return { ok: true, data: hydrated };
}
