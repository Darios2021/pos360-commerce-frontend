<template>
  <v-dialog
    :model-value="open"
    max-width="920"
    scrollable
    @update:model-value="$emit('update:open', $event)"
  >
    <v-card class="arqueo-dialog" rounded="xl">
      <div class="arqueo-dialog__head">
        <div class="arqueo-dialog__head-main">
          <div class="arqueo-dialog__eyebrow">Cierre de caja</div>
          <h3 class="arqueo-dialog__title">Arqueo</h3>
          <div class="arqueo-dialog__subtitle">
            Verificá efectivo y conciliá medios de cobro.
          </div>
        </div>

        <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          @click="$emit('update:open', false)"
        />
      </div>

      <v-divider />

      <div class="arqueo-dialog__body">
        <div class="arqueo-topbar">
          <div class="top-pill">
            <span class="top-pill__label">Caja</span>
            <strong class="top-pill__value">{{ cajaTypeLabel || "—" }}</strong>
          </div>

          <div class="top-pill">
            <span class="top-pill__label">Facturación</span>
            <strong class="top-pill__value">{{ invoiceTypeLabel || "—" }}</strong>
          </div>

          <div class="top-pill">
            <span class="top-pill__label">Estado</span>
            <strong
              class="top-pill__value"
              :class="isCajaOpen ? 'text-ok' : 'text-danger'"
            >
              {{ isCajaOpen ? "Abierta" : "Cerrada" }}
            </strong>
          </div>

          <div class="top-pill">
            <span class="top-pill__label">Ventas</span>
            <strong class="top-pill__value">{{ totals.sales_count || 0 }}</strong>
          </div>
        </div>

        <div class="arqueo-grid">
          <!-- IZQ -->
          <div class="arqueo-col arqueo-col--left">
            <v-card class="arqueo-card" elevation="0">
              <div class="arqueo-card__head">
                <div class="arqueo-card__title">Resumen del sistema</div>
              </div>

              <div class="stats-grid">
                <div class="stat-box">
                  <span class="stat-box__label">Apertura</span>
                  <strong class="stat-box__value">{{ money(totals.opening_cash) }}</strong>
                </div>

                <div class="stat-box">
                  <span class="stat-box__label">Ingresos</span>
                  <strong class="stat-box__value">{{ money(totals.manual_in) }}</strong>
                </div>

                <div class="stat-box">
                  <span class="stat-box__label">Egresos</span>
                  <strong class="stat-box__value">{{ money(totals.manual_out) }}</strong>
                </div>

                <div class="stat-box stat-box--primary">
                  <span class="stat-box__label">Efectivo esperado</span>
                  <strong class="stat-box__value">{{ money(expectedCashValue) }}</strong>
                </div>
              </div>
            </v-card>

            <v-card class="arqueo-card" elevation="0">
              <div class="arqueo-card__head">
                <div class="arqueo-card__title">Otros medios</div>
              </div>

              <div class="medio-grid">
                <div
                  v-for="row in nonCashRows"
                  :key="row.key"
                  class="medio-card"
                >
                  <div class="medio-card__head">
                    <strong class="medio-card__name">{{ row.label }}</strong>
                    <span
                      class="medio-card__diff"
                      :class="statusTextClassByDiff(row.diff)"
                    >
                      {{ formatDiff(row.diff) }}
                    </span>
                  </div>

                  <div class="medio-card__meta">
                    <span>Esp: {{ money(row.expected) }}</span>
                    <span>Dec: {{ money(row.declared) }}</span>
                  </div>

                  <v-text-field
                    v-model="declaredInputs[row.key]"
                    :label="`Declarado ${row.label}`"
                    variant="outlined"
                    density="compact"
                    hide-details
                    prefix="$"
                    inputmode="decimal"
                  />
                </div>
              </div>
            </v-card>
          </div>

          <!-- DER -->
          <div class="arqueo-col arqueo-col--right">
            <v-card class="arqueo-card arqueo-card--cash" elevation="0">
              <div class="arqueo-card__head">
                <div class="arqueo-card__title">Conteo de efectivo</div>
              </div>

              <div class="cash-box">
                <div class="cash-box__expected">
                  <span class="cash-box__label">Esperado</span>
                  <strong class="cash-box__amount">
                    {{ money(expectedCashValue) }}
                  </strong>
                </div>

                <v-text-field
                  v-model="declaredInputs.cash"
                  label="Efectivo contado"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  prefix="$"
                  inputmode="decimal"
                />

                <div class="cash-box__result" :class="statusClassByDiff(cashDiff)">
                  <span class="cash-box__result-label">Diferencia</span>
                  <strong class="cash-box__result-value">
                    {{ formatDiff(cashDiff) }}
                  </strong>
                </div>
              </div>
            </v-card>

            <v-card class="arqueo-card" elevation="0">
              <div class="arqueo-card__head">
                <div class="arqueo-card__title">Resultado</div>
              </div>

              <div class="result-banner" :class="resultStatus.className">
                <div class="result-banner__title">{{ resultStatus.title }}</div>
                <div class="result-banner__text">{{ resultStatus.text }}</div>
              </div>

              <div class="result-grid">
                <div class="result-row">
                  <span>Efectivo esperado</span>
                  <strong>{{ money(expectedCashValue) }}</strong>
                </div>

                <div class="result-row">
                  <span>Efectivo declarado</span>
                  <strong>{{ money(cashDeclared) }}</strong>
                </div>

                <div class="result-row">
                  <span>No cash esperado</span>
                  <strong>{{ money(nonCashExpectedTotal) }}</strong>
                </div>

                <div class="result-row">
                  <span>No cash declarado</span>
                  <strong>{{ money(nonCashDeclaredTotal) }}</strong>
                </div>

                <div class="result-row">
                  <span>Diferencia no cash</span>
                  <strong :class="statusTextClassByDiff(nonCashDiffTotal)">
                    {{ formatDiff(nonCashDiffTotal) }}
                  </strong>
                </div>
              </div>
            </v-card>

            <v-card class="arqueo-card" elevation="0">
              <div class="arqueo-card__head">
                <div class="arqueo-card__title">Observación</div>
              </div>

              <v-textarea
                v-model="localNote"
                label="Observación"
                variant="outlined"
                density="compact"
                rows="3"
                auto-grow
                hide-details
              />
            </v-card>
          </div>
        </div>
      </div>

      <v-divider />

      <div class="arqueo-dialog__actions">
        <div class="arqueo-dialog__summary">
          <span class="arqueo-dialog__summary-label">Diferencia efectivo</span>
          <strong :class="statusTextClassByDiff(cashDiff)">
            {{ formatDiff(cashDiff) }}
          </strong>
        </div>

        <div class="arqueo-dialog__actions-right">
          <v-btn variant="text" @click="$emit('update:open', false)">
            Cancelar
          </v-btn>

          <v-btn color="primary" prepend-icon="mdi-check" @click="submit">
            Registrar cierre
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  isCajaOpen: { type: Boolean, default: false },
  cajaTypeLabel: { type: String, default: "" },
  invoiceTypeLabel: { type: String, default: "" },
  summary: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["update:open", "save"]);

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

