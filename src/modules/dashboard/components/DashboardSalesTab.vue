<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/dashboard/components/DashboardSalesTab.vue -->
<template>
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

  <!-- Charts -->
  <v-row dense>
    <!-- 7D -->
    <v-col cols="12">
      <v-card class="dash-surface rounded-xl" elevation="0">
        <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
          <div class="text-subtitle-1 font-weight-bold">Ventas últimos 7 días</div>

          <div class="d-flex align-center ga-2">
            <v-chip size="small" variant="tonal">
              Scope: <b class="ml-1">{{ scopeLabel }}</b>
            </v-chip>

            <v-select
              v-model="periodLocal"
              :items="periodItems"
              item-title="title"
              item-value="value"
              density="compact"
              variant="outlined"
              hide-details
              style="min-width: 210px"
              @update:modelValue="emitPeriod"
            />
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text>
          <div v-if="loading" class="py-8 d-flex justify-center">
            <v-progress-circular indeterminate />
          </div>

          <div v-else>
            <NiceLineChart
              :points="sales7d"
              :height="190"
              y-label="ARS"
            />
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Peaks -->
    <v-col cols="12" class="mt-2">
      <v-card class="dash-surface rounded-xl" elevation="0">
        <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
          <div class="text-subtitle-1 font-weight-bold">Ventas (picos)</div>
          <v-chip size="small" variant="tonal">{{ periodLabel }}</v-chip>
        </v-card-title>

        <v-divider />

        <v-card-text>
          <div v-if="loading" class="py-8 d-flex justify-center">
            <v-progress-circular indeterminate />
          </div>

          <div v-else>
            <div v-if="!salesPeaks.length" class="text-caption text-medium-emphasis">
              Sin datos para graficar.
            </div>

            <div v-else>
              <NiceLineChart
                :points="salesPeaks"
                :height="220"
                y-label="ARS"
                :show-dots="true"
              />

              <div class="text-caption text-medium-emphasis mt-2">
                Pico máx: <b>{{ money(peakMax) }}</b> el <b>{{ peakDate || "—" }}</b>
                · Promedio/día: <b>{{ money(avgPerDay) }}</b>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <!-- Top tables -->
  <v-row dense class="mt-2">
    <!-- Top cashiers -->
    <v-col cols="12" lg="6">
      <v-card class="dash-surface rounded-xl" elevation="0">
        <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
          <div class="text-subtitle-1 font-weight-bold">Top cajeros ({{ periodLabelShort }})</div>
          <v-chip size="small" variant="tonal">{{ topCashiers.length ? periodLabel : "Sin datos" }}</v-chip>
        </v-card-title>

        <v-divider />

        <v-card-text>
          <div v-if="loading" class="py-8 d-flex justify-center">
            <v-progress-circular indeterminate />
          </div>

          <div v-else>
            <v-data-table
              :headers="cashierHeaders"
              :items="topCashiers"
              item-key="user_id"
              density="comfortable"
              class="elevation-0 rounded-xl dash-table"
            >
              <template #item.rank="{ index }">
                <div class="font-weight-bold">#{{ index + 1 }}</div>
              </template>

              <template #item.user_label="{ item }">
                <div class="text-body-2 font-weight-medium">{{ item.user_label || "—" }}</div>
                <div class="text-caption text-medium-emphasis">Ventas: {{ num(item.count) }}</div>
              </template>

              <template #item.total="{ item }">
                <div class="font-weight-black">{{ money(item.total) }}</div>
              </template>

              <template #bottom />
            </v-data-table>

            <div v-if="!topCashiers.length" class="text-caption text-medium-emphasis mt-2">
              Sin cajeros con ventas en el período.
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Top products -->
    <v-col cols="12" lg="6">
      <v-card class="dash-surface rounded-xl" elevation="0">
        <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
          <div class="text-subtitle-1 font-weight-bold">Top productos más vendidos ({{ periodLabelShort }})</div>
          <v-chip size="small" variant="tonal">{{ topProducts.length ? periodLabel : "Sin datos" }}</v-chip>
        </v-card-title>

        <v-divider />

        <v-card-text>
          <div v-if="loading" class="py-8 d-flex justify-center">
            <v-progress-circular indeterminate />
          </div>

          <div v-else>
            <v-data-table
              :headers="productHeaders"
              :items="topProducts"
              item-key="product_id"
              density="comfortable"
              class="elevation-0 rounded-xl dash-table"
            >
              <template #item.rank="{ index }">
                <div class="font-weight-bold">#{{ index + 1 }}</div>
              </template>

              <template #item.product="{ item }">
                <div class="font-weight-bold">{{ item.product_name || `Producto #${item.product_id}` }}</div>
                <div class="text-caption text-medium-emphasis">SKU: {{ item.sku || "—" }}</div>
              </template>

              <template #item.units="{ item }">
                <div class="font-weight-bold">{{ num(item.units) }}</div>
              </template>

              <template #item.total="{ item }">
                <div class="font-weight-black">{{ money(item.total) }}</div>
              </template>

              <template #bottom />
            </v-data-table>

            <div v-if="!topProducts.length" class="text-caption text-medium-emphasis mt-2">
              Sin productos vendidos en el período.
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <!-- Últimas ventas -->
  <v-row dense class="mt-2">
    <v-col cols="12">
      <v-card class="dash-surface rounded-xl" elevation="0">
        <v-card-title class="text-subtitle-1 font-weight-bold">Últimas ventas (pagadas)</v-card-title>
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
</template>

