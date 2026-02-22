// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/pos/composables/usePosFilters.js
//
// ✅ FIX "CATÁLOGO OBSOLETO" en filtros:
// - Rubro/Subrubro se construyen SOLO desde globalItems (pool actual)
// - Los nombres se resuelven desde taxonomy (categories/subcategories)
// - NO mezcla labels viejos ni muestra rubros/subrubros sin productos
// - Si un id no tiene nombre en taxonomy, NO se muestra (evita Rubro #1)
// - Taxonomy se carga con TOKEN (Authorization Bearer), sin 401

import { ref, computed } from "vue";
import axios from "axios";

function toArr(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.rows)) return data.rows;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function readToken(auth) {
  const t =
    auth?.token ||
    auth?.access_token ||
    auth?.accessToken ||
    auth?.state?.token ||
    auth?.user?.token ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("pos360_token") ||
    "";
  return String(t || "").trim();
}

async function tryGet(url, { token } = {}) {
  try {
    const r = await axios.get(url, {
      baseURL: "/api/v1",
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return r?.data;
  } catch {
    return null;
  }
}

export function usePosFilters({ globalItems, isSellable, qtyForActive }) {
  /* estado filtros */
  const q = ref("");
  const page = ref(1);
  const limit = ref(48);
  const rubroId = ref(null);
  const subrubroId = ref(null);
  let tSearch = null;

  /* taxonomy maps */
  const rubroNameById = ref(new Map()); // id -> name
  const subrubroById = ref(new Map()); // id -> { name, category_id }
  const taxonomyLoaded = ref(false);

  async function loadTaxonomy(auth) {
    const token = readToken(auth);

    // ✅ prioridad: endpoints privados (con token), fallback públicos
    const cats =
      (await tryGet("/categories", { token })) ||
      (await tryGet("/admin/categories", { token })) ||
      (await tryGet("/public/categories")) ||
      null;

    const subs =
      (await tryGet("/subcategories", { token })) ||
      (await tryGet("/admin/subcategories", { token })) ||
      (await tryGet("/public/subcategories")) ||
      null;

    const catArr = toArr(cats);
    const subArr = toArr(subs);

    const rm = new Map();
    for (const c of catArr) {
      const id = Number(c?.id || 0) || null;
      const name = String(c?.name || c?.title || "").trim();
      if (id && name) rm.set(id, name);
    }

    const sm = new Map();
    for (const s of subArr) {
      const id = Number(s?.id || 0) || null;
      const name = String(s?.name || s?.title || "").trim();
      const cid = Number(s?.category_id || s?.categoryId || 0) || null;
      if (id && name) sm.set(id, { name, category_id: cid });
    }

    rubroNameById.value = rm;
    subrubroById.value = sm;
    taxonomyLoaded.value = true;
  }

  /* =========================
     ✅ Fuente de verdad filtros:
     SOLO ids presentes en globalItems (pool actual)
  ========================= */

  const poolRubroIds = computed(() => {
    const set = new Set();
    for (const p of globalItems.value || []) {
      // opcional: si querés que los filtros solo incluyan vendibles+stock:
      if (qtyForActive(p) <= 0) continue;
      if (!isSellable(p)) continue;

      const rid = Number(p?.category_id || 0) || null;
      if (rid) set.add(rid);
    }
    return set;
  });

  const poolSubrubroIdsByRubro = computed(() => {
    const map = new Map(); // rid -> Set(subId)
    for (const p of globalItems.value || []) {
      if (qtyForActive(p) <= 0) continue;
      if (!isSellable(p)) continue;

      const rid = Number(p?.category_id || 0) || null;
      const sid = Number(p?.subcategory_id || 0) || null;
      if (!rid || !sid) continue;

      if (!map.has(rid)) map.set(rid, new Set());
      map.get(rid).add(sid);
    }
    return map;
  });

  function rubroTitleById(rid) {
    const name = String(rubroNameById.value.get(Number(rid)) || "").trim();
    // ✅ si taxonomy no lo conoce, NO lo mostramos (evita "Rubro #1" y basura)
    return name || null;
  }

  function subrubroTitleById(sid) {
    const name = String(subrubroById.value.get(Number(sid))?.name || "").trim();
    return name || null;
  }

  const rubroItems = computed(() => {
    const out = [];
    const ids = poolRubroIds.value;

    for (const rid of ids) {
      const title = rubroTitleById(rid);
      if (!title) continue; // ✅ sin nombre => fuera
      out.push({ title, value: rid });
    }

    return out.sort((a, b) => String(a.title).localeCompare(String(b.title)));
  });

  const subrubroItems = computed(() => {
    const rid = Number(rubroId.value || 0) || null;
    if (!rid) return [];

    const set = poolSubrubroIdsByRubro.value.get(rid);
    if (!set || !set.size) return [];

    const out = [];
    for (const sid of set) {
      const title = subrubroTitleById(sid);
      if (!title) continue; // ✅ sin nombre => fuera
      out.push({ title, value: sid });
    }

    return out.sort((a, b) => String(a.title).localeCompare(String(b.title)));
  });

  const subrubroHasData = computed(() => {
    const rid = Number(rubroId.value || 0) || null;
    if (!rid) return false;
    return (subrubroItems.value || []).length > 0;
  });

  const subrubroNoDataText = computed(() => {
    if (!rubroId.value) return "Elegí un rubro primero";
    if (!subrubroHasData.value) return "Este rubro no tiene subrubros";
    return "No data available";
  });

  function onRubroChange() {
    subrubroId.value = null;
    page.value = 1;
  }

  /* totales */
  const stockOnlyTotal = computed(() => {
    return Number((globalItems.value || []).filter((p) => qtyForActive(p) > 0).length || 0);
  });

  /* lista filtrada */
  const globalFiltered = computed(() => {
    const qq = String(q.value || "").trim().toLowerCase();

    return (globalItems.value || []).filter((p) => {
      if (qtyForActive(p) <= 0) return false;
      if (!isSellable(p)) return false;

      if (rubroId.value) {
        if (Number(p?.category_id || 0) !== Number(rubroId.value)) return false;
      }
      if (subrubroId.value) {
        if (Number(p?.subcategory_id || 0) !== Number(subrubroId.value)) return false;
      }

      if (qq) {
        const hay =
          String(p?.name || "").toLowerCase().includes(qq) ||
          String(p?.sku || "").toLowerCase().includes(qq) ||
          String(p?.code || "").toLowerCase().includes(qq) ||
          String(p?.barcode || "").toLowerCase().includes(qq) ||
          String(p?.brand || "").toLowerCase().includes(qq) ||
          String(p?.model || "").toLowerCase().includes(qq);
        if (!hay) return false;
      }

      return true;
    });
  });

  const sellableStockTotal = computed(() => Number(globalFiltered.value.length || 0));

  const pages = computed(() => {
    const t = sellableStockTotal.value;
    const l = Number(limit.value || 48);
    return Math.max(1, Math.ceil(t / l));
  });

  const pagedItems = computed(() => {
    const l = Number(limit.value || 48);
    const start = (Number(page.value || 1) - 1) * l;
    const end = start + l;
    return globalFiltered.value.slice(start, end);
  });

  /* UI actions */
  function debounceSearch() {
    clearTimeout(tSearch);
    tSearch = setTimeout(() => {
      page.value = 1;
    }, 200);
  }
  function doSearch() {
    page.value = 1;
  }
  function clearSearch() {
    q.value = "";
    page.value = 1;
  }
  function prevPage() {
    if (page.value > 1) page.value--;
  }
  function nextPage(pagesCount) {
    const max = Number(pagesCount || pages.value || 1);
    if (page.value < max) page.value++;
  }

  /* helpers labels para la UI (fila producto) */
  function rubroTitleFromProduct(p) {
    const rid = Number(p?.category_id || 0) || null;
    if (!rid) return null;
    return rubroTitleById(rid); // ✅ SOLO taxonomy
  }

  function subrubroTitleFromProduct(p) {
    const sid = Number(p?.subcategory_id || 0) || null;
    if (!sid) return null;
    return subrubroTitleById(sid); // ✅ SOLO taxonomy
  }

  return {
    // state
    q,
    page,
    limit,
    rubroId,
    subrubroId,

    // taxonomy
    taxonomyLoaded,
    loadTaxonomy,

    // items + helpers
    rubroItems,
    subrubroItems,
    subrubroHasData,
    subrubroNoDataText,
    rubroTitleFromProduct,
    subrubroTitleFromProduct,

    // lists
    stockOnlyTotal,
    sellableStockTotal,
    pages,
    pagedItems,

    // actions
    onRubroChange,
    debounceSearch,
    doSearch,
    clearSearch,
    prevPage,
    nextPage,
  };
}