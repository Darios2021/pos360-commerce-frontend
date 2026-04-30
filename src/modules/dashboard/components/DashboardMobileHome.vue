<template>
  <div class="dmh">
    <!-- Header compacto -->
    <header class="dmh-head">
      <div class="dmh-head__left">
        <div class="dmh-head__greeting">{{ greeting }},</div>
        <div class="dmh-head__user">{{ userName }}</div>
      </div>
      <button class="dmh-head__refresh" :class="{ 'is-loading': loading }" @click="$emit('refresh')" aria-label="Actualizar">
        <v-icon size="18">mdi-refresh</v-icon>
      </button>
    </header>

    <!-- Scope chip / selector de sucursal -->
    <button
      v-if="isSuperAdmin && branches.length > 0"
      class="dmh-scope"
      type="button"
      @click="scopeMenuOpen = !scopeMenuOpen"
    >
      <v-icon size="14" class="dmh-scope__icon">mdi-shield-crown-outline</v-icon>
      <div class="dmh-scope__body">
        <span class="dmh-scope__role">Super admin</span>
        <span class="dmh-scope__branch">{{ scopeLabel }}</span>
      </div>
      <v-icon size="14" class="dmh-scope__chevron">mdi-chevron-down</v-icon>
    </button>
    <div v-else class="dmh-scope dmh-scope--readonly">
      <v-icon size="14" class="dmh-scope__icon">{{ scopeIcon }}</v-icon>
      <div class="dmh-scope__body">
        <span class="dmh-scope__role">{{ roleBadge }}</span>
        <span class="dmh-scope__branch">{{ scopeLabel }}</span>
      </div>
    </div>

    <!-- Drawer de sucursales -->
    <Transition name="dmh-drawer">
      <div v-if="scopeMenuOpen" class="dmh-drawer-overlay" @click.self="scopeMenuOpen = false">
        <div class="dmh-drawer">
          <div class="dmh-drawer__handle"></div>
          <div class="dmh-drawer__title">Elegí sucursal</div>
          <button
            class="dmh-drawer__item"
            :class="{ 'is-active': !selectedBranch }"
            @click="selectBranch(null)"
          >
            <v-icon size="18">mdi-home-group</v-icon>
            <span>Todas las sucursales</span>
            <v-icon v-if="!selectedBranch" size="16" color="primary">mdi-check</v-icon>
          </button>
          <button
            v-for="b in branches"
            :key="b.id"
            class="dmh-drawer__item"
            :class="{ 'is-active': selectedBranch === b.id }"
            @click="selectBranch(b.id)"
          >
            <v-icon size="18">mdi-store-outline</v-icon>
            <span>{{ b.name || `Sucursal #${b.id}` }}</span>
            <v-icon v-if="selectedBranch === b.id" size="16" color="primary">mdi-check</v-icon>
          </button>
        </div>
      </div>
    </Transition>

    <!-- KPIs principales (2x2 grid) -->
    <section class="dmh-kpis">
      <div class="dmh-kpi dmh-kpi--primary">
        <div class="dmh-kpi__lbl">Hoy</div>
        <div class="dmh-kpi__val">{{ money(sales.today.total) }}</div>
        <div class="dmh-kpi__sub">{{ sales.today.count }} venta{{ sales.today.count === 1 ? '' : 's' }}</div>
      </div>

      <div class="dmh-kpi">
        <div class="dmh-kpi__lbl">Esta semana</div>
        <div class="dmh-kpi__val">{{ money(sales.week.total) }}</div>
        <div class="dmh-kpi__sub">
          <v-icon v-if="sales.trend.week_total_pct > 0" size="11" color="success">mdi-trending-up</v-icon>
          <v-icon v-else-if="sales.trend.week_total_pct < 0" size="11" color="error">mdi-trending-down</v-icon>
          {{ sales.trend.week_total_pct > 0 ? '+' : '' }}{{ Math.round(sales.trend.week_total_pct || 0) }}% vs semana ant.
        </div>
      </div>

      <div class="dmh-kpi">
        <div class="dmh-kpi__lbl">Este mes</div>
        <div class="dmh-kpi__val">{{ money(sales.month.total) }}</div>
        <div class="dmh-kpi__sub">{{ sales.month.count }} ventas</div>
      </div>

      <div class="dmh-kpi">
        <div class="dmh-kpi__lbl">Ticket promedio</div>
        <div class="dmh-kpi__val">{{ money(sales.month.avgTicket) }}</div>
        <div class="dmh-kpi__sub">Mes en curso</div>
      </div>
    </section>

    <!-- Accesos rápidos -->
    <section class="dmh-section">
      <div class="dmh-section__title">Accesos rápidos</div>
      <router-link to="/pos" class="dmh-action dmh-action--accent">
        <v-icon size="22">mdi-cash-register</v-icon>
        <span>Vender</span>
        <v-icon size="18" class="dmh-action__arrow">mdi-arrow-right</v-icon>
      </router-link>
      <div class="dmh-actions dmh-actions--3">
        <router-link to="/pos/sales" class="dmh-action">
          <v-icon size="20">mdi-receipt-text-outline</v-icon>
          <span>Ventas</span>
        </router-link>
        <router-link to="/pos/transfers" class="dmh-action">
          <v-icon size="20">mdi-swap-horizontal</v-icon>
          <span>Transferir</span>
        </router-link>
        <router-link to="/pos/cash" class="dmh-action">
          <v-icon size="20">mdi-cash-multiple</v-icon>
          <span>Caja</span>
        </router-link>
      </div>
    </section>

    <!-- Alerta stock -->
    <section v-if="stock.outOfStockCount > 0 || stock.lowStockCount > 0" class="dmh-section">
      <div class="dmh-section__title">Stock</div>
      <router-link to="/pos/products?filter=out_of_stock" class="dmh-alert" :class="{ 'is-critical': stock.outOfStockCount > 0 }">
        <v-icon size="20" :color="stock.outOfStockCount > 0 ? 'error' : 'warning'">
          {{ stock.outOfStockCount > 0 ? 'mdi-alert-octagon-outline' : 'mdi-alert-outline' }}
        </v-icon>
        <div class="dmh-alert__body">
          <div class="dmh-alert__title">
            <template v-if="stock.outOfStockCount > 0">
              {{ stock.outOfStockCount }} producto{{ stock.outOfStockCount === 1 ? '' : 's' }} sin stock
            </template>
            <template v-else>
              {{ stock.lowStockCount }} producto{{ stock.lowStockCount === 1 ? '' : 's' }} con stock bajo
            </template>
          </div>
          <div class="dmh-alert__sub">Toca para ver inventario</div>
        </div>
        <v-icon size="18" class="dmh-alert__chevron">mdi-chevron-right</v-icon>
      </router-link>
    </section>

    <!-- Últimas ventas -->
    <section v-if="lastSales.length" class="dmh-section">
      <div class="dmh-section__head">
        <div class="dmh-section__title">Últimas ventas</div>
        <router-link to="/pos/sales" class="dmh-section__action">Ver todas</router-link>
      </div>
      <div class="dmh-list">
        <router-link
          v-for="s in lastSales.slice(0, 5)"
          :key="s.id"
          :to="`/pos/sales?id=${s.id}`"
          class="dmh-list-item"
        >
          <div class="dmh-list-item__icon">
            <v-icon size="16">mdi-cart-check</v-icon>
          </div>
          <div class="dmh-list-item__body">
            <div class="dmh-list-item__title">{{ money(s.total) }}</div>
            <div class="dmh-list-item__sub">{{ formatRelative(s.sold_at) }} · {{ s.customer_name || 'Consumidor Final' }}</div>
          </div>
          <v-icon size="16" class="dmh-list-item__chevron">mdi-chevron-right</v-icon>
        </router-link>
      </div>
    </section>

    <!-- Resumen inventario -->
    <section class="dmh-section">
      <div class="dmh-section__title">Inventario</div>
      <div class="dmh-mini-grid">
        <router-link to="/pos/products" class="dmh-mini">
          <v-icon size="18">mdi-package-variant-closed</v-icon>
          <div class="dmh-mini__val">{{ inv.totalProducts || 0 }}</div>
          <div class="dmh-mini__lbl">Productos</div>
        </router-link>
        <div class="dmh-mini">
          <v-icon size="18" color="success">mdi-check-circle-outline</v-icon>
          <div class="dmh-mini__val">{{ inv.activeProducts || 0 }}</div>
          <div class="dmh-mini__lbl">Activos</div>
        </div>
        <div class="dmh-mini">
          <v-icon size="18">mdi-tag-outline</v-icon>
          <div class="dmh-mini__val">{{ inv.categories || 0 }}</div>
          <div class="dmh-mini__lbl">Categorías</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  loading: Boolean,
  loadingAnalytics: Boolean,
  isSuperAdmin: Boolean,
  isAdmin: Boolean,
  scopeLabel: { type: String, default: "" },
  scopeIcon: { type: String, default: "mdi-store-outline" },
  roleBadge: { type: String, default: "" },
  userName: { type: String, default: "" },
  branches: { type: Array, default: () => [] },
  selectedBranch: { type: [Number, null], default: null },
  sales: { type: Object, required: true },
  stock: { type: Object, required: true },
  inv: { type: Object, required: true },
  lastSales: { type: Array, default: () => [] },
});

