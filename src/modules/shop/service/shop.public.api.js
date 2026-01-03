// src/modules/shop/service/shop.public.api.js
// ✅ COPY-PASTE FINAL (SIN compat mapping raro)
// Envia keys reales al backend:
// - category_id (padre)
// - subcategory_id (hijo chip)
// - include_children (1/0)

import axios from "axios";

const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const api = axios.create({
  baseURL: `${base}/public`,
  timeout: 15000,
});

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
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

/**
 * ✅ Tu backend exige branch_id para consultar v_public_catalog.
 * Para navegación “tipo MercadoLibre” usamos un branch fijo interno.
 * La SUCURSAL REAL se elige solo en checkout.
 */
const CATALOG_BRANCH_ID = 3;

export function getCatalogBranchId() {
  return CATALOG_BRANCH_ID;
}

// ✅ GET /public/branches (para checkout)
export async function getBranches() {
  const r = await api.get("/branches");
  return r.data?.items || [];
}

/**
 * ✅ DEDUPE por product_id
 */
function dedupeCatalogItems(items) {
  const arr = Array.isArray(items) ? items : [];
  const map = new Map();

  for (const raw of arr) {
    const pid = Number(raw?.product_id);
    if (!Number.isFinite(pid) || pid <= 0) continue;

    const img = raw?.image_url || raw?.image || raw?.url || raw?.src || null;

    if (!map.has(pid)) {
      const base = { ...raw };

      const images = [];
      if (Array.isArray(base.images)) for (const u of base.images) if (u) images.push(u);
      if (img) images.unshift(img);

      base.images = Array.from(new Set(images.filter(Boolean)));
      base.image_url = base.images[0] || base.image_url || "";

      map.set(pid, base);
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
 * ✅ CATÁLOGO
 */
export async function getCatalog(params = {}) {
  const branch_id = toInt(params.branch_id, getCatalogBranchId());

  const q = cleanParams({
    branch_id,
    search: params.search || "",
    category_id: params.category_id ?? null,             // padre
    subcategory_id: params.subcategory_id ?? null,       // hijo chip
    include_children: params.include_children ?? null,   // 1/0
    in_stock: params.in_stock ?? 1,
    page: params.page ?? 1,
    limit: params.limit ?? 24,
  });

  const r = await api.get("/catalog", { params: q });
  const data = r.data || { items: [], total: 0, pages: 0, page: 1, limit: 24 };

  data.items = dedupeCatalogItems(data.items);
  return data;
}

// ✅ GET /public/products/:id
export async function getProduct(id) {
  const pid = toInt(id, 0);
  const r = await api.get(`/products/${pid}`, { params: { branch_id: getCatalogBranchId() } });
  const item = r.data?.item || null;

  if (item) {
    const img = item?.image_url || null;
    const images = Array.isArray(item.images) ? item.images.filter(Boolean) : [];
    const merged = Array.from(new Set([...(img ? [img] : []), ...images]));
    item.images = merged;
    item.image_url = merged[0] || item.image_url || "";
  }

  return item;
}
