<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/app/layouts/AppShell.vue -->
<template>
  <v-app>
    <v-layout>
      <!-- ================= HEADER ================= -->
      <v-app-bar
        flat
        elevation="0"
        height="72"
        class="pos-appbar"
      >
        <template #prepend>
          <v-btn
            :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
            variant="text"
            class="pos-appbar-toggle"
            :title="rail ? 'Expandir menú' : 'Contraer menú'"
            @click="toggleRail"
          />
        </template>

        <!-- Marca compacta -->
        <div class="brand-mark" title="POS360">
          <span class="brand-mark__text">360</span>
        </div>

        <!-- Separador vertical -->
        <div class="header-divider" />

        <!-- Breadcrumbs de la ruta actual -->
        <nav class="header-crumbs" aria-label="breadcrumb">
          <template v-for="(crumb, i) in breadcrumbs" :key="i">
            <span v-if="i > 0" class="header-crumb__sep">›</span>
            <component
              :is="crumb.to ? 'router-link' : 'span'"
              :to="crumb.to || undefined"
              class="header-crumb__label"
              :class="{ 'header-crumb__label--last': i === breadcrumbs.length - 1 }"
            >{{ crumb.label }}</component>
          </template>
        </nav>

        <v-spacer />

        <!-- 🔔 Derivaciones bell -->
        <TransferNotificationBell class="mr-1" />

        <!-- 🌙 Modo oscuro -->
        <v-btn
          icon
          variant="text"
          class="mr-1"
          :title="isDark ? 'Modo claro' : 'Modo oscuro'"
          @click="toggleDark"
        >
          <v-icon>
            {{ isDark ? "mdi-weather-night" : "mdi-white-balance-sunny" }}
          </v-icon>
        </v-btn>

        <!-- ===== Cuenta ===== -->
        <v-menu
          v-model="accountMenu"
          :close-on-content-click="false"
          location="bottom end"
          offset="12"
        >
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="text"
              class="ml-1"
              title="Cuenta"
            >
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
              <v-btn
                icon="mdi-close"
                variant="text"
                density="comfortable"
                @click="accountMenu = false"
              />
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
                <span v-else class="text-h6 font-weight-bold">
                  {{ userInitials }}
                </span>
              </v-avatar>

              <div class="text-h6 font-weight-bold mt-1">
                {{ userFullName || "Usuario" }}
              </div>
              <div class="d-flex align-center justify-center ga-1 mt-1 account-meta-row">
                <span class="account-role-badge">{{ userRoleLabel }}</span>
                <template v-if="userBranchLabel">
                  <span class="account-meta-dot">·</span>
                  <span class="account-branch-label">
                    <v-icon size="11" class="mr-1" style="opacity:0.6">mdi-store-outline</v-icon>{{ userBranchLabel }}
                  </span>
                </template>
              </div>
              <div class="text-caption text-medium-emphasis mt-1" style="opacity:0.7">
                {{ userEmailOrUsername }}
              </div>
              <!-- Hint de ámbito: explica claramente qué ve el usuario. -->
              <div
                v-if="userScopeHint"
                class="account-scope-hint mt-2 px-3 py-2 text-caption"
              >
                <v-icon size="13" class="mr-1" color="primary">mdi-shield-account-outline</v-icon>
                {{ userScopeHint }}
              </div>
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
              <v-btn
                block
                color="red"
                variant="tonal"
                prepend-icon="mdi-logout-variant"
                @click="onLogout"
              >
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
        class="pos-drawer"
      >
        <!--
          Navigation reorganizada en 3 secciones agrupadas:
            1. OPERACIÓN  → tareas diarias (siempre visible).
            2. GESTIÓN    → datos del negocio (colapsable, abierto por default).
            3. SISTEMA    → config menos frecuente (colapsable, cerrado por default).
          Las secciones colapsadas se persisten en localStorage para que
          cada usuario mantenga su preferencia.
        -->
        <v-list nav density="compact" class="pos-nav-list">
          <!-- ════════ OPERACIÓN ════════ -->
          <!-- Esta sección no se colapsa: son las acciones diarias y deben estar
               siempre visibles. Dejamos solo el caption para no agregar ruido. -->
          <div v-if="!rail" class="nav-section-cap">
            <v-icon size="14" class="nav-section-cap__ic">mdi-rocket-launch-outline</v-icon>
            <span>Operación</span>
          </div>

          <v-list-item :to="{ name: 'home' }" :active="isDashboard" link class="nav-item">
            <template #prepend>
              <v-icon size="18">mdi-view-dashboard-outline</v-icon>
            </template>
            <v-list-item-title>Dashboard</v-list-item-title>
            <v-tooltip v-if="rail" activator="parent" location="right">Dashboard</v-tooltip>
          </v-list-item>

          <v-list-item :to="{ name: 'pos' }" exact class="nav-item">
            <template #prepend>
              <v-icon size="18">mdi-point-of-sale</v-icon>
            </template>
            <v-list-item-title>Punto de Venta</v-list-item-title>
            <v-tooltip v-if="rail" activator="parent" location="right">Punto de Venta</v-tooltip>
          </v-list-item>

          <v-list-item :to="{ name: 'posSales' }" exact class="nav-item">
            <template #prepend>
              <v-icon size="18">mdi-receipt-text-outline</v-icon>
            </template>
            <v-list-item-title>Ventas</v-list-item-title>
            <v-tooltip v-if="rail" activator="parent" location="right">Ventas</v-tooltip>
          </v-list-item>

          <!-- ════════ GESTIÓN (colapsable, estilo igual a Tienda) ════════ -->
          <v-list-item
            v-if="!rail"
            class="nav-item nav-section-head"
            :aria-expanded="navOpen.gestion"
            @click="toggleSection('gestion')"
          >
            <template #prepend>
              <v-icon size="18">mdi-briefcase-outline</v-icon>
            </template>
            <v-list-item-title>Gestión</v-list-item-title>
            <template #append>
              <v-icon
                size="18"
                class="nav-section-head__chev"
                :class="{ 'is-open': navOpen.gestion }"
              >mdi-chevron-down</v-icon>
            </template>
          </v-list-item>

          <v-expand-transition>
            <div v-show="rail || navOpen.gestion" class="nav-section">
              <v-list-item :to="{ name: 'products' }" exact class="nav-item">
                <template #prepend>
                  <v-icon size="18">mdi-package-variant-closed</v-icon>
                </template>
                <v-list-item-title>Productos</v-list-item-title>
                <v-tooltip v-if="rail" activator="parent" location="right">Productos</v-tooltip>
              </v-list-item>

              <!-- Stock e Inventario removidos: la nueva vista de Productos
                   ya cubre la matriz por sucursal y la gestión de stock. -->

              <v-list-item v-if="hasRoute('categories')" :to="{ name: 'categories' }" exact class="nav-item">
                <template #prepend>
                  <v-icon size="18">mdi-shape-outline</v-icon>
                </template>
                <v-list-item-title>Categorías</v-list-item-title>
                <v-tooltip v-if="rail" activator="parent" location="right">Categorías</v-tooltip>
              </v-list-item>

              <v-list-item v-if="hasRoute('transfers')" :to="{ name: 'transfers' }" exact class="nav-item">
                <template #prepend>
                  <v-badge
                    v-if="transferUnreadCount > 0"
                    :content="transferUnreadCount > 9 ? '9+' : String(transferUnreadCount)"
                    color="warning"
                    floating
                  >
                    <v-icon size="18">mdi-truck-fast-outline</v-icon>
                  </v-badge>
                  <v-icon v-else size="18">mdi-truck-fast-outline</v-icon>
                </template>
                <v-list-item-title>
                  Derivaciones
                  <v-chip v-if="transferUnreadCount > 0 && !rail" size="x-small" color="warning" class="ml-2">
                    {{ transferUnreadCount }}
                  </v-chip>
                </v-list-item-title>
                <v-tooltip v-if="rail" activator="parent" location="right">
                  Derivaciones{{ transferUnreadCount > 0 ? ` (${transferUnreadCount})` : '' }}
                </v-tooltip>
              </v-list-item>

              <v-list-item v-if="isAdmin && hasRoute('adminCashRegisters')" :to="{ name: 'adminCashRegisters' }" exact class="nav-item">
                <template #prepend>
                  <v-icon size="18">mdi-cash-register</v-icon>
                </template>
                <v-list-item-title>Cajas</v-list-item-title>
                <v-tooltip v-if="rail" activator="parent" location="right">Cajas</v-tooltip>
              </v-list-item>

              <v-list-item v-if="isAdmin && hasRoute('reports')" :to="{ name: 'reports' }" exact class="nav-item">
                <template #prepend>
                  <v-icon size="18">mdi-chart-line</v-icon>
                </template>
                <v-list-item-title>Reportes</v-list-item-title>
                <v-tooltip v-if="rail" activator="parent" location="right">Reportes</v-tooltip>
              </v-list-item>

            </div>
          </v-expand-transition>

          <!-- ════════ CRM (colapsable) ════════ -->
          <v-list-item
            v-if="!rail && showCrmSection"
            class="nav-item nav-section-head"
            :aria-expanded="navOpen.crm"
            @click="toggleSection('crm')"
          >
            <template #prepend>
              <v-icon size="18">mdi-account-heart-outline</v-icon>
            </template>
            <v-list-item-title>CRM</v-list-item-title>
            <template #append>
              <v-icon
                size="18"
                class="nav-section-head__chev"
                :class="{ 'is-open': navOpen.crm }"
              >mdi-chevron-down</v-icon>
            </template>
          </v-list-item>

          <v-expand-transition>
            <div v-show="rail || navOpen.crm" class="nav-section">
              <v-list-item
                v-if="hasRoute('adminCustomers')"
                :to="{ name: 'adminCustomers' }"
                exact
                class="nav-item"
              >
                <template #prepend>
                  <v-icon size="18">mdi-account-group-outline</v-icon>
                </template>
                <v-list-item-title>Clientes</v-list-item-title>
                <v-tooltip v-if="rail" activator="parent" location="right">Clientes</v-tooltip>
              </v-list-item>

              <v-list-item
                v-if="isSuperAdmin && hasRoute('emailPromoBlocks')"
                :to="{ name: 'emailPromoBlocks' }"
                exact
                class="nav-item"
              >
                <template #prepend>
                  <v-icon size="18">mdi-tag-multiple-outline</v-icon>
                </template>
                <v-list-item-title>Promociones email</v-list-item-title>
                <v-tooltip v-if="rail" activator="parent" location="right">Promociones email</v-tooltip>
              </v-list-item>
            </div>
          </v-expand-transition>

          <!-- ════════ SISTEMA (colapsable, estilo igual a Tienda) ════════ -->
          <v-list-item
            v-if="!rail && showSistemaSection"
            class="nav-item nav-section-head"
            :aria-expanded="navOpen.sistema"
            @click="toggleSection('sistema')"
          >
            <template #prepend>
              <v-icon size="18">mdi-cog-outline</v-icon>
            </template>
            <v-list-item-title>Sistema</v-list-item-title>
            <template #append>
              <v-icon
                size="18"
                class="nav-section-head__chev"
                :class="{ 'is-open': navOpen.sistema }"
              >mdi-chevron-down</v-icon>
            </template>
          </v-list-item>

          <v-expand-transition>
            <div v-show="rail || navOpen.sistema" class="nav-section">
              <v-list-item v-if="isAdmin && hasRoute('users')" :to="{ name: 'users' }" exact class="nav-item">
                <template #prepend>
                  <v-icon size="18">mdi-account-multiple-outline</v-icon>
                </template>
                <v-list-item-title>Usuarios</v-list-item-title>
                <v-tooltip v-if="rail" activator="parent" location="right">Usuarios</v-tooltip>
              </v-list-item>

              <v-list-item v-if="isAdmin && hasRoute('adminPaymentMethods')" :to="{ name: 'adminPaymentMethods' }" exact class="nav-item">
                <template #prepend>
                  <v-icon size="18">mdi-credit-card-cog-outline</v-icon>
                </template>
                <v-list-item-title>Medios de pago</v-list-item-title>
                <v-tooltip v-if="rail" activator="parent" location="right">Medios de pago</v-tooltip>
              </v-list-item>

              <v-list-item v-if="isAdmin && hasRoute('adminFiscal')" :to="{ name: 'adminFiscal' }" exact class="nav-item">
                <template #prepend>
                  <v-icon size="18">mdi-file-document-outline</v-icon>
                </template>
                <v-list-item-title>Fiscal</v-list-item-title>
                <v-tooltip v-if="rail" activator="parent" location="right">Fiscal</v-tooltip>
              </v-list-item>

              <v-list-item v-if="isSuperAdmin && hasRoute('adminTelegram')" :to="{ name: 'adminTelegram' }" exact class="nav-item">
                <template #prepend>
                  <v-icon size="18">mdi-send-variant</v-icon>
                </template>
                <v-list-item-title>Alertas Telegram</v-list-item-title>
                <v-tooltip v-if="rail" activator="parent" location="right">Alertas Telegram</v-tooltip>
              </v-list-item>

              <v-list-item v-if="isSuperAdmin && hasRoute('shopBranding') && !showShopMenu" :to="{ name: 'shopBranding' }" exact class="nav-item">
                <template #prepend>
                  <v-icon size="18">mdi-storefront-outline</v-icon>
                </template>
                <v-list-item-title>Tienda</v-list-item-title>
                <v-tooltip v-if="rail" activator="parent" location="right">Tienda</v-tooltip>
              </v-list-item>
            </div>
          </v-expand-transition>

          <!-- TIENDA -->
          <template v-if="isSuperAdmin && showShopMenu && !rail">
            <v-list-group value="shopAdmin">
              <template #activator="{ props }">
                <v-list-item v-bind="props">
                  <template #prepend>
                    <v-icon size="20">mdi-storefront-outline</v-icon>
                  </template>
                  <v-list-item-title>Tienda</v-list-item-title>
                </v-list-item>
              </template>

              <v-list-item
                v-if="hasRoute('shopBranding')"
                :to="{ name: 'shopBranding' }"
                exact
              >
                <template #prepend>
                  <v-icon size="20">mdi-palette-outline</v-icon>
                </template>
                <v-list-item-title>Branding</v-list-item-title>
              </v-list-item>

              <v-list-item
                v-if="hasRoute('shopOrders')"
                :to="{ name: 'shopOrders' }"
                exact
              >
                <template #prepend>
                  <v-icon size="20">mdi-receipt-text-outline</v-icon>
                </template>
                <v-list-item-title>Pedidos</v-list-item-title>
              </v-list-item>

              <v-list-item
                v-if="hasRoute('shopPaymentsSettings')"
                :to="{ name: 'shopPaymentsSettings' }"
                exact
              >
                <template #prepend>
                  <v-icon size="20">mdi-credit-card-outline</v-icon>
                </template>
                <v-list-item-title>Pagos</v-list-item-title>
              </v-list-item>

              <v-divider class="my-2 nav-divider" />

              <v-list-item
                v-if="hasRoute('shopLinks')"
                :to="{ name: 'shopLinks' }"
                exact
              >
                <template #prepend>
                  <v-icon size="20">mdi-link-variant</v-icon>
                </template>
                <v-list-item-title>Links Tienda</v-list-item-title>
              </v-list-item>

              <v-list-item
                v-if="hasRoute('adminGaleriaMultimedia')"
                :to="{ name: 'adminGaleriaMultimedia' }"
                exact
              >
                <template #prepend>
                  <v-icon size="20">mdi-image-multiple-outline</v-icon>
                </template>
                <v-list-item-title>Galería multimedia</v-list-item-title>
              </v-list-item>
            </v-list-group>
          </template>

          <template v-else-if="isSuperAdmin && showShopMenu && rail">
            <v-list-item
              v-if="shopLandingRoute"
              :to="shopLandingRoute"
              exact
            >
              <template #prepend>
                <v-icon size="20">mdi-storefront-outline</v-icon>
              </template>
              <v-tooltip activator="parent" location="right">
                Tienda
              </v-tooltip>
            </v-list-item>
          </template>
        </v-list>

        <v-spacer />

        <div class="pa-4 text-caption drawer-version" v-if="!rail">
          v1 · 2025
        </div>
        <div class="px-2 pb-4 text-caption text-center drawer-version" v-else>
          v1
        </div>
      </v-navigation-drawer>

      <!-- ================= MAIN ================= -->
      <v-main class="pos-main" :class="{ 'pos-main--full': $route.meta.fullPage }">
        <template v-if="$route.meta.fullPage">
          <router-view />
        </template>
        <v-container v-else fluid class="pos-container">
          <router-view />
        </v-container>
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";

