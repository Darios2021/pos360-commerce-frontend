<!-- ✅ COPY-PASTE FINAL COMPLETO (ANTI-TIMEOUT + ANTI-DOBLE LOAD + CANCEL + RETRY UI + ROUTE PRELOADER) -->
<!-- src/modules/shop/pages/ShopProduct.vue -->
<template>
  <v-container class="py-6">
    <!-- ✅ mismo preloader reusable -->
    <ShopRouteRestoreOverlay :model-value="showRoutePreloader" />

    <ShopCartDrawer />

    <div class="product-shell">
      <div class="breadcrumb-wrap">
        <ShopBreadcrumb v-if="product" :product="product" />
      </div>

      <!-- ✅ Estados -->
      <div v-if="loading && !showRoutePreloader" class="loading-wrap">
        <v-progress-circular indeterminate />
        <div class="text-medium-emphasis mt-3">Cargando producto…</div>
        <div class="text-caption text-medium-emphasis mt-1" style="opacity: 0.8">
          Si tu conexión está lenta, puede tardar un poco.
        </div>
      </div>

      <v-alert v-else-if="error" type="error" variant="tonal" class="mt-4">
        <div style="font-weight: 400">No pudimos cargar el producto</div>
        <div class="mt-1" style="white-space: pre-wrap">{{ error }}</div>

        <div class="mt-3 d-flex" style="gap: 10px; flex-wrap: wrap">
          <v-btn color="primary" variant="flat" @click="retry">Reintentar</v-btn>
          <v-btn variant="tonal" @click="goBack">Volver</v-btn>
        </div>
      </v-alert>

      <!-- ✅ Contenido — SHELL único estilo ML: una sola card,
           hairlines internos separan apartados (galería | compra) -->
      <div v-else-if="product" class="pdp-shell">
        <div class="product-grid">
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
      </div>

      <!-- ✅ Info + Medios de pago (2 columnas estilo ML) -->
      <div v-if="product" class="below-block info-payments-grid">
        <div class="info-col">
          <ProductInfoTabs :product="product" />
        </div>
        <div ref="paymentsEl" id="payment-methods" class="payments-col">
          <PaymentMethodsCard />
        </div>
      </div>

      <!-- ✅ Preguntas y respuestas + Opiniones -->
      <div v-if="product" class="below-block">
        <ProductQAReviews :product-id="product.product_id ?? product.id" />
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
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";

// ✅ IMPORTS desde /components/shop (según tu estructura)
import ShopBreadcrumb from "../components/shop/ShopBreadcrumb.vue";
import ProductGallery from "../components/shop/ProductGallery.vue";
import ProductRightPanel from "../components/shop/ProductRightPanel.vue";
import ProductInfoTabs from "../components/shop/ProductInfoTabs.vue";
import PaymentMethodsCard from "../components/shop/PaymentMethodsCard.vue";
import SimilarProductsRow from "../components/shop/SimilarProductsRow.vue";
import ProductQAReviews from "../components/shop/ProductQAReviews.vue";
import ShopCartDrawer from "../components/shop/ShopCartDrawer.vue";
import ShopRouteRestoreOverlay from "@/modules/shop/components/ShopRouteRestoreOverlay.vue";

import { getProduct, getCatalog } from "../service/shop.public.api";
import { useShopCartStore } from "../store/shopCart.store";

// ✅ OG + prerender
import { setOgAndReady, absoluteUrlFromLocation } from "../utils/ogPrerender";
import { extractProductId, buildProductPath, hasSlugInPath } from "../utils/productSlug";

const route = useRoute();
const router = useRouter();
const cart = useShopCartStore();

const product = ref(null);

const loading = ref(false);
const error = ref("");

const similar = ref([]);
const similarLoading = ref(false);

const paymentsEl = ref(null);

/* ✅ mismo preloader reusable */
const showRoutePreloader = ref(true);

// ✅ cancelar/deduplicar cargas
let activeLoadId = 0;
let abortCtrl = null;

function dispatchPrerenderReadySafe() {
  try {
    if (typeof document !== "undefined") {
      document.dispatchEvent(new Event("prerender-ready"));
    }
  } catch {}
}

