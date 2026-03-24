<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/CheckoutDialog.vue -->

<template>
  <v-dialog v-model="openLocal" max-width="920" persistent class="cod-dialog">
    <v-card rounded="xl" class="cod-root">
      <!-- HERO -->
      <div class="cod-hero">
        <div class="cod-hero-left">
          <div class="cod-title-row">
            <div class="cod-title text-h6 font-weight-black">Cobro</div>

            <v-chip size="small" variant="tonal" class="cod-chip">
              <v-icon start size="14">mdi-cart</v-icon>
              Ítems: <b class="ml-1">{{ cartUi.length }}</b>
            </v-chip>

            <v-chip size="small" variant="tonal" class="cod-chip">
              <v-icon start size="14">mdi-eye-outline</v-icon>
              Preview: <b class="ml-1">{{ money(previewSafe) }}</b>
            </v-chip>

            <v-chip v-if="ui.showInstallmentsChip" size="small" variant="tonal" class="cod-chip cod-chip-soft">
              <v-icon start size="14">mdi-credit-card-outline</v-icon>
              {{ state.installments }} × <b class="ml-1">{{ money(ui.perInstallmentList) }}</b>
            </v-chip>

            <v-chip v-if="ui.showCardKindChip" size="small" variant="tonal" class="cod-chip cod-chip-soft">
              <v-icon start size="14">{{ ui.cardKindIcon }}</v-icon>
              {{ ui.cardKindLabel }}
            </v-chip>
          </div>
        </div>

        <div class="cod-hero-right">
          <div class="cod-total-label text-caption text-medium-emphasis">Total</div>
          <div class="cod-total">{{ money(totalSafe) }}</div>
        </div>

        <v-btn icon variant="tonal" density="comfortable" class="cod-close" @click="closeNow" title="Cerrar">
          <v-icon size="18">mdi-close</v-icon>
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

                <v-chip size="small" variant="tonal" class="cod-chip cod-chip-soft">
                  {{ policyLabel }}
                </v-chip>
              </div>

              <v-divider class="my-3" />

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
                    <div class="t">Tarjeta</div>
                  </div>
                  <div class="chk">
                    <v-icon v-if="state.paymentMethod === 'CARD'">mdi-check-circle</v-icon>
                    <v-icon v-else>mdi-circle-outline</v-icon>
                  </div>
                </button>

                <button
                  type="button"
                  class="cod-paycard"
                  :class="{ active: state.paymentMethod === 'credit_sjt' }"
                  @click="onPaymentMethodChange('credit_sjt')"
                >
                  <div class="ic"><v-icon>mdi-handshake-outline</v-icon></div>
                  <div class="tx">
                    <div class="t">San Juan Crédito</div>
                  </div>
                  <div class="chk">
                    <v-icon v-if="state.paymentMethod === 'credit_sjt'">mdi-check-circle</v-icon>
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
                  </div>
                  <div class="chk">
                    <v-icon v-if="state.paymentMethod === 'TRANSFER'">mdi-check-circle</v-icon>
                    <v-icon v-else>mdi-circle-outline</v-icon>
                  </div>
                </button>

                <button
                  type="button"
                  class="cod-paycard"
                  :class="{ active: state.paymentMethod === 'MERCADOPAGO' }"
                  @click="onPaymentMethodChange('MERCADOPAGO')"
                >
                  <div class="ic"><v-icon>mdi-qrcode-scan</v-icon></div>
                  <div class="tx">
                    <div class="t">Mercado Pago (QR)</div>
                  </div>
                  <div class="chk">
                    <v-icon v-if="state.paymentMethod === 'MERCADOPAGO'">mdi-check-circle</v-icon>
                    <v-icon v-else>mdi-circle-outline</v-icon>
                  </div>
                </button>
              </div>

              <v-row dense class="mt-2">
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
                </v-col>

                <v-col cols="12" md="6" v-if="ui.showCardKindSelect">
                  <v-select
                    v-model="state.cardKind"
                    :items="cardKindItems"
                    item-title="title"
                    item-value="value"
                    label="Tipo de tarjeta"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    class="cod-select"
                    @update:modelValue="onCardKindChange"
                  />
                </v-col>

                <v-col cols="12" md="6" v-if="ui.showInstallmentsSelect">
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

                  <div v-if="Number(state.installments || 1) > 1" class="cod-installment-chip">
                    <v-chip size="small" variant="tonal" class="cod-chip cod-chip-soft">
                      {{ state.installments }} × <b class="ml-1">{{ money(ui.perInstallmentList) }}</b>
                    </v-chip>
                  </div>
                </v-col>
              </v-row>

              <v-divider class="my-3" />

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
                      <v-icon start size="14">{{ cashShort ? "mdi-alert-circle" : "mdi-cash-refund" }}</v-icon>
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
                    <v-avatar rounded="lg" size="40" class="cod-border">
                      <v-img v-if="it._img" :src="it._img" cover />
                      <div v-else class="cod-noimg">
                        <v-icon size="18">mdi-package-variant</v-icon>
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
        <v-btn variant="tonal" size="small" @click="closeNow">Cancelar</v-btn>
        <v-spacer />
        <v-btn color="primary" variant="flat" class="cod-confirm" :disabled="cannotConfirmFinal" @click="onConfirm">
          <v-icon start size="16">mdi-check</v-icon>
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

  paymentMethod: { type: String, default: "CASH" },
  installments: { type: Number, default: 1 },
  installmentsItems: { type: Array, default: () => [] },
  applyReseller: { type: Boolean, default: false },
  cashInput: { type: String, default: "" },

  cardKind: { type: String, default: "CREDIT" },
});

