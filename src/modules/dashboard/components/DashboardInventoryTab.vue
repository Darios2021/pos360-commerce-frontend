<template>
  <div class="dinv">
    <!-- Row 1: 4 KPIs -->
    <v-row dense class="mb-3">
      <v-col cols="12" sm="6" md="3">
        <KpiCard
          title="Total productos"
          :value="String(num(inv.totalProducts))"
          :loading="loading"
          icon="mdi-package-variant-closed"
          tone="primary"
          :sub="`${num(inv.activeProducts)} activos (${activePct}%)`"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <KpiCard
          title="Activos"
          :value="String(num(inv.activeProducts))"
          :loading="loading"
          icon="mdi-check-decagram-outline"
          tone="success"
          :sub="`${num(inactiveProducts)} inactivos`"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <KpiCard
          title="Sin precio"
          :value="String(num(inv.noPriceProducts))"
          :loading="loading"
          icon="mdi-tag-off-outline"
          tone="warning"
          :sub="noPricePct > 0 ? `${noPricePct}% del catálogo` : 'Catálogo completo'"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <KpiCard
          title="Categorías"
          :value="String(num(inv.categories))"
          :loading="loading"
          icon="mdi-shape-outline"
          tone="info"
          :sub="`${productsByCategory.length} con productos`"
        />
      </v-col>
    </v-row>

    <!-- Row 2: Status Donut (4) + Category Bar (8) -->
    <v-row dense>
      <v-col cols="12" lg="4">
        <v-card class="inv-card" elevation="0">
          <div class="inv-head">
            <div class="minw-0">
              <div class="inv-title">Estado del catálogo</div>
              <div class="inv-sub">Activos / Inactivos / Sin precio</div>
            </div>
            <v-chip size="small" variant="tonal" class="chip-soft">
              Total: <b class="ml-1">{{ totalProducts }}</b>
            </v-chip>
          </div>
          <v-divider />
          <div class="inv-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!totalProducts" class="empty-state">Sin datos.</div>
            <div v-else>
              <ApexChart height="280" type="donut" :options="optStatusDonut" :series="seriesStatusDonut" />
              <div class="inv-stats px-4 pb-4">
                <div class="inv-stat-row">
                  <span class="stat-dot" style="background:#00E396"></span>
                  <span class="stat-label">Activos</span>
                  <span class="stat-value text-success">{{ activeProducts }}</span>
                </div>
                <div class="inv-stat-row">
                  <span class="stat-dot" style="background:#775DD0"></span>
                  <span class="stat-label">Inactivos</span>
                  <span class="stat-value">{{ inactiveProducts }}</span>
                </div>
                <div class="inv-stat-row">
                  <span class="stat-dot" style="background:#FEB019"></span>
                  <span class="stat-label">Sin precio</span>
                  <span class="stat-value text-warning">{{ noPriceProducts }}</span>
                </div>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="8">
        <v-card class="inv-card" elevation="0">
          <div class="inv-head">
            <div class="minw-0">
              <div class="inv-title">Productos por categoría</div>
              <div class="inv-sub">Top {{ productsByCategory.length }} categorías · Total vs Activos</div>
            </div>
            <v-chip size="small" variant="tonal" class="chip-soft">
              {{ productsByCategory.length }} categorías
            </v-chip>
          </div>
          <v-divider />
          <div class="inv-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!productsByCategory.length" class="empty-state">Sin datos de categorías.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="280" type="bar" :options="optCategoryBar" :series="seriesCategoryBar" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row 3: Data Quality Gauge + No-Price Detail -->
    <v-row dense class="mt-2">
      <v-col cols="12" lg="5">
        <v-card class="inv-card" elevation="0">
          <div class="inv-head">
            <div class="minw-0">
              <div class="inv-title">Calidad del catálogo</div>
              <div class="inv-sub">Completitud de los datos</div>
            </div>
          </div>
          <v-divider />
          <div class="inv-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!totalProducts" class="empty-state">Sin productos.</div>
            <div v-else>
              <ApexChart height="200" type="radialBar" :options="optQualityRadial" :series="seriesQualityRadial" />
              <div class="quality-grid px-4 pb-4">
                <div class="quality-item">
                  <div class="quality-pct" :class="activePct >= 80 ? 'text-success' : 'text-warning'">{{ activePct }}%</div>
                  <div class="quality-label">Activos</div>
                </div>
                <div class="quality-item">
                  <div class="quality-pct" :class="(100-noPricePct) >= 80 ? 'text-success' : 'text-warning'">{{ 100 - noPricePct }}%</div>
                  <div class="quality-label">Con precio</div>
                </div>
                <div class="quality-item">
                  <div class="quality-pct text-primary">{{ totalProducts }}</div>
                  <div class="quality-label">En catálogo</div>
                </div>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="7">
        <v-card class="inv-card" elevation="0">
          <div class="inv-head">
            <div class="minw-0">
              <div class="inv-title">Sin precio por categoría</div>
              <div class="inv-sub">Categorías con más productos incompletos</div>
            </div>
            <v-chip size="small" color="warning" variant="tonal">
              {{ totalNoPriceInCats }} productos
            </v-chip>
          </div>
          <v-divider />
          <div class="inv-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!noPriceCats.length" class="empty-state">
              <v-icon color="success" class="mb-2">mdi-check-circle</v-icon>
              <div>Todos los productos tienen precio asignado.</div>
            </div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="220" type="bar" :options="optNoPriceBar" :series="seriesNoPriceBar" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row 4: Last Products -->
    <v-row dense class="mt-2">
      <v-col cols="12">
        <v-card class="inv-card" elevation="0">
          <div class="inv-head">
            <div class="minw-0">
              <div class="inv-title">Últimos productos dados de alta</div>
              <div class="inv-sub">Altas recientes con estado y categoría</div>
            </div>
            <v-chip size="small" variant="tonal" class="chip-soft">
              Mostrando: <b class="ml-1">{{ lastProducts.length }}</b>
            </v-chip>
          </div>
          <v-divider />
          <v-card-text>
            <div v-if="loading" class="py-8 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else>
              <div class="products-grid">
                <div v-for="p in lastProducts" :key="p.id" class="product-item">
                  <div class="product-icon">
                    <v-icon size="20">mdi-package-variant</v-icon>
                  </div>
                  <div class="product-info">
                    <div class="product-name">{{ p.name || `Producto #${p.id}` }}</div>
                    <div class="product-meta">
                      <span>SKU: {{ p.sku || "—" }}</span>
                      <span class="sep">·</span>
                      <span>{{ p?.category?.name || "Sin categoría" }}</span>
                      <span v-if="p?.category?.parent?.name"> · {{ p.category.parent.name }}</span>
                    </div>
                  </div>
                  <div class="product-chips">
                    <v-chip v-if="isNoPrice(p)" size="x-small" color="warning" variant="tonal">
                      Sin precio
                    </v-chip>
                    <v-chip size="x-small" :color="String(p.is_active ?? 1) === '1' ? 'success' : 'default'" variant="tonal">
                      {{ String(p.is_active ?? 1) === "1" ? "Activo" : "Inactivo" }}
                    </v-chip>
                  </div>
                </div>
              </div>
              <div v-if="!lastProducts.length" class="empty-state">Sin productos.</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- ══ ANALYTICS PRODUCTS DEEP ══════════════════════════════════════════ -->

    <!-- Row A1: Por marca (8) + Flags (4) -->
    <v-row dense class="mt-2">
      <v-col cols="12" lg="8">
        <v-card class="inv-card" elevation="0">
          <div class="inv-head">
            <div class="minw-0">
              <div class="inv-title">Productos por marca</div>
              <div class="inv-sub">Total vs Activos · top 12 marcas</div>
            </div>
            <v-chip v-if="loadingAnalytics" size="small" variant="tonal" class="chip-soft">Cargando…</v-chip>
          </div>
          <v-divider />
          <div class="inv-body">
            <div v-if="loadingAnalytics" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!byBrand.length" class="empty-state">Sin datos de marcas.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="300" type="bar" :options="optBrand" :series="seriesBrand" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="inv-card" elevation="0">
          <div class="inv-head">
            <div class="minw-0">
              <div class="inv-title">Indicadores del catálogo</div>
              <div class="inv-sub">Nunca vendidos, promos, novedades</div>
            </div>
          </div>
          <v-divider />
          <div class="inv-body">
            <div v-if="loadingAnalytics" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else class="flags-grid">
              <div class="flag-item">
                <div class="flag-label">Nunca vendidos</div>
                <div class="flag-value text-error">{{ neverSold }}</div>
                <div class="flag-sub">activos sin venta</div>
              </div>
              <div class="flag-item">
                <div class="flag-label">En promoción</div>
                <div class="flag-value text-warning">{{ num(flags.promoCount) }}</div>
                <div class="flag-sub">is_promo = true</div>
              </div>
              <div class="flag-item">
                <div class="flag-label">Nuevos</div>
                <div class="flag-value text-success">{{ num(flags.newCount) }}</div>
                <div class="flag-sub">is_new = true</div>
              </div>
              <div class="flag-item">
                <div class="flag-label">Sin control stock</div>
                <div class="flag-value text-info">{{ num(flags.noTrackStock) }}</div>
                <div class="flag-sub">track_stock = false</div>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row A2: Top margen % (6) + Rangos de precio (6) -->
    <v-row dense class="mt-2">
      <v-col cols="12" lg="6">
        <v-card class="inv-card" elevation="0">
          <div class="inv-head">
            <div class="minw-0">
              <div class="inv-title">Top 10 por margen de ganancia %</div>
              <div class="inv-sub">Precio − Costo / Precio × 100</div>
            </div>
          </div>
          <v-divider />
          <div class="inv-body">
            <div v-if="loadingAnalytics" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!topMarginPct.length" class="empty-state">Sin datos de margen.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="300" type="bar" :options="optMarginPct" :series="seriesMarginPct" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6">
        <v-card class="inv-card" elevation="0">
          <div class="inv-head">
            <div class="minw-0">
              <div class="inv-title">Distribución por rango de precio</div>
              <div class="inv-sub">Cantidad de productos por rango</div>
            </div>
          </div>
          <v-divider />
          <div class="inv-body">
            <div v-if="loadingAnalytics" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!priceRanges.length" class="empty-state">Sin datos de precios.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="300" type="bar" :options="optPriceRanges" :series="seriesPriceRanges" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row A3: Crecimiento catálogo (12) -->
    <v-row dense class="mt-2">
      <v-col cols="12">
        <v-card class="inv-card" elevation="0">
          <div class="inv-head">
            <div class="minw-0">
              <div class="inv-title">Crecimiento del catálogo</div>
              <div class="inv-sub">Nuevos productos agregados por mes · últimos 12 meses</div>
            </div>
            <v-chip v-if="catalogGrowth.length" size="small" variant="tonal" class="chip-soft">
              {{ catalogGrowth.reduce((a, r) => a + num(r.count), 0) }} nuevos en el período
            </v-chip>
          </div>
          <v-divider />
          <div class="inv-body">
            <div v-if="loadingAnalytics" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!catalogGrowth.length" class="empty-state">Sin datos de crecimiento.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="220" type="area" :options="optCatalogGrowth" :series="seriesCatalogGrowth" />
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
  inv: { type: Object, default: () => ({}) },
  analytics: { type: Object, default: null },
});

