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
        <template v-if="!mobile" #prepend>
          <v-btn
            icon="mdi-menu"
            variant="text"
            class="pos-appbar-toggle"
            :title="rail ? 'Expandir menú' : 'Contraer menú'"
            @click="toggleRail"
          />
        </template>

        <!-- Marca: logo final con texto integrado -->
        <div class="brand-mark" title="POS 360">
          <img
            :src="BRAND_LOGO_WHITE"
            alt="POS 360"
            class="brand-mark__img"
          />
        </div>

        <v-spacer />

        <!-- 📅 Fecha y hora actual -->
        <div class="appbar-datetime mr-3" :title="currentDateTime">
          <v-icon size="16" class="appbar-datetime__icon">mdi-calendar-clock-outline</v-icon>
          <span class="appbar-datetime__text">{{ currentDateTime }}</span>
        </div>

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

          <v-card rounded="xl" class="pos-account-card" min-width="380">
            <!-- Header: email centrado + cerrar -->
            <div class="account-header">
              <span class="account-header__spacer" />
              <span class="account-header__email">{{ userEmailOrUsername }}</span>
              <v-btn
                icon="mdi-close"
                variant="text"
                density="comfortable"
                size="small"
                class="account-header__close"
                @click="accountMenu = false"
              />
            </div>

            <!-- Avatar centrado con anillo de marca -->
            <div class="account-avatar-wrap">
              <div class="account-avatar-ring">
                <v-avatar size="92" class="account-avatar">
                  <v-img
                    v-if="userAvatarFinal"
                    :key="userAvatarKey + '-big'"
                    :src="userAvatarFinal"
                    class="avatar-img"
                    cover
                  />
                  <span v-else class="account-avatar-fallback">
                    {{ userInitials }}
                  </span>
                </v-avatar>
              </div>
              <router-link
                :to="{ name: 'profile' }"
                class="account-avatar-edit"
                title="Editar perfil"
                @click="accountMenu = false"
              >
                <v-icon size="14">mdi-camera-outline</v-icon>
              </router-link>
            </div>

            <!-- Saludo grande -->
            <div class="account-greeting">
              ¡Hola, {{ userFirstName || "usuario" }}!
            </div>

            <!-- CTA principal -->
            <div class="px-4">
              <v-btn
                block
                variant="outlined"
                class="account-cta-btn"
                :to="{ name: 'profile' }"
                @click="accountMenu = false"
              >
                Gestionar mi cuenta
              </v-btn>
            </div>

            <!-- Dos acciones secundarias -->
            <div class="account-actions">
              <v-btn
                variant="outlined"
                class="account-action-btn"
                :prepend-icon="isDark ? 'mdi-white-balance-sunny' : 'mdi-weather-night'"
                @click="toggleDark"
              >
                {{ isDark ? "Modo claro" : "Modo oscuro" }}
              </v-btn>
              <v-btn
                variant="outlined"
                class="account-action-btn"
                prepend-icon="mdi-logout-variant"
                @click="onLogout"
              >
                Cerrar sesión
              </v-btn>
            </div>

            <!-- Info card: rol + sucursal -->
            <div v-if="userRoleLabel || userBranchLabel" class="account-info-card">
              <v-icon size="20" color="primary">mdi-shield-account-outline</v-icon>
              <div class="account-info-text">
                <strong>{{ userRoleLabel }}</strong>
                <span v-if="userBranchLabel" class="account-info-branch">
                  · {{ userBranchLabel }}
                </span>
              </div>
            </div>

            <!-- Footer -->
            <div class="account-footer">
              <span>POS 360</span>
              <span class="account-footer-dot">·</span>
              <span>SAN JUAN TECNOLOGÍA</span>
            </div>
          </v-card>
        </v-menu>
      </v-app-bar>

      <!-- ================= DRAWER (solo desktop / tablet) ================= -->
      <v-navigation-drawer
        v-if="!mobile"
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
          <!-- Caption removido por pedido del cliente: el sidebar arranca
               directo con los items, sin label de sección encima. -->

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

          <!-- ════════ GESTIÓN (colapsable) ════════ -->
          <v-list-item
            class="nav-item nav-section-head"
            :aria-expanded="navOpen.gestion"
            @click="onSectionHeadClick('gestion')"
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
            <v-tooltip v-if="rail" activator="parent" location="right">Gestión</v-tooltip>
          </v-list-item>

          <v-expand-transition>
            <div v-show="navOpen.gestion" class="nav-section">
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
            v-if="showCrmSection"
            class="nav-item nav-section-head"
            :aria-expanded="navOpen.crm"
            @click="onSectionHeadClick('crm')"
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
            <v-tooltip v-if="rail" activator="parent" location="right">CRM</v-tooltip>
          </v-list-item>

          <v-expand-transition>
            <div v-show="navOpen.crm" class="nav-section">
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

          <!-- ════════ SISTEMA (colapsable) ════════ -->
          <v-list-item
            v-if="showSistemaSection"
            class="nav-item nav-section-head"
            :aria-expanded="navOpen.sistema"
            @click="onSectionHeadClick('sistema')"
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
            <v-tooltip v-if="rail" activator="parent" location="right">Sistema</v-tooltip>
          </v-list-item>

          <v-expand-transition>
            <div v-show="navOpen.sistema" class="nav-section">
              <v-list-item v-if="isAdmin && hasRoute('users')" :to="{ name: 'users' }" exact class="nav-item">
                <template #prepend>
                  <v-icon size="18">mdi-account-multiple-outline</v-icon>
                </template>
                <v-list-item-title>Usuarios</v-list-item-title>
                <v-tooltip v-if="rail" activator="parent" location="right">Usuarios</v-tooltip>
              </v-list-item>

              <v-list-item v-if="isAdmin && hasRoute('adminPaymentMethods')" :to="{ name: 'adminPaymentMethods' }" exact class="nav-item">
                <template #prepend>
                  <v-icon size="18">mdi-credit-card-outline</v-icon>
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

          <!-- ════════ TIENDA (colapsable, mismo patrón que Gestión) ════════ -->
          <v-list-item
            v-if="isSuperAdmin && showShopMenu"
            class="nav-item nav-section-head"
            :aria-expanded="navOpen.tienda"
            @click="onSectionHeadClick('tienda')"
          >
            <template #prepend>
              <v-icon size="18">mdi-storefront-outline</v-icon>
            </template>
            <v-list-item-title>Tienda</v-list-item-title>
            <template #append>
              <v-icon
                size="18"
                class="nav-section-head__chev"
                :class="{ 'is-open': navOpen.tienda }"
              >mdi-chevron-down</v-icon>
            </template>
            <v-tooltip v-if="rail" activator="parent" location="right">Tienda</v-tooltip>
          </v-list-item>

          <v-expand-transition>
            <div v-show="navOpen.tienda" class="nav-section">
              <v-list-item v-if="isSuperAdmin && hasRoute('shopBranding')" :to="{ name: 'shopBranding' }" exact class="nav-item">
                <template #prepend>
                  <v-icon size="18">mdi-palette-outline</v-icon>
                </template>
                <v-list-item-title>Branding</v-list-item-title>
                <v-tooltip v-if="rail" activator="parent" location="right">Branding</v-tooltip>
              </v-list-item>

              <v-list-item v-if="isSuperAdmin && hasRoute('shopOrders')" :to="{ name: 'shopOrders' }" exact class="nav-item">
                <template #prepend>
                  <v-icon size="18">mdi-receipt-text-outline</v-icon>
                </template>
                <v-list-item-title>Pedidos</v-list-item-title>
                <v-tooltip v-if="rail" activator="parent" location="right">Pedidos</v-tooltip>
              </v-list-item>

              <v-list-item v-if="isSuperAdmin && hasRoute('shopPaymentsSettings')" :to="{ name: 'shopPaymentsSettings' }" exact class="nav-item">
                <template #prepend>
                  <v-icon size="18">mdi-credit-card-outline</v-icon>
                </template>
                <v-list-item-title>Pagos</v-list-item-title>
                <v-tooltip v-if="rail" activator="parent" location="right">Pagos</v-tooltip>
              </v-list-item>

              <v-list-item v-if="isSuperAdmin && hasRoute('shopLinks')" :to="{ name: 'shopLinks' }" exact class="nav-item">
                <template #prepend>
                  <v-icon size="18">mdi-link-variant</v-icon>
                </template>
                <v-list-item-title>Links Tienda</v-list-item-title>
                <v-tooltip v-if="rail" activator="parent" location="right">Links Tienda</v-tooltip>
              </v-list-item>

              <v-list-item v-if="isSuperAdmin && hasRoute('adminGaleriaMultimedia')" :to="{ name: 'adminGaleriaMultimedia' }" exact class="nav-item">
                <template #prepend>
                  <v-icon size="18">mdi-image-multiple-outline</v-icon>
                </template>
                <v-list-item-title>Galería multimedia</v-list-item-title>
                <v-tooltip v-if="rail" activator="parent" location="right">Galería multimedia</v-tooltip>
              </v-list-item>
            </div>
          </v-expand-transition>
        </v-list>
      </v-navigation-drawer>

      <!-- ================= MAIN ================= -->
      <v-main
        class="pos-main"
        :class="{ 'pos-main--full': $route.meta.fullPage, 'pos-main--mobile': mobile }"
      >
        <template v-if="$route.meta.fullPage">
          <router-view />
        </template>
        <v-container v-else fluid class="pos-container">
          <router-view />
        </v-container>
      </v-main>

      <!-- ================= BOTTOM NAV (solo mobile) ================= -->
      <AppBottomNav
        v-if="mobile"
        :transfer-unread-count="transferUnreadCount"
      />
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
import { getBreadcrumbs } from "@/app/utils/routeTree";
import AppBottomNav from "@/app/components/AppBottomNav.vue";
import { useDisplay } from "vuetify";

