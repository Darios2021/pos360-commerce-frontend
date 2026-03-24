<template>
  <v-dialog
    :model-value="open"
    max-width="620"
    @update:model-value="$emit('update:open', $event)"
  >
    <v-card class="caja-dialog" rounded="xl">
      <div class="caja-dialog__head">
        <div class="caja-dialog__title-wrap">
          <div class="caja-dialog__eyebrow">Caja</div>
          <h3 class="caja-dialog__title">Abrir caja</h3>
        </div>

        <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          @click="$emit('update:open', false)"
        />
      </div>

      <v-divider />

      <div class="caja-dialog__body">
        <div class="caja-dialog__topbar">
          <div class="caja-chip-info">
            <v-icon size="16">mdi-cash-register</v-icon>
            <span>Solo efectivo físico para vuelto</span>
          </div>

          <div class="caja-chip-value">
            <span>Apertura</span>
            <strong>{{ openingAmountPreview }}</strong>
          </div>
        </div>

        <div class="caja-grid">
          <div class="caja-section caja-section--main">
            <div class="caja-section__head">
              <div class="caja-section__title">Monto inicial</div>
              <div class="caja-section__hint">Fondo disponible en caja</div>
            </div>

            <v-text-field
              v-model="localOpeningAmount"
              label="Efectivo inicial"
              prefix="$"
              variant="outlined"
              density="compact"
              hide-details
              inputmode="decimal"
            />

            <v-text-field
              v-model="localNote"
              label="Observación"
              variant="outlined"
              density="compact"
              hide-details
              class="mt-3"
            />
          </div>

          <div class="caja-section">
            <div class="caja-section__head">
              <div class="caja-section__title">Configuración</div>
              <div class="caja-section__hint">Operación de caja</div>
            </div>

            <div class="caja-field">
              <label class="caja-label">Tipo</label>
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

            <div class="caja-field">
              <label class="caja-label">Facturación</label>
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

            <div class="caja-field">
              <label class="caja-label">Comprobante</label>
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
          </div>
        </div>

        <div class="caja-resumen-inline">
          <div class="caja-resumen-inline__item">
            <span class="caja-resumen-inline__label">Caja</span>
            <strong class="caja-resumen-inline__value">{{ selectedCajaTypeTitle }}</strong>
          </div>

          <div class="caja-resumen-inline__item">
            <span class="caja-resumen-inline__label">Modo</span>
            <strong class="caja-resumen-inline__value">{{ selectedInvoiceModeTitle }}</strong>
          </div>

          <div class="caja-resumen-inline__item">
            <span class="caja-resumen-inline__label">Comp.</span>
            <strong class="caja-resumen-inline__value">{{ selectedInvoiceTypeTitle }}</strong>
          </div>
        </div>
      </div>

      <v-divider />

      <div class="caja-dialog__actions">
        <v-btn
          variant="text"
          size="small"
          @click="$emit('update:open', false)"
        >
          Cancelar
        </v-btn>

        <v-btn
          color="primary"
          prepend-icon="mdi-check-circle-outline"
          size="small"
          type="button"
          @click="submit"
        >
          Abrir caja
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  cajaType: { type: String, default: "" },
  invoiceMode: { type: String, default: "" },
  invoiceType: { type: String, default: "" },
  openingAmount: { type: [String, Number], default: "" },
  note: { type: String, default: "" },
  cajaTypeOptions: { type: Array, default: () => [] },
  invoiceModeOptions: { type: Array, default: () => [] },
  invoiceTypeOptions: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:open", "save"]);

function upper(v) {
  return String(v || "").trim().toUpperCase();
}

function normalizeCajaType(v) {
  const x = upper(v);
  return ["GENERAL", "SHIFT", "BRANCH", "MOBILE"].includes(x) ? x : "GENERAL";
}

function normalizeInvoiceMode(v) {
  const x = upper(v);
  return ["NO_FISCAL", "FISCAL", "MIXED", "TICKET_ONLY"].includes(x)
    ? x
    : "NO_FISCAL";
}

