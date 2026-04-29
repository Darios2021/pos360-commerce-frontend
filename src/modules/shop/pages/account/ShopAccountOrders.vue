<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/pages/account/ShopAccountOrders.vue -->
<template>
  <section class="orders">
    <!-- Head -->
    <header class="orders-head">
      <div class="orders-head-left">
        <div class="orders-title">Mis compras</div>
        <div class="orders-sub">Tus pedidos y su estado.</div>
      </div>

      <div class="orders-actions">
        <v-text-field
          v-model="q"
          class="orders-search"
          density="compact"
          variant="solo-filled"
          rounded="pill"
          hide-details
          clearable
          placeholder="Buscá por producto, código o estado…"
          prepend-inner-icon="mdi-magnify"
        />

        <v-btn class="orders-refresh" variant="tonal" :loading="loading" @click="reload">
          Actualizar
        </v-btn>
      </div>
    </header>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <!-- Empty -->
    <div v-if="!loading && filtered.length === 0" class="orders-empty">
      <div class="orders-empty-ico">
        <v-icon size="30">mdi-receipt-text-outline</v-icon>
      </div>
      <div class="orders-empty-title">Todavía no tenés compras</div>
      <div class="orders-empty-sub">Cuando hagas un pedido, aparece acá.</div>
      <v-btn color="primary" class="mt-3" @click="goShop">IR A LA TIENDA</v-btn>
    </div>

    <!-- List -->
    <div v-else class="orders-list">
      <article v-for="o in filtered" :key="o.id" class="order-card">
        <div class="order-top">
          <div class="order-date">{{ fmtDate(o.created_at) }}</div>

          <div class="order-right">
            <v-chip class="order-chip" size="small" :color="statusColor(o.status)" variant="flat">
              {{ statusLabel(o.status) }}
            </v-chip>

            <div class="order-total">{{ fmtMoney(o.total, o.currency) }}</div>
          </div>
        </div>

        <div class="order-body">
          <div class="order-thumb">
            <img v-if="o.first_product_image_url" :src="o.first_product_image_url" alt="" loading="lazy" />
            <div v-else class="order-thumb-empty">
              <v-icon size="22">mdi-image-outline</v-icon>
            </div>
          </div>

          <div class="order-mid">
            <div class="order-state">
              <span class="order-state-dot" :class="`dot-${statusColor(o.status)}`" aria-hidden="true" />
              <span class="order-state-text">{{ statusShort(o.status) }}</span>
            </div>

            <div class="order-title">
              Pedido <b>#{{ o.id }}</b>
              <span class="order-code" v-if="o.public_code">({{ o.public_code }})</span>
            </div>

            <div class="order-sub">
              <span class="order-items">{{ Number(o.items_count || 0) }} item{{ Number(o.items_count || 0) === 1 ? "" : "s" }}</span>
              <span class="order-sep">•</span>
              <span class="order-pay">Pago: <b>{{ paymentLabel(o.payment_status) }}</b></span>
            </div>

            <div class="order-prod" v-if="o.first_product_name">
              {{ o.first_product_name }}
            </div>

            <!-- Sucursal o dirección de envío -->
            <div class="order-loc">
              <v-icon size="14">{{ isPickup(o) ? 'mdi-storefront-outline' : 'mdi-truck-delivery-outline' }}</v-icon>
              <template v-if="isPickup(o)">
                <span class="order-loc__type">Retiro en sucursal:</span>
                <b>{{ o.branch_name || '—' }}</b>
              </template>
              <template v-else>
                <span class="order-loc__type">Envío a:</span>
                <b>{{ o.ship_address1 || o.ship_city || '—' }}</b>
              </template>
            </div>
          </div>

          <div class="order-cta">
            <v-btn color="primary" variant="flat" class="order-btn" @click="openDetail(o)">
              Ver detalle
            </v-btn>
            <!-- Volver a comprar solo cuando el pedido cerró su ciclo -->
            <v-btn
              v-if="canRebuy(o)"
              variant="text"
              size="small"
              class="order-btn-rebuy"
              prepend-icon="mdi-cart-plus"
              @click="rebuy(o)"
            >
              Volver a comprar
            </v-btn>
          </div>
        </div>
      </article>

      <!-- Pager simple -->
      <div v-if="total > limit" class="orders-pager">
        <v-btn variant="tonal" :disabled="offset <= 0 || loading" @click="prevPage">Anterior</v-btn>

        <div class="orders-pager-info">
          {{ offset + 1 }}–{{ Math.min(offset + limit, total) }} de {{ total }}
        </div>

        <v-btn variant="tonal" :disabled="offset + limit >= total || loading" @click="nextPage">Siguiente</v-btn>
      </div>
    </div>

    <!-- DETAIL DIALOG (estable) -->
    <v-dialog
      v-model="detail.open"
      :fullscreen="smAndDown"
      max-width="860"
      scrollable
      transition="dialog-bottom-transition"
      content-class="orders-detail-dialog"
    >
      <v-card rounded="xl" class="detail-card">
        <div class="detail-head">
          <div class="detail-head-left">
            <div class="detail-title">Pedido #{{ detail.order?.id || "—" }}</div>
            <div class="detail-sub">
              {{ fmtDate(detail.order?.created_at) }}
              <span v-if="detail.order?.public_code">• {{ detail.order.public_code }}</span>
            </div>
          </div>

          <div class="detail-head-right">
            <v-chip size="small" :color="statusColor(detail.order?.status)" variant="flat">
              {{ statusLabel(detail.order?.status) }}
            </v-chip>
            <v-chip size="small" :color="paymentColor(detail.order?.payment_status)" variant="tonal">
              {{ paymentLabel(detail.order?.payment_status) }}
            </v-chip>
          </div>
        </div>

        <v-divider />

        <div class="detail-body">
          <v-alert v-if="detail.error" type="error" variant="tonal" class="mb-3">
            {{ detail.error }}
          </v-alert>

          <div v-if="detail.loading" class="detail-loading">
            <v-progress-circular indeterminate />
            <div class="text-caption" style="opacity: .8">Cargando detalle…</div>
          </div>

          <template v-else>
            <!-- Timeline de progreso del pedido -->
            <div v-if="detail.order" class="timeline" :class="{ 'is-cancelled': isCancelled(detail.order) }">
              <div
                v-for="(s, i) in steps(detail.order)"
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
                  <div class="tl-time" v-if="s.at">{{ fmtDate(s.at) }}</div>
                </div>
                <div v-if="i < steps(detail.order).length - 1" class="tl-line" />
              </div>
            </div>
            <div class="detail-items">
              <div v-for="it in detail.items" :key="it.id" class="detail-item">
                <div class="detail-item-thumb">
                  <img v-if="it.image_url" :src="it.image_url" alt="" loading="lazy" />
                  <div v-else class="detail-item-thumb-empty">
                    <v-icon size="18">mdi-image-outline</v-icon>
                  </div>
                </div>

                <div class="detail-item-mid">
                  <div class="detail-item-name">{{ it.product_name || "Producto" }}</div>
                  <div class="detail-item-sub">
                    Cant: <b>{{ fmtQty(it.qty) }}</b>
                    <span class="dot">•</span>
                    Precio: <b>{{ fmtMoney(it.unit_price, detail.order?.currency) }}</b>
                  </div>
                </div>

                <div class="detail-item-right">
                  <div class="detail-item-total">{{ fmtMoney(it.line_total, detail.order?.currency) }}</div>
                </div>
              </div>
            </div>

            <div class="detail-summary">
              <div class="sum-row">
                <span>Subtotal</span>
                <b>{{ fmtMoney(detail.order?.subtotal, detail.order?.currency) }}</b>
              </div>
              <div class="sum-row" v-if="Number(detail.order?.discount_total || 0) > 0">
                <span>Descuento</span>
                <b>- {{ fmtMoney(detail.order?.discount_total, detail.order?.currency) }}</b>
              </div>
              <div class="sum-row">
                <span>Envío</span>
                <b>{{ fmtMoney(detail.order?.shipping_total, detail.order?.currency) }}</b>
              </div>
              <div class="sum-row sum-total">
                <span>Total</span>
                <b>{{ fmtMoney(detail.order?.total, detail.order?.currency) }}</b>
              </div>

              <div class="detail-meta">
                <div class="meta-pill">
                  <v-icon size="16">{{ isPickup(detail.order) ? 'mdi-storefront-outline' : 'mdi-truck-fast-outline' }}</v-icon>
                  <span>{{ fulfillmentLabel(detail.order?.fulfillment_type) }}</span>
                </div>
                <div v-if="isPickup(detail.order) && detail.order?.branch_name" class="meta-pill meta-pill--accent">
                  <v-icon size="16">mdi-map-marker-outline</v-icon>
                  <span>{{ detail.order.branch_name }}</span>
                </div>
                <div v-else-if="!isPickup(detail.order) && (detail.order?.ship_address1 || detail.order?.ship_city)" class="meta-pill meta-pill--accent">
                  <v-icon size="16">mdi-map-marker-outline</v-icon>
                  <span>
                    {{ [detail.order?.ship_address1, detail.order?.ship_city].filter(Boolean).join(', ') }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </div>

        <v-divider />

        <div class="detail-actions">
          <v-btn variant="tonal" @click="detail.open = false">Cerrar</v-btn>
          <v-btn color="primary" variant="flat" @click="goShop">Seguir comprando</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import httpShop from "@/modules/shop/service/shop.auth.public.api";

const router = useRouter();
const { smAndDown } = useDisplay();

const loading = ref(false);
const error = ref(null);

const items = ref([]);
const total = ref(0);
const limit = ref(20);
const offset = ref(0);

const q = ref("");

const detail = ref({
  open: false,
  loading: false,
  error: null,
  order: null,
  items: [],
});

function toInt(v, d = 0) {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

function fmtQty(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return "1";
  return String(n).includes(".") ? n.toFixed(3).replace(/0+$/, "").replace(/\.$/, "") : String(n);
}

function fmtMoney(v, currency = "ARS") {
  const n = Number(v || 0);
  try {
    if (String(currency || "ARS").toUpperCase() === "ARS") {
      return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
    }
    return n.toLocaleString("es-AR", { style: "currency", currency: String(currency || "ARS"), maximumFractionDigits: 2 });
  } catch {
    return `$ ${Math.round(n).toString()}`;
  }
}

function fmtDate(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  try {
    return d.toLocaleString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dt);
  }
}

function statusLabel(s) {
  const x = String(s || "").toLowerCase();
  if (x === "created") return "Creado";
  if (x === "processing") return "En preparación";
  if (x === "ready") return "Listo para retirar";
  if (x === "delivered") return "Entregado";
  if (x === "cancelled" || x === "canceled") return "Cancelado";
  return s || "—";
}
function statusShort(s) {
  const x = String(s || "").toLowerCase();
  if (x === "created") return "Tu pedido está creado";
  if (x === "processing") return "Estamos preparando tu pedido";
  if (x === "ready") return "Listo para retirar";
  if (x === "delivered") return "Entregado";
  if (x === "cancelled" || x === "canceled") return "Compra cancelada";
  return statusLabel(s);
}
function statusColor(s) {
  const x = String(s || "").toLowerCase();
  if (x === "delivered") return "success";
  if (x === "ready") return "success";
  if (x === "cancelled" || x === "canceled") return "error";
  if (x === "processing") return "info";
  if (x === "created") return "info";
  return "info";
}

function paymentLabel(s) {
  const x = String(s || "").toLowerCase();
  if (x === "paid") return "Pagado";
  if (x === "pending") return "Pendiente";
  if (x === "unpaid") return "Impago";
  if (x === "rejected" || x === "failed") return "Rechazado";
  return s || "—";
}
function paymentColor(s) {
  const x = String(s || "").toLowerCase();
  if (x === "paid") return "success";
  if (x === "pending") return "warning";
  if (x === "unpaid") return "warning";
  if (x === "rejected" || x === "failed") return "error";
  return "info";
}

function fulfillmentLabel(v) {
  const x = String(v || "").toLowerCase();
  if (x === "pickup") return "Retiro en sucursal";
  if (x === "delivery" || x === "ship") return "Envío a domicilio";
  return v || "—";
}

function isPickup(o) {
  return String(o?.fulfillment_type || "").toLowerCase() === "pickup";
}

function isCancelled(o) {
  const x = String(o?.status || "").toLowerCase();
  return x === "cancelled" || x === "canceled";
}

/**
 * "Volver a comprar" solo se muestra cuando el ciclo del pedido terminó:
 * entregado o cancelado. En pedidos en curso no aporta y agrega ruido.
 */
function canRebuy(o) {
  const x = String(o?.status || "").toLowerCase();
  return x === "delivered" || x === "cancelled" || x === "canceled";
}

function rebuy(o) {
  // Si vamos a la ficha del primer producto del pedido y si no, al shop.
  const pid = Number(o?.first_product_id || 0);
  if (pid) {
    router.push(`/shop/product/${pid}`).catch(() => {});
  } else {
    goShop();
  }
}

/**
 * Pasos del timeline del pedido. Cada step se marca como:
 *   done    → ya pasó (tiene timestamp)
 *   current → es el estado actual del pedido
 *   pending → aún no llegó
 *
 * Si el pedido fue cancelado, solo mostramos un step rojo "Cancelado".
 */
function steps(o) {
  if (!o) return [];

  const status = String(o.status || "").toLowerCase();

  if (isCancelled(o)) {
    return [
      {
        key: "created",
        label: "Pedido creado",
        icon: "mdi-cart-check",
        at: o.created_at,
        done: true,
        current: false,
      },
      {
        key: "cancelled",
        label: "Cancelado",
        icon: "mdi-close-circle",
        at: o.cancelled_at,
        done: true,
        current: true,
      },
    ];
  }

  // Etiqueta del último paso depende del tipo de fulfillment
  const lastLabel = isPickup(o) ? "Retirado" : "Entregado";
  const lastIcon  = isPickup(o) ? "mdi-package-variant-closed-check" : "mdi-truck-check-outline";
  const readyLabel = isPickup(o) ? "Listo para retirar" : "Listo para enviar";

  const order = ["created", "processing", "ready", "delivered"];
  const idx = Math.max(0, order.indexOf(status));

  return [
    {
      key: "created",
      label: "Pedido creado",
      icon: "mdi-cart-check",
      at: o.created_at,
      done: idx >= 0,
      current: idx === 0,
    },
    {
      key: "processing",
      label: "En preparación",
      icon: "mdi-package-variant",
      at: o.processing_at,
      done: idx >= 1,
      current: idx === 1,
    },
    {
      key: "ready",
      label: readyLabel,
      icon: "mdi-clipboard-check-outline",
      at: o.ready_at,
      done: idx >= 2,
      current: idx === 2,
    },
    {
      key: "delivered",
      label: lastLabel,
      icon: lastIcon,
      at: o.picked_up_at,
      done: idx >= 3,
      current: idx === 3,
    },
  ];
}

async function fetchOrders() {
  loading.value = true;
  error.value = null;

  try {
    const params = { limit: limit.value, offset: offset.value };
    const r = await httpShop.get("public/account/orders", { params });

    items.value = Array.isArray(r?.data?.items) ? r.data.items : [];
    total.value = toInt(r?.data?.total, items.value.length);
    limit.value = toInt(r?.data?.limit, limit.value);
    offset.value = toInt(r?.data?.offset, offset.value);
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || String(e);
    items.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

async function fetchOrderDetail(orderId) {
  detail.value.loading = true;
  detail.value.error = null;
  detail.value.order = null;
  detail.value.items = [];

  try {
    const r = await httpShop.get(`public/account/orders/${orderId}`);
    detail.value.order = r?.data?.order || null;
    detail.value.items = Array.isArray(r?.data?.items) ? r.data.items : [];
  } catch (e) {
    detail.value.error = e?.response?.data?.message || e?.message || String(e);
  } finally {
    detail.value.loading = false;
  }
}

function openDetail(order) {
  const id = order?.id;
  if (!id) return;
  detail.value.open = true;
  fetchOrderDetail(id);
}

function reload() {
  fetchOrders();
}

function prevPage() {
  offset.value = Math.max(0, offset.value - limit.value);
  fetchOrders();
}
function nextPage() {
  offset.value = Math.min(total.value, offset.value + limit.value);
  fetchOrders();
}

function goShop() {
  router.push("/shop").catch(() => {});
}

const filtered = computed(() => {
  const list = items.value || [];
  const s = String(q.value || "").trim().toLowerCase();
  if (!s) return list;

  return list.filter((o) => {
    const hay = `${o.id} ${o.public_code || ""} ${o.status || ""} ${o.payment_status || ""} ${o.first_product_name || ""}`.toLowerCase();
    return hay.includes(s);
  });
});

onMounted(() => {
  fetchOrders();
});
</script>

<style scoped>
.orders {
  padding: 2px 0 18px;
}

/* ================= HEAD (paleta shop explícita) ================= */
.orders {
  color: #111827;
}
.orders-head {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 14px;
  margin-bottom: 16px;
}

.orders-head-left {
  min-width: 0;
}

.orders-title {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #111827;
  margin: 0;
}

.orders-sub {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
  margin: 2px 0 0;
}

.orders-actions {
  display: grid;
  grid-template-columns: minmax(220px, 420px) auto; /* ✅ NO se estira infinito */
  align-items: center;
  gap: 10px;
  justify-content: end;
}

/* ✅ buscador “ML compacto” */
.orders-search :deep(.v-field) {
  border-radius: 999px;
}
.orders-search :deep(.v-field__input) {
  min-height: 38px;
  font-size: 13px;
}
.orders-search :deep(input) {
  font-weight: 400;
}

/* ✅ botón compacto */
.orders-refresh {
  height: 38px;
  min-height: 38px;
  border-radius: 10px;
  font-weight: 500;
  letter-spacing: 0.3px;
}

/* ================= EMPTY ================= */
.orders-empty {
  background: #ffffff;
  color: #111827;
  border-radius: 16px;
  padding: 44px 24px;
  display: grid;
  justify-items: center;
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.orders-empty-ico {
  width: 60px;
  height: 60px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(20, 136, 209, 0.10);
  color: rgb(var(--v-theme-primary));
  margin-bottom: 6px;
}

.orders-empty-title {
  font-weight: 600;
  font-size: 16px;
  margin-top: 8px;
  letter-spacing: -0.01em;
  color: #111827;
}

.orders-empty-sub {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
  margin-top: 4px;
  max-width: 340px;
  line-height: 1.45;
}

/* ================= LIST ================= */
.orders-list {
  display: grid;
  gap: 12px;
}

.order-card {
  background: #ffffff;
  color: #111827;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.order-card:hover {
  border-color: rgba(0, 0, 0, 0.16);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.08);
}

.order-top {
  padding: 10px 16px;
  background: #fafafa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.order-date {
  font-size: 12px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
}

.order-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.order-total {
  font-weight: 700;
  font-size: 15px;
  color: #111827;
  letter-spacing: -0.01em;
}

.order-chip {
  font-weight: 600;
  letter-spacing: 0.02em;
}

.order-body {
  padding: 14px 16px;
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 14px;
  align-items: center;
}

.order-thumb {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #f5f5f5;
  display: grid;
  place-items: center;
}

.order-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.order-thumb-empty {
  opacity: 0.55;
}

.order-mid {
  min-width: 0;
}

.order-state {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 6px;
}

.order-state-dot {
  width: 8px;
  height: 8px;
  border-radius: 99px;
  background: #4b90ff;
}
.dot-success { background: #22c55e; }
.dot-warning { background: #f59e0b; }
.dot-error   { background: #ef4444; }
.dot-info    { background: #4b90ff; }

.order-title {
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.2;
  color: #111827;
}

.order-code {
  font-weight: 400;
  color: rgba(0, 0, 0, 0.5);
  font-size: 12.5px;
  margin-left: 6px;
}

.order-sub {
  margin-top: 6px;
  font-size: 12.5px;
  color: rgba(0, 0, 0, 0.65);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.order-sep {
  opacity: 0.35;
}

.order-prod {
  margin-top: 4px;
  font-size: 12.5px;
  color: rgba(0, 0, 0, 0.55);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.order-loc {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 6px;
  background: rgba(20, 136, 209, 0.08);
  color: rgb(var(--v-theme-primary));
  font-size: 12px;
  line-height: 1.2;
  font-weight: 500;
  max-width: 100%;
}
.order-loc__type { color: rgba(0, 0, 0, 0.6); font-weight: 400; }
.order-loc b { color: #111827; font-weight: 600; }

.order-cta {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  min-width: 152px;
}

.order-btn {
  height: 38px;
  min-height: 38px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.2px;
  text-transform: none;
}

.order-btn-rebuy {
  text-transform: none;
  letter-spacing: 0;
  font-size: 12px;
  font-weight: 500;
  color: rgb(var(--v-theme-primary));
  height: 32px;
  min-height: 32px;
  padding: 0 8px;
}

.orders-pager {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.orders-pager-info {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.75;
}

/* DETAIL (igual que venías, estable) */
.detail-card {
  display: flex;
  flex-direction: column;
  max-height: min(86vh, 760px);
}
.detail-head {
  padding: 14px 14px 12px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.detail-title {
  font-weight: 600;
  font-size: 18px;
  letter-spacing: -0.01em;
  color: #111827;
}
.detail-sub {
  margin-top: 4px;
  font-size: 12.5px;
  color: rgba(0, 0, 0, 0.55);
}
.detail-head-right {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.detail-body {
  padding: 14px;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}
.detail-loading {
  display: grid;
  place-items: center;
  gap: 10px;
  padding: 26px 0;
}
.detail-items {
  display: grid;
  gap: 10px;
}
.detail-item {
  display: grid;
  grid-template-columns: 54px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #ffffff;
}
.detail-item-thumb {
  width: 54px;
  height: 54px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.08);
  display: grid;
  place-items: center;
}
.detail-item-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.detail-item-thumb-empty {
  opacity: 0.55;
}
.detail-item-name {
  font-weight: 500;
  font-size: 13px;
  line-height: 1.2;
}
.detail-item-sub {
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.78;
}
.detail-item-sub .dot {
  opacity: 0.35;
  margin: 0 6px;
}
.detail-item-total {
  font-weight: 500;
  font-size: 13px;
}
/* ── Timeline de estado ───────────────────────────────────────── */
.timeline {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  padding: 16px 12px 12px;
  margin-bottom: 14px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
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
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  color: rgba(0, 0, 0, 0.35);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
  z-index: 2;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}
.tl-step.is-done .tl-dot {
  background: rgb(var(--v-theme-primary));
  color: #ffffff;
  box-shadow: 0 0 0 1px rgb(var(--v-theme-primary));
}
.tl-step.is-current .tl-dot {
  transform: scale(1.18);
  box-shadow: 0 0 0 4px rgba(20, 136, 209, 0.18);
}
.tl-step.is-cancel .tl-dot {
  background: #dc2626;
  color: #ffffff;
  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.18);
}

.tl-line {
  position: absolute;
  top: 16px;
  left: calc(50% + 18px);
  right: calc(-50% + 18px);
  height: 2px;
  background: rgba(0, 0, 0, 0.10);
  z-index: 1;
}
.tl-step.is-done + .tl-step .tl-line,
.tl-step.is-done .tl-line {
  background: rgb(var(--v-theme-primary));
}

.tl-text { margin-top: 8px; }
.tl-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.5);
  line-height: 1.2;
}
.tl-step.is-done .tl-label,
.tl-step.is-current .tl-label {
  color: #111827;
}
.tl-step.is-cancel .tl-label { color: #b91c1c; }

.tl-time {
  margin-top: 2px;
  font-size: 10.5px;
  color: rgba(0, 0, 0, 0.45);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 600px) {
  .timeline { padding: 14px 8px 10px; }
  .tl-label { font-size: 10.5px; }
  .tl-time { font-size: 9.5px; }
  .tl-dot { width: 28px; height: 28px; }
  .tl-line { top: 14px; }
}

.detail-summary {
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #ffffff;
}
.sum-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 0;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.78);
}
.sum-row > span:first-child { color: rgba(0, 0, 0, 0.6); }
.sum-row > span:last-child { font-weight: 500; color: #111827; }
.sum-total {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  margin-top: 8px;
  padding-top: 10px;
  font-size: 15px;
  font-weight: 600;
}
.sum-total > span:first-child { color: #111827; font-weight: 600; }
.sum-total > span:last-child { font-weight: 700; font-size: 17px; }
.detail-meta {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.10);
  background: #fafafa;
  font-weight: 500;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.7);
}
.meta-pill--accent {
  background: rgba(20, 136, 209, 0.08);
  border-color: rgba(20, 136, 209, 0.22);
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
.meta-pill--accent .v-icon { color: rgb(var(--v-theme-primary)); }
.detail-actions {
  padding: 12px 14px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* ================= MOBILE (FIX buscador gigante) ================= */
@media (max-width: 760px) {
  .orders-head {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .orders-actions {
    grid-template-columns: 1fr auto; /* ✅ buscador 1fr + botón compacto */
    width: 100%;
  }

  .orders-search :deep(.v-field__input) {
    min-height: 36px;
    font-size: 13px;
  }

  .orders-refresh {
    height: 36px;
    min-height: 36px;
    padding: 0 12px;
  }

  .order-body {
    grid-template-columns: 64px 1fr;
    grid-template-rows: auto auto;
    gap: 12px;
  }

  .order-thumb {
    width: 64px;
    height: 64px;
  }

  .order-cta {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 8px;
  }

  .order-btn,
  .order-btn2 {
    height: 34px !important;
    min-height: 34px !important;
    font-size: 11px !important;
    min-width: 0 !important;
    width: 100%;
  }

  .detail-card {
    max-height: 100vh;
    border-radius: 0 !important;
  }
}

/* ultra mobile: botón full ancho si querés más “limpio” */
@media (max-width: 420px) {
  .orders-actions {
    grid-template-columns: 1fr; /* ✅ buscador arriba */
    gap: 8px;
  }
  .orders-refresh {
    width: 100%;
  }
}
</style>