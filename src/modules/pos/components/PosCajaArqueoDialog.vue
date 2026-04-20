<template>
  <v-dialog
    :model-value="open"
    max-width="600"
    scrollable
    @update:model-value="$emit('update:open', $event)"
  >
    <v-card class="arq" rounded="xl">

      <!-- Header -->
      <div class="arq__head">
        <div>
          <p class="arq__eyebrow">Cierre de caja</p>
          <h3 class="arq__title">Arqueo</h3>
          <p class="arq__head-note">
            <v-icon size="11" class="mr-1">mdi-shield-check-outline</v-icon>
            Solo incluye ventas activas. Las anuladas quedan en auditoría.
          </p>
        </div>
        <v-btn icon="mdi-close" size="small" variant="text" @click="$emit('update:open', false)" />
      </div>

      <!-- Info bar -->
      <div class="arq__infobar">
        <div class="arq__pill">
          <span class="arq__pill-label">Caja</span>
          <strong class="arq__pill-val">{{ cajaTypeLabel || "—" }}</strong>
        </div>
        <div class="arq__pill">
          <span class="arq__pill-label">Facturación</span>
          <strong class="arq__pill-val">{{ invoiceTypeLabel || "—" }}</strong>
        </div>
        <div class="arq__pill">
          <span class="arq__pill-label">Estado</span>
          <strong class="arq__pill-val" :class="isCajaOpen ? 'arq__pill-val--ok' : 'arq__pill-val--err'">
            {{ isCajaOpen ? "Abierta" : "Cerrada" }}
          </strong>
        </div>
        <!-- Ventas: total / efectivas / anuladas -->
        <div class="arq__pill arq__pill--sales-group">
          <span class="arq__pill-label">Sesión</span>
          <strong class="arq__pill-val">{{ totals.sales_total_created || totals.sales_count || 0 }}</strong>
          <span class="arq__pill-sep">·</span>
          <v-icon size="11" color="success">mdi-check-circle-outline</v-icon>
          <span class="arq__pill-val arq__pill-val--ok">{{ totals.sales_count || 0 }}</span>
          <template v-if="totals.sales_cancelled_count > 0">
            <span class="arq__pill-sep">·</span>
            <v-icon size="11" color="warning">mdi-cancel</v-icon>
            <span class="arq__pill-val arq__pill-val--warn">{{ totals.sales_cancelled_count }}</span>
          </template>
        </div>
      </div>

      <!-- Alerta anuladas -->
      <div v-if="totals.sales_cancelled_count > 0" class="arq__cancelled-alert">
        <v-icon size="14" color="warning" class="mr-1">mdi-alert</v-icon>
        <span>
          <strong>{{ totals.sales_cancelled_count }} venta{{ totals.sales_cancelled_count !== 1 ? 's' : '' }} anulada{{ totals.sales_cancelled_count !== 1 ? 's' : '' }}</strong>
          en esta sesión — excluidas de los montos.
        </span>
      </div>

      <v-divider />

      <div class="arq__body">

        <!-- ── EFECTIVO ─────────────────────────── -->
        <section class="arq__section arq__section--cash">
          <div class="arq__section-head">
            <v-icon size="15" class="mr-1">mdi-cash</v-icon>
            <span class="arq__section-title">Efectivo</span>
          </div>

          <div class="arq__cash-row">
            <div class="arq__cash-expected">
              <span class="arq__cash-label">Esperado en caja</span>
              <strong class="arq__cash-amount">{{ money(expectedCashValue) }}</strong>
            </div>

            <div class="arq__cash-input-wrap">
              <v-text-field
                v-model="declaredInputs.cash"
                label="Efectivo contado"
                variant="outlined"
                density="compact"
                hide-details
                prefix="$"
                inputmode="decimal"
                class="arq__input"
              />
              <div class="arq__diff-badge" :class="statusClass(cashDiff)">
                <span class="arq__diff-label">Diferencia</span>
                <strong class="arq__diff-val">{{ formatDiff(cashDiff) }}</strong>
              </div>
            </div>
          </div>
        </section>

        <!-- ── OTROS MEDIOS ───────────────────────── -->
        <section class="arq__section">
          <div class="arq__section-head">
            <v-icon size="15" class="mr-1">mdi-credit-card-outline</v-icon>
            <span class="arq__section-title">Otros medios</span>
          </div>

          <div class="arq__medios">
            <div class="arq__medios-header">
              <span>Medio</span>
              <span>Esperado</span>
              <span>Declarado</span>
              <span>Dif.</span>
            </div>
            <div
              v-for="row in nonCashRows"
              :key="row.key"
              class="arq__medio-row"
            >
              <span class="arq__medio-name">{{ row.label }}</span>
              <span class="arq__medio-esp">{{ money(row.expected) }}</span>
              <div class="arq__medio-input">
                <v-text-field
                  v-model="declaredInputs[row.key]"
                  variant="outlined"
                  density="compact"
                  hide-details
                  prefix="$"
                  inputmode="decimal"
                  class="arq__input arq__input--sm"
                />
              </div>
              <span class="arq__medio-diff" :class="statusTextClass(row.diff)">
                {{ formatDiff(row.diff) }}
              </span>
            </div>
          </div>
        </section>

        <!-- ── RESULTADO ──────────────────────────── -->
        <section class="arq__section">
          <div class="arq__section-head">
            <v-icon size="15" class="mr-1">mdi-check-circle-outline</v-icon>
            <span class="arq__section-title">Resultado</span>
          </div>

          <div class="arq__result-banner" :class="resultStatus.className">
            <v-icon size="16" class="mr-2">{{ resultStatus.icon }}</v-icon>
            <div>
              <strong class="arq__result-title">{{ resultStatus.title }}</strong>
              <span class="arq__result-text">{{ resultStatus.text }}</span>
            </div>
          </div>

          <div class="arq__totals">
            <div class="arq__total-row">
              <span>Ventas efectivas</span>
              <strong>{{ totals.sales_count || 0 }}</strong>
            </div>
            <div v-if="totals.sales_cancelled_count > 0" class="arq__total-row arq__total-row--warn">
              <span>Ventas anuladas (excluidas)</span>
              <strong class="c-warning">{{ totals.sales_cancelled_count }}</strong>
            </div>
            <div class="arq__total-row">
              <span>Efectivo esperado</span>
              <strong>{{ money(expectedCashValue) }}</strong>
            </div>
            <div class="arq__total-row">
              <span>Efectivo declarado</span>
              <strong :class="statusTextClass(cashDiff)">{{ money(cashDeclared) }}</strong>
            </div>
            <div class="arq__total-row">
              <span>No cash esperado</span>
              <strong>{{ money(nonCashExpectedTotal) }}</strong>
            </div>
            <div class="arq__total-row">
              <span>No cash declarado</span>
              <strong :class="statusTextClass(nonCashDiffTotal)">{{ money(nonCashDeclaredTotal) }}</strong>
            </div>
          </div>
        </section>

        <!-- ── OBSERVACION ────────────────────────── -->
        <v-textarea
          v-model="localNote"
          label="Observación (opcional)"
          variant="outlined"
          density="compact"
          rows="2"
          auto-grow
          hide-details
          class="arq__input"
        />

      </div>

      <v-divider />

      <!-- Footer -->
      <div class="arq__footer">
        <div class="arq__footer-diff">
          <span class="arq__footer-diff-label">Diferencia efectivo</span>
          <strong :class="statusTextClass(cashDiff)">{{ formatDiff(cashDiff) }}</strong>
        </div>
        <div class="arq__footer-actions">
          <v-btn variant="text" size="small" @click="$emit('update:open', false)">Cancelar</v-btn>
          <v-btn color="primary" size="small" prepend-icon="mdi-check" @click="submit">
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
  open:            { type: Boolean, default: false },
  isCajaOpen:      { type: Boolean, default: false },
  cajaTypeLabel:   { type: String,  default: "" },
  invoiceTypeLabel:{ type: String,  default: "" },
  summary:         { type: Object,  default: () => ({}) },
});

