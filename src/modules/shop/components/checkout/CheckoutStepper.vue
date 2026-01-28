<!-- src/modules/shop/components/checkout/CheckoutStepper.vue -->
<!-- ✅ COPY-PASTE FINAL COMPLETO · Estilo Mercado Libre -->
<template>
  <v-card class="ml-checkout" elevation="0">
    <v-card-text class="pa-0">
      <!-- Stepper header (simple, limpio) -->
      <div class="ml-steps">
        <div class="ml-step" :class="{ active: step === 1 }">
          <div class="dot">1</div>
          <div class="lbl">Envío</div>
        </div>
        <div class="line" />
        <div class="ml-step" :class="{ active: step === 2 }">
          <div class="dot">2</div>
          <div class="lbl">Pago</div>
        </div>
        <div class="line" />
        <div class="ml-step" :class="{ active: step === 3 }">
          <div class="dot">3</div>
          <div class="lbl">Revisión</div>
        </div>
      </div>

      <v-divider />

      <!-- BODY -->
      <div class="ml-body">
        <!-- STEP 1 -->
        <section v-if="step === 1" class="ml-section">
          <div class="ml-h2">Entrega</div>
          <div class="ml-sub">Elegí retiro en sucursal o envío a domicilio.</div>

          <div class="ml-tiles">
            <button
              class="ml-tile"
              :class="{ selected: delivery.mode === 'pickup' }"
              type="button"
              @click="setMode('pickup')"
            >
              <div class="r">
                <span class="radio" />
                <div class="t">
                  <div class="ttl">Retiro en sucursal</div>
                  <div class="cap">Retiro gratis. Te avisamos cuando esté listo.</div>
                </div>
              </div>
            </button>

            <button
              class="ml-tile"
              :class="{ selected: delivery.mode === 'shipping' }"
              type="button"
              @click="setMode('shipping')"
            >
              <div class="r">
                <span class="radio" />
                <div class="t">
                  <div class="ttl">Envío a domicilio</div>
                  <div class="cap">Ingresá tu dirección para calcular el envío.</div>
                </div>
              </div>
            </button>
          </div>

          <!-- Pickup -->
          <div v-if="delivery.mode === 'pickup'" class="ml-card">
            <div class="ml-h3">Elegí sucursal</div>
            <div class="ml-sub2">
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
              v-model="delivery.pickup_branch_id"
              :items="pickupBranches"
              item-title="name"
              item-value="id"
              label="Sucursal"
              variant="outlined"
              density="comfortable"
              class="mt-3"
              :disabled="pickupBranches.length === 0"
            />
          </div>

          <!-- Shipping -->
          <div v-else class="ml-card">
            <div class="ml-h3">Dirección de envío</div>
            <div class="ml-grid">
              <v-text-field v-model="delivery.contact_name" label="Nombre receptor" variant="outlined" density="comfortable" />
              <v-text-field v-model="delivery.ship_phone" label="Teléfono receptor" variant="outlined" density="comfortable" />
              <v-text-field v-model="delivery.address1" label="Dirección (calle + número)" variant="outlined" density="comfortable" class="span2" />
              <v-text-field v-model="delivery.zip" label="Código postal" variant="outlined" density="comfortable" />
              <v-text-field v-model="delivery.city" label="Ciudad" variant="outlined" density="comfortable" />
              <v-text-field v-model="delivery.province" label="Provincia" variant="outlined" density="comfortable" />
            </div>

            <div class="d-flex justify-end mt-2">
              <v-btn variant="tonal" :disabled="!canQuoteShipping" @click="$emit('quote-shipping')">
                Calcular envío
              </v-btn>
            </div>

            <v-alert
              v-if="shippingQuote.status === 'ok'"
              type="success"
              variant="tonal"
              class="rounded-lg mt-2"
            >
              Envío: <b>$ {{ fmtMoney(shippingQuote.amount) }}</b>
              <span v-if="shippingQuote.eta" class="text-medium-emphasis">· {{ shippingQuote.eta }}</span>
            </v-alert>
          </div>

          <!-- Buyer -->
          <div class="ml-card mt-4">
            <div class="ml-h3">Datos del comprador</div>
            <div class="ml-sub2">Necesitamos estos datos para generar el pedido y contactarte.</div>

            <div class="ml-grid mt-2">
              <v-text-field v-model="buyer.name" label="Nombre y apellido" variant="outlined" density="comfortable" />
              <v-text-field v-model="buyer.email" label="Email" variant="outlined" density="comfortable" />
              <v-text-field v-model="buyer.phone" label="Teléfono" variant="outlined" density="comfortable" />
              <v-text-field v-model="buyer.doc_number" label="DNI / CUIT (opcional)" variant="outlined" density="comfortable" />
            </div>

            <v-alert v-if="buyerErrors.length" type="warning" variant="tonal" class="rounded-lg mt-2">
              <div class="font-weight-bold mb-1">Faltan datos:</div>
              <ul class="ma-0 pl-5">
                <li v-for="(e,i) in buyerErrors" :key="i">{{ e }}</li>
              </ul>
            </v-alert>
          </div>

          <!-- Actions -->
          <div class="ml-actions">
            <v-spacer />
            <v-btn class="ml-primary" :disabled="!canGoPayment" @click="$emit('next-from-delivery')">
              Continuar
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </div>
        </section>

        <!-- STEP 2 -->
        <section v-else-if="step === 2" class="ml-section">
          <div class="ml-h2">Pago</div>
          <div class="ml-sub">Elegí el medio de pago.</div>

          <div class="ml-card mt-3">
            <v-radio-group v-model="payment.method" density="compact" class="mt-1">
              <v-radio v-if="mpEnabled" label="Mercado Pago" value="MERCADO_PAGO" />
              <v-radio label="Transferencia" value="TRANSFER" />
              <v-radio label="Efectivo" value="CASH" />
              <v-radio label="Otro" value="OTHER" />
            </v-radio-group>

            <v-alert v-if="payment.method==='MERCADO_PAGO' && !mpEnabled" type="warning" variant="tonal" class="rounded-lg">
              Mercado Pago no está habilitado.
            </v-alert>

            <div v-if="payment.method==='TRANSFER'" class="mt-3">
              <div class="ml-h3">Datos bancarios</div>
              <div class="ml-sub2">
                Alias: <b>{{ transferInfo.alias || "—" }}</b><br />
                CBU: <b>{{ transferInfo.cbu || "—" }}</b><br />
                Titular: <b>{{ transferInfo.holder || "—" }}</b>
              </div>
              <v-text-field v-model="payment.reference" label="Referencia / Comprobante (opcional)" variant="outlined" density="comfortable" class="mt-3" />
            </div>

            <div v-else-if="payment.method==='OTHER'" class="mt-3">
              <v-textarea v-model="payment.note" label="Nota (opcional)" variant="outlined" density="comfortable" rows="3" />
            </div>
          </div>

          <div class="ml-actions">
            <v-btn variant="tonal" @click="$emit('prev')">
              <v-icon start>mdi-arrow-left</v-icon>
              Volver
            </v-btn>
            <v-btn class="ml-primary" :disabled="!canGoReview" @click="$emit('next-from-payment')">
              Continuar
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </div>
        </section>

        <!-- STEP 3 -->
        <section v-else class="ml-section">
          <div class="ml-h2">Revisión</div>
          <div class="ml-sub">Verificá todo antes de confirmar.</div>

          <div class="ml-card mt-3">
            <div class="ml-h3">Comprador</div>
            <div class="ml-sub2">
              <b>{{ buyer.name || "—" }}</b><br />
              {{ buyer.email || "—" }} · {{ buyer.phone || "—" }}
            </div>

            <v-divider class="my-3" />

            <div class="ml-h3">Entrega</div>
            <div class="ml-sub2" v-if="delivery.mode==='pickup'">
              Retiro en sucursal: <b>{{ selectedBranchName || "—" }}</b>
            </div>
            <div class="ml-sub2" v-else>
              Envío a: <b>{{ delivery.address1 || "—" }}</b>, {{ delivery.city || "—" }}, {{ delivery.province || "—" }} (CP {{ delivery.zip || "—" }})
            </div>

            <v-divider class="my-3" />

            <div class="ml-h3">Pago</div>
            <div class="ml-sub2">
              Método: <b>{{ paymentLabel }}</b>
            </div>
          </div>

          <v-alert v-if="submitError" type="error" variant="tonal" class="rounded-lg mt-3">
            {{ submitError }}
          </v-alert>

          <div class="ml-actions">
            <v-btn variant="tonal" @click="$emit('prev')">
              <v-icon start>mdi-arrow-left</v-icon>
              Volver
            </v-btn>

            <v-btn class="ml-primary" size="large" :loading="submitting" :disabled="submitting || !canSubmit" @click="$emit('submit')">
              Confirmar compra
              <v-icon end>mdi-check</v-icon>
            </v-btn>
          </div>
        </section>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
