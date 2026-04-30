<!-- src/modules/reports/pages/ReportsSalesPage.vue -->
<!--
  Reporte de ventas para liquidación de franquicia.
  - Filtros: sucursal, año, mes, estado
  - Campo "% de ganancia" global aplica a todas las ventas del período
  - Override manual por venta (columna editable)
  - Summary con total vendido y total a liquidar
  - Agrupación por sucursal (útil cuando no se filtra sucursal)
-->

<template>
  <div class="rpt-sales">
    <!-- FILTROS -->
    <div class="rpt-filters">
      <div class="rpt-filters__head">
        <div class="rpt-filters__head-left">
          <v-icon size="16" class="rpt-filters__icon">mdi-filter-variant</v-icon>
          <span class="rpt-filters__title">Período y filtros</span>
        </div>
        <button v-if="anyFilterSet" class="rpt-filters__clear" @click="resetFilters">
          <v-icon size="13">mdi-close</v-icon>
          Limpiar
        </button>
      </div>

      <div class="rpt-period-toggle">
        <v-btn-toggle
          :model-value="periodMode"
          @update:model-value="setPeriodMode"
          color="primary"
          mandatory
          variant="outlined"
          density="compact"
          rounded="lg"
        >
          <v-btn value="month" prepend-icon="mdi-calendar-month-outline">Por mes</v-btn>
          <v-btn value="range" prepend-icon="mdi-calendar-range-outline">Rango personalizado</v-btn>
        </v-btn-toggle>
      </div>

      <div class="rpt-filters__grid rpt-filters__grid--main">
        <div class="rpt-filter-cell">
          <v-select
            v-model="f.branch_id"
            :items="branchItems"
            item-title="title"
            item-value="value"
            label="Sucursal"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            prepend-inner-icon="mdi-store-outline"
            @update:modelValue="reload"
          />
        </div>

        <template v-if="periodMode === 'month'">
          <div class="rpt-filter-cell">
            <v-select
              v-model="f.year"
              :items="yearItems"
              label="Año"
              variant="outlined"
              density="compact"
              hide-details
              prepend-inner-icon="mdi-calendar-blank-outline"
              @update:modelValue="reload"
            />
          </div>

          <div class="rpt-filter-cell">
            <v-select
              v-model="f.month"
              :items="monthItems"
              item-title="title"
              item-value="value"
              label="Mes"
              variant="outlined"
              density="compact"
              hide-details
              prepend-inner-icon="mdi-calendar-month-outline"
              @update:modelValue="reload"
            />
          </div>
        </template>

        <template v-else>
          <div class="rpt-filter-cell">
            <v-menu v-model="fromMenu" :close-on-content-click="false" location="bottom">
              <template #activator="{ props }">
                <v-text-field
                  :model-value="f.date_from"
                  label="Desde"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                  readonly
                  placeholder="Sin fecha"
                  prepend-inner-icon="mdi-calendar-start"
                  v-bind="props"
                  @click:clear="f.date_from = ''; reload()"
                />
              </template>
              <v-date-picker
                :model-value="f.date_from"
                hide-header
                show-adjacent-months
                @update:model-value="(v) => { f.date_from = normalizeDateValue(v); fromMenu = false; reload(); }"
              />
            </v-menu>
          </div>

          <div class="rpt-filter-cell">
            <v-menu v-model="toMenu" :close-on-content-click="false" location="bottom">
              <template #activator="{ props }">
                <v-text-field
                  :model-value="f.date_to"
                  label="Hasta"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                  readonly
                  placeholder="Sin fecha"
                  prepend-inner-icon="mdi-calendar-end"
                  v-bind="props"
                  @click:clear="f.date_to = ''; reload()"
                />
              </template>
              <v-date-picker
                :model-value="f.date_to"
                hide-header
                show-adjacent-months
                @update:model-value="(v) => { f.date_to = normalizeDateValue(v); toMenu = false; reload(); }"
              />
            </v-menu>
          </div>
        </template>

        <div class="rpt-filter-cell">
          <v-select
            v-model="f.user_id"
            :items="sellerItems"
            item-title="title"
            item-value="value"
            label="Cajero"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            prepend-inner-icon="mdi-account-outline"
            @update:modelValue="reload"
          />
        </div>
      </div>

      <div class="rpt-filters__actions">
        <div class="rpt-filter-cell rpt-filter-cell--pct">
          <v-text-field
            v-model.number="profitPct"
            label="% Ganancia global"
            variant="outlined"
            density="compact"
            hide-details
            type="number"
            min="0"
            max="100"
            step="0.5"
            suffix="%"
            prepend-inner-icon="mdi-percent-outline"
          />
        </div>

        <div class="rpt-filters__actions-buttons">
          <v-btn
            variant="tonal"
            color="primary"
            rounded="lg"
            size="small"
            prepend-icon="mdi-refresh"
            :loading="loading"
            @click="reload"
          >
            Actualizar
          </v-btn>
          <v-btn
            variant="flat"
            color="error"
            rounded="lg"
            size="small"
            prepend-icon="mdi-file-pdf-box"
            :disabled="!sales.length"
            :loading="exportingPdf"
            @click="exportPdf"
          >
            PDF
          </v-btn>
          <v-btn
            variant="flat"
            color="success"
            rounded="lg"
            size="small"
            prepend-icon="mdi-microsoft-excel"
            :disabled="!sales.length"
            :loading="exporting"
            @click="exportExcel"
          >
            Excel
          </v-btn>
        </div>
      </div>
    </div>

    <!-- META + Notas (collapsable) -->
    <div class="rpt-meta">
      <div class="rpt-meta__left">
        <v-icon size="14" class="rpt-meta__icon">mdi-account-circle-outline</v-icon>
        <span class="rpt-meta__user">{{ issuerName }}</span>
        <span v-if="issuerRoles.length" class="rpt-meta__role">{{ issuerRoles[0] }}</span>
        <span class="rpt-meta__sep">·</span>
        <v-icon size="13" class="rpt-meta__icon">mdi-clock-outline</v-icon>
        <span>Generado {{ issuedAtLabel }}</span>
      </div>
      <button
        type="button"
        class="rpt-meta__notes-toggle"
        :class="{ 'is-active': notesOpen || !!reportNotes }"
        @click="notesOpen = !notesOpen"
      >
        <v-icon size="14">mdi-note-text-outline</v-icon>
        {{ reportNotes ? 'Notas agregadas' : 'Agregar notas' }}
        <v-icon size="14">{{ notesOpen ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
      </button>
    </div>
    <div v-if="notesOpen" class="rpt-meta__notes-row">
      <v-text-field
        v-model="reportNotes"
        placeholder="Observaciones de esta liquidación (se incluyen en el PDF)…"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        prepend-inner-icon="mdi-note-text-outline"
      />
    </div>

    <!-- KPIs -->
    <div class="rpt-kpis">
      <div class="rpt-kpi">
        <div class="rpt-kpi__label">
          <v-icon size="14">mdi-cart-outline</v-icon>
          Ventas
        </div>
        <div class="rpt-kpi__value">{{ fmtInt(summary.sales_count) }}</div>
        <div class="rpt-kpi__sub">{{ fmtInt(summary.items_qty) }} unidades</div>
      </div>

      <div class="rpt-kpi rpt-kpi--primary">
        <div class="rpt-kpi__label">
          <v-icon size="14">mdi-cash-multiple</v-icon>
          Total vendido
        </div>
        <div class="rpt-kpi__value">{{ fmtMoney(summary.total_sum) }}</div>
        <div class="rpt-kpi__sub">
          Subtotal {{ fmtMoney(summary.subtotal_sum) }}
          <span v-if="summary.discount_sum > 0">
            · Desc. {{ fmtMoney(summary.discount_sum) }}
          </span>
        </div>
      </div>

      <div class="rpt-kpi rpt-kpi--success">
        <div class="rpt-kpi__label">
          <v-icon size="14">mdi-trending-up</v-icon>
          A liquidar ({{ profitPct || 0 }}%)
        </div>
        <div class="rpt-kpi__value">{{ fmtMoney(liquidationTotal) }}</div>
        <div class="rpt-kpi__sub">
          Sobre {{ profitBaseLabel.toLowerCase() }}
        </div>
      </div>

      <div class="rpt-kpi">
        <div class="rpt-kpi__label">
          <v-icon size="14">mdi-calendar-month-outline</v-icon>
          Período
        </div>
        <div class="rpt-kpi__value rpt-kpi__value--sm">
          {{ monthLabel }} {{ f.year }}
        </div>
        <div class="rpt-kpi__sub" v-if="f.branch_id">
          {{ selectedBranchName }}
        </div>
        <div class="rpt-kpi__sub" v-else>
          Todas las sucursales
        </div>
      </div>
    </div>

    <!-- RESUMEN POR SUCURSAL (si no hay branch_id) -->
    <div v-if="!f.branch_id && byBranch.length" class="rpt-card">
      <div class="rpt-card__head">
        <v-icon size="16">mdi-store-outline</v-icon>
        <span class="rpt-card__title">Resumen por sucursal</span>
      </div>
      <div class="rpt-branch-grid">
        <div
          v-for="b in byBranch"
          :key="b.branch_id"
          class="rpt-branch-card"
          @click="filterByBranch(b.branch_id)"
          :title="`Ver ventas de ${b.branch_name}`"
        >
          <div class="rpt-branch-card__head">
            <span class="rpt-branch-card__name">{{ b.branch_name }}</span>
            <v-chip size="x-small" variant="tonal" color="primary">
              {{ fmtInt(b.sales_count) }} ventas
            </v-chip>
          </div>
          <div class="rpt-branch-card__metric">
            <div>
              <div class="rpt-branch-card__metric-label">Total</div>
              <div class="rpt-branch-card__metric-value">{{ fmtMoney(b.total_sum) }}</div>
            </div>
            <div>
              <div class="rpt-branch-card__metric-label">Liquidar</div>
              <div class="rpt-branch-card__metric-value rpt-branch-card__metric-value--pos">
                {{ fmtMoney(b.total_sum * (Number(profitPct || 0) / 100)) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- DESGLOSES (método, cajero, día) -->
    <div v-if="sales.length" class="rpt-breakdowns">
      <!-- Por método de pago -->
      <div class="rpt-card">
        <div class="rpt-card__head">
          <v-icon size="16">mdi-credit-card-outline</v-icon>
          <span class="rpt-card__title">Por método de pago</span>
        </div>
        <div class="rpt-breakdown-list">
          <div v-for="m in byMethod" :key="m.method" class="rpt-breakdown-row">
            <div class="rpt-breakdown-row__left">
              <v-icon size="14" class="rpt-breakdown-row__icon">{{ methodIcon(m.method) }}</v-icon>
              <span class="rpt-breakdown-row__label">{{ methodLabel(m.method) }}</span>
            </div>
            <div class="rpt-breakdown-row__bar">
              <div class="rpt-breakdown-row__fill" :style="{ width: `${m.pct}%` }" />
            </div>
            <div class="rpt-breakdown-row__right">
              <strong>{{ fmtMoney(m.amount) }}</strong>
              <span>{{ m.pct.toFixed(1) }}%</span>
            </div>
          </div>
          <div v-if="!byMethod.length" class="rpt-breakdown-empty">Sin pagos registrados.</div>
        </div>
      </div>

      <!-- Por cajero -->
      <div class="rpt-card">
        <div class="rpt-card__head">
          <v-icon size="16">mdi-account-cash-outline</v-icon>
          <span class="rpt-card__title">Por cajero</span>
        </div>
        <div class="rpt-breakdown-list">
          <div v-for="u in byUser" :key="u.user_id" class="rpt-breakdown-row">
            <div class="rpt-breakdown-row__left">
              <v-icon size="14" class="rpt-breakdown-row__icon">mdi-account-circle-outline</v-icon>
              <span class="rpt-breakdown-row__label">{{ u.user_name }}</span>
              <span class="rpt-breakdown-row__badge">{{ u.sales_count }}</span>
            </div>
            <div class="rpt-breakdown-row__bar">
              <div class="rpt-breakdown-row__fill" :style="{ width: `${u.pct}%` }" />
            </div>
            <div class="rpt-breakdown-row__right">
              <strong>{{ fmtMoney(u.total_sum) }}</strong>
              <span>{{ u.pct.toFixed(1) }}%</span>
            </div>
          </div>
          <div v-if="!byUser.length" class="rpt-breakdown-empty">Sin ventas.</div>
        </div>
      </div>

      <!-- Por día -->
      <div class="rpt-card">
        <div class="rpt-card__head">
          <v-icon size="16">mdi-calendar-text-outline</v-icon>
          <span class="rpt-card__title">Por día</span>
        </div>
        <div class="rpt-day-list">
          <div
            v-for="d in byDay"
            :key="d.date"
            class="rpt-day-row"
            :title="`${d.sales_count} ventas`"
          >
            <div class="rpt-day-row__date">{{ fmtDayShort(d.date) }}</div>
            <div class="rpt-day-row__bar">
              <div
                class="rpt-day-row__fill"
                :style="{ height: `${pctOfMaxDay(d.total_sum)}%` }"
              />
            </div>
            <div class="rpt-day-row__value">{{ fmtMoney(d.total_sum) }}</div>
            <div class="rpt-day-row__count">{{ d.sales_count }} v.</div>
          </div>
          <div v-if="!byDay.length" class="rpt-breakdown-empty">Sin días con ventas.</div>
        </div>
      </div>
    </div>

    <!-- TABLA DE VENTAS -->
    <div class="rpt-card">
      <div class="rpt-card__head">
        <v-icon size="16">mdi-format-list-bulleted</v-icon>
        <span class="rpt-card__title">Detalle de ventas</span>
        <span class="rpt-card__hint">Ganancia aplicada sobre {{ profitBaseLabel.toLowerCase() }}</span>
        <v-spacer />
        <span class="rpt-card__count">{{ fmtInt(sales.length) }} resultado{{ sales.length === 1 ? '' : 's' }}</span>
      </div>

      <div v-if="loading" class="rpt-loading">
        <v-progress-circular indeterminate color="primary" size="28" />
        <span>Cargando ventas…</span>
      </div>

      <div v-else-if="!sales.length" class="rpt-empty">
        <v-icon size="40" color="medium-emphasis">mdi-database-off-outline</v-icon>
        <div class="rpt-empty__title">Sin ventas en este período</div>
        <div class="rpt-empty__sub">Probá con otro mes o sucursal.</div>
      </div>

      <div v-else class="rpt-table-wrap">
        <table class="rpt-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>N°</th>
              <th>Sucursal</th>
              <th>Cajero</th>
              <th>Cliente</th>
              <th class="num">Items</th>
              <th class="num">Subtotal</th>
              <th class="num">Desc.</th>
              <th class="num">Total</th>
              <th>Pago</th>
              <th class="num">% Gan.</th>
              <th class="num">A liquidar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sales" :key="s.id">
              <td>
                <div class="rpt-cell-date">
                  <strong>{{ fmtDate(s.sold_at) }}</strong>
                  <span>{{ fmtTime(s.sold_at) }}</span>
                </div>
              </td>
              <td class="mono">{{ s.sale_number || `#${s.id}` }}</td>
              <td>
                <span class="rpt-branch-pill">
                  <v-icon size="10">mdi-store-outline</v-icon>
                  {{ s.branch_name || `Suc. #${s.branch_id}` }}
                </span>
              </td>
              <td class="rpt-cell-user">{{ s.user_name || '—' }}</td>
              <td>
                <div class="rpt-cell-customer">
                  <strong>{{ s.customer_name || '—' }}</strong>
                  <span v-if="s.customer_doc">{{ s.customer_doc }}</span>
                </div>
              </td>
              <td class="num">{{ fmtInt(s.items_qty || 0) }}</td>
              <td class="num">{{ fmtMoney(s.subtotal) }}</td>
              <td class="num rpt-cell-discount">
                {{ Number(s.discount_total) > 0 ? '-' + fmtMoney(s.discount_total) : '—' }}
              </td>
              <td class="num rpt-cell-total">{{ fmtMoney(s.total) }}</td>
              <td>
                <div class="rpt-cell-payment">
                  <span class="rpt-method-chip" :title="paymentBreakdown(s)">
                    <v-icon size="10">{{ methodIcon(s.primary_method) }}</v-icon>
                    {{ methodLabel(s.primary_method) }}
                  </span>
                  <span v-if="Object.keys(s.payments_by_method || {}).length > 1" class="rpt-cell-payment__more">
                    +{{ Object.keys(s.payments_by_method).length - 1 }}
                  </span>
                </div>
              </td>
              <td class="num rpt-cell-pct">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  class="rpt-pct-input"
                  :value="pctForSale(s.id)"
                  @input="(e) => setOverridePct(s.id, e.target.value)"
                  @focus="(e) => e.target.select()"
                />
                <span class="rpt-pct-suffix">%</span>
                <button
                  v-if="hasOverride(s.id)"
                  class="rpt-pct-reset"
                  title="Volver al % global"
                  @click="clearOverride(s.id)"
                >
                  <v-icon size="12">mdi-restore</v-icon>
                </button>
              </td>
              <td class="num rpt-cell-profit">
                {{ fmtMoney(liquidationFor(s)) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="6" class="rpt-foot-label">Total período</td>
              <td class="num rpt-foot-val">{{ fmtMoney(summary.subtotal_sum) }}</td>
              <td class="num rpt-foot-val">{{ fmtMoney(summary.discount_sum) }}</td>
              <td class="num rpt-foot-val">{{ fmtMoney(summary.total_sum) }}</td>
              <td></td>
              <td></td>
              <td class="num rpt-foot-val rpt-foot-val--success">{{ fmtMoney(liquidationTotal) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <v-snackbar v-model="snack.show" :timeout="3200" location="bottom right" rounded="lg">
      {{ snack.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import http from "@/app/api/http";
import { useAuthStore } from "@/app/store/auth.store";

const auth = useAuthStore();

/* ─── Estado ──────────────────────────────────────────────────────── */
const loading = ref(false);
const sales = ref([]);
const summary = reactive({
  sales_count: 0,
  subtotal_sum: 0,
  discount_sum: 0,
  total_sum: 0,
  paid_sum: 0,
  items_count: 0,
  items_qty: 0,
  by_method: {},
});
const byBranch = ref([]);
const byDay = ref([]);
const branches = ref([]);

const now = new Date();
const f = reactive({
  branch_id: null,
  user_id: null,
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  date_from: "",
  date_to: "",
  status: "PAID",
});

const periodMode = ref("month"); // "month" | "range"
const notesOpen = ref(false);
const sellers = ref([]);
const fromMenu = ref(false);
const toMenu = ref(false);

const profitPct = ref(0); // % global aplicado a todas las ventas
const overridePct = reactive({}); // { [saleId]: number }
const reportNotes = ref("");
const profitBase = ref("total"); // "total" | "subtotal"

const issuedAt = ref(new Date());
const exporting = ref(false);
const exportingPdf = ref(false);

const snack = reactive({ show: false, text: "" });
function toast(text) {
  snack.show = true;
  snack.text = String(text || "");
}

/* ─── Items de selects ────────────────────────────────────────────── */
const monthItems = [
  { title: "Enero", value: 1 },
  { title: "Febrero", value: 2 },
  { title: "Marzo", value: 3 },
  { title: "Abril", value: 4 },
  { title: "Mayo", value: 5 },
  { title: "Junio", value: 6 },
  { title: "Julio", value: 7 },
  { title: "Agosto", value: 8 },
  { title: "Septiembre", value: 9 },
  { title: "Octubre", value: 10 },
  { title: "Noviembre", value: 11 },
  { title: "Diciembre", value: 12 },
];

const yearItems = computed(() => {
  const current = now.getFullYear();
  const years = [];
  for (let y = current; y >= current - 4; y--) years.push(y);
  return years;
});

const statusItems = [
  { title: "Pagadas", value: "PAID" },
  { title: "Todas", value: "ALL" },
];

const profitBaseItems = [
  { title: "Total (con descuento aplicado)", value: "total" },
  { title: "Subtotal (precio de lista)", value: "subtotal" },
];

const profitBaseLabel = computed(() =>
  profitBase.value === "subtotal"
    ? "Subtotal (precio de lista)"
    : "Total (con descuentos aplicados)"
);

const profitBaseHelp = computed(() =>
  profitBase.value === "subtotal"
    ? "El % se calcula sobre el precio de lista, antes de descuentos."
    : "El % se calcula sobre el monto final pagado por el cliente."
);

function baseAmountOf(sale) {
  if (profitBase.value === "subtotal") return Number(sale?.subtotal || 0);
  return Number(sale?.total || 0);
}

const branchItems = computed(() => {
  const out = [{ title: "Todas las sucursales", value: null }];
  (branches.value || [])
    .map((b) => ({ title: b?.name || `Sucursal #${b?.id}`, value: Number(b?.id) }))
    .filter((x) => x.value > 0)
    .sort((a, b) => a.value - b.value)
    .forEach((x) => out.push(x));
  return out;
});

const selectedBranchName = computed(() => {
  if (!f.branch_id) return "";
  const found = branchItems.value.find((x) => x.value === f.branch_id);
  return found?.title || `Sucursal #${f.branch_id}`;
});

const sellerItems = computed(() => {
  const out = [{ title: "Todos los cajeros", value: null }];
  (sellers.value || [])
    .map((u) => ({
      title: u?.title || u?.full_name || u?.username || u?.email || `Cajero #${u?.value || u?.id}`,
      value: Number(u?.value ?? u?.id) || 0,
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => a.title.localeCompare(b.title))
    .forEach((x) => out.push(x));
  return out;
});

const selectedSellerName = computed(() => {
  if (!f.user_id) return "";
  const found = sellerItems.value.find((x) => x.value === f.user_id);
  return found?.title || `Cajero #${f.user_id}`;
});

const monthLabel = computed(
  () => monthItems.find((m) => m.value === f.month)?.title || ""
);

const anyFilterSet = computed(
  () =>
    !!f.branch_id ||
    !!f.user_id ||
    !!f.date_from ||
    !!f.date_to ||
    f.status !== "PAID" ||
    f.year !== now.getFullYear() ||
    f.month !== now.getMonth() + 1
);

const usingDateRange = computed(() => !!f.date_from || !!f.date_to);

/* ─── Cálculo liquidación ──────────────────────────────────────── */
function pctForSale(saleId) {
  if (Object.prototype.hasOwnProperty.call(overridePct, saleId)) {
    return overridePct[saleId];
  }
  return Number(profitPct.value || 0);
}

function hasOverride(saleId) {
  return Object.prototype.hasOwnProperty.call(overridePct, saleId);
}

function setOverridePct(saleId, value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return;
  overridePct[saleId] = Math.max(0, Math.min(100, n));
}

function clearOverride(saleId) {
  delete overridePct[saleId];
}

function liquidationFor(sale) {
  const pct = Number(pctForSale(sale.id)) || 0;
  return baseAmountOf(sale) * (pct / 100);
}

const liquidationTotal = computed(() => {
  let total = 0;
  for (const s of sales.value) total += liquidationFor(s);
  return total;
});

const avgTicket = computed(() => {
  const n = Number(summary.sales_count || 0);
  return n > 0 ? Number(summary.total_sum || 0) / n : 0;
});

const overrideCount = computed(() => Object.keys(overridePct).length);

/* ─── Info del emisor ──────────────────────────────────────────── */
const issuerName = computed(() => {
  const u = auth.user || {};
  const full = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return full || u.username || u.email || "Usuario desconocido";
});
const issuerEmail = computed(() => auth.user?.email || "");
const issuerRoles = computed(() => {
  const arr = Array.isArray(auth.roles) ? auth.roles : [];
  return arr.filter(Boolean);
});
const issuedAtLabel = computed(() => fmtDateTime(issuedAt.value));

const periodFrom = computed(() => new Date(f.year, f.month - 1, 1));
const periodToInclusive = computed(
  () => new Date(f.year, f.month, 0) // último día del mes
);

const periodLabel = computed(() => {
  if (periodMode.value === "range") {
    const from = f.date_from ? fmtDate(f.date_from) : "…";
    const to = f.date_to ? fmtDate(f.date_to) : "…";
    return `${from} — ${to}`;
  }
  return `${monthLabel.value} ${f.year}`;
});

/* ─── Desgloses auxiliares ─────────────────────────────────────── */
const PAYMENT_METHOD_META = {
  CASH:        { label: "Efectivo",     icon: "mdi-cash" },
  TRANSFER:    { label: "Transferencia",icon: "mdi-bank-transfer" },
  CARD:        { label: "Tarjeta",      icon: "mdi-credit-card-outline" },
  QR:          { label: "QR",           icon: "mdi-qrcode" },
  MERCADOPAGO: { label: "Mercado Pago", icon: "mdi-wallet-outline" },
  CREDIT_SJT:  { label: "Crédito SJT",  icon: "mdi-account-credit-card-outline" },
  OTHER:       { label: "Otro",         icon: "mdi-dots-horizontal-circle-outline" },
};
function methodLabel(code) {
  if (!code) return "—";
  return PAYMENT_METHOD_META[code]?.label || code;
}
function methodIcon(code) {
  if (!code) return "mdi-help-circle-outline";
  return PAYMENT_METHOD_META[code]?.icon || "mdi-credit-card-outline";
}
function paymentBreakdown(sale) {
  const pm = sale?.payments_by_method || {};
  const entries = Object.entries(pm);
  if (!entries.length) return "Sin pagos";
  return entries
    .map(([m, amt]) => `${methodLabel(m)}: ${fmtMoney(amt)}`)
    .join(" · ");
}

const byMethod = computed(() => {
  const total = Number(summary.total_sum || 0);
  const out = Object.entries(summary.by_method || {}).map(([method, amount]) => ({
    method,
    amount: Number(amount) || 0,
    pct: total > 0 ? (Number(amount) / total) * 100 : 0,
  }));
  return out.sort((a, b) => b.amount - a.amount);
});

const byUser = computed(() => {
  const map = new Map();
  const total = Number(summary.total_sum || 0);
  for (const s of sales.value) {
    const key = Number(s.user_id) || 0;
    const acc = map.get(key) || {
      user_id: key,
      user_name: s.user_name || `Usuario #${key}`,
      sales_count: 0,
      total_sum: 0,
    };
    acc.sales_count += 1;
    acc.total_sum += Number(s.total) || 0;
    map.set(key, acc);
  }
  const arr = Array.from(map.values()).map((u) => ({
    ...u,
    pct: total > 0 ? (u.total_sum / total) * 100 : 0,
  }));
  arr.sort((a, b) => b.total_sum - a.total_sum);
  return arr;
});

const maxDayTotal = computed(() => {
  let mx = 0;
  for (const d of byDay.value) if (d.total_sum > mx) mx = d.total_sum;
  return mx;
});
function pctOfMaxDay(v) {
  const mx = maxDayTotal.value;
  if (mx <= 0) return 0;
  return Math.max(4, (Number(v) || 0) / mx * 100);
}

/* ─── Formatters ──────────────────────────────────────────────────── */
function formatLocalDate(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function normalizeDateValue(v) {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  return formatLocalDate(v);
}

const fmtMoneyInt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
function fmtMoney(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return "$ 0";
  return fmtMoneyInt.format(Math.round(n));
}
function fmtInt(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("es-AR").format(Math.floor(n));
}
function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(d);
  } catch {
    return "—";
  }
}
function fmtTime(iso) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "";
  }
}
function fmtDateTime(d) {
  try {
    const dt = d instanceof Date ? d : new Date(d);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dt);
  } catch {
    return "—";
  }
}
function fmtDayShort(dateStr) {
  try {
    const [y, m, d] = String(dateStr).split("-").map(Number);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "short",
    }).format(new Date(y, (m || 1) - 1, d || 1));
  } catch {
    return dateStr || "";
  }
}

/* ─── Fetch ────────────────────────────────────────────────────────── */
async function loadBranches() {
  try {
    const r = await http.get("/branches");
    const arr = Array.isArray(r?.data?.data) ? r.data.data : Array.isArray(r?.data) ? r.data : [];
    branches.value = arr;
  } catch (e) {
    console.warn("No se pudieron cargar sucursales", e);
    branches.value = [];
  }
}

async function loadSellers() {
  try {
    const r = await http.get("/pos/sales/options/sellers", { params: { limit: 100 } });
    const arr = Array.isArray(r?.data?.data) ? r.data.data : Array.isArray(r?.data) ? r.data : [];
    sellers.value = arr;
  } catch (e) {
    console.warn("No se pudieron cargar cajeros", e);
    sellers.value = [];
  }
}

async function reload() {
  loading.value = true;
  try {
    const params = {
      year: f.year,
      month: f.month,
      status: f.status,
    };
    if (f.branch_id) params.branch_id = f.branch_id;
    if (f.user_id) params.user_id = f.user_id;
    if (periodMode.value === "range") {
      if (f.date_from) params.date_from = f.date_from;
      if (f.date_to) params.date_to = f.date_to;
      // No mandar year/month si estamos en modo rango
      delete params.year;
      delete params.month;
    }

    const r = await http.get("/reports/sales", { params });
    const data = r?.data?.data || {};

    sales.value = Array.isArray(data.sales) ? data.sales : [];
    byBranch.value = Array.isArray(data.by_branch) ? data.by_branch : [];
    byDay.value = Array.isArray(data.by_day) ? data.by_day : [];

    const s = data.summary || {};
    Object.assign(summary, {
      sales_count: Number(s.sales_count || 0),
      subtotal_sum: Number(s.subtotal_sum || 0),
      discount_sum: Number(s.discount_sum || 0),
      total_sum: Number(s.total_sum || 0),
      paid_sum: Number(s.paid_sum || 0),
      items_count: Number(s.items_count || 0),
      items_qty: Number(s.items_qty || 0),
      by_method: s.by_method || {},
    });

    // Los overrides manuales no sobreviven un nuevo fetch de distinto período
    for (const k of Object.keys(overridePct)) delete overridePct[k];
  } catch (e) {
    console.error("[reports/sales] error:", e);
    const msg = e?.response?.data?.message || e?.message || "No se pudo cargar el reporte.";
    toast(msg);
    sales.value = [];
    byBranch.value = [];
    byDay.value = [];
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  f.branch_id = null;
  f.user_id = null;
  f.status = "PAID";
  f.year = now.getFullYear();
  f.month = now.getMonth() + 1;
  f.date_from = "";
  f.date_to = "";
  periodMode.value = "month";
  reload();
}

function setPeriodMode(mode) {
  if (!mode || mode === periodMode.value) return;
  periodMode.value = mode;
  if (mode === "month") {
    f.date_from = "";
    f.date_to = "";
  } else {
    f.year = now.getFullYear();
    f.month = now.getMonth() + 1;
  }
  reload();
}

function filterByBranch(branchId) {
  f.branch_id = Number(branchId) || null;
  reload();
}

/* ─── Data de filas preparada para export ────────────────────────── */
function buildSalesRows() {
  return sales.value.map((s) => {
    const pct = Number(pctForSale(s.id)) || 0;
    const total = Number(s.total) || 0;
    const subtotal = Number(s.subtotal) || 0;
    const base = baseAmountOf(s);
    const liq = base * (pct / 100);
    const pm = s.payments_by_method || {};
    const methodsStr = Object.entries(pm)
      .map(([m, amt]) => `${methodLabel(m)}: ${Number(amt).toFixed(2)}`)
      .join(" | ");
    return {
      id: s.id,
      sale_number: s.sale_number || "",
      sold_at_iso: new Date(s.sold_at).toISOString(),
      sold_at_date: fmtDate(s.sold_at),
      sold_at_time: fmtTime(s.sold_at),
      branch: s.branch_name || `Sucursal #${s.branch_id}`,
      branch_id: Number(s.branch_id) || 0,
      user: s.user_name || "",
      user_id: Number(s.user_id) || 0,
      customer: s.customer_name || "",
      customer_doc: s.customer_doc || "",
      items_qty: Number(s.items_qty) || 0,
      subtotal,
      discount: Number(s.discount_total) || 0,
      total,
      base_amount: base,
      base_label: profitBaseLabel.value,
      primary_method: methodLabel(s.primary_method),
      methods_detail: methodsStr,
      profit_pct: pct,
      profit_pct_source: hasOverride(s.id) ? "override" : "global",
      liquidation: liq,
    };
  });
}

function buildFilenameBase() {
  const branchTag = f.branch_id ? `_suc${f.branch_id}` : "_todas";
  const stamp = `${f.year}-${String(f.month).padStart(2, "0")}${branchTag}`;
  return `reporte_ventas_${stamp}`;
}

/* ─── Export PDF (con gráficos) ────────────────────────────────────── */
async function exportPdf() {
  if (!sales.value.length) return;
  exportingPdf.value = true;
  try {
    const jsPDFmod = await import("jspdf");
    const JsPDF = jsPDFmod.jsPDF || jsPDFmod.default || jsPDFmod;
    const autoTableMod = await import("jspdf-autotable");
    const autoTable = autoTableMod.default || autoTableMod.autoTable || autoTableMod;

    const doc = new JsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const M = 40; // margen
    let y = M;

    // Paleta
    const COLORS = {
      primary: [33, 97, 180],
      primarySoft: [225, 235, 250],
      success: [22, 163, 74],
      successSoft: [220, 245, 230],
      error: [220, 38, 38],
      warning: [245, 158, 11],
      text: [30, 30, 30],
      muted: [120, 120, 120],
      border: [220, 220, 220],
      headerBg: [245, 247, 250],
      rowAlt: [250, 251, 253],
    };

    // Helpers
    function setText(rgb, size = 10, weight = "normal") {
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      doc.setFontSize(size);
      doc.setFont("helvetica", weight);
    }
    function setDraw(rgb, w = 0.5) {
      doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
      doc.setLineWidth(w);
    }
    function setFill(rgb) {
      doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    }
    function money(v) {
      return fmtMoney(v);
    }
    function shortenText(txt, maxChars) {
      const s = String(txt || "");
      return s.length > maxChars ? s.slice(0, maxChars - 1) + "…" : s;
    }
    function ensureSpace(needed) {
      if (y + needed > pageH - M - 30) {
        drawFooter();
        doc.addPage();
        y = M;
        drawHeaderStrip();
      }
    }

    function drawHeaderStrip() {
      setFill(COLORS.primary);
      doc.rect(0, 0, pageW, 28, "F");
      setText([255, 255, 255], 10, "bold");
      doc.text("REPORTE DE VENTAS — LIQUIDACIÓN FRANQUICIA", M, 18);
      setText([255, 255, 255], 8, "normal");
      doc.text(
        `${monthLabel.value} ${f.year}  ·  ${selectedBranchName.value || "Todas las sucursales"}`,
        pageW - M,
        18,
        { align: "right" }
      );
    }

    function drawFooter() {
      const pageNum = doc.internal.getNumberOfPages();
      const total = doc.internal.getNumberOfPages();
      setDraw(COLORS.border, 0.5);
      doc.line(M, pageH - M - 20, pageW - M, pageH - M - 20);
      setText(COLORS.muted, 8);
      doc.text(
        `Generado ${issuedAtLabel.value}  ·  ${issuerName.value}`,
        M,
        pageH - M - 8
      );
      doc.text(`Página ${pageNum} / ${total}`, pageW - M, pageH - M - 8, {
        align: "right",
      });
    }

    /* ─── PORTADA / HEADER ─── */
    drawHeaderStrip();
    y = 52;

    setText(COLORS.text, 18, "bold");
    doc.text("Reporte de ventas", M, y);
    y += 18;
    setText(COLORS.muted, 9);
    doc.text("Liquidación para franquicias", M, y);
    y += 20;

    /* Info del reporte — grid 2 columnas */
    const leftCol = M;
    const rightCol = M + (pageW - M * 2) / 2 + 8;
    const labelStyle = () => setText(COLORS.muted, 8, "bold");
    const valueStyle = () => setText(COLORS.text, 10, "normal");

    function infoRow(x, label, value, ySlot) {
      labelStyle();
      doc.text(String(label).toUpperCase(), x, ySlot);
      valueStyle();
      doc.text(shortenText(value || "—", 54), x, ySlot + 11);
    }

    setFill(COLORS.primarySoft);
    setDraw(COLORS.primary, 0.3);
    doc.roundedRect(M, y, pageW - M * 2, 144, 6, 6, "FD");
    let yi = y + 14;

    infoRow(leftCol + 10, "Emitido por", issuerName.value, yi);
    infoRow(rightCol, "Email", issuerEmail.value || "—", yi);
    yi += 26;
    infoRow(leftCol + 10, "Rol(es)", issuerRoles.value.join(", ") || "—", yi);
    infoRow(rightCol, "Generado", issuedAtLabel.value, yi);
    yi += 26;
    infoRow(
      leftCol + 10,
      "Período",
      `${monthLabel.value} ${f.year} (${fmtDate(periodFrom.value)} — ${fmtDate(periodToInclusive.value)})`,
      yi
    );
    infoRow(
      rightCol,
      "Alcance",
      `${selectedBranchName.value || "Todas las sucursales"} · ${f.status === "ALL" ? "Todas las ventas" : "Solo pagadas"}`,
      yi
    );
    yi += 26;
    infoRow(
      leftCol + 10,
      "% Ganancia global",
      `${profitPct.value || 0}%${overrideCount.value ? `  ·  ${overrideCount.value} override${overrideCount.value === 1 ? "" : "s"}` : ""}`,
      yi
    );
    infoRow(rightCol, "Base de cálculo", profitBaseLabel.value, yi);
    yi += 26;
    infoRow(leftCol + 10, "Notas", reportNotes.value || "—", yi);

    y += 144 + 14;

    /* ─── KPIs grandes ─── */
    const kpiBoxes = [
      {
        label: "VENTAS",
        value: fmtInt(summary.sales_count),
        sub: `${fmtInt(summary.items_qty)} uds.`,
        color: COLORS.text,
      },
      {
        label: "TOTAL VENDIDO",
        value: money(summary.total_sum),
        sub: `Desc. ${money(summary.discount_sum)}`,
        color: COLORS.primary,
      },
      {
        label: `A LIQUIDAR (${profitPct.value || 0}%)`,
        value: money(liquidationTotal.value),
        sub: `Sobre ${profitBase.value === "subtotal" ? "subtotal" : "total"}`,
        color: COLORS.success,
      },
    ];
    const kpiGap = 12;
    const kpiW = (pageW - M * 2 - kpiGap * (kpiBoxes.length - 1)) / kpiBoxes.length;
    const kpiH = 72;
    kpiBoxes.forEach((k, i) => {
      const x = M + i * (kpiW + kpiGap);
      setFill([255, 255, 255]);
      setDraw(COLORS.border, 0.5);
      doc.roundedRect(x, y, kpiW, kpiH, 5, 5, "FD");
      setText(COLORS.muted, 8, "bold");
      doc.text(k.label, x + 12, y + 18);
      setText(k.color, 20, "bold");
      doc.text(k.value, x + 12, y + 46);
      setText(COLORS.muted, 8);
      doc.text(k.sub, x + 12, y + 62);
    });
    y += kpiH + 18;

    /* ─── SECCIÓN: GRÁFICOS ─── */
    function sectionTitle(txt) {
      ensureSpace(36);
      setText(COLORS.text, 11, "bold");
      doc.text(txt.toUpperCase(), M, y);
      setDraw(COLORS.border, 0.5);
      doc.line(M, y + 4, pageW - M, y + 4);
      y += 14;
    }

    /**
     * Dibuja un gráfico de barras horizontales.
     * rows: [{ label, value, extra?, color? }]
     */
    function drawBarChart({ rows, height, title, formatter }) {
      if (!rows.length) return;
      sectionTitle(title);
      const innerW = pageW - M * 2;
      const labelW = 120;
      const valueW = 90;
      const barX = M + labelW + 6;
      const barW = innerW - labelW - valueW - 10;
      const rowH = 18;
      const h = rows.length * rowH + 14;
      ensureSpace(h + 10);

      const max = rows.reduce((a, r) => (r.value > a ? r.value : a), 0) || 1;

      setFill([255, 255, 255]);
      setDraw(COLORS.border, 0.3);
      doc.roundedRect(M, y, innerW, h, 4, 4, "FD");

      let ry = y + 12;
      for (const r of rows) {
        setText(COLORS.text, 9, "bold");
        doc.text(shortenText(r.label, 22), M + 8, ry + 5);

        // bar bg
        setFill([238, 242, 247]);
        doc.roundedRect(barX, ry - 4, barW, 10, 2, 2, "F");

        // bar fill
        const w = Math.max(1, (r.value / max) * barW);
        setFill(r.color || COLORS.primary);
        doc.roundedRect(barX, ry - 4, w, 10, 2, 2, "F");

        setText(COLORS.text, 9, "bold");
        const valText = formatter ? formatter(r) : money(r.value);
        doc.text(valText, pageW - M - 8, ry + 5, { align: "right" });

        if (r.extra) {
          setText(COLORS.muted, 7);
          doc.text(r.extra, pageW - M - 8, ry + 12, { align: "right" });
        }

        ry += rowH;
      }

      y += h + 10;
    }

    /* 1) Por método de pago */
    const methodRows = byMethod.value.map((m) => ({
      label: methodLabel(m.method),
      value: m.amount,
      extra: `${m.pct.toFixed(1)}%`,
      color: COLORS.primary,
    }));
    drawBarChart({
      rows: methodRows,
      title: "Ganancias por método de pago",
      formatter: (r) => money(r.value),
    });

    /* 2) Por cajero */
    const userRows = byUser.value.slice(0, 8).map((u) => ({
      label: u.user_name,
      value: u.total_sum,
      extra: `${u.sales_count} v. · ${u.pct.toFixed(1)}%`,
      color: COLORS.success,
    }));
    drawBarChart({
      rows: userRows,
      title: "Ventas por cajero",
      formatter: (r) => money(r.value),
    });

    /* 3) Por sucursal */
    if (byBranch.value.length) {
      const baseKey = profitBase.value === "subtotal" ? "subtotal_sum" : "total_sum";
      const brRows = byBranch.value.map((b) => {
        const baseAmt = Number(b[baseKey] || 0);
        return {
          label: b.branch_name,
          value: baseAmt,
          extra: `${b.sales_count} v. · Liq. ${money(baseAmt * ((profitPct.value || 0) / 100))}`,
          color: COLORS.warning,
        };
      });
      drawBarChart({
        rows: brRows,
        title: `Ventas por sucursal (base: ${profitBase.value === "subtotal" ? "subtotal" : "total"})`,
        formatter: (r) => money(r.value),
      });
    }

    /* 4) Por día — mini gráfico vertical */
    if (byDay.value.length) {
      sectionTitle("Ventas por día");
      const innerW = pageW - M * 2;
      const chartH = 100;
      const padTop = 12;
      const padBot = 22;
      const chartY = y;
      ensureSpace(chartH + padBot + padTop + 4);

      setFill([255, 255, 255]);
      setDraw(COLORS.border, 0.3);
      doc.roundedRect(M, chartY, innerW, chartH + padBot, 4, 4, "FD");

      const max = byDay.value.reduce((a, d) => (d.total_sum > a ? d.total_sum : a), 0) || 1;
      const barCount = byDay.value.length;
      const barGap = 2;
      const barAreaW = innerW - 16;
      const barW = Math.max(3, (barAreaW - barGap * (barCount - 1)) / barCount);

      byDay.value.forEach((d, i) => {
        const x = M + 8 + i * (barW + barGap);
        const h = Math.max(2, (d.total_sum / max) * chartH);
        const yTop = chartY + padTop + (chartH - h);
        setFill(COLORS.primary);
        doc.roundedRect(x, yTop, barW, h, 1, 1, "F");
        // label cada N
        if (barCount <= 31 && (i === 0 || i === barCount - 1 || i % Math.max(1, Math.floor(barCount / 6)) === 0)) {
          setText(COLORS.muted, 6);
          const [, mm, dd] = d.date.split("-");
          doc.text(`${dd}/${mm}`, x + barW / 2, chartY + chartH + padTop + 12, {
            align: "center",
          });
        }
      });

      y += chartH + padBot + 6;
    }

    /* ─── TABLA: Resumen por sucursal ─── */
    if (byBranch.value.length > 1) {
      ensureSpace(40);
      sectionTitle(
        `Resumen por sucursal · Ganancia ${profitPct.value || 0}% sobre ${profitBase.value === "subtotal" ? "subtotal" : "total"}`
      );
      autoTable(doc, {
        startY: y,
        margin: { left: M, right: M },
        head: [["Sucursal", "Ventas", "Subtotal", "Desc.", "Total", "A liquidar"]],
        body: byBranch.value.map((b) => {
          const baseAmt =
            profitBase.value === "subtotal"
              ? Number(b.subtotal_sum || 0)
              : Number(b.total_sum || 0);
          return [
            b.branch_name,
            fmtInt(b.sales_count),
            money(b.subtotal_sum),
            money(b.discount_sum),
            money(b.total_sum),
            money(baseAmt * ((profitPct.value || 0) / 100)),
          ];
        }),
        styles: { fontSize: 8, cellPadding: 5, textColor: COLORS.text },
        headStyles: {
          fillColor: COLORS.primary,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        alternateRowStyles: { fillColor: COLORS.rowAlt },
        columnStyles: {
          1: { halign: "right" },
          2: { halign: "right" },
          3: { halign: "right" },
          4: { halign: "right" },
          5: { halign: "right", fontStyle: "bold", textColor: COLORS.success },
        },
        didDrawPage: () => {
          drawHeaderStrip();
        },
      });
      y = doc.lastAutoTable.finalY + 14;
    }

    /* ─── TABLA DETALLE DE VENTAS ─── */
    ensureSpace(40);
    sectionTitle(
      `Detalle de ventas (${fmtInt(sales.value.length)}) · Ganancia aplicada sobre ${profitBase.value === "subtotal" ? "subtotal (precio de lista)" : "total (con descuentos)"}`
    );

    const rows = buildSalesRows();
    const body = rows.map((r) => [
      `${r.sold_at_date} ${r.sold_at_time}`,
      r.sale_number || `#${r.id}`,
      r.branch,
      r.user,
      r.customer || "—",
      fmtInt(r.items_qty),
      money(r.total),
      r.primary_method,
      `${r.profit_pct}%`,
      money(r.liquidation),
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [
        ["Fecha", "N°", "Sucursal", "Cajero", "Cliente", "Uds.", "Total", "Pago", "%", "Liquida"],
      ],
      body,
      foot: [
        [
          { content: "TOTAL PERÍODO", colSpan: 6, styles: { halign: "right", fontStyle: "bold" } },
          { content: money(summary.total_sum), styles: { halign: "right", fontStyle: "bold" } },
          "",
          "",
          {
            content: money(liquidationTotal.value),
            styles: {
              halign: "right",
              fontStyle: "bold",
              textColor: COLORS.success,
            },
          },
        ],
      ],
      styles: { fontSize: 7, cellPadding: 4, textColor: COLORS.text, overflow: "linebreak" },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
      },
      footStyles: { fillColor: COLORS.headerBg, textColor: COLORS.text },
      alternateRowStyles: { fillColor: COLORS.rowAlt },
      columnStyles: {
        0: { cellWidth: 64 },
        1: { cellWidth: 48 },
        2: { cellWidth: 60 },
        3: { cellWidth: 60 },
        4: { cellWidth: "auto" },
        5: { halign: "right", cellWidth: 28 },
        6: { halign: "right", cellWidth: 54, fontStyle: "bold" },
        7: { cellWidth: 56 },
        8: { halign: "right", cellWidth: 28 },
        9: {
          halign: "right",
          cellWidth: 58,
          fontStyle: "bold",
          textColor: COLORS.success,
        },
      },
      didDrawPage: () => {
        drawHeaderStrip();
      },
    });

    // Footer en todas las páginas
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawFooter();
    }

    doc.save(`${buildFilenameBase()}.pdf`);
    toast("Reporte PDF descargado");
  } catch (e) {
    console.error("[reports/exportPdf] error:", e);
    toast("No se pudo generar el PDF.");
  } finally {
    exportingPdf.value = false;
  }
}

/* ─── Export Excel (multihoja) ─────────────────────────────────────── */
async function exportExcel() {
  if (!sales.value.length) return;
  exporting.value = true;
  try {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    /* Hoja 1: Resumen */
    const resumenAoA = [
      ["REPORTE DE VENTAS — LIQUIDACIÓN FRANQUICIA"],
      [],
      ["Generado", issuedAtLabel.value],
      ["Emitido por", issuerName.value],
      ["Email", issuerEmail.value || "—"],
      ["Rol(es)", issuerRoles.value.join(", ") || "—"],
      [],
      ["Período", `${monthLabel.value} ${f.year}`],
      ["Desde", fmtDate(periodFrom.value)],
      ["Hasta", fmtDate(periodToInclusive.value)],
      ["Sucursal", selectedBranchName.value || "Todas"],
      ["Estado", f.status === "ALL" ? "Todas las ventas" : "Solo pagadas"],
      ["% Ganancia global", `${profitPct.value || 0}%`],
      ["Base de cálculo", profitBaseLabel.value],
      ["Overrides manuales", overrideCount.value],
      ["Notas", reportNotes.value || "—"],
      [],
      ["TOTALES"],
      ["Cantidad de ventas", summary.sales_count],
      ["Unidades vendidas", summary.items_qty],
      ["Subtotal", summary.subtotal_sum],
      ["Descuentos", summary.discount_sum],
      ["Total vendido", summary.total_sum],
      ["Total pagado", summary.paid_sum],
      ["Ticket promedio", Number(avgTicket.value.toFixed(2))],
      ["Total a liquidar", Number(liquidationTotal.value.toFixed(2))],
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenAoA);
    wsResumen["!cols"] = [{ wch: 28 }, { wch: 38 }];
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

    /* Hoja 2: Ventas (detalle) */
    const rows = buildSalesRows();
    const detalle = rows.map((r) => ({
      ID: r.id,
      "N° Venta": r.sale_number,
      Fecha: r.sold_at_date,
      Hora: r.sold_at_time,
      "Fecha ISO": r.sold_at_iso,
      Sucursal: r.branch,
      "Sucursal ID": r.branch_id,
      Cajero: r.user,
      "Cajero ID": r.user_id,
      Cliente: r.customer,
      "Doc. cliente": r.customer_doc,
      "Items (uds)": r.items_qty,
      Subtotal: r.subtotal,
      Descuento: r.discount,
      Total: r.total,
      "Método principal": r.primary_method,
      "Detalle de pagos": r.methods_detail,
      "% Ganancia": r.profit_pct,
      "Fuente %": r.profit_pct_source,
      "Base cálculo": r.base_label,
      "Monto base": Number(r.base_amount.toFixed(2)),
      "A liquidar": Number(r.liquidation.toFixed(2)),
    }));
    const wsDetalle = XLSX.utils.json_to_sheet(detalle);
    wsDetalle["!cols"] = [
      { wch: 8 },  { wch: 14 }, { wch: 11 }, { wch: 7 },  { wch: 20 },
      { wch: 22 }, { wch: 8 },  { wch: 22 }, { wch: 8 },  { wch: 26 },
      { wch: 14 }, { wch: 11 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 16 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 34 },
      { wch: 12 }, { wch: 13 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDetalle, "Ventas");

    /* Hoja 3: Por sucursal */
    if (byBranch.value.length) {
      const baseKey = profitBase.value === "subtotal" ? "subtotal_sum" : "total_sum";
      const brRows = byBranch.value.map((b) => {
        const baseAmt = Number(b[baseKey] || 0);
        return {
          "Sucursal ID": b.branch_id,
          Sucursal: b.branch_name,
          "Ventas": b.sales_count,
          Subtotal: b.subtotal_sum,
          Descuentos: b.discount_sum,
          Total: b.total_sum,
          "% Ganancia": profitPct.value || 0,
          "Base cálculo": profitBaseLabel.value,
          "Monto base": Number(baseAmt.toFixed(2)),
          "A liquidar (aprox)": Number(
            (baseAmt * ((profitPct.value || 0) / 100)).toFixed(2)
          ),
        };
      });
      const wsBr = XLSX.utils.json_to_sheet(brRows);
      wsBr["!cols"] = [
        { wch: 12 }, { wch: 26 }, { wch: 8 }, { wch: 14 },
        { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 34 },
        { wch: 14 }, { wch: 16 },
      ];
      XLSX.utils.book_append_sheet(wb, wsBr, "Por sucursal");
    }

    /* Hoja 4: Por método de pago */
    if (byMethod.value.length) {
      const mRows = byMethod.value.map((m) => ({
        Método: methodLabel(m.method),
        Código: m.method,
        Monto: Number(m.amount.toFixed(2)),
        "% del total": Number(m.pct.toFixed(2)),
      }));
      const wsM = XLSX.utils.json_to_sheet(mRows);
      wsM["!cols"] = [{ wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, wsM, "Por método");
    }

    /* Hoja 5: Por cajero */
    if (byUser.value.length) {
      const uRows = byUser.value.map((u) => ({
        "Cajero ID": u.user_id,
        Cajero: u.user_name,
        Ventas: u.sales_count,
        Total: Number(u.total_sum.toFixed(2)),
        "% del total": Number(u.pct.toFixed(2)),
      }));
      const wsU = XLSX.utils.json_to_sheet(uRows);
      wsU["!cols"] = [{ wch: 10 }, { wch: 28 }, { wch: 8 }, { wch: 14 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, wsU, "Por cajero");
    }

    /* Hoja 6: Por día */
    if (byDay.value.length) {
      const dRows = byDay.value.map((d) => ({
        Fecha: d.date,
        Ventas: d.sales_count,
        Total: d.total_sum,
      }));
      const wsD = XLSX.utils.json_to_sheet(dRows);
      wsD["!cols"] = [{ wch: 12 }, { wch: 8 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsD, "Por día");
    }

    XLSX.writeFile(wb, `${buildFilenameBase()}.xlsx`);
    toast("Reporte Excel descargado");
  } catch (e) {
    console.error("[reports/exportExcel] error:", e);
    toast("No se pudo generar el Excel.");
  } finally {
    exporting.value = false;
  }
}

/* ─── Init ─────────────────────────────────────────────────────────── */
onMounted(async () => {
  await Promise.all([loadBranches(), loadSellers()]);
  await reload();
});
</script>

<style scoped>
.rpt-sales {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

/* FILTROS */
.rpt-filters {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 14px;
  background: rgba(var(--v-theme-surface), 0.6);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.rpt-filters__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 4px;
  border-bottom: 1px dashed rgba(var(--v-theme-on-surface), 0.08);
}
.rpt-filters__head-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.rpt-filters__icon { opacity: 0.6; }
.rpt-filters__title {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.rpt-filters__clear {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 11px;
  font-weight: 400;
  cursor: pointer;
  transition: background 0.14s, color 0.14s;
}
.rpt-filters__clear:hover {
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgb(var(--v-theme-primary));
  border-color: rgba(var(--v-theme-primary), 0.28);
}
.rpt-period-toggle {
  display: flex;
  justify-content: flex-start;
}
.rpt-period-toggle :deep(.v-btn-toggle) {
  border-radius: 10px;
  overflow: hidden;
}
.rpt-period-toggle :deep(.v-btn) {
  font-size: 12px;
  letter-spacing: 0.02em;
  text-transform: none;
  font-weight: 500;
  padding: 0 14px;
}

.rpt-filters__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 10px 12px;
  align-items: end;
}
.rpt-filters__grid--main {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
.rpt-filter-cell { min-width: 0; }

.rpt-filters__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 4px;
  border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.06);
  margin-top: 2px;
  flex-wrap: wrap;
}
.rpt-filter-cell--pct {
  flex: 0 0 auto;
  min-width: 200px;
  max-width: 240px;
}
.rpt-filters__actions-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  margin-left: auto;
}

/* KPIs */
.rpt-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}
.rpt-kpi {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.rpt-kpi__label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
}
.rpt-kpi__value {
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.1;
  font-feature-settings: "tnum";
  color: rgb(var(--v-theme-on-surface));
}
.rpt-kpi__value--sm { font-size: 17px; }
.rpt-kpi__sub {
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-weight: 400;
}

.rpt-kpi--primary {
  background: linear-gradient(135deg,
    rgba(var(--v-theme-primary), 0.12),
    rgba(var(--v-theme-primary), 0.04));
  border-color: rgba(var(--v-theme-primary), 0.32);
}
.rpt-kpi--primary .rpt-kpi__value { color: rgb(var(--v-theme-primary)); }
.rpt-kpi--primary .rpt-kpi__label { color: rgb(var(--v-theme-primary)); opacity: 0.8; }

.rpt-kpi--success {
  background: linear-gradient(135deg,
    rgba(var(--v-theme-success), 0.12),
    rgba(var(--v-theme-success), 0.04));
  border-color: rgba(var(--v-theme-success), 0.32);
}
.rpt-kpi--success .rpt-kpi__value { color: rgb(var(--v-theme-success)); }
.rpt-kpi--success .rpt-kpi__label { color: rgb(var(--v-theme-success)); opacity: 0.85; }

/* META barra (emisor, generado, notas toggle) */
.rpt-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 0 4px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}
.rpt-meta__left {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}
.rpt-meta__icon { opacity: 0.6; }
.rpt-meta__user {
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.78);
}
.rpt-meta__role {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 5px;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  font-size: 9.5px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-left: 3px;
}
.rpt-meta__sep {
  opacity: 0.4;
  margin: 0 4px;
}
.rpt-meta__notes-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 7px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 11.5px;
  cursor: pointer;
  transition: background 0.14s, color 0.14s, border-color 0.14s;
}
.rpt-meta__notes-toggle:hover {
  background: rgba(var(--v-theme-primary), 0.08);
  border-color: rgba(var(--v-theme-primary), 0.28);
  color: rgb(var(--v-theme-primary));
}
.rpt-meta__notes-toggle.is-active {
  background: rgba(var(--v-theme-primary), 0.1);
  border-color: rgba(var(--v-theme-primary), 0.32);
  color: rgb(var(--v-theme-primary));
}
.rpt-meta__notes-row {
  margin-top: -4px;
}

/* BREAKDOWNS */
.rpt-breakdowns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}
.rpt-breakdown-list {
  display: flex;
  flex-direction: column;
  padding: 8px 4px;
}
.rpt-breakdown-row {
  display: grid;
  grid-template-columns: 150px 1fr 120px;
  gap: 10px;
  align-items: center;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.04);
}
.rpt-breakdown-row:last-child { border-bottom: none; }
.rpt-breakdown-row__left {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.rpt-breakdown-row__icon {
  color: rgba(var(--v-theme-on-surface), 0.55);
  flex-shrink: 0;
}
.rpt-breakdown-row__label {
  font-size: 12.5px;
  font-weight: 400;
  color: rgb(var(--v-theme-on-surface));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.rpt-breakdown-row__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 10px;
  font-weight: 500;
  font-feature-settings: "tnum";
}
.rpt-breakdown-row__bar {
  height: 8px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  overflow: hidden;
  min-width: 80px;
}
.rpt-breakdown-row__fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg,
    rgb(var(--v-theme-primary)),
    rgba(var(--v-theme-primary), 0.7));
  transition: width 0.3s ease;
}
.rpt-breakdown-row__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.1;
  font-feature-settings: "tnum";
}
.rpt-breakdown-row__right strong {
  font-size: 13px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}
.rpt-breakdown-row__right span {
  font-size: 11px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.55);
}
.rpt-breakdown-empty {
  padding: 24px 16px;
  text-align: center;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

/* Por día — barras verticales mini */
.rpt-day-list {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(42px, 1fr);
  gap: 6px;
  padding: 12px 14px 14px;
  overflow-x: auto;
  align-items: end;
  min-height: 160px;
}
.rpt-day-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 0;
  cursor: default;
}
.rpt-day-row__date {
  font-size: 10px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.55);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  order: 3;
}
.rpt-day-row__bar {
  width: 100%;
  flex: 1 1 100px;
  max-height: 100px;
  min-height: 8px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  order: 1;
}
.rpt-day-row__fill {
  width: 100%;
  background: linear-gradient(180deg,
    rgba(var(--v-theme-primary), 0.9),
    rgba(var(--v-theme-primary), 0.55));
  border-radius: 6px;
  transition: height 0.3s ease;
}
.rpt-day-row__value {
  font-size: 10.5px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  font-feature-settings: "tnum";
  order: 2;
}
.rpt-day-row__count {
  display: none;
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  order: 4;
}

