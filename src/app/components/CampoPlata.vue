<!-- src/app/components/CampoPlata.vue -->
<!-- Campo de importe: muestra el monto con punto de miles y coma decimal
     (1.250.000,50) mientras se escribe, con "$" o "US$" adelante. Emite un
     número (o null si queda vacío). El punto del teclado numérico, tipeado al
     final y sin coma, se toma como coma decimal. -->
<template>
  <v-text-field
    :model-value="texto"
    :prefix="moneda === 'USD' ? 'US$' : '$'"
    :disabled="disabled"
    :error-messages="errorMessages"
    :hide-details="hideDetails"
    :placeholder="placeholder"
    :label="label || undefined"
    density="comfortable"
    variant="outlined"
    inputmode="decimal"
    autocomplete="off"
    class="campo-plata num"
    @update:model-value="alEscribir"
    @blur="enfocado = false"
    @focus="enfocado = true"
  />
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: { type: [Number, String], default: null },
  moneda: { type: String, default: "ARS" },
  decimales: { type: Number, default: 2 },
  disabled: { type: Boolean, default: false },
  errorMessages: { type: [String, Array], default: () => [] },
  hideDetails: { type: [Boolean, String], default: "auto" },
  placeholder: { type: String, default: "0" },
  label: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue"]);

const texto = ref("");
const enfocado = ref(false);

function agrupar(entero) {
  return entero.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function aTexto(v) {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: props.decimales });
}

function aNumero(t) {
  if (!t) return null;
  const n = Number(t.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function alEscribir(crudo) {
  let s = String(crudo ?? "");
  // Punto del teclado numérico al final y sin coma: es la coma decimal.
  if (s.endsWith(".") && !s.includes(",") && props.decimales > 0) s = s.slice(0, -1) + ",";
  s = s.replace(/[^\d,]/g, "");
  const i = s.indexOf(",");
  let entero = i >= 0 ? s.slice(0, i) : s;
  let dec = i >= 0 ? s.slice(i + 1).replace(/,/g, "").slice(0, props.decimales) : "";
  entero = agrupar(entero);
  const nuevo = i >= 0 && props.decimales > 0 ? `${entero || "0"},${dec}` : entero;
  texto.value = nuevo;
  emit("update:modelValue", aNumero(nuevo));
}

// Cambios de afuera (la lista calculada, al abrir un producto): se reformatea
// salvo que el número sea el mismo que ya se está escribiendo.
watch(
  () => props.modelValue,
  (v) => {
    const actual = aNumero(texto.value);
    const n = v === null || v === undefined || v === "" ? null : Number(v);
    if (enfocado.value && actual === n) return;
    texto.value = aTexto(v);
  },
  { immediate: true }
);
</script>

<style>
.campo-plata input { font-variant-numeric: tabular-nums; }
</style>
