<template>
  <div class="dash">
    <!-- ── Header ────────────────────────────────────────────── -->
    <div class="dash-header">
      <div class="dash-header__left">
        <div class="dash-header__title">Dashboard</div>
        <div class="dash-header__scope">
          <span class="scope-dot" />
          {{ scopeText }}
        </div>
      </div>

      <div class="dash-header__right">
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          prepend-icon="mdi-refresh"
          rounded="lg"
          :loading="loading || loadingAnalytics"
          @click="refresh"
        >
          Actualizar
        </v-btn>
      </div>
    </div>

    <!-- ── Error ─────────────────────────────────────────────── -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      rounded="xl"
      class="mb-4"
      density="compact"
    >
      {{ error }}
    </v-alert>

    <!-- ── Custom Tab Bar ────────────────────────────────────── -->
    <div class="dash-tabs">
      <button
        v-for="t in tabItems"
        :key="t.value"
        class="dash-tab"
        :class="{ 'dash-tab--active': tab === t.value }"
        @click="tab = t.value"
      >
        <v-icon :icon="t.icon" size="15" class="dash-tab__icon" />
        <span>{{ t.label }}</span>
        <span v-if="t.badge" class="dash-tab__badge">{{ t.badge }}</span>
      </button>
    </div>

    <!-- ── Tab Content ───────────────────────────────────────── -->
    <div class="dash-body">
      <Transition name="tab-fade" mode="out-in">
        <DashboardSalesTab
          v-if="tab === 'sales'"
          key="sales"
          :loading="loading"
          :loading-analytics="loadingAnalytics"
          :is-admin="isAdmin"
          :scope-label="scopeLabel"
          :sales="ui.sales"
          :analytics="analytics.sales"
          :period="period"
          :branches="branches"
          :selected-branch="effectiveBranchId"
          @period-change="onPeriodChange"
          @branch-change="onBranchChange"
        />

        <DashboardStockTab
          v-else-if="tab === 'stock'"
          key="stock"
          :loading="loading"
          :loading-analytics="loadingAnalytics"
          :is-admin="isAdmin"
          :scope-label="scopeLabel"
          :stock="ui.stock"
          :analytics="analytics.stockMovements"
        />

        <DashboardInventoryTab
          v-else-if="tab === 'inventory'"
          key="inventory"
          :loading="loading"
          :loading-analytics="loadingAnalytics"
          :inv="ui.inventory"
          :analytics="analytics.products"
        />

        <DashboardCashTab
          v-else-if="tab === 'cash'"
          key="cash"
          :loading="loadingAnalytics"
          :analytics="analytics.cash"
          :period="period"
          @period-change="onPeriodChange"
        />
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";

import DashboardSalesTab from "../components/DashboardSalesTab.vue";
import DashboardStockTab from "../components/DashboardStockTab.vue";
import DashboardInventoryTab from "../components/DashboardInventoryTab.vue";
import DashboardCashTab from "../components/DashboardCashTab.vue";

import {
  dashboardOverview,
  listBranches,
  analyticsCash,
  analyticsSales,
  analyticsProducts,
  analyticsStockMovements,
} from "../service/dashboard.api";

// ─── Auth helpers ─────────────────────────────────────────────────────────────
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
    .map((r) => (typeof r === "string" ? r : r?.name || r?.role || ""))
    .map((s) => String(s).toLowerCase())
    .some((x) => ["admin", "super_admin", "superadmin", "root", "owner"].includes(x));
}

const user = ref(getAuthUser());
const isAdmin = computed(() => isAdminUser(user.value));
const userBranchId = computed(() => Number(user.value?.branch_id || 0) || null);

// ─── UI state ────────────────────────────────────────────────────────────────
const tab = ref("sales");
const loading = ref(false);
const loadingAnalytics = ref(false);
const error = ref("");
const period = ref("30d");
const branches = ref([]);
const branchSelected = ref(null);

// analytics deep data
const analytics = ref({
  cash: null,
  sales: null,
  products: null,
  stockMovements: null,
});

// ─── Tab items ────────────────────────────────────────────────────────────────
const tabItems = computed(() => [
  { value: "sales", label: "Ventas", icon: "mdi-cash-register", badge: null },
  {
    value: "stock",
    label: "Stock",
    icon: "mdi-warehouse",
    badge: (ui.value.stock?.outOfStockCount || 0) > 0 ? String(ui.value.stock.outOfStockCount) : null,
  },
  { value: "inventory", label: "Inventario", icon: "mdi-package-variant", badge: null },
  { value: "cash", label: "Caja", icon: "mdi-cash-multiple", badge: null },
]);

