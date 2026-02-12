<!-- src/modules/shop/components/ShopHeader.vue -->
<!-- ✅ COPY-PASTE FINAL COMPLETO
     - Desktop: logo largo COMPLETO (sin recorte) + grande + alineado
     - Mobile: SOLO icono redondo (sin título) + compacto ML
     - Links extra: SOLO los 3 pedidos (desktop y mobile)
     - Carrito BLANCO
     - ✅ FIX CLAVE: mobile se detecta con XS (no smAndDown) para que NO use el logo largo en teléfonos
-->

<template>
  <header class="ml-header">
    <!-- ================= ROW 1 (TOP): brand + search + actions ================= -->
    <div class="ml-row ml-row-top">
      <div class="ml-container ml-top-grid" :class="{ 'is-mobile': isMobile }">
        <router-link to="/shop" class="ml-brand" :aria-label="branding.name || 'San Juan Tecnología'">
          <!-- ✅ Desktop: logo largo (SIN avatar para que NO recorte) -->
          <div v-if="!isMobile" class="ml-logo-wide">
            <img :src="logoDesktopUrl" :alt="branding.name" class="ml-logo-wide-img" />
          </div>

          <!-- ✅ Mobile: solo icono redondo -->
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

          <!-- 🛒 Carrito desktop (BLANCO) -->
          <router-link class="ml-top-icon" to="/shop/cart" :title="`Carrito (${cart.count})`" aria-label="Carrito">
            <v-badge :content="cart.count" color="red" v-if="cart.count > 0">
              <v-icon size="22" class="ml-icon-white">mdi-cart-outline</v-icon>
            </v-badge>
            <v-icon v-else size="22" class="ml-icon-white">mdi-cart-outline</v-icon>
          </router-link>
        </div>

        <!-- ✅ MOBILE: carrito + menú (compacto) -->
        <div v-else class="ml-top-actions ml-top-actions-mobile">
          <router-link class="ml-top-icon" to="/shop/cart" :title="`Carrito (${cart.count})`" aria-label="Carrito">
            <v-badge :content="cart.count" color="red" v-if="cart.count > 0">
              <v-icon size="22" class="ml-icon-white">mdi-cart-outline</v-icon>
            </v-badge>
            <v-icon v-else size="22" class="ml-icon-white">mdi-cart-outline</v-icon>
          </router-link>

          <v-btn icon variant="text" class="ml-icon-btn" @click="mobileDrawer = true" aria-label="Menú">
            <v-icon size="22" class="ml-icon-white">mdi-menu</v-icon>
          </v-btn>
        </div>
      </div>
    </div>

    <!-- ================= ROW 2 (BOTTOM): catálogo + links ================= -->
    <div class="ml-row ml-row-bottom">
      <div class="ml-container ml-bottom-grid" :class="{ 'is-mobile': isMobile }">
        <button v-if="!isMobile" class="ml-loc" type="button">
          <v-icon size="16" class="ml-loc-ico ml-icon-white">mdi-map-marker-outline</v-icon>
          <span class="ml-loc-text">
            <span class="ml-loc-top">Enviar a</span>
            <span class="ml-loc-bottom">San Juan</span>
          </span>
        </button>

        <!-- ✅ DESKTOP NAV -->
        <nav v-if="!isMobile" class="ml-nav">
          <ShopCatalogMenu />

          <!-- ✅ SOLO LOS LINKS QUE PEDISTE -->
          <span class="ml-nav-sep" aria-hidden="true">|</span>
          <router-link class="ml-nav-soft ml-nav-strong" to="/shop">San Juan Seguridad</router-link>
          <router-link class="ml-nav-soft ml-nav-strong" to="/shop">San Juan Sistemas</router-link>
          <router-link class="ml-nav-soft ml-nav-strong" to="/shop">San Juan Servicio Técnico</router-link>
        </nav>

        <!-- ✅ MOBILE: 1 sola linea con scroll horizontal (NO se apila) -->
        <div v-else class="ml-mobile-row2">
          <div class="ml-mobile-strip">
            <div class="ml-mobile-cat">
              <ShopCatalogMenu />
            </div>

            <div class="ml-mobile-links" aria-label="Links">
              <router-link class="ml-m-link" to="/shop">San Juan Seguridad</router-link>
              <router-link class="ml-m-link" to="/shop">San Juan Sistemas</router-link>
              <router-link class="ml-m-link" to="/shop">San Juan Servicio Técnico</router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= MOBILE DRAWER ================= -->
    <v-navigation-drawer v-model="mobileDrawer" location="right" temporary width="320" class="ml-drawer">
      <div class="ml-drawer-head">
        <div class="ml-drawer-title">Menú</div>
        <v-btn icon variant="text" @click="mobileDrawer = false" aria-label="Cerrar">
          <v-icon class="ml-icon-white">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-divider />

      <v-list density="comfortable" nav class="ml-drawer-list">
        <v-list-item to="/shop" title="Inicio" prepend-icon="mdi-home-outline" @click="mobileDrawer = false" />
        <v-list-item to="/shop/cart" title="Carrito" prepend-icon="mdi-cart-outline" @click="mobileDrawer = false" />
        <v-list-item to="/auth/login" title="Ingresá" prepend-icon="mdi-account-outline" @click="mobileDrawer = false" />

        <v-divider class="my-2" />

        <!-- ✅ SOLO LOS 3 LINKS -->
        <v-list-item to="/shop" title="San Juan Seguridad" prepend-icon="mdi-shield-outline" @click="mobileDrawer = false" />
        <v-list-item to="/shop" title="San Juan Sistemas" prepend-icon="mdi-laptop" @click="mobileDrawer = false" />
        <v-list-item to="/shop" title="San Juan Servicio Técnico" prepend-icon="mdi-tools" @click="mobileDrawer = false" />
      </v-list>

      <div class="ml-drawer-foot"></div>
    </v-navigation-drawer>
  </header>

  <!-- ✅ WhatsApp flotante ÚNICO -->
  <a class="ml-wa-fab" :href="waHref" target="_blank" rel="noopener" title="WhatsApp" aria-label="WhatsApp">
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

