// src/modules/shop/service/shop.public.api.js
// ✅ COPY-PASTE FINAL COMPLETO
//
// Public API (base: /api/v1/public) + Core API (base: /api/v1)
// ✅ Normaliza "/api" -> "/api/v1"
// ✅ Branch dinámico (localStorage + ENV default)
// ✅ in_stock default configurable (por defecto TODOS)
// ✅ FIX: payment-config endpoint compat (/payment-config o /shop/payment-config)
// ✅ FIX: similares no fuerza in_stock=1
// ✅ FIX: normaliza it.images si viene [{url}] o ["url"]

import axios from "axios";

const ENV_SAME_ORIGIN = String(import.meta.env.VITE_SHOP_API_SAME_ORIGIN || "").trim();
const FORCE_SAME_ORIGIN = ENV_SAME_ORIGIN === "1" || ENV_SAME_ORIGIN.toLowerCase() === "true";

const defaultBaseRaw = String(import.meta.env.VITE_API_BASE_URL || "").trim();

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

function stripApiSuffix(b) {
  const s = trimSlashesEnd(b);
  return s.replace(/\/api(\/v\d+)?$/i, "").replace(/\/+$/, "");
}

function buildPublicBase(apiV1Base) {
  const p = trimSlashesEnd(apiV1Base);
  return `${p}/public`;
}

function buildCoreBase(apiV1Base) {
  return trimSlashesEnd(apiV1Base);
}

// =========================
// basePath (normalizado)
// =========================
let basePath = normalizeApiV1Base(defaultBaseRaw);

if (typeof window !== "undefined") {
  const host = String(window.location.hostname || "").toLowerCase();

  if (host === "sanjuantecnologia.com" || host === "www.sanjuantecnologia.com") {
    basePath = "/api/v1";
  }

  if (FORCE_SAME_ORIGIN) {
    basePath = "/api/v1";
  }

  basePath = normalizeApiV1Base(basePath);
}

const apiBaseURL = buildPublicBase(basePath); // .../api/v1/public
const coreBaseURL = buildCoreBase(basePath); // .../api/v1

const assetBase = (() => {
  if (typeof window !== "undefined" && basePath.startsWith("/")) {
    return window.location.origin.replace(/\/+$/, "");
  }
  const b = trimSlashesEnd(basePath);
  const cut = stripApiSuffix(b);
  return (cut || b).replace(/\/+$/, "");
})();

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 20000,
});

const coreApi = axios.create({
  baseURL: coreBaseURL,
  timeout: 20000,
});

function antiPreflight(config) {
  const h = config.headers || {};
  delete h["Cache-Control"];
  delete h["cache-control"];
  delete h["Pragma"];
  delete h["pragma"];
  config.headers = h;
  return config;
}
api.interceptors.request.use(antiPreflight);
coreApi.interceptors.request.use(antiPreflight);

if (typeof window !== "undefined") {
  console.log("[SHOP API]", { basePath, apiBaseURL, coreBaseURL, assetBase });
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

// ✅ acepta ["url"] o [{url}] o mezcla
function normalizeImageList(images) {
  if (!Array.isArray(images)) return [];
  const raw = images
    .map((x) => (typeof x === "string" ? x : x?.url))
    .map((x) => absUrl(x))
    .filter(Boolean);
  return uniqUrls(raw);
}

function normalizeBrands(brands) {
  if (Array.isArray(brands)) {
    return brands
      .map((x) => String(x || "").trim())
      .filter(Boolean)
      .join(",");
  }
  return String(brands || "").trim();
}

// ========================================
// Branch ID dinámico
// ========================================
const LS_BRANCH_KEY = "shop_branch_id";

const ENV_DEFAULT_BRANCH_ID = toInt(import.meta.env.VITE_SHOP_DEFAULT_BRANCH_ID, 0);
const FALLBACK_DEFAULT_BRANCH_ID = ENV_DEFAULT_BRANCH_ID > 0 ? ENV_DEFAULT_BRANCH_ID : 1;

export function getCatalogBranchId() {
  try {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(LS_BRANCH_KEY);
      const bid = toInt(raw, 0);
      if (bid > 0) return bid;
    }
  } catch {}
  return FALLBACK_DEFAULT_BRANCH_ID;
}

export function setCatalogBranchId(branchId) {
  const bid = toInt(branchId, 0);
  const final = bid > 0 ? bid : FALLBACK_DEFAULT_BRANCH_ID;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_BRANCH_KEY, String(final));
    }
  } catch {}
  return final;
}

