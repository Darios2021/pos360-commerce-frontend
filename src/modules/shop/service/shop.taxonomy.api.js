// src/modules/shop/service/shop.taxonomy.api.js
import axios from "axios";

const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const api = axios.create({
  baseURL: `${base}/public`,
  timeout: 15000,
});

// GET /public/categories -> idealmente { ok:true, items:[{id,name,parent_id,is_active}] }
export async function getPublicCategories() {
  const r = await api.get("/categories");
  return r.data?.items || [];
}

// GET /public/categories/:id/children -> { ok:true, items:[{id,name,parent_id,is_active}] }
export async function getPublicCategoryChildren(parent_id) {
  const r = await api.get(`/categories/${parent_id}/children`);
  return r.data?.items || [];
}

/**
 * ✅ Devuelve lista “flatten” que INCLUYE padres + hijos.
 * - Si /categories ya trae parent_id en algunos items => usamos eso.
 * - Si /categories trae solo padres => traemos children por cada padre en paralelo.
 */
export async function getPublicCategoriesAll() {
  const baseList = await getPublicCategories();
  const arr = Array.isArray(baseList) ? baseList : [];

  const hasAnyChild = arr.some((x) => x && x.parent_id != null);
  if (hasAnyChild) return arr;

  // si no hay parent_id en la lista, asumimos que vinieron solo padres
  const parents = arr;
  const results = [...parents];

  const jobs = parents.map(async (p) => {
    try {
      const kids = await getPublicCategoryChildren(p.id);
      (kids || []).forEach((k) => results.push(k));
    } catch (_) {
      // noop
    }
  });

  await Promise.all(jobs);
  return results;
}
