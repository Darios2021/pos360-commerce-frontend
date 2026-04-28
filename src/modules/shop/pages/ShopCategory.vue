<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/pages/ShopCategory.vue -->
<template>
  <div class="category-page" data-page="shop-category-v2">
    <ShopRouteRestoreOverlay :model-value="isRestoringCategory" />

    <section class="section">
      <div class="cat-layout">
        <!-- LEFT: filtros -->
        <aside class="cat-side">
          <ShopCategoryFilters
            :loading="loading"
            :subcats="subcats"
            :selected-sub-id="selectedSubId"
            :brands="brandsFacet"
            :selected-brands="selectedBrands"
            :models="modelsFacet"
            :model="modelSelected"
            :volume-min="volumeMin"
            :volume-max="volumeMax"
            @selectSub="selectSub"
            @update:selectedBrands="onBrands"
            @update:model="onModel"
            @update:volume="onVolume"
            @clearAll="clearAllFilters"
          />
        </aside>

        <!-- RIGHT -->
        <main class="cat-main">
          <!-- TOPBAR -->
          <div class="cat-topbar">
            <div class="cat-top-left">
              <h1 class="cat-title">{{ parent?.name || "Categoría" }}</h1>
              <div class="cat-count">{{ resultsLabelComputed }}</div>
            </div>

            <div class="cat-top-right">
              <ShopSortSelect v-model="sortSelected" :disabled="loading" />
            </div>
          </div>

          <v-alert v-if="err" type="error" variant="tonal" class="mb-6">
            {{ err }}
          </v-alert>

          <!-- LOADING -->
          <div v-if="loading" class="product-grid">
            <div v-for="n in 12" :key="n" class="grid-item">
              <v-skeleton-loader type="image, article" />
            </div>
          </div>

          <!-- EMPTY -->
          <v-alert v-else-if="!items.length" type="info" variant="tonal">
            No hay productos para mostrar con estos criterios.
          </v-alert>

          <!-- PRODUCTS -->
          <div v-else class="product-grid">
            <div v-for="p in items" :key="p.product_id" class="grid-item">
              <ProductCardSubcat :p="p" />
            </div>
          </div>

          <!-- PAGINACIÓN -->
          <div v-if="pages > 1" class="pager">
            <v-btn variant="tonal" :disabled="page <= 1 || loading" @click="prevPage">Anterior</v-btn>
            <div class="pager-text">Página {{ page }} / {{ pages }}</div>
            <v-btn variant="tonal" :disabled="page >= pages || loading" @click="nextPage">Siguiente</v-btn>
          </div>
        </main>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from "vue";
import { useRoute, useRouter, onBeforeRouteLeave } from "vue-router";

import { getCatalog } from "@/modules/shop/service/shop.public.api";
import { getPublicCategoriesAll, getPublicCategoryChildren } from "@/modules/shop/service/shop.taxonomy.api";

import ProductCardSubcat from "@/modules/shop/components/shop/ProductCardSubcat.vue";
import ShopCategoryFilters from "@/modules/shop/components/shop/ShopCategoryFilters.vue";
import ShopSortSelect from "@/modules/shop/components/shop/ShopSortSelect.vue";
import ShopRouteRestoreOverlay from "@/modules/shop/components/ShopRouteRestoreOverlay.vue";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const err = ref("");
const isRestoringCategory = ref(false);

const parentId = computed(() => Number(route.params.id || 0));

const catsAll = ref([]);
const parent = computed(() => (catsAll.value || []).find((c) => Number(c.id) === parentId.value) || null);

const subcats = ref([]);
const selectedSubId = ref(null);

/* filtros */
const selectedBrands = ref([]);
const modelSelected = ref("");

/* sort */
const sortSelected = ref("relevance");

/* volumen */
const volumeMin = ref(null);
const volumeMax = ref(null);

/* pag */
const page = ref(1);
const limit = ref(24);
const total = ref(0);

const items = ref([]);

