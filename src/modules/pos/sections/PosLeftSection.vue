<template>
  <div class="pos-left-section">
    <PosScannerSearchBar
      ref="filtersRef"
      class="pos-surface pos-left-section__search"
      v-model:q="q"
      v-model:rubro-id="rubroId"
      v-model:subrubro-id="subrubroId"
      :visual-state="scannerVisualState"
      :icon-name="scannerIconName"
      :icon-color="scannerIconColor"
      :state-label="scannerStateLabel"
      :last-scan="scannerLastScan"
      :last-message="scannerLastMessage"
      :is-on="scannerIsOn"
      :sound-enabled="true"
      :vibration-enabled="true"
      :show-test-button="false"
      :rubro-items="rubroItems"
      :subrubro-items="subrubroItems"
      :subrubro-no-data-text="subrubroNoDataText"
      :page="page"
      :pages="pages"
      :shown-count="items.length"
      :total-count="total"
      :stock-only-total="total"
      :error="error"
      :disabled-all="loading"
      @toggle="toggleScanner"
      @typing="onTyping"
      @enter="onEnter"
      @clear="clearQuery"
      @rubro-change="onRubroChange"
      @prev="prevPage"
      @next="nextPage"
    />

    <PosProductsPanel
      class="pos-surface pos-left-section__products"
      :loading="loading"
      :disabled="loading"
      :items="items"
      :shown-count="items.length"
      :total-count="total"
      :stock-only-total="total"
      :page="page"
      :pages="pages"
      @prev="prevPage"
      @next="nextPage"
    >
      <PosProductRow
        v-for="p in items"
        :key="p.id"
        :item="p"
        :image="productImage(p)"
        :name="p.name"
        :sku="p.sku || p.code"
        :stkLabel="`STK ${p.stock_qty ?? p.qty ?? 0}`"
        :offLabel="getOffLabel(p)"
        :rubro-label="rubroTitleFromProduct?.(p) || ''"
        :subrubro-label="subrubroTitleFromProduct?.(p) || ''"
        :price-discount="p.price_discount ?? p.effective_price ?? p.price ?? 0"
        :price-list="p.price_list ?? p.price ?? 0"
        :disabled="productsDisabled"
        @add="add"
        @details="openDetails"
      />
    </PosProductsPanel>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import http from "../../../app/api/http";

import { usePosStore } from "../../../app/store/pos.store";
import { useAuthStore } from "../../../app/store/auth.store";

import PosScannerSearchBar from "../components/PosScannerSearchBar.vue";
import PosProductsPanel from "../components/PosProductsPanel.vue";
import PosProductRow from "../components/PosProductRow.vue";

import { usePosBranch } from "../composables/usePosBranch";
import { usePosBranchScope } from "../composables/usePosBranchScope";
import { usePosPricing } from "../composables/usePosPricing";
import { usePosImages } from "../composables/usePosImages";
import { usePosProductActions } from "../composables/usePosProductActions";
import { usePosProductSearch } from "../composables/usePosProductSearch";
import { usePosScannerInput } from "../composables/usePosScannerInput";

const posStore = usePosStore();
const auth = useAuthStore();

const filtersRef = ref(null);
const scannerEnabled = ref(true);

function toast(text) {
  console.log("[POS][left]", text);
}

function toInt(v, def = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
}

function toArr(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.rows)) return data.rows;
  return [];
}

const {
  branchItems,
  fetchedBranches,
  activeBranchId,
  ensureBranchSelected,
  needsBranchPick,
  userBranches: userBranchesFromBranch,
} = usePosBranch({ posStore, auth, toast });

const userBranches = computed(() => {
  if (Array.isArray(userBranchesFromBranch?.value)) return userBranchesFromBranch.value;
  if (Array.isArray(userBranchesFromBranch)) return userBranchesFromBranch;
  if (Array.isArray(auth?.user?.branches)) return auth.user.branches;
  if (Array.isArray(auth?.me?.branches)) return auth.me.branches;
  if (Array.isArray(fetchedBranches?.value)) return fetchedBranches.value;
  if (Array.isArray(branchItems?.value)) return branchItems.value;
  return [];
});