export async function getBranches() {
  const r = await api.get("/branches");
  return r.data?.items || [];
}

/**
 * BRANDING
 * GET /api/v1/public/shop/branding
 */
export async function getShopBranding() {
  const r = await api.get("/shop/branding");
  const it = r.data?.item || null;

  return {
    name: String(it?.name || "San Juan Tecnología"),
    logo_url: it?.logo_url ? absUrl(it.logo_url) : "",
    favicon_url: it?.favicon_url ? absUrl(it.favicon_url) : "",
    og_image_url: it?.og_image_url ? absUrl(it.og_image_url) : "",
    updated_at: it?.updated_at || null,
  };
}

/**
 * PAYMENT CONFIG
 * ✅ FIX: compat
 * - /payment-config (canonical)
 * - /shop/payment-config (legacy/alternativo)
 */
export async function getShopPaymentConfig() {
  let r = null;

  try {
    r = await api.get("/payment-config");
  } catch {
    // fallback (si backend lo montó así)
    r = await api.get("/shop/payment-config");
  }

  const d = r?.data || {};

  return {
    transfer: {
      enabled: !!d?.transfer?.enabled,
      bank: String(d?.transfer?.bank || "").trim(),
      alias: String(d?.transfer?.alias || "").trim(),
      cbu: String(d?.transfer?.cbu || "").trim(),
      holder: String(d?.transfer?.holder || "").trim(),
      instructions: String(d?.transfer?.instructions || "").trim(),
    },
    mercadopago: { enabled: !!d?.mercadopago?.enabled },
    cash: { enabled: !!d?.cash?.enabled, note: String(d?.cash?.note || "").trim() },
  };
}

// ========================================
// default in_stock configurable (por defecto TODOS)
// ========================================
const ENV_DEFAULT_IN_STOCK_RAW = String(import.meta.env.VITE_SHOP_DEFAULT_IN_STOCK ?? "").trim();
const DEFAULT_IN_STOCK =
  ENV_DEFAULT_IN_STOCK_RAW === "1" || ENV_DEFAULT_IN_STOCK_RAW.toLowerCase() === "true" ? 1 : 0;

/**
 * CATÁLOGO
 * GET /api/v1/public/catalog
 */
export async function getCatalog(params = {}) {
  const branch_id = toInt(params.branch_id, getCatalogBranchId());

  const brands = normalizeBrands(params.brands);
  const model = String(params.model || "").trim();

  const volume_min =
    params.volume_min === null || params.volume_min === undefined || params.volume_min === ""
      ? null
      : toNum(params.volume_min, NaN);

  const volume_max =
    params.volume_max === null || params.volume_max === undefined || params.volume_max === ""
      ? null
      : toNum(params.volume_max, NaN);

  const sort = String(params.sort || "").trim();

  const in_stock =
    params.in_stock === null || params.in_stock === undefined || params.in_stock === ""
      ? DEFAULT_IN_STOCK
      : toInt(params.in_stock, DEFAULT_IN_STOCK);

  const q = cleanParams({
    branch_id,
    search: params.search || "",
    category_id: params.category_id ?? null,
    subcategory_id: params.subcategory_id ?? null,
    include_children: params.include_children ?? null,
    in_stock,
    page: params.page ?? 1,
    limit: params.limit ?? 24,
    strict_search: params.strict_search ?? null,
    exclude_terms: params.exclude_terms ?? null,

    brands: brands || "",
    model: model || "",
    volume_min: Number.isFinite(volume_min) ? volume_min : null,
    volume_max: Number.isFinite(volume_max) ? volume_max : null,
    sort: sort || "",
  });

  const r = await api.get("/catalog", { params: q });
  const data = r.data || { items: [], total: 0, pages: 0, page: 1, limit: 24 };

  const arr = Array.isArray(data.items) ? data.items : [];
  data.items = arr.map((it) => {
    const imgRaw = it?.image_url || it?.image || it?.url || it?.src || "";
    const list = normalizeImageList(it?.images);
    const images = uniqUrls([absUrl(imgRaw), ...list].filter(Boolean));
    return { ...it, images, image_url: images[0] || absUrl(it.image_url) || "" };
  });

  return data;
}

/**
 * SUGERENCIAS
 * GET /api/v1/public/suggestions
 */