const emit = defineEmits([
  "update:open",
  "update:paymentMethod",
  "update:installments",
  "update:applyReseller",
  "update:cashInput",
  "update:cardKind",
  "confirm",
  "cancel",
]);

function toDigitsOnly(v) {
  return String(v ?? "").replace(/[^\d]/g, "");
}
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function money(v) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(toNum(v));
}
function qty3(n) {
  return toNum(n).toFixed(3);
}
function formatMiles(n) {
  if (!n) return "";
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Number(n));
}
function buildInstallments(maxN) {
  const n = Math.max(1, Math.min(36, Number(maxN || 1)));
  const out = [];
  for (let i = 1; i <= n; i++) out.push({ title: i === 1 ? "1 pago" : `${i} cuotas`, value: i });
  return out;
}

const cardKindItems = [
  { title: "Crédito", value: "CREDIT" },
  { title: "Débito", value: "DEBIT" },
];

const state = reactive({
  paymentMethod: props.paymentMethod || "CASH",
  installments: Number(props.installments || 1),
  applyReseller: !!props.applyReseller,
  cashDigits: toDigitsOnly(props.cashInput),
  cardKind: String(props.cardKind || "CREDIT").toUpperCase() === "DEBIT" ? "DEBIT" : "CREDIT",
});

const openLocal = computed({
  get: () => props.open,
  set: (v) => emit("update:open", v),
});

function pickPrice(it) {
  const x = it || {};
  const qty = toNum(x.qty || 0);

  const reseller = toNum(x.price_reseller ?? x.reseller_price ?? x.priceReseller ?? x.resellerPrice);
  const list = toNum(x.price_list ?? x.list_price ?? x.priceList ?? x.listPrice);
  const discount = toNum(x.price_discount ?? x.discount_price ?? x.priceDiscount ?? x.discountPrice);
  const base = toNum(x.price ?? x.unit_price ?? x.unitPrice);

  const isCard = state.paymentMethod === "CARD";
  const isSj = state.paymentMethod === "credit_sjt";

  const inst = Number(state.installments || 1);
  const isDebit = isCard && state.cardKind === "DEBIT";
  const isListMode = !state.applyReseller && ((isCard && !isDebit && inst > 1) || isSj);

  let unit = 0;
  if (state.applyReseller && reseller > 0) unit = reseller;
  else if (isListMode && list > 0) unit = list;
  else if (discount > 0) unit = discount;
  else if (list > 0) unit = list;
  else unit = base;

  const unitList = list > 0 ? list : discount > 0 ? discount : base;

  return { unit, unitList, subtotal: unit * qty, subtotalList: unitList * qty };
}

