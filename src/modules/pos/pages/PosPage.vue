<template>
  <v-container fluid class="pos-root" :style="cssVars">
    <!-- ─── MOBILE: layout app-like con FAB carrito + bottom-sheets ─── -->
    <template v-if="mobile">
      <PosMobileLayout />
    </template>

    <!-- ─── DESKTOP: grid clásico con caja + carrito a la derecha ─── -->
    <template v-else>
      <AppPageHeader
        icon="mdi-point-of-sale"
        title="Punto de Venta"
        subtitle="Operación rápida con accesos por teclado (F1, F2, F4, F5, F6, F9)"
        dense
        class="pos-page-header"
      />
      <PosGridLayout class="pos-layout">
        <template #topbar>
          <div class="pos-shell pos-shell--topbar" data-tour="topbar">
            <PosTopBarSection />
          </div>
        </template>

        <template #search>
          <div class="pos-shell pos-shell--search" data-tour="catalog">
            <PosLeftSection />
          </div>
        </template>

        <template #caja>
          <div class="pos-shell pos-shell--caja" data-tour="caja">
            <PosCajaOnly />
          </div>
        </template>

        <template #cart>
          <div class="pos-shell pos-shell--cart" data-tour="cart">
            <PosCartOnly />
          </div>
        </template>
      </PosGridLayout>
    </template>

    <PosDialogs />
  </v-container>
</template>

<script setup>
import PosGridLayout from "../layouts/PosGridLayout.vue";
import PosTopBarSection from "../sections/PosTopBarSection.vue";
import PosLeftSection from "../sections/PosLeftSection.vue";
import PosCajaOnly from "../sections/PosCajaOnly.vue";
import PosCartOnly from "../sections/PosCartOnly.vue";
import PosDialogs from "../dialogs/PosDialogs.vue";
import AppPageHeader from "@/app/components/AppPageHeader.vue";
import PosMobileLayout from "../layouts/PosMobileLayout.vue";
import { usePosUiConfig } from "../composables/usePosUiConfig";
import { useDisplay } from "vuetify";

const { cssVars } = usePosUiConfig();
const { mobile } = useDisplay();
</script>

<style scoped>
/* DESKTOP: altura fija calculada desde el viewport menos el header del v-layout
   (top app-bar). Esto permite que el grid interno calcule alturas correctamente
   y los paneles (catálogo / carrito) tengan scroll interno sin desbordarse. */
.pos-root {
  height: calc(100dvh - var(--v-layout-top, 0px) - var(--v-layout-bottom, 0px));
  min-height: calc(100dvh - var(--v-layout-top, 0px) - var(--v-layout-bottom, 0px));
  max-height: calc(100dvh - var(--v-layout-top, 0px) - var(--v-layout-bottom, 0px));
  min-width: 0;
  margin: 0;
  padding: var(--pos-root-padding, 8px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgb(var(--v-theme-background));
}

/* MOBILE: en mobile el v-main ya reserva el padding-bottom para el bottom-nav,
   así que el root toma 100% del v-main (sin restar nada extra). */
@media (max-width: 600px) {
  .pos-root {
    height: 100%;
    min-height: 0;
    max-height: none;
    padding: 6px;
  }
  .pos-page-header { display: none; }
}

.pos-page-header {
  flex: 0 0 auto;
}

.pos-layout {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  width: 100%;
  max-height: 100%;
  overflow: hidden;
}

.pos-shell {
  min-width: 0;
  min-height: 0;
  width: 100%;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  border-radius: var(--pos-shell-radius, 14px);
  box-sizing: border-box;
}

.pos-shell--topbar {
  padding: var(--pos-shell-topbar-padding, 8px 10px);
}

.pos-shell--search {
  padding: var(--pos-shell-search-padding, 0);
}

.pos-shell--caja {
  padding: var(--pos-shell-caja-padding, 0);
}

.pos-shell--cart {
  padding: var(--pos-shell-cart-padding, 0);
}
</style>

<!-- Estilos globales del módulo POS (no scoped): clases compartidas
     por múltiples sections/components. Definido una sola vez acá para
     evitar duplicación y que dark mode funcione via tokens de Vuetify. -->
<style>
.pos-root .pos-surface {
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--pos-card-border, rgba(var(--v-theme-on-surface), 0.1));
  box-shadow: var(--pos-card-shadow, 0 8px 24px rgba(0, 0, 0, 0.06));
}
</style>