const emit = defineEmits(["update:open", "save"]);

// ── helpers ──────────────────────────────────────────────────────────────
function toNum(v, d = 0) {
  const n = Number(String(v ?? "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : d;
}
function money(val) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(Number(val || 0));
}
function round2(n) { return Number(Number(n || 0).toFixed(2)); }

// ── state ─────────────────────────────────────────────────────────────────
const localNote = ref("");
const declaredInputs = ref({
  cash: "", card: "", transfer: "", qr: "", mercadopago: "", credit_sjt: "", other: "",
});

// ── computed ──────────────────────────────────────────────────────────────
const payments = computed(() => props.summary?.payments_by_method || {});
const totals   = computed(() => props.summary?.totals || {});
const expectedCashValue = computed(() => toNum(totals.value?.expected_cash, 0));

function parseDeclared(key) { return toNum(declaredInputs.value?.[key], 0); }

const cashDeclared = computed(() => parseDeclared("cash"));
const cashDiff     = computed(() => round2(cashDeclared.value - expectedCashValue.value));

const nonCashRows = computed(() => {
  const map = [
    { key: "card",       label: "Tarjeta" },
    { key: "transfer",   label: "Transferencia" },
    { key: "qr",         label: "QR" },
    { key: "mercadopago",label: "Mercado Pago" },
    { key: "credit_sjt", label: "Crédito San Juan" },
    { key: "other",      label: "Otros" },
  ];
  return map.map((item) => {
    const expected = toNum(payments.value?.[item.key], 0);
    const declared = parseDeclared(item.key);
    return { ...item, expected, declared, diff: round2(declared - expected) };
  });
});

const nonCashExpectedTotal  = computed(() => round2(nonCashRows.value.reduce((a, r) => a + r.expected, 0)));
const nonCashDeclaredTotal  = computed(() => round2(nonCashRows.value.reduce((a, r) => a + r.declared, 0)));
const nonCashDiffTotal      = computed(() => round2(nonCashDeclaredTotal.value - nonCashExpectedTotal.value));

const resultStatus = computed(() => {
  if (cashDiff.value === 0 && nonCashDiffTotal.value === 0)
    return { title: "Arqueo correcto", text: "No se detectan diferencias.", className: "is-ok", icon: "mdi-check-circle" };
  if (cashDiff.value < 0)
    return { title: "Faltante de efectivo", text: `Faltan ${money(Math.abs(cashDiff.value))}.`, className: "is-danger", icon: "mdi-alert-circle" };
  if (cashDiff.value > 0)
    return { title: "Sobrante de efectivo", text: `Sobran ${money(cashDiff.value)}.`, className: "is-warning", icon: "mdi-alert" };
  return { title: "Diferencia en no cash", text: "El efectivo coincide, pero hay diferencias en otros medios.", className: "is-info", icon: "mdi-information" };
});

// ── formatters ────────────────────────────────────────────────────────────
function formatDiff(v) {
  const n = round2(v);
  if (n === 0) return "$ 0";
  return (n > 0 ? "+ " : "- ") + money(Math.abs(n));
}
function statusClass(v) {
  const n = round2(v);
  return n === 0 ? "is-ok" : n > 0 ? "is-warning" : "is-danger";
}
function statusTextClass(v) {
  const n = round2(v);
  return n === 0 ? "c-ok" : n > 0 ? "c-warning" : "c-danger";
}

// ── sync ──────────────────────────────────────────────────────────────────
function syncFromSummary() {
  localNote.value = "";
  const p = payments.value || {};
  declaredInputs.value = {
    cash:        String(toNum(expectedCashValue.value, 0)),
    card:        String(toNum(p.card, 0)),
    transfer:    String(toNum(p.transfer, 0)),
    qr:          String(toNum(p.qr, 0)),
    mercadopago: String(toNum(p.mercadopago, 0)),
    credit_sjt:  String(toNum(p.credit_sjt, 0)),
    other:       String(toNum(p.other, 0)),
  };
}

watch(() => props.open,    (v) => { if (v) syncFromSummary(); }, { immediate: true });
watch(() => props.summary, ()  => { if (props.open) syncFromSummary(); }, { deep: true });

// ── submit ────────────────────────────────────────────────────────────────
function submit() {
  emit("save", {
    closing_cash: cashDeclared.value,
    closing_note: String(localNote.value || "").trim(),
    declared: {
      cash:       cashDeclared.value,
      card:       parseDeclared("card"),
      transfer:   parseDeclared("transfer"),
      qr:         parseDeclared("qr"),
      mercadopago:parseDeclared("mercadopago"),
      credit_sjt: parseDeclared("credit_sjt"),
      other:      parseDeclared("other"),
    },
    difference: {
      cash:    cashDiff.value,
      non_cash:nonCashDiffTotal.value,
    },
  });
}
</script>

<style scoped>
/* ── Card ──────────────────────────────────────────────────────────────── */
.arq {
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}

/* ── Header ─────────────────────────────────────────────────────────────── */
.arq__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
}
.arq__eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .5);
}
.arq__title {
  margin: 2px 0 0;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.1;
}
.arq__head-note {
  margin: 4px 0 0;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), .45);
  display: flex;
  align-items: center;
}