const { mobile } = useDisplay();

const drawer = ref(true);
const rail = ref(false);
const accountMenu = ref(false);

// ─── Reloj del header (Martes 28 de Abril 15:58) ────────────────────────
const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const currentDateTime = ref("");
let clockTimer = null;
function updateClock() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  currentDateTime.value = `${DAY_NAMES[d.getDay()]} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]} ${hh}:${mm}`;
}

// Marca POS 360 — versión optimizada para el header.
const BRAND_LOGO_HEADER = "https://storage-files.cingulado.org/pos360/media/1777345911123-fc15363786567e40.webp";
const BRAND_LOGO_WHITE = BRAND_LOGO_HEADER; // alias para el template existente

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const themeStore = useThemeStore();

const isDashboard = computed(() => route.name === "home");
// ─── Breadcrumbs ──────────────────────────────────────────────────────────────
// Árbol de rutas centralizado en utils/routeTree.js (también lo usa AppPageHeader).
const TAB_LABELS = { sales: "Ventas", stock: "Stock", inventory: "Inventario", cash: "Caja" };
const breadcrumbs = computed(() => getBreadcrumbs(route.name, route.query, TAB_LABELS));

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
const NAV_STATE_KEY = "pos.nav.sectionsOpen.v2";
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
  tienda: false,
  ...(loadNavState() || {}),
});
function toggleSection(name) {
  navOpen[name] = !navOpen[name];
  try {
    localStorage.setItem(NAV_STATE_KEY, JSON.stringify({ ...navOpen }));
  } catch (_) {}
}

