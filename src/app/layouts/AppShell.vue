<!-- src/app/layouts/AppShell.vue -->
<template>
  <v-app>
    <v-layout>
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

          <v-list-item :to="{ name: 'posSales' }" prepend-icon="mdi-receipt-text-outline" title="Ventas" />

          <v-divider class="my-2" />
          <div class="px-4 py-2 text-caption text-medium-emphasis">Gestión</div>

          <v-list-item :to="{ name: 'products' }" prepend-icon="mdi-package-variant-closed" title="Productos" />
          <v-list-item :to="{ name: 'productsImport' }" prepend-icon="mdi-database-import-outline" title="Importar CSV" />
          <v-list-item :to="{ name: 'stock' }" prepend-icon="mdi-warehouse" title="Stock" />

          <!-- =========================
               ✅ CONFIGURACIÓN (nuevo)
               - Agrupa inventario, categorías, usuarios, etc.
               - Cada item solo se muestra si existe la ruta (router.hasRoute)
               ========================= -->
          <v-divider class="my-2" />
          <div class="px-4 py-2 text-caption text-medium-emphasis">Sistema</div>

          <v-list-group
            v-if="showConfig"
            value="config"
            prepend-icon="mdi-cog-outline"
          >
            <template #activator="{ props }">
              <v-list-item v-bind="props" title="Configuración" />
            </template>

            <!-- ✅ Inventario (solo admin) -->
            <v-list-item
              v-if="isAdmin && hasRoute('inventory')"
              :to="{ name: 'inventory' }"
              prepend-icon="mdi-clipboard-list-outline"
              title="Gestión de inventario"
            />

            <!-- ✅ Categorías (rubro/subrubro) -->
            <v-list-item
              v-if="hasRoute('categories')"
              :to="{ name: 'categories' }"
              prepend-icon="mdi-shape-outline"
              title="Categorías"
            />

            <!-- ✅ Usuarios / roles (solo admin) -->
            <v-list-item
              v-if="isAdmin && hasRoute('users')"
              :to="{ name: 'users' }"
              prepend-icon="mdi-account-multiple-outline"
              title="Usuarios"
            />

            <v-list-item
              v-if="isAdmin && hasRoute('roles')"
              :to="{ name: 'roles' }"
              prepend-icon="mdi-shield-account-outline"
              title="Roles y permisos"
            />

            <!-- ✅ Estructura de sucursales y depósitos (solo admin) -->
            <v-list-item
              v-if="isAdmin && hasRoute('branches')"
              :to="{ name: 'branches' }"
              prepend-icon="mdi-storefront-outline"
              title="Sucursales"
            />

            <v-list-item
              v-if="isAdmin && hasRoute('warehouses')"
              :to="{ name: 'warehouses' }"
              prepend-icon="mdi-warehouse"
              title="Depósitos"
            />

            <!-- ✅ Parametrización POS -->
            <v-list-item
              v-if="isAdmin && hasRoute('posSettings')"
              :to="{ name: 'posSettings' }"
              prepend-icon="mdi-cash-register"
              title="Parámetros POS"
            />

            <v-list-item
              v-if="isAdmin && hasRoute('paymentMethods')"
              :to="{ name: 'paymentMethods' }"
              prepend-icon="mdi-credit-card-outline"
              title="Medios de pago"
            />

            <v-list-item
              v-if="isAdmin && hasRoute('taxes')"
              :to="{ name: 'taxes' }"
              prepend-icon="mdi-percent-outline"
              title="Impuestos"
            />

            <v-list-item
              v-if="isAdmin && hasRoute('documents')"
              :to="{ name: 'documents' }"
              prepend-icon="mdi-file-document-outline"
              title="Comprobantes"
            />

            <!-- ✅ Integraciones -->
            <v-list-item
              v-if="isAdmin && hasRoute('integrations')"
              :to="{ name: 'integrations' }"
              prepend-icon="mdi-lan-connect"
              title="Integraciones"
            />
          </v-list-group>
        </v-list>

        <v-divider class="my-2" />

        <!-- ✅ Switch dark mode -->
        <div class="px-4 pb-2">
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

        <v-spacer />

        <div class="pa-4 text-caption text-medium-emphasis">v1 · 2025</div>
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
import { useDisplay, useTheme } from "vuetify";
import { useRouter } from "vue-router";

import { useAuthStore } from "../store/auth.store";
import { useThemeStore } from "../store/theme.store";

const { mdAndUp } = useDisplay();
const drawer = ref(true);

const auth = useAuthStore();
const router = useRouter();

const theme = useTheme();
const themeStore = useThemeStore();

const userLabel = computed(() => auth?.user?.email || auth?.user?.username || "Usuario");
const isDark = computed(() => themeStore.isDark);

// ✅ Admin gate
const isAdmin = computed(() => {
  const r = auth.roles || [];
  return r.includes("admin") || r.includes("super_admin");
});

// ✅ Mostrar items solo si existe la ruta (evita links rotos mientras armás módulos)
function hasRoute(name) {
  try {
    return router?.hasRoute?.(name) === true;
  } catch {
    return false;
  }
}

// ✅ Mostrar “Configuración” solo si hay algo para mostrar
const showConfig = computed(() => {
  // Si no existe ninguna ruta, no mostramos el group
  const any =
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
    hasRoute("integrations");

  // Si hay rutas “públicas” o el usuario es admin para las admin-only
  // (igual cada item ya está gateado; esto solo evita mostrar el group vacío)
  return any;
});

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
