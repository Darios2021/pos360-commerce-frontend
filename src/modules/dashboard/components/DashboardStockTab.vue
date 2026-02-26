<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/dashboard/components/DashboardStockTab.vue -->

<template>
  <div class="dstk">
    <!-- KPIs -->
    <v-row dense class="mb-3">
      <v-col cols="12" md="4">
        <KpiCard
          title="Sin stock"
          :value="num(stock.outOfStockCount)"
          :loading="loading"
          icon="mdi-close-octagon-outline"
          tone="error"
        />
      </v-col>
      <v-col cols="12" md="4">
        <KpiCard
          title="Stock bajo"
          :value="num(stock.lowStockCount)"
          :loading="loading"
          icon="mdi-alert-outline"
          tone="warning"
        />
      </v-col>
      <v-col cols="12" md="4">
        <KpiCard
          title="Productos con stock (track)"
          :value="num(stock.trackedProducts)"
          :loading="loading"
          icon="mdi-radar"
          tone="primary"
        />
      </v-col>
    </v-row>

    <v-row dense>
      <!-- Charts -->
      <v-col cols="12" lg="5">
        <v-card class="dash-surface rounded-xl" elevation="0">
          <div class="card-head">
            <div class="minw-0">
              <div class="card-title">Estado de stock por sucursal</div>
              <div class="card-sub text-caption text-medium-emphasis">
                Proporción (sin stock / bajo / ok)
              </div>
            </div>

            <div class="head-right">
              <v-chip size="small" variant="tonal" class="chip-soft">
                Total track: <b class="ml-1">{{ totalAll }}</b>
              </v-chip>
            </div>
          </div>

          <v-divider />

          <div class="card-body">
            <div v-if="loading" class="py-10 d-flex justify-center">
              <v-progress-circular indeterminate />
            </div>

            <div v-else>
              <div v-if="!rows.length" class="text-caption text-medium-emphasis px-4 py-6">
                Sin datos para graficar.
              </div>

              <div v-else>
                <!-- ✅ 100% stacked por sucursal -->
                <ApexChart
                  height="320"
                  type="bar"
                  :options="optStackByBranch"
                  :series="seriesStackByBranch"
                />

                <!-- ✅ Resumen global -->
                <div class="mt-3">
                  <div class="d-flex align-center justify-space-between px-2">
                    <div class="text-subtitle-2 font-weight-bold">Resumen global</div>
                    <div class="text-caption text-medium-emphasis">
                      Out <b>{{ sumOut }}</b> · Low <b>{{ sumLow }}</b> · OK <b>{{ sumOk }}</b>
                    </div>
                  </div>

                  <ApexChart
                    height="220"
                    type="donut"
                    :options="optDonutGlobal"
                    :series="seriesDonutGlobal"
                  />
                </div>

                <v-alert type="info" variant="tonal" class="rounded-xl mt-2">
                  Tip: pasá el mouse por una barra para ver <b>cantidad</b> y <b>%</b> por sucursal.
                </v-alert>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Tabla stock bajo -->
      <v-col cols="12" lg="7">
        <v-card class="dash-surface rounded-xl" elevation="0">
          <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
            <div class="text-subtitle-1 font-weight-bold">Productos críticos (stock bajo / 0)</div>
            <v-chip size="small" variant="tonal">
              Scope: <b class="ml-1">{{ scopeLabel }}</b>
            </v-chip>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <div v-if="loading" class="py-8 d-flex justify-center">
              <v-progress-circular indeterminate />
            </div>

            <div v-else>
              <v-data-table
                :headers="headers"
                :items="lowItems"
                item-key="product_id"
                density="comfortable"
                class="elevation-0 rounded-xl dash-table"
              >
                <template #item.product="{ item }">
                  <div class="font-weight-bold">{{ item.name || `Producto #${item.product_id}` }}</div>
                  <div class="text-caption text-medium-emphasis">SKU: {{ item.sku || "—" }}</div>
                </template>

                <template #item.scope="{ item }">
                  <div class="text-body-2 font-weight-medium">
                    {{ item.branch_name || (item.branch_id ? `Sucursal #${item.branch_id}` : "—") }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ item.warehouse_name || (item.warehouse_id ? `Depósito #${item.warehouse_id}` : "—") }}
                  </div>
                </template>

                <template #item.stock="{ item }">
                  <v-chip size="small" variant="tonal" :color="Number(item.stock || 0) <= 0 ? 'red' : 'orange'">
                    {{ Number(item.stock || 0) }}
                  </v-chip>
                  <div class="text-caption text-medium-emphasis">
                    Umbral: {{ Number(item.min_stock || stock.lowThreshold || 3) }}
                  </div>
                </template>

                <template #bottom />
              </v-data-table>

              <div v-if="!lowItems.length" class="text-caption text-medium-emphasis mt-2">
                Sin críticos (bien ahí).
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed } from "vue";
import ApexChart from "vue3-apexcharts";
import KpiCard from "./KpiCard.vue";

const props = defineProps({
  loading: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  scopeLabel: { type: String, default: "" },
  stock: { type: Object, default: () => ({}) },
});

