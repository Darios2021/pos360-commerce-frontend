<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/pages/ShopHome.vue -->

<template>
  <v-container fluid class="shop-page pa-0">
    <!-- HERO FULL-BLEED -->
    <section class="hero-fullbleed">
      <div class="hero-bleed-inner">
        <div class="hero-wrap">
          <!-- ✅ HERO LIMPIO (estilo Mercado Libre) -->
          <HeroSlider
            :slides="heroSlides"
            :show-text="false"
            :show-ctas="false"
            :show-overlay="false"
            @goShop="scrollToProducts"
            @clickSlide="onHeroClick"
          />

          <!-- ✅ Categorías DEBAJO del hero (no flotan) -->
          <div class="hero-float" v-if="allCats.length">
            <HomeCategoryFloatRow :categories="allCats" mode="subcategories" />
          </div>
        </div>
      </div>
    </section>

    <section class="content">
      <div class="after-hero-spacer"></div>

      <div class="mb-6">
        <PromoSlider :items="promoItems" :perPage="promoPerPage" @seeAll="scrollToProducts" />
      </div>

      <div class="mb-6" v-if="allCats.length">
        <HomeCategoriesCarousel :categories="allCats" :perPage="12" />
      </div>

      <!-- SHORTS -->
      <div class="mb-6">
        <ShopShortsCarousel :items="shortsItems" :loading="shortsLoading" :error="shortsError" />
      </div>

      <!-- INSTAGRAM -->
      <div class="mb-6">
        <InstagramPhoneCarousel />
      </div>

      <!-- PRODUCTOS -->
      <div
        id="shop-products-top"
        ref="productsTop"
        class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4"
      >
        <div class="d-flex align-center ga-2">
          <div class="text-h6 font-weight-black">{{ resultsTitle }}</div>
          <span class="text-caption text-medium-emphasis" v-if="total">({{ total }})</span>

          <v-chip v-if="activeChip" size="small" variant="tonal" color="primary" class="ml-2">
            {{ activeChip }}
          </v-chip>
        </div>

        <v-btn v-if="hasAnyFilter" variant="tonal" @click="clearAllFilters">Limpiar</v-btn>
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

      <!-- CARGAR MÁS -->
      <div v-if="!itemsError && items.length" class="d-flex justify-center mt-6">
        <v-btn v-if="hasMore" variant="tonal" size="large" :loading="loadingMore" @click="loadMore">
          Cargar más
        </v-btn>
        <div v-else class="text-caption text-medium-emphasis">No hay más productos para mostrar.</div>
      </div>

      <div class="after-products-banner" v-if="!loading && items.length && !itemsError">
        <PromoBannerParlantes />
      </div>

      <!-- AURICULARES -->
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

      <!-- CARGADORES -->
      <div class="mt-6">
        <PromoSliderCargadores />
      </div>

      <!-- AUDIO/MICROFONOS -->
      <div class="mt-6">
        <PromoSliderAudioMicrofonos :limitTotal="24" />
      </div>
    </section>

    <ShopFooter />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

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
import ProductCard from "@/modules/shop/components/ProductCard.vue";
import PromoBannerParlantes from "@/modules/shop/components/PromoBannerParlantes.vue";
import ShopFooter from "@/modules/shop/components/ShopFooter.vue";
import InstagramPhoneCarousel from "@/modules/shop/components/InstagramPhoneCarousel.vue";
import ShopShortsCarousel from "@/modules/shop/components/shop/ShopShortsCarousel.vue";

import { setOgAndReady, absoluteUrlFromLocation } from "@/modules/shop/utils/ogPrerender";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const loadingMore = ref(false);
const itemsError = ref(null);

const items = ref([]);
const page = ref(Number(route.query.page || 1));
const limit = ref(48);
const total = ref(0);
const allCats = ref([]);

/* Shorts */
const shortsLoading = ref(false);
const shortsError = ref(null);
const shortsItems = ref([]);

/* Auriculares */
const aurisLoading = ref(false);
const aurisItems = ref([]);
const audioCatId = ref(null);
const aurisSubIds = ref([]);

/* Meta webview */
const isMetaWebView = /instagram|fb_iab|fbav|facebook|messenger/i.test(navigator.userAgent || "");

