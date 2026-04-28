<template>
  <div class="dstk">


    <!-- ─── KPI strip ──────────────────────────────────────────────────────── -->
    <div class="stk-kpi-strip">
      <div class="stk-kpi stk-kpi--error" :class="{ 'stk-kpi--pulse': num(stock.outOfStockCount) > 0 }">
        <div class="stk-kpi__icon-wrap stk-kpi__icon-wrap--error">
          <v-icon size="22" color="error">mdi-close-octagon-outline</v-icon>
        </div>
        <div class="stk-kpi__body">
          <div class="stk-kpi__num">{{ num(stock.outOfStockCount) }}</div>
          <div class="stk-kpi__lbl">Sin stock</div>
          <div class="stk-kpi__sub">Agotados</div>
        </div>
      </div>

      <div class="stk-kpi stk-kpi--warning">
        <div class="stk-kpi__icon-wrap stk-kpi__icon-wrap--warning">
          <v-icon size="22" color="warning">mdi-alert-outline</v-icon>
        </div>
        <div class="stk-kpi__body">
          <div class="stk-kpi__num">{{ num(stock.lowStockCount) }}</div>
          <div class="stk-kpi__lbl">Stock bajo</div>
          <div class="stk-kpi__sub">≤ {{ num(stock.lowThreshold || 3) }} u.</div>
        </div>
      </div>

      <div class="stk-kpi stk-kpi--success">
        <div class="stk-kpi__icon-wrap stk-kpi__icon-wrap--success">
          <v-icon size="22" color="success">mdi-check-circle-outline</v-icon>
        </div>
        <div class="stk-kpi__body">
          <div class="stk-kpi__num">{{ num(stock.okCount) }}</div>
          <div class="stk-kpi__lbl">Stock OK</div>
          <div class="stk-kpi__sub">{{ num(stock.trackedProducts) }} rastreados</div>
        </div>
      </div>

      <div class="stk-kpi stk-kpi--info">
        <div class="stk-kpi__icon-wrap stk-kpi__icon-wrap--info">
          <v-icon size="22" color="info">mdi-currency-usd</v-icon>
        </div>
        <div class="stk-kpi__body">
          <div class="stk-kpi__num stk-kpi__num--sm">{{ money(stock.totalInventoryPriceValue) }}</div>
          <div class="stk-kpi__lbl">Valor inventario <span class="inv-price-tag">P. descuento</span></div>
          <div class="stk-kpi__sub">{{ selectedBranchLabel }}</div>
          <div class="stk-kpi__sub inv-list-val">Lista: {{ money(stock.totalInventoryListValue) }}</div>
        </div>
      </div>
    </div>

    <!-- ─── Sin stock: alerta urgente ─────────────────────────────────────── -->
    <v-card v-if="!loading && outItems.length" class="stk-card stk-card--urgent" elevation="0">
      <div class="stk-head stk-head--error">
        <div class="d-flex align-center gap-2">
          <v-icon color="error" size="20">mdi-close-octagon</v-icon>
          <div>
            <div class="stk-title">Productos sin stock — reposición urgente</div>
            <div class="stk-sub">Hacé clic en un producto para editarlo</div>
          </div>
        </div>
        <v-chip size="small" color="error" variant="flat">{{ outItems.length }} productos</v-chip>
      </div>
      <v-divider />
      <div class="stk-alert-feed" :class="{ 'stk-alert-feed--collapsed': outItems.length > 8 && !showAllOut }">
        <div
          v-for="item in outItems.slice(0, showAllOut ? 999 : 8)"
          :key="`out-${item.product_id}-${item.warehouse_id}`"
          class="stk-alert-row stk-alert-row--error"
          @click="goToProduct(item.product_id)"
        >
          <v-icon size="15" color="error" class="flex-shrink-0">mdi-close-octagon</v-icon>
          <div class="stk-alert-info">
            <div class="stk-alert-name">{{ item.name || `Producto #${item.product_id}` }}</div>
            <div class="stk-alert-meta">
              <span v-if="item.sku" class="stk-alert-sku">{{ item.sku }}</span>
              <span v-if="item.branch_name" class="stk-alert-branch">
                <v-icon size="10" class="mr-px">mdi-store</v-icon>{{ item.branch_name }}
              </span>
              <span v-if="item.warehouse_name" class="stk-alert-wh">
                <v-icon size="10" class="mr-px">mdi-warehouse</v-icon>{{ item.warehouse_name }}
              </span>
            </div>
          </div>
          <v-chip size="x-small" color="error" variant="flat" class="flex-shrink-0 mr-1">0 u.</v-chip>
          <v-icon size="14" class="op40 flex-shrink-0">mdi-chevron-right</v-icon>
        </div>
      </div>
      <div v-if="outItems.length > 8" class="stk-show-more" @click="showAllOut = !showAllOut">
        {{ showAllOut ? 'Ver menos' : `Ver todos (${outItems.length})` }}
      </div>
    </v-card>

    <!-- ─── Stock bajo: alerta ──────────────────────────────────────────────── -->
    <v-card v-if="!loading && lowItems.length" class="stk-card stk-card--warn" elevation="0">
      <div class="stk-head stk-head--warning">
        <div class="d-flex align-center gap-2">
          <v-icon color="warning" size="20">mdi-alert</v-icon>
          <div>
            <div class="stk-title">Stock bajo — revisar pronto</div>
            <div class="stk-sub">Por debajo del umbral mínimo · clic para editar</div>
          </div>
        </div>
        <v-chip size="small" color="warning" variant="flat">{{ lowItems.length }} productos</v-chip>
      </div>
      <v-divider />
      <div class="stk-alert-feed" :class="{ 'stk-alert-feed--collapsed': lowItems.length > 8 && !showAllLow }">
        <div
          v-for="item in lowItems.slice(0, showAllLow ? 999 : 8)"
          :key="`low-${item.product_id}-${item.warehouse_id}`"
          class="stk-alert-row stk-alert-row--warning"
          @click="goToProduct(item.product_id)"
        >
          <v-icon size="15" color="warning" class="flex-shrink-0">mdi-alert</v-icon>
          <div class="stk-alert-info">
            <div class="stk-alert-name">{{ item.name || `Producto #${item.product_id}` }}</div>
            <div class="stk-alert-meta">
              <span v-if="item.sku" class="stk-alert-sku">{{ item.sku }}</span>
              <span v-if="item.branch_name" class="stk-alert-branch">
                <v-icon size="10" class="mr-px">mdi-store</v-icon>{{ item.branch_name }}
              </span>
            </div>
          </div>
          <v-chip size="x-small" color="warning" variant="flat" class="flex-shrink-0 mr-1">
            {{ item.stock }} / {{ item.min_stock || stock.lowThreshold || 3 }} u.
          </v-chip>
          <v-icon size="14" class="op40 flex-shrink-0">mdi-chevron-right</v-icon>
        </div>
      </div>
      <div v-if="lowItems.length > 8" class="stk-show-more" @click="showAllLow = !showAllLow">
        {{ showAllLow ? 'Ver menos' : `Ver todos (${lowItems.length})` }}
      </div>
    </v-card>

    <!-- ─── OK state ────────────────────────────────────────────────────────── -->
    <div v-if="!loading && !outItems.length && !lowItems.length" class="stk-allgood">
      <v-icon size="22" color="success" class="mb-1">mdi-check-decagram</v-icon>
      <div>Todo el stock está en buen estado — sin alertas activas</div>
    </div>

    <!-- ─── Row: Estado por sucursal ──────────────────────────────────────── -->
    <v-row dense>
      <v-col cols="12">
        <v-card class="stk-card h-full" elevation="0">
          <div class="stk-head">
            <div>
              <div class="stk-title">Estado por sucursal</div>
              <div class="stk-sub">Sin stock · Bajo · OK por sede</div>
            </div>
            <v-chip size="small" variant="tonal" class="chip-soft">{{ totalAll }} productos</v-chip>
          </div>
          <v-divider />
          <div class="stk-body">
            <div v-if="loading" class="py-8 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!rows.length" class="empty-state">Sin datos por sucursal.</div>
            <div v-else class="branch-list">
              <div v-for="r in rows" :key="r.key" class="branch-row">
                <div class="branch-name">{{ r.label }}</div>
                <div class="branch-bar-wrap">
                  <div class="branch-seg branch-seg--error"   :style="{ width: r.total ? (r.out/r.total*100)+'%' : '0%' }" :title="`Sin stock: ${r.out}`" />
                  <div class="branch-seg branch-seg--warning" :style="{ width: r.total ? (r.low/r.total*100)+'%' : '0%' }" :title="`Bajo: ${r.low}`" />
                  <div class="branch-seg branch-seg--success" :style="{ width: r.total ? (r.ok/r.total*100)+'%' : '0%' }" :title="`OK: ${r.ok}`" />
                </div>
                <div class="branch-badges">
                  <span v-if="r.out" class="branch-badge branch-badge--error">{{ r.out }}</span>
                  <span v-if="r.low" class="branch-badge branch-badge--warning">{{ r.low }}</span>
                  <span class="branch-badge branch-badge--success">{{ r.ok }}</span>
                </div>
                <div class="branch-total">{{ r.total }} u.</div>
              </div>
              <!-- Legend -->
              <div class="branch-legend">
                <span class="bl-item"><span class="bl-dot" style="background:#FF4560" />Sin stock</span>
                <span class="bl-item"><span class="bl-dot" style="background:#FEB019" />Stock bajo</span>
                <span class="bl-item"><span class="bl-dot" style="background:#00E396" />OK</span>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

    </v-row>

    <!-- ─── Ranking combinado qty + valor ─────────────────────────────────── -->
    <v-row dense>
      <v-col cols="12" lg="6">
        <v-card class="stk-card h-full" elevation="0">
          <div class="stk-head">
            <div>
              <div class="stk-title">Ranking por cantidad en stock</div>
              <div class="stk-sub">Productos con mayor cantidad disponible</div>
            </div>
            <v-chip size="small" variant="tonal" class="chip-soft">Top {{ topByQty.length }}</v-chip>
          </div>
          <v-divider />
          <div class="stk-body pa-0">
            <div v-if="loading" class="py-8 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!topByQty.length" class="empty-state">Sin datos.</div>
            <div v-else class="rank-feed">
              <div v-for="(r, i) in topByQty" :key="`qty-${r.product_id}`" class="rank-row" @click="goToProduct(r.product_id)">
                <div class="rank-num" :class="i < 3 ? 'rank-num--top' : ''">{{ i + 1 }}</div>
                <div class="rank-info">
                  <div class="rank-name">{{ r.product_name || `#${r.product_id}` }}</div>
                  <div class="rank-bar-wrap">
                    <div class="rank-bar-fill rank-bar-fill--qty" :style="{ width: topByQty[0]?.total_qty ? (Number(r.total_qty)/Number(topByQty[0].total_qty)*100)+'%' : '0%' }" />
                  </div>
                </div>
                <div class="rank-meta">
                  <div class="rank-primary">{{ Math.round(Number(r.total_qty || 0)) }} u.</div>
                  <div class="rank-secondary">{{ money(r.total_value) }}</div>
                </div>
                <v-icon size="13" class="op30">mdi-chevron-right</v-icon>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6">
        <v-card class="stk-card h-full" elevation="0">
          <div class="stk-head">
            <div>
              <div class="stk-title">Ranking por valor en stock</div>
              <div class="stk-sub">Precio venta × cantidad disponible</div>
            </div>
            <v-chip size="small" variant="tonal" class="chip-soft">Top {{ topByValue.length }}</v-chip>
          </div>
          <v-divider />
          <div class="stk-body pa-0">
            <div v-if="loading" class="py-8 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!topByValue.length" class="empty-state">Sin datos.</div>
            <div v-else class="rank-feed">
              <div v-for="(r, i) in topByValue" :key="`val-${r.product_id}`" class="rank-row" @click="goToProduct(r.product_id)">
                <div class="rank-num" :class="i < 3 ? 'rank-num--top' : ''">{{ i + 1 }}</div>
                <div class="rank-info">
                  <div class="rank-name">{{ r.product_name || `#${r.product_id}` }}</div>
                  <div class="rank-bar-wrap">
                    <div class="rank-bar-fill rank-bar-fill--value" :style="{ width: topByValue[0]?.total_value ? (Number(r.total_value)/Number(topByValue[0].total_value)*100)+'%' : '0%' }" />
                  </div>
                </div>
                <div class="rank-meta">
                  <div class="rank-primary">{{ money(r.total_value) }}</div>
                  <div class="rank-secondary">{{ Math.round(Number(r.total_qty || 0)) }} u.</div>
                </div>
                <v-icon size="13" class="op30">mdi-chevron-right</v-icon>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ─── Row: Stock por categoría + subcategoría ────────────────────────── -->
    <v-row dense>
      <v-col cols="12" lg="6">
        <v-card class="stk-card" elevation="0">
          <div class="stk-head">
            <div>
              <div class="stk-title">Stock por categoría</div>
              <div class="stk-sub">Unidades en stock por familia</div>
            </div>
          </div>
          <v-divider />
          <div class="stk-body">
            <div v-if="loadingAnalytics" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!stockByCategory.length" class="empty-state">Sin datos por categoría.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart :height="Math.max(200, stockByCategory.length * 38)" type="bar" :options="optStockByCat" :series="seriesStockByCat" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6">
        <v-card class="stk-card" elevation="0">
          <div class="stk-head">
            <div>
              <div class="stk-title">Stock por subcategoría</div>
              <div class="stk-sub">Unidades en stock por subfamilia</div>
            </div>
            <v-chip v-if="stockBySubCategory.length" size="small" variant="tonal" class="chip-soft">{{ stockBySubCategory.length }} subcategorías</v-chip>
          </div>
          <v-divider />
          <div class="stk-body">
            <div v-if="loadingAnalytics" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!stockBySubCategory.length" class="empty-state">Sin datos por subcategoría.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart :height="Math.max(200, stockBySubCategory.length * 38)" type="bar" :options="optStockBySubCat" :series="seriesStockBySubCat" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ─── Días de inventario ───────────────────────────────────────────────── -->
    <v-card class="stk-card" elevation="0">
      <div class="stk-head">
        <div>
          <div class="stk-title">Días de inventario estimados</div>
          <div class="stk-sub">Stock ÷ venta diaria promedio (30 días) · clic para editar producto</div>
        </div>
        <v-chip v-if="daysOfInventory.length" size="small" variant="tonal" class="chip-soft">{{ daysOfInventory.length }} productos</v-chip>
      </div>
      <v-divider />
      <div class="stk-body pa-0">
        <div v-if="loadingAnalytics" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
        <div v-else-if="!daysOfInventory.length" class="empty-state">Sin datos de rotación.</div>
        <div v-else class="days-feed">
          <div
            v-for="item in daysOfInventory"
            :key="item.id || item.product_id"
            class="days-row"
            :class="item.daysRemaining !== null && item.daysRemaining < 7 ? 'days-row--urgent' : item.daysRemaining !== null && item.daysRemaining < 30 ? 'days-row--warn' : ''"
            @click="goToProduct(item.product_id || item.id)"
          >
            <div class="days-name">
              <div class="days-product">{{ item.name }}</div>
              <div class="days-sku">{{ item.sku }}</div>
            </div>
            <div class="days-mid">
              <span class="days-rate">{{ Number(item.avgDailySales).toFixed(2) }} u/día</span>
              <span class="days-stock">Stock: {{ item.currentStock }}</span>
            </div>
            <v-chip
              size="x-small"
              :color="item.daysRemaining === null ? 'success' : item.daysRemaining < 7 ? 'error' : item.daysRemaining < 30 ? 'warning' : 'success'"
              variant="flat"
              class="flex-shrink-0"
            >
              {{ item.daysRemaining !== null ? Math.round(item.daysRemaining) + ' días' : '∞' }}
            </v-chip>
          </div>
        </div>
      </div>
    </v-card>

  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import ApexChart from "vue3-apexcharts";

