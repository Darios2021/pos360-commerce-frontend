<template>
  <div class="dstk">
    <!-- Row 1: 5 KPIs -->
    <v-row dense class="mb-3">
      <v-col cols="12" sm="6" md="4" xl="">
        <KpiCard
          title="Sin stock"
          :value="String(num(stock.outOfStockCount))"
          :loading="loading"
          icon="mdi-close-octagon-outline"
          tone="error"
          sub="Productos agotados"
        />
      </v-col>
      <v-col cols="12" sm="6" md="4" xl="">
        <KpiCard
          title="Stock bajo"
          :value="String(num(stock.lowStockCount))"
          :loading="loading"
          icon="mdi-alert-outline"
          tone="warning"
          :sub="`Umbral ≤ ${num(stock.lowThreshold || 3)} unidades`"
        />
      </v-col>
      <v-col cols="12" sm="6" md="4" xl="">
        <KpiCard
          title="Stock OK"
          :value="String(num(stock.okCount))"
          :loading="loading"
          icon="mdi-check-circle-outline"
          tone="success"
          :sub="`${num(stock.trackedProducts)} productos rastreados`"
        />
      </v-col>
      <v-col cols="12" sm="6" md="6" xl="">
        <KpiCard
          title="Valor al costo"
          :value="money(stock.totalInventoryCostValue)"
          :loading="loading"
          icon="mdi-cash-check"
          tone="info"
          sub="Costo × Qty en stock"
        />
      </v-col>
      <v-col cols="12" sm="6" md="6" xl="">
        <KpiCard
          title="Valor de precio"
          :value="money(stock.totalInventoryPriceValue)"
          :loading="loading"
          icon="mdi-currency-usd"
          tone="primary"
          sub="Precio venta × Qty en stock"
        />
      </v-col>
    </v-row>

    <!-- Row 2: Stacked by Branch (5) + Global Donut (3) + Value by Warehouse (4) -->
    <v-row dense>
      <v-col cols="12" lg="5">
        <v-card class="stk-card" elevation="0">
          <div class="stk-head">
            <div class="minw-0">
              <div class="stk-title">Estado de stock por sucursal</div>
              <div class="stk-sub">Sin stock / Bajo / OK (100% apilado)</div>
            </div>
            <v-chip size="small" variant="tonal" class="chip-soft">
              Total: <b class="ml-1">{{ totalAll }}</b>
            </v-chip>
          </div>
          <v-divider />
          <div class="stk-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!rows.length" class="empty-state">Sin datos por sucursal.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="260" type="bar" :options="optStackByBranch" :series="seriesStackByBranch" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="3">
        <v-card class="stk-card" elevation="0">
          <div class="stk-head">
            <div class="minw-0">
              <div class="stk-title">Estado global</div>
              <div class="stk-sub">Distribución general</div>
            </div>
          </div>
          <v-divider />
          <div class="stk-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!totalAll" class="empty-state">Sin datos.</div>
            <div v-else>
              <ApexChart height="260" type="donut" :options="optDonutGlobal" :series="seriesDonutGlobal" />
              <div class="px-4 pb-3 text-caption text-medium-emphasis text-center">
                Out <b class="text-error">{{ sumOut }}</b> · Low <b class="text-warning">{{ sumLow }}</b> · OK <b class="text-success">{{ sumOk }}</b>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="stk-card" elevation="0">
          <div class="stk-head">
            <div class="minw-0">
              <div class="stk-title">Valor por depósito</div>
              <div class="stk-sub">Precio venta × Qty</div>
            </div>
            <v-chip size="small" variant="tonal" class="chip-soft">
              {{ money(stock.totalInventoryPriceValue) }}
            </v-chip>
          </div>
          <v-divider />
          <div class="stk-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!inventoryValueRows.length" class="empty-state">Sin datos de valor.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="260" type="bar" :options="optValueBar" :series="seriesValueBar" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row 3: Top Stocked Products (7) + Stock Ratio Radial (5) -->
    <v-row dense class="mt-2">
      <v-col cols="12" lg="7">
        <v-card class="stk-card" elevation="0">
          <div class="stk-head">
            <div class="minw-0">
              <div class="stk-title">Top 10 productos con más stock</div>
              <div class="stk-sub">Por cantidad disponible</div>
            </div>
            <v-chip size="small" variant="tonal" class="chip-soft">
              {{ topStocked.length }} productos
            </v-chip>
          </div>
          <v-divider />
          <div class="stk-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!topStocked.length" class="empty-state">Sin datos de stock.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="320" type="bar" :options="optTopStockedBar" :series="seriesTopStocked" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="5">
        <v-card class="stk-card" elevation="0">
          <div class="stk-head">
            <div class="minw-0">
              <div class="stk-title">Rentabilidad del stock</div>
              <div class="stk-sub">Costo vs Precio (margen estimado)</div>
            </div>
          </div>
          <v-divider />
          <div class="stk-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!stock.totalInventoryCostValue && !stock.totalInventoryPriceValue" class="empty-state">Sin datos.</div>
            <div v-else>
              <ApexChart height="260" type="radialBar" :options="optMarginRadial" :series="seriesMarginRadial" />
              <div class="margin-details px-4 pb-4">
                <div class="margin-row">
                  <span class="margin-label">Costo total</span>
                  <span class="margin-value text-warning">{{ money(stock.totalInventoryCostValue) }}</span>
                </div>
                <div class="margin-row">
                  <span class="margin-label">Precio venta</span>
                  <span class="margin-value text-success">{{ money(stock.totalInventoryPriceValue) }}</span>
                </div>
                <div class="margin-row">
                  <span class="margin-label">Ganancia bruta</span>
                  <span class="margin-value text-primary font-weight-black">{{ money(stock.totalInventoryPriceValue - stock.totalInventoryCostValue) }}</span>
                </div>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row 4: Critical Stock Table -->
    <v-row dense class="mt-2">
      <v-col cols="12">
        <v-card class="stk-card" elevation="0">
          <div class="stk-head">
            <div class="minw-0">
              <div class="stk-title">Productos críticos — Stock bajo / Sin stock</div>
              <div class="stk-sub">Requieren reposición inmediata</div>
            </div>
            <div class="d-flex align-center gap-2">
              <v-chip size="small" color="error" variant="tonal">
                Sin stock: <b class="ml-1">{{ num(stock.outOfStockCount) }}</b>
              </v-chip>
              <v-chip size="small" color="warning" variant="tonal">
                Bajo: <b class="ml-1">{{ num(stock.lowStockCount) }}</b>
              </v-chip>
              <v-chip size="small" variant="tonal" class="chip-soft">
                Scope: <b class="ml-1">{{ scopeLabel || "Todas" }}</b>
              </v-chip>
            </div>
          </div>
          <v-divider />
          <v-card-text>
            <div v-if="loading" class="py-8 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else>
              <v-data-table
                :headers="headers"
                :items="lowItems"
                item-key="product_id"
                density="comfortable"
                class="elevation-0 rounded-xl dash-table"
                :sort-by="[{ key: 'stock', order: 'asc' }]"
              >
                <template #item.product="{ item }">
                  <div class="font-weight-bold">{{ item.name || `Producto #${item.product_id}` }}</div>
                  <div class="text-caption text-medium-emphasis">SKU: {{ item.sku || "—" }}</div>
                </template>
                <template #item.scope="{ item }">
                  <div class="text-body-2 font-weight-medium">{{ item.branch_name || `Sucursal #${item.branch_id}` || "—" }}</div>
                  <div class="text-caption text-medium-emphasis">{{ item.warehouse_name || `Depósito #${item.warehouse_id}` || "—" }}</div>
                </template>
                <template #item.stock="{ item }">
                  <v-chip size="small" variant="tonal" :color="Number(item.stock || 0) <= 0 ? 'error' : 'warning'">
                    <v-icon start size="12">{{ Number(item.stock || 0) <= 0 ? 'mdi-close-octagon' : 'mdi-alert' }}</v-icon>
                    {{ Number(item.stock || 0) }}
                  </v-chip>
                  <div class="text-caption text-medium-emphasis mt-1">Umbral: {{ Number(item.min_stock || stock.lowThreshold || 3) }}</div>
                </template>
                <template #item.status="{ item }">
                  <v-chip size="x-small" :color="Number(item.stock || 0) <= 0 ? 'error' : 'warning'" variant="flat">
                    {{ Number(item.stock || 0) <= 0 ? "Sin stock" : "Stock bajo" }}
                  </v-chip>
                </template>
                <template #bottom />
              </v-data-table>
              <div v-if="!lowItems.length" class="text-caption text-success mt-2 pa-2">
                <v-icon size="16" color="success">mdi-check-circle</v-icon>
                Todo el stock está en buen estado.
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- ══ ANALYTICS: MOVIMIENTOS ════════════════════════════════════════════ -->

    <!-- Row A1: Timeline movimientos (12) -->
    <v-row dense class="mt-2">
      <v-col cols="12">
        <v-card class="stk-card" elevation="0">
          <div class="stk-head">
            <div class="minw-0">
              <div class="stk-title">Movimientos de stock en el tiempo</div>
              <div class="stk-sub">Entradas vs Salidas ({{ movTimeline.length }} días)</div>
            </div>
            <v-chip v-if="loadingAnalytics" size="small" variant="tonal" class="chip-soft">Cargando…</v-chip>
          </div>
          <v-divider />
          <div class="stk-body">
            <div v-if="loadingAnalytics" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!movTimeline.length" class="empty-state">Sin movimientos en el período.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="260" type="bar" :options="optMovTimeline" :series="seriesMovTimeline" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row A2: Stock por categoría (7) + Top Entradas (5) -->
    <v-row dense class="mt-2">
      <v-col cols="12" lg="7">
        <v-card class="stk-card" elevation="0">
          <div class="stk-head">
            <div class="minw-0">
              <div class="stk-title">Stock por categoría</div>
              <div class="stk-sub">Unidades y valor de precio en stock</div>
            </div>
          </div>
          <v-divider />
          <div class="stk-body">
            <div v-if="loadingAnalytics" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!stockByCategory.length" class="empty-state">Sin datos por categoría.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="300" type="bar" :options="optStockByCat" :series="seriesStockByCat" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="5">
        <v-card class="stk-card" elevation="0">
          <div class="stk-head">
            <div class="minw-0">
              <div class="stk-title">Top productos ingresados</div>
              <div class="stk-sub">Por cantidad · período seleccionado</div>
            </div>
          </div>
          <v-divider />
          <div class="stk-body">
            <div v-if="loadingAnalytics" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!topIn.length" class="empty-state">Sin ingresos registrados.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="300" type="bar" :options="optTopIn" :series="seriesTopIn" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row A3: Top Salidas (5) + Días de inventario (7) -->
    <v-row dense class="mt-2">
      <v-col cols="12" lg="5">
        <v-card class="stk-card" elevation="0">
          <div class="stk-head">
            <div class="minw-0">
              <div class="stk-title">Top productos con más salidas</div>
              <div class="stk-sub">Por cantidad · período seleccionado</div>
            </div>
          </div>
          <v-divider />
          <div class="stk-body">
            <div v-if="loadingAnalytics" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!topOut.length" class="empty-state">Sin salidas registradas.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="280" type="bar" :options="optTopOut" :series="seriesTopOut" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="7">
        <v-card class="stk-card" elevation="0">
          <div class="stk-head">
            <div class="minw-0">
              <div class="stk-title">Días de inventario estimados</div>
              <div class="stk-sub">Stock actual ÷ venta diaria promedio (últimos 30 días)</div>
            </div>
            <v-chip v-if="daysOfInventory.length" size="small" variant="tonal" class="chip-soft">
              {{ daysOfInventory.length }} productos con ventas
            </v-chip>
          </div>
          <v-divider />
          <div class="stk-body">
            <div v-if="loadingAnalytics" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!daysOfInventory.length" class="empty-state">Sin datos de rotación.</div>
            <div v-else>
              <v-data-table
                :headers="daysHeaders"
                :items="daysOfInventory"
                item-key="id"
                density="comfortable"
                class="elevation-0 dash-table"
                :sort-by="[{ key: 'daysRemaining', order: 'asc' }]"
              >
                <template #item.name="{ item }">
                  <div class="font-weight-bold text-body-2">{{ item.name }}</div>
                  <div class="text-caption text-medium-emphasis">{{ item.sku }}</div>
                </template>
                <template #item.daysRemaining="{ item }">
                  <v-chip size="small" :color="item.daysRemaining < 7 ? 'error' : item.daysRemaining < 30 ? 'warning' : 'success'" variant="flat">
                    {{ item.daysRemaining !== null ? Math.round(item.daysRemaining) + ' días' : '∞' }}
                  </v-chip>
                </template>
                <template #item.avgDailySales="{ item }">
                  <span class="text-body-2">{{ Number(item.avgDailySales).toFixed(2) }} u/día</span>
                </template>
                <template #bottom />
              </v-data-table>
            </div>
          </div>
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
  loadingAnalytics: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  scopeLabel: { type: String, default: "" },
  stock: { type: Object, default: () => ({}) },
  analytics: { type: Object, default: null },
});

