<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/CheckoutDialog.vue -->
<!-- ✅ UI CLONADA del estilo de PosProductDetailsDialog (brand #2a85c4):
  - Hero con gradiente suave
  - Panels con fondo suave + bordes brand
  - Métodos de pago en “paycards”
  - Revendedor sutil abajo
  - Resumen con thumbnails
  - Footer sticky
  - Hotkey F8/ESC cierra (sin flicker dentro del dialog)
  - ✅ FIX PEDIDO: cuotas muestran valor calculado con PRECIO LISTA (cuando installments > 1)
  - ✅ FIX: el componente NO crashea (faltaba itemImage())
  - ✅ FIX: imágenes relativas "/pos360/media/..." ahora se convierten a URL absoluta del storage
-->

<template>
  <v-dialog v-model="openLocal" max-width="980" persistent class="cod-dialog">
    <v-card rounded="xl" class="cod-root">
      <!-- HERO -->
      <div class="cod-hero">
        <div class="cod-hero-left">
          <div class="cod-title-row">
            <div class="cod-title text-h6 font-weight-black">Cobro</div>

            <v-chip size="small" variant="tonal" class="cod-chip">
              <v-icon start size="16">mdi-cart</v-icon>
              Ítems: <b class="ml-1">{{ cartUi.length }}</b>
            </v-chip>

            <v-chip size="small" variant="tonal" class="cod-chip">
              <v-icon start size="16">mdi-eye-outline</v-icon>
              Preview: <b class="ml-1">{{ money(previewSafe) }}</b>
            </v-chip>

            <!-- ✅ cuota calculada con TOTAL LISTA cuando corresponde -->
            <v-chip v-if="ui.showInstallmentsChip" size="small" variant="tonal" class="cod-chip cod-chip-soft">
              <v-icon start size="16">mdi-credit-card-outline</v-icon>
              {{ state.installments }} cuotas de <b class="ml-1">{{ money(ui.perInstallmentList) }}</b>
            </v-chip>
          </div>

          <div class="cod-sub text-caption text-medium-emphasis">
            Elegí método y política: tarjeta en cuotas usa lista · revendedor pisa todo (si existe).
          </div>
        </div>

        <div class="cod-hero-right">
          <div class="cod-total-label text-caption text-medium-emphasis">Total</div>
          <div class="cod-total">{{ money(totalSafe) }}</div>
        </div>

        <v-btn icon variant="text" class="cod-close" @click="closeNow" title="Cerrar">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-divider />

      <!-- BODY -->
      <v-card-text class="cod-body">
        <v-row dense class="cod-grid">
          <!-- LEFT: PAYMENT -->
          <v-col cols="12" md="7">
            <v-card class="cod-panel cod-panel-left" elevation="0" rounded="xl">
              <div class="cod-sec-head">
                <div class="text-subtitle-1 font-weight-black">Opciones de pago</div>

                <!-- ✅ Política en chip -->
                <v-chip size="small" variant="tonal" class="cod-chip cod-chip-soft">
                  {{ policyLabel }}
                </v-chip>
              </div>

              <div class="text-caption text-medium-emphasis mt-1">
                * Tarjeta: 1 pago = descuento · 2 a 6 cuotas = lista · Revendedor (si existe) pisa todo.
              </div>

              <v-divider class="my-4" />

              <!-- Payment method as selectable cards -->
              <div class="cod-paygrid">
                <button
                  type="button"
                  class="cod-paycard"
                  :class="{ active: state.paymentMethod === 'CASH' }"
                  @click="onPaymentMethodChange('CASH')"
                >
                  <div class="ic"><v-icon>mdi-cash</v-icon></div>
                  <div class="tx">
                    <div class="t">Efectivo</div>
                    <div class="s">Usa descuento</div>
                  </div>
                  <div class="chk">
                    <v-icon v-if="state.paymentMethod === 'CASH'">mdi-check-circle</v-icon>
                    <v-icon v-else>mdi-circle-outline</v-icon>
                  </div>
                </button>

                <button
                  type="button"
                  class="cod-paycard"
                  :class="{ active: state.paymentMethod === 'CARD' }"
                  @click="onPaymentMethodChange('CARD')"
                >
                  <div class="ic"><v-icon>mdi-credit-card-outline</v-icon></div>
                  <div class="tx">
                    <div class="t">Tarjeta / Débito</div>
                    <div class="s">Cuotas usan lista</div>
                  </div>
                  <div class="chk">
                    <v-icon v-if="state.paymentMethod === 'CARD'">mdi-check-circle</v-icon>
                    <v-icon v-else>mdi-circle-outline</v-icon>
                  </div>
                </button>

                <button
                  type="button"
                  class="cod-paycard"
                  :class="{ active: state.paymentMethod === 'TRANSFER' }"
                  @click="onPaymentMethodChange('TRANSFER')"
                >
                  <div class="ic"><v-icon>mdi-bank-transfer</v-icon></div>
                  <div class="tx">
                    <div class="t">Transferencia</div>
                    <div class="s">Usa descuento</div>
                  </div>
                  <div class="chk">
                    <v-icon v-if="state.paymentMethod === 'TRANSFER'">mdi-check-circle</v-icon>
                    <v-icon v-else>mdi-circle-outline</v-icon>
                  </div>
                </button>

                <button
                  type="button"
                  class="cod-paycard"
                  :class="{ active: state.paymentMethod === 'QR' }"
                  @click="onPaymentMethodChange('QR')"
                >
                  <div class="ic"><v-icon>mdi-qrcode-scan</v-icon></div>
                  <div class="tx">
                    <div class="t">Mercado Pago (QR)</div>
                    <div class="s">Usa descuento</div>
                  </div>
                  <div class="chk">
                    <v-icon v-if="state.paymentMethod === 'QR'">mdi-check-circle</v-icon>
                    <v-icon v-else>mdi-circle-outline</v-icon>
                  </div>
                </button>
              </div>

              <v-row dense class="mt-3">
                <v-col cols="12" md="6">
                  <v-switch
                    v-model="state.applyReseller"
                    inset
                    color="primary"
                    density="comfortable"
                    label="Aplicar precio revendedor"
                    hide-details
                    class="cod-reseller"
                    @update:modelValue="onApplyResellerChange"
                  />
                  <div class="text-caption text-medium-emphasis">
                    Si no existe revendedor (&gt; 0), cae a descuento/lista según corresponda.
                  </div>
                </v-col>

                <!-- ✅ Cuotas: valor por cuota (LISTA) -->
                <v-col cols="12" md="6" v-if="state.paymentMethod === 'CARD' && !state.applyReseller">
                  <v-select
                    v-model="state.installments"
                    :items="installmentsItemsSafe"
                    item-title="title"
                    item-value="value"
                    label="Cuotas"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    class="cod-select"
                    @update:modelValue="onInstallmentsChange"
                  />

                  <div class="text-caption text-medium-emphasis mt-1">
                    En cuotas se usa precio lista. Se calcula valor por cuota.
                  </div>

                  <div v-if="Number(state.installments || 1) > 1" class="cod-installment-chip">
                    <v-chip size="small" variant="tonal" class="cod-chip cod-chip-soft">
                      {{ state.installments }} × <b class="ml-1">{{ money(ui.perInstallmentList) }}</b>
                      <span class="ml-1">(lista)</span>
                    </v-chip>
                  </div>
                </v-col>
              </v-row>

              <v-divider class="my-4" />

              <!-- CASH -->
              <v-expand-transition>
                <div v-if="ui.isCash" class="cod-cashbox">
                  <div class="cod-cash-head">
                    <div class="text-subtitle-2 font-weight-black">Efectivo</div>
                    <v-chip
                      size="small"
                      variant="tonal"
                      class="cod-chip"
                      :class="cashShort ? 'cod-chip-bad' : cashReceived > 0 ? 'cod-chip-ok' : ''"
                    >
                      <v-icon start size="16">{{ cashShort ? "mdi-alert-circle" : "mdi-cash-refund" }}</v-icon>
                      {{ cashShort ? "Faltan" : "Vuelto" }}:
                      <b class="ml-1">{{ money(Math.abs(change)) }}</b>
                    </v-chip>
                  </div>

                  <v-text-field
                    class="cod-cash-input"
                    :model-value="cashDisplay"
                    @update:modelValue="onCashFormattedInput"
                    label="Recibido"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-cash"
                    inputmode="numeric"
                    autocomplete="off"
                    :error="cashShort"
                    :error-messages="cashShort ? `Faltan ${money(Math.abs(change))}` : ''"
                    @keyup.enter="onConfirm"
                  />

                  <div class="cod-quick">
                    <v-btn size="small" variant="tonal" @click="quickCash(totalSafe)">Exacto</v-btn>
                    <v-btn size="small" variant="tonal" @click="quickCash(roundUp(totalSafe, 5000))">+5k</v-btn>
                    <v-btn size="small" variant="tonal" @click="quickCash(roundUp(totalSafe, 10000))">+10k</v-btn>
                    <v-btn size="small" variant="tonal" @click="quickCash(roundUp(totalSafe, 20000))">+20k</v-btn>
                  </div>
                </div>
              </v-expand-transition>
            </v-card>
          </v-col>

          <!-- RIGHT: SUMMARY -->
          <v-col cols="12" md="5">
            <v-card class="cod-panel cod-panel-right" elevation="0" rounded="xl">
              <div class="cod-sec-head">
                <div class="text-subtitle-1 font-weight-black">Resumen</div>
                <div class="text-caption text-medium-emphasis">
                  {{ cartUi.length }} ítems
                </div>
              </div>

              <v-divider class="my-3" />

              <v-list density="compact" bg-color="transparent" class="pa-0">
                <v-list-item v-for="it in cartUi" :key="it._key" class="rounded-lg mb-2 cod-item">
                  <template #prepend>
                    <v-avatar rounded="lg" size="44" class="cod-border">
                      <v-img v-if="it._img" :src="it._img" cover />
                      <div v-else class="cod-noimg">
                        <v-icon size="20">mdi-package-variant</v-icon>
                      </div>
                    </v-avatar>
                  </template>

                  <v-list-item-title class="cod-item-title" :title="it.name || ''">
                    {{ it.name }}
                  </v-list-item-title>

                  <v-list-item-subtitle class="cod-item-sub">
                    {{ qty3(it.qty) }} × {{ money(it._unit) }}
                  </v-list-item-subtitle>

                  <template #append>
                    <div class="cod-item-amt">{{ money(it._subtotal) }}</div>
                  </template>
                </v-list-item>
              </v-list>

              <v-divider class="my-3" />

              <div class="cod-sum-row">
                <span class="text-caption text-medium-emphasis">Total</span>
                <b>{{ money(totalSafe) }}</b>
              </div>

              <div class="cod-sum-row mt-1">
                <span class="text-caption text-medium-emphasis">Preview</span>
                <b>{{ money(previewSafe) }}</b>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <!-- FOOTER -->
      <v-card-actions class="cod-actions">
        <v-btn variant="tonal" @click="closeNow">Cancelar</v-btn>
        <v-spacer />
        <v-btn color="primary" variant="flat" class="cod-confirm" :disabled="cannotConfirmFinal" @click="onConfirm">
          <v-icon start>mdi-check</v-icon>
          Confirmar venta
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { reactive, computed, watch, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  totalPreview: { type: Number, default: 0 },
  cart: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:open", "confirm", "cancel"]);

/* =========================
   STATE LOCAL
========================= */
const state = reactive({
  paymentMethod: "CASH",
  installments: 1,
  applyReseller: false,
  cashDigits: "",
});

/* =========================
   OPEN SYNC (FIX REAL)
   Solo sincroniza cuando ABRE
========================= */
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return;

    state.paymentMethod = "CASH";
    state.installments = 1;
    state.applyReseller = false;
    state.cashDigits = "";
  },
  { immediate: true }
);

