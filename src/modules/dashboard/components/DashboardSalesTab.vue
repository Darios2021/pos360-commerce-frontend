<template>
  <div class="dsales">
    <!-- Row 1: 6 KPIs -->
    <v-row dense class="mb-3">
      <v-col cols="12" sm="6" md="4" xl="2">
        <KpiCard
          title="Ventas hoy"
          :value="String(num(today.count))"
          :loading="loading"
          icon="mdi-receipt-text-outline"
          tone="primary"
          :sub="`Semana: ${num(week.count)} transacciones`"
        />
      </v-col>
      <v-col cols="12" sm="6" md="4" xl="2">
        <KpiCard
          title="Total hoy"
          :value="money(today.total)"
          :loading="loading"
          icon="mdi-cash-multiple"
          tone="success"
          :sub="`Promedio: ${money(today.avgTicket)}`"
        />
      </v-col>
      <v-col cols="12" sm="6" md="4" xl="2">
        <KpiCard
          title="Total semana"
          :value="money(week.total)"
          :loading="loading"
          icon="mdi-calendar-week"
          tone="info"
          :sub="trendWeekSub"
        />
      </v-col>
      <v-col cols="12" sm="6" md="4" xl="2">
        <KpiCard
          title="Total mes"
          :value="money(month.total)"
          :loading="loading"
          icon="mdi-calendar-month"
          tone="indigo"
          :sub="trendMonthSub"
        />
      </v-col>
      <v-col cols="12" sm="6" md="4" xl="2">
        <KpiCard
          :title="`Ticket promedio (${periodLabelShort})`"
          :value="money(avgTicketPeriod)"
          :loading="loading"
          icon="mdi-ticket-percent-outline"
          tone="warning"
          :sub="`${nonZeroDays} días con ventas`"
        />
      </v-col>
      <v-col cols="12" sm="6" md="4" xl="2">
        <KpiCard
          :title="`Mejor mes (${periodLabelShort})`"
          :value="bestMonthLabel"
          :sub="bestMonthSub"
          :loading="loading"
          icon="mdi-calendar-star"
          tone="deep-orange"
        />
      </v-col>
    </v-row>

    <!-- Row 2: Timeline (8) + Payment Method Donut Period (4) -->
    <v-row dense>
      <v-col cols="12" lg="8">
        <v-card class="ds-card" elevation="0">
          <div class="ds-head">
            <div class="minw-0">
              <div class="ds-title">Ventas en el tiempo</div>
              <div class="ds-sub">{{ periodLabel }} · {{ scopeLabelChip }}</div>
            </div>
            <div class="ds-right">
              <v-chip size="small" variant="tonal" class="chip-soft">
                Pico: <b class="ml-1">{{ money(peakMax) }}</b>
                <span class="ml-1 opacity-70">({{ peakDateFmt }})</span>
              </v-chip>
              <v-select
                v-model="periodLocal"
                :items="periodItems"
                item-title="title"
                item-value="value"
                density="compact"
                variant="outlined"
                hide-details
                class="ds-period"
                @update:modelValue="emitPeriod"
              />
            </div>
          </div>
          <v-divider />
          <div class="ds-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!timelinePoints.length" class="empty-state">Sin datos para graficar.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="300" type="line" :options="optTimeline" :series="seriesTimeline" />
              <div class="ds-foot">
                <span>Promedio/día: <b>{{ money(avgPerDay) }}</b></span>
                <span class="sep">·</span>
                <span>Días activos: <b>{{ nonZeroDays }}</b> / {{ timelinePoints.length }}</span>
                <span class="sep">·</span>
                <span>Total: <b>{{ money(periodTotal) }}</b></span>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="ds-card" elevation="0">
          <div class="ds-head">
            <div class="minw-0">
              <div class="ds-title">Medios de pago</div>
              <div class="ds-sub">Composición ({{ periodLabel }})</div>
            </div>
            <v-chip size="small" variant="tonal" class="chip-soft">
              {{ money(paymentPeriodTotal) }}
            </v-chip>
          </div>
          <v-divider />
          <div class="ds-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!paymentPeriodSeries.length" class="empty-state">Sin datos.</div>
            <div v-else>
              <ApexChart height="300" type="donut" :options="optPaymentDonut" :series="paymentPeriodSeries" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row 3: Monthly Bar (6) + Hourly Bar (6) -->
    <v-row dense class="mt-2">
      <v-col cols="12" lg="6">
        <v-card class="ds-card" elevation="0">
          <div class="ds-head">
            <div class="minw-0">
              <div class="ds-title">Ventas por mes</div>
              <div class="ds-sub">Evolución mensual · {{ periodLabel }}</div>
            </div>
            <v-chip size="small" variant="tonal" class="chip-soft">
              Mejor: <b class="ml-1">{{ bestMonthLabel }}</b>
            </v-chip>
          </div>
          <v-divider />
          <div class="ds-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!monthsAgg.length" class="empty-state">Sin datos mensuales.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="280" type="bar" :options="optMonthsBar" :series="seriesMonths" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6">
        <v-card class="ds-card" elevation="0">
          <div class="ds-head">
            <div class="minw-0">
              <div class="ds-title">Distribución horaria</div>
              <div class="ds-sub">Ventas por hora del día · {{ periodLabel }}</div>
            </div>
            <v-chip v-if="peakHour !== null" size="small" variant="tonal" class="chip-soft">
              Pico: <b class="ml-1">{{ String(peakHour).padStart(2,'0') }}:00 hs</b>
            </v-chip>
          </div>
          <v-divider />
          <div class="ds-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!hourlyHasData" class="empty-state">Sin datos horarios.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="280" type="bar" :options="optHourly" :series="seriesHourly" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row 4: Top Cashiers (7) + Invoice Type (5) -->
    <v-row dense class="mt-2">
      <v-col cols="12" lg="7">
        <v-card class="ds-card" elevation="0">
          <div class="ds-head">
            <div class="minw-0">
              <div class="ds-title">Top 10 vendedores</div>
              <div class="ds-sub">Ranking por total vendido ({{ periodLabel }})</div>
            </div>
            <v-chip size="small" variant="tonal" class="chip-soft">
              {{ topCashiers10.length ? `${topCashiers10.length} registrados` : "Sin datos" }}
            </v-chip>
          </div>
          <v-divider />
          <div class="ds-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!topCashiers10.length" class="empty-state">Sin ventas por cajero.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="300" type="bar" :options="optCashiersBar" :series="seriesCashiers" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="5">
        <v-card class="ds-card" elevation="0">
          <div class="ds-head">
            <div class="minw-0">
              <div class="ds-title">Tipos de comprobante</div>
              <div class="ds-sub">Distribución ({{ periodLabel }})</div>
            </div>
            <v-chip size="small" variant="tonal" class="chip-soft">
              {{ invoiceTypeTotal }} ventas
            </v-chip>
          </div>
          <v-divider />
          <div class="ds-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!invoiceTypeSeries.length" class="empty-state">Sin datos.</div>
            <div v-else>
              <ApexChart height="300" type="donut" :options="optInvoiceType" :series="invoiceTypeSeries" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row 5: Top 10 Productos con toggle -->
    <v-row dense class="mt-2">
      <v-col cols="12">
        <v-card class="ds-card" elevation="0">
          <div class="ds-head">
            <div class="minw-0">
              <div class="ds-title">Top 10 productos más vendidos</div>
              <div class="ds-sub">{{ productToggle === 'total' ? 'Por total recaudado' : 'Por unidades vendidas' }} ({{ periodLabel }})</div>
            </div>
            <div class="ds-right">
              <v-btn-toggle v-model="productToggle" density="compact" variant="outlined" rounded="lg">
                <v-btn value="units" size="small">Unidades</v-btn>
                <v-btn value="total" size="small">$ Total</v-btn>
              </v-btn-toggle>
              <v-chip size="small" variant="tonal" class="chip-soft">
                {{ topProducts10.length ? "Ranking" : "Sin datos" }}
              </v-chip>
            </div>
          </div>
          <v-divider />
          <div class="ds-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!topProducts10.length" class="empty-state">Sin productos vendidos en el período.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="320" type="bar" :options="optProductsBar" :series="seriesProducts" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ══ ANALYTICS DEEP ══════════════════════════════════════════════════ -->

    <!-- Row A1: Heatmap Hora×Día (8) + Ticket Promedio por Día (4) -->
    <v-row dense class="mt-2">
      <v-col cols="12" lg="8">
        <v-card class="ds-card" elevation="0">
          <div class="ds-head">
            <div class="minw-0">
              <div class="ds-title">Mapa de actividad (hora × día)</div>
              <div class="ds-sub">Intensidad de ventas por horario · {{ periodLabel }}</div>
            </div>
            <v-chip v-if="loadingAnalytics" size="small" variant="tonal" class="chip-soft">Cargando…</v-chip>
          </div>
          <v-divider />
          <div class="ds-body">
            <div v-if="loadingAnalytics" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!heatmapHasData" class="empty-state">Sin datos de actividad horaria.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="260" type="heatmap" :options="optHeatmap" :series="heatmapData" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="ds-card" elevation="0">
          <div class="ds-head">
            <div class="minw-0">
              <div class="ds-title">Ticket promedio por día</div>
              <div class="ds-sub">Lunes a Domingo · {{ periodLabel }}</div>
            </div>
          </div>
          <v-divider />
          <div class="ds-body">
            <div v-if="loadingAnalytics" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!dowTicket.some(r => r.avgTicket > 0)" class="empty-state">Sin datos.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="260" type="bar" :options="optAvgDow" :series="seriesAvgDow" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row A2: Payment Trend (8) + Tax Condition (4) -->
    <v-row dense class="mt-2">
      <v-col cols="12" lg="8">
        <v-card class="ds-card" elevation="0">
          <div class="ds-head">
            <div class="minw-0">
              <div class="ds-title">Tendencia de medios de pago</div>
              <div class="ds-sub">Evolución mensual · últimos 12 meses</div>
            </div>
          </div>
          <v-divider />
          <div class="ds-body">
            <div v-if="loadingAnalytics" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!seriesPaymentTrend.length" class="empty-state">Sin datos de tendencia.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="280" type="bar" :options="optPaymentTrend" :series="seriesPaymentTrend" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="ds-card" elevation="0">
          <div class="ds-head">
            <div class="minw-0">
              <div class="ds-title">Condición fiscal del cliente</div>
              <div class="ds-sub">Distribución · {{ periodLabel }}</div>
            </div>
          </div>
          <v-divider />
          <div class="ds-body">
            <div v-if="loadingAnalytics" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!taxSeries.length" class="empty-state">Sin datos.</div>
            <div v-else>
              <ApexChart height="280" type="donut" :options="optTaxDonut" :series="taxSeries" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row A3: Top Clientes (7) + Descuentos y Devoluciones (5) -->
    <v-row dense class="mt-2">
      <v-col cols="12" lg="7">
        <v-card class="ds-card" elevation="0">
          <div class="ds-head">
            <div class="minw-0">
              <div class="ds-title">Top 10 clientes</div>
              <div class="ds-sub">Por total comprado · {{ periodLabel }}</div>
            </div>
            <v-chip v-if="topCustomers.length" size="small" variant="tonal" class="chip-soft">
              {{ topCustomers.length }} clientes
            </v-chip>
          </div>
          <v-divider />
          <div class="ds-body">
            <div v-if="loadingAnalytics" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!topCustomers.length" class="empty-state">Sin clientes con nombre registrado.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="300" type="bar" :options="optTopCustomers" :series="seriesTopCustomers" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="5">
        <v-card class="ds-card" elevation="0">
          <div class="ds-head">
            <div class="minw-0">
              <div class="ds-title">Descuentos · Devoluciones · Cancelados</div>
              <div class="ds-sub">Análisis del período</div>
            </div>
          </div>
          <v-divider />
          <div class="ds-body px-4 py-3">
            <div v-if="loadingAnalytics" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else class="ana-grid">
              <div class="ana-item">
                <div class="ana-label">Ventas con descuento</div>
                <div class="ana-value text-warning">{{ num(discounts.salesWithDiscount) }}</div>
                <div class="ana-sub">{{ money(discounts.totalDiscounted) }} descontados</div>
              </div>
              <div class="ana-item">
                <div class="ana-label">Descuento promedio</div>
                <div class="ana-value text-warning">{{ money(discounts.avgDiscount) }}</div>
                <div class="ana-sub">Máx: {{ money(discounts.maxDiscount) }}</div>
              </div>
              <div class="ana-item">
                <div class="ana-label">Devoluciones</div>
                <div class="ana-value text-error">{{ num(refunds.count) }}</div>
                <div class="ana-sub">{{ money(refunds.total) }} devueltos</div>
              </div>
              <div class="ana-item">
                <div class="ana-label">Canceladas</div>
                <div class="ana-value text-error">{{ num(cancelled.count) }}</div>
                <div class="ana-sub">{{ money(cancelled.total) }}</div>
              </div>
              <div class="ana-item">
                <div class="ana-label">Ítems por venta</div>
                <div class="ana-value text-primary">{{ Number(itemsStats.avgItemsPerSale || 0).toFixed(1) }}</div>
                <div class="ana-sub">Promedio de líneas</div>
              </div>
              <div class="ana-item">
                <div class="ana-label">Impuestos</div>
                <div class="ana-value text-info">{{ money(discounts.totalTax) }}</div>
                <div class="ana-sub">Total período</div>
              </div>
            </div>
            <div v-if="refunds.byMethod?.length" class="mt-3">
              <div class="ds-sub mb-2">Devoluciones por método</div>
              <div v-for="m in refunds.byMethod" :key="m.method" class="d-flex justify-space-between align-center py-1 border-bottom-subtle">
                <span class="text-body-2">{{ m.method }}</span>
                <span class="font-weight-bold text-body-2">{{ money(m.total) }}</span>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row 6: Branch Donut (4) + Last Sales (8) -->
    <v-row dense class="mt-2">
      <v-col cols="12" lg="4">
        <v-card class="ds-card" elevation="0">
          <div class="ds-head">
            <div class="minw-0">
              <div class="ds-title">Participación por sucursal</div>
              <div class="ds-sub">Últimos 30 días</div>
            </div>
            <v-chip size="small" variant="tonal" class="chip-soft">
              {{ money(branchTotalSum) }}
            </v-chip>
          </div>
          <v-divider />
          <div class="ds-body">
            <div v-if="loading" class="py-10 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else-if="!branchSeries.length" class="empty-state">Sin datos por sucursal.</div>
            <div v-else>
              <ApexChart height="300" type="donut" :options="optBranchDonut" :series="branchSeries" />
              <div class="px-4 pb-4 text-caption text-medium-emphasis">Tocá una porción para aislarla.</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="8">
        <v-card class="ds-card" elevation="0">
          <div class="ds-head">
            <div class="minw-0">
              <div class="ds-title">Últimas ventas</div>
              <div class="ds-sub">{{ scopeLabelChip }}</div>
            </div>
          </div>
          <v-divider />
          <v-card-text>
            <div v-if="loading" class="py-8 d-flex justify-center"><v-progress-circular indeterminate /></div>
            <div v-else>
              <v-data-table
                :headers="headers"
                :items="lastSales"
                item-key="id"
                density="comfortable"
                class="elevation-0 rounded-xl dash-table"
              >
                <template #item.id="{ item }">
                  <span class="font-weight-bold text-primary">#{{ item.id }}</span>
                </template>
                <template #item.sold_at="{ item }">
                  <span class="font-weight-medium">{{ dt(item.sold_at) }}</span>
                </template>
                <template #item.branch="{ item }">
                  <span class="text-body-2 font-weight-medium">
                    {{ item?.branch?.name || (item.branch_id ? `Sucursal #${item.branch_id}` : "—") }}
                  </span>
                </template>
                <template #item.user="{ item }">
                  <span class="text-body-2">
                    {{ item?.user?.label || item?.user?.name || item?.user?.username || "—" }}
                  </span>
                </template>
                <template #item.total="{ item }">
                  <div class="font-weight-black">{{ money(item.total) }}</div>
                  <div class="text-caption text-medium-emphasis">{{ methodLabel(item?.payments?.[0]?.method) }}</div>
                </template>
                <template #item.invoice_type="{ item }">
                  <v-chip size="x-small" variant="tonal" :color="invoiceColor(item.invoice_type)">
                    {{ item.invoice_type || "—" }}
                  </v-chip>
                </template>
                <template #bottom />
              </v-data-table>
              <div v-if="!lastSales.length" class="text-caption text-medium-emphasis mt-2">Sin ventas.</div>
            </div>
          </v-card-text>
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
  loadingAnalytics: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  scopeLabel: { type: String, default: "" },
  sales: { type: Object, default: () => ({}) },
  analytics: { type: Object, default: null },
  period: { type: String, default: "30d" },
});
const emit = defineEmits(["period-change"]);

