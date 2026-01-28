<!-- src/modules/shop/components/checkout/CheckoutStepper.vue -->
<!-- ✅ COPY-PASTE FINAL COMPLETO
     - Step 1: Entrega + Comprador
     - Step 2: Pago => USA CheckoutPaymentStep (cards + animaciones)
     - Step 3: Revisión ✅ (productos + entrega + pago + totales) + Confirmar
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

            <v-radio-group v-model="deliveryModel.mode" density="compact" class="mt-2">
              <v-radio label="Retiro en sucursal" value="pickup" />
              <v-radio label="Envío a domicilio" value="shipping" />
            </v-radio-group>

            <v-divider class="my-4" />

            <!-- PICKUP -->
            <div v-if="deliveryModel.mode === 'pickup'" class="cs-box">
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
                v-model="deliveryModel.pickup_branch_id"
                :items="pickupBranches"
                item-title="name"
                item-value="id"
                label="Sucursal"
                variant="outlined"
                density="comfortable"
                class="mt-3"
                :disabled="pickupBranches.length === 0"
              />

              <div v-if="deliveryModel.pickup_branch_id" class="cs-hint">
                Retiro gratis. Te avisamos cuando esté listo.
              </div>
            </div>

            <!-- SHIPPING -->
            <div v-else class="cs-box">
              <div class="cs-box-title">Dirección de envío</div>

              <v-row class="mt-1">
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="deliveryModel.contact_name"
                    label="Nombre receptor"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="deliveryModel.ship_phone"
                    label="Teléfono receptor"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="deliveryModel.address1"
                    label="Dirección (calle + número)"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="deliveryModel.zip"
                    label="Código postal"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="deliveryModel.city"
                    label="Ciudad"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="deliveryModel.province"
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
                    v-model="buyerModel.name"
                    label="Nombre y apellido"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="buyerModel.email"
                    label="Email"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="buyerModel.phone"
                    label="Teléfono"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="buyerModel.doc_number"
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
               STEP 2: PAGO (✅ NUEVO COMPONENTE)
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
               STEP 3: REVISIÓN (✅ COMPLETA)
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
                  Método: <b>{{ paymentLabel || paymentMethodFallback }}</b>

                  <div v-if="payment?.method === 'TRANSFER' && payment?.reference" class="cs-muted mt-1">
                    Ref/Comp.: {{ payment.reference }}
                  </div>
                  <div v-if="payment?.method === 'MERCADO_PAGO'" class="cs-muted mt-1">
                    Se redirigirá a Mercado Pago al confirmar.
                  </div>
                  <div v-if="payment?.method === 'AGREE'" class="cs-muted mt-1">
                    Se coordina el pago con el vendedor.
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
import { computed } from "vue";
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

const buyerModel = computed({
  get: () => props.buyer,
  set: (v) => emit("update:buyer", v),
});

const deliveryModel = computed({
  get: () => props.delivery,
  set: (v) => emit("update:delivery", v),
});

const paymentModel = computed({
  get: () => props.payment,
  set: (v) => emit("update:payment", v),
});

/* =========================
   REVISIÓN: items + totales
   ========================= */

const cartItems = computed(() => (Array.isArray(cart.items) ? cart.items : []));

function toNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function itKey(it) {
  return `${it.product_id || it.id || it.code || it.sku || it.name}-${it.branch_id || ""}`;
}

function unitPrice(it) {
  // Prioridad: descuento -> lista -> price -> unit_price
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
  const m = props.payment?.method;
  if (m === "TRANSFER") return "Transferencia";
  if (m === "MERCADO_PAGO") return "Mercado Pago";
  if (m === "CASH") return "Efectivo";
  if (m === "CARD") return "Tarjeta";
  if (m === "QR") return "QR";
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
   🔥 FIX BORDES FANTASMA STEPPER
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

/* Divider entre pasos (línea fina, limpia) */
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
