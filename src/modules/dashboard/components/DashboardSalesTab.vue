<template>
  <div class="dv">

    <!-- ── Period selector (chips de filtro) ────────────────────────────────── -->
    <!-- Sin label "PERÍODO" ni icono: los chips ya son autoexplicativos. -->
    <div class="dv-period-bar">
      <div class="dv-period-pills" :style="periodIndicatorStyle" role="tablist">
        <button
          v-for="(p, idx) in periodItems"
          :key="p.value"
          ref="periodRefs"
          class="dv-pill"
          :class="{ 'dv-pill--active': periodLocal === p.value }"
          :data-idx="idx"
          role="tab"
          :aria-selected="periodLocal === p.value"
          @click="emitPeriod(p.value)"
        >{{ p.title }}</button>
      </div>
    </div>

    <!-- ── Row 1: Hero KPIs (todas reaccionan al período) ───────────────────── -->
    <div class="dv-kpi-row">
      <!-- Total recaudado -->
      <div class="dv-kpi" style="--kpi-accent:#1488d1">
        <div class="dv-kpi-badge" style="background:#1488d1">
          <v-icon color="white" size="20">mdi-cash-multiple</v-icon>
        </div>
        <div class="dv-kpi-body">
          <div class="dv-kpi-label">Total recaudado <span class="dv-kpi-period">· {{ periodLabelShort }}</span></div>
          <div class="dv-kpi-value dv-kpi-value--sm">{{ money(periodTotal) }}</div>
          <div class="dv-kpi-meta">{{ periodCount }} ventas en el período</div>
        </div>
      </div>

      <!-- Promedio diario -->
      <div class="dv-kpi" style="--kpi-accent:#1488d1">
        <div class="dv-kpi-badge" style="background:#1488d1">
          <v-icon color="white" size="20">mdi-trending-up</v-icon>
        </div>
        <div class="dv-kpi-body">
          <div class="dv-kpi-label">Promedio por día <span class="dv-kpi-period">· {{ periodLabelShort }}</span></div>
          <div class="dv-kpi-value dv-kpi-value--sm">{{ money(avgPerDay) }}</div>
          <div class="dv-kpi-meta">{{ nonZeroDays }} días activos / {{ timelinePoints.length }} totales</div>
        </div>
      </div>

      <!-- Ticket promedio -->
      <div class="dv-kpi" style="--kpi-accent:#1488d1">
        <div class="dv-kpi-badge" style="background:#1488d1">
          <v-icon color="white" size="20">mdi-ticket-percent-outline</v-icon>
        </div>
        <div class="dv-kpi-body">
          <div class="dv-kpi-label">Ticket promedio <span class="dv-kpi-period">· {{ periodLabelShort }}</span></div>
          <div class="dv-kpi-value dv-kpi-value--sm">{{ money(avgTicketPeriod) }}</div>
          <div class="dv-kpi-meta">Pico: {{ money(peakMax) }} ({{ peakDateFmt }})</div>
        </div>
      </div>

      <!-- Mejor mes del período -->
      <div class="dv-kpi" style="--kpi-accent:#1488d1">
        <div class="dv-kpi-badge" style="background:#1488d1">
          <v-icon color="white" size="20">mdi-calendar-star</v-icon>
        </div>
        <div class="dv-kpi-body">
          <div class="dv-kpi-label">Mejor mes <span class="dv-kpi-period">· {{ periodLabelShort }}</span></div>
          <div class="dv-kpi-value dv-kpi-value--xs">{{ bestMonthLabel }}</div>
          <div class="dv-kpi-meta">{{ bestMonth ? money(bestMonth.total) + ' · ' + num(bestMonth.count) + ' ventas' : '—' }}</div>
        </div>
      </div>
    </div>

    <!-- ── Row 1b: Sucursal líder + Cajero líder ────────────────────────────── -->
    <v-row dense align="start">
      <v-col v-if="!selectedBranch" cols="12" md="6">
        <v-card class="dv-card" elevation="0">
          <div class="dv-head">
            <div class="dv-head-left">
              <div class="dv-title">Ranking de sucursales</div>
              <div class="dv-sub">Por total vendido · {{ periodLabel }}</div>
            </div>
            <v-chip v-if="branchTop.length" size="small" variant="tonal" class="chip-soft">
              {{ money(branchTotalSum) }} total
            </v-chip>
          </div>
          <v-divider class="dv-divider" />
          <div class="dv-body">
            <div v-if="loading" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
            <div v-else-if="!branchTop.length" class="dv-empty">Sin datos por sucursal.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart :height="branchBarHeight" type="bar" :options="optBranchBar" :series="seriesBranchBar" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" :md="selectedBranch ? 12 : 6">
        <v-card class="dv-card" elevation="0">
          <div class="dv-head">
            <div class="dv-head-left">
              <div class="dv-title">Ranking de cajeros</div>
              <div class="dv-sub">Por total vendido · {{ periodLabel }}</div>
            </div>
            <v-chip v-if="topCashiers10.length" size="small" variant="tonal" class="chip-soft">
              {{ topCashiers10.length }} vendedores
            </v-chip>
          </div>
          <v-divider class="dv-divider" />
          <div class="dv-body">
            <div v-if="loading" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
            <div v-else-if="!topCashiers10.length" class="dv-empty">Sin datos de vendedores.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart :height="cashierBarHeight" type="bar" :options="optCashierRanking" :series="seriesCashierRanking" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Row 2: Timeline (full width) ──────────────────────────────────────── -->
    <v-card class="dv-card" elevation="0">
      <div class="dv-head">
        <div class="dv-head-left">
          <div class="dv-title">Evolución de ventas</div>
          <div class="dv-sub">{{ periodLabel }} · {{ timelineGranularityLabel }}</div>
        </div>
        <div class="dv-head-right">
          <v-chip v-if="peakMax > 0" size="small" variant="tonal" class="chip-soft">
            Pico <b class="ml-1">{{ money(peakMax) }}</b><span class="ml-1 op60">({{ peakDateFmt }})</span>
          </v-chip>
        </div>
      </div>
      <v-divider class="dv-divider" />
      <div class="dv-body">
        <div v-if="loading" class="dv-loading"><v-progress-circular indeterminate size="32" /></div>
        <div v-else-if="!timelinePoints.length" class="dv-empty">Sin datos de ventas en el período seleccionado.</div>
        <div v-else class="px-2 pb-1">
          <ApexChart height="260" type="area" :options="optTimeline" :series="seriesTimeline" />
          <div class="dv-foot">
            <span>Promedio/día <b>{{ money(avgPerDay) }}</b></span>
            <span class="dot">·</span>
            <span>Días activos <b>{{ nonZeroDays }} / {{ timelinePoints.length }}</b></span>
            <span class="dot">·</span>
            <span>Total <b>{{ money(periodTotal) }}</b></span>
          </div>
        </div>
      </div>
    </v-card>

    <!-- ── Row 3: Medios de pago (4) + Ventas por mes (8) ────────────────────── -->
    <v-row dense>
      <v-col cols="12" md="4">
        <v-card class="dv-card h-full" elevation="0">
          <div class="dv-head">
            <div class="dv-head-left">
              <div class="dv-title">Medios de pago</div>
              <div class="dv-sub">Composición · {{ periodLabel }}</div>
            </div>
            <v-chip size="small" variant="tonal" class="chip-soft">{{ money(paymentPeriodTotal) }}</v-chip>
          </div>
          <v-divider class="dv-divider" />
          <div class="dv-body">
            <div v-if="loading" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
            <div v-else-if="!paymentPeriodSeries.length" class="dv-empty">Sin datos.</div>
            <div v-else>
              <ApexChart height="260" type="donut" :options="optPaymentDonut" :series="paymentPeriodSeries" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card class="dv-card h-full" elevation="0">
          <div class="dv-head">
            <div class="dv-head-left">
              <div class="dv-title">Ventas por mes</div>
              <div class="dv-sub">Evolución mensual · {{ periodLabel }}</div>
            </div>
            <v-chip v-if="bestMonthLabel !== '—'" size="small" variant="tonal" class="chip-soft">
              Mejor <b class="ml-1">{{ bestMonthLabel }}</b>
            </v-chip>
          </div>
          <v-divider class="dv-divider" />
          <div class="dv-body">
            <div v-if="loading" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
            <div v-else-if="!monthsAgg.length" class="dv-empty">Sin datos mensuales.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="260" type="bar" :options="optMonthsBar" :series="seriesMonths" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Row 4: Distribución horaria (full) ───────────────────────────────── -->
    <v-card class="dv-card" elevation="0">
      <div class="dv-head">
        <div class="dv-head-left">
          <div class="dv-title">Distribución horaria de ventas</div>
          <div class="dv-sub">Recaudación por hora del día · {{ periodLabel }}</div>
        </div>
        <v-chip v-if="peakHour !== null" size="small" variant="tonal" class="chip-soft">
          Pico <b class="ml-1">{{ String(peakHour).padStart(2,'0') }}:00 hs</b>
        </v-chip>
      </div>
      <v-divider class="dv-divider" />
      <div class="dv-body">
        <div v-if="loading" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
        <div v-else-if="!hourlyHasData" class="dv-empty">Sin datos horarios.</div>
        <div v-else class="px-2 pb-2">
          <ApexChart height="200" type="bar" :options="optHourly" :series="seriesHourly" />
        </div>
      </div>
    </v-card>

    <!-- ── Row 5: Top productos (full) ──────────────────────────────────────── -->
    <v-card class="dv-card" elevation="0">
      <div class="dv-head">
        <div class="dv-head-left">
          <div class="dv-title">Top 10 productos</div>
          <div class="dv-sub">{{ productToggle === 'total' ? 'Por total recaudado' : 'Por unidades vendidas' }} · {{ periodLabel }}</div>
        </div>
        <div class="dv-head-right">
          <div class="dv-toggle">
            <button class="dv-toggle-btn" :class="{ active: productToggle === 'units' }" @click="productToggle = 'units'">Unidades</button>
            <button class="dv-toggle-btn" :class="{ active: productToggle === 'total' }" @click="productToggle = 'total'">$ Total</button>
          </div>
        </div>
      </div>
      <v-divider class="dv-divider" />
      <div class="dv-body">
        <div v-if="loading" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
        <div v-else-if="!topProducts10.length" class="dv-empty">Sin productos vendidos en el período.</div>
        <div v-else class="px-2 pb-2">
          <ApexChart height="300" type="bar" :options="optProductsBar" :series="seriesProducts" />
        </div>
      </div>
    </v-card>

    <!-- ── Row 7: Branch donut (4) + Últimas ventas (8) ──────────────────────── -->
    <v-row dense>
      <v-col cols="12" lg="4">
        <v-card class="dv-card h-full" elevation="0">
          <div class="dv-head">
            <div class="dv-head-left">
              <div class="dv-title">Por sucursal</div>
              <div class="dv-sub">Participación en ventas · {{ periodLabel }}</div>
            </div>
            <v-chip size="small" variant="tonal" class="chip-soft">{{ money(branchTotalSum) }}</v-chip>
          </div>
          <v-divider class="dv-divider" />
          <div class="dv-body">
            <div v-if="loading" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
            <div v-else-if="!branchSeries.length" class="dv-empty">Sin datos por sucursal.</div>
            <div v-else>
              <ApexChart height="220" type="donut" :options="optBranchDonut" :series="branchSeries" />
              <div class="bs-list">
                <div v-for="(b, i) in branchTop" :key="b.branch_id || i" class="bs-item">
                  <span class="bs-dot" :style="{ background: branchColors[i % branchColors.length] }" />
                  <div class="bs-name">{{ b.branch_name || `Sucursal #${b.branch_id}` }}</div>
                  <div class="bs-bar-wrap">
                    <div class="bs-bar-fill" :style="{ width: branchTotalSum ? Math.round((Number(b.total||0)/branchTotalSum)*100)+'%' : '0%', background: branchColors[i % branchColors.length] }" />
                  </div>
                  <div class="bs-pct">{{ branchTotalSum ? Math.round((Number(b.total||0)/branchTotalSum)*100) : 0 }}%</div>
                  <div class="bs-val">{{ money(b.total) }}</div>
                </div>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="8">
        <v-card class="dv-card h-full" elevation="0">
          <div class="dv-head">
            <div class="dv-head-left">
              <div class="dv-title">Últimas ventas</div>
              <div class="dv-sub">{{ scopeLabelChip }}</div>
            </div>
            <v-chip v-if="lastSales.length" size="small" variant="tonal" class="chip-soft">{{ lastSales.length }} registros</v-chip>
          </div>
          <v-divider class="dv-divider" />
          <div class="dv-body pa-0">
            <div v-if="loading" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
            <div v-else-if="!lastSales.length" class="dv-empty">Sin ventas registradas.</div>
            <div v-else class="ls-feed">
              <div v-for="sale in lastSales" :key="sale.id" class="ls-row">
                <div class="ls-id">#{{ sale.id }}</div>
                <div class="ls-middle">
                  <div class="ls-date">{{ dt(sale.sold_at) }}</div>
                  <div class="ls-branch">{{ sale?.branch?.name || (sale.branch_id ? `Sucursal #${sale.branch_id}` : '—') }}</div>
                </div>
                <div class="ls-user">
                  <v-icon size="13" class="op50 mr-1">mdi-account-outline</v-icon>
                  {{ sale?.user?.label || sale?.user?.name || sale?.user?.username || '—' }}
                </div>
                <div class="ls-method-wrap">
                  <span class="ls-method-badge" :class="methodBadgeClass(sale?.payments?.[0]?.method)">
                    {{ methodLabel(sale?.payments?.[0]?.method) }}
                  </span>
                </div>
                <div class="ls-right">
                  <div class="ls-total">{{ money(sale.total) }}</div>
                  <div class="ls-invoice">
                    <v-chip size="x-small" variant="tonal" :color="invoiceColor(sale.invoice_type)">{{ sale.invoice_type || '—' }}</v-chip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Row 9: Top clientes (6) + Ticket por día semana (6) ───────────────── -->
    <v-row dense>
      <v-col cols="12" lg="6">
        <v-card class="dv-card" elevation="0">
          <div class="dv-head">
            <div class="dv-head-left">
              <div class="dv-title">Top 10 clientes</div>
              <div class="dv-sub">Por total comprado · {{ periodLabel }}</div>
            </div>
            <v-chip v-if="topCustomers.length" size="small" variant="tonal" class="chip-soft">{{ topCustomers.length }} clientes</v-chip>
          </div>
          <v-divider class="dv-divider" />
          <div class="dv-body">
            <div v-if="loadingAnalytics" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
            <div v-else-if="!topCustomers.length" class="dv-empty">Sin clientes con nombre registrado.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="280" type="bar" :options="optTopCustomers" :series="seriesTopCustomers" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6">
        <v-card class="dv-card" elevation="0">
          <div class="dv-head">
            <div class="dv-head-left">
              <div class="dv-title">Ticket promedio por día</div>
              <div class="dv-sub">Lunes a Domingo · {{ periodLabel }}</div>
            </div>
          </div>
          <v-divider class="dv-divider" />
          <div class="dv-body">
            <div v-if="loadingAnalytics" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
            <div v-else-if="!dowTicket.some(r => r.avgTicket > 0)" class="dv-empty">Sin datos.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="280" type="bar" :options="optAvgDow" :series="seriesAvgDow" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted } from "vue";
