<template>
  <header class="ml-header">
    <!-- ================= ROW 1 (TOP): brand + search + actions ================= -->
    <div class="ml-row ml-row-top">
      <div class="ml-container ml-top-grid" :class="{ 'is-mobile': isMobile }">
        <router-link to="/shop" class="ml-brand" :aria-label="branding.name || 'San Juan Tecnología'">
          <v-avatar class="ml-brand-ico" :size="logoSize">
            <template v-if="branding.logo_url">
              <img :src="logoHeaderUrl" :alt="branding.name" class="ml-brand-img" />
            </template>
            <v-icon v-else :size="iconSize">mdi-storefront</v-icon>
          </v-avatar>

          <span v-if="!isMobile" class="ml-brand-text">{{ branding.name || "San Juan Tecnología" }}</span>
        </router-link>

        <div class="ml-search">
          <ShopSearchBox
            :branchId="branchId"
            :mode="route.name === 'shopCategory' ? 'category' : 'home'"
            :categoryId="route.name === 'shopCategory' ? Number(route.params.id || 0) : null"
          />
        </div>

        <div v-if="!isMobile" class="ml-top-actions">
          <router-link class="ml-top-link" to="/auth/login">
            <v-icon size="18" class="ml-top-ico">mdi-account-outline</v-icon>
            <span>Ingresá</span>
          </router-link>

          <router-link class="ml-top-link" to="/shop">Mis compras</router-link>

          <router-link class="ml-top-icon" to="/shop/cart" :title="`Carrito (${cart.count})`">
            <v-badge :content="cart.count" color="red" v-if="cart.count > 0">
              <v-icon size="22">mdi-cart-outline</v-icon>
            </v-badge>
            <v-icon v-else size="22">mdi-cart-outline</v-icon>
          </router-link>
        </div>

        <div v-else class="ml-top-actions ml-top-actions-mobile">
          <v-btn icon variant="text" class="ml-icon-btn" @click="mobileDrawer = true" aria-label="Menú">
            <v-icon size="22">mdi-menu</v-icon>
          </v-btn>

          <router-link class="ml-top-icon" to="/shop/cart" :title="`Carrito (${cart.count})`">
            <v-badge :content="cart.count" color="red" v-if="cart.count > 0">
              <v-icon size="22">mdi-cart-outline</v-icon>
            </v-badge>
            <v-icon v-else size="22">mdi-cart-outline</v-icon>
          </router-link>
        </div>
      </div>
    </div>

    <!-- ================= ROW 2 (BOTTOM): catálogo + links sutiles ================= -->
    <div class="ml-row ml-row-bottom">
      <div class="ml-container ml-bottom-grid" :class="{ 'is-mobile': isMobile }">
        <button v-if="!isMobile" class="ml-loc" type="button">
          <v-icon size="16" class="ml-loc-ico">mdi-map-marker-outline</v-icon>
          <span class="ml-loc-text">
            <span class="ml-loc-top">Enviar a</span>
            <span class="ml-loc-bottom">San Juan</span>
          </span>
        </button>

        <nav v-if="!isMobile" class="ml-nav">
          <!-- ✅ ahora el mega menú vive en su componente -->
          <ShopCatalogMenu />

          <router-link class="ml-nav-soft" to="/shop">Ofertas</router-link>
          <router-link class="ml-nav-soft" to="/shop">Cupones</router-link>
          <router-link class="ml-nav-soft" to="/shop">Supermercado</router-link>
          <router-link class="ml-nav-soft" to="/shop">Moda</router-link>
          <router-link class="ml-nav-soft" to="/shop">Ayuda</router-link>
        </nav>

        <div v-else class="ml-mobile-stack">
          <div class="ml-mobile-row2">
            <ShopCatalogMenu />
            <div class="ml-hint-mobile">
              Buscá productos, agregalos al carrito y elegí sucursal al finalizar.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= MOBILE DRAWER (menú general) ================= -->
    <v-navigation-drawer v-model="mobileDrawer" location="right" temporary width="320" class="ml-drawer">
      <div class="ml-drawer-head">
        <div class="ml-drawer-title">Menú</div>
        <v-btn icon variant="text" @click="mobileDrawer = false" aria-label="Cerrar">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-divider />

      <v-list density="comfortable" nav class="ml-drawer-list">
        <v-list-item to="/shop" title="Inicio" prepend-icon="mdi-home-outline" @click="mobileDrawer = false" />
        <v-list-item to="/shop/cart" title="Carrito" prepend-icon="mdi-cart-outline" @click="mobileDrawer = false" />
        <v-list-item to="/auth/login" title="Ingresá" prepend-icon="mdi-account-outline" @click="mobileDrawer = false" />
      </v-list>

      <div class="ml-drawer-foot">
        <div class="text-caption text-medium-emphasis">
          Buscá productos, agregalos al carrito y elegí sucursal al finalizar.
        </div>
      </div>
    </v-navigation-drawer>
  </header>
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

const { smAndDown } = useDisplay();
const isMobile = computed(() => !!smAndDown.value);

const mobileDrawer = ref(false);

// ✅ branch fijo como venís usando
const branchId = 3;

// ✅ BRANDING
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

function ensureLink(rel) {
  const head = document.head || document.getElementsByTagName("head")[0];
  if (!head) return null;

  let link = head.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    head.appendChild(link);
  }
  return link;
}

