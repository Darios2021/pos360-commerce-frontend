<template>
  <v-dialog
    :model-value="open"
    max-width="520"
    @update:model-value="$emit('update:open', $event)"
  >
    <v-card class="arq" rounded="xl">
      <PosDialogHeader
        eyebrow="Cierre de caja"
        title="Arqueo"
        :subtitle="subtitle"
        @close="$emit('update:open', false)"
      />

      <!-- Alerta de ventas anuladas (solo si hay) -->
      <div v-if="cancelledCount > 0" class="arq__cancelled-alert">
        <v-icon size="13" color="warning">mdi-alert</v-icon>
        <span>
          <strong>{{ cancelledCount }}</strong>
          {{ cancelledCount === 1 ? "venta anulada excluida" : "ventas anuladas excluidas" }}
          del arqueo.
        </span>
      </div>

      <!-- Alerta de summary vacío — ayuda a detectar desfasaje entre venta y caja -->
      <div v-if="summaryEmpty" class="arq__empty-alert">
        <v-icon size="14" color="warning">mdi-alert-circle-outline</v-icon>
        <div class="arq__empty-alert-text">
          <strong>No se encontraron movimientos en esta caja.</strong>
          <span>
            Si hiciste ventas, puede haber un desfasaje de sucursal o la caja
            estaba recién abierta. Recargá el resumen y probá de nuevo.
          </span>
        </div>
        <v-btn
          variant="tonal"
          color="warning"
          size="x-small"
          prepend-icon="mdi-refresh"
          @click="$emit('reload')"
        >
          Recargar
        </v-btn>
      </div>

      <v-divider />

      <div class="arq__body">
        <!-- Hero: efectivo -->
        <section class="arq__cash">
          <div class="arq__section-title">
            <v-icon size="14">mdi-cash</v-icon>
            Efectivo en caja
          </div>

          <div class="arq__expected">
            <span class="arq__expected-label">Esperado</span>
            <strong class="arq__expected-amount">{{ money(expectedCashValue) }}</strong>
          </div>

          <v-text-field
            v-model="cashInput"
            label="Efectivo contado físicamente"
            variant="outlined"
            density="comfortable"
            hide-details
            prefix="$"
            inputmode="decimal"
            class="arq__cash-input"
            @keyup.enter="submit"
          />

          <div class="arq__diff" :class="diffClass">
            <v-icon size="15" class="arq__diff-icon">{{ diffIcon }}</v-icon>
            <div class="arq__diff-text">
              <strong>{{ diffTitle }}</strong>
              <span>{{ diffDetail }}</span>
            </div>
            <strong class="arq__diff-amount">{{ formatDiff(cashDiff) }}</strong>
          </div>
        </section>

        <!-- Resumen del turno (solo lectura, del sistema) -->
        <section v-if="hasTurnInfo" class="arq__summary">
          <div class="arq__section-title">
            <v-icon size="14">mdi-receipt-text-outline</v-icon>
            Resumen del turno
          </div>

          <div class="arq__metrics">
            <div class="arq__metric">
              <span class="arq__metric-label">Ventas</span>
              <strong class="arq__metric-val">{{ salesCount }}</strong>
            </div>
            <div class="arq__metric">
              <span class="arq__metric-label">Facturado</span>
              <strong class="arq__metric-val">{{ money(salesTotal) }}</strong>
            </div>
            <div class="arq__metric">
              <span class="arq__metric-label">Fondo inicial</span>
              <strong class="arq__metric-val">{{ money(openingCash) }}</strong>
            </div>
          </div>

          <div v-if="paymentRows.length" class="arq__methods">
            <span class="arq__methods-title">
              Cobrado en el turno por medio de pago
            </span>
            <div class="arq__methods-list">
              <span
                v-for="row in paymentRows"
                :key="row.key"
                class="arq-method-chip"
                :class="{ 'arq-method-chip--cash': row.key === 'cash' }"
              >
                <v-icon size="13">{{ row.icon }}</v-icon>
                <span class="arq-method-chip__name">{{ row.label }}</span>
                <strong>{{ money(row.expected) }}</strong>
                <span v-if="row.count" class="arq-method-chip__count">
                  {{ row.count }} {{ row.count === 1 ? "venta" : "ventas" }}
                </span>
              </span>
            </div>
          </div>
        </section>

        <!-- Observación -->
        <v-text-field
          v-model="localNote"
          label="Observación (opcional)"
          variant="outlined"
          density="comfortable"
          hide-details
          prepend-inner-icon="mdi-note-text-outline"
          class="arq__note"
        />
      </div>

      <v-divider />

      <div class="arq__footer">
        <v-btn variant="text" size="small" @click="$emit('update:open', false)">
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          size="small"
          prepend-icon="mdi-check"
          @click="submit"
        >
          Registrar cierre
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import PosDialogHeader from "./shared/PosDialogHeader.vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  isCajaOpen: { type: Boolean, default: false },
  cajaTypeLabel: { type: String, default: "" },
  invoiceTypeLabel: { type: String, default: "" },
  summary: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["update:open", "save", "reload"]);

