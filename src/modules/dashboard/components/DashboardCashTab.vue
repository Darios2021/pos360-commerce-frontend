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

    <!-- Row 2: Movimientos por día (8) + Por razón (4) -->
    <v-row dense>
      <v-col cols="12" lg="8">
        <v-card class="cash-card" elevation="0">
          <div class="cash-head">
            <div class="minw-0">
              <div class="cash-title">Movimientos de efectivo por día</div>
              <div class="cash-sub">Entradas y salidas diarias · {{ periodLabel }}</div>
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

    <!-- Row 3: Historial completo de sesiones de caja -->
    <v-row dense class="mt-2">
      <v-col cols="12">
        <v-card class="cash-card" elevation="0">
          <div class="cash-head">
            <div class="minw-0">
              <div class="cash-title">Historial de sesiones de caja</div>
              <div class="cash-sub">Auditoría · cajero · horarios · IP · estado arqueo</div>
            </div>
          </div>
          <v-divider />
          <v-card-text class="pa-0">
            <div v-if="loading" class="py-8 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else>
              <v-data-table
                :headers="sessionHeaders"
                :items="lastSessions"
                density="compact"
                class="elevation-0 dash-table sessions-table"
                :sort-by="[{ key: 'id', order: 'desc' }]"
              >
                <!-- # -->
                <template #item.id="{ item }">
                  <span class="font-weight-bold text-primary">#{{ item.id }}</span>
                </template>

                <!-- Estado -->
                <template #item.status="{ item }">
                  <v-chip size="x-small" :color="item.status === 'OPEN' ? 'warning' : 'success'" variant="flat">
                    {{ item.status === 'OPEN' ? 'Abierta' : 'Cerrada' }}
                  </v-chip>
                </template>

                <!-- Cajero -->
                <template #item.opened_by="{ item }">
                  <div class="sess-user">
                    <v-icon size="13" class="mr-1 text-medium-emphasis">mdi-account-outline</v-icon>
                    <span>{{ item.opened_by || '—' }}</span>
                  </div>
                </template>

                <!-- Sucursal + tipo caja -->
                <template #item.branch_name="{ item }">
                  <div>
                    <div class="font-weight-medium" style="font-size:12px">{{ item.branch_name }}</div>
                    <v-chip size="x-small" variant="tonal" color="primary" class="mt-1" style="font-size:9px">{{ cajaTypeLabel(item.caja_type) }}</v-chip>
                  </div>
                </template>

                <!-- Apertura: hora + monto -->
                <template #item.opened_at="{ item }">
                  <div class="sess-datetime">
                    <span class="sess-date">{{ fmtDate(item.opened_at) }}</span>
                    <span class="sess-time">{{ fmtTime(item.opened_at) }}</span>
                    <span class="sess-amount">{{ money(item.opening_cash) }}</span>
                  </div>
                </template>

                <!-- Cierre: hora + monto -->
                <template #item.closed_at="{ item }">
                  <div v-if="item.closed_at" class="sess-datetime">
                    <span class="sess-date">{{ fmtDate(item.closed_at) }}</span>
                    <span class="sess-time">{{ fmtTime(item.closed_at) }}</span>
                    <span class="sess-amount">{{ item.closing_cash > 0 ? money(item.closing_cash) : '—' }}</span>
                  </div>
                  <span v-else class="text-medium-emphasis">—</span>
                </template>

                <!-- Estado arqueo -->
                <template #item.difference_cash="{ item }">
                  <template v-if="item.status === 'OPEN'">
                    <v-chip size="x-small" variant="tonal" color="warning">En curso</v-chip>
                  </template>
                  <template v-else-if="item.difference_cash === 0">
                    <v-chip size="x-small" variant="tonal" color="success">
                      <v-icon start size="11">mdi-check-circle</v-icon>OK
                    </v-chip>
                  </template>
                  <template v-else-if="item.difference_cash < 0">
                    <v-chip size="x-small" variant="tonal" color="error">
                      <v-icon start size="11">mdi-arrow-down-circle</v-icon>
                      Faltante {{ money(Math.abs(item.difference_cash)) }}
                    </v-chip>
                  </template>
                  <template v-else>
                    <v-chip size="x-small" variant="tonal" color="warning">
                      <v-icon start size="11">mdi-arrow-up-circle</v-icon>
                      Sobrante {{ money(item.difference_cash) }}
                    </v-chip>
                  </template>
                </template>

                <!-- Duración -->
                <template #item.duration_min="{ item }">
                  <span class="text-medium-emphasis text-caption">{{ item.duration_min ? formatMinutes(item.duration_min) : '—' }}</span>
                </template>

                <!-- IP -->
                <template #item.opening_ip="{ item }">
                  <span v-if="item.opening_ip" class="sess-ip">{{ item.opening_ip }}</span>
                  <span v-else class="text-medium-emphasis">—</span>
                </template>

                <template #bottom />
              </v-data-table>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row 4: Regularidad de caja abierta -->
    <v-row dense class="mt-2">
      <v-col cols="12">
        <v-card class="cash-card" elevation="0">
          <div class="cash-head">
            <div class="minw-0">
              <div class="cash-title">Regularidad de caja abierta</div>
              <div class="cash-sub">Horas con caja activa por día · {{ periodLabel }}</div>
            </div>
            <v-chip v-if="horasCajaAbierta.length" size="small" variant="tonal" class="chip-soft">
              Promedio {{ avgHorasOpen }}h/día
            </v-chip>
          </div>
          <v-divider />
          <div class="cash-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!horasCajaAbierta.length" class="empty-state">Sin datos en el período.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="200" type="area" :options="optHorasCaja" :series="seriesHorasCaja" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row 5: Comportamiento de cajeros -->
    <v-row dense class="mt-2">
      <v-col cols="12">
        <v-card class="cash-card" elevation="0">
          <div class="cash-head">
            <div class="minw-0">
              <div class="cash-title">Comportamiento de cajeros</div>
              <div class="cash-sub">Horario típico de apertura y cierre · consistencia horaria</div>
            </div>
          </div>
          <v-divider />
          <div class="cash-body">
            <div v-if="loading" class="py-8 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!cajeroStats.length" class="empty-state">Sin datos de cajeros en el período.</div>
            <v-row v-else no-gutters>
              <!-- rangeBar apertura → cierre -->
              <v-col cols="12" lg="8" class="cajero-chart-col">
                <ApexChart
                  :height="Math.max(180, cajeroRangeData.length * 48 + 70)"
                  type="rangeBar"
                  :options="optCajeroRange"
                  :series="seriesCajeroRange"
                />
              </v-col>
              <!-- Stats por cajero -->
              <v-col cols="12" lg="4" class="cajero-stats-col">
                <div class="cajero-table-wrap">
                  <div v-for="c in cajeroStats" :key="c.cajero_name" class="cajero-row">
                    <div class="cajero-row__header">
                      <v-icon size="14" class="mr-1 text-medium-emphasis">mdi-account-outline</v-icon>
                      <span class="cajero-row__name">{{ c.cajero_name }}</span>
                      <span class="cajero-row__sessions ml-auto">{{ c.sessions }} ses.</span>
                    </div>
                    <div class="cajero-row__times">
                      <span class="cajero-time-badge open">
                        <v-icon size="10">mdi-door-open</v-icon>
                        {{ c.avg_open_min != null ? minToTime(c.avg_open_min) : '—' }}
                      </span>
                      <v-icon size="11" class="mx-1 text-medium-emphasis">mdi-arrow-right</v-icon>
                      <span class="cajero-time-badge close">
                        <v-icon size="10">mdi-door-closed</v-icon>
                        {{ c.avg_close_min != null ? minToTime(c.avg_close_min) : '—' }}
                      </span>
                      <span class="cajero-row__dur ml-auto">{{ c.avg_duration_min ? formatMinutes(c.avg_duration_min) : '—' }}</span>
                    </div>
                    <div class="cajero-row__chips mt-1">
                      <v-chip size="x-small" :color="consistencyColor(c)" variant="tonal">
                        <v-icon start size="10">{{ consistencyIcon(c) }}</v-icon>
                        {{ consistencyLabel(c) }}
                      </v-chip>
                    </div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row 6: Duración promedio radialBar + Opening/Closing overview -->
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

