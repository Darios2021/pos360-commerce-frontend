<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/pages/ShopCategory.vue -->
<template>
  <div class="category-page" data-page="shop-category-v2">
    <section class="section">
      <div class="cat-layout">
        <!-- LEFT: filtros -->
        <aside class="cat-side">
          <ShopCategoryFilters
            :loading="loading"
            :subcats="subcats"
            :selected-sub-id="selectedSubId"
            :in-stock-only="inStockOnly"
            :brands="brandsFacet"
            :selected-brands="selectedBrands"
            :models="modelsFacet"
            :model="modelSelected"
            :volume-min="volumeMin"
            :volume-max="volumeMax"
            @update:inStockOnly="onToggleStock"
            @selectSub="selectSub"
            @update:selectedBrands="onBrands"
            @update:model="onModel"
            @update:volume="onVolume"
            @clearAll="clearAllFilters"
          />
        </aside>

        <!-- RIGHT -->
        <main class="cat-main">
          <div class="cat-topbar">
            <div class="cat-top-left">
              <h1 class="cat-title">{{ parent?.name || "Categoría" }}</h1>
              <div class="cat-count">{{ resultsLabelComputed }}</div>
            </div>

            <div class="cat-top-right">
              <div class="cat-search">
                <v-text-field
                  v-model="searchText"
                  density="compact"
                  variant="outlined"
                  rounded="lg"
                  placeholder="Buscar en la categoría…"
                  hide-details
                  :disabled="loading"
                  @keyup.enter="applySearch"
                />
                <v-btn icon variant="tonal" rounded="lg" :disabled="loading" @click="applySearch">
                  <v-icon icon="mdi-magnify" />
                </v-btn>
                <v-btn
                  icon
                  variant="text"
                  rounded="lg"
                  :disabled="loading || !searchText"
                  @click="clearSearch"
                >
                  <v-icon icon="mdi-close" />
                </v-btn>
              </div>

              <v-btn variant="text" rounded="lg" :disabled="loading" @click="clearAllFilters">
                Limpiar todo
              </v-btn>
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
          <v-alert v-else-if="!filteredItems.length" type="info" variant="tonal">
            No hay productos para mostrar con estos criterios.
          </v-alert>

          <!-- ✅ PRODUCTOS -->
          <div v-else class="product-grid">
            <div v-for="p in filteredItems" :key="p.product_id" class="grid-item">
              <ProductCardSubcat :p="p" />
            </div>
          </div>

          <!-- PAGINACIÓN -->
          <div v-if="pages > 1" class="pager">
            <v-btn variant="tonal" :disabled="page <= 1 || loading" @click="prevPage">
              Anterior
            </v-btn>
            <div class="pager-text">Página {{ page }} / {{ pages }}</div>
            <v-btn variant="tonal" :disabled="page >= pages || loading" @click="nextPage">
              Siguiente
            </v-btn>
          </div>

          <div class="promo-bottom">
            <PromoSlider v-if="promoItems.length" :items="promoItems" @seeAll="fetchCatalog" />
          </div>
        </main>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { getCatalog } from "@/modules/shop/service/shop.public.api";
import { getPublicCategoriesAll, getPublicCategoryChildren } from "@/modules/shop/service/shop.taxonomy.api";

import PromoSlider from "@/modules/shop/components/PromoSlider.vue";
import ProductCardSubcat from "@/modules/shop/components/shop/ProductCardSubcat.vue";
import ShopCategoryFilters from "@/modules/shop/components/shop/ShopCategoryFilters.vue";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const err = ref("");

const parentId = computed(() => Number(route.params.id || 0));

const catsAll = ref([]);
const parent = computed(() => (catsAll.value || []).find((c) => Number(c.id) === parentId.value) || null);

const subcats = ref([]);
const selectedSubId = ref(null);

/* filtros */
const searchText = ref("");
const inStockOnly = ref(route.query.stock === "1");

/* marca + modelo */
const selectedBrands = ref(route.query.brands ? String(route.query.brands).split(",").filter(Boolean) : []);
const modelSelected = ref(route.query.model ? String(route.query.model) : "");

/* volumen */
const volumeMin = ref(route.query.vmin ? Number(route.query.vmin) : null);
const volumeMax = ref(route.query.vmax ? Number(route.query.vmax) : null);

/* pag */
const page = ref(Number(route.query.page || 1));
const limit = ref(24);
const total = ref(0);

const items = ref([]);
const promoItems = ref([]);

let searchTimer = null;

const pages = computed(() => {
  const t = Number(total.value || 0);
  const l = Number(limit.value || 24);
  return t ? Math.max(1, Math.ceil(t / l)) : 1;
});

