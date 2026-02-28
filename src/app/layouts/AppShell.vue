<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/app/layouts/AppShell.vue -->
<template>
  <v-app>
    <v-layout>
      <!-- ================= HEADER ================= -->
      <v-app-bar flat elevation="0" color="primary" height="72" class="pos-appbar">
        <template #prepend>
          <v-btn
            :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
            variant="text"
            @click="toggleRail"
            :title="rail ? 'Expandir menú' : 'Contraer menú'"
          />
        </template>

        <div class="d-flex align-center ga-3">
          <v-avatar color="secondary" variant="flat" size="40" class="brand-avatar">
            <span class="font-weight-bold">360</span>
          </v-avatar>

          <div class="d-flex flex-column">
            <div class="font-weight-bold">POS360</div>
            <div class="text-caption" style="opacity: 0.85">Inventario · Ecommerce · POS</div>
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

        <!-- ===== Cuenta ===== -->
        <v-menu v-model="accountMenu" :close-on-content-click="false" location="bottom end" offset="12">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon variant="text" class="ml-1" title="Cuenta">
              <v-avatar size="34" class="pos-avatar-btn">
                <v-img
                  v-if="userAvatarFinal"
                  :key="userAvatarKey"
                  :src="userAvatarFinal"
                  class="avatar-img"
                  cover
                />
                <span v-else class="avatar-fallback">{{ userInitials }}</span>
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
                <v-img
                  v-if="userAvatarFinal"
                  :key="userAvatarKey + '-big'"
                  :src="userAvatarFinal"
                  class="avatar-img"
                  cover
                />
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

        <div v-if="!rail" class="px-4 py-2 text-caption" style="opacity: 0.85">Navegación</div>

        <v-list nav density="comfortable">
          <v-list-item :to="{ name: 'home' }" exact>
            <template #prepend>
              <v-icon size="20">mdi-view-dashboard-outline</v-icon>
            </template>
            <v-list-item-title>Dashboard</v-list-item-title>
            <v-tooltip v-if="rail" activator="parent" location="right">Dashboard</v-tooltip>
          </v-list-item>

          <v-list-item :to="{ name: 'pos' }" exact>
            <template #prepend>
              <v-icon size="20">mdi-point-of-sale</v-icon>
            </template>
            <v-list-item-title>Punto de Venta</v-list-item-title>
            <v-tooltip v-if="rail" activator="parent" location="right">Punto de Venta</v-tooltip>
          </v-list-item>

          <v-list-item :to="{ name: 'posSales' }" exact>
            <template #prepend>
              <v-icon size="20">mdi-receipt-text-outline</v-icon>
            </template>
            <v-list-item-title>Ventas</v-list-item-title>
            <v-tooltip v-if="rail" activator="parent" location="right">Ventas</v-tooltip>
          </v-list-item>

          <v-divider class="my-2" />

          <div v-if="!rail" class="px-4 py-2 text-caption" style="opacity: 0.85">Gestión</div>

          <v-list-item :to="{ name: 'products' }" exact>
            <template #prepend>
              <v-icon size="20">mdi-package-variant-closed</v-icon>
            </template>
            <v-list-item-title>Productos</v-list-item-title>
            <v-tooltip v-if="rail" activator="parent" location="right">Productos</v-tooltip>
          </v-list-item>

          <v-list-item :to="{ name: 'productsImport' }" exact>
            <template #prepend>
              <v-icon size="20">mdi-database-import-outline</v-icon>
            </template>
            <v-list-item-title>Importar CSV</v-list-item-title>
            <v-tooltip v-if="rail" activator="parent" location="right">Importar CSV</v-tooltip>
          </v-list-item>

          <v-divider class="my-2" />

          <div v-if="!rail" class="px-4 py-2 text-caption" style="opacity: 0.85">Sistema</div>

          <v-list-group v-if="showConfig" value="config">
            <template #activator="{ props }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon size="20">mdi-cog-outline</v-icon>
                </template>
                <v-list-item-title>Configuración</v-list-item-title>
                <v-tooltip v-if="rail" activator="parent" location="right">Configuración</v-tooltip>
              </v-list-item>
            </template>

            <v-list-item v-if="hasRoute('stock')" :to="{ name: 'stock' }" exact>
              <template #prepend>
                <v-icon size="20">mdi-warehouse</v-icon>
              </template>
              <v-list-item-title>Stock</v-list-item-title>
            </v-list-item>

            <v-list-item v-if="isAdmin && hasRoute('inventory')" :to="{ name: 'inventory' }" exact>
              <template #prepend>
                <v-icon size="20">mdi-clipboard-list-outline</v-icon>
              </template>
              <v-list-item-title>Gestión de inventario</v-list-item-title>
            </v-list-item>

            <v-list-item v-if="hasRoute('categories')" :to="{ name: 'categories' }" exact>
              <template #prepend>
                <v-icon size="20">mdi-shape-outline</v-icon>
              </template>
              <v-list-item-title>Categorías</v-list-item-title>
            </v-list-item>

            <v-list-item
              v-if="isAdmin && hasRoute('shopBranding') && !showShopMenu"
              :to="{ name: 'shopBranding' }"
              exact
            >
              <template #prepend>
                <v-icon size="20">mdi-storefront-outline</v-icon>
              </template>
              <v-list-item-title>Tienda</v-list-item-title>
            </v-list-item>

            <v-list-item v-if="isAdmin && hasRoute('users')" :to="{ name: 'users' }" exact>
              <template #prepend>
                <v-icon size="20">mdi-account-multiple-outline</v-icon>
              </template>
              <v-list-item-title>Usuarios</v-list-item-title>
            </v-list-item>
          </v-list-group>

          <v-list-group v-if="isAdmin && showShopMenu" value="shopAdmin">
            <template #activator="{ props }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon size="20">mdi-storefront-outline</v-icon>
                </template>
                <v-list-item-title>Tienda</v-list-item-title>
                <v-tooltip v-if="rail" activator="parent" location="right">Tienda</v-tooltip>
              </v-list-item>
            </template>

            <v-list-item v-if="hasRoute('shopBranding')" :to="{ name: 'shopBranding' }" exact>
              <template #prepend>
                <v-icon size="20">mdi-palette-outline</v-icon>
              </template>
              <v-list-item-title>Branding</v-list-item-title>
            </v-list-item>

            <v-list-item v-if="hasRoute('shopOrders')" :to="{ name: 'shopOrders' }" exact>
              <template #prepend>
                <v-icon size="20">mdi-receipt-text-outline</v-icon>
              </template>
              <v-list-item-title>Pedidos</v-list-item-title>
            </v-list-item>

            <v-list-item v-if="hasRoute('shopOrdersSettings')" :to="{ name: 'shopOrdersSettings' }" exact>
              <template #prepend>
                <v-icon size="20">mdi-tune-variant</v-icon>
              </template>
              <v-list-item-title>Pedidos (config)</v-list-item-title>
            </v-list-item>

            <v-list-item v-if="hasRoute('shopShippingSettings')" :to="{ name: 'shopShippingSettings' }" exact>
              <template #prepend>
                <v-icon size="20">mdi-truck-delivery-outline</v-icon>
              </template>
              <v-list-item-title>Envíos</v-list-item-title>
            </v-list-item>

            <v-list-item v-if="hasRoute('shopPickupSettings')" :to="{ name: 'shopPickupSettings' }" exact>
              <template #prepend>
                <v-icon size="20">mdi-store-marker-outline</v-icon>
              </template>
              <v-list-item-title>Retiros</v-list-item-title>
            </v-list-item>

            <v-list-item v-if="hasRoute('shopPaymentsSettings')" :to="{ name: 'shopPaymentsSettings' }" exact>
              <template #prepend>
                <v-icon size="20">mdi-credit-card-outline</v-icon>
              </template>
              <v-list-item-title>Pagos</v-list-item-title>
            </v-list-item>

            <v-list-item v-if="hasRoute('shopNotificationsSettings')" :to="{ name: 'shopNotificationsSettings' }" exact>
              <template #prepend>
                <v-icon size="20">mdi-bell-outline</v-icon>
              </template>
              <v-list-item-title>Notificaciones</v-list-item-title>
            </v-list-item>

            <v-divider class="my-2" />

            <v-list-item v-if="hasRoute('shopLinks')" :to="{ name: 'shopLinks' }" exact>
              <template #prepend>
                <v-icon size="20">mdi-link-variant</v-icon>
              </template>
              <v-list-item-title>Links Tienda</v-list-item-title>
            </v-list-item>

            <v-list-item v-if="hasRoute('adminGaleriaMultimedia')" :to="{ name: 'adminGaleriaMultimedia' }" exact>
              <template #prepend>
                <v-icon size="20">mdi-image-multiple-outline</v-icon>
              </template>
              <v-list-item-title>Galería multimedia</v-list-item-title>
            </v-list-item>
          </v-list-group>
        </v-list>

        <v-spacer />

        <div class="pa-4 text-caption" style="opacity: 0.85" v-if="!rail">v1 · 2025</div>
        <div class="px-2 pb-4 text-caption text-center" style="opacity: 0.85" v-else>v1</div>
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
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";