function num(v) { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; }
function money(val) {
  const n = Number(val || 0);
  try { return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n); }
  catch { return `$ ${Math.round(n)}`; }
}
function shortNumber(v) {
  const n = Number(v || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${Math.round(n)}`;
}

const headers = [
  { title: "Producto", key: "product", sortable: false },
  { title: "Sucursal / Depósito", key: "scope", sortable: false, width: 220 },
  { title: "Stock actual", key: "stock", sortable: true, width: 140 },
  { title: "Estado", key: "status", sortable: false, width: 110 },
];

// ─── Data ──────────────────────────────────────────────────────────────────────
const rows = computed(() => {
  return (Array.isArray(props.stock?.stockByBranch) ? props.stock.stockByBranch : []).map((r) => {
    const out = num(r.out), low = num(r.low), ok = num(r.ok);
    return { key: String(r.branch_id ?? r.branch_name ?? ""), label: r.branch_name || `Sucursal #${r.branch_id}`, out, low, ok, total: out + low + ok };
  });
});
const lowItems = computed(() => Array.isArray(props.stock?.lowStockItems) ? props.stock.lowStockItems : []);
const inventoryValueRows = computed(() => Array.isArray(props.stock?.inventoryValue) ? props.stock.inventoryValue : []);
const topStocked = computed(() => Array.isArray(props.stock?.topStockedProducts) ? props.stock.topStockedProducts : []);

