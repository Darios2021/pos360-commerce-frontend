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

          <!-- ✅ FLOTANTE: DESKTOP cards / MOBILE pelotitas (lo maneja el componente) -->
          <div class="hero-float" v-if="allCats.length">
            <HomeCategoryFloatRow :categories="allCats" :max="6" />
          </div>
        </div>
      </div>
    </section>

    <!-- ✅ CONTENIDO CENTRADO (como ML) -->
    <section class="content">
      <div class="after-hero-spacer"></div>

      <!-- ✅ PROMO SLIDER (general) -->
      <div class="mb-6">
        <PromoSlider :items="promoItems" :perPage="promoPerPage" @seeAll="scrollToProducts" />
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
          <v-btn v-if="hasAnyFilter" variant="tonal" @click="clearAllFilters">Limpiar</v-btn>

          <v-btn variant="tonal" :loading="loading" @click="fetchCatalog({ append: false })">
            Actualizar
          </v-btn>

          <v-btn to="/shop/cart" color="primary" variant="tonal">
            Carrito ({{ cartCount }})
          </v-btn>
        </div>
      </div>

      <div v-if="loading && !items.length" class="product-grid">
        <div v-for="n in 12" :key="n">
          <v-skeleton-loader type="image, article" />
        </div>
      </div>

      <v-alert v-else-if="!loading && !items.length" type="info" variant="tonal">
        No hay productos para mostrar con estos criterios.
      </v-alert>

      <div v-else class="product-grid">
        <ProductCard v-for="p in items" :key="p.product_id ?? p.id" :p="p" />
      </div>

      <!-- ✅ Banner Parlantes: DESPUÉS de productos -->
      <div class="after-products-banner" v-if="!loading && items.length">
        <PromoBannerParlantes />
      </div>

      <!-- ✅ VER MÁS -->
      <div class="see-more-wrap" v-if="!loading && page < pages">
        <v-btn
          class="see-more-btn"
          color="primary"
          variant="flat"
          :loading="loadingMore"
          @click="loadMore"
        >
          Ver más productos
        </v-btn>
        <div class="see-more-hint text-caption text-medium-emphasis">
          Mostrando {{ items.length }} de {{ total }}
        </div>
      </div>

      <!-- ✅ PASARELA AURICULARES: ÚLTIMO LUGAR DEL HOME -->
      <div class="mt-6">
        <div v-if="aurisLoading" class="auris-skel">
          <v-skeleton-loader type="heading, image" />
        </div>

        <PromoSliderAuriculares
          v-else
          v-if="aurisItems.length"
          :items="aurisItems"
          :perPage="promoPerPage"
          :categoryId="AUDIO_CATEGORY_ID"
          :subIds="AURICULARES_SUB_IDS"
        />
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
import PromoSliderAuriculares from "@/modules/shop/components/PromoSliderAuriculares.vue";
import ProductCard from "@/modules/shop/components/ProductCard.vue";
import PromoBannerParlantes from "@/modules/shop/components/PromoBannerParlantes.vue";

const route = useRoute();
const router = useRouter();
const cart = useShopCartStore();

const loading = ref(false);
const loadingMore = ref(false);

const items = ref([]);
const page = ref(Number(route.query.page || 1));
const limit = ref(24);
const total = ref(0);
const allCats = ref([]);

/* ✅ IDs reales (AJUSTÁ ESTO) */
const AUDIO_CATEGORY_ID = 2; // tu URL muestra /shop/c/2 = AUDIO

// ⚠️ Poné acá los IDs reales de:
// AURICULARES / AURICULARES BT / AURICULARES M. LIBRES
const AURICULARES_SUB_IDS = [/* ej */ 21, 22, 23];

/* ✅ slider auriculares: fetch propio (NO depende del page del home) */
const aurisLoading = ref(false);
const aurisItems = ref([]);

/* query-driven filters */
const q = computed(() => String(route.query.q || "").trim());
const category_id = computed(() => (route.query.category_id ? Number(route.query.category_id) : null));
const subcategory_id = computed(() => (route.query.subcategory_id ? Number(route.query.subcategory_id) : null));

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

/* HERO */
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

/* Header context */
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

/* Scroll */
const productsTop = ref(null);

function scrollToProducts() {
  const el = productsTop.value;
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 90;
  window.scrollTo({ top: y, behavior: "smooth" });
}

/* Promo slider data (general) */
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

