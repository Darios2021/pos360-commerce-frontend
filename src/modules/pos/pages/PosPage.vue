<template>
  <v-container fluid class="pos-root" :style="cssVars">
    <!-- ─── MOBILE: layout app-like con FAB carrito + bottom-sheets ─── -->
    <template v-if="mobile">
      <PosEstadoConexion />
      <PosMobileLayout />
    </template>

    <!-- ─── DESKTOP: grid clásico con caja + carrito a la derecha ─── -->
    <template v-else>
      <PosEstadoConexion />
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
import PosMobileLayout from "../layouts/PosMobileLayout.vue";
import PosEstadoConexion from "../components/PosEstadoConexion.vue";
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
  padding: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--z-lienzo);

  /* Tokens del diseño de Zondito con la paleta de POS 360 (2026-10-09).
     Medidos en app.zondito.com y en el lienzo "Rediseño POS 360". */
  --z-lienzo: #d6e6f3;
  --z-panel: #ffffff;
  --z-barra: #ffffff;
  --z-tarjeta: #ffffff;
  --z-campo: #f1f5f9;
  --z-hundido: rgba(15, 23, 42, 0.03);
  --z-tonal: rgba(15, 23, 42, 0.05);
  --z-foto: rgba(15, 23, 42, 0.04);
  --z-borde: rgba(15, 23, 42, 0.10);
  --z-linea: rgba(15, 23, 42, 0.06);
  --z-texto: #0f172a;
  --z-texto2: #334155;
  --z-suave: #64748b;
  --z-primario: #0f6fae;
  --z-primario-tinta: #0f6fae;
}
:is(.v-theme--dark, .v-theme--adminDark) .pos-root,
.v-theme--adminDark .pos-root,
.v-theme--shopDark .pos-root {
  --z-lienzo: #0b0f14;
  --z-panel: #141a23;
  --z-barra: #10141b;
  --z-tarjeta: #1a2230;
  --z-campo: #1a2230;
  --z-hundido: rgba(255, 255, 255, 0.03);
  --z-tonal: rgba(255, 255, 255, 0.06);
  --z-foto: rgba(255, 255, 255, 0.04);
  --z-borde: rgba(255, 255, 255, 0.10);
  --z-linea: rgba(255, 255, 255, 0.08);
  --z-texto: #f1f5f9;
  --z-texto2: #cbd5e1;
  --z-suave: #94a3b8;
  --z-primario-tinta: #7dc0ec;
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
  border-radius: 0;
  box-sizing: border-box;
}

.pos-shell--topbar {
  padding: 0;
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
  background: transparent;
  border: 0;
  box-shadow: none;
}

/* El mostrador va de borde a borde, como en Zondito: el contenedor general
   de la app (máx. 1400 px y 16 px de aire) se libera sólo en esta pantalla. */
.pos-container:has(> .pos-root) {
  max-width: none !important;
  padding: 0 !important;
  margin: 0 !important;
}
</style>