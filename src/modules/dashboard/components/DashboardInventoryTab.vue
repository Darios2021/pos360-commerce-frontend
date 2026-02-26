<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/dashboard/components/DashboardInventoryTab.vue -->

<template>
  <div class="dinv">
    <!-- KPIs -->
    <v-row dense class="mb-3">
      <v-col cols="12" md="3">
        <KpiCard
          title="Productos"
          :value="num(inv.totalProducts)"
          :loading="loading"
          icon="mdi-package-variant-closed"
          tone="primary"
        />
      </v-col>
      <v-col cols="12" md="3">
        <KpiCard
          title="Activos"
          :value="num(inv.activeProducts)"
          :loading="loading"
          icon="mdi-check-decagram-outline"
          tone="success"
        />
      </v-col>
      <v-col cols="12" md="3">
        <KpiCard
          title="Sin precio"
          :value="num(inv.noPriceProducts)"
          :loading="loading"
          icon="mdi-tag-off-outline"
          tone="warning"
        />
      </v-col>
      <v-col cols="12" md="3">
        <KpiCard
          title="Categorías"
          :value="num(inv.categories)"
          :loading="loading"
          icon="mdi-shape-outline"
          tone="info"
        />
      </v-col>
    </v-row>

    <!-- Charts -->
    <v-row dense>
      <!-- Status Donut -->
      <v-col cols="12" lg="4">
        <v-card class="dash-surface rounded-xl" elevation="0">
          <div class="card-head">
            <div class="minw-0">
              <div class="card-title">Estado de catálogo</div>
              <div class="card-sub text-caption text-medium-emphasis">
                Activos / Inactivos / Sin precio
              </div>
            </div>

            <div class="head-right">
              <v-chip size="small" variant="tonal" class="chip-soft">
                Total: <b class="ml-1">{{ totalProducts }}</b>
              </v-chip>
            </div>
          </div>

          <v-divider />

          <div class="card-body">
            <div v-if="loading" class="py-10 d-flex justify-center">
              <v-progress-circular indeterminate />
            </div>

            <div v-else>
              <div v-if="!totalProducts" class="text-caption text-medium-emphasis px-4 py-6">
                Sin datos.
              </div>

              <div v-else>
                <ApexChart height="320" type="donut" :options="optStatusDonut" :series="seriesStatusDonut" />
                <div class="px-4 pb-4 text-caption text-medium-emphasis">
                  Tip: tocá una porción para aislarla.
                </div>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Bars -->
      <v-col cols="12" lg="8">
        <v-card class="dash-surface rounded-xl" elevation="0">
          <div class="card-head">
            <div class="minw-0">
              <div class="card-title">Calidad de datos</div>
              <div class="card-sub text-caption text-medium-emphasis">
                Resumen rápido de problemas típicos
              </div>
            </div>

            <div class="head-right">
              <v-chip size="small" variant="tonal" class="chip-soft">
                Activos: <b class="ml-1">{{ activeProducts }}</b>
              </v-chip>
              <v-chip size="small" variant="tonal" class="chip-soft">
                Sin precio: <b class="ml-1">{{ noPriceProducts }}</b>
              </v-chip>
            </div>
          </div>

          <v-divider />

          <div class="card-body">
            <div v-if="loading" class="py-10 d-flex justify-center">
              <v-progress-circular indeterminate />
            </div>

            <div v-else>
              <ApexChart height="320" type="bar" :options="optQualityBars" :series="seriesQualityBars" />

              <v-alert type="info" variant="tonal" class="rounded-xl mt-3">
                Si querés, agrego un gráfico “Top categorías con más productos sin precio” (cuando el backend lo mande).
              </v-alert>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Últimos productos -->
    <v-row dense class="mt-2">
      <v-col cols="12">
        <v-card class="dash-surface rounded-xl" elevation="0">
          <div class="card-head">
            <div class="minw-0">
              <div class="card-title">Últimos productos</div>
              <div class="card-sub text-caption text-medium-emphasis">
                Altas recientes (con estado)
              </div>
            </div>

            <div class="head-right">
              <v-chip size="small" variant="tonal" class="chip-soft">
                Mostrando: <b class="ml-1">{{ lastProducts.length }}</b>
              </v-chip>
            </div>
          </div>

          <v-divider />

          <v-card-text>
            <div v-if="loading" class="py-8 d-flex justify-center">
              <v-progress-circular indeterminate />
            </div>

            <div v-else>
              <v-list density="compact" class="bg-transparent">
                <v-list-item v-for="p in lastProducts" :key="p.id" class="px-0">
                  <template #prepend>
                    <v-avatar size="36" rounded="lg" class="p-ico">
                      <v-icon size="18">mdi-package-variant</v-icon>
                    </v-avatar>
                  </template>

                  <v-list-item-title class="text-body-2 font-weight-bold">
                    {{ p.name || `Producto #${p.id}` }}
                  </v-list-item-title>

                  <v-list-item-subtitle class="text-caption">
                    SKU: {{ p.sku || "—" }}
                    · Cat: {{ p?.category?.name || "—" }}
                    <span v-if="p?.category?.parent?.name"> ({{ p.category.parent.name }})</span>
                  </v-list-item-subtitle>

                  <template #append>
                    <div class="d-flex align-center ga-2">
                      <v-chip
                        v-if="isNoPrice(p)"
                        size="small"
                        variant="tonal"
                        color="orange"
                      >
                        Sin precio
                      </v-chip>

                      <v-chip
                        size="small"
                        variant="tonal"
                        :color="String(p.is_active ?? 1) === '1' ? 'green' : 'grey'"
                      >
                        {{ String(p.is_active ?? 1) === "1" ? "Activo" : "Inactivo" }}
                      </v-chip>
                    </div>
                  </template>
                </v-list-item>
              </v-list>

              <div v-if="!lastProducts.length" class="text-caption text-medium-emphasis">
                Sin productos.
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
  inv: { type: Object, default: () => ({}) },
});

