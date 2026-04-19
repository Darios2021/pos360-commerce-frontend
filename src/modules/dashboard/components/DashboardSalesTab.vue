<template>
  <div class="dv">

    <!-- ── Period selector bar ────────────────────────────────────────────────── -->
    <div class="dv-period-bar">
      <span class="dv-period-label">Período</span>
      <div class="dv-period-pills">
        <button
          v-for="p in periodItems"
          :key="p.value"
          class="dv-pill"
          :class="{ 'dv-pill--active': periodLocal === p.value }"
          @click="emitPeriod(p.value)"
        >{{ p.title }}</button>
      </div>

      <!-- Hoy reference pill -->
      <div class="dv-today-chip">
        <span class="dv-today-dot" />
        Hoy: <b>{{ num(today.count) }} ventas · {{ money(today.total) }}</b>
      </div>

      <div class="dv-bar-spacer" />

      <!-- Branch selector (visible si hay sucursales disponibles) -->
      <v-menu v-if="branches.length > 0" location="bottom end" :close-on-content-click="true">
        <template #activator="{ props: menuProps }">
          <div class="dv-branch-wrap" v-bind="menuProps">
            <v-icon size="15" class="dv-branch-icon">mdi-store-outline</v-icon>
            <span class="dv-branch-label">{{ currentBranchLabel }}</span>
            <v-icon size="13" class="dv-branch-chevron">mdi-chevron-down</v-icon>
          </div>
        </template>
        <v-list density="compact" rounded="lg" class="dv-branch-list" min-width="200">
          <v-list-item
            :value="null"
            :active="!selectedBranch"
            active-color="primary"
            @click="onBranchChange({ target: { value: '' } })"
          >
            <v-list-item-title>Todas las sucursales</v-list-item-title>
          </v-list-item>
          <v-divider class="my-1" />
          <v-list-item
            v-for="b in branches"
            :key="b.id"
            :value="b.id"
            :active="selectedBranch === b.id"
            active-color="primary"
            @click="onBranchChange({ target: { value: b.id } })"
          >
            <v-list-item-title>{{ b.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Fallback scope label cuando no hay sucursales cargadas -->
      <div v-else-if="scopeLabelChip" class="dv-scope">
        <v-icon size="13" class="mr-1">mdi-store-outline</v-icon>{{ props.scopeLabel }}
      </div>
    </div>

    <!-- ── Row 1: Hero KPIs (todas reaccionan al período) ───────────────────── -->
    <div class="dv-kpi-row">
      <!-- Total recaudado -->
      <div class="dv-kpi" style="--kpi-accent:#3b82f6">
        <div class="dv-kpi-badge" style="background:#3b82f6">
          <v-icon color="white" size="20">mdi-cash-multiple</v-icon>
        </div>
        <div class="dv-kpi-body">
          <div class="dv-kpi-label">Total recaudado <span class="dv-kpi-period">· {{ periodLabelShort }}</span></div>
          <div class="dv-kpi-value dv-kpi-value--sm">{{ money(periodTotal) }}</div>
          <div class="dv-kpi-meta">{{ periodCount }} ventas en el período</div>
        </div>
      </div>

      <!-- Promedio diario -->
      <div class="dv-kpi" style="--kpi-accent:#10b981">
        <div class="dv-kpi-badge" style="background:#10b981">
          <v-icon color="white" size="20">mdi-trending-up</v-icon>
        </div>
        <div class="dv-kpi-body">
          <div class="dv-kpi-label">Promedio por día <span class="dv-kpi-period">· {{ periodLabelShort }}</span></div>
          <div class="dv-kpi-value dv-kpi-value--sm">{{ money(avgPerDay) }}</div>
          <div class="dv-kpi-meta">{{ nonZeroDays }} días activos / {{ timelinePoints.length }} totales</div>
        </div>
      </div>

      <!-- Ticket promedio -->
      <div class="dv-kpi" style="--kpi-accent:#8b5cf6">
        <div class="dv-kpi-badge" style="background:#8b5cf6">
          <v-icon color="white" size="20">mdi-ticket-percent-outline</v-icon>
        </div>
        <div class="dv-kpi-body">
          <div class="dv-kpi-label">Ticket promedio <span class="dv-kpi-period">· {{ periodLabelShort }}</span></div>
          <div class="dv-kpi-value dv-kpi-value--sm">{{ money(avgTicketPeriod) }}</div>
          <div class="dv-kpi-meta">Pico: {{ money(peakMax) }} ({{ peakDateFmt }})</div>
        </div>
      </div>

      <!-- Mejor mes del período -->
      <div class="dv-kpi" style="--kpi-accent:#f59e0b">
        <div class="dv-kpi-badge" style="background:#f59e0b">
          <v-icon color="white" size="20">mdi-calendar-star</v-icon>
        </div>
        <div class="dv-kpi-body">
          <div class="dv-kpi-label">Mejor mes <span class="dv-kpi-period">· {{ periodLabelShort }}</span></div>
          <div class="dv-kpi-value dv-kpi-value--xs">{{ bestMonthLabel }}</div>
          <div class="dv-kpi-meta">{{ bestMonth ? money(bestMonth.total) + ' · ' + num(bestMonth.count) + ' ventas' : '—' }}</div>
        </div>
      </div>
    </div>

    <!-- ── Row 1b: Sucursal líder + Cajero líder ────────────────────────────── -->
    <v-row dense>
      <v-col cols="12" md="6">
        <v-card class="dv-card" elevation="0">
          <div class="dv-head">
            <div class="dv-head-left">
              <div class="dv-title">Ranking de sucursales</div>
              <div class="dv-sub">Por total vendido · {{ periodLabel }}</div>
            </div>
            <v-chip v-if="branchTop.length" size="small" variant="tonal" class="chip-soft">
              {{ money(branchTotalSum) }} total
            </v-chip>
          </div>
          <v-divider class="dv-divider" />
          <div class="dv-body">
            <div v-if="loading" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
            <div v-else-if="!branchTop.length" class="dv-empty">Sin datos por sucursal.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="220" type="bar" :options="optBranchBar" :series="seriesBranchBar" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="dv-card" elevation="0">
          <div class="dv-head">
            <div class="dv-head-left">
              <div class="dv-title">Ranking de cajeros</div>
              <div class="dv-sub">Por total vendido · {{ periodLabel }}</div>
            </div>
            <v-chip v-if="topCashiers10.length" size="small" variant="tonal" class="chip-soft">
              {{ topCashiers10.length }} vendedores
            </v-chip>
          </div>
          <v-divider class="dv-divider" />
          <div class="dv-body">
            <div v-if="loading" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
            <div v-else-if="!topCashiers10.length" class="dv-empty">Sin datos de vendedores.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="220" type="bar" :options="optCashierRanking" :series="seriesCashierRanking" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Row 2: Timeline (full width) ──────────────────────────────────────── -->
    <v-card class="dv-card" elevation="0">
      <div class="dv-head">
        <div class="dv-head-left">
          <div class="dv-title">Evolución de ventas</div>
          <div class="dv-sub">{{ periodLabel }}</div>
        </div>
        <div class="dv-head-right">
          <v-chip v-if="peakMax > 0" size="small" variant="tonal" class="chip-soft">
            Pico <b class="ml-1">{{ money(peakMax) }}</b><span class="ml-1 op60">({{ peakDateFmt }})</span>
          </v-chip>
        </div>
      </div>
      <v-divider class="dv-divider" />
      <div class="dv-body">
        <div v-if="loading" class="dv-loading"><v-progress-circular indeterminate size="32" /></div>
        <div v-else-if="!timelinePoints.length" class="dv-empty">Sin datos de ventas en el período seleccionado.</div>
        <div v-else class="px-2 pb-1">
          <ApexChart height="260" type="line" :options="optTimeline" :series="seriesTimeline" />
          <div class="dv-foot">
            <span>Promedio/día <b>{{ money(avgPerDay) }}</b></span>
            <span class="dot">·</span>
            <span>Días activos <b>{{ nonZeroDays }} / {{ timelinePoints.length }}</b></span>
            <span class="dot">·</span>
            <span>Total <b>{{ money(periodTotal) }}</b></span>
          </div>
        </div>
      </div>
    </v-card>

    <!-- ── Row 3: Medios de pago (4) + Ventas por mes (8) ────────────────────── -->
    <v-row dense>
      <v-col cols="12" md="4">
        <v-card class="dv-card h-full" elevation="0">
          <div class="dv-head">
            <div class="dv-head-left">
              <div class="dv-title">Medios de pago</div>
              <div class="dv-sub">Composición · {{ periodLabel }}</div>
            </div>
            <v-chip size="small" variant="tonal" class="chip-soft">{{ money(paymentPeriodTotal) }}</v-chip>
          </div>
          <v-divider class="dv-divider" />
          <div class="dv-body">
            <div v-if="loading" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
            <div v-else-if="!paymentPeriodSeries.length" class="dv-empty">Sin datos.</div>
            <div v-else>
              <ApexChart height="260" type="donut" :options="optPaymentDonut" :series="paymentPeriodSeries" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card class="dv-card h-full" elevation="0">
          <div class="dv-head">
            <div class="dv-head-left">
              <div class="dv-title">Ventas por mes</div>
              <div class="dv-sub">Evolución mensual · {{ periodLabel }}</div>
            </div>
            <v-chip v-if="bestMonthLabel !== '—'" size="small" variant="tonal" class="chip-soft">
              Mejor <b class="ml-1">{{ bestMonthLabel }}</b>
            </v-chip>
          </div>
          <v-divider class="dv-divider" />
          <div class="dv-body">
            <div v-if="loading" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
            <div v-else-if="!monthsAgg.length" class="dv-empty">Sin datos mensuales.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="260" type="bar" :options="optMonthsBar" :series="seriesMonths" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Row 4: Distribución horaria (full) ───────────────────────────────── -->
    <v-card class="dv-card" elevation="0">
      <div class="dv-head">
        <div class="dv-head-left">
          <div class="dv-title">Distribución horaria de ventas</div>
          <div class="dv-sub">Recaudación por hora del día · {{ periodLabel }}</div>
        </div>
        <v-chip v-if="peakHour !== null" size="small" variant="tonal" class="chip-soft">
          Pico <b class="ml-1">{{ String(peakHour).padStart(2,'0') }}:00 hs</b>
        </v-chip>
      </div>
      <v-divider class="dv-divider" />
      <div class="dv-body">
        <div v-if="loading" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
        <div v-else-if="!hourlyHasData" class="dv-empty">Sin datos horarios.</div>
        <div v-else class="px-2 pb-2">
          <ApexChart height="200" type="bar" :options="optHourly" :series="seriesHourly" />
        </div>
      </div>
    </v-card>

    <!-- ── Row 5: Top productos (7) + Top vendedores (5) ─────────────────────── -->
    <v-row dense>
      <v-col cols="12" lg="7">
        <v-card class="dv-card" elevation="0">
          <div class="dv-head">
            <div class="dv-head-left">
              <div class="dv-title">Top 10 productos</div>
              <div class="dv-sub">{{ productToggle === 'total' ? 'Por total recaudado' : 'Por unidades vendidas' }} · {{ periodLabel }}</div>
            </div>
            <div class="dv-head-right">
              <div class="dv-toggle">
                <button class="dv-toggle-btn" :class="{ active: productToggle === 'units' }" @click="productToggle = 'units'">Unidades</button>
                <button class="dv-toggle-btn" :class="{ active: productToggle === 'total' }" @click="productToggle = 'total'">$ Total</button>
              </div>
            </div>
          </div>
          <v-divider class="dv-divider" />
          <div class="dv-body">
            <div v-if="loading" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
            <div v-else-if="!topProducts10.length" class="dv-empty">Sin productos vendidos en el período.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="300" type="bar" :options="optProductsBar" :series="seriesProducts" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="5">
        <v-card class="dv-card" elevation="0">
          <div class="dv-head">
            <div class="dv-head-left">
              <div class="dv-title">Top vendedores</div>
              <div class="dv-sub">Por total vendido · {{ periodLabel }}</div>
            </div>
            <v-chip v-if="topCashiers10.length" size="small" variant="tonal" class="chip-soft">{{ topCashiers10.length }} registrados</v-chip>
          </div>
          <v-divider class="dv-divider" />
          <div class="dv-body">
            <div v-if="loading" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
            <div v-else-if="!topCashiers10.length" class="dv-empty">Sin ventas por vendedor.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="300" type="bar" :options="optCashiersBar" :series="seriesCashiers" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Row 6: Mapa de actividad (full) ───────────────────────────────────── -->
    <v-card class="dv-card" elevation="0">
      <div class="dv-head">
        <div class="dv-head-left">
          <div class="dv-title">Mapa de actividad (hora × día)</div>
          <div class="dv-sub">Intensidad de ventas por franja horaria · {{ periodLabel }}</div>
        </div>
        <v-chip v-if="loadingAnalytics" size="small" variant="tonal" class="chip-soft">Cargando…</v-chip>
      </div>
      <v-divider class="dv-divider" />
      <div class="dv-body">
        <div v-if="loadingAnalytics" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
        <div v-else-if="!heatmapHasData" class="dv-empty">Sin datos de actividad horaria.</div>
        <div v-else class="px-2 pb-2">
          <ApexChart height="240" type="heatmap" :options="optHeatmap" :series="heatmapData" />
        </div>
      </div>
    </v-card>

    <!-- ── Row 7: Branch donut (4) + Últimas ventas (8) ──────────────────────── -->
    <v-row dense>
      <v-col cols="12" lg="4">
        <v-card class="dv-card h-full" elevation="0">
          <div class="dv-head">
            <div class="dv-head-left">
              <div class="dv-title">Por sucursal</div>
              <div class="dv-sub">Participación en ventas</div>
            </div>
            <v-chip size="small" variant="tonal" class="chip-soft">{{ money(branchTotalSum) }}</v-chip>
          </div>
          <v-divider class="dv-divider" />
          <div class="dv-body">
            <div v-if="loading" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
            <div v-else-if="!branchSeries.length" class="dv-empty">Sin datos por sucursal.</div>
            <div v-else>
              <ApexChart height="280" type="donut" :options="optBranchDonut" :series="branchSeries" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="8">
        <v-card class="dv-card h-full" elevation="0">
          <div class="dv-head">
            <div class="dv-head-left">
              <div class="dv-title">Últimas ventas</div>
              <div class="dv-sub">{{ scopeLabelChip }}</div>
            </div>
          </div>
          <v-divider class="dv-divider" />
          <v-card-text class="pa-0">
            <div v-if="loading" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
            <div v-else>
              <v-data-table
                :headers="headers"
                :items="lastSales"
                item-key="id"
                density="comfortable"
                class="elevation-0 dv-table"
              >
                <template #item.id="{ item }">
                  <span class="font-weight-bold text-primary">#{{ item.id }}</span>
                </template>
                <template #item.sold_at="{ item }">
                  <span class="text-body-2 font-weight-medium">{{ dt(item.sold_at) }}</span>
                </template>
                <template #item.branch="{ item }">
                  <span class="text-body-2">{{ item?.branch?.name || (item.branch_id ? `Sucursal #${item.branch_id}` : '—') }}</span>
                </template>
                <template #item.user="{ item }">
                  <span class="text-body-2">{{ item?.user?.label || item?.user?.name || item?.user?.username || '—' }}</span>
                </template>
                <template #item.total="{ item }">
                  <div class="font-weight-black">{{ money(item.total) }}</div>
                  <div class="text-caption op60">{{ methodLabel(item?.payments?.[0]?.method) }}</div>
                </template>
                <template #item.invoice_type="{ item }">
                  <v-chip size="x-small" variant="tonal" :color="invoiceColor(item.invoice_type)">{{ item.invoice_type || '—' }}</v-chip>
                </template>
                <template #bottom />
              </v-data-table>
              <div v-if="!lastSales.length" class="text-caption op60 pa-4">Sin ventas registradas.</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Row 8: Tendencia pagos (7) + Tipos comprobante (5) ────────────────── -->
    <v-row dense>
      <v-col cols="12" lg="7">
        <v-card class="dv-card" elevation="0">
          <div class="dv-head">
            <div class="dv-head-left">
              <div class="dv-title">Tendencia de medios de pago</div>
              <div class="dv-sub">Evolución mensual · últimos 12 meses</div>
            </div>
          </div>
          <v-divider class="dv-divider" />
          <div class="dv-body">
            <div v-if="loadingAnalytics" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
            <div v-else-if="!seriesPaymentTrend.length" class="dv-empty">Sin datos de tendencia.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="260" type="bar" :options="optPaymentTrend" :series="seriesPaymentTrend" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="5">
        <v-card class="dv-card" elevation="0">
          <div class="dv-head">
            <div class="dv-head-left">
              <div class="dv-title">Tipos de comprobante</div>
              <div class="dv-sub">{{ invoiceTypeTotal }} ventas · {{ periodLabel }}</div>
            </div>
          </div>
          <v-divider class="dv-divider" />
          <div class="dv-body">
            <div v-if="loading" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
            <div v-else-if="!invoiceTypeSeries.length" class="dv-empty">Sin datos.</div>
            <div v-else>
              <ApexChart height="260" type="donut" :options="optInvoiceType" :series="invoiceTypeSeries" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Row 9: Top clientes (6) + Ticket por día semana (6) ───────────────── -->
    <v-row dense>
      <v-col cols="12" lg="6">
        <v-card class="dv-card" elevation="0">
          <div class="dv-head">
            <div class="dv-head-left">
              <div class="dv-title">Top 10 clientes</div>
              <div class="dv-sub">Por total comprado · {{ periodLabel }}</div>
            </div>
            <v-chip v-if="topCustomers.length" size="small" variant="tonal" class="chip-soft">{{ topCustomers.length }} clientes</v-chip>
          </div>
          <v-divider class="dv-divider" />
          <div class="dv-body">
            <div v-if="loadingAnalytics" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
            <div v-else-if="!topCustomers.length" class="dv-empty">Sin clientes con nombre registrado.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="280" type="bar" :options="optTopCustomers" :series="seriesTopCustomers" />
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6">
        <v-card class="dv-card" elevation="0">
          <div class="dv-head">
            <div class="dv-head-left">
              <div class="dv-title">Ticket promedio por día</div>
              <div class="dv-sub">Lunes a Domingo · {{ periodLabel }}</div>
            </div>
          </div>
          <v-divider class="dv-divider" />
          <div class="dv-body">
            <div v-if="loadingAnalytics" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
            <div v-else-if="!dowTicket.some(r => r.avgTicket > 0)" class="dv-empty">Sin datos.</div>
            <div v-else class="px-2 pb-2">
              <ApexChart height="280" type="bar" :options="optAvgDow" :series="seriesAvgDow" />
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Row 10: Descuentos & Devoluciones ─────────────────────────────────── -->
    <v-card class="dv-card" elevation="0">
      <div class="dv-head">
        <div class="dv-head-left">
          <div class="dv-title">Descuentos · Devoluciones · Cancelados</div>
          <div class="dv-sub">Análisis del período seleccionado</div>
        </div>
      </div>
      <v-divider class="dv-divider" />
      <div class="dv-body px-4 py-3">
        <div v-if="loadingAnalytics" class="dv-loading"><v-progress-circular indeterminate size="28" /></div>
        <div v-else class="dv-ana-grid">
          <div class="dv-ana-item">
            <div class="dv-ana-label">Ventas con descuento</div>
            <div class="dv-ana-val text-warning">{{ num(discounts.salesWithDiscount) }}</div>
            <div class="dv-ana-sub">{{ money(discounts.totalDiscounted) }} descontados</div>
          </div>
          <div class="dv-ana-item">
            <div class="dv-ana-label">Descuento promedio</div>
            <div class="dv-ana-val text-warning">{{ money(discounts.avgDiscount) }}</div>
            <div class="dv-ana-sub">Máx: {{ money(discounts.maxDiscount) }}</div>
          </div>
          <div class="dv-ana-item">
            <div class="dv-ana-label">Devoluciones</div>
            <div class="dv-ana-val text-error">{{ num(refunds.count) }}</div>
            <div class="dv-ana-sub">{{ money(refunds.total) }} devueltos</div>
          </div>
          <div class="dv-ana-item">
            <div class="dv-ana-label">Canceladas</div>
            <div class="dv-ana-val text-error">{{ num(cancelled.count) }}</div>
            <div class="dv-ana-sub">{{ money(cancelled.total) }}</div>
          </div>
          <div class="dv-ana-item">
            <div class="dv-ana-label">Ítems por venta</div>
            <div class="dv-ana-val text-primary">{{ Number(itemsStats.avgItemsPerSale || 0).toFixed(1) }}</div>
            <div class="dv-ana-sub">Promedio de líneas</div>
          </div>
          <div class="dv-ana-item">
            <div class="dv-ana-label">Impuestos</div>
            <div class="dv-ana-val text-info">{{ money(discounts.totalTax) }}</div>
            <div class="dv-ana-sub">Total período</div>
          </div>
        </div>
      </div>
    </v-card>

  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import ApexChart from "vue3-apexcharts";

const props = defineProps({
  loading:          { type: Boolean, default: false },
  loadingAnalytics: { type: Boolean, default: false },
  isAdmin:          { type: Boolean, default: false },
  scopeLabel:       { type: String,  default: "" },
  sales:            { type: Object,  default: () => ({}) },
  analytics:        { type: Object,  default: null },
  period:           { type: String,  default: "30d" },
  branches:         { type: Array,   default: () => [] },
  selectedBranch:   { type: Number,  default: null },
});
const emit = defineEmits(["period-change", "branch-change"]);

const periodItems = [
  { title: "Última semana", value: "7d"  },
  { title: "Último mes",    value: "30d" },
  { title: "3 meses",       value: "90d" },
  { title: "Último año",    value: "12m" },
  { title: "Histórico",     value: "all" },
];

const periodLocal   = ref(props.period || "30d");
const productToggle = ref("total");

watch(() => props.period, (v) => { if (v && v !== periodLocal.value) periodLocal.value = v; });
function emitPeriod(v) { periodLocal.value = v; emit("period-change", v); }
function onBranchChange(e) {
  const val = e.target.value;
  emit("branch-change", val === "" || val === null ? null : Number(val));
}

const currentBranchLabel = computed(() => {
  if (!props.selectedBranch) return "Todas las sucursales";
  const found = props.branches.find(b => b.id === props.selectedBranch);
  return found?.name || `Sucursal #${props.selectedBranch}`;
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function num(v) { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; }
function money(val) {
  const n = Number(val || 0);
  try { return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n); }
  catch { return `$ ${Math.round(n)}`; }
}
function shortNumber(v) {
  const n = Number(v || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return `${Math.round(n)}`;
}
function dt(val) { if (!val) return "—"; return new Date(val).toLocaleString("es-AR"); }
function parseYMDToMs(ymd) {
  if (!ymd) return null;
  const s = String(ymd);
  if (s.length >= 10) {
    const y = Number(s.slice(0,4)), m = Number(s.slice(5,7)), d = Number(s.slice(8,10));
    if (!y || !m || !d) return null;
    return new Date(y, m-1, d).getTime();
  }
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : null;
}
function fmtDMFromMs(ms) {
  if (!ms) return "—";
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
}
function monthKey(ymd) { const s = String(ymd || ""); return s.length >= 7 ? s.slice(0,7) : "—"; }
function monthLabel(ym) {
  if (!ym || ym === "—") return "—";
  const [y, m] = String(ym).split("-");
  return new Date(Number(y||2000), Number(m||1)-1, 1)
    .toLocaleDateString("es-AR", { year: "numeric", month: "long" });
}
function methodLabel(m) {
  const x = String(m || "").toUpperCase().trim();
  if (["CASH", "EFECTIVO"].includes(x))                          return "Efectivo";
  if (["CARD", "TARJETA", "DEBIT", "DEBITO"].includes(x))        return "Tarjeta / Débito";
  if (["TRANSFER", "TRANSFERENCIA"].includes(x))                 return "Transferencia";
  if (["QR", "MERCADOPAGO", "MERCADO_PAGO", "MP"].includes(x))   return "Mercado Pago";
  if (["CREDIT_SJT", "CREDITO_SJT", "CREDITSANJUAN"].includes(x)) return "Crédito San Juan";
  if (["CREDIT", "CREDITO", "CREDIT_1", "CUOTAS"].includes(x))   return "Crédito";
  if (x === "OTHER")                                             return "Otro";
  return m || "—";
}
function invoiceColor(t) {
  const x = String(t || "").toUpperCase();
  if (x === "A")      return "blue";
  if (x === "B")      return "green";
  if (x === "C")      return "purple";
  if (x === "TICKET") return "orange";
  return "grey";
}
function pctVal(v) { return Number(v || 0); }

// ─── Period labels ─────────────────────────────────────────────────────────
const periodLabel = computed(() => {
  if (periodLocal.value === "7d")  return "Última semana";
  if (periodLocal.value === "90d") return "Últimos 3 meses";
  if (periodLocal.value === "12m") return "Último año";
  if (periodLocal.value === "all") return "Histórico";
  return "Último mes";
});
const periodLabelShort = computed(() => {
  if (periodLocal.value === "7d")  return "7d";
  if (periodLocal.value === "90d") return "3m";
  if (periodLocal.value === "12m") return "12m";
  if (periodLocal.value === "all") return "Total";
  return "Mes";
});
const scopeLabelChip = computed(() => props.scopeLabel || "");

// ─── Base data ──────────────────────────────────────────────────────────────
const today  = computed(() => props.sales?.today  || { count:0, total:0, avgTicket:0 });
const week   = computed(() => props.sales?.week   || { count:0, total:0 });
const month  = computed(() => props.sales?.month  || { count:0, total:0 });

const salesDaily    = computed(() => {
  if (Array.isArray(props.sales?.salesByPeriodDaily)) return props.sales.salesByPeriodDaily;
  return Array.isArray(props.sales?.salesByDay30) ? props.sales.salesByDay30 : [];
});
const lastSales     = computed(() => Array.isArray(props.sales?.lastSales)             ? props.sales.lastSales            : []);
const topCashiers   = computed(() => {
  if (Array.isArray(props.sales?.topCashiersPeriod)) return props.sales.topCashiersPeriod;
  return Array.isArray(props.sales?.topCashiers30d) ? props.sales.topCashiers30d : [];
});
const topProducts   = computed(() => {
  if (Array.isArray(props.sales?.topProductsPeriod)) return props.sales.topProductsPeriod;
  return Array.isArray(props.sales?.topProducts30d) ? props.sales.topProducts30d : [];
});
const bestMonth     = computed(() => props.sales?.bestMonthPeriod || props.sales?.bestMonth12m || null);
const salesByHour   = computed(() => Array.isArray(props.sales?.salesByHour)           ? props.sales.salesByHour          : []);
const salesByPaymentPeriod = computed(() => Array.isArray(props.sales?.salesByPaymentPeriod) ? props.sales.salesByPaymentPeriod : []);
const salesByInvoiceType   = computed(() => Array.isArray(props.sales?.salesByInvoiceType)   ? props.sales.salesByInvoiceType   : []);

// ─── Trend values ────────────────────────────────────────────────────────────
const trendWeekPct  = computed(() => pctVal(props.sales?.trend?.week_total_pct));
const trendMonthPct = computed(() => pctVal(props.sales?.trend?.month_total_pct));

// ─── Timeline ────────────────────────────────────────────────────────────────
const timelinePoints = computed(() =>
  (salesDaily.value || [])
    .map(x => ({ date: x?.date, ms: parseYMDToMs(x?.date), total: num(x?.total), count: num(x?.count) }))
    .filter(p => !!p.ms)
    .sort((a,b) => a.ms - b.ms)
);
const peakPoint   = computed(() => timelinePoints.value.reduce((best,p) => (!best || p.total > best.total) ? p : best, null));
const peakMax     = computed(() => Number(peakPoint.value?.total || 0));
const peakDateFmt = computed(() => fmtDMFromMs(peakPoint.value?.ms));
const avgPerDay   = computed(() => {
  const arr = timelinePoints.value;
  return arr.length ? arr.reduce((a,p) => a + p.total, 0) / arr.length : 0;
});
const nonZeroDays  = computed(() => timelinePoints.value.filter(p => p.total > 0).length);
const periodTotal  = computed(() => timelinePoints.value.reduce((a,p) => a + p.total, 0));
const periodCount  = computed(() => timelinePoints.value.reduce((a,p) => a + p.count, 0));
const avgTicketPeriod = computed(() => {
  const total = periodTotal.value;
  const count = timelinePoints.value.reduce((a,p) => a + p.count, 0);
  return count > 0 ? total / count : 0;
});
const bestMonthLabel = computed(() => bestMonth.value ? monthLabel(bestMonth.value.ym) : "—");

const seriesTimeline = computed(() => [
  { name: "Ventas ($)", type: "area", data: timelinePoints.value.map(p => [p.ms, Math.round(p.total)]) },
  { name: "Transacciones", type: "line", data: timelinePoints.value.map(p => [p.ms, p.count]) },
]);
const timelineTickAmount = computed(() => {
  const n = timelinePoints.value.length;
  if (n <= 14) return 6; if (n <= 35) return 8; if (n <= 90) return 10; return 12;
});

// ─── Payment Method Donut ─────────────────────────────────────────────────
const pmColors = { CASH: "#10b981", CARD: "#3b82f6", TRANSFER: "#8b5cf6", QR: "#06b6d4", OTHER: "#f59e0b" };
const paymentPeriodSeries = computed(() => salesByPaymentPeriod.value.map(p => Number(p.total || 0)));
const paymentPeriodLabels = computed(() => salesByPaymentPeriod.value.map(p => p.label || methodLabel(p.method)));
const paymentPeriodColors = computed(() => salesByPaymentPeriod.value.map(p => pmColors[p.method] || "#94a3b8"));
const paymentPeriodTotal  = computed(() => salesByPaymentPeriod.value.reduce((a,p) => a + Number(p.total||0), 0));

// ─── Hourly ───────────────────────────────────────────────────────────────
const hourlyHasData = computed(() => salesByHour.value.some(h => h.total > 0));
const seriesHourly  = computed(() => [{ name: "Ventas ($)", data: salesByHour.value.map(h => Math.round(h.total)) }]);
const hourLabels    = computed(() => salesByHour.value.map(h => `${String(h.hour).padStart(2,"0")}h`));
const peakHour      = computed(() => {
  const arr = salesByHour.value;
  if (!arr.length) return null;
  const max   = Math.max(...arr.map(h => h.total));
  const found = arr.find(h => h.total === max);
  return found && found.total > 0 ? found.hour : null;
});

// ─── Monthly Agg ─────────────────────────────────────────────────────────
const monthsAgg = computed(() => {
  const map = new Map();
  for (const p of timelinePoints.value) {
    const ym = monthKey(p.date);
    if (ym === "—") continue;
    const prev = map.get(ym) || { ym, total: 0, count: 0 };
    prev.total += p.total; prev.count += p.count;
    map.set(ym, prev);
  }
  return Array.from(map.values()).filter(m => m.ym).sort((a,b) => a.ym.localeCompare(b.ym));
});
const seriesMonths = computed(() => [{ name: "Total ($)", data: monthsAgg.value.map(m => Math.round(m.total)) }]);
const monthsLabels = computed(() => monthsAgg.value.map(m => monthLabel(m.ym)));

// ─── Top Cashiers ─────────────────────────────────────────────────────────
const topCashiers10 = computed(() =>
  [...(topCashiers.value || [])].sort((a,b) => Number(b.total||0) - Number(a.total||0)).slice(0,10)
);
const cashierCats   = computed(() => topCashiers10.value.map(x => String(x?.user_label || x?.user_name || x?.name || (x?.user_id ? `User #${x.user_id}` : "—"))));
const cashierBranches = computed(() => topCashiers10.value.map(x => x?.branch_name || null));
const seriesCashiers = computed(() => [{ name: "Total ($)", data: topCashiers10.value.map(x => Math.round(Number(x?.total||0))) }]);

// ─── Invoice Type ─────────────────────────────────────────────────────────
const invoiceTypeMap    = { TICKET:"Ticket", A:"Factura A", B:"Factura B", C:"Factura C", M:"Factura M", NC:"Nota Crédito", ND:"Nota Débito", NO_FISCAL:"No Fiscal" };
const invoiceTypeColors = { TICKET:"#f59e0b", B:"#10b981", A:"#3b82f6", C:"#8b5cf6", M:"#ef4444", NC:"#06b6d4", ND:"#f97316", NO_FISCAL:"#94a3b8" };
const invoiceTypeSeries = computed(() => salesByInvoiceType.value.map(t => Number(t.count||0)));
const invoiceTypeLabels = computed(() => salesByInvoiceType.value.map(t => invoiceTypeMap[t.invoice_type] || t.invoice_type));
const invoiceTypeClrs   = computed(() => salesByInvoiceType.value.map(t => invoiceTypeColors[t.invoice_type] || "#94a3b8"));
const invoiceTypeTotal  = computed(() => salesByInvoiceType.value.reduce((a,t) => a + Number(t.count||0), 0));

// ─── Top Products ─────────────────────────────────────────────────────────
const topProducts10 = computed(() => {
  const arr = [...(topProducts.value||[])].sort((a,b) =>
    productToggle.value === "units" ? Number(b.units||0) - Number(a.units||0) : Number(b.total||0) - Number(a.total||0)
  );
  return arr.slice(0,10);
});
const productCats   = computed(() => topProducts10.value.map(x => String(x?.product_name||x?.name||(x?.product_id?`#${x.product_id}`:"—"))));
const seriesProducts = computed(() => {
  if (productToggle.value === "units")
    return [{ name: "Unidades", data: topProducts10.value.map(x => Number(x?.units||0)) }];
  return [{ name: "Total ($)", data: topProducts10.value.map(x => Math.round(Number(x?.total||0))) }];
});

// ─── Branch Donut ─────────────────────────────────────────────────────────
const salesByBranch = computed(() => {
  if (Array.isArray(props.sales?.salesByBranchPeriod)) return props.sales.salesByBranchPeriod;
  const map = new Map();
  for (const s of lastSales.value) {
    const bid  = s?.branch_id ?? s?.branch?.id ?? null;
    const name = s?.branch?.name || (bid ? `Sucursal #${bid}` : "—");
    const key  = String(bid ?? name);
    const prev = map.get(key) || { branch_id: bid, branch_name: name, total: 0, count: 0 };
    prev.total += Number(s?.total||0); prev.count++;
    map.set(key, prev);
  }
  return Array.from(map.values()).sort((a,b) => Number(b.total||0) - Number(a.total||0));
});
const branchTop      = computed(() => salesByBranch.value.slice(0,8));
const branchLabels   = computed(() => branchTop.value.map(b => b.branch_name || `Sucursal #${b.branch_id}`));
const branchSeries   = computed(() => branchTop.value.map(b => Number(b.total||0)));
const branchTotalSum = computed(() => branchTop.value.reduce((a,b) => a + Number(b.total||0), 0));

// ─── Apex common ──────────────────────────────────────────────────────────
const apexCommon = {
  chart: { toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: true, speed: 350 }, fontFamily: "inherit", foreColor: "rgba(var(--v-theme-on-surface), 0.70)" },
  grid: { borderColor: "rgba(var(--v-theme-on-surface), 0.07)", padding: { left: 12, right: 14, top: 4, bottom: 0 } },
  dataLabels: { enabled: false },
  legend: { labels: { colors: "rgba(var(--v-theme-on-surface), 0.70)" } },
};
const axisStyle  = { colors: "rgba(var(--v-theme-on-surface), 0.55)" };
const axisBorder = { color: "rgba(var(--v-theme-on-surface), 0.10)" };

// ─── Chart options ────────────────────────────────────────────────────────
const optTimeline = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "line" },
  colors: ["#6366f1", "#10b981"],
  stroke: { width: [2.5, 2], curve: "smooth", dashArray: [0, 5] },
  fill: {
    type: ["gradient", "solid"],
    gradient: { shade: "dark", type: "vertical", opacityFrom: 0.30, opacityTo: 0.02, stops: [0, 85, 100] },
  },
  markers: { size: [2, 0], strokeWidth: 2, hover: { size: 5 } },
  xaxis: {
    type: "datetime",
    tickAmount: timelineTickAmount.value,
    labels: { style: axisStyle, datetimeUTC: false, formatter: (val) => fmtDMFromMs(Number(val)) },
    axisBorder, axisTicks: axisBorder,
    tooltip: { enabled: false },
  },
  yaxis: [
    { tickAmount: 5, labels: { style: axisStyle, formatter: (v) => shortNumber(v) } },
    { opposite: true, tickAmount: 5, labels: { style: axisStyle, formatter: (v) => `${Math.round(Number(v||0))}` } },
  ],
  tooltip: {
    theme: "dark", shared: true,
    x: { formatter: (val) => new Date(Number(val)).toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit" }) },
    y: [{ formatter: (v) => money(v) }, { formatter: (v) => `${Math.round(Number(v||0))} transacciones` }],
  },
  legend: { show: true, position: "top", horizontalAlign: "right", labels: { colors: "rgba(var(--v-theme-on-surface), 0.70)" } },
  annotations: peakMax.value > 0 ? {
    points: [{ x: peakPoint.value?.ms, y: peakMax.value, marker: { size: 5, fillColor: "#6366f1" }, label: { text: `Pico ${money(peakMax.value)}`, style: { fontSize: "11px", background: "#6366f120", color: "#6366f1", border: "none" } } }],
  } : {},
}));