const periodItems = [
  { title: "Último mes", value: "30d" },
  { title: "Últimos 3 meses", value: "90d" },
  { title: "Último año", value: "12m" },
  { title: "Desde siempre", value: "all" },
];

const periodLocal = ref(props.period || "30d");
const productToggle = ref("total");

watch(() => props.period, (v) => { if (v && v !== periodLocal.value) periodLocal.value = v; });
function emitPeriod(v) { emit("period-change", v); }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function num(v) { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; }
function money(val) {
  const n = Number(val || 0);
  try { return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n); }
  catch { return `$ ${Math.round(n)}`; }
}
function shortNumber(v) {
  const n = Number(v || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${Math.round(n)}`;
}
function dt(val) { if (!val) return "—"; return new Date(val).toLocaleString("es-AR"); }
function parseYMDToMs(ymd) {
  if (!ymd) return null;
  const s = String(ymd);
  if (s.length >= 10) {
    const y = Number(s.slice(0, 4)), m = Number(s.slice(5, 7)), d = Number(s.slice(8, 10));
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d).getTime();
  }
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : null;
}
function fmtDMFromMs(ms) {
  if (!ms) return "—";
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
}
function monthKey(ymd) { const s = String(ymd || ""); return s.length >= 7 ? s.slice(0, 7) : "—"; }
function monthLabel(ym) {
  if (!ym || ym === "—") return "—";
  const [y, m] = String(ym).split("-");
  return new Date(Number(y || 2000), Number(m || 1) - 1, 1).toLocaleDateString("es-AR", { year: "numeric", month: "long" });
}
function methodLabel(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "Efectivo";
  if (x === "CARD") return "Tarjeta";
  if (x === "TRANSFER") return "Transferencia";
  if (x === "QR") return "QR / Billetera";
  if (x === "OTHER") return "Otro";
  return x || "—";
}
function invoiceColor(t) {
  const x = String(t || "").toUpperCase();
  if (x === "A") return "blue";
  if (x === "B") return "green";
  if (x === "C") return "purple";
  if (x === "TICKET") return "orange";
  return "grey";
}
function pctSign(v) {
  const n = Number(v || 0);
  if (!n) return "";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

// ─── Period labels ─────────────────────────────────────────────────────────────
const periodLabel = computed(() => {
  if (periodLocal.value === "90d") return "Últimos 3 meses";
  if (periodLocal.value === "12m") return "Último año";
  if (periodLocal.value === "all") return "Histórico";
  return "Último mes";
});
const periodLabelShort = computed(() => {
  if (periodLocal.value === "90d") return "3m";
  if (periodLocal.value === "12m") return "12m";
  if (periodLocal.value === "all") return "Total";
  return "Mes";
});
const scopeLabelChip = computed(() => props.scopeLabel ? `Scope: ${props.scopeLabel}` : "");

// ─── Base data ─────────────────────────────────────────────────────────────────
const today = computed(() => props.sales?.today || { count: 0, total: 0, avgTicket: 0 });
const week = computed(() => props.sales?.week || { count: 0, total: 0 });
const month = computed(() => props.sales?.month || { count: 0, total: 0 });

const salesDaily = computed(() => {
  if (Array.isArray(props.sales?.salesByPeriodDaily)) return props.sales.salesByPeriodDaily;
  return Array.isArray(props.sales?.salesByDay30) ? props.sales.salesByDay30 : [];
});
const lastSales = computed(() => Array.isArray(props.sales?.lastSales) ? props.sales.lastSales : []);
const topBranch = computed(() => props.sales?.topBranchPeriod || props.sales?.topBranch30d || null);
const topCashiers = computed(() => {
  if (Array.isArray(props.sales?.topCashiersPeriod)) return props.sales.topCashiersPeriod;
  return Array.isArray(props.sales?.topCashiers30d) ? props.sales.topCashiers30d : [];
});
const topProducts = computed(() => {
  if (Array.isArray(props.sales?.topProductsPeriod)) return props.sales.topProductsPeriod;
  return Array.isArray(props.sales?.topProducts30d) ? props.sales.topProducts30d : [];
});
const bestMonth = computed(() => props.sales?.bestMonthPeriod || props.sales?.bestMonth12m || null);
const salesByHour = computed(() => Array.isArray(props.sales?.salesByHour) ? props.sales.salesByHour : []);
const salesByPaymentPeriod = computed(() => Array.isArray(props.sales?.salesByPaymentPeriod) ? props.sales.salesByPaymentPeriod : []);
const salesByInvoiceType = computed(() => Array.isArray(props.sales?.salesByInvoiceType) ? props.sales.salesByInvoiceType : []);

// ─── KPI computed ──────────────────────────────────────────────────────────────
const trendWeekSub = computed(() => {
  const p = pctSign(props.sales?.trend?.week_total_pct);
  return p ? `${p} vs semana anterior` : "";
});
const trendMonthSub = computed(() => {
  const p = pctSign(props.sales?.trend?.month_total_pct);
  return p ? `${p} vs mes anterior` : "";
});

// ─── Timeline ──────────────────────────────────────────────────────────────────
const timelinePoints = computed(() => {
  return (salesDaily.value || [])
    .map((x) => {
      const ms = parseYMDToMs(x?.date);
      return { date: x?.date, ms, total: num(x?.total), count: num(x?.count) };
    })
    .filter((p) => !!p.ms)
    .sort((a, b) => a.ms - b.ms);
});

const peakPoint = computed(() => timelinePoints.value.reduce((best, p) => (!best || p.total > best.total) ? p : best, null));
const peakMax = computed(() => Number(peakPoint.value?.total || 0));
const peakDateFmt = computed(() => fmtDMFromMs(peakPoint.value?.ms));
const avgPerDay = computed(() => {
  const arr = timelinePoints.value;
  if (!arr.length) return 0;
  return arr.reduce((a, p) => a + p.total, 0) / arr.length;
});
const nonZeroDays = computed(() => timelinePoints.value.filter((p) => p.total > 0).length);
const periodTotal = computed(() => timelinePoints.value.reduce((a, p) => a + p.total, 0));
const avgTicketPeriod = computed(() => {
  const total = periodTotal.value;
  const count = timelinePoints.value.reduce((a, p) => a + p.count, 0);
  return count > 0 ? total / count : 0;
});

const bestMonthLabel = computed(() => bestMonth.value ? monthLabel(bestMonth.value.ym) : "—");
const bestMonthSub = computed(() => {
  if (!bestMonth.value) return "";
  return `${money(bestMonth.value.total)} · ${num(bestMonth.value.count)} ventas`;
});

const seriesTimeline = computed(() => [
  { name: "Ventas (ARS)", type: "area", data: timelinePoints.value.map((p) => [p.ms, Math.round(p.total)]) },
  { name: "Transacciones", type: "line", data: timelinePoints.value.map((p) => [p.ms, p.count]) },
]);

const timelineTickAmount = computed(() => {
  const n = timelinePoints.value.length;
  if (n <= 14) return 6;
  if (n <= 35) return 8;
  if (n <= 90) return 10;
  return 12;
});

// ─── Payment Method Donut ──────────────────────────────────────────────────────
const paymentMethodColors = { CASH: "#00E396", CARD: "#008FFB", TRANSFER: "#775DD0", QR: "#26C6DA", OTHER: "#FEB019" };
const paymentPeriodSeries = computed(() => salesByPaymentPeriod.value.map((p) => Number(p.total || 0)));
const paymentPeriodLabels = computed(() => salesByPaymentPeriod.value.map((p) => p.label || methodLabel(p.method)));
const paymentPeriodColors = computed(() => salesByPaymentPeriod.value.map((p) => paymentMethodColors[p.method] || "#99AAB5"));
const paymentPeriodTotal = computed(() => salesByPaymentPeriod.value.reduce((a, p) => a + Number(p.total || 0), 0));

// ─── Hourly ────────────────────────────────────────────────────────────────────
const hourlyHasData = computed(() => salesByHour.value.some((h) => h.total > 0));
const seriesHourly = computed(() => [{ name: "Ventas (ARS)", data: salesByHour.value.map((h) => Math.round(h.total)) }]);
const hourLabels = computed(() => salesByHour.value.map((h) => `${String(h.hour).padStart(2, "0")}h`));
const peakHour = computed(() => {
  const arr = salesByHour.value;
  if (!arr.length) return null;
  const max = Math.max(...arr.map((h) => h.total));
  const found = arr.find((h) => h.total === max);
  return found && found.total > 0 ? found.hour : null;
});

// ─── Monthly Agg ──────────────────────────────────────────────────────────────
const monthsAgg = computed(() => {
  const map = new Map();
  for (const p of timelinePoints.value) {
    const ym = monthKey(p.date);
    if (ym === "—") continue;
    const prev = map.get(ym) || { ym, total: 0, count: 0 };
    prev.total += p.total;
    prev.count += p.count;
    map.set(ym, prev);
  }
  return Array.from(map.values()).filter((m) => m.ym).sort((a, b) => a.ym.localeCompare(b.ym));
});
const seriesMonths = computed(() => [{ name: "Total (ARS)", data: monthsAgg.value.map((m) => Math.round(m.total)) }]);
const monthsLabels = computed(() => monthsAgg.value.map((m) => monthLabel(m.ym)));

// ─── Top 10 Cashiers ──────────────────────────────────────────────────────────
const topCashiers10 = computed(() => [...(topCashiers.value || [])].sort((a, b) => Number(b.total || 0) - Number(a.total || 0)).slice(0, 10));
const cashierCats = computed(() => topCashiers10.value.map((x) => String(x?.user_label || x?.user_name || x?.name || (x?.user_id ? `User #${x.user_id}` : "—"))));
const seriesCashiers = computed(() => [
  { name: "Total (ARS)", data: topCashiers10.value.map((x) => Math.round(Number(x?.total || 0))) },
]);

// ─── Invoice Type Donut ───────────────────────────────────────────────────────
const invoiceTypeMap = { TICKET: "Ticket", A: "Factura A", B: "Factura B", C: "Factura C", M: "Factura M", NC: "Nota Crédito", ND: "Nota Débito", NO_FISCAL: "No Fiscal" };
const invoiceTypeColors = { TICKET: "#FEB019", B: "#00E396", A: "#008FFB", C: "#775DD0", M: "#FF4560", NC: "#26C6DA", ND: "#FF6B35", NO_FISCAL: "#99AAB5" };
const invoiceTypeSeries = computed(() => salesByInvoiceType.value.map((t) => Number(t.count || 0)));
const invoiceTypeLabels = computed(() => salesByInvoiceType.value.map((t) => invoiceTypeMap[t.invoice_type] || t.invoice_type));
const invoiceTypeColors_ = computed(() => salesByInvoiceType.value.map((t) => invoiceTypeColors[t.invoice_type] || "#99AAB5"));
const invoiceTypeTotal = computed(() => salesByInvoiceType.value.reduce((a, t) => a + Number(t.count || 0), 0));

// ─── Top 10 Products ──────────────────────────────────────────────────────────
const topProducts10 = computed(() => {
  const arr = [...(topProducts.value || [])].sort((a, b) => {
    if (productToggle.value === "units") return Number(b.units || 0) - Number(a.units || 0);
    return Number(b.total || 0) - Number(a.total || 0);
  });
  return arr.slice(0, 10);
});
const productCats = computed(() => topProducts10.value.map((x) => String(x?.product_name || x?.name || (x?.product_id ? `#${x.product_id}` : "—"))));
const seriesProducts = computed(() => {
  if (productToggle.value === "units") {
    return [{ name: "Unidades", data: topProducts10.value.map((x) => Number(x?.units || 0)) }];
  }
  return [{ name: "Total (ARS)", data: topProducts10.value.map((x) => Math.round(Number(x?.total || 0))) }];
});

// ─── Branch Donut ─────────────────────────────────────────────────────────────
const salesByBranch = computed(() => {
  if (Array.isArray(props.sales?.salesByBranchPeriod)) return props.sales.salesByBranchPeriod;
  const map = new Map();
  for (const s of lastSales.value) {
    const bid = s?.branch_id ?? s?.branch?.id ?? null;
    const name = s?.branch?.name || (bid ? `Sucursal #${bid}` : "—");
    const key = String(bid ?? name);
    const prev = map.get(key) || { branch_id: bid, branch_name: name, total: 0, count: 0 };
    prev.total += Number(s?.total || 0);
    prev.count += 1;
    map.set(key, prev);
  }
  return Array.from(map.values()).sort((a, b) => Number(b.total || 0) - Number(a.total || 0));
});
const branchTop = computed(() => salesByBranch.value.slice(0, 8));
const branchLabels = computed(() => branchTop.value.map((b) => b.branch_name || `Sucursal #${b.branch_id}`));
const branchSeries = computed(() => branchTop.value.map((b) => Number(b.total || 0)));
const branchTotalSum = computed(() => branchTop.value.reduce((a, b) => a + Number(b.total || 0), 0));

// ─── Apex Common ──────────────────────────────────────────────────────────────
const apexCommon = {
  chart: { toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: true, speed: 400 }, fontFamily: "inherit", foreColor: "rgba(var(--v-theme-on-surface), 0.75)" },
  grid: { borderColor: "rgba(var(--v-theme-on-surface), 0.08)", padding: { left: 12, right: 14, top: 6, bottom: 0 } },
  dataLabels: { enabled: false },
  legend: { labels: { colors: "rgba(var(--v-theme-on-surface), 0.75)" } },
};
const axisStyle = { colors: "rgba(var(--v-theme-on-surface), 0.60)" };
const axisBorder = { color: "rgba(var(--v-theme-on-surface), 0.12)" };

// ─── Chart Options ─────────────────────────────────────────────────────────────
const optTimeline = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "line" },
  colors: ["#008FFB", "#00E396"],
  stroke: { width: [3, 2], curve: "smooth", dashArray: [0, 4] },
  fill: {
    type: ["gradient", "solid"],
    gradient: { shade: "dark", type: "vertical", opacityFrom: 0.32, opacityTo: 0.04, stops: [0, 90, 100] },
  },
  markers: { size: [2, 0], strokeWidth: 2, strokeColors: ["#008FFB", "#00E396"], hover: { size: 5 } },
  xaxis: {
    type: "datetime",
    tickAmount: timelineTickAmount.value,
    labels: { style: axisStyle, datetimeUTC: false, formatter: (val) => fmtDMFromMs(Number(val)) },
    axisBorder, axisTicks: axisBorder,
    tooltip: { enabled: false },
  },
  yaxis: [
    { tickAmount: 5, labels: { style: axisStyle, formatter: (v) => shortNumber(v) } },
    { opposite: true, tickAmount: 5, labels: { style: axisStyle, formatter: (v) => `${Math.round(Number(v || 0))}` } },
  ],
  tooltip: {
    theme: "dark", shared: true,
    x: { formatter: (val) => new Date(Number(val)).toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit" }) },
    y: [
      { formatter: (v) => money(v) },
      { formatter: (v) => `${Math.round(Number(v || 0))} transacciones` },
    ],
  },
  legend: { show: true, position: "top", horizontalAlign: "right", labels: { colors: "rgba(var(--v-theme-on-surface), 0.75)" } },
  annotations: peakMax.value > 0 ? {
    points: [{ x: peakPoint.value?.ms, y: peakMax.value, marker: { size: 6 }, label: { text: `Pico ${money(peakMax.value)}`, style: { fontSize: "11px" } } }],
  } : {},
}));

