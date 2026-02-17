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
          <router-link class="ml-top-link" to="/auth/login">
            <v-icon size="18" class="ml-top-ico ml-icon-white">mdi-account-outline</v-icon>
            <span>Ingresá</span>
          </router-link>

          <router-link class="ml-top-link" to="/shop">Mis compras</router-link>

          <router-link class="ml-top-icon" to="/shop/cart" :title="`Carrito (${cart.count})`" aria-label="Carrito">
            <v-badge :content="cart.count" color="red" v-if="cart.count > 0">
              <v-icon size="22" class="ml-icon-white">mdi-cart-outline</v-icon>
            </v-badge>
            <v-icon v-else size="22" class="ml-icon-white">mdi-cart-outline</v-icon>
          </router-link>
        </div>

        <!-- ✅ MOBILE: SOLO carrito -->
        <div v-else class="ml-top-actions ml-top-actions-mobile">
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
    <!-- ✅ Solo en DESKTOP. En mobile NO se renderiza. -->
    <div v-if="!isMobile" class="ml-row ml-row-bottom">
      <div class="ml-container ml-bottom-grid">
        <button class="ml-loc" type="button">
          <v-icon size="16" class="ml-loc-ico ml-icon-white">mdi-map-marker-outline</v-icon>
          <span class="ml-loc-text">
            <span class="ml-loc-top">Enviar a</span>
            <span class="ml-loc-bottom">San Juan</span>
          </span>
        </button>

        <!-- ✅ DESKTOP NAV (no tocar) -->
        <nav class="ml-nav">
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
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useDisplay } from "vuetify";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";

import ShopSearchBox from "@/modules/shop/components/ShopSearchBox.vue";
import ShopCatalogMenu from "@/modules/shop/components/ShopCatalogMenu.vue";
import { getShopBranding } from "@/modules/shop/service/shop.public.api";

const route = useRoute();
const cart = useShopCartStore();

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

onMounted(async () => {
  try {
    const b = await getShopBranding();
    if (b && typeof b === "object") {
      branding.value = { ...branding.value, ...b };
      if (branding.value?.name) document.title = branding.value.name;
    }
  } catch {}
});
</script>

<style scoped>
/* ================================
   HEADER BASE + Z-INDEX
================================ */
.ml-header {
  position: sticky;
  top: 0;
  z-index: 60;
  background: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
  overflow: visible;
}

.ml-row-top {
  position: relative;
  z-index: 3;
  overflow: visible;
}

.ml-row-bottom {
  position: relative;
  z-index: 2;
  overflow: visible;
  padding-bottom: 8px;
}

.ml-row,
.ml-row-top,
.ml-row-bottom {
  background: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
  border: 0 !important;
  outline: 0 !important;
}

/* ================================
   CONTAINER / GRIDS
================================ */
.ml-container {
  width: min(var(--shop-max, 1200px), calc(100% - 24px));
  margin: 0 auto;
  display: grid;
  align-items: center;
  gap: 14px;
  min-width: 0;
  overflow: visible;
}

.ml-top-grid {
  grid-template-columns: auto minmax(320px, 1fr) auto;
  padding: 10px 0;
  align-items: center;
  min-width: 0;
}

.ml-top-grid.is-mobile {
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px;
  padding: 8px 0;
}

.ml-bottom-grid {
  grid-template-columns: auto 1fr;
  padding: 4px 0;
  align-items: center;
  min-width: 0;
}

/* ================================
   BRAND
================================ */
.ml-brand {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: rgb(var(--v-theme-on-primary)) !important;
  min-width: 0;
  line-height: 0;
}

.ml-logo-wide {
  width: 360px;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  overflow: visible;
}
.ml-logo-wide-img {
  width: 100%;
  height: 100%;
  display: block;
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
  flex: 0 0 auto;
}
.ml-logo-icon-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

/* ================================
   SEARCH
================================ */
.ml-search {
  min-width: 0;
  position: relative;
  z-index: 10;
  overflow: visible;
}

.ml-search :deep(.v-field) {
  width: 100%;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.12);
}

.ml-search :deep(.v-field__input) {
  min-height: 46px;
  padding-top: 10px;
  padding-bottom: 10px;
}

/* Dropdown Vuetify overlay */
.ml-search :deep(.v-overlay__content) {
  margin-top: 6px !important;
  border-radius: 16px !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18) !important;
  z-index: 9999 !important;
}

.ml-search :deep(.v-card),
.ml-search :deep(.v-sheet) {
  border-radius: 16px !important;
  overflow: hidden;
}

.ml-search :deep(.v-list) {
  padding: 8px !important;
}

.ml-search :deep(.v-list-item) {
  min-height: 64px !important;
  padding: 10px 12px !important;
  border-radius: 14px !important;
}

.ml-search :deep(.v-avatar),
.ml-search :deep(.v-list-item__prepend img) {
  width: 52px !important;
  height: 52px !important;
  border-radius: 14px !important;
}

.ml-search :deep(.v-list-item-title) {
  font-size: 15px !important;
  font-weight: 800 !important;
  line-height: 1.2;
}

.ml-search :deep(.v-list-item-subtitle) {
  font-size: 12px !important;
  opacity: 0.75 !important;
  margin-top: 3px;
}

/* ================================
   ACTIONS
================================ */
.ml-top-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: flex-end;
}
.ml-top-actions-mobile {
  gap: 10px;
}

.ml-top-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.92);
  text-decoration: none;
  font-size: 13px;
  font-weight: 800;
  padding: 6px 8px;
  border-radius: 10px;
  white-space: nowrap;
}

.ml-top-icon {
  color: #fff !important;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.ml-icon-white {
  color: #fff !important;
}

/* ================================
   NAV DESKTOP
================================ */
.ml-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  overflow: hidden;
}

.ml-nav-soft {
  color: rgba(255, 255, 255, 0.86);
  text-decoration: none;
  font-size: 13px;
  font-weight: 750;
  padding: 6px 8px;
  border-radius: 10px;
  white-space: nowrap;
}

.ml-nav-sep {
  color: rgba(255, 255, 255, 0.55);
  margin: 0 2px;
}

.ml-nav-strong {
  font-weight: 900;
}

/* ================================
   WHATSAPP
================================ */
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

/* ================================
   MOBILE TUNING
================================ */
@media (max-width: 600px) {
  .ml-container {
    gap: 10px;
  }
  .ml-logo-icon {
    width: 38px;
    height: 38px;
  }

  .ml-search :deep(.v-field__input) {
    min-height: 38px;
    padding-top: 6px;
    padding-bottom: 6px;
  }

  .ml-search :deep(.v-overlay__content) {
    max-width: calc(100vw - 16px) !important;
    border-radius: 16px !important;
  }

  .ml-search :deep(.v-list-item) {
    min-height: 58px !important;
    padding: 8px 10px !important;
  }

  .ml-search :deep(.v-avatar),
  .ml-search :deep(.v-list-item__prepend img) {
    width: 42px !important;
    height: 42px !important;
    border-radius: 12px !important;
  }

  .ml-search :deep(.v-list-item-title) {
    font-size: 14px !important;
  }

  .ml-search :deep(.v-list-item-subtitle) {
    font-size: 11px !important;
  }
}
</style>