const props = defineProps({
  loading:          { type: Boolean, default: false },
  loadingAnalytics: { type: Boolean, default: false },
  isAdmin:          { type: Boolean, default: false },
  scopeLabel:       { type: String,  default: "" },
  stock:            { type: Object,  default: () => ({}) },
  analytics:        { type: Object,  default: null },
  branches:         { type: Array,   default: () => [] },
  selectedBranch:   { type: Number,  default: null },
});

const emit = defineEmits(["branch-change"]);

const router = useRouter();
const showAllOut  = ref(false);
const showAllLow  = ref(false);
const stockToggle = ref("qty");

// ─── Helpers ───────────────────────────────────────────────────────────────────
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

function goToProduct(id) {
  if (!id) return;
  router.push({ name: "productView", params: { id } });
}

// ─── Branch filter ─────────────────────────────────────────────────────────────
const currentBranchLabel = computed(() => {
  if (!props.selectedBranch) return "Todas las sucursales";
  const found = props.branches.find(b => b.id === props.selectedBranch);
  return found?.name || `Sucursal #${props.selectedBranch}`;
});

// ─── Data ──────────────────────────────────────────────────────────────────────
const allLowItems       = computed(() => Array.isArray(props.stock?.lowStockItems) ? props.stock.lowStockItems : []);
const outItems          = computed(() => allLowItems.value.filter(i => Number(i.stock ?? 0) <= 0));
const lowItems          = computed(() => allLowItems.value.filter(i => Number(i.stock ?? 0) > 0));
const topStocked     = computed(() => Array.isArray(props.stock?.topStockedProducts) ? props.stock.topStockedProducts : []);
const topByQty       = computed(() => [...topStocked.value].sort((a, b) => Number(b.total_qty || 0) - Number(a.total_qty || 0)).slice(0, 10));
const topByValue     = computed(() => [...topStocked.value].sort((a, b) => Number(b.total_value || 0) - Number(a.total_value || 0)).slice(0, 10));
const topStockedSorted = computed(() => stockToggle.value === "value" ? topByValue.value : topByQty.value);