const optPaymentDonut = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "donut" },
  labels: paymentPeriodLabels.value,
  colors: paymentPeriodColors.value,
  stroke: { width: 0 },
  plotOptions: {
    pie: { donut: { size: "68%", labels: { show: true, total: { show: true, label: "Total", formatter: () => money(paymentPeriodTotal.value) } } } },
  },
  legend: { show: true, position: "bottom", labels: { colors: "rgba(var(--v-theme-on-surface), 0.75)" } },
  tooltip: { theme: "dark", y: { formatter: (v) => `${money(v)} · ${paymentPeriodTotal.value ? Math.round((v / paymentPeriodTotal.value) * 100) : 0}%` } },
}));

const optMonthsBar = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  colors: ["#008FFB"],
  fill: { opacity: 1 },
  stroke: { show: false },
  plotOptions: { bar: { borderRadius: 6, columnWidth: "58%", dataLabels: { position: "top" } } },
  xaxis: { categories: monthsLabels.value, labels: { style: axisStyle, rotate: -15, trim: true }, axisBorder, axisTicks: axisBorder },
  yaxis: { labels: { style: axisStyle, formatter: (v) => shortNumber(v) } },
  tooltip: { theme: "dark", y: { formatter: (v) => money(v) } },
}));

const optHourly = computed(() => {
  const maxTotal = Math.max(...salesByHour.value.map((h) => h.total), 1);
  const colors = salesByHour.value.map((h) => {
    const ratio = h.total / maxTotal;
    if (ratio > 0.75) return "#008FFB";
    if (ratio > 0.40) return "#26A0FC";
    if (ratio > 0.10) return "#66C8FF";
    return "rgba(var(--v-theme-on-surface), 0.12)";
  });
  return {
    ...apexCommon,
    chart: { ...apexCommon.chart, type: "bar" },
    colors: ["#008FFB"],
    fill: { opacity: 1, colors },
    stroke: { show: false },
    plotOptions: { bar: { borderRadius: 4, columnWidth: "72%", distributed: true } },
    xaxis: { categories: hourLabels.value, labels: { style: { ...axisStyle, fontSize: "10px" } }, axisBorder, axisTicks: axisBorder },
    yaxis: { labels: { style: axisStyle, formatter: (v) => shortNumber(v) } },
    legend: { show: false },
    tooltip: {
      theme: "dark",
      y: { formatter: (v, ctx) => {
        const h = salesByHour.value[ctx.dataPointIndex];
        return `${money(v)} · ${h?.count || 0} transacciones`;
      }},
    },
  };
});

