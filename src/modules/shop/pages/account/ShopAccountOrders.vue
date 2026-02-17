<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/pages/account/ShopAccountOrders.vue -->
<template>
  <section class="acc">
    <!-- Head -->
    <header class="acc-head">
      <div>
        <div class="acc-title">Mis compras</div>
        <div class="acc-sub">Tus pedidos y su estado.</div>
      </div>

      <div class="acc-actions">
        <v-text-field
          v-model="q"
          class="acc-search"
          density="comfortable"
          variant="solo-filled"
          rounded="pill"
          hide-details
          clearable
          placeholder="Buscá por producto, código o estado…"
          prepend-inner-icon="mdi-magnify"
        />
        <v-btn variant="tonal" :loading="loading" @click="reload">
          Actualizar
        </v-btn>
      </div>
    </header>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <!-- Empty -->
    <div v-if="!loading && filtered.length === 0" class="acc-empty">
      <div class="acc-empty-ico">
        <v-icon size="30">mdi-receipt-text-outline</v-icon>
      </div>
      <div class="acc-empty-title">Todavía no tenés compras</div>
      <div class="acc-empty-sub">Cuando hagas un pedido, aparece acá.</div>
      <v-btn color="primary" class="mt-3" @click="goShop">IR A LA TIENDA</v-btn>
    </div>

    <!-- List -->
    <div v-else class="acc-list">
      <article v-for="o in filtered" :key="o.id" class="order-card">
        <div class="order-top">
          <div class="order-date">{{ fmtDate(o.created_at) }}</div>

          <div class="order-right">
            <v-chip
              class="order-chip"
              size="small"
              :color="statusColor(o.status)"
              variant="flat"
            >
              {{ statusLabel(o.status) }}
            </v-chip>

            <div class="order-total">{{ fmtMoney(o.total, o.currency) }}</div>
          </div>
        </div>

        <div class="order-body">
          <div class="order-thumb">
            <img
              v-if="o.first_product_image_url"
              :src="o.first_product_image_url"
              alt=""
              loading="lazy"
            />
            <div v-else class="order-thumb-empty">
              <v-icon size="22">mdi-image-outline</v-icon>
            </div>
          </div>

          <div class="order-mid">
            <div class="order-state">
              <span
                class="order-state-dot"
                :class="`dot-${statusColor(o.status)}`"
                aria-hidden="true"
              />
              <span class="order-state-text">{{ statusShort(o.status) }}</span>
            </div>

            <div class="order-title">
              Pedido <b>#{{ o.id }}</b>
              <span class="order-code" v-if="o.public_code">({{ o.public_code }})</span>
            </div>

            <div class="order-sub">
              <span class="order-items">{{ Number(o.items_count || 0) }} item{{ Number(o.items_count || 0) === 1 ? "" : "s" }}</span>
              <span class="order-sep">•</span>
              <span class="order-pay">
                Pago: <b>{{ paymentLabel(o.payment_status) }}</b>
              </span>
              <span class="order-sep">•</span>
              <span class="order-ful">
                {{ fulfillmentLabel(o.fulfillment_type) }}
              </span>
            </div>

            <div class="order-prod" v-if="o.first_product_name">
              {{ o.first_product_name }}
            </div>
          </div>

          <div class="order-cta">
            <v-btn color="primary" variant="flat" class="order-btn" @click="openDetail(o)">
              Ver detalle
            </v-btn>
            <v-btn variant="tonal" class="order-btn2" @click="goShop">
              Volver a comprar
            </v-btn>
          </div>
        </div>
      </article>

      <!-- Pager simple -->
      <div v-if="total > limit" class="acc-pager">
        <v-btn
          variant="tonal"
          :disabled="offset <= 0 || loading"
          @click="prevPage"
        >
          Anterior
        </v-btn>

        <div class="acc-pager-info">
          {{ offset + 1 }}–{{ Math.min(offset + limit, total) }} de {{ total }}
        </div>

        <v-btn
          variant="tonal"
          :disabled="offset + limit >= total || loading"
          @click="nextPage"
        >
          Siguiente
        </v-btn>
      </div>
    </div>

    <!-- =========================
         DETAIL DIALOG (ML style)
    ========================== -->
    <v-dialog v-model="detail.open" max-width="760">
      <v-card rounded="xl" class="detail-card">
        <div class="detail-head">
          <div>
            <div class="detail-title">Pedido #{{ detail.order?.id || "—" }}</div>
            <div class="detail-sub">
              {{ fmtDate(detail.order?.created_at) }}
              <span v-if="detail.order?.public_code">• {{ detail.order.public_code }}</span>
            </div>
          </div>

          <div class="detail-head-right">
            <v-chip
              size="small"
              :color="statusColor(detail.order?.status)"
              variant="flat"
            >
              {{ statusLabel(detail.order?.status) }}
            </v-chip>
            <v-chip
              size="small"
              :color="paymentColor(detail.order?.payment_status)"
              variant="tonal"
            >
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
            <div class="text-caption" style="opacity:.8">Cargando detalle…</div>
          </div>

          <template v-else>
            <!-- Items -->
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

            <!-- Summary -->
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
                  <v-icon size="16">mdi-truck-fast-outline</v-icon>
                  <span>{{ fulfillmentLabel(detail.order?.fulfillment_type) }}</span>
                </div>
                <div class="meta-pill">
                  <v-icon size="16">mdi-storefront-outline</v-icon>
                  <span>San Juan Tecnología</span>
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

