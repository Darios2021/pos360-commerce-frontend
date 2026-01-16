<template>
  <v-card class="bc-card" rounded="lg" variant="tonal">
    <div class="bc-head">
      <div class="d-flex align-center ga-2">
        <v-icon size="18">mdi-barcode</v-icon>
        <div class="text-subtitle-2 font-weight-semibold">Código de barras</div>
      </div>

      <div class="d-flex align-center ga-2">
        <v-chip size="x-small" label variant="flat">{{ mode }}</v-chip>

        <v-btn
          v-if="mode === 'PREVIEW'"
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
        <div class="bc-value">{{ safeValue || "—" }}</div>
        <div class="text-caption text-medium-emphasis mt-2">
          Tip: imprimí etiqueta y pegala en góndola/caja.
        </div>
      </div>

      <div class="bc-right">
        <div class="bc-canvas">
          <canvas ref="canvasEl"></canvas>
          <div v-if="!safeValue" class="bc-empty">Sin código</div>
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
  value: { type: String, default: "" },   // ✅ debe venir model.code (P000000192)
  mode: { type: String, default: "REAL" }, // REAL | PREVIEW
  loading: { type: Boolean, default: false },
});

defineEmits(["recalc"]);

const canvasEl = ref(null);

const safeValue = computed(() => String(props.value || "").trim());

async function renderBarcode() {
  await nextTick();
  const el = canvasEl.value;
  if (!el) return;

  // limpiar
  const ctx = el.getContext("2d");
  ctx && ctx.clearRect(0, 0, el.width, el.height);

  if (!safeValue.value) return;

  // formato compacto y prolijo
  try {
    JsBarcode(el, safeValue.value, {
      format: "CODE128",
      displayValue: true,
      margin: 8,
      height: 54,
      fontSize: 14,
      textMargin: 6,
    });
  } catch {
    // si falla por caracteres raros, no romper UI
  }
}

watch(
  () => safeValue.value,
  () => renderBarcode(),
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
  font-weight: 800;
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
  max-width: 100%;
  height: auto;
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