function num(v) { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; }

// ─── Base data ─────────────────────────────────────────────────────────────────
const lastProducts = computed(() => Array.isArray(props.inv?.lastProducts) ? props.inv.lastProducts : []);
const productsByCategory = computed(() => Array.isArray(props.inv?.productsByCategory) ? props.inv.productsByCategory : []);

const totalProducts = computed(() => num(props.inv?.totalProducts));
const activeProducts = computed(() => num(props.inv?.activeProducts));
const noPriceProducts = computed(() => num(props.inv?.noPriceProducts));
const categories = computed(() => num(props.inv?.categories));
const inactiveProducts = computed(() => Math.max(0, totalProducts.value - activeProducts.value));

const activePct = computed(() => totalProducts.value > 0 ? Math.round((activeProducts.value / totalProducts.value) * 100) : 0);
const noPricePct = computed(() => totalProducts.value > 0 ? Math.round((noPriceProducts.value / totalProducts.value) * 100) : 0);

const noPriceCats = computed(() => productsByCategory.value.filter((c) => c.no_price_count > 0).sort((a, b) => b.no_price_count - a.no_price_count).slice(0, 10));
const totalNoPriceInCats = computed(() => noPriceCats.value.reduce((a, c) => a + c.no_price_count, 0));

function isNoPrice(p) {
  const lp = Number(p?.list_price ?? p?.price ?? p?.price_list ?? 0);
  const sp = Number(p?.sale_price ?? p?.discount_price ?? 0);
  const hasFlag = p?.has_price;
  if (hasFlag === false) return true;
  if (hasFlag === true) return false;
  return lp <= 0 && sp <= 0;
}