/* Payment chip en tabla */
.rpt-method-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgba(var(--v-theme-on-surface), 0.82);
  font-size: 11px;
  font-weight: 400;
  cursor: help;
}
.rpt-cell-payment {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.rpt-cell-payment__more {
  font-size: 10px;
  font-weight: 500;
  padding: 1px 5px;
  border-radius: 5px;
  background: rgba(var(--v-theme-warning), 0.14);
  color: rgb(var(--v-theme-warning));
}
.rpt-cell-discount {
  color: rgba(var(--v-theme-error), 0.85);
  font-weight: 400;
}

/* CARD genérico */
.rpt-card {
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  overflow: hidden;
}
.rpt-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  background: rgba(var(--v-theme-on-surface), 0.02);
}
.rpt-card__title {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.65);
}
.rpt-card__count {
  font-size: 11.5px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.5);
  font-feature-settings: "tnum";
}
.rpt-card__hint {
  margin-left: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  font-size: 10.5px;
  font-weight: 400;
  letter-spacing: 0.01em;
}

/* Resumen por sucursal */
.rpt-branch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
  padding: 14px 16px;
}
.rpt-branch-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.025);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  cursor: pointer;
  transition: border-color 0.14s, background 0.14s, transform 0.14s;
}
.rpt-branch-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  background: rgba(var(--v-theme-primary), 0.04);
  transform: translateY(-1px);
}
.rpt-branch-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.rpt-branch-card__name {
  font-size: 13px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rpt-branch-card__metric {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.rpt-branch-card__metric-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.48);
}
.rpt-branch-card__metric-value {
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: rgb(var(--v-theme-on-surface));
  font-feature-settings: "tnum";
}
.rpt-branch-card__metric-value--pos {
  color: rgb(var(--v-theme-success));
}

