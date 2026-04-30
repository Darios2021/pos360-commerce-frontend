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

            <!-- 🇦🇷 Decoración estacional configurable desde admin/branding -->
            <span v-if="holidayOverlayUrl" class="ar-hat" aria-hidden="true">
              <video
                v-if="isOverlayVideo"
                :src="holidayOverlayUrl"
                autoplay
                muted
                loop
                playsinline
                class="ar-hat-media"
              />
              <img
                v-else
                :src="holidayOverlayUrl"
                alt=""
                class="ar-hat-media"
              />
            </span>
          </div>

          <!-- ✅ Mobile: mantiene icono -->
          <div v-else class="ml-logo-icon" aria-hidden="true">
            <img :src="logoMobileUrl" :alt="branding.name" class="ml-logo-icon-img" />

            <!-- 🇦🇷 Decoración estacional mobile -->
            <span v-if="holidayOverlayUrl" class="ar-hat ar-hat--mobile" aria-hidden="true">
              <video
                v-if="isOverlayVideo"
                :src="holidayOverlayUrl"
                autoplay
                muted
                loop
                playsinline
                class="ar-hat-media"
              />
              <img
                v-else
                :src="holidayOverlayUrl"
                alt=""
                class="ar-hat-media"
              />
            </span>
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
                <img
                  v-if="auth.avatarUrl"
                  :src="auth.avatarUrl"
                  :alt="auth.fullName"
                  class="ml-account-avatar ml-account-avatar--img"
                  referrerpolicy="no-referrer"
                />
                <span v-else-if="safeInitials" class="ml-account-avatar" aria-hidden="true">{{ safeInitials }}</span>
                <v-icon v-else size="22" class="ml-account-icon">mdi-account-circle-outline</v-icon>
                <span v-if="!auth.isProfileComplete" class="ml-account-warn-dot" aria-hidden="true" />
              </button>
            </template>

            <v-card class="ml-account-menu" rounded="xl" elevation="12">
              <div class="ml-account-head">
                <img
                  v-if="auth.avatarUrl"
                  :src="auth.avatarUrl"
                  :alt="auth.fullName"
                  class="ml-account-head__avatar ml-account-head__avatar--img"
                  referrerpolicy="no-referrer"
                />
                <div v-else class="ml-account-head__avatar">{{ safeInitials || "U" }}</div>
                <div class="ml-account-head__text">
                  <div class="ml-account-head__name">{{ auth.fullName || "Mi cuenta" }}</div>
                  <div class="ml-account-head__email">{{ auth.customer?.email || "" }}</div>
                </div>
              </div>

              <div v-if="!auth.isProfileComplete" class="ml-account-warn">
                <v-icon size="14" color="warning">mdi-alert-circle-outline</v-icon>
                Tu perfil está incompleto.
              </div>

              <v-divider />

              <v-list class="ml-account-list" density="comfortable">
                <v-list-item
                  title="Perfil"
                  subtitle="Datos personales"
                  prepend-icon="mdi-account-outline"
                  @click="goMyProfile"
                />
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
                <v-divider class="my-1" />
                <v-list-item
                  title="Cerrar sesión"
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
                <img
                  v-if="auth.avatarUrl"
                  :src="auth.avatarUrl"
                  :alt="auth.fullName"
                  class="ml-account-avatar ml-account-avatar--img"
                  referrerpolicy="no-referrer"
                />
                <span v-else-if="safeInitials" class="ml-account-avatar" aria-hidden="true">{{ safeInitials }}</span>
                <v-icon v-else size="22" class="ml-account-icon">mdi-account-circle-outline</v-icon>

                <span class="ml-account-name">{{ auth.fullName }}</span>
                <v-icon size="18" class="ml-icon-white">mdi-chevron-down</v-icon>
                <span v-if="!auth.isProfileComplete" class="ml-account-warn-dot" aria-hidden="true" />
              </button>
            </template>

            <v-card class="ml-account-menu" rounded="xl" elevation="12">
              <div class="ml-account-head">
                <img
                  v-if="auth.avatarUrl"
                  :src="auth.avatarUrl"
                  :alt="auth.fullName"
                  class="ml-account-head__avatar ml-account-head__avatar--img"
                  referrerpolicy="no-referrer"
                />
                <div v-else class="ml-account-head__avatar">{{ safeInitials || "U" }}</div>
                <div class="ml-account-head__text">
                  <div class="ml-account-head__name">{{ auth.fullName || "Mi cuenta" }}</div>
                  <div class="ml-account-head__email">{{ auth.customer?.email || "" }}</div>
                </div>
              </div>

              <div v-if="!auth.isProfileComplete" class="ml-account-warn">
                <v-icon size="14" color="warning">mdi-alert-circle-outline</v-icon>
                Tu perfil está incompleto.
              </div>

              <v-divider />

              <v-list class="ml-account-list" density="comfortable">
                <v-list-item
                  title="Perfil"
                  subtitle="Datos personales"
                  prepend-icon="mdi-account-outline"
                  @click="goMyProfile"
                />
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
                <v-divider class="my-1" />
                <v-list-item
                  title="Cerrar sesión"
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
  holiday_overlay_url: "",
  updated_at: null,
});

