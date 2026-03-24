<template>
  <v-card rounded="xl" elevation="1" class="pbc-card">
    <div class="pbc-head">
      <div class="pbc-title">Código de barras</div>

      <div class="pbc-actions">
        <v-btn
          size="small"
          variant="tonal"
          prepend-icon="mdi-refresh"
          :disabled="!barcodeValue"
          @click="renderBarcode"
        >
          Regenerar
        </v-btn>

        <v-btn
          size="small"
          variant="tonal"
          prepend-icon="mdi-content-copy"
          :disabled="!barcodeValue"
          @click="copyCode"
        >
          Copiar
        </v-btn>

        <v-btn
          size="small"
          color="primary"
          variant="flat"
          prepend-icon="mdi-printer"
          :disabled="!barcodeValue"
          @click="printBarcode"
        >
          Imprimir
        </v-btn>
      </div>
    </div>

    <div v-if="!barcodeValue" class="pbc-empty">
      No hay valor disponible para generar el código de barras.
    </div>

    <div v-else class="pbc-body">
      <div class="pbc-preview-wrap">
        <div ref="printAreaRef" class="pbc-print-area">
          <div class="pbc-barcode-box">
            <svg ref="svgRef" class="pbc-svg" />
          </div>

          <div class="pbc-meta">
            <div class="pbc-code">{{ barcodeValue }}</div>
            <div v-if="productName" class="pbc-name">{{ productName }}</div>
          </div>
        </div>
      </div>

      <div class="pbc-help">
        Formato: <strong>{{ barcodeFormatLabel }}</strong>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import JsBarcode from "jsbarcode";

const props = defineProps({
  product: {
    type: Object,
    default: () => ({}),
  },
  value: {
    type: String,
    default: "",
  },
  format: {
    type: String,
    default: "CODE128",
  },
});

const emit = defineEmits(["copied", "print"]);

const svgRef = ref(null);
const printAreaRef = ref(null);

const productName = computed(() => {
  return String(props.product?.name || "").trim();
});

const barcodeValue = computed(() => {
  const explicit = String(props.value || "").trim();
  if (explicit) return explicit;

  const candidates = [
    props.product?.barcode,
    props.product?.sku,
    props.product?.code,
    props.product?.id ? String(props.product.id) : "",
  ];

  return String(candidates.find((x) => String(x || "").trim()) || "").trim();
});

const barcodeFormatLabel = computed(() => {
  return String(props.format || "CODE128").toUpperCase();
});

function renderBarcode() {
  if (!svgRef.value || !barcodeValue.value) return;

  try {
    JsBarcode(svgRef.value, barcodeValue.value, {
      format: barcodeFormatLabel.value,
      lineColor: "#111111",
      background: "#ffffff",
      width: 2,
      height: 72,
      margin: 8,
      displayValue: false,
      fontOptions: "bold",
      valid: () => {},
    });
  } catch (err) {
    console.error("[ProductBarcodeCard] render error", err);
  }
}

async function copyCode() {
  if (!barcodeValue.value) return;

  try {
    await navigator.clipboard.writeText(barcodeValue.value);
    emit("copied", barcodeValue.value);
  } catch (err) {
    console.error("[ProductBarcodeCard] copy error", err);
  }
}

function printBarcode() {
  if (!printAreaRef.value) return;

  const content = printAreaRef.value.innerHTML;
  const w = window.open("", "_blank", "width=640,height=480");

  if (!w) return;

  w.document.write(`
    <html>
      <head>
        <title>Código de barras</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 24px;
            color: #111;
          }
          .wrap {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
          }
          .box {
            border: 1px solid #ddd;
            border-radius: 12px;
            padding: 16px;
            background: #fff;
            width: fit-content;
          }
          .code {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 0.8px;
            text-align: center;
          }
          .name {
            margin-top: 6px;
            font-size: 14px;
            text-align: center;
          }
          svg {
            display: block;
            max-width: 100%;
            height: auto;
          }
          @media print {
            body {
              margin: 0;
              padding: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="box">${content}</div>
        </div>
      </body>
    </html>
  `);

  w.document.close();
  w.focus();
  w.print();

  emit("print", barcodeValue.value);
}

watch(
  () => [barcodeValue.value, barcodeFormatLabel.value],
  async () => {
    await nextTick();
    renderBarcode();
  },
  { immediate: true }
);

onMounted(async () => {
  await nextTick();
  renderBarcode();
});
</script>

<style scoped>
.pbc-card {
  padding: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}

.pbc-head {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 12px;
}

.pbc-title {
  font-weight: 900;
  letter-spacing: 0.2px;
  font-size: 15px;
}

.pbc-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pbc-empty {
  opacity: 0.8;
  font-size: 13px;
}

.pbc-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pbc-preview-wrap {
  display: flex;
  justify-content: center;
}

.pbc-print-area {
  width: 100%;
  max-width: 460px;
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 16px;
  padding: 16px;
  background: #fff;
}

.pbc-barcode-box {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 110px;
}

.pbc-svg {
  max-width: 100%;
  height: auto;
  display: block;
}

.pbc-meta {
  margin-top: 10px;
  text-align: center;
}

.pbc-code {
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 1px;
  color: #111;
}

.pbc-name {
  margin-top: 6px;
  font-size: 13px;
  color: #333;
}

.pbc-help {
  font-size: 12px;
  opacity: 0.78;
}

@media (max-width: 720px) {
  .pbc-head {
    flex-direction: column;
    align-items: stretch;
  }

  .pbc-actions {
    justify-content: flex-start;
  }
}
</style>