// ─── UI model ─────────────────────────────────────────────────────────────────
const emptyUi = () => ({
  sales: {
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
    topBranchPeriod: null,
    topBranch30d: null,
    topCashiersPeriod: [],
    topCashiers30d: [],
    topProductsPeriod: [],
    topProducts30d: [],
    bestMonthPeriod: null,
    bestMonth12m: null,
    periodFrom: null,
    periodTo: null,
    salesByHour: [],
    salesByPaymentPeriod: [],
    salesByInvoiceType: [],
  },
  inventory: {
    totalProducts: 0, activeProducts: 0, noPriceProducts: 0, categories: 0,
    lastProducts: [], productsByCategory: [],
  },
  stock: {
    outOfStockCount: 0, lowStockCount: 0, okCount: 0, trackedProducts: 0, totalUnits: 0,
    stockByBranch: [], lowStockItems: [], lowThreshold: 3,
    inventoryValue: [], topStockedProducts: [], totalInventoryCostValue: 0, totalInventoryPriceValue: 0,
  },
});

const ui = ref(emptyUi());

// ─── Branch / scope ───────────────────────────────────────────────────────────
const effectiveBranchId = computed(() => {
  if (branchSelected.value) return Number(branchSelected.value);
  return userBranchId.value || null;
});

const branchOptions = computed(() => {
  const opts = [];
  if (isAdmin.value) opts.push({ title: "Todas las sucursales", value: null });
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

// ─── Adapter ──────────────────────────────────────────────────────────────────
function adaptOverviewToUi(payload) {
  const data = payload?.data || payload;
  const s = data?.sales || {};
  const inv = data?.inventory || {};
  const st = data?.stock || {};

  ui.value.sales = {
    today: s?.today && typeof s.today === "object" ? s.today : { count: 0, total: 0, avgTicket: 0 },
    week: s?.week && typeof s.week === "object" ? s.week : { count: 0, total: 0, avgTicket: 0 },
    month: s?.month && typeof s.month === "object" ? s.month : { count: 0, total: 0, avgTicket: 0 },
    trend: s?.trend || { week_total_pct: 0, week_count_pct: 0, month_total_pct: 0, month_count_pct: 0 },
    paymentsToday: Array.isArray(s?.paymentsToday) ? s.paymentsToday : [],
    salesByDay: Array.isArray(s?.salesByDay) ? s.salesByDay : [],
    salesByPeriodDaily: Array.isArray(s?.salesByPeriodDaily) ? s.salesByPeriodDaily : [],
    salesByDay30: Array.isArray(s?.salesByDay30) ? s.salesByDay30 : [],
    salesByBranch: Array.isArray(s?.salesByBranch) ? s.salesByBranch : [],
    lastSales: Array.isArray(s?.lastSales) ? s.lastSales : [],
    topBranchPeriod: s?.topBranchPeriod || null,
    topBranch30d: s?.topBranch30d || null,
    topCashiersPeriod: Array.isArray(s?.topCashiersPeriod) ? s.topCashiersPeriod : [],
    topCashiers30d: Array.isArray(s?.topCashiers30d) ? s.topCashiers30d : [],
    topProductsPeriod: Array.isArray(s?.topProductsPeriod) ? s.topProductsPeriod : [],
    topProducts30d: Array.isArray(s?.topProducts30d) ? s.topProducts30d : [],
    bestMonthPeriod: s?.bestMonthPeriod || null,
    bestMonth12m: s?.bestMonth12m || null,
    periodFrom: s?.periodFrom || null,
    periodTo: s?.periodTo || null,
    salesByHour: Array.isArray(s?.salesByHour) ? s.salesByHour : [],
    salesByPaymentPeriod: Array.isArray(s?.salesByPaymentPeriod) ? s.salesByPaymentPeriod : [],
    salesByInvoiceType: Array.isArray(s?.salesByInvoiceType) ? s.salesByInvoiceType : [],
  };

  ui.value.inventory = {
    totalProducts: Number(inv?.totalProducts || 0),
    activeProducts: Number(inv?.activeProducts || 0),
    noPriceProducts: Number(inv?.noPriceProducts || 0),
    categories: Number(inv?.categories || 0),
    lastProducts: Array.isArray(inv?.lastProducts) ? inv.lastProducts : [],
    productsByCategory: Array.isArray(inv?.productsByCategory) ? inv.productsByCategory : [],
  };

  ui.value.stock = {
    outOfStockCount: Number(st?.outCount || 0),
    lowStockCount: Number(st?.lowCount || 0),
    okCount: Number(st?.okCount || 0),
    trackedProducts: Number(st?.trackedProducts || st?.distinct_products || 0),
    totalUnits: Number(st?.totalUnits || 0),
    stockByBranch: Array.isArray(st?.stockByBranch) ? st.stockByBranch : [],
    lowStockItems: Array.isArray(st?.lowStockItems) ? st.lowStockItems : [],
    lowThreshold: Number(st?.lowThreshold || 3),
    inventoryValue: Array.isArray(st?.inventoryValue) ? st.inventoryValue : [],
    topStockedProducts: Array.isArray(st?.topStockedProducts) ? st.topStockedProducts : [],
    totalInventoryCostValue: Number(st?.totalInventoryCostValue || 0),
    totalInventoryPriceValue: Number(st?.totalInventoryPriceValue || 0),
  };
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────
async function fetchBranchesIfAdmin() {
  try {
    const resp = await listBranches();
    const data = resp?.data;
    const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    branches.value = rows.map((r) => ({ id: r.id, name: r.name })).filter((x) => x.id);
  } catch { branches.value = []; }
}

function buildParams() {
  const params = { period: period.value };
  if (effectiveBranchId.value) params.branch_id = effectiveBranchId.value;
  return params;
}

async function fetchOverview() {
  error.value = "";
  loading.value = true;
  try {
    const resp = await dashboardOverview(buildParams());
    if (resp.data?.ok === false) throw new Error(resp.data?.message || "Error dashboard");
    adaptOverviewToUi(resp.data);
  } catch (e) {
    console.error("❌ dashboard overview error", e);
    ui.value = emptyUi();
    error.value = e?.response?.data?.message || e?.message || "No se pudo cargar el dashboard";
  } finally {
    loading.value = false;
  }
}

async function fetchAnalytics() {
  loadingAnalytics.value = true;
  try {
    const params = buildParams();
    const [cashResp, salesResp, productsResp, stockResp] = await Promise.allSettled([
      analyticsCash(params),
      analyticsSales(params),
      analyticsProducts(params),
      analyticsStockMovements(params),
    ]);
    analytics.value.cash = cashResp.status === "fulfilled" ? (cashResp.value?.data?.data || null) : null;
    analytics.value.sales = salesResp.status === "fulfilled" ? (salesResp.value?.data?.data || null) : null;
    analytics.value.products = productsResp.status === "fulfilled" ? (productsResp.value?.data?.data || null) : null;
    analytics.value.stockMovements = stockResp.status === "fulfilled" ? (stockResp.value?.data?.data || null) : null;
  } catch (e) {
    console.error("❌ analytics error", e);
  } finally {
    loadingAnalytics.value = false;
  }
}

async function refreshAll() {
  await Promise.all([fetchOverview(), fetchAnalytics()]);
}

function refresh() { refreshAll(); }
function onPeriodChange(v) {
  if (!v || v === period.value) return;
  period.value = v;
  refreshAll();
}
function onBranchChange(bid) {
  branchSelected.value = bid;
  refreshAll();
}

onMounted(async () => {
  if (!isAdmin.value && userBranchId.value) branchSelected.value = userBranchId.value;
  await fetchBranchesIfAdmin();
  await Promise.all([fetchOverview(), fetchAnalytics()]);
});

watch(effectiveBranchId, () => refreshAll());
</script>

<style scoped>
/* ─── Page ─────────────────────────────────────────────── */
.dash {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100%;
  padding-bottom: 32px;
}

/* ─── Header ───────────────────────────────────────────── */
.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.dash-header__title {
  font-size: 1.75rem;
  font-weight: 950;
  letter-spacing: -0.04em;
  line-height: 1;
  color: rgb(var(--v-theme-on-surface));
}

.dash-header__scope {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.50);
  margin-top: 5px;
}

.scope-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgb(var(--v-theme-success));
  box-shadow: 0 0 6px rgba(var(--v-theme-success), 0.7);
  flex-shrink: 0;
}

.dash-header__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ─── Custom Tab Bar ───────────────────────────────────── */
.dash-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 14px;
  width: fit-content;
}

.dash-tab {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 18px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: all 0.18s ease;
  position: relative;
  white-space: nowrap;
}

.dash-tab:hover {
  color: rgb(var(--v-theme-on-surface));
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.dash-tab--active {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.10), 0 0 0 1px rgba(var(--v-theme-on-surface), 0.07);
}

.dash-tab__icon {
  opacity: 0.7;
}

.dash-tab--active .dash-tab__icon {
  opacity: 1;
  color: rgb(var(--v-theme-primary));
}

.dash-tab__badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: rgb(var(--v-theme-error));
  color: #fff;
  font-size: 10px;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* ─── Tab Body ─────────────────────────────────────────── */
.dash-body {
  min-height: 0;
}

/* ─── Tab Transition ───────────────────────────────────── */
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 640px) {
  .dash-header { flex-direction: column; align-items: stretch; }
  .dash-header__right { flex-wrap: wrap; }
  .dash-branch-select { min-width: 100%; }
  .dash-tabs { width: 100%; }
  .dash-tab { flex: 1; justify-content: center; padding: 7px 10px; font-size: 12px; }
}
</style>
