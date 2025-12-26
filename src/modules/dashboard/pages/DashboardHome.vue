<!-- src/modules/dashboard/pages/DashboardHome.vue -->
<template>
  <v-container fluid class="dash-wrap">
    <!-- Header -->
    <div class="d-flex align-start justify-space-between flex-wrap ga-3 mb-4">
      <div>
        <div class="text-h4 font-weight-bold">Dashboard</div>
        <div class="text-caption text-medium-emphasis">{{ subtitle }}</div>
      </div>

      <div class="d-flex align-center ga-2">
        <v-select
          v-model="branchPick"
          :items="branchOptions"
          item-title="title"
          item-value="value"
          label="Sucursal"
          density="comfortable"
          variant="outlined"
          style="min-width:280px"
          hide-details
          :disabled="branchLocked"
        />
        <v-btn color="primary" variant="flat" prepend-icon="mdi-refresh" :loading="loadingAny" @click="reloadAll">
          ACTUALIZAR
        </v-btn>
      </div>
    </div>

    <v-card rounded="2xl" class="dash-shell" elevation="0">
      <!-- Tabs -->
      <v-tabs v-model="tab" bg-color="transparent" class="px-2 pt-2">
        <v-tab value="sales" prepend-icon="mdi-cash-register">VENTAS</v-tab>
        <v-tab value="stock" prepend-icon="mdi-warehouse">STOCK</v-tab>
        <v-tab value="inventory" prepend-icon="mdi-cube-outline">INVENTARIO</v-tab>
      </v-tabs>

      <v-divider class="mt-2" />

      <v-window v-model="tab" class="px-4 py-4">
        <!-- ===================== -->
        <!-- VENTAS -->
        <!-- ===================== -->
        <v-window-item value="sales">
          <div class="d-flex flex-wrap ga-3 mb-4">
            <KpiCard label="Ventas (hoy)" :value="fmtInt(salesKpi.todayCount)" :loading="loadingSales" icon="mdi-receipt-text-outline" />
            <KpiCard label="Total (hoy)" :value="fmtMoney(salesKpi.todayTotal)" :loading="loadingSales" icon="mdi-cash" />
            <KpiCard label="Ticket promedio" :value="fmtMoney(salesKpi.avgTicket)" :loading="loadingSales" icon="mdi-calculator-variant-outline" />
            <KpiCard label="Top método" :value="salesKpi.topPaymentLabel || '—'" :loading="loadingSales" icon="mdi-credit-card-outline" />
          </div>

          <div class="grid-2 mb-4">
            <DashboardCharts
              title-left="Ventas (últimos 7 días)"
              type="area"
              :height="320"
              :ready="salesCharts.readyLine"
              :series="salesCharts.seriesLine"
              :options="salesCharts.optionsLine"
            />

            <DashboardCharts
              title-left="Pagos por método (hoy)"
              type="donut"
              :height="320"
              :ready="salesCharts.readyDonut"
              :series="salesCharts.seriesDonut"
              :options="salesCharts.optionsDonut"
            />
          </div>

          <DashboardCharts
            title-left="Ventas por sucursal (últimos 30 días)"
            type="bar"
            :height="260"
            :ready="salesCharts.readyByBranch"
            :series="salesCharts.seriesByBranch"
            :options="salesCharts.optionsByBranch"
            class="mb-4"
          />

          <v-card class="dash-card" rounded="xl" elevation="0">
            <div class="px-4 pt-4 pb-2 d-flex align-center justify-space-between">
              <div class="text-subtitle-1 font-weight-bold">Últimas ventas (pagadas)</div>
              <v-chip size="small" variant="tonal">{{ salesLast.length }} items</v-chip>
            </div>

            <v-data-table
              class="dash-table"
              :headers="saleHeaders"
              :items="salesLast"
              :items-per-page="10"
              density="comfortable"
            >
              <template #item.total="{ item }">
                <span class="font-weight-bold">{{ fmtMoney(item.total) }}</span>
              </template>
              <template #item.sold_at="{ item }">
                <span>{{ fmtDateTime(item.sold_at) }}</span>
              </template>
              <template #item.branch="{ item }">
                <span>{{ item.branch_name || item.branch_id || "—" }}</span>
              </template>
              <template #item.user="{ item }">
                <span>{{ item.user_label || "—" }}</span>
              </template>
            </v-data-table>
          </v-card>

          <v-expansion-panels class="mt-4" variant="accordion">
            <v-expansion-panel>
              <v-expansion-panel-title>Ver JSON (debug)</v-expansion-panel-title>
              <v-expansion-panel-text>
                <pre class="json">{{ JSON.stringify(salesRaw, null, 2) }}</pre>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-window-item>

        <!-- ===================== -->
        <!-- STOCK -->
        <!-- ===================== -->
        <v-window-item value="stock">
          <v-alert v-if="stockError" type="warning" variant="tonal" class="mb-4">
            {{ stockError }}
          </v-alert>

          <div class="d-flex flex-wrap ga-3 mb-4">
            <KpiCard label="Sin stock" :value="fmtInt(stockKpi.outCount)" :loading="loadingStock" icon="mdi-close-circle-outline" />
            <KpiCard label="Bajo stock" :value="fmtInt(stockKpi.lowCount)" :loading="loadingStock" :sub="`<= ${stockKpi.lowThreshold || 3}`" icon="mdi-alert-outline" />
            <KpiCard label="OK" :value="fmtInt(stockKpi.okCount)" :loading="loadingStock" icon="mdi-check-circle-outline" />
            <KpiCard label="Unidades" :value="fmtInt(stockKpi.totalUnits)" :loading="loadingStock" sub="sumatoria" icon="mdi-counter" />
          </div>

          <div class="grid-2">
            <DashboardCharts
              title-left="Stock por sucursal (unidades)"
              type="bar"
              :height="320"
              :ready="stockCharts.readyByBranch"
              :series="stockCharts.seriesByBranch"
              :options="stockCharts.optionsByBranch"
            />

            <DashboardCharts
              title-left="Movimientos (7 días)"
              type="line"
              :height="320"
              :ready="stockCharts.readyMoves"
              :series="stockCharts.seriesMoves"
              :options="stockCharts.optionsMoves"
            />
          </div>

          <v-expansion-panels class="mt-4" variant="accordion">
            <v-expansion-panel>
              <v-expansion-panel-title>Ver JSON (debug)</v-expansion-panel-title>
              <v-expansion-panel-text>
                <pre class="json">{{ JSON.stringify(stockRaw, null, 2) }}</pre>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-window-item>

        <!-- ===================== -->
        <!-- INVENTARIO -->
        <!-- ===================== -->
        <v-window-item value="inventory">
          <div class="d-flex flex-wrap ga-3 mb-4">
            <KpiCard label="Productos" :value="fmtInt(invKpi.totalProducts)" :loading="loadingInv" icon="mdi-cube-outline" />
            <KpiCard label="Activos" :value="fmtInt(invKpi.activeProducts)" :loading="loadingInv" icon="mdi-check-decagram-outline" />
            <KpiCard label="Sin precio" :value="fmtInt(invKpi.noPriceProducts)" :loading="loadingInv" icon="mdi-tag-off-outline" />
            <KpiCard label="Categorías" :value="fmtInt(invKpi.categories)" :loading="loadingInv" icon="mdi-shape-outline" />
          </div>

          <div class="grid-2">
            <v-card class="dash-card" rounded="xl" elevation="0">
              <div class="px-4 pt-4 pb-2 text-subtitle-1 font-weight-bold">Últimos productos creados</div>

              <v-data-table
                class="dash-table"
                :headers="prodHeaders"
                :items="invLastProducts"
                :items-per-page="10"
                density="comfortable"
              >
                <template #item.id="{ item }">#{{ item.id }}</template>
                <template #item.active="{ item }">
                  <v-chip size="small" :color="item.is_active ? 'green' : 'grey'" variant="tonal">
                    {{ item.is_active ? "SI" : "NO" }}
                  </v-chip>
                </template>
                <template #item.category="{ item }">
                  <div class="text-caption">{{ item.category_path || "—" }}</div>
                </template>
              </v-data-table>
            </v-card>

            <DashboardCharts
              title-left="Estado inventario"
              type="donut"
              :height="360"
              :ready="invCharts.readyDonut"
              :series="invCharts.seriesDonut"
              :options="invCharts.optionsDonut"
            />
          </div>

          <v-expansion-panels class="mt-4" variant="accordion">
            <v-expansion-panel>
              <v-expansion-panel-title>Ver JSON (debug)</v-expansion-panel-title>
              <v-expansion-panel-text>
                <pre class="json">{{ JSON.stringify(invRaw, null, 2) }}</pre>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-window-item>
      </v-window>
    </v-card>
  </v-container>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import http from "@/app/api/http";

