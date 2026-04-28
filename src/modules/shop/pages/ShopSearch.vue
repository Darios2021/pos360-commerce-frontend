<!-- src/modules/shop/pages/ShopSearch.vue -->
<template>
  <div class="srp" data-page="shop-search">
    <div class="srp-wrap">

      <!-- BREADCRUMB -->
      <nav class="srp-breadcrumb" aria-label="Navegación">
        <router-link :to="{ name: 'shopHome' }" class="srp-bc-link">Inicio</router-link>
        <span class="srp-bc-sep">›</span>
        <span class="srp-bc-cur">
          {{ q ? `Resultados para "${q}"` : "Búsqueda" }}
        </span>
      </nav>

      <!-- MOBILE: filtros + sort bar -->
      <div class="srp-mobile-bar">
        <button class="srp-filter-btn" type="button" @click="filterOpen = true">
          <v-icon size="16" start>mdi-tune-variant</v-icon>
          Filtros
          <span v-if="activeFilterCount > 0" class="srp-filter-badge">{{ activeFilterCount }}</span>
        </button>
        <div class="srp-mobile-sort">
          <ShopSortSelect v-model="sortSelected" :disabled="loading" />
        </div>
      </div>

      <!-- MAIN LAYOUT -->
      <div class="srp-layout">

        <!-- SIDEBAR (desktop) -->
        <aside class="srp-side">
          <ShopSearchFilters
            :loading="loading"
            :categories="catsFacet"
            :selected-cat-id="selectedCatId"
            :total-count="total"
            :brands="brandsFacet"
            :selected-brands="selectedBrands"
            :price-min="priceMin"
            :price-max="priceMax"
            :max-item-price="maxItemPrice"
            @update:selectedCatId="onCat"
            @update:selectedBrands="onBrands"
            @update:price="onPrice"
            @clearAll="clearAllFilters"
          />
        </aside>

        <!-- MAIN AREA -->
        <main class="srp-main">

          <!-- TOPBAR: título + sort -->
          <div class="srp-topbar">
            <div class="srp-topbar-left">
              <h1 class="srp-h1">
                <span class="srp-count">{{ total.toLocaleString("es-AR") }}</span>
                <template v-if="q">
                  resultados para <em class="srp-term">"{{ q }}"</em>
                </template>
                <template v-else>productos encontrados</template>
              </h1>
            </div>
            <div class="srp-topbar-right">
              <ShopSortSelect v-model="sortSelected" :disabled="loading" />
            </div>
          </div>

          <!-- CHIPS de filtros activos -->
          <div v-if="activeFilterCount > 0" class="srp-chips">
            <v-chip
              v-if="selectedCatId"
              closable
              color="primary"
              variant="tonal"
              size="small"
              @click:close="onCat(null)"
            >
              {{ catNameSelected }}
            </v-chip>
            <v-chip
              v-for="b in selectedBrands"
              :key="b"
              closable
              color="primary"
              variant="tonal"
              size="small"
              @click:close="removeBrand(b)"
            >
              {{ b }}
            </v-chip>
            <v-chip
              v-if="priceMin !== null || priceMax !== null"
              closable
              color="primary"
              variant="tonal"
              size="small"
              @click:close="onPrice({ min: null, max: null })"
            >
              Precio:
              {{ priceMin !== null ? `$${Number(priceMin).toLocaleString("es-AR")}` : "—" }}
              <template v-if="priceMin !== null && priceMax !== null"> – </template>
              {{ priceMax !== null ? `$${Number(priceMax).toLocaleString("es-AR")}` : "" }}
            </v-chip>
            <button class="srp-clear-all" type="button" @click="clearAllFilters">
              Limpiar todo
            </button>
          </div>

          <!-- ERROR -->
          <v-alert v-if="err" type="error" variant="tonal" class="mb-4">{{ err }}</v-alert>

          <!-- SKELETONS -->
          <div v-if="loading" class="srp-grid">
            <div v-for="n in 12" :key="n" class="srp-grid-item">
              <v-skeleton-loader type="image, article" />
            </div>
          </div>

          <!-- EMPTY STATE -->
          <div v-else-if="!items.length" class="srp-empty">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-magnify-close</v-icon>
            <div class="srp-empty-title">Sin resultados</div>
            <div class="srp-empty-sub">
              <template v-if="q">
                No encontramos productos para <strong>"{{ q }}"</strong>
                <template v-if="activeFilterCount > 0"> con los filtros seleccionados.</template>
                <template v-else>.</template>
              </template>
              <template v-else>No hay productos disponibles.</template>
            </div>
            <div class="srp-empty-tips">
              <p>Sugerencias:</p>
              <ul>
                <li>Revisá la ortografía de tu búsqueda</li>
                <li>Usá palabras más generales</li>
                <li>Buscá por categoría o marca</li>
              </ul>
            </div>
            <v-btn v-if="activeFilterCount > 0" variant="tonal" color="primary" class="mt-4" @click="clearAllFilters">
              Quitar filtros aplicados
            </v-btn>
          </div>

          <!-- GRILLA DE PRODUCTOS -->
          <div v-else class="srp-grid">
            <div v-for="p in items" :key="p.product_id ?? p.id" class="srp-grid-item">
              <ProductCardSubcat :p="p" />
            </div>
          </div>

          <!-- PAGINACIÓN -->
          <div v-if="pages > 1" class="srp-pager">
            <v-btn
              variant="tonal"
              :disabled="page <= 1 || loading"
              prepend-icon="mdi-chevron-left"
              @click="prevPage"
            >
              Anterior
            </v-btn>
            <div class="srp-pager-info">
              <span class="srp-pager-page">{{ page }}</span>
              <span class="srp-pager-sep"> / </span>
              <span class="srp-pager-total">{{ pages }}</span>
            </div>
            <v-btn
              variant="tonal"
              :disabled="page >= pages || loading"
              append-icon="mdi-chevron-right"
              @click="nextPage"
            >
              Siguiente
            </v-btn>
          </div>
        </main>
      </div>
    </div>

    <!-- DIALOG DE FILTROS (mobile) -->
    <v-dialog v-model="filterOpen" fullscreen transition="dialog-bottom-transition" scrollable>
      <v-card>
        <v-toolbar color="surface" density="comfortable" border="b">
          <v-btn icon @click="filterOpen = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title class="font-weight-bold text-body-1">Filtros</v-toolbar-title>
          <v-spacer />
          <v-btn variant="text" color="error" @click="clearAllFilters">Limpiar</v-btn>
        </v-toolbar>

        <v-card-text class="pa-4">
          <ShopSearchFilters
            :loading="loading"
            :categories="catsFacet"
            :selected-cat-id="selectedCatId"
            :total-count="total"
            :brands="brandsFacet"
            :selected-brands="selectedBrands"
            :price-min="priceMin"
            :price-max="priceMax"
            :max-item-price="maxItemPrice"
            @update:selectedCatId="onCatMobile"
            @update:selectedBrands="onBrandsMobile"
            @update:price="onPriceMobile"
            @clearAll="clearAllFilters"
          />
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-btn
            block
            color="primary"
            variant="flat"
            size="large"
            rounded="xl"
            @click="applyMobileFilters"
          >
            Ver {{ total.toLocaleString("es-AR") }} resultados
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getCatalog } from "@/modules/shop/service/shop.public.api";