// ── helpers ──────────────────────────────────────────────────────────────────
function num(v) { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; }
function money(val) {
  const n = Number(val || 0);
  try { return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n); }
  catch { return `$ ${Math.round(n)}`; }
}
function formatMinutes(min) {
  const m = Math.round(num(min));
  if (m < 60) return `${m} min`;
  if (m < 1440) {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  }
  const d = Math.floor(m / 1440);
  const hRem = Math.floor((m % 1440) / 60);
  return hRem > 0 ? `${d}d ${hRem}h` : `${d}d`;
}
function minToTime(min) {
  const m = Math.round(num(min));
  const h = Math.floor(m / 60) % 24;
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// ── data sources ─────────────────────────────────────────────────────────────
const ana = computed(() => props.analytics || {});
const sessions = computed(() => ana.value?.sessions || { total: 0, open: 0, closed: 0, avgDurationMin: 0, totalOpening: 0, totalClosing: 0, totalDifference: 0, totalDeficit: 0, totalSurplus: 0 });
const movements = computed(() => ana.value?.movements || { totalIn: 0, totalOut: 0, countIn: 0, countOut: 0, net: 0 });
const movByDay = computed(() => Array.isArray(ana.value?.movementsByDay) ? ana.value.movementsByDay : []);
const movByReason = computed(() => Array.isArray(ana.value?.movementsByReason) ? ana.value.movementsByReason : []);
const diffByBranch = computed(() => Array.isArray(ana.value?.differenceByBranch) ? ana.value.differenceByBranch : []);
const lastSessions = computed(() => Array.isArray(ana.value?.lastSessions) ? ana.value.lastSessions : []);
const cajeroStats = computed(() => Array.isArray(ana.value?.cajeroStats) ? ana.value.cajeroStats : []);
const horasCajaAbierta = computed(() => Array.isArray(ana.value?.horasCajaAbierta) ? ana.value.horasCajaAbierta : []);

// ── Apex common ───────────────────────────────────────────────────────────────
const apexCommon = {
  chart: { background: "transparent", fontFamily: "inherit", toolbar: { show: false } },
  theme: { mode: "dark" },
  grid: { borderColor: "rgba(255,255,255,0.06)", strokeDashArray: 3 },
};
const axisStyle = { colors: "rgba(var(--v-theme-on-surface), 0.60)" };
const axisBorder = { show: false };

// ── Movimientos por día ───────────────────────────────────────────────────────
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

// ── Duration radialBar ────────────────────────────────────────────────────────
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

// ── Open/Close comparison ─────────────────────────────────────────────────────
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

// ── Regularidad de caja (horas abiertas por día) ──────────────────────────────
const avgHorasOpen = computed(() => {
  if (!horasCajaAbierta.value.length) return 0;
  const sum = horasCajaAbierta.value.reduce((a, r) => a + num(r.hours_open), 0);
  return (sum / horasCajaAbierta.value.length).toFixed(1);
});
const seriesHorasCaja = computed(() => [{
  name: "Horas abiertas",
  data: horasCajaAbierta.value.map(r => num(r.hours_open)),
}]);
const optHorasCaja = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "area" },
  colors: ["#00B4D8"],
  dataLabels: { enabled: false },
  stroke: { curve: "smooth", width: 2 },
  fill: { type: "gradient", gradient: { opacityFrom: 0.35, opacityTo: 0.03, shadeIntensity: 1 } },
  xaxis: {
    categories: horasCajaAbierta.value.map(r => r.day?.slice(5) || ""),
    labels: { style: { ...axisStyle, fontSize: "9px" }, rotate: -45 },
    axisBorder, axisTicks: axisBorder,
  },
  yaxis: {
    min: 0,
    labels: { style: axisStyle, formatter: v => `${Number(v).toFixed(0)}h` },
  },
  annotations: {
    yaxis: [{
      y: 8,
      borderColor: "rgba(255,255,255,0.15)",
      strokeDashArray: 5,
      label: {
        text: "8h",
        style: { color: "rgba(255,255,255,0.4)", fontSize: "10px", background: "transparent", cssClass: "apx-annot" },
        position: "left",
      },
    }],
  },
  tooltip: { theme: "dark", y: { formatter: v => `${v}h abiertas` } },
}));

