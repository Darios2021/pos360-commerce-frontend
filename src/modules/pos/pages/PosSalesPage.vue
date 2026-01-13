<!-- src/modules/pos/pages/PosSalesPage.vue -->
<template>
  <v-container fluid class="pa-4 bg-grey-lighten-4" style="min-height: 100vh">
    <!-- HEADER -->
    <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Ventas</div>
        <div class="text-caption text-medium-emphasis">
          Total: <b>{{ meta.total }}</b> · Página {{ meta.page }}/{{ meta.pages || 1 }}
        </div>
      </div>

      <div class="d-flex ga-2 align-center flex-wrap">
        <v-btn variant="tonal" @click="resetFilters" :disabled="loading || statsLoading">
          <v-icon start>mdi-filter-off</v-icon>
          Reset
        </v-btn>

        <v-btn variant="tonal" @click="exportCsv" :disabled="loading || !sales.length">
          <v-icon start>mdi-file-delimited-outline</v-icon>
          Exportar
        </v-btn>

        <v-btn color="primary" @click="refreshAll" :loading="loading || statsLoading">
          <v-icon start>mdi-refresh</v-icon>
          Actualizar
        </v-btn>
      </div>
    </div>

    <!-- ✅ STATS GRANDES (siguen filtros) -->
    <v-row dense class="mb-4">
      <v-col cols="12" md="3">
        <KpiCard
          title="Ventas"
          :value="stats.ready ? stats.sales_count : '—'"
          icon="mdi-receipt-text-outline"
          :loading="statsLoading"
        />
      </v-col>

      <v-col cols="12" md="3">
        <KpiCard
          title="Bruto vendido"
          :value="stats.ready ? money(stats.gross_total_sum) : '—'"
          icon="mdi-cash-plus"
          :loading="statsLoading"
          subtitle="Antes de devoluciones"
        />
      </v-col>

      <v-col cols="12" md="3">
        <KpiCard
          title="Devoluciones"
          :value="stats.ready ? money(stats.refunds_sum) : '—'"
          icon="mdi-cash-refund"
          :loading="statsLoading"
          subtitle="Total reintegrado"
        />
      </v-col>

      <v-col cols="12" md="3">
        <KpiCard
          title="Neto vendido"
          :value="stats.ready ? money(stats.total_sum) : '—'"
          icon="mdi-cash-check"
          :loading="statsLoading"
          subtitle="Bruto - devoluciones"
        />
      </v-col>

      <v-col cols="12">
        <v-card class="rounded-xl" elevation="1">
          <v-card-text class="d-flex align-center justify-space-between flex-wrap ga-2">
            <div class="text-subtitle-2 font-weight-bold">Pagos por método (neto)</div>

            <div class="d-flex ga-2 flex-wrap">
              <v-chip size="small" variant="tonal">Efectivo: {{ stats.ready ? money(stats.net_by_method.cash) : "—" }}</v-chip>
              <v-chip size="small" variant="tonal">Transferencia: {{ stats.ready ? money(stats.net_by_method.transfer) : "—" }}</v-chip>
              <v-chip size="small" variant="tonal">Tarjeta: {{ stats.ready ? money(stats.net_by_method.card) : "—" }}</v-chip>
              <v-chip size="small" variant="tonal">QR: {{ stats.ready ? money(stats.net_by_method.qr) : "—" }}</v-chip>
              <v-chip size="small" variant="tonal">Otro: {{ stats.ready ? money(stats.net_by_method.other) : "—" }}</v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- FILTROS -->
    <v-expansion-panels class="mb-4" variant="accordion">
      <v-expansion-panel elevation="1" class="rounded-xl">
        <v-expansion-panel-title>
          <div class="d-flex align-center ga-2">
            <v-icon>mdi-filter</v-icon>
            <b>Filtros</b>
            <v-chip size="x-small" class="ml-2" variant="tonal">
              Página {{ meta.page }} · {{ meta.limit }}/pág
            </v-chip>

            <!-- ✅ Ayuda visual: qué status está filtrando -->
            <v-chip size="x-small" class="ml-2" variant="tonal" color="primary">
              Estado: {{ status ? statusLabel(status) : "Todos" }}
            </v-chip>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-row dense class="align-center">
            <!-- ✅ BUSCADOR GLOBAL REAL (manda q al backend) -->
            <v-col cols="12" md="4">
              <v-text-field
                v-model="q"
                label="Buscar (cliente / nro / id)"
                placeholder="Ej: Consumidor · 85 · 0001"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
                @keyup.enter="applyFilters"
                @click:clear="applyFilters"
              />
              <div class="text-caption text-medium-emphasis mt-1">
                Este campo usa <b>q</b> del backend. (Si querés que busque por producto/vendedor, hay que extender el backend).
              </div>
            </v-col>

            <v-col cols="12" sm="6" md="3">
              <v-autocomplete
                v-model="sellerId"
                :items="sellerItems"
                :loading="sellerLoading"
                label="Cajero / Vendedor"
                placeholder="Buscar vendedor"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
                item-title="title"
                item-value="value"
                @update:search="onSellerSearch"
                @update:model-value="applyFilters"
              />
            </v-col>

            <v-col cols="12" sm="6" md="3">
              <v-autocomplete
                v-model="productId"
                :items="productItems"
                :loading="productLoading"
                label="Producto (vendido)"
                placeholder="Buscar producto en ventas"
                prepend-inner-icon="mdi-package-variant-closed"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
                item-title="title"
                item-value="value"
                @update:search="onProductSearch"
                @update:model-value="applyFilters"
              />
            </v-col>

            <v-col cols="12" sm="6" md="2">
              <v-select
                v-model="payMethod"
                :items="payMethodItems"
                label="Tipo de pago"
                variant="outlined"
                density="comfortable"
                hide-details
                @update:model-value="applyFilters"
              />
            </v-col>

            <v-col cols="12" sm="6" md="2">
              <v-select
                v-model="status"
                :items="statusItems"
                label="Estado"
                variant="outlined"
                density="comfortable"
                hide-details
                @update:model-value="applyFilters"
              />
            </v-col>

            <v-col cols="12" md="3" v-if="isAdmin">
              <v-select
                v-model="selectedBranchId"
                :items="branchSelectItems"
                label="Sucursal"
                variant="outlined"
                density="comfortable"
                hide-details
                :loading="branchesLoading"
                @update:model-value="onBranchChanged"
              />
            </v-col>

            <v-col cols="12" sm="6" md="2">
              <v-menu v-model="fromMenu" :close-on-content-click="false" location="bottom">
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="from || ''"
                    label="Desde"
                    prepend-inner-icon="mdi-calendar"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    readonly
                    placeholder="(sin fecha)"
                  />
                </template>
                <v-date-picker v-model="from" show-adjacent-months @update:model-value="fromMenu = false; applyFilters()" />
              </v-menu>
            </v-col>

            <v-col cols="12" sm="6" md="2">
              <v-menu v-model="toMenu" :close-on-content-click="false" location="bottom">
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="to || ''"
                    label="Hasta"
                    prepend-inner-icon="mdi-calendar"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    readonly
                    placeholder="(sin fecha)"
                  />
                </template>
                <v-date-picker v-model="to" show-adjacent-months @update:model-value="toMenu = false; applyFilters()" />
              </v-menu>
            </v-col>

            <v-col cols="12" md="3">
              <div class="d-flex ga-2 flex-wrap">
                <v-btn size="small" variant="tonal" @click="setToday">Hoy</v-btn>
                <v-btn size="small" variant="tonal" @click="setThisWeek">Esta semana</v-btn>
                <v-btn size="small" variant="tonal" @click="setThisMonth">Este mes</v-btn>
                <v-btn size="small" variant="text" @click="clearDates">Limpiar</v-btn>
              </div>
            </v-col>

            <v-col cols="12" md="2">
              <v-select
                v-model="meta.limit"
                :items="[10, 20, 50, 100]"
                label="Por página"
                density="compact"
                variant="outlined"
                hide-details
                @update:model-value="meta.page = 1; refreshAll()"
              />
            </v-col>

            <v-col cols="12" md="1">
              <v-btn block color="primary" @click="applyFilters" :loading="loading || statsLoading">
                <v-icon>mdi-filter</v-icon>
              </v-btn>
            </v-col>

            <v-col cols="12" class="pt-0">
              <v-chip size="small" variant="tonal" color="primary">
                Sucursal: {{ effectiveBranchId ?? "— (todas)" }}
              </v-chip>
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- TABLA -->
    <v-card class="rounded-xl" elevation="1">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div class="d-flex align-center ga-2">
          <div class="text-subtitle-1 font-weight-bold">Ventas</div>
          <v-chip size="small" variant="tonal">Mostrando {{ sales.length }} de {{ meta.total }}</v-chip>
        </div>

        <div class="d-flex ga-2 align-center">
          <v-btn size="small" variant="tonal" @click="toggleDense">
            <v-icon start>{{ dense ? "mdi-format-line-spacing" : "mdi-format-line-weight" }}</v-icon>
            {{ dense ? "Normal" : "Compacta" }}
          </v-btn>
        </div>
      </v-card-title>

      <v-divider />

      <v-data-table
        :headers="headers"
        :items="sales"
        :loading="loading"
        item-key="id"
        :density="dense ? 'compact' : 'comfortable'"
        hover
        class="elevation-0"
        :items-per-page="-1"
        hide-default-footer
        @click:row="onRowClick"
      >
        <template #item.sold_at="{ item }">
          <div class="font-weight-medium">{{ dt(item.sold_at) }}</div>
          <div class="text-caption text-medium-emphasis">
            ID: {{ item.id }}
            <span v-if="item.sale_number">· N°: {{ item.sale_number }}</span>
          </div>
        </template>

        <template #item.seller="{ item }">
          <div class="font-weight-bold">
            {{ item.user?.username || fullUserName(item.user) || `Usuario #${item.user_id}` }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ item.branch?.name || `Sucursal #${item.branch_id}` }}
          </div>
        </template>

        <template #item.customer="{ item }">
          <div class="font-weight-bold">{{ item.customer_name || "Consumidor Final" }}</div>
          <div class="text-caption text-medium-emphasis">
            <span v-if="item.customer_doc">Doc: {{ item.customer_doc }}</span>
            <span v-if="item.customer_doc && item.customer_phone"> · </span>
            <span v-if="item.customer_phone">Tel: {{ item.customer_phone }}</span>
          </div>
        </template>

        <!-- ✅ NUEVO: PRODUCTO -->
        <template #item.product="{ item }">
          <div class="font-weight-bold">
            {{ primaryProductName(item) }}
          </div>
          <div class="text-caption text-medium-emphasis" v-if="productExtraCount(item) > 0">
            +{{ productExtraCount(item) }} producto(s) más
          </div>
          <div class="text-caption text-medium-emphasis" v-else>
            {{ primaryProductSku(item) }}
          </div>
        </template>

        <template #item.total="{ item }">
          <div class="font-weight-black">{{ money(item.total) }}</div>
          <div class="text-caption text-medium-emphasis">
            Pagado: {{ money(item.paid_total) }} · Vuelto: {{ money(item.change_total) }}
          </div>
        </template>

        <template #item.method="{ item }">
          <v-chip size="small" variant="tonal" :color="payColor(primaryPayment(item)?.method)">
            {{ methodLabel(primaryPayment(item)?.method) }}
          </v-chip>
          <div class="text-caption text-medium-emphasis" v-if="(item.payments || []).length > 1">
            +{{ item.payments.length - 1 }} pago(s)
          </div>
        </template>

        <template #item.status="{ item }">
          <v-chip size="small" variant="tonal" :color="statusColor(item.status)">
            {{ statusLabel(item.status) }}
          </v-chip>
        </template>

        <!-- ✅ VER + ACCIONES -->
        <template #item.actions="{ item }">
          <div class="d-flex ga-2 align-center flex-wrap">
            <v-btn
              size="small"
              variant="tonal"
              color="primary"
              @click.stop="openPostSale(item, 'summary')"
              title="Ver (barra lateral)"
            >
              <v-icon start>mdi-eye-outline</v-icon>
              Ver
            </v-btn>

            <v-menu>
              <template #activator="{ props }">
                <v-btn v-bind="props" size="small" variant="tonal">
                  <v-icon start>mdi-dots-vertical</v-icon>
                  Acciones
                </v-btn>
              </template>

              <v-list density="comfortable">
                <v-list-item @click="goDetail(item.id)">
                  <template #prepend><v-icon>mdi-eye</v-icon></template>
                  <v-list-item-title>Ver detalle</v-list-item-title>
                </v-list-item>

                <v-list-item @click="openPostSale(item, 'summary')">
                  <template #prepend><v-icon color="primary">mdi-eye-outline</v-icon></template>
                  <v-list-item-title>Ver (barra lateral)</v-list-item-title>
                </v-list-item>

                <v-divider />

                <v-list-item @click="openPostSale(item, 'refunds')">
                  <template #prepend><v-icon color="orange">mdi-cash-refund</v-icon></template>
                  <v-list-item-title>Registrar devolución</v-list-item-title>
                </v-list-item>

                <v-list-item @click="openPostSale(item, 'exchanges')">
                  <template #prepend><v-icon color="cyan">mdi-swap-horizontal</v-icon></template>
                  <v-list-item-title>Registrar cambio</v-list-item-title>
                </v-list-item>

                <v-divider />

                <v-list-item @click="copyText(String(item.id))">
                  <template #prepend><v-icon>mdi-content-copy</v-icon></template>
                  <v-list-item-title>Copiar ID</v-list-item-title>
                </v-list-item>

                <v-divider v-if="isAdmin" />

                <v-list-item v-if="isAdmin" @click="openDelete(item)">
                  <template #prepend><v-icon color="red">mdi-trash-can-outline</v-icon></template>
                  <v-list-item-title>Eliminar venta</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </template>

        <template #bottom>
          <div class="d-flex align-center justify-space-between pa-3 flex-wrap ga-2">
            <div class="text-caption text-medium-emphasis">
              Página <b>{{ meta.page }}</b> de <b>{{ meta.pages }}</b> · Total <b>{{ meta.total }}</b>
            </div>

            <div class="d-flex align-center ga-2">
              <v-btn variant="text" :disabled="meta.page <= 1 || loading || statsLoading" @click="prevPage">
                <v-icon start>mdi-chevron-left</v-icon>
                Anterior
              </v-btn>

              <v-btn variant="text" :disabled="meta.page >= meta.pages || loading || statsLoading" @click="nextPage">
                Siguiente
                <v-icon end>mdi-chevron-right</v-icon>
              </v-btn>
            </div>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- DRAWER -->
    <v-navigation-drawer v-model="postSale.open" location="right" temporary width="520" class="pa-0">
      <div class="pa-4 d-flex align-center justify-space-between">
        <div>
          <div class="text-subtitle-1 font-weight-black">Vista rápida</div>
          <div class="text-caption text-medium-emphasis" v-if="postSale.sale?.id">
            Venta #{{ postSale.sale.id }} · {{ dt(postSale.sale.sold_at) }}
          </div>
        </div>

        <div class="d-flex ga-2">
          <v-btn icon variant="tonal" @click="refreshPostSale" :loading="postSale.loading" :disabled="!postSale.sale?.id">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
          <v-btn icon variant="text" @click="postSale.open = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <v-divider />

      <div class="pa-4" v-if="!postSale.sale?.id">
        <v-alert type="info" variant="tonal">Seleccioná una venta para ver información rápida.</v-alert>
      </div>

      <div v-else class="pa-0">
        <v-tabs v-model="postSale.tab" density="comfortable" class="px-2">
          <v-tab value="summary">
            <v-icon start>mdi-information-outline</v-icon>
            Resumen
          </v-tab>
          <v-tab value="refunds">
            <v-icon start color="orange">mdi-cash-refund</v-icon>
            Devoluciones
            <v-chip class="ml-2" size="x-small" variant="tonal">{{ postSale.refunds.length }}</v-chip>
          </v-tab>
          <v-tab value="exchanges">
            <v-icon start color="cyan">mdi-swap-horizontal</v-icon>
            Cambios
            <v-chip class="ml-2" size="x-small" variant="tonal">{{ postSale.exchanges.length }}</v-chip>
          </v-tab>
        </v-tabs>

        <v-divider />

        <!-- SUMMARY -->
        <div v-show="postSale.tab === 'summary'" class="pa-4">
          <v-card class="rounded-xl mb-3" elevation="0" variant="outlined">
            <v-card-text>
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-caption text-medium-emphasis">Cliente</div>
                  <div class="font-weight-bold">{{ postSale.sale.customer_name || "Consumidor Final" }}</div>
                  <div class="text-caption text-medium-emphasis">
                    <span v-if="postSale.sale.customer_doc">Doc: {{ postSale.sale.customer_doc }}</span>
                    <span v-if="postSale.sale.customer_doc && postSale.sale.customer_phone"> · </span>
                    <span v-if="postSale.sale.customer_phone">Tel: {{ postSale.sale.customer_phone }}</span>
                  </div>

                  <div class="text-caption text-medium-emphasis mt-2">
                    Vendedor: <b>{{ postSale.sale.user?.username || fullUserName(postSale.sale.user) || `#${postSale.sale.user_id}` }}</b>
                    · Sucursal: <b>{{ postSale.sale.branch?.name || `#${postSale.sale.branch_id}` }}</b>
                  </div>
                </div>
                <v-chip size="small" variant="tonal" :color="statusColor(postSale.sale.status)">
                  {{ statusLabel(postSale.sale.status) }}
                </v-chip>
              </div>

              <v-divider class="my-3" />

              <div class="d-flex justify-space-between">
                <div>
                  <div class="text-caption text-medium-emphasis">Total</div>
                  <div class="text-h6 font-weight-black">{{ money(postSale.sale.total) }}</div>
                </div>
                <div class="text-right">
                  <div class="text-caption text-medium-emphasis">Pagado</div>
                  <div class="text-h6 font-weight-black">{{ money(postSale.sale.paid_total) }}</div>
                  <div class="text-caption text-medium-emphasis">Vuelto: {{ money(postSale.sale.change_total) }}</div>
                </div>
              </div>

              <v-divider class="my-3" />

              <div>
                <div class="text-caption text-medium-emphasis mb-2">Pagos</div>
                <div class="d-flex flex-wrap ga-2">
                  <v-chip
                    v-for="p in (postSale.sale.payments || [])"
                    :key="p.id || p.created_at || JSON.stringify(p)"
                    size="small"
                    variant="tonal"
                    :color="payColor(p.method)"
                  >
                    {{ methodLabel(p.method) }}: {{ money(p.amount) }}
                  </v-chip>
                  <v-chip v-if="!(postSale.sale.payments || []).length" size="small" variant="tonal">
                    (sin pagos)
                  </v-chip>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <div class="d-flex ga-2 flex-wrap">
            <v-btn color="orange" variant="flat" @click="openRefundFromPostSale" :disabled="!postSale.sale?.id">
              <v-icon start>mdi-cash-refund</v-icon>
              Nueva devolución
            </v-btn>

            <v-btn color="cyan" variant="flat" @click="openExchangeFromPostSale" :disabled="!postSale.sale?.id">
              <v-icon start>mdi-swap-horizontal</v-icon>
              Nuevo cambio
            </v-btn>

            <v-spacer />

            <v-btn variant="tonal" @click="goDetail(postSale.sale.id)">
              <v-icon start>mdi-eye</v-icon>
              Ver detalle
            </v-btn>
          </div>
        </div>

        <!-- REFUNDS -->
        <div v-show="postSale.tab === 'refunds'" class="pa-4">
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="text-subtitle-2 font-weight-bold">Devoluciones</div>
            <v-btn color="orange" variant="tonal" @click="openRefundFromPostSale">
              <v-icon start>mdi-plus</v-icon>
              Registrar
            </v-btn>
          </div>

          <v-alert v-if="!postSale.refunds.length" type="info" variant="tonal">
            No hay devoluciones registradas para esta venta.
          </v-alert>

          <v-card v-for="r in postSale.refunds" :key="r.id" class="rounded-xl mb-2" variant="outlined">
            <v-card-text>
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-caption text-medium-emphasis">Fecha</div>
                  <div class="font-weight-bold">{{ dt(r.created_at) }}</div>
                </div>
                <v-chip size="small" variant="tonal" color="orange">
                  {{ money(r.amount) }}
                </v-chip>
              </div>

              <div class="text-caption text-medium-emphasis mt-2">
                Medio: <b>{{ methodLabel(r.refund_method) }}</b>
                <span v-if="r.reference"> · Ref: {{ r.reference }}</span>
              </div>

              <div class="text-caption text-medium-emphasis" v-if="r.reason">
                Motivo: {{ r.reason }}
              </div>
            </v-card-text>
          </v-card>
        </div>

        <!-- EXCHANGES -->
        <div v-show="postSale.tab === 'exchanges'" class="pa-4">
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="text-subtitle-2 font-weight-bold">Cambios</div>
            <v-btn color="cyan" variant="tonal" @click="openExchangeFromPostSale">
              <v-icon start>mdi-plus</v-icon>
              Registrar
            </v-btn>
          </div>

          <v-alert v-if="!postSale.exchanges.length" type="info" variant="tonal">
            No hay cambios registrados para esta venta.
          </v-alert>

          <v-card v-for="x in postSale.exchanges" :key="x.id" class="rounded-xl mb-2" variant="outlined">
            <v-card-text>
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-caption text-medium-emphasis">Fecha</div>
                  <div class="font-weight-bold">{{ dt(x.created_at) }}</div>
                </div>
                <v-chip size="small" variant="tonal" color="cyan">
                  Dif: {{ money(x.diff) }}
                </v-chip>
              </div>

              <div class="text-caption text-medium-emphasis mt-2">
                Original: {{ money(x.original_total) }} · Nuevo: {{ money(x.new_total) }} · Devuelto: {{ money(x.returned_amount) }}
              </div>

              <div class="text-caption text-medium-emphasis" v-if="x.note">
                Nota: {{ x.note }}
              </div>
            </v-card-text>
          </v-card>
        </div>
      </div>
    </v-navigation-drawer>

    <!-- DIALOG DEVOLUCIÓN -->
    <v-dialog v-model="refundDialog.show" max-width="760">
      <v-card>
        <v-card-title class="font-weight-bold d-flex align-center justify-space-between">
          <div>Registrar devolución</div>
          <v-chip size="small" variant="tonal" color="orange">
            Venta #{{ refundDialog.sale?.id || "—" }}
          </v-chip>
        </v-card-title>

        <v-divider />

        <v-card-text>
          <div class="text-caption text-medium-emphasis mb-3">
            Total: <b>{{ money(refundDialog.sale?.total) }}</b> · Pagado:
            <b>{{ money(refundDialog.sale?.paid_total) }}</b>
          </div>

          <v-card class="rounded-lg mb-3" variant="tonal">
            <v-card-text class="py-3">
              <div class="d-flex align-center justify-space-between flex-wrap ga-2">
                <div class="text-subtitle-2 font-weight-bold">Pagado por</div>
                <v-chip size="small" variant="tonal">
                  Método sugerido: <b class="ml-1">{{ methodLabel(refundForm.method) }}</b>
                </v-chip>
              </div>

              <div class="d-flex flex-wrap ga-2 mt-2">
                <v-chip
                  v-for="p in refundPaymentsSummary"
                  :key="p.key"
                  size="small"
                  variant="tonal"
                  :color="payColor(p.method)"
                >
                  {{ methodLabel(p.method) }}: {{ money(p.amount) }}
                </v-chip>
                <v-chip v-if="!refundPaymentsSummary.length" size="small" variant="tonal">
                  (sin pagos en el detalle)
                </v-chip>
              </div>

              <div class="text-caption text-medium-emphasis mt-2">
                Por defecto, el reintegro se sugiere por el mismo medio principal.
              </div>
            </v-card-text>
          </v-card>

          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="refundForm.amount"
                type="number"
                label="Monto a devolver"
                variant="outlined"
                density="comfortable"
                :min="0"
                :step="0.01"
                hide-details
              />
              <div class="text-caption text-medium-emphasis mt-1">
                Máx pagado: <b>{{ money(Number(refundDialog.sale?.paid_total || 0)) }}</b>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="refundForm.method"
                :items="refundMethodItems"
                label="Medio de reintegro"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="refundForm.reference"
                label="Referencia (opcional)"
                variant="outlined"
                density="comfortable"
                hide-details
                placeholder="Ej: operación / comprobante"
              />
            </v-col>

            <v-col cols="12" md="6" class="d-flex align-center">
              <v-switch v-model="refundForm.restock" inset color="green" label="Reingresar stock" hide-details />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="refundForm.reason"
                label="Motivo / Observación"
                variant="outlined"
                density="comfortable"
                rows="3"
                auto-grow
                hide-details
              />
            </v-col>
          </v-row>

          <v-alert v-if="refundMethodMismatch" type="warning" variant="tonal" class="mt-3" title="Atención">
            El reintegro se está registrando con un medio distinto al pago principal. Agregá motivo o referencia para auditoría.
          </v-alert>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="text" :disabled="refundingId != null" @click="refundDialog.show = false">Cancelar</v-btn>
          <v-btn color="orange" variant="flat" :loading="refundingId === refundDialog.sale?.id" @click="confirmRefund">
            Registrar devolución
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIALOG ELIMINAR -->
    <v-dialog v-model="deleteDialog.show" max-width="540">
      <v-card>
        <v-card-title class="font-weight-bold">Confirmar eliminación</v-card-title>
        <v-card-text>
          ¿Seguro querés eliminar la venta <b>ID {{ deleteDialog.sale?.id }}</b>?
          <div class="text-caption text-medium-emphasis mt-2">⚠️ Acción irreversible.</div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" :disabled="deletingId != null" @click="deleteDialog.show = false">Cancelar</v-btn>
          <v-btn color="red" variant="flat" :loading="deletingId === deleteDialog.sale?.id" @click="deleteSaleConfirmed">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3200">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import http from "../../../app/api/http";
