<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/dashboard/components/DashboardSalesTab.vue -->

<template>
  <div class="dsales">
    <!-- KPIs -->
    <v-row dense class="mb-3">
      <v-col cols="12" md="3">
        <KpiCard
          title="Ventas hoy"
          :value="num(today.count)"
          :loading="loading"
          icon="mdi-receipt-text-outline"
          tone="primary"
        />
      </v-col>

      <v-col cols="12" md="3">
        <KpiCard
          title="Total hoy"
          :value="money(today.total)"
          :loading="loading"
          icon="mdi-cash-multiple"
          tone="success"
        />
      </v-col>

      <v-col cols="12" md="3">
        <KpiCard
          :title="`Sucursal top (${periodLabelShort})`"
          :value="topBranchLabel"
          :sub="topBranchSub"
          :loading="loading"
          icon="mdi-store"
          tone="info"
        />
      </v-col>

      <v-col cols="12" md="3">
        <KpiCard
          :title="`Mejor mes (${periodLabelShort})`"
          :value="bestMonthLabel"
          :sub="bestMonthSub"
          :loading="loading"
          icon="mdi-calendar-star"
          tone="indigo"
        />
      </v-col>
    </v-row>

    <!-- Charts: Timeline + Branch share -->
    <v-row dense>
      <!-- Timeline -->
      <v-col cols="12" lg="8">
        <v-card class="dash-surface rounded-xl" elevation="0">
          <div class="ds-head">
            <div class="minw-0">
              <div class="ds-title">Ventas en el tiempo</div>
              <div class="ds-sub text-caption text-medium-emphasis">
                {{ periodLabel === "Últimos 3 meses" ? "Últimos 3 meses" : periodLabel }} · {{ scopeLabelChip }}
              </div>
            </div>

            <div class="ds-right">
              <v-chip size="small" variant="tonal" class="chip-soft">
                Pico: <b class="ml-1">{{ money(peakMax) }}</b>
                <span class="ml-1">({{ peakDateFmt }})</span>
                <span v-if="peakCashierLabel" class="ml-2">· <b>{{ peakCashierLabel }}</b></span>
              </v-chip>

              <v-select
                v-model="periodLocal"
                :items="periodItems"
                item-title="title"
                item-value="value"
                density="compact"
                variant="outlined"
                hide-details
                class="ds-period"
                @update:modelValue="emitPeriod"
              />
            </div>
          </div>

          <v-divider />

          <div class="ds-body">
            <div v-if="loading" class="py-10 d-flex justify-center">
              <v-progress-circular indeterminate />
            </div>

            <div v-else>
              <div v-if="!timelinePoints.length" class="text-caption text-medium-emphasis px-4 py-6">
                Sin datos para graficar.
              </div>

              <div v-else class="px-2 pb-2">
                <ApexChart height="320" type="area" :options="optTimeline" :series="seriesTimeline" />

                <div class="ds-foot text-caption text-medium-emphasis">
                  <span>Promedio/día: <b>{{ money(avgPerDay) }}</b></span>
                  <span class="sep">·</span>
                  <span>Días con ventas: <b>{{ nonZeroDays }}</b> / {{ timelinePoints.length }}</span>
                </div>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Ventas por sucursal (donut) -->
      <v-col cols="12" lg="4">
        <v-card class="dash-surface rounded-xl" elevation="0">
          <div class="ds-head">
            <div class="minw-0">
              <div class="ds-title">Ventas por sucursal</div>
              <div class="ds-sub text-caption text-medium-emphasis">
                Participación ({{ periodLabel }})
              </div>
            </div>

            <div class="ds-right">
              <v-chip size="small" variant="tonal" class="chip-soft">
                Total: <b class="ml-1">{{ money(branchTotalSum) }}</b>
              </v-chip>
            </div>
          </div>

          <v-divider />

          <div class="ds-body">
            <div v-if="loading" class="py-10 d-flex justify-center">
              <v-progress-circular indeterminate />
            </div>

            <div v-else>
              <div v-if="!branchSeries.length" class="text-caption text-medium-emphasis px-4 py-6">
                Sin datos por sucursal.
              </div>

              <div v-else class="px-2 pb-2">
                <ApexChart height="320" type="donut" :options="optBranchDonut" :series="branchSeries" />
                <div class="px-4 pb-4 text-caption text-medium-emphasis">Tip: tocá una porción para aislarla.</div>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts: Mejor mes + Top 5 -->
    <v-row dense class="mt-2">
      <!-- Mejor mes (bars por mes) -->
      <v-col cols="12" lg="6">
        <v-card class="dash-surface rounded-xl" elevation="0">
          <div class="ds-head">
            <div class="minw-0">
              <div class="ds-title">Ventas por mes</div>
              <div class="ds-sub text-caption text-medium-emphasis">Últimos meses (según datos disponibles)</div>
            </div>

            <div class="ds-right">
              <v-chip size="small" variant="tonal" class="chip-soft">
                Mejor: <b class="ml-1">{{ bestMonthLabel }}</b>
              </v-chip>
            </div>
          </div>

          <v-divider />

          <div class="ds-body">
            <div v-if="loading" class="py-10 d-flex justify-center">
              <v-progress-circular indeterminate />
            </div>

            <div v-else>
              <div v-if="!monthsAgg.length" class="text-caption text-medium-emphasis px-4 py-6">
                Sin datos mensuales.
              </div>

              <div v-else class="px-2 pb-2">
                <ApexChart height="320" type="bar" :options="optMonthsBar" :series="seriesMonths" />
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Top 5: Cajeros -->
      <v-col cols="12" lg="6">
        <v-card class="dash-surface rounded-xl" elevation="0">
          <div class="ds-head">
            <div class="minw-0">
              <div class="ds-title">Top 5 vendedores</div>
              <div class="ds-sub text-caption text-medium-emphasis">Cajeros con mayor total ({{ periodLabel }})</div>
            </div>

            <div class="ds-right">
              <v-chip size="small" variant="tonal" class="chip-soft">
                {{ topCashiers5.length ? "Ranking" : "Sin datos" }}
              </v-chip>
            </div>
          </div>

          <v-divider />

          <div class="ds-body">
            <div v-if="loading" class="py-10 d-flex justify-center">
              <v-progress-circular indeterminate />
            </div>

            <div v-else>
              <div v-if="!topCashiers5.length" class="text-caption text-medium-emphasis px-4 py-6">
                Sin ventas por cajero en el período.
              </div>

              <div v-else class="px-2 pb-2">
                <ApexChart height="320" type="bar" :options="optCashiersBar" :series="seriesCashiers" />
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Top 5 productos -->
    <v-row dense class="mt-2">
      <v-col cols="12">
        <v-card class="dash-surface rounded-xl" elevation="0">
          <div class="ds-head">
            <div class="minw-0">
              <div class="ds-title">Top 5 productos más vendidos</div>
              <div class="ds-sub text-caption text-medium-emphasis">Por unidades y total ({{ periodLabel }})</div>
            </div>

            <div class="ds-right">
              <v-chip size="small" variant="tonal" class="chip-soft">
                {{ topProducts5.length ? "Ranking" : "Sin datos" }}
              </v-chip>
            </div>
          </div>

          <v-divider />

          <div class="ds-body">
            <div v-if="loading" class="py-10 d-flex justify-center">
              <v-progress-circular indeterminate />
            </div>

            <div v-else>
              <div v-if="!topProducts5.length" class="text-caption text-medium-emphasis px-4 py-6">
                Sin productos vendidos en el período.
              </div>

              <div v-else class="px-2 pb-2">
                <ApexChart height="320" type="bar" :options="optProductsBar" :series="seriesProducts" />
              </div>
            </div>
          </div>

          <div v-if="topProducts5.length" class="ds-foot text-caption text-medium-emphasis px-4 pb-4">
            Tip: el gráfico muestra <b>total $</b>. Si querés, le agrego toggle para alternar <b>unidades</b> / <b>total</b>.
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Últimas ventas (tabla) -->
    <v-row dense class="mt-2">
      <v-col cols="12">
        <v-card class="dash-surface rounded-xl" elevation="0">
          <div class="ds-head">
            <div class="minw-0">
              <div class="ds-title">Últimas ventas (pagadas)</div>
              <div class="ds-sub text-caption text-medium-emphasis">{{ scopeLabelChip }}</div>
            </div>
          </div>

          <v-divider />

          <v-card-text>
            <div v-if="loading" class="py-8 d-flex justify-center">
              <v-progress-circular indeterminate />
            </div>

            <div v-else>
              <v-data-table
                :headers="headers"
                :items="lastSales"
                item-key="id"
                density="comfortable"
                class="elevation-0 rounded-xl dash-table"
              >
                <template #item.id="{ item }">
                  <div class="font-weight-bold">#{{ item.id }}</div>
                </template>

                <template #item.sold_at="{ item }">
                  <div class="font-weight-medium">{{ dt(item.sold_at) }}</div>
                </template>

                <template #item.branch="{ item }">
                  <div class="text-body-2 font-weight-medium">
                    {{ item?.branch?.name || (item.branch_id ? `Sucursal #${item.branch_id}` : "—") }}
                  </div>
                </template>

                <template #item.user="{ item }">
                  <div class="text-body-2">
                    {{ item?.user?.label || item?.user?.name || item?.user?.username || "—" }}
                  </div>
                </template>

                <template #item.total="{ item }">
                  <div class="font-weight-black">{{ money(item.total) }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ methodLabel(item?.payments?.[0]?.method) }}
                  </div>
                </template>

                <template #bottom />
              </v-data-table>

              <div v-if="!lastSales.length" class="text-caption text-medium-emphasis mt-2">
                Sin ventas.
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import ApexChart from "vue3-apexcharts";
import KpiCard from "./KpiCard.vue";

