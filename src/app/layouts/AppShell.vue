<!-- src/app/layouts/AppShell.vue -->
<!-- ✅ COPY-PASTE FINAL COMPLETO
     - Backoffice usa PRIMARY en header (100% del color elegido)
     - Drawer opcional en PRIMARY (brand full)
     - ✅ Quita la "línea" / contorno del header (border-bottom)
     - Compatible con runtimeTheme.js (CSS vars Vuetify)
-->
<template>
  <v-app>
    <v-layout>
      <!-- ================= HEADER ================= -->
      <v-app-bar
        flat
        elevation="0"
        color="primary"
        height="72"
        class="pos-appbar"
      >
        <template #prepend>
          <v-btn
            :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
            variant="text"
            @click="toggleRail"
            :title="rail ? 'Expandir menú' : 'Contraer menú'"
          />
        </template>

        <div class="d-flex align-center ga-3">
          <v-avatar color="secondary" variant="flat" size="40">
            <span class="font-weight-bold">360</span>
          </v-avatar>

          <div class="d-flex flex-column">
            <div class="font-weight-bold">POS360</div>
            <div class="text-caption" style="opacity:.85">Inventario · Ecommerce · POS</div>
          </div>
        </div>

        <v-spacer />

        <!-- 🌙 Modo oscuro (HEADER) -->
        <v-btn
          icon
          variant="text"
          class="mr-1"
          :title="isDark ? 'Modo claro' : 'Modo oscuro'"
          @click="toggleDark"
        >
          <v-icon>{{ isDark ? "mdi-weather-night" : "mdi-white-balance-sunny" }}</v-icon>
        </v-btn>

        <!-- ===== Cuenta (Google-like) ===== -->
        <v-menu v-model="accountMenu" :close-on-content-click="false" location="bottom end" offset="12">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon variant="text" class="ml-1" title="Cuenta">
              <v-avatar size="34" class="pos-avatar-btn">
                <v-img v-if="userAvatar" :key="userAvatar" :src="userAvatar" cover />
                <span v-else class="text-caption font-weight-bold">{{ userInitials }}</span>
              </v-avatar>
            </v-btn>
          </template>

          <v-card rounded="xl" class="pos-account-card" min-width="340">
            <div class="d-flex align-center justify-space-between px-4 pt-4">
              <div class="text-caption text-medium-emphasis">Cuenta</div>
              <v-btn icon="mdi-close" variant="text" density="comfortable" @click="accountMenu = false" />
            </div>

            <div class="px-4 pt-3 pb-2 text-center">
              <v-avatar size="84" class="mx-auto mb-3 pos-account-avatar">
                <v-img v-if="userAvatar" :key="userAvatar + '-big'" :src="userAvatar" cover />
                <span v-else class="text-h6 font-weight-bold">{{ userInitials }}</span>
              </v-avatar>

              <div class="text-h6 font-weight-bold">{{ userFullName || "Usuario" }}</div>
              <div class="text-caption text-medium-emphasis">{{ userRoleLabel }}</div>
              <div class="text-caption text-medium-emphasis mt-1">{{ userEmailOrUsername }}</div>
            </div>

            <div class="px-4 pb-2">
              <v-btn
                block
                variant="tonal"
                color="primary"
                prepend-icon="mdi-account-edit-outline"
                :to="{ name: 'profile' }"
                @click="accountMenu = false"
              >
                Mi perfil
              </v-btn>
            </div>

            <v-divider class="my-3" />

            <div class="px-4 pb-4">
              <v-btn block color="red" variant="tonal" prepend-icon="mdi-logout-variant" @click="onLogout">
                Cerrar sesión
              </v-btn>
            </div>
          </v-card>
        </v-menu>
      </v-app-bar>

      <!-- ================= DRAWER ================= -->
      <!-- ✅ Si NO querés drawer azul: cambiá color="primary" por color="surface" -->
      <v-navigation-drawer
        v-model="drawer"
        permanent
        :rail="rail"
        width="280"
        rail-width="72"
        color="primary"
        class="pos-drawer"
      >
        <div class="pt-2"></div>

        <div v-if="!rail" class="px-4 py-2 text-caption" style="opacity:.85">Navegación</div>

        <v-list nav density="comfortable">
          <v-list-item :to="{ name: 'home' }" prepend-icon="mdi-view-dashboard-outline" title="Dashboard" exact>
            <v-tooltip v-if="rail" activator="parent" location="right">Dashboard</v-tooltip>
          </v-list-item>

          <v-list-item :to="{ name: 'pos' }" prepend-icon="mdi-point-of-sale" title="Punto de Venta" exact>
            <v-tooltip v-if="rail" activator="parent" location="right">Punto de Venta</v-tooltip>
          </v-list-item>

          <v-list-item :to="{ name: 'posSales' }" prepend-icon="mdi-receipt-text-outline" title="Ventas" exact>
            <v-tooltip v-if="rail" activator="parent" location="right">Ventas</v-tooltip>
          </v-list-item>

          <v-divider class="my-2" />

          <div v-if="!rail" class="px-4 py-2 text-caption" style="opacity:.85">Gestión</div>

          <v-list-item :to="{ name: 'products' }" prepend-icon="mdi-package-variant-closed" title="Productos" exact>
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

          <div v-if="!rail" class="px-4 py-2 text-caption" style="opacity:.85">Sistema</div>

          <!-- ✅ Configuración -->
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

            <!-- ✅ LEGACY: Tienda dentro de Configuración (solo si NO existe el nuevo menú Tienda) -->
            <v-list-item
              v-if="isAdmin && hasRoute('shopBranding') && !showShopMenu"
              :to="{ name: 'shopBranding' }"
              prepend-icon="mdi-storefront-outline"
              title="Tienda"
              exact
            />

            <v-list-item
              v-if="isAdmin && hasRoute('users')"
              :to="{ name: 'users' }"
              prepend-icon="mdi-account-multiple-outline"
              title="Usuarios"
              exact
            />
          </v-list-group>

          <!-- ✅ NUEVO MENÚ: TIENDA -->
          <v-list-group v-if="isAdmin && showShopMenu" value="shopAdmin" prepend-icon="mdi-storefront-outline">
            <template #activator="{ props }">
              <v-list-item v-bind="props" title="Tienda">
                <v-tooltip v-if="rail" activator="parent" location="right">Tienda</v-tooltip>
              </v-list-item>
            </template>

            <v-list-item
              v-if="hasRoute('shopBranding')"
              :to="{ name: 'shopBranding' }"
              prepend-icon="mdi-palette-outline"
              title="Branding"
              exact
            />

            <v-list-item
              v-if="hasRoute('shopOrders')"
              :to="{ name: 'shopOrders' }"
              prepend-icon="mdi-receipt-text-outline"
              title="Pedidos"
              exact
            />

            <v-list-item
              v-if="hasRoute('shopOrdersSettings')"
              :to="{ name: 'shopOrdersSettings' }"
              prepend-icon="mdi-tune-variant"
              title="Pedidos (config)"
              exact
            />

            <v-list-item
              v-if="hasRoute('shopShippingSettings')"
              :to="{ name: 'shopShippingSettings' }"
              prepend-icon="mdi-truck-delivery-outline"
              title="Envíos"
              exact
            />
            <v-list-item
              v-if="hasRoute('shopPickupSettings')"
              :to="{ name: 'shopPickupSettings' }"
              prepend-icon="mdi-store-marker-outline"
              title="Retiros"
              exact
            />
            <v-list-item
              v-if="hasRoute('shopPaymentsSettings')"
              :to="{ name: 'shopPaymentsSettings' }"
              prepend-icon="mdi-credit-card-outline"
              title="Pagos"
              exact
            />
            <v-list-item
              v-if="hasRoute('shopNotificationsSettings')"
              :to="{ name: 'shopNotificationsSettings' }"
              prepend-icon="mdi-bell-outline"
              title="Notificaciones"
              exact
            />

            <v-divider class="my-2" />
            <v-list-item
              v-if="hasRoute('shopLinks')"
              :to="{ name: 'shopLinks' }"
              prepend-icon="mdi-link-variant"
              title="Links Tienda"
              exact
            />

            <v-list-item
              v-if="hasRoute('adminGaleriaMultimedia')"
              :to="{ name: 'adminGaleriaMultimedia' }"
              prepend-icon="mdi-image-multiple-outline"
              title="Galería multimedia"
              exact
            />
          </v-list-group>
        </v-list>

        <v-spacer />

        <div class="pa-4 text-caption" style="opacity:.85" v-if="!rail">v1 · 2025</div>
        <div class="px-2 pb-4 text-caption text-center" style="opacity:.85" v-else>v1</div>
      </v-navigation-drawer>

      <!-- ================= MAIN ================= -->
      <v-main class="pos-main">
        <v-container fluid class="pos-container">
          <router-view />
        </v-container>
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useTheme } from "vuetify";

