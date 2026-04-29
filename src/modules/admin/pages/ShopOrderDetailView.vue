<!--
  ShopOrderDetailView (Admin)
  ---------------------------
  Página completa de detalle de un pedido del shop. Reemplaza al modal anterior.
  Incluye:
    - Header con código, sucursal, fecha y acciones (cambio de estado).
    - Timeline visual del pedido (Creado → En preparación → Listo → Entregado).
    - Card de cliente + entrega + pago.
    - Lista de items.
    - Card de pagos con acciones (MP link, comprobante, revisar transferencia).
-->
<template>
  <v-container class="mx-auto sod" fluid>
    <!-- Top bar con back + acciones -->
    <div class="sod-top">
      <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="goBack">
        Volver a pedidos
      </v-btn>

      <v-spacer />

      <v-btn
        variant="tonal"
        size="small"
        prepend-icon="mdi-refresh"
        :loading="loading"
        @click="reload"
      >
        Actualizar
      </v-btn>
    </div>

    <!-- Loading / error -->
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-3" />
    <v-alert v-if="error" type="error" variant="tonal" class="mb-3" closable @click:close="error=''">
      {{ error }}
    </v-alert>

    <template v-if="order">
      <!-- ── Header ─────────────────────────────────────────── -->
      <v-card rounded="lg" variant="flat" class="sod-head mb-4">
        <div class="sod-head__main">
          <div class="sod-head__id">
            <h1 class="sod-head__title">Pedido #{{ order.id }}</h1>
            <v-chip
              v-if="order.public_code"
              size="small"
              color="primary"
              variant="tonal"
              class="ml-2"
            >
              {{ order.public_code }}
            </v-chip>
          </div>

          <div class="sod-head__meta">
            <span><v-icon size="14">mdi-calendar-blank-outline</v-icon> {{ fmtDate(order.created_at, true) }}</span>
            <span class="sod-sep">·</span>
            <span><v-icon size="14">mdi-storefront-outline</v-icon> {{ order.branch_name || `Sucursal ${order.branch_id}` }}</span>
            <span class="sod-sep">·</span>
            <v-chip size="x-small" :color="statusColor(order.status)" variant="flat">
              {{ orderStatusLabel(order.status) }}
            </v-chip>
            <v-chip size="x-small" :color="orderPayColor(order.payment_status)" variant="tonal">
              {{ orderPayLabel(order.payment_status) }}
            </v-chip>
          </div>
        </div>

        <!-- Acciones de cambio de estado -->
        <div v-if="actions.length" class="sod-head__actions">
          <v-btn
            v-for="a in actions"
            :key="a.value"
            :color="a.color"
            variant="flat"
            size="small"
            :prepend-icon="a.icon"
            :loading="statusBusy === a.value"
            :disabled="!!statusBusy"
            @click="onChangeStatus(a)"
          >
            {{ a.label }}
          </v-btn>
        </div>
        <div v-else class="sod-head__final">
          <v-icon size="16" :color="statusColor(order.status)">mdi-flag-checkered</v-icon>
          Pedido en estado final
        </div>
      </v-card>

      <!-- ── Timeline ──────────────────────────────────────── -->
      <v-card rounded="lg" variant="flat" class="sod-card mb-4">
        <div class="sod-section-title">
          <v-icon size="18">mdi-timeline-text-outline</v-icon> Progreso del pedido
        </div>

        <div class="timeline" :class="{ 'is-cancelled': isCancelled(order) }">
          <div
            v-for="(s, i) in steps(order)"
            :key="s.key"
            class="tl-step"
            :class="{
              'is-done': s.done,
              'is-current': s.current,
              'is-cancel': s.key === 'cancelled',
            }"
          >
            <div class="tl-dot">
              <v-icon size="14">{{ s.icon }}</v-icon>
            </div>
            <div class="tl-text">
              <div class="tl-label">{{ s.label }}</div>
              <div class="tl-time" v-if="s.at">{{ fmtDate(s.at, true) }}</div>
            </div>
            <div v-if="i < steps(order).length - 1" class="tl-line" />
          </div>
        </div>
      </v-card>

      <!-- ── Grid: Cliente + Entrega + Totales ─────────────── -->
      <div class="sod-grid">
        <v-card rounded="lg" variant="flat" class="sod-card">
          <div class="sod-section-title">
            <v-icon size="18">mdi-account-circle-outline</v-icon> Cliente
          </div>
          <div class="sod-kv">
            <div><b>{{ fullName(order) || order.customer_name || order.ship_name || "—" }}</b></div>
            <div class="muted">{{ order.customer_email || order.email || "—" }}</div>
            <div class="muted" v-if="order.phone || order.ship_phone">
              <v-icon size="12">mdi-phone-outline</v-icon> {{ order.phone || order.ship_phone }}
            </div>
            <div class="muted" v-if="order.doc_number">
              <v-icon size="12">mdi-card-account-details-outline</v-icon> {{ order.doc_number }}
            </div>
          </div>
        </v-card>

        <v-card rounded="lg" variant="flat" class="sod-card">
          <div class="sod-section-title">
            <v-icon size="18">{{ isPickup(order) ? 'mdi-storefront-outline' : 'mdi-truck-delivery-outline' }}</v-icon>
            Entrega
          </div>
          <template v-if="isPickup(order)">
            <div><b>Retiro en sucursal</b></div>
            <div class="muted">{{ order.branch_name || `Sucursal ${order.branch_id}` }}</div>
            <div class="muted" v-if="order.branch_address">
              <v-icon size="12">mdi-map-marker-outline</v-icon> {{ order.branch_address }}
            </div>
            <div class="muted" v-if="order.branch_phone">
              <v-icon size="12">mdi-phone-outline</v-icon> {{ order.branch_phone }}
            </div>
          </template>
          <template v-else>
            <div><b>Envío a domicilio</b></div>
            <div class="muted" v-if="order.ship_name">{{ order.ship_name }}</div>
            <div class="muted" v-if="order.ship_address1">{{ order.ship_address1 }}</div>
            <div class="muted" v-if="order.ship_address2">{{ order.ship_address2 }}</div>
            <div class="muted">
              <span v-if="order.ship_city">{{ order.ship_city }}</span>
              <span v-if="order.ship_province"> · {{ order.ship_province }}</span>
              <span v-if="order.ship_zip"> · CP {{ order.ship_zip }}</span>
            </div>
            <div class="muted" v-if="order.ship_phone">
              <v-icon size="12">mdi-phone-outline</v-icon> {{ order.ship_phone }}
            </div>
          </template>
          <div class="muted mt-2" v-if="order.notes">
            <v-icon size="12">mdi-note-text-outline</v-icon> {{ order.notes }}
          </div>
        </v-card>

        <v-card rounded="lg" variant="flat" class="sod-card">
          <div class="sod-section-title">
            <v-icon size="18">mdi-cash-multiple</v-icon> Totales
          </div>
          <div class="sod-kv">
            <div class="sod-row"><span>Subtotal</span><b>$ {{ fmtMoney(order.subtotal) }}</b></div>
            <div class="sod-row" v-if="Number(order.discount_total||0) > 0">
              <span>Descuento</span><b class="text-success">- $ {{ fmtMoney(order.discount_total) }}</b>
            </div>
            <div class="sod-row"><span>Envío</span><b>$ {{ fmtMoney(order.shipping_total) }}</b></div>
            <div class="sod-row sod-row--total">
              <span>Total</span><b>$ {{ fmtMoney(order.total) }}</b>
            </div>
            <div class="muted mt-2" v-if="order.paid_at">
              <v-icon size="12" color="success">mdi-check-circle-outline</v-icon>
              Pagado el {{ fmtDate(order.paid_at, true) }}
            </div>
          </div>
        </v-card>
      </div>

      <!-- ── Items ─────────────────────────────────────────── -->
      <v-card rounded="lg" variant="flat" class="sod-card mt-4">
        <div class="sod-section-title">
          <v-icon size="18">mdi-package-variant-closed</v-icon>
          Items <span class="muted ml-1">({{ items.length }})</span>
        </div>

        <v-table density="comfortable" class="sod-items">
          <thead>
            <tr>
              <th>Producto</th>
              <th class="text-right">Cant.</th>
              <th class="text-right">P. unit.</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in items" :key="it.id">
              <td>
                <div class="sod-item">
                  <div class="sod-item__thumb">
                    <img v-if="it.image_url" :src="it.image_url" :alt="it.product_name" />
                    <v-icon v-else size="20" color="medium-emphasis">mdi-image-outline</v-icon>
                  </div>
                  <div class="sod-item__info">
                    <div class="sod-item__name">{{ it.product_name || `Producto #${it.product_id}` }}</div>
                    <div class="muted ot-tiny">SKU/ID: {{ it.product_id }}</div>
                  </div>
                </div>
              </td>
              <td class="text-right">{{ fmtQty(it.qty) }}</td>
              <td class="text-right">$ {{ fmtMoney(it.unit_price) }}</td>
              <td class="text-right"><b>$ {{ fmtMoney(it.line_total) }}</b></td>
            </tr>
          </tbody>
        </v-table>
      </v-card>

      <!-- ── Pagos ─────────────────────────────────────────── -->
      <v-card v-if="payments.length" rounded="lg" variant="flat" class="sod-card mt-4">
        <div class="sod-section-title">
          <v-icon size="18">mdi-credit-card-outline</v-icon>
          Pagos <span class="muted ml-1">({{ payments.length }})</span>
        </div>

        <div class="sod-payments">
          <div v-for="p in payments" :key="p.id" class="sod-payment">
            <div class="sod-payment__head">
              <div class="sod-payment__title">
                <v-icon v-if="paymentMethodIcon(p)" size="18">{{ paymentMethodIcon(p) }}</v-icon>
                <b>{{ paymentMethodTitle(p) }}</b>
                <v-chip
                  v-if="paymentMethodBadgeText(p)"
                  size="x-small"
                  :color="badgeColor(paymentMethodBadgeVariant(p))"
                  variant="tonal"
                >
                  {{ paymentMethodBadgeText(p) }}
                </v-chip>
              </div>
              <v-chip size="small" :color="paymentStatusColor(p.status)" variant="flat">
                {{ paymentStatusLabel(p.status) }}
              </v-chip>
            </div>

            <div class="sod-payment__body">
              <div class="muted">
                ID interno: {{ p.id }}
                <span v-if="p.external_id"> · Ext: {{ p.external_id }}</span>
              </div>
              <div class="muted">Monto: <b>$ {{ fmtMoney(p.amount) }}</b></div>
              <div class="muted" v-if="p.created_at">Creado: {{ fmtDate(p.created_at, true) }}</div>
            </div>

            <div class="sod-payment__actions">
              <v-btn
                v-if="canCreateMpLink(p)"
                size="small"
                variant="tonal"
                color="primary"
                prepend-icon="mdi-link-variant"
                :loading="payAction.loading && payAction.paymentId === p.id && payAction.type === 'mp'"
                @click="onCreateMp(p)"
              >
                Crear link MP
              </v-btn>

              <v-btn
                v-if="mpInitPointFromPayment(p)"
                size="small"
                variant="text"
                color="primary"
                :href="mpInitPointFromPayment(p)"
                target="_blank"
                prepend-icon="mdi-open-in-new"
              >
                Abrir checkout
              </v-btn>

              <v-btn
                v-if="proofUrlFromPayment(p)"
                size="small"
                variant="text"
                :href="proofUrlFromPayment(p)"
                target="_blank"
                prepend-icon="mdi-file-image-outline"
              >
                Ver comprobante
              </v-btn>

              <v-btn
                v-if="canUploadProof(p)"
                size="small"
                variant="tonal"
                prepend-icon="mdi-upload"
                @click="openUpload(p)"
              >
                Subir comprobante
              </v-btn>

              <v-btn
                v-if="canReviewTransfer(p) && proofUrlFromPayment(p)"
                size="small"
                variant="flat"
                color="success"
                prepend-icon="mdi-check-circle-outline"
                :loading="payAction.loading && payAction.paymentId === p.id && payAction.type === 'approve'"
                @click="onReview(p, 'approve')"
              >
                Aprobar
              </v-btn>

              <v-btn
                v-if="canReviewTransfer(p) && proofUrlFromPayment(p)"
                size="small"
                variant="tonal"
                color="error"
                prepend-icon="mdi-close-circle-outline"
                :loading="payAction.loading && payAction.paymentId === p.id && payAction.type === 'reject'"
                @click="onReview(p, 'reject')"
              >
                Rechazar
              </v-btn>
            </div>
          </div>
        </div>
      </v-card>
    </template>

    <!-- Subir comprobante -->
    <ShopPaymentProofUploadDialog
      v-model="uploadDlg.open"
      :loading="uploadDlg.loading"
      :error="uploadDlg.error"
      :payment="uploadDlg.payment"
      :order-id="orderId"
      v-model:bank_reference="uploadDlg.bank_reference"
      v-model:file="uploadDlg.file"
      @submit="doUploadProof"
      @close="uploadDlg.open=false"
    />

    <!-- Snackbar -->
    <v-snackbar v-model="snack.show" :timeout="2800" :color="snack.color">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";

