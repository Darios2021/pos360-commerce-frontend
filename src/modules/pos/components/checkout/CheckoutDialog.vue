<template>
  <v-dialog v-model="openLocal" max-width="1100" persistent>
    <v-card class="ck-root">

      <!-- HEADER: title + segmented progress + total + close -->
      <div class="ck-hdr">
        <div class="ck-hdr-left">
          <span class="ck-hdr-title">COBRO POS</span>
          <div class="ck-progress">
            <template v-for="(item, idx) in screenSteps" :key="item.key">
              <div
                class="ck-prog-step"
                :class="{
                  active: currentScreen === item.key,
                  done: screenIndex(item.key) < currentScreenIndex,
                }"
              >
                <div class="ck-prog-dot">
                  <v-icon v-if="screenIndex(item.key) < currentScreenIndex" size="10">mdi-check</v-icon>
                  <span v-else>{{ idx + 1 }}</span>
                </div>
                <span class="ck-prog-label">{{ item.label }}</span>
              </div>
              <div
                v-if="idx < screenSteps.length - 1"
                class="ck-prog-line"
                :class="{ done: screenIndex(item.key) < currentScreenIndex }"
              />
            </template>
          </div>
        </div>

        <div class="ck-hdr-right">
          <div class="ck-hdr-total">
            <span class="ck-hdr-total-lbl">TOTAL</span>
            <span class="ck-hdr-total-val">{{ money(totalSafe) }}</span>
          </div>
          <v-btn icon variant="text" size="small" :disabled="confirmBusy" @click="closeNow">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- BODY: always split left + right -->
      <div class="ck-body">
        <section class="ck-body-main">
          <PaymentMethodScreen
            v-if="currentScreen === 'payment-method'"
            ref="paymentMethodScreenRef"
            :state="state"
            :visible-payment-methods="visiblePaymentMethods"
            :selected-method="selectedMethod"
            :method-label="methodLabel"
            :method-icon="methodIcon"
            :cursor-index="methodCursor"
            :cursor-target="methodCursorTarget"
            :selector-active="paymentSelectorActive"
            @select-single-method="selectSingleMethod"
            @toggle-mixed-mode="toggleMixedMode"
            @move-cursor="moveMethodCursor"
            @next="goNextFromPaymentMethod"
            @back="goPrevScreen"
          />

          <PaymentConfigScreen
            v-else-if="currentScreen === 'payment-config'"
            ref="paymentConfigScreenRef"
            :state="state"
            :selected-method="selectedMethod"
            :single-installment-items="singleInstallmentItems"
            :mixed-method-items="mixedMethodItems"
            :single-uses-cash-entry="singleUsesCashEntry"
            :single-missing="singleMissing"
            :single-change="singleChange"
            :total-safe="totalSafe"
            :mixed-paid="mixedPaid"
            :mixed-missing="mixedMissing"
            :mixed-change="mixedChange"
            :cash-error-final="cashErrorFinal"
            :cash-error-msg-final="cashErrorMsgFinal"
            :method-label="methodLabel"
            :method-needs-card-kind="methodNeedsCardKind"
            :method-supports-installments="methodSupportsInstallments"
            :method-needs-reference="methodNeedsReference"
            :row-method-needs-card-kind="rowMethodNeedsCardKind"
            :row-method-supports-installments="rowMethodSupportsInstallments"
            :row-method-needs-reference="rowMethodNeedsReference"
            :mixed-installment-items="mixedInstallmentItems"
            :mixed-row-amount-error="mixedRowAmountError"
            :money="money"
            :single-cash-ref="singleCashRef"
            :set-mixed-amount-ref="setMixedAmountRef"
            @quick-cash="quickCash"
            @set-card-kind="setCardKind"
            @add-mixed-row="addMixedRow"
            @remove-mixed-row="removeMixedRow"
            @next="goNextFromPaymentConfig"
            @back="goPrevScreen"
          />

          <InvoiceModeScreen
            v-else-if="currentScreen === 'invoice-mode'"
            ref="invoiceModeScreenRef"
            :state="state"
            @next="goNextFromInvoiceMode"
            @back="goPrevScreen"
          />

          <CustomerScreen
            v-else-if="currentScreen === 'customer'"
            ref="customerScreenRef"
            :state="state"
            :customer-name-ref="customerNameRef"
            :customer-name="customerName"
            :customer-doc="customerDoc"
            :customer-phone="customerPhone"
            @update:customer-name="customerName = $event"
            @update:customer-doc="customerDoc = $event"
            @update:customer-phone="customerPhone = $event"
            @next="goNextFromCustomer"
            @back="goPrevScreen"
          />

          <ConfirmScreen
            v-else-if="currentScreen === 'confirm'"
            ref="confirmScreenRef"
            :state="state"
            :selected-method="selectedMethod"
            :payment-summary-label="paymentSummaryLabel"
            :invoice-mode-label="invoiceModeLabel"
            :customer-name="customerName"
            :customer-doc="customerDoc"
            :customer-phone="customerPhone"
            :paid-safe="paidSafe"
            :change-safe="changeSafe"
            :preview-safe="previewSafe"
            :total-safe="totalSafe"
            :money="money"
            @confirm="onConfirm"
            @back="goPrevScreen"
          />
        </section>

        <!-- RIGHT: receipt summary, always visible -->
        <aside class="ck-body-aside">
          <CheckoutSummary
            :cart-ui="cartUi"
            :total-safe="totalSafe"
            :preview-safe="previewSafe"
            :paid-safe="paidSafe"
            :change-safe="changeSafe"
            :money="money"
            :to-num="toNum"
            :show-items="true"
            :show-prices="true"
          />
        </aside>
      </div>

      <!-- FOOTER: keyboard hint + big action buttons -->
      <div class="ck-ftr">
        <div class="ck-ftr-hint">
          <v-icon size="13">mdi-keyboard-outline</v-icon>
          {{ footerHint }}
        </div>
        <div class="ck-ftr-actions">
          <v-btn
            class="ck-act ck-act--back"
            variant="outlined"
            :disabled="backDisabled || confirmBusy"
            @click="goPrevScreen"
          >
            <div class="ck-act-key"><v-icon size="22">mdi-keyboard-backspace</v-icon></div>
            <div class="ck-act-text">
              <span class="ck-act-main">BORRAR</span>
              <span class="ck-act-sub">Atrás</span>
            </div>
          </v-btn>

          <v-btn
            class="ck-act ck-act--enter"
            color="primary"
            :disabled="primaryDisabled || confirmBusy"
            :loading="confirmBusy && currentScreen === 'confirm'"
            @click="handlePrimaryAction"
          >
            <div class="ck-act-key"><v-icon size="22">mdi-keyboard-return</v-icon></div>
            <div class="ck-act-text">
              <span class="ck-act-main">ENTER</span>
              <span class="ck-act-sub">{{ currentScreen === 'confirm' ? 'Confirmar' : primaryLabel }}</span>
            </div>
          </v-btn>
        </div>
      </div>

    </v-card>
  </v-dialog>
