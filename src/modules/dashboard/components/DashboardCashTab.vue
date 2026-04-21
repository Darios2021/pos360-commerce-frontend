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

    <!-- Row 2: Historial completo de sesiones de caja -->
    <v-row dense>
      <v-col cols="12">
        <v-card class="cash-card" elevation="0">
          <div class="cash-head">
            <div class="minw-0">
              <div class="cash-title">Historial de sesiones de caja</div>
              <div class="cash-sub">Auditoría · cajero · horarios · IP · estado arqueo</div>
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
                    <v-chip size="x-small" variant="tonal" color="primary" class="mt-1" style="font-size:9px">
                      {{ cajaTypeLabel(item.caja_type) }}
                    </v-chip>
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
                  <span class="text-medium-emphasis text-caption">
                    {{ item.duration_min ? formatMinutes(item.duration_min) : '—' }}
                  </span>
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
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
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
  { title: "Último mes",      value: "30d" },
  { title: "Últimos 3 meses", value: "90d" },
  { title: "Último año",      value: "12m" },
  { title: "Desde siempre",   value: "all" },
];

// ── helpers ───────────────────────────────────────────────────────────────────
function num(v) { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; }
function money(val) {
  const n = Number(val || 0);
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `$ ${Math.round(n)}`;
  }
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

// ── data ──────────────────────────────────────────────────────────────────────
const ana       = computed(() => props.analytics || {});
const sessions  = computed(() => ana.value?.sessions  || { total: 0, open: 0, closed: 0, avgDurationMin: 0, totalOpening: 0, totalClosing: 0, totalDifference: 0, totalDeficit: 0, totalSurplus: 0 });
const movements = computed(() => ana.value?.movements || { totalIn: 0, totalOut: 0, countIn: 0, countOut: 0, net: 0 });
const lastSessions = computed(() => Array.isArray(ana.value?.lastSessions) ? ana.value.lastSessions : []);

// ── table headers ─────────────────────────────────────────────────────────────
const sessionHeaders = [
  { title: "#",           key: "id",              sortable: true,  width: 60  },
  { title: "Estado",      key: "status",          sortable: false, width: 85  },
  { title: "Cajero",      key: "opened_by",       sortable: false, width: 140 },
  { title: "Sucursal",    key: "branch_name",     sortable: false, width: 150 },
  { title: "Apertura",    key: "opened_at",       sortable: true,  width: 145 },
  { title: "Cierre",      key: "closed_at",       sortable: true,  width: 145 },
  { title: "Arqueo",      key: "difference_cash", sortable: true,  width: 160 },
  { title: "Duración",    key: "duration_min",    sortable: false, width: 90  },
  { title: "IP apertura", key: "opening_ip",      sortable: false, width: 130 },
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
.minw-0 { min-width: 0; }

/* ── Sessions table ──────────────────────────────────────────────────────── */
.dash-table :deep(.v-table__wrapper),
.dash-table :deep(table),
.dash-table :deep(.v-data-table__wrapper) {
  background: transparent !important;
}
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

:deep(.v-select .v-field__input) {
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}
</style>
