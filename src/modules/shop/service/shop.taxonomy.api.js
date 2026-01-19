// src/modules/shop/service/shop.taxonomy.api.js
// ✅ COPY-PASTE FINAL COMPLETO (BACKEND NUEVO: subcategories reales)
// Mantiene COMPAT con tu front viejo:
// - getPublicCategoryChildren(...) existe
// - getPublicCategoriesAll() devuelve "padres + hijos" con parent_id (legacy)
// - NO rompe imports existentes

import axios from "axios";

const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

// OJO: mantenemos /public como venías usando
const api = axios.create({
  baseURL: `${base}/public`,
  timeout: 15000,
});

let _parentsCache = null;
let _childrenCacheByParent = new Map(); // parentId -> children[]
let _allCache = null;
let _atParents = 0;
let _atAll = 0;
const TTL = 60_000;

function now() {
  return Date.now();
}

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

// ===============================
// BACKEND endpoints esperados:
// - GET /public/categories            -> categories (padres)
// - GET /public/subcategories?category_id=ID -> subcategories reales
//
// Si tus rutas son /api/v1/public/...,
// entonces VITE_API_BASE_URL debe apuntar a /api/v1 (o ajustá baseURL).
// ===============================

async function fetchParents() {
  // ✅ categorias principales
  const r = await api.get("/categories");
  // soporta { items: [] } o { data: [] } o [] directo
  const items = Array.isArray(r.data?.items)
    ? r.data.items
    : Array.isArray(r.data?.data)
    ? r.data.data
    : Array.isArray(r.data)
    ? r.data
    : [];
  return items;
}

async function fetchChildren(parentId) {
  const pid = toInt(parentId, 0);
  if (!pid) return [];

  const r = await api.get("/subcategories", { params: { category_id: pid } });
  const items = Array.isArray(r.data?.items)
    ? r.data.items
    : Array.isArray(r.data?.data)
    ? r.data.data
    : Array.isArray(r.data)
    ? r.data
    : [];

  // ✅ Normalizamos a formato legacy esperado por ShopHeader.vue:
  // child.parent_id = category_id del padre
  return (items || []).map((s) => ({
    id: toInt(s.id, 0),
    name: s.name,
    parent_id: pid,
    is_active: s.is_active ?? 1,
    // por si algún componente necesita estos campos:
    category_id: pid,
  }));
}

// ===============================
// ✅ ALL (padres + hijos) LEGACY
// ===============================
export async function getPublicCategoriesAll({ force = false } = {}) {
  if (!force && _allCache && now() - _atAll < TTL) return _allCache;

  // 1) padres (categories)
  if (!force && _parentsCache && now() - _atParents < TTL) {
    // ok
  } else {
    _parentsCache = await fetchParents();
    _atParents = now();
  }

  const parents = (_parentsCache || []).map((p) => ({
    id: toInt(p.id, 0),
    name: p.name,
    parent_id: null,
    is_active: p.is_active ?? 1,
  }));

  // 2) hijos (subcategories) por padre
  const children = [];
  for (const p of parents) {
    const pid = toInt(p.id, 0);
    if (!pid) continue;

    const cached = _childrenCacheByParent.get(pid);
    if (!force && cached && cached._at && now() - cached._at < TTL) {
      children.push(...(cached.items || []));
      continue;
    }

    const items = await fetchChildren(pid);
    _childrenCacheByParent.set(pid, { items, _at: now() });
    children.push(...items);
  }

  _allCache = [...parents, ...children];
  _atAll = now();
  return _allCache;
}

// ✅ Alias compat (tu código lo usa)
export async function getPublicCategories(opts = {}) {
  return await getPublicCategoriesAll(opts);
}

// ✅ Solo rubros (padres)
export async function getPublicParentCategories() {
  const all = await getPublicCategoriesAll();
  return (all || []).filter((c) => c && (c.parent_id === null || c.parent_id === undefined));
}

// ✅ Subrubros por rubro (hijos) (legacy)
export async function getPublicSubcategoriesByCategory(category_id) {
  const pid = toInt(category_id, 0);
  if (!pid) return [];
  const all = await getPublicCategoriesAll();
  return (all || []).filter((c) => c && Number(c.parent_id) === pid);
}

// ✅ COMPAT con componentes viejos (NO romper imports)
export async function getPublicCategoryChildren(category_id) {
  return await getPublicSubcategoriesByCategory(category_id);
}

export async function getPublicCategorySubcategories(category_id) {
  return await getPublicSubcategoriesByCategory(category_id);
}