import { useAuthStore } from "../store/auth.store";
import { useThemeStore } from "../store/theme.store";
import TransferNotificationBell from "@/modules/dashboard/components/TransferNotificationBell.vue";
import { useTransferNotifications } from "@/modules/dashboard/composables/useTransferNotifications";
import { loadAuth } from "../utils/storage";
import { setDarkMode } from "@/app/theme/darkMode";

const drawer = ref(true);
const rail = ref(false);
const accountMenu = ref(false);

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const themeStore = useThemeStore();

const isDashboard = computed(() => route.name === "home");
// ─── Breadcrumbs ──────────────────────────────────────────────────────────────
const ROUTE_TREE = {
  home:                     { label: "Dashboard" },
  pos:                      { label: "Punto de Venta" },
  posSales:                 { label: "Ventas" },
  posSaleDetail:            { label: "Detalle", parent: { label: "Ventas", to: { name: "posSales" } } },
  products:                 { label: "Productos", section: "Gestión" },
  productNew:               { label: "Nuevo producto", section: "Gestión", parent: { label: "Productos", to: { name: "products" } } },
  productEdit:              { label: "Editar producto", section: "Gestión", parent: { label: "Productos", to: { name: "products" } } },
  productView:              { label: "Ver producto", section: "Gestión", parent: { label: "Productos", to: { name: "products" } } },
  productsImport:           { label: "Importar CSV", section: "Gestión" },
  transfers:                { label: "Derivaciones", section: "Gestión" },
  reports:                  { label: "Reportes", section: "Gestión" },
  stock:                    { label: "Stock", section: "Configuración" },
  inventory:                { label: "Inventario", section: "Configuración" },
  categories:               { label: "Categorías", section: "Configuración" },
  adminFiscal:              { label: "Fiscal", section: "Configuración" },
  adminPaymentMethods:      { label: "Medios de pago", section: "Configuración" },
  adminCashRegisters:       { label: "Cajas", section: "Gestión" },
  adminTelegram:            { label: "Alertas Telegram", section: "Configuración" },
  users:                    { label: "Usuarios", section: "Configuración" },
  profile:                  { label: "Mi perfil" },
  shopBranding:             { label: "Branding", section: "Tienda" },
  shopOrders:               { label: "Pedidos", section: "Tienda" },
  shopPaymentsSettings:     { label: "Pagos", section: "Tienda" },
  shopLinks:                { label: "Links", section: "Tienda" },
  adminGaleriaMultimedia:   { label: "Galería multimedia", section: "Tienda" },
  adminCustomers:           { label: "Clientes", section: "CRM" },
  adminCustomerDetail:      { label: "Detalle cliente", section: "CRM", parent: { label: "Clientes", to: { name: "adminCustomers" } } },
  emailPromoBlocks:         { label: "Promociones email", section: "CRM" },
};

