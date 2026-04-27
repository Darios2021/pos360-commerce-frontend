<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/pages/ShopHome.vue -->

<template>
  <v-container fluid class="shop-page pa-0">
    <!-- ✅ overlay SOLO visual -->
    <ShopRouteRestoreOverlay :model-value="isRestoringHome" />

    <!-- HERO FULL-BLEED -->
    <section class="hero-fullbleed">
      <div class="hero-bleed-inner">
        <div class="hero-wrap">
          <HeroSlider
            :slides="heroSlides"
            :show-text="false"
            :show-ctas="false"
            :show-overlay="false"
            @goShop="scrollToProducts"
            @clickSlide="onHeroClick"
          />

          <div class="hero-float" v-if="allCats.length">
            <HomeCategoryFloatRow :categories="allCats" mode="subcategories" />
          </div>
        </div>
      </div>
    </section>

    <section class="content">
      <div class="after-hero-spacer"></div>

      <!-- Slider "Productos en promoción": sólo se muestra si hay promos reales activas -->
      <div class="mb-6" v-if="promoItems.length > 0">
        <PromoSlider :items="promoItems" :perPage="promoPerPage" @seeAll="scrollToProducts" />
      </div>

      <div class="mb-6" v-if="allCats.length">
        <HomeCategoriesCarousel :categories="allCats" :perPage="12" />
      </div>

      <!-- Video shorts: solo se renderiza si hay videos o se están cargando.
           Si el endpoint falla, esta sección desaparece (no rompe la home). -->
      <div class="mb-6" v-if="shortsLoading || shortsItems.length > 0">
        <ShopShortsCarousel :items="shortsItems" :loading="shortsLoading" :error="shortsError" />
      </div>

      <div class="mb-8">
        <PromoGridTelefonosAuriculares />
      </div>

      <div
        id="shop-products-top"
        ref="productsTop"
        class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4"
      >
        <div class="d-flex align-center ga-2">
          <div class="text-h6 font-weight-black">{{ resultsTitle }}</div>
          <span class="text-caption text-medium-emphasis" v-if="total">({{ total }})</span>

          <v-chip v-if="activeChip" size="small" variant="tonal" color="primary" class="ml-2" :title="activeChip">
            {{ activeChip }}
          </v-chip>
        </div>

        <div class="d-flex ga-2 align-center flex-wrap">
          <v-btn v-if="hasAnyFilter" variant="tonal" @click="clearAllFilters">Limpiar</v-btn>
        </div>
      </div>

      <v-alert v-if="itemsError" type="error" variant="tonal" class="mb-4">
        Error al cargar el catálogo: {{ itemsError }}
        <template v-if="isMetaWebView">
          <br />
          Estás usando el navegador interno de Instagram/Facebook. Si el problema continúa, abrí esta web en el
          navegador del teléfono (tres puntos ··· → “Abrir en navegador”).
        </template>
      </v-alert>

      <div v-if="loading && !items.length && !itemsError" class="product-grid">
        <div v-for="n in 12" :key="n">
          <v-skeleton-loader type="image, article" />
        </div>
      </div>

      <v-alert v-else-if="!loading && !items.length && !itemsError" type="info" variant="tonal">
        No hay productos para mostrar con estos criterios.
      </v-alert>

      <div v-else-if="!itemsError" class="product-grid">
        <ProductCard v-for="p in items" :key="p.product_id ?? p.id" :p="p" />
      </div>

      <div v-if="!itemsError && items.length" class="d-flex justify-center mt-6">
        <v-btn v-if="hasMore" variant="tonal" size="large" :loading="loadingMore" @click="loadMore">
          Cargar más
        </v-btn>

        <div v-else class="text-caption text-medium-emphasis">No hay más productos para mostrar.</div>
      </div>

      <div class="after-products-banner" v-if="!loading && items.length && !itemsError">
        <PromoBannerParlantes />
      </div>

      <div class="mt-6">
        <PromoSliderAuriculares
          :loading="aurisLoading"
          :items="aurisItems"
          :perPage="promoPerPage"
          :categoryId="audioCatId"
          :subIds="aurisSubIds"
          iconUrl="https://storage-files.cingulado.org/pos360/products/54/1766788849600-3802f99d.jpeg"
        />
      </div>

      <div class="mt-6">
        <PromoSliderCargadores />
      </div>

      <div class="mt-8">
        <PromoSliderSeguridad />
      </div>

      <div class="mt-4" v-if="!loading && items.length && !itemsError">
        <PromoBannerSeguridadElectronica />
      </div>

      <div class="mt-6">
        <PromoSliderAudioMicrofonos :limitTotal="24" />
      </div>

      <div class="mt-8 entertainment-wrap">
        <PromoBannerEntretenimiento />
      </div>
    </section>

    <ShopFooter />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { isPromoActive } from "@/modules/shop/utils/promo";
