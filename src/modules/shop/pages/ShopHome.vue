<!-- src/modules/shop/pages/ShopHome.vue -->
<template>
  <!-- ✅ FIX: sacamos el padding 16px del v-container (era el culpable de la “línea” arriba/abajo) -->
  <v-container fluid class="shop-page pa-0">
    <!-- ✅ HERO FULL-BLEED (100vw) -->
    <section class="hero-fullbleed">
      <div class="hero-bleed-inner">
        <div class="hero-wrap">
          <HeroSlider :slides="heroSlides" @goShop="scrollToProducts" @clickSlide="onHeroClick" />

          <!-- ✅ FLOAT: SUBCATEGORÍAS (flechas + auto-move en desktop) -->
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

      <!-- ✅ RESTAURADO: HomeCategoriesCarousel -->
      <div class="mb-6" v-if="allCats.length">
        <HomeCategoriesCarousel :categories="allCats" :perPage="12" />
      </div>

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

      <div class="after-products-banner" v-if="!loading && items.length">
        <PromoBannerParlantes />
      </div>

      <!-- ✅ PASARELA AURICULARES -->
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
    </section>

    <!-- ✅ FOOTER -->
    <ShopFooter />
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
import HomeCategoriesCarousel from "@/modules/shop/components/HomeCategoriesCarousel.vue";
import PromoSlider from "@/modules/shop/components/PromoSlider.vue";
import PromoSliderAuriculares from "@/modules/shop/components/PromoSliderAuriculares.vue";
import ProductCard from "@/modules/shop/components/ProductCard.vue";
import PromoBannerParlantes from "@/modules/shop/components/PromoBannerParlantes.vue";
import ShopFooter from "@/modules/shop/components/ShopFooter.vue";

const route = useRoute();
const router = useRouter();
const cart = useShopCartStore();

const loading = ref(false);

const items = ref([]);
const page = ref(Number(route.query.page || 1));
const limit = ref(24);
const total = ref(0);
const allCats = ref([]);

const aurisLoading = ref(false);
const aurisItems = ref([]);

const audioCatId = ref(null);
const aurisSubIds = ref([]);

const q = computed(() => String(route.query.q || "").trim());
const category_id = computed(() => (route.query.category_id ? Number(route.query.category_id) : null));
const subcategory_id = computed(() =>
  route.query.subcategory_id ? Number(route.query.subcategory_id) : null
);

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

    items.value = newItems;
  } catch (e) {
    console.error("❌ fetchCatalog(Home)", e);
    items.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

/* taxonomy helpers */
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
        } catch (e2) {
          console.error("❌ fetchAuricularesSlider sub:", sid, e2);
        }
      }
    }

    if (!merged.length) {
      const tries = ["auriculares", "auricular", "headphones", "headset", "earbuds", "tws"];
      const EXCLUDE = "cargador,cable,energia,energía,usb,adaptador,fuente,powerbank,power bank";

      for (const term of tries) {
        try {
          const r = await getCatalog({
            search: term,
            page: 1,
            limit: 80,
            strict_search: 1,
            exclude_terms: EXCLUDE,
          });

          const list = Array.isArray(r?.items) ? r.items : [];
          if (list.length) {
            merged = list;
            break;
          }
        } catch (e3) {
          console.error("❌ fallback auris:", term, e3);
        }
      }
    }

    aurisItems.value = merged;
  } finally {
    aurisLoading.value = false;
  }
}

onMounted(async () => {
  await fetchCatalog({ append: false });

  try {
    allCats.value = await getPublicCategories();
  } catch (e) {
    console.error("❌ getPublicCategories(Home)", e);
    allCats.value = [];
  }

  hydrateAudioAndAurisIds();
  await fetchAuricularesSlider();
});

watch(
  () => route.query,
  async () => {
    page.value = Number(route.query.page || 1);
    await fetchCatalog({ append: false });

    if (!allCats.value?.length) {
      try {
        allCats.value = await getPublicCategories();
      } catch (e) {
        allCats.value = [];
      }
    }

    hydrateAudioAndAurisIds();
    await fetchAuricularesSlider();
  }
);
</script>

<style scoped>
/* ✅ FIX GLOBAL para que jamás asome “blanco” por márgenes/padding del layout */
:global(html),
:global(body) {
  margin: 0 !important;
  padding: 0 !important;
}

/* ✅ el root del shop NO debe tener padding (Vuetify mete 16px por defecto) */
.shop-page {
  --shop-max: 1200px;
  padding: 0 !important; /* 👈 mata el gap arriba/abajo */
  margin: 0 !important;
}

/* ✅ HERO FULL-BLEED (sin espacio contra el header) */
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

.after-hero-spacer {
  height: 205px;
}

/* ✅ el padding “real” lo maneja este wrapper, no el v-container */
.content {
  width: min(var(--shop-max), calc(100% - 24px));
  margin: 0 auto;
  padding-bottom: 40px; /* espacio antes del footer, pero dentro del flujo (sin línea blanca afuera) */
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
  .hero-float {
    bottom: -150px;
  }
  .after-hero-spacer {
    height: 190px;
  }
}
@media (max-width: 960px) {
  .hero-float {
    position: static;
    margin-top: 10px;
    pointer-events: auto;
  }
  .after-hero-spacer {
    height: 16px;
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
    height: 14px;
  }
  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