const TAB_LABELS = { sales: "Ventas", stock: "Stock", inventory: "Inventario", cash: "Caja" };

const breadcrumbs = computed(() => {
  const name = String(route.name || "");
  const tree = ROUTE_TREE[name];
  if (!tree) return [];

  const crumbs = [];

  if (tree.section) crumbs.push({ label: tree.section });
  if (tree.parent) crumbs.push(tree.parent);

  crumbs.push({ label: tree.label });

  if (name === "home") {
    const tabLabel = TAB_LABELS[route.query?.tab];
    if (tabLabel) crumbs.push({ label: tabLabel });
  }

  return crumbs;
});

/* ===== Dark Mode ===== */
const isDark = computed(() => themeStore.isDark);

function toggleDark() {
  const v = !themeStore.isDark;
  themeStore.setDark(v);
  setDarkMode(v);
}

onMounted(() => {
  themeStore.syncFromStorage?.();
});

/* ===== Transfer notifications badge in nav ===== */
// Muestra el badge mientras haya derivaciones pendientes (dispatched) para mi sucursal,
// sin importar si ya las abrió — se va solo cuando se recepciona.
const { pendingForMe: transferPending } = useTransferNotifications();
const transferUnreadCount = computed(() => transferPending.value.length);

/* ===== Roles / Ámbitos =====
 * - isAdmin       → "puede actuar como admin" (super_admin O admin de sucursal).
 *                   Habilita módulos administrativos (reportes, cajas, productos,
 *                   inventario de SU sucursal, métodos de pago de SU sucursal, etc.).
 * - isSuperAdmin  → SOLO super_admin/root/owner. Habilita módulos GLOBALES
 *                   (configuración Telegram, branding del shop, sucursales, etc.).
 * - isCajero      → ni admin ni super; ve solo sus ventas/caja.
 *
 * El backend ya scopea los datos. Esto es para que la UI no muestre opciones
 * que sirvan de poco al rol del usuario.
 */