usePosBranchScope({
  auth,
  userBranches,
  branchItems,
});

const activeWarehouseId = computed(() => {
  return (
    toInt(posStore?.warehouseId, 0) ||
    toInt(posStore?.currentWarehouseId, 0) ||
    toInt(posStore?.context?.warehouseId, 0) ||
    toInt(posStore?.context?.warehouse_id, 0) ||
    toInt(posStore?.posContext?.warehouseId, 0) ||
    toInt(posStore?.posContext?.warehouse_id, 0) ||
    0
  );
});

const { resolveUnitPrice } = usePosPricing();
const { productImage, prefetchImagesForVisible } = usePosImages();

const categories = ref([]);
const subcategories = ref([]);
const taxonomyLoading = ref(false);

async function loadCategories() {
  try {
    taxonomyLoading.value = true;
    const { data } = await http.get("/categories");
    categories.value = toArr(data);
  } catch (err) {
    categories.value = [];
    console.error("[POS] loadCategories error", err);
  } finally {
    taxonomyLoading.value = false;
  }
}

async function loadSubcategories(categoryId) {
  const cid = toInt(categoryId, 0);

  if (!cid) {
    subcategories.value = [];
    return;
  }

  try {
    taxonomyLoading.value = true;
    const { data } = await http.get(`/categories/${cid}/subcategories`, {
      params: { is_active: 1 },
    });
    subcategories.value = toArr(data);
  } catch (err) {
    subcategories.value = [];
    console.error("[POS] loadSubcategories error", err);
  } finally {
    taxonomyLoading.value = false;
  }
}

const rubroItems = computed(() =>
  (categories.value || [])
    .map((c) => ({
      title: String(c?.name || "").trim(),
      value: Number(c?.id || 0),
    }))
    .filter((x) => x.title && x.value)
);

const subrubroItems = computed(() =>
  (subcategories.value || [])
    .map((s) => ({
      title: String(s?.name || "").trim(),
      value: Number(s?.id || 0),
    }))
    .filter((x) => x.title && x.value)
);

const subrubroNoDataText = computed(() => {
  if (!rubroId.value) return "Elegí un rubro primero";
  if (taxonomyLoading.value) return "Cargando subrubros...";
  if (!subrubroItems.value.length) return "Este rubro no tiene subrubros";
  return "Sin datos";
});

const categoryNameMap = computed(() => {
  const map = new Map();
  for (const c of categories.value || []) {
    const id = Number(c?.id || 0);
    const name = String(c?.name || "").trim();
    if (id && name) map.set(id, name);
  }
  return map;
});

const subcategoryNameMap = computed(() => {
  const map = new Map();
  for (const s of subcategories.value || []) {
    const id = Number(s?.id || 0);
    const name = String(s?.name || "").trim();
    if (id && name) map.set(id, name);
  }
  return map;
});

function rubroTitleFromProduct(product) {
  const id = Number(product?.category_id || 0);
  return categoryNameMap.value.get(id) || "";
}

function subrubroTitleFromProduct(product) {
  const id = Number(product?.subcategory_id || 0);
  return subcategoryNameMap.value.get(id) || "";
}

const {
  q,
  rubroId,
  subrubroId,
  page,
  items,
  loading,
  error,
  total,
  pages,
  searchNow,
  onTyping: onTypingSearch,
  onEnter: onEnterSearch,
  clearQuery: clearQuerySearch,
  prevPage,
  nextPage,
  resetResults,
  setRubro,
  setSubrubro,
  setQuery,
} = usePosProductSearch({
  branchId: activeBranchId,
  warehouseId: activeWarehouseId,
  initialLimit: 48,
  inStock: true,
  sellable: true,
  minSearchLength: 3,
  debounceMs: 320,
  autoSearch: true,
  keepResultsOnShortQuery: true,
});

async function refreshCatalog() {
  await searchNow({ force: true });
}