import { useAuthStore } from "../store/auth.store";
import { useThemeStore } from "../store/theme.store";
import { loadAuth } from "../utils/storage";

// ✅ NUEVO: toggle centralizado (mismo tab + localStorage + evento)
import { toggleDarkMode, setDarkMode } from "@/app/theme/darkMode";

const drawer = ref(true);
const rail = ref(false);
const accountMenu = ref(false);

const auth = useAuthStore();
const router = useRouter();

const themeStore = useThemeStore();

/* ===== Dark Mode =====
   ✅ IMPORTANTE:
   - Acá NO tocamos theme.change('dark/light') porque rompe tus themes reales
   - Solo guardamos el flag y disparamos el evento que el ThemeManager escucha
*/
const isDark = computed(() => themeStore.isDark);

function toggleDark() {
  const v = !themeStore.isDark;
  themeStore.setDark(v);
  // dispara ui-dark-changed + escribe ui.dark
  setDarkMode(v);
}

// ✅ si themeStore cambia por fuera (ej. restauración), sincronizamos el setter
watch(
  () => themeStore.isDark,
  (v) => {
    setDarkMode(!!v);
  },
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

/* =========================
   ✅ Avatar persistente (reactivo)
========================= */
const authTick = ref(0);
const avatarVer = ref(Date.now());

function bumpAuthTick() {
  authTick.value++;
}
function bumpAvatarVer() {
  avatarVer.value = Date.now();
}

watch(
  () => auth.user?.avatar_url || auth.user?.avatarUrl || "",
  () => {
    bumpAuthTick();
    bumpAvatarVer();
  }
);

function pickUser() {
  authTick.value;
  const u = auth.user || {};
  const stored = loadAuth?.() || {};
  const su = stored.user || stored.profile || {};
  return { u, su };
}

const userAvatarRaw = computed(() => {
  const { u, su } = pickUser();
  const v = u.avatar_url || u.avatarUrl || su.avatar_url || su.avatarUrl || "";
  return String(v || "").trim();
});

const userAvatarFinal = computed(() => {
  const raw = userAvatarRaw.value;
  if (!raw) return "";
  const join = raw.includes("?") ? "&" : "?";
  return `${raw}${join}v=${avatarVer.value}`;
});

const userAvatarKey = computed(() => userAvatarFinal.value || "no-avatar");

const userEmailOrUsername = computed(() => {
  const { u, su } = pickUser();
  return u.email || u.username || su.email || su.username || "";
});

const userFullName = computed(() => {
  const { u, su } = pickUser();
  const first = u.first_name ?? u.firstName ?? su.first_name ?? su.firstName ?? "";
  const last = u.last_name ?? u.lastName ?? su.last_name ?? su.lastName ?? "";
  return [first, last].filter(Boolean).join(" ").trim();
});

const userInitials = computed(() => {
  const { u, su } = pickUser();
  const first = String(u.first_name ?? u.firstName ?? su.first_name ?? su.firstName ?? "").trim();
  const last = String(u.last_name ?? u.lastName ?? su.last_name ?? su.lastName ?? "").trim();
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

function onStorage() {
  bumpAuthTick();
  bumpAvatarVer();
}
function onFocus() {
  bumpAuthTick();
  bumpAvatarVer();
}
function onVisibility() {
  if (document.visibilityState === "visible") {
    bumpAuthTick();
    bumpAvatarVer();
  }
}

onMounted(() => {
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVisibility);
});

onBeforeUnmount(() => {
  window.removeEventListener("storage", onStorage);
  window.removeEventListener("focus", onFocus);
  document.removeEventListener("visibilitychange", onVisibility);
});

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
/* =========================
   Header: línea sutil abajo (tipo ChatGPT)
========================= */
.pos-appbar {
  border-bottom: none !important;
  position: relative;
}

.pos-appbar::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.14);
}

