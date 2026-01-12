// src/modules/shop/service/shop.public.api.js
// ✅ COPY-PASTE FINAL COMPLETO (ANTI-CORS + FORZAR SAME-ORIGIN + ABS URLS)
import axios from "axios";

/**
 * BASE de la API del shop
 *
 * Modos:
 * 1) ✅ SAME-ORIGIN (recomendado para Instagram WebView / cero CORS):
 *    - Si host es sanjuantecnologia.com => usa /api/v1
 *    - O si seteás VITE_SHOP_API_SAME_ORIGIN="1" => usa /api/v1 (en cualquier dominio)
 *
 * 2) ABSOLUTO (como siempre):
 *    - Usa VITE_API_BASE_URL, ej: https://pos360-commerce-api.cingulado.org/api/v1
 *
 * Además:
 * - ✅ Remueve headers "cache-control" / "pragma" para evitar preflight con CORS estricto
 * - ✅ absUrl() arma URLs absolutas para imágenes aunque vengan relativas
 */

const ENV_SAME_ORIGIN = String(import.meta.env.VITE_SHOP_API_SAME_ORIGIN || "").trim();
const FORCE_SAME_ORIGIN = ENV_SAME_ORIGIN === "1" || ENV_SAME_ORIGIN.toLowerCase() === "true";

// Ej: VITE_API_BASE_URL="https://pos360-commerce-api.cingulado.org/api/v1"
const defaultBase = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

// basePath puede ser absoluto (https://...) o relativo (/api/v1)
let basePath = defaultBase;

if (typeof window !== "undefined") {
  const host = String(window.location.hostname || "").toLowerCase();

  // ✅ sanjuantecnologia.com => SIEMPRE same-origin
  if (host === "sanjuantecnologia.com" || host === "www.sanjuantecnologia.com") {
    basePath = "/api/v1";
  }

  // ✅ override manual por env (sirve para WebView/embeds o pruebas)
  if (FORCE_SAME_ORIGIN) {
    basePath = "/api/v1";
  }
}

function buildBaseURL(path) {
  const p = String(path || "").trim();
  if (!p) return "";
  if (p.startsWith("/")) return p.replace(/\/+$/, "") + "/public";
  return p.replace(/\/+$/, "") + "/public";
}

const apiBaseURL = buildBaseURL(basePath);

// assetBase: base para convertir paths relativos en URLs absolutas
const assetBase = (() => {
  if (typeof window !== "undefined" && basePath.startsWith("/")) {
    return window.location.origin.replace(/\/+$/, "");
  }
  const b = String(basePath || "").replace(/\/+$/, "");
  const cut = b.replace(/\/api(\/v\d+)?$/i, "");
  return (cut || b).replace(/\/+$/, "");
})();

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 15000,
  headers: {
    // ✅ no seteamos cache-control acá
  },
});

// ✅ Anti-preflight por headers “cache-control/pragma” que a veces mete algún wrapper/interceptor
api.interceptors.request.use((config) => {
  const h = config.headers || {};
  // axios puede poner headers en distintas “capas”
  delete h["Cache-Control"];
  delete h["cache-control"];
  delete h["Pragma"];
  delete h["pragma"];
  config.headers = h;
  return config;
});

if (typeof window !== "undefined") {
  console.log("[SHOP API] basePath =", basePath, "→ baseURL =", apiBaseURL, "assetBase =", assetBase);
}

export function getShopApiBase() {
  return api.defaults.baseURL;
}

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

function toNum(v, d = 0) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : d;
}

function cleanParams(obj) {
  const p = { ...obj };
  Object.keys(p).forEach((k) => {
    const v = p[k];
    if (v === null || v === undefined || v === "") delete p[k];
  });
  return p;
}

