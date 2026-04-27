<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/layouts/ShopLayout.vue -->
<template>
  <div class="scope-shop" data-scope="shop">
    <!-- ✅ Tema SOLO del shop: evita que botones tomen adminLight -->
    <v-theme-provider theme="shopLight">
      <v-layout class="shop-shell d-flex flex-column" data-layout="shop">
        <div class="shop-header">
          <ShopHeader />
        </div>

        <v-main class="shop-main" :class="{ 'has-bottom-nav': isMobile }">
          <router-view />
        </v-main>

        <!-- ✅ Bottom nav SOLO acá (NO en páginas) -->
        <ShopBottomNav v-if="isMobile" />
      </v-layout>
    </v-theme-provider>
  </div>
</template>

<script setup>
import { computed, onMounted, nextTick } from "vue";
import { useDisplay } from "vuetify";

import ShopHeader from "@/modules/shop/components/ShopHeader.vue";
import ShopBottomNav from "@/modules/shop/components/ShopBottomNav.vue";

import { getShopThemePublic } from "@/modules/shop/service/shopTheme.public.api";
import { applyRuntimeTheme, normalizeTheme } from "@/modules/shop/utils/runtimeTheme";
import { setVuetifyThemeColors } from "@/modules/shop/utils/setVuetifyThemeColors";

import "@/modules/shop/styles/shop.css";

const { xs } = useDisplay();
const isMobile = computed(() => !!xs.value);

function normHex(v, fallback) {
  const s = String(v || "").trim();
  if (!s) return fallback;
  const h = s.startsWith("#") ? s : `#${s}`;
  return /^#[0-9a-fA-F]{6}$/.test(h) ? h.toLowerCase() : fallback;
}

async function applyShopThemeFromServer() {
  await nextTick();

  try {
    const th = await getShopThemePublic();

    const payload = normalizeTheme({
      primary: normHex(th?.primary, "#0e2134"),
      secondary: normHex(th?.secondary, "#3483fa"),
      ...(th?.background ? { background: normHex(th.background, "") } : {}),
      ...(th?.surface ? { surface: normHex(th.surface, "") } : {}),
      ...(th?.error ? { error: normHex(th.error, "") } : {}),
      ...(th?.success ? { success: normHex(th.success, "") } : {}),
      ...(th?.warning ? { warning: normHex(th.warning, "") } : {}),
    });

    // ✅ 1) CSS vars solo en .scope-shop (para footer y helpers CSS)
    applyRuntimeTheme(payload, { scope: ".scope-shop", strict: true });

    // ✅ 2) Vuetify theme runtime (para botones, chips, inputs, etc.)
    setVuetifyThemeColors("shopLight", payload);
  } catch {
    const payload = normalizeTheme({ primary: "#0e2134", secondary: "#3483fa" });
    applyRuntimeTheme(payload, { scope: ".scope-shop", strict: true });
    setVuetifyThemeColors("shopLight", payload);
  }
}

onMounted(() => {
  applyShopThemeFromServer();
});
</script>

<style scoped>
.shop-shell {
  min-height: 100dvh;
  background: transparent;
  width: 100%;
}

.shop-header {
  width: 100%;
  flex: 0 0 auto;
}

.shop-main {
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  padding-bottom: 0 !important;
}

/* ✅ deja espacio real para la barra inferior SOLO si existe */
.shop-main.has-bottom-nav {
  padding-bottom: calc(var(--ml-bottom-nav-h, 64px) + env(safe-area-inset-bottom)) !important;
}
</style>

<!-- Variable global para que componentes externos al layout (FAB de WhatsApp,
     burbujas de chat, etc.) puedan despejar el espacio del bottom nav. -->
<style>
.scope-shop {
  --ml-bottom-nav-h: 64px;
}
</style>