async function onRubroChange() {
  setRubro(rubroId.value);
  subrubroId.value = null;
  setSubrubro(null);
  await loadSubcategories(rubroId.value);
}

const canSell = computed(() => true);

const productsDisabled = computed(() => {
  return loading.value || !canSell.value || needsBranchPick.value;
});

const { detailsOpen, openDetails, add } = usePosProductActions({
  posStore,
  canSell,
  needsBranchPick,
  globalItems: items,
  productImage,
  toast,
});

function getOffLabel(product) {
  const list = Number(product?.price_list || resolveUnitPrice(product, "LIST") || 0);
  const discount = Number(
    product?.price_discount ??
      product?.effective_price ??
      resolveUnitPrice(product, "DISCOUNT") ??
      product?.price ??
      0
  );

  if (!list || !discount || discount >= list) return "";
  return `${Math.round((1 - discount / list) * 100)}% OFF`;
}

function normalizeCode(value) {
  return String(value || "").replace(/\r/g, "").replace(/\n/g, "").trim();
}

function isProbablyBarcode(value) {
  const v = normalizeCode(value);
  return !!v && /^[0-9A-Z\-_.]+$/i.test(v) && v.length >= 4;
}

function focusAndClearSearchInput() {
  nextTick(() => {
    clearQuerySearch?.();
    filtersRef.value?.clearSearch?.();
    filtersRef.value?.focusSearch?.();
  });
}

async function previewScannerResults(code) {
  const raw = normalizeCode(code);
  if (!raw) return;

  setQuery(raw);
  await searchNow({ force: true, resetPage: true });
  await nextTick();

  filtersRef.value?.clearSearch?.();
  filtersRef.value?.focusSearch?.();
}

async function searchExactByScanner(code) {
  const raw = normalizeCode(code);
  if (!raw) return [];

  const { data } = await http.get("/pos/products", {
    params: {
      q: raw,
      page: 1,
      limit: 10,
      branch_id: activeBranchId.value || undefined,
      warehouse_id: activeWarehouseId.value || undefined,
      in_stock: "true",
      sellable: "true",
    },
  });

  const rows = toArr(data);
  const normalized = raw.toLowerCase();

  const exact = rows.filter((p) => {
    const barcode = String(p?.barcode || "").trim().toLowerCase();
    const sku = String(p?.sku || "").trim().toLowerCase();
    const codeField = String(p?.code || "").trim().toLowerCase();
    return barcode === normalized || sku === normalized || codeField === normalized;
  });

  return exact.length ? exact : rows;
}

async function handleScannerMatch(product, code) {
  if (needsBranchPick.value) {
    focusAndClearSearchInput();
    toast("Elegí una sucursal antes de usar el scanner");
    return;
  }

  await previewScannerResults(code);
  add(product);
  toast(`Agregado: ${product?.name || product?.sku || product?.code || "Producto"}`);
}

async function handleScannerMultiple(rows, code) {
  await previewScannerResults(code);
  toast(`Se encontraron ${rows.length} productos para ${code}`);
}

async function handleScannerNoMatch(code) {
  await previewScannerResults(code);
  toast(`Sin coincidencias para ${code}`);
}

function handleScannerError(err, code) {
  console.error("[POS] scanner error", code, err);
  focusAndClearSearchInput();
  toast(err?.message || `Error leyendo ${code}`);
}

const scanner = usePosScannerInput({
  enabled: scannerEnabled,
  minLength: 4,
  maxLength: 120,
  maxAvgCharMs: 45,
  maxGapMs: 90,
  captureInsideInputs: false,
  preventEnterDefault: true,
  onScan: () => {},
  searchExact: searchExactByScanner,
  onMatch: handleScannerMatch,
  onMultiple: handleScannerMultiple,
  onNoMatch: handleScannerNoMatch,
  onError: handleScannerError,
  normalizeCode,
});