</template>

<script setup>
import {
  computed,
  reactive,
  watch,
  ref,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from "vue";

import PaymentMethodScreen from "./screens/PaymentMethodScreen.vue";
import PaymentConfigScreen from "./screens/PaymentConfigScreen.vue";
import InvoiceModeScreen from "./screens/InvoiceModeScreen.vue";
import CustomerScreen from "./screens/CustomerScreen.vue";
import ConfirmScreen from "./screens/ConfirmScreen.vue";

import CheckoutSummary from "./summary/CheckoutSummary.vue";

const props = defineProps({
  open: { type: Boolean, default: false },

  cart: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  totalPreview: { type: Number, default: 0 },

  paymentMethods: { type: Array, default: () => [] },
  paymentMethodId: { type: [Number, String, null], default: null },

  installments: { type: Number, default: 1 },
  applyReseller: { type: Boolean, default: false },
  paymentProof: { type: String, default: "" },
  cashInput: { type: [String, Number], default: "" },
  cardKind: { type: String, default: "CREDIT" },

  mixedMode: { type: Boolean, default: false },
  mixedPayments: {
    type: Array,
    default: () => [],
  },

  invoiceMode: { type: String, default: "MIXED" },
  invoiceType: { type: String, default: "B" },
  customerType: { type: String, default: "CONSUMIDOR_FINAL" },

  customerNameValue: { type: String, default: "" },
  customerDocValue: { type: String, default: "" },
  customerPhoneValue: { type: String, default: "" },

  cashError: { type: Boolean, default: false },
  cashErrorMsg: { type: String, default: "" },

  confirmLoading: { type: Boolean, default: false },
});

const emit = defineEmits([
  "update:open",
  "update:paymentMethodId",
  "update:installments",
  "update:applyReseller",
  "update:paymentProof",
  "update:cashInput",
  "update:cardKind",
  "update:mixedMode",
  "update:mixedPayments",
  "update:invoiceMode",
  "update:invoiceType",
  "update:customerType",
  "confirm",
  "cancel",
]);

function toNum(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function money(val) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(Number(val || 0));
}

function parseAmount(v) {
  if (v === null || v === undefined) return 0;
  const raw = String(v).trim();
  if (!raw) return 0;
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function normalizeCardKind(v, fallback = "CREDIT") {
  const k = String(v || fallback).toUpperCase();
  if (k === "DEBIT") return "DEBIT";
  if (k === "BOTH") return "BOTH";
  if (k === "PREPAID") return "PREPAID";
  return "CREDIT";
}

function normalizeMethod(method = {}) {
  const x = method || {};
  return {
    id: Number(x.id || 0),
    name: String(x.name || "").trim(),
    display_name: String(x.display_name || "").trim(),
    kind: String(x.kind || "OTHER").toUpperCase(),
    pricing_mode: String(x.pricing_mode || "SALE_PRICE").toUpperCase(),
    card_kind: normalizeCardKind(x.card_kind, "CREDIT"),
    supports_installments: !!x.supports_installments,
    min_installments: Number(x.min_installments || 1) || 1,
    max_installments: Number(x.max_installments || 1) || 1,
    default_installments: Number(x.default_installments || 1) || 1,
    installment_plan_json: Array.isArray(x.installment_plan_json)
      ? x.installment_plan_json
      : [],
    requires_reference: !!x.requires_reference,
    allows_change: !!x.allows_change,
    is_active: x.is_active !== false,
    only_ecom: !!x.only_ecom,
  };
}

function methodLabel(method) {
  return method?.display_name || method?.name || "Medio";
}

function methodIcon(method) {
  const kind = String(method?.kind || "").toUpperCase();
  if (kind === "CASH") return "mdi-cash";
  if (kind === "CARD") return "mdi-credit-card-outline";
  if (kind === "TRANSFER") return "mdi-bank-transfer";
  if (kind === "QR") return "mdi-qrcode";
  if (kind === "MERCADOPAGO") return "mdi-qrcode";
  if (kind === "CREDIT_SJT") return "mdi-card-account-details-outline";
  return "mdi-wallet-outline";
}

function methodNeedsReference(method) {
  const kind = String(method?.kind || "").toUpperCase();
  return !!method?.requires_reference || ["TRANSFER", "QR", "MERCADOPAGO"].includes(kind);
}

function methodNeedsCardKind(method) {
  if (String(method?.kind || "").toUpperCase() !== "CARD") return false;
  return String(method?.card_kind || "CREDIT").toUpperCase() === "BOTH";
}

function methodSupportsInstallments(method, effectiveCardKind = null) {
  if (!method) return false;

  const kind = String(method.kind || "").toUpperCase();
  if (kind !== "CARD") return !!method.supports_installments;

  const configuredCardKind = String(method.card_kind || "CREDIT").toUpperCase();
  const effective =
    String(effectiveCardKind || configuredCardKind || "CREDIT").toUpperCase();

  if (configuredCardKind === "DEBIT") return false;
  if (configuredCardKind === "PREPAID") return false;
  if (configuredCardKind === "CREDIT") return !!method.supports_installments;
  if (configuredCardKind === "BOTH") return effective !== "DEBIT";

  return !!method.supports_installments;
}

function methodUsesListPrice(method, effectiveCardKind = null) {
  if (!method) return false;

  const kind = String(method.kind || "").toUpperCase();
  const pricingMode = String(method.pricing_mode || "SALE_PRICE").toUpperCase();

  if (kind !== "CARD") {
    return pricingMode === "LIST_PRICE";
  }

  const configuredCardKind = String(method.card_kind || "CREDIT").toUpperCase();
  const effective =
    String(effectiveCardKind || configuredCardKind || "CREDIT").toUpperCase();

  if (configuredCardKind === "DEBIT") return false;
  if (configuredCardKind === "PREPAID") return false;
  if (configuredCardKind === "CREDIT") return true;
  if (configuredCardKind === "BOTH") {
    return effective !== "DEBIT";
  }

  return pricingMode === "LIST_PRICE";
}

function methodUsesCashEntry(method) {
  return String(method?.kind || "").toUpperCase() === "CASH" || !!method?.allows_change;
}

function buildInstallmentItems(method, effectiveCardKind = null) {
  if (!methodSupportsInstallments(method, effectiveCardKind)) {
    return [{ title: "1 cuota", value: 1 }];
  }

  const plan = Array.isArray(method?.installment_plan_json)
    ? method.installment_plan_json
        .map((x) => Number(x?.installments || 0))
        .filter((n) => Number.isFinite(n) && n > 0)
    : [];

  const uniquePlan = [...new Set(plan)].sort((a, b) => a - b);
  if (uniquePlan.length) {
    return uniquePlan.map((n) => ({
      title: `${n} cuota${n > 1 ? "s" : ""}`,
      value: n,
    }));
  }

  const min = Math.max(1, Number(method?.min_installments || 1));
  const max = Math.max(min, Number(method?.max_installments || min));

  return Array.from({ length: max - min + 1 }, (_, i) => {
    const n = min + i;
    return {
      title: `${n} cuota${n > 1 ? "s" : ""}`,
      value: n,
    };
  });
}

function makeMixedRow(input = {}) {
  return {
    uid: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    payment_method_id: input.payment_method_id ?? null,
    amount: String(input.amount ?? ""),
    installments: Number(input.installments || 1) || 1,
    reference: String(input.reference || ""),
    card_kind: normalizeCardKind(input.card_kind, "CREDIT"),
  };
}

const screenSteps = [
  { key: "payment-method", label: "Pago" },
  { key: "payment-config", label: "Config." },
  { key: "invoice-mode", label: "Factura" },
  { key: "customer", label: "Cliente" },
  { key: "confirm", label: "Confirmar" },
];

const currentScreen = ref("payment-method");

function screenIndex(key) {
  return screenSteps.findIndex((x) => x.key === key);
}

const currentScreenIndex = computed(() => screenIndex(currentScreen.value));

const methodCursor = ref(0);
const methodCursorTarget = ref("method");
const paymentSelectorActive = ref(true);

const singleCashRef = ref(null);
const mixedAmountRef = ref(null);
const customerNameRef = ref(null);

const paymentMethodScreenRef = ref(null);
const paymentConfigScreenRef = ref(null);
const invoiceModeScreenRef = ref(null);
const customerScreenRef = ref(null);
const confirmScreenRef = ref(null);

const confirmingLocal = ref(false);
const confirmBusy = computed(() => !!props.confirmLoading || !!confirmingLocal.value);

function setMixedAmountRef(el) {
  if (el) mixedAmountRef.value = el;
}

const customerName = ref(String(props.customerNameValue || ""));
const customerDoc = ref(String(props.customerDocValue || ""));
const customerPhone = ref(String(props.customerPhoneValue || ""));

const openLocal = computed({
  get: () => props.open,
  set: (v) => emit("update:open", v),
});

const visiblePaymentMethods = computed(() =>
  (Array.isArray(props.paymentMethods) ? props.paymentMethods : [])
    .map(normalizeMethod)
    .filter((x) => x.id && x.is_active && !x.only_ecom)
);

const mixedMethodItems = computed(() =>
  visiblePaymentMethods.value.map((x) => ({
    title: methodLabel(x),
    value: x.id,
  }))
);

function firstMethodId() {
  return visiblePaymentMethods.value[0]?.id || null;
}

function getDefaultMethodIndex() {
  const methods = visiblePaymentMethods.value || [];
  const cashIdx = methods.findIndex(
    (m) => String(m.kind || "").toUpperCase() === "CASH"
  );
  return cashIdx >= 0 ? cashIdx : 0;
}

function normalizeMixedPaymentsInput(list) {
  const rows = Array.isArray(list) ? list.map((x) => makeMixedRow(x)) : [];
  return rows.length ? rows : [makeMixedRow({ payment_method_id: firstMethodId() })];
}

const state = reactive({
  paymentMethodId: props.paymentMethodId != null ? Number(props.paymentMethodId) : null,
  installments: Number(props.installments || 1),
  applyReseller: !!props.applyReseller,
  paymentProof: String(props.paymentProof || ""),
  cashInput: String(props.cashInput ?? ""),
  cardKind: normalizeCardKind(props.cardKind, "CREDIT"),

  mixedMode: !!props.mixedMode,
  mixedPayments: normalizeMixedPaymentsInput(props.mixedPayments),

  invoiceMode: String(props.invoiceMode || "MIXED").toUpperCase(),
  invoiceType: String(props.invoiceType || "B").toUpperCase(),
  customerType: String(props.customerType || "CONSUMIDOR_FINAL").toUpperCase(),
});

const selectedMethod = computed(() => {
  return (
    visiblePaymentMethods.value.find(
      (x) => Number(x.id) === Number(state.paymentMethodId)
    ) || null
  );
});

const singleInstallmentItems = computed(() => {
  if (!selectedMethod.value) return [];
  return buildInstallmentItems(selectedMethod.value, state.cardKind);
});

watch(
  () => visiblePaymentMethods.value,
  (methods) => {
    if (!methods.length) {
      state.paymentMethodId = null;
      methodCursor.value = 0;
      methodCursorTarget.value = "mixed";
      return;
    }

    const exists = methods.some((x) => Number(x.id) === Number(state.paymentMethodId));
    if (!exists) {
      methodCursor.value = getDefaultMethodIndex();
      state.paymentMethodId = methods[methodCursor.value]?.id ?? methods[0].id;
    } else {
      const idx = methods.findIndex((x) => Number(x.id) === Number(state.paymentMethodId));
      methodCursor.value = idx >= 0 ? idx : 0;
    }

    methodCursorTarget.value = state.mixedMode ? "mixed" : "method";
  },
  { immediate: true }
);

watch(
  () => props.open,
  async (v) => {
    if (v) {
      currentScreen.value = "payment-method";
      paymentSelectorActive.value = true;
      confirmingLocal.value = false;

      state.installments = Number(props.installments || 1);
      state.applyReseller = !!props.applyReseller;
      state.paymentProof = String(props.paymentProof || "");
      state.cashInput = String(props.cashInput ?? "");
      state.cardKind = normalizeCardKind(props.cardKind, "CREDIT");

      state.mixedMode = !!props.mixedMode;
      state.mixedPayments = normalizeMixedPaymentsInput(props.mixedPayments);

      state.invoiceMode = String(props.invoiceMode || "MIXED").toUpperCase();
      state.invoiceType = String(props.invoiceType || "B").toUpperCase();
      state.customerType = String(
        props.customerType || "CONSUMIDOR_FINAL"
      ).toUpperCase();

      customerName.value = String(props.customerNameValue || "");
      customerDoc.value = String(props.customerDocValue || "");
      customerPhone.value = String(props.customerPhoneValue || "");

      if (state.mixedMode) {
        methodCursorTarget.value = "mixed";
        if (!state.mixedPayments.length) {
          state.mixedPayments = [makeMixedRow({ payment_method_id: firstMethodId() })];
        }
      } else {
        const preferredIdx = visiblePaymentMethods.value.findIndex(
          (x) => Number(x.id) === Number(props.paymentMethodId)
        );

        methodCursor.value =
          preferredIdx >= 0 ? preferredIdx : getDefaultMethodIndex();

        methodCursorTarget.value = "method";
        state.paymentMethodId =
          visiblePaymentMethods.value[methodCursor.value]?.id ?? null;
      }

      await nextTick();
      focusActiveScreen();
    } else {
      confirmingLocal.value = false;
    }
  }
);

watch(
  () => props.confirmLoading,
  (v) => {
    if (!v) confirmingLocal.value = false;
  }
);

watch(
  selectedMethod,
  (method) => {
    if (!method) return;

    const configuredCardKind = String(method.card_kind || "CREDIT").toUpperCase();

    if (String(method.kind || "").toUpperCase() === "CARD") {
      if (configuredCardKind === "DEBIT") {
        state.cardKind = "DEBIT";
      } else if (configuredCardKind === "CREDIT") {
        state.cardKind = "CREDIT";
      } else if (configuredCardKind === "PREPAID") {
        state.cardKind = "DEBIT";
      } else if (configuredCardKind === "BOTH") {
        state.cardKind = normalizeCardKind(state.cardKind, "CREDIT");
      }
    } else {
      state.cardKind = "CREDIT";
    }

    if (!methodSupportsInstallments(method, state.cardKind)) {
      state.installments = 1;
    } else {
      const items = buildInstallmentItems(method, state.cardKind);
      const exists = items.some((x) => Number(x.value) === Number(state.installments));
      if (!exists) {
        state.installments = Number(method.default_installments || items[0]?.value || 1);
      }
    }

    if (!methodNeedsReference(method)) {
      state.paymentProof = "";
    }
  },
  { immediate: true }
);

watch(
  () => state.cardKind,
  (cardKind) => {
    if (!selectedMethod.value) return;

    if (!methodSupportsInstallments(selectedMethod.value, cardKind)) {
      state.installments = 1;
      return;
    }

    const items = buildInstallmentItems(selectedMethod.value, cardKind);
    const exists = items.some((x) => Number(x.value) === Number(state.installments));
    if (!exists) {
      state.installments = Number(selectedMethod.value.default_installments || items[0]?.value || 1);
    }
  }
);

watch(
  () => state.paymentMethodId,
  (v) => emit("update:paymentMethodId", v != null ? Number(v) : null)
);
watch(() => state.installments, (v) =>
  emit("update:installments", Number(v || 1))
);
watch(() => state.applyReseller, (v) =>
  emit("update:applyReseller", !!v)
);
watch(() => state.paymentProof, (v) => emit("update:paymentProof", v));
watch(() => state.cashInput, (v) => emit("update:cashInput", v));
watch(() => state.cardKind, (v) => emit("update:cardKind", v));

watch(() => state.mixedMode, (v) => emit("update:mixedMode", !!v));
watch(
  () => state.mixedPayments,
  (v) => {
    emit(
      "update:mixedPayments",
      v.map((row) => ({
        payment_method_id: row.payment_method_id != null ? Number(row.payment_method_id) : null,
        amount: row.amount,
        installments: Number(row.installments || 1),
        reference: row.reference || "",
        card_kind: row.card_kind || "CREDIT",
      }))
    );
  },
  { deep: true }
);

watch(() => state.invoiceMode, (v) => emit("update:invoiceMode", v));
watch(() => state.invoiceType, (v) => emit("update:invoiceType", v));
watch(() => state.customerType, (v) => emit("update:customerType", v));

function rowMethod(row) {
  return (
    visiblePaymentMethods.value.find(
      (x) => Number(x.id) === Number(row?.payment_method_id)
    ) || null
  );
}

function rowEffectiveCardKind(row) {
  const method = rowMethod(row);
  if (!method) return "CREDIT";

  const configuredCardKind = String(method.card_kind || "CREDIT").toUpperCase();
  if (configuredCardKind === "DEBIT") return "DEBIT";
  if (configuredCardKind === "PREPAID") return "DEBIT";
  if (configuredCardKind === "CREDIT") return "CREDIT";
  if (configuredCardKind === "BOTH") return normalizeCardKind(row?.card_kind, "CREDIT");

  return normalizeCardKind(row?.card_kind, "CREDIT");
}

function pickPrice(it) {
  const x = it || {};
  const qty = toNum(x.qty || 0);

  const reseller = toNum(
    x.price_reseller ??
      x.reseller_price ??
      x.priceReseller ??
      x.resellerPrice
  );
  const list = toNum(
    x.price_list ?? x.list_price ?? x.priceList ?? x.listPrice
  );
  const discount = toNum(
    x.price_discount ??
      x.discount_price ??
      x.priceDiscount ??
      x.discountPrice
  );
  const base = toNum(x.price ?? x.unit_price ?? x.unitPrice);

  const saleUsesListPrice = computedSaleUsesListPrice.value;

  let unit = 0;
  if (state.applyReseller && reseller > 0) unit = reseller;
  else if (saleUsesListPrice && list > 0) unit = list;
  else if (discount > 0) unit = discount;
  else if (list > 0) unit = list;
  else unit = base;

  const unitList = list > 0 ? list : discount > 0 ? discount : base;

  return {
    unit,
    unitList,
    subtotal: unit * qty,
    subtotalList: unitList * qty,
  };
}

const cartUi = computed(() =>
  (Array.isArray(props.cart) ? props.cart : []).map((it, i) => {
    const p = pickPrice(it);
    const key =
      it?.id ??
      it?.product_id ??
      it?.sku ??
      `${it?.name ?? "item"}_${i}`;

    return {
      ...it,
      _key: key,
      _unit: p.unit,
      _subtotal: p.subtotal,
      _unitList: p.unitList,
      _subtotalList: p.subtotalList,
    };
  })
);

const computedSaleUsesListPrice = computed(() => {
  if (state.applyReseller) return false;

  if (state.mixedMode) {
    return state.mixedPayments.some((row) => {
      const method = rowMethod(row);
      if (!method) return false;
      if (parseAmount(row.amount) <= 0) return false;

      return methodUsesListPrice(method, rowEffectiveCardKind(row));
    });
  }

  if (!selectedMethod.value) return false;
  return methodUsesListPrice(selectedMethod.value, state.cardKind);
});

const totalSafe = computed(
  () =>
    cartUi.value.reduce((a, it) => a + toNum(it._subtotal), 0) ||
    toNum(props.total)
);

const previewSafe = computed(
  () => toNum(props.totalPreview) || totalSafe.value || toNum(props.total)
);

const totalListSafe = computed(
  () =>
    cartUi.value.reduce((a, it) => a + toNum(it._subtotalList), 0) ||
    totalSafe.value
);

const singleUsesCashEntry = computed(() => methodUsesCashEntry(selectedMethod.value));

const singlePaid = computed(() => {
  if (!singleUsesCashEntry.value) return totalSafe.value;
  return parseAmount(state.cashInput);
});

const singleMissing = computed(() => {
  const diff = totalSafe.value - singlePaid.value;
  return diff > 0 ? diff : 0;
});

const singleChange = computed(() => {
  const diff = singlePaid.value - totalSafe.value;
  return diff > 0 ? diff : 0;
});

const mixedPaid = computed(() => {
  return state.mixedPayments.reduce((acc, row) => acc + parseAmount(row.amount), 0);
});

const mixedMissing = computed(() => {
  const diff = totalSafe.value - mixedPaid.value;
  return diff > 0 ? diff : 0;
});

const mixedChange = computed(() => {
  const diff = mixedPaid.value - totalSafe.value;
  return diff > 0 ? diff : 0;
});

const paidSafe = computed(() =>
  state.mixedMode ? mixedPaid.value : singlePaid.value
);

const changeSafe = computed(() =>
  state.mixedMode ? mixedChange.value : singleChange.value
);

const cashErrorFinal = computed(() => {
  if (state.mixedMode) return mixedMissing.value > 0;
  if (!singleUsesCashEntry.value) return false;
  return singleMissing.value > 0;
});

const cashErrorMsgFinal = computed(() => {
  if (props.cashErrorMsg) return props.cashErrorMsg;
  if (state.mixedMode && mixedMissing.value > 0) {
    return `Faltan ${money(mixedMissing.value)}.`;
  }
  if (!state.mixedMode && singleUsesCashEntry.value && singleMissing.value > 0) {
    return `Faltan ${money(singleMissing.value)}.`;
  }
  return "";
});

const paymentMethodValid = computed(() => {
  if (state.mixedMode) return true;
  return !!selectedMethod.value;
});

const paymentConfigValid = computed(() => {
  if (state.mixedMode) {
    return mixedPaid.value > 0 && mixedMissing.value <= 0;
  }

  if (!selectedMethod.value) return false;

  if (singleUsesCashEntry.value) {
    return singlePaid.value > 0 && singleMissing.value <= 0;
  }

  return true;
});

const invoiceModeLabel = computed(() => {
  if (state.invoiceMode === "NO_FISCAL") return "No fiscal";
  if (state.invoiceMode === "FISCAL") return "Fiscal";
  if (state.invoiceMode === "MIXED") return "Mixta";
  if (state.invoiceMode === "TICKET_ONLY") return "Solo ticket";
  return state.invoiceMode;
});

const paymentSummaryLabel = computed(() => {
  if (state.mixedMode) {
    return state.mixedPayments
      .map((row) => {
        const method = rowMethod(row);
        if (!method || parseAmount(row.amount) <= 0) return null;

        const effectiveCardKind = rowEffectiveCardKind(row);
        let suffix = "";
        if (String(method.kind || "").toUpperCase() === "CARD") {
          suffix =
            effectiveCardKind === "DEBIT"
              ? " (Débito)"
              : " (Crédito)";
        }

        return `${methodLabel(method)}${suffix} ${money(parseAmount(row.amount))}`;
      })
      .filter(Boolean)
      .join(" + ") || "Mixto";
  }

  if (!selectedMethod.value) return "Sin medio";

  if (String(selectedMethod.value.kind || "").toUpperCase() === "CARD") {
    const suffix = state.cardKind === "DEBIT" ? " (Débito)" : " (Crédito)";
    return `${methodLabel(selectedMethod.value)}${suffix}`;
  }

  return methodLabel(selectedMethod.value);
});

const backDisabled = computed(() => currentScreenIndex.value <= 0);

const primaryLabel = computed(() => {
  if (currentScreen.value === "confirm") return "Confirmar";
  return "Siguiente";
});

const primaryDisabled = computed(() => {
  if (currentScreen.value === "payment-method") return !paymentMethodValid.value;
  if (currentScreen.value === "payment-config") return !paymentConfigValid.value;
  return false;
});

const footerHint = computed(() => {
  if (currentScreen.value === "payment-method") return "← → ↑ ↓ mover  ·  teclas 1-9 para elegir rápido";
  if (currentScreen.value === "payment-config") return "Enter seguir · Borrar volver";
  if (currentScreen.value === "invoice-mode")   return "← → mover  ·  1=No fiscal  2=Fact.B  3=Fact.A  4=Fact.C";
  if (currentScreen.value === "customer")       return "Tab / Enter avanzar campo · Borrar volver";
  return "Enter confirmar venta";
});

function moveToScreen(key) {
  if (!screenSteps.some((x) => x.key === key)) return;
  currentScreen.value = key;
  nextTick(() => focusActiveScreen());
}

function goPrevScreen() {
  if (backDisabled.value || confirmBusy.value) return;
  const prevIdx = currentScreenIndex.value - 1;
  if (prevIdx >= 0) moveToScreen(screenSteps[prevIdx].key);
}

function handlePrimaryAction() {
  if (confirmBusy.value) return;

  if (currentScreen.value === "payment-method") return goNextFromPaymentMethod();
  if (currentScreen.value === "payment-config") return goNextFromPaymentConfig();
  if (currentScreen.value === "invoice-mode") return goNextFromInvoiceMode();
  if (currentScreen.value === "customer") return goNextFromCustomer();
  if (currentScreen.value === "confirm") return onConfirm();
}

function goNextFromPaymentMethod() {
  if (!paymentMethodValid.value) return;
  moveToScreen("payment-config");
}

function goNextFromPaymentConfig() {
  if (!paymentConfigValid.value) return;
  moveToScreen("invoice-mode");
}

function goNextFromInvoiceMode() {
  moveToScreen("customer");
}

function goNextFromCustomer() {
  moveToScreen("confirm");
}

function quickCash(v) {
  state.cashInput = String(Math.max(0, Math.trunc(Number(v || 0))));
}

function setCardKind(v) {
  state.cardKind = normalizeCardKind(v, "CREDIT");
  if (state.cardKind === "DEBIT") state.installments = 1;
}

function selectSingleMethod(methodId) {
  state.mixedMode = false;
  state.paymentMethodId = Number(methodId);
  methodCursorTarget.value = "method";

  const idx = visiblePaymentMethods.value.findIndex(
    (x) => Number(x.id) === Number(methodId)
  );
  if (idx >= 0) methodCursor.value = idx;

  paymentSelectorActive.value = true;
}

function toggleMixedMode() {
  state.mixedMode = !state.mixedMode;

  if (state.mixedMode && !state.mixedPayments.length) {
    state.mixedPayments = [makeMixedRow({ payment_method_id: firstMethodId() })];
  }

  if (state.mixedMode) {
    methodCursorTarget.value = "mixed";
  } else {
    methodCursorTarget.value = "method";
    if (visiblePaymentMethods.value.length) {
      const idx = Math.max(
        0,
        Math.min(
          visiblePaymentMethods.value.length - 1,
          Number(methodCursor.value || 0)
        )
      );
      methodCursor.value = idx;
      state.paymentMethodId = Number(visiblePaymentMethods.value[idx].id);
    }
  }

  paymentSelectorActive.value = true;
}

function moveMethodCursor(direction) {
  const methods = visiblePaymentMethods.value || [];
  const count = methods.length;

  if (!count) {
    methodCursorTarget.value = "mixed";
    state.mixedMode = true;
    return;
  }

  const cols = window.innerWidth <= 960 ? 2 : 3;
  const totalSlots = count + 1;

  let index =
    methodCursorTarget.value === "mixed"
      ? count
      : Math.max(0, Math.min(count - 1, Number(methodCursor.value || 0)));

  const row = Math.floor(index / cols);
  const col = index % cols;

  let nextIndex = index;

  if (direction === "left") {
    if (cols > 1 && col > 0) nextIndex = index - 1;
  }

  if (direction === "right") {
    if (cols > 1 && col < cols - 1 && index + 1 <= totalSlots - 1) {
      nextIndex = index + 1;
    }
  }

  if (direction === "up") {
    if (row > 0) nextIndex = index - cols;
  }

  if (direction === "down") {
    if (index + cols <= totalSlots - 1) nextIndex = index + cols;
  }

  nextIndex = Math.max(0, Math.min(totalSlots - 1, nextIndex));

  if (nextIndex === count) {
    methodCursorTarget.value = "mixed";
    state.mixedMode = true;
    paymentSelectorActive.value = true;
    return;
  }

  methodCursorTarget.value = "method";
  methodCursor.value = nextIndex;
  state.mixedMode = false;
  paymentSelectorActive.value = true;

  const method = methods[nextIndex];
  if (method?.id != null) {
    state.paymentMethodId = Number(method.id);
  }
}

function addMixedRow() {
  state.mixedPayments.push(makeMixedRow({ payment_method_id: firstMethodId() }));
}

function removeMixedRow(uid) {
  if (state.mixedPayments.length <= 1) return;
  state.mixedPayments = state.mixedPayments.filter((row) => row.uid !== uid);
}

function rowMethodNeedsCardKind(row) {
  return methodNeedsCardKind(rowMethod(row));
}

function rowMethodSupportsInstallments(row) {
  const method = rowMethod(row);
  return methodSupportsInstallments(method, rowEffectiveCardKind(row));
}

function rowMethodNeedsReference(row) {
  const method = rowMethod(row);
  return methodNeedsReference(method);
}

function mixedInstallmentItems(row) {
  const method = rowMethod(row);
  if (!method) return [];
  return buildInstallmentItems(method, rowEffectiveCardKind(row));
}

function mixedRowAmountError(row) {
  if (!state.mixedMode) return false;
  if (!row) return false;
  if (!row.payment_method_id) return false;
  return parseAmount(row.amount) <= 0;
}

function focusActiveScreen() {
  if (!props.open) return;

  if (currentScreen.value === "payment-method") return paymentMethodScreenRef.value?.focusCurrent?.();
  if (currentScreen.value === "payment-config") return paymentConfigScreenRef.value?.focusCurrent?.();
  if (currentScreen.value === "invoice-mode") return invoiceModeScreenRef.value?.focusCurrent?.();
  if (currentScreen.value === "customer") return customerScreenRef.value?.focusCurrent?.();
  if (currentScreen.value === "confirm") return confirmScreenRef.value?.focusCurrent?.();
}

function closeNow() {
  if (confirmBusy.value) return;
  emit("update:open", false);
  emit("cancel");
}

function onConfirm() {
  if (confirmBusy.value) return;

  confirmingLocal.value = true;

  emit("confirm", {
    payment_method_id: state.paymentMethodId != null ? Number(state.paymentMethodId) : null,
    card_kind: state.cardKind,
    installments: Number(state.installments || 1),
    apply_reseller: !!state.applyReseller,
    proof: state.paymentProof || null,
    cash_received: singleUsesCashEntry.value ? singlePaid.value : null,
    change: changeSafe.value > 0 ? changeSafe.value : 0,

    mixed_mode: !!state.mixedMode,
    mixed_payments: state.mixedPayments.map((row) => ({
      payment_method_id:
        row.payment_method_id != null ? Number(row.payment_method_id) : null,
      amount: parseAmount(row.amount),
      installments: Number(row.installments || 1),
      reference: row.reference || null,
      card_kind: row.card_kind || null,
    })),

    invoice_mode: state.invoiceMode,
    invoice_type: state.invoiceType,
    customer_type: state.customerType,

    customer_name: customerName.value || null,
    customer_doc: customerDoc.value || null,
    customer_phone: customerPhone.value || null,

    total: totalSafe.value,
    total_preview: previewSafe.value,
    total_list: totalListSafe.value,

    // ✅ Items con el unit_price final según el método de pago (lista o descuento)
    items: cartUi.value.map((it) => ({
      product_id: it.product_id,
      quantity: it.qty ?? it.quantity ?? 1,
      unit_price: it._unit,
      product_name_snapshot: it.name || it.product_name_snapshot || null,
      product_sku_snapshot: it.sku || it.product_sku_snapshot || null,
      product_barcode_snapshot: it.barcode || it.product_barcode_snapshot || null,
    })),
  });
}

function isTypingTarget(el) {
  if (!el) return false;

  const tag = String(el.tagName || "").toLowerCase();

  if (["input", "textarea", "select"].includes(tag)) return true;
  if (el.isContentEditable) return true;

  return !!el.closest?.(
    ".v-field, .ck-manual-input, [contenteditable='true']"
  );
}

function onKeydown(e) {
  if (!props.open) return;
  if (e.defaultPrevented) return;
  if (confirmBusy.value) return;

  const key = String(e.key || "");
  const target = e.target;
  const typing = isTypingTarget(target);

  if (key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    closeNow();
    return;
  }

  if (typing) {
    return;
  }

  // ── Number shortcuts ──────────────────────────────────────────────────────
  const digit = parseInt(key, 10);
  if (Number.isFinite(digit) && digit >= 1 && digit <= 9) {
    // Payment method selection (step 1)
    if (currentScreen.value === "payment-method") {
      e.preventDefault();
      e.stopPropagation();
      const methods = visiblePaymentMethods.value;
      const idx = digit - 1;
      if (idx < methods.length) {
        selectSingleMethod(methods[idx].id);
      } else if (idx === methods.length) {
        toggleMixedMode();
      }
      return;
    }
    // Invoice mode selection (step 3)
    if (currentScreen.value === "invoice-mode") {
      e.preventDefault();
      e.stopPropagation();
      invoiceModeScreenRef.value?.handleKeyboardAction?.(`digit:${digit}`);
      return;
    }
  }

  if (key === "Backspace") {
    const handled =
      paymentMethodScreenRef.value?.handleKeyboardAction?.("backspace") ||
      paymentConfigScreenRef.value?.handleKeyboardAction?.("backspace") ||
      invoiceModeScreenRef.value?.handleKeyboardAction?.("backspace") ||
      customerScreenRef.value?.handleKeyboardAction?.("backspace") ||
      confirmScreenRef.value?.handleKeyboardAction?.("backspace");

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (!backDisabled.value) {
      e.preventDefault();
      e.stopPropagation();
      goPrevScreen();
    }
    return;
  }

  if (key === "Enter") {
    const handled =
      paymentMethodScreenRef.value?.handleKeyboardAction?.("enter") ||
      paymentConfigScreenRef.value?.handleKeyboardAction?.("enter") ||
      invoiceModeScreenRef.value?.handleKeyboardAction?.("enter") ||
      customerScreenRef.value?.handleKeyboardAction?.("enter") ||
      confirmScreenRef.value?.handleKeyboardAction?.("enter");

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    handlePrimaryAction();
    return;
  }

  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(key)) {
    const actionMap = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
    };

    const action = actionMap[key];

    const handled =
      paymentMethodScreenRef.value?.handleKeyboardAction?.(action) ||
      paymentConfigScreenRef.value?.handleKeyboardAction?.(action) ||
      invoiceModeScreenRef.value?.handleKeyboardAction?.(action) ||
      customerScreenRef.value?.handleKeyboardAction?.(action) ||
      confirmScreenRef.value?.handleKeyboardAction?.(action);

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  }
}