// ─── Totals ────────────────────────────────────────────────────────────────────
const sumOut = computed(() => rows.value.reduce((a, r) => a + r.out, 0));
const sumLow = computed(() => rows.value.reduce((a, r) => a + r.low, 0));
const sumOk = computed(() => rows.value.reduce((a, r) => a + r.ok, 0));
const totalAll = computed(() => sumOut.value + sumLow.value + sumOk.value);

// ─── Margin ────────────────────────────────────────────────────────────────────
const marginPct = computed(() => {
  const cost = Number(props.stock?.totalInventoryCostValue || 0);
  const price = Number(props.stock?.totalInventoryPriceValue || 0);
  if (cost <= 0 || price <= 0) return 0;
  return Math.min(100, Math.round(((price - cost) / price) * 100));
});
const seriesMarginRadial = computed(() => [marginPct.value]);
const optMarginRadial = computed(() => ({
  chart: { type: "radialBar", toolbar: { show: false }, fontFamily: "inherit" },
  plotOptions: {
    radialBar: {
      hollow: { size: "62%" },
      dataLabels: {
        name: { fontSize: "13px", color: "rgba(var(--v-theme-on-surface), 0.55)", offsetY: -8 },
        value: { fontSize: "26px", fontWeight: 900, color: "rgb(var(--v-theme-on-surface))", formatter: (v) => `${v}%` },
      },
      track: { background: "rgba(var(--v-theme-on-surface), 0.08)", strokeWidth: "100%" },
    },
  },
  colors: [marginPct.value > 40 ? "#00E396" : marginPct.value > 20 ? "#FEB019" : "#FF4560"],
  labels: ["Margen bruto"],
  stroke: { lineCap: "round" },
}));

