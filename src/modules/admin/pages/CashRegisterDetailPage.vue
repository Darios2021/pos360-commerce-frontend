<template>
  <div class="crd">

    <!-- Top bar -->
    <div class="crd-bar">
      <AppBackButton label="Cajas" :to="{ name: 'adminCashRegisters' }" />

      <div class="crd-bar__title">
        <v-icon size="18" color="primary">mdi-cash-register</v-icon>
        <span class="crd-bar__id">Caja #{{ id }}</span>
        <v-chip
          v-if="data"
          size="small"
          :color="data.status === 'OPEN' ? 'success' : 'grey'"
          variant="flat"
        >
          {{ data.status === 'OPEN' ? 'Abierta' : 'Cerrada' }}
        </v-chip>
      </div>

      <v-spacer />

      <v-btn
        variant="tonal"
        size="small"
        rounded="lg"
        prepend-icon="mdi-refresh"
        :loading="loading"
        @click="load"
      >
        Actualizar
      </v-btn>
    </div>

    <!-- Error -->
    <v-alert v-if="error" type="error" variant="tonal" class="ma-4">{{ error }}</v-alert>

    <!-- Loading -->
    <div v-if="loading && !data" class="crd-centered">
      <v-progress-circular size="28" indeterminate color="primary" />
      <span class="ml-2">Cargando detalle…</span>
    </div>

    <!-- Content -->
    <div v-else-if="data" class="crd-content">

      <!-- Info principal -->
      <div class="crd-grid">
        <div class="crd-card">
          <div class="crd-k"><v-icon size="14">mdi-account-circle</v-icon> Cajero</div>
          <div class="crd-v">{{ data.opened_by_name || "—" }}</div>
          <div class="crd-sub" v-if="data.opened_by_email">{{ data.opened_by_email }}</div>
        </div>
        <div class="crd-card">
          <div class="crd-k"><v-icon size="14">mdi-storefront</v-icon> Sucursal</div>
          <div class="crd-v">{{ data.branch_name || "—" }}</div>
          <div class="crd-sub">ID: {{ data.branch_id }}</div>
        </div>
        <div class="crd-card">
          <div class="crd-k"><v-icon size="14">mdi-login-variant</v-icon> Apertura</div>
          <div class="crd-v">{{ fmtDateTime(data.opened_at) }}</div>
          <div class="crd-sub" v-if="data.opening_ip">IP: {{ data.opening_ip }}</div>
        </div>
        <div class="crd-card">
          <div class="crd-k"><v-icon size="14">mdi-logout-variant</v-icon> Cierre</div>
          <div class="crd-v">{{ data.closed_at ? fmtDateTime(data.closed_at) : 'En curso' }}</div>
          <div class="crd-sub" v-if="data.closed_by_name">Por: {{ data.closed_by_name }}</div>
        </div>
        <div class="crd-card">
          <div class="crd-k"><v-icon size="14">mdi-shape-outline</v-icon> Tipo</div>
          <div class="crd-v">{{ cajaTypeLabel(data.caja_type) || '—' }}</div>
          <div class="crd-sub">
            {{ invoiceModeLabel(data.invoice_mode) }}
            {{ data.invoice_type ? '· ' + data.invoice_type : '' }}
          </div>
        </div>
        <div class="crd-card">
          <div class="crd-k"><v-icon size="14">mdi-clock-outline</v-icon> Duración</div>
          <div class="crd-v">{{ durationLabel(data) }}</div>
          <div class="crd-sub">{{ data.sales_count || 0 }} ventas</div>
        </div>
      </div>

      <!-- Auditoría (si hay alertas) -->
      <section v-if="auditFlags.length" class="crd-section crd-section--audit">
        <div class="crd-section__title">
          <v-icon size="16" color="error">mdi-alert-decagram</v-icon>
          Auditoría
          <v-chip size="x-small" class="ml-2" color="error" variant="flat">
            {{ auditFlags.length }}
            {{ auditFlags.length === 1 ? 'alerta' : 'alertas' }}
          </v-chip>
        </div>

        <div class="crd-audit-list">
          <div
            v-for="f in auditFlags"
            :key="f.code"
            class="crd-audit"
            :class="`crd-audit--${f.severity}`"
          >
            <div class="crd-audit__ic">
              <v-icon size="20">{{ flagIcon(f.code) }}</v-icon>
            </div>
            <div class="crd-audit__body">
              <div class="crd-audit__head">
                <span class="crd-audit__label">{{ f.label }}</span>
                <span class="crd-audit__sev">{{ severityLabel(f.severity) }}</span>
              </div>
              <div class="crd-audit__detail">{{ f.detail }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Totales -->
      <section class="crd-section">
        <div class="crd-section__title">
          <v-icon size="16">mdi-cash-multiple</v-icon> Totales
        </div>
        <div class="crd-totals">
          <div class="crd-total">
            <span class="crd-total-k">Fondo inicial</span>
            <span class="crd-total-v">${{ fmtNum(totals.opening_cash) }}</span>
          </div>
          <div class="crd-total">
            <span class="crd-total-k">Ventas</span>
            <span class="crd-total-v">${{ fmtNum(totals.sales_total) }}</span>
          </div>
          <div class="crd-total">
            <span class="crd-total-k">Pagado</span>
            <span class="crd-total-v">${{ fmtNum(totals.paid_total) }}</span>
          </div>
          <div class="crd-total">
            <span class="crd-total-k">Ingresos manuales</span>
            <span class="crd-total-v crd-total-v--ok">+${{ fmtNum(totals.manual_in) }}</span>
          </div>
          <div class="crd-total">
            <span class="crd-total-k">Egresos manuales</span>
            <span class="crd-total-v crd-total-v--bad">-${{ fmtNum(totals.manual_out) }}</span>
          </div>
          <div class="crd-total crd-total--big">
            <span class="crd-total-k">Efectivo esperado</span>
            <span class="crd-total-v">${{ fmtNum(totals.expected_cash) }}</span>
          </div>
          <div class="crd-total crd-total--big" v-if="data.closing_cash != null">
            <span class="crd-total-k">Declarado</span>
            <span class="crd-total-v">${{ fmtNum(data.closing_cash) }}</span>
          </div>
          <div class="crd-total crd-total--big" v-if="data.difference_cash != null">
            <span class="crd-total-k">Diferencia</span>
            <span class="crd-total-v" :class="diffTextClass(data.difference_cash)">
              {{ data.difference_cash > 0 ? '+' : '' }}${{ fmtNum(data.difference_cash) }}
            </span>
          </div>
        </div>
      </section>

      <!-- Pagos por método -->
      <section v-if="paymentMethodsArr.length" class="crd-section">
        <div class="crd-section__title">
          <v-icon size="16">mdi-credit-card-outline</v-icon> Pagos por método
        </div>
        <div class="crd-pmethods">
          <div v-for="p in paymentMethodsArr" :key="p.key" class="crd-pmethod">
            <div class="crd-pmethod__k">{{ p.label }}</div>
            <div class="crd-pmethod__v">${{ fmtNum(p.amount) }}</div>
          </div>
        </div>
      </section>

      <!-- Movimientos manuales -->
      <section class="crd-section">
        <div class="crd-section__title">
          <v-icon size="16">mdi-swap-vertical</v-icon> Movimientos manuales
          <v-chip size="x-small" class="ml-2" variant="tonal">
            {{ (movements || []).length }}
          </v-chip>
        </div>

        <div v-if="!(movements || []).length" class="crd-empty-sm">
          Sin movimientos manuales.
        </div>

        <div v-else class="crd-subtable-wrap">
          <table class="crd-subtable">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Motivo</th>
                <th>Nota</th>
                <th class="num">Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in movements" :key="m.id">
                <td>{{ fmtDateTime(m.happened_at) }}</td>
                <td>
                  <span class="crd-mtype" :class="m.type === 'IN' ? 'is-in' : 'is-out'">
                    <v-icon size="12">{{ m.type === 'IN' ? 'mdi-arrow-down' : 'mdi-arrow-up' }}</v-icon>
                    {{ m.type === 'IN' ? 'Ingreso' : 'Egreso' }}
                  </span>
                </td>
                <td>{{ m.reason }}</td>
                <td class="crd-note">{{ m.note || '—' }}</td>
                <td class="num" :class="m.type === 'IN' ? 'clr-ok' : 'clr-bad'">
                  {{ m.type === 'IN' ? '+' : '-' }}${{ fmtNum(m.amount) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Notas -->
      <section v-if="data.opening_note || data.closing_note" class="crd-section">
        <div class="crd-section__title">
          <v-icon size="16">mdi-note-text-outline</v-icon> Notas
        </div>
        <div v-if="data.opening_note" class="crd-note-block">
          <div class="crd-note-k">Apertura</div>
          <div class="crd-note-v">{{ data.opening_note }}</div>
        </div>
        <div v-if="data.closing_note" class="crd-note-block">
          <div class="crd-note-k">Cierre</div>
          <div class="crd-note-v">{{ data.closing_note }}</div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  adminListCashRegisters,
  getCashRegisterSummary,
} from "@/modules/pos/services/posCashRegisters.service";
import AppBackButton from "@/app/components/AppBackButton.vue";

const route = useRoute();
const router = useRouter();
const id = computed(() => Number(route.params?.id || 0));

const loading = ref(false);
const error = ref("");
const data = ref(null);
const movements = ref([]);
const paymentsByMethod = ref({});

const totals = computed(() => {
  const d = data.value || {};
  return {
    opening_cash: Number(d.totals_opening_cash ?? d.opening_cash ?? 0),
    sales_total: Number(d.totals_sales_total ?? d.sales_total ?? 0),
    paid_total: Number(d.totals_paid_total ?? d.sales_total ?? 0),
    manual_in: Number(d.totals_manual_in ?? d.manual_in ?? 0),
    manual_out: Number(d.totals_manual_out ?? d.manual_out ?? 0),
    expected_cash: Number(d.totals_expected_cash ?? d.expected_cash ?? 0),
  };
});

function goBack() {
  router.push({ name: "adminCashRegisters" });
}

async function load() {
  if (!id.value) return;
  loading.value = true;
  error.value = "";

  try {
    // 1) Tomo la fila completa desde admin/list filtrando por id vía búsqueda para
    //    obtener branch_name, opened_by_name, email, etc. sin query adicional.
    //    Si no aparece (edge case), caigo a summary como única fuente.
    let row = null;
    try {
      const listRes = await adminListCashRegisters({ page: 1, limit: 200 });
      const items = Array.isArray(listRes?.data) ? listRes.data : [];
      row = items.find((r) => Number(r.id) === id.value) || null;
    } catch (_) {}

    // 2) Summary detallado (movimientos, pagos por método, totales).
    let summaryRaw = null;
    try {
      const res = await getCashRegisterSummary(id.value);
      summaryRaw = res?.data?.data || res?.data || res;
    } catch (e) {
      if (!row) throw e;
    }

    const header = summaryRaw?.cash_register || summaryRaw?.header || {};
    const t = summaryRaw?.totals || {};
    const m = Array.isArray(summaryRaw?.movements) ? summaryRaw.movements : [];
    const pbm = summaryRaw?.payments_by_method || summaryRaw?.paymentsByMethod || {};

    data.value = {
      id: id.value,
      ...row,
      ...header,
      branch_name: row?.branch_name || header?.branch_name,
      opened_by_name: row?.opened_by_name || header?.opened_by_name,
      opened_by_email: row?.opened_by_email || header?.opened_by_email,
      closed_by_name: row?.closed_by_name || header?.closed_by_name,
      sales_count: t?.sales_count ?? row?.sales_count ?? 0,
      totals_opening_cash: t?.opening_cash ?? row?.opening_cash,
      totals_sales_total: t?.sales_total ?? row?.sales_total,
      totals_paid_total: t?.paid_total ?? t?.sales_total ?? row?.sales_total,
      totals_manual_in: t?.manual_in ?? row?.manual_in,
      totals_manual_out: t?.manual_out ?? row?.manual_out,
      totals_expected_cash: t?.expected_cash ?? row?.expected_cash,
      audit: row?.audit || null,
    };
    movements.value = m;
    paymentsByMethod.value = pbm;
  } catch (e) {
    error.value = e?.friendlyMessage || e?.message || "No se pudo cargar la caja";
  } finally {
    loading.value = false;
  }
}

const paymentMethodsArr = computed(() => {
  const src = paymentsByMethod.value || {};
  const map = {
    cash: "Efectivo",
    card: "Tarjeta",
    transfer: "Transferencia",
    qr: "QR",
    mercadopago: "MercadoPago",
    credit_sjt: "Crédito SJT",
    other: "Otros",
  };
  return Object.keys(src)
    .map((k) => ({ key: k, label: map[k] || k, amount: Number(src[k] || 0) }))
    .filter((p) => p.amount !== 0);
});

function fmtNum(v) {
  const n = Number(v || 0);
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}
function fmtDateTime(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  const time = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}
function cajaTypeLabel(v) {
  const map = { GENERAL: "General", SHIFT: "Turno", BRANCH: "Sucursal", MOBILE: "Móvil" };
  return map[String(v || "").toUpperCase()] || "";
}
function invoiceModeLabel(v) {
  const map = { NO_FISCAL: "No fiscal", FISCAL: "Fiscal", MIXED: "Mixta", TICKET_ONLY: "Solo ticket" };
  return map[String(v || "").toUpperCase()] || "—";
}
function durationLabel(h) {
  if (!h?.opened_at) return "—";
  const start = new Date(h.opened_at).getTime();
  const end = h.closed_at ? new Date(h.closed_at).getTime() : Date.now();
  const diff = Math.max(0, end - start);
  const totalMin = Math.floor(diff / 60000);
  const hr = Math.floor(totalMin / 60);
  const mn = totalMin % 60;
  if (hr > 0) return `${hr}h ${mn}m`;
  if (mn < 1) return "recién";
  return `${mn} min`;
}
function diffTextClass(v) {
  const n = Number(v || 0);
  if (n > 0) return "clr-ok";
  if (n < 0) return "clr-bad";
  return "";
}

const auditFlags = computed(() => {
  const flags = data.value?.audit?.flags;
  return Array.isArray(flags) ? flags : [];
});

function flagIcon(code) {
  const map = {
    SHORTAGE: "mdi-cash-remove",
    SURPLUS: "mdi-cash-plus",
    OVERTIME: "mdi-clock-alert",
    LONG_OPEN: "mdi-clock-alert-outline",
    BIG_MANUAL_OUT: "mdi-arrow-up-bold-circle-outline",
  };
  return map[code] || "mdi-alert-outline";
}
function severityLabel(sev) {
  const map = { high: "Grave", medium: "Importante", low: "Aviso" };
  return map[sev] || sev;
}

onMounted(load);
watch(id, load);
</script>

<style scoped>
.crd {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}

/* Top bar */
.crd-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  position: sticky;
  top: 0;
  z-index: 10;
}
.crd-bar__title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.crd-bar__id {
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.005em;
}

.crd-centered {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

/* Content */
.crd-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.crd-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
}
.crd-card {
  padding: 14px 16px;
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.crd-k {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.55;
  margin-bottom: 4px;
}
.crd-v {
  font-size: 15px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.3;
}
.crd-sub {
  font-size: 11px;
  opacity: 0.55;
  margin-top: 2px;
  font-weight: 500;
}

/* Sections */
.crd-section {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 14px;
  padding: 16px 18px;
}
.crd-section__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.75;
  margin-bottom: 12px;
}

.crd-totals {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 4px 28px;
}
.crd-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 8px 0;
  border-bottom: 1px dashed rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.5));
}
.crd-total-k { font-size: 12.5px; font-weight: 400; opacity: 0.7; }
.crd-total-v { font-size: 14px; font-weight: 500; }
.crd-total-v--ok  { color: rgb(var(--v-theme-success)); }
.crd-total-v--bad { color: rgb(var(--v-theme-error)); }
.crd-total--big .crd-total-k { font-size: 13px; font-weight: 500; opacity: 0.88; }
.crd-total--big .crd-total-v { font-size: 18px; }