onMounted(() => window.addEventListener("keydown", onKeydown, true));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown, true));
</script>

<style scoped>
/* ── Root card ── */
.ck-root {
  display: flex;
  flex-direction: column;
  min-height: min(86dvh, 760px);
  max-height: min(86dvh, 760px);
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

/* ── Header ── */
.ck-hdr {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.03);
  flex: 0 0 auto;
  gap: 12px;
}

.ck-hdr-left {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.ck-hdr-title {
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.5;
  line-height: 1;
}

/* ── Segmented progress bar ── */
.ck-progress {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0;
  flex-wrap: nowrap;
}

.ck-prog-step {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: default;
}

.ck-prog-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid rgba(var(--v-theme-on-surface), 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 900;
  color: rgba(var(--v-theme-on-surface), 0.35);
  flex: 0 0 auto;
  transition: background 0.18s, border-color 0.18s, box-shadow 0.18s, color 0.18s;
}

.ck-prog-step.active .ck-prog-dot {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
  color: #fff;
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.2);
}

.ck-prog-step.done .ck-prog-dot {
  background: rgba(var(--v-theme-primary), 0.15);
  border-color: rgba(var(--v-theme-primary), 0.4);
}

.ck-prog-step.done .ck-prog-dot :deep(.v-icon) {
  color: rgb(var(--v-theme-primary));
}

