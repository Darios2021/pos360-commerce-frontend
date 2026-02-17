<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/pages/account/ShopAccountLayout.vue -->
<template>
  <div class="acc">
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

    <!-- Tabs estilo ML -->
    <nav class="acc-tabs" aria-label="Secciones">
      <router-link
        to="/shop/account/orders"
        class="acc-tab"
        :class="{ active: isActive('/shop/account/orders') }"
      >
        <v-icon size="18">mdi-receipt-text-outline</v-icon>
        <span>Mis compras</span>
      </router-link>

      <router-link
        to="/shop/account/favorites"
        class="acc-tab"
        :class="{ active: isActive('/shop/account/favorites') }"
      >
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
import { useShopAuthStore } from "@/modules/shop/store/shopAuth.store";

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
.acc {
  min-height: calc(100vh - 120px);
  background: #f4f4f4;
}

.acc-top {
  height: 56px;
  display: grid;
  grid-template-columns: 46px 1fr auto;
  align-items: center;
  padding: 0 10px;
  background: #2e86c1; /* similar a tu barra */
  color: #fff;
}

.acc-back {
  height: 40px;
  width: 40px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.acc-title {
  font-weight: 900;
  font-size: 15px;
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
  color: #fff;
}

.acc-initials {
  font-weight: 900;
}

.acc-name {
  max-width: 190px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.acc-tabs {
  position: sticky;
  top: 0;
  z-index: 3;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #fff;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.acc-tab {
  padding: 12px 10px;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: rgba(0,0,0,0.7);
  font-weight: 700;
  font-size: 13px;
  position: relative;
}

.acc-tab.active {
  color: #2e86c1;
}

.acc-tab.active::after {
  content: "";
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 0;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: #2e86c1;
}

.acc-body {
  padding: 14px 12px 22px;
}
</style>