const emit = defineEmits(["refresh", "branch-change"]);

const scopeMenuOpen = ref(false);

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return "Buen día";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
});

function selectBranch(id) {
  emit("branch-change", id);
  scopeMenuOpen.value = false;
}

const fmtMoneyInt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
function money(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return "$ 0";
  return fmtMoneyInt.format(Math.round(n));
}

function formatRelative(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.round(h / 24);
  if (days < 7) return `hace ${days} d`;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}
</script>

<style scoped>
/*
 * Dashboard Mobile — Diseño monocromático celeste, colores SÓLIDOS.
 * Sin gradientes, sin glow ambiental, sin sombras tintadas.
 */
.dmh {
  --dmh-brand-rgb: var(--v-theme-primary);
  --dmh-card-bg: rgba(var(--v-theme-surface), 0.65);
  --dmh-card-border: rgba(var(--dmh-brand-rgb), 0.18);
  --dmh-card-border-hover: rgba(var(--dmh-brand-rgb), 0.32);

  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0 28px;
}

/* ── Header ─────────────────────────────────────────── */
.dmh-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 2px 0;
}
.dmh-head__greeting {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  line-height: 1.2;
  letter-spacing: 0.01em;
}
.dmh-head__user {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.015em;
  color: rgb(var(--dmh-brand-rgb));
}
.dmh-head__refresh {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: rgba(var(--dmh-brand-rgb), 0.12);
  border: 1px solid rgba(var(--dmh-brand-rgb), 0.22);
  color: rgb(var(--dmh-brand-rgb));
  cursor: pointer;
  transition: background 0.18s, transform 0.1s;
}
.dmh-head__refresh:active {
  transform: scale(0.94);
  background: rgba(var(--dmh-brand-rgb), 0.22);
}
.dmh-head__refresh.is-loading :deep(.mdi-refresh) { animation: dmh-spin 0.8s linear infinite; }
@keyframes dmh-spin { to { transform: rotate(360deg); } }

