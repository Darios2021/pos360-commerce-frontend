<!-- src/modules/shop/components/checkout/CheckoutStepper.vue -->
<!-- ✅ COPY-PASTE FINAL COMPLETO (DB-first + compat)
     Garantiza:
     - delivery.mode => 'pickup' | 'delivery'
     - payment.method_code => 'mercadopago' | 'transfer' | 'cash' | 'credit_sjt' | 'seller'
     - buyer => añade first_name/last_name derivados desde name
-->

<template>
  <v-card class="cs-card" variant="flat">
    <v-card-text>
      <v-stepper v-model="localStep" :alt-labels="true">
        <v-stepper-header>
          <v-stepper-item :value="1" title="Envío" />
          <v-divider />
          <v-stepper-item :value="2" title="Pago" />
          <v-divider />
          <v-stepper-item :value="3" title="Revisión" />
        </v-stepper-header>

        <v-stepper-window>
          <!-- =========================
               STEP 1: ENTREGA + COMPRADOR
               ========================= -->
          <v-stepper-window-item :value="1">
            <div class="cs-title">Entrega</div>
            <div class="cs-sub">Elegí retiro en sucursal o envío a domicilio.</div>

            <v-radio-group v-model="deliveryMode" density="compact" class="mt-2">
              <v-radio label="Retiro en sucursal" value="pickup" />
              <!-- ✅ FIX: DB usa delivery (NO shipping) -->
              <v-radio label="Envío a domicilio" value="delivery" />
            </v-radio-group>

            <v-divider class="my-4" />

            <!-- PICKUP -->
            <div v-if="deliveryMode === 'pickup'" class="cs-box">
              <div class="cs-box-title">Elegí sucursal</div>
              <div class="cs-box-sub">
                Solo mostramos sucursales que pueden cumplir el carrito completo.
              </div>

              <v-alert
                v-if="pickupBranches.length === 0"
                type="warning"
                variant="tonal"
                class="rounded-lg mt-2"
              >
                No encontramos una sucursal con stock para <b>todos</b> los productos.
                Probá <b>envío a domicilio</b> o revisá el carrito.
              </v-alert>

              <v-select
                v-model="deliveryPickupBranchId"
                :items="pickupBranches"
                item-title="name"
                item-value="id"
                label="Sucursal"
                variant="outlined"
                density="comfortable"
                class="mt-3"
                :disabled="pickupBranches.length === 0"
              />

              <div v-if="deliveryPickupBranchId" class="cs-hint">
                Retiro gratis. Te avisamos cuando esté listo.
              </div>
            </div>

            <!-- DELIVERY -->
            <div v-else class="cs-box">
              <div class="cs-box-title">Dirección de envío</div>

              <v-row class="mt-1">
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="deliveryContactName"
                    label="Nombre receptor"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="deliveryShipPhone"
                    label="Teléfono receptor"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="deliveryAddress1"
                    label="Dirección (calle + número)"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="deliveryZip"
                    label="Código postal"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="deliveryCity"
                    label="Ciudad"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="deliveryProvince"
                    label="Provincia"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
              </v-row>

              <v-alert
                v-if="shippingQuote?.status === 'ok'"
                type="success"
                variant="tonal"
                class="rounded-lg mt-2"
              >
                Envío: <b>$ {{ fmtMoney(shippingQuote.amount) }}</b>
                <span v-if="shippingQuote.eta" class="cs-muted">· {{ shippingQuote.eta }}</span>
              </v-alert>

              <div class="d-flex justify-end mt-3">
                <v-btn variant="tonal" :disabled="!canQuoteShipping" @click="$emit('quote-shipping')">
                  <v-icon start>mdi-truck-fast-outline</v-icon>
                  Calcular envío
                </v-btn>
              </div>
            </div>

            <v-divider class="my-4" />

            <!-- BUYER -->
            <div class="cs-box">
              <div class="cs-box-title">Datos del comprador</div>
              <div class="cs-box-sub">Necesitamos estos datos para generar el pedido y contactarte.</div>

              <v-row class="mt-1">
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="buyerName"
                    label="Nombre y apellido"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="buyerEmail"
                    label="Email"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="buyerPhone"
                    label="Teléfono"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="buyerDocNumber"
                    label="DNI / CUIT (opcional)"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
              </v-row>

              <v-alert v-if="buyerErrors?.length" type="warning" variant="tonal" class="rounded-lg mt-2">
                <div class="font-weight-bold mb-1">Faltan datos:</div>
                <ul class="ma-0 pl-5">
                  <li v-for="(e, i) in buyerErrors" :key="i">{{ e }}</li>
                </ul>
              </v-alert>
            </div>

            <div class="cs-actions">
              <div />
              <v-btn color="primary" class="cs-cta" :disabled="!canGoPayment" @click="$emit('next-from-delivery')">
                Continuar
                <v-icon end>mdi-arrow-right</v-icon>
              </v-btn>
            </div>
          </v-stepper-window-item>

          <!-- =========================
               STEP 2: PAGO
               ========================= -->
          <v-stepper-window-item :value="2">
            <CheckoutPaymentStep
              v-model="paymentModel"
              :mp-enabled="mpEnabled"
              :transfer="transferInfo"
              @prev="$emit('prev')"
              @next="$emit('next-from-payment')"
            />

            <v-alert v-if="!canGoReview" type="warning" variant="tonal" class="rounded-lg mt-3">
              Elegí un método de pago válido para continuar.
            </v-alert>
          </v-stepper-window-item>

          <!-- =========================
               STEP 3: REVISIÓN
               ========================= -->
          <v-stepper-window-item :value="3">
            <div class="cs-title">Revisión</div>
            <div class="cs-sub">Verificá todo antes de confirmar.</div>

            <v-card variant="outlined" class="rounded-lg mt-3 cs-review-card">
              <v-card-text>
                <!-- PRODUCTOS -->
                <div class="cs-box-title">Productos</div>

                <v-alert v-if="cartItems.length === 0" type="warning" variant="tonal" class="rounded-lg mt-2">
                  No hay productos en el carrito.
                </v-alert>

                <div v-else class="cs-lines mt-2">
                  <div v-for="it in cartItems" :key="itKey(it)" class="cs-line">
                    <div class="cs-line-left">
                      <div class="cs-line-title">{{ it.name || it.title || "Producto" }}</div>
                      <div class="cs-line-sub">
                        Cantidad: <b>{{ toNum(it.qty, 1) }}</b>
                      </div>
                    </div>

                    <div class="cs-line-right">
                      <div class="cs-line-price">$ {{ fmtMoney(unitPrice(it)) }}</div>
                      <div class="cs-line-sub">
                        Subtotal: <b>$ {{ fmtMoney(lineTotal(it)) }}</b>
                      </div>
                    </div>
                  </div>
                </div>

                <v-divider class="my-3" />

                <!-- COMPRADOR -->
                <div class="cs-box-title">Comprador</div>
                <div class="text-body-2">
                  <b>{{ buyer?.name || "—" }}</b>
                  <div class="cs-muted">
                    {{ buyer?.email || "—" }} · {{ buyer?.phone || "—" }}
                  </div>
                  <div v-if="buyer?.doc_number" class="cs-muted">
                    DNI/CUIT: {{ buyer.doc_number }}
                  </div>
                </div>

                <v-divider class="my-3" />

                <!-- ENTREGA -->
                <div class="cs-box-title">Entrega</div>

                <div class="text-body-2" v-if="delivery?.mode === 'pickup'">
                  Retiro en sucursal:
                  <b>{{ selectedBranchName || pickupBranchName || "—" }}</b>
                  <div class="cs-muted mt-1">Retiro gratis. Te avisamos cuando esté listo.</div>
                </div>

                <div class="text-body-2" v-else>
                  Envío a: <b>{{ delivery?.address1 || "—" }}</b>,
                  {{ delivery?.city || "—" }}, {{ delivery?.province || "—" }},
                  CP {{ delivery?.zip || "—" }}

                  <div class="cs-muted mt-1">
                    {{ delivery?.contact_name || buyer?.name || "—" }} ·
                    {{ delivery?.ship_phone || buyer?.phone || "—" }}
                  </div>

                  <div v-if="shippingQuote?.status === 'ok'" class="cs-muted mt-1">
                    Envío: <b>$ {{ fmtMoney(shippingQuote.amount) }}</b>
                    <span v-if="shippingQuote.eta">· {{ shippingQuote.eta }}</span>
                  </div>
                  <div v-else class="cs-muted mt-1">
                    Envío: <b>—</b>
                  </div>
                </div>

                <v-divider class="my-3" />

                <!-- PAGO -->
                <div class="cs-box-title">Pago</div>
                <div class="text-body-2">
                  <!-- ✅ preferimos label que venga del padre (armado desde ecom_payment_methods) -->
                  Método: <b>{{ paymentLabel || paymentMethodFallback }}</b>

                  <!-- compat refs -->
                  <div v-if="payment?.method_code === 'transfer' && payment?.reference" class="cs-muted mt-1">
                    Ref/Comp.: {{ payment.reference }}
                  </div>
                  <div v-if="payment?.method_code === 'mercadopago'" class="cs-muted mt-1">
                    Se redirigirá a Mercado Pago al confirmar.
                  </div>
                  <div v-if="payment?.method_code === 'seller'" class="cs-muted mt-1">
                    Se coordina el pago con el vendedor.
                  </div>
                  <div v-if="payment?.method_code === 'credit_sjt'" class="cs-muted mt-1">
                    Reservás el pedido y finalizás el crédito en tienda.
                  </div>
                </div>

                <v-divider class="my-3" />

                <!-- TOTALES -->
                <div class="cs-totals">
                  <div class="cs-total-row">
                    <div class="cs-muted">Subtotal productos</div>
                    <div><b>$ {{ fmtMoney(subtotalProducts) }}</b></div>
                  </div>

                  <div class="cs-total-row">
                    <div class="cs-muted">Envío</div>
                    <div>
                      <b v-if="delivery?.mode === 'pickup'">Gratis</b>
                      <b v-else>$ {{ fmtMoney(shippingAmount) }}</b>
                    </div>
                  </div>

                  <div class="cs-total-row cs-grand">
                    <div>Total</div>
                    <div>$ {{ fmtMoney(grandTotal) }}</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <v-alert v-if="submitError" type="error" variant="tonal" class="rounded-lg mt-3">
              {{ submitError }}
            </v-alert>

            <div class="cs-actions">
              <v-btn variant="tonal" @click="$emit('prev')">
                <v-icon start>mdi-arrow-left</v-icon>
                Volver
              </v-btn>

              <v-btn
                color="primary"
                class="cs-cta"
                size="large"
                :loading="submitting"
                :disabled="submitting || !canSubmit"
                @click="$emit('submit')"
              >
                Confirmar compra
                <v-icon end>mdi-check</v-icon>
              </v-btn>
            </div>
          </v-stepper-window-item>
        </v-stepper-window>
      </v-stepper>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, watch } from "vue";