import { getCatalog } from "@/modules/shop/service/shop.public.api";
import { getPublicCategories } from "@/modules/shop/service/shop.taxonomy.api";
import { getHomeShorts } from "@/modules/shop/service/shop.media.api";

import HeroSlider from "@/modules/shop/components/HeroSlider.vue";
import HomeCategoryFloatRow from "@/modules/shop/components/HomeCategoryFloatRow.vue";
import HomeCategoriesCarousel from "@/modules/shop/components/HomeCategoriesCarousel.vue";
import PromoSlider from "@/modules/shop/components/PromoSlider.vue";
import PromoSliderAuriculares from "@/modules/shop/components/PromoSliderAuriculares.vue";
import PromoSliderCargadores from "@/modules/shop/components/PromoSliderCargadores.vue";
import PromoSliderAudioMicrofonos from "@/modules/shop/components/PromoSliderAudioMicrofonos.vue";
import PromoGridTelefonosAuriculares from "@/modules/shop/components/PromoGridTelefonosAuriculares.vue";
import PromoBannerEntretenimiento from "@/modules/shop/components/PromoBannerEntretenimiento.vue";
import ProductCard from "@/modules/shop/components/ProductCard.vue";
import PromoBannerParlantes from "@/modules/shop/components/PromoBannerParlantes.vue";
import PromoBannerSeguridadElectronica from "@/modules/shop/components/PromoBannerSeguridadElectronica.vue";
import PromoSliderSeguridad from "@/modules/shop/components/PromoSliderSeguridad.vue";
import ShopRouteRestoreOverlay from "@/modules/shop/components/ShopRouteRestoreOverlay.vue";
import ShopFooter from "@/modules/shop/components/ShopFooter.vue";
import ShopShortsCarousel from "@/modules/shop/components/shop/ShopShortsCarousel.vue";

import { setOgAndReady, absoluteUrlFromLocation } from "@/modules/shop/utils/ogPrerender";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const loadingMore = ref(false);
const itemsError = ref(null);
const isRestoringHome = ref(true);

const items = ref([]);
const page = ref(Number(route.query.page || 1));
const limit = ref(48);
const total = ref(0);
const allCats = ref([]);

const shortsLoading = ref(false);
const shortsError = ref(null);
const shortsItems = ref([]);

// Productos en promoción (carga dedicada, NO depende de la paginación del catálogo)
const promoLoading = ref(false);
const promoOnlyItems = ref([]);

const aurisLoading = ref(false);
const aurisItems = ref([]);

const audioCatId = ref(null);
const aurisSubIds = ref([]);

const productsTop = ref(null);

const isMetaWebView = /instagram|fb_iab|fbav|facebook|messenger/i.test(navigator.userAgent || "");