const pages = computed(() => {
  const t = Number(total.value || 0);
  const l = Number(limit.value || 24);
  return t ? Math.max(1, Math.ceil(t / l)) : 1;
});

const resultsLabelComputed = computed(() => `Productos (${Number(total.value || 0)})`);

/* ✅ scroll restore categoría */
const CATEGORY_SCROLL_KEY = "shop_category_scroll_y_v1";
const CATEGORY_SCROLL_PATH_KEY = "shop_category_scroll_path_v1";
const CATEGORY_RESTORE_LOCK_KEY = "shop_category_restore_pending_v1";

function saveCategoryScroll() {
  try {
    if (!route.path.startsWith("/shop/c/")) return;
    sessionStorage.setItem(CATEGORY_SCROLL_KEY, String(window.scrollY || 0));
    sessionStorage.setItem(CATEGORY_SCROLL_PATH_KEY, route.fullPath || "");
  } catch {}
}

function markCategoryRestorePending() {
  try {
    sessionStorage.setItem(CATEGORY_RESTORE_LOCK_KEY, "1");
  } catch {}
}

function clearCategoryRestorePending() {
  try {
    sessionStorage.removeItem(CATEGORY_RESTORE_LOCK_KEY);
  } catch {}
}

function shouldRestoreCategoryScroll() {
  try {
    return sessionStorage.getItem(CATEGORY_RESTORE_LOCK_KEY) === "1";
  } catch {
    return false;
  }
}

function getSavedCategoryScroll() {
  try {
    const savedPath = sessionStorage.getItem(CATEGORY_SCROLL_PATH_KEY) || "";
    const savedY = Number(sessionStorage.getItem(CATEGORY_SCROLL_KEY) || 0);
    if (savedPath !== (route.fullPath || "")) return 0;
    return Number.isFinite(savedY) ? savedY : 0;
  } catch {
    return 0;
  }
}

function forceCategoryScrollTopNow() {
  try {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  } catch {}
}

async function finishCategoryRestoreMask() {
  await new Promise((resolve) => setTimeout(resolve, 120));
  isRestoringCategory.value = false;
}

async function restoreCategoryScrollIfNeeded() {
  if (!shouldRestoreCategoryScroll()) {
    isRestoringCategory.value = false;
    return;
  }

  const y = getSavedCategoryScroll();
  clearCategoryRestorePending();

  await nextTick();

  if (!y || y <= 0) {
    forceCategoryScrollTopNow();
    await finishCategoryRestoreMask();
    return;
  }

  const restore = () => {
    try {
      window.scrollTo({ top: y, left: 0, behavior: "auto" });
    } catch {}
  };

  restore();

  requestAnimationFrame(() => {
    restore();
    setTimeout(restore, 80);
    setTimeout(restore, 220);
    setTimeout(restore, 450);
    setTimeout(restore, 800);
  });

  await new Promise((resolve) => setTimeout(resolve, 260));
  await finishCategoryRestoreMask();
}

/* subcats */
async function fetchSubcats() {
  try {
    const kids = await getPublicCategoryChildren(parentId.value);
    subcats.value = Array.isArray(kids) ? kids : [];
  } catch {
    subcats.value = [];
  }
}

/* facets desde items (OJO: esto es SOLO de la página actual) */
function pickBrandName(p) {
  return p?.brand_name || p?.brand || p?.brandName || p?.marca || p?.manufacturer || "";
}
function pickModelName(p) {
  return p?.model_name || p?.model || p?.modelo || "";
}

