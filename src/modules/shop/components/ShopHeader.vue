<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/ShopHeader.vue -->
<template>
  <header class="ml-header">
    <!-- ================= ROW 1 (TOP): brand + search + actions ================= -->
    <div class="ml-row ml-row-top">
      <div class="ml-container ml-top-grid" :class="{ 'is-mobile': isMobile }">
        <router-link to="/shop" class="ml-brand" :aria-label="branding.name || 'San Juan Tecnología'">
          <!-- ✅ Desktop: logo largo -->
          <div v-if="!isMobile" class="ml-logo-wide">
            <img :src="logoDesktopUrl" :alt="branding.name" class="ml-logo-wide-img" />
          </div>

          <!-- ✅ Mobile: solo icono -->
          <div v-else class="ml-logo-icon" aria-hidden="true">
            <img :src="logoMobileUrl" :alt="branding.name" class="ml-logo-icon-img" />
          </div>
        </router-link>

        <div class="ml-search">
          <ShopSearchBox
            :branchId="branchId"
            :mode="route.name === 'shopCategory' ? 'category' : 'home'"
            :categoryId="route.name === 'shopCategory' ? Number(route.params.id || 0) : null"
          />
        </div>

        <!-- ✅ ACTIONS DESKTOP -->
        <div v-if="!isMobile" class="ml-top-actions">
          <!-- AUTH: logged out -->
          <button
            v-if="!auth.isLogged"
            class="ml-top-link ml-top-link-btn"
            type="button"
            @click.stop.prevent="goLogin"
            aria-label="Ingresá"
          >
            <v-icon size="18" class="ml-top-ico ml-icon-white">mdi-account-outline</v-icon>
            <span>Ingresá</span>
          </button>

          <!-- AUTH: logged in -->
          <v-menu v-else location="bottom end" offset="10" :close-on-content-click="true">
            <template #activator="{ props }">
              <button class="ml-account-btn" type="button" v-bind="props" :title="auth.fullName">
                <span class="ml-account-avatar" aria-hidden="true">{{ auth.initials }}</span>
                <span class="ml-account-name">{{ auth.fullName }}</span>
                <v-icon size="18" class="ml-icon-white">mdi-chevron-down</v-icon>
              </button>
            </template>

            <v-card class="ml-account-menu" rounded="lg" elevation="10">
              <div class="ml-account-head">
                <div class="ml-account-title">Mi cuenta</div>
                <div class="ml-account-sub">
                  {{ auth.customer?.email || "" }}
                </div>
              </div>

              <v-divider />

              <v-list class="ml-account-list" density="comfortable">
                <v-list-item
                  title="Mis compras"
                  subtitle="Historial de pedidos"
                  prepend-icon="mdi-receipt-text-outline"
                  @click="goMyOrders"
                />
                <v-list-item
                  title="Favoritos"
                  subtitle="Guardados para después"
                  prepend-icon="mdi-heart-outline"
                  @click="goMyFavorites"
                />
                <v-list-item
                  title="Cerrar sesión"
                  subtitle="Salir de esta cuenta"
                  prepend-icon="mdi-logout"
                  @click="doLogout"
                />
              </v-list>
            </v-card>
          </v-menu>

          <!-- Accesos rápidos desktop -->
          <button
            v-if="auth.isLogged"
            class="ml-top-link ml-top-link-ghost"
            type="button"
            @click="goMyOrders"
          >
            Mis compras
          </button>

          <button
            v-if="auth.isLogged"
            class="ml-top-link ml-top-link-ghost"
            type="button"
            @click="goMyFavorites"
          >
            Favoritos
          </button>

          <!-- Carrito -->
          <router-link class="ml-top-icon" to="/shop/cart" :title="`Carrito (${cart.count})`" aria-label="Carrito">
            <v-badge :content="cart.count" color="red" v-if="cart.count > 0">
              <v-icon size="22" class="ml-icon-white">mdi-cart-outline</v-icon>
            </v-badge>
            <v-icon v-else size="22" class="ml-icon-white">mdi-cart-outline</v-icon>
          </router-link>
        </div>

        <!-- ✅ MOBILE: carrito + cuenta + pills (si logueado) -->
        <div v-else class="ml-top-actions ml-top-actions-mobile">
          <!-- Cuenta (mobile) -->
          <button
            v-if="!auth.isLogged"
            class="ml-top-icon ml-top-icon-btn"
            type="button"
            @click.stop.prevent="goLogin"
            aria-label="Ingresá"
          >
            <v-icon size="22" class="ml-icon-white">mdi-account-outline</v-icon>
          </button>

          <v-menu v-else location="bottom end" offset="10">
            <template #activator="{ props }">
              <button class="ml-account-btn ml-account-btn-mobile" type="button" v-bind="props" :title="auth.fullName">
                <span class="ml-account-avatar" aria-hidden="true">{{ auth.initials }}</span>
              </button>
            </template>

            <v-card class="ml-account-menu" rounded="lg" elevation="10">
              <div class="ml-account-head">
                <div class="ml-account-title">Mi cuenta</div>
                <div class="ml-account-sub">
                  {{ auth.customer?.email || "" }}
                </div>
              </div>

              <v-divider />

              <v-list class="ml-account-list" density="comfortable">
                <v-list-item
                  title="Mis compras"
                  subtitle="Historial de pedidos"
                  prepend-icon="mdi-receipt-text-outline"
                  @click="goMyOrders"
                />
                <v-list-item
                  title="Favoritos"
                  subtitle="Guardados para después"
                  prepend-icon="mdi-heart-outline"
                  @click="goMyFavorites"
                />
                <v-list-item
                  title="Cerrar sesión"
                  subtitle="Salir de esta cuenta"
                  prepend-icon="mdi-logout"
                  @click="doLogout"
                />
              </v-list>
            </v-card>
          </v-menu>

          <!-- ✅ pills en mobile SOLO si logueado -->
          <button
            v-if="auth.isLogged"
            class="ml-top-link ml-top-link-ghost"
            type="button"
            @click="goMyOrders"
          >
            Mis compras
          </button>

          <button
            v-if="auth.isLogged"
            class="ml-top-link ml-top-link-ghost"
            type="button"
            @click="goMyFavorites"
          >
            Favoritos
          </button>

          <!-- Carrito -->
          <router-link class="ml-top-icon" to="/shop/cart" :title="`Carrito (${cart.count})`" aria-label="Carrito">
            <v-badge :content="cart.count" color="red" v-if="cart.count > 0">
              <v-icon size="22" class="ml-icon-white">mdi-cart-outline</v-icon>
            </v-badge>
            <v-icon v-else size="22" class="ml-icon-white">mdi-cart-outline</v-icon>
          </router-link>
        </div>
      </div>
    </div>

    <!-- ================= ROW 2 (BOTTOM): links ================= -->
    <div v-if="!isMobile" class="ml-row ml-row-bottom">
      <div class="ml-container ml-bottom-grid">
        <button class="ml-loc" type="button">
          <v-icon size="16" class="ml-loc-ico ml-icon-white">mdi-map-marker-outline</v-icon>
          <span class="ml-loc-text">
            <span class="ml-loc-top">Enviar a</span>
            <span class="ml-loc-bottom">San Juan</span>
          </span>
        </button>

        <nav class="ml-nav" aria-label="Secciones">
          <ShopCatalogMenu />
          <span class="ml-nav-sep" aria-hidden="true">|</span>
          <router-link class="ml-nav-soft ml-nav-strong" to="/shop">San Juan Seguridad</router-link>
          <router-link class="ml-nav-soft ml-nav-strong" to="/shop">San Juan Sistemas</router-link>
          <router-link class="ml-nav-soft ml-nav-strong" to="/shop">San Juan Servicio Técnico</router-link>
        </nav>
      </div>
    </div>
  </header>

  <!-- ✅ WhatsApp flotante ÚNICO (OCULTO EN CLIPS) -->
  <a
    v-if="showWaFab"
    class="ml-wa-fab"
    :href="waHref"
    target="_blank"
    rel="noopener"
    title="WhatsApp"
    aria-label="WhatsApp"
  >
    <v-icon size="24">mdi-whatsapp</v-icon>
  </a>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";

