<!--
  ShopOrdersTable
  ---------------
  Tabla de pedidos del shop. Cada fila ofrece:
   - Click "Ver" → navega a /admin/shop/orders/:id (página completa).
   - Menú de acciones rápidas para avanzar el estado del pedido
     (vía PATCH /admin/shop/orders/:id/status).
-->
<template>
  <v-data-table-server
    :headers="headers"
    :items="rows"
    :items-length="meta.total"
    :loading="loading"
    :page="meta.page"
    :items-per-page="meta.limit"
    density="comfortable"
    class="orders-table"
    item-value="id"
    @update:page="$emit('page', $event)"
    @update:items-per-page="$emit('limit', $event)"
  >
    <!-- Pedido / código -->
    <template #item.public_code="{ item }">
      <div class="ot-code">
        <div class="ot-code__id">#{{ item.id }}</div>
        <div class="ot-code__public" v-if="item.public_code" :title="item.public_code">
          {{ item.public_code }}
        </div>
      </div>
    </template>

    <!-- Cliente -->
    <template #item.customer="{ item }">
      <div class="ot-cust">
        <div class="ot-cust__name">{{ item.customer_name || "—" }}</div>
        <div class="ot-cust__email">{{ item.customer_email || "—" }}</div>
        <div class="ot-cust__meta" v-if="item.customer_phone || item.customer_doc_number">
          <span v-if="item.customer_phone">📞 {{ item.customer_phone }}</span>
          <span v-if="item.customer_doc_number">· DNI {{ item.customer_doc_number }}</span>
        </div>
      </div>
    </template>

    <!-- Sucursal -->
    <template #item.branch_name="{ item }">
      <v-chip size="small" label variant="tonal" color="primary">
        <v-icon size="14" start>mdi-storefront-outline</v-icon>
        {{ item.branch_name || `#${item.branch_id}` }}
      </v-chip>
    </template>

    <!-- Entrega -->
    <template #item.fulfillment_type="{ item }">
      <v-chip size="small" label :color="fulfillmentColor(item.fulfillment_type)" variant="tonal">
        <v-icon size="14" start>
          {{ String(item.fulfillment_type).toLowerCase() === 'pickup' ? 'mdi-storefront-outline' : 'mdi-truck-delivery-outline' }}
        </v-icon>
        {{ fulfillmentLabel(item.fulfillment_type) }}
      </v-chip>

      <div v-if="String(item.fulfillment_type||'').toLowerCase()==='delivery'" class="ot-muted ot-tiny mt-1">
        {{ shortShipLine(item) }}
      </div>
    </template>

    <!-- Estado / Pago -->
    <template #item.status="{ item }">
      <v-chip size="small" label :color="statusColor(item.status)" variant="flat">
        {{ orderStatusLabel(item.status) }}
      </v-chip>

      <div class="ot-payline" v-if="item.payment_provider || item.payment_status">
        <v-icon size="13" :color="isOrderPaid(item) ? 'success' : undefined">
          {{ isOrderPaid(item) ? 'mdi-check-circle' : 'mdi-credit-card-outline' }}
        </v-icon>
        <span class="ot-muted">{{ paymentSummaryLine(item) }}</span>
      </div>
    </template>

    <!-- Items -->
    <template #item.items_qty="{ item }">
      <div class="ot-right">
        <b>{{ fmtQty(item.items_qty) }}</b>
        <div class="ot-muted ot-tiny">{{ item.items_count || 0 }} líneas</div>
      </div>
    </template>

    <!-- Total -->
    <template #item.total="{ item }">
      <div class="ot-right">
        <b class="ot-total">$ {{ fmtMoney(item.total) }}</b>
        <div class="ot-muted ot-tiny">{{ fmtDate(item.created_at, true) }}</div>
      </div>
    </template>

    <!-- Acciones -->
    <template #item.actions="{ item }">
      <div class="ot-actions">
        <v-btn
          size="small"
          variant="flat"
          color="primary"
          prepend-icon="mdi-eye-outline"
          @click="$emit('view', item)"
        >
          Ver
        </v-btn>

        <v-menu v-if="hasNextActions(item)" location="bottom end">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              size="small"
              variant="tonal"
              icon="mdi-dots-vertical"
              :loading="statusBusyId === item.id"
              :title="'Cambiar estado'"
            />
          </template>

          <v-list density="compact" min-width="220">
            <v-list-subheader>Cambiar estado</v-list-subheader>
            <v-list-item
              v-for="a in nextStatusActions(item.status)"
              :key="a.value"
              @click="$emit('change-status', { item, status: a.value })"
            >
              <template #prepend>
                <v-icon :color="a.color" size="20">{{ a.icon }}</v-icon>
              </template>
              <v-list-item-title>{{ a.label }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </template>

    <template #no-data>
      <div class="ot-empty">
        <v-icon size="40" color="medium-emphasis">mdi-package-variant-closed</v-icon>
        <div class="ot-empty__title">No hay pedidos con esos filtros</div>
        <div class="ot-empty__sub">Probá ajustar los filtros o vaciarlos.</div>
      </div>
    </template>
  </v-data-table-server>
</template>

<script setup>
import {
  fmtMoney, fmtQty, fmtDate,
  fulfillmentLabel, fulfillmentColor, shortShipLine,
  statusColor, orderStatusLabel,
  paymentSummaryLine, isOrderPaid,
  nextStatusActions,
} from "@/modules/admin/utils/shopOrdersUi";

const props = defineProps({
  headers: { type: Array, required: true },
  rows: { type: Array, required: true },
  meta: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  statusBusyId: { type: [Number, String, null], default: null },
});
defineEmits(["page", "limit", "view", "change-status"]);

function hasNextActions(item) {
  return nextStatusActions(item?.status).length > 0;
}
</script>

<style scoped>
.orders-table :deep(.v-data-table__td) {
  vertical-align: top;
  padding-top: 12px !important;
  padding-bottom: 12px !important;
}
.orders-table :deep(.v-data-table__th) {
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(var(--v-theme-on-surface), 0.65);
}
.orders-table :deep(tbody tr:hover) {
  background: rgba(var(--v-theme-primary), 0.04);
}

.ot-code {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.ot-code__id {
  font-weight: 700;
  font-size: 14px;
  letter-spacing: -0.01em;
}
.ot-code__public {
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: rgba(var(--v-theme-on-surface), 0.55);
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.ot-cust {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.ot-cust__name {
  font-weight: 600;
  font-size: 13.5px;
  line-height: 1.2;
  color: rgb(var(--v-theme-on-surface));
}
.ot-cust__email {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 240px;
}
.ot-cust__meta {
  display: flex;
  gap: 8px;
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  margin-top: 2px;
}

.ot-payline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 12px;
}

.ot-right {
  text-align: right;
}
.ot-total {
  font-size: 14.5px;
  letter-spacing: -0.01em;
  color: rgb(var(--v-theme-on-surface));
}

.ot-muted {
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.ot-tiny { font-size: 11.5px; }

.ot-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
}

.ot-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 36px 16px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  text-align: center;
}
.ot-empty__title {
  font-size: 14px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin-top: 6px;
}
.ot-empty__sub {
  font-size: 12.5px;
}
</style>