.ck-prog-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.35);
  white-space: nowrap;
  transition: color 0.18s, font-weight 0.18s;
}

.ck-prog-step.active .ck-prog-label {
  color: rgb(var(--v-theme-on-surface));
  font-weight: 900;
}

.ck-prog-step.done .ck-prog-label {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.ck-prog-line {
  width: 20px;
  height: 2px;
  background: rgba(var(--v-theme-on-surface), 0.1);
  margin: 0 3px;
  flex: 0 0 auto;
  transition: background 0.18s;
}

.ck-prog-line.done {
  background: rgba(var(--v-theme-primary), 0.4);
}

/* ── Header right ── */
.ck-hdr-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.ck-hdr-total {
  text-align: right;
}

.ck-hdr-total-lbl {
  font-size: 0.55rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  color: rgba(var(--v-theme-on-surface), 0.45);
  display: block;
  line-height: 1;
  margin-bottom: 1px;
}

.ck-hdr-total-val {
  font-size: 1.22rem;
  font-weight: 950;
  letter-spacing: -0.03em;
  white-space: nowrap;
  line-height: 1;
}

/* ── Body: always split ── */
.ck-body {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(260px, 300px);
  overflow: hidden;
}

.ck-body-main {
  min-height: 0;
  overflow: hidden;
  padding: 10px 12px;
}

.ck-body-aside {
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  overflow: hidden;
  min-height: 0;
}

/* ── Footer ── */
.ck-ftr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  background: rgba(var(--v-theme-on-surface), 0.02);
  flex: 0 0 auto;
  gap: 12px;
}