const optCashiersBar = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  colors: ["#008FFB"],
  fill: { opacity: 1 },
  stroke: { show: false },
  plotOptions: { bar: { horizontal: true, borderRadius: 6, borderRadiusApplication: "end", barHeight: "58%", dataLabels: { position: "bottom" } } },
  dataLabels: { enabled: true, offsetX: 8, style: { fontSize: "11px", colors: ["rgba(var(--v-theme-on-surface), 0.75)"] }, formatter: (v) => shortNumber(v) },
  xaxis: { categories: cashierCats.value, labels: { style: axisStyle, formatter: (v) => shortNumber(v) }, axisBorder, axisTicks: axisBorder },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "11px" }, maxWidth: 160 } },
  tooltip: { theme: "dark", y: { formatter: (v, ctx) => {
    const c = topCashiers10.value[ctx.dataPointIndex];
    return `${money(v)} · ${c?.count || 0} ventas`;
  }}},
}));

const optInvoiceType = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "donut" },
  labels: invoiceTypeLabels.value,
  colors: invoiceTypeColors_.value,
  stroke: { width: 0 },
  plotOptions: {
    pie: { donut: { size: "65%", labels: { show: true, total: { show: true, label: "Total", formatter: () => `${invoiceTypeTotal.value}` } } } },
  },
  legend: { show: true, position: "bottom", labels: { colors: "rgba(var(--v-theme-on-surface), 0.75)" } },
  tooltip: { theme: "dark", y: { formatter: (v) => `${v} ventas · ${invoiceTypeTotal.value ? Math.round((v / invoiceTypeTotal.value) * 100) : 0}%` } },
}));

