<template>
  <v-dialog
    :model-value="open"
    max-width="460"
    @update:model-value="$emit('update:open', $event)"
  >
    <v-card class="ccd" rounded="xl">

      <!-- Header -->
      <div class="ccd__head">
        <div>
          <p class="ccd__eyebrow">Caja</p>
          <h3 class="ccd__title">Abrir caja</h3>
        </div>
        <v-btn icon="mdi-close" size="small" variant="text" @click="$emit('update:open', false)" />
      </div>

      <v-divider />

      <div class="ccd__body">

        <!-- Monto inicial (protagonista) -->
        <div class="ccd__amount-section">
          <div class="ccd__amount-label">
            <v-icon size="16" class="mr-1">mdi-cash</v-icon>
            Fondo inicial de caja
          </div>
          <v-text-field
            v-model="localOpeningAmount"
            variant="outlined"
            density="comfortable"
            hide-details
            prefix="$"
            inputmode="decimal"
            placeholder="0"
            class="ccd__amount-input"
          />
          <p class="ccd__amount-hint">Solo efectivo físico disponible para vuelto</p>
        </div>

        <!-- Configuración -->
        <div class="ccd__config">
          <div class="ccd__config-row">
            <label class="ccd__label">Tipo de caja</label>
            <v-select
              :model-value="localCajaType"
              :items="safeCajaTypeOptions"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="onCajaTypeChange"
            />
          </div>

          <div class="ccd__config-row">
            <label class="ccd__label">Modo de facturación</label>
            <v-select
              :model-value="localInvoiceMode"
              :items="safeInvoiceModeOptions"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="onInvoiceModeChange"
            />
          </div>

          <div class="ccd__config-row">
            <label class="ccd__label">Comprobante</label>
            <v-select
              :model-value="localInvoiceType"
              :items="filteredInvoiceTypeOptions"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="localInvoiceMode === 'NO_FISCAL'"
              @update:model-value="onInvoiceTypeChange"
            />
          </div>

          <div class="ccd__config-row">
            <label class="ccd__label">Observación</label>
            <v-text-field
              v-model="localNote"
              variant="outlined"
              density="compact"
              hide-details
              placeholder="Opcional"
            />
          </div>
        </div>

        <!-- Resumen rápido -->
        <div class="ccd__summary">
          <div class="ccd__summary-item ccd__summary-item--highlight">
            <span class="ccd__summary-label">Apertura</span>
            <strong class="ccd__summary-val">{{ openingAmountPreview }}</strong>
          </div>
          <div class="ccd__summary-item">
            <span class="ccd__summary-label">{{ selectedCajaTypeTitle }}</span>
            <span class="ccd__summary-dot">·</span>
            <span class="ccd__summary-label">{{ selectedInvoiceModeTitle }}</span>
            <span class="ccd__summary-dot">·</span>
            <span class="ccd__summary-label">{{ selectedInvoiceTypeTitle }}</span>
          </div>
        </div>

      </div>

      <v-divider />

      <!-- Actions -->
      <div class="ccd__actions">
        <v-btn variant="text" size="small" @click="$emit('update:open', false)">Cancelar</v-btn>
        <v-btn color="primary" size="small" prepend-icon="mdi-cash-register" @click="submit">
          Abrir caja
        </v-btn>
      </div>

    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  open:               { type: Boolean,           default: false },
  cajaType:           { type: String,            default: "" },
  invoiceMode:        { type: String,            default: "" },
  invoiceType:        { type: String,            default: "" },
  openingAmount:      { type: [String, Number],  default: "" },
  note:               { type: String,            default: "" },
  cajaTypeOptions:    { type: Array,             default: () => [] },
  invoiceModeOptions: { type: Array,             default: () => [] },
  invoiceTypeOptions: { type: Array,             default: () => [] },
});

const emit = defineEmits(["update:open", "save"]);