/* ── Scope chip ─────────────────────────────────────── */
.dmh-scope {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-radius: 14px;
  background: rgba(var(--dmh-brand-rgb), 0.10);
  border: 1px solid rgba(var(--dmh-brand-rgb), 0.24);
  color: rgb(var(--dmh-brand-rgb));
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-family: inherit;
  transition: background 0.18s, border-color 0.18s;
}
.dmh-scope:active { background: rgba(var(--dmh-brand-rgb), 0.18); }
.dmh-scope--readonly { cursor: default; }
.dmh-scope__icon {
  background: rgba(var(--dmh-brand-rgb), 0.16);
  border-radius: 8px;
  padding: 5px;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
}
.dmh-scope__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.dmh-scope__role {
  font-size: 9.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.75;
}
.dmh-scope__branch {
  font-size: 14px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}
.dmh-scope__chevron {
  opacity: 0.7;
  transition: transform 0.18s;
}
.dmh-scope:active .dmh-scope__chevron { transform: rotate(180deg); }

/* ── Drawer ─────────────────────────────────────────── */
.dmh-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.dmh-drawer {
  width: 100%;
  background: rgb(var(--v-theme-surface));
  border-radius: 22px 22px 0 0;
  padding: 8px 14px 26px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 70vh;
  overflow-y: auto;
  box-shadow: 0 -8px 30px rgba(var(--dmh-brand-rgb), 0.12);
  border-top: 1px solid rgba(var(--dmh-brand-rgb), 0.18);
}
.dmh-drawer__handle {
  width: 42px;
  height: 4px;
  border-radius: 999px;
  background: rgba(var(--dmh-brand-rgb), 0.3);
  margin: 6px auto 10px;
}
.dmh-drawer__title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
  padding: 4px 8px 10px;
}
.dmh-drawer__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 14px;
  border-radius: 12px;
  background: transparent;
  border: none;
  color: rgb(var(--v-theme-on-surface));
  font-size: 14.5px;
  cursor: pointer;
  transition: background 0.14s;
  font-family: inherit;
  text-align: left;
}
.dmh-drawer__item span { flex: 1; }
.dmh-drawer__item:active { background: rgba(var(--dmh-brand-rgb), 0.06); }
.dmh-drawer__item.is-active {
  background: rgba(var(--dmh-brand-rgb), 0.12);
  color: rgb(var(--dmh-brand-rgb));
  font-weight: 600;
}
.dmh-drawer-enter-active, .dmh-drawer-leave-active { transition: opacity 0.2s, transform 0.25s; }
.dmh-drawer-enter-from, .dmh-drawer-leave-to { opacity: 0; }
.dmh-drawer-enter-from .dmh-drawer, .dmh-drawer-leave-to .dmh-drawer { transform: translateY(100%); }