function itemImageRaw(it) {
  const x = it || {};
  const p = x.product || x.Product || {};
  return x.image || x.image_url || x.imageUrl || x.thumb || x.thumbnail || p.image || p.image_url || p.imageUrl || "";
}
function itemImage(it) {
  const s = String(itemImageRaw(it) || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s.replace(/^http:\/\//i, "https://");
  if (s.startsWith("//")) return `https:${s}`;
  return s;
}

const cartUi = computed(() =>
  (Array.isArray(props.cart) ? props.cart : []).map((it, i) => {
    const p = pickPrice(it);
    const key = it?.id ?? it?.product_id ?? it?.sku ?? `${it?.name ?? "item"}_${i}`;
    return {
      ...it,
      _key: key,
      _img: itemImage(it),
      _unit: p.unit,
      _subtotal: p.subtotal,
      _unitList: p.unitList,
      _subtotalList: p.subtotalList,
    };
  })
);

const totalSafe = computed(() => cartUi.value.reduce((a, it) => a + toNum(it._subtotal), 0) || toNum(props.total));
const previewSafe = computed(() => toNum(props.totalPreview) || totalSafe.value || toNum(props.total));
const totalListSafe = computed(() => cartUi.value.reduce((a, it) => a + toNum(it._subtotalList), 0) || totalSafe.value);

const policyLabel = computed(() => {
  if (state.applyReseller) return "Revendedor";
  if (state.paymentMethod === "credit_sjt") return "Lista";
  if (state.paymentMethod === "CARD") {
    if (state.cardKind === "DEBIT") return "Descuento";
    return Number(state.installments || 1) > 1 ? "Lista" : "Descuento";
  }
  return "Descuento";
});

const installmentsItemsSafe = computed(() => {
  const raw = Array.isArray(props.installmentsItems) ? props.installmentsItems : [];
  if (raw.length && typeof raw[0] === "object") return raw;

  if (state.paymentMethod === "credit_sjt") return buildInstallments(12);
  if (state.paymentMethod === "CARD") return state.cardKind === "DEBIT" ? buildInstallments(1) : buildInstallments(6);
  return buildInstallments(1);
});

const ui = computed(() => {
  const isCash = state.paymentMethod === "CASH";
  const isCard = state.paymentMethod === "CARD";
  const isSj = state.paymentMethod === "credit_sjt";
  const isCardLike = isCard || isSj;

  const isDebit = isCard && state.cardKind === "DEBIT";
  const showCardKindSelect = isCard && !state.applyReseller;

  const showInstallmentsSelect = isCardLike && !state.applyReseller && (!isCard || !isDebit);

  const showInstallmentsChip =
    isCardLike && !state.applyReseller && Number(state.installments || 1) > 1 && (!isCard || !isDebit);

  const k = Number(state.installments || 1);
  const perInstallmentList = k > 1 ? totalListSafe.value / k : 0;

  const showCardKindChip = isCardLike && !state.applyReseller;
  const cardKindLabel = isSj ? "Crédito" : isDebit ? "Débito" : "Crédito";
  const cardKindIcon = isDebit ? "mdi-credit-card-chip-outline" : "mdi-credit-card-outline";

  return {
    isCash,
    isCardLike,
    isDebit,
    showCardKindSelect,
    showInstallmentsSelect,
    showInstallmentsChip,
    perInstallmentList,
    showCardKindChip,
    cardKindLabel,
    cardKindIcon,
  };
});

const cashReceived = computed(() => toNum(state.cashDigits));
const cashDisplay = computed(() => (cashReceived.value ? formatMiles(cashReceived.value) : ""));
const change = computed(() => cashReceived.value - totalSafe.value);
const cashShort = computed(() => ui.value.isCash && change.value < 0);

function onCashFormattedInput(v) {
  const digits = toDigitsOnly(v);
  state.cashDigits = digits;
  emit("update:cashInput", digits);
}
function roundUp(n, step) {
  const x = Number(n || 0);
  const s = Number(step || 1);
  return s > 0 ? Math.ceil(x / s) * s : x;
}
function quickCash(v) {
  const digits = String(Math.max(0, Math.trunc(Number(v || 0))));
  state.cashDigits = digits;
  emit("update:cashInput", digits);
}

function normalizeCardKind(v) {
  const k = String(v || "").toUpperCase();
  return k === "DEBIT" ? "DEBIT" : "CREDIT";
}

function onPaymentMethodChange(v) {
  state.paymentMethod = v;
  emit("update:paymentMethod", v);

  if (v !== "CASH" && state.cashDigits) {
    state.cashDigits = "";
    emit("update:cashInput", "");
  }

  if (v === "CARD") {
    state.cardKind = normalizeCardKind(state.cardKind);
    emit("update:cardKind", state.cardKind);
    if (state.cardKind === "DEBIT") {
      state.installments = 1;
      emit("update:installments", 1);
    } else if (!Number(state.installments || 1)) {
      state.installments = 1;
      emit("update:installments", 1);
    }
    return;
  }

  if (v === "credit_sjt") {
    state.cardKind = "CREDIT";
    emit("update:cardKind", "CREDIT");
    if (!Number(state.installments || 1)) {
      state.installments = 1;
      emit("update:installments", 1);
    }
    return;
  }

  state.installments = 1;
  emit("update:installments", 1);
}

function onCardKindChange(v) {
  state.cardKind = normalizeCardKind(v);
  emit("update:cardKind", state.cardKind);

  if (state.cardKind === "DEBIT") {
    state.installments = 1;
    emit("update:installments", 1);
  }
}

function onInstallmentsChange(v) {
  const n = Number(v || 1);

  if (state.paymentMethod === "CARD" && state.cardKind === "DEBIT" && n > 1) {
    state.installments = 1;
    emit("update:installments", 1);
    return;
  }

  state.installments = n;
  emit("update:installments", state.installments);
}

function onApplyResellerChange(v) {
  state.applyReseller = !!v;
  emit("update:applyReseller", state.applyReseller);
  if (state.applyReseller) {
    state.installments = 1;
    emit("update:installments", 1);
  }
}

const cannotConfirmFinal = computed(() => ui.value.isCash && cashReceived.value < totalSafe.value);

function closeNow() {
  emit("update:open", false);
  emit("cancel");
}

function onConfirm() {
  emit("confirm", {
    payment_method: state.paymentMethod,
    card_kind: state.paymentMethod === "CARD" ? state.cardKind : "CREDIT",
    installments: Number(state.installments || 1),
    apply_reseller: !!state.applyReseller,
    cash_received: cashReceived.value,
    change: change.value > 0 ? change.value : 0,
    total: totalSafe.value,
    total_preview: previewSafe.value,
    total_list: totalListSafe.value,
    per_installment_list: ui.value.perInstallmentList,
  });
}

function onKeydownDialog(e) {
  if (!openLocal.value) return;
  const k = String(e.key || "").toLowerCase();
  if (k === "f8" || k === "escape") {
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    closeNow();
  }
}
onMounted(() => window.addEventListener("keydown", onKeydownDialog, { capture: true }));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydownDialog, { capture: true }));

