<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/panels/ProductPricesPanel.vue -->
<template>
  <div class="pp-root">
    <div class="pp-head">
      <div>
        <div class="text-subtitle-1 font-weight-black">Precios</div>
        <div class="text-caption text-medium-emphasis">
          Usá separador de miles. Ej: <b>1.250.000</b>
        </div>
      </div>

      <v-chip size="small" variant="tonal" class="pp-chip">Preview</v-chip>
    </div>

    <v-divider class="my-3" />

    <div class="pp-grid">
      <v-text-field
        v-model="priceListText"
        label="Precio lista"
        variant="outlined"
        density="comfortable"
        class="pp-input"
        :disabled="disabled"
        inputmode="numeric"
        autocomplete="off"
        @keydown="onKeyDownNumeric"
        @blur="onBlurFix('list')"
      >
        <template #prepend-inner>
          <div class="pp-prefix">$</div>
        </template>
      </v-text-field>

      <v-text-field
        v-model="priceDiscountText"
        label="Precio descuento"
        variant="outlined"
        density="comfortable"
        class="pp-input"
        :disabled="disabled"
        inputmode="numeric"
        autocomplete="off"
        @keydown="onKeyDownNumeric"
        @blur="onBlurFix('discount')"
      >
        <template #prepend-inner>
          <div class="pp-prefix">$</div>
        </template>
      </v-text-field>

      <v-text-field
        v-model="priceResellerText"
        label="Precio revendedor"
        variant="outlined"
        density="comfortable"
        class="pp-input"
        :disabled="disabled"
        inputmode="numeric"
        autocomplete="off"
        @keydown="onKeyDownNumeric"
        @blur="onBlurFix('reseller')"
      >
        <template #prepend-inner>
          <div class="pp-prefix">$</div>
        </template>
      </v-text-field>
    </div>

    <div class="pp-foot text-caption text-medium-emphasis">
      Tip: podés pegar <b>1200000</b> y se convierte a <b>1.200.000</b>.
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);

const m = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

/* ===================== Format / Parse ===================== */
const nf0 = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function toNumberSafe(v) {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function parseMoneyInt(text) {
  const s = String(text ?? "").trim();
  if (!s) return 0;

  let cleaned = s.replace(/\$/g, "").replace(/\s/g, "");
  cleaned = cleaned.replace(/,/g, "").replace(/\./g, "");

  const n = parseInt(cleaned || "0", 10);
  return Number.isFinite(n) ? n : 0;
}

function formatMoneyInt(n) {
  const v = Math.max(0, Math.round(toNumberSafe(n)));
  return v === 0 ? "0" : nf0.format(v);
}

/* ===================== v-model TEXT ===================== */
const priceListText = computed({
  get: () => formatMoneyInt(m.value?.price_list),
  set: (txt) => {
    const n = parseMoneyInt(txt);
    m.value = { ...m.value, price_list: n };
  },
});
const priceDiscountText = computed({
  get: () => formatMoneyInt(m.value?.price_discount),
  set: (txt) => {
    const n = parseMoneyInt(txt);
    m.value = { ...m.value, price_discount: n };
  },
});
const priceResellerText = computed({
  get: () => formatMoneyInt(m.value?.price_reseller),
  set: (txt) => {
    const n = parseMoneyInt(txt);
    m.value = { ...m.value, price_reseller: n };
  },
});

/* ===================== UX ===================== */
function onBlurFix(which) {
  if (which === "list") priceListText.value = priceListText.value;
  if (which === "discount") priceDiscountText.value = priceDiscountText.value;
  if (which === "reseller") priceResellerText.value = priceResellerText.value;
}

function onKeyDownNumeric(e) {
  const k = e.key;

  if (
    k === "Backspace" ||
    k === "Delete" ||
    k === "Tab" ||
    k === "Enter" ||
    k === "Escape" ||
    k === "ArrowLeft" ||
    k === "ArrowRight" ||
    k === "Home" ||
    k === "End"
  ) return;

  if (e.ctrlKey || e.metaKey) return;

  if (!/^\d$/.test(k)) e.preventDefault();
}
</script>

<style scoped>
/* ✅ TODO AISLADO AL COMPONENTE */
.pp-root {
  padding: 14px;
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(0, 0, 0, 0.08);
}

/* dark */
:global(.v-theme--dark) .pp-root {
  border-color: rgba(255, 255, 255, 0.08);
}

.pp-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.pp-chip {
  font-weight: 900;
}

.pp-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 900px) {
  .pp-grid {
    grid-template-columns: 1fr;
  }
}

/* inputs más “limpios” en claro */
.pp-input :deep(.v-field) {
  border-radius: 14px;
}

.pp-prefix {
  font-weight: 900;
  opacity: 0.75;
  padding-right: 6px;
}

.pp-input :deep(input) {
  text-align: right;
  font-weight: 900;
  letter-spacing: 0.2px;
  font-variant-numeric: tabular-nums;
}

/* en claro, suavizamos el borde del outlined (Vuetify a veces queda muy oscuro) */
.pp-input :deep(.v-field--variant-outlined .v-field__outline) {
  opacity: 0.85;
}

/* en dark, que no se lave */
:global(.v-theme--dark) .pp-input :deep(.v-field--variant-outlined .v-field__outline) {
  opacity: 1;
}

/* tip */
.pp-foot {
  margin-top: 10px;
  opacity: 0.85;
}
</style>