<template>
  <div class="dash">
    <v-alert v-if="error" type="error" variant="tonal" rounded="xl" class="mb-4" density="compact">
      {{ error }}
    </v-alert>

    <!-- Tab bar + branch selector -->
    <div class="dash-tabs-row">
      <div class="dash-tabs">
        <button
          v-for="item in tabItems"
          :key="item.value"
          class="dash-tab"
          :class="{ 'dash-tab--active': tab === item.value }"
          @click="setTab(item.value)"
        >
          <v-icon size="16" class="dash-tab__icon">{{ item.icon }}</v-icon>
          <span class="dash-tab__label">{{ item.label }}</span>
          <span v-if="item.badge" class="dash-tab__badge">{{ item.badge }}</span>
        </button>
      </div>

      <!-- Branch selector — siempre visible en la misma posición -->
      <v-menu v-if="branches.length > 0" location="bottom end" :close-on-content-click="true">
        <template #activator="{ props: menuProps }">
          <div class="dh-branch-wrap" v-bind="menuProps">
            <v-icon size="15" class="dh-branch-icon">mdi-store-outline</v-icon>
            <span class="dh-branch-label">{{ scopeLabel }}</span>
            <v-icon size="13" class="dh-branch-chevron">mdi-chevron-down</v-icon>
          </div>
        </template>
        <v-list density="compact" rounded="lg" min-width="210" class="pa-1">
          <v-list-item :active="!effectiveBranchId" active-color="primary" @click="onBranchChange(null)">
            <v-list-item-title class="font-weight-bold">Todas las sucursales</v-list-item-title>
          </v-list-item>
          <v-divider class="my-1" />
          <v-list-item
            v-for="b in branches"
            :key="b.id"
            :active="effectiveBranchId === b.id"
            active-color="primary"
            @click="onBranchChange(b.id)"
          >
            <v-list-item-title>{{ b.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <Transition name="tab-fade" mode="out-in">
      <DashboardSalesTab
        v-if="tab === 'sales'" key="sales"
        :loading="loading" :loading-analytics="loadingAnalytics"
        :is-admin="isAdmin" :scope-label="scopeLabel"
        :sales="ui.sales" :analytics="analytics.sales"
        :period="period" :branches="branches" :selected-branch="effectiveBranchId"
        @period-change="onPeriodChange" @branch-change="onBranchChange"
      />
      <DashboardStockTab
        v-else-if="tab === 'stock'" key="stock"
        :loading="loading" :loading-analytics="loadingAnalytics"
        :is-admin="isAdmin" :scope-label="scopeLabel"
        :stock="ui.stock" :analytics="analytics.stockMovements"
        :branches="branches" :selected-branch="effectiveBranchId"
        @branch-change="onBranchChange"
      />
      <DashboardInventoryTab
        v-else-if="tab === 'inventory'" key="inventory"
        :loading="loading" :loading-analytics="loadingAnalytics"
        :inv="ui.inventory" :analytics="analytics.products"
      />
      <DashboardCashTab
        v-else-if="tab === 'cash'" key="cash"
        :loading="loadingAnalytics" :analytics="analytics.cash"
        :period="period" @period-change="onPeriodChange"
      />
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
// (ref still used for loading/branches/ui state; onMounted/watch for data fetching)
import { useRoute, useRouter } from "vue-router";

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
import { dashOutOfStockCount } from "@/app/store/dashboardNav";
import { useAuthStore } from "@/app/store/auth.store";

// ─── Auth (via store — fuente de verdad) ──────────────────────────────────────
const auth = useAuthStore();
if (auth.status === "idle") auth.hydrate();

const isAdmin      = computed(() => auth.isAdmin);
const userBranchId = computed(() => auth.branchId);


// ─── Router ───────────────────────────────────────────────────────────────────
const route = useRoute();
const router = useRouter();

const VALID_TABS = ["sales", "stock", "inventory", "cash"];

// ─── UI state ────────────────────────────────────────────────────────────────
const tab = ref(VALID_TABS.includes(route.query.tab) ? route.query.tab : "sales");

function setTab(value) {
  if (tab.value === value) return;
  tab.value = value;
  router.replace({ query: { ...route.query, tab: value } });
}

watch(() => route.query.tab, (v) => {
  if (VALID_TABS.includes(v) && v !== tab.value) tab.value = v;
});
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
  { value: "inventory",  label: "Inventario",  icon: "mdi-package-variant",  badge: null },
  { value: "cash",       label: "Caja",        icon: "mdi-cash-multiple",    badge: null },
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
    inventoryValue: [], topStockedProducts: [], totalInventoryCostValue: 0, totalInventoryPriceValue: 0, totalInventoryListValue: 0,
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
    salesByBranch:       Array.isArray(s?.salesByBranch)       ? s.salesByBranch       : [],
    salesByBranchPeriod: Array.isArray(s?.salesByBranchPeriod) ? s.salesByBranchPeriod : [],
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
    totalInventoryListValue: Number(st?.totalInventoryListValue || 0),
  };

  dashOutOfStockCount.value = Number(st?.outCount || 0);
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

/* ─── Tab bar row ───────────────────────────────────────── */
.dash-tabs-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.dash-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  flex: 1;
}

.dash-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 20px;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.45);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
  letter-spacing: 0.01em;
}
.dash-tab:hover {
  color: rgba(var(--v-theme-on-surface), 0.80);
}
.dash-tab--active {
  color: rgb(var(--v-theme-primary));
  border-bottom-color: rgb(var(--v-theme-primary));
  font-weight: 700;
}
.dash-tab__icon {
  opacity: 0.60;
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
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* ─── Branch selector (shared) ─────────────────────────── */
.dh-branch-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 10px;
  border: 1px solid rgba(var(--v-theme-primary), 0.20);
  background: rgba(var(--v-theme-primary), 0.06);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  white-space: nowrap;
  margin-bottom: 1px;
}
.dh-branch-wrap:hover {
  border-color: rgba(var(--v-theme-primary), 0.40);
  background: rgba(var(--v-theme-primary), 0.10);
}
.dh-branch-icon    { color: rgb(var(--v-theme-primary)); opacity: 0.70; flex-shrink: 0; }
.dh-branch-chevron { color: rgb(var(--v-theme-primary)); opacity: 0.55; flex-shrink: 0; }
.dh-branch-label {
  font-size: 12px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── Transition ────────────────────────────────────────── */
.tab-fade-enter-active, .tab-fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.tab-fade-enter-from { opacity: 0; transform: translateY(4px); }
.tab-fade-leave-to { opacity: 0; transform: translateY(-2px); }

/* ─── Responsive ─────────────────────────────────────────── */
@media (max-width: 600px) {
  .dash-tabs {
    width: 100%;
    overflow-x: auto;
  }
  .dash-tab {
    flex: 1;
    justify-content: center;
    padding: 8px 10px;
    font-size: 12px;
  }
}
</style>
