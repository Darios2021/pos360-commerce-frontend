<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/ShopMobileBottomNav.vue -->

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

    <!-- Carrito (CENTRAL ML) -->
    <router-link
      to="/shop/cart"
      class="ml-nav-item is-cart"
      :class="{ active: isActive('/shop/cart') }"
      aria-label="Carrito"
    >
      <div class="ml-cart-bubble" aria-hidden="true">
        <v-badge :content="cart.count" color="red" v-if="cart.count > 0">
          <v-icon>mdi-cart-outline</v-icon>
        </v-badge>
        <v-icon v-else>mdi-cart-outline</v-icon>
      </div>
      <span class="ml-cart-label">Carrito</span>
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
  return p.startsWith("/shop/categories") || p.startsWith("/shop/c/") || p.startsWith("/shop/category/");
});
</script>

<style scoped>
/* ================================
   Bottom Nav base
================================ */

.ml-bottom-nav{
  --ml-nav-h: 64px;
  --ml-safe: env(safe-area-inset-bottom);

  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;

  height: calc(var(--ml-nav-h) + var(--ml-safe));
  padding-bottom: var(--ml-safe);

  display: flex;
  align-items: center;
  justify-content: space-around;

  background: #ffffff;
  border-top: 1px solid rgba(0,0,0,.12);

  box-shadow: 0 -4px 12px rgba(0,0,0,.08);

  z-index: 250;
}

/* ================================
   Items normales
================================ */

.ml-nav-item{
  flex: 1 1 0;
  min-width: 64px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap: 3px;

  text-decoration: none;
  color: #6f6f6f;

  font-size: 11px;
  line-height: 1;
}

.ml-nav-item :deep(.v-icon){
  font-size: 22px;
}

.ml-nav-item.active{
  color: #1976d2;
  font-weight: 700;
}

/* ================================
   Carrito central estilo ML (LIMPIO)
================================ */

.ml-nav-item.is-cart{
  position: relative;
  transform: translateY(-14px);
  z-index: 5;
}

/* círculo flotante real */
.ml-cart-bubble{
  width: 60px;
  height: 60px;
  border-radius: 50%;

  background: #ffffff;
  border: 1px solid rgba(0,0,0,.10);

  display: flex;
  align-items: center;
  justify-content: center;

  /* UNA sola sombra suave */
  box-shadow: 0 12px 20px rgba(0,0,0,.18);
}

/* icono más grande */
.ml-cart-bubble :deep(.v-icon){
  font-size: 26px;
}

/* badge bien posicionado */
.ml-cart-bubble :deep(.v-badge__badge){
  top: 6px;
  right: 6px;
  font-size: 10px;
  min-width: 18px;
  height: 18px;
}

/* texto debajo */
.ml-cart-label{
  margin-top: 4px;
}
</style>


