<!-- ✅ COPY-PASTE FINAL COMPLETO (ML: gallery grande + 1 SOLO panel derecho + tabs + medios de pago abajo) -->
<!-- src/modules/shop/pages/ShopProduct.vue -->
<template>
  <v-container class="py-6">
    <ShopCartDrawer />

    <div class="product-shell">
      <div class="breadcrumb-wrap">
        <ShopBreadcrumb v-if="product" :product="product" />
      </div>

      <div v-if="product" class="product-grid">
        <!-- LEFT: gallery grande -->
        <ProductGallery :product="product" />

        <!-- RIGHT: 1 SOLO panel -->
        <ProductRightPanel
          :product="product"
          @add="onAddToCart"
          @buy="onBuyNow"
          @go-payments="scrollToPayments"
        />
      </div>

      <!-- ✅ Info / Detalles / Descripción (FULL WIDTH abajo, como ML) -->
      <div v-if="product" class="below-block">
        <ProductInfoTabs :product="product" />
      </div>

      <!-- ✅ Medios de pago FULL WIDTH abajo -->
      <div v-if="product" ref="paymentsEl" id="payment-methods" class="below-block">
        <PaymentMethodsCard />
      </div>

      <!-- ✅ SIMILARES -->
      <SimilarProductsRow
        v-if="product"
        title="Productos similares"
        :category-id="resolvedCategoryId"
        :subcategory-id="resolvedSubcategoryId"
        :items="similar"
        :loading="similarLoading"
      />

      <v-container v-if="!product" class="text-center py-12 text-medium-emphasis">
        Cargando...
      </v-container>
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";

// ✅ IMPORTS desde /components/shop (según tu estructura)
import ShopBreadcrumb from "../components/shop/ShopBreadcrumb.vue";
import ProductGallery from "../components/shop/ProductGallery.vue";
import ProductRightPanel from "../components/shop/ProductRightPanel.vue";
import ProductInfoTabs from "../components/shop/ProductInfoTabs.vue";
import PaymentMethodsCard from "../components/shop/PaymentMethodsCard.vue";
import SimilarProductsRow from "../components/shop/SimilarProductsRow.vue";
import ShopCartDrawer from "../components/shop/ShopCartDrawer.vue";

import { getProduct, getCatalog } from "../service/shop.public.api";
import { useShopCartStore } from "../store/shopCart.store";

// ✅ OG + prerender
import { setOgAndReady, absoluteUrlFromLocation } from "../utils/ogPrerender";

const route = useRoute();
const router = useRouter();
const cart = useShopCartStore();

const product = ref(null);

const similar = ref([]);
const similarLoading = ref(false);

const paymentsEl = ref(null);

function dispatchPrerenderReadySafe() {
  try {
    if (typeof document !== "undefined") {
      document.dispatchEvent(new Event("prerender-ready"));
    }
  } catch {}
}

// Cart actions
function onAddToCart(p, qty = 1) {
  cart.add(p, qty);
}

function onBuyNow(p, qty = 1) {
  cart.add(p, qty);
  cart.closeDrawer?.();
  router.push("/shop/cart");
}