/**
 * ✅ IMPORTANTE:
 * Usamos el MISMO axios que ya tiene withCredentials true.
 * Si vos tenés este export default httpShop en:
 *   src/modules/shop/service/shop.auth.public.api.js
 * entonces va perfecto.
 */
import httpShop from "@/modules/shop/service/shop.auth.public.api";

const router = useRouter();

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
  // si viene decimal, no lo rompas
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

// =====================
// API
// =====================
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

// =====================
// Search filter
// =====================
const filtered = computed(() => {
  const list = items.value || [];
  const s = String(q.value || "").trim().toLowerCase();
  if (!s) return list;

  return list.filter((o) => {
    const hay =
      `${o.id} ${o.public_code || ""} ${o.status || ""} ${o.payment_status || ""} ${o.first_product_name || ""}`
        .toLowerCase();
    return hay.includes(s);
  });
});

onMounted(() => {
  fetchOrders();
});
</script>
<style scoped>
.acc {
  padding: 14px 14px 24px;
}

.acc-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}
.acc-title {
  font-size: 18px;
  font-weight: 900;
}
.acc-sub {
  font-size: 12px;
  opacity: 0.75;
  margin-top: 2px;
}
.acc-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.acc-search {
  min-width: 340px;
}

.acc-empty {
  background: #fff;
  border-radius: 18px;
  padding: 26px 16px;
  display: grid;
  justify-items: center;
  text-align: center;
  box-shadow: 0 16px 40px rgba(0,0,0,.08);
}
.acc-empty-ico {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(0,0,0,.05);
}
.acc-empty-title {
  font-weight: 900;
  font-size: 16px;
  margin-top: 10px;
}
.acc-empty-sub {
  font-size: 12px;
  opacity: .75;
  margin-top: 2px;
}

.acc-list {
  display: grid;
  gap: 12px;
}

.order-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 16px 40px rgba(0,0,0,.08);
  overflow: hidden;
}