import { useAuthStore } from "../store/auth.store";
import { useThemeStore } from "../store/theme.store";
import { loadAuth } from "../utils/storage";

const drawer = ref(true);
const rail = ref(false);
const accountMenu = ref(false);

const auth = useAuthStore();
const router = useRouter();

const theme = useTheme();
const themeStore = useThemeStore();

/* ===== Dark Mode ===== */
const isDark = computed(() => themeStore.isDark);

function applyVuetifyTheme(dark) {
  const name = dark ? "dark" : "light";
  try {
    if (typeof theme?.change === "function") theme.change(name);
    else if (theme?.global?.name) theme.global.name.value = name;
  } catch {}
}

function toggleDark() {
  const v = !themeStore.isDark;
  themeStore.setDark(v);
  applyVuetifyTheme(v);
}

watch(
  () => themeStore.isDark,
  (v) => applyVuetifyTheme(!!v),
  { immediate: true }
);

/* ===== Admin ===== */
const isAdmin = computed(() => {
  const r = auth.roles || [];
  return r.includes("admin") || r.includes("super_admin");
});

/* ===== Router helpers ===== */
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
    hasRoute("shopBranding") ||
    hasRoute("users")
  );
});

const showShopMenu = computed(() => {
  return (
    hasRoute("shopOrders") ||
    hasRoute("shopOrdersSettings") ||
    hasRoute("shopShippingSettings") ||
    hasRoute("shopPickupSettings") ||
    hasRoute("shopPaymentsSettings") ||
    hasRoute("shopNotificationsSettings") ||
    hasRoute("shopLinks") ||
    hasRoute("adminGaleriaMultimedia")
  );
});

