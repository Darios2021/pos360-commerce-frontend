<template>
  <v-container fluid class="pos-root" :style="cssVars">
    <PosGridLayout class="pos-layout">
      <template #topbar>
        <div class="pos-shell pos-shell--topbar">
          <PosTopBarSection />
        </div>
      </template>

      <template #search>
        <div class="pos-shell pos-shell--search">
          <PosLeftSection />
        </div>
      </template>

      <template #caja>
        <div class="pos-shell pos-shell--caja">
          <PosCajaOnly />
        </div>
      </template>

      <template #cart>
        <div class="pos-shell pos-shell--cart">
          <PosCartOnly />
        </div>
      </template>
    </PosGridLayout>

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
import { usePosUiConfig } from "../composables/usePosUiConfig";

const { cssVars } = usePosUiConfig();
</script>

<style scoped>
.pos-root {
  height: calc(
    100dvh - var(--v-layout-top, 0px) - var(--v-layout-bottom, 0px)
  );
  min-height: calc(
    100dvh - var(--v-layout-top, 0px) - var(--v-layout-bottom, 0px)
  );
  max-height: calc(
    100dvh - var(--v-layout-top, 0px) - var(--v-layout-bottom, 0px)
  );
  min-width: 0;
  margin: 0;
  padding: var(--pos-root-padding, 8px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgb(var(--v-theme-background));
}

.pos-layout {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  width: 100%;
  height: 100%;
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