const props = defineProps({
  loading: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  scopeLabel: { type: String, default: "" },
  sales: { type: Object, default: () => ({}) },
  period: { type: String, default: "30d" }, // "30d" | "90d" | "all"
});

const emit = defineEmits(["period-change"]);

const periodItems = [
  { title: "Último mes", value: "30d" },
  { title: "Últimos 3 meses", value: "90d" },
  { title: "Desde siempre", value: "all" },
];

const periodLocal = ref(props.period || "30d");
watch(
  () => props.period,
  (v) => {
    if (v && v !== periodLocal.value) periodLocal.value = v;
  }
);
function emitPeriod(v) {
  emit("period-change", v);
}

/* =========================
   Helpers
========================= */
function num(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}
function money(val) {
  const n = Number(val || 0);
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `$ ${Math.round(n)}`;
  }
}
function dt(val) {
  if (!val) return "—";
  return new Date(val).toLocaleString("es-AR");
}
function parseYMDToMs(ymd) {
  if (!ymd) return null;
  const s = String(ymd);
  // ymd: "YYYY-MM-DD"
  if (s.length >= 10) {
    const y = Number(s.slice(0, 4));
    const m = Number(s.slice(5, 7));
    const d = Number(s.slice(8, 10));
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d).getTime();
  }
  // fallback: Date.parse
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : null;
}
function fmtDMFromMs(ms) {
  if (!ms) return "—";
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}
function monthKey(ymd) {
  const s = String(ymd || "");
  if (s.length >= 7) return s.slice(0, 7); // YYYY-MM
  return "—";
}
function monthLabel(ym) {
  if (!ym || ym === "—") return "—";
  const [y, m] = String(ym).split("-");
  const d = new Date(Number(y || 2000), Number(m || 1) - 1, 1);
  return d.toLocaleDateString("es-AR", { year: "numeric", month: "long" });
}
function shortNumber(v) {
  const n = Number(v || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${Math.round(n)}`;
}
function methodLabel(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "Efectivo";
  if (x === "CARD") return "Tarjeta / Débito";
  if (x === "TRANSFER") return "Transferencia";
  if (x === "QR") return "QR";
  if (x === "OTHER") return "Otro";
  return x || "—";
}

/* =========================
   Labels
========================= */
const periodLabel = computed(() => {
  const p = periodLocal.value;
  if (p === "90d") return "Últimos 3 meses";
  if (p === "all") return "Desde siempre";
  return "Último mes";
});
const periodLabelShort = computed(() => {
  const p = periodLocal.value;
  if (p === "90d") return "3m";
  if (p === "all") return "Siempre";
  return "Mes";
});
const scopeLabelChip = computed(() => (props.scopeLabel ? `Scope: ${props.scopeLabel}` : "Scope: —"));

/* =========================
   Base data (compat)
========================= */
const today = computed(() => {
  const t = props.sales?.today;
  if (t && typeof t === "object") return t;
  return { count: 0, total: 0, avgTicket: 0 };
});

// daily points: nuevo primero, viejo fallback
const salesDaily = computed(() => {
  if (Array.isArray(props.sales?.salesByPeriodDaily)) return props.sales.salesByPeriodDaily;
  if (Array.isArray(props.sales?.salesByDay30)) return props.sales.salesByDay30;
  return [];
});

const lastSales = computed(() => (Array.isArray(props.sales?.lastSales) ? props.sales.lastSales : []));

const topBranch = computed(() => props.sales?.topBranchPeriod || props.sales?.topBranch30d || null);

const topCashiers = computed(() => {
  if (Array.isArray(props.sales?.topCashiersPeriod)) return props.sales.topCashiersPeriod;
  if (Array.isArray(props.sales?.topCashiers30d)) return props.sales.topCashiers30d;
  return [];
});

const topProducts = computed(() => {
  if (Array.isArray(props.sales?.topProductsPeriod)) return props.sales.topProductsPeriod;
  if (Array.isArray(props.sales?.topProducts30d)) return props.sales.topProducts30d;
  return [];
});

const bestMonth = computed(() => props.sales?.bestMonthPeriod || props.sales?.bestMonth12m || null);

/* =========================
   KPIs labels
========================= */
const topBranchLabel = computed(() => {
  if (!topBranch.value) return "—";
  return topBranch.value.branch_name || `Sucursal #${topBranch.value.branch_id}`;
});
const topBranchSub = computed(() => {
  if (!topBranch.value) return props.scopeLabel ? `Scope: ${props.scopeLabel}` : "";
  return `${money(topBranch.value.total)} · ${num(topBranch.value.count)} ventas`;
});
const bestMonthLabel = computed(() => {
  if (!bestMonth.value) return "—";
  return monthLabel(bestMonth.value.ym);
});
const bestMonthSub = computed(() => {
  if (!bestMonth.value) return props.scopeLabel ? `Scope: ${props.scopeLabel}` : "";
  return `${money(bestMonth.value.total)} · ${num(bestMonth.value.count)} ventas`;
});

