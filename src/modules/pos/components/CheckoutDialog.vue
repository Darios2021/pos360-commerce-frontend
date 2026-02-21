<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/components/ConfirmChargeDialog.vue -->
<!-- ✅ FIX EXTRA (PEDIDO):
  - Input EFECTIVO con separador de miles en vivo (50.000) sin romper cálculo/vuelto
  - Internamente guarda número limpio (solo dígitos) para backend/cálculo
-->

<template>
  <v-dialog v-model="openLocal" max-width="720" persistent class="cd-dialog">
    <v-card class="cd-root rounded-xl overflow-hidden">
      <!-- HEADER -->
      <div class="cd-hero bg-primary">
        <div class="cd-hero-inner">
          <div class="cd-hero-top">
            <div class="cd-overline">Confirmar cobro</div>

            <v-chip v-if="showInstallments" size="small" variant="flat" class="cd-pill">
              {{ installmentsLocal }} cuotas de <b class="ml-1">{{ money(perInstallment) }}</b>
              <span class="ml-1">(lista)</span>
            </v-chip>
          </div>

          <div class="cd-total">
            {{ money(totalLocal) }}
          </div>

          <div class="cd-subline">
            <span class="opacity-85">El precio se define según método / cuotas / revendedor.</span>
          </div>
        </div>
      </div>

      <!-- BODY SCROLLABLE -->
      <div class="cd-body-scroll">
        <v-card-text class="cd-body">
          <!-- Resumen -->
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-subtitle-2 font-weight-bold">Resumen</div>
            <div class="text-caption text-medium-emphasis">Preview: {{ money(previewSafe) }}</div>
          </div>

          <v-list density="compact" class="pa-0" bg-color="transparent">
            <v-list-item v-for="it in cartLocal" :key="it.id" class="rounded-lg mb-2 cd-item">
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
                  v-model="paymentMethodLocal"
                  color="primary"
                  class="mt-1"
                  @update:modelValue="onPaymentMethodChange"
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
                  v-model="applyResellerLocal"
                  @update:modelValue="onApplyResellerChange"
                  inset
                  color="primary"
                  label="Aplicar precio revendedor"
                  hide-details
                  class="mb-2"
                />
                <div class="text-caption text-medium-emphasis mb-2">
                  Si no existe revendedor (&gt; 0), cae a descuento/lista.
                </div>

                <div v-if="applyResellerLocal" class="cd-note">
                  Revendedor activo: se ignoran cuotas y se usa precio revendedor si existe.
                </div>

                <!-- Cuotas (solo tarjeta y NO revendedor) -->
                <v-expand-transition>
                  <div v-if="paymentMethodLocal === 'CARD' && !applyResellerLocal" class="mt-2">
                    <v-select
                      v-model="installmentsLocal"
                      @update:modelValue="onInstallmentsChange"
                      :items="installmentsItemsSafe"
                      item-title="title"
                      item-value="value"
                      label="Cuotas"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                    />

                    <v-alert v-if="showInstallments" type="info" variant="tonal" class="mt-3">
                      <div class="d-flex align-center justify-space-between flex-wrap ga-2">
                        <div>
                          <div class="text-caption text-medium-emphasis">Total en tarjeta</div>
                          <div class="font-weight-black">{{ money(totalLocal) }}</div>
                        </div>
                        <div class="text-right">
                          <div class="text-caption text-medium-emphasis">{{ installmentsLocal }} cuotas de</div>
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
            <v-col cols="12" v-if="paymentMethodLocal === 'TRANSFER'">
              <v-text-field
                v-model="paymentProofLocal"
                @update:modelValue="onPaymentProofChange"
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

            <v-col cols="12" v-if="paymentMethodLocal === 'QR'">
              <v-text-field
                v-model="paymentProofLocal"
                @update:modelValue="onPaymentProofChange"
                label="ID operación / Comprobante"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-qrcode-scan"
                hide-details
              />
            </v-col>

            <!-- ✅ CASH: input formateado con miles -->
            <v-col cols="12" v-if="paymentMethodLocal === 'CASH'">
              <v-text-field
                class="cd-cash-input"
                :model-value="cashDisplay"
                @update:modelValue="onCashFormattedInput"
                label="Efectivo recibido"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-cash"
                inputmode="numeric"
                autocomplete="off"
                :error="cashError || cashShort"
                :error-messages="cashError ? cashErrorMsg : (cashShort ? `Faltan ${money(Math.abs(change))}` : '')"
                @keyup.enter="onConfirm"
              />

              <!-- ✅ VUELTO / FALTANTE -->
              <div class="cd-change-wrap">
                <v-chip
                  v-if="cashReceived > 0 && !cashShort"
                  size="small"
                  variant="flat"
                  class="cd-chip cd-chip-ok"
                >
                  <v-icon start size="16">mdi-cash-refund</v-icon>
                  Vuelto: <b class="ml-1">{{ money(change) }}</b>
                </v-chip>

                <v-chip
                  v-else-if="cashReceived > 0 && cashShort"
                  size="small"
                  variant="flat"
                  class="cd-chip cd-chip-bad"
                >
                  <v-icon start size="16">mdi-alert-circle</v-icon>
                  Faltan: <b class="ml-1">{{ money(Math.abs(change)) }}</b>
                </v-chip>

                <div class="cd-quick">
                  <v-btn size="small" variant="tonal" @click="quickCash(totalLocal)">Exacto</v-btn>
                  <v-btn size="small" variant="tonal" @click="quickCash(roundUp(totalLocal, 5000))">+$5k</v-btn>
                  <v-btn size="small" variant="tonal" @click="quickCash(roundUp(totalLocal, 10000))">+$10k</v-btn>
                  <v-btn size="small" variant="tonal" @click="quickCash(roundUp(totalLocal, 20000))">+$20k</v-btn>
                </div>
              </div>
            </v-col>
          </v-row>

          <v-alert v-if="String(priceHintLocal || '').trim()" type="info" variant="tonal" class="mt-3">
            {{ priceHintLocal }}
          </v-alert>
        </v-card-text>
      </div>

      <!-- FOOTER STICKY -->
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
          :disabled="cannotConfirmFinal"
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
import { computed, ref, watch } from "vue";

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