watch(
  () => props.paymentMethod,
  (v) => (state.paymentMethod = v || "CASH")
);
watch(
  () => props.installments,
  (v) => (state.installments = Number(v || 1))
);
watch(
  () => props.applyReseller,
  (v) => (state.applyReseller = !!v)
);
watch(
  () => props.cashInput,
  (v) => (state.cashDigits = toDigitsOnly(v))
);
watch(
  () => props.cardKind,
  (v) => (state.cardKind = normalizeCardKind(v))
);

watch(
  () => [state.paymentMethod, state.cardKind],
  () => {
    if (state.paymentMethod === "CARD" && state.cardKind === "DEBIT" && Number(state.installments || 1) > 1) {
      state.installments = 1;
      emit("update:installments", 1);
    }
    if (state.paymentMethod === "credit_sjt" && state.cardKind !== "CREDIT") {
      state.cardKind = "CREDIT";
      emit("update:cardKind", "CREDIT");
    }
  }
);
</script>

<style scoped>
.cod-root {
  overflow: hidden;
  --cod-brand: 42, 133, 196;
  border-radius: 16px !important;
}

.cod-dialog :deep(.v-overlay__content) {
  max-height: min(90vh, 900px);
}

.cod-dialog :deep(.v-card) {
  max-height: min(90vh, 900px);
}