const rows = computed(() =>
  (Array.isArray(props.stock?.stockByBranch) ? props.stock.stockByBranch : []).map(r => {
    const out = num(r.out), low = num(r.low), ok = num(r.ok);
    return { key: String(r.branch_id ?? r.branch_name ?? ""), label: r.branch_name || `Sucursal #${r.branch_id}`, out, low, ok, total: out + low + ok };
  })
);

const sumOut   = computed(() => rows.value.reduce((a, r) => a + r.out, 0));
const sumLow   = computed(() => rows.value.reduce((a, r) => a + r.low, 0));
const sumOk    = computed(() => rows.value.reduce((a, r) => a + r.ok, 0));
const totalAll = computed(() => sumOut.value + sumLow.value + sumOk.value);

// ─── Margin radial ─────────────────────────────────────────────────────────────
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
      hollow: { size: "58%" },
      dataLabels: {
        name:  { fontSize: "12px", color: "rgba(var(--v-theme-on-surface), 0.50)", offsetY: -8 },
        value: { fontSize: "24px", fontWeight: 900, color: "rgb(var(--v-theme-on-surface))", formatter: v => `${v}%` },
      },
      track: { background: "rgba(var(--v-theme-on-surface), 0.08)", strokeWidth: "100%" },
    },
  },
  colors: [marginPct.value > 40 ? "#00E396" : marginPct.value > 20 ? "#FEB019" : "#FF4560"],
  labels: ["Margen bruto"],
  stroke: { lineCap: "round" },
}));

