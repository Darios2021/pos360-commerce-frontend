<template>
  <div class="dcash">
    <!-- Row 1: 6 KPIs -->
    <v-row dense class="mb-3">
      <v-col cols="12" sm="6" md="4" xl="2">
        <KpiCard
          title="Sesiones de caja"
          :value="String(sessions.total)"
          :loading="loading"
          icon="mdi-cash-register"
          tone="primary"
          :sub="`${sessions.open} abiertas · ${sessions.closed} cerradas`"
        />
      </v-col>
      <v-col cols="12" sm="6" md="4" xl="2">
        <KpiCard
          title="Sesiones abiertas"
          :value="String(sessions.open)"
          :loading="loading"
          icon="mdi-lock-open-variant-outline"
          :tone="sessions.open > 0 ? 'warning' : 'success'"
          sub="Cajas activas ahora"
        />
      </v-col>
      <v-col cols="12" sm="6" md="4" xl="2">
        <KpiCard
          title="Ingresado (IN)"
          :value="money(movements.totalIn)"
          :loading="loading"
          icon="mdi-arrow-down-circle-outline"
          tone="success"
          :sub="`${movements.countIn} movimientos`"
        />
      </v-col>
      <v-col cols="12" sm="6" md="4" xl="2">
        <KpiCard
          title="Egresado (OUT)"
          :value="money(movements.totalOut)"
          :loading="loading"
          icon="mdi-arrow-up-circle-outline"
          tone="error"
          :sub="`${movements.countOut} movimientos`"
        />
      </v-col>
      <v-col cols="12" sm="6" md="4" xl="2">
        <KpiCard
          title="Neto movimientos"
          :value="money(movements.net)"
          :loading="loading"
          icon="mdi-scale-balance"
          :tone="movements.net >= 0 ? 'success' : 'error'"
          sub="IN − OUT"
        />
      </v-col>
      <v-col cols="12" sm="6" md="4" xl="2">
        <KpiCard
          title="Diferencia total"
          :value="money(sessions.totalDifference)"
          :loading="loading"
          icon="mdi-calculator-variant-outline"
          :tone="sessions.totalDifference >= 0 ? 'info' : 'error'"
          :sub="`Excedente: ${money(sessions.totalSurplus)} · Faltante: ${money(sessions.totalDeficit)}`"
        />
      </v-col>
    </v-row>

    <!-- Row 2: Sessions by Day (8) + Movements by Day (4) -->
    <v-row dense>
      <v-col cols="12" lg="8">
        <v-card class="cash-card" elevation="0">
          <div class="cash-head">
            <div class="minw-0">
              <div class="cash-title">Sesiones de caja por día</div>
              <div class="cash-sub">Apertura y diferencia promedio · {{ periodLabel }}</div>
            </div>
            <div class="cash-right">
              <v-select
                v-model="periodLocal"
                :items="periodItems"
                item-title="title"
                item-value="value"
                density="compact"
                variant="outlined"
                hide-details
                class="cash-period"
                @update:modelValue="emit('period-change', $event)"
              />
            </div>
          </div>
          <v-divider />
          <div class="cash-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!sessionsByDay.length" class="empty-state">Sin sesiones en el período.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="280" type="bar" :options="optSessionsByDay" :series="seriesSessionsByDay" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="cash-card" elevation="0">
          <div class="cash-head">
            <div class="minw-0">
              <div class="cash-title">Movimientos IN vs OUT</div>
              <div class="cash-sub">Resumen del período</div>
            </div>
          </div>
          <v-divider />
          <div class="cash-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!movSeries.length" class="empty-state">Sin movimientos.</div>
            <div v-else>
              <ApexChart height="280" type="donut" :options="optMovDonut" :series="movSeries" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row 3: Movimientos por día (8) + By Reason (4) -->
    <v-row dense class="mt-2">
      <v-col cols="12" lg="8">
        <v-card class="cash-card" elevation="0">
          <div class="cash-head">
            <div class="minw-0">
              <div class="cash-title">Movimientos de efectivo por día</div>
              <div class="cash-sub">Entradas y salidas diarias · {{ periodLabel }}</div>
            </div>
          </div>
          <v-divider />
          <div class="cash-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!movByDay.length" class="empty-state">Sin datos diarios.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="260" type="bar" :options="optMovByDay" :series="seriesMovByDay" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="cash-card" elevation="0">
          <div class="cash-head">
            <div class="minw-0">
              <div class="cash-title">Movimientos por razón</div>
              <div class="cash-sub">Top motivos de entrada/salida</div>
            </div>
          </div>
          <v-divider />
          <div class="cash-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!movByReason.length" class="empty-state">Sin movimientos con razón.</div>
            <div v-else class="px-2 pb-2 overflow-y-auto" style="max-height:260px">
              <div
                v-for="m in movByReason"
                :key="`${m.reason}-${m.type}`"
                class="reason-row"
              >
                <v-chip size="x-small" :color="m.type === 'IN' ? 'success' : 'error'" variant="flat" class="mr-2">{{ m.type }}</v-chip>
                <span class="reason-label flex-grow-1">{{ m.reason }}</span>
                <span class="reason-value">{{ money(m.total) }}</span>
                <span class="reason-cnt ml-2 text-caption text-medium-emphasis">×{{ m.count }}</span>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row 4: Diferencias por sucursal (6) + Últimas sesiones (6) -->
    <v-row dense class="mt-2">
      <v-col cols="12" lg="6">
        <v-card class="cash-card" elevation="0">
          <div class="cash-head">
            <div class="minw-0">
              <div class="cash-title">Diferencias por sucursal</div>
              <div class="cash-sub">Sesiones cerradas · sobrante vs faltante</div>
            </div>
          </div>
          <v-divider />
          <div class="cash-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!diffByBranch.length" class="empty-state">Sin sesiones cerradas.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="260" type="bar" :options="optDiffByBranch" :series="seriesDiffByBranch" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6">
        <v-card class="cash-card" elevation="0">
          <div class="cash-head">
            <div class="minw-0">
              <div class="cash-title">Últimas sesiones de caja</div>
              <div class="cash-sub">Historial reciente</div>
            </div>
          </div>
          <v-divider />
          <v-card-text class="pa-0">
            <div v-if="loading" class="py-8 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else>
              <v-data-table
                :headers="sessionHeaders"
                :items="lastSessions"
                density="comfortable"
                class="elevation-0 dash-table"
                :sort-by="[{ key: 'id', order: 'desc' }]"
              >
                <template #item.id="{ item }">
                  <span class="font-weight-bold text-primary">#{{ item.id }}</span>
                </template>
                <template #item.status="{ item }">
                  <v-chip size="x-small" :color="item.status === 'OPEN' ? 'warning' : 'success'" variant="flat">
                    {{ item.status === 'OPEN' ? 'Abierta' : 'Cerrada' }}
                  </v-chip>
                </template>
                <template #item.difference_cash="{ item }">
                  <span :class="item.difference_cash < 0 ? 'text-error font-weight-bold' : item.difference_cash > 0 ? 'text-success font-weight-bold' : ''">
                    {{ money(item.difference_cash) }}
                  </span>
                </template>
                <template #item.duration="{ item }">
                  {{ item.duration_min ? `${item.duration_min} min` : '—' }}
                </template>
                <template #bottom />
              </v-data-table>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row 5: Duración promedio radialBar + Opening/Closing overview -->
    <v-row dense class="mt-2">
      <v-col cols="12" lg="4">
        <v-card class="cash-card" elevation="0">
          <div class="cash-head">
            <div class="minw-0">
              <div class="cash-title">Duración promedio de caja</div>
              <div class="cash-sub">Tiempo promedio de sesión cerrada</div>
            </div>
          </div>
          <v-divider />
          <div class="cash-body d-flex flex-column align-center justify-center py-4">
            <div v-if="loading" class="py-6 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else>
              <ApexChart height="200" type="radialBar" :options="optDuration" :series="[Math.min(100, Math.round(sessions.avgDurationMin / 600 * 100))]" />
              <div class="text-center mt-n4">
                <div class="text-h5 font-weight-black">{{ formatMinutes(sessions.avgDurationMin) }}</div>
                <div class="text-caption text-medium-emphasis font-weight-bold">DURACIÓN PROMEDIO</div>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="8">
        <v-card class="cash-card" elevation="0">
          <div class="cash-head">
            <div class="minw-0">
              <div class="cash-title">Apertura vs Cierre de caja</div>
              <div class="cash-sub">Comparativo de montos iniciales y finales · sesiones cerradas</div>
            </div>
            <v-chip size="small" variant="tonal" class="chip-soft">
              {{ closedSessionsAgg.length }} sucursales
            </v-chip>
          </div>
          <v-divider />
          <div class="cash-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!closedSessionsAgg.length" class="empty-state">Sin sesiones cerradas.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="200" type="bar" :options="optOpenClose" :series="seriesOpenClose" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import ApexChart from "vue3-apexcharts";