const optPaymentDonut = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "donut" },
  labels: paymentPeriodLabels.value,
  colors: paymentPeriodColors.value,
  stroke: { width: 0 },
  plotOptions: {
    pie: { donut: { size: "66%", labels: { show: true, total: { show: true, label: "Total", color: "rgba(var(--v-theme-on-surface), 0.6)", formatter: () => money(paymentPeriodTotal.value) } } } },
  },
  legend: { show: true, position: "bottom", labels: { colors: "rgba(var(--v-theme-on-surface), 0.70)" } },
  tooltip: { theme: "dark", y: { formatter: (v) => `${money(v)} · ${paymentPeriodTotal.value ? Math.round((v/paymentPeriodTotal.value)*100) : 0}%` } },
}));

const optMonthsBar = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  colors: ["#6366f1"],
  fill: { type: "gradient", gradient: { type: "vertical", opacityFrom: 1, opacityTo: 0.65 } },
  stroke: { show: false },
  plotOptions: { bar: { borderRadius: 5, columnWidth: "56%", dataLabels: { position: "top" } } },
  xaxis: { categories: monthsLabels.value, labels: { style: { ...axisStyle, fontSize: "11px" }, rotate: -20, trim: true }, axisBorder, axisTicks: axisBorder },
  yaxis: { labels: { style: axisStyle, formatter: (v) => shortNumber(v) } },
  tooltip: { theme: "dark", y: { formatter: (v) => money(v) } },
}));