const optProductsBar = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  colors: productToggle.value === "units" ? ["#00E396"] : ["#775DD0"],
  fill: { opacity: 1 },
  stroke: { show: false },
  plotOptions: { bar: { horizontal: true, borderRadius: 6, borderRadiusApplication: "end", barHeight: "55%", dataLabels: { position: "bottom" } } },
  dataLabels: {
    enabled: true, offsetX: 6,
    style: { fontSize: "11px", colors: ["rgba(var(--v-theme-on-surface), 0.75)"] },
    formatter: (v) => productToggle.value === "units" ? `${Math.round(Number(v || 0))} u.` : shortNumber(v),
  },
  xaxis: {
    categories: productCats.value,
    labels: { style: axisStyle, formatter: (v) => productToggle.value === "units" ? `${Math.round(Number(v || 0))}` : shortNumber(v) },
    axisBorder, axisTicks: axisBorder,
  },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "11px" }, maxWidth: 200 } },
  tooltip: { theme: "dark", y: { formatter: (v) => productToggle.value === "units" ? `${Math.round(Number(v || 0))} unidades` : money(v) } },
}));

const optBranchDonut = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "donut" },
  labels: branchLabels.value,
  stroke: { width: 0 },
  plotOptions: {
    pie: { donut: { size: "68%", labels: { show: true, total: { show: true, label: "Total", formatter: () => money(branchTotalSum.value) } } } },
  },
  legend: { show: true, position: "bottom", labels: { colors: "rgba(var(--v-theme-on-surface), 0.75)" } },
  tooltip: { theme: "dark", y: { formatter: (v) => `${money(v)} · ${branchTotalSum.value ? Math.round((v / branchTotalSum.value) * 100) : 0}%` } },
}));