const isAdmin       = computed(() => auth.isAdmin === true);
const isSuperAdmin  = computed(() => auth.isSuperAdmin === true);

// ── Estado de secciones colapsables del nav drawer ────────────────────────
// Persiste en localStorage para que el usuario mantenga sus preferencias
// entre recargas / sesiones. Default: gestión abierto, sistema cerrado.
const NAV_STATE_KEY = "pos.nav.sectionsOpen";
function loadNavState() {
  try {
    const raw = localStorage.getItem(NAV_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (_) {}
  return null;
}
const navOpen = reactive({
  gestion: true,
  crm: true,
  sistema: false,
  ...(loadNavState() || {}),
});
function toggleSection(name) {
  navOpen[name] = !navOpen[name];
  try {
    localStorage.setItem(NAV_STATE_KEY, JSON.stringify({ ...navOpen }));
  } catch (_) {}
}

// La sección Sistema solo aparece si el usuario tiene acceso a alguna ruta
// dentro de ella; si no, no mostramos ni el header (evita una sección vacía).
const showSistemaSection = computed(() => {
  return (
    (isAdmin.value && hasRoute("users")) ||
    (isAdmin.value && hasRoute("adminPaymentMethods")) ||
    (isAdmin.value && hasRoute("adminFiscal")) ||
    (isSuperAdmin.value && hasRoute("adminTelegram")) ||
    (isSuperAdmin.value && hasRoute("shopBranding") && !showShopMenu.value)
  );
});

// La sección CRM aparece si hay al menos una ruta del grupo accesible.
const showCrmSection = computed(() => {
  return (
    hasRoute("adminCustomers") ||
    (isSuperAdmin.value && hasRoute("emailPromoBlocks"))
  );
});
const isCajero      = computed(() => auth.isCajero === true);

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
    hasRoute("adminFiscal") ||
    hasRoute("adminPaymentMethods") ||
    hasRoute("adminTelegram") ||
    hasRoute("shopBranding") ||
    hasRoute("users") ||
    hasRoute("adminCustomers")
  );
});

