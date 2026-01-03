<!-- src/modules/shop/pages/ShopProduct.vue -->
<template>
  <v-container class="py-6">
    <div class="product-shell">
      <!-- Volver -->
      <v-btn to="/shop" variant="tonal" class="mb-3">
        <v-icon start>mdi-arrow-left</v-icon> Volver
      </v-btn>

      <!-- Breadcrumb tipo ML -->
      <ShopBreadcrumb v-if="product" :product="product" />

      <div v-if="product" class="product-layout">
        <!-- LEFT: Galería -->
        <ProductGallery :product="product" />

        <!-- RIGHT: Compra -->
        <ProductPurchasePanel :product="product" @add="onAddToCart" />
      </div>

      <!-- Similares abajo -->
      <SimilarProductsRow
        v-if="product"
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
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";

import ShopBreadcrumb from "@/modules/shop/components/ShopBreadcrumb.vue";
import ProductGallery from "@/modules/shop/components/ProductGallery.vue";
import ProductPurchasePanel from "@/modules/shop/components/ProductPurchasePanel.vue";
import SimilarProductsRow from "@/modules/shop/components/SimilarProductsRow.vue";

import { getProduct, getSimilarProducts } from "@/modules/shop/service/shop.public.api";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";

const route = useRoute();
const cart = useShopCartStore();

const product = ref(null);

const similar = ref([]);
const similarLoading = ref(false);

function onAddToCart(p, qty = 1) {
  cart.add(p, qty);
}

function resolveCategoryId(p) {
  // soporta varios formatos
  return (
    p?.category_id ||
    p?.Category?.id ||
    p?.category?.id ||
    p?.parent_category_id ||
    null
  );
}

async function load() {
  product.value = null;
  similar.value = [];
  similarLoading.value = false;

  const p = await getProduct(route.params.id);
  product.value = p;

  // Similares
  const categoryId = resolveCategoryId(p);
  similarLoading.value = true;
  similar.value = await getSimilarProducts({
    productId: p?.id,
    categoryId,
    limit: 8,
  });
  similarLoading.value = false;
}

onMounted(load);
watch(() => route.params.id, load);
</script>

<style scoped>
.product-shell {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.product-layout {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  margin-top: 6px;
}

/* izquierda + derecha */
.product-layout > :deep(.v-card:first-child) {
  flex: 1.2;
  min-width: 0;
}
.product-layout > :deep(.info) {
  flex: 0.8;
  min-width: 340px;
}

@media (max-width: 980px) {
  .product-layout {
    flex-direction: column;
  }
  .product-layout > :deep(.info) {
    min-width: 0;
    width: 100%;
  }
}
</style>