const optHourly = computed(() => {
  const maxT = Math.max(...salesByHour.value.map(h => h.total), 1);
  const colors = salesByHour.value.map(h => {
    const r = h.total / maxT;
    if (r > 0.7)  return "#6366f1";
    if (r > 0.4)  return "#818cf8";
    if (r > 0.1)  return "#a5b4fc";
    return "rgba(var(--v-theme-on-surface), 0.10)";
  });
  return {
    ...apexCommon,
    chart: { ...apexCommon.chart, type: "bar" },
    colors: ["#6366f1"],
    fill: { opacity: 1, colors },
    stroke: { show: false },
    plotOptions: { bar: { borderRadius: 3, columnWidth: "70%", distributed: true } },
    xaxis: { categories: hourLabels.value, labels: { style: { ...axisStyle, fontSize: "9px" } }, axisBorder, axisTicks: axisBorder },
    yaxis: { labels: { style: axisStyle, formatter: (v) => shortNumber(v) } },
    legend: { show: false },
    tooltip: {
      theme: "dark",
      y: { formatter: (v, ctx) => {
        const h = salesByHour.value[ctx.dataPointIndex];
        return `${money(v)} · ${h?.count||0} ventas`;
      }},
    },
  };
});

const optCashiersBar = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  colors: ["#3b82f6"],
  fill: { type: "gradient", gradient: { type: "horizontal", opacityFrom: 1, opacityTo: 0.6 } },
  stroke: { show: false },
  plotOptions: { bar: { horizontal: true, borderRadius: 5, borderRadiusApplication: "end", barHeight: "55%", dataLabels: { position: "bottom" } } },
  dataLabels: { enabled: true, offsetX: 8, style: { fontSize: "11px", colors: ["rgba(var(--v-theme-on-surface), 0.7)"] }, formatter: (v) => shortNumber(v) },
  xaxis: { categories: cashierCats.value, labels: { style: axisStyle, formatter: (v) => shortNumber(v) }, axisBorder, axisTicks: axisBorder },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "11px" }, maxWidth: 150 } },
  tooltip: { theme: "dark", y: { formatter: (v, ctx) => {
    const c = topCashiers10.value[ctx.dataPointIndex];
    const branch = c?.branch_name ? ` · ${c.branch_name}` : "";
    return `${money(v)} · ${c?.count||0} ventas${branch}`;
  }}},
}));