import ShopPaymentProofUploadDialog from "@/modules/admin/components/shop-orders/ShopPaymentProofUploadDialog.vue";

import { useShopOrdersApi } from "@/modules/admin/composables/useShopOrdersApi";
import { adminUpdateShopOrderStatus } from "@/modules/shop/service/admin.shopOrders.api";

import {
  fmtMoney, fmtQty, fmtDate, fullName,
  fulfillmentLabel,
  statusColor, orderStatusLabel,
  orderPayColor, orderPayLabel,
  paymentStatusLabel, paymentStatusColor,
  paymentMethodTitle, paymentMethodBadgeText, paymentMethodBadgeVariant,
  paymentMethodIcon, badgeColor,
  canCreateMpLink, canUploadProof, canReviewTransfer,
  mpInitPointFromPayment, proofUrlFromPayment,
  nextStatusActions,
} from "@/modules/admin/utils/shopOrdersUi";

const router = useRouter();
const route = useRoute();
const orderId = computed(() => Number(route.params.id || 0));

// State (compatible con el composable existente)
const loading = ref(false);
const error = ref("");
const snack = ref({ show: false, text: "", color: "" });

const detail = ref({ open: true, loading: false, error: "", data: null });
const order = computed(() => detail.value?.data?.order || null);
const items = computed(() => detail.value?.data?.items || []);
const payments = computed(() => detail.value?.data?.payments || []);