// ─── Apex common ───────────────────────────────────────────────────────────────
const apexCommon = {
  chart: { toolbar: { show: false }, zoom: { enabled: false }, fontFamily: "inherit", foreColor: "rgba(var(--v-theme-on-surface), 0.75)" },
  grid: { borderColor: "rgba(var(--v-theme-on-surface), 0.07)", padding: { left: 8, right: 12, top: 4, bottom: 0 } },
  dataLabels: { enabled: false },
};
const axisStyle  = { colors: "rgba(var(--v-theme-on-surface), 0.55)" };
const axisBorder = { color: "rgba(var(--v-theme-on-surface), 0.10)" };

// ─── Top stocked bar ──────────────────────────────────────────────────────────
const seriesTopStocked = computed(() => [{
  name: stockToggle.value === "value" ? "Valor ($)" : "Unidades",
  data: topStockedSorted.value.map(r => stockToggle.value === "value" ? Math.round(Number(r.total_value || 0)) : Number(r.total_qty || 0)),
}]);
const optTopStockedBar = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: "62%", distributed: true, dataLabels: { position: "top" } } },
  dataLabels: {
    enabled: true, offsetX: 6,
    formatter: v => stockToggle.value === "value" ? `$ ${shortNumber(v)}` : `${Math.round(Number(v || 0))} u.`,
    style: { fontSize: "11.5px", fontWeight: "700", colors: ["rgba(255,255,255,0.85)"] },
  },
  xaxis: {
    categories: topStockedSorted.value.map(r => {
      const n = r.product_name || `#${r.product_id}`;
      return n.length > 26 ? n.slice(0, 24) + "…" : n;
    }),
    labels: { style: axisStyle, formatter: v => stockToggle.value === "value" ? shortNumber(v) : `${Math.round(Number(v || 0))}` },
    axisBorder, axisTicks: axisBorder,
  },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "11.5px", fontWeight: "600" }, maxWidth: 200 } },
  legend: { show: false },
  tooltip: { theme: "dark", y: { formatter: (v, ctx) => {
    const r = topStockedSorted.value[ctx.dataPointIndex];
    return stockToggle.value === "value"
      ? `${money(v)} · ${Math.round(Number(r?.total_qty || 0))} u.`
      : `${Math.round(Number(v || 0))} unidades · ${money(r?.total_value)}`;
  }}},
  colors: ["#1488d1","#2a96d6","#3fa3db","#54b0e0","#1078bb","#1387cd","#69bde5","#7ec9ea","#0d70b1","#92d4ee"],
}));