.ck-ftr-hint {
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.5);
  display: flex;
  align-items: center;
  gap: 5px;
}

.ck-ftr-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* ── Action buttons ── */
.ck-act {
  min-height: 54px !important;
  padding: 6px 18px !important;
  border-radius: 14px !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 12px !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  font-weight: 950 !important;
  transition: transform 0.14s ease, box-shadow 0.14s ease !important;
}

.ck-act:hover {
  transform: translateY(-1px) !important;
}

.ck-act:active {
  transform: translateY(1px) !important;
}

.ck-act:disabled,
.ck-act.v-btn--disabled {
  opacity: 0.5 !important;
  box-shadow: none !important;
  transform: none !important;
}

.ck-act-key {
  width: 36px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ck-act-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  line-height: 1;
}

.ck-act-main {
  font-size: 0.86rem;
  font-weight: 950;
  letter-spacing: 0.01em;
}

.ck-act-sub {
  font-size: 0.64rem;
  font-weight: 700;
  opacity: 0.82;
}

/* BORRAR button */
.ck-act--back {
  min-width: 160px !important;
  color: #111827 !important;
  background: linear-gradient(180deg, #f0f0f0 0%, #d4d4d4 100%) !important;
  border: 2px solid rgba(18, 24, 33, 0.22) !important;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.9),
    inset 0 -3px 0 rgba(0, 0, 0, 0.07),
    0 8px 20px rgba(0, 0, 0, 0.18) !important;
}

