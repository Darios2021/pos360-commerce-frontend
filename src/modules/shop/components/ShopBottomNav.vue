<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/ShopBottomNav.vue -->

<template>
  <nav class="ml-bottom-nav" aria-label="Navegación inferior">
    <!-- Inicio -->
    <button
      type="button"
      class="ml-nav-item"
      :class="{ active: isHomeActive }"
      aria-label="Inicio"
      @click="goHome"
    >
      <v-icon>mdi-home-outline</v-icon>
      <span>Inicio</span>
    </button>

    <!-- Categorías -->
    <button
      type="button"
      class="ml-nav-item"
      :class="{ active: isCategoriesActive }"
      aria-label="Categorías"
      @click="goPath('/shop/categories')"
    >
      <v-icon>mdi-view-grid-outline</v-icon>
      <span>Categorías</span>
    </button>

    <!-- Carrito -->
    <button
      type="button"
      class="ml-nav-item is-cart"
      :class="{ active: isCartActive }"
      aria-label="Carrito"
      @click="goPath('/shop/cart')"
    >
      <div class="ml-cart-bubble">
        <v-badge v-if="cart.count > 0" :content="cart.count" color="red">
          <v-icon>mdi-cart-outline</v-icon>
        </v-badge>
        <v-icon v-else>mdi-cart-outline</v-icon>
      </div>
      <span class="ml-cart-label">Carrito</span>
    </button>

    <!-- Clips -->
    <button
      type="button"
      class="ml-nav-item"
      :class="{ active: isClipsActive }"
      aria-label="Clips"
      @click="goPath('/shop/clips')"
    >
      <v-icon>mdi-lightning-bolt-outline</v-icon>
      <span>Clips</span>
    </button>

    <!-- Más -->
    <button
      type="button"
      class="ml-nav-item"
      :class="{ active: isMoreActive }"
      aria-label="Más"
      @click="goPath('/shop/more')"
    >
      <v-icon>mdi-menu</v-icon>
      <span>Más</span>
    </button>
  </nav>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";

const route = useRoute();
const router = useRouter();
const cart = useShopCartStore();

/* ── Active state por pestaña — todas las computeds dependen de
   route.path, que es reactivo en useRoute(). ─────────────────────── */

const isHomeActive = computed(() => (route.path || "") === "/shop");

const isCategoriesActive = computed(() => {
  const p = route.path || "";
  return (
    p.startsWith("/shop/categories") ||
    p.startsWith("/shop/c/") ||
    p.startsWith("/shop/category/")
  );
});

const isCartActive = computed(() => (route.path || "").startsWith("/shop/cart"));
const isClipsActive = computed(() => (route.path || "").startsWith("/shop/clips"));
const isMoreActive = computed(() => (route.path || "").startsWith("/shop/more"));

/* ── Navegación ──────────────────────────────────────────────────── */

function goPath(path) {
  if (route.fullPath === path) return; // ya estás ahí — no romper scroll
  router.push(path);
}

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

  // Si venimos de una navegación desde el home, volver conserva el scroll real
  if (canGoBackToShopHome()) {
    router.back();
    return;
  }

  // Fallback estable
  router.push("/shop");
}
</script>

<style scoped>
/*
  Bottom nav estilo Mercado Libre:
  - 5 items equiproporcionales (1/5 del ancho cada uno).
  - Carrito centrado con burbuja sutilmente elevada (no domina).
  - Active state con punto + label en azul ML.
*/
.ml-bottom-nav{
  --ml-nav-h:64px;
  --ml-safe:env(safe-area-inset-bottom);
  --ml-active:#3483fa;

  position:fixed;
  left:0;
  right:0;
  bottom:0;

  height:calc(var(--ml-nav-h) + var(--ml-safe));
  padding-bottom:var(--ml-safe);

  display:flex;
  align-items:stretch;
  justify-content:space-between;

  background:#fff;
  border-top:1px solid rgba(0,0,0,.10);
  box-shadow:0 -2px 10px rgba(0,0,0,.06);

  z-index:250;
}


/* Reset uniforme para <button> que actúa como tab del nav.
   Esto neutraliza los estilos default del browser para que TODOS los
   items se rendericen exactamente igual (mismo line-height, mismo
   baseline, mismo padding) — antes "Inicio" era <button> y los otros
   <a>, lo que provocaba pequeñas diferencias visuales. */
.ml-nav-item{
  appearance:none;
  -webkit-appearance:none;
  background:transparent;
  border:0;
  outline:0;
  cursor:pointer;
  margin:0;

  flex:1 1 20%;
  width:20%;
  min-width:0;
  box-sizing:border-box;

  position:relative;

  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;

  gap:3px;
  padding:6px 0 4px;

  text-decoration:none;
  color:#737373;

  font-family:inherit;
  font-size:10.5px;
  font-weight:500;
  line-height:1.1;
  letter-spacing:0.05px;

  -webkit-tap-highlight-color:transparent;
  transition:color .14s ease;
}

.ml-nav-item::-moz-focus-inner{
  border:0;
  padding:0;
}

.ml-nav-item > span{
  display:block;
  min-height:12px;
  line-height:1.1;
  letter-spacing:inherit;
  font:inherit;
  text-align:center;
  white-space:nowrap;
}

.ml-nav-item :deep(.v-icon){
  font-size:22px;
  line-height:1;
  flex:0 0 auto;
  color:inherit;
}

/* Active — color ML, simple, sin indicador adicional para no fragmentar
   la barra en dos planos visuales. El cambio de color ya marca la pestaña. */
.ml-nav-item.active{
  color:var(--ml-active);
}
.ml-nav-item.active > span{
  font-weight:600;
}

/* Carrito — sutilmente elevado dentro del propio nav (sin transform).
   Antes salía -8px arriba y, junto con el badge rojo, generaba la
   sensación de "dos navs apilados" leídos por separado. */
.ml-nav-item.is-cart{
  position:relative;
  z-index:5;
}

.ml-cart-bubble{
  width:42px;
  height:42px;
  border-radius:50%;

  background:#f4f6f8;
  border:1px solid rgba(0,0,0,.06);

  display:flex;
  align-items:center;
  justify-content:center;

  transition:background .15s ease, border-color .15s ease, transform .15s ease;
}
.ml-nav-item.is-cart.active .ml-cart-bubble{
  background:rgba(52,131,250,0.10);
  border-color:rgba(52,131,250,0.30);
}
.ml-nav-item.is-cart:active .ml-cart-bubble{
  transform:scale(0.96);
}

.ml-cart-bubble :deep(.v-icon){
  font-size:22px;
  color:#3a3a3a;
}
.ml-nav-item.is-cart.active .ml-cart-bubble :deep(.v-icon){
  color:var(--ml-active);
}

.ml-cart-bubble :deep(.v-badge__badge){
  top:2px;
  right:2px;
  font-size:9.5px;
  min-width:15px;
  height:15px;
  padding:0 4px;
}

.ml-cart-label{
  margin-top:2px;
}

@media (max-width:380px){
  .ml-nav-item{
    font-size:10px;
    padding:6px 0 4px;
  }
  .ml-nav-item :deep(.v-icon){
    font-size:21px;
  }
  .ml-cart-bubble{
    width:40px;
    height:40px;
  }
  .ml-cart-bubble :deep(.v-icon){
    font-size:21px;
  }
}
</style>