import CheckoutPaymentStep from "@/modules/shop/components/checkout/CheckoutPaymentStep.vue";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";

const cart = useShopCartStore();

const props = defineProps({
  step: { type: Number, default: 1 },

  buyer: { type: Object, required: true },
  delivery: { type: Object, required: true },
  payment: { type: Object, required: true },

  shippingQuote: { type: Object, default: () => ({ status: "idle", amount: 0, eta: "" }) },
  pickupBranches: { type: Array, default: () => [] },
  buyerErrors: { type: Array, default: () => [] },
  canQuoteShipping: { type: Boolean, default: false },

  mpEnabled: { type: Boolean, default: false },
  transferInfo: { type: Object, default: () => ({ alias: "", cbu: "", holder: "" }) },

  selectedBranchName: { type: String, default: "" },
  paymentLabel: { type: String, default: "" },

  canGoReview: { type: Boolean, default: false },
  canGoPayment: { type: Boolean, default: false },
  canSubmit: { type: Boolean, default: false },

  submitting: { type: Boolean, default: false },
  submitError: { type: String, default: "" },
});

const emit = defineEmits([
  "update:buyer",
  "update:delivery",
  "update:payment",
  "quote-shipping",
  "next-from-delivery",
  "next-from-payment",
  "prev",
  "submit",
]);

