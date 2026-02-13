<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/ShopBottomNav.vue -->

<template>
  <nav class="ml-bottom-nav" aria-label="Navegación inferior">
    <router-link to="/shop" class="ml-nav-item" :class="{ active: isActive('/shop', true) }">
      <v-icon>mdi-home-outline</v-icon>
      <span>Inicio</span>
    </router-link>

    <router-link
      to="/shop/categories"
      class="ml-nav-item"
      :class="{ active: isCategoriesActive }"
      aria-label="Categorías"
    >
      <v-icon>mdi-view-grid-outline</v-icon>
      <span>Categorías</span>
    </router-link>

    <router-link to="/shop/cart" class="ml-nav-item" :class="{ active: isActive('/shop/cart') }">
      <v-badge :content="cart.count" color="red" v-if="cart.count > 0">
        <v-icon>mdi-cart-outline</v-icon>
      </v-badge>
      <v-icon v-else>mdi-cart-outline</v-icon>
      <span>Carrito</span>
    </router-link>

    <router-link to="/shop/clips" class="ml-nav-item" :class="{ active: isActive('/shop/clips') }">
      <v-icon>mdi-lightning-bolt-outline</v-icon>
      <span>Clips</span>
    </router-link>

    <router-link to="/shop/more" class="ml-nav-item" :class="{ active: isActive('/shop/more') }">
      <v-icon>mdi-menu</v-icon>
      <span>Más</span>
    </router-link>
  </nav>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";

const route = useRoute();
const cart = useShopCartStore();

function isActive(path, exactShopHome = false) {
  const p = route.path || "";
  if (exactShopHome && path === "/shop") return p === "/shop";
  return p.startsWith(path);
}

const isCategoriesActive = computed(() => {
  const p = route.path || "";
  return p.startsWith("/shop/categories") || p.startsWith("/shop/c/") || p.startsWith("/shop/category/");
});
</script>

<style scoped>
.ml-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 64px;
  background: #ffffff;
  border-top: 1px solid #e9e9e9;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 250;
  padding-bottom: env(safe-area-inset-bottom);
}

.ml-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  text-decoration: none;
  color: #7a7a7a;
  min-width: 64px;
}

.ml-nav-item.active {
  color: #1976d2;
}

.ml-nav-item :deep(.v-icon) {
  font-size: 22px;
}
</style>