const openLocal = computed({
  get: () => props.open,
  set: (v) => emit("update:open", v),
});

/* =========================
   HELPERS
========================= */
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function money(v) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(toNum(v));
}

function toDigitsOnly(v) {
  return String(v ?? "").replace(/[^\d]/g, "");
}

/* =========================
   CASH
========================= */
const totalSafe = computed(() => toNum(props.total));

const cashReceived = computed(() => toNum(state.cashDigits));
const change = computed(() => cashReceived.value - totalSafe.value);
const cashShort = computed(() => state.paymentMethod === "CASH" && change.value < 0);

function onCashFormattedInput(v) {
  state.cashDigits = toDigitsOnly(v);
}

const cannotConfirmFinal = computed(
  () => state.paymentMethod === "CASH" && cashReceived.value < totalSafe.value
);

/* =========================
   ACTIONS
========================= */
function closeNow() {
  emit("update:open", false);
  emit("cancel");
}

function onConfirm() {
  emit("confirm", {
    payment_method: state.paymentMethod,
    installments: Number(state.installments || 1),
    apply_reseller: !!state.applyReseller,
    cash_received: cashReceived.value,
    change: change.value > 0 ? change.value : 0,
    total: totalSafe.value,
  });

  emit("update:open", false);
}

/* hotkeys */
function onKeydownDialog(e) {
  if (!openLocal.value) return;

  const k = String(e.key || "").toLowerCase();
  if (k === "escape") {
    e.preventDefault();
    closeNow();
  }
}