function uniqUrls(list) {
  const out = [];
  const seen = new Set();
  for (const u of list) {
    const s = String(u || "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function absUrl(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return `https:${s}`;
  if (!assetBase) return s;
  return `${assetBase}${s.startsWith("/") ? "" : "/"}${s}`;
}

/**
 * ✅ Tu backend exige branch_id
 */
const CATALOG_BRANCH_ID = 3;

export function getCatalogBranchId() {
  return CATALOG_BRANCH_ID;
}

export async function getBranches() {
  const r = await api.get("/branches");
  return r.data?.items || [];
}

function dedupeCatalogItems(items) {
  const arr = Array.isArray(items) ? items : [];
  const map = new Map();

  for (const raw of arr) {
    const pid = toInt(raw?.product_id ?? raw?.id, 0);
    if (pid <= 0) continue;

    const imgRaw = raw?.image_url || raw?.image || raw?.url || raw?.src || null;
    const img = imgRaw ? absUrl(imgRaw) : null;

    if (!map.has(pid)) {
      const baseObj = { ...raw };
      const images = [];

      if (Array.isArray(baseObj.images)) {
        for (const it of baseObj.images) {
          const u = typeof it === "string" ? it : it?.url || it?.image_url || it?.src || it?.path;
          if (u) images.push(absUrl(u));
        }
      }

      if (img) images.unshift(img);

      baseObj.images = Array.from(new Set(images.filter(Boolean)));
      baseObj.image_url = baseObj.images[0] || absUrl(baseObj.image_url || "") || "";

      map.set(pid, baseObj);
      continue;
    }

    const cur = map.get(pid);
    const list = Array.isArray(cur.images) ? cur.images : [];
    if (img && !list.includes(img)) list.push(img);
    cur.images = list;

    if (!cur.image_url && list.length) cur.image_url = list[0];
  }

  return Array.from(map.values());
}

/**
 * ✅ BRANDING PÚBLICO
 */
export async function getShopBranding() {
  const r = await api.get("/shop/branding");
  const it = r.data?.item || null;
  return {
    name: String(it?.name || "San Juan Tecnología"),
    logo_url: it?.logo_url ? absUrl(it.logo_url) : "",
    favicon_url: it?.favicon_url ? absUrl(it.favicon_url) : "",
    updated_at: it?.updated_at || null,
  };
}

/**
 * ✅ PAYMENT CONFIG (real)
 * GET /api/v1/public/shop/payment-config
 */
export async function getShopPaymentConfig() {
  const r = await api.get("/shop/payment-config");
  const d = r.data || {};

  return {
    transfer: {
      enabled: !!d?.transfer?.enabled,
      bank: String(d?.transfer?.bank || "").trim(),
      alias: String(d?.transfer?.alias || "").trim(),
      cbu: String(d?.transfer?.cbu || "").trim(),
      holder: String(d?.transfer?.holder || "").trim(),
      instructions: String(d?.transfer?.instructions || "").trim(),
    },
    mercadopago: {
      enabled: !!d?.mercadopago?.enabled,
    },
    cash: {
      enabled: !!d?.cash?.enabled,
      note: String(d?.cash?.note || "").trim(),
    },
  };
}

/**
 * ✅ CATÁLOGO
 */
export async function getCatalog(params = {}) {
  const branch_id = toInt(params.branch_id, getCatalogBranchId());

  const q = cleanParams({
    branch_id,
    search: params.search || "",
    category_id: params.category_id ?? null,
    subcategory_id: params.subcategory_id ?? null,
    include_children: params.include_children ?? null,
    in_stock: params.in_stock ?? 1,
    page: params.page ?? 1,
    limit: params.limit ?? 24,
    strict_search: params.strict_search ?? null,
    exclude_terms: params.exclude_terms ?? null,
  });

  const r = await api.get("/catalog", { params: q });
  const data = r.data || { items: [], total: 0, pages: 0, page: 1, limit: 24 };

  data.items = dedupeCatalogItems(data.items);

  data.items = (data.items || []).map((it) => {
    const imgs = uniqUrls([...(it.images || []).map(absUrl), absUrl(it.image_url)]);
    return { ...it, images: imgs, image_url: imgs[0] || absUrl(it.image_url) || "" };
  });

  return data;
}

/**
 * ✅ SUGERENCIAS
 */
export async function getSuggestions({ q = "", limit = 8, branch_id } = {}) {
  const bid = toInt(branch_id, getCatalogBranchId());
  const qq = String(q || "").trim();
  if (!qq) return [];

  const params = cleanParams({
    branch_id: bid,
    q: qq,
    limit: toInt(limit, 8),
  });

  const r = await api.get("/suggestions", { params });
  const items = Array.isArray(r.data?.items) ? r.data.items : [];

  return items.map((it) => {
    const imgs = uniqUrls([...(it.images || []).map(absUrl), absUrl(it.image_url)]);
    return { ...it, images: imgs, image_url: imgs[0] || absUrl(it.image_url) || "" };
  });
}

/**
 * ✅ PRODUCTO
 */
export async function getProduct(id) {
  const pid = toInt(id, 0);
  const r = await api.get(`/products/${pid}`, {
    params: { branch_id: getCatalogBranchId() },
  });

  const item = r.data?.item || null;

  if (item) {
    const img = item?.image_url ? absUrl(item.image_url) : "";
    const images = Array.isArray(item.images) ? item.images.filter(Boolean) : [];
    const merged = uniqUrls([...(img ? [img] : []), ...images.map(absUrl)]);

    item.images = merged;
    item.image_url = merged[0] || img || "";
    if (item.price == null) item.price = item.price_list ?? item.price_discount ?? 0;
  }

  return item;
}

/**
 * ✅ SIMILARES
 */
export async function getSimilarProducts({
  productId,
  category_id = null,
  subcategory_id = null,
  limit = 8,
  branch_id,
  in_stock = 1,
} = {}) {
  const bid = toInt(branch_id, getCatalogBranchId());
  const pid = toInt(productId, 0);
  const lim = Math.max(1, toInt(limit, 8));

  const q = cleanParams({
    branch_id: bid,
    category_id: category_id ?? null,
    subcategory_id: subcategory_id ?? null,
    in_stock,
    page: 1,
    limit: lim * 3,
  });

  let candidates = [];
  try {
    const r = await api.get("/catalog", { params: q });
    const data = r.data || {};
    candidates = dedupeCatalogItems(data.items || []);
  } catch {
    candidates = [];
  }

  const ids = [];
  const seen = new Set();
  for (const it of candidates) {
    const id = toInt(it?.id ?? it?.product_id, 0);
    if (!id || id === pid) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= lim) break;
  }

  const hydrated = await Promise.all(
    ids.map(async (id) => {
      try {
        return await getProduct(id);
      } catch {
        return null;
      }
    })
  );

  return hydrated
    .filter(Boolean)
    .map((p) => {
      const imgs = uniqUrls([...(p.images || []).map(absUrl), absUrl(p.image_url)]);
      return {
        ...p,
        images: imgs,
        image_url: imgs[0] || absUrl(p.image_url) || "",
        price:
          p.price ??
          (toNum(p.price_discount, 0) > 0 ? toNum(p.price_discount, 0) : toNum(p.price_list, 0)),
      };
    });
}