// ─── Analytics ────────────────────────────────────────────────────────────────
const ana             = computed(() => props.analytics || {});
const movTimeline     = computed(() => Array.isArray(ana.value?.timeline) ? ana.value.timeline : []);
const stockByCategory    = computed(() => Array.isArray(ana.value?.stockByCategory) ? ana.value.stockByCategory.slice(0, 14) : []);
const stockBySubCategory = computed(() => Array.isArray(ana.value?.stockBySubCategory) ? ana.value.stockBySubCategory.slice(0, 20) : []);
const daysOfInventory    = computed(() => Array.isArray(ana.value?.daysOfInventory) ? ana.value.daysOfInventory.slice(0, 20) : []);

// Timeline
const seriesMovTimeline = computed(() => [
  { name: "Entradas", data: movTimeline.value.map(r => num(r.qtyIn)),  color: "#00E396" },
  { name: "Salidas",  data: movTimeline.value.map(r => num(r.qtyOut)), color: "#FF4560" },
]);
const optMovTimeline = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  plotOptions: { bar: { columnWidth: "68%", borderRadius: 3 } },
  dataLabels: { enabled: false },
  xaxis: { categories: movTimeline.value.map(r => r.day?.slice(5) || ""), labels: { style: { ...axisStyle, fontSize: "10px" }, rotate: -45 }, axisBorder, axisTicks: axisBorder },
  yaxis: { labels: { style: axisStyle, formatter: v => `${Math.round(v)}` } },
  legend: { show: true, position: "top", labels: { colors: "rgba(var(--v-theme-on-surface), 0.7)" } },
  tooltip: { theme: "dark", y: { formatter: v => `${Math.round(Number(v || 0))} unidades` } },
}));