const localStep = computed({
  get: () => props.step,
  set: () => {}, // step lo maneja el padre
});

// =========================
// Normalizadores DB-first
// =========================
function toStr(v) {
  return String(v ?? "").trim();
}

function splitName(full) {
  const s = toStr(full).replace(/\s+/g, " ").trim();
  if (!s) return { first_name: "", last_name: "" };
  const parts = s.split(" ");
  if (parts.length === 1) return { first_name: parts[0], last_name: "" };
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}

function normalizeDelivery(d) {
  const x = { ...(d || {}) };

  // compat: shipping -> delivery
  const m = toStr(x.mode).toLowerCase();
  if (m === "shipping") x.mode = "delivery";
  if (m !== "pickup" && m !== "delivery") x.mode = "pickup";

  return x;
}

function normalizePayment(p) {
  const x = { ...(p || {}) };

  // ✅ Nuevo: method_code DB-first
  let code = toStr(x.method_code).toLowerCase();

  // compat: viejos enums
  const legacy = toStr(x.method).toUpperCase();
  if (!code) {
    if (legacy === "MERCADO_PAGO") code = "mercadopago";
    else if (legacy === "TRANSFER") code = "transfer";
    else if (legacy === "CASH") code = "cash";
    else if (legacy === "AGREE") code = "seller";
    else if (legacy === "CREDIT_SJT") code = "credit_sjt";
  }

  // compat: provider suelto
  const prov = toStr(x.provider).toLowerCase();
  if (!code && prov) code = prov;

  // whitelist final
  const allowed = new Set(["mercadopago", "transfer", "cash", "credit_sjt", "seller"]);
  if (!allowed.has(code)) code = "";

  x.method_code = code;

  return x;
}