/* =========================
   Timeline points (cronológico)
   ✅ soporta fields extra por día:
     - top_cashier_label | top_user_label
     - top_total (opcional)
========================= */
const timelinePoints = computed(() => {
  const arr = Array.isArray(salesDaily.value) ? salesDaily.value : [];
  const mapped = arr
    .map((x) => {
      const ymd = x?.date;
      const ms = parseYMDToMs(ymd);
      const total = num(x?.total);
      const count = num(x?.count);

      const topCashierLabel =
        x?.top_cashier_label ||
        x?.top_user_label ||
        x?.top_cashier_name ||
        x?.top_user_name ||
        x?.top_user?.label ||
        x?.top_user?.name ||
        null;

      const topTotal = Number(x?.top_total ?? 0);

      return { date: ymd, ms, total, count, topCashierLabel, topTotal };
    })
    .filter((p) => !!p.ms);

  // ✅ orden cronológico por ms
  mapped.sort((a, b) => a.ms - b.ms);
  return mapped;
});

const peakMax = computed(() => {
  let m = 0;
  for (const p of timelinePoints.value) m = Math.max(m, Number(p.total || 0));
  return m;
});

const peakPoint = computed(() => {
  let best = null;
  let max = -1;
  for (const p of timelinePoints.value) {
    const v = Number(p.total || 0);
    if (v > max) {
      max = v;
      best = p;
    }
  }
  return best;
});