import ApexChart from "vue3-apexcharts";

const props = defineProps({
  loading:          { type: Boolean, default: false },
  loadingAnalytics: { type: Boolean, default: false },
  isAdmin:          { type: Boolean, default: false },
  scopeLabel:       { type: String,  default: "" },
  sales:            { type: Object,  default: () => ({}) },
  analytics:        { type: Object,  default: null },
  period:           { type: String,  default: "12m" },
  branches:         { type: Array,   default: () => [] },
  selectedBranch:   { type: Number,  default: null },
});
const emit = defineEmits(["period-change", "branch-change"]);

const periodItems = [
  { title: "Última semana", value: "7d"  },
  { title: "Último mes",    value: "30d" },
  { title: "3 meses",       value: "90d" },
  { title: "Último año",    value: "12m" },
];

// Default: "Último año" — visión amplia al entrar al dashboard.
const periodLocal   = ref(props.period || "12m");
const productToggle = ref("total");
const periodRefs    = ref([]);

watch(() => props.period, (v) => { if (v && v !== periodLocal.value) periodLocal.value = v; });
function emitPeriod(v) { periodLocal.value = v; emit("period-change", v); }

// Indicador deslizante para los pills de período. Se posiciona sobre el pill
// activo via CSS vars (--pill-x, --pill-w) que se recalculan al cambiar.
const periodIndicatorStyle = ref({ "--pill-x": "0px", "--pill-w": "0px" });
function updatePeriodIndicator() {
  const idx = periodItems.findIndex((p) => p.value === periodLocal.value);
  const el = periodRefs.value?.[idx];
  if (!el) return;
  periodIndicatorStyle.value = {
    "--pill-x": `${el.offsetLeft}px`,
    "--pill-w": `${el.offsetWidth}px`,
  };
}
watch(periodLocal, () => { nextTick(updatePeriodIndicator); });
onMounted(() => { nextTick(updatePeriodIndicator); });
if (typeof window !== "undefined") {
  window.addEventListener("resize", () => updatePeriodIndicator());
}

