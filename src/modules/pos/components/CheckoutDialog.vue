<!-- src/modules/pos/components/CheckoutDialog.vue -->
<template>
  <v-dialog v-model="openLocal" max-width="620" persistent>
    <v-card class="rounded-xl overflow-hidden">
      <div class="bg-primary pa-4 text-center">
        <div class="text-overline text-white opacity-80 mb-1">Confirmar Cobro</div>
        <div class="text-h4 font-weight-black text-white">
          {{ money(total) }}
        </div>
        <div class="text-caption text-white opacity-85 mt-1">
          * El precio se define acá según método de pago / cuotas / revendedor.
        </div>
      </div>

      <!-- Resumen items (con preview imagen) -->
      <v-card-text class="pt-4 pb-0">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="text-subtitle-2 font-weight-bold">Resumen</div>
          <div class="text-caption text-medium-emphasis">Preview: {{ money(totalPreview) }}</div>
        </div>

        <v-list density="compact" class="pa-0" bg-color="transparent">
          <v-list-item v-for="it in cart" :key="it.id" class="rounded-lg mb-2 checkout-item">
            <template #prepend>
              <v-avatar rounded="lg" size="44" class="border">
                <v-img v-if="it.image" :src="it.image" cover />
                <v-icon v-else>mdi-package-variant</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="font-weight-bold">{{ it.name }}</v-list-item-title>

            <v-list-item-subtitle class="text-caption text-medium-emphasis">
              {{ qty3(it.qty) }} × {{ money(it.price) }}
              <span class="dot">·</span>
              <span class="muted">{{ it.price_label || "Precio" }}</span>
            </v-list-item-subtitle>

            <template #append>
              <div class="font-weight-bold">{{ money(it.subtotal) }}</div>
            </template>
          </v-list-item>
        </v-list>

        <v-divider class="my-4" />
      </v-card-text>

      <v-card-text class="pt-0 pb-4">
        <div class="text-subtitle-2 font-weight-bold mb-3">Método de pago</div>

        <v-radio-group :model-value="paymentMethod" color="primary" @update:modelValue="emitPaymentMethod">
          <v-radio value="CASH" label="Efectivo" />
          <v-radio value="CARD" label="Tarjeta / Débito" />
          <v-radio value="TRANSFER" label="Transferencia" />
          <v-radio value="QR" label="Mercado Pago" />
        </v-radio-group>

        <v-row dense class="mt-2">
          <v-col cols="12" md="6">
            <v-switch
              :model-value="applyReseller"
              @update:modelValue="emitApplyReseller"
              inset
              color="primary"
              label="Aplicar precio revendedor"
              hide-details
            />
            <div class="text-caption text-medium-emphasis">
              Si no existe precio revendedor (&gt; 0), cae a descuento/lista según corresponda.
            </div>
          </v-col>

          <v-col cols="12" md="6" v-if="paymentMethod === 'CARD' && !applyReseller">
            <v-select
              :model-value="installments"
              @update:modelValue="emitInstallments"
              :items="installmentsItems"
              label="Cuotas"
              variant="outlined"
              density="comfortable"
              hide-details
            />
            <div class="text-caption text-medium-emphasis mt-1">
              1 pago = descuento · 2 a 6 cuotas = precio lista.
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <!-- Datos comprobante según método -->
        <v-row dense>
          <v-col cols="12" v-if="paymentMethod === 'TRANSFER'">
            <v-text-field
              :model-value="paymentProof"
              @update:modelValue="emitPaymentProof"
              label="Comprobante / N° operación"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-receipt-text-outline"
              hide-details
            />
            <div class="text-caption text-medium-emphasis mt-1">
              Guardalo para trazabilidad (transferencia).
            </div>
          </v-col>

          <v-col cols="12" v-if="paymentMethod === 'QR'">
            <v-text-field
              :model-value="paymentProof"
              @update:modelValue="emitPaymentProof"
              label="ID operación / Comprobante"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-qrcode-scan"
              hide-details
            />
          </v-col>

          <v-col cols="12" v-if="paymentMethod === 'CASH'">
            <v-text-field
              :model-value="cashInput"
              @update:modelValue="emitCashInput"
              label="Efectivo recibido"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-cash"
              :error="cashError"
              :error-messages="cashErrorMsg"
              @keyup.enter="onConfirm"
            />
          </v-col>
        </v-row>

        <v-alert type="info" variant="tonal" class="mt-3">
          {{ priceHint }}
        </v-alert>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn size="large" variant="text" color="grey" @click="onCancel" :disabled="loading">
          Cancelar
        </v-btn>
        <v-spacer />

        <v-btn
          size="large"
          color="green-darken-1"
          variant="flat"
          class="px-6"
          :loading="loading"
          :disabled="cannotConfirm"
          @click="onConfirm"
        >
          <v-icon start>mdi-check</v-icon>
          Confirmar venta
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },

  total: { type: Number, default: 0 },
  totalPreview: { type: Number, default: 0 },
  cart: { type: Array, default: () => [] },

  loading: { type: Boolean, default: false },
  cannotConfirm: { type: Boolean, default: false },

  cashError: { type: Boolean, default: false },
  cashErrorMsg: { type: String, default: "" },

  paymentMethod: { type: String, default: "CASH" },
  installments: { type: Number, default: 1 },
  installmentsItems: { type: Array, default: () => [] },
  applyReseller: { type: Boolean, default: false },
  paymentProof: { type: String, default: "" },
  cashInput: { type: String, default: "" },

  priceHint: { type: String, default: "" },
});

const emit = defineEmits([
  "update:open",
  "update:paymentMethod",
  "update:installments",
  "update:applyReseller",
  "update:paymentProof",
  "update:cashInput",
  "confirm",
  "cancel",
]);

const openLocal = computed({
  get: () => props.open,
  set: (v) => emit("update:open", v),
});

function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}
function qty3(n) {
  return Number(n || 0).toFixed(3);
}

function emitPaymentMethod(v) {
  emit("update:paymentMethod", v);
}
function emitInstallments(v) {
  emit("update:installments", v);
}
function emitApplyReseller(v) {
  emit("update:applyReseller", v);
}
function emitPaymentProof(v) {
  emit("update:paymentProof", v);
}
function emitCashInput(v) {
  emit("update:cashInput", v);
}

function onCancel() {
  emit("cancel");
}
function onConfirm() {
  emit("confirm");
}
</script>

<style scoped>
.checkout-item {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-surface), 0.92);
}

.border {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 10px;
}

.dot {
  margin: 0 6px;
  opacity: 0.5;
}

.muted {
  color: rgba(var(--v-theme-on-surface), 0.62);
}
</style>
