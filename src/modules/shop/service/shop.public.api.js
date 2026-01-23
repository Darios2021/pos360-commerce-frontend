// src/modules/shop/service/shop.public.api.js
import axios from "axios";

const ENV_SAME_ORIGIN = String(import.meta.env.VITE_SHOP_API_SAME_ORIGIN || "").trim();
const FORCE_SAME_ORIGIN = ENV_SAME_ORIGIN === "1" || ENV_SAME_ORIGIN.toLowerCase() === "true";

const defaultBase = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

// ✅ basePath puede ser absoluto o relativo
let basePath = defaultBase;

// ✅ en dominio público => SIEMPRE same-origin
if (typeof window !== "undefined") {
  const host = String(window.location.hostname || "").toLowerCase();
  if (host === "sanjuantecnologia.com" || host === "www.sanjuantecnologia.com") basePath = "/api/v1";
  if (FORCE_SAME_ORIGIN) basePath = "/api/v1";
}

// ✅ siempre apuntamos al PUBLIC
function buildPublicBase(path) {
  const p = String(path || "").trim();
  if (!p) return "/api/v1/public";
  if (p.startsWith("/")) return `${p.replace(/\/+$/, "")}/public`;
  return `${p.replace(/\/+$/, "")}/public`;
}

const apiBaseURL = buildPublicBase(basePath);

// ✅ assetBase: para absolutizar imágenes cuando vienen relativas
const assetBase = (() => {
  if (typeof window !== "undefined" && basePath.startsWith("/")) return window.location.origin.replace(/\/+$/, "");
  const b = String(basePath || "").replace(/\/+$/, "");
  const cut = b.replace(/\/api(\/v\d+)?$/i, "");
  return (cut || b).replace(/\/+$/, "");
})();

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 20000,
});

// ✅ Anti-preflight por headers raros
api.interceptors.request.use((config) => {
  const h = config.headers || {};
  delete h["Cache-Control"];
  delete h["cache-control"];
  delete h["Pragma"];
  delete h["pragma"];
  config.headers = h;
  return config;
});

// ✅ DEBUG fácil (te muestra a dónde está pegando)
if (typeof window !== "undefined") {
  console.log("[SHOP API]", { basePath, apiBaseURL, assetBase });
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

// ✅ tu backend exige branch_id (por ahora fijo)
const CATALOG_BRANCH_ID = 3;
export function getCatalogBranchId() {
  return CATALOG_BRANCH_ID;
}

/**
 * ✅ BRANDING PÚBLICO
 * GET  /api/v1/public/shop/branding
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
 * ✅ PAYMENT CONFIG
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
    mercadopago: { enabled: !!d?.mercadopago?.enabled },
    cash: { enabled: !!d?.cash?.enabled, note: String(d?.cash?.note || "").trim() },
  };
}

/**
 * ✅ CATÁLOGO
 * GET /api/v1/public/catalog
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

  const arr = Array.isArray(data.items) ? data.items : [];
  data.items = arr.map((it) => {
    const imgRaw = it?.image_url || it?.image || it?.url || it?.src || "";
    const images = uniqUrls([...(Array.isArray(it.images) ? it.images : []).map(absUrl), absUrl(imgRaw)]);
    return { ...it, images, image_url: images[0] || absUrl(it.image_url) || "" };
  });

  return data;
}

/**
 * ✅ SUGERENCIAS
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
    const images = uniqUrls([...(Array.isArray(it.images) ? it.images : []).map(absUrl), absUrl(it.image_url)]);
    return { ...it, images, image_url: images[0] || absUrl(it.image_url) || "" };
  });
}

/**
 * ✅ PRODUCTO
 * GET /api/v1/public/products/:id
 */
export async function getProduct(id) {
  const pid = toInt(id, 0);
  const r = await api.get(`/products/${pid}`, { params: { branch_id: getCatalogBranchId() } });

  const item = r.data?.item || null;
  if (!item) return null;

  const img = item?.image_url ? absUrl(item.image_url) : "";
  const images = uniqUrls([...(img ? [img] : []), ...(Array.isArray(item.images) ? item.images : []).map(absUrl)]);
  item.images = images;
  item.image_url = images[0] || img || "";

  if (item.price == null) item.price = item.price_list ?? item.price_discount ?? 0;

  return item;
}

/**
 * ✅ SIMILARES (usa /catalog y luego hidrata)
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

  const hydrated = await Promise.all(ids.map(async (id) => (await getProduct(id).catch(() => null))));
  return hydrated.filter(Boolean).map((p) => {
    const images = uniqUrls([...(Array.isArray(p.images) ? p.images : []).map(absUrl), absUrl(p.image_url)]);
    return {
      ...p,
      images,
      image_url: images[0] || absUrl(p.image_url) || "",
      price: p.price ?? (toNum(p.price_discount, 0) > 0 ? toNum(p.price_discount, 0) : toNum(p.price_list, 0)),
    };
  });
}