const scannerVisualState = computed(() => scanner.visualState.value);
const scannerIconName = computed(() => scanner.iconName.value);
const scannerIconColor = computed(() => scanner.iconColor.value);
const scannerStateLabel = computed(() => scanner.stateLabel.value);
const scannerLastMessage = computed(() => scanner.lastMessage.value);
const scannerLastScan = computed(() => scanner.lastScan.value);
const scannerIsOn = computed(() => scanner.isScannerOn.value);

function toggleScanner() {
  scanner.toggle();
  nextTick(() => {
    filtersRef.value?.focusSearch?.();
  });
}

function onTyping(value) {
  onTypingSearch(value);
}

async function onEnter(value) {
  const raw = normalizeCode(value ?? q.value);
  if (!raw) return;

  if (scannerIsOn.value && isProbablyBarcode(raw)) {
    try {
      const rows = await searchExactByScanner(raw);

      if (!rows.length) return handleScannerNoMatch(raw);
      if (rows.length === 1) return handleScannerMatch(rows[0], raw);

      const normalized = raw.toLowerCase();
      const exactRows = rows.filter((p) => {
        const barcode = String(p?.barcode || "").trim().toLowerCase();
        const sku = String(p?.sku || "").trim().toLowerCase();
        const codeField = String(p?.code || "").trim().toLowerCase();
        return barcode === normalized || sku === normalized || codeField === normalized;
      });

      if (exactRows.length === 1) return handleScannerMatch(exactRows[0], raw);
      return handleScannerMultiple(exactRows.length ? exactRows : rows, raw);
    } catch (err) {
      return handleScannerError(err, raw);
    }
  }

  onEnterSearch(raw);
}

function clearQuery() {
  clearQuerySearch?.();
  filtersRef.value?.clearSearch?.();
  filtersRef.value?.focusSearch?.();
}

watch(
  () => [page.value, items.value.length],
  async () => {
    await prefetchImagesForVisible?.(items.value);
  },
  { flush: "post" }
);

watch(
  () => activeBranchId?.value,
  async (newVal, oldVal) => {
    if (!newVal || newVal === oldVal) return;
    resetResults();
    await refreshCatalog();
  }
);

watch(
  () => rubroId.value,
  async (newVal, oldVal) => {
    if (newVal === oldVal) return;
    if (!newVal) {
      subcategories.value = [];
      subrubroId.value = null;
      return;
    }
    await loadSubcategories(newVal);
  },
  { immediate: true }
);

watch(
  () => subrubroId.value,
  (newVal, oldVal) => {
    if (newVal === oldVal) return;
    setSubrubro(newVal ?? null);
  }
);

onMounted(async () => {
  await ensureBranchSelected().catch(() => {});
  await loadCategories();
  await refreshCatalog();
  filtersRef.value?.focusSearch?.();
});

defineExpose({
  focusSearch: () => filtersRef.value?.focusSearch?.(),
  clearSearch: () => filtersRef.value?.clearSearch?.(),
  detailsOpen,
});
</script>

<style scoped>
.pos-left-section {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 8px;
  min-width: 0;
  min-height: 0;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
}

.pos-left-section__search {
  min-width: 0;
  min-height: 0;
  padding: 6px;
  border-radius: 14px;
  overflow: hidden;
  box-sizing: border-box;
}

.pos-left-section__products {
  min-width: 0;
  min-height: 0;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  border-radius: 14px;
  box-sizing: border-box;
}

.pos-surface {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(15, 23, 42, 0.1);
  box-shadow:
    0 8px 20px rgba(15, 23, 42, 0.05),
    0 2px 8px rgba(15, 23, 42, 0.04);
}

:deep(.pos-products-panel) {
  min-height: 0;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
}

:deep(.pos-products-panel__body),
:deep(.pos-products-panel__list),
:deep(.pos-products-panel__content) {
  min-height: 0;
  max-height: 100%;
}

:deep(.pos-products-panel__list),
:deep(.pos-products-panel__content) {
  overflow: auto;
}

:deep(.pos-scanner-search-bar) {
  min-width: 0;
  max-width: 100%;
}
</style>