.crd-pmethods {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}
.crd-pmethod {
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.crd-pmethod__k {
  font-size: 10.5px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.55;
  margin-bottom: 4px;
}
.crd-pmethod__v {
  font-size: 16px;
  font-weight: 500;
}

.crd-subtable-wrap { overflow-x: auto; }
.crd-subtable {
  width: 100%;
  border-collapse: collapse;
}
.crd-subtable th {
  text-align: left;
  font-size: 10.5px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.55;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.crd-subtable th.num,
.crd-subtable td.num { text-align: right; font-variant-numeric: tabular-nums; }
.crd-subtable td {
  padding: 10px 12px;
  font-size: 13px;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.5));
}
.crd-subtable tr:last-child td { border-bottom: none; }

.crd-mtype {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
}
.crd-mtype.is-in  { background: rgba(var(--v-theme-success), 0.12); color: rgb(var(--v-theme-success)); }
.crd-mtype.is-out { background: rgba(var(--v-theme-error), 0.12);   color: rgb(var(--v-theme-error)); }

.crd-note {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.8;
}

.crd-note-block {
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  margin-bottom: 8px;
}
.crd-note-k {
  font-size: 10.5px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.55;
  margin-bottom: 4px;
}
.crd-note-v {
  font-size: 13px;
  line-height: 1.55;
}