const optInvoiceType = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "donut" },
  labels: invoiceTypeLabels.value,
  colors: invoiceTypeClrs.value,
  stroke: { width: 0 },
  plotOptions: {
    pie: { donut: { size: "64%", labels: { show: true, total: { show: true, label: "Total", formatter: () => `${invoiceTypeTotal.value}` } } } },
  },
  legend: { show: true, position: "bottom", labels: { colors: "rgba(var(--v-theme-on-surface), 0.70)" } },
  tooltip: { theme: "dark", y: { formatter: (v) => `${v} ventas · ${invoiceTypeTotal.value ? Math.round((v/invoiceTypeTotal.value)*100) : 0}%` } },
}));

const optProductsBar = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  colors: productToggle.value === "units" ? ["#10b981"] : ["#8b5cf6"],
  fill: { type: "gradient", gradient: { type: "horizontal", opacityFrom: 1, opacityTo: 0.55 } },
  stroke: { show: false },
  plotOptions: { bar: { horizontal: true, borderRadius: 5, borderRadiusApplication: "end", barHeight: "52%", dataLabels: { position: "bottom" } } },
  dataLabels: {
    enabled: true, offsetX: 6,
    style: { fontSize: "11px", colors: ["rgba(var(--v-theme-on-surface), 0.70)"] },
    formatter: (v) => productToggle.value === "units" ? `${Math.round(Number(v||0))} u.` : shortNumber(v),
  },
  xaxis: {
    categories: productCats.value,
    labels: { style: axisStyle, formatter: (v) => productToggle.value === "units" ? `${Math.round(Number(v||0))}` : shortNumber(v) },
    axisBorder, axisTicks: axisBorder,
  },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "11px" }, maxWidth: 200 } },
  tooltip: { theme: "dark", y: { formatter: (v) => productToggle.value === "units" ? `${Math.round(Number(v||0))} unidades` : money(v) } },
}));