const props = defineProps({
  step: Number,

  buyer: Object,
  delivery: Object,
  payment: Object,
  shippingQuote: Object,

  pickupBranches: Array,
  buyerErrors: Array,

  canQuoteShipping: Boolean,
  mpEnabled: Boolean,
  transferInfo: Object,

  selectedBranchName: String,
  paymentLabel: String,

  canGoReview: Boolean,
  canGoPayment: Boolean,
  canSubmit: Boolean,

  submitting: Boolean,
  submitError: String,
});

const emit = defineEmits([
  "update:step",
  "update:buyer",
  "update:delivery",
  "update:payment",
  "update:shippingQuote",
  "quote-shipping",
  "next-from-delivery",
  "next-from-payment",
  "prev",
  "submit",
]);

function setMode(m) {
  emit("update:delivery", { ...props.delivery, mode: m });
}

function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(Number(v || 0)));
}
</script>

<style scoped>
.ml-checkout {
  border-radius: 10px;
  border: 1px solid #e6e6e6;
  background: #fff;
}

/* Stepper */
.ml-steps {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 18px 12px;
}

.ml-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 70px;
  opacity: 0.55;
}

.ml-step.active {
  opacity: 1;
}

.ml-step .dot {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: #111;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
}

.ml-step .lbl {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #111;
}

