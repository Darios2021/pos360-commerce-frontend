<!-- src/modules/shop/components/checkout/CheckoutStepper.vue -->
<!-- ✅ COPY-PASTE FINAL COMPLETO (DB-first + compat)
     FIXES:
     - ✅ Evita “contenido contraído” en mobile/desktop: mata paddings internos del stepper
     - ✅ Cada step ocupa ancho real con padding controlado (cs-step-pad)
     - delivery.mode => 'pickup' | 'delivery'
     - payment.method_code => 'mercadopago' | 'transfer' | 'cash' | 'credit_sjt' | 'seller'
     - buyer => añade first_name/last_name derivados desde name
-->

<template>
  <v-card class="cs-card" variant="flat">
    <v-card-text class="cs-card-text">
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
            <div class="cs-step-pad">
              <div class="cs-kicker">Paso 1 de 3</div>
              <div class="cs-title">¿Cómo querés recibir tu pedido?</div>
              <div class="cs-sub">Retirá gratis en sucursal o pedí envío a tu domicilio.</div>

              <!-- ✅ Cards visuales en vez de radio plano -->
              <div class="cs-mode-grid mt-3">
                <button
                  type="button"
                  class="cs-mode"
                  :class="{ 'is-active': deliveryMode === 'pickup' }"
                  @click="deliveryMode = 'pickup'"
                >
                  <div class="cs-mode-head">
                    <div class="cs-mode-ico cs-mode-ico--pickup">
                      <v-icon size="22">mdi-storefront-outline</v-icon>
                    </div>
                    <span class="cs-mode-badge">Sin costo</span>
                  </div>
                  <div class="cs-mode-title">Retiro en sucursal</div>
                  <div class="cs-mode-sub">
                    Te avisamos cuando esté listo. Lo retirás en el día.
                  </div>
                  <div class="cs-mode-check" v-if="deliveryMode === 'pickup'">
                    <v-icon size="16">mdi-check-circle</v-icon>
                    Seleccionado
                  </div>
                </button>

                <button
                  type="button"
                  class="cs-mode"
                  :class="{ 'is-active': deliveryMode === 'delivery' }"
                  @click="deliveryMode = 'delivery'"
                >
                  <div class="cs-mode-head">
                    <div class="cs-mode-ico cs-mode-ico--delivery">
                      <v-icon size="22">mdi-truck-fast-outline</v-icon>
                    </div>
                    <span class="cs-mode-badge cs-mode-badge--alt">Cotizá tu envío</span>
                  </div>
                  <div class="cs-mode-title">Envío a domicilio</div>
                  <div class="cs-mode-sub">
                    Llega a tu casa. Calculamos costo según tu zona.
                  </div>
                  <div class="cs-mode-check" v-if="deliveryMode === 'delivery'">
                    <v-icon size="16">mdi-check-circle</v-icon>
                    Seleccionado
                  </div>
                </button>
              </div>

              <!-- PICKUP -->
              <div v-if="deliveryMode === 'pickup'" class="cs-box mt-4">
                <div class="cs-box-head">
                  <div>
                    <div class="cs-box-title">Elegí tu sucursal de retiro</div>
                    <div class="cs-box-sub">Solo mostramos sucursales con stock completo del carrito.</div>
                  </div>
                </div>

                <v-alert
                  v-if="pickupBranches.length === 0"
                  type="warning"
                  variant="tonal"
                  class="rounded-lg mt-3"
                >
                  No encontramos una sucursal con stock para <b>todos</b> los productos.
                  Probá con <b>envío a domicilio</b> o revisá el carrito.
                </v-alert>

                <div v-else class="mt-3">
                  <BranchPickerCards
                    v-model="deliveryPickupBranchId"
                    :branches="pickupBranches"
                  />
                </div>

                <div v-if="deliveryPickupBranchId" class="cs-hint cs-hint--ok">
                  <v-icon size="14">mdi-check</v-icon>
                  Retiro gratis · te avisamos cuando esté listo.
                </div>
              </div>

              <!-- DELIVERY -->
              <div v-else class="cs-box mt-4">
                <div class="cs-box-head">
                  <div>
                    <div class="cs-box-title">Dirección de envío</div>
                    <div class="cs-box-sub">Completá la dirección y calculamos el costo del envío.</div>
                  </div>
                </div>

                <v-row class="mt-1" dense>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="deliveryContactName"
                      label="Nombre del receptor"
                      variant="outlined"
                      density="comfortable"
                      class="cs-input"
                      prepend-inner-icon="mdi-account-outline"
                      autocomplete="name"
                      autocapitalize="words"
                      spellcheck="false"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="deliveryShipPhone"
                      label="Teléfono del receptor"
                      variant="outlined"
                      density="comfortable"
                      class="cs-input"
                      prepend-inner-icon="mdi-phone-outline"
                      type="tel"
                      autocomplete="tel"
                      inputmode="tel"
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-text-field
                      v-model="deliveryAddress1"
                      label="Calle y número"
                      placeholder="Ej. Av. Libertador 1234"
                      variant="outlined"
                      density="comfortable"
                      class="cs-input"
                      :class="{ 'is-valid': isValid(deliveryAddress1, deliveryAddressRules) }"
                      prepend-inner-icon="mdi-home-outline"
                      :rules="deliveryAddressRules"
                      validate-on="input lazy"
                      autocomplete="street-address"
                      autocapitalize="words"
                    />
                  </v-col>

                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="deliveryZip"
                      label="Código postal"
                      variant="outlined"
                      density="comfortable"
                      class="cs-input"
                      :class="{ 'is-valid': isValid(deliveryZip, deliveryZipRules) }"
                      :rules="deliveryZipRules"
                      validate-on="input lazy"
                      autocomplete="postal-code"
                      inputmode="numeric"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="deliveryCity"
                      label="Ciudad"
                      variant="outlined"
                      density="comfortable"
                      class="cs-input"
                      :class="{ 'is-valid': isValid(deliveryCity, deliveryCityRules) }"
                      :rules="deliveryCityRules"
                      validate-on="input lazy"
                      autocomplete="address-level2"
                      autocapitalize="words"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="deliveryProvince"
                      label="Provincia"
                      variant="outlined"
                      density="comfortable"
                      class="cs-input"
                      :class="{ 'is-valid': isValid(deliveryProvince, deliveryProvinceRules) }"
                      :rules="deliveryProvinceRules"
                      validate-on="input lazy"
                      autocomplete="address-level1"
                      autocapitalize="words"
                    />
                  </v-col>
                </v-row>

                <v-alert
                  v-if="shippingQuote?.status === 'ok'"
                  type="success"
                  variant="tonal"
                  class="rounded-lg mt-2 cs-quote-alert"
                >
                  <div class="cs-quote-row">
                    <div>
                      <div class="cs-quote-title">Envío: $ {{ fmtMoney(shippingQuote.amount) }}</div>
                      <div v-if="shippingQuote.eta" class="cs-quote-eta">{{ shippingQuote.eta }}</div>
                    </div>
                  </div>
                </v-alert>

                <div class="d-flex justify-end mt-3">
                  <v-btn
                    variant="tonal"
                    color="primary"
                    class="cs-quote-btn"
                    :disabled="!canQuoteShipping"
                    @click="$emit('quote-shipping')"
                  >
                    <v-icon start>mdi-truck-fast-outline</v-icon>
                    Calcular envío
                  </v-btn>
                </div>
              </div>

              <!-- BUYER -->
              <div class="cs-box mt-4">
                <div class="cs-box-head">
                  <div>
                    <div class="cs-box-title">Datos de contacto</div>
                    <div class="cs-box-sub">Para generar el pedido y avisarte cuando esté listo.</div>
                  </div>
                </div>

                <v-row class="mt-1" dense>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="buyerName"
                      label="Nombre y apellido"
                      variant="outlined"
                      density="comfortable"
                      class="cs-input"
                      :class="{ 'is-valid': isValid(buyerName, buyerNameRules) }"
                      prepend-inner-icon="mdi-account-outline"
                      :rules="buyerNameRules"
                      validate-on="input lazy"
                      autocomplete="name"
                      autocapitalize="words"
                      spellcheck="false"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="buyerEmail"
                      label="Email"
                      type="email"
                      variant="outlined"
                      density="comfortable"
                      class="cs-input"
                      :class="{ 'is-valid': isValid(buyerEmail, buyerEmailRules) }"
                      prepend-inner-icon="mdi-email-outline"
                      :rules="buyerEmailRules"
                      validate-on="input lazy"
                      autocomplete="email"
                      inputmode="email"
                      autocapitalize="none"
                      spellcheck="false"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="buyerPhone"
                      label="Teléfono"
                      variant="outlined"
                      density="comfortable"
                      class="cs-input"
                      :class="{ 'is-valid': isValid(buyerPhone, buyerPhoneRules) }"
                      prepend-inner-icon="mdi-phone-outline"
                      :rules="buyerPhoneRules"
                      validate-on="input lazy"
                      type="tel"
                      autocomplete="tel"
                      inputmode="tel"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="buyerDocNumber"
                      label="DNI / CUIT (opcional)"
                      variant="outlined"
                      density="comfortable"
                      class="cs-input"
                      :class="{ 'is-valid': buyerDocNumber && isValid(buyerDocNumber, buyerDocRules) }"
                      prepend-inner-icon="mdi-card-account-details-outline"
                      :rules="buyerDocRules"
                      validate-on="input lazy"
                      inputmode="numeric"
                      autocomplete="off"
                    />
                  </v-col>
                </v-row>

                <!-- Resumen "Faltan datos" se mantiene como ayuda extra
                     pero ya no es la única fuente de validación: cada
                     input muestra su propio error inline en tiempo real -->
                <v-alert
                  v-if="buyerErrors?.length"
                  type="warning"
                  variant="tonal"
                  class="rounded-lg mt-2"
                  density="compact"
                >
                  <div class="cs-alert-title">Para continuar:</div>
                  <ul class="ma-0 pl-5 cs-alert-list">
                    <li v-for="(e, i) in buyerErrors" :key="i">{{ e }}</li>
                  </ul>
                </v-alert>
              </div>

              <div class="cs-actions">
                <div />
                <v-btn color="primary" class="cs-cta" size="large" :disabled="!canGoPayment" @click="$emit('next-from-delivery')">
                  Continuar a pago
                  <v-icon end>mdi-arrow-right</v-icon>
                </v-btn>
              </div>
            </div>
          </v-stepper-window-item>

          <!-- =========================
               STEP 2: PAGO
               ========================= -->
          <v-stepper-window-item :value="2">
            <div class="cs-step-pad">
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
            </div>
          </v-stepper-window-item>

          <!-- =========================
               STEP 3: REVISIÓN
               ========================= -->
          <v-stepper-window-item :value="3">
            <div class="cs-step-pad">
              <div class="cs-kicker">Paso 3 de 3</div>
              <div class="cs-title">Revisá tu compra</div>
              <div class="cs-sub">Verificá los datos antes de confirmar.</div>

              <div class="cs-review">
                <!-- PRODUCTOS -->
                <section class="cs-section">
                  <header class="cs-section-head">
                    <div class="cs-section-ico cs-section-ico--products">
                      <v-icon size="16">mdi-package-variant-closed</v-icon>
                    </div>
                    <div>
                      <div class="cs-section-kicker">Detalle</div>
                      <div class="cs-section-title">Productos</div>
                    </div>
                  </header>

                  <v-alert v-if="cartItems.length === 0" type="warning" variant="tonal" class="rounded-lg mt-2">
                    No hay productos en el carrito.
                  </v-alert>

                  <div v-else class="cs-lines">
                    <div v-for="it in cartItems" :key="itKey(it)" class="cs-line">
                      <div class="cs-line-left">
                        <div class="cs-line-thumb">
                          <img v-if="it.image_url || it.image" :src="it.image_url || it.image" :alt="it.name || ''" />
                          <v-icon v-else size="18" color="grey-lighten-1">mdi-image-off-outline</v-icon>
                        </div>
                        <div class="cs-line-info">
                          <div class="cs-line-title">{{ it.name || it.title || "Producto" }}</div>
                          <div class="cs-line-sub">
                            <span class="cs-line-qty">{{ toNum(it.qty, 1) }}×</span>
                            <span>$ {{ fmtMoney(unitPrice(it)) }} c/u</span>
                          </div>
                        </div>
                      </div>

                      <div class="cs-line-right">$ {{ fmtMoney(lineTotal(it)) }}</div>
                    </div>
                  </div>
                </section>

                <!-- COMPRADOR -->
                <section class="cs-section">
                  <header class="cs-section-head">
                    <div class="cs-section-ico cs-section-ico--buyer">
                      <v-icon size="16">mdi-account-outline</v-icon>
                    </div>
                    <div>
                      <div class="cs-section-kicker">Contacto</div>
                      <div class="cs-section-title">Comprador</div>
                    </div>
                  </header>

                  <div class="cs-info-box">
                    <div class="cs-info-name">{{ buyer?.name || "—" }}</div>
                    <div class="cs-info-row">
                      <v-icon size="13">mdi-email-outline</v-icon>
                      <span>{{ buyer?.email || "—" }}</span>
                    </div>
                    <div class="cs-info-row">
                      <v-icon size="13">mdi-phone-outline</v-icon>
                      <span>{{ buyer?.phone || "—" }}</span>
                    </div>
                    <div v-if="buyer?.doc_number" class="cs-info-row">
                      <v-icon size="13">mdi-card-account-details-outline</v-icon>
                      <span>DNI / CUIT: {{ buyer.doc_number }}</span>
                    </div>
                  </div>
                </section>

                <!-- ENTREGA -->
                <section class="cs-section">
                  <header class="cs-section-head">
                    <div class="cs-section-ico cs-section-ico--delivery">
                      <v-icon size="16">{{ delivery?.mode === 'pickup' ? 'mdi-storefront-outline' : 'mdi-truck-fast-outline' }}</v-icon>
                    </div>
                    <div>
                      <div class="cs-section-kicker">Entrega</div>
                      <div class="cs-section-title">{{ delivery?.mode === 'pickup' ? 'Retiro en sucursal' : 'Envío a domicilio' }}</div>
                    </div>
                  </header>

                  <div v-if="delivery?.mode === 'pickup'" class="cs-info-box">
                    <div class="cs-info-name">{{ selectedBranchName || pickupBranchName || "—" }}</div>
                    <div class="cs-info-hint cs-info-hint--ok">
                      <v-icon size="13">mdi-check</v-icon>
                      Retiro gratis · te avisamos cuando esté listo.
                    </div>
                  </div>

                  <div v-else class="cs-info-box">
                    <div class="cs-info-name">{{ delivery?.address1 || "—" }}</div>
                    <div class="cs-info-row">
                      <v-icon size="13">mdi-map-marker-outline</v-icon>
                      <span>{{ delivery?.city || "—" }}, {{ delivery?.province || "—" }} · CP {{ delivery?.zip || "—" }}</span>
                    </div>
                    <div class="cs-info-row">
                      <v-icon size="13">mdi-account-outline</v-icon>
                      <span>{{ delivery?.contact_name || buyer?.name || "—" }} · {{ delivery?.ship_phone || buyer?.phone || "—" }}</span>
                    </div>
                    <div v-if="shippingQuote?.status === 'ok'" class="cs-info-hint">
                      <v-icon size="13">mdi-truck-fast-outline</v-icon>
                      Envío: <strong>$ {{ fmtMoney(shippingQuote.amount) }}</strong>
                      <span v-if="shippingQuote.eta">· {{ shippingQuote.eta }}</span>
                    </div>
                  </div>
                </section>

                <!-- PAGO -->
                <section class="cs-section">
                  <header class="cs-section-head">
                    <div class="cs-section-ico cs-section-ico--payment">
                      <v-icon size="16">{{ paymentIcon }}</v-icon>
                    </div>
                    <div>
                      <div class="cs-section-kicker">Pago</div>
                      <div class="cs-section-title">{{ paymentLabel || paymentMethodFallback }}</div>
                    </div>
                  </header>

                  <div class="cs-info-box">
                    <div v-if="payment?.method_code === 'transfer' && payment?.reference" class="cs-info-row">
                      <v-icon size="13">mdi-receipt-text-outline</v-icon>
                      <span>Ref. comprobante: {{ payment.reference }}</span>
                    </div>
                    <div v-if="payment?.method_code === 'mercadopago'" class="cs-info-hint">
                      <v-icon size="13">mdi-information-outline</v-icon>
                      Te redirigimos a Mercado Pago al confirmar.
                    </div>
                    <div v-if="payment?.method_code === 'seller'" class="cs-info-hint">
                      <v-icon size="13">mdi-information-outline</v-icon>
                      El pago se coordina con el vendedor.
                    </div>
                    <div v-if="payment?.method_code === 'credit_sjt'" class="cs-info-hint">
                      <v-icon size="13">mdi-information-outline</v-icon>
                      Reservás el pedido online y completás el crédito en tienda.
                    </div>
                    <div v-if="payment?.method_code === 'cash'" class="cs-info-hint">
                      <v-icon size="13">mdi-information-outline</v-icon>
                      Pagás en efectivo al retirar o recibir el pedido.
                    </div>
                  </div>
                </section>

                <!-- TOTALES -->
                <section class="cs-totals-section">
                  <div class="cs-total-row">
                    <span class="cs-total-label">Subtotal productos</span>
                    <span class="cs-total-value">$ {{ fmtMoney(subtotalProducts) }}</span>
                  </div>

                  <div class="cs-total-row">
                    <span class="cs-total-label">Envío</span>
                    <span class="cs-total-value">
                      <span v-if="delivery?.mode === 'pickup'" class="cs-total-free">Gratis</span>
                      <template v-else>$ {{ fmtMoney(shippingAmount) }}</template>
                    </span>
                  </div>

                  <div class="cs-total-row cs-grand">
                    <span>Total</span>
                    <span class="cs-grand-amount">$ {{ fmtMoney(grandTotal) }}</span>
                  </div>
                </section>
              </div>

              <v-alert v-if="submitError" type="error" variant="tonal" class="rounded-lg mt-3">
                {{ submitError }}
              </v-alert>

              <div class="cs-actions">
                <button type="button" class="cs-back-link" @click="$emit('prev')">
                  <v-icon size="14">mdi-arrow-left</v-icon>
                  <span>Volver al pago</span>
                </button>

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
import BranchPickerCards from "@/modules/shop/components/checkout/BranchPickerCards.vue";
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

