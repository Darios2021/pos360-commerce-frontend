// src/modules/shop/service/shop.taxonomy.api.js
// ✅ COPY-PASTE FINAL (100% basado en categories.parent_id, como tu POS)
// - /public/categories trae TODO (padres + hijos) con parent_id
// - Rubros = parent_id null
// - Subrubros = parent_id = rubro_id

import axios from "axios";

const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const api = axios.create({
  baseURL: `${base}/public`,
  timeout: 15000,
});

let _allCache = null;
let _at = 0;
const TTL = 60_000;

function now() {
  return Date.now();
}

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

async function fetchAll() {
  const r = await api.get("/categories");
  const items = Array.isArray(r.data?.items) ? r.data.items : [];
  return items;
}

// ✅ ALL (padres + hijos)
export async function getPublicCategoriesAll({ force = false } = {}) {
  if (!force && _allCache && now() - _at < TTL) return _allCache;
  const all = await fetchAll();
  _allCache = all;
  _at = now();
  return all;
}

// ✅ Alias compat
export async function getPublicCategories(opts = {}) {
  return await getPublicCategoriesAll(opts);
}

// ✅ Solo rubros (padres)
export async function getPublicParentCategories() {
  const all = await getPublicCategoriesAll();
  return (all || []).filter((c) => c && (c.parent_id === null || c.parent_id === undefined));
}

// ✅ Subrubros por rubro (hijos)
export async function getPublicSubcategoriesByCategory(category_id) {
  const pid = toInt(category_id, 0);
  if (!pid) return [];
  const all = await getPublicCategoriesAll();
  return (all || []).filter((c) => c && Number(c.parent_id) === pid);
}

// ✅ COMPAT con componentes viejos
export async function getPublicCategoryChildren(category_id) {
  return await getPublicSubcategoriesByCategory(category_id);
}

export async function getPublicCategorySubcategories(category_id) {
  return await getPublicSubcategoriesByCategory(category_id);
}