function setFavicon(url, updatedAt) {
  const u0 = String(url || "").trim();
  if (!u0) return;

  const u = withVersion(u0, updatedAt);

  {
    const link = ensureLink("icon");
    if (link) {
      link.setAttribute("href", u);
      link.setAttribute("type", "image/png");
      link.setAttribute("sizes", "64x64");
    }
  }

  {
    const link = ensureLink("shortcut icon");
    if (link) {
      link.setAttribute("href", u);
      link.setAttribute("type", "image/png");
      link.setAttribute("sizes", "64x64");
    }
  }

  {
    const link = ensureLink("apple-touch-icon");
    if (link) {
      link.setAttribute("href", u);
      link.setAttribute("sizes", "180x180");
    }
  }
}

const logoSize = computed(() => (isMobile.value ? 56 : 76));
const iconSize = computed(() => (isMobile.value ? 24 : 30));
const logoHeaderUrl = computed(() => withVersion(branding.value?.logo_url, branding.value?.updated_at));

onMounted(async () => {
  try {
    const b = await getShopBranding();
    if (b && typeof b === "object") {
      branding.value = { ...branding.value, ...b };
      if (branding.value?.name) document.title = branding.value.name;
      if (branding.value?.favicon_url) setFavicon(branding.value.favicon_url, branding.value.updated_at);
    }
  } catch {}
});
</script>

<style scoped>
.ml-header {
  --ml-blue: #1488d1;
  --ml-white: #ffffff;

  position: sticky;
  top: 0;
  z-index: 60;
  background: var(--ml-blue);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
}

.ml-row {
  background: var(--ml-blue);
  color: var(--ml-white);
}
.ml-row-top {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}
.ml-row-bottom {
  padding-bottom: 8px;
}

.ml-container {
  width: min(var(--shop-max, 1200px), calc(100% - 24px));
  margin: 0 auto;
  display: grid;
  align-items: center;
  gap: 12px;
}

/* grids */
.ml-top-grid {
  grid-template-columns: auto 1fr auto;
  padding: 10px 0;
}
.ml-top-grid.is-mobile {
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  padding: 10px 0;
}

.ml-bottom-grid {
  grid-template-columns: auto 1fr;
  padding: 6px 0;
}
.ml-bottom-grid.is-mobile {
  grid-template-columns: 1fr;
}

/* brand */
.ml-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--ml-white);
  min-width: 0;
}

/* FIX FINAL: logo SIN círculo/aro + texto Orbitron */
.ml-brand-ico {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  overflow: visible !important;
}
.ml-brand-ico :deep(.v-avatar__underlay) {
  display: none !important;
}
.ml-brand-img {
  width: 100%;
  height: 100%;
  padding: 0 !important;
  object-fit: contain !important;
  object-position: center !important;
  display: block;
}
.ml-brand-text {
  font-family: "Orbitron", sans-serif !important;
  font-weight: 900 !important;
  text-transform: uppercase !important;
  letter-spacing: 1px !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 260px;
}

/* search */
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
  min-height: 42px;
  padding-top: 8px;
  padding-bottom: 8px;
}
.ml-search :deep(input) {
  color: rgba(0, 0, 0, 0.78);
}
.ml-search :deep(input::placeholder) {
  color: rgba(0, 0, 0, 0.45);
  opacity: 1;
}
.ml-search :deep(.v-field__prepend-inner),
.ml-search :deep(.v-field__append-inner) {
  color: rgba(0, 0, 0, 0.55);
}

/* actions */
.ml-top-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}
.ml-top-actions-mobile {
  gap: 8px;
}
.ml-top-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 13px;
  font-weight: 800;
  padding: 6px 6px;
  border-radius: 10px;
  white-space: nowrap;
  opacity: 0.92;
}
.ml-top-link:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.08);
}
.ml-top-ico {
  color: #fff;
  opacity: 0.95;
}
.ml-top-icon {
  color: #fff;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  opacity: 0.95;
}
.ml-top-icon :deep(.v-icon) {
  color: #fff !important;
}
.ml-top-icon:hover {
  opacity: 1;
}

/* hamburger */
.ml-icon-btn {
  color: #fff !important;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
}

/* bottom: desktop location */
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
.ml-loc:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.08);
}
.ml-loc-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.ml-loc-top {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.78);
}
.ml-loc-bottom {
  font-size: 12px;
  font-weight: 950;
}

/* nav */
.ml-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

/* ✅ LINKS SUAVES (como tu ejemplo) */
.ml-nav-soft {
  color: rgba(255, 255, 255, 0.82);
  text-decoration: none;
  font-size: 13px;
  font-weight: 750;
  padding: 6px 8px;
  border-radius: 10px;
  white-space: nowrap;
  opacity: 0.92;
  transition: opacity 0.15s ease, background 0.15s ease;
}
.ml-nav-soft:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.08);
}

/* mobile row2 */
.ml-mobile-stack {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ml-mobile-row2 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.ml-hint-mobile {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  text-align: right;
  line-height: 1.15;
  max-width: 58%;
}

/* drawers */
.ml-drawer :deep(.v-navigation-drawer__content) {
  padding: 12px;
  background: #1488d1;
  color: #fff;
}
.ml-drawer :deep(.v-list) {
  background: transparent !important;
}
.ml-drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 4px 10px;
}
.ml-drawer-title {
  font-weight: 950;
  font-size: 16px;
  color: #fff;
}
.ml-drawer-foot {
  padding: 12px 6px 4px;
  color: rgba(255, 255, 255, 0.85);
}
</style>
