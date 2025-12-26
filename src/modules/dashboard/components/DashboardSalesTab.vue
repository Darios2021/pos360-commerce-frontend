<!-- src/modules/dashboard/components/DashboardSalesTab.vue -->
<template>
  <!-- KPIs -->
  <v-row dense class="mb-3">
    <v-col cols="12" md="3">
      <KpiCard title="Ventas hoy" :value="sales.todayCount" :loading="loading" icon="mdi-receipt-text-outline" tone="primary" />
    </v-col>
    <v-col cols="12" md="3">
      <KpiCard title="Total hoy" :value="money(sales.todayTotal)" :loading="loading" icon="mdi-cash-multiple" tone="success" />
    </v-col>
    <v-col cols="12" md="3">
      <KpiCard title="Ticket promedio" :value="money(sales.avgTicket)" :loading="loading" icon="mdi-calculator" tone="info" />
    </v-col>
    <v-col cols="12" md="3">
      <KpiCard title="Método principal" :value="sales.topPaymentLabel || '—'" :loading="loading" icon="mdi-credit-card-outline" tone="indigo" />
    </v-col>
  </v-row>

  <v-row dense>
    <!-- LINE + tabla -->
    <v-col cols="12" lg="8">
      <v-card class="rounded-xl" elevation="0" style="background:rgba(0,0,0,.02); border:1px solid rgba(0,0,0,.06);">
        <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
          <div class="text-subtitle-1 font-weight-bold">Ventas últimos 7 días</div>
          <v-chip size="small" variant="tonal">Scope: <b class="ml-1">{{ scopeLabel }}</b></v-chip>
        </v-card-title>
        <v-divider />
        <v-card-text>
          <div v-if="loading" class="py-8 d-flex justify-center">
            <v-progress-circular indeterminate />
          </div>
          <div v-else>
            <LineChart :points="sales.salesByDay || []" :height="170" />
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- PIE: ventas por sucursal -->
    <v-col cols="12" lg="4">
      <v-card class="rounded-xl" elevation="0" style="background:rgba(0,0,0,.02); border:1px solid rgba(0,0,0,.06);">
        <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
          <div class="text-subtitle-1 font-weight-bold">Ventas por sucursal</div>
          <v-chip v-if="!isAdmin" size="small" variant="tonal">Solo tu sucursal</v-chip>
        </v-card-title>
        <v-divider />
        <v-card-text>
          <div v-if="loading" class="py-8 d-flex justify-center">
            <v-progress-circular indeterminate />
          </div>

          <div v-else>
            <div v-if="!pieItems.length" class="text-caption text-medium-emphasis">
              No hay datos (falta <code>salesByBranch</code> en backend).
            </div>

            <div v-else class="d-flex flex-column align-center">
              <PieChart :items="pieItems" :size="180" />

              <div class="mt-3 w-100">
                <div v-for="it in pieItems" :key="it.key" class="d-flex align-center justify-space-between py-1">
                  <div class="d-flex align-center ga-2">
                    <span class="dot" :style="{ background: it.color }"></span>
                    <div class="text-body-2 font-weight-medium">{{ it.label }}</div>
                  </div>
                  <div class="text-body-2 font-weight-bold">{{ money(it.value) }}</div>
                </div>
              </div>
            </div>

          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <!-- Últimas ventas -->
  <v-row dense class="mt-2">
    <v-col cols="12">
      <v-card class="rounded-xl" elevation="0" style="background:#fff; border:1px solid rgba(0,0,0,.06);">
        <v-card-title class="text-subtitle-1 font-weight-bold">Últimas ventas</v-card-title>
        <v-divider />
        <v-card-text>
          <div v-if="loading" class="py-8 d-flex justify-center">
            <v-progress-circular indeterminate />
          </div>

          <div v-else>
            <v-data-table
              :headers="headers"
              :items="sales.lastSales || []"
              item-key="id"
              density="comfortable"
              class="elevation-0 rounded-xl"
            >
              <template #item.sold_at="{ item }">
                <div class="font-weight-medium">{{ dt(item.sold_at) }}</div>
                <div class="text-caption text-medium-emphasis">#{{ item.id }}</div>
              </template>

              <template #item.total="{ item }">
                <div class="font-weight-black">{{ money(item.total) }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ methodLabel(item?.payments?.[0]?.method) }}
                </div>
              </template>

              <template #bottom />
            </v-data-table>

            <div v-if="!(sales.lastSales || []).length" class="text-caption text-medium-emphasis">
              Sin ventas.
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed } from "vue";
import KpiCard from "./KpiCard.vue";

const props = defineProps({
  loading: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  scopeLabel: { type: String, default: "" },
  sales: { type: Object, default: () => ({}) },
});

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

const headers = [
  { title: "Fecha", key: "sold_at", sortable: false, width: 200 },
  { title: "Cliente", key: "customer_name", sortable: false },
  { title: "Total", key: "total", sortable: false, width: 180 },
  { title: "Estado", key: "status", sortable: false, width: 130 },
];