.ck-act--back .ck-act-key {
  background: rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.ck-act--back .ck-act-main,
.ck-act--back .ck-act-sub {
  color: #111827;
}

.ck-act--back :deep(.v-icon) {
  color: #111827 !important;
}

/* ENTER button */
.ck-act--enter {
  min-width: 180px !important;
  color: #ffffff !important;
  background: linear-gradient(180deg, #0d6fd4 0%, #0358aa 48%, #024d95 100%) !important;
  border: 2px solid rgba(2, 49, 100, 0.5) !important;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.24),
    inset 0 -3px 0 rgba(0, 0, 0, 0.14),
    0 10px 24px rgba(3, 88, 170, 0.44) !important;
}

.ck-act--enter .ck-act-key {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.ck-act--enter .ck-act-main,
.ck-act--enter .ck-act-sub {
  color: #ffffff;
}

.ck-act--enter :deep(.v-icon) {
  color: #ffffff !important;
}

/* ── Dark theme active states ── */
:global(.v-theme--dark) .ck-root :deep(.ck-pay.active),
:global(.v-theme--dark) .ck-root :deep(.ck-option.active),
:global(.v-theme--dark) .ck-root :deep(.ck-choice.active),
:global(.v-theme--dark) .ck-root :deep(.ck-card.active),
:global(.v-theme--dark) .ck-root :deep(.ck-box.active),
:global(.v-theme--dark) .ck-root :deep(.ck-item.active),
:global(.v-theme--dark) .ck-root :deep(.cursorActive.active),
:global(.v-theme--dark) .ck-root :deep(.active.cursorActive) {
  background:
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.08) 0%,
      rgba(var(--v-theme-primary), 0.22) 100%
    ) !important;
  border: 2px solid rgba(255, 255, 255, 0.92) !important;
  outline: none !important;
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.1),
    0 0 0 4px rgba(var(--v-theme-primary), 0.34),
    0 10px 18px rgba(0, 0, 0, 0.38) !important;
  transform: translateY(-1px);
}