import KpiCard from "./KpiCard.vue";

const props = defineProps({
  loading: { type: Boolean, default: false },
  analytics: { type: Object, default: null },
  period: { type: String, default: "30d" },
});
const emit = defineEmits(["period-change"]);

const periodLocal = ref(props.period);
watch(() => props.period, v => { periodLocal.value = v; });

const periodItems = [
  { title: "Último mes", value: "30d" },
  { title: "Últimos 3 meses", value: "90d" },
  { title: "Último año", value: "12m" },
  { title: "Desde siempre", value: "all" },
];

const periodLabel = computed(() => {
  const m = periodItems.find(x => x.value === periodLocal.value);
  return m?.title || "Período";
});

function num(v) { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; }
function money(val) {
  const n = Number(val || 0);
  try { return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n); }
  catch { return `$ ${Math.round(n)}`; }
}
function formatMinutes(min) {
  const m = Math.round(num(min));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

const ana = computed(() => props.analytics || {});
const sessions = computed(() => ana.value?.sessions || { total: 0, open: 0, closed: 0, avgDurationMin: 0, totalOpening: 0, totalClosing: 0, totalDifference: 0, totalDeficit: 0, totalSurplus: 0 });
const movements = computed(() => ana.value?.movements || { totalIn: 0, totalOut: 0, countIn: 0, countOut: 0, net: 0 });
const sessionsByDay = computed(() => Array.isArray(ana.value?.sessionsByDay) ? ana.value.sessionsByDay : []);
const movByDay = computed(() => Array.isArray(ana.value?.movementsByDay) ? ana.value.movementsByDay : []);
const movByReason = computed(() => Array.isArray(ana.value?.movementsByReason) ? ana.value.movementsByReason : []);
const diffByBranch = computed(() => Array.isArray(ana.value?.differenceByBranch) ? ana.value.differenceByBranch : []);
const lastSessions = computed(() => Array.isArray(ana.value?.lastSessions) ? ana.value.lastSessions : []);

// Apex common
const apexCommon = {
  chart: { background: "transparent", fontFamily: "inherit", toolbar: { show: false } },
  theme: { mode: "dark" },
  grid: { borderColor: "rgba(255,255,255,0.06)", strokeDashArray: 3 },
};
const axisStyle = { colors: "rgba(var(--v-theme-on-surface), 0.60)" };
const axisBorder = { show: false };

// Sessions by day bar
const seriesSessionsByDay = computed(() => [
  { name: "Sesiones", data: sessionsByDay.value.map(r => num(r.sessions)), color: "#008FFB" },
  { name: "Cerradas", data: sessionsByDay.value.map(r => num(r.closed)), color: "#00E396" },
]);
const optSessionsByDay = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  plotOptions: { bar: { columnWidth: "65%", borderRadius: 4 } },
  dataLabels: { enabled: false },
  xaxis: { categories: sessionsByDay.value.map(r => r.day?.slice(5) || ""), labels: { style: { ...axisStyle, fontSize: "9px" }, rotate: -45 }, axisBorder, axisTicks: axisBorder },
  yaxis: { labels: { style: axisStyle } },
  legend: { show: true, position: "top", labels: { colors: "rgba(var(--v-theme-on-surface), 0.7)" } },
  tooltip: { theme: "dark", y: { formatter: v => `${v} sesiones` } },
}));