.crd-empty-sm {
  font-size: 12px;
  opacity: 0.6;
  padding: 12px 0;
}

/* Auditoría */
.crd-section--audit {
  border-color: rgba(var(--v-theme-error), 0.4);
  background:
    linear-gradient(180deg, rgba(var(--v-theme-error), 0.04), rgba(var(--v-theme-error), 0)),
    rgb(var(--v-theme-surface));
}
.crd-audit-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
}
.crd-audit {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid;
}
.crd-audit__ic {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.crd-audit__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.crd-audit__head {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.crd-audit__label {
  font-weight: 500;
  font-size: 13px;
  line-height: 1.2;
}
.crd-audit__sev {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 6px;
  border-radius: 999px;
}
.crd-audit__detail {
  font-size: 12px;
  opacity: 0.8;
  line-height: 1.4;
}

.crd-audit--high {
  background: rgba(var(--v-theme-error), 0.06);
  border-color: rgba(var(--v-theme-error), 0.35);
}
.crd-audit--high .crd-audit__ic {
  background: rgba(var(--v-theme-error), 0.14);
  color: rgb(var(--v-theme-error));
}
.crd-audit--high .crd-audit__sev {
  background: rgba(var(--v-theme-error), 0.14);
  color: rgb(var(--v-theme-error));
}

.crd-audit--medium {
  background: rgba(245, 158, 11, 0.05);
  border-color: rgba(245, 158, 11, 0.35);
}
.crd-audit--medium .crd-audit__ic {
  background: rgba(245, 158, 11, 0.14);
  color: #d97706;
}
.crd-audit--medium .crd-audit__sev {
  background: rgba(245, 158, 11, 0.16);
  color: #d97706;
}
:global(.v-theme--dark) .crd-audit--medium .crd-audit__ic,
:global(.v-theme--dark) .crd-audit--medium .crd-audit__sev { color: #fbbf24; }

.crd-audit--low {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
}
.crd-audit--low .crd-audit__ic {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.65);
}
.crd-audit--low .crd-audit__sev {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.65);
}

.clr-ok  { color: rgb(var(--v-theme-success)); }
.clr-bad { color: rgb(var(--v-theme-error)); }
</style>
