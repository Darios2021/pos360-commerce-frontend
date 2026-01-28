<!-- src/modules/shop/pages/ShopCheckoutSuccess.vue -->
<!-- ✅ COPY-PASTE FINAL COMPLETO
     - Sin bordes negros (borde suave #e6e6e6)
     - Descargar PDF (window.print => Guardar como PDF)
     - Link para compartir + copiar
     - Botón WhatsApp directo
     - Lee datos desde:
       1) query params (?order_id=&code=)
       2) sessionStorage: "shop_last_receipt" (si lo guardás desde checkout)
-->

<template>
  <v-container class="py-6">
    <div class="sc-shell">
      <v-card class="sc-card" elevation="0">
        <!-- HEADER -->
        <div class="sc-head">
          <div class="sc-head-left">
            <div class="sc-check">
              <v-icon size="18">mdi-check</v-icon>
            </div>
            <div>
              <div class="sc-title">¡Pedido confirmado!</div>
              <div class="sc-sub">
                Guardá este comprobante. Si pagás con Mercado Pago, la confirmación puede demorar unos minutos.
              </div>
            </div>
          </div>

          <div class="sc-head-actions no-print">
            <v-btn variant="tonal" class="sc-btn" @click="goHome">
              Seguir comprando
            </v-btn>

            <v-btn color="primary" class="sc-btn" prepend-icon="mdi-download" @click="downloadPdf">
              Descargar PDF
            </v-btn>
          </div>
        </div>

        <v-divider class="my-4" />

        <!-- TOP GRID -->
        <div class="sc-grid">
          <!-- Datos del pedido -->
          <div class="sc-panel">
            <div class="sc-panel-title">Datos del pedido</div>

            <div class="sc-kv">
              <div class="sc-k">ID de pedido</div>
              <div class="sc-v">{{ receipt.order_id || "—" }}</div>
            </div>

            <div class="sc-kv">
              <div class="sc-k">Código</div>
              <div class="sc-v">{{ receipt.code || "—" }}</div>
            </div>

            <div class="sc-kv">
              <div class="sc-k">Fecha</div>
              <div class="sc-v">{{ receipt.created_at_fmt || "—" }}</div>
            </div>

            <div class="sc-kv">
              <div class="sc-k">Método de pago</div>
              <div class="sc-v"><b>{{ receipt.payment_label || "—" }}</b></div>
            </div>

            <div class="sc-kv" v-if="receipt.status_label">
              <div class="sc-k">Estado</div>
              <div class="sc-v">
                <v-chip size="small" variant="tonal" :color="receipt.status_color || 'primary'">
                  {{ receipt.status_label }}
                </v-chip>
              </div>
            </div>

            <div class="sc-actions-row no-print">
              <v-btn variant="text" class="sc-link" @click="copyShareLink">
                <v-icon start>mdi-link-variant</v-icon>
                Copiar link de compra
              </v-btn>

              <v-btn
                variant="text"
                class="sc-link"
                :href="shareLink"
                target="_blank"
                rel="noopener"
              >
                Abrir link
                <v-icon end>mdi-open-in-new</v-icon>
              </v-btn>
            </div>

            <div class="sc-mini no-print" v-if="shareLink">
              Link: <span class="sc-mono">{{ shareLink }}</span>
            </div>
          </div>

          <!-- Entrega -->
          <div class="sc-panel">
            <div class="sc-panel-title">Entrega</div>

            <div class="sc-kv">
              <div class="sc-k">{{ isPickup ? "Retiro" : "Envío" }}</div>
              <div class="sc-v">
                <b>{{ isPickup ? (receipt.pickup_branch_name || "—") : "A domicilio" }}</b>
              </div>
            </div>

            <v-alert
              v-if="isPickup"
              type="info"
              variant="tonal"
              class="rounded-lg mt-3"
            >
              <div class="font-weight-bold mb-1">Dirección de retiro (Rivadavia)</div>
              <div class="sc-addr">
                Av. Ignacio de la Roza y Calle Los Jesuistas – Local 1<br />
                Barrio CESAP, Dpto. Rivadavia<br />
                Frente al supermercado Átomo
              </div>
            </v-alert>

            <v-alert
              v-else
              type="info"
              variant="tonal"
              class="rounded-lg mt-3"
            >
              <div class="font-weight-bold mb-1">Dirección de envío</div>
              <div class="sc-addr">
                {{ receipt.shipping_address || "—" }}
              </div>
            </v-alert>

            <div class="sc-mini mt-2">
              Te avisamos cuando esté listo / coordinamos la entrega.
            </div>
          </div>
        </div>

        <!-- PRODUCTOS -->
        <div class="sc-panel sc-panel-wide">
          <div class="sc-panel-title">Productos</div>

          <div v-if="!safeItems.length" class="sc-empty">
            No hay productos para mostrar.
          </div>

          <div v-else class="sc-items">
            <div v-for="(it, idx) in safeItems" :key="idx" class="sc-item">
              <div class="sc-item-left">
                <v-img
                  :src="it.image_url || it.image || it.cover_url || ''"
                  width="44"
                  height="44"
                  cover
                  class="rounded"
                />
                <div class="sc-item-info">
                  <div class="sc-item-name">
                    <b>{{ it.qty }} ×</b> {{ it.name || "Producto" }}
                  </div>
                  <div class="sc-item-sub">
                    $ {{ fmtMoney(it.unit_price || it.price || 0) }} c/u
                  </div>
                </div>
              </div>

              <div class="sc-item-right">
                $ {{ fmtMoney((Number(it.unit_price || it.price || 0) * Number(it.qty || 0)) || 0) }}
              </div>
            </div>

            <v-divider class="my-3" />

            <div class="sc-totals">
              <div class="sc-row">
                <span>Subtotal</span>
                <span>$ {{ fmtMoney(receipt.subtotal || 0) }}</span>
              </div>

              <div class="sc-row">
                <span>Envío</span>
                <span class="sc-free">
                  <template v-if="Number(receipt.shipping_total || 0) === 0">Gratis</template>
                  <template v-else>$ {{ fmtMoney(receipt.shipping_total || 0) }}</template>
                </span>
              </div>

              <div class="sc-total">
                <span>Total</span>
                <span>$ {{ fmtMoney(receipt.total || 0) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- AYUDA / WHATSAPP -->
        <div class="sc-help no-print">
          <div class="sc-help-left">
            <div class="sc-help-title">¿Necesitás ayuda ahora?</div>
            <div class="sc-help-sub">
              Contactanos por WhatsApp y te respondemos con tu pedido a mano.
            </div>
          </div>

          <v-btn
            color="success"
            class="sc-wa"
            :href="whatsAppLink"
            target="_blank"
            rel="noopener"
            prepend-icon="mdi-whatsapp"
          >
            WhatsApp
          </v-btn>
        </div>

        <!-- AVISO CREDITO -->
        <v-alert
          v-if="receipt.payment_method === 'CREDIT_SJT'"
          type="warning"
          variant="tonal"
          class="rounded-lg mt-4"
        >
          <div class="font-weight-bold mb-1">Crédito San Juan Tecnología</div>
          Presentate en tienda con <b>DNI</b>, <b>comprobante de ingresos</b> y un <b>servicio a tu nombre</b>.
        </v-alert>

        <div class="sc-foot no-print">
          <div class="sc-foot-note">
            Si no ves el pedido en tu historial, guardá el código y contactanos.
          </div>
        </div>
      </v-card>
    </div>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const receipt = ref({
  order_id: null,
  code: null,
  created_at: null,
  created_at_fmt: null,

  status_label: "Pago pendiente",
  status_color: "info",

  payment_method: null,
  payment_label: null,

  fulfillment_type: "pickup",
  pickup_branch_name: "Rivadavia",
  shipping_address: null,

  items: [],
  subtotal: 0,
  shipping_total: 0,
  total: 0,
});

function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(Number(v || 0)));
}