// Movements IN vs OUT donut
const movSeries = computed(() => {
  const inn = num(movements.value.totalIn);
  const out = num(movements.value.totalOut);
  return inn === 0 && out === 0 ? [] : [inn, out];
});
const optMovDonut = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "donut" },
  labels: ["Entradas (IN)", "Salidas (OUT)"],
  colors: ["#00E396", "#FF4560"],
  stroke: { width: 0 },
  plotOptions: { pie: { donut: { size: "68%", labels: { show: true, total: { show: true, label: "Neto", formatter: () => money(movements.value.net) } } } } },
  legend: { show: true, position: "bottom", labels: { colors: "rgba(var(--v-theme-on-surface), 0.75)" } },
  tooltip: { theme: "dark", y: { formatter: v => money(v) } },
}));

// Movements by day
const seriesMovByDay = computed(() => [
  { name: "Entradas", data: movByDay.value.map(r => num(r.totalIn)), color: "#00E396" },
  { name: "Salidas", data: movByDay.value.map(r => num(r.totalOut)), color: "#FF4560" },
]);
const optMovByDay = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar", stacked: false },
  plotOptions: { bar: { columnWidth: "70%", borderRadius: 3 } },
  dataLabels: { enabled: false },
  xaxis: { categories: movByDay.value.map(r => r.day?.slice(5) || ""), labels: { style: { ...axisStyle, fontSize: "9px" }, rotate: -45 }, axisBorder, axisTicks: axisBorder },
  yaxis: { labels: { style: axisStyle, formatter: v => `$${Math.round(Number(v||0) / 1000)}k` } },
  legend: { show: true, position: "top", labels: { colors: "rgba(var(--v-theme-on-surface), 0.7)" } },
  tooltip: { theme: "dark", y: { formatter: money } },
}));