const showShopMenu = computed(() => {
  return (
    hasRoute("shopOrders") ||
    hasRoute("shopPaymentsSettings") ||
    hasRoute("shopLinks") ||
    hasRoute("adminGaleriaMultimedia")
  );
});

const configLandingRoute = computed(() => {
  if (hasRoute("stock")) return { name: "stock" };
  if (hasRoute("inventory")) return { name: "inventory" };
  if (hasRoute("categories")) return { name: "categories" };
  if (hasRoute("adminFiscal")) return { name: "adminFiscal" };
  if (hasRoute("adminPaymentMethods")) return { name: "adminPaymentMethods" };
  if (hasRoute("adminTelegram")) return { name: "adminTelegram" };
  if (hasRoute("shopBranding")) return { name: "shopBranding" };
  if (hasRoute("users")) return { name: "users" };
  return null;
});

const shopLandingRoute = computed(() => {
  if (hasRoute("shopBranding")) return { name: "shopBranding" };
  if (hasRoute("shopOrders")) return { name: "shopOrders" };
  if (hasRoute("shopPaymentsSettings")) return { name: "shopPaymentsSettings" };
  if (hasRoute("shopLinks")) return { name: "shopLinks" };
  if (hasRoute("adminGaleriaMultimedia")) return { name: "adminGaleriaMultimedia" };
  return null;
});