/* =========================
   Drawer: línea sutil lateral SIEMPRE visible
========================= */
.pos-drawer {
  border-right: none !important;
}

.pos-drawer :deep(.v-navigation-drawer__content) {
  position: relative;
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.18);
}

.pos-drawer :deep(.v-navigation-drawer__content)::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.06),
    rgba(255, 255, 255, 0.16),
    rgba(255, 255, 255, 0.06)
  );
}

/* =========================
   ✅ Drawer SIN cajas / SIN relieve / SIN focus ring
========================= */
.pos-drawer :deep(.v-list),
.pos-drawer :deep(.v-list-item),
.pos-drawer :deep(.v-list-item__content),
.pos-drawer :deep(.v-list-item__overlay),
.pos-drawer :deep(.v-list-item__underlay) {
  box-shadow: none !important;
  filter: none !important;
  text-shadow: none !important;
}

.pos-drawer :deep(.v-list-item) {
  position: relative;
  background: transparent !important;
  background-color: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
}

.pos-drawer :deep(.v-list-item__overlay),
.pos-drawer :deep(.v-list-item__underlay) {
  opacity: 0 !important;
}

.pos-drawer :deep(.v-list-item:hover) {
  background: transparent !important;
}

.pos-drawer :deep(.v-list-item--active),
.pos-drawer :deep(.v-list-item--active:hover) {
  background: transparent !important;
}