// ─── Helpers ───────────────────────────────────────────────────────────
function toNum(v, d = 0) {
  const n = Number(String(v ?? "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : d;
}

function money(val) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(val || 0));
}

function round2(n) {
  return Number(Number(n || 0).toFixed(2));
}

// ─── State ──────────────────────────────────────────────────────────────
const cashInput = ref("");
const localNote = ref("");

// ─── Computed ───────────────────────────────────────────────────────────
const totals = computed(() => props.summary?.totals || {});
const payments = computed(() => props.summary?.payments_by_method || {});

const expectedCashValue = computed(() => toNum(totals.value?.expected_cash, 0));
const openingCash = computed(() => toNum(totals.value?.opening_cash, 0));
const salesTotal = computed(() =>
  toNum(
    totals.value?.sales_total ??
      totals.value?.sales_total_created ??
      totals.value?.total_sales,
    0
  )
);
const salesCount = computed(() => toNum(totals.value?.sales_count, 0));
const cancelledCount = computed(() =>
  toNum(totals.value?.sales_cancelled_count, 0)
);

const hasTurnInfo = computed(
  () => salesCount.value > 0 || salesTotal.value > 0 || openingCash.value > 0
);

// Summary vacío: la caja está abierta pero no hay ningún dato numérico
// (ni fondo inicial, ni ventas, ni expected_cash). Ayuda a detectar casos
// donde la venta no quedó asociada a esta caja (desfasaje de branch_id).
const summaryEmpty = computed(() => {
  if (!props.isCajaOpen) return false;
  const s = props.summary;
  if (!s) return true;
  return (
    salesCount.value === 0 &&
    salesTotal.value === 0 &&
    openingCash.value === 0 &&
    expectedCashValue.value === 0
  );
});

const cashDeclared = computed(() => toNum(cashInput.value, 0));
const cashDiff = computed(() =>
  round2(cashDeclared.value - expectedCashValue.value)
);

const diffClass = computed(() => {
  const n = cashDiff.value;
  if (n === 0) return "is-ok";
  return n > 0 ? "is-warning" : "is-danger";
});

const diffIcon = computed(() => {
  const n = cashDiff.value;
  if (n === 0) return "mdi-check-circle";
  return n > 0 ? "mdi-arrow-up-circle" : "mdi-arrow-down-circle";
});

const diffTitle = computed(() => {
  const n = cashDiff.value;
  if (n === 0) return "Arqueo correcto";
  return n > 0 ? "Sobrante" : "Faltante";
});

const diffDetail = computed(() => {
  const n = cashDiff.value;
  if (n === 0) return "El efectivo contado coincide con lo esperado.";
  if (n > 0) return `Hay ${money(Math.abs(n))} de más en caja.`;
  return `Faltan ${money(Math.abs(n))} de efectivo.`;
});