const brandsFacet = computed(() => {
  const map = new Map();
  for (const p of items.value || []) {
    const b = String(pickBrandName(p) || "").trim();
    if (!b) continue;
    map.set(b, (map.get(b) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([k, c]) => ({ key: k, label: k, count: c }))
    .sort((a, b) => (b.count || 0) - (a.count || 0));
});

const modelsFacet = computed(() => {
  const map = new Map();
  for (const p of items.value || []) {
    const m = String(pickModelName(p) || "").trim();
    if (!m) continue;
    map.set(m, (map.get(m) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([k, c]) => ({ key: k, label: k, count: c }))
    .sort((a, b) => (b.count || 0) - (a.count || 0));
});

/* ====== QUERY SYNC (anti-propagación) ====== */
function normStr(v) {
  const s = String(v ?? "").trim();
  return s ? s : "";
}
function normNum(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function normArrCsv(v) {
  const s = normStr(v);
  return s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];
}

function readStateFromQuery() {
  // ✅ subcat
  selectedSubId.value = route.query.sub ? String(route.query.sub) : null;

  // ✅ brands/model
  selectedBrands.value = normArrCsv(route.query.brands);
  modelSelected.value = normStr(route.query.model);

  // ✅ volumen
  volumeMin.value = normNum(route.query.vmin);
  volumeMax.value = normNum(route.query.vmax);

  // ✅ sort/page
  sortSelected.value = normStr(route.query.sort) || "relevance";
  page.value = normNum(route.query.page) || 1;
}

/* helper para escribir query SIN basura */
let syncingQuery = false;

function setQuery(partial) {
  const q = { ...route.query, ...partial };

  // ✅ mata basura que se te “propaga”
  delete q.category_id;

  Object.keys(q).forEach((k) => {
    if (q[k] === null || q[k] === undefined || q[k] === "") delete q[k];
  });

  syncingQuery = true;
  router
    .replace({ name: route.name, params: route.params, query: q })
    .finally(() => {
      setTimeout(() => (syncingQuery = false), 0);
    });
}

/* handlers */
function selectSub(idOrNull) {
  selectedSubId.value = idOrNull == null ? null : String(idOrNull);

  // ✅ al cambiar subcat, limpiar modelo viejo
  modelSelected.value = "";
  page.value = 1;

  setQuery({
    sub: selectedSubId.value == null ? null : String(selectedSubId.value),
    model: null,
    page: "1",
  });

  fetchCatalog();
}

function onBrands(arr) {
  selectedBrands.value = Array.isArray(arr) ? arr.map((x) => String(x)) : [];
  page.value = 1;

  setQuery({
    brands: selectedBrands.value.length ? selectedBrands.value.join(",") : null,
    page: "1",
  });

  fetchCatalog();
}

function onModel(v) {
  modelSelected.value = String(v || "");
  page.value = 1;

  setQuery({
    model: modelSelected.value ? modelSelected.value : null,
    page: "1",
  });

  fetchCatalog();
}

function onVolume({ min, max }) {
  volumeMin.value = min ?? null;
  volumeMax.value = max ?? null;
  page.value = 1;

  setQuery({
    vmin: volumeMin.value == null ? null : String(volumeMin.value),
    vmax: volumeMax.value == null ? null : String(volumeMax.value),
    page: "1",
  });

  fetchCatalog();
}

function clearAllFilters() {
  selectedSubId.value = null;
  selectedBrands.value = [];
  modelSelected.value = "";
  volumeMin.value = null;
  volumeMax.value = null;
  sortSelected.value = "relevance";
  page.value = 1;

  setQuery({
    sub: null,
    brands: null,
    model: null,
    vmin: null,
    vmax: null,
    sort: null,
    page: "1",
  });

  fetchCatalog();
}

/* catalog */
async function fetchCatalog() {
  loading.value = true;
  err.value = "";

  try {
    const isAll = selectedSubId.value == null;

    const params = {
      page: page.value,
      limit: limit.value,

      category_id: parentId.value,
      subcategory_id: isAll ? null : selectedSubId.value,
      include_children: isAll ? 1 : 0,

      // filtros server-side
      brands: selectedBrands.value?.length ? selectedBrands.value.join(",") : "",
      model: String(modelSelected.value || "").trim(),
      volume_min: volumeMin.value == null ? "" : Number(volumeMin.value),
      volume_max: volumeMax.value == null ? "" : Number(volumeMax.value),

      // sort
      sort: String(sortSelected.value || "relevance"),
    };

    const r = await getCatalog(params);

    items.value = Array.isArray(r?.items) ? r.items : [];
    total.value = Number(r?.total || 0);
  } catch {
    err.value = "No se pudo cargar el catálogo.";
    items.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

/* paging */
function nextPage() {
  if (page.value < pages.value) {
    page.value++;
    setQuery({ page: String(page.value) });
    fetchCatalog();
  }
}
function prevPage() {
  if (page.value > 1) {
    page.value--;
    setQuery({ page: String(page.value) });
    fetchCatalog();
  }
}

/* init */
onBeforeRouteLeave((to, from, next) => {
  try {
    if (from?.path.startsWith("/shop/c/") && to?.path !== from?.path) {
      saveCategoryScroll();
      markCategoryRestorePending();
    }
  } catch {}
  next();
});

onMounted(async () => {
  isRestoringCategory.value = true;

  catsAll.value = await getPublicCategoriesAll();
  readStateFromQuery();
  await fetchSubcats();
  await fetchCatalog();
  await restoreCategoryScrollIfNeeded();

  if (!shouldRestoreCategoryScroll()) {
    await finishCategoryRestoreMask();
  }

  window.addEventListener("scroll", saveCategoryScroll, { passive: true });
});

onBeforeUnmount(() => {
  saveCategoryScroll();
  window.removeEventListener("scroll", saveCategoryScroll);
});

/* ✅ cuando cambia la categoría (/shop/c/:id), reset TOTAL para evitar query “pegada” */
watch(
  () => parentId.value,
  async () => {
    // reset estado
    selectedSubId.value = null;
    selectedBrands.value = [];
    modelSelected.value = "";
    volumeMin.value = null;
    volumeMax.value = null;
    sortSelected.value = "relevance";
    page.value = 1;

    // limpia query “propagada”
    setQuery({
      sub: null,
      brands: null,
      model: null,
      vmin: null,
      vmax: null,
      sort: null,
      page: "1",
    });

    await fetchSubcats();
    await fetchCatalog();
  }
);

/* ✅ si cambia route.query (back/forward / navegación), sincroniza estado y recarga */
watch(
  () => route.query,
  () => {
    if (syncingQuery) return;
    readStateFromQuery();
    fetchCatalog();
  },
  { deep: true }
);

/* ✅ cuando cambia sort, actualiza URL y recarga */
watch(
  () => sortSelected.value,
  (v) => {
    page.value = 1;
    setQuery({ sort: v === "relevance" ? null : String(v), page: "1" });
    fetchCatalog();
  }
);
</script>

<style scoped>
.category-page { background: #f5f5f5; }

.section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 12px 44px;
}

.cat-layout{
  display:grid;
  grid-template-columns: 300px 1fr;
  gap:14px;
  align-items:start;
}

.cat-side{
  position: sticky;
  top: 12px;
  height: fit-content;
  min-width: 0 !important;
}

.cat-main{ min-width:0 !important; }

@media (max-width: 960px){
  .cat-layout{ grid-template-columns: 1fr; }
  .cat-side{ display:none; }
}

.cat-topbar{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:12px;
  margin-bottom:12px;
}

.cat-title{
  margin:0;
  font-size: 20px;
  line-height: 1.15;
  font-weight: 500;
  color:#0e2134;
}
.cat-count{
  margin-top:4px;
  font-size:12px;
  opacity:.7;
}

.product-grid{
  display:grid !important;
  gap:12px !important;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  max-width: 1060px;
  margin: 0 auto !important;
}

.product-grid .grid-item,
.product-grid .grid-item > *{
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
}

@media (max-width: 1100px){
  .product-grid{ grid-template-columns: repeat(3, minmax(0, 1fr)) !important; max-width: 900px; }
}
@media (max-width: 960px){
  .cat-topbar{ display:none; }
  .product-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)) !important; max-width: 640px; }
}

.pager{
  margin-top:18px;
  display:flex;
  justify-content:center;
  gap:12px;
}
.pager-text{ font-size:13px; opacity:.85; }
</style>