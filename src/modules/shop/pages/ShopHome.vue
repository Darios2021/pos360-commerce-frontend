<!-- src/modules/shop/pages/ShopHome.vue -->
<template>
  <v-container fluid class="py-6">
    <div class="shop-inner">
      <!-- HERO -->
      <div class="hero-wrap">
        <HeroSlider
          :slides="heroSlides"
          @goShop="scrollToProducts"
          @clickSlide="onHeroClick"
        />

        <!-- ✅ Cards MÁS ABAJO + no bloquean flechas -->
        <div class="hero-float" v-if="allCats.length">
          <HomeCategoryFloatRow :categories="allCats" :max="6" />
        </div>
      </div>

      <!-- ✅ espacio para la superposición (más grande) -->
      <div class="after-hero-spacer"></div>

      <!-- Productos -->
      <div ref="productsTop" class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
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

      <div v-else class="product-grid">
        <v-card
          v-for="p in items"
          :key="p.product_id"
          class="rounded-xl product-card"
          variant="outlined"
        >
          <v-img :src="p.image_url" height="190" cover class="rounded-t-xl" />

          <v-card-text class="pt-3">
            <div class="text-h6 font-weight-black mb-1">
              $ {{ fmtMoney(finalPrice(p)) }}
            </div>

            <div class="font-weight-bold text-uppercase product-title">
              {{ p.name }}
            </div>

            <div class="text-caption text-medium-emphasis mt-2">
              {{ p.category_name || "—" }}
              <span v-if="p.subcategory_name"> · {{ p.subcategory_name }}</span>
            </div>
          </v-card-text>

          <v-card-actions class="px-4 pb-4">
            <v-btn variant="text" @click="goProduct(p.product_id)">Ver</v-btn>
            <v-spacer />
            <v-btn
              color="primary"
              variant="text"
              :disabled="p.track_stock && Number(p.stock_qty) <= 0"
              @click="addToCart(p)"
            >
              Agregar
            </v-btn>
          </v-card-actions>
        </v-card>
      </div>

      <div v-if="pages > 1" class="d-flex justify-center align-center ga-2 mt-6">
        <v-btn variant="tonal" :disabled="page <= 1 || loading" @click="prevPage">Anterior</v-btn>
        <div class="text-caption text-medium-emphasis">Página {{ page }} / {{ pages }}</div>
        <v-btn variant="tonal" :disabled="page >= pages || loading" @click="nextPage">Siguiente</v-btn>
      </div>
    </div>
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

const route = useRoute();
const router = useRouter();
const cart = useShopCartStore();

const loading = ref(false);
const items = ref([]);

const page = ref(Number(route.query.page || 1));
const limit = ref(24);
const total = ref(0);

const allCats = ref([]);

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
function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(toNum(v)));
}
function finalPrice(p) {
  const d = toNum(p.price_discount);
  if (d > 0) return d;
  const l = toNum(p.price_list);
  if (l > 0) return l;
  return toNum(p.price);
}

function goProduct(id) {
  router.push({ name: "shopProduct", params: { id } });
}
function addToCart(p) {
  cart.add(p, 1);
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
  router.replace({ name: "shopHome", query: nq });
}

/* Scroll */
const productsTop = ref(null);
function scrollToProducts() {
  const el = productsTop.value;
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 90;
  window.scrollTo({ top: y, behavior: "smooth" });
}

/* Catalog */
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
  router.replace({ name: "shopHome", query: nq });
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
.shop-inner {
  width: 100%;
  max-width: 1850px;
  margin: 0 auto;
}

/* ✅ cards flotantes MÁS ABAJO y SIN bloquear flechas */
.hero-wrap {
  position: relative;
}
.hero-float {
  position: absolute;
  left: 0;
  right: 0;

  /* ✅ las bajamos para que no tapen el contenido del hero */
  bottom: -110px;

  z-index: 20;

  /* ✅ clave: el contenedor NO captura clicks, solo las cards (adentro) */
  pointer-events: none;
}

/* el componente de cards ya habilita pointer-events solo en las cards */
.hero-float :deep(.float-inner) {
  pointer-events: auto;
}

/* ✅ espacio post-hero para que no tape “Productos” */
.after-hero-spacer {
  height: 140px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 16px;
  align-items: start;
}

.product-card {
  width: 100%;
  max-width: 340px;
}

.product-title {
  line-height: 1.15;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

@media (max-width: 960px) {
  .hero-float {
    bottom: -70px;
  }
  .after-hero-spacer {
    height: 110px;
  }
  .product-card { max-width: 100%; }
}
</style>