<script setup>
import { computed, ref, watch } from "vue";
import KpiCard from "./KpiCard.vue";

/**
 * ✅ Compat:
 * - backend nuevo: salesByPeriodDaily / topCashiersPeriod / topProductsPeriod / topBranchPeriod / bestMonthPeriod
 * - backend viejo: salesByDay30 / topCashiers30d / topProducts30d / topBranch30d / bestMonth12m
 *
 * ✅ Period:
 * - emite "period-change" para que el padre refetchee
 */
const props = defineProps({
  loading: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  scopeLabel: { type: String, default: "" },
  sales: { type: Object, default: () => ({}) },

  // opcional: si el padre maneja el período
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

function num(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}
function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}
function dt(val) {
  if (!val) return "—";
  return new Date(val).toLocaleString("es-AR");
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

const today = computed(() => {
  const t = props.sales?.today;
  if (t && typeof t === "object") return t;
  return { count: 0, total: 0, avgTicket: 0 };
});

// ✅ 7 días (se mantiene)
const sales7d = computed(() => (Array.isArray(props.sales?.salesByDay) ? props.sales.salesByDay : []));

// ✅ Picos por período: nuevo primero, viejo fallback
const salesPeaks = computed(() => {
  if (Array.isArray(props.sales?.salesByPeriodDaily)) return props.sales.salesByPeriodDaily;
  if (Array.isArray(props.sales?.salesByDay30)) return props.sales.salesByDay30;
  return [];
});

const lastSales = computed(() => (Array.isArray(props.sales?.lastSales) ? props.sales.lastSales : []));

// ✅ Top sucursal: nuevo primero, viejo fallback
const topBranch = computed(() => props.sales?.topBranchPeriod || props.sales?.topBranch30d || null);

// ✅ Top cajeros: nuevo primero, viejo fallback
const topCashiers = computed(() => {
  if (Array.isArray(props.sales?.topCashiersPeriod)) return props.sales.topCashiersPeriod;
  if (Array.isArray(props.sales?.topCashiers30d)) return props.sales.topCashiers30d;
  return [];
});

// ✅ Top productos: nuevo primero, viejo fallback
const topProducts = computed(() => {
  if (Array.isArray(props.sales?.topProductsPeriod)) return props.sales.topProductsPeriod;
  if (Array.isArray(props.sales?.topProducts30d)) return props.sales.topProducts30d;
  return [];
});

// ✅ Mejor mes: nuevo primero, viejo fallback
const bestMonth = computed(() => props.sales?.bestMonthPeriod || props.sales?.bestMonth12m || null);

const topBranchLabel = computed(() => {
  if (!topBranch.value) return "—";
  return topBranch.value.branch_name || `Sucursal #${topBranch.value.branch_id}`;
});
const topBranchSub = computed(() => {
  if (!topBranch.value) return props.scopeLabel ? `Scope: ${props.scopeLabel}` : "";
  return `${money(topBranch.value.total)} · ${num(topBranch.value.count)} ventas`;
});

function monthLabel(ym) {
  if (!ym) return "—";
  const [y, m] = String(ym).split("-");
  const d = new Date(Number(y || 2000), Number(m || 1) - 1, 1);
  return d.toLocaleDateString("es-AR", { year: "numeric", month: "long" });
}

const bestMonthLabel = computed(() => {
  if (!bestMonth.value) return "—";
  return monthLabel(bestMonth.value.ym);
});
const bestMonthSub = computed(() => {
  if (!bestMonth.value) return props.scopeLabel ? `Scope: ${props.scopeLabel}` : "";
  return `${money(bestMonth.value.total)} · ${num(bestMonth.value.count)} ventas`;
});

const peakMax = computed(() => {
  const arr = salesPeaks.value;
  let max = 0;
  for (const p of arr) max = Math.max(max, Number(p?.total || 0));
  return max;
});
const peakDate = computed(() => {
  const arr = salesPeaks.value;
  let best = null;
  let max = -1;
  for (const p of arr) {
    const v = Number(p?.total || 0);
    if (v > max) {
      max = v;
      best = p?.date || null;
    }
  }
  return best;
});
const avgPerDay = computed(() => {
  const arr = salesPeaks.value;
  if (!arr.length) return 0;
  const sum = arr.reduce((a, p) => a + Number(p?.total || 0), 0);
  return sum / arr.length;
});

const headers = [
  { title: "ID", key: "id", sortable: false, width: 90 },
  { title: "Fecha", key: "sold_at", sortable: false, width: 200 },
  { title: "Sucursal", key: "branch", sortable: false, width: 180 },
  { title: "Usuario", key: "user", sortable: false, width: 220 },
  { title: "Total", key: "total", sortable: false, width: 180 },
];

const cashierHeaders = [
  { title: "#", key: "rank", sortable: false, width: 60 },
  { title: "Cajero", key: "user_label", sortable: false },
  { title: "Total", key: "total", sortable: false, width: 170 },
];

const productHeaders = [
  { title: "#", key: "rank", sortable: false, width: 60 },
  { title: "Producto", key: "product", sortable: false },
  { title: "Unid.", key: "units", sortable: false, width: 110 },
  { title: "Total", key: "total", sortable: false, width: 170 },
];

/**
 * ✅ Chart SVG mejorado:
 * - grid + labels
 * - curva suavizada (bezier)
 * - area con gradient
 * - dots opcionales
 */
const NiceLineChart = {
  props: {
    points: { type: Array, default: () => [] },
    height: { type: Number, default: 190 },
    yLabel: { type: String, default: "" },
    showDots: { type: Boolean, default: false },
  },
  computed: {
    w() {
      return 1000;
    },
    padL() {
      return 56;
    },
    padR() {
      return 18;
    },
    padT() {
      return 16;
    },
    padB() {
      return 32;
    },
    arr() {
      return Array.isArray(this.points) ? this.points : [];
    },
    vals() {
      const v = this.arr.map((p) => Number(p?.total || 0));
      return v.length ? v : [0];
    },
    minV() {
      return Math.min(...this.vals, 0);
    },
    maxV() {
      return Math.max(...this.vals, 1);
    },
    den() {
      return (this.maxV - this.minV) || 1;
    },
    x0() {
      return this.padL;
    },
    x1() {
      return this.w - this.padR;
    },
    y0() {
      return this.padT;
    },
    y1() {
      return this.height - this.padB;
    },
    pts() {
      const n = this.arr.length || 1;
      const spanX = this.x1 - this.x0;
      const spanY = this.y1 - this.y0;

      return this.arr.map((p, i) => {
        const x = this.x0 + spanX * (n === 1 ? 0 : i / (n - 1));
        const v = Number(p?.total || 0);
        const t = (v - this.minV) / this.den;
        const y = this.y1 - spanY * t;
        return { x, y, v, label: String(p?.date || "") };
      });
    },
    // Catmull-Rom -> Bezier path
    d() {
      const p = this.pts;
      if (!p.length) return "";
      if (p.length === 1) return `M ${p[0].x} ${p[0].y}`;

      const cr = (p0, p1, p2, p3, t) => {
        const d1 = (p2 - p0) * t;
        const d2 = (p3 - p1) * t;
        return [p1 + d1 / 6, p2 - d2 / 6];
      };

      let d = `M ${p[0].x.toFixed(2)} ${p[0].y.toFixed(2)}`;
      const t = 1;

      for (let i = 0; i < p.length - 1; i++) {
        const p0 = p[i - 1] || p[i];
        const p1 = p[i];
        const p2 = p[i + 1];
        const p3 = p[i + 2] || p2;

        const [c1x, c2x] = cr(p0.x, p1.x, p2.x, p3.x, t);
        const [c1y, c2y] = cr(p0.y, p1.y, p2.y, p3.y, t);

        d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
      }
      return d;
    },
    areaD() {
      if (!this.d) return "";
      return `${this.d} L ${this.x1.toFixed(2)} ${this.y1.toFixed(2)} L ${this.x0.toFixed(2)} ${this.y1.toFixed(2)} Z`;
    },
    gridY() {
      const ys = [];
      for (let i = 0; i <= 4; i++) ys.push(this.y0 + ((this.y1 - this.y0) * i) / 4);
      return ys;
    },
    gridYVals() {
      const arr = [];
      for (let i = 0; i <= 4; i++) {
        const t = 1 - i / 4;
        const v = this.minV + this.den * t;
        arr.push(v);
      }
      return arr;
    },
    xLabels() {
      // 3 labels: inicio / medio / fin
      const p = this.pts;
      if (p.length < 2) return [];
      const mid = p[Math.floor(p.length / 2)];
      return [p[0], mid, p[p.length - 1]];
    },
  },
  methods: {
    fmtShort(n) {
      const v = Number(n || 0);
      if (v >= 1_000_000) return `${Math.round(v / 100_000) / 10}M`;
      if (v >= 1_000) return `${Math.round(v / 100) / 10}k`;
      return `${Math.round(v)}`;
    },
    fmtDate(s) {
      // "YYYY-MM-DD" -> "MM-DD" (simple)
      const x = String(s || "");
      if (x.length >= 10) return x.slice(5, 10);
      return x || "—";
    },
  },
  template: `
    <svg class="chart" :viewBox="\`0 0 \${w} \${height}\`" preserveAspectRatio="none">
      <defs>
        <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="rgb(var(--v-theme-primary))" stop-opacity=".22"/>
          <stop offset="1" stop-color="rgb(var(--v-theme-primary))" stop-opacity="0"/>
        </linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgb(var(--v-theme-primary))" flood-opacity=".18"/>
        </filter>
      </defs>

      <!-- Grid + Y labels -->
      <g>
        <line v-for="(y,i) in gridY" :key="'gy'+i"
          :x1="padL" :x2="w-padR" :y1="y" :y2="y"
          stroke="rgba(var(--v-theme-on-surface), .10)" stroke-width="1" />
        <text v-for="(v,i) in gridYVals" :key="'yl'+i"
          :x="padL-10" :y="gridY[i]+4"
          text-anchor="end"
          font-size="12"
          fill="rgba(var(--v-theme-on-surface), .55)">
          {{ fmtShort(v) }}
        </text>
      </g>

      <!-- Area -->
      <path v-if="areaD" :d="areaD" fill="url(#gArea)"></path>

      <!-- Line -->
      <path v-if="d" :d="d"
        fill="none"
        stroke="rgb(var(--v-theme-primary))"
        stroke-width="3"
        stroke-linecap="round"
        filter="url(#soft)">
      </path>

      <!-- Dots -->
      <g v-if="showDots">
        <circle v-for="(p,i) in pts" :key="'pt'+i"
          :cx="p.x" :cy="p.y" r="3"
          fill="rgb(var(--v-theme-primary))"
          stroke="rgb(var(--v-theme-surface))"
          stroke-width="2"/>
      </g>

      <!-- X labels -->
      <g>
        <text v-for="(p,i) in xLabels" :key="'xl'+i"
          :x="p.x" :y="height-12"
          text-anchor="middle"
          font-size="12"
          fill="rgba(var(--v-theme-on-surface), .55)">
          {{ fmtDate(p.label) }}
        </text>
      </g>
    </svg>
  `,
};
</script>

<style scoped>
.dash-surface {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
}

.chart {
  width: 100%;
  display: block;
  height: auto;
}

/* Tablas en dark: evita “caja blanca” */
.dash-table :deep(.v-table__wrapper),
.dash-table :deep(table),
.dash-table :deep(.v-data-table__wrapper) {
  background: transparent !important;
}

/* Select compact en header */
:deep(.v-select .v-field__input) {
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}
</style>