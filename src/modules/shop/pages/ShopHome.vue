<template>
  <v-container fluid class="shop-page">
    <!-- ================= HERO FULL BLEED ================= -->
    <section class="hero-fullbleed">
      <div class="hero-wrap">
        <HeroSlider
          :slides="heroSlides"
          @goShop="scrollToProducts"
          @clickSlide="onHeroClick"
        />

        <!-- DESKTOP: cards superpuestas / MOBILE: no superpuesto -->
        <div class="hero-float" v-if="allCats.length">
          <HomeCategoryFloatRow :categories="allCats" :max="6" />
        </div>
      </div>
    </section>

    <!-- ================= CONTENIDO ================= -->
    <section class="content">
      <div class="after-hero-spacer"></div>

      <!-- PROMO -->
      <div class="mb-6">
        <PromoSlider
          :items="promoItems"
          :perPage="5"
          @seeAll="scrollToProducts"
        />
      </div>

      <!-- ancla invisible -->
      <div id="shop-products-top" ref="productsTop"></div>

      <!-- GRID -->
      <div v-if="loading && !items.length" class="product-grid">
        <div v-for="n in 12" :key="n">
          <v-skeleton-loader type="image, article" />
        </div>
      </div>

      <v-alert v-else-if="!items.length" type="info" variant="tonal">
        No hay productos para mostrar.
      </v-alert>

      <div v-else class="product-grid">
        <ProductCard
          v-for="p in items"
          :key="p.product_id"
          :p="p"
        />
      </div>

      <!-- ================= VER MÁS (ML STYLE) ================= -->
      <div v-if="canLoadMore" class="load-more-wrap">
        <v-btn
          color="primary"
          variant="tonal"
          size="large"
          :loading="loading"
          @click="loadMore"
        >
          Ver más productos
        </v-btn>
      </div>
    </section>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";

import { getCatalog } from "@/modules/shop/service/shop.public.api";
import { getPublicCategories } from "@/modules/shop/service/shop.taxonomy.api";

import HeroSlider from "@/modules/shop/components/HeroSlider.vue";
import HomeCategoryFloatRow from "@/modules/shop/components/HomeCategoryFloatRow.vue";
import PromoSlider from "@/modules/shop/components/PromoSlider.vue";
import ProductCard from "@/modules/shop/components/ProductCard.vue";

const route = useRoute();

const loading = ref(false);
const items = ref([]);
const total = ref(0);

const page = ref(1);
const limit = 24;

const allCats = ref([]);

/* ================= HERO ================= */
const heroSlides = [
  {
    pill: "OFERTAS",
    title: "Especial en Tecnología",
    subtitle: "Accesorios, audio, cables y más.",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=2400&q=80",
  },
  {
    pill: "NOVEDADES",
    title: "Gadgets y accesorios nuevos",
    subtitle: "Productos recién ingresados.",
    image:
      "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=2400&q=80",
  },
];

function onHeroClick() {
  scrollToProducts();
}

/* ================= QUERY ================= */
const q = computed(() => String(route.query.q || "").trim());
const category_id = computed(() =>
  route.query.category_id ? Number(route.query.category_id) : null
);
const subcategory_id = computed(() =>
  route.query.subcategory_id ? Number(route.query.subcategory_id) : null
);

/* ================= SCROLL ================= */
const productsTop = ref(null);
function scrollToProducts() {
  const el = productsTop.value;
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 90;
  window.scrollTo({ top: y, behavior: "smooth" });
}

/* ================= DATA ================= */
async function fetchCatalog({ append = false } = {}) {
  loading.value = true;
  try {
    const r = await getCatalog({
      search: q.value || "",
      page: page.value,
      limit,
      category_id: category_id.value,
      subcategory_id: subcategory_id.value,
    });

    const newItems = Array.isArray(r.items) ? r.items : [];
    total.value = Number(r.total || 0);

    items.value = append ? [...items.value, ...newItems] : newItems;
  } catch (e) {
    console.error("❌ fetchCatalog", e);
  } finally {
    loading.value = false;
  }
}

function loadMore() {
  page.value += 1;
  fetchCatalog({ append: true });
}

const canLoadMore = computed(() => {
  return items.value.length < total.value;
});

/* ================= PROMOS ================= */
const promoItems = computed(() => {
  return items.value.slice(0, 18);
});

/* ================= BOOTSTRAP ================= */
onMounted(async () => {
  await fetchCatalog();
  allCats.value = await getPublicCategories();
});

watch(
  () => route.query,
  async () => {
    page.value = 1;
    await fetchCatalog();
  }
);
</script>

<style scoped>
.shop-page {
  padding: 0;
  --shop-max: 1200px;
}

/* HERO */
.hero-fullbleed {
  width: 100vw;
  margin-left: calc(50% - 50vw);
  overflow: visible;
}
.hero-wrap {
  position: relative;
}

/* DESKTOP superpuesto */
.hero-float {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -165px;
  z-index: 20;
}
.after-hero-spacer {
  height: 205px;
}

/* CONTENT */
.content {
  width: min(var(--shop-max), calc(100% - 24px));
  margin: 0 auto;
}

/* GRID */
.product-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

@media (max-width: 1400px) {
  .product-grid { grid-template-columns: repeat(5, 1fr); }
}
@media (max-width: 1200px) {
  .product-grid { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 960px) {
  .hero-float {
    position: static;
    margin-top: 12px;
  }
  .after-hero-spacer { height: 0; }
  .product-grid { grid-template-columns: repeat(2, 1fr); }
}

/* VER MÁS */
.load-more-wrap {
  display: flex;
  justify-content: center;
  margin: 32px 0 20px;
}
</style>
