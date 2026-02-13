<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/layouts/ShopLayout.vue -->

<template>
  <div class="shop-layout" data-layout="shop">
    <ShopHeader />

    <!-- ✅ main: deja espacio para bottom nav en mobile -->
    <main class="shop-main" :class="{ 'has-bottom-nav': isMobile }">
      <router-view />
    </main>

    <ShopFooter />

    <!-- ✅ Bottom Nav SIEMPRE (solo mobile) -->
    <ShopMobileBottomNav v-if="isMobile" />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useDisplay } from "vuetify";

import ShopHeader from "@/modules/shop/components/ShopHeader.vue";
import ShopFooter from "@/modules/shop/components/ShopFooter.vue";
import ShopMobileBottomNav from "@/modules/shop/components/ShopMobileBottomNav.vue";

const { xs } = useDisplay();
const isMobile = computed(() => !!xs.value);
</script>

<style scoped>
.shop-layout {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.shop-main {
  flex: 1 1 auto;
  min-height: 0; /* ✅ clave para layouts con scroll */
}

/* ✅ deja espacio para el nav fijo */
.shop-main.has-bottom-nav {
  padding-bottom: calc(64px + env(safe-area-inset-bottom));
}
</style>