// Rango de fechas legible para el período seleccionado (ej: "1 abr → 30 abr").
const periodRangeLabel = computed(() => {
  const now = new Date();
  const fmt = (d) => d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  if (periodLocal.value === "all") return "todo el historial";
  let from = new Date(now);
  if (periodLocal.value === "7d")  from.setDate(now.getDate() - 6);
  else if (periodLocal.value === "30d") from.setDate(now.getDate() - 29);
  else if (periodLocal.value === "90d") from.setDate(now.getDate() - 89);
  else if (periodLocal.value === "12m") { from = new Date(now); from.setMonth(now.getMonth() - 11); from.setDate(1); }
  return `${fmt(from)} → ${fmt(now)}`;
});
function onBranchChange(e) {
  const val = e.target.value;
  emit("branch-change", val === "" || val === null ? null : Number(val));
}

const currentBranchLabel = computed(() => {
  if (!props.selectedBranch) return "Todas las sucursales";
  const found = props.branches.find(b => b.id === props.selectedBranch);
  return found?.name || `Sucursal #${props.selectedBranch}`;
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function num(v) { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; }
function money(val) {
  const n = Number(val || 0);
  try { return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n); }
  catch { return `$ ${Math.round(n)}`; }
}
function shortNumber(v) {
  const n = Number(v || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return `${Math.round(n)}`;
}
function dt(val) { if (!val) return "—"; return new Date(val).toLocaleString("es-AR"); }
function parseYMDToMs(ymd) {
  if (!ymd) return null;
  const s = String(ymd);
  if (s.length >= 10) {
    const y = Number(s.slice(0,4)), m = Number(s.slice(5,7)), d = Number(s.slice(8,10));
    if (!y || !m || !d) return null;
    return new Date(y, m-1, d).getTime();
  }
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : null;
}
function fmtDMFromMs(ms) {
  if (!ms) return "—";
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
}
function monthKey(ymd) { const s = String(ymd || ""); return s.length >= 7 ? s.slice(0,7) : "—"; }
function monthLabel(ym) {
  if (!ym || ym === "—") return "—";
  const [y, m] = String(ym).split("-");
  return new Date(Number(y||2000), Number(m||1)-1, 1)
    .toLocaleDateString("es-AR", { year: "numeric", month: "long" });
}
function methodLabel(m) {
  const x = String(m || "").toUpperCase().trim();
  if (["CASH", "EFECTIVO"].includes(x))                          return "Efectivo";
  if (["CARD", "TARJETA", "DEBIT", "DEBITO"].includes(x))        return "Tarjeta / Débito";
  if (["TRANSFER", "TRANSFERENCIA"].includes(x))                 return "Transferencia";
  if (["QR", "MERCADOPAGO", "MERCADO_PAGO", "MP"].includes(x))   return "Mercado Pago";
  if (["CREDIT_SJT", "CREDITO_SJT", "CREDITSANJUAN"].includes(x)) return "Crédito San Juan";
  if (["CREDIT", "CREDITO", "CREDIT_1", "CUOTAS"].includes(x))   return "Crédito";
  if (x === "OTHER")                                             return "Otro";
  return m || "—";
}
function methodBadgeClass(m) {
  const x = String(m || "").toUpperCase().trim();
  if (["CASH", "EFECTIVO"].includes(x))                        return "mb-cash";
  if (["CARD", "TARJETA", "DEBIT", "DEBITO"].includes(x))      return "mb-card";
  if (["TRANSFER", "TRANSFERENCIA"].includes(x))               return "mb-transfer";
  if (["QR", "MERCADOPAGO", "MERCADO_PAGO", "MP"].includes(x)) return "mb-mp";
  if (["CREDIT_SJT", "CREDITO_SJT", "CREDITSANJUAN"].includes(x)) return "mb-sjt";
  if (["CREDIT", "CREDITO", "CREDIT_1", "CUOTAS"].includes(x)) return "mb-credit";
  return "mb-other";
}
function invoiceColor(t) {
  const x = String(t || "").toUpperCase();
  if (x === "A")      return "blue";
  if (x === "B")      return "green";
  if (x === "C")      return "purple";
  if (x === "TICKET") return "orange";
  return "grey";
}
function pctVal(v) { return Number(v || 0); }

// ─── Period labels ─────────────────────────────────────────────────────────
const periodLabel = computed(() => {
  if (periodLocal.value === "7d")  return "Última semana";
  if (periodLocal.value === "90d") return "Últimos 3 meses";
  if (periodLocal.value === "12m") return "Último año";
  return "Último mes";
});
const periodLabelShort = computed(() => {
  if (periodLocal.value === "7d")  return "7d";
  if (periodLocal.value === "90d") return "3m";
  if (periodLocal.value === "12m") return "12m";
  return "Mes";
});
const scopeLabelChip = computed(() => props.scopeLabel || "");

// ─── Base data ──────────────────────────────────────────────────────────────
const today  = computed(() => props.sales?.today  || { count:0, total:0, avgTicket:0 });
const week   = computed(() => props.sales?.week   || { count:0, total:0 });
const month  = computed(() => props.sales?.month  || { count:0, total:0 });

const salesDaily    = computed(() => {
  if (Array.isArray(props.sales?.salesByPeriodDaily)) return props.sales.salesByPeriodDaily;
  return Array.isArray(props.sales?.salesByDay30) ? props.sales.salesByDay30 : [];
});
const lastSales     = computed(() => Array.isArray(props.sales?.lastSales)             ? props.sales.lastSales            : []);
const topCashiers   = computed(() => {
  if (Array.isArray(props.sales?.topCashiersPeriod)) return props.sales.topCashiersPeriod;
  return Array.isArray(props.sales?.topCashiers30d) ? props.sales.topCashiers30d : [];
});
const topProducts   = computed(() => {
  if (Array.isArray(props.sales?.topProductsPeriod)) return props.sales.topProductsPeriod;
  return Array.isArray(props.sales?.topProducts30d) ? props.sales.topProducts30d : [];
});
const bestMonth     = computed(() => props.sales?.bestMonthPeriod || props.sales?.bestMonth12m || null);
const salesByHour   = computed(() => Array.isArray(props.sales?.salesByHour)           ? props.sales.salesByHour          : []);
const salesByPaymentPeriod = computed(() => Array.isArray(props.sales?.salesByPaymentPeriod) ? props.sales.salesByPaymentPeriod : []);
const salesByInvoiceType   = computed(() => Array.isArray(props.sales?.salesByInvoiceType)   ? props.sales.salesByInvoiceType   : []);

// ─── Trend values ────────────────────────────────────────────────────────────
const trendWeekPct  = computed(() => pctVal(props.sales?.trend?.week_total_pct));
const trendMonthPct = computed(() => pctVal(props.sales?.trend?.month_total_pct));

// ─── Timeline ────────────────────────────────────────────────────────────────
const timelinePoints = computed(() =>
  (salesDaily.value || [])
    .map(x => ({ date: x?.date, ms: parseYMDToMs(x?.date), total: num(x?.total), count: num(x?.count) }))
    .filter(p => !!p.ms)
    .sort((a,b) => a.ms - b.ms)
);
const peakPoint   = computed(() => timelinePoints.value.reduce((best,p) => (!best || p.total > best.total) ? p : best, null));
const peakMax     = computed(() => Number(peakPoint.value?.total || 0));
const peakDateFmt = computed(() => fmtDMFromMs(peakPoint.value?.ms));
// Pico ajustado al bucket visible del chart (para alinear la anotación)
const peakDisplayPoint = computed(() => timelineDisplayPoints.value.reduce(
  (best, p) => (!best || p.total > best.total) ? p : best, null,
));
const avgPerDay   = computed(() => {
  const arr = timelinePoints.value;
  return arr.length ? arr.reduce((a,p) => a + p.total, 0) / arr.length : 0;
});
const nonZeroDays  = computed(() => timelinePoints.value.filter(p => p.total > 0).length);
const periodTotal  = computed(() => timelinePoints.value.reduce((a,p) => a + p.total, 0));
const periodCount  = computed(() => timelinePoints.value.reduce((a,p) => a + p.count, 0));
const avgTicketPeriod = computed(() => {
  const total = periodTotal.value;
  const count = timelinePoints.value.reduce((a,p) => a + p.count, 0);
  return count > 0 ? total / count : 0;
});
const bestMonthLabel = computed(() => bestMonth.value ? monthLabel(bestMonth.value.ym) : "—");

// Agrupa puntos según volumen para evitar gráficos saturados:
//   ≤35 puntos  → por día (semana / mes)
//   ≤90 puntos  → por semana (3 meses)
//   >90 puntos  → por mes (año o más)
const timelineGranularity = computed(() => {
  const n = timelinePoints.value.length;
  if (n <= 35) return "day";
  if (n <= 90) return "week";
  return "month";
});
const timelineGranularityLabel = computed(() => ({
  day: "Por día",
  week: "Por semana",
  month: "Por mes",
}[timelineGranularity.value] || "Por día"));
function startOfWeekMs(ms) {
  const d = new Date(ms);
  const dow = d.getDay();
  const diff = (dow === 0 ? -6 : 1 - dow);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
function startOfMonthMs(ms) {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}
const timelineDisplayPoints = computed(() => {
  const g = timelineGranularity.value;
  if (g === "day") return timelinePoints.value;
  const bucketKey = g === "week" ? startOfWeekMs : startOfMonthMs;
  const map = new Map();
  for (const p of timelinePoints.value) {
    const k = bucketKey(p.ms);
    const acc = map.get(k) || { ms: k, total: 0, count: 0 };
    acc.total += p.total;
    acc.count += p.count;
    map.set(k, acc);
  }
  return [...map.values()].sort((a, b) => a.ms - b.ms);
});
const seriesTimeline = computed(() => [
  { name: "Ventas", type: "area", data: timelineDisplayPoints.value.map(p => [p.ms, Math.round(p.total)]) },
]);
const timelineTickAmount = computed(() => {
  const n = timelineDisplayPoints.value.length;
  if (n <= 7) return n;
  if (n <= 14) return 7;
  if (n <= 35) return 10;
  return 12;
});

// ─── Payment Method Donut ─────────────────────────────────────────────────
const pmColors = { CASH: "#1488d1", CARD: "#2a96d6", TRANSFER: "#3fa3db", QR: "#54b0e0", CREDIT_SJT: "#1078bb", CREDIT: "#1387cd", OTHER: "#69bde5" };
function pmColor(method) {
  const x = String(method || "").toUpperCase();
  if (["QR","MERCADOPAGO","MERCADO_PAGO","MP"].includes(x)) return pmColors.QR;
  if (["CASH","EFECTIVO"].includes(x))                      return pmColors.CASH;
  if (["CARD","TARJETA","DEBIT","DEBITO"].includes(x))      return pmColors.CARD;
  if (["TRANSFER","TRANSFERENCIA"].includes(x))             return pmColors.TRANSFER;
  if (["CREDIT_SJT","CREDITO_SJT","CREDITSANJUAN"].includes(x)) return pmColors.CREDIT_SJT;
  if (["CREDIT","CREDITO","CREDIT_1","CUOTAS"].includes(x)) return pmColors.CREDIT;
  return pmColors[x] || "#a8def5";
}

// Fusiona entradas con el mismo label normalizado (ej: QR + MERCADOPAGO → un solo grupo)
const paymentPeriodMerged = computed(() => {
  const map = new Map();
  for (const p of salesByPaymentPeriod.value) {
    const label = methodLabel(p.method);
    const prev  = map.get(label) || { label, method: p.method, total: 0, count: 0 };
    prev.total += Number(p.total || 0);
    prev.count += Number(p.count || 0);
    map.set(label, prev);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
});

const paymentPeriodSeries = computed(() => paymentPeriodMerged.value.map(p => p.total));
const paymentPeriodLabels = computed(() => paymentPeriodMerged.value.map(p => p.label));
const paymentPeriodColors = computed(() => paymentPeriodMerged.value.map(p => pmColor(p.method)));
const paymentPeriodTotal  = computed(() => paymentPeriodMerged.value.reduce((a,p) => a + p.total, 0));

// ─── Hourly ───────────────────────────────────────────────────────────────
const hourlyHasData = computed(() => salesByHour.value.some(h => h.total > 0));
const seriesHourly  = computed(() => [{ name: "Ventas ($)", data: salesByHour.value.map(h => Math.round(h.total)) }]);
const hourLabels    = computed(() => salesByHour.value.map(h => `${String(h.hour).padStart(2,"0")}h`));
const peakHour      = computed(() => {
  const arr = salesByHour.value;
  if (!arr.length) return null;
  const max   = Math.max(...arr.map(h => h.total));
  const found = arr.find(h => h.total === max);
  return found && found.total > 0 ? found.hour : null;
});

// ─── Monthly Agg ─────────────────────────────────────────────────────────
const monthsAgg = computed(() => {
  const map = new Map();
  for (const p of timelinePoints.value) {
    const ym = monthKey(p.date);
    if (ym === "—") continue;
    const prev = map.get(ym) || { ym, total: 0, count: 0 };
    prev.total += p.total; prev.count += p.count;
    map.set(ym, prev);
  }
  return Array.from(map.values()).filter(m => m.ym).sort((a,b) => a.ym.localeCompare(b.ym));
});
const seriesMonths = computed(() => [{ name: "Total ($)", data: monthsAgg.value.map(m => Math.round(m.total)) }]);
const monthsLabels = computed(() => monthsAgg.value.map(m => monthLabel(m.ym)));

// ─── Top Cashiers ─────────────────────────────────────────────────────────
const topCashiers10 = computed(() =>
  [...(topCashiers.value || [])].sort((a,b) => Number(b.total||0) - Number(a.total||0)).slice(0,10)
);
const cashierCats   = computed(() => topCashiers10.value.map(x => String(x?.user_label || x?.user_name || x?.name || (x?.user_id ? `User #${x.user_id}` : "—"))));
const cashierBranches = computed(() => topCashiers10.value.map(x => x?.branch_name || null));
const seriesCashiers = computed(() => [{ name: "Total ($)", data: topCashiers10.value.map(x => Math.round(Number(x?.total||0))) }]);

// ─── Invoice Type ─────────────────────────────────────────────────────────
const invoiceTypeMap    = { TICKET:"Ticket", A:"Factura A", B:"Factura B", C:"Factura C", M:"Factura M", NC:"Nota Crédito", ND:"Nota Débito", NO_FISCAL:"No Fiscal" };
const invoiceTypeColors = { TICKET:"#1488d1", B:"#2a96d6", A:"#1078bb", C:"#3fa3db", M:"#1387cd", NC:"#54b0e0", ND:"#69bde5", NO_FISCAL:"#7ec9ea" };
const invoiceTypeSeries = computed(() => salesByInvoiceType.value.map(t => Number(t.count||0)));
const invoiceTypeLabels = computed(() => salesByInvoiceType.value.map(t => invoiceTypeMap[t.invoice_type] || t.invoice_type));
const invoiceTypeClrs   = computed(() => salesByInvoiceType.value.map(t => invoiceTypeColors[t.invoice_type] || "#7ec9ea"));
const invoiceTypeTotal  = computed(() => salesByInvoiceType.value.reduce((a,t) => a + Number(t.count||0), 0));

// ─── Top Products ─────────────────────────────────────────────────────────
const topProducts10 = computed(() => {
  const arr = [...(topProducts.value||[])].sort((a,b) =>
    productToggle.value === "units" ? Number(b.units||0) - Number(a.units||0) : Number(b.total||0) - Number(a.total||0)
  );
  return arr.slice(0,10);
});
const productCats   = computed(() => topProducts10.value.map(x => String(x?.product_name||x?.name||(x?.product_id?`#${x.product_id}`:"—"))));
const seriesProducts = computed(() => {
  if (productToggle.value === "units")
    return [{ name: "Unidades", data: topProducts10.value.map(x => Number(x?.units||0)) }];
  return [{ name: "Total ($)", data: topProducts10.value.map(x => Math.round(Number(x?.total||0))) }];
});

// ─── Branch Donut ─────────────────────────────────────────────────────────
const salesByBranch = computed(() => {
  if (Array.isArray(props.sales?.salesByBranchPeriod)) return props.sales.salesByBranchPeriod;
  const map = new Map();
  for (const s of lastSales.value) {
    const bid  = s?.branch_id ?? s?.branch?.id ?? null;
    const name = s?.branch?.name || (bid ? `Sucursal #${bid}` : "—");
    const key  = String(bid ?? name);
    const prev = map.get(key) || { branch_id: bid, branch_name: name, total: 0, count: 0 };
    prev.total += Number(s?.total||0); prev.count++;
    map.set(key, prev);
  }
  return Array.from(map.values()).sort((a,b) => Number(b.total||0) - Number(a.total||0));
});
const branchColors   = ["#1488d1","#2a96d6","#3fa3db","#54b0e0","#1078bb","#1387cd","#69bde5","#7ec9ea"];
const branchTop      = computed(() => salesByBranch.value.slice(0,8));
const branchLabels   = computed(() => branchTop.value.map(b => b.branch_name || `Sucursal #${b.branch_id}`));
const branchSeries   = computed(() => branchTop.value.map(b => Number(b.total||0)));
const branchTotalSum = computed(() => branchTop.value.reduce((a,b) => a + Number(b.total||0), 0));

// ─── Apex common ──────────────────────────────────────────────────────────
const apexCommon = {
  chart: { toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: true, speed: 350 }, fontFamily: "inherit", foreColor: "rgba(var(--v-theme-on-surface), 0.70)" },
  grid: { borderColor: "rgba(var(--v-theme-on-surface), 0.07)", padding: { left: 12, right: 14, top: 4, bottom: 0 } },
  dataLabels: { enabled: false },
  legend: { labels: { colors: "rgba(var(--v-theme-on-surface), 0.70)" } },
};
const axisStyle  = { colors: "rgba(var(--v-theme-on-surface), 0.55)" };
const axisBorder = { color: "rgba(var(--v-theme-on-surface), 0.10)" };

// ─── Chart options ────────────────────────────────────────────────────────
const optTimeline = computed(() => {
  const g = timelineGranularity.value;
  const fmtX = (val) => {
    const d = new Date(Number(val));
    if (g === "month") return d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
    if (g === "week")  return `Sem ${d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}`;
    return fmtDMFromMs(Number(val));
  };
  const fmtTooltipX = (val) => {
    const d = new Date(Number(val));
    if (g === "month") return d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
    if (g === "week")  return `Semana del ${d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}`;
    return d.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit" });
  };
  return {
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "area" },
  colors: ["#1488d1"],
  stroke: { width: 2.5, curve: "smooth" },
  fill: {
    type: "gradient",
    gradient: { shade: "dark", type: "vertical", opacityFrom: 0.32, opacityTo: 0.02, stops: [0, 90, 100] },
  },
  markers: { size: 0, strokeWidth: 0, hover: { size: 6 } },
  xaxis: {
    type: "datetime",
    tickAmount: timelineTickAmount.value,
    labels: { style: axisStyle, datetimeUTC: false, formatter: fmtX },
    axisBorder, axisTicks: axisBorder,
    tooltip: { enabled: false },
  },
  yaxis: { tickAmount: 5, labels: { style: axisStyle, formatter: (v) => shortNumber(v) } },
  tooltip: {
    theme: "dark", shared: true, intersect: false,
    x: { formatter: fmtTooltipX },
    y: {
      formatter: (v, { dataPointIndex }) => {
        const p = timelineDisplayPoints.value[dataPointIndex];
        const txCount = p?.count || 0;
        return `${money(v)} · ${txCount} ${txCount === 1 ? "venta" : "ventas"}`;
      },
    },
  },
  legend: { show: false },
  annotations: peakDisplayPoint.value && peakDisplayPoint.value.total > 0 ? {
    points: [{
      x: peakDisplayPoint.value.ms,
      y: peakDisplayPoint.value.total,
      marker: { size: 5, fillColor: "#1488d1" },
      label: { text: `Pico ${money(peakMax.value)}`, style: { fontSize: "11px", background: "#1488d120", color: "#1488d1", border: "none" } },
    }],
  } : {},
};
});

const optPaymentDonut = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "donut" },
  labels: paymentPeriodLabels.value,
  colors: paymentPeriodColors.value,
  stroke: { width: 0 },
  plotOptions: {
    pie: { donut: { size: "66%", labels: { show: true, total: { show: true, label: "Total", color: "rgba(var(--v-theme-on-surface), 0.6)", formatter: () => money(paymentPeriodTotal.value) } } } },
  },
  legend: { show: true, position: "bottom", labels: { colors: "rgba(var(--v-theme-on-surface), 0.70)" } },
  tooltip: { theme: "dark", y: { formatter: (v) => `${money(v)} · ${paymentPeriodTotal.value ? Math.round((v/paymentPeriodTotal.value)*100) : 0}%` } },
}));