// 🇦🇷 Decoración estacional configurable desde /admin/shop/branding/identity.
// Si está vacío en branding, no se muestra nada.
const holidayOverlayUrl = computed(() =>
  withVersion(branding.value?.holiday_overlay_url || "", branding.value?.updated_at)
);
const isOverlayVideo = computed(() => {
  const u = String(branding.value?.holiday_overlay_url || "").toLowerCase();
  return /\.(mp4|webm|mov|m4v)(\?|$)/.test(u);
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

function goMyProfile() {
  router.push({ path: "/shop/account/profile" }).catch(() => {});
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
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  letter-spacing: 0.005em;
}

.ml-header,
.ml-header :deep(*) {
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
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
  position: relative; /* anclaje del gorrito */
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
  position: relative; /* anclaje del gorrito */
}

.ml-logo-icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* =========================
   🎩 DECORACIÓN ESTACIONAL
   Imagen/video subido desde /admin/shop/branding/identity
   que aparece AL LADO del logo del shop. Usado para banderas,
   mascotas, gorritos del mundial, etc.
========================= */
.ar-hat {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-left: 10px;
  flex-shrink: 0;
  pointer-events: none;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.24));
  animation: ar-hat-bounce 2.6s ease-in-out infinite;
  vertical-align: middle;
}

.ar-hat--mobile {
  width: 44px;
  height: 44px;
  margin-left: 6px;
}

.ar-hat-media {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  border-radius: 6px;
}

@keyframes ar-hat-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50%      { transform: translateY(-3px) scale(1.04); }
}

@media (prefers-reduced-motion: reduce) {
  .ar-hat {
    animation: none;
  }
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
  font-size: 10.5px;
  font-weight: 400;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.7;
}

.ml-loc-bottom {
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0;
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
  font-weight: 400;
  padding: 4px 6px;
  border-radius: 8px;
  color: rgba(255,255,255,0.86);
  text-decoration: none;
  white-space: nowrap;
  letter-spacing: 0.005em;
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
  font-weight: 400;
  padding: 5px 12px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(255,255,255,0.92);
  text-decoration: none;
  letter-spacing: 0.005em;
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
  position: relative;
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

/* Dot warning si el perfil está incompleto */
.ml-account-warn-dot {
  position: absolute;
  top: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f59e0b;
  border: 2px solid rgb(var(--v-theme-primary));
  pointer-events: none;
}

.ml-account-avatar {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 400;
  font-size: 12px;

  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.28);
  color: #fff;
}
.ml-account-avatar--img {
  background: #fff;
  object-fit: cover;
  padding: 0;
}

.ml-account-icon {
  color: #fff !important;
}

.ml-account-name {
  font-size: 13px;
  font-weight: 400;
  white-space: nowrap;
  letter-spacing: 0.005em;
}

/* =========================
   ACCOUNT MENU
========================= */