// Stock por categoría
const seriesStockByCat = computed(() => [{
  name: "Unidades en stock",
  data: stockByCategory.value.map(r => num(r.totalQty)),
}]);
const optStockByCat = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  colors: ["#1488d1"],
  plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: "60%", distributed: true, dataLabels: { position: "top" } } },
  dataLabels: {
    enabled: true, offsetX: 5,
    formatter: v => `${Math.round(Number(v || 0))} u.`,
    style: { fontSize: "11px", fontWeight: "700", colors: ["rgba(255,255,255,0.85)"] },
  },
  xaxis: {
    categories: stockByCategory.value.map(r => r.category?.length > 20 ? r.category.slice(0, 18) + "…" : r.category),
    labels: { style: axisStyle }, axisBorder, axisTicks: axisBorder,
  },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "11.5px", fontWeight: "600" }, maxWidth: 170 } },
  legend: { show: false },
  tooltip: { theme: "dark", y: { formatter: (v, { dataPointIndex }) => {
    const r = stockByCategory.value[dataPointIndex];
    return `${Math.round(num(v))} unidades · ${money(r?.priceValue)}`;
  }}},
  colors: ["#1488d1","#2a96d6","#3fa3db","#54b0e0","#1078bb","#1387cd","#69bde5","#7ec9ea","#0d70b1","#92d4ee","#1488d1","#2a96d6","#3fa3db","#54b0e0"],
}));


// Stock por subcategoría
const seriesStockBySubCat = computed(() => [{
  name: "Unidades en stock",
  data: stockBySubCategory.value.map(r => num(r.totalQty)),
}]);
const subCatColors = ["#1488d1","#2a96d6","#3fa3db","#54b0e0","#69bde5","#7ec9ea","#92d4ee","#1078bb","#1387cd","#0d70b1","#1488d1","#2a96d6","#3fa3db","#54b0e0","#69bde5","#7ec9ea","#92d4ee","#1078bb","#1387cd","#0d70b1"];
const optStockBySubCat = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  colors: subCatColors,
  plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: "62%", distributed: true, dataLabels: { position: "top" } } },
  dataLabels: {
    enabled: true, offsetX: 5,
    formatter: v => `${Math.round(Number(v || 0))} u.`,
    style: { fontSize: "11px", fontWeight: "700", colors: ["rgba(255,255,255,0.85)"] },
  },
  xaxis: {
    categories: stockBySubCategory.value.map(r => r.subcategory?.length > 22 ? r.subcategory.slice(0, 20) + "…" : r.subcategory),
    labels: { style: axisStyle }, axisBorder, axisTicks: axisBorder,
  },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "11.5px", fontWeight: "600" }, maxWidth: 170 } },
  legend: { show: false },
  tooltip: { theme: "dark", y: { formatter: (v, { dataPointIndex }) => {
    const r = stockBySubCategory.value[dataPointIndex];
    return `${Math.round(num(v))} unidades · ${r?.category || ""} · ${money(r?.priceValue)}`;
  }}},
}));
</script>

<style scoped>
/* ─── Root ───────────────────────────────────────────────────────────────── */
.dstk { display: flex; flex-direction: column; gap: 14px; }