const optMonthsBar = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  colors: ["#1488d1"],
  fill: { type: "solid", opacity: 1 },
  stroke: { show: false },
  plotOptions: { bar: { borderRadius: 5, columnWidth: "56%", dataLabels: { position: "top" } } },
  xaxis: { categories: monthsLabels.value, labels: { style: { ...axisStyle, fontSize: "11px" }, rotate: -20, trim: true }, axisBorder, axisTicks: axisBorder },
  yaxis: { labels: { style: axisStyle, formatter: (v) => shortNumber(v) } },
  tooltip: { theme: "dark", y: { formatter: (v) => money(v) } },
}));

const optHourly = computed(() => {
  const maxT = Math.max(...salesByHour.value.map(h => h.total), 1);
  const colors = salesByHour.value.map(h => {
    const r = h.total / maxT;
    if (r > 0.7)  return "#1488d1";
    if (r > 0.4)  return "rgba(20, 136, 209, 0.75)";
    if (r > 0.1)  return "rgba(20, 136, 209, 0.45)";
    return "rgba(var(--v-theme-on-surface), 0.10)";
  });
  return {
    ...apexCommon,
    chart: { ...apexCommon.chart, type: "bar" },
    colors: ["#1488d1"],
    fill: { opacity: 1, colors },
    stroke: { show: false },
    plotOptions: { bar: { borderRadius: 3, columnWidth: "70%", distributed: true } },
    xaxis: { categories: hourLabels.value, labels: { style: { ...axisStyle, fontSize: "9px" } }, axisBorder, axisTicks: axisBorder },
    yaxis: { labels: { style: axisStyle, formatter: (v) => shortNumber(v) } },
    legend: { show: false },
    tooltip: {
      theme: "dark",
      y: { formatter: (v, ctx) => {
        const h = salesByHour.value[ctx.dataPointIndex];
        return `${money(v)} · ${h?.count||0} ventas`;
      }},
    },
  };
});

