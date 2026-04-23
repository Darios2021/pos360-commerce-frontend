<template>
  <v-dialog
    :model-value="open"
    max-width="680"
    @update:model-value="$emit('update:open', $event)"
  >
    <v-card class="arq" rounded="xl">

      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <PosDialogHeader
        eyebrow="Cierre de caja"
        title="Arqueo"
        @close="$emit('update:open', false)"
      >
        <template #chips>
          <span class="arq__pill">
            <span class="arq__pill-label">{{ cajaTypeLabel || "General" }}</span>
          </span>
          <span class="arq__pill">
            <span class="arq__pill-label">{{ invoiceTypeLabel || "Ticket" }}</span>
          </span>
          <span class="arq__pill" :class="isCajaOpen ? 'arq__pill--ok' : 'arq__pill--err'">
            <span class="arq__pill-label">{{ isCajaOpen ? "Abierta" : "Cerrada" }}</span>
          </span>
          <!-- sesión -->
          <span class="arq__pill arq__pill--session">
            <v-icon size="10">mdi-receipt-text-outline</v-icon>
            <span>{{ totals.sales_total_created || totals.sales_count || 0 }}</span>
            <span class="arq__pill-sep">·</span>
            <v-icon size="10" color="success">mdi-check-circle-outline</v-icon>
            <span class="c-ok">{{ totals.sales_count || 0 }}</span>
            <template v-if="totals.sales_cancelled_count > 0">
              <span class="arq__pill-sep">·</span>
              <v-icon size="10" color="warning">mdi-cancel</v-icon>
              <span class="c-warning">{{ totals.sales_cancelled_count }}</span>
            </template>
          </span>
        </template>
      </PosDialogHeader>

      <!-- alerta anuladas (compacta, solo si hay) -->
      <div v-if="totals.sales_cancelled_count > 0" class="arq__cancelled-alert">
        <v-icon size="13" color="warning">mdi-alert</v-icon>
        <span><strong>{{ totals.sales_cancelled_count }} venta{{ totals.sales_cancelled_count !== 1 ? 's' : '' }} anulada{{ totals.sales_cancelled_count !== 1 ? 's' : '' }}</strong> excluida{{ totals.sales_cancelled_count !== 1 ? 's' : '' }} del arqueo.</span>
      </div>

      <v-divider />

      <!-- ── Body: 2 columnas ────────────────────────────────────────────── -->
      <div class="arq__body">

        <!-- COL IZQUIERDA — efectivo -->
        <div class="arq__col-cash">
          <div class="arq__col-label">
            <v-icon size="13" class="mr-1">mdi-cash</v-icon>Efectivo
          </div>

          <div class="arq__cash-expected-block">
            <span class="arq__cash-sublabel">Esperado en caja</span>
            <strong class="arq__cash-amount">{{ money(expectedCashValue) }}</strong>
          </div>

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

        <!-- COL DERECHA — otros medios -->
        <div class="arq__col-medios">
          <div class="arq__col-label">
            <v-icon size="13" class="mr-1">mdi-credit-card-outline</v-icon>Otros medios
          </div>

          <div class="arq__medios">
            <div class="arq__medios-header">
              <span></span>
              <span>Esp.</span>
              <span>Decl.</span>
              <span>Dif.</span>
            </div>
            <div
              v-for="row in nonCashRows"
              :key="row.key"
              class="arq__medio-row"
            >
              <span class="arq__medio-name">{{ row.label }}</span>
              <span class="arq__medio-esp">{{ moneyShort(row.expected) }}</span>
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
              <span class="arq__medio-diff" :class="statusTextClass(row.diff)">{{ formatDiff(row.diff) }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ── Resultado + nota ───────────────────────────────────────────── -->
      <div class="arq__bottom">
        <div class="arq__result-banner" :class="resultStatus.className">
          <v-icon size="15" class="mr-2">{{ resultStatus.icon }}</v-icon>
          <div>
            <strong class="arq__result-title">{{ resultStatus.title }}</strong>
            <span class="arq__result-text">{{ resultStatus.text }}</span>
          </div>
        </div>

        <v-text-field
          v-model="localNote"
          label="Observación (opcional)"
          variant="outlined"
          density="compact"
          hide-details
          class="arq__input arq__note"
        />
      </div>

      <v-divider />

      <!-- ── Footer ─────────────────────────────────────────────────────── -->
      <div class="arq__footer">
        <div class="arq__footer-diff">
          <span class="arq__footer-diff-label">Dif. efectivo</span>
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
import PosDialogHeader from "./shared/PosDialogHeader.vue";

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
// versión compacta para la tabla (sin "$ " prefix, solo número)
function moneyShort(val) {
  const n = Number(val || 0);
  if (n === 0) return "$ 0";
  if (Math.abs(n) >= 1000) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency", currency: "ARS",
      minimumFractionDigits: 0, maximumFractionDigits: 0,
      notation: "compact",
    }).format(n);
  }
  return money(n);
}
function round2(n) { return Number(Number(n || 0).toFixed(2)); }