// ─── Table headers ────────────────────────────────────────────────────────────
const headers = [
  { title: "ID", key: "id", sortable: false, width: 80 },
  { title: "Fecha", key: "sold_at", sortable: false, width: 180 },
  { title: "Sucursal", key: "branch", sortable: false, width: 160 },
  { title: "Vendedor", key: "user", sortable: false, width: 180 },
  { title: "Comprobante", key: "invoice_type", sortable: false, width: 130 },
  { title: "Total", key: "total", sortable: false, width: 150 },
];

// ─── Analytics deep ───────────────────────────────────────────────────────────
const ana = computed(() => props.analytics || {});

// Heatmap hora x día de semana
const DOW_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const heatmapData = computed(() => {
  const rows = Array.isArray(ana.value?.heatmap) ? ana.value.heatmap : [];
  const maxV = rows.reduce((m, r) => Math.max(m, num(r.count)), 0);
  return DOW_LABELS.map((dowLabel, dow) => ({
    name: dowLabel,
    data: Array.from({ length: 24 }, (_, h) => {
      const r = rows.find(x => num(x.dow) === dow && num(x.hour) === h);
      return { x: `${String(h).padStart(2, '0')}h`, y: num(r?.count), total: num(r?.total), maxV };
    }),
  }));
});
const heatmapHasData = computed(() => {
  const rows = Array.isArray(ana.value?.heatmap) ? ana.value.heatmap : [];
  return rows.some(r => num(r.count) > 0);
});
const optHeatmap = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "heatmap", toolbar: { show: false } },
  dataLabels: { enabled: false },
  plotOptions: {
    heatmap: {
      shadeIntensity: 0.7,
      radius: 3,
      colorScale: {
        ranges: [
          { from: 0, to: 0, color: "rgba(var(--v-theme-on-surface), 0.05)", name: "Sin ventas" },
          { from: 1, to: 5, color: "#00BCD4", name: "Bajo" },
          { from: 6, to: 15, color: "#2196F3", name: "Medio" },
          { from: 16, to: 999999, color: "#7C3AED", name: "Alto" },
        ],
      },
    },
  },
  stroke: { width: 1, colors: ["rgba(var(--v-theme-surface), 1)"] },
  xaxis: { labels: { style: { ...axisStyle, fontSize: "9px" } }, axisBorder, axisTicks: axisBorder },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "11px" } } },
  tooltip: { theme: "dark", y: { formatter: (v, { seriesIndex, dataPointIndex, w }) => {
    const total = w.config.series?.[seriesIndex]?.data?.[dataPointIndex]?.total;
    return `${v} ventas${total ? ` · ${money(total)}` : ""}`;
  } } },
}));