/**
 * ✅ IMPORT FIX (tu proyecto):
 * En tu árbol aparece en: src/modules/shop/service/shopAuth.store.js
 * (NO en /store/)
 */
import { useShopAuthStore } from "@/modules/shop/service/shopAuth.store";

import ShopSearchBox from "@/modules/shop/components/ShopSearchBox.vue";
import ShopCatalogMenu from "@/modules/shop/components/ShopCatalogMenu.vue";
import { getShopBranding } from "@/modules/shop/service/shop.public.api";

const route = useRoute();
const router = useRouter();
const cart = useShopCartStore();
const auth = useShopAuthStore();

const { xs } = useDisplay();
const isMobile = computed(() => !!xs.value);

const branchId = 3;

const DESKTOP_LOGO = "https://storage-files.cingulado.org/pos360/media/1770906123233-3976439306ab1686.webp";
const MOBILE_LOGO_ICON = "https://storage-files.cingulado.org/pos360/media/1771019362369-d2e805df760863de.webp";

const branding = ref({ name: "San Juan Tecnología", updated_at: null });

function withVersion(url, v) {
  const u = String(url || "").trim();
  if (!u) return "";
  const ver = String(v || "").trim();
  if (!ver) return u;

  try {
    const parsed = new URL(u, window.location.origin);
    if (!parsed.searchParams.has("v")) parsed.searchParams.set("v", ver);
    return parsed.toString();
  } catch {
    return u.includes("?") ? `${u}&v=${encodeURIComponent(ver)}` : `${u}?v=${encodeURIComponent(ver)}`;
  }
}