/* ── KPIs ───────────────────────────────────────────── */
.dmh-kpis {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 11px;
}
.dmh-kpi {
  background: var(--dmh-card-bg);
  border: 1px solid var(--dmh-card-border);
  border-radius: 16px;
  padding: 14px 15px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  transition: border-color 0.18s, transform 0.1s;
}
.dmh-kpi--primary {
  background: rgba(var(--dmh-brand-rgb), 0.14);
  border-color: rgba(var(--dmh-brand-rgb), 0.4);
}
.dmh-kpi__lbl {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(var(--v-theme-on-surface), 0.55);
}
.dmh-kpi--primary .dmh-kpi__lbl {
  color: rgb(var(--dmh-brand-rgb));
  opacity: 1;
}
.dmh-kpi__val {
  font-size: 21px;
  font-weight: 700;
  font-feature-settings: "tnum";
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.1;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}
.dmh-kpi--primary .dmh-kpi__val {
  color: rgb(var(--dmh-brand-rgb));
  font-size: 22px;
}
.dmh-kpi__sub {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 1px;
}

/* ── Sections ───────────────────────────────────────── */
.dmh-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dmh-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 4px;
}
.dmh-section__title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(var(--v-theme-on-surface), 0.55);
  padding: 0 4px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.dmh-section__title::before {
  content: "";
  width: 3px;
  height: 12px;
  border-radius: 2px;
  background: rgb(var(--dmh-brand-rgb));
}
.dmh-section__action {
  font-size: 12px;
  color: rgb(var(--dmh-brand-rgb));
  text-decoration: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px 9px;
  border-radius: 7px;
  background: rgba(var(--dmh-brand-rgb), 0.08);
  border: 1px solid rgba(var(--dmh-brand-rgb), 0.18);
  transition: background 0.14s;
}
.dmh-section__action:active { background: rgba(var(--dmh-brand-rgb), 0.16); }

/* ── Quick actions ──────────────────────────────────── */
.dmh-actions {
  display: grid;
  gap: 8px;
}
.dmh-actions--3 { grid-template-columns: repeat(3, 1fr); }

.dmh-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 8px;
  border-radius: 14px;
  background: var(--dmh-card-bg);
  border: 1px solid var(--dmh-card-border);
  color: rgb(var(--v-theme-on-surface));
  text-decoration: none;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
  transition: background 0.14s, transform 0.1s, border-color 0.18s;
  position: relative;
  overflow: hidden;
}
.dmh-action :deep(.v-icon) {
  color: rgb(var(--dmh-brand-rgb));
  opacity: 0.85;
}
.dmh-action:active {
  transform: scale(0.96);
  border-color: var(--dmh-card-border-hover);
}

