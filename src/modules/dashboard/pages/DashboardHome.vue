<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/dashboard/pages/DashboardHome.vue -->

<template>
  <div class="dash-page">
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <div>
        <div class="text-h4 font-weight-black">Dashboard</div>
        <div class="text-caption text-medium-emphasis">{{ scopeText }}</div>
      </div>

      <div class="d-flex align-center ga-2 flex-wrap">
        <v-select
          v-model="branchSelected"
          :items="branchOptions"
          item-title="title"
          item-value="value"
          label="Sucursal"
          density="comfortable"
          variant="outlined"
          hide-details
          style="min-width: 280px"
          :disabled="!isAdmin"
        />

        <v-btn color="primary" variant="flat" prepend-icon="mdi-refresh" :loading="loading" @click="refresh">
          Actualizar
        </v-btn>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="rounded-xl mb-3">
      {{ error }}
    </v-alert>

    <v-card class="dash-surface rounded-xl" elevation="0">
      <v-tabs v-model="tab" density="comfortable">
        <v-tab value="sales"><v-icon start>mdi-cash-register</v-icon>Ventas</v-tab>
        <v-tab value="stock"><v-icon start>mdi-warehouse</v-icon>Stock</v-tab>
        <v-tab value="inventory"><v-icon start>mdi-package-variant</v-icon>Inventario</v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text class="pt-4">
        <v-window v-model="tab">
          <v-window-item value="sales">
            <DashboardSalesTab
              :loading="loading"
              :is-admin="isAdmin"
              :scope="raw?.scope || null"
              :scope-label="scopeLabel"
              :sales="ui.sales"
              :period="period"
              @period-change="onPeriodChange"
            />
          </v-window-item>

          <v-window-item value="stock">
            <DashboardStockTab
              :loading="loading"
              :is-admin="isAdmin"
              :scope-label="scopeLabel"
              :stock="ui.stock"
            />
          </v-window-item>

          <v-window-item value="inventory">
            <DashboardInventoryTab :loading="loading" :inv="ui.inventory" />
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider />

      <v-expansion-panels variant="accordion">
        <v-expansion-panel>
          <v-expansion-panel-title>Ver JSON (debug)</v-expansion-panel-title>
          <v-expansion-panel-text>
            <pre class="dash-pre">{{ rawJson }}</pre>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";

import DashboardSalesTab from "../components/DashboardSalesTab.vue";
import DashboardStockTab from "../components/DashboardStockTab.vue";
import DashboardInventoryTab from "../components/DashboardInventoryTab.vue";

import { dashboardOverview, listBranches } from "../service/dashboard.api";

