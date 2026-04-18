<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/ShopHeader.vue -->
<template>
  <header class="ml-header">
    <!-- ================= ROW 1 (TOP): brand + search ================= -->
    <div class="ml-row ml-row-top">
      <div class="ml-container ml-top-grid" :class="{ 'is-mobile': isMobile }">
        <router-link to="/shop" class="ml-brand" :aria-label="branding.name || 'San Juan Tecnología'">
          <!-- ✅ Desktop: usa branding.logo_url dinámico igual que footer -->
          <div v-if="!isMobile" class="ml-logo-wide">
            <img
              v-if="logoDesktopUrl"
              :src="logoDesktopUrl"
              :alt="branding.name"
              class="ml-logo-wide-img"
            />
            <span v-else class="ml-brand-fallback-text">{{ branding.name || "San Juan Tecnología" }}</span>
          </div>

          <!-- ✅ Mobile: mantiene icono -->
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

        <!-- ✅ MOBILE: SOLO LOGIN / CUENTA (SIN CARRITO) -->
        <div v-if="isMobile" class="ml-top-actions ml-top-actions-mobile">
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
                <span v-if="safeInitials" class="ml-account-avatar" aria-hidden="true">{{ safeInitials }}</span>
                <v-icon v-else size="22" class="ml-account-icon">mdi-account-circle-outline</v-icon>
              </button>
            </template>

            <v-card class="ml-account-menu" rounded="xl" elevation="12">
              <div class="ml-account-head">
                <div class="ml-account-title">Mi cuenta</div>
                <div class="ml-account-sub">{{ auth.customer?.email || "" }}</div>
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
        </div>
      </div>
    </div>

    <!-- ================= ROW 2 (BOTTOM): links + actions (DESKTOP) ================= -->
    <div class="ml-row ml-row-bottom">
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
          <router-link class="ml-nav-soft ml-nav-strong" :to="{ name: 'shopLandingSeguridad' }">San Juan Seguridad</router-link>
          <router-link class="ml-nav-soft ml-nav-strong" :to="{ name: 'shopLandingSistemas' }">San Juan Sistemas</router-link>
          <router-link class="ml-nav-soft ml-nav-strong" :to="{ name: 'shopLandingServicioTecnico' }">San Juan Servicio Técnico</router-link>
        </nav>

        <!-- ✅ DESKTOP: acciones abajo (estilo Mercado Libre) -->
        <div v-if="!isMobile" class="ml-bottom-actions">
          <!-- logged out -->
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

          <!-- logged in -->
          <v-menu v-else location="bottom end" offset="10" :close-on-content-click="true">
            <template #activator="{ props }">
              <button class="ml-account-btn" type="button" v-bind="props" :title="auth.fullName">
                <span v-if="safeInitials" class="ml-account-avatar" aria-hidden="true">{{ safeInitials }}</span>
                <v-icon v-else size="22" class="ml-account-icon">mdi-account-circle-outline</v-icon>

                <span class="ml-account-name">{{ auth.fullName }}</span>
                <v-icon size="18" class="ml-icon-white">mdi-chevron-down</v-icon>
              </button>
            </template>

            <v-card class="ml-account-menu" rounded="xl" elevation="12">
              <div class="ml-account-head">
                <div class="ml-account-title">Mi cuenta</div>
                <div class="ml-account-sub">{{ auth.customer?.email || "" }}</div>
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

          <button v-if="auth.isLogged" class="ml-top-link ml-top-link-ghost" type="button" @click="goMyOrders">
            Mis compras
          </button>

          <button v-if="auth.isLogged" class="ml-top-link ml-top-link-ghost" type="button" @click="goMyFavorites">
            Favoritos
          </button>

          <!-- ✅ carrito SOLO desktop -->
          <router-link class="ml-top-icon" to="/shop/cart" :title="`Carrito (${cart.count})`" aria-label="Carrito">
            <v-badge :content="cart.count" color="red" v-if="cart.count > 0">
              <v-icon size="22" class="ml-icon-white">mdi-cart-outline</v-icon>
            </v-badge>
            <v-icon v-else size="22" class="ml-icon-white">mdi-cart-outline</v-icon>
          </router-link>
        </div>
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

/* ✅ Desktop ahora usa branding.logo_url dinámico */
const MOBILE_LOGO_ICON = "https://storage-files.cingulado.org/pos360/media/1771019362369-d2e805df760863de.webp";

