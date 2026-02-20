<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/label/ProductLabelPreview.vue -->
<template>
  <v-card class="plp" rounded="xl" elevation="1">
    <div class="plp-head">
      <div class="plp-title">Etiqueta</div>
      <v-chip size="small" variant="tonal" class="plp-chip">(sin foto)</v-chip>
    </div>

    <!-- ✅ Preview grande -->
    <div class="plp-stage">
      <div class="plp-sheet" :class="sheetClass">
        <!-- contenedor que escala -->
        <div class="plp-scale">
          <!-- el contenido real (etiqueta) -->
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

const sheetClass = computed(() => (is58.value ? "is-58" : "is-100"));
</script>

<style scoped>
.plp{
  padding: 12px;
}

.plp-head{
  display:flex;
  align-items:center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.plp-title{
  font-weight: 900;
  font-size: 14px;
}

.plp-chip{ opacity:.9; }

/* =========================
   ✅ PREVIEW GRANDE PRO
========================= */
.plp-stage{
  padding: 10px;
  border-radius: 14px;
  background: rgba(0,0,0,.03);
}

/* “hoja” blanca grande */
.plp-sheet{
  width: 100%;
  background: #fff;
  border-radius: 14px;
  border: 1px solid rgba(0,0,0,.10);
  box-shadow: 0 8px 18px rgba(0,0,0,.06);
  overflow: hidden;

  /* ✅ alto grande (desktop) */
  min-height: 340px;
  max-height: 520px;

  /* centra */
  display:flex;
  align-items:center;
  justify-content:center;
  padding: 14px;
}

/* mobile: un poco menos alto */
@media (max-width: 900px){
  .plp-sheet{
    min-height: 260px;
    max-height: 420px;
    padding: 12px;
  }
}

/* ✅ Mantener proporción real de etiqueta “canvas” */
.plp-sheet.is-100{
  aspect-ratio: 100 / 60;
}
.plp-sheet.is-58{
  aspect-ratio: 58 / 40;
}

/* el wrapper escala el componente sin scrolls */
.plp-scale{
  width: 100%;
  height: 100%;
  display:flex;
  align-items:center;
  justify-content:center;
}

/* La etiqueta se dibuja a “tamaño natural”,
   y la hacemos entrar con transform si el label ya trae medidas fijas */
.plp-label{
  transform-origin: center center;
  max-width: 100%;
  max-height: 100%;
}

/* ✅ si tus ProductLabelXX traen width/height fijos en px/mm,
      los “encerramos” para que NO se desborde */
.plp-scale :deep(.label),
.plp-scale :deep([data-label]),
.plp-scale :deep(.pl),
.plp-scale :deep(.lbl){
  max-width: 100%;
  max-height: 100%;
}

/* acciones abajo */
.plp-actions{
  margin-top: 10px;
}
</style>