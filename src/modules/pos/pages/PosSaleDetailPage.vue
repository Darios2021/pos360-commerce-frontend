<!-- src/modules/pos/pages/PosSaleDetailPage.vue -->
<template>
  <div class="sd">

    <!-- HEADER -->
    <AppPageHeader
      icon="mdi-receipt-text-outline"
      :title="`Venta #${sale?.id ?? id}`"
      :subtitle="sale ? dt(sale.sold_at || sale.created_at) : ''"
    >
      <v-chip
        v-if="sale?.status"
        size="small"
        variant="flat"
        :color="statusColor(sale.status)"
        class="font-weight-bold"
      >{{ statusLabel(sale.status) }}</v-chip>
    </AppPageHeader>

    <!-- ── LOADING ── -->
    <div v-if="loading" class="sd-loading">
      <v-progress-circular indeterminate size="32" color="primary" />
      <span>Cargando venta…</span>
    </div>

    <!-- ── NOT FOUND ── -->
    <v-alert v-else-if="!sale" type="warning" variant="tonal" class="ma-3">
      Venta no encontrada.
    </v-alert>

    <!-- ── CONTENT ── -->
    <template v-else>

      <!-- HERO STRIP -->
      <div class="sd-hero">
        <div class="sd-hs">
          <div class="sd-hs-ico sd-hs-ico--primary"><v-icon size="14" color="white">mdi-currency-usd</v-icon></div>
          <div>
            <div class="sd-hs-val">{{ money(sale.total) }}</div>
            <div class="sd-hs-lbl">Total venta</div>
          </div>
        </div>
        <div class="sd-hero-sep" />
        <div class="sd-hs">
          <div class="sd-hs-ico sd-hs-ico--green"><v-icon size="14" color="white">mdi-check-circle-outline</v-icon></div>
          <div>
            <div class="sd-hs-val">{{ money(sale.paid_total) }}</div>
            <div class="sd-hs-lbl">Pagado</div>
          </div>
        </div>
        <div class="sd-hero-sep" />
        <div class="sd-hs">
          <div class="sd-hs-ico sd-hs-ico--indigo"><v-icon size="14" color="white">mdi-package-variant</v-icon></div>
          <div>
            <div class="sd-hs-val">{{ (sale.items || []).length }} ítem{{ (sale.items || []).length === 1 ? '' : 's' }}</div>
            <div class="sd-hs-lbl">Productos</div>
          </div>
        </div>
        <div class="sd-hero-sep" />
        <div class="sd-hs">
          <div class="sd-hs-ico sd-hs-ico--purple"><v-icon size="14" color="white">mdi-account-outline</v-icon></div>
          <div>
            <div class="sd-hs-val">{{ customerNameResolved }}</div>
            <div class="sd-hs-lbl">Cliente</div>
          </div>
        </div>
        <div class="sd-hero-sep" />
        <div class="sd-hs">
          <div class="sd-hs-ico sd-hs-ico--teal"><v-icon size="14" color="white">mdi-store-outline</v-icon></div>
          <div>
            <div class="sd-hs-val">{{ branchLabelResolved || '—' }}</div>
            <div class="sd-hs-lbl">Sucursal</div>
          </div>
        </div>
      </div>

      <!-- TABS -->
      <v-tabs v-model="activeTab" color="primary" density="compact" class="sd-tabs">
        <v-tab value="resumen">
          <v-icon start size="14">mdi-receipt-text-outline</v-icon>Resumen
        </v-tab>
        <v-tab value="productos">
          <v-icon start size="14">mdi-package-variant</v-icon>
          Productos
          <v-chip v-if="(sale.items || []).length" size="x-small" class="ml-1" color="primary" variant="tonal">
            {{ (sale.items || []).length }}
          </v-chip>
        </v-tab>
        <v-tab value="pagos">
          <v-icon start size="14">mdi-cash-multiple</v-icon>
          Pagos
          <v-chip v-if="paymentsResolved.length" size="x-small" class="ml-1" color="primary" variant="tonal">
            {{ paymentsResolved.length }}
          </v-chip>
        </v-tab>
        <v-tab value="devoluciones">
          <v-icon start size="14">mdi-swap-horizontal</v-icon>
          Historial
          <v-chip v-if="refunds.length + exchanges.length" size="x-small" class="ml-1" color="orange" variant="tonal">
            {{ refunds.length + exchanges.length }}
          </v-chip>
        </v-tab>
      </v-tabs>

      <v-tabs-window v-model="activeTab">

        <!-- ── RESUMEN ── -->
        <v-tabs-window-item value="resumen" class="sd-tab">

          <div class="sd-info-grid">

            <!-- ▸ VENTA -->
            <div class="sd-card sd-card--primary">
              <div class="sd-card-head">
                <div class="sd-badge sd-badge--primary">
                  <v-icon size="14" color="white">mdi-receipt-text-outline</v-icon>
                </div>
                <span class="sd-card-ttl">Datos de la venta</span>
              </div>
              <div class="sd-irows">
                <div class="sd-ir">
                  <v-icon size="13" class="sd-ir-ico">mdi-calendar-outline</v-icon>
                  <span class="sd-ir-k">Fecha</span>
                  <span class="sd-ir-v">{{ dt(sale.sold_at || sale.created_at) }}</span>
                </div>
                <div v-if="branchLabelResolved" class="sd-ir">
                  <v-icon size="13" class="sd-ir-ico">mdi-store-outline</v-icon>
                  <span class="sd-ir-k">Sucursal</span>
                  <span class="sd-ir-v">{{ branchLabelResolved }}</span>
                </div>
                <div v-if="userLabel(sale) !== '—'" class="sd-ir">
                  <v-icon size="13" class="sd-ir-ico">mdi-account-outline</v-icon>
                  <span class="sd-ir-k">Cajero</span>
                  <span class="sd-ir-v">{{ userLabel(sale) }}</span>
                </div>
                <div v-if="sale?.sale_number" class="sd-ir">
                  <v-icon size="13" class="sd-ir-ico">mdi-pound</v-icon>
                  <span class="sd-ir-k">Número</span>
                  <span class="sd-ir-v">#{{ sale.sale_number }}</span>
                </div>
                <div class="sd-ir">
                  <v-icon size="13" class="sd-ir-ico">mdi-layers-outline</v-icon>
                  <span class="sd-ir-k">Estado</span>
                  <v-chip size="x-small" variant="flat" :color="statusColor(sale.status)" class="font-weight-bold">
                    {{ statusLabel(sale.status) }}
                  </v-chip>
                </div>
                <div class="sd-ir">
                  <v-icon size="13" class="sd-ir-ico">mdi-file-document-outline</v-icon>
                  <span class="sd-ir-k">Fiscal</span>
                  <span class="sd-ir-v">{{ invoiceModeLabelResolved }}</span>
                </div>
                <div v-if="invoiceTypeResolved && invoiceTypeResolved !== '—'" class="sd-ir">
                  <v-icon size="13" class="sd-ir-ico">mdi-printer-outline</v-icon>
                  <span class="sd-ir-k">Comprobante</span>
                  <span class="sd-ir-v">{{ invoiceTypeResolved }}</span>
                </div>
                <div class="sd-ir">
                  <v-icon size="13" class="sd-ir-ico">mdi-account-group-outline</v-icon>
                  <span class="sd-ir-k">Tipo cliente</span>
                  <span class="sd-ir-v">{{ customerTypeLabelResolved }}</span>
                </div>
                <div v-if="sale.note" class="sd-ir">
                  <v-icon size="13" class="sd-ir-ico">mdi-note-text-outline</v-icon>
                  <span class="sd-ir-k">Nota</span>
                  <span class="sd-ir-v">{{ sale.note }}</span>
                </div>
              </div>
            </div>

            <!-- ▸ CLIENTE -->
            <div class="sd-card sd-card--purple">
              <div class="sd-card-head">
                <div class="sd-badge sd-badge--purple">
                  <v-icon size="14" color="white">mdi-account-circle-outline</v-icon>
                </div>
                <span class="sd-card-ttl">Cliente</span>
              </div>
              <div class="sd-cust-avatar">
                <span class="sd-cust-initials">{{ customerInitials }}</span>
              </div>
              <div class="sd-cust-name">{{ customerNameResolved }}</div>

              <div v-if="showCustomerDataBlock" class="sd-irows mt-2">
                <div v-if="customerDocResolved" class="sd-ir">
                  <v-icon size="13" class="sd-ir-ico">mdi-card-account-details-outline</v-icon>
                  <span class="sd-ir-k">Documento</span>
                  <span class="sd-ir-v">{{ customerDocResolved }}</span>
                </div>
                <div v-if="customerPhoneResolved" class="sd-ir">
                  <v-icon size="13" class="sd-ir-ico">mdi-phone-outline</v-icon>
                  <span class="sd-ir-k">Teléfono</span>
                  <span class="sd-ir-v">{{ customerPhoneResolved }}</span>
                </div>
                <div v-if="customerEmailResolved" class="sd-ir">
                  <v-icon size="13" class="sd-ir-ico">mdi-email-outline</v-icon>
                  <span class="sd-ir-k">Email</span>
                  <span class="sd-ir-v">{{ customerEmailResolved }}</span>
                </div>
              </div>
              <div v-else class="sd-no-data">
                <v-icon size="13" class="mr-1">mdi-information-slab-circle-outline</v-icon>
                Venta sin datos adicionales de cliente
              </div>
            </div>

            <!-- ▸ PAGO PRINCIPAL -->
            <div class="sd-card sd-card--green" v-if="paymentsResolved.length">
              <div class="sd-card-head">
                <div class="sd-badge sd-badge--green">
                  <v-icon size="14" color="white">mdi-cash-check</v-icon>
                </div>
                <span class="sd-card-ttl">Pago</span>
                <v-chip v-if="paymentsResolved.length > 1" size="x-small" variant="tonal" class="ml-auto">
                  {{ paymentsResolved.length }} métodos
                </v-chip>
              </div>

              <div class="sd-pay-main">
                <v-chip
                  size="large"
                  variant="flat"
                  :color="payColor(paymentsResolved[0].method_resolved)"
                  class="font-weight-bold"
                >
                  <v-icon start size="16">{{ payIcon(paymentsResolved[0].method_resolved) }}</v-icon>
                  {{ paymentsResolved[0].method_display }}
                </v-chip>
                <div class="sd-pay-big">{{ money(paymentsResolved[0].amount) }}</div>
              </div>

              <div class="sd-irows">
                <div v-if="paymentsResolved[0].installments > 1" class="sd-ir">
                  <v-icon size="13" class="sd-ir-ico">mdi-credit-card-clock-outline</v-icon>
                  <span class="sd-ir-k">Cuotas</span>
                  <span class="sd-ir-v">{{ paymentsResolved[0].installments }}x</span>
                </div>
                <div v-if="paymentsResolved[0].installment_amount && paymentsResolved[0].installments > 1" class="sd-ir">
                  <v-icon size="13" class="sd-ir-ico">mdi-calculator-variant-outline</v-icon>
                  <span class="sd-ir-k">Valor cuota</span>
                  <span class="sd-ir-v">{{ money(paymentsResolved[0].installment_amount) }}</span>
                </div>
                <div v-if="paymentsResolved[0].card_type_label" class="sd-ir">
                  <v-icon size="13" class="sd-ir-ico">mdi-credit-card-outline</v-icon>
                  <span class="sd-ir-k">Tipo</span>
                  <span class="sd-ir-v">{{ paymentsResolved[0].card_type_label }}</span>
                </div>
                <div v-if="paymentsResolved[0].card_brand" class="sd-ir">
                  <v-icon size="13" class="sd-ir-ico">mdi-contactless-payment</v-icon>
                  <span class="sd-ir-k">Marca</span>
                  <span class="sd-ir-v">{{ paymentsResolved[0].card_brand }}</span>
                </div>
                <div v-if="paymentsResolved[0].price_basis_label" class="sd-ir">
                  <v-icon size="13" class="sd-ir-ico">mdi-tag-outline</v-icon>
                  <span class="sd-ir-k">Base precio</span>
                  <span class="sd-ir-v">{{ paymentsResolved[0].price_basis_label }}</span>
                </div>
                <div v-if="paymentsResolved[0].reference" class="sd-ir">
                  <v-icon size="13" class="sd-ir-ico">mdi-pound</v-icon>
                  <span class="sd-ir-k">Referencia</span>
                  <span class="sd-ir-v sd-mono">{{ paymentsResolved[0].reference }}</span>
                </div>
                <div v-if="paymentsResolved.length > 1" class="sd-ir">
                  <v-icon size="13" class="sd-ir-ico">mdi-plus-circle-outline</v-icon>
                  <span class="sd-ir-k">Otros</span>
                  <span class="sd-ir-v">+{{ paymentsResolved.length - 1 }} pago{{ paymentsResolved.length > 2 ? 's' : '' }}</span>
                </div>
              </div>
            </div>

            <!-- Pago fallback (sin pagos) -->
            <div v-else class="sd-card sd-card--green sd-card--empty">
              <div class="sd-card-head">
                <div class="sd-badge sd-badge--green"><v-icon size="14" color="white">mdi-cash-check</v-icon></div>
                <span class="sd-card-ttl">Pago</span>
              </div>
              <div class="sd-no-data">
                <v-icon size="13" class="mr-1">mdi-information-slab-circle-outline</v-icon>
                Sin pagos registrados
              </div>
            </div>

          </div>

          <!-- TOTALES STRIP -->
          <div class="sd-totals">
            <div v-if="hasValue(sale.subtotal) && Number(sale.subtotal) !== Number(sale.total)" class="sd-tot">
              <div class="sd-tot-k"><v-icon size="11" class="mr-1">mdi-format-list-bulleted</v-icon>Subtotal</div>
              <div class="sd-tot-v">{{ money(sale.subtotal) }}</div>
            </div>
            <div v-if="Number(sale.discount_total || 0) > 0" class="sd-tot sd-tot--neg">
              <div class="sd-tot-k"><v-icon size="11" class="mr-1">mdi-tag-outline</v-icon>Descuento</div>
              <div class="sd-tot-v">-{{ money(sale.discount_total) }}</div>
            </div>
            <div v-if="Number(sale.tax_total || 0) > 0" class="sd-tot">
              <div class="sd-tot-k"><v-icon size="11" class="mr-1">mdi-percent-outline</v-icon>Impuestos</div>
              <div class="sd-tot-v">{{ money(sale.tax_total) }}</div>
            </div>
            <div class="sd-tot sd-tot--main">
              <div class="sd-tot-k"><v-icon size="11" class="mr-1">mdi-sigma</v-icon>Total</div>
              <div class="sd-tot-v">{{ money(sale.total) }}</div>
            </div>
            <div class="sd-tot sd-tot--ok">
              <div class="sd-tot-k"><v-icon size="11" class="mr-1">mdi-check-circle-outline</v-icon>Pagado</div>
              <div class="sd-tot-v">{{ money(sale.paid_total) }}</div>
            </div>
            <div v-if="Number(sale.change_total || 0) > 0" class="sd-tot">
              <div class="sd-tot-k"><v-icon size="11" class="mr-1">mdi-cash-minus</v-icon>Vuelto</div>
              <div class="sd-tot-v">{{ money(sale.change_total) }}</div>
            </div>
            <div v-if="refundsTotal > 0" class="sd-tot sd-tot--warn">
              <div class="sd-tot-k"><v-icon size="11" class="mr-1">mdi-cash-refund</v-icon>Devuelto</div>
              <div class="sd-tot-v">-{{ money(refundsTotal) }}</div>
            </div>
            <div v-if="showNetSummary" class="sd-tot sd-tot--neto">
              <div class="sd-tot-k"><v-icon size="11" class="mr-1">mdi-cash-check</v-icon>Neto</div>
              <div class="sd-tot-v">{{ money(netTotal) }}</div>
            </div>
          </div>

        </v-tabs-window-item>

        <!-- ── PRODUCTOS ── -->
        <v-tabs-window-item value="productos" class="sd-tab">
          <div class="sd-tab-head">
            <div class="sd-tab-head-left">
              <div class="sd-badge sd-badge--indigo"><v-icon size="14" color="white">mdi-package-variant</v-icon></div>
              <span class="sd-tab-ttl">
                {{ (sale.items || []).length }} producto{{ (sale.items || []).length === 1 ? '' : 's' }}
              </span>
            </div>
            <v-chip v-if="productsLoading" size="x-small" color="indigo" variant="tonal">
              <v-progress-circular size="10" width="2" indeterminate class="mr-1" />Cargando…
            </v-chip>
          </div>

          <div class="sd-items-list">
            <div
              v-for="item in (sale.items || [])"
              :key="item.id || item.product_id"
              class="sd-item-row"
            >
              <div class="sd-item-img" @click="openImage(item)" title="Ver imagen">
                <img v-if="itemImage(item)" :src="itemImage(item)" class="sd-img" />
                <v-icon v-else size="22" color="medium-emphasis">mdi-image-outline</v-icon>
              </div>

              <div class="sd-item-body">
                <div class="sd-item-name">{{ productName(item) }}</div>
                <div v-if="productMetaLine(item)" class="sd-item-meta">{{ productMetaLine(item) }}</div>
                <div class="sd-item-chips">
                  <v-chip
                    v-if="availabilityLabel(item) !== '—'"
                    size="x-small"
                    variant="flat"
                    :color="availabilityColor(item)"
                  >{{ availabilityLabel(item) }}</v-chip>
                  <v-chip v-if="categoryLabel(item)" size="x-small" variant="outlined">{{ categoryLabel(item) }}</v-chip>
                </div>
              </div>

              <div class="sd-item-nums">
                <div class="sd-item-qty">× {{ number(item.quantity) }}</div>
                <div class="sd-item-unit">{{ money(item.unit_price) }} c/u</div>
                <div class="sd-item-total">{{ money(item.line_total) }}</div>
              </div>

              <v-btn size="x-small" variant="tonal" color="primary" @click="goToProduct(item.product_id)" title="Ver producto">
                <v-icon size="13">mdi-open-in-new</v-icon>
              </v-btn>
            </div>
          </div>

          <div v-if="!(sale.items || []).length" class="sd-empty">
            <v-icon size="32" color="medium-emphasis">mdi-package-variant-remove</v-icon>
            <span>Sin productos en esta venta</span>
          </div>
        </v-tabs-window-item>

        <!-- ── PAGOS ── -->
        <v-tabs-window-item value="pagos" class="sd-tab">
          <div class="sd-tab-head">
            <div class="sd-tab-head-left">
              <div class="sd-badge sd-badge--green"><v-icon size="14" color="white">mdi-cash-multiple</v-icon></div>
              <span class="sd-tab-ttl">
                {{ paymentsResolved.length }} pago{{ paymentsResolved.length === 1 ? '' : 's' }} registrado{{ paymentsResolved.length === 1 ? '' : 's' }}
              </span>
            </div>
          </div>

          <v-alert v-if="!paymentsResolved.length" type="info" variant="tonal" class="rounded-xl">
            Sin pagos registrados para esta venta.
          </v-alert>

          <div v-else class="sd-pays">
            <div
              v-for="pm in paymentsResolved"
              :key="pm.id || `${pm.payment_method_id}_${pm.amount}`"
              class="sd-pay-card"
            >
              <div class="sd-pay-card-head">
                <div class="sd-pay-chips">
                  <v-chip size="small" variant="flat" :color="payColor(pm.method_resolved)" class="font-weight-bold">
                    <v-icon start size="14">{{ payIcon(pm.method_resolved) }}</v-icon>
                    {{ pm.method_display }}
                  </v-chip>
                  <v-chip v-if="pm.card_type_label" size="small" variant="outlined">{{ pm.card_type_label }}</v-chip>
                  <v-chip v-if="pm.card_brand" size="small" variant="outlined">{{ pm.card_brand }}</v-chip>
                  <v-chip v-if="pm.installments > 1" size="small" variant="outlined">
                    <v-icon start size="12">mdi-credit-card-clock-outline</v-icon>
                    {{ pm.installments }} cuotas
                  </v-chip>
                </div>
                <div class="sd-pay-amount-box">
                  <div class="sd-pay-albl">Cobrado</div>
                  <div class="sd-pay-aval">{{ money(pm.amount) }}</div>
                </div>
              </div>

              <div class="sd-pay-headline">{{ paymentHeadline(pm) }}</div>
              <div v-if="paymentSubline(pm).length" class="sd-pay-subline">
                <span v-for="part in paymentSubline(pm)" :key="part">{{ part }}</span>
              </div>

              <div v-if="paymentFacts(pm).filter(f => !['Método','Cuotas'].includes(f.label)).length" class="sd-facts">
                <div
                  v-for="fact in paymentFacts(pm).filter(f => !['Método','Cuotas'].includes(f.label))"
                  :key="fact.label"
                  class="sd-fact"
                >
                  <div class="sd-fact-lbl">{{ fact.label }}</div>
                  <div class="sd-fact-val">{{ fact.value }}</div>
                </div>
              </div>

              <div v-if="pm.note_human" class="sd-pay-note">
                <v-icon size="13" class="mr-1 opacity-40">mdi-note-text-outline</v-icon>
                {{ pm.note_human }}
              </div>
            </div>
          </div>
        </v-tabs-window-item>

        <!-- ── HISTORIAL ── -->
        <v-tabs-window-item value="devoluciones" class="sd-tab">

          <!-- Devoluciones -->
          <div class="sd-tab-head">
            <div class="sd-tab-head-left">
              <div class="sd-badge sd-badge--orange"><v-icon size="14" color="white">mdi-cash-refund</v-icon></div>
              <span class="sd-tab-ttl">Devoluciones ({{ refunds.length }})</span>
            </div>
          </div>

          <v-alert v-if="!refunds.length" type="info" variant="tonal" density="compact" class="mb-4 rounded-xl">
            No hay devoluciones para esta venta.
          </v-alert>
          <div v-else class="sd-hist-list mb-4">
            <div v-for="r in refunds" :key="r.id" class="sd-hist-card sd-hist-card--orange">
              <div class="sd-hist-row">
                <div>
                  <div class="sd-hist-date">
                    <v-icon size="12" class="mr-1 opacity-50">mdi-calendar-outline</v-icon>
                    {{ dt(r.created_at) }}
                  </div>
                  <div class="sd-hist-meta">
                    <v-icon size="12" class="mr-1 opacity-50">mdi-bank-transfer-out</v-icon>
                    Medio: <b>{{ refundMethodLabel(r) }}</b>
                    <span v-if="r.reference"> · Ref: {{ r.reference }}</span>
                  </div>
                  <div v-if="r.reason" class="sd-hist-meta">
                    <v-icon size="12" class="mr-1 opacity-50">mdi-comment-outline</v-icon>
                    {{ r.reason }}
                  </div>
                </div>
                <v-chip size="small" variant="flat" color="orange" class="font-weight-bold">
                  {{ money(r.amount) }}
                </v-chip>
              </div>
            </div>
          </div>

          <!-- Cambios -->
          <div class="sd-tab-head mt-2">
            <div class="sd-tab-head-left">
              <div class="sd-badge sd-badge--teal"><v-icon size="14" color="white">mdi-swap-horizontal</v-icon></div>
              <span class="sd-tab-ttl">Cambios ({{ exchanges.length }})</span>
            </div>
          </div>

          <v-alert v-if="!exchanges.length" type="info" variant="tonal" density="compact" class="rounded-xl">
            No hay cambios para esta venta.
          </v-alert>
          <div v-else class="sd-hist-list">
            <div v-for="x in exchanges" :key="x.id" class="sd-hist-card sd-hist-card--teal">
              <div class="sd-hist-row">
                <div>
                  <div class="sd-hist-date">
                    <v-icon size="12" class="mr-1 opacity-50">mdi-calendar-outline</v-icon>
                    {{ dt(x.created_at) }}
                  </div>
                  <div class="sd-hist-meta">
                    Original: <b>{{ money(x.original_total) }}</b>
                    · Nuevo: <b>{{ money(x.new_total) }}</b>
                    · Devuelto: <b>{{ money(x.returned_amount) }}</b>
                  </div>
                  <div v-if="x.note" class="sd-hist-meta">
                    <v-icon size="12" class="mr-1 opacity-50">mdi-comment-outline</v-icon>{{ x.note }}
                  </div>
                </div>
                <v-chip size="small" variant="flat" color="teal" class="font-weight-bold">
                  Dif: {{ money(x.diff) }}
                </v-chip>
              </div>
            </div>
          </div>

        </v-tabs-window-item>

      </v-tabs-window>

    </template>

    <!-- ── IMAGE DIALOG ── -->
    <v-dialog v-model="imageDialog" max-width="760">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="font-weight-black">{{ productName(imageItem) }}</span>
          <v-btn icon variant="text" @click="imageDialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-img v-if="itemImage(imageItem)" :src="itemImage(imageItem)" cover style="max-height:500px;border-radius:12px;" />
          <v-alert v-else type="info" variant="tonal">Sin imagen para este producto.</v-alert>
          <div class="d-flex ga-2 mt-3">
            <v-btn variant="tonal" color="primary" @click="goToProduct(imageItem?.product_id)" :disabled="!imageItem?.product_id">
              <v-icon start>mdi-open-in-new</v-icon>Ver producto
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3200">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "../../../app/api/http";
import { useProductsStore } from "../../../app/store/products.store";
import AppPageHeader from "@/app/components/AppPageHeader.vue";