// ── state ─────────────────────────────────────────────────────────────────
const localNote = ref("");
const declaredInputs = ref({
  cash: "", card: "", transfer: "", mercadopago: "", credit_sjt: "", other: "",
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
    { key: "mercadopago",label: "Mercado Pago" },
    { key: "credit_sjt", label: "Créd. SJT" },
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
    return { title: "Arqueo correcto", text: "Sin diferencias.", className: "is-ok", icon: "mdi-check-circle" };
  if (cashDiff.value < 0)
    return { title: "Faltante de efectivo", text: `Faltan ${money(Math.abs(cashDiff.value))}.`, className: "is-danger", icon: "mdi-alert-circle" };
  if (cashDiff.value > 0)
    return { title: "Sobrante de efectivo", text: `Sobran ${money(cashDiff.value)}.`, className: "is-warning", icon: "mdi-alert" };
  return { title: "Diferencia en no cash", text: "El efectivo coincide, diferencias en otros medios.", className: "is-info", icon: "mdi-information" };
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

/* ── Pills inline (usados en slot #chips del PosDialogHeader) ─────────── */
.arq__pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  background: rgba(var(--v-theme-on-surface), .05);
  border: 1px solid rgba(var(--v-theme-on-surface), .1);
  color: rgba(var(--v-theme-on-surface), .7);
}
.arq__pill--ok  { background: rgba(var(--v-theme-success),.1); border-color: rgba(var(--v-theme-success),.25); color: rgb(var(--v-theme-success)); }
.arq__pill--err { background: rgba(var(--v-theme-error),.1);   border-color: rgba(var(--v-theme-error),.25);   color: rgb(var(--v-theme-error)); }
.arq__pill--session { gap: 3px; }
.arq__pill-sep { opacity: .4; }
.arq__pill-label { font-size: 10px; font-weight: 700; }

/* ── Alerta anuladas ─────────────────────────────────────────────────── */
.arq__cancelled-alert {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  background: rgba(var(--v-theme-warning), .07);
  border-bottom: 1px solid rgba(var(--v-theme-warning), .15);
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), .8);
}

/* ── Body: 2 columnas ────────────────────────────────────────────────── */
.arq__body {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 0;
}

/* col label compartido */
.arq__col-label {
  display: flex;
  align-items: center;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .5);
  margin-bottom: 8px;
}

/* ── Columna EFECTIVO ────────────────────────────────────────────────── */
.arq__col-cash {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 12px 14px 14px;
  background: rgba(var(--v-theme-primary), .03);
  border-right: 1px solid rgba(var(--v-theme-on-surface), .07);
}
.arq__cash-expected-block {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.arq__cash-sublabel {
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), .5);
}
.arq__cash-amount {
  font-size: 26px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -.01em;
}