// ─── Apex common ──────────────────────────────────────────────────────────────
const apexCommon = {
  chart: { toolbar: { show: false }, zoom: { enabled: false }, fontFamily: "inherit", foreColor: "rgba(var(--v-theme-on-surface), 0.75)" },
  grid: { borderColor: "rgba(var(--v-theme-on-surface), 0.08)", padding: { left: 10, right: 12, top: 6, bottom: 0 } },
  dataLabels: { enabled: false },
};
const axisStyle = { colors: "rgba(var(--v-theme-on-surface), 0.60)" };
const axisBorder = { color: "rgba(var(--v-theme-on-surface), 0.12)" };

// ─── Stacked by Branch ────────────────────────────────────────────────────────
const branchLabels = computed(() => rows.value.map((r) => r.label));
const seriesStackByBranch = computed(() => [
  { name: "Sin stock", data: rows.value.map((r) => r.out) },
  { name: "Stock bajo", data: rows.value.map((r) => r.low) },
  { name: "OK", data: rows.value.map((r) => r.ok) },
]);
const optStackByBranch = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar", stacked: true, stackType: "100%" },
  colors: ["#FF4560", "#FEB019", "#00E396"],
  plotOptions: { bar: { horizontal: true, borderRadius: 6, borderRadiusApplication: "end", barHeight: "60%" } },
  stroke: { width: 0 },
  dataLabels: {
    enabled: true,
    formatter: (val, opts) => {
      const r = rows.value[opts.dataPointIndex];
      const raw = [r?.out, r?.low, r?.ok][opts.seriesIndex];
      const pct = r?.total > 0 ? Math.round((raw / r.total) * 100) : 0;
      return pct >= 10 ? `${pct}%` : "";
    },
    style: { fontSize: "11px", fontWeight: 800 },
    dropShadow: { enabled: false },
  },
  xaxis: { categories: branchLabels.value, labels: { style: axisStyle, formatter: (v) => `${Math.round(Number(v||0))}%` }, axisBorder, axisTicks: axisBorder },
  yaxis: { labels: { style: axisStyle, maxWidth: 150 } },
  legend: { show: true, position: "bottom", labels: { colors: "rgba(var(--v-theme-on-surface), 0.75)" } },
  tooltip: {
    theme: "dark",
    y: { formatter: (val, ctx) => {
      const r = rows.value[ctx.dataPointIndex];
      const raw = [r?.out, r?.low, r?.ok][ctx.seriesIndex];
      const pct = r?.total > 0 ? Math.round((Number(raw||0) / r.total) * 100) : 0;
      return `${raw} productos · ${pct}%`;
    }},
  },
}));