/* HERO */
.cod-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 10px;
  padding: 10px 12px 8px;
  position: relative;
  background: linear-gradient(
    180deg,
    rgba(var(--cod-brand), 0.11),
    rgba(var(--cod-brand), 0.04),
    rgba(var(--v-theme-surface), 0.98)
  );
}

.cod-hero-left {
  min-width: 0;
  padding-right: 34px;
}

.cod-hero-right {
  text-align: right;
  padding-top: 1px;
  min-width: 150px;
}

.cod-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
}

.cod-title {
  margin-right: 2px;
  font-size: 1.02rem !important;
  line-height: 1.05;
}

.cod-chip {
  border: 1px solid rgba(var(--cod-brand), 0.14);
  background: rgba(var(--cod-brand), 0.065) !important;
  min-height: 24px;
  font-size: 0.73rem !important;
}

.cod-chip-soft {
  border-color: rgba(var(--cod-brand), 0.11);
  background: rgba(var(--cod-brand), 0.045) !important;
}

.cod-total-label {
  opacity: 0.75;
  font-size: 0.72rem !important;
  margin-bottom: 1px;
}

.cod-total {
  font-weight: 950;
  font-size: 20px;
  line-height: 1;
  letter-spacing: -0.02em;
  color: rgba(var(--v-theme-on-surface), 0.95);
}

.cod-close {
  position: absolute;
  right: 8px;
  top: 8px;
  width: 30px !important;
  height: 30px !important;
  min-width: 30px !important;
  z-index: 2;
  border: 1px solid rgba(var(--cod-brand), 0.14);
  background: rgba(var(--v-theme-surface), 0.9) !important;
  color: rgba(var(--v-theme-on-surface), 0.85) !important;
}

/* BODY */
.cod-body {
  padding: 10px 12px;
  background: rgba(var(--cod-brand), 0.014);
}

.cod-grid {
  margin-top: 0 !important;
}

.cod-panel {
  border: 1px solid rgba(var(--cod-brand), 0.11);
  background: rgba(var(--v-theme-surface), 0.96);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.03);
  padding: 10px;
}

.cod-panel-left,
.cod-panel-right {
  min-height: 100%;
}

.cod-sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cod-sec-head .text-subtitle-1 {
  font-size: 0.93rem !important;
  line-height: 1.05;
}

.cod-panel .text-caption {
  font-size: 0.72rem !important;
  line-height: 1.25;
}

/* paycards */
.cod-paygrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}

@media (max-width: 959px) {
  .cod-paygrid {
    grid-template-columns: 1fr;
  }
}

.cod-paycard {
  appearance: none;
  border: 1px solid rgba(var(--cod-brand), 0.13);
  background: rgba(var(--cod-brand), 0.03);
  border-radius: 11px;
  padding: 8px 10px;
  display: grid;
  grid-template-columns: 32px 1fr 20px;
  gap: 8px;
  align-items: center;
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.08s ease,
    border-color 0.12s ease,
    background 0.12s ease,
    box-shadow 0.12s ease;
  min-height: 60px;
}

.cod-paycard:hover {
  transform: translateY(-1px);
  border-color: rgba(var(--cod-brand), 0.26);
  background: rgba(var(--cod-brand), 0.045);
}

.cod-paycard.active {
  border-color: rgba(var(--cod-brand), 0.42);
  background: rgba(var(--cod-brand), 0.085);
  box-shadow: 0 4px 12px rgba(var(--cod-brand), 0.07);
}

.cod-paycard .ic {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: rgba(var(--v-theme-on-surface), 0.028);
  border: 1px solid rgba(var(--cod-brand), 0.11);
  color: rgba(var(--cod-brand), 0.95);
}

.cod-paycard .ic :deep(.v-icon) {
  font-size: 18px;
}

.cod-paycard.active .ic {
  background: rgba(var(--cod-brand), 0.14);
  border-color: rgba(var(--cod-brand), 0.22);
}

