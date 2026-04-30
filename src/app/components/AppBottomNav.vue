<!--
  AppBottomNav — Bottom navigation tipo app móvil con FAB central.

  El FAB central "Escanear" abre un selector de propósito:
   - Consultar producto  → escanea y abre la vista del producto.
   - Vender en POS       → navega al POS y dispara el scanner para sumar al carrito.
   - Armar derivación    → navega a Derivaciones y abre el form con scanner activo.

  Si el usuario YA está en el POS o en el form de derivación, el FAB
  detecta el contexto y abre directamente el scanner con la acción
  correspondiente, evitando el selector innecesario.
-->
<template>
  <nav class="bnav" aria-label="Navegación principal">
    <button
      v-for="item in itemsLeft"
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
        :class="{ 'is-active': scannerOpen || actionSheet }"
        :title="'Escanear código de producto'"
        aria-label="Escanear código"
        @click="onFabTap"
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

  <!-- Selector de propósito del scanner -->
  <v-bottom-sheet v-model="actionSheet" :scrim="true" inset>
    <div class="bnav-sheet">
      <div class="bnav-sheet__handle" />
      <div class="bnav-sheet__head">
        <div class="bnav-sheet__title">¿Qué querés hacer?</div>
        <div class="bnav-sheet__sub">El teléfono actúa como pistola digital</div>
      </div>

      <div class="bnav-sheet__actions">
        <button
          type="button"
          class="bnav-action"
          @click="chooseAction('consult')"
        >
          <div class="bnav-action__icon" style="--c1:#1488d1;--c2:#0e6ba8">
            <v-icon size="22">mdi-magnify-scan</v-icon>
          </div>
          <div class="bnav-action__body">
            <div class="bnav-action__title">Consultar producto</div>
            <div class="bnav-action__desc">Ver detalle, stock y precio del catálogo</div>
          </div>
          <v-icon size="20" class="bnav-action__chev">mdi-chevron-right</v-icon>
        </button>

        <button
          type="button"
          class="bnav-action"
          @click="chooseAction('sell')"
        >
          <div class="bnav-action__icon" style="--c1:#10b981;--c2:#059669">
            <v-icon size="22">mdi-cart-plus</v-icon>
          </div>
          <div class="bnav-action__body">
            <div class="bnav-action__title">Vender en POS</div>
            <div class="bnav-action__desc">Sumar al carrito y cobrar</div>
          </div>
          <v-icon size="20" class="bnav-action__chev">mdi-chevron-right</v-icon>
        </button>

        <button
          type="button"
          class="bnav-action"
          @click="chooseAction('transfer')"
        >
          <div class="bnav-action__icon" style="--c1:#f59e0b;--c2:#d97706">
            <v-icon size="22">mdi-truck-fast</v-icon>
          </div>
          <div class="bnav-action__body">
            <div class="bnav-action__title">Armar derivación</div>
            <div class="bnav-action__desc">Crear paquete para enviar a otra sucursal</div>
          </div>
          <v-icon size="20" class="bnav-action__chev">mdi-chevron-right</v-icon>
        </button>
      </div>
    </div>
  </v-bottom-sheet>

  <!-- Scanner directo (modo "consult" o cuando ya estoy en POS/derivación) -->
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
const actionSheet = ref(false);

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

/* ── FAB Scanner: lógica contextual ────────────────────────────────
   Si el usuario ya está en una pantalla operativa (POS, Derivaciones)
   asumimos la intención y abrimos el scanner directo. Si no, mostramos
   el selector con las 3 acciones posibles. */
function onFabTap() {
  if (route.name === "pos") {
    // En POS: dispara el scanner de venta (PosMobileLayout escucha el evento)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("pos:open-scanner"));
    }
    return;
  }
  if (route.name === "transfers") {
    // En Derivaciones: dispara el flujo "armar paquete" (abre el form si no está abierto)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("transfer:open-scanner"));
    }
    return;
  }
  // En cualquier otra pantalla: ofrecer las 3 acciones.
  actionSheet.value = true;
}

async function chooseAction(action) {
  actionSheet.value = false;
  // Pequeño delay para que el sheet termine de cerrar antes de navegar/abrir
  await new Promise(r => setTimeout(r, 180));

  if (action === "consult") {
    // Modo navigate: escanea y abre productView
    scannerOpen.value = true;
    return;
  }

  if (action === "sell") {
    // Va al POS y dispara el scanner desde allá
    if (route.name !== "pos") {
      await router.push({ name: "pos" });
      // Esperar que monte el PosMobileLayout antes de disparar el evento
      await new Promise(r => setTimeout(r, 250));
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("pos:open-scanner"));
    }
    return;
  }

  if (action === "transfer") {
    if (route.name !== "transfers") {
      await router.push({ name: "transfers" });
      await new Promise(r => setTimeout(r, 250));
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("transfer:open-scanner"));
    }
    return;
  }
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
  padding: 6px 4px calc(8px + env(safe-area-inset-bottom, 14px));
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.10);
}
/* Extender el background hacia abajo más allá del nav, así si el browser
   muestra una franja extra (URL bar retraída, gestos, etc.) sigue cubierta
   con el color del nav, no con el fondo de la página. */
.bnav::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: 60px;
  background: rgb(var(--v-theme-surface));
  pointer-events: none;
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
.bnav__item:active { background: rgba(20, 136, 209, 0.08); }
.bnav__item.is-active { color: #1488d1; }
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

/* ─── FAB CENTRAL ────────────────────────────────── */
.bnav__fab-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
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
  0%   { transform: scale(1);    opacity: 0.0; }
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

/* ─── BOTTOM SHEET DEL SELECTOR ────────────────── */
.bnav-sheet {
  background: rgb(var(--v-theme-surface));
  border-radius: 20px 20px 0 0;
  padding: 6px 12px calc(16px + env(safe-area-inset-bottom, 0px));
}
.bnav-sheet__handle {
  width: 44px;
  height: 4px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.18);
  margin: 8px auto 6px;
}
.bnav-sheet__head {
  text-align: center;
  padding: 8px 12px 14px;
}
.bnav-sheet__title {
  font-size: 17px;
  font-weight: 500;
  letter-spacing: -0.2px;
  color: rgb(var(--v-theme-on-surface));
}
.bnav-sheet__sub {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-top: 3px;
}
.bnav-sheet__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bnav-action {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: none;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s, transform 0.15s;
}
.bnav-action:active {
  transform: scale(0.99);
  background: rgba(var(--v-theme-on-surface), 0.07);
}
.v-theme--adminDark .bnav-action,
.v-theme--shopDark .bnav-action,
.v-theme--dark .bnav-action {
  background: rgba(255, 255, 255, 0.04);
}
.v-theme--adminDark .bnav-action:active,
.v-theme--shopDark .bnav-action:active,
.v-theme--dark .bnav-action:active {
  background: rgba(255, 255, 255, 0.08);
}

.bnav-action__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  background: linear-gradient(135deg, var(--c1, #1488d1) 0%, var(--c2, #0e6ba8) 100%);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
}
.bnav-action__body { flex: 1 1 auto; min-width: 0; }
.bnav-action__title {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.1px;
  line-height: 1.2;
  color: rgb(var(--v-theme-on-surface));
}
.bnav-action__desc {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.62);
  margin-top: 2px;
  line-height: 1.3;
}
.bnav-action__chev {
  flex-shrink: 0;
  color: rgba(var(--v-theme-on-surface), 0.4);
}
</style>