// ─── Apex common ──────────────────────────────────────────────────────────────
const apexCommon = {
  chart: { toolbar: { show: false }, zoom: { enabled: false }, fontFamily: "inherit", foreColor: "rgba(var(--v-theme-on-surface), 0.75)" },
  grid: { borderColor: "rgba(var(--v-theme-on-surface), 0.08)", padding: { left: 10, right: 14, top: 6, bottom: 0 } },
  dataLabels: { enabled: false },
};
const axisStyle = { colors: "rgba(var(--v-theme-on-surface), 0.60)" };
const axisBorder = { color: "rgba(var(--v-theme-on-surface), 0.12)" };

// ─── Status Donut ─────────────────────────────────────────────────────────────
const seriesStatusDonut = computed(() => [activeProducts.value, inactiveProducts.value, noPriceProducts.value]);
const optStatusDonut = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "donut" },
  labels: ["Activos", "Inactivos", "Sin precio"],
  colors: ["#00E396", "#775DD0", "#FEB019"],
  stroke: { width: 0 },
  plotOptions: {
    pie: { donut: { size: "68%", labels: { show: true, total: { show: true, label: "Total", formatter: () => `${totalProducts.value}` } } } },
  },
  legend: { show: false },
  tooltip: { theme: "dark", y: { formatter: (v) => `${v} productos · ${totalProducts.value ? Math.round((v/totalProducts.value)*100) : 0}%` } },
}));

