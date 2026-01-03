<!-- src/modules/shop/pages/ShopCategory.vue -->
<template>
  <div class="category-page">
    <section class="section">
      <!-- HEADER -->
      <div class="section-head">
        <div class="head-left">
          <h1 class="section-title">{{ parent?.name || "Categoría" }}</h1>

          <!-- ✅ CONTROLES: buscador + contador (componentizado) -->
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
            />
          </div>

          <!-- ✅ SUBRUBROS -->
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
              class="subchip"
            >
              {{ s.name }}
            </v-chip>
          </div>
        </div>

        <div class="head-right">
          <!-- mantenemos el botón "Buscar" como acción manual -->
          <v-btn variant="tonal" @click="applySearch" :loading="loading">Buscar</v-btn>
          <v-btn variant="tonal" to="/shop">Volver</v-btn>
        </div>
      </div>

      <!-- ERROR -->
      <v-alert v-if="err" type="error" variant="tonal" class="mb-6">
        {{ err }}
      </v-alert>

      <!-- PROMO -->
      <PromoSlider
        v-if="promoItems.length"
        :items="promoItems"
        class="mb-8"
        @seeAll="fetchCatalog"
      />

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
        <ProductCard v-for="p in items" :key="p.product_id" :p="p" @add="addToCart" />
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
import ProductCard from "@/modules/shop/components/ProductCard.vue";
import ShopSearchBar from "@/modules/shop/components/ShopSearchBar.vue";

const route = useRoute();
const router = useRouter();
const cart = useShopCartStore();

const loading = ref(false);
const err = ref("");

const parentId = computed(() => Number(route.params.id || 0));

const catsAll = ref([]);
const parent = computed(() => (catsAll.value || []).find((c) => Number(c.id) === parentId.value));

// ✅ subrubros (hijos) = categories.parent_id = parentId
const subcats = ref([]);

// ✅ selectedSubId = ID del HIJO. null => "Todos"
const selectedSubId = ref(null);

// buscador
const searchText = ref(String(route.query.q || ""));

// paginación
const page = ref(Number(route.query.page || 1));
const limit = ref(24);
const total = ref(0);

const items = ref([]);
const promoItems = ref([]);

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

/* =========================
   SUBRUBROS
   ========================= */
async function fetchSubcats() {
  try {
    const kids = await getPublicCategoryChildren(parentId.value);
    subcats.value = Array.isArray(kids) ? kids : [];
  } catch (e) {
    console.error("❌ fetchSubcats", e);
    subcats.value = [];
  }
}

/* =========================
   QUERY HELPERS
   ========================= */
function setQuery(partial) {
  const q = { ...route.query, ...partial };
  Object.keys(q).forEach((k) => {
    const v = q[k];
    if (v === null || v === undefined || v === "") delete q[k];
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
  setQuery({
    q: String(searchText.value || "").trim() || null,
    page: "1",
  });
  fetchCatalog();
}

function clearSearch() {
  searchText.value = "";
  applySearch();
}

/* =========================
   CATALOG (CONTRATO CORRECTO)
   - Todos: category_id = padre + include_children=1 + subcategory_id = null
   - Chip:  category_id = padre + subcategory_id = hijo + include_children=0
   ========================= */
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

      // ✅ padre SIEMPRE
      category_id: parentId.value,

      // ✅ hijo SOLO cuando hay chip
      subcategory_id: isAll ? null : selectedSubId.value,

      // ✅ "Todos" incluye hijos
      include_children: isAll ? 1 : 0,

      // mostrar todo (sin filtrar por stock)
      in_stock: 0,
    };

    const r = await getCatalog(params);

    items.value = Array.isArray(r.items) ? r.items : [];
    total.value = Number(r.total || 0);
    promoItems.value = buildPromo(items.value);
  } catch (e) {
    console.error("❌ fetchCatalog(ShopCategory)", e);
    err.value = "No se pudo cargar el catálogo para esta categoría.";
    items.value = [];
    promoItems.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

/* =========================
   PAGER
   ========================= */
function nextPage() {
  if (page.value < pages.value) {
    page.value += 1;
    setQuery({ page: String(page.value) });
    fetchCatalog();
  }
}
function prevPage() {
  if (page.value > 1) {
    page.value -= 1;
    setQuery({ page: String(page.value) });
    fetchCatalog();
  }
}

/* =========================
   BOOTSTRAP
   ========================= */
onMounted(async () => {
  catsAll.value = await getPublicCategoriesAll();

  selectedSubId.value = route.query.sub ? Number(route.query.sub) : null;
  searchText.value = String(route.query.q || "");
  page.value = Number(route.query.page || 1);

  await fetchSubcats();
  await fetchCatalog();
});

watch(
  () => parentId.value,
  async () => {
    selectedSubId.value = null;
    searchText.value = "";
    page.value = 1;

    setQuery({ sub: null, q: null, page: "1" });

    await fetchSubcats();
    await fetchCatalog();
  }
);

// back/forward / URL compartida
watch(
  () => route.query,
  async () => {
    selectedSubId.value = route.query.sub ? Number(route.query.sub) : null;
    searchText.value = String(route.query.q || "");
    page.value = Number(route.query.page || 1);
    await fetchCatalog();
  }
);
</script>

<style scoped>
.category-page { background: #f5f5f5; }

.section {
  max-width: 1300px;
  margin: 0 auto;
  padding: 26px 16px 48px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.head-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.head-right {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.section-title {
  font-size: 30px;
  font-weight: 950;
  margin: 0;
  letter-spacing: -0.4px;
}

.controls-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* ahora el ancho lo maneja ShopSearchBar internamente, pero lo dejamos por si querés mantener */
.search { width: 420px; max-width: 100%; }

.count {
  font-size: 13px;
  font-weight: 900;
  opacity: 0.75;
}

.subcats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 100%;
}
.subchip { max-width: 260px; }

.product-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

.pager {
  margin-top: 22px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}
.pager-text {
  font-size: 12px;
  opacity: 0.75;
  font-weight: 900;
}

@media (max-width: 1400px) { .product-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); } }
@media (max-width: 1200px) { .product-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
@media (max-width: 960px)  { .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