.pos-drawer :deep(.v-list-item--active)::before {
  content: "";
  position: absolute;
  left: 8px;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
}

.pos-drawer :deep(.v-list-item--active .v-list-item-title),
.pos-drawer :deep(.v-list-item--active .v-list-item__content) {
  font-weight: 800 !important;
}

/* =========================
   ✅ FIX: eliminar FOCUS RING rectangular
========================= */
.pos-drawer :deep(.v-list-item:focus),
.pos-drawer :deep(.v-list-item:focus-visible),
.pos-drawer :deep(.v-list-item--link:focus),
.pos-drawer :deep(.v-list-item--link:focus-visible),
.pos-drawer :deep(.v-list-group__header:focus),
.pos-drawer :deep(.v-list-group__header:focus-visible),
.pos-drawer :deep(a:focus),
.pos-drawer :deep(a:focus-visible),
.pos-drawer :deep(button:focus),
.pos-drawer :deep(button:focus-visible),
.pos-drawer :deep(.v-btn:focus),
.pos-drawer :deep(.v-btn:focus-visible) {
  outline: none !important;
  box-shadow: none !important;
}

/* =========================
   ✅ ICONS: espacio correcto del prepend
========================= */
.pos-drawer :deep(.v-list-item__prepend) {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-width: 44px !important;
  width: 44px !important;
  margin-inline-end: 12px !important;
}