const branding = ref({
  name: "San Juan Tecnología",
  logo_url: "",
  favicon_url: "",
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

const logoDesktopUrl = computed(() => withVersion(branding.value?.logo_url, branding.value?.updated_at));
const logoMobileUrl = computed(() => withVersion(MOBILE_LOGO_ICON, branding.value?.updated_at));

const safeInitials = computed(() => {
  const s = String(auth.initials || "").trim();
  return s ? s.slice(0, 3).toUpperCase() : "";
});

const WHATSAPP_NUMBER = "5492644392150";

const waMessage = computed(() => {
  const url = typeof window !== "undefined" ? window.location.href : "https://sanjuantecnologia.com/shop";
  return `Hola! 👋 Quiero consultar por este producto/link: ${url}`;
});

const waHref = computed(() => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage.value)}`);

const showWaFab = computed(() => String(route.name || "") !== "shopClips");

function goLogin() {
  router
    .push({ name: "shopLogin", query: { redirect: route.fullPath || "/shop" } })
    .catch(() => {});
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
.ml-header {
  position: sticky;
  top: 0;
  z-index: 60;
  background: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

.ml-row-top {
  padding: 10px 0 6px;
}

.ml-row-bottom {
  padding: 6px 0 10px;
  border-top: 1px solid rgba(255,255,255,0.10);
}

.ml-container {
  width: min(var(--shop-max,1240px),calc(100% - 24px));
  margin: 0 auto;
  min-width: 0;
}

/* =========================
   TOP GRID
========================= */

.ml-top-grid {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.ml-brand {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  min-width: 0;
}

.ml-logo-wide {
  min-height: 56px;
  max-height: 56px;
  display: flex;
  align-items: center;
}

.ml-logo-wide-img {
  height: 56px;
  width: auto;
  object-fit: contain;
}

.ml-logo-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ml-logo-icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* =========================
   SEARCH
========================= */

.ml-search {
  flex: 1 1 auto;
  display: flex;
  justify-content: center;
  min-width: 0;
}

.ml-search > * {
  width: min(720px,100%);
}

.ml-search :deep(.v-field) {
  width: 100%;
  background: rgba(255,255,255,0.98);
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.08);
  box-shadow: 0 2px 6px rgba(0,0,0,0.10);
}

.ml-search :deep(.v-field__input) {
  min-height: 40px;
  font-size: 14px;
}

/* =========================
   MOBILE ACTIONS
========================= */

.ml-top-actions-mobile {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.ml-top-icon-btn {
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.ml-icon-white {
  color: #fff !important;
}

/* =========================
   BOTTOM GRID
========================= */

.ml-bottom-grid {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
}

/* =========================
   LOCATION
========================= */

.ml-loc {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: 0;
  color: rgba(255,255,255,0.92);
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 8px;
}

.ml-loc:hover {
  background: rgba(255,255,255,0.08);
}

.ml-loc-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.ml-loc-top {
  font-size: 11px;
  font-weight: 500;
  opacity: 0.85;
}

.ml-loc-bottom {
  font-size: 13px;
  font-weight: 600;
}

/* =========================
   NAV
========================= */

.ml-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

.ml-nav-soft {
  font-size: 13px;
  font-weight: 500;
  padding: 4px 6px;
  border-radius: 8px;
  color: rgba(255,255,255,0.88);
  text-decoration: none;
  white-space: nowrap;
}

.ml-nav-soft:hover {
  background: rgba(255,255,255,0.08);
}

.ml-nav-sep {
  opacity: 0.35;
}

/* =========================
   ACTIONS RIGHT
========================= */

.ml-bottom-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ml-top-link {
  font-size: 13px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(255,255,255,0.92);
  text-decoration: none;
}

.ml-top-link-ghost {
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.14);
}

.ml-top-icon {
  display: inline-flex;
  align-items: center;
  color: #fff !important;
  text-decoration: none;
}

/* =========================
   ACCOUNT
========================= */

.ml-account-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.16);
  background: rgba(0,0,0,0.08);
  color: #fff;
  cursor: pointer;
}

.ml-account-btn-mobile {
  padding: 3px 6px;
}

.ml-account-avatar {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;

  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.28);
  color: #fff;
}

.ml-account-icon {
  color: #fff !important;
}

.ml-account-name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

/* =========================
   ACCOUNT MENU
========================= */

.ml-account-menu {
  width: 320px;
  overflow: hidden;
  border-radius: 14px;
}

.ml-account-head {
  padding: 12px 14px 8px;
}

.ml-account-title {
  font-weight: 700;
  font-size: 13.5px;
}

.ml-account-sub {
  font-size: 11.5px;
  opacity: 0.75;
  margin-top: 2px;
}

.ml-account-list {
  padding: 6px !important;
}

.ml-header :deep(.v-icon) {
  font-size: 18px;
}

/* =========================
   WHATSAPP FAB
========================= */

.ml-wa-fab {
  position: fixed;
  right: 14px;
  bottom: 14px;
  z-index: 140;
  width: 54px;
  height: 54px;
  border-radius: 999px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #25d366 !important;
  color: #fff !important;

  border: 1px solid rgba(255,255,255,0.22);
  box-shadow: 0 12px 24px rgba(0,0,0,0.32);

  text-decoration: none;
}

/* =========================
   OVERRIDE GLOBAL CSS
========================= */

.ml-header :deep(button),
.ml-header :deep(a),
.ml-header :deep(.v-btn),
.ml-header :deep(.v-icon) {
  background: transparent !important;
  box-shadow: none !important;
}

/* =========================
   MOBILE
========================= */

@media (max-width:600px) {

  .ml-search {
    justify-content: stretch;
  }

  .ml-search > * {
    width: 100%;
  }

  .ml-row-bottom {
    display: none;
  }

  .ml-account-name {
    display: none;
  }

  .ml-logo-icon {
    width: 46px;
    height: 46px;
  }

  .ml-header :deep(.v-icon) {
    font-size: 20px;
  }
}
</style>