/* =========================
   Avatar persistente
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
  const v =
    u.avatar_url || u.avatarUrl || su.avatar_url || su.avatarUrl || "";
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
  const first =
    u.first_name ?? u.firstName ?? su.first_name ?? su.firstName ?? "";
  const last =
    u.last_name ?? u.lastName ?? su.last_name ?? su.lastName ?? "";
  return [first, last].filter(Boolean).join(" ").trim();
});

const userInitials = computed(() => {
  const { u, su } = pickUser();
  const first = String(
    u.first_name ?? u.firstName ?? su.first_name ?? su.firstName ?? ""
  ).trim();
  const last = String(
    u.last_name ?? u.lastName ?? su.last_name ?? su.lastName ?? ""
  ).trim();
  const i1 = first ? first[0].toUpperCase() : "";
  const i2 = last ? last[0].toUpperCase() : "";
  return (i1 + i2) || "U";
});

const userBranchLabel = computed(() => {
  const roles = Array.isArray(auth.roles) ? auth.roles : [];
  const isSuperAdmin = roles.includes("super_admin") || roles.includes("superadmin");

  // Super admin tiene acceso a todas — no mostramos sucursal
  if (isSuperAdmin) return null;

  const { u, su } = pickUser();
  const bid = Number(u.branch_id ?? u.branchId ?? su.branch_id ?? su.branchId ?? 0) || null;
  if (!bid) return null;

  // Buscar nombre en el array branches del auth store (viene del login)
  const storeBranches = auth.branches || [];
  const found = storeBranches.find((b) => Number(b.id) === bid);
  if (found?.name) return found.name;

  // Fallback: buscar en el objeto user directo
  const rawBranches = [].concat(u.branches || su.branches || []);
  const fromRaw = rawBranches.find((b) => Number(b?.id ?? b?.branch_id) === bid);
  if (fromRaw?.name) return fromRaw.name;

  return `Sucursal #${bid}`;
});

const userRoleLabel = computed(() => {
  const roles = Array.isArray(auth.roles) ? auth.roles : auth.user?.roles || [];
  if (roles.includes("super_admin") || roles.includes("superadmin")) return "Super Admin";
  if (roles.includes("admin")) return "Administrador";
  if (roles.includes("manager")) return "Supervisor";
  if (roles.includes("cajero") || roles.includes("cashier")) return "Cajero";
  if (roles.includes("vendedor") || roles.includes("seller")) return "Vendedor";
  return roles?.[0] || "Usuario";
});

// Texto descriptivo del ámbito que ve el usuario, para que sea intuitivo
// qué está mirando en cada vista. Se muestra como tooltip / hint.
const userScopeHint = computed(() => {
  if (auth.isSuperAdmin) return "Tenés acceso a todas las sucursales del sistema.";
  if (auth.isBranchAdmin && userBranchLabel.value)
    return `Administrás la sucursal ${userBranchLabel.value}. Solo vas a ver y gestionar datos de esa sucursal.`;
  if (auth.isCajero && userBranchLabel.value)
    return `Trabajás como cajero en ${userBranchLabel.value}. Solo vas a ver tus propias ventas y caja.`;
  return null;
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
   COLOR FIJO NAVBAR + SIDEBAR
========================= */

