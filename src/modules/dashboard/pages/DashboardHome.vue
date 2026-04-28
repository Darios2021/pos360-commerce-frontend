<template>
  <div class="dash">
    <v-alert v-if="error" type="error" variant="tonal" rounded="xl" class="mb-4" density="compact">
      {{ error }}
    </v-alert>

    <!-- Analytics error banner con retry -->
    <v-alert
      v-if="analyticsError && !loadingAnalytics"
      type="warning"
      variant="tonal"
      rounded="xl"
      class="mb-4"
      density="compact"
      closable
      @click:close="analyticsError = ''"
    >
      <div class="d-flex align-center justify-space-between gap-3">
        <span>{{ analyticsError }}</span>
        <v-btn size="x-small" variant="tonal" color="warning" prepend-icon="mdi-refresh" @click="retryAnalytics">
          Reintentar
        </v-btn>
      </div>
    </v-alert>

    <!-- ── HEADER ─────────────────────────────────────────── -->
    <AppPageHeader
      icon="mdi-view-dashboard-outline"
      title="Dashboard"
      subtitle="Resumen operativo y métricas en tiempo real"
    >
      <v-btn
        variant="tonal"
        size="small"
        rounded="lg"
        prepend-icon="mdi-refresh"
        :loading="loading || loadingAnalytics"
        @click="refresh"
      >
        Actualizar
      </v-btn>
    </AppPageHeader>

    <!-- ── Tab bar + scope chip ────────────────────────────── -->
    <div class="dash-tabs-row">
      <!-- Segmented control de tabs (estilo moderno tipo iOS) -->
      <div class="dash-tabs" role="tablist" :style="tabIndicatorStyle">
        <button
          v-for="(item, idx) in tabItems"
          :key="item.value"
          ref="tabRefs"
          class="dash-tab"
          :class="{ 'dash-tab--active': tab === item.value }"
          :data-idx="idx"
          role="tab"
          :aria-selected="tab === item.value"
          @click="setTab(item.value)"
        >
          <v-icon size="16" class="dash-tab__icon">{{ item.icon }}</v-icon>
          <span class="dash-tab__label">{{ item.label }}</span>
          <span v-if="item.badge" class="dash-tab__badge">{{ item.badge }}</span>
        </button>
      </div>

      <!-- SUPER_ADMIN: selector funcional para cambiar de sucursal -->
      <v-menu
        v-if="isSuperAdmin && branches.length > 0"
        location="bottom end"
        :close-on-content-click="true"
      >
        <template #activator="{ props: menuProps }">
          <button class="dh-scope dh-scope--clickable" v-bind="menuProps" type="button">
            <v-icon size="15" class="dh-scope__icon">mdi-shield-crown-outline</v-icon>
            <div class="dh-scope__body">
              <span class="dh-scope__role">Super admin</span>
              <span class="dh-scope__branch">{{ scopeLabel }}</span>
            </div>
            <v-icon size="14" class="dh-scope__chevron">mdi-chevron-down</v-icon>
          </button>
        </template>
        <v-list density="compact" rounded="lg" min-width="220" class="pa-1">
          <v-list-item :active="!effectiveBranchId" color="primary" @click="onBranchChange(null)">
            <v-list-item-title class="font-weight-bold">Todas las sucursales</v-list-item-title>
          </v-list-item>
          <v-divider class="my-1" />
          <v-list-item
            v-for="b in branches"
            :key="b.id"
            :active="effectiveBranchId === b.id"
            color="primary"
            @click="onBranchChange(b.id)"
          >
            <v-list-item-title>{{ b.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- BRANCH ADMIN / CAJERO: chip read-only mostrando su ámbito real -->
      <div
        v-else
        class="dh-scope dh-scope--readonly"
        :class="{ 'dh-scope--cashier': isCajero }"
      >
        <v-icon size="15" class="dh-scope__icon">{{ scopeIcon }}</v-icon>
        <div class="dh-scope__body">
          <span class="dh-scope__role">{{ roleBadge }}</span>
          <span class="dh-scope__branch">{{ scopeLabel }}</span>
        </div>
        <v-tooltip activator="parent" location="bottom">{{ scopeTooltip }}</v-tooltip>
      </div>
    </div>

    <!-- ── Mini banner explicando el ámbito (solo no-super_admin) ─────────── -->
    <div v-if="!isSuperAdmin" class="dash-scope-hint">
      <v-icon size="14" color="primary">mdi-information-outline</v-icon>
      <span>{{ scopeHint }}</span>
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
import AppPageHeader from "@/app/components/AppPageHeader.vue";

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

const isAdmin       = computed(() => auth.isAdmin);
const isSuperAdmin  = computed(() => auth.isSuperAdmin === true);
const isBranchAdmin = computed(() => auth.isBranchAdmin === true && !auth.isSuperAdmin);
const isCajero      = computed(() => auth.isCajero === true);
const userBranchId  = computed(() => auth.branchId);


// ─── Router ───────────────────────────────────────────────────────────────────
const route = useRoute();
const router = useRouter();

const VALID_TABS = ["sales", "stock", "inventory", "cash"];

// ─── UI state ────────────────────────────────────────────────────────────────
const tab = ref(VALID_TABS.includes(route.query.tab) ? route.query.tab : "sales");
const tabRefs = ref([]);

function setTab(value) {
  if (tab.value === value) return;
  tab.value = value;
  router.replace({ query: { ...route.query, tab: value } });
}

watch(() => route.query.tab, (v) => {
  if (VALID_TABS.includes(v) && v !== tab.value) tab.value = v;
});

// Indicador deslizante (la "pill" se mueve al tab activo). Calculamos posición
// y ancho a partir del DOM del tab activo y lo exponemos como CSS vars.
const tabIndicatorStyle = ref({ "--tab-x": "0px", "--tab-w": "0px" });
function updateTabIndicator() {
  const idx = tabItems.value.findIndex((t) => t.value === tab.value);
  const el = tabRefs.value?.[idx];
  if (!el) return;
  tabIndicatorStyle.value = {
    "--tab-x": `${el.offsetLeft}px`,
    "--tab-w": `${el.offsetWidth}px`,
  };
}
watch(tab, () => { setTimeout(updateTabIndicator, 0); });
onMounted(() => { setTimeout(updateTabIndicator, 0); });
window?.addEventListener?.("resize", () => updateTabIndicator());
const loading = ref(false);
const loadingAnalytics = ref(false);
const error = ref("");
const analyticsError = ref("");
// Default: "Último año" (12 meses) — visión amplia al entrar al dashboard.
const period = ref("12m");
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
  // Admin: su selección manda. null explícito = "todas las sucursales"
  if (isAdmin.value) return branchSelected.value != null ? Number(branchSelected.value) : null;
  // No-admin: siempre su sucursal asignada, sin opción de cambiar
  return userBranchId.value ? Number(userBranchId.value) : null;
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

// Resuelve el nombre real de una sucursal desde TODAS las fuentes posibles:
//   1) branches.value (lista completa /branches)
//   2) auth.branches (cache del usuario logueado)
//   3) último recurso: "Sucursal #N"
// Excluye los placeholders ("Sucursal #N") al elegir entre fuentes para
// evitar que un cache viejo gane sobre datos frescos con nombre real.
function resolveBranchName(bid) {
  if (!bid) return "";
  const id = Number(bid);
  const placeholder = `Sucursal #${id}`;

  const fromList = branches.value.find((x) => Number(x.id) === id);
  if (fromList?.name && fromList.name !== placeholder) return fromList.name;

  const fromAuth = (auth.branches || []).find((x) => Number(x.id) === id);
  if (fromAuth?.name && fromAuth.name !== placeholder) return fromAuth.name;

  // Si el único nombre disponible es el placeholder, devolvemos el ID con
  // formato distinto para que el usuario vea "Sucursal" sin parecer bug,
  // pero sin mentir con un nombre falso.
  return placeholder;
}

const scopeLabel = computed(() => {
  const bid = effectiveBranchId.value;
  if (!bid) return "Todas las sucursales";
  return resolveBranchName(bid);
});
const scopeText = computed(() => scopeLabel.value);

// Etiqueta corta de rol para el chip de scope.
const roleBadge = computed(() => {
  if (isSuperAdmin.value)  return "Super admin";
  if (isBranchAdmin.value) return "Admin sucursal";
  if (isCajero.value)      return "Cajero";
  return "Usuario";
});

// Ícono semántico para el chip.
const scopeIcon = computed(() => {
  if (isSuperAdmin.value)  return "mdi-shield-crown-outline";
  if (isBranchAdmin.value) return "mdi-shield-account-outline";
  if (isCajero.value)      return "mdi-cash-register";
  return "mdi-account-outline";
});

// Tooltip detallado al pasar el mouse sobre el chip.
const scopeTooltip = computed(() => {
  if (isSuperAdmin.value)
    return "Super admin: ves datos de todas las sucursales del sistema.";
  if (isBranchAdmin.value)
    return `Admin de ${scopeLabel.value}: solo ves y administrás esta sucursal.`;
  if (isCajero.value)
    return `Cajero en ${scopeLabel.value}: solo ves tus propias ventas y caja.`;
  return "Estás viendo solo los datos disponibles para tu rol.";
});

// Hint compacto que se muestra debajo de los tabs (no super_admin).
const scopeHint = computed(() => {
  if (isBranchAdmin.value)
    return `Estás viendo los datos de ${scopeLabel.value}. Solo super admin puede ver otras sucursales.`;
  if (isCajero.value)
    return `Estás viendo tus ventas y tu caja en ${scopeLabel.value}. Para ver datos de otros operadores necesitás permisos de admin.`;
  return `Estás viendo los datos disponibles según tus permisos.`;
});

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
// Siempre intentamos cargar la lista — la usamos para resolver NOMBRES reales
// (no IDs) en el chip de scope, incluso para cajero/branch admin que no tienen
// selector. El backend ya restringe lo que devuelve por rol; si no devuelve
// nada para ese rol, igual tenemos el fallback a `auth.branches`.
async function fetchBranches() {
  try {
    const resp = await listBranches();
    const data = resp?.data;
    const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    branches.value = rows.map((r) => ({ id: r.id, name: r.name })).filter((x) => x.id);
  } catch { branches.value = []; }
}
const fetchBranchesIfAdmin = fetchBranches; // alias por compat

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
  analyticsError.value = "";
  try {
    const params = buildParams();
    const [cashResp, salesResp, productsResp, stockResp] = await Promise.allSettled([
      analyticsCash(params),
      analyticsSales(params),
      analyticsProducts(params),
      analyticsStockMovements(params),
    ]);

    analytics.value.cash          = cashResp.status     === "fulfilled" ? (cashResp.value?.data?.data     || null) : null;
    analytics.value.sales          = salesResp.status    === "fulfilled" ? (salesResp.value?.data?.data    || null) : null;
    analytics.value.products       = productsResp.status === "fulfilled" ? (productsResp.value?.data?.data || null) : null;
    analytics.value.stockMovements = stockResp.status    === "fulfilled" ? (stockResp.value?.data?.data    || null) : null;

    // Si todos fallaron, mostrar aviso con retry
    const allFailed = [cashResp, salesResp, productsResp, stockResp].every(r => r.status === "rejected");
    const firstErr  = [cashResp, salesResp, productsResp, stockResp].find(r => r.status === "rejected");
    if (allFailed) {
      const msg = firstErr?.reason?.response?.data?.message || firstErr?.reason?.message || "Error de conexión";
      analyticsError.value = `No se pudieron cargar los datos analíticos: ${msg}`;
      console.error("❌ analytics: todos los endpoints fallaron", firstErr?.reason);
    } else {
      // Al menos uno funcionó — loguear los fallidos sin bloquear la UI
      [
        { name: "cash",          r: cashResp     },
        { name: "sales",         r: salesResp    },
        { name: "products",      r: productsResp },
        { name: "stockMovements",r: stockResp    },
      ].filter(x => x.r.status === "rejected")
       .forEach(x => console.warn(`⚠️ analytics/${x.name} falló:`, x.r.reason?.message));
    }
  } catch (e) {
    analyticsError.value = "Error inesperado cargando analytics.";
    console.error("❌ analytics error", e);
  } finally {
    loadingAnalytics.value = false;
  }
}

function retryAnalytics() {
  analyticsError.value = "";
  fetchAnalytics();
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
  await fetchBranches();
  await Promise.all([fetchOverview(), fetchAnalytics()]);
});
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
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Segmented control con indicador deslizante */
.dash-tabs {
  position: relative;
  display: inline-flex;
  gap: 2px;
  padding: 4px;
  border-radius: 14px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
/* Pill móvil que se desliza al tab activo */
.dash-tabs::before {
  content: "";
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: var(--tab-x, 0);
  width: var(--tab-w, 0);
  border-radius: 10px;
  background: rgb(var(--v-theme-surface));
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.05),
    0 0 0 1px rgba(var(--v-theme-primary), 0.18);
  transition: left 0.28s cubic-bezier(0.4, 0, 0.2, 1),
              width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}

