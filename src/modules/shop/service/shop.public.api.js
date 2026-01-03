// src/modules/shop/service/shop.public.api.js
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
 * ✅ CATÁLOGO BASE
 * Tu backend exige branch_id para consultar v_public_catalog.
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

// ✅ GET /public/catalog
export async function getCatalog(params = {}) {
  const branch_id = toInt(params.branch_id, getCatalogBranchId());

  const q = cleanParams({
    branch_id,
    search: params.search || "",
    // OJO: usamos category_id + subcategory_id para filtrar como ML
    category_id: params.category_id ?? null,
    subcategory_id: params.subcategory_id ?? null,
    include_children: params.include_children ?? null,
    in_stock: params.in_stock ?? 1,
    page: params.page ?? 1,
    limit: params.limit ?? 24,
  });

  const r = await api.get("/catalog", { params: q });
  return r.data || { items: [], total: 0, pages: 0, page: 1, limit: 24 };
}

// ✅ GET /public/products/:id
export async function getProduct(id) {
  const pid = toInt(id, 0);
  const r = await api.get(`/products/${pid}`, { params: { branch_id: getCatalogBranchId() } });
  return r.data?.item || null;
}