function normalizeBuyer(b) {
  const x = { ...(b || {}) };
  const nm = toStr(x.name);

  // deriva first/last
  const { first_name, last_name } = splitName(nm);
  if (!toStr(x.first_name)) x.first_name = first_name;
  if (!toStr(x.last_name)) x.last_name = last_name;

  // normaliza email a lower
  if (x.email) x.email = toStr(x.email).toLowerCase();

  return x;
}

// =========================
// ✅ FIX CRÍTICO: v-model por campo (evita que se vacíen inputs)
// =========================
function setBuyerField(key, val) {
  const next = normalizeBuyer({ ...(props.buyer || {}), [key]: val });
  emit("update:buyer", next);
}
function setDeliveryField(key, val) {
  const next = normalizeDelivery({ ...(props.delivery || {}), [key]: val });
  emit("update:delivery", next);
}

const buyerName = computed({
  get: () => toStr(props.buyer?.name),
  set: (v) => setBuyerField("name", v),
});
const buyerEmail = computed({
  get: () => toStr(props.buyer?.email),
  set: (v) => setBuyerField("email", v),
});
const buyerPhone = computed({
  get: () => toStr(props.buyer?.phone),
  set: (v) => setBuyerField("phone", v),
});
const buyerDocNumber = computed({
  get: () => toStr(props.buyer?.doc_number),
  set: (v) => setBuyerField("doc_number", v),
});

const deliveryMode = computed({
  get: () => {
    const m = toStr(props.delivery?.mode).toLowerCase();
    if (m === "shipping") return "delivery";
    if (m !== "pickup" && m !== "delivery") return "pickup";
    return m;
  },
  set: (v) => setDeliveryField("mode", v),
});

const deliveryPickupBranchId = computed({
  get: () => props.delivery?.pickup_branch_id ?? null,
  set: (v) => setDeliveryField("pickup_branch_id", v),
});

const deliveryContactName = computed({
  get: () => toStr(props.delivery?.contact_name),
  set: (v) => setDeliveryField("contact_name", v),
});
const deliveryShipPhone = computed({
  get: () => toStr(props.delivery?.ship_phone),
  set: (v) => setDeliveryField("ship_phone", v),
});
const deliveryAddress1 = computed({
  get: () => toStr(props.delivery?.address1),
  set: (v) => setDeliveryField("address1", v),
});
const deliveryZip = computed({
  get: () => toStr(props.delivery?.zip),
  set: (v) => setDeliveryField("zip", v),
});
const deliveryCity = computed({
  get: () => toStr(props.delivery?.city),
  set: (v) => setDeliveryField("city", v),
});
const deliveryProvince = computed({
  get: () => toStr(props.delivery?.province),
  set: (v) => setDeliveryField("province", v),
});

// =========================
// payment v-model (objeto completo) OK
// =========================
const paymentModel = computed({
  get: () => normalizePayment(props.payment),
  set: (v) => emit("update:payment", normalizePayment(v)),
});

// ✅ si el padre todavía manda shipping/method legacy, lo corregimos apenas monta/cambia
watch(
  () => props.delivery,
  (d) => {
    const nd = normalizeDelivery(d);
    if (toStr(nd?.mode) !== toStr(d?.mode)) emit("update:delivery", nd);
  },
  { deep: true, immediate: true }
);

watch(
  () => props.payment,
  (p) => {
    const np = normalizePayment(p);
    if (toStr(np?.method_code) !== toStr(p?.method_code) || toStr(np?.method) !== toStr(p?.method)) {
      emit("update:payment", np);
    }
  },
  { deep: true, immediate: true }
);

watch(
  () => props.buyer,
  (b) => {
    const nb = normalizeBuyer(b);
    if (
      toStr(nb?.first_name) !== toStr(b?.first_name) ||
      toStr(nb?.last_name) !== toStr(b?.last_name) ||
      toStr(nb?.email) !== toStr(b?.email)
    ) {
      emit("update:buyer", nb);
    }
  },
  { deep: true, immediate: true }
);

// =========================
// Revisión: items + totales
// =========================
const cartItems = computed(() => (Array.isArray(cart.items) ? cart.items : []));

function toNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function itKey(it) {
  return `${it.product_id || it.id || it.code || it.sku || it.name}-${it.branch_id || ""}`;
}