// ─── Category Bar ─────────────────────────────────────────────────────────────
const catLabels = computed(() => productsByCategory.value.map((c) => c.cat_name));
const seriesCategoryBar = computed(() => [
  { name: "Total", data: productsByCategory.value.map((c) => c.product_count) },
  { name: "Activos", data: productsByCategory.value.map((c) => c.active_count) },
]);
const optCategoryBar = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  colors: ["#008FFB", "#00E396"],
  fill: { opacity: [0.85, 1] },
  stroke: { show: false },
  plotOptions: { bar: { horizontal: true, borderRadius: 4, borderRadiusApplication: "end", barHeight: "60%", grouped: true } },
  dataLabels: { enabled: true, offsetX: 4, style: { fontSize: "10px", colors: ["rgba(var(--v-theme-on-surface), 0.70)"] } },
  xaxis: { categories: catLabels.value, labels: { style: axisStyle, formatter: (v) => `${Math.round(Number(v||0))}` }, axisBorder, axisTicks: axisBorder },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "11px" }, maxWidth: 160 } },
  legend: { show: true, position: "top", horizontalAlign: "right", labels: { colors: "rgba(var(--v-theme-on-surface), 0.75)" } },
  tooltip: { theme: "dark", y: { formatter: (v, ctx) => {
    const c = productsByCategory.value[ctx.dataPointIndex];
    return `${v} productos ${ctx.seriesIndex === 0 ? `(${c?.no_price_count || 0} sin precio)` : "activos"}`;
  }}},
}));

// ─── Quality Radial ───────────────────────────────────────────────────────────
const seriesQualityRadial = computed(() => [activePct.value, 100 - noPricePct.value]);
const optQualityRadial = computed(() => ({
  chart: { type: "radialBar", toolbar: { show: false }, fontFamily: "inherit" },
  plotOptions: {
    radialBar: {
      offsetY: 0,
      startAngle: -140,
      endAngle: 140,
      hollow: { size: "40%" },
      track: { background: "rgba(var(--v-theme-on-surface), 0.08)", strokeWidth: "100%", margin: 8 },
      dataLabels: { name: { show: false }, value: { show: false } },
    },
  },
  colors: ["#00E396", "#008FFB"],
  labels: ["Activos %", "Con precio %"],
  legend: { show: true, position: "bottom", labels: { colors: "rgba(var(--v-theme-on-surface), 0.75)" } },
  stroke: { lineCap: "round" },
}));