/* STATE LOCAL */
const paymentMethodLocal = ref(props.paymentMethod || "CASH");
const installmentsLocal = ref(Number(props.installments || 1));
const applyResellerLocal = ref(!!props.applyReseller);
const paymentProofLocal = ref(String(props.paymentProof || ""));
// ✅ internamente guardamos SOLO dígitos (ej: "50000")
const cashInputLocal = ref(String(props.cashInput || ""));

const openLocal = computed({
  get: () => props.open,
  set: (v) => emit("update:open", v),
});

/* DERIVADOS */
const totalLocal = computed(() => Number(props.total || 0));
const totalPreviewLocal = computed(() => Number(props.totalPreview || 0));
const cartLocal = computed(() => (Array.isArray(props.cart) ? props.cart : []));
const priceHintLocal = computed(() => String(props.priceHint || ""));
const previewSafe = computed(() => (totalPreviewLocal.value > 0 ? totalPreviewLocal.value : totalLocal.value));

/* MONEY */
function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}
function qty3(n) {
  return Number(n || 0).toFixed(3);
}
function toDigitsOnly(v) {
  return String(v ?? "").replace(/[^\d]/g, "");
}
function toCashNumber(v) {
  const digits = toDigitsOnly(v);
  const n = Number(digits || 0);
  return Number.isFinite(n) ? n : 0;
}
function formatMiles(n) {
  if (!n) return "";
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Number(n));
}

/* ✅ EFECTIVO (display con puntos, valor limpio) */
const cashReceived = computed(() => toCashNumber(cashInputLocal.value));
const cashDisplay = computed(() => (cashReceived.value ? formatMiles(cashReceived.value) : ""));

function onCashFormattedInput(val) {
  const digits = toDigitsOnly(val);
  cashInputLocal.value = digits;
  emit("update:cashInput", digits);
}

/* VUELTO */
const change = computed(() => cashReceived.value - totalLocal.value);
const cashShort = computed(() => change.value < 0);

/* QUICK CASH */
function roundUp(n, step) {
  const x = Number(n || 0);
  const s = Number(step || 1);
  if (!(s > 0)) return x;
  return Math.ceil(x / s) * s;
}
function quickCash(val) {
  const v = Number(val || 0);
  const digits = String(Math.max(0, Math.trunc(v)));
  cashInputLocal.value = digits;
  emit("update:cashInput", digits);
}

/* CUOTAS SAFE */
const installmentsItemsSafe = computed(() => {
  const raw = Array.isArray(props.installmentsItems) ? props.installmentsItems : [];

  if (raw.length && typeof raw[0] === "object" && raw[0]) {
    return raw.map((x) => ({
      title: String(x.title ?? x.text ?? x.label ?? `${x.value ?? 1} cuota(s)`),
      value: Number(x.value ?? x.id ?? 1),
    }));
  }

  const nums = raw.filter((n) => Number.isFinite(Number(n))).map((n) => Number(n));
  if (nums.length) {
    return nums.map((n) => ({
      title: n === 1 ? "1 cuota (descuento)" : `${n} cuotas (lista)`,
      value: n,
    }));
  }

  return [
    { title: "1 cuota (descuento)", value: 1 },
    { title: "3 cuotas (lista)", value: 3 },
    { title: "6 cuotas (lista)", value: 6 },
  ];
});

/* COMPUTED UI */
const showInstallments = computed(() => {
  return paymentMethodLocal.value === "CARD" && !applyResellerLocal.value && Number(installmentsLocal.value || 1) > 1;
});
const perInstallment = computed(() => {
  const k = Number(installmentsLocal.value || 1);
  if (!(k > 1)) return 0;
  return totalLocal.value / k;
});