const peakDateFmt = computed(() => (peakPoint.value?.ms ? fmtDMFromMs(peakPoint.value.ms) : "—"));
const peakCashierLabel = computed(() => peakPoint.value?.topCashierLabel || "");

const avgPerDay = computed(() => {
  const arr = timelinePoints.value;
  if (!arr.length) return 0;
  const sum = arr.reduce((a, p) => a + Number(p.total || 0), 0);
  return sum / arr.length;
});
const nonZeroDays = computed(() => timelinePoints.value.filter((p) => Number(p.total || 0) > 0).length);

// ✅ series con datetime: [ms, y]
const seriesTimeline = computed(() => [
  { name: "Ventas (ARS)", data: timelinePoints.value.map((p) => [p.ms, p.total]) },
]);

/* =========================
   Ventas por sucursal (donut)
========================= */
const salesByBranch = computed(() => {
  if (Array.isArray(props.sales?.salesByBranchPeriod)) return props.sales.salesByBranchPeriod;

  // fallback: agrupa lastSales (ojo: lastSales suele ser limitado)
  const map = new Map();
  for (const s of lastSales.value) {
    const bid = s?.branch_id ?? s?.branch?.id ?? null;
    const name = s?.branch?.name || (bid ? `Sucursal #${bid}` : "—");
    const key = String(bid ?? name);
    const prev = map.get(key) || { branch_id: bid, branch_name: name, total: 0, count: 0 };
    prev.total += Number(s?.total || 0);
    prev.count += 1;
    map.set(key, prev);
  }
  return Array.from(map.values()).sort((a, b) => Number(b.total || 0) - Number(a.total || 0));
});