const optCashiersBar = computed(() => {
  const data = topCashiers10.value.map(x => Math.round(Number(x?.total || 0)));
  const maxVal = Math.max(...data, 1);
  const labelColors = data.map(v => v / maxVal >= 0.18
    ? "#ffffff"
    : "rgba(var(--v-theme-on-surface), 0.85)");
  return {
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  colors: ["#1488d1"],
  fill: { type: "solid", opacity: 1 },
  stroke: { show: false },
  plotOptions: { bar: { horizontal: true, borderRadius: 5, borderRadiusApplication: "end", barHeight: "55%", dataLabels: { position: "bottom" } } },
  dataLabels: { enabled: true, offsetX: 8, style: { fontSize: "12px", fontWeight: 500, fontFamily: "inherit", colors: labelColors }, formatter: (v) => shortNumber(v) },
  xaxis: { categories: cashierCats.value, labels: { style: axisStyle, formatter: (v) => shortNumber(v) }, axisBorder, axisTicks: axisBorder },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "12px", fontFamily: "inherit" }, maxWidth: 150 } },
  tooltip: { theme: "dark", y: { formatter: (v, ctx) => {
    const c = topCashiers10.value[ctx.dataPointIndex];
    const branch = c?.branch_name ? ` · ${c.branch_name}` : "";
    return `${money(v)} · ${c?.count||0} ventas${branch}`;
  }}},
};
});