const optBranchDonut = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "donut" },
  labels: branchLabels.value,
  colors: ["#6366f1","#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316"],
  stroke: { width: 0 },
  plotOptions: {
    pie: { donut: { size: "66%", labels: { show: true, total: { show: true, label: "Total", formatter: () => money(branchTotalSum.value) } } } },
  },
  legend: { show: true, position: "bottom", labels: { colors: "rgba(var(--v-theme-on-surface), 0.70)" } },
  tooltip: { theme: "dark", y: { formatter: (v) => `${money(v)} · ${branchTotalSum.value ? Math.round((v/branchTotalSum.value)*100) : 0}%` } },
}));

// ─── Branch ranking bar ───────────────────────────────────────────────────
const seriesBranchBar = computed(() => [{
  name: "Total ($)",
  data: branchTop.value.map(b => Math.round(Number(b.total || 0))),
}]);

const optBranchBar = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  colors: ["#6366f1","#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316"],
  fill: { type: "solid", opacity: 1 },
  stroke: { show: false },
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 6,
      borderRadiusApplication: "end",
      barHeight: "58%",
      distributed: true,
      dataLabels: { position: "bottom" },
    },
  },
  dataLabels: {
    enabled: true,
    offsetX: 8,
    style: { fontSize: "11px", fontWeight: 700, colors: ["rgba(var(--v-theme-on-surface), 0.75)"] },
    formatter: (v) => shortNumber(v),
  },
  xaxis: {
    categories: branchTop.value.map(b => b.branch_name || `Sucursal #${b.branch_id}`),
    labels: { style: axisStyle, formatter: shortNumber },
    axisBorder, axisTicks: axisBorder,
  },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "12px", fontWeight: 700 }, maxWidth: 160 } },
  legend: { show: false },
  tooltip: {
    theme: "dark",
    y: { formatter: (v, { dataPointIndex }) => {
      const b = branchTop.value[dataPointIndex];
      return `${money(v)} · ${b?.count || 0} ventas`;
    }},
  },
}));

