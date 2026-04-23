<template>
  <div class="ck-screen">
    <div class="ck-screen__head">
      <div class="ck-screen__title">{{ screenTitle }}</div>
      <div class="ck-screen__subtitle">{{ screenSubtitle }}</div>
    </div>

    <div class="ck-screen__body">
      <section class="ck-config-main">
        <div class="ck-config-main__inner">
          <template v-if="state.mixedMode">
            <PaymentMixed
              ref="paymentMixedRef"
              :state="state"
              :mixed-method-items="mixedMethodItems"
              :mixed-paid="mixedPaid"
              :mixed-missing="mixedMissing"
              :mixed-change="mixedChange"
              :total-safe="totalSafe"
              :money="money"
              :set-mixed-amount-ref="setMixedAmountRef"
              @add-mixed-row="$emit('add-mixed-row')"
              @remove-mixed-row="$emit('remove-mixed-row', $event)"
              @ready="emitNextIfValid"
            />
          </template>

          <template v-else>
            <PaymentSingle
              ref="paymentSingleRef"
              :state="state"
              :selected-method="selectedMethod"
              :single-installment-items="singleInstallmentItems"
              :single-uses-cash-entry="singleUsesCashEntry"
              :single-missing="singleMissing"
              :single-change="singleChange"
              :cash-error-final="cashErrorFinal"
              :cash-error-msg-final="cashErrorMsgFinal"
              :method-label="methodLabel"
              :method-needs-card-kind="methodNeedsCardKind"
              :method-supports-installments="methodSupportsInstallments"
              :method-needs-reference="methodNeedsReference"
              :money="money"
              :single-cash-ref="singleCashRef"
              :total-safe="totalSafe"
              @quick-cash="$emit('quick-cash', $event)"
              @set-card-kind="$emit('set-card-kind', $event)"
              @primary-enter="emitNextIfValid"
            />
          </template>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from "vue";
import PaymentSingle from "../payment/PaymentSingle.vue";
import PaymentMixed from "../payment/PaymentMixed.vue";

const props = defineProps({
  state: { type: Object, required: true },
  selectedMethod: { type: Object, default: null },

  singleInstallmentItems: { type: Array, default: () => [] },
  mixedMethodItems: { type: Array, default: () => [] },

  singleUsesCashEntry: { type: Boolean, default: false },
  singleMissing: { type: Number, default: 0 },
  singleChange: { type: Number, default: 0 },

  totalSafe: { type: Number, default: 0 },
  mixedPaid: { type: Number, default: 0 },
  mixedMissing: { type: Number, default: 0 },
  mixedChange: { type: Number, default: 0 },

  cashErrorFinal: { type: Boolean, default: false },
  cashErrorMsgFinal: { type: String, default: "" },

  methodLabel: { type: Function, required: true },
  methodNeedsCardKind: { type: Function, required: true },
  methodSupportsInstallments: { type: Function, required: true },
  methodNeedsReference: { type: Function, required: true },

  rowMethodNeedsCardKind: { type: Function, default: () => false },
  rowMethodSupportsInstallments: { type: Function, default: () => false },
  rowMethodNeedsReference: { type: Function, default: () => false },
  mixedInstallmentItems: { type: Function, default: () => [] },
  mixedRowAmountError: { type: Function, default: () => false },

  money: { type: Function, required: true },
  singleCashRef: { type: Object, default: null },
  setMixedAmountRef: { type: Function, default: null },
});

const emit = defineEmits([
  "quick-cash",
  "set-card-kind",
  "add-mixed-row",
  "remove-mixed-row",
  "next",
  "back",
]);

const paymentSingleRef = ref(null);
const paymentMixedRef = ref(null);

function parseAmount(v) {
  if (v === null || v === undefined) return 0;
  const raw = String(v).trim();
  if (!raw) return 0;
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

const screenTitle = computed(() => {
  if (props.state?.mixedMode) return "Pago mixto";
  return props.selectedMethod
    ? props.methodLabel(props.selectedMethod)
    : "Configuración";
});

const screenSubtitle = computed(() => {
  if (props.state?.mixedMode) {
    return "Flechas para navegar · tipeá el importe · Enter siguiente";
  }
  if (props.singleUsesCashEntry) return "Elegí Exacto / Redondeado o tipeá un número para monto manual";
  if (props.selectedMethod && props.methodNeedsCardKind(props.selectedMethod)) {
    return "↑ ↓ tipo de tarjeta · ← → cuotas · Enter siguiente";
  }
  if (props.selectedMethod && props.methodSupportsInstallments(props.selectedMethod)) {
    return "← → cuotas · Enter siguiente";
  }
  return "Enter para continuar";
});

function isValid() {
  if (props.state?.mixedMode) {
    return (
      Number(props.mixedPaid || 0) > 0 &&
      Number(props.mixedMissing || 0) <= 0
    );
  }

  if (!props.selectedMethod) return false;

  if (props.singleUsesCashEntry) {
    const paid = parseAmount(props.state?.cashInput);
    return paid > 0 && Number(props.singleMissing || 0) <= 0;
  }

  return true;
}

function emitNextIfValid() {
  if (!isValid()) return true;
  emit("next");
  return true;
}

function focusCurrent() {
  nextTick(() => {
    if (props.state?.mixedMode) {
      paymentMixedRef.value?.focusCurrent?.();
      return;
    }
    paymentSingleRef.value?.focusCurrent?.();
  });
}

function handleKeyboardAction(action) {
  // Dígitos directos: sólo tienen sentido en single-cash (entran en manual)
  if (typeof action === "string" && action.startsWith("digit:")) {
    if (props.state?.mixedMode) return false;
    return !!paymentSingleRef.value?.handleKeyboardAction?.(action);
  }

  if (props.state?.mixedMode) {
    const handled = paymentMixedRef.value?.handleKeyboardAction?.(action);
    if (handled) return true;

    if (action === "backspace") {
      emit("back");
      return true;
    }

    if (action === "enter") return emitNextIfValid();
    return false;
  }

  const handled = paymentSingleRef.value?.handleKeyboardAction?.(action);
  if (handled) return true;

  if (action === "enter") return emitNextIfValid();

  if (action === "backspace") {
    emit("back");
    return true;
  }

  return false;
}

defineExpose({
  focusCurrent,
  handleKeyboardAction,
});
</script>

<style scoped>
.ck-screen {
  min-height: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 8px;
  padding: 4px 6px 6px;
  border-radius: 14px;
  background: transparent;
}

.ck-screen__head {
  display: grid;
  gap: 2px;
  padding-inline: 1px;
}

.ck-screen__title {
  font-size: 0.98rem;
  font-weight: 900;
  line-height: 1.02;
  letter-spacing: -0.02em;
}

.ck-screen__subtitle {
  font-size: 0.72rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.6);
  line-height: 1.12;
}

.ck-screen__body {
  min-height: 0;
}

.ck-config-main {
  min-width: 0;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background:
    linear-gradient(
      180deg,
      rgba(var(--v-theme-surface), 0.9) 0%,
      rgba(var(--v-theme-on-surface), 0.015) 100%
    );
  box-shadow:
    inset 0 1px 0 rgba(var(--v-theme-on-surface), 0.04),
    0 3px 10px rgba(0, 0, 0, 0.025);
  overflow: hidden;
}

.ck-config-main__inner {
  padding: 10px;
}

@media (max-width: 760px) {
  .ck-screen {
    padding: 4px 0 0;
    gap: 7px;
  }

  .ck-config-main__inner {
    padding: 8px;
  }
}
</style>