function safeParseJSON(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function formatDateTime(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const isPickup = computed(() => String(receipt.value.fulfillment_type || "").toLowerCase() === "pickup");

const safeItems = computed(() => Array.isArray(receipt.value.items) ? receipt.value.items : []);

const shareLink = computed(() => {
  // No metas datos personales. Solo order_id y code si existe.
  const oid = receipt.value.order_id;
  const code = receipt.value.code;

  const base = `${window.location.origin}/shop/checkout/success`;
  const q = new URLSearchParams();
  if (oid) q.set("order_id", String(oid));
  if (code) q.set("code", String(code));

  const qs = q.toString();
  return qs ? `${base}?${qs}` : base;
});

const whatsAppLink = computed(() => {
  const phone = "5492644392150"; // +54 9 2644 39-2150
  const oid = receipt.value.order_id ? `Pedido #${receipt.value.order_id}` : "Pedido";
  const code = receipt.value.code ? ` (código ${receipt.value.code})` : "";
  const total = receipt.value.total ? ` Total $${fmtMoney(receipt.value.total)}.` : "";
  const msg = encodeURIComponent(`Hola! ${oid}${code}.${total} ¿Me ayudan con mi compra?`);
  return `https://wa.me/${phone}?text=${msg}`;
});

function goHome() {
  router.push("/shop");
}

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(shareLink.value);
    // Si querés toast/snackbar, lo enchufás acá
    console.log("[CHECKOUT_SUCCESS] share link copied");
  } catch (e) {
    console.warn("[CHECKOUT_SUCCESS] clipboard failed", e);
    // fallback viejo
    const ta = document.createElement("textarea");
    ta.value = shareLink.value;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

function downloadPdf() {
  // "Descargar PDF" real sin backend = print => Guardar como PDF
  window.print();
}

function hydrateFromQueryOrStorage() {
  const qOrderId = route.query.order_id ? Number(route.query.order_id) : null;
  const qCode = route.query.code ? String(route.query.code) : null;

  // 1) storage
  const raw = sessionStorage.getItem("shop_last_receipt");
  const stored = raw ? safeParseJSON(raw) : null;

  const src = stored || {};
  const merged = {
    ...receipt.value,
    ...src,
  };

  // 2) query pisa storage si existe
  if (qOrderId) merged.order_id = qOrderId;
  if (qCode) merged.code = qCode;

  // defaults labels
  if (!merged.payment_label) {
    if (merged.payment_method === "MERCADOPAGO") merged.payment_label = "Mercado Pago";
    else if (merged.payment_method === "TRANSFER") merged.payment_label = "Transferencia";
    else if (merged.payment_method === "CASH") merged.payment_label = "Efectivo";
    else if (merged.payment_method === "CREDIT_SJT") merged.payment_label = "Crédito San Juan Tecnología";
    else merged.payment_label = "A coordinar";
  }

  merged.created_at_fmt = formatDateTime(merged.created_at);

  receipt.value = merged;
}

onMounted(() => {
  hydrateFromQueryOrStorage();
});
</script>

<style scoped>
.sc-shell {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

/* ✅ Sin bordes negros */
.sc-card {
  border: 1px solid #e6e6e6;
  border-radius: 14px;
  background: #fff;
  padding: 18px;
}

/* Header */
.sc-head {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
}

.sc-head-left {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  min-width: 280px;
}

.sc-check {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(25, 135, 84, 0.12);
  color: #198754;
  flex: 0 0 auto;
}

.sc-title {
  font-weight: 800;
  font-size: 18px;
  line-height: 1.2;
}

.sc-sub {
  color: #6b7280;
  font-size: 13px;
  margin-top: 2px;
  max-width: 720px;
}

.sc-head-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.sc-btn {
  text-transform: none;
  font-weight: 700;
  border-radius: 10px;
}

/* Panels */
.sc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.sc-panel {
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
}

.sc-panel-wide {
  margin-top: 14px;
}

.sc-panel-title {
  font-weight: 800;
  font-size: 13.5px;
  margin-bottom: 10px;
}

.sc-kv {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 10px;
  padding: 6px 0;
}

.sc-k {
  color: #6b7280;
  font-size: 12.5px;
}

.sc-v {
  font-size: 13px;
  color: #111827;
}

.sc-mini {
  color: #6b7280;
  font-size: 12px;
}

.sc-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
}

/* Items */
.sc-items {
  display: grid;
  gap: 10px;
}

.sc-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.sc-item-left {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.sc-item-info {
  min-width: 0;
}

.sc-item-name {
  font-size: 13px;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sc-item-sub {
  color: #6b7280;
  font-size: 12px;
}

.sc-item-right {
  font-weight: 800;
  font-size: 13px;
  white-space: nowrap;
}

.sc-totals {
  display: grid;
  gap: 6px;
}

.sc-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.sc-free {
  color: #00a650;
  font-weight: 800;
}

.sc-total {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-weight: 900;
  font-size: 16px;
}

.sc-empty {
  color: #6b7280;
  font-size: 13px;
}

/* Help box */
.sc-help {
  margin-top: 14px;
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.sc-help-title {
  font-weight: 900;
  font-size: 13.5px;
}

.sc-help-sub {
  color: #6b7280;
  font-size: 12.5px;
  margin-top: 2px;
}

.sc-wa {
  border-radius: 10px;
  font-weight: 900;
  text-transform: none;
}

.sc-link {
  text-transform: none;
  font-weight: 800;
  padding-inline: 0;
}

.sc-actions-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 10px;
}

.sc-foot {
  margin-top: 12px;
}

.sc-foot-note {
  color: #6b7280;
  font-size: 12px;
}

/* Print (PDF) */
@media print {
  .no-print {
    display: none !important;
  }
  .sc-card {
    border: none !important;
    padding: 0 !important;
  }
  .sc-panel {
    break-inside: avoid;
  }
}

/* Responsive */
@media (max-width: 960px) {
  .sc-grid {
    grid-template-columns: 1fr;
  }
}
</style>