// ✅ Pie items desde backend: salesByBranch: [{branch_id, branch_name, total, count}]
const pieItems = computed(() => {
  const rows = Array.isArray(props.sales?.salesByBranch) ? props.sales.salesByBranch : [];
  const palette = [
    "rgb(var(--v-theme-primary))",
    "rgb(var(--v-theme-success))",
    "rgb(var(--v-theme-info))",
    "rgb(var(--v-theme-warning))",
    "rgb(var(--v-theme-indigo))",
    "rgb(var(--v-theme-purple))",
    "rgb(var(--v-theme-teal))",
  ];

  return rows
    .map((r, i) => ({
      key: String(r.branch_id ?? i),
      label: r.branch_name || `Sucursal #${r.branch_id}`,
      value: Number(r.total || 0),
      color: palette[i % palette.length],
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);
});

/**
 * ✅ Line chart SVG (Vuetify-safe)
 */
const LineChart = {
  props: { points: { type: Array, default: () => [] }, height: { type: Number, default: 170 } },
  computed: {
    w() { return 900; },
    pad() { return 18; },
    values() {
      const arr = Array.isArray(this.points) ? this.points : [];
      const vals = arr.map((p) => Number(p?.total || 0));
      return vals.length ? vals : [0];
    },
    minV() { return Math.min(...this.values, 0); },
    maxV() { return Math.max(...this.values, 1); },
    poly() {
      const arr = Array.isArray(this.points) ? this.points : [];
      const n = arr.length || 1;

      const x0 = this.pad, x1 = this.w - this.pad;
      const y0 = this.pad, y1 = this.height - this.pad;
      const spanX = x1 - x0, spanY = y1 - y0;

      const minV = this.minV, maxV = this.maxV;
      const den = (maxV - minV) || 1;

      const pts = arr.map((p, i) => {
        const x = x0 + (spanX * (n === 1 ? 0 : i / (n - 1)));
        const v = Number(p?.total || 0);
        const t = (v - minV) / den;
        const y = y1 - spanY * t;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      });

      return pts.join(" ");
    },
    gridY() {
      const y0 = this.pad;
      const y1 = this.height - this.pad;
      const ys = [];
      for (let i = 0; i <= 3; i++) ys.push(y0 + ((y1 - y0) * i) / 3);
      return ys;
    },
  },
  template: `
    <svg class="chart" :viewBox="\`0 0 \${w} \${height}\`" preserveAspectRatio="none">
      <line v-for="(y,i) in gridY" :key="'gy'+i" :x1="pad" :x2="w-pad" :y1="y" :y2="y"
        stroke="rgba(0,0,0,.10)" stroke-width="1" />
      <polygon v-if="poly"
        :points="\`\${poly} \${w-pad},\${height-pad} \${pad},\${height-pad}\`"
        fill="rgba(0,0,0,.05)" />
      <polyline :points="poly" fill="none" stroke="rgb(var(--v-theme-primary))"
        stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `,
};

/**
 * ✅ Pie chart SVG
 */
const PieChart = {
  props: { items: { type: Array, default: () => [] }, size: { type: Number, default: 180 } },
  computed: {
    total() { return (this.items || []).reduce((a, x) => a + Number(x.value || 0), 0) || 1; },
    r() { return Math.floor(this.size / 2) - 6; },
    c() { return Math.floor(this.size / 2); },
    arcs() {
      const res = [];
      let a0 = -Math.PI / 2; // start at top
      for (const it of (this.items || [])) {
        const frac = Number(it.value || 0) / this.total;
        const a1 = a0 + frac * Math.PI * 2;
        res.push({ ...it, a0, a1, frac });
        a0 = a1;
      }
      return res;
    },
  },
  methods: {
    polar(cx, cy, r, a) {
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    },
    pathForArc(a0, a1) {
      const { c, r } = this;
      const p0 = this.polar(c, c, r, a0);
      const p1 = this.polar(c, c, r, a1);
      const large = (a1 - a0) > Math.PI ? 1 : 0;
      return `M ${c} ${c} L ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y} Z`;
    },
  },
  template: `
    <svg :width="size" :height="size" :viewBox="\`0 0 \${size} \${size}\`">
      <circle :cx="c" :cy="c" :r="r" fill="rgba(0,0,0,.06)" />
      <path
        v-for="(a,i) in arcs"
        :key="a.key || i"
        :d="pathForArc(a.a0, a.a1)"
        :fill="a.color"
        opacity="0.95"
      />
      <circle :cx="c" :cy="c" :r="Math.max(0, r*0.55)" fill="#fff" opacity="0.95" />
      <text :x="c" :y="c-2" text-anchor="middle" font-size="12" fill="rgba(0,0,0,.6)">Total</text>
      <text :x="c" :y="c+16" text-anchor="middle" font-size="14" font-weight="700" fill="rgba(0,0,0,.85)">
        {{ total.toLocaleString("es-AR") }}
      </text>
    </svg>
  `,
};
</script>

<style scoped>
.chart { width: 100%; height: 170px; display:block; }
.w-100 { width: 100%; }
.dot { width: 10px; height: 10px; border-radius: 999px; display:inline-block; }
</style>