// stubs para el composable (no usados en esta vista)
const rows = ref([]);
const meta = ref({ page: 1, limit: 20, total: 0, pages: 1 });
const branches = ref([]);

const api = useShopOrdersApi({ loading, error, snack, rows, meta, branches, detail });

// Acciones de pago
const payAction = ref({ loading: false, paymentId: null, type: "" });

// Upload comprobante
const uploadDlg = ref({
  open: false,
  loading: false,
  error: "",
  payment: null,
  bank_reference: "",
  file: null,
});

// Cambio de estado
const statusBusy = ref(""); // contiene el `value` del status que se está aplicando
const actions = computed(() => order.value ? nextStatusActions(order.value.status) : []);

// ── Helpers ─────────────────────────────────────────────────────
function isPickup(o) {
  return String(o?.fulfillment_type || "").toLowerCase() === "pickup";
}
function isCancelled(o) {
  const x = String(o?.status || "").toLowerCase();
  return x === "cancelled" || x === "canceled";
}

/**
 * Steps del timeline. Si está cancelado, solo muestra Creado → Cancelado.
 */
function steps(o) {
  if (!o) return [];
  if (isCancelled(o)) {
    return [
      { key: "created", label: "Pedido creado", icon: "mdi-cart-check", at: o.created_at, done: true },
      { key: "cancelled", label: "Cancelado", icon: "mdi-close-circle", at: o.cancelled_at, done: true, current: true },
    ];
  }

  const status = String(o.status || "").toLowerCase();
  const order = ["created", "processing", "ready", "delivered"];
  const idx = Math.max(0, order.indexOf(status));

  const lastLabel = isPickup(o) ? "Retirado" : "Entregado";
  const lastIcon  = isPickup(o) ? "mdi-package-variant-closed-check" : "mdi-truck-check-outline";
  const readyLabel = isPickup(o) ? "Listo para retirar" : "Listo para enviar";

  return [
    { key: "created",    label: "Pedido creado",  icon: "mdi-cart-check",                  at: o.created_at,    done: idx >= 0, current: idx === 0 },
    { key: "processing", label: "En preparación", icon: "mdi-package-variant",             at: o.processing_at, done: idx >= 1, current: idx === 1 },
    { key: "ready",      label: readyLabel,       icon: "mdi-clipboard-check-outline",     at: o.ready_at,      done: idx >= 2, current: idx === 2 },
    { key: "delivered",  label: lastLabel,        icon: lastIcon,                          at: o.picked_up_at,  done: idx >= 3, current: idx === 3 },
  ];
}

