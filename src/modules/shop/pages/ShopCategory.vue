<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/pages/ShopCategory.vue -->
<template>
  <div class="category-page" data-page="shop-category-v2">
    <section class="section">
      <!-- HEADER -->
      <div class="section-head">
        <div class="head-left">
          <h1 class="section-title">{{ parent?.name || "Categoría" }}</h1>

          <!-- BUSCADOR LOCAL -->
          <div class="controls-row">
            <ShopSearchBar
              v-model="searchText"
              :loading="loading"
              placeholder="Buscar dentro de la categoría…"
              :show-count="true"
              :count-label="resultsLabel"
              :show-button="false"
              @search="applySearch"
              @clear="clearSearch"
              class="search-fix"
            />
          </div>

          <!-- SUBCATEGORÍAS -->
          <div v-if="subcats.length" class="subcats-row">
            <v-chip
              size="small"
              :variant="selectedSubId === null ? 'flat' : 'tonal'"
              color="primary"
              @click="selectSub(null)"
            >
              Todos
            </v-chip>

            <v-chip
              v-for="s in subcats"
              :key="s.id"
              size="small"
              :variant="selectedSubId === Number(s.id) ? 'flat' : 'tonal'"
              color="primary"
              @click="selectSub(Number(s.id))"
              :title="s.name"
            >
              {{ s.name }}
            </v-chip>
          </div>
        </div>
      </div>

      <!-- ERROR -->
      <v-alert v-if="err" type="error" variant="tonal" class="mb-6">
        {{ err }}
      </v-alert>

      <!-- LOADING -->
      <div v-if="loading" class="product-grid">
        <div v-for="n in 12" :key="n">
          <v-skeleton-loader type="image, article" />
        </div>
      </div>

      <!-- EMPTY -->
      <v-alert v-else-if="!items.length" type="info" variant="tonal">
        No hay productos para mostrar con estos criterios.
      </v-alert>

      <!-- PRODUCTOS -->
      <div v-else class="product-grid">
        <!-- ✅ IMPORTANTE: usar el card de subcategorías (con flechas + fetch media público) -->
        <ProductCardSubcat v-for="p in items" :key="p.product_id" :p="p" />
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

      <!-- PROMOS AL FINAL -->
      <div class="promo-bottom">
        <PromoSlider v-if="promoItems.length" :items="promoItems" @seeAll="fetchCatalog" />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { getCatalog } from "@/modules/shop/service/shop.public.api";
import { getPublicCategoriesAll, getPublicCategoryChildren } from "@/modules/shop/service/shop.taxonomy.api";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";

import PromoSlider from "@/modules/shop/components/PromoSlider.vue";
import ProductCardSubcat from "@/modules/shop/components/shop/ProductCardSubcat.vue"; // ✅ RUTA DEL COMPONENTE NUEVO
import ShopSearchBar from "@/modules/shop/components/ShopSearchBar.vue";

const route = useRoute();
const router = useRouter();
const cart = useShopCartStore();

const loading = ref(false);
const err = ref("");

const parentId = computed(() => Number(route.params.id || 0));

const catsAll = ref([]);
const parent = computed(() => (catsAll.value || []).find((c) => Number(c.id) === parentId.value) || null);

const subcats = ref([]);
const selectedSubId = ref(null);

/* buscador local */
const searchText = ref("");

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

const resultsLabel = computed(() => {
  const t = Number(total.value || 0);
  if (!t && !loading.value) return "Productos (0)";
  return `Productos (${t})`;
});

function addToCart(p) {
  cart.add(p, 1);
}

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

/* SUBCATEGORÍAS */
async function fetchSubcats() {
  try {
    const kids = await getPublicCategoryChildren(parentId.value);
    subcats.value = Array.isArray(kids) ? kids : [];
  } catch {
    subcats.value = [];
  }
}

/* QUERY (solo sub + page, NO q) */
function setQuery(partial) {
  const q = { ...route.query, ...partial };
  Object.keys(q).forEach((k) => {
    if (!q[k]) delete q[k];
  });
  router.replace({ name: route.name, params: route.params, query: q });
}

function selectSub(idOrNull) {
  selectedSubId.value = idOrNull == null ? null : Number(idOrNull);
  page.value = 1;
  setQuery({
    sub: selectedSubId.value == null ? null : String(selectedSubId.value),
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

/* CATÁLOGO */
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
      in_stock: 0,
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

/* PAGINACIÓN */
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

/* INIT */
onMounted(async () => {
  catsAll.value = await getPublicCategoriesAll();
  selectedSubId.value = route.query.sub ? Number(route.query.sub) : null;
  await fetchSubcats();
  await fetchCatalog();
});

/* debounce buscador */
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

.section-head {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 14px;
}

.section-title {
  font-size: 28px;
  font-weight: 900;
  margin: 0;
}

/* BUSCADOR */
.controls-row {
  width: 100%;
  margin-bottom: 10px;
}
.search-fix {
  width: 100%;
  max-width: 560px;
}
:deep(.search-fix input) {
  font-size: 13px;
}
:deep(.search-fix input::placeholder) {
  font-size: 12.5px;
  opacity: 0.75;
}

/* CHIPS */
.subcats-row {
  display: flex;
  gap: 10px;
  max-width: 100%;
  margin-top: 6px;
  margin-bottom: 14px;
}
.subcats-row :deep(.v-chip) {
  height: 32px;
  padding: 0 14px;
  font-size: 12.5px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ✅ GRID FORZADO (por si algo global te pisa) */
.category-page[data-page="shop-category-v2"] .product-grid {
  display: grid !important;
  gap: 16px !important;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
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
  .subcats-row {
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 8px;
    margin-top: 8px;
    margin-bottom: 16px;
  }
  .subcats-row::-webkit-scrollbar {
    height: 0;
  }
  .subcats-row :deep(.v-chip) {
    height: 34px;
    padding: 0 16px;
    font-size: 12px;
    border-radius: 999px;
  }

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