// ── Comportamiento de cajeros (rangeBar) ──────────────────────────────────────
const cajeroRangeData = computed(() =>
  cajeroStats.value
    .filter(c => c.avg_open_min != null && c.avg_close_min != null && c.avg_close_min > c.avg_open_min)
    .map(c => ({ x: c.cajero_name, y: [Math.round(c.avg_open_min), Math.round(c.avg_close_min)] }))
);
const seriesCajeroRange = computed(() => [{ name: "Horario típico", data: cajeroRangeData.value }]);
const optCajeroRange = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "rangeBar" },
  colors: ["#7C3AED"],
  plotOptions: {
    bar: {
      horizontal: true,
      barHeight: "40%",
      rangeBarGroupRows: false,
    },
  },
  dataLabels: {
    enabled: true,
    formatter: (_val, { w, dataPointIndex }) => {
      const d = w.config.series[0]?.data?.[dataPointIndex];
      if (!d) return "";
      return `${minToTime(d.y[0])} → ${minToTime(d.y[1])}`;
    },
    style: { fontSize: "11px", colors: ["#fff"], fontWeight: 600 },
  },
  xaxis: {
    type: "numeric",
    min: 0,
    max: 1440,
    tickAmount: 8,
    labels: {
      style: { ...axisStyle, fontSize: "9px" },
      formatter: v => minToTime(v),
    },
    axisBorder, axisTicks: axisBorder,
  },
  yaxis: {
    labels: { style: { ...axisStyle, fontSize: "12px", fontWeight: 600 } },
  },
  grid: { ...apexCommon.grid, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
  tooltip: {
    theme: "dark",
    custom: ({ seriesIndex, dataPointIndex, w }) => {
      const d = w.config.series[seriesIndex]?.data?.[dataPointIndex];
      if (!d) return "";
      const dur = d.y[1] - d.y[0];
      return `<div style="padding:8px 12px;font-size:12px"><strong>${d.x}</strong><br/>Apertura: ${minToTime(d.y[0])}<br/>Cierre: ${minToTime(d.y[1])}<br/>Duración típica: ${formatMinutes(dur)}</div>`;
    },
  },
}));