import { useAuthStore } from "../../../app/store/auth.store";

const router = useRouter();
const auth = useAuthStore();

// =====================
// Helpers ID venta
// =====================
function getSaleId(saleLike) {
  const candidates = [
    saleLike?.sale_id,
    saleLike?.saleId,
    saleLike?.id,
    saleLike?.sale?.id,
    saleLike?.sale?.sale_id,
    saleLike?.sale?.saleId,
  ];
  for (const c of candidates) {
    const n = Number(c || 0);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

// ===== Admin (UI) =====
const isAdmin = computed(() => {
  const u = auth?.user || {};
  if (u.is_admin === true || u.isAdmin === true || u.admin === true) return true;

  const roleId = Number(u.role_id || u.roleId || u.perfil_id || 0);
  if (Number.isFinite(roleId) && roleId === 1) return true;

  const raw = [];
  const push = (r) => {
    if (!r) return;
    if (typeof r === "string") raw.push(r);
    else if (typeof r?.name === "string") raw.push(r.name);
    else if (typeof r?.role === "string") raw.push(r.role);
    else if (typeof r?.role?.name === "string") raw.push(r.role.name);
  };
  if (Array.isArray(u.roles)) u.roles.forEach(push);
  if (u.role) push(u.role);
  if (u.perfil) push(u.perfil);

  const roles = raw.map((s) => String(s || "").trim().toLowerCase()).filter(Boolean);
  return roles.some((r) =>
    ["admin", "administrador", "administrator", "super_admin", "superadmin", "root", "owner", "dueño", "dueno"].includes(r),
  );
});

const userBranchId = computed(() => {
  const u = auth?.user || null;
  const id = Number(u?.branch_id || auth?.branchId || 0);
  return Number.isFinite(id) && id > 0 ? id : null;
});

const selectedBranchId = ref(null);
const effectiveBranchId = computed(() => {
  if (isAdmin.value) {
    const v = Number(selectedBranchId.value || 0);
    return Number.isFinite(v) && v > 0 ? v : null;
  }
  return userBranchId.value;
});

// ===== Branches =====
const branches = ref([]);
const branchesLoading = ref(false);

function pickArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

const branchSelectItems = computed(() => {
  const arr = Array.isArray(branches.value) ? branches.value : [];
  return [
    { title: "Todas", value: null },
    ...arr
      .filter((b) => String(b?.is_active ?? 1) !== "0")
      .map((b) => ({ title: b.name || `Sucursal #${b.id}`, value: Number(b.id) })),
  ];
});

async function loadBranchesIfAdmin() {
  if (!isAdmin.value) return;
  branchesLoading.value = true;
  try {
    const { data } = await http.get("/branches");
    if (!data?.ok) throw new Error(data?.message || "Error listando sucursales");
    branches.value = pickArray(data) || [];
  } catch (e) {
    console.warn("No pude cargar /branches:", e?.message || e);
  } finally {
    branchesLoading.value = false;
  }
}

// ===== UI/data =====
const dense = ref(false);
const loading = ref(false);
const sales = ref([]);
const meta = ref({ page: 1, limit: 20, total: 0, pages: 1 });

// ✅ IMPORTANTE: default = PAID para que “total” tenga lógica si vos contás pagadas
const status = ref("PAID");
const from = ref("");
const to = ref("");
const fromMenu = ref(false);
const toMenu = ref(false);
const snack = ref({ show: false, text: "" });

// buscador global
const q = ref("");

// ===== filtros =====
const sellerId = ref(null);
const productId = ref(null);
const payMethod = ref("");

// ===== autocomplete data =====
const sellerItems = ref([]);
const sellerLoading = ref(false);
const productItems = ref([]);
const productLoading = ref(false);

const cacheSellers = ref([]);
const cacheProducts = ref([]);

// ===== stats =====
const statsLoading = ref(false);
const stats = ref({
  ready: false,
  sales_count: 0,
  total_sum: 0,
  paid_sum: 0,
  refunds_sum: 0,
  gross_total_sum: 0,
  gross_paid_sum: 0,
  net_by_method: { cash: 0, transfer: 0, card: 0, qr: 0, other: 0, raw_by_method: {} },
});

const statusItems = [
  { title: "Todos", value: "" },
  { title: "Pagada", value: "PAID" },
  { title: "Borrador", value: "DRAFT" },
  { title: "Cancelada", value: "CANCELLED" },
  { title: "Reintegrada", value: "REFUNDED" },
];

const payMethodItems = [
  { title: "Todos", value: "" },
  { title: "Efectivo", value: "CASH" },
  { title: "Tarjeta", value: "CARD" },
  { title: "Transferencia", value: "TRANSFER" },
  { title: "QR", value: "QR" },
  { title: "Otro", value: "OTHER" },
];

// ✅ headers: agregamos Producto
const headers = [
  { title: "Fecha", key: "sold_at", sortable: false, width: 190 },
  { title: "Vendedor / Sucursal", key: "seller", sortable: false, width: 220 },
  { title: "Cliente", key: "customer", sortable: false, width: 260 },
  { title: "Producto", key: "product", sortable: false, width: 280 },
  { title: "Total", key: "total", sortable: false, width: 220 },
  { title: "Pago", key: "method", sortable: false, width: 160 },
  { title: "Estado", key: "status", sortable: false, width: 140 },
  { title: "", key: "actions", sortable: false, width: 280 },
];

// ===== Helpers =====
function toast(msg) {
  snack.value = { show: true, text: String(msg || "Error") };
}
function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}
function dt(val) {
  return val ? new Date(val).toLocaleString("es-AR") : "—";
}
function fullUserName(u) {
  const fn = String(u?.first_name || "").trim();
  const ln = String(u?.last_name || "").trim();
  const name = `${fn} ${ln}`.trim();
  return name || "";
}

function normalizeDate(v) {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  return new Date(v).toISOString().slice(0, 10);
}
function toStartOfDay(dateStr) {
  const d = normalizeDate(dateStr);
  return d ? `${d} 00:00:00` : "";
}
function toEndOfDay(dateStr) {
  const d = normalizeDate(dateStr);
  return d ? `${d} 23:59:59` : "";
}

function methodLabel(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "Efectivo";
  if (x === "TRANSFER") return "Transferencia";
  if (x === "CARD") return "Tarjeta";
  if (x === "QR") return "QR";
  if (x === "OTHER") return "Otro";
  return m || "—";
}
function payColor(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "green";
  if (x === "TRANSFER") return "purple";
  if (x === "CARD") return "blue";
  if (x === "QR") return "orange";
  return "grey";
}
function statusLabel(s) {
  const x = String(s || "").toUpperCase();
  if (x === "PAID") return "Pagada";
  if (x === "DRAFT") return "Borrador";
  if (x === "CANCELLED") return "Cancelada";
  if (x === "REFUNDED") return "Reintegrada";
  return s || "—";
}
function statusColor(s) {
  const x = String(s || "").toUpperCase();
  if (x === "PAID") return "green";
  if (x === "CANCELLED") return "red";
  if (x === "REFUNDED") return "orange";
  if (x === "DRAFT") return "blue";
  return "grey";
}

function numOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// ✅ items (productos) vienen con alias variable según asociación
function pickSaleItems(saleLike) {
  const candidates = [
    saleLike?.sale_items,
    saleLike?.saleItems,
    saleLike?.items,
    saleLike?.SaleItems,
  ];
  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
}

function primaryProduct(item) {
  const items = pickSaleItems(item);
  if (!items.length) return null;
  return items[0] || null;
}
function primaryProductName(item) {
  const it = primaryProduct(item);
  return (
    it?.product_name_snapshot ||
    it?.product?.name ||
    (it?.product_id ? `Producto #${it.product_id}` : "(sin items)")
  );
}
function primaryProductSku(item) {
  const it = primaryProduct(item);
  const sku = it?.product_sku_snapshot || it?.product?.sku || "";
  return sku ? `SKU: ${sku}` : "";
}
function productExtraCount(item) {
  const items = pickSaleItems(item);
  return Math.max(0, (items?.length || 0) - 1);
}

// ✅ buildParams: ARREGLADO
// - backend usa: seller_id, pay_method, product (NO product_id)
// - dejamos product_id también por compat futura
function buildParams(page, limit) {
  const hasFrom = !!normalizeDate(from.value);
  const hasTo = !!normalizeDate(to.value);

  const s = sellerId.value ?? null;
  const p = productId.value ?? null;
  const pm = String(payMethod.value || "").trim();
  const st = String(status.value || "").trim();
  const qq = String(q.value || "").trim();

  const params = {
    page,
    limit,

    q: qq || undefined,
    status: st || undefined,

    seller_id: numOrNull(s) ?? undefined,

    // ✅ clave: el backend filtra por "product"
    product: numOrNull(p) ?? undefined,

    // (compat por si después lo soportás en el backend)
    product_id: numOrNull(p) ?? undefined,

    pay_method: pm || undefined,
  };

  if (effectiveBranchId.value) params.branch_id = effectiveBranchId.value;
  if (hasFrom) params.from = toStartOfDay(from.value);
  if (hasTo) params.to = toEndOfDay(to.value);

  return params;
}

function primaryPayment(saleLike) {
  const pays = Array.isArray(saleLike?.payments) ? saleLike.payments : [];
  if (!pays.length) return null;
  const sorted = [...pays].sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));
  return sorted[0] || pays[0] || null;
}