// ─── Global Donut ─────────────────────────────────────────────────────────────
const seriesDonutGlobal = computed(() => [sumOut.value, sumLow.value, sumOk.value]);
const optDonutGlobal = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "donut" },
  labels: ["Sin stock", "Stock bajo", "OK"],
  colors: ["#FF4560", "#FEB019", "#00E396"],
  stroke: { width: 0 },
  plotOptions: {
    pie: { donut: { size: "68%", labels: { show: true, total: { show: true, label: "Total", formatter: () => `${totalAll.value}` } } } },
  },
  legend: { show: true, position: "bottom", labels: { colors: "rgba(var(--v-theme-on-surface), 0.75)" } },
  tooltip: { theme: "dark", y: { formatter: (v) => `${v} productos · ${totalAll.value ? Math.round((v/totalAll.value)*100) : 0}%` } },
}));

// ─── Inventory Value Bar ──────────────────────────────────────────────────────
const valueLabels = computed(() => inventoryValueRows.value.map((r) => r.warehouse_name || r.branch_name || `Dep. #${r.warehouse_id}`));
const seriesValueBar = computed(() => [
  { name: "Valor precio", data: inventoryValueRows.value.map((r) => Math.round(r.price_value)) },
  { name: "Valor costo", data: inventoryValueRows.value.map((r) => Math.round(r.cost_value)) },
]);
const optValueBar = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  colors: ["#00E396", "#FEB019"],
  fill: { opacity: 0.9 },
  stroke: { show: false },
  plotOptions: { bar: { horizontal: true, borderRadius: 4, borderRadiusApplication: "end", barHeight: "55%", grouped: true } },
  xaxis: { categories: valueLabels.value, labels: { style: axisStyle, formatter: (v) => shortNumber(v) }, axisBorder, axisTicks: axisBorder },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "10px" }, maxWidth: 120 } },
  legend: { show: true, position: "bottom", labels: { colors: "rgba(var(--v-theme-on-surface), 0.75)" } },
  tooltip: { theme: "dark", y: { formatter: (v) => money(v) } },
}));