function toStr(v) {
  return String(v ?? "").trim();
}

function normalizePayment(p) {
  const x = { ...(p || {}) };
  let code = toStr(x.method_code).toLowerCase();

  const legacy = toStr(x.method).toUpperCase();
  if (!code) {
    if (legacy === "MERCADO_PAGO") code = "mercadopago";
    else if (legacy === "TRANSFER") code = "transfer";
    else if (legacy === "CASH") code = "cash";
    else if (legacy === "AGREE") code = "seller";
    else if (legacy === "CREDIT_SJT") code = "credit_sjt";
  }

  const prov = toStr(x.provider).toLowerCase();
  if (!code && prov) code = prov;

  const allowed = new Set(["mercadopago", "transfer", "cash", "credit_sjt", "seller"]);
  if (!allowed.has(code)) code = "";

  x.method_code = code;
  return x;
}

// IMPORTANTE: nunca normalizar el buyer en cada keystroke. Si lowercasamos
// el email o splitamos el nombre mientras el usuario tipea, el v-model se
// re-evalúa con un valor distinto al que está en el input → Vue actualiza
// el DOM, pierde el foco y el cursor salta. La normalización (lowercase
// email, split first/last) ya la hace el backend (ecomCheckout.controller).

function setBuyerField(key, val) {
  // Set directo sin normalizar — preservamos lo que el usuario tipea.
  emit("update:buyer", { ...(props.buyer || {}), [key]: val });
}
function setDeliveryField(key, val) {
  // Set directo. Si la propiedad afecta el modo (pickup/delivery), el
  // setter del modo lo normaliza explícitamente; los demás campos no.
  emit("update:delivery", { ...(props.delivery || {}), [key]: val });
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

/* =========================
   Reglas de validación reactivas (Vuetify v-text-field :rules)
   - Las reglas devuelven true si pasa, o un string con el error.
   - Vuetify las corre automáticamente al tipear y al blur, mostrando
     el mensaje debajo del input (sin necesidad de v-form/submit).
========================= */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_MIN = 7; // mínimo razonable de dígitos para AR

const ruleRequired = (label) => (v) =>
  (toStr(v).length > 0) || `${label} requerido`;

const ruleMin = (n, label) => (v) =>
  toStr(v).length === 0 || toStr(v).length >= n || `${label} muy corto`;

const ruleEmail = (v) =>
  toStr(v).length === 0 || EMAIL_RE.test(toStr(v)) || "Email inválido";

const rulePhone = (v) => {
  const digits = toStr(v).replace(/\D/g, "");
  return digits.length === 0 || digits.length >= PHONE_MIN || "Teléfono inválido";
};

const buyerNameRules = [ruleRequired("Nombre"), ruleMin(2, "Nombre")];
const buyerEmailRules = [ruleRequired("Email"), ruleEmail];
const buyerPhoneRules = [ruleRequired("Teléfono"), rulePhone];
// DNI/CUIT es opcional — sólo valida si hay valor
const buyerDocRules = [
  (v) => {
    const s = toStr(v);
    if (!s) return true;
    const digits = s.replace(/\D/g, "");
    return digits.length >= 7 || "Documento muy corto";
  },
];

// Reglas de envío (sólo se renderizan si delivery.mode === 'delivery')
const deliveryAddressRules = [ruleRequired("Dirección"), ruleMin(4, "Dirección")];
const deliveryCityRules = [ruleRequired("Ciudad")];
const deliveryProvinceRules = [ruleRequired("Provincia")];
const deliveryZipRules = [
  (v) => {
    const s = toStr(v);
    if (!s) return "CP requerido";
    return /^\d{4,8}$/.test(s.replace(/\D/g, "")) || "CP inválido";
  },
];

// Helpers para marcar los .cs-input como válidos visualmente
function isValid(value, rules) {
  const v = toStr(value);
  if (!v) return false;
  for (const r of rules) {
    const res = r(v);
    if (res !== true) return false;
  }
  return true;
}

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

const paymentModel = computed({
  get: () => normalizePayment(props.payment),
  set: (v) => emit("update:payment", normalizePayment(v)),
});

// IMPORTANTE: NO se ponen watchers deep que re-emitan props.delivery /
// props.payment / props.buyer normalizados. Esos watchers creaban un
// ciclo: input → setter → emit → parent prop update → watcher → re-emit
// normalizado → re-render del input → cursor salta / pierde foco.
// La normalización (modo, método de pago, lowercase email) la hacemos al
// momento de submit (buildBackendPayload en ShopCheckout.vue + backend).
//
// Si necesitás canonicalizar el modo de delivery al montar (porque el
// padre pueda mandar "shipping" en vez de "delivery"), se hace una sola
// vez con immediate: true SIN deep:
watch(
  () => toStr(props.delivery?.mode).toLowerCase(),
  (m) => {
    if (m === "shipping" && props.delivery?.mode !== "delivery") {
      emit("update:delivery", { ...(props.delivery || {}), mode: "delivery" });
    }
  },
  { immediate: true }
);

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

const subtotalProducts = computed(() => cartItems.value.reduce((acc, it) => acc + lineTotal(it), 0));

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

const paymentIcon = computed(() => {
  const code = String(props.payment?.method_code || "").toLowerCase();
  if (code === "mercadopago") return "mdi-credit-card-outline";
  if (code === "transfer") return "mdi-bank-outline";
  if (code === "cash") return "mdi-cash-multiple";
  if (code === "credit_sjt") return "mdi-file-document-outline";
  if (code === "seller") return "mdi-account-tie-outline";
  return "mdi-credit-card-outline";
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
   INTER + base
========================= */
.cs-card,
.cs-card :deep(*) {
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.cs-card {
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  letter-spacing: 0.005em;
  border-radius: 12px;
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

/* ✅ clave: el v-card-text default mete padding; lo anulamos acá */
.cs-card-text {
  padding: 0 !important;
}

.cs-kicker {
  font-size: 11px;
  font-weight: 460;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(17, 24, 39, 0.5);
  margin-bottom: 6px;
}

.cs-title {
  font-weight: 540;
  font-size: 22px;
  line-height: 1.18;
  letter-spacing: -0.01em;
  color: rgba(17, 24, 39, 0.92);
}
.cs-sub {
  margin-top: 4px;
  color: rgba(17, 24, 39, 0.6);
  font-size: 13.5px;
  font-weight: 400;
}
.cs-muted {
  color: rgba(17, 24, 39, 0.55);
  font-size: 12.5px;
}

/* =========================
   Cards de modo (pickup / delivery)
========================= */
.cs-mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.cs-mode {
  appearance: none;
  cursor: pointer;
  text-align: left;
  background: #fff;
  border: 1.5px solid rgba(17, 24, 39, 0.1);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease, background 0.18s ease;
}
.cs-mode:hover {
  border-color: rgba(21, 101, 192, 0.32);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
}
.cs-mode.is-active {
  border-color: rgb(var(--v-theme-primary));
  background: linear-gradient(180deg, rgba(21, 101, 192, 0.04) 0%, rgba(21, 101, 192, 0.08) 100%);
  box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.12);
}

.cs-mode-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.cs-mode-ico {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  color: rgb(var(--v-theme-primary));
  background: rgba(21, 101, 192, 0.10);
}
.cs-mode-ico--pickup {
  background: rgba(0, 153, 102, 0.10);
  color: #009966;
}
.cs-mode-ico--delivery {
  background: rgba(21, 101, 192, 0.10);
  color: rgb(var(--v-theme-primary));
}
.cs-mode-badge {
  font-size: 11px;
  font-weight: 460;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(0, 153, 102, 0.12);
  color: #009966;
}
.cs-mode-badge--alt {
  background: rgba(21, 101, 192, 0.10);
  color: rgb(var(--v-theme-primary));
}
.cs-mode-title {
  font-weight: 520;
  font-size: 15px;
  color: rgba(17, 24, 39, 0.9);
  margin-top: 4px;
  letter-spacing: -0.005em;
}
.cs-mode-sub {
  font-size: 13px;
  font-weight: 400;
  color: rgba(17, 24, 39, 0.6);
  line-height: 1.4;
}
.cs-mode-check {
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 460;
  color: rgb(var(--v-theme-primary));
}

/* =========================
   Cajas internas
========================= */
.cs-box {
  border: 1px solid rgba(17, 24, 39, 0.08);
  background: #fff;
  border-radius: 14px;
  padding: 18px;
}
.cs-box-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
}
.cs-box-title {
  font-weight: 520;
  font-size: 15px;
  color: rgba(17, 24, 39, 0.92);
  letter-spacing: -0.005em;
}
.cs-box-sub {
  color: rgba(17, 24, 39, 0.55);
  font-size: 12.5px;
  margin-top: 3px;
  font-weight: 400;
}
.cs-hint {
  margin-top: 10px;
  color: rgba(17, 24, 39, 0.6);
  font-size: 12.5px;
  font-weight: 400;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.cs-hint--ok {
  color: #009966;
  font-weight: 460;
}

/* =========================
   Inputs Vuetify — bordes con buen contraste para que se distingan
   contra el fondo gris claro de la card. Estados claros: idle / hover
   / focus / valid / error.
========================= */
.cs-input :deep(.v-field) {
  border-radius: 10px;
  background: #fff;
  --v-field-border-opacity: 1;
}
.cs-input :deep(.v-field--variant-outlined .v-field__outline__start),
.cs-input :deep(.v-field--variant-outlined .v-field__outline__end),
.cs-input :deep(.v-field--variant-outlined .v-field__outline__notch::before),
.cs-input :deep(.v-field--variant-outlined .v-field__outline__notch::after) {
  border-color: rgba(17, 24, 39, 0.32);
  border-width: 1px;
}
.cs-input :deep(.v-field:hover .v-field__outline__start),
.cs-input :deep(.v-field:hover .v-field__outline__end),
.cs-input :deep(.v-field:hover .v-field__outline__notch::before),
.cs-input :deep(.v-field:hover .v-field__outline__notch::after) {
  border-color: rgba(17, 24, 39, 0.55);
}
.cs-input :deep(.v-field--focused .v-field__outline__start),
.cs-input :deep(.v-field--focused .v-field__outline__end),
.cs-input :deep(.v-field--focused .v-field__outline__notch::before),
.cs-input :deep(.v-field--focused .v-field__outline__notch::after) {
  border-color: rgb(var(--v-theme-primary));
  border-width: 2px;
}
/* Label más visible */
.cs-input :deep(.v-field__label) {
  color: rgba(17, 24, 39, 0.62);
  font-weight: 460;
}
.cs-input :deep(.v-field--focused .v-field__label),
.cs-input :deep(.v-field--active .v-field__label) {
  color: rgb(var(--v-theme-primary));
}
/* Estado válido (campo lleno y sin error): borde verde sutil */
.cs-input.is-valid :deep(.v-field__outline__start),
.cs-input.is-valid :deep(.v-field__outline__end),
.cs-input.is-valid :deep(.v-field__outline__notch::before),
.cs-input.is-valid :deep(.v-field__outline__notch::after) {
  border-color: rgba(0, 153, 102, 0.55);
}
.cs-input.is-valid :deep(.v-field--focused .v-field__outline__start),
.cs-input.is-valid :deep(.v-field--focused .v-field__outline__end),
.cs-input.is-valid :deep(.v-field--focused .v-field__outline__notch::before),
.cs-input.is-valid :deep(.v-field--focused .v-field__outline__notch::after) {
  border-color: #009966;
}
/* Iconos un toque más oscuros para que se vean */
.cs-input :deep(.v-field__prepend-inner .v-icon) {
  color: rgba(17, 24, 39, 0.55) !important;
  opacity: 1;
}
.cs-input :deep(.v-field--focused .v-field__prepend-inner .v-icon) {
  color: rgb(var(--v-theme-primary)) !important;
}

/* Quote alert */
.cs-quote-alert {
  border-radius: 12px !important;
}
.cs-quote-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cs-quote-title {
  font-weight: 520;
  font-size: 14px;
}
.cs-quote-eta {
  font-size: 12.5px;
  color: rgba(17, 24, 39, 0.6);
  font-weight: 400;
  margin-top: 1px;
}
.cs-quote-btn {
  border-radius: 10px;
  text-transform: none;
  font-weight: 460;
  letter-spacing: 0.005em;
}

.cs-alert-title {
  font-weight: 500;
  margin-bottom: 4px;
  font-size: 13.5px;
}
.cs-alert-list {
  font-size: 13px;
  font-weight: 400;
}

.cs-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 20px;
  align-items: center;
}
.cs-cta {
  border-radius: 12px;
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.005em;
  padding: 0 20px;
}

.cs-back-link {
  appearance: none;
  background: transparent;
  border: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 8px;
  font-size: 13px;
  font-weight: 460;
  letter-spacing: 0.005em;
  color: rgba(17, 24, 39, 0.62);
  transition: color 0.16s ease, gap 0.16s ease;
}
.cs-back-link:hover {
  color: rgb(var(--v-theme-primary));
  gap: 8px;
}

/* =========================
   FIX BORDES / PADDINGS STEPPER (la causa del “contraído”)
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
  padding: 0 !important;
}
:deep(.v-stepper-window-item) {
  padding: 0 !important;
}
:deep(.v-stepper__content) {
  padding: 0 !important;
}
:deep(.v-stepper-item) {
  background: transparent !important;
}
:deep(.v-stepper-header .v-divider) {
  border-color: #e6e6e6;
  opacity: 0.6;
}

/* ✅ padding controlado por nosotros, full width en todos los steps */
.cs-step-pad {
  width: 100%;
  padding: 16px;
}

/* =========================
   Review (Paso 3) — secciones con icono + tarjeta interna
========================= */
.cs-review {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #fff;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.cs-section + .cs-section {
  padding-top: 14px;
  border-top: 1px solid rgba(17, 24, 39, 0.06);
}

.cs-section-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.cs-section-ico {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}
.cs-section-ico--products {
  background: rgba(245, 158, 11, 0.12);
  color: #b45309;
}
.cs-section-ico--buyer {
  background: rgba(99, 102, 241, 0.12);
  color: #4f46e5;
}
.cs-section-ico--delivery {
  background: rgba(0, 153, 102, 0.12);
  color: #009966;
}
.cs-section-ico--payment {
  background: rgba(21, 101, 192, 0.10);
  color: rgb(var(--v-theme-primary));
}
.cs-section-kicker {
  font-size: 10.5px;
  font-weight: 460;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(17, 24, 39, 0.5);
  line-height: 1;
  margin-bottom: 3px;
}
.cs-section-title {
  font-weight: 540;
  font-size: 15px;
  letter-spacing: -0.005em;
  color: rgba(17, 24, 39, 0.92);
}

/* Items de productos */
.cs-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cs-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(17, 24, 39, 0.025);
  border-radius: 10px;
}
.cs-line-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1 1 auto;
}
.cs-line-thumb {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid rgba(17, 24, 39, 0.08);
  display: grid;
  place-items: center;
  overflow: hidden;
  flex: 0 0 auto;
}
.cs-line-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.cs-line-info {
  min-width: 0;
}
.cs-line-title {
  font-weight: 460;
  font-size: 13.5px;
  line-height: 1.25;
  color: rgba(17, 24, 39, 0.92);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.cs-line-sub {
  color: rgba(17, 24, 39, 0.55);
  font-size: 12px;
  margin-top: 2px;
  font-weight: 400;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.cs-line-qty {
  background: rgba(21, 101, 192, 0.10);
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  letter-spacing: 0.01em;
}
.cs-line-right {
  text-align: right;
  flex: 0 0 auto;
  font-weight: 540;
  font-size: 14.5px;
  color: rgba(17, 24, 39, 0.94);
  white-space: nowrap;
}

/* Info boxes (comprador / entrega / pago) */
.cs-info-box {
  background: rgba(17, 24, 39, 0.025);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cs-info-name {
  font-weight: 500;
  font-size: 14px;
  color: rgba(17, 24, 39, 0.94);
  letter-spacing: -0.005em;
}
.cs-info-row {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  font-weight: 400;
  color: rgba(17, 24, 39, 0.65);
}
.cs-info-row .v-icon {
  color: rgba(17, 24, 39, 0.4);
  flex: 0 0 auto;
}
.cs-info-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  padding: 6px 10px;
  background: rgba(21, 101, 192, 0.06);
  border-radius: 8px;
  font-size: 12px;
  color: rgba(21, 101, 192, 0.95);
  font-weight: 460;
  align-self: flex-start;
}
.cs-info-hint--ok {
  background: rgba(0, 153, 102, 0.08);
  color: #009966;
}
.cs-info-hint strong {
  font-weight: 540;
}

/* Totales */
.cs-totals-section {
  margin-top: 6px;
  padding: 16px;
  background: linear-gradient(180deg, rgba(21, 101, 192, 0.04) 0%, rgba(21, 101, 192, 0.07) 100%);
  border: 1px solid rgba(21, 101, 192, 0.10);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cs-total-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}
.cs-total-label {
  font-size: 13px;
  font-weight: 400;
  color: rgba(17, 24, 39, 0.65);
}
.cs-total-value {
  font-size: 13.5px;
  font-weight: 460;
  color: rgba(17, 24, 39, 0.92);
}
.cs-total-free {
  color: #009966;
  font-weight: 500;
}
.cs-grand {
  padding-top: 12px;
  border-top: 1px solid rgba(21, 101, 192, 0.14);
  font-weight: 540;
  font-size: 16px;
  color: rgba(17, 24, 39, 0.94);
  letter-spacing: -0.01em;
}
.cs-grand-amount {
  font-weight: 540;
  font-size: 22px;
  letter-spacing: -0.015em;
  color: rgba(17, 24, 39, 0.96);
}

@media (max-width: 700px) {
  .cs-mode-grid {
    grid-template-columns: 1fr;
  }
}

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

  /* mobile: padding más justo para no comer ancho del viewport.
     Antes el chain (shell 10 + step-pad 12 + box 14 = 36px/lado) dejaba
     todas las cards visualmente "encajonadas" con margen lateral grande. */
  .cs-step-pad {
    padding: 10px 6px;
  }
  .cs-box {
    padding: 12px;
    border-radius: 12px;
  }
  .cs-title {
    font-size: 19px;
  }
  .cs-sub {
    font-size: 13px;
  }

  /* títulos de los steps (Envío / Pago / Revisión): más compactos
     y permitimos wrap para que no se solapen */
  :deep(.v-stepper-item__title) {
    font-size: 12px !important;
    white-space: normal !important;
    text-align: center;
    line-height: 1.15;
  }
  :deep(.v-stepper-item__avatar) {
    margin-bottom: 4px !important;
  }
  :deep(.v-stepper-header) {
    padding: 4px 0 !important;
  }

  /* CTA full-width en mobile para que quede bien grande y al pulgar */
  .cs-cta {
    width: 100%;
  }
  .cs-quote-btn {
    width: 100%;
  }

  /* secciones del review más compactas */
  .cs-review {
    padding: 14px;
    gap: 12px;
  }
  .cs-section-head {
    margin-bottom: 8px;
  }
}

@media (max-width: 420px) {
  .cs-step-pad {
    padding: 8px 4px;
  }
  .cs-box {
    padding: 10px;
    border-radius: 10px;
  }
  .cs-title {
    font-size: 17px;
  }
  /* mode cards: reducir padding y altura para que entren bien */
  .cs-mode {
    padding: 12px;
  }
}
</style>