// ===== Normalizador de opciones =====
function normalizeOptions(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr
    .map((x) => {
      if (typeof x === "string") return { title: x, value: x };
      const id = x?.value ?? x?.id ?? x?.user_id ?? x?.product_id ?? x?.customer_id ?? x?.seller_id ?? null;
      const title =
        x?.title ??
        x?.name ??
        x?.full_name ??
        x?.label ??
        x?.text ??
        (id != null ? String(id) : "");
      const value = x?.value ?? (id != null ? Number(id) : title) ?? title;
      return { title: String(title || ""), value, _raw: x };
    })
    .filter((i) => i.title);
}

function localFilter(items, qx) {
  const term = String(qx || "").trim().toLowerCase();
  if (!term) return items.slice(0, 25);
  return items.filter((i) => String(i.title || "").toLowerCase().includes(term)).slice(0, 25);
}

// ===== Fetch =====
async function fetchSales() {
  loading.value = true;
  try {
    const { data } = await http.get("/pos/sales", { params: buildParams(meta.value.page, meta.value.limit) });
    if (!data?.ok) throw new Error(data?.message || "Error listando ventas");

    sales.value = Array.isArray(data.data) ? data.data : [];
    meta.value = data.meta || meta.value;
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "Error");
  } finally {
    loading.value = false;
  }
}