/* ── Info bar ────────────────────────────────────────────────────────────── */
.arq__infobar {
  display: flex;
  gap: 8px;
  padding: 0 16px 12px;
  flex-wrap: wrap;
}
.arq__pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 20px;
  background: rgba(var(--v-theme-on-surface), .04);
  border: 1px solid rgba(var(--v-theme-on-surface), .08);
}
.arq__pill-label {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), .55);
}
.arq__pill-val {
  font-size: 12px;
  font-weight: 800;
}
.arq__pill-val--ok   { color: rgb(var(--v-theme-success)); }
.arq__pill-val--err  { color: rgb(var(--v-theme-error)); }
.arq__pill-val--warn { color: rgb(var(--v-theme-warning)); }
.arq__pill--warn {
  background: rgba(var(--v-theme-warning), .08);
  border-color: rgba(var(--v-theme-warning), .2);
}
.arq__pill--sales-group {
  gap: 5px;
}
.arq__pill-sep {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), .3);
}

/* ── Alerta anuladas ─────────────────────────────────────────── */
.arq__cancelled-alert {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: rgba(var(--v-theme-warning), .07);
  border-bottom: 1px solid rgba(var(--v-theme-warning), .15);
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), .85);
}

/* ── Body ────────────────────────────────────────────────────────────────── */
.arq__body {
  padding: 14px 16px;
  display: grid;
  gap: 16px;
}