// ─── Cashier ranking bar ─────────────────────────────────────────────────
const seriesCashierRanking = computed(() => [{
  name: "Total ($)",
  data: topCashiers10.value.map(x => Math.round(Number(x?.total || 0))),
}]);

const optCashierRanking = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  colors: ["#10b981","#06b6d4","#3b82f6","#8b5cf6","#f59e0b","#ef4444","#f97316","#ec4899","#14b8a6","#6366f1"],
  fill: { type: "solid", opacity: 1 },
  stroke: { show: false },
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 6,
      borderRadiusApplication: "end",
      barHeight: "58%",
      distributed: true,
      dataLabels: { position: "bottom" },
    },
  },
  dataLabels: {
    enabled: true,
    offsetX: 8,
    style: { fontSize: "11px", fontWeight: 700, colors: ["rgba(var(--v-theme-on-surface), 0.75)"] },
    formatter: (v) => shortNumber(v),
  },
  xaxis: {
    categories: cashierCats.value,
    labels: { style: axisStyle, formatter: shortNumber },
    axisBorder, axisTicks: axisBorder,
  },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "12px", fontWeight: 700 }, maxWidth: 150 } },
  legend: { show: false },
  tooltip: {
    theme: "dark",
    y: { formatter: (v, { dataPointIndex }) => {
      const c = topCashiers10.value[dataPointIndex];
      const branch = c?.branch_name ? ` · ${c.branch_name}` : "";
      return `${money(v)} · ${c?.count || 0} ventas${branch}`;
    }},
  },
}));