.line {
  height: 1px;
  flex: 1;
  background: #e6e6e6;
}

/* Body */
.ml-body {
  padding: 18px;
}

.ml-section {
  padding-bottom: 8px;
}

.ml-h2 {
  font-size: 18px;
  font-weight: 700;
}

.ml-sub {
  margin-top: 2px;
  font-size: 13px;
  color: #737373;
}

/* Cards */
.ml-card {
  border: 1px solid #ededed;
  border-radius: 10px;
  padding: 14px;
  background: #fff;
}

.ml-h3 {
  font-size: 14px;
  font-weight: 700;
}

.ml-sub2 {
  margin-top: 2px;
  font-size: 12.5px;
  color: #737373;
}

/* Tiles */
.ml-tiles {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.ml-tile {
  border: 1px solid #ededed;
  border-radius: 10px;
  padding: 12px;
  background: #fff;
  text-align: left;
  cursor: pointer;
}

.ml-tile.selected {
  border-color: #3483fa;
  box-shadow: 0 0 0 3px rgba(52, 131, 250, 0.12);
}

.ml-tile .r {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.radio {
  margin-top: 4px;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 2px solid #bbb;
}

.ml-tile.selected .radio {
  border-color: #3483fa;
  box-shadow: inset 0 0 0 4px #3483fa;
}

.ttl {
  font-size: 14px;
  font-weight: 700;
  color: #111;
}

.cap {
  margin-top: 2px;
  font-size: 12.5px;
  color: #737373;
}

/* Grid inputs */
.ml-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ml-grid .span2 {
  grid-column: span 2;
}

/* Actions */
.ml-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
}

.ml-primary {
  background-color: #3483fa !important;
  color: #fff !important;
  font-weight: 600;
  border-radius: 6px;
  text-transform: none;
}
</style>
