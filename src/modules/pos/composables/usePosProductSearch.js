// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/pos/composables/usePosProductSearch.js
//
// Búsqueda server-side para POS
// - NO trae 5000 productos al iniciar
// - trae una primera página chica automáticamente
// - consulta backend por búsqueda / filtros / página
// - usa GET /pos/products
// - debounce incluido
// - preparado para branch_id / warehouse_id dinámicos
// - ✅ ahora también envía:
//    - category_id
//    - subcategory_id

import { ref, computed, unref, watch } from "vue";
import http from "../../../app/api/http";

function toInt(v, def = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
}

function toNum(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function toStr(v) {
  return String(v ?? "").trim();
}

function toBoolString(v) {
  return v ? "true" : "false";
}

function readArray(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.rows)) return data.rows;
  return [];
}

function normalizeMeta(payload = {}) {
  const meta = payload?.meta || {};
  const total = toInt(meta.total, 0);
  const page = Math.max(1, toInt(meta.page, 1));
  const limit = Math.max(1, toInt(meta.limit, 48));
  const pages = Math.max(1, Math.ceil(total / limit));

  return {
    total,
    page,
    limit,
    pages,
    scope: meta.scope || null,
    warehouse_id: meta.warehouse_id ?? null,
    branch_id: meta.branch_id ?? null,
    branch_ids: Array.isArray(meta.branch_ids) ? meta.branch_ids : [],
  };
}

function normalizeItem(p = {}) {
  const priceDiscount = toNum(
    p?.price_discount ?? p?.effective_price ?? p?.price_list ?? p?.price ?? 0,
    0
  );

  const priceList = toNum(
    p?.price_list ?? p?.price ?? p?.effective_price ?? 0,
    0
  );

  const qty = toNum(p?.qty ?? p?.stock_qty ?? 0, 0);

  return {
    ...p,
    id: toInt(p?.id, 0),
    name: toStr(p?.name),
    sku: toStr(p?.sku),
    code: toStr(p?.code),
    barcode: toStr(p?.barcode),
    brand: toStr(p?.brand),
    model: toStr(p?.model),
    category_id: p?.category_id ?? null,
    subcategory_id: p?.subcategory_id ?? null,
    qty,
    stock_qty: qty,
    effective_price: toNum(p?.effective_price ?? priceDiscount ?? 0, 0),
    price: toNum(p?.price ?? 0, 0),
    price_list: priceList,
    price_discount: priceDiscount,
    price_reseller: toNum(p?.price_reseller ?? 0, 0),
    image:
      p?.image ||
      p?.image_url ||
      p?.thumbnail ||
      p?.thumbnail_url ||
      p?.cover ||
      null,
  };
}

function normalizeError(err) {
  return (
    err?.friendlyMessage ||
    err?.response?.data?.message ||
    err?.response?.data?.code ||
    err?.message ||
    "No se pudo buscar productos"
  );
}