function toNum(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

async function hideOverlaySoon() {
  await new Promise((resolve) => setTimeout(resolve, 180));
  isRestoringHome.value = false;
}

const heroSlides = ref([
  {
    image: "https://storage-files.cingulado.org/pos360/media/1770511525480-861cc0b6b5fde1fc.webp",
    imageMobile: "https://storage-files.cingulado.org/pos360/media/1770511521269-6aa5cc7baca225a2.webp",
    action: { type: "scroll" },
  },
  {
    image: "https://storage-files.cingulado.org/pos360/media/1770511651259-83e48dc3a42f896d.webp",
    imageMobile: "https://storage-files.cingulado.org/pos360/media/1770511641858-ee120d9d969807a9.webp",
    action: { type: "scroll" },
  },
  {
    image: "https://storage-files.cingulado.org/pos360/media/1770511779214-cb2a6e9804b3a584.webp",
    imageMobile: "https://storage-files.cingulado.org/pos360/media/1770512079660-52d8be3a1d432a64.webp",
    action: { type: "scroll" },
  },
  {
    image: "https://storage-files.cingulado.org/pos360/media/1770512128948-757fa8576009f758.webp",
    imageMobile: "https://storage-files.cingulado.org/pos360/media/1770512124530-cbc09745ba04c9f9.webp",
    action: { type: "scroll" },
  },
]);

function onHeroClick() {
  scrollToProducts();
}

const q = computed(() => String(route.query.q || "").trim());
const category_id = computed(() => (route.query.category_id ? Number(route.query.category_id) : null));
const subcategory_id = computed(() => (route.query.subcategory_id ? Number(route.query.subcategory_id) : null));

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

function scrollToProducts() {
  const el = productsTop.value;
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 90;
  window.scrollTo({ top: y, behavior: "smooth" });
}

const promoPerPage = computed(() => 5);

const promoItems = computed(() => {
  // ✅ Usa la lista dedicada de promos (traída por API con filtro promo=active),
  // NO filtra del catálogo paginado — sino sólo veríamos las promos que cayeron
  // en la primera página de productos.
  const arr = Array.isArray(promoOnlyItems.value) ? promoOnlyItems.value : [];
  // Doble seguridad: revalidar window en cliente por si la lista quedó cacheada.
  return arr.filter((p) => isPromoActive(p)).slice(0, 18);
});

const hasMore = computed(() => {
  const t = Number(total.value || 0);
  return t > 0 && items.value.length < t;
});

async function fetchCatalog({ append = false } = {}) {
  const targetPage = append ? Number(page.value || 1) + 1 : Number(page.value || 1);

  if (append) loadingMore.value = true;
  else loading.value = true;

  itemsError.value = null;

  try {
    const r = await getCatalog({
      search: q.value || "",
      page: targetPage,
      limit: limit.value,
      category_id: category_id.value,
      subcategory_id: subcategory_id.value,
    });

    const newItems = Array.isArray(r.items) ? r.items : [];
    total.value = Number(r.total || 0);

    if (append) {
      items.value = [...items.value, ...newItems];
      page.value = targetPage;
    } else {
      items.value = newItems;
      page.value = Number(route.query.page || 1);
    }
  } catch (e) {
    const msg =
      e?.response?.status
        ? `${e.response.status} ${e.response.statusText || ""}`.trim()
        : e?.message || String(e);

    itemsError.value = msg;

    if (!append) {
      items.value = [];
      total.value = 0;
    }
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

function loadMore() {
  if (loading.value || loadingMore.value || !hasMore.value) return;
  fetchCatalog({ append: true });
}

async function fetchPromoItems() {
  promoLoading.value = true;
  try {
    const r = await getCatalog({
      promo: "active",
      page: 1,
      limit: 30,
      // sin filtros de stock para no excluir productos sin track_stock
    });
    const arr = Array.isArray(r?.items) ? r.items : [];
    promoOnlyItems.value = arr;
  } catch (e) {
    // sección decorativa: si falla, vacío y la sección desaparece
    console.warn("[ShopHome] no se pudieron cargar promos:", e?.message || e);
    promoOnlyItems.value = [];
  } finally {
    promoLoading.value = false;
  }
}

async function fetchHomeShorts() {
  shortsLoading.value = true;
  shortsError.value = null;

  try {
    const list = await getHomeShorts({ limit: 18 });
    shortsItems.value = Array.isArray(list) ? list : [];
  } catch (e) {
    // ⚠️ Los video shorts son una sección decorativa: si el endpoint falla
    // (500, timeout, etc.) NO debemos romper visualmente la home. Logueamos
    // y dejamos la lista vacía → el carousel se oculta solo (v-if).
    console.warn("[ShopHome] no se pudieron cargar video shorts:", e?.message || e);
    shortsError.value = null;
    shortsItems.value = [];
  } finally {
    shortsLoading.value = false;
  }
}

function dispatchPrerenderReadySafe() {
  try {
    if (typeof document !== "undefined") document.dispatchEvent(new Event("prerender-ready"));
  } catch {}
}

let ogDone = false;

onMounted(async () => {
  isRestoringHome.value = true;

  if (!ogDone) {
    ogDone = true;

    await setOgAndReady({
      title: "San Juan Tecnología | Tienda",
      description: "Electrónica, ecommerce, sistemas POS y soluciones tecnológicas.",
      image: "https://sanjuantecnologia.com/og/og-shop.jpg",
      url: absoluteUrlFromLocation("/shop"),
    });

    dispatchPrerenderReadySafe();
  }

  await fetchCatalog({ append: false });

  try {
    allCats.value = await getPublicCategories();
  } catch {
    allCats.value = [];
  }

  // Promos en paralelo (no bloqueantes)
  fetchPromoItems();
  await fetchHomeShorts();
  dispatchPrerenderReadySafe();

  await hideOverlaySoon();
});

watch(
  () => route.query,
  async () => {
    isRestoringHome.value = true;
    page.value = Number(route.query.page || 1);
    await fetchCatalog({ append: false });
    fetchPromoItems();
    await fetchHomeShorts();
    dispatchPrerenderReadySafe();
    await hideOverlaySoon();
  }
);
</script>

<style scoped>
.shop-page {
  --shop-max: 1200px;
  padding: 0 !important;
  margin: 0 !important;
  background: transparent;
}

.hero-fullbleed {
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-top: 0;
  padding-top: 0;
  overflow: visible;
}

.hero-wrap {
  position: relative;
  width: 100%;
  overflow: visible;
  isolation: isolate;
}

.hero-float {
  position: relative;
  pointer-events: auto;
  margin-top: 14px;
}

.hero-float :deep(.float-inner) {
  width: min(var(--shop-max), calc(100% - 24px));
  margin: 0 auto;
}

.after-hero-spacer {
  height: 18px;
}

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

.after-products-banner {
  margin-top: 18px;
}

.entertainment-wrap {
  padding-top: 6px;
}

.entertainment-wrap :deep(.ent-shell) {
  min-height: 220px;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 39%);
}

.entertainment-wrap :deep(.ent-copy) {
  padding: 24px 28px;
  gap: 10px;
}

.entertainment-wrap :deep(.ent-title) {
  font-size: 32px;
  line-height: 0.98;
  letter-spacing: -0.7px;
  max-width: 520px;
}

.entertainment-wrap :deep(.ent-sub) {
  font-size: 15px;
  max-width: 500px;
}

.entertainment-wrap :deep(.ent-media) {
  min-height: 220px;
}

.entertainment-wrap :deep(.ent-img) {
  max-width: 420px;
  padding: 14px 12px 12px;
}

@media (max-width: 1400px) {
  .product-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 1200px) {
  .shop-page {
    --shop-max: 1100px;
  }

  .product-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .after-hero-spacer {
    height: 14px;
  }

  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .entertainment-wrap :deep(.ent-shell) {
    min-height: 190px;
    grid-template-columns: minmax(0, 1fr) 40%;
  }

  .entertainment-wrap :deep(.ent-copy) {
    padding: 18px 20px;
  }

  .entertainment-wrap :deep(.ent-title) {
    font-size: 24px;
  }

  .entertainment-wrap :deep(.ent-sub) {
    font-size: 13px;
  }

  .entertainment-wrap :deep(.ent-media) {
    min-height: 190px;
  }

  .entertainment-wrap :deep(.ent-img) {
    max-width: 300px;
    padding: 12px 10px;
  }
}

@media (max-width: 600px) {
  .after-hero-spacer {
    height: 12px;
  }

  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .content {
    padding-bottom: 92px;
  }

  .entertainment-wrap :deep(.ent-shell) {
    min-height: 158px;
    grid-template-columns: minmax(0, 1fr) 39%;
  }

  .entertainment-wrap :deep(.ent-copy) {
    padding: 14px 14px 14px 16px;
    gap: 6px;
  }

  .entertainment-wrap :deep(.ent-kicker) {
    font-size: 9px;
    letter-spacing: 3px;
  }

  .entertainment-wrap :deep(.ent-title) {
    font-size: 18px;
    line-height: 1.05;
    letter-spacing: -0.2px;
  }

  .entertainment-wrap :deep(.ent-sub) {
    font-size: 11px;
    line-height: 1.35;
  }

  .entertainment-wrap :deep(.ent-btn) {
    min-width: 110px;
    height: 34px;
    padding: 0 14px;
    font-size: 13px;
    border-radius: 9px;
  }

  .entertainment-wrap :deep(.ent-note) {
    display: none;
  }

  .entertainment-wrap :deep(.ent-media) {
    min-height: 158px;
  }

  .entertainment-wrap :deep(.ent-img) {
    max-width: 220px;
    padding: 10px 8px;
  }
}
</style>