async function fetchStats() {
  statsLoading.value = true;
  try {
    const base = buildParams(1, 1);
    delete base.page;
    delete base.limit;

    const { data } = await http.get("/pos/sales/stats", { params: base });
    if (!data?.ok) throw new Error(data?.message || "Error calculando stats");

    const d = data.data || {};
    stats.value = {
      ready: true,
      sales_count: Number(d.sales_count || 0),
      total_sum: Number(d.total_sum || 0),
      paid_sum: Number(d.paid_sum || 0),
      refunds_sum: Number(d.refunds_sum || 0),
      gross_total_sum: Number(d.gross_total_sum || 0),
      gross_paid_sum: Number(d.gross_paid_sum || 0),
      net_by_method: {
        cash: Number(d.net_by_method?.cash || 0),
        transfer: Number(d.net_by_method?.transfer || 0),
        card: Number(d.net_by_method?.card || 0),
        qr: Number(d.net_by_method?.qr || 0),
        other: Number(d.net_by_method?.other || 0),
        raw_by_method: d.net_by_method?.raw_by_method || {},
      },
    };
  } catch (e) {
    stats.value.ready = false;
    toast(e?.response?.data?.message || e?.message || "Error stats");
  } finally {
    statsLoading.value = false;
  }
}

async function refreshAll() {
  await Promise.all([fetchSales(), fetchStats()]);
}