export async function getSuggestions({ q = "", limit = 8, branch_id } = {}) {
  const bid = toInt(branch_id, getCatalogBranchId());
  const qq = String(q || "").trim();
  if (!qq) return [];

  const params = cleanParams({ branch_id: bid, q: qq, limit: toInt(limit, 8) });
  const r = await api.get("/suggestions", { params });

  const items = Array.isArray(r.data?.items) ? r.data.items : [];
  return items.map((it) => {
    const imgRaw = it?.image_url || "";
    const list = normalizeImageList(it?.images);
    const images = uniqUrls([absUrl(imgRaw), ...list].filter(Boolean));
    return { ...it, images, image_url: images[0] || absUrl(it.image_url) || "" };
  });
}

/**
 * MEDIA PÚBLICA PARA CARDS (SIN branch_id)
 * GET /api/v1/public/products/:id/media
 */
export async function getPublicProductMedia(id) {
  const pid = toInt(id, 0);
  if (!pid) return null;

  const r = await api.get(`/products/${pid}/media`);
  const item = r.data?.item || r.data?.data || r.data?.result || null;
  if (!item) return null;

  const img = item?.image_url ? absUrl(item.image_url) : "";
  const urls = Array.isArray(item?.image_urls) ? item.image_urls : [];
  const listFromImages = normalizeImageList(item?.images);

  const images = uniqUrls([img, ...urls.map(absUrl), ...listFromImages].filter(Boolean));

  return {
    ...item,
    images,
    image_urls: images,
    image_url: images[0] || "",
  };
}

/**
 * VIDEOS DE PRODUCTO (CORE, NO /public)
 * GET /api/v1/products/:id/videos
 */
export async function getProductVideos(id) {
  const pid = toInt(id, 0);
  if (!pid) return [];

  const r = await coreApi.get(`/products/${pid}/videos`);
  const arr = r.data?.data;
  return Array.isArray(arr) ? arr : [];
}

/**
 * PRODUCTO
 * GET /api/v1/public/products/:id
 */
export async function getProduct(id, { branch_id } = {}) {
  const pid = toInt(id, 0);
  const bid = toInt(branch_id, getCatalogBranchId());

  const r = await api.get(`/products/${pid}`, { params: { branch_id: bid } });

  const item = r.data?.item || null;
  if (!item) return null;

  const img = item?.image_url ? absUrl(item.image_url) : "";
  const list = normalizeImageList(item?.images);
  const images = uniqUrls([img, ...list].filter(Boolean));
  item.images = images;
  item.image_url = images[0] || img || "";

  if (item.price == null) item.price = item.price_list ?? item.price_discount ?? 0;

  try {
    const vids = await getProductVideos(pid);
    const listV = Array.isArray(vids) ? vids : [];
    item.videos = listV;
    item.product_videos = listV;
    item.media = item.media || {};
    item.media.videos = listV;
  } catch {
    item.videos = item.videos || [];
  }

  return item;
}

/**
 * SIMILARES
 * ✅ FIX: no fuerza in_stock=1 (usa default global)
 */
export async function getSimilarProducts({
  productId,
  category_id = null,
  subcategory_id = null,
  limit = 8,
  branch_id,
  in_stock,
} = {}) {
  const bid = toInt(branch_id, getCatalogBranchId());
  const pid = toInt(productId, 0);
  const lim = Math.max(1, toInt(limit, 8));

  const inStockFinal =
    in_stock === null || in_stock === undefined || in_stock === "" ? DEFAULT_IN_STOCK : toInt(in_stock, DEFAULT_IN_STOCK);

  const q = cleanParams({
    branch_id: bid,
    category_id: category_id ?? null,
    subcategory_id: subcategory_id ?? null,
    in_stock: inStockFinal,
    page: 1,
    limit: lim * 3,
  });

  let candidates = [];
  try {
    const r = await api.get("/catalog", { params: q });
    candidates = Array.isArray(r.data?.items) ? r.data.items : [];
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
    ids.map(async (id) => await getProduct(id, { branch_id: bid }).catch(() => null))
  );

  return hydrated
    .filter(Boolean)
    .map((p) => {
      const imgRaw = p?.image_url || "";
      const list = normalizeImageList(p?.images);
      const images = uniqUrls([absUrl(imgRaw), ...list].filter(Boolean));
      return {
        ...p,
        images,
        image_url: images[0] || absUrl(p.image_url) || "",
        price:
          p.price ??
          (toNum(p.price_discount, 0) > 0 ? toNum(p.price_discount, 0) : toNum(p.price_list, 0)),
      };
    });
}