.order-top {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(0,0,0,.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.order-date {
  font-size: 12px;
  font-weight: 800;
  opacity: .8;
}
.order-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.order-total {
  font-weight: 900;
  font-size: 13px;
  white-space: nowrap;
}
.order-chip {
  font-weight: 900;
}

.order-body {
  padding: 14px;
  display: grid;
  grid-template-columns: 74px 1fr auto;
  gap: 14px;
  align-items: center;
}

.order-thumb {
  width: 74px;
  height: 74px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,.08);
  background: #f7f7f7;
  display: grid;
  place-items: center;
}
.order-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.order-thumb-empty {
  opacity: .55;
}

.order-mid {
  min-width: 0;
}
.order-state {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 900;
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
.dot-error { background: #ef4444; }
.dot-info { background: #4b90ff; }

.order-title {
  font-size: 14px;
  font-weight: 900;
  line-height: 1.2;
}
.order-code {
  font-weight: 800;
  opacity: .65;
  margin-left: 6px;
  /* ✅ evita que el código empuje todo en mobile */
  white-space: nowrap;
}
.order-sub {
  margin-top: 6px;
  font-size: 12px;
  opacity: .8;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.order-sep {
  opacity: .35;
}
.order-prod {
  margin-top: 6px;
  font-size: 12px;
  opacity: .85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-cta {
  display: grid;
  gap: 8px;
  justify-items: end;
}
.order-btn,
.order-btn2 {
  min-width: 150px;
  border-radius: 10px;
  font-weight: 900;
}

/* ✅ Botones: que no “engorden” en pantallas chicas */
.order-btn :deep(.v-btn__content),
.order-btn2 :deep(.v-btn__content) {
  white-space: nowrap;
}

.acc-pager {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.acc-pager-info {
  font-size: 12px;
  font-weight: 900;
  opacity: .75;
}

/* DETAIL */
.detail-card {
  overflow: hidden;
}
.detail-head {
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}
.detail-title {
  font-weight: 900;
  font-size: 16px;
}
.detail-sub {
  font-size: 12px;
  opacity: .75;
  margin-top: 2px;
}
.detail-head-right {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.detail-body {
  padding: 14px 16px 16px;
}
.detail-loading {
  min-height: 140px;
  display: grid;
  place-items: center;
  gap: 10px;
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
  padding: 10px;
  border-radius: 14px;
  border: 1px solid rgba(0,0,0,.06);
  background: rgba(0,0,0,.015);
}
.detail-item-thumb {
  width: 54px;
  height: 54px;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f5f5;
  border: 1px solid rgba(0,0,0,.08);
  display: grid;
  place-items: center;
}
.detail-item-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.detail-item-thumb-empty { opacity: .55; }
.detail-item-name {
  font-weight: 900;
  font-size: 13px;
  line-height: 1.2;
}
.detail-item-sub {
  font-size: 12px;
  opacity: .8;
  margin-top: 4px;
}
.detail-item-sub .dot {
  margin: 0 6px;
  opacity: .35;
}
.detail-item-total {
  font-weight: 900;
  font-size: 13px;
  white-space: nowrap;
}

.detail-summary {
  margin-top: 12px;
  border-radius: 16px;
  padding: 12px 12px 10px;
  border: 1px solid rgba(0,0,0,.06);
  background: rgba(0,0,0,.02);
}
.sum-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  padding: 6px 2px;
}
.sum-total {
  border-top: 1px solid rgba(0,0,0,.08);
  margin-top: 6px;
  padding-top: 10px;
  font-size: 14px;
}
.detail-meta {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
  background: rgba(255,255,255,.8);
  border: 1px solid rgba(0,0,0,.06);
}

.detail-actions {
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* =========================================================
   ✅ MOBILE FIX (no se rompe + look ML)
========================================================= */
@media (max-width: 760px) {
  .acc {
    padding: 12px 12px 22px;
  }

  .acc-head {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  /* 🔥 acciones: search arriba, botón abajo full width */
  .acc-actions {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    align-items: stretch;
  }

  .acc-search {
    min-width: 0;
    width: 100%;
  }

  .acc-actions :deep(.v-btn) {
    width: 100%;
    border-radius: 12px;
    font-weight: 900;
  }

  /* top: fecha a la izquierda, chip + total abajo si no entra */
  .order-top {
    padding: 12px 12px;
    align-items: flex-start;
  }
  .order-right {
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }

  /* ✅ cuerpo: thumb + texto en 2 columnas; CTA abajo */
  .order-body {
    padding: 12px;
    grid-template-columns: 66px 1fr;
    grid-template-rows: auto auto;
    gap: 12px;
    align-items: start;
  }

  .order-thumb {
    width: 66px;
    height: 66px;
    border-radius: 14px;
  }

  .order-mid {
    padding-top: 2px;
  }

  /* titulo: evitar que “(public_code)” empuje y rompa */
  .order-title {
    font-size: 13px;
  }
  .order-code {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: bottom;
  }

  /* subtitulo: que respire */
  .order-sub {
    row-gap: 4px;
  }

  /* producto: 2 líneas max */
  .order-prod {
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* ✅ CTAs: 2 columnas iguales, sin overflow */
  .order-cta {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    justify-items: stretch;
    margin-top: 2px;
  }

  .order-btn,
  .order-btn2 {
    width: 100%;
    min-width: 0;
    border-radius: 12px;
    font-size: 12px;
    height: 40px;
  }

  .order-btn :deep(.v-btn__content),
  .order-btn2 :deep(.v-btn__content) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* pager: wrap */
  .acc-pager {
    flex-wrap: wrap;
    gap: 10px;
  }

  /* dialog: padding más chico */
  .detail-head {
    padding: 12px 12px;
    align-items: flex-start;
  }
  .detail-body {
    padding: 12px 12px 14px;
  }
  .detail-actions {
    padding: 12px 12px;
    flex-direction: column;
    align-items: stretch;
  }
  .detail-actions :deep(.v-btn) {
    width: 100%;
  }
}

/* ultra mobile (<= 420): chip/total mejor apilados */
@media (max-width: 420px) {
  .order-date {
    font-size: 11px;
  }
  .order-total {
    font-size: 12px;
  }
  .order-chip {
    max-width: 120px;
  }
}

/* ✅ iOS notch safe area (sin romper android) */
@supports (padding: max(0px)) {
  .acc {
    padding-bottom: max(22px, env(safe-area-inset-bottom));
  }
}
</style>