// En rail: clic en header de grupo expande el drawer (no togglea hijos
// porque no hay espacio para mostrarlos). En expandido: togglea normal.
function onSectionHeadClick(name) {
  if (rail.value) {
    rail.value = false;
    if (!navOpen[name]) toggleSection(name);
  } else {
    toggleSection(name);
  }
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

const userFirstName = computed(() => {
  const { u, su } = pickUser();
  const first = String(
    u.first_name ?? u.firstName ?? su.first_name ?? su.firstName ?? ""
  ).trim();
  return first;
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
  updateClock();
  clockTimer = setInterval(updateClock, 30000);
});

onBeforeUnmount(() => {
  window.removeEventListener("storage", onStorage);
  window.removeEventListener("focus", onFocus);
  document.removeEventListener("visibilitychange", onVisibility);
  if (clockTimer) clearInterval(clockTimer);
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

/* Logo brand del header — versión con texto integrado, formato horizontal. */
.brand-mark {
  display: inline-flex;
  align-items: center;
  height: 60px;
  flex-shrink: 0;
  margin-right: 8px;
}
@media (max-width: 600px) {
  .brand-mark {
    height: 44px;
    margin-right: 4px;
    margin-left: 6px;
  }
}
.brand-mark__img {
  height: 100%;
  width: auto;
  object-fit: contain;
  display: block;
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

/* Wordmark "POS 360" — composición tipográfica con dos pesos / dos colores.
   "POS" delicado en blanco · "360" en celeste con énfasis. */
.header-wordmark {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  white-space: nowrap;
  font-family: "Inter", system-ui, sans-serif;
  line-height: 1;
}
.header-wordmark__pos {
  font-size: 19px;
  font-weight: 300;
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.95);
  text-transform: uppercase;
}
.header-wordmark__num {
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #4fb6f5;
  background: linear-gradient(135deg, #4fb6f5 0%, #2bb0f3 50%, #c8e8ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.pos-appbar {
  background: #1488d1 !important;
  color: #fff !important;
  border-bottom: none !important;
  position: relative;
}
/* Dark: app-bar en negro profundo (mismo que surface) — flota sobre background */
.v-theme--dark .pos-appbar,
.v-theme--adminDark .pos-appbar,
.v-theme--shopDark .pos-appbar {
  background: #0d0f13 !important;
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
  background: #1488d1 !important;
  color: #fff !important;
  border-right: none !important;

  /* Drawer como contenedor flex column → permite que el __content
     ocupe el alto restante con scroll interno cuando excede. */
  display: flex !important;
  flex-direction: column !important;
}
/* Dark: drawer en negro profundo (mismo que surface) — flota sobre background */
.v-theme--dark .pos-drawer,
.v-theme--adminDark .pos-drawer,
.v-theme--shopDark .pos-drawer {
  background: #0d0f13 !important;
}

/* Dejamos que Vuetify maneje la altura del drawer (se adapta al layout
   con o sin app-bar). El __content lo posicionamos absoluto para que
   llene completamente el drawer y dispare overflow correctamente. */
.pos-drawer :deep(.v-navigation-drawer__content) {
  background: #1488d1 !important;
  box-shadow: none;

  /* Como flex-item dentro del drawer: ocupa el alto restante.
     min-height: 0 es CRÍTICO para que pueda shrinkear y disparar overflow. */
  flex: 1 1 0 !important;
  min-height: 0 !important;
  height: auto !important;
  max-height: none !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  position: relative !important;

  /* Firefox */
  scrollbar-width: auto;
  scrollbar-color: rgba(255, 255, 255, 0.55) rgba(255, 255, 255, 0.08);
  scrollbar-gutter: stable;
}
/* Dark: drawer content match surface */
.v-theme--dark .pos-drawer :deep(.v-navigation-drawer__content),
.v-theme--adminDark .pos-drawer :deep(.v-navigation-drawer__content),
.v-theme--shopDark .pos-drawer :deep(.v-navigation-drawer__content) {
  background: #0d0f13 !important;
  box-shadow: none;
}

/* Webkit (Chrome/Edge/Safari): scrollbar más gruesa y con buen contraste */
.pos-drawer :deep(.v-navigation-drawer__content::-webkit-scrollbar) {
  width: 12px;
}
.pos-drawer :deep(.v-navigation-drawer__content::-webkit-scrollbar-track) {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  margin-block: 4px;
}
.pos-drawer :deep(.v-navigation-drawer__content::-webkit-scrollbar-thumb) {
  background-color: rgba(255, 255, 255, 0.55);
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: padding-box;
  min-height: 40px;
}
.pos-drawer :deep(.v-navigation-drawer__content::-webkit-scrollbar-thumb:hover) {
  background-color: rgba(255, 255, 255, 0.75);
  background-clip: padding-box;
}
.pos-drawer :deep(.v-navigation-drawer__content::-webkit-scrollbar-thumb:active) {
  background-color: rgba(255, 255, 255, 0.9);
  background-clip: padding-box;
}

/* Footer del drawer: simplemente al final del contenido. Cuando el
   contenido cabe entero, queda al final visible; cuando excede, queda
   accesible al hacer scroll hasta abajo (Gmail también funciona así). */
.pos-drawer .drawer-version {
  opacity: 0.6;
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

/* Reloj del header: fecha + hora actual */
.appbar-datetime {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.10);
  color: rgba(255, 255, 255, 0.92);
  font-size: 12.5px;
  font-weight: 400;
  letter-spacing: 0.01em;
  white-space: nowrap;
  text-transform: capitalize;
}
.appbar-datetime__icon {
  opacity: 0.85;
}
@media (max-width: 720px) {
  .appbar-datetime__text { display: none; }
  .appbar-datetime { padding: 6px 8px; }
}

.section-caption,
.drawer-version {
  opacity: 0.85;
}

.pos-nav-list {
  padding-top: 6px;
  padding-bottom: 8px;
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
  font-weight: 500;
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
/* Header de grupo (Gestión, CRM, Sistema, Tienda) — mismo peso fino que
   los demás items para que la jerarquía la marque solo el indicador. */
.pos-drawer :deep(.v-list-item.nav-section-head .v-list-item-title) {
  font-weight: 300 !important;
}
.nav-section-head__chev {
  opacity: 0.7;
  transition: transform 0.22s ease;
}
.nav-section-head__chev.is-open {
  transform: rotate(180deg);
}

/* Items dentro de la sección — estilo Gmail: simplemente indentados
   con padding-left mayor para alinear iconos con el texto del padre,
   sin línea guía. La jerarquía la marca el indent y el chevron del padre. */
.nav-section {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0 0 4px 0;
}
.pos-drawer :deep(.nav-section .v-list-item.nav-item) {
  padding-inline-start: 32px !important;
}

/* Items principales — pill, padding generoso, tamaño coherente con rail */
.pos-drawer :deep(.v-list-item.nav-item) {
  min-height: 40px !important;
  padding-inline: 14px !important;
  margin-inline: 8px !important;
  margin-block: 3px !important;
  border-radius: 999px !important;
}
.pos-drawer :deep(.v-list-item.nav-item .v-list-item-title) {
  font-size: 13.5px;
  letter-spacing: 0.005em;
  line-height: 1.2;
}
.pos-drawer :deep(.v-list-item.nav-item .v-list-item__prepend) {
  min-width: 24px !important;
  width: 24px !important;
  margin-inline-end: 14px !important;
}
/* FORZAR tamaño de iconos uniforme (override de size="18" del template). */
.pos-drawer :deep(.v-list-item.nav-item .v-list-item__prepend > .v-icon),
.pos-drawer :deep(.v-list-item.nav-item .v-list-item__prepend .v-icon) {
  font-size: 22px !important;
  width: 22px !important;
  height: 22px !important;
}

/* Header de grupo expandido: sin tinte de fondo (Gmail no lo usa),
   solo la chevron rotada lo marca. */

/* =========================
   Modo RAIL (drawer colapsado a 72px)
   - Items como CÁPSULAS CIRCULARES de 40×40, centradas en el rail.
   - Esconde título/contenido (Vuetify normalmente lo hace, pero con
     nuestros overrides hay que forzarlo).
========================= */
.pos-drawer.v-navigation-drawer--rail :deep(.v-list-item),
.pos-drawer.v-navigation-drawer--rail :deep(.v-list-item.nav-item) {
  width: 44px !important;
  min-width: 44px !important;
  max-width: 44px !important;
  height: 40px !important;
  min-height: 40px !important;
  padding: 0 !important;
  margin-block: 3px !important;
  margin-inline: auto !important;
  border-radius: 999px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex: 0 0 auto !important;
}
/* Iconos del rail al mismo tamaño que en expandido (continuidad visual) */
.pos-drawer.v-navigation-drawer--rail :deep(.v-list-item__prepend > .v-icon),
.pos-drawer.v-navigation-drawer--rail :deep(.v-list-item__prepend .v-icon) {
  font-size: 22px !important;
  width: 22px !important;
  height: 22px !important;
}
.pos-drawer.v-navigation-drawer--rail :deep(.v-list-item .v-list-item__prepend),
.pos-drawer.v-navigation-drawer--rail :deep(.v-list-item.nav-item .v-list-item__prepend) {
  min-width: 0 !important;
  width: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}
/* Ocultar título y append en rail: solo ícono visible */
.pos-drawer.v-navigation-drawer--rail :deep(.v-list-item .v-list-item-title),
.pos-drawer.v-navigation-drawer--rail :deep(.v-list-item .v-list-item__content),
.pos-drawer.v-navigation-drawer--rail :deep(.v-list-item .v-list-item__append) {
  display: none !important;
}
/* Asegurar que el ícono SÍ se vea (a veces queda con opacity 0) */
.pos-drawer.v-navigation-drawer--rail :deep(.v-list-item__prepend > .v-icon),
.pos-drawer.v-navigation-drawer--rail :deep(.v-list-item__prepend .v-icon) {
  display: inline-flex !important;
  opacity: 1 !important;
  visibility: visible !important;
}
/* En rail: items hijos sin indent (no hay tree-line ni padding-left) */
.pos-drawer.v-navigation-drawer--rail :deep(.nav-section .v-list-item.nav-item) {
  padding-inline-start: 0 !important;
}
/* En rail: contenedor de sección sin margins extra */
.pos-drawer.v-navigation-drawer--rail :deep(.nav-section) {
  margin: 0 !important;
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
  border-radius: 999px !important;
  margin-inline: 8px !important;
  min-height: 32px !important;
  color: rgba(255, 255, 255, 0.88) !important;
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

/* Hover súper sutil — estilo Gmail */
.pos-drawer :deep(.v-list-item:hover) {
  background: rgba(255, 255, 255, 0.05) !important;
}

/* Active: pill con buen contraste, SIN barra lateral.
   El pill ocupa todo el item y por sí solo marca el activo. */
.pos-drawer :deep(.v-list-item--active),
.pos-drawer :deep(.v-list-item--active:hover) {
  background: rgba(255, 255, 255, 0.16) !important;
  color: #ffffff !important;
}

/* Texto del activo en peso 400 para leve énfasis (Gmail usa bold). */
.pos-drawer :deep(.v-list-item--active .v-list-item-title) {
  font-weight: 400 !important;
  color: #ffffff !important;
}

/* Item activo: SOLO la barra lateral (::before de arriba) lo marca.
   No subimos el peso de la fuente — todos quedan al mismo nivel. */
.pos-drawer :deep(.v-list-item--active .v-list-item-title),
.pos-drawer :deep(.v-list-item--active .v-list-item__content) {
  font-weight: 300 !important;
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
  min-width: 30px !important;
  width: 30px !important;
  margin-inline-end: 8px !important;
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

/* ─── Mobile: reservar espacio para el bottom-nav ────────────────────────── */
.pos-main--mobile .pos-container {
  padding-left: 12px;
  padding-right: 12px;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
}
/* fullPage en mobile (POS, ProductFormPage): el child ya gestiona su altura.
   Sumamos un bottom-padding al contenedor del main para que el bottom-nav
   no tape el contenido. */
.pos-main--mobile.pos-main--full {
  padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px));
}

/* =========================
   Avatar
========================= */

.pos-avatar-btn {
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

/* =========================
   Account menu (estilo Google account)
========================= */

.pos-account-card {
  overflow: hidden;
  padding-bottom: 8px;
}

.avatar-img :deep(img) {
  object-fit: cover !important;
  object-position: center !important;
}

/* Header con email centrado + close X */
.account-header {
  display: flex;
  align-items: center;
  padding: 14px 14px 0;
  gap: 8px;
}
.account-header__spacer {
  width: 32px;
  flex-shrink: 0;
}
.account-header__email {
  flex: 1;
  text-align: center;
  font-size: 13px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.account-header__close {
  flex-shrink: 0;
}

/* Avatar centrado con anillo de marca + botón cámara */
.account-avatar-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  margin: 16px 0 6px;
}
.account-avatar-ring {
  padding: 3px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1488d1 0%, #2bb0f3 35%, #1488d1 65%, #121e47 100%);
  display: inline-flex;
}
.account-avatar {
  border: 3px solid rgb(var(--v-theme-surface));
}
.account-avatar-fallback {
  display: inline-flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 400;
  letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.85);
  text-transform: uppercase;
  background: rgba(var(--v-theme-primary), 0.10);
}
.account-avatar-edit {
  position: absolute;
  bottom: 4px;
  left: calc(50% + 22px);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.18);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(var(--v-theme-on-surface), 0.75);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  text-decoration: none;
}
.account-avatar-edit:hover {
  background: rgba(var(--v-theme-primary), 0.10);
  border-color: rgba(var(--v-theme-primary), 0.4);
  color: rgb(var(--v-theme-primary));
}

/* Saludo grande */
.account-greeting {
  text-align: center;
  font-size: 22px;
  font-weight: 400;
  letter-spacing: -0.01em;
  margin: 8px 16px 18px;
  color: rgba(var(--v-theme-on-surface), 0.95);
}

/* CTA principal — pill outlined */
.account-cta-btn {
  border-radius: 999px !important;
  height: 44px !important;
  font-weight: 400 !important;
  letter-spacing: 0.01em;
  text-transform: none;
  border-color: rgba(var(--v-theme-on-surface), 0.18) !important;
  color: rgb(var(--v-theme-primary)) !important;
}
.account-cta-btn:hover {
  background: rgba(var(--v-theme-primary), 0.06) !important;
  border-color: rgba(var(--v-theme-primary), 0.4) !important;
}

/* Dos acciones secundarias side-by-side */
.account-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 10px 16px 0;
}
.account-action-btn {
  border-radius: 999px !important;
  height: 44px !important;
  font-weight: 400 !important;
  letter-spacing: 0.01em;
  text-transform: none;
  border-color: rgba(var(--v-theme-on-surface), 0.18) !important;
  color: rgba(var(--v-theme-on-surface), 0.85) !important;
}
.account-action-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.05) !important;
}

/* Info card: rol + sucursal */
.account-info-card {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 16px 0;
  padding: 12px 16px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  border-radius: 999px;
  font-size: 13px;
}
.account-info-text {
  flex: 1;
  min-width: 0;
  color: rgba(var(--v-theme-on-surface), 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.account-info-text strong {
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.95);
}
.account-info-branch {
  color: rgba(var(--v-theme-on-surface), 0.65);
  font-weight: 400;
}

/* Footer */
.account-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 16px 6px;
  margin-top: 4px;
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.50);
  letter-spacing: 0.02em;
}
.account-footer-dot {
  opacity: 0.7;
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

@media (max-width: 600px) {
  .header-wordmark {
    display: none;
  }
}
</style>