function applyFilters() {
  meta.value.page = 1;
  refreshAll();
}

// ===== Autocomplete loaders =====
let tSeller = null;
async function onSellerSearch(qx) {
  clearTimeout(tSeller);
  tSeller = setTimeout(async () => {
    sellerLoading.value = true;
    try {
      const { data } = await http.get("/pos/sales/options/sellers", {
        params: { q: qx || "", limit: 25, ...(effectiveBranchId.value ? { branch_id: effectiveBranchId.value } : {}) },
      });
      if (data?.ok) {
        const items = normalizeOptions(data.data || []);
        sellerItems.value = items;
        cacheSellers.value = items;
      } else {
        sellerItems.value = localFilter(cacheSellers.value, qx);
      }
    } catch {
      sellerItems.value = localFilter(cacheSellers.value, qx);
    } finally {
      sellerLoading.value = false;
    }
  }, 250);
}

let tProd = null;
async function onProductSearch(qx) {
  clearTimeout(tProd);
  tProd = setTimeout(async () => {
    productLoading.value = true;
    try {
      const { data } = await http.get("/pos/sales/options/products", {
        params: { q: qx || "", limit: 25, ...(effectiveBranchId.value ? { branch_id: effectiveBranchId.value } : {}) },
      });
      if (data?.ok) {
        const items = normalizeOptions(data.data || []);
        productItems.value = items;
        cacheProducts.value = items;
      } else {
        productItems.value = localFilter(cacheProducts.value, qx);
      }
    } catch {
      productItems.value = localFilter(cacheProducts.value, qx);
    } finally {
      productLoading.value = false;
    }
  }, 250);
}