function unitPrice(it) {
  const p =
    toNum(it.price_discount, NaN) ||
    toNum(it.price_list, NaN) ||
    toNum(it.price, NaN) ||
    toNum(it.unit_price, NaN);

  return Number.isFinite(p) ? p : 0;
}

function lineTotal(it) {
  return unitPrice(it) * toNum(it.qty, 1);
}

const subtotalProducts = computed(() => {
  return cartItems.value.reduce((acc, it) => acc + lineTotal(it), 0);
});

const shippingAmount = computed(() => {
  if (props.delivery?.mode === "pickup") return 0;
  if (props.shippingQuote?.status === "ok") return toNum(props.shippingQuote.amount, 0);
  return 0;
});

const grandTotal = computed(() => subtotalProducts.value + shippingAmount.value);

const pickupBranchName = computed(() => {
  const id = props.delivery?.pickup_branch_id;
  const b = (props.pickupBranches || []).find((x) => Number(x.id) === Number(id));
  return b?.name || "";
});

const paymentMethodFallback = computed(() => {
  const code = toStr(props.payment?.method_code).toLowerCase();

  if (code === "mercadopago") return "Mercado Pago";
  if (code === "transfer") return "Transferencia";
  if (code === "cash") return "Efectivo";
  if (code === "credit_sjt") return "Crédito San Juan Tecnología";
  if (code === "seller") return "Acordar pago con el vendedor";

  const m = toStr(props.payment?.method).toUpperCase();
  if (m === "TRANSFER") return "Transferencia";
  if (m === "MERCADO_PAGO") return "Mercado Pago";
  if (m === "CASH") return "Efectivo";
  if (m === "AGREE") return "A coordinar";

  return "—";
});

function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(Number(v || 0)));
}
</script>

<style scoped>
/* =========================
   CONTENEDOR GENERAL
   ========================= */
.cs-card {
  border-radius: 12px;
  border: none !important;
  box-shadow: none !important;
}

/* =========================
   TITULOS Y TEXTOS
   ========================= */
.cs-title {
  font-weight: 900;
  font-size: 18px;
}
.cs-sub {
  margin-top: 2px;
  color: #737373;
  font-size: 13px;
}
.cs-muted {
  color: #737373;
  font-size: 12.5px;
}

/* =========================
   CAJAS DE CONTENIDO
   ========================= */
.cs-box {
  border: 1px solid #e6e6e6;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  margin-top: 10px;
}
.cs-box-title {
  font-weight: 900;
  font-size: 14px;
}
.cs-box-sub {
  color: #737373;
  font-size: 12.5px;
  margin-top: 2px;
}
.cs-hint {
  margin-top: 8px;
  color: #737373;
  font-size: 12.5px;
}

/* =========================
   ACCIONES
   ========================= */
.cs-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 16px;
  align-items: center;
}
.cs-cta {
  border-radius: 10px;
  text-transform: none;
  font-weight: 900;
}

/* =========================
   FIX BORDES FANTASMA STEPPER
   ========================= */
:deep(.v-stepper) {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}
:deep(.v-stepper-header) {
  background: transparent !important;
  box-shadow: none !important;
  border-bottom: none !important;
}
:deep(.v-stepper-window) {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}
:deep(.v-stepper-item) {
  background: transparent !important;
}
:deep(.v-stepper__content),
:deep(.v-stepper-window-item) {
  border: none !important;
}
:deep(.v-stepper-header .v-divider) {
  border-color: #e6e6e6;
  opacity: 0.6;
}

/* =========================
   REVISIÓN: LISTA + TOTALES
   ========================= */
.cs-review-card {
  border: 1px solid #e6e6e6 !important;
  box-shadow: none !important;
}
.cs-lines {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cs-line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dashed #eaeaea;
}
.cs-line:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.cs-line-left {
  min-width: 0;
}
.cs-line-title {
  font-weight: 900;
  font-size: 13.5px;
  line-height: 1.15;
  word-break: break-word;
}
.cs-line-right {
  text-align: right;
  flex: 0 0 auto;
}
.cs-line-price {
  font-weight: 900;
}
.cs-line-sub {
  color: #737373;
  font-size: 12.5px;
  margin-top: 2px;
}
.cs-totals {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cs-total-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}
.cs-grand {
  margin-top: 6px;
  padding-top: 10px;
  border-top: 1px solid #e6e6e6;
  font-weight: 900;
  font-size: 16px;
}

/* =========================
   MOBILE
   ========================= */
@media (max-width: 600px) {
  .cs-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .cs-line {
    flex-direction: column;
    align-items: flex-start;
  }
  .cs-line-right {
    text-align: left;
  }
}
</style>