// ─── No Price Bar ─────────────────────────────────────────────────────────────
const noPriceCatLabels = computed(() => noPriceCats.value.map((c) => c.cat_name));
const seriesNoPriceBar = computed(() => [{ name: "Sin precio", data: noPriceCats.value.map((c) => c.no_price_count) }]);
const optNoPriceBar = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  colors: ["#FEB019"],
  fill: { opacity: 1 },
  stroke: { show: false },
  plotOptions: { bar: { borderRadius: 5, columnWidth: "55%", dataLabels: { position: "top" } } },
  dataLabels: { enabled: true, style: { fontSize: "11px", colors: ["rgba(var(--v-theme-on-surface), 0.75)"] }, offsetY: -18, formatter: (v) => `${v}` },
  xaxis: { categories: noPriceCatLabels.value, labels: { style: axisStyle, rotate: -20, trim: true }, axisBorder, axisTicks: axisBorder },
  yaxis: { labels: { style: axisStyle } },
  tooltip: { theme: "dark", y: { formatter: (v) => `${v} productos sin precio` } },
}));

// ─── Analytics products deep ──────────────────────────────────────────────────
const ana = computed(() => props.analytics || {});

// Por marca
const byBrand = computed(() => Array.isArray(ana.value?.byBrand) ? ana.value.byBrand.slice(0, 12) : []);
const seriesBrand = computed(() => [
  { name: "Total", data: byBrand.value.map(r => num(r.count)), color: "#008FFB" },
  { name: "Activos", data: byBrand.value.map(r => num(r.activeCount)), color: "#00E396" },
]);
const optBrand = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar", toolbar: { show: false } },
  plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "65%", dataLabels: { position: "top" } } },
  dataLabels: { enabled: false },
  xaxis: {
    categories: byBrand.value.map(r => r.brand?.length > 18 ? r.brand.slice(0, 16) + "…" : r.brand),
    labels: { style: axisStyle },
  },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "11px" }, maxWidth: 150 } },
  legend: { show: true, position: "top", labels: { colors: "rgba(var(--v-theme-on-surface), 0.7)" } },
  tooltip: { theme: "dark", y: [
    { formatter: (v, { dataPointIndex }) => {
      const r = byBrand.value[dataPointIndex];
      return `${v} productos · Precio promedio: ${money(r?.avgPrice)}`;
    } },
    { formatter: v => `${v} activos` },
  ] },
}));

// Por margen %
const topMarginPct = computed(() => Array.isArray(ana.value?.topByMarginPct) ? ana.value.topByMarginPct.slice(0, 10) : []);
const seriesMarginPct = computed(() => [{ name: "Margen %", data: topMarginPct.value.map(r => Math.round(num(r.marginPct))) }]);
const optMarginPct = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar", toolbar: { show: false } },
  plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: "70%", distributed: true } },
  dataLabels: { enabled: true, formatter: v => `${Math.round(Number(v||0))}%`, style: { ...axisStyle, fontSize: "10px" } },
  xaxis: {
    categories: topMarginPct.value.map(r => r.name?.length > 18 ? r.name.slice(0, 16) + "…" : r.name),
    labels: { style: axisStyle, formatter: v => `${v}%` },
  },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "10px" }, maxWidth: 150 } },
  legend: { show: false },
  colors: ["#00E396","#26A69A","#43A047","#66BB6A","#A5D6A7","#FEB019","#FF7043","#AB47BC","#5C6BC0","#008FFB"],
  tooltip: { theme: "dark", y: { formatter: (v, { dataPointIndex }) => {
    const r = topMarginPct.value[dataPointIndex];
    return `${Math.round(Number(v||0))}% · Costo: ${money(r?.cost)} · Precio: ${money(r?.price)}`;
  } } },
}));

