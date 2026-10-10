<template>
  <!-- F7 con la caja cerrada: apertura (maqueta aprobada 10/10). -->
  <PosModal
    :model-value="open"
    titulo="Abrir caja"
    tecla="F7"
    icono="mdi-lock-open-variant-outline"
    :ancho="720"
    :accion="`Abrir caja con ${pesosTxt}`"
    accion-icono="mdi-lock-open-variant"
    @update:model-value="$emit('update:open', $event)"
    @abierto="enfocar"
    @accion="submit"
  >
    <div class="ac">
      <span class="pm-lab">Efectivo para empezar el turno</span>
      <label class="pm-in pm-in--monto">
        <span class="ac-signo">$</span>
        <input ref="campo" :value="localOpeningAmount" type="text" inputmode="decimal" autocomplete="off" placeholder="0" @input="onMonto" />
      </label>
      <div class="ac-chips">
        <span v-if="cashierName"><v-icon size="18">mdi-account-outline</v-icon>{{ cashierName }}</span>
        <span v-if="branchLabel"><v-icon size="18">mdi-store-outline</v-icon>{{ branchLabel }}</span>
        <span class="num"><v-icon size="18">mdi-clock-outline</v-icon>{{ currentTimeLabel }}</span>
      </div>
      <input v-model="localNote" type="text" maxlength="255" class="ac-nota" placeholder="Observación (opcional)" />
    </div>
  </PosModal>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import { nextTick } from "vue";
import PosModal from "./modales/PosModal.vue";
import { useTeclasModal } from "../composables/useTeclasModal";
import { formatearMonto, pesos } from "../utils/montoTexto";

const props = defineProps({
  open:         { type: Boolean,          default: false },
  openingAmount:{ type: [String, Number], default: "" },
  note:         { type: String,           default: "" },
  cashierName:  { type: String,           default: "" },
  branchLabel:  { type: String,           default: "" },
});

const emit = defineEmits(["update:open", "save"]);

function normalizeAmount(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(
    String(v ?? "")
      .replace(/\$/g, "")
      .replace(/\s+/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
  );
  return Number.isFinite(n) ? n : 0;
}

const localOpeningAmount = ref("");
const localNote = ref("");
const showNote = ref(false);

// Reloj en tiempo real mientras el dialog está abierto
const now = ref(new Date());
let clockTimer = null;

const currentTimeLabel = computed(() =>
  now.value.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  })
);

function syncFromProps() {
  const n = normalizeAmount(props.openingAmount);
  localOpeningAmount.value = n > 0 ? n.toLocaleString("es-AR", { maximumFractionDigits: 2 }) : "";
  localNote.value = props.note || "";
  showNote.value = !!(props.note && String(props.note).trim());
}

watch(
  () => props.open,
  (v) => {
    if (v) {
      syncFromProps();
      now.value = new Date();
    }
  },
  { immediate: true }
);

onMounted(() => {
  clockTimer = setInterval(() => {
    if (props.open) now.value = new Date();
  }, 30 * 1000);
});

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer);
});

const campo = ref(null);
const pesosTxt = computed(() => pesos(normalizeAmount(localOpeningAmount.value)));
function enfocar() { nextTick(() => { campo.value?.focus(); campo.value?.select(); }); }
function onMonto(e) {
  localOpeningAmount.value = formatearMonto(e.target.value);
  e.target.value = localOpeningAmount.value;
}
useTeclasModal(computed(() => props.open), (e) => {
  if (e.key === "Enter") { submit(); return true; }
  return false;
});

function submit() {
  const openingAmount = normalizeAmount(localOpeningAmount.value);
  const noteText = String(localNote.value || "").trim();

  // Defaults fijos para mantener compatibilidad con el backend.
  // El modo de facturación se elige por venta, no por apertura de caja.
  emit("save", {
    openingAmount,
    opening_amount: openingAmount,
    opening_cash: openingAmount,
    note: noteText,
    opening_note: noteText,
    cajaType: "GENERAL",
    caja_type: "GENERAL",
    invoiceMode: "NO_FISCAL",
    invoice_mode: "NO_FISCAL",
    invoiceType: "TICKET",
    invoice_type: "TICKET",
  });
}
</script>

<style>
.ac { display: flex; flex-direction: column; gap: 14px; padding: 22px; }
.ac-signo { font-size: 26px; font-weight: 800; color: #94a3b8; }
.ac-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.ac-chips span { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 9999px; background: #f1f5f9; font-size: 14px; font-weight: 700; color: #334155; }
.ac-nota { height: 50px; padding: 0 14px; border-radius: 12px; border: 1px solid #c9d5e1; font: 500 15px Inter, sans-serif; color: #0f172a; outline: 0; }
.ac-nota:focus { border-color: #0f6fae; box-shadow: 0 0 0 3px rgba(15, 111, 174, 0.14); }
</style>