// ── Acciones ────────────────────────────────────────────────────
function goBack() {
  router.push("/app/admin/shop/orders").catch(() => {});
}

async function reload() {
  if (!orderId.value) return;
  await api.openDetail(orderId.value);
  if (detail.value?.error) error.value = detail.value.error;
}

async function onChangeStatus(action) {
  if (!order.value || !action?.value) return;
  const ok = window.confirm(`¿Marcar el pedido #${order.value.id} como "${action.label}"?`);
  if (!ok) return;

  statusBusy.value = action.value;
  try {
    await adminUpdateShopOrderStatus(order.value.id, action.value);
    snack.value = { show: true, text: `Estado actualizado: ${action.label}`, color: "success" };
    await reload();
  } catch (e) {
    snack.value = { show: true, text: e?.message || "No se pudo cambiar el estado.", color: "error" };
  } finally {
    statusBusy.value = "";
  }
}

async function onCreateMp(p) {
  payAction.value = { loading: true, paymentId: p.id, type: "mp" };
  try {
    await api.createMpLink(p.id);
  } finally {
    payAction.value = { loading: false, paymentId: null, type: "" };
  }
}

function openUpload(payment) {
  uploadDlg.value = {
    open: true, loading: false, error: "",
    payment, bank_reference: "", file: null,
  };
}