async function hideRoutePreloaderSoon() {
  await new Promise((resolve) => setTimeout(resolve, 120));
  showRoutePreloader.value = false;
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

function goBack() {
  try {
    router.back();
  } catch {
    router.push("/shop");
  }
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
  // Si ya tenemos el producto, usar el path bonito (con slug); sino, el param crudo.
  const pretty = product.value ? buildProductPath(product.value) : "";
  const base = `/shop/product/${pretty || route.params.id}`;
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

// --- helpers retry/timeout ---
function isTimeoutErr(e) {
  const msg = String(e?.message || "");
  const code = String(e?.code || "");
  return code === "ECONNABORTED" || msg.toLowerCase().includes("timeout");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ✅ Similares (no frena la carga del producto si falla)
async function fetchSimilar(p, loadId) {
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

      // si cambió el producto mientras tanto, no pisar estado
      if (loadId !== activeLoadId) return;

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

    if (loadId !== activeLoadId) return;

    const arr2 = Array.isArray(r2?.items) ? r2.items : [];
    similar.value = arr2.filter((x) => Number(x?.product_id ?? x?.id) !== productId).slice(0, 12);
  } catch (e) {
    console.error("❌ fetchSimilar(getCatalog)", e);
    if (loadId === activeLoadId) similar.value = [];
  } finally {
    if (loadId === activeLoadId) similarLoading.value = false;
    dispatchPrerenderReadySafe();
  }
}

// ✅ Load robusto: cancela anterior + retry si timeout
async function loadProductWithRetry(productId, loadId) {
  // 🔥 cancel request anterior
  try {
    abortCtrl?.abort?.();
  } catch {}
  abortCtrl = typeof AbortController !== "undefined" ? new AbortController() : null;

  // OJO: esto asume que tu getProduct acepta 2do param opcional (axios config)
  // Si no lo acepta, igual funciona sin signal/timeout extendido, pero sin cancel real.
  const axiosCfg = {
    timeout: 45000, // 👈 subimos a 45s solo en detalle
    signal: abortCtrl?.signal,
  };

  const MAX_TRIES = 3;
  let lastErr = null;

  for (let i = 1; i <= MAX_TRIES; i++) {
    try {
      // si cambió la ruta mientras reintentamos
      if (loadId !== activeLoadId) return null;

      const p = await getProduct(productId, axiosCfg);
      return p;
    } catch (e) {
      lastErr = e;

      // cancelado / navegación => salir silencioso
      const aborted =
        e?.name === "CanceledError" ||
        String(e?.message || "").toLowerCase().includes("canceled") ||
        String(e?.message || "").toLowerCase().includes("aborted");

      if (aborted || loadId !== activeLoadId) return null;

      // reintentar solo si timeout
      if (isTimeoutErr(e) && i < MAX_TRIES) {
        await sleep(i === 1 ? 450 : i === 2 ? 900 : 1200);
        continue;
      }

      throw e;
    }
  }

  throw lastErr;
}

async function load() {
  const loadId = ++activeLoadId;

  product.value = null;
  similar.value = [];
  similarLoading.value = false;

  error.value = "";
  loading.value = true;
  showRoutePreloader.value = true;

  try {
    // route.params.id puede venir como id puro ("356") o con slug ("nombre-356")
    const id = extractProductId(route.params.id);
    const p = await loadProductWithRetry(id, loadId);

    if (!p || loadId !== activeLoadId) return;

    product.value = p;

    // si la URL vino "pelada" sin slug, embellecerla con el nombre
    // sin recargar el componente (replaceState).
    maybeUpgradeUrlWithSlug(p);

    await applyOgForProduct(p);

    // similares en paralelo (sin bloquear UI)
    fetchSimilar(p, loadId);

    if (loadId === activeLoadId) {
      await hideRoutePreloaderSoon();
    }
  } catch (e) {
    console.error("❌ ShopProduct load()", e);

    if (loadId !== activeLoadId) return;

    if (isTimeoutErr(e)) {
      error.value =
        "La petición tardó demasiado y se cortó.\n" +
        "Probá Reintentar. Si persiste, el servidor está lento o tu conexión está inestable.";
    } else {
      error.value = String(e?.response?.data?.message || e?.message || e || "Error desconocido");
    }

    showRoutePreloader.value = false;
  } finally {
    if (loadId === activeLoadId) loading.value = false;
    dispatchPrerenderReadySafe();
  }
}

function retry() {
  load();
}

/**
 * Si la URL actual viene con id pelado (sin slug) y ya tenemos el producto,
 * reescribe la URL agregando el slug-name. Usa replaceState para no disparar
 * el watcher ni provocar un reload del componente.
 */
function maybeUpgradeUrlWithSlug(p) {
  if (!p) return;
  const currentParam = String(route.params.id || "");
  if (hasSlugInPath(currentParam)) return; // ya tiene slug, nada que hacer
  const pretty = buildProductPath(p);
  if (!pretty || pretty === currentParam) return;

  const q = new URLSearchParams(route.query).toString();
  const newPath = `/shop/product/${pretty}${q ? `?${q}` : ""}${window.location.hash || ""}`;
  try {
    window.history.replaceState(window.history.state, "", newPath);
  } catch {}
}

// ✅ 1 sola fuente de verdad: watch immediate. Disparamos sólo cuando cambia el
// id real extraído del param (no cuando el slug se actualice por replaceState).
watch(
  () => extractProductId(route.params.id),
  () => load(),
  { immediate: true }
);

// OG si cambian query params (no vuelve a pedir producto)
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

onBeforeUnmount(() => {
  try {
    abortCtrl?.abort?.();
  } catch {}
});
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

/* ✅ Shell único estilo Mercado Libre: UNA card que envuelve galería
   + panel de compra. Las sub-cards no llevan borde ni sombra propios
   (ver ProductGallery / ProductPurchasePanel). El divisor vertical
   entre columnas es una hairline, no un gap. */
.pdp-shell {
  margin-top: 8px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 18px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.product-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 0;
  align-items: stretch;
  /* hairline vertical entre las 2 columnas */
  background: rgba(0, 0, 0, 0.06);
  column-gap: 1px;
}
.product-grid > * {
  background: #fff;
  min-width: 0;
}

.below-block {
  margin-top: 16px;
}

/* ✅ Info tabs + medios de pago: 2 columnas estilo ML */
.info-payments-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
  align-items: stretch;
}
.info-col,
.payments-col {
  min-width: 0;
}
.info-col > *,
.payments-col > * {
  height: 100%;
}

@media (max-width: 1100px) {
  .info-payments-grid {
    grid-template-columns: 1fr;
  }
}

/* Loading */
.loading-wrap {
  width: 100%;
  padding: 42px 12px;
  display: grid;
  place-items: center;
  text-align: center;
}

@media (max-width: 1200px) {
  .product-grid {
    grid-template-columns: 1fr;
    /* en mobile el divider va en horizontal entre filas */
    column-gap: 0;
    row-gap: 1px;
  }
}
</style>