// Differences by branch
const seriesDiffByBranch = computed(() => [
  { name: "Sobrante", data: diffByBranch.value.map(r => num(r.surplusCount)), color: "#00E396" },
  { name: "Exacto", data: diffByBranch.value.map(r => num(r.exactCount)), color: "#008FFB" },
  { name: "Faltante", data: diffByBranch.value.map(r => num(r.deficitCount)), color: "#FF4560" },
]);
const optDiffByBranch = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar", stacked: true },
  plotOptions: { bar: { columnWidth: "60%", borderRadius: 4 } },
  dataLabels: { enabled: false },
  xaxis: { categories: diffByBranch.value.map(r => r.branch_name || `Suc. #${r.branch_id}`), labels: { style: axisStyle }, axisBorder, axisTicks: axisBorder },
  yaxis: { labels: { style: axisStyle } },
  legend: { show: true, position: "top", labels: { colors: "rgba(var(--v-theme-on-surface), 0.7)" } },
  tooltip: { theme: "dark", y: { formatter: (v, { seriesIndex, dataPointIndex }) => {
    const r = diffByBranch.value[dataPointIndex];
    return `${v} sesiones · Diff prom: ${money(r?.avgDiff)}`;
  } } },
}));

// Duration radialBar
const optDuration = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "radialBar" },
  plotOptions: {
    radialBar: {
      hollow: { size: "60%" },
      dataLabels: { show: false },
      track: { background: "rgba(var(--v-theme-on-surface), 0.08)" },
    },
  },
  fill: { colors: ["#008FFB"] },
  stroke: { lineCap: "round" },
}));

// Open/Close comparison (sessions.totalOpening vs sessions.totalClosing per branch)
const closedSessionsAgg = computed(() => diffByBranch.value.filter(r => r.sessions > 0));
const seriesOpenClose = computed(() => [
  { name: "Apertura total", data: closedSessionsAgg.value.map(() => num(sessions.value.totalOpening) / Math.max(closedSessionsAgg.value.length, 1)), color: "#008FFB" },
  { name: "Cierre total", data: closedSessionsAgg.value.map(() => num(sessions.value.totalClosing) / Math.max(closedSessionsAgg.value.length, 1)), color: "#00E396" },
]);
const optOpenClose = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  plotOptions: { bar: { columnWidth: "55%", borderRadius: 5 } },
  dataLabels: { enabled: false },
  xaxis: {
    categories: closedSessionsAgg.value.map(r => r.branch_name || `Suc #${r.branch_id}`),
    labels: { style: axisStyle },
    axisBorder, axisTicks: axisBorder,
  },
  yaxis: { labels: { style: axisStyle, formatter: v => `$${Math.round(Number(v||0)/1000)}k` } },
  legend: { show: true, position: "top", labels: { colors: "rgba(var(--v-theme-on-surface), 0.7)" } },
  tooltip: { theme: "dark", y: { formatter: money } },
}));

// Table headers
const sessionHeaders = [
  { title: "#", key: "id", sortable: true, width: 70 },
  { title: "Sucursal", key: "branch_name", sortable: false, width: 120 },
  { title: "Estado", key: "status", sortable: false, width: 90 },
  { title: "Apertura", key: "opening_cash", sortable: true, width: 110 },
  { title: "Cierre", key: "closing_cash", sortable: true, width: 110 },
  { title: "Diferencia", key: "difference_cash", sortable: true, width: 110 },
  { title: "Duración", key: "duration", sortable: false, width: 90 },
];
</script>

<style scoped>
.dcash { display: flex; flex-direction: column; gap: 0; }

.cash-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  border-radius: 16px !important;
  overflow: hidden;
}

.cash-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 12px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.cash-title {
  font-weight: 900;
  letter-spacing: -0.01em;
  font-size: 13.5px;
  color: rgb(var(--v-theme-on-surface));
}
.cash-sub {
  margin-top: 3px;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.50);
  font-weight: 600;
}

.cash-right { display: flex; align-items: center; gap: 10px; }
.cash-period { min-width: 180px; }
.cash-body { padding: 0; }

.chip-soft { border: 1px solid rgba(var(--v-theme-on-surface), 0.10); }
.minw-0 { min-width: 0; }

.empty-state {
  padding: 32px 20px;
  text-align: center;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  font-weight: 600;
}

.reason-row {
  display: flex;
  align-items: center;
  padding: 7px 6px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  font-size: 12px;
}
.reason-row:last-child { border-bottom: none; }
.reason-label { flex: 1; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.8); }
.reason-value { font-weight: 800; font-size: 12.5px; }
.reason-cnt { color: rgba(var(--v-theme-on-surface), 0.5); }

.dash-table :deep(.v-table__wrapper),
.dash-table :deep(table),
.dash-table :deep(.v-data-table__wrapper) {
  background: transparent !important;
}

:deep(.v-select .v-field__input) {
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}
</style>