function formatDiff(v) {
  const n = round2(v);
  if (n === 0) return "$ 0";
  return (n > 0 ? "+ " : "- ") + money(Math.abs(n));
}

const subtitle = computed(() => {
  const parts = [];
  if (salesCount.value > 0) {
    parts.push(
      `${salesCount.value} ${salesCount.value === 1 ? "venta" : "ventas"}`
    );
  }
  if (salesTotal.value > 0) {
    parts.push(`facturado ${money(salesTotal.value)}`);
  }
  if (!parts.length) return "Contá el efectivo físico y registrá el cierre.";
  return parts.join(" · ");
});

// Efectivo cobrado en el turno = efectivo esperado - fondo inicial.
// Si el backend ya expone `payments_by_method.cash`, lo usamos; si no, lo derivamos.
const cashSales = computed(() => {
  const direct = toNum(payments.value?.cash, NaN);
  if (Number.isFinite(direct)) return Math.max(0, direct);
  return Math.max(0, expectedCashValue.value - openingCash.value);
});

const paymentCounts = computed(
  () => props.summary?.payments_count_by_method || {}
);

const paymentRows = computed(() => {
  const p = payments.value || {};
  const c = paymentCounts.value || {};
  const rows = [
    { key: "cash", label: "Efectivo", icon: "mdi-cash", expected: cashSales.value },
    { key: "card", label: "Tarjeta", icon: "mdi-credit-card-outline", expected: toNum(p.card, 0) },
    { key: "transfer", label: "Transferencia", icon: "mdi-bank-transfer", expected: toNum(p.transfer, 0) },
    { key: "mercadopago", label: "Mercado Pago", icon: "mdi-cellphone", expected: toNum(p.mercadopago, 0) },
    { key: "credit_sjt", label: "Créd. SJT", icon: "mdi-account-credit-card-outline", expected: toNum(p.credit_sjt, 0) },
    { key: "other", label: "Otros", icon: "mdi-dots-horizontal-circle-outline", expected: toNum(p.other, 0) },
  ];
  return rows
    .map((r) => ({ ...r, count: toNum(c[r.key], 0) }))
    .filter((r) => r.expected > 0);
});

// ─── Sync ──────────────────────────────────────────────────────────────
function syncFromSummary() {
  // Pre-rellenamos con lo esperado para que el cajero solo confirme / corrija.
  cashInput.value = String(expectedCashValue.value || 0);
  localNote.value = "";
}

watch(
  () => props.open,
  (v) => {
    if (v) syncFromSummary();
  },
  { immediate: true }
);

watch(
  () => props.summary,
  () => {
    if (props.open) syncFromSummary();
  },
  { deep: true }
);

// ─── Submit ────────────────────────────────────────────────────────────
function submit() {
  emit("save", {
    closing_cash: cashDeclared.value,
    closing_note: String(localNote.value || "").trim(),
    // Compatibilidad: también emitimos el diff y el declared.cash por si
    // algún consumer lo usa. Backend solo usa closing_cash + closing_note.
    declared: { cash: cashDeclared.value },
    difference: { cash: cashDiff.value },
  });
}
</script>

<style scoped>
.arq {
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}

.arq__cancelled-alert {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: rgba(var(--v-theme-warning), 0.08);
  border-bottom: 1px solid rgba(var(--v-theme-warning), 0.18);
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.82);
}

.arq__empty-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(var(--v-theme-warning), 0.1);
  border-bottom: 1px solid rgba(var(--v-theme-warning), 0.22);
}

.arq__empty-alert-text {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.arq__empty-alert-text strong {
  font-weight: 800;
  color: rgb(var(--v-theme-warning));
}

.arq__empty-alert-text span {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  line-height: 1.35;
}

.arq__body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.arq__section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
  margin-bottom: 8px;
}