function num(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const headers = [
  { title: "Producto", key: "product", sortable: false },
  { title: "Sucursal / Depósito", key: "scope", sortable: false, width: 260 },
  { title: "Stock", key: "stock", sortable: false, width: 140 },
];

const rows = computed(() => {
  const arr = Array.isArray(props.stock?.stockByBranch) ? props.stock.stockByBranch : [];
  return arr.map((r) => {
    const out = num(r.out);
    const low = num(r.low);
    const ok = num(r.ok);
    const total = out + low + ok;
    return {
      key: String(r.branch_id ?? r.branch_name ?? ""),
      label: r.branch_name || `Sucursal #${r.branch_id}`,
      out,
      low,
      ok,
      total,
    };
  });
});

const lowItems = computed(() => (Array.isArray(props.stock?.lowStockItems) ? props.stock.lowStockItems : []));

/* =========================
   Totales globales
========================= */
const sumOut = computed(() => rows.value.reduce((a, r) => a + r.out, 0));
const sumLow = computed(() => rows.value.reduce((a, r) => a + r.low, 0));
const sumOk = computed(() => rows.value.reduce((a, r) => a + r.ok, 0));
const totalAll = computed(() => sumOut.value + sumLow.value + sumOk.value);

/* =========================
   Apex: 100% stacked por sucursal
========================= */
const branchLabels = computed(() => rows.value.map((r) => r.label));

const seriesStackByBranch = computed(() => [
  { name: "Sin stock", data: rows.value.map((r) => r.out) },
  { name: "Stock bajo", data: rows.value.map((r) => r.low) },
  { name: "OK", data: rows.value.map((r) => r.ok) },
]);

function pct(part, total) {
  const p = Number(part || 0);
  const t = Number(total || 0);
  if (t <= 0) return 0;
  return Math.round((p / t) * 100);
}

const optStackByBranch = computed(() => ({
  chart: {
    type: "bar",
    stacked: true,
    stackType: "100%",
    toolbar: { show: false },
    fontFamily: "inherit",
    foreColor: "rgba(var(--v-theme-on-surface), 0.75)",
  },
  // ✅ colores claros en dark/light
  colors: ["#FF4560", "#FEB019", "#00E396"],
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 8,
      borderRadiusApplication: "end",
      barHeight: "62%",
    },
  },
  stroke: { width: 0 },
  dataLabels: {
    enabled: true,
    formatter: (val, opts) => {
      // val viene en % en stackType 100
      const i = opts.dataPointIndex;
      const seriesIndex = opts.seriesIndex;
      const r = rows.value[i];
      if (!r || r.total <= 0) return "";
      const raw =
        seriesIndex === 0 ? r.out :
        seriesIndex === 1 ? r.low :
        r.ok;
      const p = pct(raw, r.total);
      return p >= 10 ? `${p}%` : ""; // ✅ evita ensuciar
    },
    style: { fontSize: "12px", fontWeight: 800 },
    dropShadow: { enabled: false },
  },
  grid: {
    borderColor: "rgba(var(--v-theme-on-surface), 0.10)",
    padding: { left: 10, right: 12, top: 6, bottom: 0 },
  },
  xaxis: {
    categories: branchLabels.value,
    labels: {
      style: { colors: "rgba(var(--v-theme-on-surface), 0.65)" },
      formatter: (v) => `${Math.round(Number(v || 0))}%`,
    },
    axisBorder: { color: "rgba(var(--v-theme-on-surface), 0.12)" },
    axisTicks: { color: "rgba(var(--v-theme-on-surface), 0.12)" },
  },
  yaxis: {
    labels: {
      style: { colors: "rgba(var(--v-theme-on-surface), 0.85)" },
      maxWidth: 170,
    },
  },
  legend: {
    show: true,
    position: "bottom",
    labels: { colors: "rgba(var(--v-theme-on-surface), 0.75)" },
  },
  tooltip: {
    theme: "dark",
    y: {
      formatter: (val, ctx) => {
        const i = ctx.dataPointIndex;
        const s = ctx.seriesIndex;
        const r = rows.value[i];
        if (!r) return `${val}`;
        const raw =
          s === 0 ? r.out :
          s === 1 ? r.low :
          r.ok;
        const p = pct(raw, r.total);
        return `${raw} productos · ${p}%`;
      },
    },
  },
}));

/* =========================
   Apex: donut global
========================= */
const seriesDonutGlobal = computed(() => [sumOut.value, sumLow.value, sumOk.value]);

const optDonutGlobal = computed(() => ({
  chart: {
    type: "donut",
    toolbar: { show: false },
    fontFamily: "inherit",
    foreColor: "rgba(var(--v-theme-on-surface), 0.75)",
  },
  labels: ["Sin stock", "Stock bajo", "OK"],
  colors: ["#FF4560", "#FEB019", "#00E396"],
  stroke: { width: 0 },
  legend: {
    show: true,
    position: "bottom",
    labels: { colors: "rgba(var(--v-theme-on-surface), 0.75)" },
  },
  tooltip: {
    theme: "dark",
    y: {
      formatter: (v) => {
        const t = totalAll.value || 1;
        const p = Math.round((Number(v || 0) / t) * 100);
        return `${Number(v || 0)} productos · ${p}%`;
      },
    },
  },
  plotOptions: {
    pie: {
      donut: {
        size: "70%",
        labels: {
          show: true,
          total: {
            show: true,
            label: "Total",
            formatter: () => `${totalAll.value}`,
          },
        },
      },
    },
  },
}));
</script>

<style scoped>
.dash-surface {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
}

.dstk {
  display: flex;
  flex-direction: column;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 14px 10px 14px;
}

.card-title {
  font-weight: 900;
  letter-spacing: 0.2px;
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
  padding: 10px 10px 12px 10px;
}

.chip-soft {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
}

/* Tablas en dark: evita “caja blanca” */
.dash-table :deep(.v-table__wrapper),
.dash-table :deep(table),
.dash-table :deep(.v-data-table__wrapper) {
  background: transparent !important;
}
</style>