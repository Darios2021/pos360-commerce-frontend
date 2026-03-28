<template>
  <v-dialog
    v-model="openLocal"
    max-width="1180"
    persistent
    class="checkout-dialog"
  >
    <v-card class="ck-root" rounded="xl">
      <div class="ck-header">
        <div class="ck-header-left">
          <div class="ck-title">Cobro POS</div>

          <div class="ck-screen-line">
            <span
              v-for="(item, idx) in screenSteps"
              :key="item.key"
              class="ck-screen-pill"
              :class="{
                active: currentScreen === item.key,
                done: screenIndex(item.key) < currentScreenIndex
              }"
            >
              {{ item.label }}
              <span v-if="idx < screenSteps.length - 1" class="ck-screen-sep">•</span>
            </span>
          </div>
        </div>

        <div class="ck-header-right">
          <div class="ck-total-box">
            <div class="ck-total-label">TOTAL</div>
            <div class="ck-total-line">
              <v-icon class="ck-total-icon" size="28">mdi-cash-multiple</v-icon>
              <div class="ck-total">{{ money(totalSafe) }}</div>
            </div>
          </div>

          <v-btn
            icon
            variant="text"
            density="comfortable"
            class="ck-close"
            :disabled="confirmBusy"
            @click="closeNow"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <v-divider />

      <v-card-text class="ck-body">
        <div class="ck-body-layout" :class="{ 'ck-body-layout--with-summary': showSummary }">
          <section class="ck-main">
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

          <aside v-if="showSummary" class="ck-summary-wrap">
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
      </v-card-text>

      <v-divider />

      <div class="ck-footer">
        <div class="ck-footer-help">
          {{ footerHint }}
        </div>

        <div class="ck-footer-right">
          <v-btn
            variant="text"
            density="comfortable"
            class="ck-btn-cancel"
            :disabled="confirmBusy"
            @click="closeNow"
          >
            Cancelar
          </v-btn>

          <v-btn
            variant="outlined"
            density="comfortable"
            rounded="pill"
            class="ck-btn-kbd ck-btn-kbd--back"
            :disabled="backDisabled || confirmBusy"
            @click="goPrevScreen"
          >
            <span class="ck-kbd-box ck-kbd-box--back">Borrar</span>
            <span>Atrás</span>
          </v-btn>

          <v-btn
            color="primary"
            density="comfortable"
            rounded="pill"
            class="ck-btn-kbd ck-btn-kbd--primary"
            :disabled="primaryDisabled || confirmBusy"
            :loading="confirmBusy && currentScreen === 'confirm'"
            @click="handlePrimaryAction"
          >
            <span class="ck-kbd-box ck-kbd-box--enter">Enter</span>
            <span>{{ primaryLabel }}</span>
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

function normalizeMethod(method = {}) {
  const x = method || {};
  return {
    id: Number(x.id || 0),
    name: String(x.name || "").trim(),
    display_name: String(x.display_name || "").trim(),
    kind: String(x.kind || "OTHER").toUpperCase(),
    pricing_mode: String(x.pricing_mode || "SALE_PRICE").toUpperCase(),
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
  return String(method?.kind || "").toUpperCase() === "CARD";
}

function methodSupportsInstallments(method) {
  return !!method?.supports_installments;
}

function methodUsesListPrice(method) {
  return String(method?.pricing_mode || "SALE_PRICE").toUpperCase() === "LIST_PRICE";
}

function methodUsesCashEntry(method) {
  return String(method?.kind || "").toUpperCase() === "CASH" || !!method?.allows_change;
}

function buildInstallmentItems(method) {
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
    card_kind:
      String(input.card_kind || "CREDIT").toUpperCase() === "DEBIT"
        ? "DEBIT"
        : "CREDIT",
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
  cardKind:
    String(props.cardKind || "CREDIT").toUpperCase() === "DEBIT"
      ? "DEBIT"
      : "CREDIT",

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
  if (!selectedMethod.value || !methodSupportsInstallments(selectedMethod.value)) return [];
  return buildInstallmentItems(selectedMethod.value);
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
      state.cardKind =
        String(props.cardKind || "CREDIT").toUpperCase() === "DEBIT"
          ? "DEBIT"
          : "CREDIT";

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

    if (!methodSupportsInstallments(method)) {
      state.installments = 1;
    } else {
      const items = buildInstallmentItems(method);
      const exists = items.some((x) => Number(x.value) === Number(state.installments));
      if (!exists) {
        state.installments = Number(method.default_installments || items[0]?.value || 1);
      }
    }

    if (!methodNeedsCardKind(method)) {
      state.cardKind = "CREDIT";
    }

    if (!methodNeedsReference(method)) {
      state.paymentProof = "";
    }
  },
  { immediate: true }
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

const computedSaleUsesListPrice = computed(() => {
  if (state.applyReseller) return false;

  if (state.mixedMode) {
    return state.mixedPayments.some((row) => {
      const method = visiblePaymentMethods.value.find(
        (x) => Number(x.id) === Number(row.payment_method_id)
      );
      if (!method) return false;
      return parseAmount(row.amount) > 0 && methodUsesListPrice(method);
    });
  }

  if (!selectedMethod.value) return false;
  return methodUsesListPrice(selectedMethod.value);
});

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
        const method = visiblePaymentMethods.value.find(
          (x) => Number(x.id) === Number(row.payment_method_id)
        );
        if (!method || parseAmount(row.amount) <= 0) return null;
        return `${methodLabel(method)} ${money(parseAmount(row.amount))}`;
      })
      .filter(Boolean)
      .join(" + ") || "Mixto";
  }

  return selectedMethod.value ? methodLabel(selectedMethod.value) : "Sin medio";
});