const branchTop = computed(() => salesByBranch.value.slice(0, 8));
const branchLabels = computed(() => branchTop.value.map((b) => String(b.branch_name || `Sucursal #${b.branch_id || "—"}`)));
const branchSeries = computed(() => branchTop.value.map((b) => Number(b.total || 0)));
const branchTotalSum = computed(() => branchTop.value.reduce((a, b) => a + Number(b.total || 0), 0));

/* =========================
   Ventas por mes (bar)
========================= */
const monthsAgg = computed(() => {
  if (Array.isArray(props.sales?.salesByMonthPeriod)) {
    return props.sales.salesByMonthPeriod
      .map((m) => ({ ym: m?.ym, total: num(m?.total), count: num(m?.count) }))
      .filter((m) => !!m.ym)
      .sort((a, b) => String(a.ym).localeCompare(String(b.ym)));
  }

  const map = new Map();
  for (const p of timelinePoints.value) {
    const ym = monthKey(p.date);
    const prev = map.get(ym) || { ym, total: 0, count: 0 };
    prev.total += Number(p.total || 0);
    prev.count += Number(p.count || 0);
    map.set(ym, prev);
  }

  return Array.from(map.values())
    .filter((m) => m.ym && m.ym !== "—")
    .sort((a, b) => String(a.ym).localeCompare(String(b.ym)));
});

const seriesMonths = computed(() => [{ name: "Total (ARS)", data: monthsAgg.value.map((m) => m.total) }]);
const monthsLabels = computed(() => monthsAgg.value.map((m) => monthLabel(m.ym)));

/* =========================
   Top 5 Cajeros / Productos
========================= */
const topCashiers5 = computed(() => {
  const arr = Array.isArray(topCashiers.value) ? topCashiers.value : [];
  return arr.slice().sort((a, b) => Number(b.total || 0) - Number(a.total || 0)).slice(0, 5);
});

const topProducts5 = computed(() => {
  const arr = Array.isArray(topProducts.value) ? topProducts.value : [];
  return arr.slice().sort((a, b) => Number(b.total || 0) - Number(a.total || 0)).slice(0, 5);
});

/* =========================
   Apex common
========================= */
const apexCommon = computed(() => ({
  chart: {
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: true },
    fontFamily: "inherit",
    foreColor: "rgba(var(--v-theme-on-surface), 0.75)",
  },
  grid: {
    borderColor: "rgba(var(--v-theme-on-surface), 0.10)",
    padding: { left: 12, right: 14, top: 10, bottom: 0 },
  },
  dataLabels: { enabled: false },
  legend: { labels: { colors: "rgba(var(--v-theme-on-surface), 0.75)" } },
}));

/* =========================
   ✅ Timeline options (datetime + labels no apretados + tooltip con cajero)
========================= */
const timelineTickAmount = computed(() => {
  const n = timelinePoints.value.length || 0;
  if (n <= 14) return 6;
  if (n <= 35) return 8;
  if (n <= 70) return 10;
  return 12;
});