export function usePosProductSearch(options = {}) {
  const {
    branchId = ref(null),
    warehouseId = ref(null),

    initialQ = "",
    initialPage = 1,
    initialLimit = 48,

    initialCategoryId = null,
    initialSubcategoryId = null,

    inStock = true,
    sellable = true,

    minSearchLength = 2,
    debounceMs = 280,

    autoSearch = true,
    keepResultsOnShortQuery = true,
  } = options;

  const q = ref(toStr(initialQ));
  const rubroId = ref(initialCategoryId ?? null);
  const subrubroId = ref(initialSubcategoryId ?? null);

  const page = ref(Math.max(1, toInt(initialPage, 1)));
  const limit = ref(Math.max(1, toInt(initialLimit, 48)));

  const items = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const meta = ref({
    total: 0,
    page: page.value,
    limit: limit.value,
    pages: 1,
    scope: null,
    warehouse_id: null,
    branch_id: null,
    branch_ids: [],
  });

  const didSearch = ref(false);
  const isEmptyState = ref(true);

  let debounceTimer = null;
  let requestSeq = 0;

  const total = computed(() => toInt(meta.value?.total, 0));
  const pages = computed(() => Math.max(1, toInt(meta.value?.pages, 1)));
  const shownCount = computed(() => (Array.isArray(items.value) ? items.value.length : 0));

  const branchIdResolved = computed(() => {
    const v = unref(branchId);
    return toInt(v, 0) || null;
  });

  const warehouseIdResolved = computed(() => {
    const v = unref(warehouseId);
    return toInt(v, 0) || null;
  });

  const categoryIdResolved = computed(() => {
    return toInt(rubroId.value, 0) || null;
  });

  const subcategoryIdResolved = computed(() => {
    return toInt(subrubroId.value, 0) || null;
  });

  const hasContext = computed(() => {
    return Boolean(branchIdResolved.value || warehouseIdResolved.value);
  });

  const qNormalized = computed(() => toStr(q.value));

  const canSearch = computed(() => {
    if (categoryIdResolved.value || subcategoryIdResolved.value) return true;
    if (!qNormalized.value) return true;
    return qNormalized.value.length >= Math.max(0, toInt(minSearchLength, 0));
  });

  function buildParams() {
    const params = {
      page: page.value,
      limit: limit.value,
      in_stock: toBoolString(Boolean(unref(inStock))),
      sellable: toBoolString(Boolean(unref(sellable))),
    };

    if (qNormalized.value) params.q = qNormalized.value;
    if (branchIdResolved.value) params.branch_id = branchIdResolved.value;
    if (warehouseIdResolved.value) params.warehouse_id = warehouseIdResolved.value;
    if (categoryIdResolved.value) params.category_id = categoryIdResolved.value;
    if (subcategoryIdResolved.value) params.subcategory_id = subcategoryIdResolved.value;

    return params;
  }

  function resetResults() {
    items.value = [];
    meta.value = {
      total: 0,
      page: page.value,
      limit: limit.value,
      pages: 1,
      scope: null,
      warehouse_id: warehouseIdResolved.value,
      branch_id: branchIdResolved.value,
      branch_ids: [],
    };
    error.value = null;
    isEmptyState.value = true;
  }

  async function searchNow({ force = false, resetPage = false } = {}) {
    if (resetPage) page.value = 1;

    if (!hasContext.value && !force) {
      resetResults();
      return { ok: false, skipped: "NO_CONTEXT" };
    }

    if (!canSearch.value && !force) {
      error.value = null;

      if (!keepResultsOnShortQuery) {
        resetResults();
      }

      return { ok: false, skipped: "SHORT_QUERY" };
    }

    const seq = ++requestSeq;
    loading.value = true;
    error.value = null;
    didSearch.value = true;
    isEmptyState.value = false;

    try {
      const { data } = await http.get("/pos/products", {
        params: buildParams(),
      });

      if (seq !== requestSeq) {
        return { ok: false, skipped: "STALE_REQUEST" };
      }

      const rows = readArray(data).map(normalizeItem);
      const metaNorm = normalizeMeta(data);

      items.value = rows;
      meta.value = metaNorm;
      page.value = metaNorm.page;
      limit.value = metaNorm.limit;
      isEmptyState.value = rows.length === 0;

      return {
        ok: true,
        data: rows,
        meta: metaNorm,
      };
    } catch (err) {
      if (seq !== requestSeq) {
        return { ok: false, skipped: "STALE_ERROR" };
      }

      items.value = [];
      meta.value = {
        total: 0,
        page: page.value,
        limit: limit.value,
        pages: 1,
        scope: null,
        warehouse_id: warehouseIdResolved.value,
        branch_id: branchIdResolved.value,
        branch_ids: [],
      };
      error.value = normalizeError(err);
      isEmptyState.value = true;

      return { ok: false, error: err };
    } finally {
      if (seq === requestSeq) {
        loading.value = false;
      }
    }
  }

  function searchDebounced({ force = false, resetPage = true } = {}) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchNow({ force, resetPage });
    }, Math.max(0, toInt(debounceMs, 280)));
  }

  function setQuery(value) {
    q.value = toStr(value);
  }

  function clearQuery() {
    q.value = "";
    page.value = 1;
    clearTimeout(debounceTimer);

    if (autoSearch) {
      searchNow({ force: true, resetPage: true });
      return;
    }

    resetResults();
  }

  function setRubro(value) {
    rubroId.value = value ?? null;
    subrubroId.value = null;
    page.value = 1;

    if (autoSearch) {
      searchNow({ force: true, resetPage: true });
    }
  }

  function setSubrubro(value) {
    subrubroId.value = value ?? null;
    page.value = 1;

    if (autoSearch) {
      searchNow({ force: true, resetPage: true });
    }
  }

  function setPage(value) {
    const next = Math.max(1, toInt(value, 1));
    if (next === page.value) return;
    page.value = next;
  }

  function prevPage() {
    if (page.value <= 1 || loading.value) return;
    page.value -= 1;
    searchNow({ force: true });
  }

  function nextPage() {
    if (loading.value) return;
    if (page.value >= pages.value) return;
    page.value += 1;
    searchNow({ force: true });
  }

  function refresh() {
    return searchNow({ force: true });
  }

  function onTyping() {
    searchDebounced({ force: false, resetPage: true });
  }

  function onEnter() {
    clearTimeout(debounceTimer);
    return searchNow({ force: true, resetPage: true });
  }

  watch(limit, (nv, ov) => {
    if (toInt(nv, 48) === toInt(ov, 48)) return;
    page.value = 1;
  });

  watch(
    [branchIdResolved, warehouseIdResolved],
    ([nb, nw], [ob, ow]) => {
      if (nb === ob && nw === ow) return;

      clearTimeout(debounceTimer);
      page.value = 1;

      if (autoSearch) {
        searchNow({ force: true, resetPage: true });
      } else if (canSearch.value) {
        searchNow({ force: false, resetPage: true });
      } else {
        resetResults();
      }
    }
  );

  watch(page, (nv, ov) => {
    if (nv === ov) return;
    if (nv < 1) {
      page.value = 1;
      return;
    }

    if (!didSearch.value) return;
    if (!canSearch.value) return;

    searchNow({ force: true });
  });

  if (autoSearch) {
    searchNow({ force: true });
  } else {
    resetResults();
  }

  return {
    q,
    rubroId,
    subrubroId,
    page,
    limit,
    items,
    loading,
    error,
    meta,
    didSearch,
    isEmptyState,

    total,
    pages,
    shownCount,
    hasContext,
    canSearch,
    branchIdResolved,
    warehouseIdResolved,
    categoryIdResolved,
    subcategoryIdResolved,

    setQuery,
    clearQuery,
    setRubro,
    setSubrubro,
    setPage,
    prevPage,
    nextPage,
    refresh,
    onTyping,
    onEnter,
    searchNow,
    searchDebounced,
    resetResults,
  };
}