const localNote = ref("");

const declaredInputs = ref({
  cash: "",
  card: "",
  transfer: "",
  qr: "",
  mercadopago: "",
  credit_sjt: "",
  other: "",
});

const payments = computed(() => props.summary?.payments_by_method || {});
const totals = computed(() => props.summary?.totals || {});

const expectedCashValue = computed(() => toNum(totals.value?.expected_cash, 0));

function parseDeclared(key) {
  return toNum(declaredInputs.value?.[key], 0);
}

const cashDeclared = computed(() => parseDeclared("cash"));
const cashDiff = computed(() =>
  round2(cashDeclared.value - expectedCashValue.value)
);

const nonCashRows = computed(() => {
  const map = [
    { key: "card", label: "Tarjeta" },
    { key: "transfer", label: "Transferencia" },
    { key: "qr", label: "QR" },
    { key: "mercadopago", label: "Mercado Pago" },
    { key: "credit_sjt", label: "Crédito San Juan" },
    { key: "other", label: "Otros" },
  ];

  return map.map((item) => {
    const expected = toNum(payments.value?.[item.key], 0);
    const declared = parseDeclared(item.key);
    const diff = round2(declared - expected);

    return {
      ...item,
      expected,
      declared,
      diff,
    };
  });
});

const nonCashExpectedTotal = computed(() =>
  round2(nonCashRows.value.reduce((acc, row) => acc + row.expected, 0))
);