/* =========================
   Brand mark compacta
========================= */

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  margin-right: 2px;
}
.brand-mark__text {
  font-size: 11px;
  font-weight: 900;
  letter-spacing: -0.5px;
  color: #fff;
  line-height: 1;
}

/* =========================
   Header separator + breadcrumbs
========================= */

.header-divider {
  width: 1px;
  height: 22px;
  background: rgba(255, 255, 255, 0.22);
  margin: 0 14px 0 4px;
  flex-shrink: 0;
}

.header-crumbs {
  display: flex;
  align-items: center;
  gap: 0;
  min-width: 0;
  overflow: hidden;
}

.header-crumb__sep {
  color: rgba(255, 255, 255, 0.40);
  font-size: 13px;
  margin: 0 6px;
  flex-shrink: 0;
}

.header-crumb__label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.60);
  white-space: nowrap;
  text-decoration: none;
  transition: color 0.15s;
}
.header-crumb__label:hover {
  color: rgba(255, 255, 255, 0.90);
}
.header-crumb__label--last {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
}

.pos-appbar {
  background: #02498b !important;
  color: #fff !important;
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
  background: rgba(255, 255, 255, 0.18);
}

.pos-drawer {
  background: #02498b !important;
  color: #fff !important;
  border-right: none !important;
}

.pos-drawer :deep(.v-navigation-drawer__content) {
  background: #02498b !important;
  position: relative;
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.18);

  /* Scroll interno con barra estilizada que aparece SOLO si el contenido excede.
     Por defecto el contenido entra completo; si crece (más items, más roles)
     aparece automáticamente sin ensanchar el drawer. */
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
}
.pos-drawer :deep(.v-navigation-drawer__content::-webkit-scrollbar) {
  width: 6px;
}
.pos-drawer :deep(.v-navigation-drawer__content::-webkit-scrollbar-track) {
  background: transparent;
}
.pos-drawer :deep(.v-navigation-drawer__content::-webkit-scrollbar-thumb) {
  background: rgba(255, 255, 255, 0.22);
  border-radius: 999px;
}
.pos-drawer :deep(.v-navigation-drawer__content::-webkit-scrollbar-thumb:hover) {
  background: rgba(255, 255, 255, 0.35);
}