/* LOADING / EMPTY */
.rpt-loading, .rpt-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 40px 20px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-size: 13px;
}
.rpt-empty__title { font-size: 14px; font-weight: 500; color: rgb(var(--v-theme-on-surface)); }
.rpt-empty__sub { font-size: 12px; opacity: 0.7; }

/* TABLA */
.rpt-table-wrap {
  overflow-x: auto;
  padding: 0;
}
.rpt-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  min-width: 880px;
}
.rpt-table thead th {
  text-align: left;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
  padding: 10px 12px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.03);
  white-space: nowrap;
}
.rpt-table tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  vertical-align: middle;
  color: rgb(var(--v-theme-on-surface));
}
.rpt-table tbody tr:hover {
  background: rgba(var(--v-theme-primary), 0.03);
}
.rpt-table .num {
  text-align: right;
  font-feature-settings: "tnum";
}
.rpt-table .mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}
.rpt-cell-date {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.rpt-cell-date strong { font-weight: 500; }
.rpt-cell-date span {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.5);
}
.rpt-cell-user {
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.8);
}
.rpt-cell-customer {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
  max-width: 200px;
}
.rpt-cell-customer strong {
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rpt-cell-customer span {
  font-size: 10.5px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.rpt-branch-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  font-size: 11px;
  font-weight: 400;
}
.rpt-cell-total {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}
.rpt-cell-pct {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  justify-content: flex-end;
}
.rpt-pct-input {
  width: 56px;
  padding: 4px 6px;
  border-radius: 6px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.18);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  font-size: 12px;
  font-weight: 400;
  text-align: right;
  font-feature-settings: "tnum";
  outline: none;
  transition: border-color 0.14s;
}
.rpt-pct-input:focus {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.14);
}
.rpt-pct-input::-webkit-outer-spin-button,
.rpt-pct-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.rpt-pct-suffix {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  font-weight: 400;
}
.rpt-pct-reset {
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: rgb(var(--v-theme-warning));
  display: inline-flex;
  align-items: center;
}
.rpt-pct-reset:hover { opacity: 0.75; }
.rpt-cell-profit {
  font-weight: 500;
  color: rgb(var(--v-theme-success));
}
.rpt-table tfoot td {
  padding: 12px;
  border-top: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-on-surface), 0.025);
}
.rpt-foot-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
  text-align: right !important;
}
.rpt-foot-val {
  font-weight: 500;
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
}
.rpt-foot-val--success { color: rgb(var(--v-theme-success)); }

/* RESPONSIVE */
@media (max-width: 768px) {
  .rpt-filters { padding: 14px; gap: 12px; }
  .rpt-filters__actions { flex-direction: column; align-items: stretch; }
  .rpt-filter-cell--pct { min-width: 0; max-width: none; }
  .rpt-filters__actions-buttons { margin-left: 0; justify-content: flex-start; }
  .rpt-kpi { padding: 12px; }
  .rpt-kpi__value { font-size: 18px; }
  .rpt-kpi__value--sm { font-size: 15px; }
  .rpt-branch-grid { padding: 10px; }
  .rpt-meta { font-size: 11px; }
  .rpt-meta__notes-toggle { padding: 3px 8px; font-size: 11px; }
  .rpt-breakdown-row {
    grid-template-columns: 1fr 100px;
    gap: 6px;
    padding: 8px 12px;
  }
  .rpt-breakdown-row__bar { display: none; }
  .rpt-day-list { min-height: 140px; }
}
</style>
