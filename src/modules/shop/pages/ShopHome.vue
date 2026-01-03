<!-- src/modules/shop/pages/ShopHome.vue -->
<template>
  <v-container fluid class="shop-page">
    <!-- ✅ HERO FULL-BLEED (100vw) -->
    <section class="hero-fullbleed">
      <div class="hero-bleed-inner">
        <div class="hero-wrap">
          <HeroSlider
            :slides="heroSlides"
            @goShop="scrollToProducts"
            @clickSlide="onHeroClick"
          />

          <!-- ✅ Cards centradas y más abajo (NO bloquean flechas) -->
          <div class="hero-float" v-if="allCats.length">
            <HomeCategoryFloatRow :categories="allCats" :max="6" />
          </div>
        </div>
      </div>
    </section>

    <!-- ✅ CONTENIDO CENTRADO (como ML) -->
    <section class="content">
      <div class="after-hero-spacer"></div>

      <!-- ✅ PROMO SLIDER -->
      <div class="mb-6">
        <PromoSlider
          :items="promoItems"
          :perPage="promoPerPage"
          @seeAll="scrollToProducts"
        />
      </div>

      <!-- ✅ CategoriesShowcase MÁS ABAJO (no en el hero) -->
      <div class="mb-8" v-if="parentCats.length">
        <CategoriesShowcase
          :items="parentCats"
          :perPage="6"
          @seeAll="goAllCategories"
        />
      </div>

      <!-- Productos -->
      <div
        id="shop-products-top"
        ref="productsTop"
        class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4"
      >
        <div class="d-flex align-center ga-2">
          <div class="text-h6 font-weight-black">{{ resultsTitle }}</div>
          <span class="text-caption text-medium-emphasis" v-if="total">({{ total }})</span>

          <v-chip
            v-if="activeChip"
            size="small"
            variant="tonal"
            color="primary"
            class="ml-2"
            :title="activeChip"
          >
            {{ activeChip }}
          </v-chip>
        </div>

        <div class="d-flex ga-2 align-center flex-wrap">
          <v-btn v-if="hasAnyFilter" variant="tonal" @click="clearAllFilters">
            Limpiar
          </v-btn>

          <v-btn variant="tonal" :loading="loading" @click="fetchCatalog">
            Actualizar
          </v-btn>

          <v-btn to="/shop/cart" color="primary" variant="tonal">
            Carrito ({{ cartCount }})
          </v-btn>
        </div>
      </div>

      <div v-if="loading" class="product-grid">
        <div v-for="n in 12" :key="n">
          <v-skeleton-loader type="image, article" />
        </div>
      </div>

      <v-alert v-else-if="!items.length" type="info" variant="tonal">
        No hay productos para mostrar con estos criterios.
      </v-alert>

      <!-- ✅ PRODUCT GRID con ProductCard.vue -->
      <div v-else class="product-grid">
        <ProductCard
          v-for="p in items"
          :key="p.product_id"
          :p="p"
          @add="addToCart"
        />
      </div>

      <div v-if="pages > 1" class="d-flex justify-center align-center ga-2 mt-6">
        <v-btn variant="tonal" :disabled="page <= 1 || loading" @click="prevPage">Anterior</v-btn>
        <div class="text-caption text-medium-emphasis">Página {{ page }} / {{ pages }}</div>
        <v-btn variant="tonal" :disabled="page >= pages || loading" @click="nextPage">Siguiente</v-btn>
      </div>
    </section>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { getCatalog } from "@/modules/shop/service/shop.public.api";
import { getPublicCategories } from "@/modules/shop/service/shop.taxonomy.api";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";

import HeroSlider from "@/modules/shop/components/HeroSlider.vue";
import HomeCategoryFloatRow from "@/modules/shop/components/HomeCategoryFloatRow.vue";
import PromoSlider from "@/modules/shop/components/PromoSlider.vue";
import CategoriesShowcase from "@/modules/shop/components/CategoriesShowcase.vue";
import ProductCard from "@/modules/shop/components/ProductCard.vue";

const route = useRoute();
const router = useRouter();
const cart = useShopCartStore();

const loading = ref(false);
const items = ref([]);

const page = ref(Number(route.query.page || 1));
const limit = ref(24);
const total = ref(0);

const allCats = ref([]);

/* query-driven filters */
const q = computed(() => String(route.query.q || "").trim());
const category_id = computed(() => (route.query.category_id ? Number(route.query.category_id) : null));
const subcategory_id = computed(() => (route.query.subcategory_id ? Number(route.query.subcategory_id) : null));

/* ✅ padres reales */
const parentCats = computed(() => {
  const arr = Array.isArray(allCats.value) ? allCats.value : [];
  return arr
    .filter((c) => c && (c.parent_id === null || c.parent_id === undefined))
    .filter((c) => Number(c.is_active ?? 1) === 1)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es"));
});