const optTimeline = computed(() => {
  const annotations = {};
  if (peakPoint.value?.ms && peakMax.value > 0) {
    const who = peakPoint.value?.topCashierLabel ? ` · ${peakPoint.value.topCashierLabel}` : "";
    annotations.points = [
      {
        x: peakPoint.value.ms,
        y: peakMax.value,
        marker: { size: 7 },
        label: { text: `Pico ${money(peakMax.value)}${who}`, style: { fontSize: "12px" } },
      },
    ];
  }

  const extras = new Map(timelinePoints.value.map((p) => [p.ms, p]));

  return {
    ...apexCommon.value,

    chart: { ...apexCommon.value.chart, type: "area" },

    // ✅ FORZAR AZUL REAL
    colors: ["#008FFB"],

    stroke: { curve: "smooth", width: 3, colors: ["#008FFB"] },

    // ✅ Área azul suave (gradient)
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0.2,
        opacityFrom: 0.35,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
      colors: ["#008FFB"],
    },

    markers: {
      size: 3,
      strokeWidth: 2,
      strokeColors: "rgb(var(--v-theme-surface))",
      colors: ["#008FFB"],
      hover: { size: 6 },
    },

    xaxis: {
      type: "datetime",
      tickAmount: timelineTickAmount.value,
      labels: {
        style: { colors: "rgba(var(--v-theme-on-surface), 0.65)" },
        datetimeUTC: false,
        formatter: (val) => fmtDMFromMs(Number(val)),
      },
      axisBorder: { color: "rgba(var(--v-theme-on-surface), 0.12)" },
      axisTicks: { color: "rgba(var(--v-theme-on-surface), 0.12)" },
      tooltip: { enabled: false },
    },

    yaxis: {
      tickAmount: 6,
      labels: {
        style: { colors: "rgba(var(--v-theme-on-surface), 0.65)" },
        formatter: (v) => shortNumber(v),
      },
      max: peakMax.value > 0 ? Math.ceil(peakMax.value * 1.08) : undefined,
    },

    tooltip: {
      theme: "dark",
      x: {
        formatter: (val) => {
          const ms = Number(val);
          const d = new Date(ms);
          return d.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit" });
        },
      },
      y: {
        formatter: (v, ctx) => {
          const ms = ctx?.w?.globals?.seriesX?.[0]?.[ctx.dataPointIndex];
          const p = extras.get(ms) || null;
          const cnt = p ? p.count : null;
          const who = p?.topCashierLabel || null;

          const base = `${money(v)}`;
          const more = [];
          if (Number.isFinite(cnt)) more.push(`${cnt} ventas`);
          if (who) more.push(`Cajero: ${who}`);
          return more.length ? `${base} · ${more.join(" · ")}` : base;
        },
      },
    },

    grid: {
      ...apexCommon.value.grid,
      borderColor: "rgba(var(--v-theme-on-surface), 0.10)",
    },

    annotations,
  };
});
/* =========================
   Branch donut options
========================= */
const optBranchDonut = computed(() => ({
  ...apexCommon.value,
  chart: { ...apexCommon.value.chart, type: "donut" },
  labels: branchLabels.value,
  stroke: { width: 0 },
  legend: { show: true, position: "bottom" },
  plotOptions: {
    pie: {
      donut: {
        size: "70%",
        labels: {
          show: true,
          total: { show: true, label: "Total", formatter: () => money(branchTotalSum.value) },
        },
      },
    },
  },
  tooltip: { theme: "dark", y: { formatter: (v) => money(v) } },
}));