/* ── Diff badge ──────────────────────────────────────────────────────── */
.arq__diff-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  border-radius: 10px;
  border: 1px solid transparent;
}
.arq__diff-label { font-size: 11px; font-weight: 600; }
.arq__diff-val   { font-size: 13px; font-weight: 900; }

/* ── Columna OTROS MEDIOS ────────────────────────────────────────────── */
.arq__col-medios {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 14px 14px 12px;
}

/* ── Tabla medios ────────────────────────────────────────────────────── */
.arq__medios {
  border: 1px solid rgba(var(--v-theme-on-surface), .07);
  border-radius: 10px;
  overflow: hidden;
}
.arq__medios-header {
  display: grid;
  grid-template-columns: 1fr 55px 90px 60px;
  gap: 6px;
  padding: 5px 10px;
  background: rgba(var(--v-theme-on-surface), .04);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .45);
}
.arq__medio-row {
  display: grid;
  grid-template-columns: 1fr 55px 90px 60px;
  gap: 6px;
  align-items: center;
  padding: 4px 10px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), .05);
}
.arq__medio-name  { font-size: 11px; font-weight: 600; }
.arq__medio-esp   { font-size: 11px; color: rgba(var(--v-theme-on-surface), .6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.arq__medio-diff  { font-size: 11px; font-weight: 700; text-align: right; }

/* ── Bottom: resultado + nota ────────────────────────────────────────── */
.arq__bottom {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), .06);
  background: rgba(var(--v-theme-on-surface), .015);
}
.arq__result-banner {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid transparent;
  min-width: 0;
}
.arq__result-title {
  display: block;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}
.arq__result-text {
  display: block;
  font-size: 11px;
  margin-top: 1px;
  opacity: .85;
  white-space: nowrap;
}
.arq__note { max-width: 200px; }

/* ── Footer ──────────────────────────────────────────────────────────── */
.arq__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px 12px;
  gap: 12px;
}
.arq__footer-diff {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.arq__footer-diff-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .5);
}
.arq__footer-diff strong { font-size: 15px; font-weight: 900; }
.arq__footer-actions { display: flex; gap: 8px; }

/* ── Status colors ───────────────────────────────────────────────────── */
.is-ok      { background: rgba(var(--v-theme-success),.08); border-color: rgba(var(--v-theme-success),.2);  color: rgb(var(--v-theme-success)); }
.is-warning { background: rgba(var(--v-theme-warning),.1);  border-color: rgba(var(--v-theme-warning),.22); color: rgb(var(--v-theme-warning)); }
.is-danger  { background: rgba(var(--v-theme-error),  .08); border-color: rgba(var(--v-theme-error),  .2);  color: rgb(var(--v-theme-error)); }
.is-info    { background: rgba(var(--v-theme-info),   .08); border-color: rgba(var(--v-theme-info),   .2);  color: rgb(var(--v-theme-info)); }
.c-ok      { color: rgb(var(--v-theme-success)); }
.c-warning { color: rgb(var(--v-theme-warning)); }
.c-danger  { color: rgb(var(--v-theme-error)); }

/* ── Inputs ──────────────────────────────────────────────────────────── */
.arq :deep(.v-field) { border-radius: 8px; }
.arq__input--sm :deep(.v-field__input)  { font-size: 11px; min-height: 32px; padding: 2px 6px; }
.arq__input--sm :deep(.v-field__prefix) { font-size: 11px; padding-left: 6px; }

/* ── Responsive ──────────────────────────────────────────────────────── */
@media (max-width: 560px) {
  .arq__body { grid-template-columns: 1fr; }
  .arq__col-cash { border-right: none; border-bottom: 1px solid rgba(var(--v-theme-on-surface), .07); }
  .arq__bottom { flex-direction: column; align-items: stretch; }
  .arq__note { max-width: 100%; }
  .arq__footer { flex-direction: column; align-items: stretch; }
  .arq__footer-actions { justify-content: flex-end; }
}
</style>
