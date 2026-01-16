<!-- src/modules/products/components/form/BarcodePreview.vue -->
<template>
  <div class="barcode-wrap">
    <div class="text-caption text-medium-emphasis mb-1">{{ label }}</div>

    <div class="barcode-card">
      <svg ref="svgRef"></svg>

      <div class="barcode-meta">
        <div class="text-caption text-medium-emphasis">Valor</div>
        <div class="text-body-2 font-weight-medium">{{ safeValue || "—" }}</div>
      </div>
    </div>

    <div v-if="hint" class="text-caption text-medium-emphasis mt-1">
      {{ hint }}
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import JsBarcode from "jsbarcode";

const props = defineProps({
  value: { type: [String, Number], default: "" },
  label: { type: String, default: "Código de barras" },
  hint: { type: String, default: "" },
  // options simples (sin volarte la UI)
  height: { type: Number, default: 44 },
  displayValue: { type: Boolean, default: true },
});

const svgRef = ref(null);

const safeValue = computed(() => String(props.value ?? "").trim());

function render() {
  if (!svgRef.value) return;

  const v = safeValue.value;
  if (!v) {
    svgRef.value.innerHTML = "";
    return;
  }

  try {
    JsBarcode(svgRef.value, v, {
      format: "CODE128",
      height: props.height,
      displayValue: props.displayValue,
      margin: 0,
    });
  } catch {
    // si el valor es inválido, limpiamos
    svgRef.value.innerHTML = "";
  }
}

onMounted(render);
watch(() => props.value, render);
</script>

<style scoped>
.barcode-card {
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(255,255,255,0.03);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.barcode-meta {
  min-width: 180px;
  text-align: right;
}

svg {
  width: 100%;
  max-width: 560px;
  height: auto;
}
</style>