const optInvoiceType = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "donut" },
  labels: invoiceTypeLabels.value,
  colors: invoiceTypeClrs.value,
  stroke: { width: 0 },
  plotOptions: {
    pie: { donut: { size: "64%", labels: { show: true, total: { show: true, label: "Total", formatter: () => `${invoiceTypeTotal.value}` } } } },
  },
  legend: { show: true, position: "bottom", labels: { colors: "rgba(var(--v-theme-on-surface), 0.70)" } },
  tooltip: { theme: "dark", y: { formatter: (v) => `${v} ventas · ${invoiceTypeTotal.value ? Math.round((v/invoiceTypeTotal.value)*100) : 0}%` } },
}));

const optProductsBar = computed(() => {
  const data = (seriesProducts.value?.[0]?.data || []).map(v => Number(v) || 0);
  const maxVal = Math.max(...data, 1);
  const labelColors = data.map(v => v / maxVal >= 0.18
    ? "#ffffff"
    : "rgba(var(--v-theme-on-surface), 0.85)");
  return {
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  colors: ["#1488d1"],
  fill: { type: "solid", opacity: 1 },
  stroke: { show: false },
  plotOptions: { bar: { horizontal: true, borderRadius: 5, borderRadiusApplication: "end", barHeight: "52%", dataLabels: { position: "bottom" } } },
  dataLabels: {
    enabled: true, offsetX: 6,
    style: { fontSize: "12px", fontWeight: 500, fontFamily: "inherit", colors: labelColors },
    formatter: (v) => productToggle.value === "units" ? `${Math.round(Number(v||0))} u.` : shortNumber(v),
  },
  xaxis: {
    categories: productCats.value,
    labels: { style: axisStyle, formatter: (v) => productToggle.value === "units" ? `${Math.round(Number(v||0))}` : shortNumber(v) },
    axisBorder, axisTicks: axisBorder,
  },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "12px", fontFamily: "inherit" }, maxWidth: 200 } },
  tooltip: { theme: "dark", y: { formatter: (v) => productToggle.value === "units" ? `${Math.round(Number(v||0))} unidades` : money(v) } },
};
});

const optBranchDonut = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "donut" },
  labels: branchLabels.value,
  colors: ["#1488d1","#2a96d6","#3fa3db","#54b0e0","#1078bb","#1387cd","#69bde5","#7ec9ea"],
  stroke: { width: 0 },
  plotOptions: {
    pie: { donut: { size: "66%", labels: { show: true, total: { show: true, label: "Total", formatter: () => money(branchTotalSum.value) } } } },
  },
  legend: { show: true, position: "bottom", labels: { colors: "rgba(var(--v-theme-on-surface), 0.70)" } },
  tooltip: { theme: "dark", y: { formatter: (v) => `${money(v)} · ${branchTotalSum.value ? Math.round((v/branchTotalSum.value)*100) : 0}%` } },
}));

// ─── Dynamic chart heights ────────────────────────────────────────────────
// Ambos charts comparten la altura del que tenga más items para que las cards
// queden alineadas sin espacios muertos. Las barras se distribuyen automáticamente.
const sharedRankingHeight = computed(() => Math.max(
  180,
  branchTop.value.length * 44,
  topCashiers10.value.length * 44,
));
const branchBarHeight   = sharedRankingHeight;
const cashierBarHeight  = sharedRankingHeight;

// ─── Branch ranking bar ───────────────────────────────────────────────────
const seriesBranchBar = computed(() => [{
  name: "Total ($)",
  data: branchTop.value.map(b => Math.round(Number(b.total || 0))),
}]);

const optBranchBar = computed(() => {
  const data = branchTop.value.map(b => Math.round(Number(b.total || 0)));
  const maxVal = Math.max(...data, 1);
  const labelColors = data.map(v => v / maxVal >= 0.18
    ? "#ffffff"
    : "rgba(var(--v-theme-on-surface), 0.85)");
  return {
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  colors: ["#1488d1"],
  fill: { type: "solid", opacity: 1 },
  stroke: { show: false },
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 6,
      borderRadiusApplication: "end",
      barHeight: "58%",
      distributed: false,
      dataLabels: { position: "bottom" },
    },
  },
  dataLabels: {
    enabled: true,
    offsetX: 10,
    style: { fontSize: "12px", fontWeight: 500, fontFamily: "inherit", colors: labelColors },
    formatter: (v) => `$ ${shortNumber(v)}`,
  },
  xaxis: {
    categories: branchTop.value.map(b => b.branch_name || `Sucursal #${b.branch_id}`),
    labels: { style: { ...axisStyle, fontSize: "11px" }, formatter: shortNumber },
    axisBorder, axisTicks: axisBorder,
  },
  yaxis: {
    labels: { style: { ...axisStyle, fontSize: "12px", fontWeight: 500, fontFamily: "inherit" }, maxWidth: 160 },
  },
  grid: { ...apexCommon.grid, padding: { ...apexCommon.grid.padding, left: 8, right: 20 } },
  legend: { show: false },
  tooltip: {
    theme: "dark",
    y: { formatter: (v, { dataPointIndex }) => {
      const b = branchTop.value[dataPointIndex];
      return `${money(v)} · ${b?.count || 0} ventas`;
    }},
  },
};
});

// ─── Cashier ranking bar ─────────────────────────────────────────────────
const seriesCashierRanking = computed(() => [{
  name: "Total ($)",
  data: topCashiers10.value.map(x => Math.round(Number(x?.total || 0))),
}]);

const optCashierRanking = computed(() => {
  const data = topCashiers10.value.map(x => Math.round(Number(x?.total || 0)));
  const maxVal = Math.max(...data, 1);
  const labelColors = data.map(v => v / maxVal >= 0.18
    ? "#ffffff"
    : "rgba(var(--v-theme-on-surface), 0.85)");
  return {
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  colors: ["#1488d1"],
  fill: { type: "solid", opacity: 1 },
  stroke: { show: false },
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 7,
      borderRadiusApplication: "end",
      barHeight: "52%",
      distributed: false,
      dataLabels: { position: "bottom" },
    },
  },
  dataLabels: {
    enabled: true,
    offsetX: 10,
    style: { fontSize: "12px", fontWeight: 500, fontFamily: "inherit", colors: labelColors },
    formatter: (v) => `$ ${shortNumber(v)}`,
  },
  xaxis: {
    categories: cashierCats.value,
    labels: { style: { ...axisStyle, fontSize: "11px" }, formatter: shortNumber },
    axisBorder, axisTicks: axisBorder,
  },
  yaxis: {
    labels: {
      style: { ...axisStyle, fontSize: "12px", fontWeight: 500, fontFamily: "inherit" },
      maxWidth: 160,
    },
  },
  grid: { ...apexCommon.grid, padding: { ...apexCommon.grid.padding, left: 8, right: 20 } },
  legend: { show: false },
  tooltip: {
    theme: "dark",
    y: { formatter: (v, { dataPointIndex }) => {
      const c = topCashiers10.value[dataPointIndex];
      const branch = c?.branch_name ? ` · ${c.branch_name}` : "";
      return `${money(v)} · ${c?.count || 0} ventas${branch}`;
    }},
  },
};
});