const pages = computed(() => {
  const t = Number(total.value || 0);
  const l = Number(limit.value || 24);
  return t ? Math.max(1, Math.ceil(t / l)) : 1;
});

const cartCount = computed(() => cart.count);

function toNum(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/* =========================
   HERO
   ========================= */
const heroSlides = ref([
  {
    pill: "OFERTAS",
    title: "Especial en Tecnología",
    subtitle: "Accesorios, audio, cables y más. Comprá online y elegí retiro al finalizar.",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=2400&q=80",
    action: { type: "scroll" },
  },
  {
    pill: "NOVEDADES",
    title: "Gadgets y accesorios nuevos",
    subtitle: "Descubrí productos recién ingresados en el catálogo.",
    image:
      "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=2400&q=80",
    action: { type: "scroll" },
  },
]);

function onHeroClick() {
  scrollToProducts();
}

/* =========================
   Header context
   ========================= */
const resultsTitle = computed(() => {
  if (q.value || category_id.value || subcategory_id.value) return "Resultados";
  return "Productos";
});
const activeChip = computed(() => {
  if (q.value) return `Buscar: ${q.value}`;
  if (subcategory_id.value) return `Subcategoría #${subcategory_id.value}`;
  if (category_id.value) return `Categoría #${category_id.value}`;
  return "";
});
const hasAnyFilter = computed(() => !!q.value || !!category_id.value || !!subcategory_id.value);

function clearAllFilters() {
  const nq = { ...route.query };
  delete nq.q;
  delete nq.category_id;
  delete nq.subcategory_id;
  nq.page = "1";
  router.replace({ path: "/shop", query: nq });
}

/* =========================
   Scroll
   ========================= */
const productsTop = ref(null);

function scrollToProducts() {
  const el = productsTop.value;
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 90;
  window.scrollTo({ top: y, behavior: "smooth" });
}

/* =========================
   Promo slider data (REAL)
   ========================= */
const promoPerPage = computed(() => 5);

const promoItems = computed(() => {
  const arr = Array.isArray(items.value) ? items.value : [];
  if (!arr.length) return [];

  const promos = arr.filter((p) => {
    const disc = toNum(p.price_discount);
    return Boolean(p.is_promo) || Boolean(p.is_new) || disc > 0;
  });

  const base = promos.length ? promos : arr;
  return base.slice(0, 18);
});

/* =========================
   Categories “see all”
   ========================= */
function goAllCategories() {
  scrollToProducts();
}

/* =========================
   Cart
   ========================= */
function addToCart(p) {
  cart.add(p, 1);
}

/* =========================
   Catalog
   ========================= */
async function fetchCatalog() {
  loading.value = true;
  try {
    const r = await getCatalog({
      search: q.value || "",
      page: page.value,
      limit: limit.value,
      category_id: category_id.value,
      subcategory_id: subcategory_id.value,
    });

    items.value = Array.isArray(r.items) ? r.items : [];
    total.value = Number(r.total || 0);
  } catch (e) {
    console.error("❌ fetchCatalog(Home)", e);
    items.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function syncQuery() {
  const nq = { ...route.query, page: String(page.value) };
  router.replace({ path: "/shop", query: nq });
}
function nextPage() {
  if (page.value < pages.value) {
    page.value += 1;
    syncQuery();
  }
}
function prevPage() {
  if (page.value > 1) {
    page.value -= 1;
    syncQuery();
  }
}

/* bootstrap */
onMounted(async () => {
  await fetchCatalog();
  try {
    allCats.value = await getPublicCategories();
  } catch (e) {
    console.error("❌ getPublicCategories(Home)", e);
    allCats.value = [];
  }
});

watch(
  () => route.query,
  () => {
    page.value = Number(route.query.page || 1);
    fetchCatalog();
  }
);
</script>

<style scoped>
.shop-page {
  padding-left: 0 !important;
  padding-right: 0 !important;
  --shop-max: 1200px;
}

.hero-fullbleed {
  width: 100vw;
  margin-left: calc(50% - 50vw);
}

.hero-wrap {
  position: relative;
  width: 100%;
}

/* float row del hero */
.hero-float {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -165px;
  z-index: 30;
  pointer-events: none;
}
.hero-float :deep(.float-inner) {
  pointer-events: auto;
  width: min(var(--shop-max), calc(100% - 24px));
  margin: 0 auto;
}

.after-hero-spacer { height: 205px; }

.content {
  width: min(var(--shop-max), calc(100% - 24px));
  margin: 0 auto;
  padding-bottom: 40px;
}

/* ✅ Grid homogéneo con ProductCard */
.product-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

@media (max-width: 1400px) {
  .product-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
}
@media (max-width: 1200px) {
  .shop-page { --shop-max: 1100px; }
  .product-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
@media (max-width: 960px) {
  .hero-float { bottom: -125px; }
  .after-hero-spacer { height: 165px; }
  .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 600px) {
  .hero-float { bottom: -110px; }
  .after-hero-spacer { height: 150px; }
  .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