// ── normalizers ───────────────────────────────────────────────────────────
function upper(v) { return String(v || "").trim().toUpperCase(); }
function normalizeCajaType(v)    { const x = upper(v); return ["GENERAL","SHIFT","BRANCH","MOBILE"].includes(x) ? x : "GENERAL"; }
function normalizeInvoiceMode(v) { const x = upper(v); return ["NO_FISCAL","FISCAL","MIXED","TICKET_ONLY"].includes(x) ? x : "NO_FISCAL"; }
function normalizeInvoiceType(v) { const x = upper(v); return ["TICKET","A","B","C"].includes(x) ? x : "TICKET"; }
function normalizeAmount(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(String(v ?? "").replace(/\$/g,"").replace(/\s+/g,"").replace(/\./g,"").replace(",","."));
  return Number.isFinite(n) ? n : 0;
}
function formatMoney(v) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", minimumFractionDigits: 0,
  }).format(Number(v || 0));
}

// ── options ───────────────────────────────────────────────────────────────
const safeCajaTypeOptions = computed(() =>
  (props.cajaTypeOptions?.length ? props.cajaTypeOptions : [
    { title: "General", value: "GENERAL" },
    { title: "Turno",   value: "SHIFT" },
    { title: "Sucursal",value: "BRANCH" },
    { title: "Móvil",   value: "MOBILE" },
  ]).filter(Boolean)
);
const safeInvoiceModeOptions = computed(() =>
  (props.invoiceModeOptions?.length ? props.invoiceModeOptions : [
    { title: "Sin facturación", value: "NO_FISCAL" },
    { title: "Fiscal",          value: "FISCAL" },
    { title: "Mixta",           value: "MIXED" },
    { title: "Solo ticket",     value: "TICKET_ONLY" },
  ]).filter(Boolean)
);
const safeInvoiceTypeOptions = computed(() =>
  (props.invoiceTypeOptions?.length ? props.invoiceTypeOptions : [
    { title: "Ticket",    value: "TICKET" },
    { title: "Factura A", value: "A" },
    { title: "Factura B", value: "B" },
    { title: "Factura C", value: "C" },
  ]).filter(Boolean).filter((i) => ["TICKET","A","B","C"].includes(upper(i?.value)))
);

// ── local state ───────────────────────────────────────────────────────────
const localCajaType      = ref("GENERAL");
const localInvoiceMode   = ref("NO_FISCAL");
const localInvoiceType   = ref("TICKET");
const localOpeningAmount = ref("");
const localNote          = ref("");

const filteredInvoiceTypeOptions = computed(() =>
  localInvoiceMode.value === "NO_FISCAL"
    ? safeInvoiceTypeOptions.value.filter((i) => upper(i.value) === "TICKET")
    : safeInvoiceTypeOptions.value
);

// ── labels ────────────────────────────────────────────────────────────────
const selectedCajaTypeTitle    = computed(() => safeCajaTypeOptions.value.find((x) => upper(x.value) === localCajaType.value)?.title    || "General");
const selectedInvoiceModeTitle = computed(() => safeInvoiceModeOptions.value.find((x) => upper(x.value) === localInvoiceMode.value)?.title || "Sin facturación");
const selectedInvoiceTypeTitle = computed(() => safeInvoiceTypeOptions.value.find((x) => upper(x.value) === localInvoiceType.value)?.title || "Ticket");
const openingAmountPreview     = computed(() => formatMoney(normalizeAmount(localOpeningAmount.value)));

// ── sync ──────────────────────────────────────────────────────────────────
function ensureInvoiceTypeAllowed() {
  const allowed = filteredInvoiceTypeOptions.value.map((x) => upper(x.value));
  if (!allowed.includes(localInvoiceType.value)) localInvoiceType.value = allowed[0] || "TICKET";
}
function syncFromProps() {
  localCajaType.value      = normalizeCajaType(props.cajaType);
  localInvoiceMode.value   = normalizeInvoiceMode(props.invoiceMode);
  localInvoiceType.value   = normalizeInvoiceType(props.invoiceType);
  localOpeningAmount.value = String(props.openingAmount ?? "");
  localNote.value          = props.note || "";
  if (localInvoiceMode.value === "NO_FISCAL") localInvoiceType.value = "TICKET";
  ensureInvoiceTypeAllowed();
}

