// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/pos/composables/usePosCatalog.js
import { ref, computed, watch } from "vue";
import http from "../../../app/api/http";

export function usePosCatalog({ posStore, activeBranchId, isSellable, prefetchImagesForVisible }) {
  const ctxError = ref("");
  const q = ref("");
  const page = ref(1);
  const limit = ref(48);
  const rubroId = ref(null);
  const subrubroId = ref(null);
  const loadingList = ref(false);
  let tSearch = null;

  const rubros = ref([]); // categories
  const subrubros = ref([]); // subcategories

  const allSellable = ref([]);

  function normalizeList(data) {
    const arr = data?.data?.items || data?.items || data?.data || data || [];
    return Array.isArray(arr) ? arr : [];
  }

  async function loadRubrosSafe() {
    const candidates = [
      { url: "/categories", params: { limit: 5000 } },
      { url: "/categories", params: { page: 1, limit: 5000 } },
    ];
    for (const c of candidates) {
      try {
        const { data } = await http.get(c.url, c.params ? { params: c.params } : undefined);
        const out = normalizeList(data);
        if (out.length) {
          rubros.value = out;
          return;
        }
      } catch {}
    }
    rubros.value = [];
  }

  async function loadSubrubrosSafe() {
    const candidates = [
      { url: "/subcategories", params: { limit: 5000 } },
      { url: "/subcategories", params: { page: 1, limit: 5000 } },
      { url: "/admin/subcategories", params: { limit: 5000 } },
      { url: "/admin/subcategories", params: { page: 1, limit: 5000 } },
    ];

    for (const c of candidates) {
      try {
        const { data } = await http.get(c.url, c.params ? { params: c.params } : undefined);
        const out = normalizeList(data);
        if (out.length) {
          subrubros.value = out;
          return;
        }
      } catch {}
    }
    subrubros.value = [];
  }

  const rubroById = computed(() => {
    const m = new Map();
    for (const c of rubros.value || []) m.set(Number(c.id), c);
    return m;
  });
  const subrubroById = computed(() => {
    const m = new Map();
    for (const s of subrubros.value || []) m.set(Number(s.id), s);
    return m;
  });

  function productRubroId(p) {
    return Number(p?.category_id || p?.category?.id || 0) || null;
  }
  function productSubId(p) {
    return Number(p?.subcategory_id || p?.subcategory?.id || 0) || null;
  }

  function rubroName(p) {
    const rid = productRubroId(p);
    if (!rid) return null;
    return rubroById.value.get(Number(rid))?.name || null;
  }
  function subrubroName(p) {
    const sid = productSubId(p);
    if (!sid) return null;
    return subrubroById.value.get(Number(sid))?.name || null;
  }

  const rubroItems = computed(() => {
    const map = new Map();
    for (const p of allSellable.value || []) {
      const rid = productRubroId(p);
      if (!rid) continue;
      const name = rubroById.value.get(Number(rid))?.name;
      if (!name) continue;
      if (!map.has(rid)) map.set(rid, { title: String(name), value: Number(rid) });
    }
    return Array.from(map.values()).sort((a, b) => String(a.title).localeCompare(String(b.title)));
  });

  const subrubroItems = computed(() => {
    const rid = Number(rubroId.value || 0);
    if (!rid) return [];
    return (subrubros.value || [])
      .filter((s) => Number(s?.category_id || 0) === rid)
      .map((s) => ({ title: String(s?.name || "—"), value: Number(s?.id) }))
      .sort((a, b) => String(a.title).localeCompare(String(b.title)));
  });

  function onRubroChange() {
    subrubroId.value = null;
    page.value = 1;
  }

  const filteredItems = computed(() => {
    const qq = String(q.value || "").trim().toLowerCase();

    return (allSellable.value || []).filter((p) => {
      if (!isSellable(p)) return false;

      if (rubroId.value) {
        if (Number(productRubroId(p) || 0) !== Number(rubroId.value)) return false;
      }
      if (subrubroId.value) {
        if (Number(productSubId(p) || 0) !== Number(subrubroId.value)) return false;
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

  const filteredTotal = computed(() => Number(filteredItems.value.length || 0));

  const pages = computed(() => {
    const t = filteredTotal.value;
    const l = Number(limit.value || 48);
    return Math.max(1, Math.ceil(t / l));
  });

  const pagedItems = computed(() => {
    const l = Number(limit.value || 48);
    const start = (Number(page.value || 1) - 1) * l;
    const end = start + l;
    return filteredItems.value.slice(start, end);
  });

  watch(
    () => [page.value, filteredTotal.value],
    async () => {
      await prefetchImagesForVisible?.(pagedItems.value);
    }
  );

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

  function nextPage() {
    if (page.value < pages.value) page.value++;
  }

  async function fetchSellablePool() {
    loadingList.value = true;
    try {
      ctxError.value = "";

      const bid = Number(activeBranchId?.value || 0) || null;
      const wid = Number(posStore?.warehouse_id || 0) || null;

      if (!bid) {
        allSellable.value = [];
        ctxError.value = "Seleccioná una sucursal para ver productos.";
        return;
      }
      if (!wid) {
        allSellable.value = [];
        ctxError.value = "Falta depósito (warehouse). Verificá que tu sucursal tenga depósito asignado.";
        return;
      }

      const params = {
        branch_id: bid,
        warehouse_id: wid,
        q: "",
        page: 1,
        limit: 5000,
        in_stock: 1,
        sellable: 1,
        include_images: 1,
      };

      const { data } = await http.get("/pos/products", { params });
      const out = data?.data || data || [];
      allSellable.value = Array.isArray(out) ? out : [];

      if (page.value > pages.value) page.value = 1;
      await prefetchImagesForVisible?.(pagedItems.value);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Error cargando productos";
      ctxError.value = msg;
    } finally {
      loadingList.value = false;
    }
  }

  function refresh() {
    fetchSellablePool();
  }

  return {
    // state
    ctxError,
    q,
    page,
    pages,
    limit,
    rubroId,
    subrubroId,
    loadingList,

    // catalog
    allSellable,
    filteredItems,
    filteredTotal,
    pagedItems,

    // rubros
    rubros,
    subrubros,
    rubroItems,
    subrubroItems,
    rubroName,
    subrubroName,
    onRubroChange,

    // actions
    loadRubrosSafe,
    loadSubrubrosSafe,
    fetchSellablePool,
    refresh,

    // search + paging
    debounceSearch,
    doSearch,
    clearSearch,
    prevPage,
    nextPage,
  };
}