const nonCashDeclaredTotal = computed(() =>
  round2(nonCashRows.value.reduce((acc, row) => acc + row.declared, 0))
);

const nonCashDiffTotal = computed(() =>
  round2(nonCashDeclaredTotal.value - nonCashExpectedTotal.value)
);

const resultStatus = computed(() => {
  if (cashDiff.value === 0 && nonCashDiffTotal.value === 0) {
    return {
      title: "Arqueo correcto",
      text: "No se detectan diferencias.",
      className: "is-ok",
    };
  }

  if (cashDiff.value < 0) {
    return {
      title: "Faltante de efectivo",
      text: `Faltan ${money(Math.abs(cashDiff.value))}.`,
      className: "is-danger",
    };
  }

  if (cashDiff.value > 0) {
    return {
      title: "Sobrante de efectivo",
      text: `Sobran ${money(cashDiff.value)}.`,
      className: "is-warning",
    };
  }

  return {
    title: "Diferencia en otros medios",
    text: "El efectivo coincide, pero hay diferencias en no cash.",
    className: "is-info",
  };
});

function formatDiff(v) {
  const n = round2(v);
  if (n === 0) return money(0);
  if (n > 0) return `+ ${money(n)}`;
  return `- ${money(Math.abs(n))}`;
}

function statusClassByDiff(v) {
  const n = round2(v);
  if (n === 0) return "is-ok";
  if (n > 0) return "is-warning";
  return "is-danger";
}

function statusTextClassByDiff(v) {
  const n = round2(v);
  if (n === 0) return "text-ok";
  if (n > 0) return "text-warning";
  return "text-danger";
}

function syncFromSummary() {
  localNote.value = "";

  declaredInputs.value = {
    cash: String(expectedCashValue.value || ""),
    card: String(toNum(payments.value?.card, 0) || ""),
    transfer: String(toNum(payments.value?.transfer, 0) || ""),
    qr: String(toNum(payments.value?.qr, 0) || ""),
    mercadopago: String(toNum(payments.value?.mercadopago, 0) || ""),
    credit_sjt: String(toNum(payments.value?.credit_sjt, 0) || ""),
    other: String(toNum(payments.value?.other, 0) || ""),
  };
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

function submit() {
  emit("save", {
    closing_cash: cashDeclared.value,
    closing_note: String(localNote.value || "").trim(),
    declared: {
      cash: cashDeclared.value,
      card: parseDeclared("card"),
      transfer: parseDeclared("transfer"),
      qr: parseDeclared("qr"),
      mercadopago: parseDeclared("mercadopago"),
      credit_sjt: parseDeclared("credit_sjt"),
      other: parseDeclared("other"),
    },
    difference: {
      cash: cashDiff.value,
      non_cash: nonCashDiffTotal.value,
    },
  });
}
</script>

<style scoped>
.arqueo-dialog {
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}

.arqueo-dialog__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 12px;
}

.arqueo-dialog__head-main {
  min-width: 0;
}

.arqueo-dialog__eyebrow {
  font-size: 11px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.56);
}

.arqueo-dialog__title {
  margin: 2px 0 0;
  font-size: 24px;
  line-height: 1.05;
  font-weight: 800;
}