const showSummary = computed(() =>
  currentScreen.value === "payment-method" || currentScreen.value === "confirm"
);

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
  if (currentScreen.value === "payment-method") return "← → ↑ ↓ mover";
  if (currentScreen.value === "payment-config") return "Enter seguir · Borrar volver";
  if (currentScreen.value === "invoice-mode") return "flechas seleccionar";
  if (currentScreen.value === "customer") return "completar y seguir";
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
  state.cardKind =
    String(v || "CREDIT").toUpperCase() === "DEBIT" ? "DEBIT" : "CREDIT";
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

  const cols = window.innerWidth <= 960 ? 1 : 2;
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

function rowMethod(row) {
  return (
    visiblePaymentMethods.value.find(
      (x) => Number(x.id) === Number(row?.payment_method_id)
    ) || null
  );
}

function rowMethodNeedsCardKind(row) {
  return methodNeedsCardKind(rowMethod(row));
}

function rowMethodSupportsInstallments(row) {
  const method = rowMethod(row);
  return methodSupportsInstallments(method);
}

function rowMethodNeedsReference(row) {
  const method = rowMethod(row);
  return methodNeedsReference(method);
}

function mixedInstallmentItems(row) {
  const method = rowMethod(row);
  if (!method) return [];
  return buildInstallmentItems(method);
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
.ck-root {
  display: flex;
  flex-direction: column;
  min-height: min(760px, 90dvh);
  max-height: min(760px, 90dvh);
  overflow: hidden;
  background:
    linear-gradient(125deg, rgba(var(--v-theme-on-surface), 0.02) 0%, rgba(var(--v-theme-on-surface), 0.01) 38%, rgba(var(--v-theme-on-surface), 0.03) 100%),
    rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.ck-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 20px 12px;
  flex: 0 0 auto;
}

.ck-header-left {
  min-width: 0;
  display: grid;
  gap: 8px;
}

.ck-title {
  font-size: 1.5rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.03em;
}

.ck-screen-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.ck-screen-pill {
  font-size: 0.88rem;
  font-weight: 800;
  color: rgba(var(--v-theme-on-surface), 0.44);
}

.ck-screen-pill.active {
  color: rgb(var(--v-theme-on-surface));
}

.ck-screen-pill.done {
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.ck-screen-sep {
  margin-left: 6px;
  opacity: 0.34;
}

.ck-header-right {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  flex: 0 0 auto;
}

.ck-total-box {
  text-align: right;
}

.ck-total-label {
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin-bottom: 4px;
}

.ck-total-line {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.ck-total-icon {
  opacity: 0.55;
}

.ck-total {
  font-size: 2.35rem;
  font-weight: 950;
  line-height: 1;
  white-space: nowrap;
  letter-spacing: -0.04em;
}

.ck-close {
  margin-top: 2px;
}

.ck-body {
  padding: 14px 16px;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.ck-body-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  height: 100%;
  min-height: 0;
}

.ck-body-layout--with-summary {
  grid-template-columns: minmax(0, 1.5fr) minmax(300px, 0.72fr);
  align-items: stretch;
}

.ck-main,
.ck-summary-wrap {
  min-width: 0;
  min-height: 0;
}

.ck-main {
  height: 100%;
}

.ck-summary-wrap {
  height: 100%;
}

.ck-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 16px;
  flex: 0 0 auto;
  background: rgba(var(--v-theme-on-surface), 0.018);
}

.ck-footer-help {
  font-size: 0.84rem;
  font-weight: 800;
  color: rgba(var(--v-theme-on-surface), 0.56);
  letter-spacing: 0.01em;
}

.ck-footer-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.ck-btn-cancel {
  min-height: 46px;
  padding-inline: 16px;
  font-weight: 900;
  font-size: 0.86rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ck-btn-kbd {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding-inline: 16px;
  font-weight: 900;
  font-size: 0.86rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ck-btn-kbd--back {
  min-width: 190px;
  border-width: 2px;
}

.ck-btn-kbd--primary {
  min-width: 230px;
  box-shadow: 0 6px 14px rgba(var(--v-theme-primary), 0.22);
}

.ck-kbd-box {
  min-width: 66px;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.76rem;
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0.02em;
  text-transform: none;
}

.ck-kbd-box--back {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgb(var(--v-theme-on-surface));
}

.ck-kbd-box--enter {
  background: rgba(255, 255, 255, 0.18);
  color: white;
}

@media (max-width: 1200px) {
  .ck-body-layout--with-summary {
    grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.7fr);
  }

  .ck-total {
    font-size: 2.1rem;
  }
}

@media (max-width: 960px) {
  .ck-root {
    min-height: min(820px, 94dvh);
    max-height: min(820px, 94dvh);
  }

  .ck-body-layout--with-summary {
    grid-template-columns: 1fr;
  }

  .ck-total {
    font-size: 2rem;
  }
}

@media (max-width: 760px) {
  .ck-header {
    flex-direction: column;
    align-items: stretch;
    padding: 14px 14px 12px;
  }

  .ck-header-right {
    justify-content: space-between;
    align-items: center;
  }

  .ck-total-box {
    text-align: left;
  }

  .ck-total-line {
    justify-content: flex-start;
  }

  .ck-body {
    padding: 12px;
  }

  .ck-footer {
    flex-direction: column;
    align-items: stretch;
    padding: 12px;
  }

  .ck-footer-right {
    justify-content: stretch;
    width: 100%;
  }

  .ck-footer-right :deep(.v-btn) {
    flex: 1 1 auto;
  }

  .ck-btn-kbd--back,
  .ck-btn-kbd--primary {
    min-width: 0;
  }

  .ck-kbd-box {
    min-width: 62px;
  }
}
</style>