/* Footer sticky abajo (la versión queda pegada al fondo aunque haya scroll). */
.pos-drawer .drawer-version {
  margin-top: auto;
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
   Texto general navbar/drawer
========================= */

.pos-appbar,
.pos-appbar .brand-subtitle,
.pos-drawer,
.pos-drawer .section-caption,
.pos-drawer .drawer-version {
  color: rgba(255, 255, 255, 0.95) !important;
}

.pos-appbar-toggle {
  margin-inline-start: 2px;
}

.section-caption,
.drawer-version {
  opacity: 0.85;
}

.pos-nav-list {
  padding-top: 2px;
  padding-bottom: 4px;
}

/* =========================
   Sections compact / collapsable
========================= */
/* Caption fijo (Operación) — header decorativo con icono. */
.nav-section-cap {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 18px 4px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: rgba(255, 255, 255, 0.55);
}
.nav-section-cap__ic { opacity: 0.6; }
.nav-section-cap:first-child { padding-top: 6px; }

/* Header colapsable (Gestión, Sistema, Tienda) — usa el mismo look que un
   list-item normal pero con la chevron animada que rota al expandir. */
.pos-drawer :deep(.v-list-item.nav-section-head) {
  margin-top: 8px;
  cursor: pointer;
}
/* El header colapsable no debe verse "activo" cuando el usuario está en
   un sub-item de la sección — solo debe destacarse al hacer hover. */
.pos-drawer :deep(.v-list-item.nav-section-head .v-list-item-title) {
  font-weight: 700 !important;
}
.nav-section-head__chev {
  opacity: 0.7;
  transition: transform 0.22s ease;
}
.nav-section-head__chev.is-open {
  transform: rotate(180deg);
}

/* Items dentro de la sección — quedan ligeramente indentados para mostrar
   la jerarquía visual (header → items). */
.nav-section {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-left: 4px;
}
.pos-drawer :deep(.nav-section .v-list-item.nav-item) {
  margin-inline-start: 14px !important;
}

/* Items más densos en modo expandido */
.pos-drawer :deep(.v-list-item.nav-item) {
  min-height: 38px !important;
  padding-inline: 12px !important;
  margin-inline: 6px !important;
  border-radius: 10px !important;
}
.pos-drawer :deep(.v-list-item.nav-item .v-list-item-title) {
  font-size: 13px;
  letter-spacing: 0.01em;
}
.pos-drawer :deep(.v-list-item.nav-item .v-list-item__prepend) {
  margin-inline-end: 8px !important;
}

/* =========================
   Drawer clean
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
  border-radius: 14px !important;
  margin-inline: 8px !important;
  min-height: 46px !important;
  color: rgba(255, 255, 255, 0.95) !important;
}

.pos-drawer :deep(.v-list-group__items .v-list-item) {
  margin-inline: 10px !important;
}

.pos-drawer :deep(.v-list-item__overlay),
.pos-drawer :deep(.v-list-item__underlay) {
  opacity: 0 !important;
}

/* =========================
   Hover / Active
========================= */

.pos-drawer :deep(.v-list-item:hover) {
  background: rgba(255, 255, 255, 0.08) !important;
}

.pos-drawer :deep(.v-list-item--active),
.pos-drawer :deep(.v-list-item--active:hover) {
  background: rgba(255, 255, 255, 0.12) !important;
}

.pos-drawer :deep(.v-list-item--active)::before {
  content: "";
  position: absolute;
  left: -2px;
  top: 9px;
  bottom: 9px;
  width: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
}

.pos-drawer :deep(.v-list-item--active .v-list-item-title),
.pos-drawer :deep(.v-list-item--active .v-list-item__content) {
  font-weight: 800 !important;
  color: rgba(255, 255, 255, 1) !important;
}

.nav-divider {
  opacity: 0.18;
  color: rgba(255, 255, 255, 0.18) !important;
}


/* =========================
   Focus off
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
   Icons
========================= */

.pos-drawer :deep(.v-list-item__prepend) {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-width: 42px !important;
  width: 42px !important;
  margin-inline-end: 10px !important;
}

.pos-drawer :deep(.v-list-item__prepend > .v-icon),
.pos-drawer :deep(.v-list-item-title),
.pos-drawer :deep(.v-list-item__content),
.pos-drawer :deep(.v-list-subheader),
.pos-drawer :deep(.v-list-group__header .v-icon),
.pos-appbar :deep(.v-icon),
.pos-appbar :deep(.v-btn),
.pos-appbar :deep(.v-btn .v-icon) {
  color: rgba(255, 255, 255, 0.95) !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.pos-drawer :deep(.v-list-item__prepend > .v-icon) {
  background: transparent !important;
  box-shadow: none !important;
  filter: none !important;
}

/* =========================
   Group append cleanup
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
   Ripples off del drawer para matar el celeste
========================= */

.pos-drawer :deep(.v-ripple__container) {
  display: none !important;
}

/* =========================
   Main
========================= */

.pos-main {
  background: rgb(var(--v-theme-background));
}

.pos-main--full {
  display: flex;
  flex-direction: column;
}
.pos-main--full > * {
  flex: 1;
  min-height: 0;
  overflow: hidden;
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
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.pos-account-avatar {
  border: 3px solid rgba(var(--v-theme-on-surface), 0.08);
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

.account-meta-row {
  flex-wrap: wrap;
}

.account-role-badge {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: rgb(var(--v-theme-primary));
  opacity: 0.85;
}

.account-meta-dot {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.3);
  line-height: 1;
}

.account-branch-label {
  font-size: 11px;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.55);
  display: inline-flex;
  align-items: center;
}

.account-scope-hint {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  background: rgba(var(--v-theme-primary), 0.08);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  border-radius: 8px;
  margin: 8px 16px 0;
  font-size: 11.5px;
  line-height: 1.35;
  text-align: left;
  color: rgba(var(--v-theme-on-surface), 0.85);
}

/* =========================
   Header buttons clean
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

/* =========================
   Responsive
========================= */

@media (max-width: 760px) {
  .header-crumbs {
    display: none;
  }
}
</style>