// ---------------------
// Auth helpers
// ---------------------
function getAuthUser() {
  try {
    const raw = localStorage.getItem("pos360_user") || localStorage.getItem("user") || "";
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}
function isAdminUser(u) {
  const email = String(u?.email || u?.identifier || u?.username || "").toLowerCase();
  if (email.includes("admin@360pos.local")) return true;
  if (u?.is_admin === true || u?.isAdmin === true || u?.admin === true) return true;
  const roles = []
    .concat(u?.role ? [u.role] : [])
    .concat(u?.rol ? [u.rol] : [])
    .concat(Array.isArray(u?.roles) ? u.roles : []);
  return roles
    .map((r) => (typeof r === "string" ? r : (r?.name || r?.role || "")))
    .map((s) => String(s).toLowerCase())
    .some((x) => ["admin", "super_admin", "superadmin", "root", "owner"].includes(x));
}

const user = ref(getAuthUser());
const isAdmin = computed(() => isAdminUser(user.value));
const userBranchId = computed(() => Number(user.value?.branch_id || 0) || null);

// ---------------------
// UI state
// ---------------------
const tab = ref("sales");
const loading = ref(false);
const error = ref("");

// ✅ período para ventas (lo maneja el padre)
const period = ref("30d"); // "30d" | "90d" | "12m" | "all"

const branches = ref([]); // [{id,name}]
const branchSelected = ref(null); // null => todas

const ui = ref({
  sales: {
    today: { count: 0, total: 0, avgTicket: 0 },
    week: { count: 0, total: 0, avgTicket: 0 },
    month: { count: 0, total: 0, avgTicket: 0 },
    trend: { week_total_pct: 0, week_count_pct: 0, month_total_pct: 0, month_count_pct: 0 },

    paymentsToday: [],
    salesByDay: [],

    // compat old/new para picos
    salesByDay30: [],
    salesByPeriodDaily: [],

    salesByBranch: [],
    lastSales: [],

    // compat old/new para tops
    topBranch30d: null,
    topBranchPeriod: null,

    topCashiers30d: [],
    topCashiersPeriod: [],

    topProducts30d: [],
    topProductsPeriod: [],

    bestMonth12m: null,
    bestMonthPeriod: null,

    // ✅ periodo (para charts)
    periodFrom: null,
    periodTo: null,
  },
  stock: {
    outOfStockCount: 0,
    lowStockCount: 0,
    trackedProducts: 0,
    stockByBranch: [],
    lowStockItems: [],
    lowThreshold: 3,
  },
  inventory: { totalProducts: 0, activeProducts: 0, noPriceProducts: 0, categories: 0, lastProducts: [] },
});

const raw = ref(null);
const rawJson = computed(() => JSON.stringify(raw.value, null, 2));

const effectiveBranchId = computed(() =>
  isAdmin.value ? (branchSelected.value ? Number(branchSelected.value) : null) : userBranchId.value
);

const branchOptions = computed(() => {
  const opts = [];
  if (isAdmin.value) opts.push({ title: "Todas", value: null });
  for (const b of branches.value) opts.push({ title: b.name || `Sucursal #${b.id}`, value: Number(b.id) });
  if (!isAdmin.value && userBranchId.value && !opts.some((o) => o.value === userBranchId.value)) {
    opts.push({ title: `Sucursal #${userBranchId.value}`, value: userBranchId.value });
  }
  return opts;
});

const scopeLabel = computed(() => {
  const bid = effectiveBranchId.value;
  if (!bid) return "Todas las sucursales";
  const b = branches.value.find((x) => Number(x.id) === Number(bid));
  return b?.name || `Sucursal #${bid}`;
});
const scopeText = computed(() => scopeLabel.value);

// ---------------------
// Adapter: OVERVIEW -> UI (compat)
// ---------------------
function adaptOverviewToUi(payload) {
  const data = payload?.data || payload;

  const s = data?.sales || {};
  const inv = data?.inventory || {};
  const st = data?.stock || {};

  ui.value.sales = {
    today: s?.today && typeof s.today === "object" ? s.today : { count: 0, total: 0, avgTicket: 0 },
    week: s?.week && typeof s.week === "object" ? s.week : { count: 0, total: 0, avgTicket: 0 },
    month: s?.month && typeof s.month === "object" ? s.month : { count: 0, total: 0, avgTicket: 0 },
    trend: s?.trend && typeof s.trend === "object" ? s.trend : { week_total_pct: 0, week_count_pct: 0, month_total_pct: 0, month_count_pct: 0 },

    paymentsToday: Array.isArray(s?.paymentsToday) ? s.paymentsToday : [],
    salesByDay: Array.isArray(s?.salesByDay) ? s.salesByDay : [],

    // ✅ picos: nuevo/old
    salesByPeriodDaily: Array.isArray(s?.salesByPeriodDaily) ? s.salesByPeriodDaily : [],
    salesByDay30: Array.isArray(s?.salesByDay30) ? s.salesByDay30 : [],

    salesByBranch: Array.isArray(s?.salesByBranch) ? s.salesByBranch : [],
    lastSales: Array.isArray(s?.lastSales) ? s.lastSales : [],

    // ✅ top branch: nuevo/old
    topBranchPeriod: s?.topBranchPeriod || null,
    topBranch30d: s?.topBranch30d || null,

    // ✅ top cashiers: nuevo/old
    topCashiersPeriod: Array.isArray(s?.topCashiersPeriod) ? s.topCashiersPeriod : [],
    topCashiers30d: Array.isArray(s?.topCashiers30d) ? s.topCashiers30d : [],

    // ✅ top products: nuevo/old
    topProductsPeriod: Array.isArray(s?.topProductsPeriod) ? s.topProductsPeriod : [],
    topProducts30d: Array.isArray(s?.topProducts30d) ? s.topProducts30d : [],

    // ✅ best month: nuevo/old
    bestMonthPeriod: s?.bestMonthPeriod || null,
    bestMonth12m: s?.bestMonth12m || null,

    // ✅ periodo para charts
    periodFrom: s?.periodFrom || null,
    periodTo: s?.periodTo || null,
  };

  ui.value.inventory = {
    totalProducts: Number(inv?.totalProducts || 0),
    activeProducts: Number(inv?.activeProducts || 0),
    noPriceProducts: Number(inv?.noPriceProducts || 0),
    categories: Number(inv?.categories || 0),
    lastProducts: Array.isArray(inv?.lastProducts) ? inv.lastProducts : [],
  };

  ui.value.stock = {
    outOfStockCount: Number(st?.outCount || 0),
    lowStockCount: Number(st?.lowCount || 0),
    trackedProducts: Number(st?.trackedProducts || st?.distinct_products || 0),
    stockByBranch: Array.isArray(st?.stockByBranch) ? st.stockByBranch : [],
    lowStockItems: Array.isArray(st?.lowStockItems) ? st.lowStockItems : [],
    lowThreshold: Number(st?.lowThreshold || 3),
  };
}

function resetUi() {
  ui.value.sales = {
    today: { count: 0, total: 0, avgTicket: 0 },
    week: { count: 0, total: 0, avgTicket: 0 },
    month: { count: 0, total: 0, avgTicket: 0 },
    trend: { week_total_pct: 0, week_count_pct: 0, month_total_pct: 0, month_count_pct: 0 },
    paymentsToday: [],
    salesByDay: [],
    salesByDay30: [],
    salesByPeriodDaily: [],
    salesByBranch: [],
    lastSales: [],
    topBranch30d: null,
    topBranchPeriod: null,
    topCashiers30d: [],
    topCashiersPeriod: [],
    topProducts30d: [],
    topProductsPeriod: [],
    bestMonth12m: null,
    bestMonthPeriod: null,
    periodFrom: null,
    periodTo: null,
  };
  ui.value.inventory = { totalProducts: 0, activeProducts: 0, noPriceProducts: 0, categories: 0, lastProducts: [] };
  ui.value.stock = { outOfStockCount: 0, lowStockCount: 0, trackedProducts: 0, stockByBranch: [], lowStockItems: [], lowThreshold: 3 };
}

// ---------------------
// Fetchers
// ---------------------
async function fetchBranchesIfAdmin() {
  if (!isAdmin.value) return;
  try {
    const resp = await listBranches();
    const data = resp?.data;
    const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    branches.value = rows.map((r) => ({ id: r.id, name: r.name })).filter((x) => x.id);
  } catch {
    branches.value = [];
  }
}

async function fetchOverview() {
  error.value = "";
  loading.value = true;
  try {
    const params = {};

    // ✅ branch scope
    if (effectiveBranchId.value) params.branch_id = effectiveBranchId.value;

    // ✅ period (backend nuevo; viejo lo ignora sin romper)
    params.period = period.value;

    const resp = await dashboardOverview(params);
    raw.value = resp.data;

    if (resp.data?.ok === false) throw new Error(resp.data?.message || "Error dashboard");
    adaptOverviewToUi(resp.data);
  } catch (e) {
    console.error("❌ dashboard overview error", e);
    raw.value = null;
    resetUi();
    error.value = e?.response?.data?.message || e?.message || "No se pudo cargar el dashboard";
  } finally {
    loading.value = false;
  }
}

function refresh() {
  fetchOverview();
}

// ✅ handler del select de período en SalesTab
function onPeriodChange(v) {
  if (!v || v === period.value) return;
  period.value = v;
  fetchOverview();
}

onMounted(async () => {
  if (!isAdmin.value && userBranchId.value) branchSelected.value = userBranchId.value;
  await fetchBranchesIfAdmin();
  await fetchOverview();
});

// ✅ cambio de sucursal => refetch
watch(effectiveBranchId, () => {
  if (isAdmin.value) fetchOverview();
});
</script>

<style scoped>
.dash-surface {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
}
.dash-pre {
  margin: 0;
  padding: 12px;
  border-radius: 12px;
  overflow: auto;
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgb(var(--v-theme-on-surface));
  font-size: 12px;
}
</style>