const route = useRoute();
const router = useRouter();
const productsStore = useProductsStore();

const id = computed(() => Number(route.params.id || 0));
const loading = ref(false);
const activeTab = ref("resumen");

const payload = ref(null);
const sale = computed(() => payload.value?.sale || null);
const saleExtra = computed(() => safeJsonParse(sale.value?.extra) || {});

const refunds = computed(() => (Array.isArray(payload.value?.refunds) ? payload.value.refunds : []));
const exchanges = computed(() => (Array.isArray(payload.value?.exchanges) ? payload.value.exchanges : []));

const refundsTotal = computed(() => refunds.value.reduce((a, r) => a + Number(r?.amount || 0), 0));
const exchangesDiffTotal = computed(() => exchanges.value.reduce((a, x) => a + Number(x?.diff || 0), 0));
const netTotal = computed(() => Number(sale.value?.total || 0) - refundsTotal.value + exchangesDiffTotal.value);
const showNetSummary = computed(() => refundsTotal.value > 0 || exchangesDiffTotal.value !== 0);

const snack = ref({ show: false, text: "" });
const imageDialog = ref(false);
const imageItem = ref(null);
const productsLoading = ref(false);

function safeJsonParse(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  const s = String(v || "").trim();
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}
function numOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function hasValue(v) {
  return v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
}
function firstFilled(...vals) {
  for (const v of vals) { const s = String(v ?? "").trim(); if (s) return s; }
  return "";
}