async function scrollToPayments() {
  await nextTick();
  try {
    const el = paymentsEl.value || document.getElementById("payment-methods");
    if (el?.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch {}
}

// Category/Subcategory resolvers
function resolveCategoryId(p) {
  return p?.category_id || p?.Category?.id || p?.category?.id || p?.parent_category_id || null;
}
function resolveSubcategoryId(p) {
  return p?.subcategory_id || p?.Subcategory?.id || p?.subcategory?.id || null;
}

const resolvedCategoryId = computed(() => resolveCategoryId(product.value));
const resolvedSubcategoryId = computed(() => resolveSubcategoryId(product.value));

// OG helpers
function pickOgImage(p) {
  const candidate =
    p?.cover_url ||
    p?.image_url ||
    p?.image ||
    p?.main_image ||
    p?.thumbnail ||
    (Array.isArray(p?.images) ? (p.images[0]?.url || p.images[0]) : "") ||
    "";

  if (!candidate) return "https://sanjuantecnologia.com/og/og-product.jpg";

  try {
    return new URL(candidate).toString();
  } catch {
    return absoluteUrlFromLocation(candidate);
  }
}

const shareUrl = computed(() => {
  const q = new URLSearchParams(route.query).toString();
  const base = `/shop/product/${route.params.id}`;
  return absoluteUrlFromLocation(q ? `${base}?${q}` : base);
});

async function applyOgForProduct(p) {
  if (!p) return;

  const title = p?.name ? `${p.name} | San Juan Tecnología` : "Producto | San Juan Tecnología";
  const descRaw = p?.short_description || p?.description || p?.name || "Producto disponible en San Juan Tecnología.";
  const description = String(descRaw).replace(/\s+/g, " ").trim();
  const image = pickOgImage(p);

  try {
    await setOgAndReady({ title, description, image, url: shareUrl.value });
  } catch (e) {
    console.warn("⚠️ setOgAndReady failed:", e?.message || e);
  } finally {
    dispatchPrerenderReadySafe();
  }
}

// Similares
async function fetchSimilar(p) {
  const productId = Number(p?.id || p?.product_id || 0);
  const categoryId = Number(resolveCategoryId(p) || 0);
  const subcategoryId = Number(resolveSubcategoryId(p) || 0);

  if (!categoryId) {
    similar.value = [];
    return;
  }

  similarLoading.value = true;

  try {
    if (subcategoryId) {
      const r1 = await getCatalog({
        page: 1,
        limit: 18,
        search: "",
        category_id: categoryId,
        subcategory_id: subcategoryId,
        include_children: 0,
        in_stock: 0,
      });

      const arr1 = Array.isArray(r1?.items) ? r1.items : [];
      const filtered1 = arr1.filter((x) => Number(x?.product_id ?? x?.id) !== productId);

      if (filtered1.length) {
        similar.value = filtered1.slice(0, 12);
        return;
      }
    }

    const r2 = await getCatalog({
      page: 1,
      limit: 24,
      search: "",
      category_id: categoryId,
      subcategory_id: null,
      include_children: 1,
      in_stock: 0,
    });

    const arr2 = Array.isArray(r2?.items) ? r2.items : [];
    similar.value = arr2.filter((x) => Number(x?.product_id ?? x?.id) !== productId).slice(0, 12);
  } catch (e) {
    console.error("❌ fetchSimilar(getCatalog)", e);
    similar.value = [];
  } finally {
    similarLoading.value = false;
    dispatchPrerenderReadySafe();
  }
}

// Load
async function load() {
  product.value = null;
  similar.value = [];
  similarLoading.value = false;

  try {
    const p = await getProduct(route.params.id);
    product.value = p;

    await applyOgForProduct(p);
    await fetchSimilar(p);
  } catch (e) {
    console.error("❌ ShopProduct load()", e);
  } finally {
    dispatchPrerenderReadySafe();
  }
}

onMounted(load);
watch(() => route.params.id, load);

watch(
  () => route.query,
  async () => {
    if (!product.value) {
      dispatchPrerenderReadySafe();
      return;
    }
    await applyOgForProduct(product.value);
  }
);
</script>

<style scoped>
.product-shell {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  overflow-x: hidden;
}

.breadcrumb-wrap {
  max-width: 100%;
  overflow: hidden;
}

/* ✅ ML: gallery grande + panel derecho fijo */
.product-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 18px;
  align-items: start;
  margin-top: 8px;
}

.product-grid > * {
  min-width: 0;
}

.below-block {
  margin-top: 16px;
}

@media (max-width: 1200px) {
  .product-grid {
    grid-template-columns: 1fr;
  }
}
</style>
