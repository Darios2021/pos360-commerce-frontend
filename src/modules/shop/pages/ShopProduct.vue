<!-- ✅ COPY-PASTE FINAL COMPLETO (similares por categoría/sub con getCatalog) -->
<!-- src/modules/shop/pages/ShopProduct.vue -->
<template>
  <v-container class="py-6">
    <ShopCartDrawer />

    <div class="product-shell">
      <div class="breadcrumb-wrap">
        <ShopBreadcrumb v-if="product" :product="product" />
      </div>

      <div v-if="product" class="product-layout">
        <ProductGallery :product="product" />

        <ProductPurchasePanel
          :product="product"
          @add="onAddToCart"
          @buy="onBuyNow"
        />
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
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import ShopBreadcrumb from "@/modules/shop/components/ShopBreadcrumb.vue";
import ProductGallery from "@/modules/shop/components/ProductGallery.vue";
import ProductPurchasePanel from "@/modules/shop/components/ProductPurchasePanel.vue";
import SimilarProductsRow from "@/modules/shop/components/SimilarProductsRow.vue";
import ShopCartDrawer from "@/modules/shop/components/ShopCartDrawer.vue";

import { getProduct, getCatalog } from "@/modules/shop/service/shop.public.api";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";

const route = useRoute();
const router = useRouter();
const cart = useShopCartStore();

const product = ref(null);

const similar = ref([]);
const similarLoading = ref(false);

function onAddToCart(p, qty = 1) {
  cart.add(p, qty);
}

function onBuyNow(p, qty = 1) {
  cart.add(p, qty);
  cart.closeDrawer?.();
  router.push("/shop/cart");
}

function resolveCategoryId(p) {
  return (
    p?.category_id ||
    p?.Category?.id ||
    p?.category?.id ||
    p?.parent_category_id ||
    null
  );
}

function resolveSubcategoryId(p) {
  return (
    p?.subcategory_id ||
    p?.Subcategory?.id ||
    p?.subcategory?.id ||
    null
  );
}

const resolvedCategoryId = computed(() => resolveCategoryId(product.value));
const resolvedSubcategoryId = computed(() => resolveSubcategoryId(product.value));

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
    // 1) Intento más cercano: misma subcategoría (si existe)
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

    // 2) Fallback: misma categoría (incluye hijos)
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
    similar.value = arr2
      .filter((x) => Number(x?.product_id ?? x?.id) !== productId)
      .slice(0, 12);
  } catch (e) {
    console.error("❌ fetchSimilar(getCatalog)", e);
    similar.value = [];
  } finally {
    similarLoading.value = false;
  }
}

async function load() {
  product.value = null;
  similar.value = [];
  similarLoading.value = false;

  const p = await getProduct(route.params.id);
  product.value = p;

  await fetchSimilar(p);
}

onMounted(load);
watch(() => route.params.id, load);
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

.product-layout {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  margin-top: 6px;
  flex-wrap: wrap;
}

.product-layout > :deep(.pg-card),
.product-layout > :deep(.v-card:first-child) {
  flex: 1.2;
  min-width: 0;
}

.product-layout > :deep(.info) {
  flex: 0.8;
  min-width: 340px;
}

@media (max-width: 1200px) {
  .product-layout {
    flex-direction: column;
    align-items: center;
  }

  .product-layout > :deep(.pg-card) {
    width: 100%;
    max-width: 720px;
    margin: 0 auto;
  }

  .product-layout > :deep(.info) {
    width: 100%;
    max-width: 720px;
    min-width: 0;
    margin: 0 auto;
    position: static !important;
    top: auto !important;
  }
}
</style>