// ─── Table headers ───────────────────────────────────────────────────────
const headers = [
  { title: "ID",          key: "id",           sortable: false, width: 80  },
  { title: "Fecha",       key: "sold_at",       sortable: false, width: 180 },
  { title: "Sucursal",    key: "branch",        sortable: false, width: 160 },
  { title: "Vendedor",    key: "user",          sortable: false, width: 180 },
  { title: "Comprobante", key: "invoice_type",  sortable: false, width: 130 },
  { title: "Total",       key: "total",         sortable: false, width: 150 },
];

// ─── Analytics deep ──────────────────────────────────────────────────────
const ana = computed(() => props.analytics || {});

const DOW_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const heatmapData = computed(() => {
  const rows = Array.isArray(ana.value?.heatmap) ? ana.value.heatmap : [];
  return DOW_LABELS.map((label, dow) => ({
    name: label,
    data: Array.from({ length: 24 }, (_, h) => {
      const r = rows.find(x => num(x.dow) === dow && num(x.hour) === h);
      return { x: `${String(h).padStart(2,"0")}h`, y: num(r?.count), total: num(r?.total) };
    }),
  }));
});
const heatmapHasData = computed(() => {
  const rows = Array.isArray(ana.value?.heatmap) ? ana.value.heatmap : [];
  return rows.some(r => num(r.count) > 0);
});
const optHeatmap = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "heatmap" },
  dataLabels: { enabled: false },
  plotOptions: {
    heatmap: {
      shadeIntensity: 0.8,
      radius: 3,
      colorScale: {
        ranges: [
          { from: 0, to: 0,      color: "rgba(var(--v-theme-on-surface), 0.04)", name: "Sin ventas" },
          { from: 1, to: 3,      color: "rgba(20, 136, 209, 0.30)", name: "Bajo" },
          { from: 4, to: 10,     color: "rgba(20, 136, 209, 0.65)", name: "Medio" },
          { from: 11, to: 99999, color: "#1488d1", name: "Alto" },
        ],
      },
    },
  },
  stroke: { width: 1.5, colors: ["rgba(var(--v-theme-surface), 1)"] },
  xaxis: { labels: { style: { ...axisStyle, fontSize: "9px" } }, axisBorder, axisTicks: axisBorder },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "11px" } } },
  tooltip: { theme: "dark", y: { formatter: (v, { seriesIndex, dataPointIndex, w }) => {
    const total = w.config.series?.[seriesIndex]?.data?.[dataPointIndex]?.total;
    return `${v} ventas${total ? ` · ${money(total)}` : ""}`;
  }}},
}));

const methodColors2 = { CASH: "#1488d1", CARD: "#2a96d6", TRANSFER: "#3fa3db", QR: "#54b0e0", OTHER: "#1078bb" };
const paymentTrendRows    = computed(() => Array.isArray(ana.value?.paymentTrend) ? ana.value.paymentTrend : []);
const paymentTrendMonths  = computed(() => [...new Set(paymentTrendRows.value.map(r => r.ym))].sort());
const paymentTrendMethods = computed(() => [...new Set(paymentTrendRows.value.map(r => r.method))]);
const seriesPaymentTrend  = computed(() =>
  paymentTrendMethods.value.map(m => ({
    name: methodLabel(m),
    data: paymentTrendMonths.value.map(ym => {
      const r = paymentTrendRows.value.find(x => x.ym === ym && x.method === m);
      return num(r?.total);
    }),
    color: methodColors2[m] || "#7ec9ea",
  }))
);
const optPaymentTrend = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar", stacked: true },
  plotOptions: { bar: { columnWidth: "60%", borderRadius: 4 } },
  dataLabels: { enabled: false },
  xaxis: { categories: paymentTrendMonths.value, labels: { style: { ...axisStyle, fontSize: "11px" }, rotate: -20 } },
  yaxis: { labels: { style: axisStyle, formatter: shortNumber } },
  legend: { show: true, position: "top", labels: { colors: "rgba(var(--v-theme-on-surface), 0.70)" } },
  tooltip: { theme: "dark", y: { formatter: (v) => money(v) } },
}));

const discounts   = computed(() => ana.value?.discounts   || {});
const refunds     = computed(() => ana.value?.refunds     || {});
const cancelled   = computed(() => ana.value?.cancelled   || {});
const itemsStats  = computed(() => ana.value?.items       || {});

const topCustomers       = computed(() => Array.isArray(ana.value?.topCustomers) ? ana.value.topCustomers.slice(0,10) : []);
const seriesTopCustomers = computed(() => [{ name: "Total $", data: topCustomers.value.map(r => num(r.total)) }]);
const optTopCustomers    = computed(() => {
  const data = topCustomers.value.map(r => num(r.total));
  const maxVal = Math.max(...data, 1);
  const labelColors = data.map(v => v / maxVal >= 0.18
    ? "#ffffff"
    : "rgba(var(--v-theme-on-surface), 0.85)");
  return {
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: "60%", distributed: true, dataLabels: { position: "bottom" } } },
  dataLabels: {
    enabled: true,
    formatter: (v) => `$ ${shortNumber(v)}`,
    style: { fontSize: "12px", fontWeight: 500, fontFamily: "inherit", colors: labelColors },
    offsetX: 8,
  },
  xaxis: {
    categories: topCustomers.value.map(r => r.name?.length > 22 ? r.name.slice(0,20)+"…" : r.name),
    labels: { style: axisStyle, formatter: shortNumber },
  },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "12px", fontFamily: "inherit" }, maxWidth: 190 } },
  legend: { show: false },
  tooltip: { theme: "dark", y: { formatter: (v, { dataPointIndex }) => {
    const r = topCustomers.value[dataPointIndex];
    return `${money(v)} · ${r?.count} visitas`;
  }}},
  colors: ["#1488d1","#2a96d6","#3fa3db","#54b0e0","#1078bb","#1387cd","#69bde5","#7ec9ea","#0d70b1","#92d4ee"],
};
});

const dowTicket    = computed(() => Array.isArray(ana.value?.avgTicketByDow) ? ana.value.avgTicketByDow : []);
const seriesAvgDow = computed(() => [{ name: "Ticket promedio", data: dowTicket.value.map(r => Math.round(num(r.avgTicket))) }]);
const optAvgDow    = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  plotOptions: { bar: { columnWidth: "58%", borderRadius: 6, distributed: true, dataLabels: { position: "top" } } },
  dataLabels: {
    enabled: true,
    formatter: (v) => v > 0 ? `$ ${shortNumber(v)}` : "",
    style: { fontSize: "11.5px", fontWeight: "700", colors: ["rgba(255,255,255,0.88)"] },
    offsetY: -6,
    background: { enabled: false },
  },
  xaxis: { categories: DOW_LABELS, labels: { style: { ...axisStyle, fontSize: "12.5px", fontWeight: "600" } } },
  yaxis: { labels: { style: axisStyle, formatter: shortNumber }, tickAmount: 4 },
  legend: { show: false },
  tooltip: { theme: "dark", y: { formatter: (v, { dataPointIndex }) => {
    const r = dowTicket.value[dataPointIndex];
    return `${money(v)} · ${r?.count} ventas`;
  }}},
  colors: ["#1488d1","#2a96d6","#3fa3db","#54b0e0","#1078bb","#1387cd","#69bde5"],
}));
</script>

<style scoped>
/* ── Root ────────────────────────────────────────────────────────────────── */
.dv {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Period bar (FILTRO de chips, NO tabs) ─────────────────────────────────
   Estilo distinto al header (Ventas/Stock/Inventario/Caja) para evitar
   confusión: sin contenedor de fondo, sin indicador deslizante. Cada chip
   es un filtro pill discreto, el activo se rellena con primary. */
.dv-period-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
}
.dv-period-bar__head {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.dv-period-icon {
  color: rgba(var(--v-theme-on-surface), 0.50);
}
.dv-period-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

/* Sin contenedor con fondo (eso lo hacía parecer una tabbar). */
.dv-period-pills {
  position: relative;
  display: inline-flex;
  gap: 6px;
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: none;
}
/* Indicador deslizante eliminado: cada chip se autoexplica. */
.dv-period-pills::before { content: none; }

.dv-pill {
  position: relative;
  z-index: 1;
  padding: 5px 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 12px;
  font-weight: 400;
  cursor: pointer;
  white-space: nowrap;
  letter-spacing: 0.01em;
  border-radius: 999px;
  transition: background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s;
}
.dv-pill:hover {
  border-color: rgba(var(--v-theme-primary), 0.45);
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.06);
}
.dv-pill--active {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(var(--v-theme-primary), 0.25);
}
.dv-pill--active:hover {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
.dv-today-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.50);
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  white-space: nowrap;
}
.dv-today-chip b { color: rgba(var(--v-theme-on-surface), 0.80); font-weight: 500; }
.dv-today-dot {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 5px rgba(16,185,129,.7);
  flex-shrink: 0;
}

