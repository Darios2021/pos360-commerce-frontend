<template>
  <div class="ck-screen">
    <div class="ck-screen__head">
      <div class="ck-screen__title">
        {{ screenTitle }}
      </div>

      <div class="ck-screen__subtitle">
        {{ screenSubtitle }}
      </div>
    </div>

    <div class="ck-screen__body">
      <div
        class="ck-config-shell"
        :class="{ 'ck-config-shell--single': !showSide }"
      >
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

        <aside v-if="showSide" class="ck-config-side">
          <div class="ck-side-total">
            <div class="ck-side-total__label">TOTAL</div>
            <div class="ck-side-total__value">
              {{ money(totalSafe) }}
            </div>
          </div>

          <div class="ck-side-list">
            <div class="ck-side-row">
              <span>Pagado</span>
              <strong>{{ money(paidValue) }}</strong>
            </div>

            <div class="ck-side-row">
              <span>Vuelto</span>
              <strong>{{ money(changeValue) }}</strong>
            </div>

            <div
              v-if="missingValue > 0"
              class="ck-side-row ck-side-row--warn"
            >
              <span>Falta</span>
              <strong>{{ money(missingValue) }}</strong>
            </div>
          </div>

          <div v-if="errorText" class="ck-error-box">
            <v-icon size="18">mdi-alert-circle-outline</v-icon>
            <span>{{ errorText }}</span>
          </div>
        </aside>
      </div>
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
    return "Usá flechas para navegar, Enter para confirmar y números para importe";
  }

  if (props.singleUsesCashEntry) return "Usá flechas y Enter";
  if (props.selectedMethod && props.methodNeedsCardKind(props.selectedMethod)) {
    return "Usá flechas para elegir las opciones";
  }
  return "Configurá el cobro y seguí";
});

const singlePaid = computed(() => {
  if (!props.singleUsesCashEntry) return props.totalSafe || 0;
  return parseAmount(props.state?.cashInput);
});

const paidValue = computed(() => {
  if (props.state?.mixedMode) return Number(props.mixedPaid || 0);
  return Number(singlePaid.value || 0);
});

const changeValue = computed(() => {
  if (props.state?.mixedMode) return Number(props.mixedChange || 0);
  return Number(props.singleChange || 0);
});

const missingValue = computed(() => {
  if (props.state?.mixedMode) return Number(props.mixedMissing || 0);
  return Number(props.singleMissing || 0);
});

const errorText = computed(() => {
  if (props.state?.mixedMode && props.mixedMissing > 0) {
    return `Faltan ${props.money(props.mixedMissing)} para completar el total.`;
  }

  if (!props.state?.mixedMode && props.cashErrorFinal) {
    return props.cashErrorMsgFinal || "Revisá el monto recibido.";
  }

  return "";
});

const showSide = computed(() => false);

function isValid() {
  if (props.state?.mixedMode) {
    return (
      Number(props.mixedPaid || 0) > 0 &&
      Number(props.mixedMissing || 0) <= 0
    );
  }

  if (!props.selectedMethod) return false;

  if (props.singleUsesCashEntry) {
    return (
      Number(singlePaid.value || 0) > 0 &&
      Number(props.singleMissing || 0) <= 0
    );
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
  if (props.state?.mixedMode) {
    const handled = paymentMixedRef.value?.handleKeyboardAction?.(action);
    if (handled) return true;

    // only allow backspace to go back when not handled by mixed component
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
  font-weight: 950;
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

.ck-config-shell {
  height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 210px;
  gap: 8px;
  align-items: start;
}

.ck-config-shell--single {
  grid-template-columns: 1fr;
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
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 3px 10px rgba(0, 0, 0, 0.025);
  overflow: hidden;
}

.ck-config-main__inner {
  padding: 10px;
}

.ck-config-side {
  display: grid;
  align-content: start;
  gap: 8px;
}

.ck-side-total {
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background:
    linear-gradient(
      180deg,
      rgba(var(--v-theme-primary), 0.07) 0%,
      rgba(var(--v-theme-primary), 0.04) 100%
    );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 3px 8px rgba(0, 0, 0, 0.025);
}

.ck-side-total__label {
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.56);
  margin-bottom: 4px;
}

.ck-side-total__value {
  font-size: 1.22rem;
  line-height: 1;
  font-weight: 950;
  letter-spacing: -0.03em;
}

.ck-side-list {
  display: grid;
  gap: 6px;
}

.ck-side-row {
  min-height: 36px;
  padding: 0 10px;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  background: rgba(var(--v-theme-surface), 0.58);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.78rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.ck-side-row strong {
  font-weight: 900;
  white-space: nowrap;
  font-size: 0.8rem;
}

.ck-side-row--warn {
  color: rgb(var(--v-theme-error));
  border-color: rgba(var(--v-theme-error), 0.18);
  background: rgba(var(--v-theme-error), 0.05);
}

.ck-error-box {
  min-height: 38px;
  padding: 0 10px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(var(--v-theme-error), 0.08);
  color: rgb(var(--v-theme-error));
  font-size: 0.72rem;
  font-weight: 800;
  border: 1px solid rgba(var(--v-theme-error), 0.14);
}

@media (max-width: 920px) {
  .ck-config-shell {
    grid-template-columns: 1fr;
  }

  .ck-config-side {
    grid-template-columns: 1fr;
  }

  .ck-side-total__value {
    font-size: 1.1rem;
  }
}

@media (max-width: 760px) {
  .ck-screen {
    padding: 4px 0 0;
    gap: 7px;
  }

  .ck-config-main__inner {
    padding: 8px;
  }

  .ck-side-total {
    padding: 10px 12px;
  }
}
</style>