/* VALIDACIÓN FINAL */
const cannotConfirmFinal = computed(() => {
  if (props.loading) return true;
  if (props.cannotConfirm) return true;

  if (paymentMethodLocal.value === "CASH") {
    if (cashReceived.value < totalLocal.value) return true;
  }

  if (paymentMethodLocal.value === "CARD" && !applyResellerLocal.value) {
    const inst = Number(installmentsLocal.value || 1);
    if (!(inst >= 1 && inst <= 24)) return true;
  }

  return false;
});

/* SYNC props -> local */
watch(
  () => props.paymentMethod,
  (v) => {
    if (v && v !== paymentMethodLocal.value) paymentMethodLocal.value = v;
  }
);
watch(
  () => props.installments,
  (v) => {
    const n = Number(v || 1);
    if (n !== Number(installmentsLocal.value || 1)) installmentsLocal.value = n;
  }
);
watch(
  () => props.applyReseller,
  (v) => {
    const b = !!v;
    if (b !== !!applyResellerLocal.value) applyResellerLocal.value = b;
  }
);
watch(
  () => props.paymentProof,
  (v) => {
    const s = String(v || "");
    if (s !== paymentProofLocal.value) paymentProofLocal.value = s;
  }
);
watch(
  () => props.cashInput,
  (v) => {
    const digits = toDigitsOnly(v);
    if (digits !== cashInputLocal.value) cashInputLocal.value = digits;
  }
);

/* HANDLERS */
function onPaymentMethodChange(v) {
  paymentMethodLocal.value = v;
  emit("update:paymentMethod", v);

  // reset coherente por método
  if (v !== "CASH" && cashInputLocal.value) {
    cashInputLocal.value = "";
    emit("update:cashInput", "");
  }
  if (v !== "TRANSFER" && v !== "QR" && paymentProofLocal.value) {
    paymentProofLocal.value = "";
    emit("update:paymentProof", "");
  }

  // tarjeta + revendedor => cuotas=1
  if (v === "CARD" && applyResellerLocal.value) {
    installmentsLocal.value = 1;
    emit("update:installments", 1);
  }

  // tarjeta sin revendedor => asegurar cuotas válidas
  if (v === "CARD" && !applyResellerLocal.value) {
    const allowed = installmentsItemsSafe.value.map((x) => Number(x.value));
    const current = Number(installmentsLocal.value || 1);
    if (!allowed.includes(current)) {
      installmentsLocal.value = allowed.includes(1) ? 1 : allowed[0] || 1;
      emit("update:installments", installmentsLocal.value);
    }
  }
}

function onInstallmentsChange(v) {
  const n = Number(v || 1);
  installmentsLocal.value = n;
  emit("update:installments", n);
}

function onApplyResellerChange(v) {
  const b = !!v;
  applyResellerLocal.value = b;
  emit("update:applyReseller", b);

  // revendedor => cuotas=1 siempre
  if (b) {
    installmentsLocal.value = 1;
    emit("update:installments", 1);
  } else {
    // vuelve a NO revendedor y es tarjeta => asegurar cuotas válidas
    if (paymentMethodLocal.value === "CARD") {
      const allowed = installmentsItemsSafe.value.map((x) => Number(x.value));
      const current = Number(installmentsLocal.value || 1);
      if (!allowed.includes(current)) {
        installmentsLocal.value = allowed.includes(1) ? 1 : allowed[0] || 1;
        emit("update:installments", installmentsLocal.value);
      }
    }
  }
}

function onPaymentProofChange(v) {
  const s = String(v || "");
  paymentProofLocal.value = s;
  emit("update:paymentProof", s);
}

function onCancel() {
  emit("update:open", false);
  emit("cancel", { reason: "user_cancel" });
}

function onConfirm() {
  const payload = {
    payment_method: paymentMethodLocal.value,
    installments: Number(installmentsLocal.value || 1),
    apply_reseller: !!applyResellerLocal.value,
    payment_proof: String(paymentProofLocal.value || "").trim() || null,
    cash_received: cashReceived.value,
    change: change.value > 0 ? change.value : 0,
    total: totalLocal.value,
    total_preview: previewSafe.value,
  };

  emit("confirm", payload);
}
</script>

<style scoped>
/* CARD root */
.cd-root {
  background: rgb(var(--v-theme-surface));
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

/* body scroll only */
.cd-body-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

/* sticky footer */
.cd-actions {
  padding: 14px 16px;
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
  font-weight: 800;
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
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgba(var(--v-theme-surface), 0.94);
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

.cd-note {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.72);
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.16);
  border-radius: 10px;
  padding: 10px 10px;
}

/* CASH */
.cd-cash-input :deep(input) {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.6px;
}

.cd-change-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.cd-chip {
  font-weight: 900;
  letter-spacing: 0.01em;
}
.cd-chip-ok {
  color: rgba(0, 0, 0, 0.86) !important;
  background: rgba(76, 175, 80, 0.22) !important;
  border: 1px solid rgba(76, 175, 80, 0.35) !important;
}
.cd-chip-bad {
  color: rgba(0, 0, 0, 0.86) !important;
  background: rgba(244, 67, 54, 0.18) !important;
  border: 1px solid rgba(244, 67, 54, 0.35) !important;
}

.cd-quick {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* compact for low height screens */
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