/* ─── Filter bar ─────────────────────────────────────────────────────────── */
.stk-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.stk-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 400;
  cursor: pointer;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.15);
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgb(var(--v-theme-on-surface));
  transition: background .15s, border-color .15s;
  white-space: nowrap;
}
.stk-pill:hover { background: rgba(var(--v-theme-on-surface), 0.10); border-color: rgba(var(--v-theme-on-surface), 0.25); }
.stk-pill--branch { border-color: rgba(20,136,209,.4); color: #1488d1; }

/* ─── KPI strip ──────────────────────────────────────────────────────────── */
.stk-kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
@media (max-width: 900px) { .stk-kpi-strip { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .stk-kpi-strip { grid-template-columns: 1fr; } }

.stk-kpi {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
}
.stk-kpi::before {
  content: "";
  position: absolute;
  inset: 0;
  opacity: .05;
  border-radius: inherit;
}
.stk-kpi--error::before   { background: #FF4560; }
.stk-kpi--warning::before { background: #FEB019; }
.stk-kpi--success::before { background: #00E396; }
.stk-kpi--info::before    { background: #1488d1; }

.stk-kpi--pulse { box-shadow: 0 0 0 0 rgba(255,69,96,.3); animation: kpi-pulse 2s infinite; }
@keyframes kpi-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(255,69,96,.35); }
  70%  { box-shadow: 0 0 0 10px rgba(255,69,96,0); }
  100% { box-shadow: 0 0 0 0 rgba(255,69,96,0); }
}

.stk-kpi__icon-wrap {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.stk-kpi__icon-wrap--error   { background: rgba(255,69,96,.15); }
.stk-kpi__icon-wrap--warning { background: rgba(254,176,25,.15); }
.stk-kpi__icon-wrap--success { background: rgba(0,227,150,.15); }
.stk-kpi__icon-wrap--info    { background: rgba(20,136,209,.15); }

.stk-kpi__body { min-width: 0; }
.stk-kpi__num { font-size: 26px; font-weight: 500; line-height: 1.1; letter-spacing: -.02em; }
.stk-kpi__num--sm { font-size: 15px; font-weight: 500; }
.stk-kpi__lbl { font-size: 12px; font-weight: 400; opacity: .75; margin-top: 1px; }
.stk-kpi__sub { font-size: 11px; opacity: .5; font-weight: 400; }
.inv-price-tag { font-size: 10px; font-weight: 400; opacity: .6; background: rgba(20,136,209,.15); color: #1488d1; border-radius: 4px; padding: 1px 5px; margin-left: 4px; vertical-align: middle; }
.inv-list-val { margin-top: 2px; opacity: .4; }

/* ─── Alert feed ─────────────────────────────────────────────────────────── */
.stk-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  border-radius: 16px !important;
  overflow: hidden;
}
.stk-card--urgent { border-color: rgba(255,69,96,.25) !important; }
.stk-card--warn   { border-color: rgba(254,176,25,.20) !important; }
.h-full { height: 100%; }

.stk-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 12px;
}
.stk-head--error   { background: rgba(255,69,96,.06); }
.stk-head--warning { background: rgba(254,176,25,.06); }

.stk-title { font-weight: 500; font-size: 13.5px; letter-spacing: -.01em; }
.stk-sub   { font-size: 11px; opacity: .5; font-weight: 400; margin-top: 2px; }

.stk-alert-feed {
  display: flex;
  flex-direction: column;
  max-height: 340px;
  overflow-y: auto;
}
.stk-alert-feed--collapsed { max-height: 340px; }

.stk-alert-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity)*0.5));
  transition: background .15s;
}
.stk-alert-row:last-child { border-bottom: none; }
.stk-alert-row:hover { background: rgba(var(--v-theme-on-surface), .04); }
.stk-alert-row--error:hover   { background: rgba(255,69,96,.06); }
.stk-alert-row--warning:hover { background: rgba(254,176,25,.05); }