/* ── Section ─────────────────────────────────────────────────────────────── */
.arq__section {
  display: grid;
  gap: 10px;
}
.arq__section--cash {
  background: rgba(var(--v-theme-primary), .04);
  border: 1px solid rgba(var(--v-theme-primary), .12);
  border-radius: 14px;
  padding: 12px;
}
.arq__section-head {
  display: flex;
  align-items: center;
}
.arq__section-title {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .6);
}

/* ── Cash row ────────────────────────────────────────────────────────────── */
.arq__cash-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}
.arq__cash-expected {
  min-width: 140px;
}
.arq__cash-label {
  display: block;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), .55);
  margin-bottom: 4px;
}
.arq__cash-amount {
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -.01em;
}
.arq__cash-input-wrap {
  flex: 1;
  min-width: 200px;
  display: grid;
  gap: 8px;
}

/* ── Diff badge ──────────────────────────────────────────────────────────── */
.arq__diff-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid transparent;
}
.arq__diff-label { font-size: 12px; font-weight: 600; }
.arq__diff-val   { font-size: 14px; font-weight: 900; }

/* ── Medios table ────────────────────────────────────────────────────────── */
.arq__medios {
  border: 1px solid rgba(var(--v-theme-on-surface), .07);
  border-radius: 12px;
  overflow: hidden;
}
.arq__medios-header {
  display: grid;
  grid-template-columns: 1fr 90px 130px 70px;
  gap: 8px;
  padding: 7px 12px;
  background: rgba(var(--v-theme-on-surface), .04);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .5);
}
.arq__medio-row {
  display: grid;
  grid-template-columns: 1fr 90px 130px 70px;
  gap: 8px;
  align-items: center;
  padding: 6px 12px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), .05);
  font-size: 12px;
}
.arq__medio-name  { font-weight: 600; }
.arq__medio-esp   { color: rgba(var(--v-theme-on-surface), .65); font-size: 12px; }
.arq__medio-diff  { font-size: 12px; font-weight: 700; text-align: right; }