// Payment method trend por mes
const methodColors = { CASH: "#00E396", CARD: "#008FFB", TRANSFER: "#FEB019", QR: "#FF4560", OTHER: "#775DD0" };
const paymentTrendRows = computed(() => Array.isArray(ana.value?.paymentTrend) ? ana.value.paymentTrend : []);
const paymentTrendMonths = computed(() => [...new Set(paymentTrendRows.value.map(r => r.ym))].sort());
const paymentTrendMethods = computed(() => [...new Set(paymentTrendRows.value.map(r => r.method))]);
const seriesPaymentTrend = computed(() =>
  paymentTrendMethods.value.map(m => ({
    name: m === "CASH" ? "Efectivo" : m === "CARD" ? "Tarjeta" : m === "TRANSFER" ? "Transferencia" : m === "QR" ? "QR" : "Otro",
    data: paymentTrendMonths.value.map(ym => {
      const r = paymentTrendRows.value.find(x => x.ym === ym && x.method === m);
      return num(r?.total);
    }),
    color: methodColors[m] || "#aaa",
  }))
);
const optPaymentTrend = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar", stacked: true, toolbar: { show: false } },
  plotOptions: { bar: { columnWidth: "65%", borderRadius: 4 } },
  dataLabels: { enabled: false },
  xaxis: { categories: paymentTrendMonths.value, labels: { style: axisStyle } },
  yaxis: { labels: { style: axisStyle, formatter: shortNumber } },
  legend: { show: true, position: "top", labels: { colors: "rgba(var(--v-theme-on-surface), 0.7)" } },
  tooltip: { theme: "dark", y: { formatter: (v) => money(v) } },
}));