watch(() => props.open, (v) => { if (v) syncFromProps(); }, { immediate: true });

// ── handlers ──────────────────────────────────────────────────────────────
function onCajaTypeChange(v)    { localCajaType.value = normalizeCajaType(v); }
function onInvoiceModeChange(v) {
  localInvoiceMode.value = normalizeInvoiceMode(v);
  if (localInvoiceMode.value === "NO_FISCAL") { localInvoiceType.value = "TICKET"; return; }
  ensureInvoiceTypeAllowed();
}
function onInvoiceTypeChange(v) {
  if (localInvoiceMode.value === "NO_FISCAL") { localInvoiceType.value = "TICKET"; return; }
  const next = normalizeInvoiceType(v);
  const allowed = filteredInvoiceTypeOptions.value.map((x) => upper(x.value));
  localInvoiceType.value = allowed.includes(next) ? next : (allowed[0] || "TICKET");
}

// ── submit ────────────────────────────────────────────────────────────────
function submit() {
  const cajaType     = normalizeCajaType(localCajaType.value);
  const invoiceMode  = normalizeInvoiceMode(localInvoiceMode.value);
  const invoiceType  = invoiceMode === "NO_FISCAL" ? "TICKET" : normalizeInvoiceType(localInvoiceType.value);
  const openingAmount = normalizeAmount(localOpeningAmount.value);
  const note         = String(localNote.value || "").trim();

  emit("save", {
    cajaType, invoiceMode, invoiceType, openingAmount, note,
    caja_type: cajaType, invoice_mode: invoiceMode,
    invoice_type: invoiceType, opening_amount: openingAmount,
  });
}
</script>

<style scoped>
/* ── Card ──────────────────────────────────────────────────────────────── */
.ccd {
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}

/* ── Header ─────────────────────────────────────────────────────────────── */
.ccd__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 12px;
}
.ccd__eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-primary));
}
.ccd__title {
  margin: 2px 0 0;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.1;
}

/* ── Body ────────────────────────────────────────────────────────────────── */
.ccd__body {
  padding: 16px;
  display: grid;
  gap: 16px;
}

/* ── Amount section ──────────────────────────────────────────────────────── */
.ccd__amount-section {
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 14px;
  background: rgba(var(--v-theme-primary), .05);
  border: 1px solid rgba(var(--v-theme-primary), .14);
}
.ccd__amount-label {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), .7);
}
.ccd__amount-input :deep(.v-field__input) {
  font-size: 22px;
  font-weight: 800;
  padding-top: 8px;
  padding-bottom: 8px;
}
.ccd__amount-input :deep(.v-field__prefix) {
  font-size: 18px;
  font-weight: 700;
  padding-top: 10px;
}
.ccd__amount-hint {
  margin: 0;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), .5);
}

/* ── Config ──────────────────────────────────────────────────────────────── */
.ccd__config {
  display: grid;
  gap: 10px;
}
.ccd__config-row {
  display: grid;
  gap: 4px;
}
.ccd__label {
  font-size: 11px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), .7);
}
.ccd :deep(.v-field) { border-radius: 10px; }

/* ── Summary strip ───────────────────────────────────────────────────────── */
.ccd__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), .03);
  border: 1px solid rgba(var(--v-theme-on-surface), .07);
  flex-wrap: wrap;
}
.ccd__summary-item {
  display: flex;
  align-items: center;
  gap: 5px;
}
.ccd__summary-item--highlight .ccd__summary-val {
  font-size: 15px;
  font-weight: 900;
  color: rgb(var(--v-theme-primary));
}
.ccd__summary-label {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), .65);
}
.ccd__summary-dot {
  color: rgba(var(--v-theme-on-surface), .3);
  font-size: 12px;
}

/* ── Actions ─────────────────────────────────────────────────────────────── */
.ccd__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 16px 14px;
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 460px) {
  .ccd__body { padding: 12px; }
  .ccd__summary { flex-direction: column; align-items: flex-start; }
}
</style>
