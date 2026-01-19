// src/modules/shop/service/shop.taxonomy.api.js
// ✅ COPY-PASTE FINAL COMPLETO (ANTI-400 + COMPAT TOTAL)
// FIX:
// - /public/categories probablemente requiere branch_id => lo mandamos siempre
// - /public/subcategories probablemente requiere category_id (y a veces branch_id) => lo pedimos por rubro
//
// Normaliza todo a:
//   { id, name, parent_id, is_active }
// parent_id null => rubro
// parent_id = category_id => subrubro

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

function normName(x) {
  return String(x || "").trim();
}

function normIsActive(x) {
  const n = Number(x ?? 1);
  return Number.isFinite(n) ? n : 1;
}

// ===============================
// Branch resolver (para evitar 400)
// ===============================
function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function resolveBranchId(opts = {}) {
  // 1) si viene explicitamente
  const ob = toInt(opts.branch_id, 0);
  if (ob > 0) return ob;

  // 2) localStorage cart
  const raw = localStorage.getItem("pos360_shop_cart_v1");
  const obj = safeJsonParse(raw);
  const bid = toInt(obj?.branch_id, 0);
  if (bid > 0) return bid;

  // 3) default
  return 3; // tu default real
}

// ===============================
// HTTP helpers
// ===============================
async function getJson(path, params = {}) {
  const r = await api.get(path, { params });
  // tu API a veces devuelve {items: []} o directo []
  if (Array.isArray(r.data)) return r.data;
  if (Array.isArray(r.data?.items)) return r.data.items;
  return [];
}

// ===============================
// Fetch parents (rubros)
// ===============================
async function fetchParentsNormalized(opts = {}) {
  const branch_id = resolveBranchId(opts);

  // ✅ mandamos branch_id (evita 400 si el backend lo exige)
  const list = await getJson("/categories", { branch_id });

  return (list || [])
    .map((c) => ({
      id: toInt(c.id, 0),
      name: normName(c.name),
      parent_id: null,
      is_active: normIsActive(c.is_active),
      category_id: toInt(c.id, 0), // compat extra
    }))
    .filter((x) => x.id > 0 && x.name);
}

// ===============================
// Fetch children (subrubros) por rubro
// (evita 400 si /subcategories exige category_id)
// ===============================
async function fetchChildrenNormalizedByParent(parentCategoryId, opts = {}) {
  const branch_id = resolveBranchId(opts);
  const category_id = toInt(parentCategoryId, 0);
  if (!category_id) return [];

  // ✅ mandamos category_id (y branch_id por si el backend lo pide)
  const list = await getJson("/subcategories", { category_id, branch_id });

  return (list || [])
    .map((s) => ({
      id: toInt(s.id, 0),
      name: normName(s.name),
      parent_id: category_id,
      is_active: normIsActive(s.is_active),
      category_id, // compat
    }))
    .filter((x) => x.id > 0 && x.name);
}

// ===============================
// ALL normalizado (padres + hijos)
// ===============================
async function fetchAllNormalized(opts = {}) {
  const parents = await fetchParentsNormalized(opts);

  // pedimos hijos por cada rubro (cache TTL evita martillar)
  const childrenLists = await Promise.all(
    parents.map((p) => fetchChildrenNormalizedByParent(p.id, opts))
  );

  const children = childrenLists.flat();

  return [...parents, ...children];
}

// ✅ ALL (padres + hijos) normalizado
export async function getPublicCategoriesAll({ force = false, branch_id } = {}) {
  if (!force && _allCache && now() - _at < TTL) return _allCache;

  const all = await fetchAllNormalized({ branch_id });
  _allCache = all;
  _at = now();
  return all;
}

// ✅ Alias compat
export async function getPublicCategories(opts = {}) {
  return await getPublicCategoriesAll(opts);
}

// ✅ Solo rubros (padres)
export async function getPublicParentCategories(opts = {}) {
  const all = await getPublicCategoriesAll(opts);
  return (all || []).filter((c) => c && (c.parent_id === null || c.parent_id === undefined));
}

// ✅ Subrubros por rubro
export async function getPublicSubcategoriesByCategory(category_id, opts = {}) {
  const pid = toInt(category_id, 0);
  if (!pid) return [];
  const all = await getPublicCategoriesAll(opts);
  return (all || [])
    .filter((c) => c && Number(c.parent_id) === pid)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es"));
}

// ✅ COMPAT con componentes viejos
export async function getPublicCategoryChildren(category_id, opts = {}) {
  return await getPublicSubcategoriesByCategory(category_id, opts);
}
export async function getPublicCategorySubcategories(category_id, opts = {}) {
  return await getPublicSubcategoriesByCategory(category_id, opts);
}

// ✅ MAP: hijos agrupados por parent_id
export async function getPublicSubcategoriesMap(opts = {}) {
  const all = await getPublicCategoriesAll(opts);
  const map = {};
  for (const c of all || []) {
    const pid = c?.parent_id == null ? null : toInt(c.parent_id, 0);
    if (!pid) continue;
    if (!map[pid]) map[pid] = [];
    if (Number(c.is_active ?? 1) === 1) map[pid].push(c);
  }
  for (const k of Object.keys(map)) {
    map[k].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es"));
  }
  return map;
}

// ✅ Alias por si otro componente lo llama distinto
export async function getPublicChildrenByParentMap(opts = {}) {
  return await getPublicSubcategoriesMap(opts);
}

// ✅ Helper por ID
export async function getPublicCategoryById(id, opts = {}) {
  const target = toInt(id, 0);
  if (!target) return null;
  const all = await getPublicCategoriesAll(opts);
  return (all || []).find((x) => toInt(x?.id, 0) === target) || null;
}