import DashboardCharts from "../components/DashboardCharts.vue";
import KpiCard from "../components/KpiCard.vue";

const tab = ref("sales");
const loadingSales = ref(false);
const loadingInv = ref(false);
const loadingStock = ref(false);

const salesRaw = ref(null);
const invRaw = ref(null);
const stockRaw = ref(null);

const stockError = ref("");
const scope = ref({ admin: false, branchId: null, mode: "" });

// selector
const branchPick = ref(null);

// ✅ cache persistente de sucursales para que NO desaparezcan al filtrar
const branchesCache = ref([]);

// ===== Helpers UI =====
function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}
function ymd(d = new Date()) {
  const x = new Date(d);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function fmtMoney(n) {
  const v = Number(n || 0);
  return v.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}
function fmtInt(n) {
  return Number(n || 0).toLocaleString("es-AR");
}
function fmtDateTime(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString("es-AR");
}

const subtitle = computed(() => (branchPick.value ? `Sucursal #${branchPick.value}` : "Todas las sucursales"));
const loadingAny = computed(() => loadingSales.value || loadingInv.value || loadingStock.value);
const branchLocked = computed(() => scope.value?.admin === false);

// ✅ options siempre se basan en cache + “Todas”
const branchOptions = computed(() => {
  // no-admin: solo su sucursal
  if (scope.value?.admin === false) {
    const bid = toInt(scope.value?.branchId, 0);
    if (bid) return [{ title: `Sucursal #${bid}`, value: bid }];
    return [{ title: "Sucursal (no detectada)", value: null }];
  }

  const opts = [{ title: "Todas", value: null }];

  for (const b of branchesCache.value || []) {
    const id = toInt(b.id, 0);
    if (!id) continue;
    const title = b.name ? `${b.name} (#${id})` : `Sucursal #${id}`;
    if (!opts.some((x) => x.value === id)) opts.push({ title, value: id });
  }

  // si elegiste una branch que no está en cache por lo que sea, la agregamos igual
  if (branchPick.value && !opts.some((x) => x.value === branchPick.value)) {
    opts.push({ title: `Sucursal #${branchPick.value}`, value: branchPick.value });
  }

  return opts;
});

// ======= SALES KPIs (FIX contrato backend) =======
const salesKpi = computed(() => {
  const d = salesRaw.value?.data || {};

  // backend actual: today: {count,total,avgTicket,...}
  const t = d.today || {};

  const todayCount = Number(t.count || 0);
  const todayTotal = Number(t.total || 0);

  // fallback si avgTicket no viene
  const avgTicket = Number(t.avgTicket || 0) || (todayCount > 0 ? todayTotal / todayCount : 0);

  // top método: lo trae backend, pero si no, lo calculamos
  let topPaymentLabel = d.topPaymentLabel || "—";
  if (topPaymentLabel === "—" || !topPaymentLabel) {
    const pbm = d.paymentsByMethod || {};
    let bestK = null, bestV = 0;
    for (const k of Object.keys(pbm)) {
      const v = Number(pbm[k] || 0);
      if (v > bestV) { bestV = v; bestK = k; }
    }
    if (bestK) topPaymentLabel = String(bestK).toUpperCase();
  }

  return { todayCount, todayTotal, avgTicket, topPaymentLabel };
});

const salesCharts = computed(() => {
  const d = salesRaw.value?.data || {};

  // 7 días
  const salesByDay = Array.isArray(d.salesByDay) ? d.salesByDay : [];
  const categories = salesByDay.map((x) => x.date);
  const data = salesByDay.map((x) => Number(x.total || 0));
  const readyLine = categories.length > 0;

  const seriesLine = [{ name: "Total", data }];
  const optionsLine = {
    chart: { toolbar: { show: false }, foreColor: "#cfd8dc" },
    xaxis: { categories, labels: { rotate: -45 } },
    stroke: { curve: "smooth", width: 3 },
    dataLabels: { enabled: false },
    tooltip: { theme: "dark" },
    grid: { borderColor: "rgba(255,255,255,.08)" },
  };

  // donut pagos método (obj {CASH:123, QR:456})
  const pbm = d.paymentsByMethod || {};
  const donutLabels = Object.keys(pbm);
  const donutSeries = donutLabels.map((k) => Number(pbm[k] || 0));
  const readyDonut = donutLabels.length > 0 && donutSeries.some((x) => x > 0);

  const optionsDonut = {
    chart: { foreColor: "#cfd8dc" },
    labels: donutLabels,
    legend: { position: "right" },
    dataLabels: { enabled: true },
    tooltip: { theme: "dark" },
    plotOptions: { pie: { donut: { size: "64%" } } },
  };

  // ✅ ventas por sucursal: backend actual devuelve byBranch = [{branch_id,branch_name,total,count}]
  const byArr = Array.isArray(d.byBranch) ? d.byBranch : [];
  const bCats = byArr.map((x) => x.branch_name || `Sucursal #${x.branch_id}`);
  const bData = byArr.map((x) => Number(x.total || 0));
  const readyByBranch = bCats.length > 0 && bData.some((x) => x > 0);

  const seriesByBranch = [{ name: "Total", data: bData }];
  const optionsByBranch = {
    chart: { toolbar: { show: false }, foreColor: "#cfd8dc" },
    xaxis: { categories: bCats, labels: { rotate: -15 } },
    dataLabels: { enabled: false },
    tooltip: { theme: "dark" },
    grid: { borderColor: "rgba(255,255,255,.08)" },
    plotOptions: { bar: { borderRadius: 8, columnWidth: "48%" } },
  };

  return {
    readyLine, seriesLine, optionsLine,
    readyDonut, seriesDonut: donutSeries, optionsDonut,
    readyByBranch, seriesByBranch, optionsByBranch,
  };
});

const salesLast = computed(() => {
  const d = salesRaw.value?.data || {};
  const arr = Array.isArray(d.lastSales) ? d.lastSales : [];

  return arr.map((s) => {
    const b = s.branch || {};
    const u = s.user || {};
    const userLabel =
      u.full_name || u.name || u.username || u.email || u.identifier || null;

    return {
      id: s.id,
      sold_at: s.sold_at,
      total: s.total,
      branch_id: s.branch_id,
      branch_name: b?.name || null,
      user_label: userLabel,
    };
  });
});

const saleHeaders = [
  { title: "ID", key: "id", sortable: true, width: 80 },
  { title: "Fecha", key: "sold_at", sortable: true, width: 190 },
  { title: "Sucursal", key: "branch", sortable: false, width: 200 },
  { title: "Usuario", key: "user", sortable: false, width: 240 },
  { title: "Total", key: "total", sortable: true, align: "end", width: 140 },
];

// ======= INVENTORY =======
const invKpi = computed(() => invRaw.value?.data || {});
const invLastProducts = computed(() => {
  const d = invRaw.value?.data || {};
  const arr = Array.isArray(d.lastProducts) ? d.lastProducts : [];

  return arr.map((p) => {
    const cat = p.category || null;
    const parent = cat?.parent || null;
    const categoryPath = parent?.name ? `${parent.name} > ${cat?.name || "—"}` : (cat?.name || "—");

    return { id: p.id, name: p.name, is_active: !!p.is_active, category_path: categoryPath };
  });
});

const invCharts = computed(() => {
  const d = invRaw.value?.data || {};
  const active = Number(d.activeProducts || 0);
  const total = Number(d.totalProducts || 0);
  const inactive = Math.max(0, total - active);
  const noPrice = Number(d.noPriceProducts || 0);

  const series = [active, inactive, noPrice];
  const ready = series.some((x) => x > 0);

  return {
    readyDonut: ready,
    seriesDonut: series,
    optionsDonut: {
      chart: { foreColor: "#cfd8dc" },
      labels: ["Activos", "Inactivos", "Sin precio"],
      legend: { position: "right" },
      tooltip: { theme: "dark" },
      plotOptions: { pie: { donut: { size: "64%" } } },
    },
  };
});

const prodHeaders = [
  { title: "ID", key: "id", sortable: true, width: 90 },
  { title: "Nombre", key: "name", sortable: true },
  { title: "Categoría", key: "category", sortable: false, width: 320 },
  { title: "Activo", key: "active", sortable: false, width: 120, align: "center" },
];

// ======= STOCK =======
const stockKpi = reactive({ outCount: 0, lowCount: 0, okCount: 0, totalUnits: 0, lowThreshold: 3 });

const stockCharts = computed(() => {
  const d = stockRaw.value?.data || {};
  const by = Array.isArray(d.stockByBranch) ? d.stockByBranch : [];
  const moves = Array.isArray(d.movementsByDay) ? d.movementsByDay : [];

  const bCats = by.map((x) => x.branch_name || `Sucursal #${x.branch_id}`);
  const bData = by.map((x) => Number(x.units || 0));

  const mCats = moves.map((x) => x.date);
  const mData = moves.map((x) => Number(x.count || 0));

  return {
    readyByBranch: bCats.length > 0 && bData.some((x) => x > 0),
    seriesByBranch: [{ name: "Unidades", data: bData }],
    optionsByBranch: {
      chart: { toolbar: { show: false }, foreColor: "#cfd8dc" },
      xaxis: { categories: bCats, labels: { rotate: -15 } },
      grid: { borderColor: "rgba(255,255,255,.08)" },
      tooltip: { theme: "dark" },
      plotOptions: { bar: { borderRadius: 8, columnWidth: "48%" } },
      dataLabels: { enabled: false },
    },

    readyMoves: mCats.length > 0 && mData.some((x) => x > 0),
    seriesMoves: [{ name: "Movimientos", data: mData }],
    optionsMoves: {
      chart: { toolbar: { show: false }, foreColor: "#cfd8dc" },
      xaxis: { categories: mCats, labels: { rotate: -45 } },
      grid: { borderColor: "rgba(255,255,255,.08)" },
      tooltip: { theme: "dark" },
      stroke: { curve: "smooth", width: 3 },
      dataLabels: { enabled: false },
    },
  };
});

// ===== API calls =====
let reloadToken = 0;

async function fetchSales(localToken) {
  loadingSales.value = true;
  try {
    const params = {};
    if (branchPick.value) params.branch_id = branchPick.value;

    const { data } = await http.get("/dashboard/sales", { params });

    // si hubo otro reload, ignoramos este
    if (localToken !== reloadToken) return;

    salesRaw.value = data;
    scope.value = data?.scope || scope.value;

    // ✅ actualiza cache de sucursales SOLO si viene byBranch (admin sin filtro)
    if (scope.value?.admin === true) {
      const by = Array.isArray(data?.data?.byBranch) ? data.data.byBranch : [];
      if (by.length) {
        const list = by
          .map((r) => ({ id: toInt(r.branch_id, 0), name: r.branch_name || null }))
          .filter((x) => x.id > 0);

        // merge
        const map = new Map((branchesCache.value || []).map((b) => [toInt(b.id, 0), b]));
        for (const b of list) map.set(b.id, b);
        branchesCache.value = Array.from(map.values()).sort((a, b) => a.id - b.id);
      }
    }

    // no-admin: forzamos selector a su branch, pero sin romper opciones
    if (scope.value?.admin === false) {
      const bid = toInt(scope.value?.branchId, 0);
      if (bid) branchPick.value = bid;
    }
  } finally {
    loadingSales.value = false;
  }
}

async function fetchInventory(localToken) {
  loadingInv.value = true;
  try {
    const params = {};
    if (branchPick.value) params.branch_id = branchPick.value;

    const { data } = await http.get("/dashboard/inventory", { params });
    if (localToken !== reloadToken) return;
    invRaw.value = data;
  } finally {
    loadingInv.value = false;
  }
}

async function fetchStock(localToken) {
  loadingStock.value = true;
  stockError.value = "";
  try {
    const params = {};
    if (branchPick.value) params.branch_id = branchPick.value;

    const { data } = await http.get("/dashboard/stock", { params });
    if (localToken !== reloadToken) return;

    stockRaw.value = data;

    const k = data?.data?.kpis || {};
    stockKpi.outCount = Number(k.outCount || 0);
    stockKpi.lowCount = Number(k.lowCount || 0);
    stockKpi.okCount = Number(k.okCount || 0);
    stockKpi.totalUnits = Number(k.totalUnits || 0);
    stockKpi.lowThreshold = Number(k.lowThreshold || 3);
  } catch (e) {
    const msg =
      e?.response?.status === 404
        ? "Endpoint /dashboard/stock no existe (404)."
        : (e?.response?.data?.message || e?.message || "Error cargando stock.");

    stockError.value = msg;
    stockRaw.value = { ok: false, error: msg };
    stockKpi.outCount = 0; stockKpi.lowCount = 0; stockKpi.okCount = 0; stockKpi.totalUnits = 0; stockKpi.lowThreshold = 3;
  } finally {
    loadingStock.value = false;
  }
}

async function reloadAll() {
  reloadToken++;
  const localToken = reloadToken;

  await Promise.all([
    fetchSales(localToken),
    fetchInventory(localToken),
    fetchStock(localToken),
  ]);
}

// si cambias sucursal, recargamos (pero sin carrera infinita)
watch(branchPick, async () => {
  await reloadAll();
});

onMounted(async () => {
  await reloadAll();
});
</script>

<style scoped>
.dash-wrap {
  min-height: 100vh;
  padding-bottom: 40px;
  background: radial-gradient(900px 500px at 15% 0%, rgba(25,118,210,.28), transparent 55%),
    radial-gradient(900px 500px at 85% 0%, rgba(0,188,212,.16), transparent 55%),
    #0b0f14;
}

.dash-shell {
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.06);
  padding-bottom: 18px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1.25fr 0.75fr;
  gap: 14px;
}

@media (max-width: 1100px) {
  .grid-2 { grid-template-columns: 1fr; }
}

.dash-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.dash-table :deep(.v-table) {
  background: transparent !important;
}

.json {
  background: rgba(0,0,0,.25);
  border: 1px solid rgba(255,255,255,.08);
  padding: 12px;
  border-radius: 12px;
  overflow: auto;
  max-height: 420px;
}
</style>
