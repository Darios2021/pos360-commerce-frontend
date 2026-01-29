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
    <template #item.public_code="{ item }">
      <div class="code">
        <v-chip size="small" label class="mr-2" color="primary" variant="tonal">{{ item.public_code }}</v-chip>
        <span class="muted">#{{ item.id }}</span>
      </div>
    </template>

    <template #item.customer="{ item }">
      <div class="cust">
        <div class="cust-name">{{ item.customer_name || "—" }}</div>
        <div class="cust-email">{{ item.customer_email || "—" }}</div>
        <div class="muted" v-if="item.customer_phone">Tel: {{ item.customer_phone }}</div>
        <div class="muted" v-if="item.customer_doc_number">Doc: {{ item.customer_doc_number }}</div>
      </div>
    </template>

    <template #item.branch_name="{ item }">
      <v-chip size="small" label variant="tonal">{{ item.branch_name || `Sucursal ${item.branch_id}` }}</v-chip>
    </template>

    <template #item.fulfillment_type="{ item }">
      <v-chip size="small" label :color="fulfillmentColor(item.fulfillment_type)" variant="tonal">
        {{ fulfillmentLabel(item.fulfillment_type) }}
      </v-chip>

      <div v-if="String(item.fulfillment_type||'').toLowerCase()==='delivery'" class="muted mt-1">
        {{ shortShipLine(item) }}
      </div>
    </template>

    <template #item.status="{ item }">
      <v-chip size="small" label :color="statusColor(item.status)" variant="tonal">
        {{ orderStatusLabel(item.status) }}
      </v-chip>

      <div class="payline" v-if="item.payment_provider || item.payment_status || item.order_payment_status">
        <span class="muted">{{ paymentSummaryLine(item) }}</span>
      </div>

      <div class="payline" v-if="isOrderPaid(item)">
        <v-chip size="x-small" label color="green" variant="tonal">Pagado ✅</v-chip>
        <span class="muted ml-2">→ Coordinar entrega</span>
      </div>
    </template>

    <template #item.items_qty="{ item }">
      <div class="right">
        <b>{{ fmtQty(item.items_qty) }}</b>
        <div class="muted">({{ item.items_count || 0 }} líneas)</div>
      </div>
    </template>

    <template #item.total="{ item }">
      <div class="right">
        <b>$ {{ fmtMoney(item.total) }}</b>
        <div class="muted">{{ fmtDate(item.created_at) }}</div>
      </div>
    </template>

    <template #item.actions="{ item }">
      <v-btn size="small" variant="tonal" prepend-icon="mdi-eye" @click="$emit('view', item)">
        Ver
      </v-btn>
    </template>

    <template #no-data>
      <div class="text-medium-emphasis py-6 text-center">No hay pedidos con esos filtros.</div>
    </template>
  </v-data-table-server>
</template>

<script setup>
import {
  fmtMoney, fmtQty, fmtDate,
  fulfillmentLabel, fulfillmentColor, shortShipLine,
  statusColor, orderStatusLabel,
  paymentSummaryLine, isOrderPaid,
} from "@/modules/admin/utils/shopOrdersUi";

defineProps({
  headers: { type: Array, required: true },
  rows: { type: Array, required: true },
  meta: { type: Object, required: true },
  loading: { type: Boolean, default: false },
});
defineEmits(["page", "limit", "view"]);
</script>

<style scoped>
.orders-table :deep(.v-data-table__td) { vertical-align: top; }
.code { display:flex; align-items:center; gap:8px; }
.cust-name { font-weight:900; line-height:1.1; }
.cust-email { font-size:12px; opacity:.75; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.payline { margin-top:4px; font-size:12px; opacity:.85; }
.right { text-align:right; }
.muted { opacity:.72; font-size:12px; }
</style>