// Consistencia horaria
function consistencyLabel(c) {
  if (c.sessions < 2) return "1 sesión";
  const s = num(c.stddev_open_min);
  if (s < 20) return "Muy puntual";
  if (s < 45) return "Regular";
  return "Variable";
}
function consistencyColor(c) {
  if (c.sessions < 2) return "default";
  const s = num(c.stddev_open_min);
  if (s < 20) return "success";
  if (s < 45) return "info";
  return "warning";
}
function consistencyIcon(c) {
  if (c.sessions < 2) return "mdi-minus";
  const s = num(c.stddev_open_min);
  if (s < 20) return "mdi-clock-check-outline";
  if (s < 45) return "mdi-clock-outline";
  return "mdi-clock-alert-outline";
}

// ── Table headers ─────────────────────────────────────────────────────────────
const sessionHeaders = [
  { title: "#",          key: "id",              sortable: true,  width: 60  },
  { title: "Estado",     key: "status",          sortable: false, width: 85  },
  { title: "Cajero",     key: "opened_by",       sortable: false, width: 140 },
  { title: "Sucursal",   key: "branch_name",     sortable: false, width: 150 },
  { title: "Apertura",   key: "opened_at",       sortable: true,  width: 145 },
  { title: "Cierre",     key: "closed_at",       sortable: true,  width: 145 },
  { title: "Arqueo",     key: "difference_cash", sortable: true,  width: 160 },
  { title: "Duración",   key: "duration_min",    sortable: false, width: 90  },
  { title: "IP apertura",key: "opening_ip",      sortable: false, width: 130 },
];

// ── date/time helpers ─────────────────────────────────────────────────────────
function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
function fmtTime(v) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d)) return "";
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}
const cajaTypeMap = { GENERAL: "General", SHIFT: "Turno", BRANCH: "Sucursal", MOBILE: "Móvil" };
function cajaTypeLabel(t) { return cajaTypeMap[t] || t || "General"; }
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

/* ── Sessions table ──────────────────────────────────────────────────────── */
.sessions-table :deep(th) {
  font-size: 10px !important;
  font-weight: 800 !important;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .5) !important;
  white-space: nowrap;
}
.sessions-table :deep(td) { font-size: 12px !important; }

.sess-datetime {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 3px 0;
}
.sess-date   { font-size: 11px; color: rgba(var(--v-theme-on-surface), .55); }
.sess-time   { font-size: 13px; font-weight: 700; line-height: 1.2; }
.sess-amount { font-size: 11px; color: rgba(var(--v-theme-on-surface), .6); margin-top: 1px; }

.sess-user {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
}

.sess-ip {
  font-family: monospace;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), .6);
  background: rgba(var(--v-theme-on-surface), .05);
  padding: 2px 6px;
  border-radius: 4px;
}

/* ── Cajero behavior ─────────────────────────────────────────────────────── */
.cajero-chart-col {
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  padding: 12px 8px 8px;
}
.cajero-stats-col {
  padding: 8px 12px;
}
.cajero-table-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cajero-row {
  padding: 10px 8px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.025);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  margin-bottom: 6px;
}
.cajero-row:last-child { margin-bottom: 0; }

.cajero-row__header {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}
.cajero-row__name {
  font-size: 12.5px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}
.cajero-row__sessions {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  font-weight: 600;
  white-space: nowrap;
}
.cajero-row__times {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 4px;
}
.cajero-time-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 6px;
  font-variant-numeric: tabular-nums;
}
.cajero-time-badge.open {
  background: rgba(0, 180, 216, 0.12);
  color: #00B4D8;
}
.cajero-time-badge.close {
  background: rgba(124, 58, 237, 0.12);
  color: #7C3AED;
}
.cajero-row__dur {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  font-weight: 600;
  white-space: nowrap;
}

:deep(.v-select .v-field__input) {
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}
</style>