/* =========================
   Months bar options (barras azules)
========================= */
const optMonthsBar = computed(() => ({
  ...apexCommon.value,
  chart: { ...apexCommon.value.chart, type: "bar" },

  // ✅ FORZAR AZUL (como el donut)
  colors: ["#008FFB"],
  fill: { opacity: 1 },
  stroke: { show: false },

  plotOptions: {
    bar: {
      borderRadius: 10,
      columnWidth: "55%",
      dataLabels: { position: "top" },
    },
  },
  xaxis: {
    categories: monthsLabels.value,
    labels: {
      style: { colors: "rgba(var(--v-theme-on-surface), 0.65)" },
      rotate: -10,
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
  tooltip: { theme: "dark", y: { formatter: (v) => money(v) } },
}));

/* =========================
   Top Cashiers (horizontal) + barras azules
========================= */
const seriesCashiers = computed(() => [
  { name: "Total (ARS)", data: topCashiers5.value.map((x) => Number(x?.total || 0)) },
]);

const cashierCats = computed(() =>
  topCashiers5.value.map((x) =>
    String(
      x?.user_label ||
        x?.user_name ||
        x?.name ||
        x?.username ||
        x?.user?.label ||
        x?.user?.name ||
        x?.user?.username ||
        (x?.user_id ? `User #${x.user_id}` : "—")
    )
  )
);

const optCashiersBar = computed(() => ({
  ...apexCommon.value,
  chart: { ...apexCommon.value.chart, type: "bar" },

  // ✅ FORZAR AZUL
  colors: ["#008FFB"],
  fill: { opacity: 1 },
  stroke: { show: false },

  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 8,
      borderRadiusApplication: "end",
      barHeight: "60%",
    },
  },
  xaxis: {
    categories: cashierCats.value,
    labels: {
      style: { colors: "rgba(var(--v-theme-on-surface), 0.65)" },
      formatter: (v) => shortNumber(v),
    },
    axisBorder: { color: "rgba(var(--v-theme-on-surface), 0.12)" },
    axisTicks: { color: "rgba(var(--v-theme-on-surface), 0.12)" },
  },
  yaxis: { labels: { style: { colors: "rgba(var(--v-theme-on-surface), 0.75)" } } },
  tooltip: { theme: "dark", y: { formatter: (v) => money(v) } },
}));
/* =========================
   Top Products (horizontal) + barras azules
========================= */
const seriesProducts = computed(() => [
  { name: "Total (ARS)", data: topProducts5.value.map((x) => Number(x?.total || 0)) },
]);

const productCats = computed(() =>
  topProducts5.value.map((x) =>
    String(x?.product_name || x?.name || x?.product?.name || (x?.product_id ? `Producto #${x.product_id}` : "—"))
  )
);

const optProductsBar = computed(() => ({
  ...apexCommon.value,
  chart: { ...apexCommon.value.chart, type: "bar" },

  // ✅ FORZAR AZUL
  colors: ["#008FFB"],
  fill: { opacity: 1 },
  stroke: { show: false },

  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 8,
      borderRadiusApplication: "end",
      barHeight: "60%",
    },
  },
  xaxis: {
    categories: productCats.value,
    labels: {
      style: { colors: "rgba(var(--v-theme-on-surface), 0.65)" },
      formatter: (v) => shortNumber(v),
    },
    axisBorder: { color: "rgba(var(--v-theme-on-surface), 0.12)" },
    axisTicks: { color: "rgba(var(--v-theme-on-surface), 0.12)" },
  },
  yaxis: { labels: { style: { colors: "rgba(var(--v-theme-on-surface), 0.75)" } } },
  tooltip: { theme: "dark", y: { formatter: (v) => money(v) } },
}));

/* =========================
   Table headers
========================= */
const headers = [
  { title: "ID", key: "id", sortable: false, width: 90 },
  { title: "Fecha", key: "sold_at", sortable: false, width: 200 },
  { title: "Sucursal", key: "branch", sortable: false, width: 180 },
  { title: "Usuario", key: "user", sortable: false, width: 220 },
  { title: "Total", key: "total", sortable: false, width: 180 },
];
</script>

<style scoped>
.dash-surface {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
}

.dsales {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.ds-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 14px 10px 14px;
}

.ds-title {
  font-weight: 900;
  letter-spacing: 0.2px;
  font-size: 14px;
}

.ds-sub {
  margin-top: 2px;
}

.ds-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.ds-period {
  min-width: 190px;
}

.ds-body {
  padding: 0;
}

.ds-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px 14px 14px;
}

.sep {
  opacity: 0.6;
}

.chip-soft {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
}

.dash-table :deep(.v-table__wrapper),
.dash-table :deep(table),
.dash-table :deep(.v-data-table__wrapper) {
  background: transparent !important;
}

:deep(.v-select .v-field__input) {
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}

@media (max-width: 600px) {
  .ds-head {
    flex-direction: column;
    align-items: stretch;
  }
  .ds-right {
    justify-content: flex-start;
  }
  .ds-period {
    min-width: 100%;
  }
}
</style>