/* Catalog (Home grid) */
async function fetchCatalog({ append = false } = {}) {
  if (!append) loading.value = true;
  try {
    const r = await getCatalog({
      search: q.value || "",
      page: page.value,
      limit: limit.value,
      category_id: category_id.value,
      subcategory_id: subcategory_id.value,
    });

    const newItems = Array.isArray(r.items) ? r.items : [];
    total.value = Number(r.total || 0);

    if (append) {
      const seen = new Set((items.value || []).map((x) => String(x?.product_id ?? x?.id ?? "")));
      const merged = [...items.value];
      for (const it of newItems) {
        const k = String(it?.product_id ?? it?.id ?? "");
        if (!k || seen.has(k)) continue;
        merged.push(it);
        seen.add(k);
      }
      items.value = merged;
    } else {
      items.value = newItems;
    }
  } catch (e) {
    console.error("❌ fetchCatalog(Home)", e);
    if (!append) {
      items.value = [];
      total.value = 0;
    }
  } finally {
    if (!append) loading.value = false;
  }
}

async function loadMore() {
  if (loading.value || loadingMore.value) return;
  if (page.value >= pages.value) return;

  loadingMore.value = true;
  try {
    page.value += 1;
    const nq = { ...route.query, page: String(page.value) };
    router.replace({ path: "/shop", query: nq });
    await fetchCatalog({ append: true });
  } finally {
    loadingMore.value = false;
  }
}

/* ✅ FETCH PROPIO: Auriculares (todas las subcategorías “auriculares…”) */
async function fetchAuricularesSlider() {
  const subs = Array.isArray(AURICULARES_SUB_IDS) ? AURICULARES_SUB_IDS.filter(Boolean) : [];
  if (!subs.length) {
    aurisItems.value = [];
    return;
  }

  aurisLoading.value = true;
  try {
    const merged = [];
    const seen = new Set();

    // Traemos una “rodaja” por cada subcategoría y mezclamos
    // (tu backend hoy recibe un solo subcategory_id, por eso iteramos)
    for (const sid of subs) {
      try {
        const r = await getCatalog({
          search: "",
          page: 1,
          limit: 12, // por sub, después cortamos a 18 total
          category_id: AUDIO_CATEGORY_ID,
          subcategory_id: Number(sid),
        });

        const list = Array.isArray(r.items) ? r.items : [];
        for (const it of list) {
          const k = String(it?.product_id ?? it?.id ?? "");
          if (!k || seen.has(k)) continue;
          merged.push(it);
          seen.add(k);
        }
      } catch (e2) {
        console.error("❌ fetchAuricularesSlider sub:", sid, e2);
      }
    }

    // cortamos a 18 para slider
    aurisItems.value = merged.slice(0, 18);
  } finally {
    aurisLoading.value = false;
  }
}

/* bootstrap */
onMounted(async () => {
  await fetchCatalog({ append: false });

  try {
    allCats.value = await getPublicCategories();
  } catch (e) {
    console.error("❌ getPublicCategories(Home)", e);
    allCats.value = [];
  }

  // ✅ siempre cargamos la pasarela al final
  await fetchAuricularesSlider();
});

watch(
  () => route.query,
  async (nq, oq) => {
    const onlyPageChanged =
      String(nq?.q || "") === String(oq?.q || "") &&
      String(nq?.category_id || "") === String(oq?.category_id || "") &&
      String(nq?.subcategory_id || "") === String(oq?.subcategory_id || "") &&
      String(nq?.page || "1") !== String(oq?.page || "1");

    page.value = Number(route.query.page || 1);

    if (!onlyPageChanged) {
      page.value = 1;
      const q2 = { ...route.query, page: "1" };
      router.replace({ path: "/shop", query: q2 });
      await fetchCatalog({ append: false });
    } else {
      await fetchCatalog({ append: false });
    }

    // ✅ refrescamos la pasarela (no molesta)
    await fetchAuricularesSlider();
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
  overflow: visible;
}

.hero-wrap {
  position: relative;
  width: 100%;
  overflow: visible;
  isolation: isolate;
}

.hero-float {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -165px;
  z-index: 999;
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

.product-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

.after-products-banner { margin-top: 18px; }

.see-more-wrap {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
}

.see-more-btn {
  border-radius: 14px;
  font-weight: 950;
  text-transform: none;
  padding-inline: 22px;
}

.see-more-hint { opacity: 0.8; }

.auris-skel {
  border-radius: 18px;
  overflow: hidden;
}

@media (max-width: 1400px) {
  .product-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
}
@media (max-width: 1200px) {
  .shop-page { --shop-max: 1100px; }
  .product-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .hero-float { bottom: -150px; }
  .after-hero-spacer { height: 190px; }
}
@media (max-width: 960px) {
  .hero-float {
    position: static;
    margin-top: 10px;
    pointer-events: auto;
  }
  .after-hero-spacer { height: 16px; }
  .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 600px) {
  .after-products-banner { margin-top: 14px; }
  .after-hero-spacer { height: 14px; }
  .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