.pos-drawer :deep(.v-list-item__prepend > .v-icon) {
  opacity: 1 !important;
  visibility: visible !important;
  background: transparent !important;
  box-shadow: none !important;
  filter: none !important;
}

/* =========================
   ✅ FIX: flechitas del v-list-group (append)
========================= */
.pos-drawer :deep(.v-list-group__header__append),
.pos-drawer :deep(.v-list-group__header .v-list-item__append),
.pos-drawer :deep(.v-list-group__header .v-list-item-action),
.pos-drawer :deep(.v-list-group__header .v-list-item-action__content) {
  background: transparent !important;
  background-color: transparent !important;
  box-shadow: none !important;
  border: 0 !important;
  outline: 0 !important;
  filter: none !important;
}

.pos-drawer :deep(.v-list-group__header__append .v-icon),
.pos-drawer :deep(.v-list-group__header .v-list-item__append .v-icon) {
  background: transparent !important;
  background-color: transparent !important;
  box-shadow: none !important;
  border: 0 !important;
  outline: 0 !important;
  filter: none !important;
  padding: 0 !important;
  border-radius: 0 !important;
}

.pos-drawer :deep(.v-list-group__header__append .v-btn__overlay),
.pos-drawer :deep(.v-list-group__header__append .v-btn__underlay),
.pos-drawer :deep(.v-list-group__header__append .v-list-item__overlay),
.pos-drawer :deep(.v-list-group__header__append .v-list-item__underlay),
.pos-drawer :deep(.v-list-group__header .v-list-item__append .v-list-item__overlay),
.pos-drawer :deep(.v-list-group__header .v-list-item__append .v-list-item__underlay) {
  opacity: 0 !important;
}

.pos-drawer :deep(.v-list-group__header__append::before),
.pos-drawer :deep(.v-list-group__header__append::after),
.pos-drawer :deep(.v-list-group__header .v-list-item__append::before),
.pos-drawer :deep(.v-list-group__header .v-list-item__append::after) {
  content: none !important;
  display: none !important;
}

/* =========================
   Main
========================= */
.pos-main {
  background: rgb(var(--v-theme-background));
}

.pos-container {
  padding-top: 16px;
  padding-bottom: 24px;
  max-width: 1400px;
}

/* =========================
   Avatar
========================= */
.pos-avatar-btn {
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.10);
  overflow: hidden;
}

.pos-account-avatar {
  border: 3px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.avatar-img :deep(img) {
  object-fit: cover !important;
  object-position: center !important;
}

.avatar-fallback {
  display: inline-flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.92);
  text-transform: uppercase;
}

.brand-avatar {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18) inset;
}

.pos-account-card {
  overflow: hidden;
}

/* =========================
   ✅ HEADER: sacar “cajita/sombra” SIN romper los iconos
========================= */
.pos-appbar :deep(.v-btn--icon),
.pos-appbar :deep(.v-btn--icon .v-btn__content) {
  background: transparent !important;
  background-color: transparent !important;
  box-shadow: none !important;
  border: 0 !important;
  outline: 0 !important;
  filter: none !important;
}

.pos-appbar :deep(.v-btn--icon .v-btn__overlay),
.pos-appbar :deep(.v-btn--icon .v-btn__underlay) {
  opacity: 0 !important;
}

.pos-appbar :deep(.v-btn--icon:focus),
.pos-appbar :deep(.v-btn--icon:focus-visible) {
  outline: none !important;
  box-shadow: none !important;
}

.pos-appbar :deep(.v-btn--icon .v-icon),
.pos-appbar :deep(.v-btn--icon i),
.pos-appbar :deep(.v-btn--icon svg) {
  opacity: 1 !important;
  visibility: visible !important;
  display: inline-flex !important;
  background: transparent !important;
  box-shadow: none !important;
  filter: none !important;
}
</style>