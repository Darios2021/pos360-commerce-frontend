<!-- src/modules/reports/pages/ReportsSalesPage.vue -->
<!--
  Reporte de ventas para liquidación de franquicia.
  - Filtros: sucursal, año, mes, estado
  - Campo "% de ganancia" global aplica a todas las ventas del período
  - Override manual por venta (columna editable)
  - Summary con total vendido y total a liquidar
  - Agrupación por sucursal (útil cuando no se filtra sucursal)
-->

<template>
  <div class="rpt-sales">
    <!-- FILTROS -->
    <div class="rpt-filters">
      <div class="rpt-filters__head">
        <div class="rpt-filters__head-left">
          <v-icon size="16" class="rpt-filters__icon">mdi-filter-variant</v-icon>
          <span class="rpt-filters__title">Período y filtros</span>
        </div>
        <button v-if="anyFilterSet" class="rpt-filters__clear" @click="resetFilters">
          <v-icon size="13">mdi-close</v-icon>
          Limpiar
        </button>
      </div>

      <div class="rpt-filters__grid">
        <div class="rpt-filter-cell">
          <v-select
            v-model="f.branch_id"
            :items="branchItems"
            item-title="title"
            item-value="value"
            label="Sucursal"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            @update:modelValue="reload"
          />
        </div>

        <div class="rpt-filter-cell">
          <v-select
            v-model="f.year"
            :items="yearItems"
            label="Año"
            variant="outlined"
            density="compact"
            hide-details
            @update:modelValue="reload"
          />
        </div>

        <div class="rpt-filter-cell">
          <v-select
            v-model="f.month"
            :items="monthItems"
            item-title="title"
            item-value="value"
            label="Mes"
            variant="outlined"
            density="compact"
            hide-details
            @update:modelValue="reload"
          />
        </div>

        <div class="rpt-filter-cell">
          <v-select
            v-model="f.status"
            :items="statusItems"
            item-title="title"
            item-value="value"
            label="Estado"
            variant="outlined"
            density="compact"
            hide-details
            @update:modelValue="reload"
          />
        </div>

        <div class="rpt-filter-cell rpt-filter-cell--pct">
          <v-text-field
            v-model.number="profitPct"
            label="% Ganancia global"
            variant="outlined"
            density="compact"
            hide-details
            type="number"
            min="0"
            max="100"
            step="0.5"
            suffix="%"
            prepend-inner-icon="mdi-percent-outline"
          />
        </div>

        <div class="rpt-filter-cell rpt-filter-cell--actions">
          <v-btn
            variant="tonal"
            color="primary"
            rounded="lg"
            size="small"
            prepend-icon="mdi-refresh"
            :loading="loading"
            @click="reload"
          >
            Actualizar
          </v-btn>
          <v-btn
            variant="flat"
            color="primary"
            rounded="lg"
            size="small"
            prepend-icon="mdi-download-outline"
            :disabled="!sales.length"
            @click="exportCsv"
          >
            CSV
          </v-btn>
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="rpt-kpis">
      <div class="rpt-kpi">
        <div class="rpt-kpi__label">
          <v-icon size="14">mdi-cart-outline</v-icon>
          Ventas
        </div>
        <div class="rpt-kpi__value">{{ fmtInt(summary.sales_count) }}</div>
        <div class="rpt-kpi__sub">{{ fmtInt(summary.items_qty) }} unidades</div>
      </div>

      <div class="rpt-kpi rpt-kpi--primary">
        <div class="rpt-kpi__label">
          <v-icon size="14">mdi-cash-multiple</v-icon>
          Total vendido
        </div>
        <div class="rpt-kpi__value">{{ fmtMoney(summary.total_sum) }}</div>
        <div class="rpt-kpi__sub">
          Subtotal {{ fmtMoney(summary.subtotal_sum) }}
          <span v-if="summary.discount_sum > 0">
            · Desc. {{ fmtMoney(summary.discount_sum) }}
          </span>
        </div>
      </div>

      <div class="rpt-kpi rpt-kpi--success">
        <div class="rpt-kpi__label">
          <v-icon size="14">mdi-trending-up</v-icon>
          A liquidar ({{ profitPct || 0 }}%)
        </div>
        <div class="rpt-kpi__value">{{ fmtMoney(liquidationTotal) }}</div>
        <div class="rpt-kpi__sub">
          Promedio {{ fmtMoney(avgTicket) }} por venta
        </div>
      </div>

      <div class="rpt-kpi">
        <div class="rpt-kpi__label">
          <v-icon size="14">mdi-calendar-month-outline</v-icon>
          Período
        </div>
        <div class="rpt-kpi__value rpt-kpi__value--sm">
          {{ monthLabel }} {{ f.year }}
        </div>
        <div class="rpt-kpi__sub" v-if="f.branch_id">
          {{ selectedBranchName }}
        </div>
        <div class="rpt-kpi__sub" v-else>
          Todas las sucursales
        </div>
      </div>
    </div>

    <!-- RESUMEN POR SUCURSAL (si no hay branch_id) -->
    <div v-if="!f.branch_id && byBranch.length" class="rpt-card">
      <div class="rpt-card__head">
        <v-icon size="16">mdi-store-outline</v-icon>
        <span class="rpt-card__title">Resumen por sucursal</span>
      </div>
      <div class="rpt-branch-grid">
        <div
          v-for="b in byBranch"
          :key="b.branch_id"
          class="rpt-branch-card"
          @click="filterByBranch(b.branch_id)"
          :title="`Ver ventas de ${b.branch_name}`"
        >
          <div class="rpt-branch-card__head">
            <span class="rpt-branch-card__name">{{ b.branch_name }}</span>
            <v-chip size="x-small" variant="tonal" color="primary">
              {{ fmtInt(b.sales_count) }} ventas
            </v-chip>
          </div>
          <div class="rpt-branch-card__metric">
            <div>
              <div class="rpt-branch-card__metric-label">Total</div>
              <div class="rpt-branch-card__metric-value">{{ fmtMoney(b.total_sum) }}</div>
            </div>
            <div>
              <div class="rpt-branch-card__metric-label">Liquidar</div>
              <div class="rpt-branch-card__metric-value rpt-branch-card__metric-value--pos">
                {{ fmtMoney(b.total_sum * (Number(profitPct || 0) / 100)) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TABLA DE VENTAS -->
    <div class="rpt-card">
      <div class="rpt-card__head">
        <v-icon size="16">mdi-format-list-bulleted</v-icon>
        <span class="rpt-card__title">Detalle de ventas</span>
        <v-spacer />
        <span class="rpt-card__count">{{ fmtInt(sales.length) }} resultado{{ sales.length === 1 ? '' : 's' }}</span>
      </div>

      <div v-if="loading" class="rpt-loading">
        <v-progress-circular indeterminate color="primary" size="28" />
        <span>Cargando ventas…</span>
      </div>

      <div v-else-if="!sales.length" class="rpt-empty">
        <v-icon size="40" color="medium-emphasis">mdi-database-off-outline</v-icon>
        <div class="rpt-empty__title">Sin ventas en este período</div>
        <div class="rpt-empty__sub">Probá con otro mes o sucursal.</div>
      </div>

      <div v-else class="rpt-table-wrap">
        <table class="rpt-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>N°</th>
              <th>Sucursal</th>
              <th>Cajero</th>
              <th>Cliente</th>
              <th class="num">Items</th>
              <th class="num">Total</th>
              <th class="num">% Ganancia</th>
              <th class="num">A liquidar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sales" :key="s.id">
              <td>
                <div class="rpt-cell-date">
                  <strong>{{ fmtDate(s.sold_at) }}</strong>
                  <span>{{ fmtTime(s.sold_at) }}</span>
                </div>
              </td>
              <td class="mono">{{ s.sale_number || `#${s.id}` }}</td>
              <td>
                <span class="rpt-branch-pill">
                  <v-icon size="10">mdi-store-outline</v-icon>
                  {{ s.branch_name || `Suc. #${s.branch_id}` }}
                </span>
              </td>
              <td class="rpt-cell-user">{{ s.user_name || '—' }}</td>
              <td>
                <div class="rpt-cell-customer">
                  <strong>{{ s.customer_name || '—' }}</strong>
                  <span v-if="s.customer_doc">{{ s.customer_doc }}</span>
                </div>
              </td>
              <td class="num">{{ fmtInt(s.items_qty || 0) }}</td>
              <td class="num rpt-cell-total">{{ fmtMoney(s.total) }}</td>
              <td class="num rpt-cell-pct">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  class="rpt-pct-input"
                  :value="pctForSale(s.id)"
                  @input="(e) => setOverridePct(s.id, e.target.value)"
                  @focus="(e) => e.target.select()"
                />
                <span class="rpt-pct-suffix">%</span>
                <button
                  v-if="hasOverride(s.id)"
                  class="rpt-pct-reset"
                  title="Volver al % global"
                  @click="clearOverride(s.id)"
                >
                  <v-icon size="12">mdi-restore</v-icon>
                </button>
              </td>
              <td class="num rpt-cell-profit">
                {{ fmtMoney(liquidationFor(s)) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="6" class="rpt-foot-label">Total período</td>
              <td class="num rpt-foot-val">{{ fmtMoney(summary.total_sum) }}</td>
              <td class="num"></td>
              <td class="num rpt-foot-val rpt-foot-val--success">{{ fmtMoney(liquidationTotal) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <v-snackbar v-model="snack.show" :timeout="3200" location="bottom right" rounded="lg">
      {{ snack.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import http from "@/app/api/http";

/* ─── Estado ──────────────────────────────────────────────────────── */
const loading = ref(false);
const sales = ref([]);
const summary = reactive({
  sales_count: 0,
  subtotal_sum: 0,
  discount_sum: 0,
  total_sum: 0,
  paid_sum: 0,
  items_count: 0,
  items_qty: 0,
  by_method: {},
});
const byBranch = ref([]);
const byDay = ref([]);
const branches = ref([]);

const now = new Date();
const f = reactive({
  branch_id: null,
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  status: "PAID",
});

const profitPct = ref(0); // % global aplicado a todas las ventas
const overridePct = reactive({}); // { [saleId]: number }

const snack = reactive({ show: false, text: "" });
function toast(text) {
  snack.show = true;
  snack.text = String(text || "");
}

/* ─── Items de selects ────────────────────────────────────────────── */
const monthItems = [
  { title: "Enero", value: 1 },
  { title: "Febrero", value: 2 },
  { title: "Marzo", value: 3 },
  { title: "Abril", value: 4 },
  { title: "Mayo", value: 5 },
  { title: "Junio", value: 6 },
  { title: "Julio", value: 7 },
  { title: "Agosto", value: 8 },
  { title: "Septiembre", value: 9 },
  { title: "Octubre", value: 10 },
  { title: "Noviembre", value: 11 },
  { title: "Diciembre", value: 12 },
];

const yearItems = computed(() => {
  const current = now.getFullYear();
  const years = [];
  for (let y = current; y >= current - 4; y--) years.push(y);
  return years;
});

const statusItems = [
  { title: "Pagadas", value: "PAID" },
  { title: "Todas", value: "ALL" },
];

const branchItems = computed(() => {
  const out = [{ title: "Todas las sucursales", value: null }];
  (branches.value || [])
    .map((b) => ({ title: b?.name || `Sucursal #${b?.id}`, value: Number(b?.id) }))
    .filter((x) => x.value > 0)
    .sort((a, b) => a.value - b.value)
    .forEach((x) => out.push(x));
  return out;
});

const selectedBranchName = computed(() => {
  if (!f.branch_id) return "";
  const found = branchItems.value.find((x) => x.value === f.branch_id);
  return found?.title || `Sucursal #${f.branch_id}`;
});

const monthLabel = computed(
  () => monthItems.find((m) => m.value === f.month)?.title || ""
);

const anyFilterSet = computed(
  () =>
    !!f.branch_id ||
    f.status !== "PAID" ||
    f.year !== now.getFullYear() ||
    f.month !== now.getMonth() + 1
);

/* ─── Cálculo liquidación ──────────────────────────────────────── */
function pctForSale(saleId) {
  if (Object.prototype.hasOwnProperty.call(overridePct, saleId)) {
    return overridePct[saleId];
  }
  return Number(profitPct.value || 0);
}

function hasOverride(saleId) {
  return Object.prototype.hasOwnProperty.call(overridePct, saleId);
}

function setOverridePct(saleId, value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return;
  overridePct[saleId] = Math.max(0, Math.min(100, n));
}

function clearOverride(saleId) {
  delete overridePct[saleId];
}

function liquidationFor(sale) {
  const pct = Number(pctForSale(sale.id)) || 0;
  return Number(sale.total || 0) * (pct / 100);
}

const liquidationTotal = computed(() => {
  let total = 0;
  for (const s of sales.value) total += liquidationFor(s);
  return total;
});

const avgTicket = computed(() => {
  const n = Number(summary.sales_count || 0);
  return n > 0 ? Number(summary.total_sum || 0) / n : 0;
});

/* ─── Formatters ──────────────────────────────────────────────────── */
const fmtMoneyInt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
function fmtMoney(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return "$ 0";
  return fmtMoneyInt.format(Math.round(n));
}
function fmtInt(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("es-AR").format(Math.floor(n));
}
function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(d);
  } catch {
    return "—";
  }
}
function fmtTime(iso) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "";
  }
}

/* ─── Fetch ────────────────────────────────────────────────────────── */
async function loadBranches() {
  try {
    const r = await http.get("/branches");
    const arr = Array.isArray(r?.data?.data) ? r.data.data : Array.isArray(r?.data) ? r.data : [];
    branches.value = arr;
  } catch (e) {
    console.warn("No se pudieron cargar sucursales", e);
    branches.value = [];
  }
}

async function reload() {
  loading.value = true;
  try {
    const params = {
      year: f.year,
      month: f.month,
      status: f.status,
    };
    if (f.branch_id) params.branch_id = f.branch_id;

    const r = await http.get("/reports/sales", { params });
    const data = r?.data?.data || {};

    sales.value = Array.isArray(data.sales) ? data.sales : [];
    byBranch.value = Array.isArray(data.by_branch) ? data.by_branch : [];
    byDay.value = Array.isArray(data.by_day) ? data.by_day : [];

    const s = data.summary || {};
    Object.assign(summary, {
      sales_count: Number(s.sales_count || 0),
      subtotal_sum: Number(s.subtotal_sum || 0),
      discount_sum: Number(s.discount_sum || 0),
      total_sum: Number(s.total_sum || 0),
      paid_sum: Number(s.paid_sum || 0),
      items_count: Number(s.items_count || 0),
      items_qty: Number(s.items_qty || 0),
      by_method: s.by_method || {},
    });

    // Los overrides manuales no sobreviven un nuevo fetch de distinto período
    for (const k of Object.keys(overridePct)) delete overridePct[k];
  } catch (e) {
    console.error("[reports/sales] error:", e);
    const msg = e?.response?.data?.message || e?.message || "No se pudo cargar el reporte.";
    toast(msg);
    sales.value = [];
    byBranch.value = [];
    byDay.value = [];
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  f.branch_id = null;
  f.status = "PAID";
  f.year = now.getFullYear();
  f.month = now.getMonth() + 1;
  reload();
}

function filterByBranch(branchId) {
  f.branch_id = Number(branchId) || null;
  reload();
}

/* ─── Export CSV ───────────────────────────────────────────────────── */
function exportCsv() {
  if (!sales.value.length) return;
  const header = [
    "id",
    "sale_number",
    "sold_at",
    "branch",
    "user",
    "customer",
    "customer_doc",
    "items_qty",
    "subtotal",
    "discount",
    "total",
    "profit_pct",
    "liquidation",
  ];

  const rows = sales.value.map((s) => {
    const pct = Number(pctForSale(s.id)) || 0;
    const liq = Number(s.total || 0) * (pct / 100);
    return [
      s.id,
      s.sale_number || "",
      new Date(s.sold_at).toISOString(),
      s.branch_name || `Sucursal #${s.branch_id}`,
      s.user_name || "",
      s.customer_name || "",
      s.customer_doc || "",
      s.items_qty || 0,
      Number(s.subtotal || 0).toFixed(2),
      Number(s.discount_total || 0).toFixed(2),
      Number(s.total || 0).toFixed(2),
      pct.toFixed(2),
      liq.toFixed(2),
    ];
  });

  const csv = [header, ...rows]
    .map((r) =>
      r
        .map((v) => {
          const s = String(v ?? "");
          if (s.includes(",") || s.includes('"') || s.includes("\n")) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        })
        .join(",")
    )
    .join("\n");

  const bom = "﻿";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const branchTag = f.branch_id ? `_suc${f.branch_id}` : "_all";
  a.download = `reporte_ventas_${f.year}-${String(f.month).padStart(2, "0")}${branchTag}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─── Init ─────────────────────────────────────────────────────────── */
onMounted(async () => {
  await loadBranches();
  await reload();
});
</script>

<style scoped>
.rpt-sales {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

/* FILTROS */
.rpt-filters {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 14px;
  background: rgba(var(--v-theme-surface), 0.6);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.rpt-filters__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 4px;
  border-bottom: 1px dashed rgba(var(--v-theme-on-surface), 0.08);
}
.rpt-filters__head-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.rpt-filters__icon { opacity: 0.6; }
.rpt-filters__title {
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.rpt-filters__clear {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.14s, color 0.14s;
}
.rpt-filters__clear:hover {
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgb(var(--v-theme-primary));
  border-color: rgba(var(--v-theme-primary), 0.28);
}
.rpt-filters__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px 12px;
  align-items: end;
}
.rpt-filter-cell { min-width: 0; }
.rpt-filter-cell--pct {
  background: rgba(var(--v-theme-primary), 0.04);
  padding: 2px 4px;
  border-radius: 10px;
}
.rpt-filter-cell--actions {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
}

/* KPIs */
.rpt-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}
.rpt-kpi {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.rpt-kpi__label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
}
.rpt-kpi__value {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.02em;
  line-height: 1.1;
  font-feature-settings: "tnum";
  color: rgb(var(--v-theme-on-surface));
}
.rpt-kpi__value--sm { font-size: 17px; }
.rpt-kpi__sub {
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-weight: 600;
}

.rpt-kpi--primary {
  background: linear-gradient(135deg,
    rgba(var(--v-theme-primary), 0.12),
    rgba(var(--v-theme-primary), 0.04));
  border-color: rgba(var(--v-theme-primary), 0.32);
}
.rpt-kpi--primary .rpt-kpi__value { color: rgb(var(--v-theme-primary)); }
.rpt-kpi--primary .rpt-kpi__label { color: rgb(var(--v-theme-primary)); opacity: 0.8; }

.rpt-kpi--success {
  background: linear-gradient(135deg,
    rgba(var(--v-theme-success), 0.12),
    rgba(var(--v-theme-success), 0.04));
  border-color: rgba(var(--v-theme-success), 0.32);
}
.rpt-kpi--success .rpt-kpi__value { color: rgb(var(--v-theme-success)); }
.rpt-kpi--success .rpt-kpi__label { color: rgb(var(--v-theme-success)); opacity: 0.85; }

/* CARD genérico */
.rpt-card {
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  overflow: hidden;
}
.rpt-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  background: rgba(var(--v-theme-on-surface), 0.02);
}
.rpt-card__title {
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.65);
}
.rpt-card__count {
  font-size: 11.5px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.5);
  font-feature-settings: "tnum";
}

/* Resumen por sucursal */
.rpt-branch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
  padding: 14px 16px;
}
.rpt-branch-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.025);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  cursor: pointer;
  transition: border-color 0.14s, background 0.14s, transform 0.14s;
}
.rpt-branch-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  background: rgba(var(--v-theme-primary), 0.04);
  transform: translateY(-1px);
}
.rpt-branch-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.rpt-branch-card__name {
  font-size: 13px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rpt-branch-card__metric {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.rpt-branch-card__metric-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.48);
}
.rpt-branch-card__metric-value {
  font-size: 15px;
  font-weight: 900;
  letter-spacing: -0.01em;
  color: rgb(var(--v-theme-on-surface));
  font-feature-settings: "tnum";
}
.rpt-branch-card__metric-value--pos {
  color: rgb(var(--v-theme-success));
}

/* LOADING / EMPTY */
.rpt-loading, .rpt-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 40px 20px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-size: 13px;
}
.rpt-empty__title { font-size: 14px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); }
.rpt-empty__sub { font-size: 12px; opacity: 0.7; }

/* TABLA */
.rpt-table-wrap {
  overflow-x: auto;
  padding: 0;
}
.rpt-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  min-width: 880px;
}
.rpt-table thead th {
  text-align: left;
  font-size: 10.5px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
  padding: 10px 12px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.03);
  white-space: nowrap;
}
.rpt-table tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  vertical-align: middle;
  color: rgb(var(--v-theme-on-surface));
}
.rpt-table tbody tr:hover {
  background: rgba(var(--v-theme-primary), 0.03);
}
.rpt-table .num {
  text-align: right;
  font-feature-settings: "tnum";
}
.rpt-table .mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}
.rpt-cell-date {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.rpt-cell-date strong { font-weight: 800; }
.rpt-cell-date span {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.5);
}
.rpt-cell-user {
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.8);
}
.rpt-cell-customer {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
  max-width: 200px;
}
.rpt-cell-customer strong {
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rpt-cell-customer span {
  font-size: 10.5px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.rpt-branch-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  font-size: 11px;
  font-weight: 700;
}
.rpt-cell-total {
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
}
.rpt-cell-pct {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  justify-content: flex-end;
}
.rpt-pct-input {
  width: 56px;
  padding: 4px 6px;
  border-radius: 6px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.18);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  font-size: 12px;
  font-weight: 700;
  text-align: right;
  font-feature-settings: "tnum";
  outline: none;
  transition: border-color 0.14s;
}
.rpt-pct-input:focus {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.14);
}
.rpt-pct-input::-webkit-outer-spin-button,
.rpt-pct-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.rpt-pct-suffix {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  font-weight: 700;
}
.rpt-pct-reset {
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: rgb(var(--v-theme-warning));
  display: inline-flex;
  align-items: center;
}
.rpt-pct-reset:hover { opacity: 0.75; }
.rpt-cell-profit {
  font-weight: 900;
  color: rgb(var(--v-theme-success));
}
.rpt-table tfoot td {
  padding: 12px;
  border-top: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-on-surface), 0.025);
}
.rpt-foot-label {
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
  text-align: right !important;
}
.rpt-foot-val {
  font-weight: 900;
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
}
.rpt-foot-val--success { color: rgb(var(--v-theme-success)); }

/* RESPONSIVE */
@media (max-width: 768px) {
  .rpt-filters { padding: 14px; gap: 12px; }
  .rpt-filter-cell--actions { justify-content: flex-start; }
  .rpt-kpi { padding: 12px; }
  .rpt-kpi__value { font-size: 18px; }
  .rpt-kpi__value--sm { font-size: 15px; }
  .rpt-branch-grid { padding: 10px; }
}
</style>