.dash-tab {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  transition: color 0.15s;
  white-space: nowrap;
  letter-spacing: 0.01em;
  border-radius: 10px;
}
.dash-tab:hover {
  color: rgba(var(--v-theme-on-surface), 0.85);
}
.dash-tab--active {
  color: rgb(var(--v-theme-primary));
  font-weight: 400;
}
.dash-tab__icon { opacity: 0.65; }
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
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* ─── Chip de scope (rol + sucursal activa) ─────────────── */
.dh-scope {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 6px 12px 6px 10px;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.22);
  background: rgba(var(--v-theme-primary), 0.06);
  color: rgb(var(--v-theme-primary));
  white-space: nowrap;
  transition: border-color 0.15s, background 0.15s, transform 0.1s;
  font-family: inherit;
}
.dh-scope__icon { color: rgb(var(--v-theme-primary)); opacity: 0.85; flex-shrink: 0; }
.dh-scope__chevron { color: rgb(var(--v-theme-primary)); opacity: 0.5; flex-shrink: 0; }
.dh-scope__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.1;
  text-align: left;
}
.dh-scope__role {
  font-size: 9.5px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.72;
}
.dh-scope__branch {
  font-size: 12.5px;
  font-weight: 400;
  letter-spacing: 0.01em;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dh-scope--clickable {
  cursor: pointer;
  border: 0;
}
.dh-scope--clickable:hover {
  border-color: rgba(var(--v-theme-primary), 0.45);
  background: rgba(var(--v-theme-primary), 0.11);
}
.dh-scope--clickable:active { transform: translateY(1px); }
.dh-scope--readonly {
  cursor: default;
}
.dh-scope--cashier {
  border-color: rgba(var(--v-theme-warning), 0.35);
  background: rgba(var(--v-theme-warning), 0.08);
  color: rgb(var(--v-theme-warning));
}
.dh-scope--cashier .dh-scope__icon { color: rgb(var(--v-theme-warning)); }

/* Banner explicativo del scope (no super) */
.dash-scope-hint {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
  font-size: 12px;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.85);
  align-self: flex-start;
}

/* ─── Transition ────────────────────────────────────────── */
.tab-fade-enter-active, .tab-fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.tab-fade-enter-from { opacity: 0; transform: translateY(4px); }
.tab-fade-leave-to { opacity: 0; transform: translateY(-2px); }

/* ─── Responsive ─────────────────────────────────────────── */
@media (max-width: 720px) {
  .dash-tabs-row {
    flex-direction: column;
    align-items: stretch;
  }
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
  .dh-scope {
    margin-left: 0;
    align-self: flex-end;
  }
}

/* ─── Mobile app-like ─────────────────────────────────────── */
@media (max-width: 600px) {
  /* Liberar espacio: hint de scope + chip de scope read-only */
  .dash-scope-hint { display: none; }
  /* Header del dashboard más compacto: ocultar subtítulo (ya hay tabs claros) */
  .dash :deep(.app-page-header__subtitle) { display: none; }
}
</style>