function customerData() {
  const s = sale.value || {};
  const extra = saleExtra.value || {};
  const c = extra.customer || s.customer || s.Customer || {};
  return {
    name: firstFilled(
      s.customer_name, s.customerName, c.name, c.customer_name, c.full_name, c.fullName,
      [c.first_name, c.last_name].filter(Boolean).join(" "),
      [c.firstName, c.lastName].filter(Boolean).join(" ")
    ),
    doc: firstFilled(s.customer_doc, s.customerDoc, c.doc, c.customer_doc, c.document, c.documento, c.dni, c.cuit, c.cuil),
    phone: firstFilled(s.customer_phone, s.customerPhone, c.phone, c.customer_phone, c.telefono, c.tel, c.mobile, c.whatsapp),
    email: firstFilled(c.email, c.mail),
  };
}

const customerNameResolved = computed(() => {
  const d = customerData();
  if (d.name) return d.name;
  const cid = Number(sale.value?.customer_id || sale.value?.customer?.id || 0);
  return cid ? `Cliente #${cid}` : "Consumidor Final";
});
const customerDocResolved = computed(() => customerData().doc || "");
const customerPhoneResolved = computed(() => customerData().phone || "");
const customerEmailResolved = computed(() => customerData().email || "");
const showCustomerDataBlock = computed(() => !!(customerDocResolved.value || customerPhoneResolved.value || customerEmailResolved.value));