// ===== Branch change =====
function onBranchChanged() {
  sellerId.value = null;
  productId.value = null;
  onSellerSearch("");
  onProductSearch("");
  applyFilters();
}

// ===== Row click / navigation =====
function goDetail(id) {
  router.push({ name: "posSaleDetail", params: { id } });
}
function onRowClick(_, row) {
  const item = row?.item;
  if (!item) return;
  openPostSale(item, "summary");
}

// ===== Ranges =====
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function clearDates() {
  from.value = "";
  to.value = "";
  applyFilters();
}
function setToday() {
  const t = todayISO();
  from.value = t;
  to.value = t;
  applyFilters();
}
function setThisWeek() {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  from.value = monday.toISOString().slice(0, 10);
  to.value = sunday.toISOString().slice(0, 10);
  applyFilters();
}
function setThisMonth() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  from.value = first.toISOString().slice(0, 10);
  to.value = last.toISOString().slice(0, 10);
  applyFilters();
}

function resetFilters() {
  q.value = "";
  sellerId.value = null;
  productId.value = null;
  payMethod.value = "";
  status.value = "PAID"; // ✅ default lógico
  from.value = "";
  to.value = "";
  meta.value.page = 1;
  if (isAdmin.value) selectedBranchId.value = null;
  refreshAll();
}

