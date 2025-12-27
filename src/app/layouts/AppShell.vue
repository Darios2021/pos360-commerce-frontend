<!-- src/app/layouts/AppShell.vue -->
<template>
  <v-app>
    <v-layout>
      <!-- Header -->
      <v-app-bar elevation="0" color="surface" height="72" class="pos-appbar">
        <template #prepend>
          <v-btn
            :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
            variant="text"
            @click="toggleRail"
            :title="rail ? 'Expandir menú' : 'Contraer menú'"
          />
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

      <!-- ✅ Drawer manual: SIN expand-on-hover -->
      <v-navigation-drawer
        v-model="drawer"
        permanent
        :rail="rail"
        width="280"
        rail-width="72"
        class="pos-drawer"
      >
        <div class="pt-2"></div>

        <div v-if="!rail" class="px-4 py-2 text-caption text-medium-emphasis">Navegación</div>

        <v-list nav density="comfortable">
          <v-list-item
            :to="{ name: 'home' }"
            prepend-icon="mdi-view-dashboard-outline"
            title="Dashboard"
            exact
          >
            <v-tooltip v-if="rail" activator="parent" location="right">Dashboard</v-tooltip>
          </v-list-item>

          <v-list-item
            :to="{ name: 'pos' }"
            prepend-icon="mdi-point-of-sale"
            title="Punto de Venta"
            exact
          >
            <v-tooltip v-if="rail" activator="parent" location="right">Punto de Venta</v-tooltip>
          </v-list-item>

          <v-list-item
            :to="{ name: 'posSales' }"
            prepend-icon="mdi-receipt-text-outline"
            title="Ventas"
            exact
          >
            <v-tooltip v-if="rail" activator="parent" location="right">Ventas</v-tooltip>
          </v-list-item>

          <v-divider class="my-2" />

          <div v-if="!rail" class="px-4 py-2 text-caption text-medium-emphasis">Gestión</div>

          <v-list-item
            :to="{ name: 'products' }"
            prepend-icon="mdi-package-variant-closed"
            title="Productos"
            exact
          >
            <v-tooltip v-if="rail" activator="parent" location="right">Productos</v-tooltip>
          </v-list-item>

          <v-list-item
            :to="{ name: 'productsImport' }"
            prepend-icon="mdi-database-import-outline"
            title="Importar CSV"
            exact
          >
            <v-tooltip v-if="rail" activator="parent" location="right">Importar CSV</v-tooltip>
          </v-list-item>

          <v-divider class="my-2" />

          <div v-if="!rail" class="px-4 py-2 text-caption text-medium-emphasis">Sistema</div>

          <v-list-group v-if="showConfig" value="config" prepend-icon="mdi-cog-outline">
            <template #activator="{ props }">
              <v-list-item v-bind="props" title="Configuración">
                <v-tooltip v-if="rail" activator="parent" location="right">Configuración</v-tooltip>
              </v-list-item>
            </template>

            <v-list-item
              v-if="hasRoute('stock')"
              :to="{ name: 'stock' }"
              prepend-icon="mdi-warehouse"
              title="Stock"
              exact
            />

            <v-list-item
              v-if="isAdmin && hasRoute('inventory')"
              :to="{ name: 'inventory' }"
              prepend-icon="mdi-clipboard-list-outline"
              title="Gestión de inventario"
              exact
            />

            <v-list-item
              v-if="hasRoute('categories')"
              :to="{ name: 'categories' }"
              prepend-icon="mdi-shape-outline"
              title="Categorías"
              exact
            />

            <v-list-item
              v-if="isAdmin && hasRoute('users')"
              :to="{ name: 'users' }"
              prepend-icon="mdi-account-multiple-outline"
              title="Usuarios"
              exact
            />

            <v-list-item
              v-if="isAdmin && hasRoute('roles')"
              :to="{ name: 'roles' }"
              prepend-icon="mdi-shield-account-outline"
              title="Roles y permisos"
              exact
            />
          </v-list-group>
        </v-list>

        <v-spacer />

        <!-- Bottom -->
        <div class="px-4 pb-2" v-if="!rail">
          <v-card rounded="lg" variant="tonal" class="pa-3">
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center ga-2">
                <v-icon>{{ isDark ? "mdi-weather-night" : "mdi-white-balance-sunny" }}</v-icon>
                <div class="text-body-2 font-weight-bold">Modo oscuro</div>
              </div>

              <v-switch
                inset
                hide-details
                density="compact"
                :model-value="isDark"
                @update:model-value="setDark"
              />
            </div>

            <div class="text-caption text-medium-emphasis mt-1">
              Se guarda en el navegador.
            </div>
          </v-card>
        </div>

        <div class="px-2 pb-2" v-else>
          <v-btn
            block
            variant="text"
            :icon="isDark ? 'mdi-weather-night' : 'mdi-white-balance-sunny'"
            @click="setDark(!isDark)"
          >
            <v-tooltip activator="parent" location="right">Modo oscuro</v-tooltip>
          </v-btn>
        </div>

        <div class="pa-4 text-caption text-medium-emphasis" v-if="!rail">v1 · 2025</div>
        <div class="px-2 pb-4 text-caption text-medium-emphasis text-center" v-else>v1</div>
      </v-navigation-drawer>

      <v-main class="pos-main">
        <v-container fluid class="pos-container">
          <slot />
        </v-container>
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useTheme } from "vuetify";
import { useRouter } from "vue-router";

import { useAuthStore } from "../store/auth.store";
import { useThemeStore } from "../store/theme.store";

const drawer = ref(true);
const rail = ref(false);

const auth = useAuthStore();
const router = useRouter();

const theme = useTheme();
const themeStore = useThemeStore();

const userLabel = computed(() => auth?.user?.email || auth?.user?.username || "Usuario");
const isDark = computed(() => themeStore.isDark);

const isAdmin = computed(() => {
  const r = auth.roles || [];
  return r.includes("admin") || r.includes("super_admin");
});

function hasRoute(name) {
  try {
    return router?.hasRoute?.(name) === true;
  } catch {
    return false;
  }
}

const showConfig = computed(() => {
  return (
    hasRoute("stock") ||
    hasRoute("inventory") ||
    hasRoute("categories") ||
    hasRoute("users") ||
    hasRoute("roles") ||
    hasRoute("branches") ||
    hasRoute("warehouses") ||
    hasRoute("posSettings") ||
    hasRoute("paymentMethods") ||
    hasRoute("taxes") ||
    hasRoute("documents") ||
    hasRoute("integrations")
  );
});

function toggleRail() {
  rail.value = !rail.value;
}

function applyVuetifyTheme(dark) {
  const name = dark ? "dark" : "light";
  try {
    if (typeof theme?.change === "function") theme.change(name);
    else if (theme?.global?.name) theme.global.name.value = name;
  } catch {
    // ignore
  }
}

function setDark(v) {
  themeStore.setDark(!!v);
  applyVuetifyTheme(!!v);
}

watch(
  () => themeStore.isDark,
  (v) => applyVuetifyTheme(!!v),
  { immediate: true }
);

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