const customerInitials = computed(() => {
  const name = customerNameResolved.value || "CF";
  const parts = name.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase() || name.slice(0, 2).toUpperCase();
});

const branchLabelResolved = computed(() => {
  const s = sale.value || {};
  return firstFilled(s.branch?.name, s.branch_name, s.branch?.display_name, s.branch_id ? `#${s.branch_id}` : "");
});

const invoiceModeResolved = computed(() =>
  firstFilled(saleExtra.value?.invoice_mode, sale.value?.invoice_mode).toUpperCase()
);
const invoiceTypeResolved = computed(() =>
  firstFilled(saleExtra.value?.invoice_type, sale.value?.invoice_type, "—").toUpperCase()
);
const customerTypeResolved = computed(() =>
  firstFilled(saleExtra.value?.customer_type, sale.value?.customer_type, "CONSUMIDOR_FINAL").toUpperCase()
);
const invoiceModeLabelResolved = computed(() => {
  const x = invoiceModeResolved.value;
  if (x === "NO_FISCAL") return "No fiscal";
  if (x === "FISCAL") return "Fiscal";
  if (x === "MIXED") return "Mixta";
  if (x === "TICKET_ONLY") return "Solo ticket";
  return x || "—";
});
const customerTypeLabelResolved = computed(() => {
  const x = customerTypeResolved.value;
  if (x === "CONSUMIDOR_FINAL") return "Consumidor final";
  if (x === "CLIENTE_REGISTRADO") return "Cliente registrado";
  return x || "—";
});