onMounted(() =>
  window.addEventListener("keydown", onKeydownDialog, { capture: true })
);
onBeforeUnmount(() =>
  window.removeEventListener("keydown", onKeydownDialog, { capture: true })
);
</script>

<style scoped>
/* Brand */
.cod-root {
  overflow: hidden;
  --cod-brand: 42, 133, 196; /* #2a85c4 */
}

/* HERO */
.cod-hero {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 16px 14px;
  position: relative;
  background: linear-gradient(
    180deg,
    rgba(var(--cod-brand), 0.18),
    rgba(var(--cod-brand), 0.06),
    rgba(var(--v-theme-surface), 0.92)
  );
}
.cod-hero-left {
  min-width: 0;
}
.cod-hero-right {
  text-align: right;
  padding-top: 2px;
}
.cod-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.cod-title {
  margin-right: 6px;
}
.cod-chip {
  border: 1px solid rgba(var(--cod-brand), 0.18);
  background: rgba(var(--cod-brand), 0.08) !important;
}
.cod-chip-soft {
  border-color: rgba(var(--cod-brand), 0.14);
  background: rgba(var(--cod-brand), 0.06) !important;
}
.cod-sub {
  margin-top: 6px;
}
.cod-total-label {
  opacity: 0.85;
}
.cod-total {
  font-weight: 950;
  font-size: 34px;
  line-height: 1.05;
  color: rgba(var(--v-theme-on-surface), 0.92);
}
.cod-close {
  position: absolute;
  right: 10px;
  top: 8px;
}

