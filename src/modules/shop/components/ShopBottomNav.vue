<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/ShopBottomNav.vue -->

<template>
  <nav class="ml-bottom-nav" aria-label="Navegación inferior">
    <!-- Inicio -->
    <button
      type="button"
      class="ml-nav-item ml-nav-button"
      :class="{ active: isActive('/shop', true) }"
      aria-label="Inicio"
      @click="goHome"
    >
      <v-icon>mdi-home-outline</v-icon>
      <span>Inicio</span>
    </button>

    <!-- Categorías -->
    <router-link
      to="/shop/categories"
      class="ml-nav-item"
      :class="{ active: isCategoriesActive }"
    >
      <v-icon>mdi-view-grid-outline</v-icon>
      <span>Categorías</span>
    </router-link>

    <!-- Carrito -->
    <router-link
      to="/shop/cart"
      class="ml-nav-item is-cart"
      :class="{ active: isActive('/shop/cart') }"
    >
      <div class="ml-cart-bubble">
        <v-badge v-if="cart.count > 0" :content="cart.count" color="red">
          <v-icon>mdi-cart-outline</v-icon>
        </v-badge>
        <v-icon v-else>mdi-cart-outline</v-icon>
      </div>
      <span class="ml-cart-label">Carrito</span>
    </router-link>

    <!-- Clips -->
    <router-link
      to="/shop/clips"
      class="ml-nav-item"
      :class="{ active: isActive('/shop/clips') }"
    >
      <v-icon>mdi-lightning-bolt-outline</v-icon>
      <span>Clips</span>
    </router-link>

    <!-- Más -->
    <router-link
      to="/shop/more"
      class="ml-nav-item"
      :class="{ active: isActive('/shop/more') }"
    >
      <v-icon>mdi-menu</v-icon>
      <span>Más</span>
    </router-link>
  </nav>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";

const route = useRoute();
const router = useRouter();
const cart = useShopCartStore();

function isActive(path, exact = false) {
  const p = route.path || "";
  if (exact) return p === path;
  return p.startsWith(path);
}

const isCategoriesActive = computed(() => {
  const p = route.path || "";
  return p.startsWith("/shop/categories") || p.startsWith("/shop/c/") || p.startsWith("/shop/category/");
});

function canGoBackToShopHome() {
  try {
    const back = window?.history?.state?.back || "";
    return typeof back === "string" && back === "/shop";
  } catch {
    return false;
  }
}

function goHome() {
  if (route.fullPath === "/shop") return;

  // ✅ si venimos de una navegación desde el home, volver conserva el scroll real
  if (canGoBackToShopHome()) {
    router.back();
    return;
  }

  // ✅ fallback estable
  router.push("/shop");
}
</script>

<style scoped>
/* NAV */

.ml-bottom-nav{
  --ml-nav-h:64px;
  --ml-safe:env(safe-area-inset-bottom);

  position:fixed;
  left:0;
  right:0;
  bottom:0;

  height:calc(var(--ml-nav-h) + var(--ml-safe));
  padding-bottom:var(--ml-safe);

  display:flex;
  align-items:center;
  justify-content:space-around;

  background:#fff;
  border-top:1px solid rgba(0,0,0,.12);
  box-shadow:0 -4px 12px rgba(0,0,0,.08);

  z-index:250;
}

/* ITEMS */

.ml-nav-item{
  flex:1 1 0;
  min-width:64px;

  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;

  gap:3px;

  text-decoration:none;
  color:#6f6f6f;

  font-family:inherit;
  font-size:11px;
  font-weight:500;
  line-height:1.1;
  letter-spacing:0;

  -webkit-tap-highlight-color:transparent;
}

.ml-nav-item span{
  font:inherit;
  line-height:inherit;
  letter-spacing:inherit;
}

.ml-nav-button{
  appearance:none;
  -webkit-appearance:none;
  background:transparent;
  border:0;
  border-radius:0;
  padding:0;
  margin:0;
  outline:none;
  box-shadow:none;
  cursor:pointer;
  color:inherit;
  font:inherit;
}

.ml-nav-button::-moz-focus-inner{
  border:0;
  padding:0;
}

.ml-nav-item :deep(.v-icon){
  font-size:22px;
}

.ml-nav-item.active{
  color:#1976d2;
  font-weight:700;
}

/* CART */

.ml-nav-item.is-cart{
  position:relative;
  transform:translateY(-14px);
  z-index:5;
}

.ml-cart-bubble{
  width:60px;
  height:60px;
  border-radius:50%;

  background:#fff;
  border:1px solid rgba(0,0,0,.10);

  display:flex;
  align-items:center;
  justify-content:center;

  box-shadow:0 12px 20px rgba(0,0,0,.18);
}

.ml-cart-bubble :deep(.v-icon){
  font-size:26px;
}

.ml-cart-bubble :deep(.v-badge__badge){
  top:6px;
  right:6px;
  font-size:10px;
  min-width:18px;
  height:18px;
}

.ml-cart-label{
  margin-top:4px;
}
</style>