function resolvePaymentMethod(payment) {
  const p = payment || {};
  const display = firstFilled(p.label, p.payment_method_name, p.payment_method_label, p.display_name);
  const methodRaw = firstFilled(p.method, p.kind, p.payment_method_kind).toUpperCase();
  let resolved = methodRaw || "OTHER";
  if (resolved === "QR") resolved = "MERCADOPAGO";
  if (resolved === "CREDIT_SJT") resolved = "CREDIT_SJT";
  return { method_resolved: resolved, method_display: display || methodLabel(resolved) };
}

function extractPaymentDetails(payment) {
  const p = payment || {};
  const noteObj = safeJsonParse(p.note) || {};
  const extra = safeJsonParse(p.extra) || {};
  const merged = { ...noteObj, ...extra };
  const cardKind = firstFilled(p.card_kind, p.cardKind, merged.card_kind, merged.cardKind, merged.card_type, merged.cardType).toUpperCase();
  const cardBrand = firstFilled(p.card_brand, p.cardBrand, merged.card_brand, merged.cardBrand, merged.brand, merged.network);
  const installments = numOrNull(p.installments) ?? numOrNull(merged.installments) ?? numOrNull(merged.cuotas) ?? 1;
  const listTotal = numOrNull(merged.list_total) ?? numOrNull(merged.listTotal) ?? numOrNull(merged.total_list);
  const installmentAmount = numOrNull(merged.per_installment_list) ?? numOrNull(merged.perInstallmentList) ??
    numOrNull(merged.installment_amount) ??
    (Number.isFinite(Number(listTotal)) && Number(installments) > 1 ? Number(listTotal) / Number(installments) : null);
  const totalWithFee = numOrNull(merged.total_with_fee) ?? numOrNull(merged.totalWithFee) ?? numOrNull(merged.total_financiado);
  const priceBasis = firstFilled(merged.price_basis, merged.priceBasis, saleExtra.value?.price_policy).toUpperCase();
  const priceBasisLabel =
    priceBasis === "LIST" || priceBasis === "LIST_PRICE" ? "Precio lista" :
    priceBasis === "DISCOUNT" || priceBasis === "SALE_PRICE" ? "Precio contado" :
    priceBasis === "RESELLER" ? "Revendedor" : "";
  const noteHuman = firstFilled(merged.note, merged.message,
    typeof p.note === "string" && !String(p.note).trim().startsWith("{") ? p.note : "");
  return {
    card_type: cardKind,
    card_type_label: cardKind === "DEBIT" ? "Débito" : cardKind === "CREDIT" ? "Crédito" : "",
    card_brand: cardBrand,
    installments: Number.isFinite(Number(installments)) && Number(installments) > 0 ? Number(installments) : 1,
    installment_amount: installmentAmount,
    list_total: listTotal,
    total_with_fee: totalWithFee,
    price_basis: priceBasis,
    price_basis_label: priceBasisLabel,
    note_human: noteHuman,
  };
}

const paymentsResolved = computed(() => {
  const arr = Array.isArray(sale.value?.payments) ? sale.value.payments : [];
  return arr.map((p) => ({ ...p, ...resolvePaymentMethod(p), ...extractPaymentDetails(p) }));
});

function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}
function dt(val) { return val ? new Date(val).toLocaleString("es-AR") : "—"; }
function number(v) { const n = Number(v || 0); return Number.isFinite(n) ? n : 0; }
function toNum(v) { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; }