// ─── Table headers ───────────────────────────────────────────────────────
const headers = [
  { title: "ID",          key: "id",           sortable: false, width: 80  },
  { title: "Fecha",       key: "sold_at",       sortable: false, width: 180 },
  { title: "Sucursal",    key: "branch",        sortable: false, width: 160 },
  { title: "Vendedor",    key: "user",          sortable: false, width: 180 },
  { title: "Comprobante", key: "invoice_type",  sortable: false, width: 130 },
  { title: "Total",       key: "total",         sortable: false, width: 150 },
];

// ─── Analytics deep ──────────────────────────────────────────────────────
const ana = computed(() => props.analytics || {});

const DOW_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const heatmapData = computed(() => {
  const rows = Array.isArray(ana.value?.heatmap) ? ana.value.heatmap : [];
  return DOW_LABELS.map((label, dow) => ({
    name: label,
    data: Array.from({ length: 24 }, (_, h) => {
      const r = rows.find(x => num(x.dow) === dow && num(x.hour) === h);
      return { x: `${String(h).padStart(2,"0")}h`, y: num(r?.count), total: num(r?.total) };
    }),
  }));
});
const heatmapHasData = computed(() => {
  const rows = Array.isArray(ana.value?.heatmap) ? ana.value.heatmap : [];
  return rows.some(r => num(r.count) > 0);
});
const optHeatmap = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "heatmap" },
  dataLabels: { enabled: false },
  plotOptions: {
    heatmap: {
      shadeIntensity: 0.8,
      radius: 3,
      colorScale: {
        ranges: [
          { from: 0, to: 0,      color: "rgba(var(--v-theme-on-surface), 0.04)", name: "Sin ventas" },
          { from: 1, to: 3,      color: "#a5b4fc", name: "Bajo" },
          { from: 4, to: 10,     color: "#6366f1", name: "Medio" },
          { from: 11, to: 99999, color: "#4338ca", name: "Alto" },
        ],
      },
    },
  },
  stroke: { width: 1.5, colors: ["rgba(var(--v-theme-surface), 1)"] },
  xaxis: { labels: { style: { ...axisStyle, fontSize: "9px" } }, axisBorder, axisTicks: axisBorder },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "11px" } } },
  tooltip: { theme: "dark", y: { formatter: (v, { seriesIndex, dataPointIndex, w }) => {
    const total = w.config.series?.[seriesIndex]?.data?.[dataPointIndex]?.total;
    return `${v} ventas${total ? ` · ${money(total)}` : ""}`;
  }}},
}));

const methodColors2 = { CASH: "#10b981", CARD: "#3b82f6", TRANSFER: "#f59e0b", QR: "#ef4444", OTHER: "#8b5cf6" };
const paymentTrendRows    = computed(() => Array.isArray(ana.value?.paymentTrend) ? ana.value.paymentTrend : []);
const paymentTrendMonths  = computed(() => [...new Set(paymentTrendRows.value.map(r => r.ym))].sort());
const paymentTrendMethods = computed(() => [...new Set(paymentTrendRows.value.map(r => r.method))]);
const seriesPaymentTrend  = computed(() =>
  paymentTrendMethods.value.map(m => ({
    name: methodLabel(m),
    data: paymentTrendMonths.value.map(ym => {
      const r = paymentTrendRows.value.find(x => x.ym === ym && x.method === m);
      return num(r?.total);
    }),
    color: methodColors2[m] || "#94a3b8",
  }))
);
const optPaymentTrend = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar", stacked: true },
  plotOptions: { bar: { columnWidth: "60%", borderRadius: 4 } },
  dataLabels: { enabled: false },
  xaxis: { categories: paymentTrendMonths.value, labels: { style: { ...axisStyle, fontSize: "11px" }, rotate: -20 } },
  yaxis: { labels: { style: axisStyle, formatter: shortNumber } },
  legend: { show: true, position: "top", labels: { colors: "rgba(var(--v-theme-on-surface), 0.70)" } },
  tooltip: { theme: "dark", y: { formatter: (v) => money(v) } },
}));

const discounts   = computed(() => ana.value?.discounts   || {});
const refunds     = computed(() => ana.value?.refunds     || {});
const cancelled   = computed(() => ana.value?.cancelled   || {});
const itemsStats  = computed(() => ana.value?.items       || {});

