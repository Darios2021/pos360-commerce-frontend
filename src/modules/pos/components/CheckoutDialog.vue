<template>
  <v-dialog v-model="openLocal" max-width="720" persistent class="cd-dialog">
    <v-card class="cd-root rounded-xl overflow-hidden">
      <!-- HEADER -->
      <div class="cd-hero bg-primary">
        <div class="cd-hero-inner">
          <div class="cd-hero-top">
            <div class="cd-overline">Confirmar cobro</div>

            <v-chip v-if="showInstallments" size="small" variant="flat" class="cd-pill">
              {{ installments }} cuotas de <b class="ml-1">{{ money(perInstallment) }}</b>
              <span class="ml-1">(lista)</span>
            </v-chip>
          </div>

          <div class="cd-total">
            {{ money(total) }}
          </div>

          <div class="cd-subline">
            <span class="opacity-85">El precio se define según método / cuotas / revendedor.</span>
          </div>
        </div>
      </div>

      <!-- ✅ BODY SCROLLABLE -->
      <div class="cd-body-scroll">
        <v-card-text class="cd-body">
          <!-- Resumen -->
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-subtitle-2 font-weight-bold">Resumen</div>
            <div class="text-caption text-medium-emphasis">Preview: {{ money(totalPreview) }}</div>
          </div>

          <v-list density="compact" class="pa-0" bg-color="transparent">
            <v-list-item v-for="it in cart" :key="it.id" class="rounded-lg mb-2 cd-item">
              <template #prepend>
                <v-avatar rounded="lg" size="44" class="cd-border">
                  <v-img v-if="it.image" :src="it.image" cover />
                  <v-icon v-else>mdi-package-variant</v-icon>
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-bold">{{ it.name }}</v-list-item-title>

              <v-list-item-subtitle class="text-caption text-medium-emphasis">
                {{ qty3(it.qty) }} × {{ money(it.price) }}
                <span class="cd-dot">·</span>
                <span class="cd-muted">{{ it.price_label || "Precio" }}</span>
              </v-list-item-subtitle>

              <template #append>
                <div class="font-weight-bold">{{ money(it.subtotal) }}</div>
              </template>
            </v-list-item>
          </v-list>

          <v-divider class="my-4" />

          <!-- Método de pago + configuración -->
          <div class="text-subtitle-2 font-weight-bold mb-3">Método de pago</div>

          <v-row dense class="align-stretch">
            <!-- LEFT: métodos -->
            <v-col cols="12" md="6">
              <v-card class="rounded-xl cd-panel pa-3" elevation="0">
                <v-radio-group
                  :model-value="paymentMethod"
                  color="primary"
                  class="mt-1"
                  @update:modelValue="emitPaymentMethod"
                >
                  <v-radio value="CASH" label="Efectivo" />
                  <v-radio value="CARD" label="Tarjeta / Débito" />
                  <v-radio value="TRANSFER" label="Transferencia" />
                  <v-radio value="QR" label="Mercado Pago (QR)" />
                </v-radio-group>
              </v-card>
            </v-col>

            <!-- RIGHT: opciones -->
            <v-col cols="12" md="6">
              <v-card class="rounded-xl cd-panel pa-3" elevation="0">
                <div class="text-caption text-medium-emphasis mb-2">Configuración</div>

                <v-switch
                  :model-value="applyReseller"
                  @update:modelValue="emitApplyReseller"
                  inset
                  color="primary"
                  label="Aplicar precio revendedor"
                  hide-details
                  class="mb-2"
                />
                <div class="text-caption text-medium-emphasis mb-3">
                  Si no existe revendedor (&gt; 0), cae a descuento/lista.
                </div>

                <v-expand-transition>
                  <div v-if="paymentMethod === 'CARD' && !applyReseller">
                    <v-select
                      :model-value="installments"
                      @update:modelValue="emitInstallments"
                      :items="installmentsItems"
                      label="Cuotas"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                    />

                    <v-alert v-if="showInstallments" type="info" variant="tonal" class="mt-3">
                      <div class="d-flex align-center justify-space-between flex-wrap ga-2">
                        <div>
                          <div class="text-caption text-medium-emphasis">Total en tarjeta</div>
                          <div class="font-weight-black">{{ money(total) }}</div>
                        </div>
                        <div class="text-right">
                          <div class="text-caption text-medium-emphasis">{{ installments }} cuotas de</div>
                          <div class="font-weight-black">{{ money(perInstallment) }}</div>
                        </div>
                      </div>
                      <div class="text-caption text-medium-emphasis mt-2">
                        1 pago = descuento · 2 a 6 cuotas = lista
                      </div>
                    </v-alert>

                    <div v-else class="text-caption text-medium-emphasis mt-2">
                      1 pago = descuento · 2 a 6 cuotas = lista
                    </div>
                  </div>
                </v-expand-transition>
              </v-card>
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
      </div>

      <!-- ✅ FOOTER STICKY -->
      <v-divider />

      <v-card-actions class="cd-actions">
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

const showInstallments = computed(() => {
  return props.paymentMethod === "CARD" && !props.applyReseller && Number(props.installments || 1) > 1;
});

const perInstallment = computed(() => {
  const k = Number(props.installments || 1);
  if (!(k > 1)) return 0;
  return Number(props.total || 0) / k;
});

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
/* ✅ el card no puede superar la altura de la pantalla */
.cd-root {
  background: rgb(var(--v-theme-surface));
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

/* ✅ solo el cuerpo scrollea */
.cd-body-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

/* footer fijo abajo */
.cd-actions {
  padding: 16px;
  flex: 0 0 auto;
  background: rgb(var(--v-theme-surface));
}

/* HEADER */
.cd-hero {
  padding: 18px 18px 14px;
  flex: 0 0 auto;
}
.cd-hero-inner {
  max-width: 920px;
  margin: 0 auto;
}
.cd-hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.cd-overline {
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.92);
}
.cd-pill {
  color: #fff !important;
  background: rgba(255, 255, 255, 0.16) !important;
  border: 1px solid rgba(255, 255, 255, 0.28) !important;
  font-weight: 700;
}
.cd-total {
  margin-top: 8px;
  font-size: 42px;
  line-height: 1.05;
  font-weight: 900;
  color: #fff;
}
.cd-subline {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.92);
}

/* BODY */
.cd-body {
  padding: 18px;
}

.cd-panel {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  background: rgba(var(--v-theme-surface), 0.92);
}
.cd-item {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-surface), 0.92);
}
.cd-border {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 10px;
}
.cd-dot {
  margin: 0 6px;
  opacity: 0.5;
}
.cd-muted {
  color: rgba(var(--v-theme-on-surface), 0.62);
}

/* ✅ COMPACT MODE para notebooks (alto bajo) */
@media (max-height: 760px) {
  .cd-hero {
    padding: 12px 14px 10px;
  }
  .cd-total {
    font-size: 34px;
  }
  .cd-body {
    padding: 14px;
  }
  .cd-actions {
    padding: 12px 14px;
  }
}

/* ✅ aún más compacto */
@media (max-height: 680px) {
  .cd-hero-top {
    gap: 8px;
  }
  .cd-total {
    font-size: 30px;
  }
  .cd-subline {
    font-size: 11px;
  }
}
</style>