.cod-paycard .tx .t {
  font-weight: 850;
  line-height: 1.05;
  font-size: 0.88rem;
}

.cod-paycard .chk {
  opacity: 0.92;
  color: rgba(var(--cod-brand), 0.95);
}

.cod-paycard .chk :deep(.v-icon) {
  font-size: 20px;
}

.cod-select :deep(.v-field) {
  border-radius: 10px;
  min-height: 38px;
}

.cod-select :deep(.v-field__input) {
  min-height: 38px;
  padding-top: 6px;
  padding-bottom: 6px;
  font-size: 0.88rem;
}

.cod-installment-chip {
  margin-top: 5px;
}

.cod-reseller {
  margin-top: -2px;
}

.cod-cashbox {
  padding: 9px;
  border-radius: 12px;
  border: 1px solid rgba(var(--cod-brand), 0.14);
  background: rgba(var(--cod-brand), 0.03);
}

.cod-cash-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 7px;
}

.cod-cash-input :deep(.v-field) {
  border-radius: 10px;
}

.cod-cash-input :deep(input) {
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0.2px;
}

.cod-chip-ok {
  border-color: rgba(76, 175, 80, 0.32) !important;
  background: rgba(76, 175, 80, 0.12) !important;
}

.cod-chip-bad {
  border-color: rgba(244, 67, 54, 0.32) !important;
  background: rgba(244, 67, 54, 0.1) !important;
}

.cod-quick {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 7px;
}

/* summary items */
.cod-item {
  border: 1px solid rgba(var(--cod-brand), 0.09);
  background: rgba(var(--v-theme-surface), 0.98);
  min-height: 58px !important;
  padding-inline: 6px !important;
}

.cod-border {
  border: 1px solid rgba(var(--cod-brand), 0.13);
  border-radius: 9px;
}

.cod-noimg {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: rgba(var(--cod-brand), 0.045);
}

.cod-item-title {
  font-weight: 850;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.84rem;
}

.cod-item-sub {
  font-size: 0.7rem;
  opacity: 0.78;
  line-height: 1.15;
}

.cod-item-amt {
  font-weight: 900;
  font-size: 0.86rem;
}

.cod-sum-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.cod-sum-row b {
  font-size: 0.9rem;
}

/* footer */
.cod-actions {
  padding: 8px 12px;
  position: sticky;
  bottom: 0;
  background: rgba(var(--v-theme-surface), 0.96);
  border-top: 1px solid rgba(var(--cod-brand), 0.11);
  backdrop-filter: blur(8px);
}

.cod-actions :deep(.v-btn) {
  min-height: 38px;
}

.cod-confirm {
  font-weight: 900;
  padding-inline: 16px !important;
  min-width: 190px;
}

/* desktop tighter */
@media (min-width: 960px) {
  .cod-dialog :deep(.v-overlay__content) {
    width: min(920px, calc(100vw - 34px)) !important;
  }

  .cod-body {
    max-height: calc(90vh - 138px);
    overflow: auto;
  }
}

/* tablet */
@media (max-width: 959px) {
  .cod-hero {
    grid-template-columns: 1fr;
  }

  .cod-hero-right {
    text-align: left;
    min-width: 0;
  }

  .cod-total {
    font-size: 19px;
  }

  .cod-body {
    max-height: calc(90vh - 146px);
    overflow: auto;
  }
}

/* mobile */
@media (max-width: 600px) {
  .cod-hero {
    padding: 10px 10px 8px;
    gap: 8px;
  }

  .cod-title {
    font-size: 0.96rem !important;
  }

  .cod-total {
    font-size: 18px;
  }

  .cod-body {
    padding: 9px;
  }

  .cod-panel {
    padding: 9px;
  }

  .cod-paycard {
    min-height: 56px;
    padding: 8px 9px;
    grid-template-columns: 30px 1fr 18px;
  }

  .cod-paycard .ic {
    width: 30px;
    height: 30px;
    border-radius: 9px;
  }

  .cod-paycard .tx .t {
    font-size: 0.84rem;
  }

  .cod-actions {
    padding: 8px 10px;
  }

  .cod-confirm {
    min-width: 0;
    width: 100%;
  }
}
</style>