.dv-bar-spacer { flex: 1; }

.dv-scope {
  display: flex;
  align-items: center;
  font-size: 11.5px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.45);
}

/* Branch selector */
.dv-branch-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 10px;
  border: 1px solid rgba(var(--v-theme-primary), 0.20);
  background: rgba(var(--v-theme-primary), 0.06);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.dv-branch-wrap:hover {
  border-color: rgba(var(--v-theme-primary), 0.40);
  background: rgba(var(--v-theme-primary), 0.10);
}
.dv-branch-icon    { color: rgb(var(--v-theme-primary)); opacity: 0.70; flex-shrink: 0; }
.dv-branch-chevron { color: rgb(var(--v-theme-primary)); opacity: 0.55; flex-shrink: 0; }
.dv-branch-label {
  font-size: 12px;
  font-weight: 400;
  color: rgb(var(--v-theme-primary));
  white-space: nowrap;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── KPI row ─────────────────────────────────────────────────────────────── */
.dv-kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
@media (max-width: 1100px) { .dv-kpi-row { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px)  { .dv-kpi-row { grid-template-columns: 1fr; } }

.dv-kpi {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
  overflow: hidden;
}
.dv-kpi::before {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--kpi-accent, #1488d1);
  border-radius: 3px 0 0 3px;
}
.dv-kpi-badge {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dv-kpi-body  { flex: 1; min-width: 0; }
.dv-kpi-label {
  font-size: 11px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(var(--v-theme-on-surface), 0.50);
  margin-bottom: 2px;
}
.dv-kpi-period { text-transform: none; opacity: 0.7; }
.dv-kpi-value {
  font-size: 1.8rem;
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 1;
  color: rgb(var(--v-theme-on-surface));
}
.dv-kpi-value--sm { font-size: 1.4rem; }
.dv-kpi-value--xs { font-size: 1.1rem; }
.dv-kpi-meta {
  margin-top: 4px;
  font-size: 11.5px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.50);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dv-kpi-trend {
  position: absolute;
  top: 12px; right: 14px;
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 20px;
}
.dv-kpi-trend.up  { background: rgba(16,185,129,.12); color: #10b981; }
.dv-kpi-trend.dn  { background: rgba(239,68,68,.10);  color: #ef4444; }

/* ── Card ────────────────────────────────────────────────────────────────── */
.dv-card {
  background: rgb(var(--v-theme-surface));
  border: none !important;
  border-radius: 16px !important;
  overflow: hidden;
}
.v-theme--light .dv-card,
.v-theme--adminLight .dv-card,
.v-theme--shopLight .dv-card {
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 1px 3px rgba(15, 23, 42, 0.06);
}
.h-full { height: 100%; }

.dv-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px 12px;
}
.dv-head-left { min-width: 0; }
.dv-head-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.dv-title {
  font-weight: 500;
  font-size: 13.5px;
  letter-spacing: -0.01em;
  color: rgb(var(--v-theme-on-surface));
}
.dv-sub {
  margin-top: 2px;
  font-size: 11px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.45);
}
.dv-divider { border-color: rgba(var(--v-theme-on-surface), 0.07) !important; }

.dv-body { padding: 0; }

.dv-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
.dv-empty {
  padding: 36px 20px;
  text-align: center;
  font-size: 12px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.40);
}

.dv-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px 12px;
  font-size: 11.5px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.50);
}
.dv-foot b  { color: rgba(var(--v-theme-on-surface), 0.80); }
.dot        { opacity: 0.4; }

.chip-soft { border: 1px solid rgba(var(--v-theme-on-surface), 0.10) !important; }

.op60 { opacity: 0.6; }

/* ── Toggle ─────────────────────────────────────────────────────────────── */
.dv-toggle {
  display: flex;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
}
.dv-toggle-btn {
  padding: 4px 12px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-size: 11.5px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.15s;
}
.dv-toggle-btn.active {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  box-shadow: 0 1px 4px rgba(0,0,0,.10);
}

/* ── Analytics grid ─────────────────────────────────────────────────────── */
.dv-ana-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
@media (max-width: 800px) { .dv-ana-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .dv-ana-grid { grid-template-columns: 1fr; } }

.dv-ana-item {
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}
.dv-ana-label {
  font-size: 10px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(var(--v-theme-on-surface), 0.45);
  margin-bottom: 4px;
}
.dv-ana-val {
  font-size: 1.35rem;
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1;
}
.dv-ana-sub {
  font-size: 10.5px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.45);
  margin-top: 3px;
}

/* ── Table ──────────────────────────────────────────────────────────────── */
.dv-table :deep(.v-table__wrapper),
.dv-table :deep(table),
.dv-table :deep(.v-data-table__wrapper) {
  background: transparent !important;
}

/* ── Responsive ─────────────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .dv-period-bar { gap: 8px; }
  .dv-period-pills { flex-wrap: wrap; }
}

/* ── Branch summary list ─────────────────────────────────────────────────── */
.bs-list { padding: 8px 14px 12px; display: flex; flex-direction: column; gap: 8px; }
.bs-item { display: flex; align-items: center; gap: 8px; font-size: 12.5px; }
.bs-dot  { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.bs-name { flex: 0 0 110px; font-weight: 400; opacity: .85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bs-bar-wrap { flex: 1; height: 5px; border-radius: 4px; background: rgba(var(--v-theme-on-surface), .08); overflow: hidden; }
.bs-bar-fill { height: 100%; border-radius: 4px; transition: width .4s ease; }
.bs-pct  { flex: 0 0 34px; text-align: right; font-weight: 400; opacity: .7; font-size: 11px; }
.bs-val  { flex: 0 0 90px; text-align: right; font-weight: 400; font-size: 12px; }

/* ── Last-sales feed ─────────────────────────────────────────────────────── */
.ls-feed { display: flex; flex-direction: column; }
.ls-row  {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.6));
  transition: background .15s;
}
.ls-row:last-child { border-bottom: none; }
.ls-row:hover { background: rgba(var(--v-theme-on-surface), .04); }

.ls-id   { flex: 0 0 52px; font-weight: 500; font-size: 13px; color: rgb(var(--v-theme-primary)); }
.ls-middle { flex: 0 0 170px; }
.ls-date { font-size: 12.5px; font-weight: 400; opacity: .9; }
.ls-branch { font-size: 11px; opacity: .55; margin-top: 1px; }
.ls-user { flex: 1; font-size: 12.5px; opacity: .8; display: flex; align-items: center; }
.ls-method-wrap { flex: 0 0 120px; }
.ls-method-badge {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 400;
  letter-spacing: .2px;
  white-space: nowrap;
}
.mb-cash     { background: rgba(20,136,209,.15);  color: #1488d1; }
.mb-card     { background: rgba(14,107,168,.15);  color: #0e6ba8; }
.mb-transfer { background: rgba(58,165,230,.15);  color: #3aa5e6; }
.mb-mp       { background: rgba(94,185,227,.15);  color: #5eb9e3; }
.mb-sjt      { background: rgba(8,44,91,.15);     color: #082c5b; }
.mb-credit   { background: rgba(10,77,125,.15);   color: #0a4d7d; }
.mb-other    { background: rgba(var(--v-theme-on-surface), .08); opacity: .7; }

.ls-right { flex: 0 0 130px; text-align: right; }
.ls-total { font-size: 13.5px; font-weight: 500; }
.ls-invoice { margin-top: 3px; }
</style>