function normalizeInvoiceType(v) {
  const x = upper(v);
  return ["TICKET", "A", "B", "C"].includes(x) ? x : "TICKET";
}

function normalizeAmount(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  const cleaned = raw
    .replace(/\$/g, "")
    .replace(/\s+/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

const safeCajaTypeOptions = computed(() => {
  return (props.cajaTypeOptions?.length
    ? props.cajaTypeOptions
    : [
        { title: "General", value: "GENERAL" },
        { title: "Turno", value: "SHIFT" },
        { title: "Sucursal", value: "BRANCH" },
        { title: "Móvil", value: "MOBILE" },
      ]
  ).filter(Boolean);
});

const safeInvoiceModeOptions = computed(() => {
  return (props.invoiceModeOptions?.length
    ? props.invoiceModeOptions
    : [
        { title: "Sin facturación", value: "NO_FISCAL" },
        { title: "Fiscal", value: "FISCAL" },
        { title: "Mixta", value: "MIXED" },
        { title: "Solo ticket", value: "TICKET_ONLY" },
      ]
  ).filter(Boolean);
});

const safeInvoiceTypeOptions = computed(() => {
  return (props.invoiceTypeOptions?.length
    ? props.invoiceTypeOptions
    : [
        { title: "Ticket", value: "TICKET" },
        { title: "Factura A", value: "A" },
        { title: "Factura B", value: "B" },
        { title: "Factura C", value: "C" },
      ]
  )
    .filter(Boolean)
    .filter((item) => ["TICKET", "A", "B", "C"].includes(upper(item?.value)));
});

const localCajaType = ref("GENERAL");
const localInvoiceMode = ref("NO_FISCAL");
const localInvoiceType = ref("TICKET");
const localOpeningAmount = ref("");
const localNote = ref("");

const filteredInvoiceTypeOptions = computed(() => {
  if (localInvoiceMode.value === "NO_FISCAL") {
    return safeInvoiceTypeOptions.value.filter((item) => upper(item.value) === "TICKET");
  }
  return safeInvoiceTypeOptions.value;
});

const selectedCajaTypeTitle = computed(() => {
  return (
    safeCajaTypeOptions.value.find((x) => upper(x.value) === localCajaType.value)?.title ||
    "General"
  );
});

const selectedInvoiceModeTitle = computed(() => {
  return (
    safeInvoiceModeOptions.value.find((x) => upper(x.value) === localInvoiceMode.value)?.title ||
    "Sin facturación"
  );
});

const selectedInvoiceTypeTitle = computed(() => {
  return (
    safeInvoiceTypeOptions.value.find((x) => upper(x.value) === localInvoiceType.value)?.title ||
    "Ticket"
  );
});

const openingAmountPreview = computed(() => {
  return formatMoney(normalizeAmount(localOpeningAmount.value));
});

function ensureInvoiceTypeAllowed() {
  const allowed = filteredInvoiceTypeOptions.value.map((x) => upper(x.value));
  if (!allowed.includes(localInvoiceType.value)) {
    localInvoiceType.value = allowed[0] || "TICKET";
  }
}

function syncFromProps() {
  localCajaType.value = normalizeCajaType(props.cajaType);
  localInvoiceMode.value = normalizeInvoiceMode(props.invoiceMode);
  localInvoiceType.value = normalizeInvoiceType(props.invoiceType);
  localOpeningAmount.value = String(props.openingAmount ?? "");
  localNote.value = props.note || "";

  if (localInvoiceMode.value === "NO_FISCAL") {
    localInvoiceType.value = "TICKET";
  }

  ensureInvoiceTypeAllowed();
}

watch(
  () => props.open,
  (open) => {
    if (open) syncFromProps();
  },
  { immediate: true }
);

function onCajaTypeChange(value) {
  localCajaType.value = normalizeCajaType(value);
}

function onInvoiceModeChange(value) {
  localInvoiceMode.value = normalizeInvoiceMode(value);

  if (localInvoiceMode.value === "NO_FISCAL") {
    localInvoiceType.value = "TICKET";
    return;
  }

  ensureInvoiceTypeAllowed();
}

function onInvoiceTypeChange(value) {
  const next = normalizeInvoiceType(value);

  if (localInvoiceMode.value === "NO_FISCAL") {
    localInvoiceType.value = "TICKET";
    return;
  }

  const allowed = filteredInvoiceTypeOptions.value.map((x) => upper(x.value));
  localInvoiceType.value = allowed.includes(next) ? next : (allowed[0] || "TICKET");
}

function submit() {
  const cajaType = normalizeCajaType(localCajaType.value);
  const invoiceMode = normalizeInvoiceMode(localInvoiceMode.value);
  let invoiceType = normalizeInvoiceType(localInvoiceType.value);
  const openingAmount = normalizeAmount(localOpeningAmount.value);
  const note = String(localNote.value || "").trim();

  if (invoiceMode === "NO_FISCAL") {
    invoiceType = "TICKET";
  }

  emit("save", {
    cajaType,
    invoiceMode,
    invoiceType,
    openingAmount,
    note,
    caja_type: cajaType,
    invoice_mode: invoiceMode,
    invoice_type: invoiceType,
    opening_amount: openingAmount,
  });
}
</script>

<style scoped>
.caja-dialog {
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
}

.caja-dialog__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
}

.caja-dialog__title-wrap {
  min-width: 0;
}

.caja-dialog__eyebrow {
  font-size: 10px;
  line-height: 1;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgb(var(--v-theme-primary));
  margin-bottom: 4px;
}

.caja-dialog__title {
  margin: 0;
  font-size: 18px;
  line-height: 1.1;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
}

.caja-dialog__body {
  padding: 14px;
  display: grid;
  gap: 12px;
}

.caja-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 14px 14px;
}