/* BODY */
.cod-body {
  padding: 16px;
  background: rgba(var(--cod-brand), 0.02);
}
.cod-panel {
  border: 1px solid rgba(var(--cod-brand), 0.14);
  background: rgba(var(--v-theme-surface), 0.86);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  padding: 14px;
}
.cod-sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

/* paycards */
.cod-paygrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
@media (max-width: 959px) {
  .cod-paygrid {
    grid-template-columns: 1fr;
  }
}

.cod-paycard {
  appearance: none;
  border: 1px solid rgba(var(--cod-brand), 0.16);
  background: rgba(var(--cod-brand), 0.04);
  border-radius: 14px;
  padding: 12px;
  display: grid;
  grid-template-columns: 40px 1fr 26px;
  gap: 10px;
  align-items: center;
  cursor: pointer;
  text-align: left;
  transition: transform 0.08s ease, border-color 0.12s ease, background 0.12s ease;
}
.cod-paycard:hover {
  transform: translateY(-1px);
  border-color: rgba(var(--cod-brand), 0.35);
  background: rgba(var(--cod-brand), 0.06);
}
.cod-paycard.active {
  border-color: rgba(var(--cod-brand), 0.55);
  background: rgba(var(--cod-brand), 0.12);
}
.cod-paycard .ic {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--cod-brand), 0.14);
  color: rgba(var(--cod-brand), 0.95);
}
.cod-paycard.active .ic {
  background: rgba(var(--cod-brand), 0.18);
  border-color: rgba(var(--cod-brand), 0.28);
}
.cod-paycard .tx .t {
  font-weight: 950;
  line-height: 1.1;
}
.cod-paycard .tx .s {
  font-size: 0.78rem;
  opacity: 0.78;
  margin-top: 2px;
}
.cod-paycard .chk {
  opacity: 0.9;
  color: rgba(var(--cod-brand), 0.95);
}

.cod-select :deep(.v-field) {
  border-radius: 12px;
}
.cod-installment-chip {
  margin-top: 8px;
}

/* cash box */
.cod-cashbox {
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(var(--cod-brand), 0.18);
  background: rgba(var(--cod-brand), 0.04);
}
.cod-cash-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.cod-cash-input :deep(input) {
  font-size: 22px;
  font-weight: 950;
  letter-spacing: 0.5px;
}
.cod-chip-ok {
  border-color: rgba(76, 175, 80, 0.35) !important;
  background: rgba(76, 175, 80, 0.14) !important;
}
.cod-chip-bad {
  border-color: rgba(244, 67, 54, 0.35) !important;
  background: rgba(244, 67, 54, 0.12) !important;
}
.cod-quick {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

/* summary items */
.cod-item {
  border: 1px solid rgba(var(--cod-brand), 0.12);
  background: rgba(var(--v-theme-surface), 0.92);
}
.cod-border {
  border: 1px solid rgba(var(--cod-brand), 0.18);
  border-radius: 10px;
}
.cod-noimg {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: rgba(var(--cod-brand), 0.06);
}
.cod-item-title {
  font-weight: 950;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cod-item-sub {
  font-size: 0.78rem;
  opacity: 0.82;
}
.cod-item-amt {
  font-weight: 950;
}
.cod-sum-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

/* footer sticky */
.cod-actions {
  padding: 14px 16px;
  position: sticky;
  bottom: 0;
  background: rgba(var(--v-theme-surface), 0.92);
  border-top: 1px solid rgba(var(--cod-brand), 0.14);
  backdrop-filter: blur(10px);
}
.cod-confirm {
  font-weight: 950;
}

/* mobile */
@media (max-width: 520px) {
  .cod-body {
    padding: 12px;
  }
  .cod-panel {
    padding: 12px;
  }
  .cod-hero {
    padding: 14px 14px 12px;
  }
  .cod-total {
    font-size: 28px;
  }
}
</style>