async function doUploadProof() {
  uploadDlg.value.loading = true;
  uploadDlg.value.error = "";
  try {
    await api.uploadTransferProof(
      uploadDlg.value.payment?.id,
      uploadDlg.value.file,
      uploadDlg.value.bank_reference
    );
    uploadDlg.value.open = false;
  } catch (e) {
    uploadDlg.value.error = e?.message || "No se pudo subir.";
  } finally {
    uploadDlg.value.loading = false;
  }
}

async function onReview(payment, action) {
  payAction.value = { loading: true, paymentId: payment.id, type: action };
  try {
    const note = window.prompt(
      action === "approve" ? "Nota (opcional) para aprobar:" : "Motivo/nota (recomendado):",
      ""
    ) || "";
    await api.reviewTransfer(payment.id, action, note);
  } finally {
    payAction.value = { loading: false, paymentId: null, type: "" };
  }
}

onMounted(() => {
  if (orderId.value) reload();
});
</script>

<style scoped>
.sod {
  max-width: 1200px;
  padding: 16px 16px 48px;
}

.sod-top {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

/* ── Header ───────────────────────────────────────────────── */
.sod-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  flex-wrap: wrap;
}
.sod-head__main { min-width: 0; flex: 1 1 auto; }
.sod-head__id { display: flex; align-items: center; }
.sod-head__title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
}
.sod-head__meta {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: rgba(var(--v-theme-on-surface), 0.65);
  flex-wrap: wrap;
}
.sod-head__meta span { display: inline-flex; align-items: center; gap: 4px; }
.sod-sep { opacity: 0.4; }

