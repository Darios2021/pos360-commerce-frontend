<template>
  <v-dialog v-model="open" max-width="980">
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center ga-2">
          <div class="text-h6 font-weight-bold">Pedido</div>
          <v-chip v-if="order?.public_code" label color="primary" variant="tonal">{{ order.public_code }}</v-chip>
          <span class="muted" v-if="order?.id">#{{ order.id }}</span>
        </div>
        <v-btn icon variant="text" @click="close"><v-icon>mdi-close</v-icon></v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-alert v-if="loading" type="info" variant="tonal" class="mb-3">Cargando detalle...</v-alert>
        <v-alert v-if="error" type="error" variant="tonal" class="mb-3">{{ error }}</v-alert>

        <template v-if="order">
          <div class="detail-grid">
            <div class="box">
              <div class="box-title">Estado del pedido</div>
              <v-chip label size="small" :color="statusColor(order.status)" variant="tonal">
                {{ orderStatusLabel(order.status) }}
              </v-chip>

              <div class="mt-3 box-title">Estado del pago</div>
              <v-chip label size="small" :color="orderPayColor(order.payment_status)" variant="tonal">
                {{ orderPayLabel(order.payment_status) }}
              </v-chip>
              <div class="muted mt-1" v-if="order.paid_at">Pagado el: {{ fmtDate(order.paid_at, true) }}</div>

              <div class="mt-3 box-title">Sucursal</div>
              <div class="muted">{{ order.branch_name || `Sucursal ${order.branch_id}` }}</div>

              <div class="mt-3 box-title">Entrega</div>
              <div class="muted">{{ fulfillmentLabel(order.fulfillment_type) }}</div>
            </div>

            <div class="box">
              <div class="box-title">Comprador</div>
              <div><b>{{ fullName(order) || order.customer_name || order.ship_name || "—" }}</b></div>
              <div class="muted">{{ order.customer_email || order.email || "—" }}</div>
              <div class="muted" v-if="order.phone || order.ship_phone">Tel: {{ order.phone || order.ship_phone }}</div>
              <div class="muted" v-if="order.doc_number">Doc: {{ order.doc_number }}</div>
            </div>

            <div class="box">
              <div class="box-title">Totales</div>
              <div class="muted">Subtotal: <b>$ {{ fmtMoney(order.subtotal) }}</b></div>
              <div class="muted">Descuento: <b>$ {{ fmtMoney(order.discount_total) }}</b></div>
              <div class="muted">Envío: <b>$ {{ fmtMoney(order.shipping_total) }}</b></div>
              <div class="muted">Total: <b>$ {{ fmtMoney(order.total) }}</b></div>
              <div class="muted mt-2">Creado: {{ fmtDate(order.created_at, true) }}</div>
            </div>
          </div>

          <v-divider class="my-4" />

          <div class="text-subtitle-2 font-weight-bold mb-2">Dirección / Datos de entrega</div>
          <v-card variant="tonal" rounded="lg" class="pa-3">
            <template v-if="String(order.fulfillment_type||'').toLowerCase()==='delivery'">
              <div class="d-flex flex-wrap ga-2">
                <v-chip size="small" label variant="tonal" color="deep-purple">Envío a domicilio</v-chip>
                <v-chip v-if="order.ship_city" size="small" label variant="tonal">{{ order.ship_city }}</v-chip>
                <v-chip v-if="order.ship_province" size="small" label variant="tonal">{{ order.ship_province }}</v-chip>
                <v-chip v-if="order.ship_zip" size="small" label variant="tonal">CP {{ order.ship_zip }}</v-chip>
              </div>

              <div class="mt-3">
                <div><b>{{ order.ship_name || "—" }}</b></div>
                <div class="muted" v-if="order.ship_phone">Tel: {{ order.ship_phone }}</div>

                <div class="mt-2">
                  <div>{{ order.ship_address1 || "—" }}</div>
                  <div class="muted" v-if="order.ship_address2">{{ order.ship_address2 }}</div>
                </div>

                <div class="muted mt-2" v-if="order.notes">Nota: {{ order.notes }}</div>
              </div>
            </template>

            <template v-else>
              <div class="d-flex flex-wrap ga-2">
                <v-chip size="small" label variant="tonal" color="teal">Retiro en sucursal</v-chip>
                <div class="muted">El cliente retira en la sucursal seleccionada. (No hay dirección de envío.)</div>
              </div>
              <div class="muted mt-2" v-if="order.notes">Nota: {{ order.notes }}</div>
            </template>
          </v-card>

          <v-divider class="my-4" />

          <div class="text-subtitle-2 font-weight-bold mb-2">Items</div>
          <v-table density="comfortable">
            <thead>
              <tr>
                <th style="width: 90px;">ID</th>
                <th>Producto</th>
                <th class="text-right">Cant.</th>
                <th class="text-right">Precio</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="it in items" :key="it.id">
                <td class="muted">#{{ it.id }}</td>
                <td>
                  <div class="font-weight-medium">{{ it.product_name }}</div>
                  <div class="muted">product_id: {{ it.product_id }}</div>
                </td>
                <td class="text-right">{{ fmtQty(it.qty) }}</td>
                <td class="text-right">$ {{ fmtMoney(it.unit_price) }}</td>
                <td class="text-right"><b>$ {{ fmtMoney(it.line_total) }}</b></td>
              </tr>
            </tbody>
          </v-table>

          <v-divider class="my-4" />

          <div class="text-subtitle-2 font-weight-bold mb-2">Pagos</div>
          <v-table density="comfortable">
            <thead>
              <tr>
                <th style="width: 90px;">ID</th>
                <th>Método</th>
                <th>Estado</th>
                <th class="text-right">Monto</th>
                <th>Referencia</th>
                <th style="width: 320px;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in payments" :key="p.id">
                <td class="muted">#{{ p.id }}</td>

                <td>
                  <div class="d-flex align-center ga-2">
                    <v-icon v-if="paymentMethodIcon(p)" size="18">{{ paymentMethodIcon(p) }}</v-icon>
                    <v-chip size="small" label variant="tonal">{{ paymentMethodTitle(p) }}</v-chip>

                    <v-chip
                      v-if="paymentMethodBadgeText(p)"
                      size="x-small"
                      label
                      variant="tonal"
                      :color="badgeColor(paymentMethodBadgeVariant(p))"
                    >
                      {{ paymentMethodBadgeText(p) }}
                    </v-chip>
                  </div>

                  <div class="muted mt-1" v-if="paymentMethodDesc(p)">{{ paymentMethodDesc(p) }}</div>
                </td>

                <td>
                  <v-chip size="small" label variant="tonal" :color="paymentStatusColor(p.status)">
                    {{ paymentStatusLabel(p.status) }}
                  </v-chip>
                  <div class="muted mt-1" v-if="p.paid_at">Pagado el: {{ fmtDate(p.paid_at, true) }}</div>
                </td>

                <td class="text-right"><b>$ {{ fmtMoney(p.amount) }}</b></td>

                <td class="muted">
                  <div v-if="p.external_id">id: {{ p.external_id }}</div>
                  <div v-if="p.external_status">st: {{ p.external_status }}</div>
                  <div v-if="p.reference">ref: {{ p.reference }}</div>
                  <div v-if="p.bank_reference">banco: {{ p.bank_reference }}</div>

                  <div v-if="proofUrlFromPayment(p)">comp: <a :href="proofUrlFromPayment(p)" target="_blank" rel="noreferrer">ver</a></div>
                  <div v-if="mpInitPointFromPayment(p)">mp: <a :href="mpInitPointFromPayment(p)" target="_blank" rel="noreferrer">pagar</a></div>

                  <div v-if="noRefs(p)">—</div>
                </td>

                <td>
                  <div class="d-flex flex-wrap ga-2">
                    <v-btn
                      v-if="canCreateMpLink(p)"
                      size="small"
                      variant="tonal"
                      prepend-icon="mdi-link-variant"
                      :loading="payAction.loading && payAction.paymentId === p.id && payAction.type === 'mp'"
                      @click="$emit('create-mp', p)"
                    >
                      Crear link MP
                    </v-btn>

                    <v-btn
                      v-if="canUploadProof(p)"
                      size="small"
                      variant="tonal"
                      prepend-icon="mdi-upload"
                      @click="$emit('open-upload', p)"
                    >
                      Subir comp.
                    </v-btn>

                    <v-btn
                      v-if="canReviewTransfer(p)"
                      size="small"
                      color="green"
                      variant="tonal"
                      prepend-icon="mdi-check"
                      :loading="payAction.loading && payAction.paymentId === p.id && payAction.type === 'approve'"
                      @click="$emit('review-transfer', p, 'approve')"
                    >
                      Aprobar
                    </v-btn>

                    <v-btn
                      v-if="canReviewTransfer(p)"
                      size="small"
                      color="red"
                      variant="tonal"
                      prepend-icon="mdi-close"
                      :loading="payAction.loading && payAction.paymentId === p.id && payAction.type === 'reject'"
                      @click="$emit('review-transfer', p, 'reject')"
                    >
                      Rechazar
                    </v-btn>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="tonal" @click="close">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from "vue";
