<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/layouts/ShopLayout.vue -->
<template>
  <v-layout class="shop-shell d-flex flex-column" data-layout="shop">
    <div class="shop-header">
      <ShopHeader />
    </div>

    <v-main class="shop-main">
      <router-view />
    </v-main>

    <!-- ✅ Bottom nav SOLO acá (NO en páginas) -->
    <ShopBottomNav v-if="isMobile" />
  </v-layout>
</template>

<script setup>
import { computed } from "vue";
import { useDisplay } from "vuetify";

import ShopHeader from "@/modules/shop/components/ShopHeader.vue";
import ShopBottomNav from "@/modules/shop/components/ShopBottomNav.vue";

const { xs } = useDisplay();
const isMobile = computed(() => !!xs.value);
</script>

<style scoped>
.shop-shell {
  min-height: 100dvh;
  background: #fff;
  width: 100%;
}

.shop-header {
  width: 100%;
  flex: 0 0 auto;
}

.shop-main {
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
}

/* ✅ deja espacio real para la barra inferior */
@media (max-width: 600px) {
  .shop-main {
    padding-bottom: calc(var(--ml-bottom-nav-h, 64px) + env(safe-area-inset-bottom));
  }
}
</style>