.sod-head__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.sod-head__final {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-weight: 500;
}

/* ── Cards genéricas ──────────────────────────────────────── */
.sod-card {
  padding: 18px 20px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.sod-section-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-bottom: 12px;
  text-transform: uppercase;
}

.sod-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
@media (max-width: 900px) {
  .sod-grid { grid-template-columns: 1fr; }
}

.sod-kv { display: flex; flex-direction: column; gap: 4px; font-size: 13.5px; }
.sod-kv .muted { font-size: 12.5px; }

.sod-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  padding: 4px 0;
}
.sod-row b { font-weight: 600; }
.sod-row--total {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  margin-top: 6px;
  padding-top: 10px;
  font-size: 16px;
  font-weight: 700;
}
.sod-row--total b { font-size: 17px; }

.muted { color: rgba(var(--v-theme-on-surface), 0.6); }
.ot-tiny { font-size: 11.5px; }

/* ── Timeline ─────────────────────────────────────────────── */
.timeline {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
}
.timeline.is-cancelled { grid-template-columns: repeat(2, 1fr); }
.tl-step {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 6px;
}
.tl-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.4);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgb(var(--v-theme-surface));
  box-shadow: 0 0 0 1px rgba(var(--v-theme-on-surface), 0.08);
  z-index: 2;
}
.tl-step.is-done .tl-dot {
  background: rgb(var(--v-theme-primary));
  color: #fff;
  box-shadow: 0 0 0 1px rgb(var(--v-theme-primary));
}
.tl-step.is-current .tl-dot {
  transform: scale(1.18);
  box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.18);
}
.tl-step.is-cancel .tl-dot {
  background: rgb(var(--v-theme-error));
  color: #fff;
  box-shadow: 0 0 0 4px rgba(var(--v-theme-error), 0.18);
}
.tl-line {
  position: absolute;
  top: 18px;
  left: calc(50% + 20px);
  right: calc(-50% + 20px);
  height: 2px;
  background: rgba(var(--v-theme-on-surface), 0.10);
  z-index: 1;
}
.tl-step.is-done .tl-line { background: rgb(var(--v-theme-primary)); }
.tl-text { margin-top: 8px; }
.tl-label {
  font-size: 12.5px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.5);
}
.tl-step.is-done .tl-label,
.tl-step.is-current .tl-label { color: rgb(var(--v-theme-on-surface)); }
.tl-step.is-cancel .tl-label { color: rgb(var(--v-theme-error)); }
.tl-time {
  margin-top: 2px;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-variant-numeric: tabular-nums;
}

/* ── Items table ─────────────────────────────────────────── */
.sod-items :deep(th) {
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(var(--v-theme-on-surface), 0.65);
}
.sod-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sod-item__thumb {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  display: grid;
  place-items: center;
  overflow: hidden;
}
.sod-item__thumb img { width: 100%; height: 100%; object-fit: cover; }
.sod-item__name {
  font-weight: 500;
  font-size: 13px;
  line-height: 1.2;
}

/* ── Pagos ───────────────────────────────────────────────── */
.sod-payments { display: flex; flex-direction: column; gap: 12px; }
.sod-payment {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  border-radius: 10px;
  padding: 14px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}
.sod-payment__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}
.sod-payment__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}
.sod-payment__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12.5px;
  margin-bottom: 10px;
}
.sod-payment__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
