<!--
  AppBottomNav — Bottom navigation tipo app móvil con FAB central.

  Estructura (estilo Mercado Pago / Instagram):
    [ Inicio ]  [ Productos ]  [ ✦ SCAN ✦ ]  [ Derivaciones ]  [ Vender ]
                                  ↑ FAB elevado y superpuesto

  El FAB central abre el lector de códigos de barras (cámara o input
  manual) y al detectar un producto navega a su vista de detalle.
-->
<template>
  <nav class="bnav" aria-label="Navegación principal">
    <button
      v-for="(item, idx) in itemsLeft"
      :key="`l-${item.name}`"
      type="button"
      class="bnav__item"
      :class="{ 'is-active': isActive(item) }"
      @click="go(item)"
    >
      <span class="bnav__icon-wrap">
        <v-icon size="22">{{ isActive(item) ? item.activeIcon : item.icon }}</v-icon>
        <v-badge
          v-if="item.badge && item.badge > 0"
          :content="item.badge > 9 ? '9+' : String(item.badge)"
          color="error"
          floating
          offset-x="-2"
          offset-y="-2"
          class="bnav__badge"
        />
      </span>
      <span class="bnav__label">{{ item.label }}</span>
    </button>

    <!-- FAB central — Lector de código de barras -->
    <div class="bnav__fab-slot">
      <button
        type="button"
        class="bnav__fab"
        :class="{ 'is-active': scannerOpen }"
        :title="'Escanear código de producto'"
        aria-label="Escanear código"
        @click="openScanner"
      >
        <v-icon size="26">mdi-barcode-scan</v-icon>
      </button>
      <span class="bnav__fab-label">Escanear</span>
    </div>

    <button
      v-for="item in itemsRight"
      :key="`r-${item.name}`"
      type="button"
      class="bnav__item"
      :class="{ 'is-active': isActive(item) }"
      @click="go(item)"
    >
      <span class="bnav__icon-wrap">
        <v-icon size="22">{{ isActive(item) ? item.activeIcon : item.icon }}</v-icon>
        <v-badge
          v-if="item.badge && item.badge > 0"
          :content="item.badge > 9 ? '9+' : String(item.badge)"
          color="error"
          floating
          offset-x="-2"
          offset-y="-2"
          class="bnav__badge"
        />
      </span>
      <span class="bnav__label">{{ item.label }}</span>
    </button>
  </nav>

  <BarcodeScannerDialog v-model="scannerOpen" />
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import BarcodeScannerDialog from "./BarcodeScannerDialog.vue";

const props = defineProps({
  /** Cantidad de derivaciones pendientes (badge). */
  transferUnreadCount: { type: Number, default: 0 },
});

const route = useRoute();
const router = useRouter();
const scannerOpen = ref(false);

const itemsLeft = computed(() => [
  {
    name: "home",
    label: "Inicio",
    icon: "mdi-view-dashboard-outline",
    activeIcon: "mdi-view-dashboard",
    to: { name: "home" },
  },
  {
    name: "products",
    label: "Productos",
    icon: "mdi-package-variant-closed",
    activeIcon: "mdi-package-variant-closed",
    to: { name: "products" },
    activeNames: ["products", "productNew", "productEdit", "productView", "productProfile", "productsImport"],
  },
]);

const itemsRight = computed(() => [
  {
    name: "transfers",
    label: "Derivaciones",
    icon: "mdi-truck-fast-outline",
    activeIcon: "mdi-truck-fast",
    to: { name: "transfers" },
    badge: props.transferUnreadCount,
  },
  {
    name: "pos",
    label: "Vender",
    icon: "mdi-point-of-sale",
    activeIcon: "mdi-point-of-sale",
    to: { name: "pos" },
  },
]);

function isActive(item) {
  if (Array.isArray(item.activeNames)) {
    return item.activeNames.includes(route.name);
  }
  return route.name === item.name;
}
function go(item) {
  if (route.name === item.name) return;
  router.push(item.to);
}
function openScanner() {
  scannerOpen.value = true;
}
</script>

<style scoped>
.bnav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1010;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  display: grid;
  grid-template-columns: 1fr 1fr auto 1fr 1fr;
  align-items: end;
  padding: 6px 4px calc(6px + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.10);
}
.v-theme--adminDark .bnav,
.v-theme--shopDark .bnav,
.v-theme--dark .bnav {
  border-top-color: rgba(255, 255, 255, 0.06);
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.32);
}

.bnav__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 4px 4px;
  border: none;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.55);
  cursor: pointer;
  border-radius: 12px;
  transition: color 0.15s, background 0.15s;
  min-height: 56px;
  -webkit-tap-highlight-color: transparent;
}
.bnav__item:active {
  background: rgba(20, 136, 209, 0.08);
}
.bnav__item.is-active {
  color: #1488d1;
}
.bnav__item.is-active::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 3px;
  border-radius: 0 0 999px 999px;
  background: #1488d1;
}

.bnav__icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 26px;
}
.bnav__label {
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.01em;
  line-height: 1;
  white-space: nowrap;
}
.bnav__item.is-active .bnav__label { font-weight: 600; }
.bnav__badge { position: absolute; top: -2px; right: -2px; }

/* ─── FAB CENTRAL (Lector) ─────────────────────────────────────── */
.bnav__fab-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* compensa el alto del FAB que sobresale arriba del bottom-nav */
  margin-top: -28px;
  width: 76px;
}
.bnav__fab {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 4px solid rgb(var(--v-theme-surface));
  background: linear-gradient(135deg, #1488d1 0%, #0e6ba8 100%);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow:
    0 12px 28px rgba(20, 136, 209, 0.50),
    0 4px 10px rgba(0, 0, 0, 0.18);
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.18s;
  position: relative;
}
.bnav__fab::before {
  /* Halo brand pulsante para invitar al tap */
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: rgba(20, 136, 209, 0.30);
  opacity: 0;
  z-index: -1;
  animation: bnav-fab-pulse 2.4s ease-in-out infinite;
}
@keyframes bnav-fab-pulse {
  0%   { transform: scale(1);   opacity: 0.0; }
  50%  { transform: scale(1.18); opacity: 0.5; }
  100% { transform: scale(1.35); opacity: 0;   }
}
.bnav__fab:active {
  transform: scale(0.94);
  box-shadow:
    0 6px 14px rgba(20, 136, 209, 0.45),
    0 2px 4px rgba(0, 0, 0, 0.18);
}
.bnav__fab.is-active {
  background: linear-gradient(135deg, #0e6ba8 0%, #082c5b 100%);
}

.v-theme--adminDark .bnav__fab,
.v-theme--shopDark .bnav__fab,
.v-theme--dark .bnav__fab {
  border-color: rgb(var(--v-theme-surface));
}

.bnav__fab-label {
  margin-top: 4px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #1488d1;
  white-space: nowrap;
}
</style>
