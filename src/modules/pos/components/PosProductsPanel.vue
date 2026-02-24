<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosProductsPanel.vue -->
<template>
  <v-card class="pp-card" elevation="0">
    <!-- HEADER (súper sutil, SIN texto, SIN botones) -->
    <div class="pp-head" />

    <!-- BODY (scrollea adentro) -->
    <div class="pp-body">
      <div v-if="loading" class="d-flex justify-center align-center py-10">
        <v-progress-circular indeterminate />
      </div>

      <div v-else>
        <div v-if="items.length" class="pp-items">
          <!-- acá adentro renderizás tus PosProductRow desde el padre -->
          <slot />

          <!-- ✅ GAP REAL para que el último row no se pegue al footer -->
          <div class="pp-bottom-gap" />
        </div>

        <div v-else class="pp-empty text-center py-10 text-medium-emphasis">
          <v-icon size="52" class="mb-2">mdi-text-box-search-outline</v-icon>
          <div class="text-h6">No se encontraron productos</div>
        </div>
      </div>
    </div>

    <!-- FOOTER (súper sutil, SIN texto, pero con AIRE real abajo) -->
    <div class="pp-foot" />
  </v-card>
</template>

<script setup>
defineProps({
  loading: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
});
</script>

<style scoped>
/* =========================
   Base: header fijo + body scroll + footer fijo
========================= */
.pp-card {
  height: 100%;
  min-height: 0;
  overflow: hidden;

  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  background: rgb(var(--v-theme-surface));

  display: flex;
  flex-direction: column;

  box-shadow:
    0 6px 16px rgba(0,0,0,0.05),
    0 16px 34px rgba(0,0,0,0.06);
}

/* =========================
   HEADER ultra sutil (sin texto)
========================= */
.pp-head {
  flex: 0 0 auto;
  height: 10px;

  background: rgba(var(--v-theme-on-surface), 0.01);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

/* =========================
   BODY scroll
========================= */
.pp-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  scrollbar-gutter: stable;

  padding: 10px 10px 0 10px;

  /* Firefox */
  scrollbar-width: auto;
  scrollbar-color: rgba(0, 0, 0, 0.35) rgba(0, 0, 0, 0.06);
}

/* Webkit */
.pp-body::-webkit-scrollbar {
  width: 12px;
}
.pp-body::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.06);
  border-radius: 999px;
}
.pp-body::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.55);
  border-radius: 999px;
  border: 3px solid rgba(0,0,0,0.06);
}
.pp-body::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-primary), 0.85);
}

.pp-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ✅ ESTE es el aire final “real” (suma: footer + safe-area) */
.pp-bottom-gap {
  height: calc(var(--pp-foot-h, 28px) + env(safe-area-inset-bottom, 0px) + 20px);
}

.pp-empty {
  padding-bottom: 24px;
}

/* =========================
   FOOTER sutil (sin texto) + aire abajo (safe-area)
========================= */
.pp-foot {
  --pp-foot-h: 28px;

  flex: 0 0 auto;
  height: calc(var(--pp-foot-h) + env(safe-area-inset-bottom, 0px));

  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);

  /* sombra hacia arriba MUY suave */
  box-shadow: 0 -14px 22px rgba(0,0,0,0.05);
}

/* Mobile: un poquito más de aire */
@media (max-width: 960px) {
  .pp-foot {
    --pp-foot-h: 32px;
  }
  .pp-head {
    height: 8px;
  }
}
</style>