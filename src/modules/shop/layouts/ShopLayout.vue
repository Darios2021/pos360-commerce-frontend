<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/layouts/ShopLayout.vue -->
<template>
  <div class="shop-shell" data-layout="shop">
    <!-- Header (tu ShopHeader actual) -->
    <ShopHeader />

    <!-- Contenido de rutas -->
    <main class="shop-main">
      <router-view />
    </main>

    <!-- ✅ Bottom nav SIEMPRE fijo en mobile (para TODAS las pantallas) -->
    <ShopMobileBottomNav v-if="isMobile" />
  </div>
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
}

/* ✅ Dejamos espacio abajo SIEMPRE en mobile para el bottom nav fijo */
.shop-main {
  min-height: calc(100dvh - 1px);
}

@media (max-width: 600px) {
  .shop-main {
    padding-bottom: calc(var(--ml-bottom-nav-h, 64px) + env(safe-area-inset-bottom));
  }
}
</style>
