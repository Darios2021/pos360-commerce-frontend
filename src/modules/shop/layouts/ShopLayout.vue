<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/layouts/ShopLayout.vue -->
<template>
  <!-- ✅ Layout provider (arregla injection) + ✅ columna (arregla que no se vaya a la derecha) -->
  <v-layout class="shop-shell d-flex flex-column" data-layout="shop">
    <!-- Header -->
    <div class="shop-header">
      <ShopHeader />
    </div>

    <!-- Contenido -->
    <v-main class="shop-main">
      <router-view />
    </v-main>

    <!-- ✅ Bottom nav fijo en mobile -->
    <ShopMobileBottomNav v-if="isMobile" />
  </v-layout>
</template>

<script setup>
import { computed } from "vue";
import { useDisplay } from "vuetify";

import ShopHeader from "@/modules/shop/components/ShopHeader.vue";
import ShopMobileBottomNav from "@/modules/shop/components/ShopMobileBottomNav.vue";

const { xs } = useDisplay();
const isMobile = computed(() => !!xs.value);
</script>

<style scoped>
/* Shell base */
.shop-shell {
  min-height: 100dvh;
  background: #fff;
  width: 100%;
}

/* Header wrapper */
.shop-header {
  width: 100%;
  flex: 0 0 auto;
}

/* Main */
.shop-main {
  width: 100%;
  flex: 1 1 auto;
  min-height: 0; /* importante para layouts flex */
}

@media (max-width: 600px) {
  .shop-main {
    padding-bottom: calc(var(--ml-bottom-nav-h, 64px) + env(safe-area-inset-bottom));
  }
}
</style>