const logoDesktopUrl = computed(() => withVersion(DESKTOP_LOGO, branding.value?.updated_at));
const logoMobileUrl = computed(() => withVersion(MOBILE_LOGO_ICON, branding.value?.updated_at));

const WHATSAPP_NUMBER = "5492644392150";

const waMessage = computed(() => {
  const url = typeof window !== "undefined" ? window.location.href : "https://sanjuantecnologia.com/shop";
  return `Hola! 👋 Quiero consultar por este producto/link: ${url}`;
});

const waHref = computed(() => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage.value)}`);

const showWaFab = computed(() => {
  const n = String(route.name || "");
  if (n === "shopClips") return false;
  return true;
});

/** ✅ LOGIN DEL SHOP (NO ADMIN /app) */
function goLogin() {
  router
    .push({ name: "shopLogin", query: { redirect: route.fullPath || "/shop" } })
    .catch((e) => console.error("❌ goLogin failed:", e?.message || e));
}

function goMyOrders() {
  router.push({ path: "/shop/account/orders" }).catch(() => {});
}

function goMyFavorites() {
  router.push({ path: "/shop/account/favorites" }).catch(() => {});
}

async function doLogout() {
  try {
    await auth.logout?.();
  } catch {}

  // si estaba en "mi cuenta", vuelve al home
  if (String(route.path || "").startsWith("/shop/account")) {
    router.replace({ path: "/shop" }).catch(() => {});
  }
}

onMounted(async () => {
  try {
    const b = await getShopBranding();
    if (b && typeof b === "object") {
      branding.value = { ...branding.value, ...b };
      if (branding.value?.name) document.title = branding.value.name;
    }
  } catch {}

  try {
    auth.fetchMe?.({ force: false });
  } catch {}
});

watch(
  () => route.fullPath,
  () => {
    try {
      auth.fetchMe?.({ force: false });
    } catch {}
  }
);
</script>

<style scoped>
/* =====================================================
   HEADER BASE
===================================================== */
.ml-header {
  position: sticky;
  top: 0;
  z-index: 60;
  background: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.14);
  overflow: visible;
}

/* =====================================================
   ROWS
===================================================== */
.ml-row-top {
  display: flex;
  align-items: center;
  height: 64px;
}

.ml-row-bottom {
  display: flex;
  align-items: center;
  height: 44px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.ml-row,
.ml-row-top,
.ml-row-bottom {
  background: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
}

/* =====================================================
   CONTAINER
===================================================== */
.ml-container {
  width: min(1240px, calc(100% - 24px));
  margin: 0 auto;
  min-width: 0;
}

/* =====================================================
   TOP LAYOUT (FLEX)
===================================================== */
.ml-top-grid {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.ml-top-grid.is-mobile {
  gap: 10px;
}

/* =====================================================
   BRAND
===================================================== */
.ml-brand {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: rgb(var(--v-theme-on-primary)) !important;
  flex: 0 0 auto;
}

.ml-logo-wide {
  width: 200px;
  height: 40px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.ml-logo-wide-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: left center;
}

.ml-logo-icon {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ml-logo-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* =====================================================
   SEARCH (estable SIEMPRE)
===================================================== */
.ml-search {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  justify-content: center;
}

.ml-search > * {
  width: min(760px, 100%);
  max-width: 100%;
}

.ml-search :deep(.v-field) {
  width: 100%;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(0, 0, 0, 0.10);
  border-radius: 999px;
  box-shadow: none;
}

.ml-search :deep(.v-field__input) {
  min-height: 42px;
  padding-top: 8px;
  padding-bottom: 8px;
}

.ml-search :deep(.v-overlay__content) {
  margin-top: 6px !important;
  border-radius: 14px !important;
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.18) !important;
  z-index: 9999 !important;
}

/* =====================================================
   ACTIONS
===================================================== */
.ml-top-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.ml-top-actions-mobile {
  gap: 8px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
}

.ml-top-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 800;
  padding: 6px 10px;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.92);
  text-decoration: none;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.ml-top-link-ghost {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.ml-top-icon {
  color: #fff !important;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* =====================================================
   ACCOUNT BUTTON
===================================================== */
.ml-account-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.10);
  padding: 6px 10px;
  border-radius: 999px;
  color: #fff;
  cursor: pointer;
  max-width: 260px;
}

.ml-account-btn:hover {
  background: rgba(0, 0, 0, 0.16);
}

.ml-account-btn-mobile {
  padding: 4px 8px;
}

.ml-account-avatar {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.92);
  color: #0b1b2b;
}

.ml-account-name {
  font-size: 13px;
  font-weight: 900;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.ml-account-menu {
  width: 320px;
}

/* =====================================================
   BOTTOM NAV
===================================================== */
.ml-bottom-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  min-width: 0;
}

.ml-loc {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 10px;
}

.ml-loc:hover {
  background: rgba(255, 255, 255, 0.08);
}

.ml-loc-text {
  display: inline-flex;
  flex-direction: column;
  line-height: 1.05;
}

.ml-loc-top {
  font-size: 11px;
  opacity: 0.85;
  font-weight: 700;
}

.ml-loc-bottom {
  font-size: 12.5px;
  font-weight: 900;
}

.ml-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  overflow: hidden;
}

.ml-nav-soft {
  font-size: 13px;
  font-weight: 750;
  padding: 6px 8px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.88);
  text-decoration: none;
  white-space: nowrap;
}

.ml-nav-soft:hover {
  background: rgba(255, 255, 255, 0.08);
}

.ml-nav-sep {
  color: rgba(255, 255, 255, 0.55);
  margin: 0 2px;
}

.ml-nav-strong {
  font-weight: 900;
}

/* =====================================================
   WHATSAPP
===================================================== */
.ml-wa-fab {
  position: fixed;
  right: 14px;
  bottom: 14px;
  z-index: 140;
  width: 56px;
  height: 56px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #25d366 !important;
  color: #fff !important;
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.35), 0 6px 12px rgba(0, 0, 0, 0.22);
  text-decoration: none;
}

/* =====================================================
   ✅ MOBILE: acciones ABAJO + buscador FULL (no cambia nunca)
===================================================== */
@media (max-width: 600px) {
  .ml-row-top {
    height: auto;
    padding: 8px 0;
  }

  /* wrap SOLO en mobile */
  .ml-top-grid.is-mobile {
    flex-wrap: wrap;
    align-content: flex-start;
    row-gap: 10px;
  }

  .ml-brand {
    order: 1;
  }

  /* buscador: siempre 100% */
  .ml-search {
    order: 2;
    flex: 1 1 100%;
    width: 100%;
    justify-content: stretch;
  }

  .ml-search > * {
    width: 100% !important;
    max-width: 100% !important;
  }

  /* acciones: fila abajo */
  .ml-top-actions-mobile {
    order: 3;
    flex: 1 1 100%;
    width: 100%;
    justify-content: flex-start;
    gap: 8px;
    padding-bottom: 2px;
    overflow-x: auto; /* por si entra justo */
    -webkit-overflow-scrolling: touch;
  }

  /* scrollbar sutil */
  .ml-top-actions-mobile::-webkit-scrollbar {
    height: 6px;
  }
  .ml-top-actions-mobile::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.18);
    border-radius: 999px;
  }

  /* compact */
  .ml-account-btn.ml-account-btn-mobile {
    height: 36px;
    padding: 4px 8px;
  }

  .ml-account-name {
    display: none;
  }

  .ml-top-link {
    font-size: 12.5px;
    padding: 6px 10px;
  }

  .ml-top-icon {
    width: 36px;
    height: 36px;
  }
}
</style>
