// src/modules/shop/service/shop.taxonomy.api.js
import axios from "axios";

const ENV_SAME_ORIGIN = String(import.meta.env.VITE_SHOP_API_SAME_ORIGIN || "").trim();
const FORCE_SAME_ORIGIN = ENV_SAME_ORIGIN === "1" || ENV_SAME_ORIGIN.toLowerCase() === "true";

const defaultBase = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
let basePath = defaultBase;

if (typeof window !== "undefined") {
  const host = String(window.location.hostname || "").toLowerCase();
  if (host === "sanjuantecnologia.com" || host === "www.sanjuantecnologia.com") basePath = "/api/v1";
  if (FORCE_SAME_ORIGIN) basePath = "/api/v1";
}

function buildPublicBase(path) {
  const p = String(path || "").trim();
  if (!p) return "/api/v1/public";
  if (p.startsWith("/")) return `${p.replace(/\/+$/, "")}/public`;
  return `${p.replace(/\/+$/, "")}/public`;
}

const api = axios.create({
  baseURL: buildPublicBase(basePath),
  timeout: 20000,
});

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

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function resolveBranchId(opts = {}) {
  const ob = toInt(opts.branch_id, 0);
  if (ob > 0) return ob;

  try {
    const raw = localStorage.getItem("pos360_shop_cart_v1");
    const obj = safeJsonParse(raw);
    const bid = toInt(obj?.branch_id, 0);
    if (bid > 0) return bid;
  } catch {}

  return 3;
}

async function getJson(path, params = {}) {
  const r = await api.get(path, { params });
  if (Array.isArray(r.data)) return r.data;
  if (Array.isArray(r.data?.items)) return r.data.items;
  return [];
}

async function fetchParentsNormalized(opts = {}) {
  const branch_id = resolveBranchId(opts);
  const list = await getJson("/categories", { branch_id });

  return (list || [])
    .map((c) => ({
      id: toInt(c.id, 0),
      name: normName(c.name),
      parent_id: null,
      is_active: normIsActive(c.is_active),
      category_id: toInt(c.id, 0),
    }))
    .filter((x) => x.id > 0 && x.name);
}

async function fetchChildrenNormalizedByParent(parentCategoryId, opts = {}) {
  const branch_id = resolveBranchId(opts);
  const category_id = toInt(parentCategoryId, 0);
  if (!category_id) return [];

  const list = await getJson("/subcategories", { category_id, branch_id });

  return (list || [])
    .map((s) => ({
      id: toInt(s.id, 0),
      name: normName(s.name),
      parent_id: category_id,
      is_active: normIsActive(s.is_active),
      category_id,
    }))
    .filter((x) => x.id > 0 && x.name);
}

let _allCache = null;
let _at = 0;
const TTL = 60_000;

async function fetchAllNormalized(opts = {}) {
  const parents = await fetchParentsNormalized(opts);
  const childrenLists = await Promise.all(parents.map((p) => fetchChildrenNormalizedByParent(p.id, opts)));
  return [...parents, ...childrenLists.flat()];
}

export async function getPublicCategoriesAll({ force = false, branch_id } = {}) {
  const now = Date.now();
  if (!force && _allCache && now - _at < TTL) return _allCache;

  const all = await fetchAllNormalized({ branch_id });
  _allCache = all;
  _at = now;
  return all;
}

export async function getPublicCategories(opts = {}) {
  return await getPublicCategoriesAll(opts);
}

export async function getPublicParentCategories(opts = {}) {
  const all = await getPublicCategoriesAll(opts);
  return (all || []).filter((c) => c && (c.parent_id == null));
}

export async function getPublicSubcategoriesByCategory(category_id, opts = {}) {
  const pid = toInt(category_id, 0);
  if (!pid) return [];
  const all = await getPublicCategoriesAll(opts);
  return (all || [])
    .filter((c) => c && Number(c.parent_id) === pid)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es"));
}

export async function getPublicCategoryChildren(category_id, opts = {}) {
  return await getPublicSubcategoriesByCategory(category_id, opts);
}
export async function getPublicCategorySubcategories(category_id, opts = {}) {
  return await getPublicSubcategoriesByCategory(category_id, opts);
}

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

export async function getPublicChildrenByParentMap(opts = {}) {
  return await getPublicSubcategoriesMap(opts);
}

export async function getPublicCategoryById(id, opts = {}) {
  const target = toInt(id, 0);
  if (!target) return null;
  const all = await getPublicCategoriesAll(opts);
  return (all || []).find((x) => toInt(x?.id, 0) === target) || null;
}