.stk-alert-info { flex: 1; min-width: 0; }
.stk-alert-name { font-size: 13px; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stk-alert-meta { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: 2px; }
.stk-alert-sku  { font-size: 11px; opacity: .55; font-weight: 400; }
.stk-alert-branch, .stk-alert-wh { font-size: 11px; opacity: .6; font-weight: 400; display: flex; align-items: center; gap: 2px; }

.stk-show-more {
  text-align: center;
  padding: 8px;
  font-size: 12px;
  font-weight: 400;
  opacity: .6;
  cursor: pointer;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.stk-show-more:hover { opacity: 1; background: rgba(var(--v-theme-on-surface), .03); }

/* ─── All good state ─────────────────────────────────────────────────────── */
.stk-allgood {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 14px;
  background: rgba(0,227,150,.07);
  border: 1px solid rgba(0,227,150,.2);
  font-size: 13px;
  font-weight: 400;
  color: #00E396;
}

/* ─── Branch overview list ───────────────────────────────────────────────── */
.stk-body { padding: 10px 12px 12px; }
.stk-body.pa-0 { padding: 0; }

.branch-list { display: flex; flex-direction: column; gap: 10px; padding: 6px 4px; }
.branch-row {
  display: grid;
  grid-template-columns: 140px 1fr auto auto;
  align-items: center;
  gap: 12px;
}
.branch-name { font-size: 13px; font-weight: 400; opacity: .85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.branch-bar-wrap { display: flex; height: 10px; border-radius: 6px; overflow: hidden; background: rgba(var(--v-theme-on-surface), .06); }
.branch-seg { height: 100%; transition: width .4s ease; }
.branch-seg--error   { background: #FF4560; }
.branch-seg--warning { background: #FEB019; }
.branch-seg--success { background: #00E396; }
.branch-badges { display: flex; gap: 4px; }
.branch-badge {
  font-size: 11px; font-weight: 500;
  padding: 1px 6px; border-radius: 20px;
}
.branch-badge--error   { background: rgba(255,69,96,.15);  color: #FF4560; }
.branch-badge--warning { background: rgba(254,176,25,.15); color: #FEB019; }
.branch-badge--success { background: rgba(0,227,150,.12);  color: #00E396; }
.branch-total { font-size: 12px; font-weight: 400; opacity: .55; white-space: nowrap; }
.branch-legend { display: flex; gap: 16px; padding-top: 8px; border-top: 1px solid rgba(var(--v-theme-on-surface),.06); margin-top: 4px; }
.bl-item { display: flex; align-items: center; gap: 5px; font-size: 11px; opacity: .65; font-weight: 400; }
.bl-dot  { width: 8px; height: 8px; border-radius: 50%; }

/* ─── Days inventory feed ────────────────────────────────────────────────── */
.days-feed { display: flex; flex-direction: column; max-height: 460px; overflow-y: auto; }
.days-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  cursor: pointer;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity)*0.5));
  transition: background .15s;
}
.days-row:last-child { border-bottom: none; }
.days-row:hover { background: rgba(var(--v-theme-on-surface), .04); }
.days-row--urgent { border-left: 3px solid #FF4560; }
.days-row--warn   { border-left: 3px solid #FEB019; }
.days-name  { flex: 1; min-width: 0; }
.days-product { font-size: 12.5px; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.days-sku   { font-size: 11px; opacity: .45; font-weight: 400; }
.days-mid   { flex: 0 0 auto; text-align: right; }
.days-rate  { display: block; font-size: 11.5px; font-weight: 400; opacity: .7; }
.days-stock { display: block; font-size: 11px; opacity: .45; }

/* ─── Misc ───────────────────────────────────────────────────────────────── */
.chip-soft  { border: 1px solid rgba(var(--v-theme-on-surface), 0.10) !important; }
.empty-state {
  padding: 28px 20px; text-align: center; font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.40); font-weight: 400;
}
.margin-details { display: grid; gap: 6px; }
.margin-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; padding: 6px 10px; border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}
.margin-label { font-size: 12px; font-weight: 400; color: rgba(var(--v-theme-on-surface), 0.55); }
.margin-value { font-size: 13px; font-weight: 500; }
.gap-2 { gap: 8px; }

/* ─── Ranking feed ───────────────────────────────────────────────────────── */
.rank-feed { display: flex; flex-direction: column; }
.rank-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity)*0.5));
  transition: background .15s;
}
.rank-row:last-child { border-bottom: none; }
.rank-row:hover { background: rgba(var(--v-theme-on-surface), .04); }
.rank-num {
  flex: 0 0 26px;
  font-size: 13px;
  font-weight: 500;
  opacity: .35;
  text-align: center;
}
.rank-num--top { opacity: 1; color: #1488d1; }
.rank-info { flex: 1; min-width: 0; }
.rank-name { font-size: 12.5px; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
.rank-bar-wrap { height: 4px; border-radius: 4px; background: rgba(var(--v-theme-on-surface), .07); overflow: hidden; }
.rank-bar-fill { height: 100%; border-radius: 4px; transition: width .4s ease; }
.rank-bar-fill--qty   { background: #1488d1; }
.rank-bar-fill--value { background: #2a96d6; }
.rank-meta { flex: 0 0 110px; text-align: right; }
.rank-primary   { font-size: 13px; font-weight: 500; }
.rank-secondary { font-size: 11px; opacity: .5; font-weight: 400; margin-top: 1px; }
.op30 { opacity: 0.3; }

/* ─── Toggle ─────────────────────────────────────────────────────────────── */
.dv-toggle {
  display: flex;
  background: rgba(var(--v-theme-on-surface), .06);
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
}
.dv-toggle-btn {
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 400;
  cursor: pointer;
  color: rgba(var(--v-theme-on-surface), .55);
  transition: all .15s;
  border: none;
  background: transparent;
}
.dv-toggle-btn.active {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  box-shadow: 0 1px 4px rgba(0,0,0,.15);
}
.op40  { opacity: 0.4; }
.mr-px { margin-right: 1px; }
</style>