// ─── Top Stocked Products ─────────────────────────────────────────────────────
const topStockedLabels = computed(() => topStocked.value.map((r) => r.product_name || `#${r.product_id}`));
const seriesTopStocked = computed(() => [
  { name: "Unidades", data: topStocked.value.map((r) => Number(r.total_qty || 0)) },
]);
const optTopStockedBar = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  colors: ["#775DD0"],
  fill: { opacity: 1 },
  stroke: { show: false },
  plotOptions: { bar: { horizontal: true, borderRadius: 6, borderRadiusApplication: "end", barHeight: "55%", dataLabels: { position: "bottom" } } },
  dataLabels: {
    enabled: true, offsetX: 6,
    style: { fontSize: "11px", colors: ["rgba(var(--v-theme-on-surface), 0.75)"] },
    formatter: (v) => `${Math.round(Number(v||0))} u.`,
  },
  xaxis: { categories: topStockedLabels.value, labels: { style: axisStyle, formatter: (v) => `${Math.round(Number(v||0))}` }, axisBorder, axisTicks: axisBorder },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "11px" }, maxWidth: 200 } },
  tooltip: { theme: "dark", y: { formatter: (v, ctx) => {
    const r = topStocked.value[ctx.dataPointIndex];
    return `${Math.round(Number(v||0))} unidades · ${money(r?.total_value)}`;
  }}},
}));

const daysHeaders = [
  { title: "Producto", key: "name", sortable: false, minWidth: 160 },
  { title: "Stock actual", key: "currentStock", sortable: true, width: 120 },
  { title: "Venta/día", key: "avgDailySales", sortable: true, width: 120 },
  { title: "Días restantes", key: "daysRemaining", sortable: true, width: 140 },
];

// ─── Analytics: Movimientos de stock ─────────────────────────────────────────
const ana = computed(() => props.analytics || {});

// Timeline
const movTimeline = computed(() => Array.isArray(ana.value?.timeline) ? ana.value.timeline : []);
const seriesMovTimeline = computed(() => [
  { name: "Entradas", data: movTimeline.value.map(r => num(r.qtyIn)), color: "#00E396" },
  { name: "Salidas", data: movTimeline.value.map(r => num(r.qtyOut)), color: "#FF4560" },
]);
const optMovTimeline = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar", stacked: false, toolbar: { show: false } },
  plotOptions: { bar: { columnWidth: "70%", borderRadius: 3 } },
  dataLabels: { enabled: false },
  xaxis: { categories: movTimeline.value.map(r => r.day?.slice(5) || ""), labels: { style: { ...axisStyle, fontSize: "9px" }, rotate: -45 } },
  yaxis: { labels: { style: axisStyle, formatter: (v) => `${Math.round(v)}` } },
  legend: { show: true, position: "top", labels: { colors: "rgba(var(--v-theme-on-surface), 0.7)" } },
  tooltip: { theme: "dark", y: { formatter: (v) => `${Math.round(Number(v||0))} unidades` } },
}));

// Stock por categoría
const stockByCategory = computed(() => Array.isArray(ana.value?.stockByCategory) ? ana.value.stockByCategory.slice(0, 12) : []);
const seriesStockByCat = computed(() => [
  { name: "Unidades", data: stockByCategory.value.map(r => num(r.totalQty)), color: "#008FFB" },
  { name: "Valor precio", data: stockByCategory.value.map(r => Math.round(num(r.priceValue))), color: "#00E396" },
]);
const optStockByCat = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar", toolbar: { show: false } },
  plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: "65%", dataLabels: { position: "bottom" } } },
  dataLabels: { enabled: false },
  xaxis: {
    categories: stockByCategory.value.map(r => r.category?.length > 18 ? r.category.slice(0, 16) + "…" : r.category),
    labels: { style: axisStyle },
  },
  yaxis: [
    { seriesName: "Unidades", labels: { style: axisStyle } },
    { seriesName: "Valor precio", opposite: true, labels: { style: axisStyle, formatter: shortNumber } },
  ],
  legend: { show: true, position: "top", labels: { colors: "rgba(var(--v-theme-on-surface), 0.7)" } },
  tooltip: { theme: "dark", y: [{ formatter: v => `${Math.round(v)} u.` }, { formatter: v => money(v) }] },
}));