// Discounts & refunds
const discounts = computed(() => ana.value?.discounts || {});
const refunds = computed(() => ana.value?.refunds || {});
const cancelled = computed(() => ana.value?.cancelled || {});
const itemsStats = computed(() => ana.value?.items || {});

// Tax condition donut
const taxConditionRows = computed(() => Array.isArray(ana.value?.byTaxCondition) ? ana.value.byTaxCondition : []);
const taxSeries = computed(() => taxConditionRows.value.map(r => num(r.count)));
const taxLabels = computed(() => taxConditionRows.value.map(r => r.label?.replace("_", " ") || "—"));
const optTaxDonut = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "donut" },
  labels: taxLabels.value,
  stroke: { width: 0 },
  plotOptions: { pie: { donut: { size: "65%", labels: { show: true, total: { show: true, label: "Total", formatter: () => String(taxConditionRows.value.reduce((a, r) => a + num(r.count), 0)) } } } } },
  colors: ["#008FFB","#00E396","#FEB019","#FF4560","#775DD0","#00BCD4","#FF7043","#AB47BC"],
  legend: { show: true, position: "bottom", labels: { colors: "rgba(var(--v-theme-on-surface), 0.75)" } },
  tooltip: { theme: "dark", y: { formatter: (v, { seriesIndex, w }) => {
    const r = taxConditionRows.value[seriesIndex];
    return `${v} ventas · ${money(r?.total)}`;
  } } },
}));

// Top customers
const topCustomers = computed(() => Array.isArray(ana.value?.topCustomers) ? ana.value.topCustomers.slice(0, 10) : []);
const seriesTopCustomers = computed(() => [{ name: "Total $", data: topCustomers.value.map(r => num(r.total)) }]);
const optTopCustomers = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar", toolbar: { show: false } },
  plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: "70%", distributed: true, dataLabels: { position: "top" } } },
  dataLabels: { enabled: true, formatter: shortNumber, style: { ...axisStyle, fontSize: "10px" } },
  xaxis: {
    categories: topCustomers.value.map(r => r.name?.length > 20 ? r.name.slice(0, 18) + "…" : r.name),
    labels: { style: axisStyle, formatter: shortNumber },
  },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "11px" }, maxWidth: 180 } },
  legend: { show: false },
  tooltip: { theme: "dark", y: { formatter: (v, { dataPointIndex }) => {
    const r = topCustomers.value[dataPointIndex];
    return `${money(v)} · ${r?.count} visitas`;
  } } },
  colors: ["#008FFB","#00E396","#FEB019","#FF4560","#775DD0","#00BCD4","#FF7043","#AB47BC","#26A69A","#5C6BC0"],
}));

// Avg ticket por día de semana
const dowTicket = computed(() => Array.isArray(ana.value?.avgTicketByDow) ? ana.value.avgTicketByDow : []);
const seriesAvgDow = computed(() => [{ name: "Ticket promedio", data: dowTicket.value.map(r => Math.round(num(r.avgTicket))) }]);
const optAvgDow = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar", toolbar: { show: false } },
  plotOptions: { bar: { columnWidth: "60%", borderRadius: 5, distributed: true } },
  dataLabels: { enabled: false },
  xaxis: { categories: DOW_LABELS, labels: { style: axisStyle } },
  yaxis: { labels: { style: axisStyle, formatter: shortNumber } },
  legend: { show: false },
  tooltip: { theme: "dark", y: { formatter: (v, { dataPointIndex }) => {
    const r = dowTicket.value[dataPointIndex];
    return `${money(v)} · ${r?.count} ventas`;
  } } },
  colors: ["#7C3AED","#6D28D9","#5B21B6","#4C1D95","#2196F3","#00BCD4","#26A69A"],
}));
</script>

<style scoped>
.dsales { display: flex; flex-direction: column; gap: 0; }

.ds-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  border-radius: 16px !important;
  overflow: hidden;
}

.ds-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 12px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-bottom: none;
}

.ds-title {
  font-weight: 900;
  letter-spacing: -0.01em;
  font-size: 13.5px;
  color: rgb(var(--v-theme-on-surface));
}
.ds-sub {
  margin-top: 3px;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.50);
  font-weight: 600;
}

.ds-right { display: flex; align-items: center; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }

.ds-period { min-width: 180px; }

.ds-body { padding: 0; }

.ds-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px 14px;
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-weight: 600;
}
.ds-foot b { color: rgba(var(--v-theme-on-surface), 0.85); }

.sep { opacity: 0.5; }

.chip-soft { border: 1px solid rgba(var(--v-theme-on-surface), 0.10); }

.empty-state {
  padding: 32px 20px;
  text-align: center;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  font-weight: 600;
}

.minw-0 { min-width: 0; }

.ana-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.ana-item {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}
.ana-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin-bottom: 4px;
}
.ana-value {
  font-size: 1.35rem;
  font-weight: 950;
  letter-spacing: -0.03em;
  line-height: 1;
}
.ana-sub {
  font-size: 10.5px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  font-weight: 600;
  margin-top: 3px;
}
.border-bottom-subtle { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06); }

.dash-table :deep(.v-table__wrapper),
.dash-table :deep(table),
.dash-table :deep(.v-data-table__wrapper) {
  background: transparent !important;
}

:deep(.v-select .v-field__input) {
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}

@media (max-width: 600px) {
  .ds-head { flex-direction: column; align-items: stretch; }
  .ds-right { justify-content: flex-start; }
  .ds-period { min-width: 100%; }
}
</style>