function toNum(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/* =========================================
   ✅ HERO SLIDES (pos 1,2,3)
   ========================================= */

/* Posición 1 */
const HERO1_DESKTOP =
  "https://storage-files.cingulado.org/pos360/media/1770500265997-04c9718403a56578.webp";
const HERO1_MOBILE =
  "https://storage-files.cingulado.org/pos360/media/1770500533409-c649a209a22bc072.webp";

/* Posición 2 */
const HERO2_DESKTOP =
  "https://storage-files.cingulado.org/pos360/media/1770502900950-b92a3b33b9449e71.webp";
const HERO2_MOBILE =
  "https://storage-files.cingulado.org/pos360/media/1770502919144-a99270ed268a1238.webp";

/* ✅ Posición 3 (NUEVO) */
const HERO3_DESKTOP =
  "https://storage-files.cingulado.org/pos360/media/1770504901619-2bcd6132da5390be.webp";
const HERO3_MOBILE =
  "https://storage-files.cingulado.org/pos360/media/1770504906987-92319e41713d0b0f.webp";

const heroSlides = ref([
  { image: HERO1_DESKTOP, imageMobile: HERO1_MOBILE, action: { type: "scroll" } },
  { image: HERO2_DESKTOP, imageMobile: HERO2_MOBILE, action: { type: "scroll" } },
  { image: HERO3_DESKTOP, imageMobile: HERO3_MOBILE, action: { type: "scroll" } },
]);

function onHeroClick() {
  scrollToProducts();
}

const q = computed(() => String(route.query.q || "").trim());
const category_id = computed(() => (route.query.category_id ? Number(route.query.category_id) : null));
const subcategory_id = computed(() =>
  route.query.subcategory_id ? Number(route.query.subcategory_id) : null
);

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

const productsTop = ref(null);

function scrollToProducts() {
  const el = productsTop.value;
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 90;
  window.scrollTo({ top: y, behavior: "smooth" });
}

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

/* taxonomy */
function norm(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function getCatSubs(cat) {
  if (!cat) return [];
  const candidates = [cat.children, cat.subcategories, cat.subs, cat.items, cat.nodes];
  return (candidates.find((x) => Array.isArray(x)) || []).filter(Boolean);
}

function hydrateAudioAndAurisIds() {
  const cats = Array.isArray(allCats.value) ? allCats.value : [];

  const audio =
    cats.find((c) => norm(c?.slug) === "audio") ||
    cats.find((c) => norm(c?.name) === "audio") ||
    cats.find((c) => norm(c?.name).includes("audio")) ||
    null;

  if (!audio) {
    audioCatId.value = null;
    aurisSubIds.value = [];
    return;
  }

  audioCatId.value = Number(audio.id) || null;

  const subs = getCatSubs(audio);
  const ids = subs
    .filter((s) => {
      const n = norm(s?.name);
      const sl = norm(s?.slug);
      return sl.includes("auricul") || n.includes("auricul") || n.includes("headphone");
    })
    .map((s) => Number(s?.id))
    .filter((n) => Number.isFinite(n) && n > 0);

  aurisSubIds.value = ids;
}

async function fetchAuricularesSlider() {
  aurisLoading.value = true;
  try {
    const catId = Number(audioCatId.value || 0);
    const subs = Array.isArray(aurisSubIds.value) ? aurisSubIds.value.filter(Boolean) : [];

    let merged = [];
    const seen = new Set();

    if (catId && subs.length) {
      for (const sid of subs) {
        try {
          const r = await getCatalog({
            search: "",
            page: 1,
            limit: 60,
            category_id: catId,
            subcategory_id: Number(sid),
          });

          const list = Array.isArray(r?.items) ? r.items : [];
          for (const it of list) {
            const k = String(it?.product_id ?? it?.id ?? "");
            if (!k || seen.has(k)) continue;
            merged.push(it);
            seen.add(k);
          }
        } catch {}
      }
    }

    aurisItems.value = merged;
  } finally {
    aurisLoading.value = false;
  }
}

/* shorts */
async function fetchHomeShorts() {
  shortsLoading.value = true;
  shortsError.value = null;

  try {
    const list = await getHomeShorts({ limit: 18 });
    shortsItems.value = Array.isArray(list) ? list : [];
  } catch (e) {
    const msg =
      e?.response?.status
        ? `${e.response.status} ${e.response.statusText || ""}`.trim()
        : e?.message || String(e);

    shortsError.value = msg;
    shortsItems.value = [];
  } finally {
    shortsLoading.value = false;
  }
}

function dispatchPrerenderReadySafe() {
  try {
    if (typeof document !== "undefined") {
      document.dispatchEvent(new Event("prerender-ready"));
    }
  } catch {}
}

let ogDone = false;

onMounted(async () => {
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

  hydrateAudioAndAurisIds();
  await fetchAuricularesSlider();

  fetchHomeShorts();
  dispatchPrerenderReadySafe();
});

watch(
  () => route.query,
  async () => {
    page.value = Number(route.query.page || 1);
    await fetchCatalog({ append: false });

    if (!allCats.value?.length) {
      try {
        allCats.value = await getPublicCategories();
      } catch {
        allCats.value = [];
      }
    }

    hydrateAudioAndAurisIds();
    await fetchAuricularesSlider();

    fetchHomeShorts();
    dispatchPrerenderReadySafe();
  }
);
</script>

<style scoped>
:global(html),
:global(body) {
  margin: 0 !important;
  padding: 0 !important;
}

.shop-page {
  --shop-max: 1200px;
  padding: 0 !important;
  margin: 0 !important;
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

/* debajo del hero */
.hero-float {
  position: relative;
  z-index: 1;
  pointer-events: auto;
  margin-top: 14px;
}

.hero-float :deep(.float-inner) {
  width: min(var(--shop-max), calc(100% - 24px));
  margin: 0 auto;
}

.after-hero-spacer {
  height: 16px;
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
    height: 12px;
  }
  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .after-products-banner {
    margin-top: 14px;
  }
  .after-hero-spacer {
    height: 10px;
  }
  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