.ml-account-menu {
  width: 300px;
  overflow: hidden;
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.06) inset,
    0 18px 50px -12px rgba(0, 0, 0, 0.35),
    0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.ml-account-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px 14px;
  background: linear-gradient(180deg,
    rgba(var(--v-theme-primary), 0.06),
    transparent);
}
.ml-account-head__avatar {
  flex: 0 0 auto;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.14);
  color: rgb(var(--v-theme-primary));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 540;
  letter-spacing: 0.01em;
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.08);
}
.ml-account-head__avatar--img {
  object-fit: cover;
  background: #f5f5f5;
}
.ml-account-head__text { min-width: 0; line-height: 1.2; flex: 1; }
.ml-account-head__name {
  font-size: 14.5px;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: rgb(var(--v-theme-on-surface));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ml-account-head__email {
  margin-top: 3px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ml-account-warn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 10px 8px;
  padding: 8px 10px;
  border-radius: 9px;
  background: rgba(245, 158, 11, 0.10);
  color: #b45309;
  font-size: 12px;
  font-weight: 460;
  width: calc(100% - 20px);
  box-sizing: border-box;
}

/* Lista — items densos con hover celeste, iconos celestes */
.ml-account-list {
  padding: 6px !important;
  background: rgb(var(--v-theme-surface));
}
.ml-account-list :deep(.v-list-item) {
  border-radius: 10px !important;
  min-height: 50px !important;
  padding-inline: 10px !important;
  margin-bottom: 2px;
  transition: background 0.15s !important;
}
.ml-account-list :deep(.v-list-item:hover) {
  background: rgba(var(--v-theme-primary), 0.06) !important;
}
.ml-account-list :deep(.v-list-item--active),
.ml-account-list :deep(.v-list-item:active) {
  background: rgba(var(--v-theme-primary), 0.10) !important;
}
.ml-account-list :deep(.v-list-item__prepend) {
  padding-inline-end: 10px !important;
}
.ml-account-list :deep(.v-list-item .v-icon) {
  color: rgb(var(--v-theme-primary)) !important;
  opacity: 0.9 !important;
  font-size: 20px !important;
}
.ml-account-list :deep(.v-list-item-title) {
  font-size: 14px !important;
  font-weight: 460 !important;
  letter-spacing: 0 !important;
}
.ml-account-list :deep(.v-list-item-subtitle) {
  font-size: 11.5px !important;
  opacity: 0.6 !important;
  margin-top: 1px !important;
}
/* Último item (Cerrar sesión) — color de error sutil */
.ml-account-list :deep(.v-list-item:last-child .v-icon) {
  color: rgb(var(--v-theme-error)) !important;
  opacity: 0.85 !important;
}
.ml-account-list :deep(.v-list-item:last-child .v-list-item-title) {
  color: rgb(var(--v-theme-error)) !important;
}
.ml-account-list :deep(.v-list-item:last-child:hover) {
  background: rgba(var(--v-theme-error), 0.06) !important;
}

/* Mobile: que ocupe más del ancho de pantalla */
@media (max-width: 600px) {
  .ml-account-menu {
    width: calc(100vw - 24px);
    max-width: 340px;
  }
  .ml-account-head {
    padding: 14px 14px 12px;
  }
  .ml-account-head__avatar {
    width: 42px;
    height: 42px;
  }
  .ml-account-list :deep(.v-list-item) {
    min-height: 52px !important;
  }
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
  /* Por defecto en desktop queda a 14px del borde inferior.
     En mobile (con bottom nav visible) lo levantamos sobre la barra
     usando la variable que expone el layout (--ml-bottom-nav-h). */
  bottom: 14px;
  z-index: 260;
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

  transition: transform 0.15s ease;
}
.ml-wa-fab:active {
  transform: scale(0.94);
}

@media (max-width: 600px) {
  .ml-wa-fab {
    /* Bottom nav (~62px) + safe-area + 12px de aire */
    bottom: calc(var(--ml-bottom-nav-h, 62px) + env(safe-area-inset-bottom) + 12px);
    right: 12px;
    width: 50px;
    height: 50px;
    box-shadow: 0 8px 18px rgba(0,0,0,0.28);
  }
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

  /* Header más compacto: ahorra altura en pantalla chica */
  .ml-row-top {
    padding: 8px 0 8px;
  }

  .ml-container {
    width: min(var(--shop-max,1240px), calc(100% - 16px));
  }

  .ml-top-grid {
    gap: 10px;
  }

  .ml-search {
    justify-content: stretch;
  }

  .ml-search > * {
    width: 100%;
  }

  /* Buscador más bajo para acompañar el placeholder más chico */
  .ml-search :deep(.v-field) {
    border-radius: 10px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.10);
  }
  .ml-search :deep(.v-field__input) {
    min-height: 36px;
    font-size: 13px;
    padding-top: 6px;
    padding-bottom: 6px;
  }
  .ml-search :deep(.v-field__prepend-inner .v-icon) {
    font-size: 18px;
  }

  .ml-row-bottom {
    display: none;
  }

  .ml-account-name {
    display: none;
  }

  .ml-logo-icon {
    width: 42px;
    height: 42px;
  }

  /* Botones de cuenta/carrito más compactos */
  .ml-top-icon-btn,
  .ml-account-btn-mobile {
    padding: 4px;
  }

  .ml-header :deep(.v-icon) {
    font-size: 20px;
  }
}
</style>