:global(.v-theme--dark) .ck-root :deep(.ck-pay.active::before),
:global(.v-theme--dark) .ck-root :deep(.ck-option.active::before),
:global(.v-theme--dark) .ck-root :deep(.ck-choice.active::before),
:global(.v-theme--dark) .ck-root :deep(.ck-card.active::before),
:global(.v-theme--dark) .ck-root :deep(.ck-box.active::before),
:global(.v-theme--dark) .ck-root :deep(.ck-item.active::before) {
  background: rgba(var(--v-theme-primary), 1) !important;
}

:global(.v-theme--dark) .ck-root :deep(.ck-pay.active *),
:global(.v-theme--dark) .ck-root :deep(.ck-option.active *),
:global(.v-theme--dark) .ck-root :deep(.ck-choice.active *),
:global(.v-theme--dark) .ck-root :deep(.ck-card.active *),
:global(.v-theme--dark) .ck-root :deep(.ck-box.active *),
:global(.v-theme--dark) .ck-root :deep(.ck-item.active *) {
  opacity: 1 !important;
}

:global(.v-theme--dark) .ck-root :deep(.ck-pay.active .ck-pay-state),
:global(.v-theme--dark) .ck-root :deep(.ck-option.active .ck-pay-state),
:global(.v-theme--dark) .ck-root :deep(.ck-choice.active .ck-pay-state),
:global(.v-theme--dark) .ck-root :deep(.ck-card.active .ck-pay-state) {
  color: rgba(255, 255, 255, 1) !important;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.22));
}

:global(.v-theme--dark) .ck-root :deep(.ck-cursor-tag) {
  background: rgba(255, 255, 255, 0.18) !important;
  color: rgba(255, 255, 255, 0.98) !important;
}

/* ── Responsive ── */
@media (max-width: 960px) {
  .ck-body {
    grid-template-columns: 1fr;
  }

  .ck-body-aside {
    display: none;
  }

  .ck-root {
    min-height: min(86dvh, 700px);
    max-height: min(86dvh, 700px);
  }
}

@media (max-width: 760px) {
  .ck-hdr {
    flex-direction: column;
    align-items: stretch;
    padding: 8px 10px;
    gap: 6px;
  }

  .ck-hdr-right {
    justify-content: space-between;
  }

  .ck-hdr-total {
    text-align: left;
  }

  .ck-ftr {
    flex-direction: column;
    align-items: stretch;
    padding: 8px 10px;
    gap: 8px;
  }

  .ck-ftr-actions {
    width: 100%;
    justify-content: stretch;
  }

  .ck-ftr-actions .ck-act {
    flex: 1 1 auto;
    justify-content: center !important;
    min-width: 0 !important;
  }

  .ck-progress {
    flex-wrap: wrap;
    gap: 2px;
  }
}
</style>