// Días de inventario restante
const daysOfInventory = computed(() => Array.isArray(ana.value?.daysOfInventory) ? ana.value.daysOfInventory.slice(0, 15) : []);

// Top entradas/salidas
const topIn = computed(() => Array.isArray(ana.value?.topInProducts) ? ana.value.topInProducts.slice(0, 8) : []);
const topOut = computed(() => Array.isArray(ana.value?.topOutProducts) ? ana.value.topOutProducts.slice(0, 8) : []);
const seriesTopIn = computed(() => [{ name: "Unidades ingresadas", data: topIn.value.map(r => num(r.totalQty)), color: "#00E396" }]);
const seriesTopOut = computed(() => [{ name: "Unidades salidas", data: topOut.value.map(r => num(r.totalQty)), color: "#FF4560" }]);
const optTopIn = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar", toolbar: { show: false } },
  plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: "70%", distributed: true } },
  dataLabels: { enabled: true, formatter: v => `${Math.round(Number(v||0))} u.`, style: { ...axisStyle, fontSize: "10px" } },
  xaxis: {
    categories: topIn.value.map(r => r.name?.length > 18 ? r.name.slice(0, 16) + "…" : r.name),
    labels: { style: axisStyle },
  },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "10px" }, maxWidth: 150 } },
  legend: { show: false },
  tooltip: { theme: "dark", y: { formatter: (v, { dataPointIndex }) => {
    const r = topIn.value[dataPointIndex];
    return `${Math.round(Number(v||0))} u. · ${money(r?.totalCost)}`;
  } } },
  colors: ["#00E396","#00BCD4","#26A69A","#43A047","#66BB6A","#A5D6A7","#B2DFDB","#80CBC4"],
}));
const optTopOut = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar", toolbar: { show: false } },
  plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: "70%", distributed: true } },
  dataLabels: { enabled: true, formatter: v => `${Math.round(Number(v||0))} u.`, style: { ...axisStyle, fontSize: "10px" } },
  xaxis: {
    categories: topOut.value.map(r => r.name?.length > 18 ? r.name.slice(0, 16) + "…" : r.name),
    labels: { style: axisStyle },
  },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "10px" }, maxWidth: 150 } },
  legend: { show: false },
  tooltip: { theme: "dark", y: { formatter: v => `${Math.round(Number(v||0))} u.` } },
  colors: ["#FF4560","#FF7043","#FF5722","#E53935","#EF5350","#EF9A9A","#FFCCBC","#FFAB91"],
}));
</script>

<style scoped>
.dstk { display: flex; flex-direction: column; }

.stk-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  border-radius: 16px !important;
  overflow: hidden;
}

.stk-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 12px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.stk-title {
  font-weight: 900;
  letter-spacing: -0.01em;
  font-size: 13.5px;
  color: rgb(var(--v-theme-on-surface));
}
.stk-sub {
  margin-top: 3px;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.50);
  font-weight: 600;
}

.stk-body { padding: 10px 10px 12px; }

.chip-soft { border: 1px solid rgba(var(--v-theme-on-surface), 0.10); }

.empty-state {
  padding: 32px 20px;
  text-align: center;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  font-weight: 600;
}

.minw-0 { min-width: 0; }

.margin-details {
  display: grid;
  gap: 6px;
}
.margin-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}
.margin-label { font-size: 12px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.60); }
.margin-value { font-size: 13px; font-weight: 800; }

.gap-2 { gap: 8px; }

.dash-table :deep(.v-table__wrapper),
.dash-table :deep(table),
.dash-table :deep(.v-data-table__wrapper) {
  background: transparent !important;
}
</style>