// ===== Paging =====
function prevPage() {
  if (meta.value.page > 1) {
    meta.value.page--;
    refreshAll();
  }
}
function nextPage() {
  if (meta.value.page < meta.value.pages) {
    meta.value.page++;
    refreshAll();
  }
}
function toggleDense() {
  dense.value = !dense.value;
}

// ===== Clipboard =====
async function copyText(txt) {
  try {
    if (!txt) return;
    await navigator.clipboard.writeText(txt);
    toast("Copiado");
  } catch {
    toast("No se pudo copiar");
  }
}

// ===== CSV =====
function exportCsv() {
  if (!sales.value.length) return;

  const rows = sales.value.map((s) => {
    const p = primaryPayment(s);
    return {
      id: s.id,
      sold_at: dt(s.sold_at),
      branch: s.branch?.name || s.branch_id,
      seller: s.user?.username || fullUserName(s.user) || s.user_id,
      customer_name: s.customer_name || "Consumidor Final",
      product: primaryProductName(s),
      status: statusLabel(s.status),
      total: Number(s.total || 0),
      paid_total: Number(s.paid_total || 0),
      method: methodLabel(p?.method),
    };
  });

  const header = Object.keys(rows[0]).join(",");
  const body = rows
    .map((r) =>
      Object.values(r)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  const csv = header + "\n" + body;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ventas_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ===== ELIMINAR =====
const deletingId = ref(null);
const deleteDialog = ref({ show: false, sale: null });

function openDelete(item) {
  if (!isAdmin.value) return;
  deleteDialog.value = { show: true, sale: item };
}

async function deleteSaleConfirmed() {
  const id = getSaleId(deleteDialog.value.sale);
  if (!id) return toast("ID de venta inválido");

  deletingId.value = id;
  try {
    const { data } = await http.delete(`/pos/sales/${id}`);
    if (!data?.ok) throw new Error(data?.message || "No se pudo eliminar");
    toast("Venta eliminada");
    deleteDialog.value = { show: false, sale: null };
    await refreshAll();
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "Error eliminando");
  } finally {
    deletingId.value = null;
  }
}

// ==============================
// DRAWER / Vista rápida
// ==============================
const postSale = ref({
  open: false,
  tab: "summary",
  loading: false,
  sale: null,
  refunds: [],
  exchanges: [],
});

async function loadPostSale(saleId) {
  const id = Number(saleId || 0);
  if (!id) return;

  postSale.value.loading = true;
  try {
    const { data } = await http.get(`/pos/sales/${id}`);
    if (!data?.ok) throw new Error(data?.message || "No se pudo cargar la venta");

    const pack = data.data || {};
    const sale = pack.sale || pack;

    postSale.value.sale = sale;
    postSale.value.refunds = Array.isArray(pack.refunds) ? pack.refunds : [];
    postSale.value.exchanges = Array.isArray(pack.exchanges) ? pack.exchanges : [];
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "Error vista rápida");
  } finally {
    postSale.value.loading = false;
  }
}

