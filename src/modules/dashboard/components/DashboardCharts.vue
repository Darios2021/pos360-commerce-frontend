<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/dashboard/components/DashboardCharts.vue -->

<template>
  <div class="dash-charts">
    <!-- ================== Ventas últimos 7 días ================== -->
    <v-card class="dash-surface" rounded="xl" elevation="0">
      <div class="card-head">
        <div class="minw-0">
          <div class="card-title">Ventas últimos 7 días</div>
          <div class="card-sub text-caption text-medium-emphasis">
            {{ scopeLabel }}
          </div>
        </div>

        <div class="head-right">
          <v-chip size="small" variant="tonal" color="primary" class="chip-soft">
            {{ last7Summary }}
          </v-chip>
        </div>
      </div>

      <div class="card-body">
        <ApexChart
          height="260"
          type="area"
          :options="optLast7"
          :series="seriesLast7"
        />
      </div>
    </v-card>

    <!-- ================== Ventas (picos) por período ================== -->
    <v-card class="dash-surface mt-4" rounded="xl" elevation="0">
      <div class="card-head">
        <div class="minw-0">
          <div class="card-title">Ventas (picos)</div>
          <div class="card-sub text-caption text-medium-emphasis">
            {{ periodLabel }}
            <span v-if="periodFrom && periodTo">· {{ periodFrom }} → {{ periodTo }}</span>
          </div>
        </div>

        <div class="head-right">
          <v-chip size="small" variant="tonal" class="chip-soft">
            Pico máx: {{ money(maxPeak) }}
          </v-chip>
        </div>
      </div>

      <div class="card-body">
        <ApexChart
          height="300"
          type="line"
          :options="optPeaks"
          :series="seriesPeaks"
        />
      </div>

      <div class="card-foot text-caption text-medium-emphasis">
        <span>Promedio/día: <b>{{ money(avgPeak) }}</b></span>
        <span class="sep">·</span>
        <span>Días con ventas: <b>{{ nonZeroDays }}</b> / {{ peaksPoints.length }}</span>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from "vue";
import ApexChart from "vue3-apexcharts";

const props = defineProps({
  loading: { type: Boolean, default: false },

  scope: { type: Object, default: () => ({}) },
  salesByDay: { type: Array, default: () => [] },
  salesByPeriodDaily: { type: Array, default: () => [] },

  period: { type: String, default: "30d" },
  periodFrom: { type: String, default: null },
  periodTo: { type: String, default: null },
});

