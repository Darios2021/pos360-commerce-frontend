<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/actions/ProductPrintActions.vue -->
<template>
  <v-card class="pa" rounded="xl" elevation="0">
    <div class="pa-head">
      <div class="pa-title">Impresión</div>
      <v-chip size="small" variant="tonal">HOJA A4</v-chip>
    </div>

    <div class="pa-row">
      <v-btn-toggle v-model="modelSize" density="comfortable" rounded="lg" divided>
        <v-btn value="100" size="small">100×60</v-btn>
        <v-btn value="58" size="small">58×40</v-btn>
      </v-btn-toggle>

      <div class="pa-copies">
        <div class="pa-copies-lbl">Cantidad</div>
        <v-text-field
          v-model="modelCopies"
          type="number"
          min="1"
          density="compact"
          hide-details
          variant="outlined"
          style="max-width:120px"
        />
      </div>
    </div>

    <div class="pa-actions">
      <v-btn color="primary" variant="flat" :loading="printing" @click="doPrintA4">
        <v-icon start>mdi-printer</v-icon>
        IMPRIMIR
      </v-btn>

      <v-btn color="primary" variant="tonal" :loading="saving" @click="doPdfA4">
        <v-icon start>mdi-file-pdf-box</v-icon>
        GUARDAR PDF
      </v-btn>
    </div>

    <div class="pa-tip">
      * Modo A4 profesional: imprime grilla de etiquetas en hoja A4 (ideal Epson).
    </div>
  </v-card>
</template>

<script setup>
import { computed, ref } from "vue";
import { printLabelA4Pdf, downloadLabelPdfA4 } from "@/modules/products/utils/labelPdfA4.js";

const props = defineProps({
  // legacy (no se usa para A4 PDF vector)
  printEl: { type: Object, default: null },
  sheetEl: { type: Object, default: null },

  title: { type: String, default: "Etiquetas A4" },

  // ✅ data para PDF A4
  product: { type: Object, required: true },
  qrValue: { type: String, default: "" },
});

const modelSize = defineModel({ default: "100" });       // "100" | "58"
const modelCopies = defineModel("copies", { default: 8 });

const printing = ref(false);
const saving = ref(false);

const size = computed(() => String(modelSize.value || "100"));
const copies = computed(() => {
  const n = Number(modelCopies.value || 1);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
});

async function doPrintA4() {
  printing.value = true;
  try {
    await printLabelA4Pdf({
      product: props.product,
      size: size.value,
      copies: copies.value,
      qrValue: props.qrValue,
      title: props.title,
    });
  } finally {
    printing.value = false;
  }
}

async function doPdfA4() {
  saving.value = true;
  try {
    await downloadLabelPdfA4({
      product: props.product,
      size: size.value,
      copies: copies.value,
      qrValue: props.qrValue,
      title: props.title,
    });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.pa{
  padding: 12px;
  background: rgba(0,0,0,.02);
  border: 1px solid rgba(0,0,0,.08);
}
.pa-head{
  display:flex;
  align-items:center;
  justify-content: space-between;
  gap:10px;
  margin-bottom: 10px;
}
.pa-title{ font-weight: 500; }
.pa-row{
  display:flex;
  align-items:flex-end;
  justify-content: space-between;
  gap:12px;
  flex-wrap: wrap;
}
.pa-copies{ display:flex; flex-direction:column; gap:6px; }
.pa-copies-lbl{ font-size: 12px; opacity: .8; font-weight: 500; }

.pa-actions{
  margin-top: 12px;
  display:flex;
  gap:10px;
  flex-wrap: wrap;
}
.pa-tip{
  margin-top: 10px;
  font-size: 12px;
  opacity: .75;
}
</style>