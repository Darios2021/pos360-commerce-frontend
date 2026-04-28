<!--
  PosMobileLayout — Layout dedicado para POS en mobile.

  Lógica nueva pensada como app móvil:
   - Header compacto: chip de caja + (eventualmente) acciones en menú.
   - Buscador y catálogo ocupan toda la pantalla (foco en agregar productos).
   - FAB de carrito flotante: muestra badge con cantidad y se abre como
     bottom-sheet con la lista completa + botón gigante "Cobrar".

  Reusa los componentes de venta existentes (PosLeftSection, PosCajaOnly,
  PosCartOnly) y se conecta con el flujo via usePosSalesFlow para mantener
  la lógica intacta.
-->
<template>
  <div class="pos-mobile">
    <!-- ── Header compacto ────────────────────────────── -->
    <header class="pos-mobile__head">
      <button
        type="button"
        class="pos-mobile__caja-pill"
        :class="{ 'is-open': isCajaOpen, 'is-closed': !isCajaOpen }"
        @click="cajaSheet = true"
        :title="isCajaOpen ? 'Caja abierta' : 'Caja cerrada'"
      >
        <v-icon size="14">{{ isCajaOpen ? 'mdi-lock-open-variant' : 'mdi-lock' }}</v-icon>
        <span class="pos-mobile__caja-text">
          {{ isCajaOpen ? 'Caja abierta' : 'Caja cerrada' }}
        </span>
        <v-icon size="14" class="pos-mobile__caja-chev">mdi-chevron-down</v-icon>
      </button>

      <v-spacer />

      <v-btn
        icon
        variant="text"
        size="small"
        :title="`Refrescar catálogo (F5)`"
        @click="onRefresh"
      >
        <v-icon>mdi-refresh</v-icon>
      </v-btn>

      <v-btn
        icon
        variant="text"
        size="small"
        title="Buscar / consultar (F2)"
        @click="onConsulta"
      >
        <v-icon>mdi-magnify</v-icon>
      </v-btn>

      <v-btn
        icon
        variant="text"
        size="small"
        title="Ayuda (F1)"
        @click="onHelp"
      >
        <v-icon>mdi-help-circle-outline</v-icon>
      </v-btn>
    </header>

    <!-- ── Catálogo (search + grid) ocupando toda la pantalla ── -->
    <main class="pos-mobile__main">
      <PosLeftSection />
    </main>

    <!-- ── FAB del carrito ────────────────────────────── -->
    <Transition name="pos-fab">
      <button
        v-if="cartCount > 0 && !cartSheet"
        type="button"
        class="pos-mobile__cart-fab"
        @click="cartSheet = true"
        aria-label="Abrir carrito"
      >
        <div class="pos-mobile__cart-fab-icon">
          <v-icon size="20">mdi-cart</v-icon>
          <span class="pos-mobile__cart-fab-badge">{{ cartCount }}</span>
        </div>
        <div class="pos-mobile__cart-fab-text">
          <div class="pos-mobile__cart-fab-label">Carrito</div>
          <div class="pos-mobile__cart-fab-total">{{ money(checkoutTotalPreview) }}</div>
        </div>
        <v-icon size="22" class="pos-mobile__cart-fab-chev">mdi-chevron-up</v-icon>
      </button>
    </Transition>

    <!-- ── Bottom sheet del carrito ───────────────────── -->
    <v-bottom-sheet v-model="cartSheet" :scrim="true" inset>
      <div class="pos-mobile__sheet">
        <div class="pos-mobile__sheet-handle" @click="cartSheet = false" />

        <div class="pos-mobile__sheet-head">
          <div>
            <div class="pos-mobile__sheet-title">
              Tu carrito
              <span v-if="cartCount" class="pos-mobile__sheet-count">{{ cartCount }}</span>
            </div>
            <div class="pos-mobile__sheet-sub" v-if="cartCount === 0">
              Vacío. Agregá productos del catálogo.
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="cartSheet = false" />
        </div>

        <div class="pos-mobile__sheet-body">
          <PosCartOnly />
        </div>
      </div>
    </v-bottom-sheet>

    <!-- ── Bottom sheet del estado de caja ────────────── -->
    <v-bottom-sheet v-model="cajaSheet" :scrim="true" inset>
      <div class="pos-mobile__sheet">
        <div class="pos-mobile__sheet-handle" @click="cajaSheet = false" />

        <div class="pos-mobile__sheet-head">
          <div class="pos-mobile__sheet-title">
            <v-icon size="18" class="mr-2" :color="isCajaOpen ? 'success' : 'error'">
              {{ isCajaOpen ? 'mdi-lock-open-variant' : 'mdi-lock' }}
            </v-icon>
            Estado de caja
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="cajaSheet = false" />
        </div>

        <div class="pos-mobile__sheet-body">
          <PosCajaOnly />
        </div>
      </div>
    </v-bottom-sheet>
  </div>