function num(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const lastProducts = computed(() => (Array.isArray(props.inv?.lastProducts) ? props.inv.lastProducts : []));

const totalProducts = computed(() => num(props.inv?.totalProducts));
const activeProducts = computed(() => num(props.inv?.activeProducts));
const noPriceProducts = computed(() => num(props.inv?.noPriceProducts));
const categories = computed(() => num(props.inv?.categories));
const inactiveProducts = computed(() => Math.max(0, totalProducts.value - activeProducts.value));

function isNoPrice(p) {
  // ✅ heurística: si backend ya manda algo como has_price o price, lo detectamos
  const lp = Number(p?.list_price ?? p?.price ?? p?.price_list ?? 0);
  const sp = Number(p?.sale_price ?? p?.discount_price ?? 0);
  const hasFlag = p?.has_price;
  if (hasFlag === false) return true;
  if (hasFlag === true) return false;
  return lp <= 0 && sp <= 0;
}

/* =========================
   Apex: common
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
  tooltip: { theme: "dark" },
  legend: { labels: { colors: "rgba(var(--v-theme-on-surface), 0.75)" } },
}));

/* =========================
   Donut: estado catálogo
========================= */
const seriesStatusDonut = computed(() => [
  activeProducts.value,
  inactiveProducts.value,
  noPriceProducts.value,
]);

const optStatusDonut = computed(() => ({
  ...apexCommon.value,
  labels: ["Activos", "Inactivos", "Sin precio"],
  colors: ["#00E396", "#775DD0", "#FEB019"],
  stroke: { width: 0 },
  plotOptions: {
    pie: {
      donut: {
        size: "70%",
        labels: {
          show: true,
          total: {
            show: true,
            label: "Total",
            formatter: () => `${totalProducts.value}`,
          },
        },
      },
    },
  },
  tooltip: {
    theme: "dark",
    y: {
      formatter: (v) => {
        const t = totalProducts.value || 1;
        const p = Math.round((Number(v || 0) / t) * 100);
        return `${Number(v || 0)} productos · ${p}%`;
      },
    },
  },
  legend: { show: true, position: "bottom" },
}));

/* =========================
   Bars: calidad de datos (simple)
========================= */
const seriesQualityBars = computed(() => [
  {
    name: "Cantidad",
    data: [
      totalProducts.value,
      activeProducts.value,
      inactiveProducts.value,
      noPriceProducts.value,
      categories.value,
    ],
  },
]);

const optQualityBars = computed(() => ({
  ...apexCommon.value,
  chart: { ...apexCommon.value.chart, type: "bar" },
  colors: ["#008FFB"], // ✅ azul fijo como en ventas
  fill: { opacity: 1 },
  plotOptions: {
    bar: {
      borderRadius: 10,
      columnWidth: "45%",
      dataLabels: { position: "top" },
    },
  },
  xaxis: {
    categories: ["Productos", "Activos", "Inactivos", "Sin precio", "Categorías"],
    labels: { style: { colors: "rgba(var(--v-theme-on-surface), 0.70)" } },
    axisBorder: { color: "rgba(var(--v-theme-on-surface), 0.12)" },
    axisTicks: { color: "rgba(var(--v-theme-on-surface), 0.12)" },
  },
  yaxis: {
    labels: {
      style: { colors: "rgba(var(--v-theme-on-surface), 0.65)" },
      formatter: (v) => `${Math.round(Number(v || 0))}`,
    },
  },
  tooltip: {
    theme: "dark",
    y: { formatter: (v) => `${Math.round(Number(v || 0))}` },
  },
}));
</script>

<style scoped>
.dash-surface {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
}

.dinv {
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

.p-ico {
  background: rgba(var(--v-theme-primary), 0.12);
  border: 1px solid rgba(var(--v-theme-primary), 0.22);
}

.minw-0 {
  min-width: 0;
}
</style>