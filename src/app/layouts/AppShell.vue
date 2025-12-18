<template>
  <v-app>
    <!-- AppBar -->
    <v-app-bar elevation="0" height="64" class="pos-appbar">
      <v-btn icon variant="text" @click="drawer = !drawer" class="mr-2">
        <v-icon>mdi-menu</v-icon>
      </v-btn>

      <div class="d-flex align-center ga-2">
        <div class="brand-badge">360</div>
        <div class="d-flex flex-column">
          <span class="brand-title">POS360</span>
          <span class="brand-subtitle">Inventario · Ecommerce · POS</span>
        </div>
      </div>

      <v-spacer />

      <v-chip variant="tonal" class="mr-2" size="small">
        {{ userLabel }}
      </v-chip>

      <v-btn icon variant="text" title="Cerrar sesión" @click="logout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :temporary="isMobile"
      :width="280"
      class="pos-drawer"
    >
      <div class="px-4 pt-4 pb-2">
        <div class="text-caption text-medium-emphasis">Navegación</div>
      </div>

      <v-list nav density="comfortable">
        <v-list-item
          :active="isActive('home')"
          prepend-icon="mdi-view-dashboard-outline"
          title="Dashboard"
          subtitle="Resumen general"
          @click="go('home')"
        />

        <v-list-item
          :active="isActive('products')"
          prepend-icon="mdi-package-variant-closed"
          title="Productos"
          subtitle="Catálogo y precios"
          @click="go('products')"
        />

        <v-list-item
          :active="isActive('stock')"
          prepend-icon="mdi-warehouse"
          title="Stock"
          subtitle="Movimientos y existencias"
          @click="go('stock')"
        />
      </v-list>

      <v-divider class="my-2" />

      <div class="px-4 pb-4">
        <v-alert variant="tonal" type="info" density="compact">
          <div class="text-caption">
            Tip: usá el buscador de productos por SKU / barcode / código.
          </div>
        </v-alert>
      </div>
    </v-navigation-drawer>

    <!-- Main -->
    <v-main class="pos-main">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import { useAuthStore } from "../store/auth.store";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const drawer = ref(true);
const { mobile } = useDisplay();
const isMobile = computed(() => mobile.value);

const userLabel = computed(() => auth?.user?.email || auth?.user?.username || "Usuario");

function go(name) {
  router.push({ name });
  if (isMobile.value) drawer.value = false;
}

function isActive(name) {
  return route.name === name;
}

function logout() {
  // Si tu store tiene logout, llamalo. Si no, limpiamos localStorage y redirect.
  if (typeof auth.logout === "function") auth.logout();
  else localStorage.removeItem("auth");

  router.push({ name: "login" });
}
</script>

<style scoped>
.pos-appbar {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(8px);
}

.pos-drawer {
  border-right: 1px solid rgba(0, 0, 0, 0.06);
}

.pos-main {
  padding: 24px 16px;
}

.brand-badge {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-weight: 800;
  letter-spacing: -0.5px;
  background: rgba(30, 94, 255, 0.12);
}

.brand-title {
  font-weight: 800;
  line-height: 1.05;
}

.brand-subtitle {
  font-size: 12px;
  opacity: 0.75;
  line-height: 1.05;
}
</style>