function methodLabel(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "Efectivo";
  if (x === "CARD") return "Tarjeta";
  if (x === "TRANSFER") return "Transferencia";
  if (x === "MERCADOPAGO" || x === "QR") return "Mercado Pago";
  if (x === "CREDIT_SJT") return "Crédito / Financiación";
  if (x === "OTHER") return "Otro";
  return m || "—";
}
function payColor(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "green";
  if (x === "CARD") return "indigo";
  if (x === "TRANSFER") return "purple";
  if (x === "MERCADOPAGO" || x === "QR") return "orange";
  if (x === "CREDIT_SJT") return "teal";
  return "grey";
}
function payIcon(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "mdi-cash";
  if (x === "CARD") return "mdi-credit-card-outline";
  if (x === "TRANSFER") return "mdi-bank-transfer";
  if (x === "MERCADOPAGO" || x === "QR") return "mdi-qrcode";
  if (x === "CREDIT_SJT") return "mdi-wallet-outline";
  return "mdi-cash-multiple";
}
function statusLabel(s) {
  const x = String(s || "").toUpperCase();
  if (x === "PAID") return "Pagada";
  if (x === "CANCELLED") return "Cancelada";
  if (x === "REFUNDED") return "Reintegrada";
  if (x === "DRAFT") return "Borrador";
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
function userLabel(s) {
  const u = s?.user || null;
  return u?.name || u?.full_name || u?.email || u?.username || (s?.user_id ? `#${s.user_id}` : "—");
}
function paymentHeadline(p) {
  const installments = Number(p?.installments || 1);
  const method = p?.method_display || methodLabel(p?.method_resolved);
  return installments > 1 ? `${method} en ${installments} cuotas` : `${method} en 1 pago`;
}
function paymentSubline(p) {
  const arr = [];
  if (p?.reference) arr.push(`Ref: ${p.reference}`);
  if (p?.paid_at) arr.push(`Fecha pago: ${dt(p.paid_at)}`);
  if (p?.payment_method_id) arr.push(`ID medio: ${p.payment_method_id}`);
  return arr;
}
function paymentFacts(p) {
  const out = [];
  out.push({ label: "Método", value: p.method_display || methodLabel(p.method_resolved) });
  out.push({ label: "Cuotas", value: Number(p.installments || 1) > 1 ? `${p.installments} cuotas` : "1 cuota" });
  if (p.card_type_label) out.push({ label: "Tipo tarjeta", value: p.card_type_label });
  if (p.card_brand) out.push({ label: "Marca", value: p.card_brand });
  if (p.price_basis_label) out.push({ label: "Base cálculo", value: p.price_basis_label });
  if (p.installment_amount != null && Number(p.installments || 1) > 1)
    out.push({ label: "Valor cuota", value: money(p.installment_amount) });
  if (p.list_total != null) out.push({ label: "Total lista", value: money(p.list_total) });
  if (p.total_with_fee != null) out.push({ label: "Total financiado", value: money(p.total_with_fee) });
  return out;
}
function refundMethodLabel(r) {
  return methodLabel(firstFilled(r?.refund_method, r?.method, r?.payment_method_name, "OTHER"));
}

function p(item) { return item?.product || null; }
function pidOf(item) {
  const pid = Number(item?.product_id || item?.productId || p(item)?.id || 0);
  return Number.isFinite(pid) ? pid : 0;
}
function productName(item) {
  return item?.product_name_snapshot || p(item)?.name || p(item)?.title ||
    (pidOf(item) ? `Producto #${pidOf(item)}` : "Producto");
}
function productSku(item) {
  const prod = p(item) || {};
  const v = item?.product_sku_snapshot || prod?.sku || prod?.code || prod?.product_code || prod?.barcode || null;
  return v ? String(v).trim() : "";
}
function productBrand(item) { return String(p(item)?.brand || p(item)?.marca || "").trim(); }
function productModel(item) { return String(p(item)?.model || p(item)?.modelo || "").trim(); }
function categoryLabel(item) {
  const prod = p(item) || {};
  const cat = prod?.category || null;
  if (cat?.name) { const parent = cat?.parent?.name ? ` / ${cat.parent.name}` : ""; return `${cat.name}${parent}`; }
  const cid = Number(prod?.category_id || prod?.subcategory_id || 0) || null;
  return cid ? `#${cid}` : "";
}
function productMetaLine(item) {
  const parts = [];
  const sku = productSku(item); const brand = productBrand(item); const model = productModel(item);
  if (sku) parts.push(`SKU: ${sku}`);
  if (brand) parts.push(`Marca: ${brand}`);
  if (model) parts.push(`Modelo: ${model}`);
  return parts.join(" · ");
}

const imageById = ref({});
const imgLoading = ref({});
function pickUrlFromImageRow(row) {
  if (!row) return "";
  return row.url || row.public_url || row.publicUrl || row.image_url || row.path || row.filename || "";
}
function normalizeUrl(u) {
  if (!u) return "";
  const s = String(u);
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  if (apiBase && s.startsWith("/")) return apiBase + s;
  const s3Base = (import.meta.env.VITE_S3_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  if (s3Base) return s3Base + (s.startsWith("/") ? s : `/${s}`);
  return s;
}
function pickImageFromProduct(prod) {
  const direct = prod?.main_image_url || prod?.image_url || prod?.image || prod?.thumb_url || prod?.public_url || null;
  if (direct) return normalizeUrl(direct);
  const arr = Array.isArray(prod?.images) ? prod.images : Array.isArray(prod?.product_images) ? prod.product_images : null;
  if (arr?.length) { const u = pickUrlFromImageRow(arr[0]); if (u) return normalizeUrl(u); }
  return "";
}
async function fetchFirstImageViaStore(productId) {
  const pid = Number(productId || 0);
  if (!pid) return "";
  if (imageById.value[pid] !== undefined) return imageById.value[pid] || "";
  if (imgLoading.value[pid]) return "";
  imgLoading.value = { ...imgLoading.value, [pid]: true };
  try {
    const imgs = await productsStore.fetchImages(pid);
    const arr = Array.isArray(imgs) ? imgs : [];
    const u = pickUrlFromImageRow(arr[0] || null);
    const finalUrl = u ? normalizeUrl(u) : "";
    imageById.value = { ...imageById.value, [pid]: finalUrl };
    return finalUrl;
  } catch {
    imageById.value = { ...imageById.value, [pid]: "" };
    return "";
  } finally {
    const next = { ...imgLoading.value }; delete next[pid]; imgLoading.value = next;
  }
}
function itemImage(item) {
  const prod = p(item) || {};
  const pid = pidOf(item);
  if (!pid) return "";
  const fromObj = pickImageFromProduct(prod);
  if (fromObj) {
    if (imageById.value[pid] !== fromObj) imageById.value = { ...imageById.value, [pid]: fromObj };
    return fromObj;
  }
  if (imageById.value[pid] !== undefined) return imageById.value[pid] || "";
  fetchFirstImageViaStore(pid);
  return "";
}
function stockQty(item) {
  const prod = p(item) || {};
  const q = prod?.qty ?? prod?.stock_qty ?? prod?.stock ?? prod?.on_hand ?? prod?.available_qty ?? prod?.existence ?? null;
  if (q === null || q === undefined) return null;
  return toNum(q);
}
function availabilityLabel(item) {
  if (!p(item)) return "—";
  const q = stockQty(item);
  if (q === null) return "—";
  if (q <= 0) return "Sin stock";
  if (q <= 2) return "Bajo";
  return "Disponible";
}
function availabilityColor(item) {
  const lab = availabilityLabel(item);
  if (lab === "Disponible") return "green";
  if (lab === "Bajo") return "orange";
  if (lab === "Sin stock") return "red";
  return "grey";
}

function goToProduct(pid) {
  const n = Number(pid || 0);
  if (!n) return;
  router.push({ name: "productView", params: { id: n } }).catch(() => {
    router.push({ path: `/app/products/${n}/view` }).catch(() => {
      snack.value = { show: true, text: "No se encontró la ruta del producto" };
    });
  });
}
function openImage(item) { imageItem.value = item || null; imageDialog.value = true; }

function needsHydrateProducts(items) {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return false;
  return arr.some((it) => {
    const prod = it?.product;
    if (!prod) return true;
    const name = prod?.name || prod?.title || prod?.product_name;
    if (!name) return true;
    const hasSku = !!(prod?.sku || prod?.code);
    const hasQty = prod?.qty !== undefined || prod?.stock_qty !== undefined;
    return !(hasSku && hasQty);
  });
}
async function fetchPosProductOne(id) {
  const pid = Number(id || 0);
  if (!pid) return null;
  for (const a of [{ url: `/pos/products/${pid}`, params: { include_images: 1 } }, { url: `/pos/products/${pid}` }]) {
    try {
      const { data } = await http.get(a.url, a.params ? { params: a.params } : undefined);
      const obj = data?.ok ? data?.data : data;
      if (obj && typeof obj === "object" && !Array.isArray(obj)) return obj;
    } catch {}
  }
  return null;
}
async function fetchPosProductsBatch(ids) {
  const { data } = await http.get("/pos/products", { params: { ids: ids.join(","), include_images: 1, limit: ids.length, page: 1 } });
  const out = data?.data || data || [];
  const arr = Array.isArray(out) ? out : Array.isArray(out?.items) ? out.items : [];
  if (!arr.length) throw new Error("vacío");
  return arr;
}
async function fetchProductFallbackOne(id) {
  const pid = Number(id || 0);
  if (!pid) return null;
  for (const a of [{ url: `/products/${pid}`, params: { include_images: 1 } }, { url: `/products/${pid}` }]) {
    try {
      const { data } = await http.get(a.url, a.params ? { params: a.params } : undefined);
      const obj = data?.ok ? data?.data : data;
      if (obj && typeof obj === "object" && !Array.isArray(obj)) return obj;
    } catch {}
  }
  return null;
}
async function hydrateProductsForItems() {
  const s = sale.value;
  if (!s) return;
  const items = Array.isArray(s.items) ? s.items : [];
  if (!needsHydrateProducts(items)) return;
  const ids = Array.from(new Set(items.map((it) => pidOf(it)).filter((n) => Number.isFinite(n) && n > 0)));
  if (!ids.length) return;
  productsLoading.value = true;
  try {
    const map = new Map();
    try {
      const list = await fetchPosProductsBatch(ids);
      for (const pr of list) { const pid = Number(pr?.id || 0); if (pid) map.set(pid, pr); }
    } catch {
      const rows = await Promise.all(ids.map((pid) => fetchPosProductOne(pid).catch(() => null)));
      for (const pr of rows) { const pid = Number(pr?.id || 0); if (pid) map.set(pid, pr); }
    }
    const missing = ids.filter((pid) => !map.has(pid));
    if (missing.length) {
      const rows = await Promise.all(missing.map((pid) => fetchProductFallbackOne(pid).catch(() => null)));
      for (const pr of rows) { const pid = Number(pr?.id || 0); if (pid && !map.has(pid)) map.set(pid, pr); }
    }
    for (const it of items) { const pid = pidOf(it); if (pid && map.has(pid)) it.product = map.get(pid); }
  } finally { productsLoading.value = false; }
}

async function load() {
  loading.value = true;
  payload.value = null;
  try {
    const { data } = await http.get(`/pos/sales/${id.value}`);
    if (!data?.ok) throw new Error(data?.message || "Error cargando venta");
    payload.value = data.data || null;
    await hydrateProductsForItems();
  } catch (e) {
    snack.value = { show: true, text: e?.response?.data?.message || e?.message || "Error" };
  } finally { loading.value = false; }
}

onMounted(load);
watch(id, () => load());
</script>

<style scoped>
.sd { display: flex; flex-direction: column; min-height: 100%; }

/* ── TOP BAR ── */
.sd-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  position: sticky; top: 0; z-index: 10;
}
.sd-back { flex-shrink: 0; margin-left: -4px; }
.sd-bar-title { font-size: 16px; font-weight: 500; }
.sd-bar-sub { font-size: 11px; opacity: 0.45; margin-top: 1px; }

/* ── LOADING ── */
.sd-loading { display: flex; align-items: center; gap: 12px; padding: 40px 20px; opacity: 0.7; font-size: 14px; }

/* ── HERO STRIP ── */
.sd-hero {
  display: flex; align-items: center; flex-wrap: wrap; gap: 0;
  padding: 12px 16px;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.sd-hs { flex: 1; min-width: 110px; display: flex; align-items: center; gap: 10px; padding: 4px 10px; }
.sd-hs-ico {
  width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
  display: grid; place-items: center;
}
.sd-hs-ico--primary { background: rgb(var(--v-theme-primary)); }
.sd-hs-ico--green   { background: rgb(var(--v-theme-success)); }
.sd-hs-ico--indigo  { background: #5c6bc0; }
.sd-hs-ico--purple  { background: #9c27b0; }
.sd-hs-ico--teal    { background: #009688; }
.sd-hs-val { font-size: 14px; font-weight: 500; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
.sd-hs-lbl { font-size: 10px; opacity: 0.4; font-weight: 400; text-transform: uppercase; letter-spacing: 0.04em; }
.sd-hero-sep { width: 1px; height: 32px; background: rgba(var(--v-border-color), var(--v-border-opacity)); flex-shrink: 0; }

/* ── TABS ── */
.sd-tabs {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  position: sticky; top: 49px; z-index: 9;
}

/* ── TAB ── */
.sd-tab { padding: 14px 16px 24px; }
.sd-tab-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.sd-tab-head-left { display: flex; align-items: center; gap: 9px; }
.sd-tab-ttl { font-size: 13px; font-weight: 500; }

/* ── SHARED BADGE ── */
.sd-badge {
  width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
  display: grid; place-items: center;
}
.sd-badge--primary { background: rgb(var(--v-theme-primary)); }
.sd-badge--purple  { background: #9c27b0; }
.sd-badge--green   { background: rgb(var(--v-theme-success)); }
.sd-badge--indigo  { background: #5c6bc0; }
.sd-badge--orange  { background: rgb(var(--v-theme-warning)); }
.sd-badge--teal    { background: #009688; }

/* ── INFO GRID (3 cols) ── */
.sd-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

/* ── CARD ── */
.sd-card {
  position: relative;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
}
.sd-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  border-radius: 14px 0 0 14px;
}
.sd-card--primary::before { background: rgb(var(--v-theme-primary)); }
.sd-card--purple::before  { background: #9c27b0; }
.sd-card--green::before   { background: rgb(var(--v-theme-success)); }
.sd-card--empty { opacity: 0.75; }

.sd-card-head {
  display: flex; align-items: center; gap: 9px;
  margin-bottom: 12px;
}
.sd-card-ttl { font-size: 12px; font-weight: 500; opacity: 0.5; text-transform: uppercase; letter-spacing: 0.06em; flex: 1; }

/* Customer panel */
.sd-cust-avatar {
  width: 44px; height: 44px; border-radius: 12px;
  background: rgba(#9c27b0, 0.12);
  background: rgba(var(--v-theme-primary), 0.1);
  display: grid; place-items: center;
  margin-bottom: 8px;
}
.sd-cust-initials { font-size: 16px; font-weight: 500; }
.sd-cust-name { font-size: 17px; font-weight: 500; line-height: 1.2; margin-bottom: 2px; }

/* Pay panel */
.sd-pay-main { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 8px 0 10px; }
.sd-pay-big { font-size: 22px; font-weight: 500; }

/* Info rows with icons */
.sd-irows { display: flex; flex-direction: column; }
.sd-ir {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.6));
}
.sd-ir:last-child { border-bottom: none; }
.sd-ir-ico { opacity: 0.35; flex-shrink: 0; }
.sd-ir-k { font-size: 11px; font-weight: 400; opacity: 0.45; text-transform: uppercase; letter-spacing: 0.04em; flex: 1; min-width: 0; }
.sd-ir-v { font-size: 13px; font-weight: 400; text-align: right; word-break: break-word; }
.sd-mono { font-family: monospace; font-size: 12px; }

.sd-no-data {
  display: flex; align-items: center;
  font-size: 12px; opacity: 0.4;
  padding: 8px 0;
}

/* ── TOTALES STRIP ── */
.sd-totals {
  display: flex; flex-wrap: wrap;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 14px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}
.sd-tot {
  flex: 1; min-width: 110px;
  padding: 12px 14px;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.sd-tot:last-child { border-right: none; }
.sd-tot-k {
  display: flex; align-items: center;
  font-size: 10px; font-weight: 500;
  opacity: 0.4; text-transform: uppercase; letter-spacing: 0.05em;
  margin-bottom: 4px;
}
.sd-tot-v { font-size: 17px; font-weight: 500; }
.sd-tot--main { background: rgba(var(--v-theme-primary), 0.05); }
.sd-tot--main .sd-tot-v { color: rgb(var(--v-theme-primary)); }
.sd-tot--ok .sd-tot-v { color: rgb(var(--v-theme-success)); }
.sd-tot--neg .sd-tot-v { color: rgb(var(--v-theme-warning)); }
.sd-tot--warn .sd-tot-v { color: rgb(var(--v-theme-warning)); }
.sd-tot--neto { background: rgba(var(--v-theme-success), 0.04); }
.sd-tot--neto .sd-tot-v { color: rgb(var(--v-theme-success)); }

/* ── ITEMS LIST ── */
.sd-items-list { display: flex; flex-direction: column; gap: 8px; }
.sd-item-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
}
.sd-item-img {
  width: 52px; height: 52px; border-radius: 10px; flex-shrink: 0;
  overflow: hidden; cursor: zoom-in;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  display: grid; place-items: center;
}
.sd-img { width: 100%; height: 100%; object-fit: cover; }
.sd-item-body { flex: 1; min-width: 0; }
.sd-item-name { font-size: 14px; font-weight: 500; line-height: 1.3; }
.sd-item-meta { font-size: 11px; opacity: 0.5; margin-top: 2px; }
.sd-item-chips { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 5px; }
.sd-item-nums { text-align: right; flex-shrink: 0; }
.sd-item-qty { font-size: 15px; font-weight: 500; }
.sd-item-unit { font-size: 11px; opacity: 0.5; }
.sd-item-total { font-size: 14px; font-weight: 500; color: rgb(var(--v-theme-primary)); }

.sd-empty {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 32px; opacity: 0.45; font-size: 13px;
}

/* ── PAYMENTS ── */
.sd-pays { display: flex; flex-direction: column; gap: 10px; }
.sd-pay-card {
  padding: 14px 16px; border-radius: 14px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
}
.sd-pay-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
.sd-pay-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.sd-pay-amount-box {
  padding: 8px 12px; border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.07);
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
  text-align: right; flex-shrink: 0;
}
.sd-pay-albl { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.45; }
.sd-pay-aval { font-size: 18px; font-weight: 500; }
.sd-pay-headline { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
.sd-pay-subline { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 12px; opacity: 0.5; margin-bottom: 8px; }

.sd-facts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px; margin-top: 10px;
}
.sd-fact {
  padding: 9px 11px; border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.sd-fact-lbl { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.4; }
.sd-fact-val { font-size: 13px; font-weight: 400; margin-top: 3px; }
.sd-pay-note {
  display: flex; align-items: center;
  margin-top: 10px; padding: 9px 11px; border-radius: 10px;
  font-size: 12px; opacity: 0.65;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px dashed rgba(var(--v-border-color), calc(var(--v-border-opacity) * 1.5));
}

/* ── HISTORIAL ── */
.sd-hist-list { display: flex; flex-direction: column; gap: 8px; }
.sd-hist-card {
  padding: 12px 14px; border-radius: 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  position: relative; overflow: hidden;
}
.sd-hist-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
.sd-hist-card--orange::before { background: rgb(var(--v-theme-warning)); }
.sd-hist-card--teal::before   { background: #009688; }
.sd-hist-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.sd-hist-date { font-size: 13px; font-weight: 400; }
.sd-hist-meta { font-size: 12px; opacity: 0.55; margin-top: 3px; }

/* ── RESPONSIVE ── */
@media (max-width: 860px) {
  .sd-info-grid { grid-template-columns: 1fr 1fr; }
  .sd-card--green { grid-column: 1 / -1; }
}
@media (max-width: 560px) {
  .sd-info-grid { grid-template-columns: 1fr; }
  .sd-card--green { grid-column: auto; }
  .sd-hero { overflow-x: auto; flex-wrap: nowrap; }
  .sd-hs { min-width: 100px; }
  .sd-tab { padding: 10px 12px 20px; }
  .sd-totals { overflow-x: auto; flex-wrap: nowrap; }
  .sd-tot { min-width: 100px; }
}
</style>