.arqueo-dialog__subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.66);
}

.arqueo-dialog__body {
  padding: 14px 16px;
  display: grid;
  gap: 14px;
}

.arqueo-topbar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.top-pill {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(var(--v-theme-on-surface), 0.035);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.top-pill__label {
  font-size: 10px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.58);
}

.top-pill__value {
  font-size: 14px;
  line-height: 1.2;
  font-weight: 800;
  word-break: break-word;
}

.arqueo-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.9fr);
  gap: 12px;
  align-items: start;
}

.arqueo-col {
  min-width: 0;
  display: grid;
  gap: 12px;
}

.arqueo-card {
  padding: 12px;
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.arqueo-card--cash {
  background: rgba(var(--v-theme-primary), 0.035);
  border-color: rgba(var(--v-theme-primary), 0.14);
}

.arqueo-card__head {
  margin-bottom: 10px;
}

.arqueo-card__title {
  font-size: 14px;
  line-height: 1.1;
  font-weight: 800;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stat-box {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.stat-box--primary {
  background: rgba(var(--v-theme-primary), 0.08);
  border-color: rgba(var(--v-theme-primary), 0.14);
}

.stat-box__label {
  font-size: 11px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.stat-box__value {
  font-size: 16px;
  line-height: 1.15;
  font-weight: 800;
}

.medio-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.medio-card {
  display: grid;
  gap: 8px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.025);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.medio-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.medio-card__name {
  font-size: 12px;
  font-weight: 800;
  line-height: 1.1;
}

.medio-card__diff {
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.medio-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), 0.68);
}

.cash-box {
  display: grid;
  gap: 12px;
}

.cash-box__expected {
  display: grid;
  gap: 4px;
}

.cash-box__label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.58);
}

.cash-box__amount {
  font-size: 30px;
  line-height: 1;
  font-weight: 900;
}

.cash-box__result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid transparent;
}

.cash-box__result-label {
  font-size: 12px;
  font-weight: 700;
}

.cash-box__result-value {
  font-size: 15px;
  font-weight: 900;
}

.result-banner {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  margin-bottom: 10px;
}

.result-banner__title {
  font-size: 13px;
  font-weight: 800;
  line-height: 1.1;
}

.result-banner__text {
  font-size: 12px;
  line-height: 1.3;
}

.result-grid {
  display: grid;
  gap: 8px;
}

.result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.025);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  font-size: 12px;
}

.arqueo-dialog__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px 16px;
}

.arqueo-dialog__summary {
  display: grid;
  gap: 2px;
}

.arqueo-dialog__summary-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.58);
}

.arqueo-dialog__actions-right {
  display: flex;
  gap: 8px;
}

.is-ok {
  background: rgba(var(--v-theme-success), 0.08);
  border-color: rgba(var(--v-theme-success), 0.2);
  color: rgb(var(--v-theme-success));
}

.is-warning {
  background: rgba(var(--v-theme-warning), 0.1);
  border-color: rgba(var(--v-theme-warning), 0.22);
  color: rgb(var(--v-theme-warning));
}

.is-danger {
  background: rgba(var(--v-theme-error), 0.08);
  border-color: rgba(var(--v-theme-error), 0.2);
  color: rgb(var(--v-theme-error));
}

.is-info {
  background: rgba(var(--v-theme-info), 0.08);
  border-color: rgba(var(--v-theme-info), 0.2);
  color: rgb(var(--v-theme-info));
}

.text-ok {
  color: rgb(var(--v-theme-success));
}

.text-warning {
  color: rgb(var(--v-theme-warning));
}

.text-danger {
  color: rgb(var(--v-theme-error));
}

@media (max-width: 960px) {
  .arqueo-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .arqueo-topbar,
  .stats-grid,
  .medio-grid {
    grid-template-columns: 1fr;
  }

  .arqueo-dialog__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .arqueo-dialog__actions-right {
    justify-content: flex-end;
  }
}
</style>