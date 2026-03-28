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
      <div class="ck-config-shell" :class="{ 'ck-config-shell--single': !showSide }">
        <section class="ck-config-main">
          <div class="ck-config-main__inner">
            <template v-if="state.mixedMode">
              <PaymentMixed
                :state="state"
                :mixed-method-items="mixedMethodItems"
                :mixed-paid="mixedPaid"
                :mixed-missing="mixedMissing"
                :mixed-change="mixedChange"
                :money="money"
                :set-mixed-amount-ref="setMixedAmountRef"
                @add-mixed-row="$emit('add-mixed-row')"
                @remove-mixed-row="$emit('remove-mixed-row', $event)"
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
  return props.selectedMethod ? props.methodLabel(props.selectedMethod) : "Configuración";
});

const screenSubtitle = computed(() => {
  if (props.state?.mixedMode) return "Distribuí el cobro entre varios medios";
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

const showSide = computed(() => true);

function isValid() {
  if (props.state?.mixedMode) {
    return Number(props.mixedPaid || 0) > 0 && Number(props.mixedMissing || 0) <= 0;
  }

  if (!props.selectedMethod) return false;

  if (props.singleUsesCashEntry) {
    return Number(singlePaid.value || 0) > 0 && Number(props.singleMissing || 0) <= 0;
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
    if (props.state?.mixedMode) return;

    paymentSingleRef.value?.focusCurrent?.();
  });
}

function handleKeyboardAction(action) {
  if (!props.state?.mixedMode) {
    const childHandled = paymentSingleRef.value?.handleKeyboardAction?.(action);
    if (childHandled) return true;
  }

  if (action === "enter") {
    return emitNextIfValid();
  }

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
  gap: 12px;
  padding: 10px 12px 12px;
  border-radius: 20px;
  background: transparent;
}

.ck-screen__head {
  display: grid;
  gap: 4px;
  padding-inline: 2px;
}

.ck-screen__title {
  font-size: 1.18rem;
  font-weight: 950;
  line-height: 1.02;
  letter-spacing: -0.02em;
}

.ck-screen__subtitle {
  font-size: 0.86rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.6);
  line-height: 1.15;
}

.ck-screen__body {
  min-height: 0;
}

.ck-config-shell {
  height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 250px;
  gap: 12px;
  align-items: start;
}

.ck-config-shell--single {
  grid-template-columns: 1fr;
}

.ck-config-main {
  min-width: 0;
  border-radius: 18px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background:
    linear-gradient(
      180deg,
      rgba(var(--v-theme-surface), 0.9) 0%,
      rgba(var(--v-theme-on-surface), 0.015) 100%
    );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    0 4px 12px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.ck-config-main__inner {
  padding: 14px;
}

.ck-config-side {
  display: grid;
  align-content: start;
  gap: 10px;
}

.ck-side-total {
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background:
    linear-gradient(
      180deg,
      rgba(var(--v-theme-primary), 0.075) 0%,
      rgba(var(--v-theme-primary), 0.045) 100%
    );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    0 4px 10px rgba(0, 0, 0, 0.03);
}

.ck-side-total__label {
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.56);
  margin-bottom: 6px;
}

.ck-side-total__value {
  font-size: 1.62rem;
  line-height: 1;
  font-weight: 950;
  letter-spacing: -0.03em;
}

.ck-side-list {
  display: grid;
  gap: 8px;
}

.ck-side-row {
  min-height: 44px;
  padding: 0 12px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  background: rgba(var(--v-theme-surface), 0.58);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.92rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.ck-side-row strong {
  font-weight: 900;
  white-space: nowrap;
}

.ck-side-row--warn {
  color: rgb(var(--v-theme-error));
  border-color: rgba(var(--v-theme-error), 0.18);
  background: rgba(var(--v-theme-error), 0.05);
}

.ck-error-box {
  min-height: 46px;
  padding: 0 12px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(var(--v-theme-error), 0.08);
  color: rgb(var(--v-theme-error));
  font-size: 0.82rem;
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
    font-size: 1.48rem;
  }
}

@media (max-width: 760px) {
  .ck-screen {
    padding: 6px 0 0;
    gap: 10px;
  }

  .ck-config-main__inner {
    padding: 10px;
  }

  .ck-side-total {
    padding: 12px 14px;
  }
}
</style>