// Rangos de precio
const priceRanges = computed(() => Array.isArray(ana.value?.priceRanges) ? ana.value.priceRanges : []);
const seriesPriceRanges = computed(() => [{ name: "Productos", data: priceRanges.value.map(r => num(r.count)) }]);
const optPriceRanges = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar", toolbar: { show: false } },
  plotOptions: { bar: { borderRadius: 5, columnWidth: "65%", distributed: true } },
  dataLabels: { enabled: true, style: { ...axisStyle, fontSize: "10px" }, offsetY: -18 },
  xaxis: { categories: priceRanges.value.map(r => r.range), labels: { style: { ...axisStyle, fontSize: "9px" }, rotate: -30 }, axisBorder, axisTicks: axisBorder },
  yaxis: { labels: { style: axisStyle } },
  legend: { show: false },
  colors: ["#7C3AED","#6D28D9","#5B21B6","#4C1D95","#2196F3","#0288D1","#00838F","#00897B","#2E7D32"],
  tooltip: { theme: "dark", y: { formatter: v => `${v} productos` } },
}));

// Crecimiento catálogo
const catalogGrowth = computed(() => Array.isArray(ana.value?.catalogGrowth) ? ana.value.catalogGrowth : []);
const seriesCatalogGrowth = computed(() => [{ name: "Nuevos productos", data: catalogGrowth.value.map(r => num(r.count)) }]);
const optCatalogGrowth = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "area", toolbar: { show: false } },
  fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.05, stops: [0, 95] } },
  colors: ["#008FFB"],
  dataLabels: { enabled: false },
  stroke: { curve: "smooth", width: 2 },
  xaxis: { categories: catalogGrowth.value.map(r => r.ym?.slice(5) || ""), labels: { style: axisStyle }, axisBorder, axisTicks: axisBorder },
  yaxis: { labels: { style: axisStyle } },
  tooltip: { theme: "dark", y: { formatter: v => `${v} productos agregados` } },
}));

// Nunca vendidos
const neverSold = computed(() => num(ana.value?.neverSold));
const flags = computed(() => ana.value?.flags || {});

function money(val) {
  const n = Number(val || 0);
  try { return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n); }
  catch { return `$ ${Math.round(n)}`; }
}
</script>

<style scoped>
.dinv { display: flex; flex-direction: column; }

.inv-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  border-radius: 16px !important;
  overflow: hidden;
}

.inv-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 12px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.inv-title {
  font-weight: 900;
  letter-spacing: -0.01em;
  font-size: 13.5px;
  color: rgb(var(--v-theme-on-surface));
}
.inv-sub {
  margin-top: 3px;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.50);
  font-weight: 600;
}

.inv-body { padding: 10px 10px 12px; }

.chip-soft { border: 1px solid rgba(var(--v-theme-on-surface), 0.10); }

.empty-state {
  padding: 32px 20px;
  text-align: center;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  font-weight: 600;
}

.minw-0 { min-width: 0; }

/* Status stats */
.inv-stats { display: grid; gap: 6px; }
.inv-stat-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
.stat-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.stat-label { flex: 1; font-size: 12px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.65); }
.stat-value { font-size: 13px; font-weight: 900; }

/* Quality grid */
.quality-grid { display: flex; gap: 8px; justify-content: space-around; }
.quality-item { text-align: center; }
.quality-pct { font-size: 22px; font-weight: 950; line-height: 1.1; letter-spacing: -0.04em; }
.quality-label { font-size: 11px; font-weight: 700; color: rgba(var(--v-theme-on-surface), 0.55); margin-top: 2px; }

/* Products grid */
.products-grid { display: grid; gap: 0; }
.product-item {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 8px 4px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}
.product-item:last-child { border-bottom: none; }
.product-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.10);
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
}
.product-name { font-size: 12.5px; font-weight: 700; line-height: 1.2; }
.product-meta { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); margin-top: 2px; }
.product-chips { display: flex; gap: 4px; flex-wrap: wrap; }
.sep { opacity: 0.5; }

.flags-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.flag-item {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}
.flag-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(var(--v-theme-on-surface), 0.50);
  margin-bottom: 4px;
}
.flag-value {
  font-size: 1.5rem;
  font-weight: 950;
  letter-spacing: -0.03em;
  line-height: 1;
}
.flag-sub {
  font-size: 10.5px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  font-weight: 600;
  margin-top: 3px;
}
</style>