</template>

<script setup>
import { ref } from "vue";
import PosLeftSection from "../sections/PosLeftSection.vue";
import PosCajaOnly from "../sections/PosCajaOnly.vue";
import PosCartOnly from "../sections/PosCartOnly.vue";
import { usePosSalesFlow } from "../containers/usePosSalesFlow";

const {
  cartCount,
  isCajaOpen,
  checkoutTotalPreview,
  helpOpen,
  consultaOpen,
  requestRefreshCatalog,
} = usePosSalesFlow();

const cartSheet = ref(false);
const cajaSheet = ref(false);

function money(v) {
  const n = Number(v || 0);
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

function onHelp()     { helpOpen.value = !helpOpen.value; }
function onConsulta() { consultaOpen.value = !consultaOpen.value; }
function onRefresh()  { requestRefreshCatalog?.(); }
</script>

<style scoped>
.pos-mobile {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  width: 100%;
  background: rgb(var(--v-theme-background));
  overflow: hidden;
}

/* ── HEADER COMPACTO ───────────────────────────── */
.pos-mobile__head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  z-index: 5;
}

.pos-mobile__caja-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px solid transparent;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.pos-mobile__caja-pill.is-open {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.3);
  color: #10b981;
}
.pos-mobile__caja-pill.is-closed {
  background: rgba(239, 68, 68, 0.10);
  border-color: rgba(239, 68, 68, 0.28);
  color: #ef4444;
}
.pos-mobile__caja-pill:active {
  filter: brightness(0.95);
}
.pos-mobile__caja-text {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}
.pos-mobile__caja-chev {
  opacity: 0.65;
}

/* ── MAIN: catálogo full-screen ───────────────── */
.pos-mobile__main {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.pos-mobile__main :deep(.pos-left-section),
.pos-mobile__main :deep(.pos-search-shell) {
  height: 100%;
  min-height: 0;
}

/* ── FAB DEL CARRITO ──────────────────────────── */
.pos-mobile__cart-fab {
  position: fixed;
  /* Sobre el bottom-nav (que mide ~70px + safe-area). */
  bottom: calc(82px + env(safe-area-inset-bottom, 0px));
  left: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  border-radius: 18px;
  background: linear-gradient(135deg, #1488d1 0%, #0e6ba8 100%);
  color: #fff;
  cursor: pointer;
  box-shadow:
    0 16px 40px rgba(20, 136, 209, 0.45),
    0 4px 14px rgba(0, 0, 0, 0.18);
  z-index: 1005;
  -webkit-tap-highlight-color: transparent;
}
.pos-mobile__cart-fab:active {
  transform: translateY(1px);
}

.pos-mobile__cart-fab-icon {
  position: relative;
  width: 38px; height: 38px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.20);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pos-mobile__cart-fab-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #fff;
  color: #1488d1;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.14);
}
.pos-mobile__cart-fab-text {
  flex: 1 1 auto;
  text-align: left;
  min-width: 0;
}
.pos-mobile__cart-fab-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: 0.85;
  line-height: 1;
}
.pos-mobile__cart-fab-total {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.2px;
  line-height: 1.2;
  margin-top: 2px;
}
.pos-mobile__cart-fab-chev {
  flex-shrink: 0;
  opacity: 0.9;
}

/* Transición del FAB */
.pos-fab-enter-active,
.pos-fab-leave-active {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 0.2s ease;
}
.pos-fab-enter-from,
.pos-fab-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.92);
}

/* ── BOTTOM SHEETS ────────────────────────────── */
.pos-mobile__sheet {
  background: rgb(var(--v-theme-surface));
  border-radius: 20px 20px 0 0;
  /* Altura fija (en lugar de max-height) para que los hijos con height:100%
     funcionen bien y no se desborden. dvh respeta la barra de URL en mobile. */
  height: 85dvh;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-sizing: border-box;
}
.pos-mobile__sheet-handle {
  width: 44px;
  height: 4px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.18);
  margin: 10px auto 4px;
  flex-shrink: 0;
  cursor: pointer;
}
.pos-mobile__sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 8px;
  flex-shrink: 0;
}
.pos-mobile__sheet-title {
  font-size: 16px;
  font-weight: 500;
  letter-spacing: -0.2px;
  display: inline-flex;
  align-items: center;
}
.pos-mobile__sheet-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  margin-left: 8px;
  border-radius: 999px;
  background: #1488d1;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
}
.pos-mobile__sheet-sub {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-top: 2px;
}
.pos-mobile__sheet-body {
  flex: 1 1 0;
  min-height: 0;
  /* El scroll lo maneja el componente interno (cart-body / caja-body).
     Si dejamos overflow:auto acá habría doble scroll y el contenedor se
     extendería con el contenido. */
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.pos-mobile__sheet-body > * {
  flex: 1 1 0;
  min-height: 0;
  height: 100%;
}
</style>