.caja-dialog__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.caja-chip-info,
.caja-chip-value {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 8px 10px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1.2;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.caja-chip-info {
  color: rgba(var(--v-theme-on-surface), 0.78);
}

.caja-chip-value {
  background: rgba(var(--v-theme-primary), 0.08);
  border-color: rgba(var(--v-theme-primary), 0.16);
  color: rgb(var(--v-theme-primary));
}

.caja-chip-value strong {
  font-size: 13px;
  font-weight: 800;
}

.caja-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 12px;
  align-items: start;
}

.caja-section {
  min-width: 0;
  border-radius: 16px;
  padding: 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.caja-section--main {
  background: rgba(var(--v-theme-primary), 0.04);
  border-color: rgba(var(--v-theme-primary), 0.14);
}

.caja-section__head {
  margin-bottom: 10px;
}

.caja-section__title {
  font-size: 14px;
  font-weight: 800;
  line-height: 1.1;
  color: rgb(var(--v-theme-on-surface));
}

.caja-section__hint {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.3;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.caja-field + .caja-field {
  margin-top: 10px;
}

.caja-label {
  display: inline-block;
  margin-bottom: 5px;
  font-size: 11px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.78);
}

.caja-resumen-inline {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.caja-resumen-inline__item {
  min-width: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.caja-resumen-inline__label {
  display: block;
  margin-bottom: 3px;
  font-size: 10px;
  line-height: 1;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(var(--v-theme-on-surface), 0.54);
}

.caja-resumen-inline__value {
  display: block;
  font-size: 13px;
  line-height: 1.2;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
}

/* VUETIFY */
.caja-dialog :deep(.v-field) {
  border-radius: 12px;
}

.caja-dialog :deep(.v-field__input),
.caja-dialog :deep(.v-select__selection-text),
.caja-dialog :deep(input),
.caja-dialog :deep(textarea) {
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
}

.caja-dialog :deep(.v-label) {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.68);
}

.caja-dialog :deep(.v-field--variant-outlined .v-field__outline__start),
.caja-dialog :deep(.v-field--variant-outlined .v-field__outline__notch),
.caja-dialog :deep(.v-field--variant-outlined .v-field__outline__end) {
  border-color: rgba(var(--v-theme-on-surface), 0.16);
}

.caja-dialog :deep(.v-field--focused .v-field__outline__start),
.caja-dialog :deep(.v-field--focused .v-field__outline__notch),
.caja-dialog :deep(.v-field--focused .v-field__outline__end) {
  border-color: rgba(var(--v-theme-primary), 0.88);
}

/* LIGHT */
:global(.v-theme--light) .caja-dialog {
  background: #ffffff;
}

:global(.v-theme--light) .caja-section,
:global(.v-theme--light) .caja-resumen-inline__item,
:global(.v-theme--light) .caja-chip-info {
  background: #f8fafc;
  border-color: rgba(15, 23, 42, 0.08);
}

:global(.v-theme--light) .caja-section--main,
:global(.v-theme--light) .caja-chip-value {
  background: rgba(37, 99, 235, 0.06);
  border-color: rgba(37, 99, 235, 0.15);
}

:global(.v-theme--light) .caja-dialog :deep(.v-field) {
  background: #ffffff;
}

/* DARK */
:global(.v-theme--dark) .caja-dialog {
  background: #0f172a !important;
}

:global(.v-theme--dark) .caja-section,
:global(.v-theme--dark) .caja-resumen-inline__item,
:global(.v-theme--dark) .caja-chip-info {
  background: rgba(255, 255, 255, 0.04) !important;
  border-color: rgba(255, 255, 255, 0.10) !important;
}

:global(.v-theme--dark) .caja-section--main,
:global(.v-theme--dark) .caja-chip-value {
  background: rgba(59, 130, 246, 0.14) !important;
  border-color: rgba(96, 165, 250, 0.22) !important;
}

:global(.v-theme--dark) .caja-dialog__title,
:global(.v-theme--dark) .caja-section__title,
:global(.v-theme--dark) .caja-resumen-inline__value {
  color: #ffffff !important;
}

:global(.v-theme--dark) .caja-section__hint,
:global(.v-theme--dark) .caja-label,
:global(.v-theme--dark) .caja-chip-info,
:global(.v-theme--dark) .caja-resumen-inline__label {
  color: rgba(255, 255, 255, 0.72) !important;
}

:global(.v-theme--dark) .caja-dialog :deep(.v-field) {
  background: rgba(15, 23, 42, 0.82) !important;
}

:global(.v-theme--dark) .caja-dialog :deep(.v-label),
:global(.v-theme--dark) .caja-dialog :deep(.v-icon),
:global(.v-theme--dark) .caja-dialog :deep(.v-select__menu-icon) {
  color: rgba(255, 255, 255, 0.82) !important;
}

:global(.v-theme--dark) .caja-dialog :deep(.v-field__input),
:global(.v-theme--dark) .caja-dialog :deep(.v-select__selection-text),
:global(.v-theme--dark) .caja-dialog :deep(input),
:global(.v-theme--dark) .caja-dialog :deep(textarea) {
  color: #ffffff !important;
}

:global(.v-theme--dark) .caja-dialog :deep(.v-field--variant-outlined .v-field__outline__start),
:global(.v-theme--dark) .caja-dialog :deep(.v-field--variant-outlined .v-field__outline__notch),
:global(.v-theme--dark) .caja-dialog :deep(.v-field--variant-outlined .v-field__outline__end) {
  border-color: rgba(255, 255, 255, 0.16) !important;
}

:global(.v-theme--dark) .caja-dialog :deep(.v-field--focused .v-field__outline__start),
:global(.v-theme--dark) .caja-dialog :deep(.v-field--focused .v-field__outline__notch),
:global(.v-theme--dark) .caja-dialog :deep(.v-field--focused .v-field__outline__end) {
  border-color: #93c5fd !important;
}

/* RESPONSIVE */
@media (max-width: 760px) {
  .caja-grid,
  .caja-resumen-inline {
    grid-template-columns: 1fr;
  }

  .caja-dialog {
    border-radius: 18px !important;
  }

  .caja-dialog__body {
    padding: 12px;
  }

  .caja-dialog__actions {
    padding: 10px 12px 12px;
  }
}
</style>