/* ─── Hero: efectivo ─────────────────────────────────────────────── */
.arq__cash {
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(
    180deg,
    rgba(var(--v-theme-primary), 0.05) 0%,
    rgba(var(--v-theme-primary), 0.02) 100%
  );
  border: 1px solid rgba(var(--v-theme-primary), 0.16);
}

.arq__expected {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  margin-bottom: 10px;
}

.arq__expected-label {
  font-size: 11.5px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.65);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.arq__expected-amount {
  font-size: 18px;
  font-weight: 900;
  letter-spacing: -0.01em;
}

.arq__cash-input :deep(.v-field) {
  border-radius: 10px;
  background: rgb(var(--v-theme-surface));
}

.arq__cash-input :deep(.v-field__input) {
  font-size: 20px;
  font-weight: 800;
  padding-top: 6px;
  padding-bottom: 6px;
}

.arq__cash-input :deep(.v-field__prefix) {
  font-size: 16px;
  font-weight: 700;
  opacity: 0.6;
  padding-top: 10px;
}

.arq__diff {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid transparent;
}

.arq__diff.is-ok {
  background: rgba(var(--v-theme-success), 0.08);
  border-color: rgba(var(--v-theme-success), 0.24);
  color: rgb(var(--v-theme-success));
}

.arq__diff.is-warning {
  background: rgba(var(--v-theme-warning), 0.1);
  border-color: rgba(var(--v-theme-warning), 0.28);
  color: rgb(var(--v-theme-warning));
}

.arq__diff.is-danger {
  background: rgba(var(--v-theme-error), 0.08);
  border-color: rgba(var(--v-theme-error), 0.24);
  color: rgb(var(--v-theme-error));
}

.arq__diff-icon {
  flex-shrink: 0;
}

.arq__diff-text {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.arq__diff-text strong {
  font-size: 12.5px;
  font-weight: 800;
  line-height: 1.1;
}

.arq__diff-text span {
  font-size: 10.5px;
  opacity: 0.88;
  line-height: 1.2;
}

.arq__diff-amount {
  font-size: 14px;
  font-weight: 900;
  letter-spacing: -0.01em;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ─── Resumen del turno ────────────────────────────────────────────── */
.arq__summary {
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}

.arq__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding-bottom: 10px;
}

.arq__metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 9px;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.arq__metric-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.56);
}

.arq__metric-val {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.arq__methods {
  border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.1);
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.arq__methods-title {
  font-size: 10.5px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.55);
  letter-spacing: 0.02em;
}

.arq__methods-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.arq-method-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 7px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  font-size: 11.5px;
  line-height: 1.3;
}

.arq-method-chip :deep(.v-icon) {
  opacity: 0.7;
}

.arq-method-chip__name {
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.75);
}

.arq-method-chip strong {
  font-weight: 800;
  letter-spacing: -0.01em;
}

.arq-method-chip__count {
  font-size: 10px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.5);
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  line-height: 1.3;
}

/* Efectivo con acento verde para distinguirlo de los otros medios */
.arq-method-chip--cash {
  background: rgba(var(--v-theme-success), 0.08);
  border-color: rgba(var(--v-theme-success), 0.28);
}

.arq-method-chip--cash :deep(.v-icon) {
  color: rgb(var(--v-theme-success));
  opacity: 0.9;
}

.arq-method-chip--cash strong {
  color: rgb(var(--v-theme-success));
}

/* ─── Nota ─────────────────────────────────────────────────────────── */
.arq__note :deep(.v-field) {
  border-radius: 10px;
}

/* ─── Footer ────────────────────────────────────────────────────────── */
.arq__footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 12px 18px 16px;
}

/* ─── Responsive ────────────────────────────────────────────────────── */
@media (max-width: 520px) {
  .arq__body {
    padding: 14px;
    gap: 12px;
  }
  .arq__metrics {
    grid-template-columns: 1fr 1fr;
  }
  .arq__expected-amount {
    font-size: 16px;
  }
  .arq__cash-input :deep(.v-field__input) {
    font-size: 18px;
  }
}
</style>