/* ── Result banner ───────────────────────────────────────────────────────── */
.arq__result-banner {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid transparent;
}
.arq__result-title {
  display: block;
  font-size: 13px;
  font-weight: 800;
}
.arq__result-text {
  display: block;
  font-size: 12px;
  margin-top: 1px;
  opacity: .85;
}

/* ── Totals ──────────────────────────────────────────────────────────────── */
.arq__totals { display: grid; gap: 4px; }
.arq__total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), .025);
  font-size: 12px;
}
.arq__total-row strong { font-size: 13px; }
.arq__total-row--warn {
  background: rgba(var(--v-theme-warning), .06);
  border: 1px solid rgba(var(--v-theme-warning), .15);
}

/* ── Footer ──────────────────────────────────────────────────────────────── */
.arq__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 14px;
  gap: 12px;
}
.arq__footer-diff {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.arq__footer-diff-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .5);
}
.arq__footer-diff strong { font-size: 16px; font-weight: 900; }
.arq__footer-actions { display: flex; gap: 8px; }

/* ── Status colors ───────────────────────────────────────────────────────── */
.is-ok      { background: rgba(var(--v-theme-success),.08); border-color: rgba(var(--v-theme-success),.2);  color: rgb(var(--v-theme-success)); }
.is-warning { background: rgba(var(--v-theme-warning),.1);  border-color: rgba(var(--v-theme-warning),.22); color: rgb(var(--v-theme-warning)); }
.is-danger  { background: rgba(var(--v-theme-error),  .08); border-color: rgba(var(--v-theme-error),  .2);  color: rgb(var(--v-theme-error)); }
.is-info    { background: rgba(var(--v-theme-info),   .08); border-color: rgba(var(--v-theme-info),   .2);  color: rgb(var(--v-theme-info)); }
.c-ok       { color: rgb(var(--v-theme-success)); }
.c-warning  { color: rgb(var(--v-theme-warning)); }
.c-danger   { color: rgb(var(--v-theme-error)); }

/* ── Input ───────────────────────────────────────────────────────────────── */
.arq :deep(.v-field) { border-radius: 10px; }
.arq__input--sm :deep(.v-field__input) { font-size: 12px; min-height: 36px; padding: 4px 8px; }
.arq__input--sm :deep(.v-field__prefix) { font-size: 12px; padding-left: 8px; }

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .arq__medios-header,
  .arq__medio-row {
    grid-template-columns: 1fr 80px 110px 60px;
  }
  .arq__cash-row { flex-direction: column; }
  .arq__footer { flex-direction: column; align-items: stretch; }
  .arq__footer-actions { justify-content: flex-end; }
}
</style>