const topCustomers       = computed(() => Array.isArray(ana.value?.topCustomers) ? ana.value.topCustomers.slice(0,10) : []);
const seriesTopCustomers = computed(() => [{ name: "Total $", data: topCustomers.value.map(r => num(r.total)) }]);
const optTopCustomers    = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: "65%", distributed: true, dataLabels: { position: "top" } } },
  dataLabels: { enabled: true, formatter: shortNumber, style: { ...axisStyle, fontSize: "10px" } },
  xaxis: {
    categories: topCustomers.value.map(r => r.name?.length > 20 ? r.name.slice(0,18)+"…" : r.name),
    labels: { style: axisStyle, formatter: shortNumber },
  },
  yaxis: { labels: { style: { ...axisStyle, fontSize: "11px" }, maxWidth: 180 } },
  legend: { show: false },
  tooltip: { theme: "dark", y: { formatter: (v, { dataPointIndex }) => {
    const r = topCustomers.value[dataPointIndex];
    return `${money(v)} · ${r?.count} visitas`;
  }}},
  colors: ["#6366f1","#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899","#14b8a6"],
}));

const dowTicket    = computed(() => Array.isArray(ana.value?.avgTicketByDow) ? ana.value.avgTicketByDow : []);
const seriesAvgDow = computed(() => [{ name: "Ticket promedio", data: dowTicket.value.map(r => Math.round(num(r.avgTicket))) }]);
const optAvgDow    = computed(() => ({
  ...apexCommon,
  chart: { ...apexCommon.chart, type: "bar" },
  plotOptions: { bar: { columnWidth: "58%", borderRadius: 5, distributed: true } },
  dataLabels: { enabled: false },
  xaxis: { categories: DOW_LABELS, labels: { style: axisStyle } },
  yaxis: { labels: { style: axisStyle, formatter: shortNumber } },
  legend: { show: false },
  tooltip: { theme: "dark", y: { formatter: (v, { dataPointIndex }) => {
    const r = dowTicket.value[dataPointIndex];
    return `${money(v)} · ${r?.count} ventas`;
  }}},
  colors: ["#6366f1","#818cf8","#a5b4fc","#c7d2fe","#3b82f6","#60a5fa","#93c5fd"],
}));
</script>

<style scoped>
/* ── Root ────────────────────────────────────────────────────────────────── */
.dv {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Period bar ──────────────────────────────────────────────────────────── */
.dv-period-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.dv-period-label {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.45);
  flex-shrink: 0;
}
.dv-period-pills {
  display: flex;
  gap: 4px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 10px;
  padding: 3px;
}
.dv-pill {
  padding: 5px 14px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.dv-pill:hover { color: rgb(var(--v-theme-on-surface)); }
.dv-pill--active {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  box-shadow: 0 1px 6px rgba(0,0,0,.10), 0 0 0 1px rgba(var(--v-theme-on-surface), 0.07);
}
.dv-today-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.50);
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  white-space: nowrap;
}
.dv-today-chip b { color: rgba(var(--v-theme-on-surface), 0.80); font-weight: 800; }
.dv-today-dot {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 5px rgba(16,185,129,.7);
  flex-shrink: 0;
}

.dv-bar-spacer { flex: 1; }

.dv-scope {
  display: flex;
  align-items: center;
  font-size: 11.5px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.45);
}

/* Branch selector */
.dv-branch-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px 5px 10px;
  border-radius: 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-on-surface), 0.04);
  cursor: pointer;
  transition: border-color 0.15s;
}
.dv-branch-wrap:hover { border-color: rgba(var(--v-theme-on-surface), 0.25); }
.dv-branch-icon    { color: rgba(var(--v-theme-on-surface), 0.50); flex-shrink: 0; }
.dv-branch-chevron { color: rgba(var(--v-theme-on-surface), 0.40); flex-shrink: 0; }
.dv-branch-label {
  font-size: 12px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.80);
  white-space: nowrap;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── KPI row ─────────────────────────────────────────────────────────────── */
.dv-kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
@media (max-width: 1100px) { .dv-kpi-row { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px)  { .dv-kpi-row { grid-template-columns: 1fr; } }

.dv-kpi {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
  overflow: hidden;
}
.dv-kpi::before {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--kpi-accent, #6366f1);
  border-radius: 3px 0 0 3px;
}
.dv-kpi-badge {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dv-kpi-body  { flex: 1; min-width: 0; }
.dv-kpi-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(var(--v-theme-on-surface), 0.50);
  margin-bottom: 2px;
}
.dv-kpi-period { text-transform: none; opacity: 0.7; }
.dv-kpi-value {
  font-size: 1.8rem;
  font-weight: 950;
  letter-spacing: -0.04em;
  line-height: 1;
  color: rgb(var(--v-theme-on-surface));
}
.dv-kpi-value--sm { font-size: 1.4rem; }
.dv-kpi-value--xs { font-size: 1.1rem; }
.dv-kpi-meta {
  margin-top: 4px;
  font-size: 11.5px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.50);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dv-kpi-trend {
  position: absolute;
  top: 12px; right: 14px;
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 20px;
}
.dv-kpi-trend.up  { background: rgba(16,185,129,.12); color: #10b981; }
.dv-kpi-trend.dn  { background: rgba(239,68,68,.10);  color: #ef4444; }

/* ── Card ────────────────────────────────────────────────────────────────── */
.dv-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09) !important;
  border-radius: 16px !important;
  overflow: hidden;
}
.h-full { height: 100%; }

.dv-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px 12px;
}
.dv-head-left { min-width: 0; }
.dv-head-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.dv-title {
  font-weight: 900;
  font-size: 13.5px;
  letter-spacing: -0.01em;
  color: rgb(var(--v-theme-on-surface));
}
.dv-sub {
  margin-top: 2px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.45);
}
.dv-divider { border-color: rgba(var(--v-theme-on-surface), 0.07) !important; }

.dv-body { padding: 0; }

.dv-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
.dv-empty {
  padding: 36px 20px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.40);
}

.dv-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px 12px;
  font-size: 11.5px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.50);
}
.dv-foot b  { color: rgba(var(--v-theme-on-surface), 0.80); }
.dot        { opacity: 0.4; }

.chip-soft { border: 1px solid rgba(var(--v-theme-on-surface), 0.10) !important; }

.op60 { opacity: 0.6; }

/* ── Toggle ─────────────────────────────────────────────────────────────── */
.dv-toggle {
  display: flex;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
}
.dv-toggle-btn {
  padding: 4px 12px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}
.dv-toggle-btn.active {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  box-shadow: 0 1px 4px rgba(0,0,0,.10);
}

/* ── Analytics grid ─────────────────────────────────────────────────────── */
.dv-ana-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
@media (max-width: 800px) { .dv-ana-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .dv-ana-grid { grid-template-columns: 1fr; } }

.dv-ana-item {
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}
.dv-ana-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(var(--v-theme-on-surface), 0.45);
  margin-bottom: 4px;
}
.dv-ana-val {
  font-size: 1.35rem;
  font-weight: 950;
  letter-spacing: -0.03em;
  line-height: 1;
}
.dv-ana-sub {
  font-size: 10.5px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.45);
  margin-top: 3px;
}

/* ── Table ──────────────────────────────────────────────────────────────── */
.dv-table :deep(.v-table__wrapper),
.dv-table :deep(table),
.dv-table :deep(.v-data-table__wrapper) {
  background: transparent !important;
}

/* ── Responsive ─────────────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .dv-period-bar { gap: 8px; }
  .dv-period-pills { flex-wrap: wrap; }
}
</style>