async function openPostSale(item, tab = "summary") {
  const id = getSaleId(item);
  if (!id) return toast("ID de venta inválido");

  postSale.value.open = true;
  postSale.value.tab = tab;
  postSale.value.sale = { ...item };
  postSale.value.refunds = [];
  postSale.value.exchanges = [];
  await loadPostSale(id);
}

async function refreshPostSale() {
  const id = getSaleId(postSale.value.sale);
  if (!id) return;
  await loadPostSale(id);
}

// ===== DEVOLUCIÓN =====
const refundingId = ref(null);
const refundDialog = ref({ show: false, sale: null });

const refundForm = ref({
  amount: "",
  reason: "",
  restock: true,
  method: "CASH",
  reference: "",
});

const refundMethodItems = [
  { title: "Efectivo", value: "CASH" },
  { title: "Tarjeta", value: "CARD" },
  { title: "Transferencia", value: "TRANSFER" },
  { title: "QR", value: "QR" },
  { title: "Otro", value: "OTHER" },
];

const refundPaymentsSummary = computed(() => {
  const pays = Array.isArray(refundDialog.value.sale?.payments) ? refundDialog.value.sale.payments : [];
  if (!pays.length) return [];
  const map = new Map();
  for (const p of pays) {
    const m = String(p?.method || "OTHER").toUpperCase();
    const a = Number(p?.amount || 0);
    map.set(m, (map.get(m) || 0) + a);
  }
  return [...map.entries()].map(([method, amount]) => ({ key: method, method, amount }));
});

const refundMethodMismatch = computed(() => {
  const sale = refundDialog.value.sale;
  const main = primaryPayment(sale)?.method;
  if (!main) return false;
  return String(refundForm.value.method || "").toUpperCase() !== String(main).toUpperCase();
});

function openRefundFromPostSale() {
  if (!postSale.value.sale) return;
  openRefund(postSale.value.sale);
}

async function openRefund(item) {
  const id = getSaleId(item);
  if (!id) return toast("ID de venta inválido");

  refundDialog.value = { show: true, sale: { ...item } };

  const main = String(primaryPayment(item)?.method || "CASH").toUpperCase();
  refundForm.value = {
    amount: String(Number(item?.paid_total || 0)),
    reason: "",
    restock: true,
    method: main,
    reference: "",
  };

  try {
    const { data } = await http.get(`/pos/sales/${id}`);
    if (data?.ok && data.data) {
      const pack = data.data || {};
      refundDialog.value.sale = pack.sale || pack;
      const main2 = String(primaryPayment(refundDialog.value.sale)?.method || main || "CASH").toUpperCase();
      refundForm.value.method = main2;
    }
  } catch {}
}

async function confirmRefund() {
  const sale = refundDialog.value.sale;
  const id = getSaleId(sale);
  if (!id) return toast("ID de venta inválido");

  const amount = Number(String(refundForm.value.amount || "").replace(",", "."));
  const maxPaid = Number(sale?.paid_total || 0);

  if (!Number.isFinite(amount) || amount <= 0) return toast("Monto inválido");
  if (amount > maxPaid + 0.0001) return toast("El monto excede lo pagado");
  if (
    refundMethodMismatch.value &&
    !String(refundForm.value.reason || "").trim() &&
    !String(refundForm.value.reference || "").trim()
  ) {
    return toast("Si cambiás el medio de reintegro, agregá motivo o referencia");
  }

  refundingId.value = id;
  try {
    const payload = {
      amount,
      reason: String(refundForm.value.reason || "").trim(),
      restock: !!refundForm.value.restock,
      method: String(refundForm.value.method || "CASH").toUpperCase(),
      refund_method: String(refundForm.value.method || "CASH").toUpperCase(),
      reference: String(refundForm.value.reference || "").trim() || null,
    };

    const { data } = await http.post(`/pos/sales/${id}/refunds`, payload);
    if (!data?.ok) throw new Error(data?.message || "No se pudo registrar la devolución");

    toast("Devolución registrada");
    refundDialog.value = { show: false, sale: null };

    await refreshAll();
    if (postSale.value.open && getSaleId(postSale.value.sale) === id) await refreshPostSale();
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "Error devolución");
  } finally {
    refundingId.value = null;
  }
}

// ===== CAMBIO =====
function openExchangeFromPostSale() {
  toast("Cambio: pegame tu modal anterior y lo integro completo acá.");
}

onMounted(async () => {
  if (auth?.isAuthed && !auth.user && typeof auth.fetchMe === "function") {
    try {
      await auth.fetchMe();
    } catch {}
  }

  await loadBranchesIfAdmin();

  onSellerSearch("");
  onProductSearch("");

  refreshAll();
});

// ===== KPI component =====
const KpiCard = {
  props: { title: String, value: [String, Number], icon: String, loading: Boolean, subtitle: String },
  template: `
    <v-card class="rounded-xl" elevation="1">
      <v-card-text class="d-flex align-center justify-space-between">
        <div>
          <div class="text-caption text-medium-emphasis">{{ title }}</div>
          <div class="text-h6 font-weight-black">
            <span v-if="!loading">{{ value }}</span>
            <v-skeleton-loader v-else type="text" width="160" />
          </div>
          <div v-if="subtitle" class="text-caption text-medium-emphasis mt-1">{{ subtitle }}</div>
        </div>
        <v-avatar color="primary" variant="tonal" size="44">
          <v-icon>{{ icon }}</v-icon>
        </v-avatar>
      </v-card-text>
    </v-card>
  `,
};
</script>

<style scoped>
</style>
