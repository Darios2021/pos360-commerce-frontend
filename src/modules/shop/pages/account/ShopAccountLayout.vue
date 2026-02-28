<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/pages/account/ShopAccountLayout.vue -->
<template>
  <div class="acc-shell">
    <!-- ✅ TOP BAR (solo cuenta) -->
    <header class="acc-top">
      <button class="acc-back" type="button" @click="goBack" aria-label="Volver">
        <v-icon size="22">mdi-arrow-left</v-icon>
      </button>

      <div class="acc-title">Mi cuenta</div>

      <div class="acc-right">
        <v-chip v-if="auth.isLogged" size="small" variant="tonal" class="acc-chip">
          <span class="acc-initials">{{ auth.initials }}</span>
          <span class="acc-name">{{ auth.fullName }}</span>
        </v-chip>
      </div>
    </header>

    <!-- ✅ Tabs -->
    <nav class="acc-tabs" aria-label="Secciones">
      <router-link to="/shop/account/orders" class="acc-tab" :class="{ active: isActive('/shop/account/orders') }">
        <v-icon size="18">mdi-receipt-text-outline</v-icon>
        <span>Mis compras</span>
      </router-link>

      <router-link to="/shop/account/favorites" class="acc-tab" :class="{ active: isActive('/shop/account/favorites') }">
        <v-icon size="18">mdi-heart-outline</v-icon>
        <span>Favoritos</span>
      </router-link>
    </nav>

    <main class="acc-body">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from "vue-router";
import { useShopAuthStore } from "@/modules/shop/service/shopAuth.store";

const router = useRouter();
const route = useRoute();
const auth = useShopAuthStore();

function goBack() {
  router.back();
}

function isActive(path) {
  return String(route.path || "").startsWith(path);
}
</script>

<style scoped>
/* ✅ NOTE:
   Este layout SOLO vive dentro /shop/account/*
   Si tu ShopHeader es sticky arriba, lo ideal es ocultarlo por route meta.
*/

.acc-shell {
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-background));
}

/* ✅ Barra superior */
.acc-top {
  position: sticky;
  top: 0;
  z-index: 30;

  height: 56px;
  display: grid;
  grid-template-columns: 46px 1fr auto;
  align-items: center;
  padding: 0 12px;

  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.acc-back {
  height: 40px;
  width: 40px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: inherit;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.acc-back:hover {
  background: rgba(255, 255, 255, 0.20);
}

.acc-title {
  font-weight: 900;
  font-size: 15px;
  letter-spacing: 0.2px;
}

.acc-right {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.acc-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgb(var(--v-theme-on-primary)) !important;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(0, 0, 0, 0.10) !important;
}

/* ✅ FIX: evita “huevo blanco” */
.acc-initials {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-weight: 950;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.acc-name {
  max-width: 210px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 800;
}

/* ✅ Tabs */
.acc-tabs {
  position: sticky;
  top: 56px; /* debajo de la barra */
  z-index: 25;

  display: grid;
  grid-template-columns: 1fr 1fr;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.acc-tab {
  padding: 12px 10px;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  text-decoration: none;

  color: rgba(var(--v-theme-on-surface), 0.72);
  font-weight: 800;
  font-size: 13px;
  position: relative;
}

.acc-tab:hover {
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.acc-tab.active {
  color: rgb(var(--v-theme-primary));
}

.acc-tab.active::after {
  content: "";
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 0;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: rgb(var(--v-theme-primary));
}

/* ✅ Body */
.acc-body {
  padding: 14px 12px 28px;
  width: min(1200px, calc(100% - 24px));
  margin: 0 auto;
}

/* ✅ Mobile */
@media (max-width: 600px) {
  .acc-name {
    max-width: 120px;
  }

  .acc-body {
    width: calc(100% - 24px);
  }
}
</style>