import {
  fmtMoney, fmtQty, fmtDate, fullName,
  fulfillmentLabel,
  statusColor, orderStatusLabel,
  orderPayLabel, orderPayColor,
  paymentStatusLabel, paymentStatusColor,
  paymentMethodTitle, paymentMethodDesc, paymentMethodIcon,
  paymentMethodBadgeText, paymentMethodBadgeVariant, badgeColor,
  canCreateMpLink, canUploadProof, canReviewTransfer,
  mpInitPointFromPayment, proofUrlFromPayment,
} from "@/modules/admin/utils/shopOrdersUi";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
  data: { type: Object, default: null },
  payAction: { type: Object, default: () => ({ loading: false, paymentId: null, type: "" }) },
});

const emit = defineEmits(["update:modelValue", "close", "create-mp", "open-upload", "review-transfer"]);

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const order = computed(() => props.data?.order || null);
const items = computed(() => props.data?.items || []);
const payments = computed(() => props.data?.payments || []);

function close() {
  emit("update:modelValue", false);
  emit("close");
}

function noRefs(p) {
  return !p?.external_id && !p?.external_status && !p?.reference && !p?.bank_reference && !proofUrlFromPayment(p) && !mpInitPointFromPayment(p);
}
</script>

<style scoped>
.detail-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
@media (max-width:900px){ .detail-grid{ grid-template-columns:1fr; } }
.box { border:1px solid rgba(255,255,255,.08); border-radius:16px; padding:12px; background:rgba(255,255,255,.03); }
.box-title { font-weight:900; margin-bottom:6px; }
.muted { opacity:.72; font-size:12px; }
</style>
