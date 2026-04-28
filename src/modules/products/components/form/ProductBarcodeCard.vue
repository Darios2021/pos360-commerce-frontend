<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/form/ProductBarcodeCard.vue -->
<template>
  <v-card class="bc-card" rounded="lg" variant="tonal">
    <div class="bc-head">
      <div class="d-flex align-center ga-2">
        <v-icon size="18">mdi-barcode</v-icon>
        <div class="text-subtitle-2 font-weight-semibold">Código de barras</div>
      </div>

      <div class="d-flex align-center ga-2">
        <v-chip size="x-small" label variant="flat">{{ effectiveMode }}</v-chip>

        <v-btn
          v-if="effectiveMode === 'PREVIEW'"
          size="small"
          variant="text"
          class="text-medium-emphasis"
          :disabled="loading"
          @click="$emit('recalc')"
        >
          <v-icon start size="18">mdi-refresh</v-icon>
          Recalcular
        </v-btn>
      </div>
    </div>

    <v-divider />

    <div class="bc-body">
      <div class="bc-left">
        <div class="text-caption text-medium-emphasis">Valor</div>
        <div class="bc-value">{{ displayValue || "—" }}</div>
        <div class="text-caption text-medium-emphasis mt-2">
          Tip: imprimí etiqueta y pegala en góndola/caja.
        </div>
      </div>

      <div class="bc-right">
        <div class="bc-canvas" ref="wrapEl">
          <canvas ref="canvasEl"></canvas>

          <div v-if="!displayValue" class="bc-empty">Sin código</div>

          <div v-if="loading" class="bc-loading">
            <v-progress-circular indeterminate size="22" />
          </div>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";
import JsBarcode from "jsbarcode";

const props = defineProps({
  // ✅ valor real (ej: P000000192 o similar)
  value: { type: String, default: "" },

  // ✅ compat con tu uso actual desde ProductFormDialog
  preview: { type: String, default: "" },
  label: { type: String, default: "" }, // REAL | PREVIEW

  // ✅ modo "nuevo" (si lo usás en otros lados)
  mode: { type: String, default: "" }, // REAL | PREVIEW

  loading: { type: Boolean, default: false },
});

defineEmits(["recalc"]);

const canvasEl = ref(null);
const wrapEl = ref(null);

function normMode(v) {
  const s = String(v || "").trim().toUpperCase();
  return s === "PREVIEW" ? "PREVIEW" : "REAL";
}

const effectiveMode = computed(() => {
  // prioridad: label (como lo usás ahora) > mode > REAL
  return normMode(props.label || props.mode || "REAL");
});

const realValue = computed(() => String(props.value || "").trim());
const previewValue = computed(() => String(props.preview || "").trim());

// ✅ si estamos en PREVIEW, mostramos preview; si no, mostramos value
const displayValue = computed(() => {
  if (effectiveMode.value === "PREVIEW") return previewValue.value || "";
  return realValue.value || "";
});

function sizeCanvasToContainer() {
  const el = canvasEl.value;
  const wrap = wrapEl.value;
  if (!el || !wrap) return;

  const w = Math.max(240, Math.floor(wrap.clientWidth || 0));
  const h = 90;

  // setear tamaño real del canvas (importante para evitar blur/recortes)
  el.width = w;
  el.height = h;
}

async function renderBarcode() {
  await nextTick();
  const el = canvasEl.value;
  if (!el) return;

  sizeCanvasToContainer();

  const ctx = el.getContext("2d");
  ctx && ctx.clearRect(0, 0, el.width, el.height);

  if (!displayValue.value) return;

  try {
    JsBarcode(el, displayValue.value, {
      format: "CODE128",
      displayValue: true,
      margin: 8,
      height: 54,
      fontSize: 14,
      textMargin: 6,
    });
  } catch {
    // no romper UI
  }
}

watch(
  () => [displayValue.value, effectiveMode.value, props.loading],
  () => renderBarcode(),
  { immediate: true }
);

// re-render en resize (por si cambia el grid)
let ro = null;
watch(
  () => wrapEl.value,
  (el) => {
    if (ro) {
      try { ro.disconnect(); } catch {}
      ro = null;
    }
    if (!el) return;
    ro = new ResizeObserver(() => renderBarcode());
    ro.observe(el);
  },
  { immediate: true }
);
</script>

<style scoped>
.bc-card {
  overflow: hidden;
}

.bc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
}

.bc-body {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 12px;
  padding: 12px;
}

.bc-left {
  min-width: 0;
}

.bc-value {
  font-weight: 500;
  letter-spacing: 0.5px;
  margin-top: 4px;
  word-break: break-all;
}

.bc-right {
  min-width: 0;
}

.bc-canvas {
  position: relative;
  width: 100%;
  min-height: 92px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  display: grid;
  place-items: center;
  overflow: hidden;
}

.bc-canvas canvas {
  width: 100%;
  height: auto;
  display: block;
}

.bc-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 12px;
  opacity: 0.65;
}

.bc-loading {
  position: absolute;
  right: 10px;
  top: 10px;
}

@media (max-width: 980px) {
  .bc-body {
    grid-template-columns: 1fr;
  }
}
</style>