/* =========================
   Helpers
========================= */
function toNum(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function parseDateYMD(ymd) {
  if (!ymd) return null;
  const [y, m, d] = String(ymd).split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function fmtDM(ymd) {
  const dt = parseDateYMD(ymd);
  if (!dt) return "—";
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

function money(v) {
  const n = toNum(v);
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$ ${n.toFixed(0)}`;
  }
}

function shortNumber(v) {
  const n = toNum(v);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${Math.round(n)}`;
}

function movingAvg(values, window = 7) {
  const out = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / (slice.length || 1);
    out.push(avg);
  }
  return out;
}

/* =========================
   Labels
========================= */
const scopeLabel = computed(() => {
  const mode = props?.scope?.mode || "";
  const bid = props?.scope?.branchId;
  if (mode === "ALL_BRANCHES") return "Scope: Todas las sucursales";
  if (mode === "SINGLE_BRANCH") return `Scope: Sucursal #${bid || "—"}`;
  if (mode === "USER_BRANCH") return `Scope: Tu sucursal (#${bid || "—"})`;
  return "Scope: —";
});

const periodLabel = computed(() => {
  const p = String(props.period || "30d");
  if (p === "90d") return "Período: 90 días";
  if (p === "12m") return "Período: 12 meses";
  if (p === "all") return "Período: Desde siempre";
  return "Período: 30 días";
});

/* =========================
   Data: Last 7
========================= */
const last7Points = computed(() => {
  const arr = Array.isArray(props.salesByDay) ? props.salesByDay : [];
  return arr.map((x) => ({ date: x?.date, total: toNum(x?.total), count: toNum(x?.count) }));
});

const seriesLast7 = computed(() => [
  { name: "Ventas", data: last7Points.value.map((p) => ({ x: p.date, y: p.total })) },
]);

const last7Summary = computed(() => {
  const sum = last7Points.value.reduce((a, b) => a + b.total, 0);
  const cnt = last7Points.value.reduce((a, b) => a + b.count, 0);
  return `${money(sum)} · ${cnt} ventas`;
});

/* =========================
   Data: Peaks
========================= */
const peaksPoints = computed(() => {
  const arr = Array.isArray(props.salesByPeriodDaily) ? props.salesByPeriodDaily : [];
  return arr.map((x) => ({ date: x?.date, total: toNum(x?.total), count: toNum(x?.count) }));
});

const maxPeak = computed(() => peaksPoints.value.reduce((m, p) => Math.max(m, p.total), 0));
const avgPeak = computed(() => {
  const arr = peaksPoints.value.map((p) => p.total);
  const sum = arr.reduce((a, b) => a + b, 0);
  return arr.length ? sum / arr.length : 0;
});
const nonZeroDays = computed(() => peaksPoints.value.filter((p) => p.total > 0).length);

const peaksTotals = computed(() => peaksPoints.value.map((p) => p.total));
const peaksMA7 = computed(() => movingAvg(peaksTotals.value, 7));

const maxPeakIndex = computed(() => {
  const m = maxPeak.value;
  if (!m) return -1;
  return peaksTotals.value.findIndex((x) => x === m);
});

const maxPeakDate = computed(() => {
  const idx = maxPeakIndex.value;
  if (idx < 0) return null;
  return peaksPoints.value[idx]?.date || null;
});

const seriesPeaks = computed(() => [
  { name: "Ventas", data: peaksPoints.value.map((p) => ({ x: p.date, y: p.total })) },
  { name: "Promedio móvil (7d)", data: peaksPoints.value.map((p, i) => ({ x: p.date, y: peaksMA7.value[i] })) },
]);

/* =========================
   Apex options (theme vars)
========================= */
const common = computed(() => ({
  chart: {
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: true },
    fontFamily: "inherit",
  },
  stroke: { curve: "smooth", width: 3 },
  grid: {
    borderColor: "rgba(var(--v-theme-on-surface), 0.10)",
    padding: { left: 8, right: 12, top: 8, bottom: 0 },
  },
  tooltip: {
    theme: "dark",
    x: { formatter: (val) => fmtDM(val) },
    y: { formatter: (v) => money(v) },
  },
  xaxis: {
    type: "category",
    labels: {
      style: { colors: "rgba(var(--v-theme-on-surface), 0.65)" },
      formatter: (v) => fmtDM(v),
      rotate: 0,
      hideOverlappingLabels: true,
      trim: true,
    },
    axisBorder: { color: "rgba(var(--v-theme-on-surface), 0.12)" },
    axisTicks: { color: "rgba(var(--v-theme-on-surface), 0.12)" },
  },
  yaxis: {
    labels: {
      style: { colors: "rgba(var(--v-theme-on-surface), 0.65)" },
      formatter: (v) => shortNumber(v),
    },
  },
  legend: {
    show: true,
    labels: { colors: "rgba(var(--v-theme-on-surface), 0.70)" },
    markers: { radius: 12 },
  },
}));

const optLast7 = computed(() => ({
  ...common.value,
  chart: { ...common.value.chart, type: "area" },
  colors: ["rgba(var(--v-theme-primary), 0.95)"],
  fill: {
    type: "gradient",
    gradient: { shadeIntensity: 0.25, opacityFrom: 0.35, opacityTo: 0.03, stops: [0, 90, 100] },
  },
  dataLabels: { enabled: false },
  markers: { size: 3, hover: { size: 5 } },
  yaxis: { ...common.value.yaxis, tickAmount: 5 },
}));

const optPeaks = computed(() => {
  const annotations = {};
  if (maxPeak.value > 0 && maxPeakDate.value) {
    annotations.points = [
      {
        x: maxPeakDate.value,
        y: maxPeak.value,
        marker: { size: 7 },
        label: { text: `Máx ${money(maxPeak.value)}`, style: { fontSize: "12px" } },
      },
    ];
  }

  return {
    ...common.value,
    chart: { ...common.value.chart, type: "line" },
    colors: ["rgba(var(--v-theme-primary), 0.95)", "rgba(var(--v-theme-secondary), 0.95)"],
    dataLabels: { enabled: false },
    markers: { size: 2, strokeWidth: 0, hover: { size: 6 } },
    stroke: { curve: "smooth", width: [3, 2], dashArray: [0, 6] },
    yaxis: {
      ...common.value.yaxis,
      tickAmount: 6,
      max: maxPeak.value > 0 ? Math.ceil(maxPeak.value * 1.08) : undefined,
    },
    annotations,
  };
});
</script>

<style scoped>
.dash-surface {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
}

.dash-charts {
  display: flex;
  flex-direction: column;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 14px 0 14px;
}

.card-title {
  font-weight: 800;
  font-size: 14px;
}

.card-sub {
  margin-top: 2px;
}

.head-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.card-body {
  padding: 8px 8px 12px 8px;
}

.card-foot {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 0 14px 14px 14px;
}

.sep { opacity: 0.6; }
.chip-soft { border: 1px solid rgba(var(--v-theme-on-surface), 0.10); }
.minw-0 { min-width: 0; }
</style>