/* ===== User menu ===== */
const userAvatar = computed(() => {
  const u = auth.user || {};
  const stored = loadAuth?.() || {};
  const su = stored.user || stored.profile || {};
  return u.avatar_url || u.avatarUrl || su.avatar_url || su.avatarUrl || "";
});

const userEmailOrUsername = computed(() => {
  const u = auth.user || {};
  const stored = loadAuth?.() || {};
  const su = stored.user || stored.profile || {};
  return u.email || u.username || su.email || su.username || "";
});

const userFullName = computed(() => {
  const u = auth.user || {};
  const stored = loadAuth?.() || {};
  const su = stored.user || stored.profile || {};
  const first = u.first_name ?? u.firstName ?? su.first_name ?? su.firstName ?? "";
  const last = u.last_name ?? u.lastName ?? su.last_name ?? su.lastName ?? "";
  return [first, last].filter(Boolean).join(" ").trim();
});

const userInitials = computed(() => {
  const first = String(auth.user?.first_name ?? "").trim();
  const last = String(auth.user?.last_name ?? "").trim();
  const i1 = first ? first[0].toUpperCase() : "";
  const i2 = last ? last[0].toUpperCase() : "";
  return (i1 + i2) || "U";
});

const userRoleLabel = computed(() => {
  const roles = Array.isArray(auth.roles) ? auth.roles : auth.user?.roles || [];
  if (roles.includes("super_admin")) return "Super Admin";
  if (roles.includes("admin")) return "Administrador";
  if (roles.includes("manager")) return "Supervisor";
  if (roles.includes("seller")) return "Vendedor";
  return roles?.[0] || "Usuario";
});

/* ===== UI actions ===== */
function toggleRail() {
  rail.value = !rail.value;
}

function onLogout() {
  accountMenu.value = false;
  auth.logout?.();
  router.push({ name: "login" });
}
</script>

<style scoped>
/* ✅ IMPORTANTE:
   - si dejás border-bottom acá, vas a ver la "línea" / contorno que te molestaba
*/
.pos-appbar {
  border-bottom: none !important;
}

.pos-drawer {
  border-right: none !important;
}

/* contenido main */
.pos-main {
  background: rgb(var(--v-theme-background));
}

.pos-container {
  padding-top: 16px;
  padding-bottom: 24px;
  max-width: 1400px;
}

/* avatar cuenta */
.pos-avatar-btn {
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.pos-account-card {
  overflow: hidden;
}

.pos-account-avatar {
  border: 3px solid rgba(0, 0, 0, 0.08);
}
</style>