const { xs } = useDisplay();                 // ✅ FIX: XS = mobile real (evita romper logo largo en teléfonos)
const isMobile = computed(() => !!xs.value);

const mobileDrawer = ref(false);
const branchId = 3;

// ✅ Desktop: logo largo con título (usar ESTE)
const DESKTOP_LOGO = "https://storage-files.cingulado.org/pos360/media/1770906123233-3976439306ab1686.webp";

// ✅ Mobile: icono SOLO (ojo). ESTE es el que no rompe.
// Si tenés otro link mejor (icon-only), lo pegás acá.
const MOBILE_LOGO_ICON = "https://storage-files.cingulado.org/pos360/media/1770905005189-8c929ed5d5448450.webp";

const branding = ref({
  name: "San Juan Tecnología",
  updated_at: null,
});

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

/* WhatsApp */
const WHATSAPP_NUMBER = "5492644392150";

const waMessage = computed(() => {
  const url = typeof window !== "undefined" ? window.location.href : "https://sanjuantecnologia.com/shop";
  return `Hola! 👋 Quiero consultar por este producto/link: ${url}`;
});

const waHref = computed(() => {
  const text = encodeURIComponent(waMessage.value);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
});

onMounted(async () => {
  try {
    const b = await getShopBranding();
    if (b && typeof b === "object") {
      // Solo actualiza name/updated_at etc. No pisa URLs fijas.
      branding.value = { ...branding.value, ...b };
      if (branding.value?.name) document.title = branding.value.name;
    }
  } catch {}
});
</script>

<style scoped>
.ml-header {
  position: sticky;
  top: 0;
  z-index: 60;
  background: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
}

.ml-row,
.ml-row-top,
.ml-row-bottom {
  background: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
  border: 0 !important;
  outline: 0 !important;
}

.ml-row-bottom {
  padding-bottom: 8px;
}

.ml-container {
  width: min(var(--shop-max, 1200px), calc(100% - 24px));
  margin: 0 auto;
  display: grid;
  align-items: center;
  gap: 14px;
}

/* TOP GRID */
.ml-top-grid {
  grid-template-columns: auto minmax(320px, 1fr) auto;
  padding: 10px 0;
  align-items: center;
}

.ml-top-grid.is-mobile {
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px;
  padding: 8px 0;
}

/* BRAND */
.ml-brand {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  text-decoration: none;
  color: rgb(var(--v-theme-on-primary)) !important;
  min-width: 0;
  line-height: 0;
}

/* ✅ Desktop: logo largo grande, SIN RECORTE */
.ml-logo-wide {
  width: 360px;   /* ✅ más grande */
  height: 76px;   /* ✅ más alto */
  display: flex;
  align-items: center;
  justify-content: flex-start;
  overflow: visible; /* ✅ importante: que NO recorte el PNG */
}
.ml-logo-wide-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  object-position: left center;
}

/* ✅ Mobile: icono redondo (ojo) */
.ml-logo-icon {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  flex: 0 0 auto;
}
.ml-logo-icon-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  object-position: center;
}

/* SEARCH */
.ml-search {
  min-width: 0;
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
.ml-top-grid.is-mobile .ml-search :deep(.v-field__input) {
  min-height: 36px;
  padding-top: 6px;
  padding-bottom: 6px;
}

/* ACTIONS */
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
  opacity: 0.92;
}
.ml-top-icon {
  color: #fff !important;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  opacity: 0.95;
}
.ml-icon-white {
  color: #fff !important;
}
.ml-icon-btn {
  color: #fff !important;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
}

/* BOTTOM GRID */
.ml-bottom-grid {
  grid-template-columns: auto 1fr;
  padding: 4px 0;
  align-items: center;
}
.ml-bottom-grid.is-mobile {
  grid-template-columns: 1fr;
  padding: 4px 0 0;
}

/* desktop location */
.ml-loc {
  border: 0;
  background: transparent;
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 14px;
  cursor: pointer;
  opacity: 0.92;
}
.ml-loc-text {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
}
.ml-loc-top {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.78);
}
.ml-loc-bottom {
  font-size: 12px;
  font-weight: 950;
}

/* desktop nav */
.ml-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex-wrap: nowrap;
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
  opacity: 0.92;
}
.ml-nav-sep {
  color: rgba(255, 255, 255, 0.55);
  margin: 0 2px;
  user-select: none;
}
.ml-nav-strong {
  font-weight: 900;
}

/* MOBILE row2: 1 línea con scroll horizontal */
.ml-mobile-row2 {
  width: 100%;
  display: block;
}
.ml-mobile-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.ml-mobile-cat {
  flex: 0 0 auto;
}
.ml-mobile-links {
  flex: 1 1 auto;
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding: 2px 0;
  min-width: 0;
}
.ml-mobile-links::-webkit-scrollbar {
  display: none;
}
.ml-m-link {
  flex: 0 0 auto;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.92);
  text-decoration: none;
  font-weight: 900;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

/* WhatsApp */
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

@media (max-width: 600px) {
  .ml-container {
    gap: 10px;
  }
  .ml-row-bottom {
    padding-bottom: 6px;
  }

  /* mobile icon más sutil */
  .ml-logo-icon {
    width: 36px;
    height: 36px;
  }
}
</style>