/* CTA principal: Vender (grande, ancho completo, color sólido) */
.dmh-action--accent {
  flex-direction: row;
  justify-content: flex-start;
  gap: 14px;
  padding: 18px 20px;
  font-size: 16px;
  letter-spacing: -0.015em;
  background: rgb(var(--dmh-brand-rgb));
  border-color: rgb(var(--dmh-brand-rgb));
  color: #fff;
  margin-bottom: 4px;
}
.dmh-action--accent :deep(.v-icon) {
  color: #fff;
  opacity: 1;
}
.dmh-action--accent span { flex: 1; }
.dmh-action--accent .dmh-action__arrow {
  opacity: 0.9;
  transition: transform 0.2s;
}
.dmh-action--accent:active .dmh-action__arrow {
  transform: translateX(3px);
}
.dmh-action--accent:active {
  background: rgba(var(--dmh-brand-rgb), 0.85);
}

/* ── Alert ──────────────────────────────────────────── */
.dmh-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 15px;
  border-radius: 14px;
  background: rgba(var(--v-theme-warning), 0.10);
  border: 1px solid rgba(var(--v-theme-warning), 0.32);
  color: rgb(var(--v-theme-on-surface));
  text-decoration: none;
  transition: transform 0.1s;
}
.dmh-alert:active { transform: scale(0.98); }
.dmh-alert.is-critical {
  background: rgba(var(--v-theme-error), 0.10);
  border-color: rgba(var(--v-theme-error), 0.32);
}
.dmh-alert :deep(.v-icon:first-child) {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(var(--v-theme-warning), 0.18);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.dmh-alert.is-critical :deep(.v-icon:first-child) {
  background: rgba(var(--v-theme-error), 0.18);
}
.dmh-alert__body { flex: 1; min-width: 0; }
.dmh-alert__title {
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
}
.dmh-alert__sub {
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  margin-top: 2px;
}
.dmh-alert__chevron { opacity: 0.5; }

/* ── List ───────────────────────────────────────────── */
.dmh-list {
  background: var(--dmh-card-bg);
  border: 1px solid var(--dmh-card-border);
  border-radius: 16px;
  overflow: hidden;
}
.dmh-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 14px;
  text-decoration: none;
  color: rgb(var(--v-theme-on-surface));
  border-bottom: 1px solid rgba(var(--dmh-brand-rgb), 0.08);
  transition: background 0.14s;
}
.dmh-list-item:last-child { border-bottom: none; }
.dmh-list-item:active { background: rgba(var(--dmh-brand-rgb), 0.06); }
.dmh-list-item__icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(var(--dmh-brand-rgb), 0.16);
  border: 1px solid rgba(var(--dmh-brand-rgb), 0.22);
  color: rgb(var(--dmh-brand-rgb));
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.dmh-list-item__body { flex: 1; min-width: 0; }
.dmh-list-item__title {
  font-size: 14.5px;
  font-weight: 700;
  font-feature-settings: "tnum";
  letter-spacing: -0.01em;
  color: rgb(var(--v-theme-on-surface));
}
.dmh-list-item__sub {
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}
.dmh-list-item__chevron {
  opacity: 0.4;
  color: rgb(var(--dmh-brand-rgb));
}

/* ── Mini grid ──────────────────────────────────────── */
.dmh-mini-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.dmh-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 14px 6px;
  background: var(--dmh-card-bg);
  border: 1px solid var(--dmh-card-border);
  border-radius: 13px;
  color: rgba(var(--v-theme-on-surface), 0.78);
  text-decoration: none;
  position: relative;
}
.dmh-mini :deep(.v-icon) {
  color: rgb(var(--dmh-brand-rgb));
  opacity: 0.85;
}
.dmh-mini__val {
  font-size: 19px;
  font-weight: 700;
  font-feature-settings: "tnum";
  color: rgb(var(--v-theme-on-surface));
  letter-spacing: -0.015em;
  line-height: 1.1;
}
.dmh-mini__lbl {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.55);
}
</style>