import ProductCardSubcat from "@/modules/shop/components/shop/ProductCardSubcat.vue";
import ShopSortSelect from "@/modules/shop/components/shop/ShopSortSelect.vue";
import ShopSearchFilters from "@/modules/shop/components/shop/ShopSearchFilters.vue";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const err = ref("");
const filterOpen = ref(false);

const items = ref([]);
const total = ref(0);
const page = ref(1);
const limit = ref(24);

const q = computed(() => String(route.query.q || "").trim());

const selectedCatId = ref(null);
const selectedBrands = ref([]);
const priceMin = ref(null);
const priceMax = ref(null);
const sortSelected = ref("relevance");

// Acumuladores para cambios en el drawer móvil (se aplican al cerrar)
const mobilePendingCatId = ref(null);
const mobilePendingBrands = ref([]);
const mobilePendingPriceMin = ref(null);
const mobilePendingPriceMax = ref(null);

// ── Facets: desde Meilisearch (todo el catálogo) o calculados desde la página ─
const apiFacetsBrands = ref([]);  // llegan del backend cuando usa Meilisearch
const apiFacetsCats   = ref([]);
const relaxedQuery    = ref(null); // cuando la búsqueda fue relajada (ej: "cargador celular" → "cargador")

const brandsFacet = computed(() => {
  if (apiFacetsBrands.value.length) return apiFacetsBrands.value;
  // fallback: calcular desde items de la página actual
  const map = new Map();
  for (const p of items.value) {
    const b = String(p?.brand_name || p?.brand || p?.brandName || "").trim();
    if (!b) continue;
    map.set(b, (map.get(b) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([k, c]) => ({ key: k, label: k, count: c }))
    .sort((a, b) => b.count - a.count);
});

const catsFacet = computed(() => {
  if (apiFacetsCats.value.length) return apiFacetsCats.value;
  // fallback: calcular desde items de la página actual
  const map = new Map();
  for (const p of items.value) {
    const id = String(p?.category_id ?? "").trim();
    const name = String(p?.category_name ?? "").trim();
    if (!id || !name) continue;
    if (!map.has(id)) map.set(id, { key: id, label: name, count: 0 });
    map.get(id).count++;
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
});

const catNameSelected = computed(() => {
  if (!selectedCatId.value) return "";
  const found = catsFacet.value.find((c) => String(c.key) === String(selectedCatId.value));
  return found?.label || String(selectedCatId.value);
});

const pages = computed(() => {
  const t = Number(total.value || 0);
  return t ? Math.max(1, Math.ceil(t / limit.value)) : 1;
});

const maxItemPrice = computed(() => {
  if (!items.value.length) return null;
  const prices = items.value
    .map(p => Number(p?.price ?? p?.sale_price ?? p?.regular_price ?? 0))
    .filter(v => Number.isFinite(v) && v > 0);
  return prices.length ? Math.max(...prices) : null;
});

const activeFilterCount = computed(() => {
  let n = 0;
  if (selectedCatId.value) n++;
  n += selectedBrands.value.length;
  if (priceMin.value !== null || priceMax.value !== null) n++;
  return n;
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function normNum(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function normArrCsv(v) {
  const s = String(v ?? "").trim();
  return s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];
}

function readStateFromQuery() {
  page.value = normNum(route.query.page) || 1;
  sortSelected.value = String(route.query.sort || "relevance");
  selectedCatId.value = route.query.cat ? String(route.query.cat) : null;
  selectedBrands.value = normArrCsv(route.query.brands);
  priceMin.value = normNum(route.query.pmin);
  priceMax.value = normNum(route.query.pmax);
}

let syncingQuery = false;

function setQuery(partial) {
  const nq = { ...route.query, ...partial };
  Object.keys(nq).forEach((k) => {
    if (nq[k] === null || nq[k] === undefined || nq[k] === "") delete nq[k];
  });
  syncingQuery = true;
  router
    .replace({ name: route.name, query: nq })
    .finally(() => setTimeout(() => (syncingQuery = false), 0));
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchResults() {
  loading.value = true;
  err.value = "";
  try {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch {}

  try {
    const r = await getCatalog({
      search: q.value || "",
      category_id: selectedCatId.value || null,
      brands: selectedBrands.value.length ? selectedBrands.value.join(",") : "",
      price_min: priceMin.value,
      price_max: priceMax.value,
      sort: sortSelected.value !== "relevance" ? sortSelected.value : "",
      page: page.value,
      limit: limit.value,
    });
    items.value = Array.isArray(r?.items) ? r.items : [];
    total.value = Number(r?.total || 0);
    apiFacetsBrands.value = Array.isArray(r?.brandsFacet) ? r.brandsFacet : [];
    apiFacetsCats.value   = Array.isArray(r?.catsFacet)   ? r.catsFacet   : [];
    relaxedQuery.value    = r?.relaxed_query || null;
  } catch {
    err.value = "No se pudo cargar los resultados. Intentá de nuevo.";
    items.value = [];
    total.value = 0;
    apiFacetsBrands.value = [];
    apiFacetsCats.value   = [];
    relaxedQuery.value    = null;
  } finally {
    loading.value = false;
  }
}

// ── Handlers desktop ──────────────────────────────────────────────────────────
function onCat(id) {
  selectedCatId.value = id ? String(id) : null;
  page.value = 1;
  setQuery({ cat: selectedCatId.value || null, page: "1" });
  fetchResults();
}

function onBrands(arr) {
  selectedBrands.value = Array.isArray(arr) ? arr.map(String) : [];
  page.value = 1;
  setQuery({ brands: selectedBrands.value.join(",") || null, page: "1" });
  fetchResults();
}

function removeBrand(brand) {
  onBrands(selectedBrands.value.filter((b) => b !== brand));
}

function onPrice({ min, max }) {
  priceMin.value = min;
  priceMax.value = max;
  page.value = 1;
  setQuery({
    pmin: min !== null ? String(min) : null,
    pmax: max !== null ? String(max) : null,
    page: "1",
  });
  fetchResults();
}

function clearAllFilters() {
  selectedCatId.value = null;
  selectedBrands.value = [];
  priceMin.value = null;
  priceMax.value = null;
  sortSelected.value = "relevance";
  page.value = 1;
  setQuery({ cat: null, brands: null, pmin: null, pmax: null, sort: null, page: "1" });
  fetchResults();
  filterOpen.value = false;
}

// ── Handlers móvil (se acumulan, se aplican al cerrar el drawer) ──────────────
function onCatMobile(id) {
  mobilePendingCatId.value = id ? String(id) : null;
}
function onBrandsMobile(arr) {
  mobilePendingBrands.value = Array.isArray(arr) ? arr.map(String) : [];
}
function onPriceMobile({ min, max }) {
  mobilePendingPriceMin.value = min;
  mobilePendingPriceMax.value = max;
}
function applyMobileFilters() {
  selectedCatId.value = mobilePendingCatId.value;
  selectedBrands.value = mobilePendingBrands.value;
  priceMin.value = mobilePendingPriceMin.value;
  priceMax.value = mobilePendingPriceMax.value;
  page.value = 1;
  setQuery({
    cat: selectedCatId.value || null,
    brands: selectedBrands.value.join(",") || null,
    pmin: priceMin.value !== null ? String(priceMin.value) : null,
    pmax: priceMax.value !== null ? String(priceMax.value) : null,
    page: "1",
  });
  filterOpen.value = false;
  fetchResults();
}

// Sync pending state when drawer opens
watch(filterOpen, (open) => {
  if (!open) return;
  mobilePendingCatId.value = selectedCatId.value;
  mobilePendingBrands.value = [...selectedBrands.value];
  mobilePendingPriceMin.value = priceMin.value;
  mobilePendingPriceMax.value = priceMax.value;
});

// ── Paginación ────────────────────────────────────────────────────────────────
function nextPage() {
  if (page.value < pages.value) {
    page.value++;
    setQuery({ page: String(page.value) });
    fetchResults();
  }
}
function prevPage() {
  if (page.value > 1) {
    page.value--;
    setQuery({ page: String(page.value) });
    fetchResults();
  }
}

// ── Watchers ──────────────────────────────────────────────────────────────────
watch(
  () => route.query.q,
  () => {
    if (syncingQuery) return;
    // nueva búsqueda → resetear todos los filtros
    selectedCatId.value = null;
    selectedBrands.value = [];
    priceMin.value = null;
    priceMax.value = null;
    sortSelected.value = "relevance";
    page.value = 1;
    fetchResults();
  }
);

watch(
  () => sortSelected.value,
  (v) => {
    page.value = 1;
    setQuery({ sort: v !== "relevance" ? v : null, page: "1" });
    fetchResults();
  }
);

watch(
  () => route.query,
  () => {
    if (syncingQuery) return;
    readStateFromQuery();
    fetchResults();
  },
  { deep: true }
);

onMounted(() => {
  readStateFromQuery();
  fetchResults();
});
</script>

<style scoped>
.srp {
  background: #f5f5f5;
  min-height: 100vh;
}
.srp-wrap {
  max-width: 1260px;
  margin: 0 auto;
  padding: 14px 14px 56px;
}

/* ── BREADCRUMB ── */
.srp-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.srp-bc-link {
  color: #3483fa;
  text-decoration: none;
  font-weight: 400;
}
.srp-bc-link:hover { text-decoration: underline; }
.srp-bc-sep { opacity: 0.45; }
.srp-bc-cur { opacity: 0.7; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── MOBILE BAR ── */
.srp-mobile-bar {
  display: none;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.srp-filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1.5px solid rgba(0, 0, 0, 0.18);
  border-radius: 999px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 400;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.srp-filter-badge {
  background: #3483fa;
  color: #fff;
  font-size: 10px;
  font-weight: 500;
  border-radius: 999px;
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  margin-left: 2px;
}
.srp-mobile-sort { flex: 1; min-width: 140px; }

/* ── LAYOUT ── */
.srp-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  align-items: start;
}
.srp-side {
  position: sticky;
  top: 14px;
  height: fit-content;
}

/* ── TOPBAR ── */
.srp-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.srp-h1 {
  margin: 0;
  font-size: 17px;
  font-weight: 400;
  line-height: 1.35;
  color: #444;
}
.srp-count { font-weight: 500; color: #111; }
.srp-term { font-style: normal; font-weight: 400; color: #111; }

/* ── RELAXED QUERY NOTICE ── */
.srp-relaxed-notice {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff8e1;
  border: 1px solid #ffe082;
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #5d4037;
}
.srp-relaxed-icon { color: #f9a825; flex-shrink: 0; }

/* ── CHIPS ── */
.srp-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.srp-clear-all {
  border: 0;
  background: transparent;
  color: #3483fa;
  font-size: 12px;
  font-weight: 400;
  cursor: pointer;
  padding: 0 4px;
  text-decoration: underline;
}

/* ── GRID ── */
.srp-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.srp-grid-item { min-width: 0; }

/* ── EMPTY ── */
.srp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 64px 24px;
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.srp-empty-title {
  font-size: 22px;
  font-weight: 500;
  color: #222;
  margin-bottom: 8px;
}
.srp-empty-sub {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}
.srp-empty-tips {
  font-size: 13px;
  color: #888;
  text-align: left;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
  padding: 14px 20px;
  margin-top: 8px;
}
.srp-empty-tips p { font-weight: 400; margin-bottom: 6px; }
.srp-empty-tips ul { margin: 0; padding-left: 18px; }
.srp-empty-tips li { margin-bottom: 4px; }

/* ── PAGINACIÓN ── */
.srp-pager {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}
.srp-pager-info {
  font-size: 13px;
  color: #555;
  min-width: 80px;
  text-align: center;
}
.srp-pager-page { font-weight: 500; font-size: 15px; color: #111; }

/* ── RESPONSIVE ── */
@media (max-width: 1100px) {
  .srp-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 960px) {
  .srp-layout { grid-template-columns: 1fr; }
  .srp-side { display: none; }
  .srp-mobile-bar { display: flex; }
  .srp-topbar { display: none; }
  .srp-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 480px) {
  .srp-wrap { padding: 10px 10px 48px; }
  .srp-grid { gap: 8px; }
}
</style>
