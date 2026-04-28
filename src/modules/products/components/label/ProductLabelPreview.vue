<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/label/ProductLabelPreview.vue -->
<template>
  <v-card class="plp" rounded="xl" elevation="1">
    <div class="plp-head">
      <div class="plp-title">Etiqueta</div>
      <v-chip size="small" variant="tonal" class="plp-chip">(sin foto)</v-chip>
    </div>

    <!-- ✅ Preview -->
    <div class="plp-stage">
      <div class="plp-paper" :class="paperClass">
        <div class="plp-viewport">
          <component
            :is="labelComp"
            ref="printEl"
            class="plp-label"
            :product="product"
            :qrValue="qrValue"
          />
        </div>
      </div>
    </div>

    <!-- acciones (imprimir/pdf) -->
    <div class="plp-actions">
      <slot name="actions" :printEl="printElRef" />
    </div>
  </v-card>
</template>

<script setup>
import { computed, ref } from "vue";

import ProductLabel58 from "@/modules/products/components/label/ProductLabel58.vue";
import ProductLabel100 from "@/modules/products/components/label/ProductLabel100.vue";

const props = defineProps({
  product: { type: Object, required: true },
  size: { type: String, default: "100" }, // "100" | "58"
  qrValue: { type: String, default: "" },
});

const printEl = ref(null);
const printElRef = computed(() => printEl.value);

const is58 = computed(() => String(props.size) === "58");
const labelComp = computed(() => (is58.value ? ProductLabel58 : ProductLabel100));
const paperClass = computed(() => (is58.value ? "is-58" : "is-100"));

// Natural label width at 96dpi: 100mm≈378px, 58mm≈219px
// The paper is set to this width in CSS so the label renders at 1:1 with no overflow
const viewportStyle = computed(() => ({}));
const labelNaturalStyle = computed(() => ({}));
</script>

<style scoped>
/* Card */
.plp{
  padding: 12px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 10px 24px rgba(0,0,0,.10);
}

.plp-head{
  display:flex;
  align-items:center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.plp-title{
  font-weight: 500;
  font-size: 14px;
  letter-spacing: .2px;
}

.plp-chip{ opacity:.9; }

/* Fondo “stage” dark-friendly */
.plp-stage{
  padding: 10px;
  border-radius: 14px;
  background: rgba(var(--v-theme-on-surface), .06);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* “Papel” de etiqueta: ancho fijo = tamaño natural del label en pantalla (96dpi) */
.plp-paper{
  width: 378px;      /* 100mm at 96dpi */
  height: 227px;     /* 60mm at 96dpi */
  max-width: 100%;
  background: #fff;
  border-radius: 16px;
  border: 1px solid rgba(0,0,0,.10);
  box-shadow: 0 10px 22px rgba(0,0,0,.08);
  overflow: hidden;
  margin: 0 auto;
}

.plp-paper.is-58{
  width: 219px;      /* 58mm at 96dpi */
  height: 151px;     /* 40mm at 96dpi */
}

.plp-viewport{
  width: 100%;
  height: 100%;
}

.plp-label{
  width: 100%;
  height: 100%;
}

/* =========================================================
   ✅ FIX CLAVE: EN DARK MODE el “on-surface” es claro (blanco)
   y sobre papel blanco desaparece el texto.
   => Forzamos “tinta” oscura SOLO dentro del papel.
========================================================= */
.plp-paper :deep(*){ 
  color: #111 !important;
}

/* si hay elementos que usan opacity baja, los levantamos un toque */
.plp-paper :deep(.muted),
.plp-paper :deep(.meta),
.plp-paper :deep(.sub),
.plp-paper :deep(small){
  color: rgba(17,17,17,.78) !important;
}

/* SVG/iconos dentro de la etiqueta */
.plp-paper :deep(svg){
  fill: #111 !important;
  stroke: #111 !important;
}

/* por las dudas: backgrounds internos del label */
.plp-paper :deep(.bg),
.plp-paper :deep([data-bg]){
  background: transparent !important;
}

/* acciones */
.plp-actions{
  margin-top: 10px;
}
</style>