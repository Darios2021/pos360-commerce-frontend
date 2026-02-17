<template>
  <nav class="ml-bottom-nav" aria-label="Navegación inferior">
    <!-- Inicio -->
    <router-link to="/shop" class="ml-nav-item" :class="{ active: isActive('/shop', true) }">
      <v-icon>mdi-home-outline</v-icon>
      <span>Inicio</span>
    </router-link>

    <!-- Categorías -->
    <router-link
      to="/shop/categories"
      class="ml-nav-item"
      :class="{ active: isCategoriesActive }"
      aria-label="Categorías"
    >
      <v-icon>mdi-view-grid-outline</v-icon>
      <span>Categorías</span>
    </router-link>

    <!-- Carrito (CENTRAL estilo ML) -->
    <router-link
      to="/shop/cart"
      class="ml-nav-item ml-nav-item-cart"
      :class="{ active: isActive('/shop/cart') }"
    >
      <div class="ml-cart-bubble">
        <v-badge :content="cart.count" color="red" v-if="cart.count > 0">
          <v-icon>mdi-cart-outline</v-icon>
        </v-badge>
        <v-icon v-else>mdi-cart-outline</v-icon>
      </div>
      <span>Carrito</span>
    </router-link>

    <!-- Clips -->
    <router-link to="/shop/clips" class="ml-nav-item" :class="{ active: isActive('/shop/clips') }">
      <v-icon>mdi-lightning-bolt-outline</v-icon>
      <span>Clips</span>
    </router-link>

    <!-- Más -->
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
  return (
    p.startsWith("/shop/categories") ||
    p.startsWith("/shop/c/") ||
    p.startsWith("/shop/category/")
  );
});
</script>

<style scoped>
/* ================================
   ML Bottom Nav – versión reforzada
================================ */

.ml-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 64px;

  /* 🔥 Fondo un poco más marcado */
  background: #f3f4f6;

  /* 🔥 Línea superior más visible */
  border-top: 1px solid rgba(0, 0, 0, 0.12);

  /* 🔥 Sombra tipo ML */
  box-shadow:
    0 -2px 6px rgba(0, 0, 0, 0.06),
    0 -8px 20px rgba(0, 0, 0, 0.04);

  display: flex;
  justify-content: space-around;
  align-items: center;

  z-index: 250;
  padding-bottom: env(safe-area-inset-bottom);
}

/* Items */
.ml-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  text-decoration: none;
  color: #6f6f6f;
  min-width: 64px;
  transition: color 0.2s ease;
}

/* Iconos */
.ml-nav-item :deep(.v-icon) {
  font-size: 22px;
}

/* Activo */
.ml-nav-item.active {
  color: #1976d2;
  font-weight: 600;
}

/* ================================
   Carrito central estilo ML
================================ */

.ml-nav-item:nth-child(3) {
  position: relative;
  transform: translateY(-8px);
}

.ml-nav-item:nth-child(3)::before {
  content: "";
  position: absolute;
  width: 56px;
  height: 56px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow:
    0 4px 10px rgba(0, 0, 0, 0.12),
    0 0 0 4px #f3f4f6; /* aro del mismo color del footer */
  top: -14px;
  z-index: -1;
}

/* Texto carrito centrado */
.ml-nav-item:nth-child(3) span {
  margin-top: 4px;
}
</style>
