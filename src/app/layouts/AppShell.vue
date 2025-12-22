<template>
  <v-app>
    <v-app-bar elevation="0" color="surface" height="72" class="pos-appbar">
      <template #prepend>
        <v-btn icon="mdi-menu" variant="text" @click="drawer = !drawer" />
      </template>

      <div class="d-flex align-center ga-3">
        <v-avatar color="primary" variant="tonal" size="40">
          <span class="font-weight-bold">360</span>
        </v-avatar>

        <div class="d-flex flex-column">
          <div class="font-weight-bold">POS360</div>
          <div class="text-caption text-medium-emphasis">Inventario · Ecommerce · POS</div>
        </div>
      </div>

      <v-spacer />

      <v-chip variant="tonal" class="mr-3" prepend-icon="mdi-account-circle-outline">
        {{ userLabel }}
      </v-chip>

      <v-btn icon="mdi-logout-variant" variant="text" title="Salir" @click="logout" />
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      :permanent="mdAndUp"
      :temporary="!mdAndUp"
      width="280"
      class="pos-drawer"
    >
      <div class="pa-4">
        <div class="text-caption text-medium-emphasis">Navegación</div>
      </div>

      <v-list nav density="comfortable">
        <v-list-item :to="{ name: 'home' }" prepend-icon="mdi-view-dashboard-outline" title="Dashboard" />

        <v-list-item
          :to="{ name: 'pos' }"
          prepend-icon="mdi-point-of-sale"
          title="Punto de Venta"
          color="primary"
          base-color="primary"
          variant="tonal"
          class="mb-1 font-weight-bold"
        />

        <!-- ✅ NUEVO: Ventas -->
        <v-list-item
          :to="{ name: 'posSales' }"
          prepend-icon="mdi-receipt-text-outline"
          title="Ventas"
        />

        <v-divider class="my-2" />
        <div class="px-4 py-2 text-caption text-medium-emphasis">Gestión</div>

        <v-list-item :to="{ name: 'products' }" prepend-icon="mdi-package-variant-closed" title="Productos" />
        <v-list-item :to="{ name: 'productsImport' }" prepend-icon="mdi-database-import-outline" title="Importar CSV" />
        <v-list-item :to="{ name: 'stock' }" prepend-icon="mdi-warehouse" title="Stock" />
        <v-list-item :to="{ name: 'categories' }" prepend-icon="mdi-shape-outline" title="Categorías" />
      </v-list>

      <v-spacer />

      <div class="pa-4 text-caption text-medium-emphasis">v1 · 2025</div>
    </v-navigation-drawer>

    <v-main class="pos-main">
      <v-container fluid class="pos-container">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { computed, ref } from "vue";
import { useDisplay } from "vuetify";
import { useRouter } from "vue-router";
import { useAuthStore } from "../store/auth.store";

const { mdAndUp } = useDisplay();
const drawer = ref(true);

const auth = useAuthStore();
const router = useRouter();

const userLabel = computed(() => auth?.user?.email || auth?.user?.username || "Usuario");

function logout() {
  auth.logout?.();
  router.push({ name: "login" });
}
</script>

<style scoped>
.pos-appbar {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.pos-drawer {
  border-right: 1px solid rgba(0, 0, 0, 0.08);
}

.pos-main {
  background: rgb(var(--v-theme-background));
}

.pos-container {
  padding-top: 16px;
  padding-bottom: 24px;
  max-width: 1400px;
}
</style>