function toNum(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function buildPromo(arr) {
  const a = Array.isArray(arr) ? arr : [];
  const promos = a.filter((p) => {
    const disc = toNum(p.price_discount);
    return Boolean(p.is_promo) || Boolean(p.is_new) || disc > 0;
  });
  return (promos.length ? promos : a).slice(0, 18);
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

/* facets marca */
function pickBrandName(p) {
  return p?.brand_name || p?.brand || p?.brandName || p?.marca || p?.manufacturer || "";
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

/* ✅ facets modelo (para el SELECT) */
function pickModelName(p) {
  return p?.model_name || p?.model || p?.modelo || "";
}
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

/* filtro client-side */
const filteredItems = computed(() => {
  let arr = Array.isArray(items.value) ? items.value : [];

  if (selectedBrands.value?.length) {
    const set = new Set(selectedBrands.value.map((x) => String(x)));
    arr = arr.filter((p) => set.has(String(pickBrandName(p) || "")));
  }

  if (String(modelSelected.value || "").trim()) {
    const mk = String(modelSelected.value || "").trim();
    arr = arr.filter((p) => String(pickModelName(p) || "").trim() === mk);
  }

  return arr;
});

const resultsLabelComputed = computed(() => `Productos (${filteredItems.value.length || 0})`);

/* query helper */
function setQuery(partial) {
  const q = { ...route.query, ...partial };
  Object.keys(q).forEach((k) => {
    if (q[k] === null || q[k] === undefined || q[k] === "") delete q[k];
  });
  router.replace({ name: route.name, params: route.params, query: q });
}

/* handlers */
function selectSub(idOrNull) {
  selectedSubId.value = idOrNull == null ? null : String(idOrNull);
  page.value = 1;
  setQuery({ sub: selectedSubId.value == null ? null : String(selectedSubId.value), page: "1" });
  fetchCatalog();
}
function onToggleStock(v) {
  inStockOnly.value = !!v;
  page.value = 1;
  setQuery({ stock: inStockOnly.value ? "1" : null, page: "1" });
  fetchCatalog();
}
function onBrands(arr) {
  selectedBrands.value = Array.isArray(arr) ? arr.map(String) : [];
  page.value = 1;
  setQuery({ brands: selectedBrands.value.length ? selectedBrands.value.join(",") : null, page: "1" });
  fetchCatalog();
}
function onModel(v) {
  modelSelected.value = String(v || "");
  page.value = 1;
  setQuery({ model: modelSelected.value ? modelSelected.value : null, page: "1" });
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
function applySearch() {
  page.value = 1;
  setQuery({ page: "1" });
  fetchCatalog();
}
function clearSearch() {
  searchText.value = "";
  applySearch();
}
function clearAllFilters() {
  searchText.value = "";
  selectedSubId.value = null;
  inStockOnly.value = false;
  selectedBrands.value = [];
  modelSelected.value = "";
  volumeMin.value = null;
  volumeMax.value = null;
  page.value = 1;
  setQuery({ sub: null, stock: null, brands: null, model: null, vmin: null, vmax: null, page: "1" });
  fetchCatalog();
}

/* catalog */
async function fetchCatalog() {
  loading.value = true;
  err.value = "";
  try {
    const qStr = String(searchText.value || "").trim();
    const isAll = selectedSubId.value == null;

    const params = {
      page: page.value,
      limit: limit.value,
      search: qStr || "",
      category_id: parentId.value,
      subcategory_id: isAll ? null : selectedSubId.value,
      include_children: isAll ? 1 : 0,
      in_stock: inStockOnly.value ? 1 : 0,

      brand: selectedBrands.value?.length ? selectedBrands.value.join(",") : "",
      model: String(modelSelected.value || "").trim(),
      volume_min: volumeMin.value == null ? "" : Number(volumeMin.value),
      volume_max: volumeMax.value == null ? "" : Number(volumeMax.value),
    };

    const r = await getCatalog(params);
    items.value = Array.isArray(r?.items) ? r.items : [];
    total.value = Number(r?.total || 0);
    promoItems.value = buildPromo(items.value);
  } catch {
    err.value = "No se pudo cargar el catálogo.";
    items.value = [];
    promoItems.value = [];
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

onMounted(async () => {
  catsAll.value = await getPublicCategoriesAll();
  selectedSubId.value = route.query.sub ? String(route.query.sub) : null;
  await fetchSubcats();
  await fetchCatalog();
});

watch(
  () => searchText.value,
  () => {
    page.value = 1;
    setQuery({ page: "1" });
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(fetchCatalog, 350);
  }
);
</script>

<style scoped>
.category-page {
  background: #f5f5f5;
}
.section {
  max-width: 1300px;
  margin: 0 auto;
  padding: 18px 14px 48px;
}

/* layout */
.cat-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  align-items: start;
}
.cat-side {
  position: sticky;
  top: 12px;
  height: fit-content;
  min-width: 0 !important;
}
.cat-main {
  min-width: 0 !important; /* ✅ FIX “tira a la derecha” */
}
.section,
.cat-layout,
.cat-main {
  max-width: 100%;
  overflow-x: hidden;
}

@media (max-width: 960px) {
  .cat-layout {
    grid-template-columns: 1fr;
  }
  .cat-side {
    display: none;
  }
}

/* topbar */
.cat-topbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}
.cat-title {
  margin: 0;
  font-size: 22px;
  line-height: 1.15;
  font-weight: 900;
  color: #0e2134;
}
.cat-count {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.7;
}
.cat-top-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.cat-search {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 420px;
}
.cat-search :deep(.v-field) {
  background: #fff;
}
@media (max-width: 960px) {
  .cat-topbar {
    display: none;
  }
}

/* GRID */
.category-page[data-page="shop-category-v2"] .product-grid {
  display: grid !important;
  gap: 16px !important;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
}
.category-page[data-page="shop-category-v2"] .product-grid .grid-item {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  grid-column: span 1 !important;
}
.category-page[data-page="shop-category-v2"] .product-grid .grid-item > * {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
}

@media (min-width: 1500px) {
  .category-page[data-page="shop-category-v2"] .product-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
  }
}
@media (max-width: 1100px) {
  .category-page[data-page="shop-category-v2"] .product-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  }
}
@media (max-width: 960px) {
  .category-page[data-page="shop-category-v2"] .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 12px !important;
  }
}

.pager {
  margin-top: 22px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.promo-bottom {
  margin-top: 26px;
}
</style>
