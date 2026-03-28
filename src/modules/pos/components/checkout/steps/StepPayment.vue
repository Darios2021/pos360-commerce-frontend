<template>
  <div class="ck-pay-pos">
    <div class="ck-pay-pos__header">
      <div>
        <div class="ck-pay-pos__title">Cobro</div>
        <div class="ck-pay-pos__subtitle">
          {{ headerSubtitle }}
        </div>
      </div>

      <div class="ck-pay-pos__chips">
        <span class="ck-mini-pill">
          {{ stageLabel }}
        </span>

        <span v-if="selectedMethodLabel" class="ck-mini-pill ck-mini-pill--primary">
          {{ selectedMethodLabel }}
        </span>

        <span v-if="stage === 'confirm'" class="ck-mini-pill">
          Total {{ money(totalSafe) }}
        </span>
      </div>
    </div>

    <div class="ck-pay-pos__body">
      <!-- ETAPA 1: seleccionar medio -->
      <section v-if="stage === 'select'" class="ck-stage">
        <div class="ck-stage-head">
          <div class="ck-stage-title">Elegí cómo paga</div>
          <div class="ck-stage-help">
            Flechas mueven · Enter selecciona · Backspace vuelve
          </div>
        </div>

        <PaymentMethodSelector
          :methods="visiblePaymentMethods"
          :selected-method-id="state.paymentMethodId"
          :mixed-mode="state.mixedMode"
          :cursor-index="cursorIndex"
          :cursor-target="cursorTarget"
          :selector-active="selectorActive"
          :method-label="methodLabel"
          :method-icon="methodIcon"
          @select-single-method="handleSelectSingleMethod"
          @toggle-mixed-mode="handleToggleMixedMode"
        />

        <div v-if="step1Errors?.length" class="ck-inline-errors">
          <div
            v-for="(err, idx) in step1Errors"
            :key="`step1err-${idx}`"
            class="ck-inline-error"
          >
            <v-icon size="16">mdi-alert-circle-outline</v-icon>
            <span>{{ err }}</span>
          </div>
        </div>
      </section>

      <!-- ETAPA 2: configurar -->
      <section v-else-if="stage === 'config'" class="ck-stage">
        <div class="ck-stage-head">
          <div class="ck-stage-title">
            {{ state.mixedMode ? "Configurá el cobro mixto" : `Configurá ${selectedMethodLabel}` }}
          </div>

          <div class="ck-stage-help">
            {{ configHelpText }}
          </div>
        </div>

        <div class="ck-focus-shell">
          <!-- SIMPLE -->
          <template v-if="!state.mixedMode">
            <div class="ck-config-card">
              <PaymentSingle
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
                @set-card-kind="setCardKindAndStay"
                @primary-enter="confirmConfig"
              />
            </div>

            <div class="ck-config-meta">
              <div class="ck-config-meta__item">
                <span class="k">Total</span>
                <strong class="v">{{ money(totalSafe) }}</strong>
              </div>

              <div v-if="singleUsesCashEntry" class="ck-config-meta__item">
                <span class="k">Pagado</span>
                <strong class="v">{{ money(singlePaidSafe) }}</strong>
              </div>

              <div v-if="singleUsesCashEntry" class="ck-config-meta__item">
                <span class="k">Vuelto</span>
                <strong class="v">{{ money(singleChange) }}</strong>
              </div>

              <div
                v-if="selectedMethodSupportsInstallments"
                class="ck-config-meta__item"
              >
                <span class="k">Cuotas</span>
                <strong class="v">{{ state.installments || 1 }}</strong>
              </div>

              <div
                v-if="selectedMethodNeedsCardKind"
                class="ck-config-meta__item"
              >
                <span class="k">Tipo</span>
                <strong class="v">
                  {{ state.cardKind === "DEBIT" ? "Débito" : "Crédito" }}
                </strong>
              </div>
            </div>
          </template>

          <!-- MIXTO -->
          <template v-else>
            <div class="ck-config-card">
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
            </div>

            <div class="ck-config-meta">
              <div class="ck-config-meta__item">
                <span class="k">Total</span>
                <strong class="v">{{ money(totalSafe) }}</strong>
              </div>

              <div class="ck-config-meta__item">
                <span class="k">Pagado</span>
                <strong class="v">{{ money(mixedPaid) }}</strong>
              </div>

              <div class="ck-config-meta__item">
                <span class="k">Falta</span>
                <strong class="v" :class="{ bad: mixedMissing > 0 }">
                  {{ money(mixedMissing) }}
                </strong>
              </div>

              <div class="ck-config-meta__item">
                <span class="k">Vuelto</span>
                <strong class="v" :class="{ ok: mixedChange > 0 }">
                  {{ money(mixedChange) }}
                </strong>
              </div>
            </div>
          </template>
        </div>
      </section>

      <!-- ETAPA 3: confirmar -->
      <section v-else class="ck-stage">
        <div class="ck-stage-head">
          <div class="ck-stage-title">Confirmación</div>
          <div class="ck-stage-help">
            Revisá lo justo y presioná Enter para seguir
          </div>
        </div>

        <div class="ck-confirm-card">
          <div class="ck-confirm-main">
            <div class="ck-confirm-total-label">Total a cobrar</div>
            <div class="ck-confirm-total">{{ money(totalSafe) }}</div>
          </div>

          <div class="ck-confirm-grid">
            <div class="ck-confirm-row">
              <span>Medio</span>
              <strong>{{ paymentSummaryLabel }}</strong>
            </div>

            <div class="ck-confirm-row">
              <span>Prev.</span>
              <strong>{{ money(previewSafeSafe) }}</strong>
            </div>

            <div class="ck-confirm-row">
              <span>Pagado</span>
              <strong>{{ money(paidSafeValue) }}</strong>
            </div>

            <div class="ck-confirm-row">
              <span>Vuelto</span>
              <strong>{{ money(changeSafeValue) }}</strong>
            </div>

            <div
              v-if="!state.mixedMode && selectedMethodSupportsInstallments"
              class="ck-confirm-row"
            >
              <span>Cuotas</span>
              <strong>{{ state.installments || 1 }}</strong>
            </div>

            <div
              v-if="!state.mixedMode && selectedMethodNeedsCardKind"
              class="ck-confirm-row"
            >
              <span>Tipo</span>
              <strong>{{ state.cardKind === 'DEBIT' ? 'Débito' : 'Crédito' }}</strong>
            </div>
          </div>

          <div class="ck-confirm-note">
            <v-icon size="16">mdi-keyboard-return</v-icon>
            <span>Enter continúa · Backspace vuelve</span>
          </div>
        </div>
      </section>
    </div>

    <div class="ck-pay-pos__footer">
      <div class="ck-kbd-inline">
        {{ footerHint }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";

import PaymentMethodSelector from "../payment/PaymentMethodSelector.vue";
import PaymentSingle from "../payment/PaymentSingle.vue";
import PaymentMixed from "../payment/PaymentMixed.vue";

const props = defineProps({
  state: { type: Object, required: true },

  visiblePaymentMethods: { type: Array, default: () => [] },
  selectedMethod: { type: Object, default: null },

  singleInstallmentItems: { type: Array, default: () => [] },
  cardKindItems: { type: Array, default: () => [] },
  mixedMethodItems: { type: Array, default: () => [] },

  singleUsesCashEntry: { type: Boolean, default: false },
  singleMissing: { type: Number, default: 0 },
  singleChange: { type: Number, default: 0 },

  totalSafe: { type: Number, default: 0 },
  mixedPaid: { type: Number, default: 0 },
  mixedMissing: { type: Number, default: 0 },
  mixedChange: { type: Number, default: 0 },

  step1Errors: { type: Array, default: () => [] },
  cashErrorFinal: { type: Boolean, default: false },
  cashErrorMsgFinal: { type: String, default: "" },

  methodLabel: { type: Function, required: true },
  methodIcon: { type: Function, required: true },
  methodNeedsCardKind: { type: Function, required: true },
  methodSupportsInstallments: { type: Function, required: true },
  methodNeedsReference: { type: Function, required: true },

  rowMethodNeedsCardKind: { type: Function, default: () => false },
  rowMethodSupportsInstallments: { type: Function, default: () => false },
  rowMethodNeedsReference: { type: Function, default: () => false },
  mixedInstallmentItems: { type: Array, default: () => [] },
  mixedRowAmountError: { type: Function, default: () => false },

  money: { type: Function, required: true },
  singleCashRef: { type: Object, default: null },
  setMixedAmountRef: { type: Function, default: null },

  cursorIndex: { type: Number, default: 0 },
  cursorTarget: {
    type: String,
    default: "method",
  },
  selectorActive: { type: Boolean, default: false },

  previewSafe: { type: Number, default: 0 },
  paidSafe: { type: Number, default: 0 },
  changeSafe: { type: Number, default: 0 },
});

const emit = defineEmits([
  "select-single-method",
  "toggle-mixed-mode",
  "quick-cash",
  "set-card-kind",
  "add-mixed-row",
  "remove-mixed-row",
  "primary-enter",
]);

const stage = ref("select");

const selectedMethodLabel = computed(() => {
  if (props.state?.mixedMode) return "Mixto";
  if (!props.selectedMethod) return "";
  return props.methodLabel(props.selectedMethod);
});

const selectedMethodNeedsCardKind = computed(() => {
  return !props.state?.mixedMode && !!props.selectedMethod && props.methodNeedsCardKind(props.selectedMethod);
});

const selectedMethodSupportsInstallments = computed(() => {
  return (
    !props.state?.mixedMode &&
    !!props.selectedMethod &&
    props.methodSupportsInstallments(props.selectedMethod)
  );
});

const singlePaidSafe = computed(() => {
  if (!props.singleUsesCashEntry) return props.totalSafe || 0;
  const raw = String(props.state?.cashInput ?? "").trim();
  if (!raw) return 0;
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
});

const paidSafeValue = computed(() => {
  if (props.state?.mixedMode) return props.mixedPaid || 0;
  if (props.singleUsesCashEntry) return singlePaidSafe.value;
  return props.totalSafe || 0;
});

const changeSafeValue = computed(() => {
  if (props.state?.mixedMode) return props.mixedChange || 0;
  if (props.singleUsesCashEntry) return props.singleChange || 0;
  return 0;
});

const previewSafeSafe = computed(() => {
  return Number.isFinite(Number(props.previewSafe))
    ? Number(props.previewSafe)
    : Number(props.totalSafe || 0);
});

const paymentSummaryLabel = computed(() => {
  if (props.state?.mixedMode) return "Mixto";
  return selectedMethodLabel.value || "—";
});

const stageLabel = computed(() => {
  if (stage.value === "select") return "1 · Medio";
  if (stage.value === "config") return "2 · Configuración";
  return "3 · Confirmación";
});

const headerSubtitle = computed(() => {
  if (stage.value === "select") {
    return "Elegí el medio y avanzá rápido con Enter";
  }

  if (stage.value === "config") {
    return props.state?.mixedMode
      ? "Solo ves la configuración del cobro mixto"
      : "Solo ves la configuración del medio elegido";
  }

  return "Vista final compacta antes de continuar";
});

const configHelpText = computed(() => {
  if (props.state?.mixedMode) {
    return "Completá importes por fila y Enter sigue";
  }

  if (props.singleUsesCashEntry) {
    return "Ingresá efectivo recibido y Enter sigue";
  }

  if (selectedMethodNeedsCardKind.value && selectedMethodSupportsInstallments.value) {
    return "Elegí tipo, cuotas y seguí con Enter";
  }

  if (selectedMethodNeedsCardKind.value) {
    return "Elegí tipo de tarjeta y seguí con Enter";
  }

  if (selectedMethodSupportsInstallments.value) {
    return "Elegí cuotas y seguí con Enter";
  }

  return "Configuración rápida y Enter para continuar";
});

const footerHint = computed(() => {
  if (stage.value === "select") {
    return "← → mover · ↑ ↓ cambiar bloque · Enter elegir · Backspace volver";
  }

  if (stage.value === "config") {
    return "Enter continuar · Backspace volver al medio";
  }

  return "Enter continuar · Backspace volver a configuración";
});

watch(
  () => props.state?.mixedMode,
  () => {
    if (stage.value !== "select" && !hasValidSelection()) {
      stage.value = "select";
    }
  }
);

watch(
  () => props.state?.paymentMethodId,
  () => {
    if (stage.value !== "select" && !hasValidSelection()) {
      stage.value = "select";
    }
  }
);

function hasValidSelection() {
  if (props.state?.mixedMode) return true;
  return !!props.selectedMethod && !!Number(props.state?.paymentMethodId || 0);
}

function handleSelectSingleMethod(methodId) {
  emit("select-single-method", methodId);
}

function handleToggleMixedMode() {
  emit("toggle-mixed-mode");
}

function goToConfig() {
  if (!hasValidSelection()) return false;
  stage.value = "config";

  nextTick(() => {
    if (!props.state?.mixedMode && props.singleUsesCashEntry && props.singleCashRef?.value) {
      const input =
        props.singleCashRef.value?.$el?.querySelector?.("input") ||
        props.singleCashRef.value?.$el ||
        props.singleCashRef.value;
      input?.focus?.();
      input?.select?.();
    }
  });

  return true;
}

function confirmConfig() {
  if (!isConfigReady()) return false;
  stage.value = "confirm";
  return true;
}

function backFromConfig() {
  stage.value = "select";
  return true;
}

function backFromConfirm() {
  stage.value = "config";
  return true;
}

function isConfigReady() {
  if (props.state?.mixedMode) {
    return Number(props.mixedMissing || 0) <= 0 && Number(props.mixedPaid || 0) > 0;
  }

  if (!props.selectedMethod) return false;

  if (props.singleUsesCashEntry) {
    const paid = Number(singlePaidSafe.value || 0);
    return paid >= Number(props.totalSafe || 0) && !props.cashErrorFinal;
  }

  return true;
}

function moveMethodHorizontal(direction) {
  const count = Number(props.visiblePaymentMethods?.length || 0);
  const totalSlots = count + 1; // + mixto
  if (!totalSlots) return true;

  let flatIndex = props.cursorTarget === "mixed"
    ? count
    : Math.max(0, Math.min(count - 1, Number(props.cursorIndex || 0)));

  if (direction === "left" && flatIndex > 0) flatIndex -= 1;
  if (direction === "right" && flatIndex < totalSlots - 1) flatIndex += 1;

  if (flatIndex === count) {
    handleToggleMixedMode();
    return true;
  }

  const method = props.visiblePaymentMethods?.[flatIndex];
  if (method?.id != null) {
    handleSelectSingleMethod(method.id);
  }

  return true;
}

function moveMethodVertical(direction) {
  const count = Number(props.visiblePaymentMethods?.length || 0);
  const totalSlots = count + 1;
  if (!totalSlots) return true;

  const cols = window.innerWidth <= 760 ? 1 : 2;
  let flatIndex = props.cursorTarget === "mixed"
    ? count
    : Math.max(0, Math.min(count - 1, Number(props.cursorIndex || 0)));

  if (direction === "down") {
    flatIndex = Math.min(totalSlots - 1, flatIndex + cols);
  } else {
    flatIndex = Math.max(0, flatIndex - cols);
  }

  if (flatIndex === count) {
    handleToggleMixedMode();
    return true;
  }

  const method = props.visiblePaymentMethods?.[flatIndex];
  if (method?.id != null) {
    handleSelectSingleMethod(method.id);
  }

  return true;
}

function setCardKindAndStay(kind) {
  emit("set-card-kind", kind);
}

function handleKeyboardAction(action) {
  if (stage.value === "select") {
    if (action === "left") return moveMethodHorizontal("left");
    if (action === "right") return moveMethodHorizontal("right");
    if (action === "up") return moveMethodVertical("up");
    if (action === "down") return moveMethodVertical("down");

    if (action === "enter") {
      return goToConfig();
    }

    if (action === "backspace") {
      return false;
    }

    return false;
  }

  if (stage.value === "config") {
    if (action === "enter") {
      return confirmConfig();
    }

    if (action === "backspace") {
      return backFromConfig();
    }

    return false;
  }

  if (stage.value === "confirm") {
    if (action === "enter") {
      emit("primary-enter");
      return true;
    }

    if (action === "backspace") {
      return backFromConfirm();
    }

    return false;
  }

  return false;
}

function focusCurrent() {
  nextTick(() => {
    if (stage.value === "config" && !props.state?.mixedMode && props.singleUsesCashEntry && props.singleCashRef?.value) {
      const input =
        props.singleCashRef.value?.$el?.querySelector?.("input") ||
        props.singleCashRef.value?.$el ||
        props.singleCashRef.value;
      input?.focus?.();
      input?.select?.();
    }
  });
}

defineExpose({
  handleKeyboardAction,
  focusCurrent,
});
</script>

<style scoped>
.ck-pay-pos {
  min-height: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border-radius: 18px;
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
}

.ck-pay-pos__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.ck-pay-pos__title {
  font-size: 1.08rem;
  font-weight: 900;
  line-height: 1.1;
}

.ck-pay-pos__subtitle {
  margin-top: 4px;
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.64);
  font-weight: 700;
}

.ck-pay-pos__chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ck-mini-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.07);
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.76rem;
  font-weight: 900;
  white-space: nowrap;
}

.ck-mini-pill--primary {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.ck-pay-pos__body {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
}

.ck-stage {
  min-height: 100%;
  display: grid;
  align-content: start;
  gap: 12px;
}

.ck-stage-head {
  display: grid;
  gap: 4px;
}

.ck-stage-title {
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.1;
}

.ck-stage-help {
  font-size: 0.8rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.64);
}

.ck-inline-errors {
  display: grid;
  gap: 8px;
}

.ck-inline-error {
  min-height: 42px;
  padding: 0 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(var(--v-theme-error), 0.08);
  color: rgb(var(--v-theme-error));
  font-size: 0.84rem;
  font-weight: 800;
}

.ck-focus-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 12px;
  min-width: 0;
}

.ck-config-card {
  min-width: 0;
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.02);
  padding: 12px;
}

.ck-config-meta {
  display: grid;
  align-content: start;
  gap: 10px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.025);
}

.ck-config-meta__item {
  display: grid;
  gap: 4px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}

.ck-config-meta__item:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.ck-config-meta__item .k {
  font-size: 0.75rem;
  font-weight: 800;
  color: rgba(var(--v-theme-on-surface), 0.58);
}

.ck-config-meta__item .v {
  font-size: 0.98rem;
  font-weight: 900;
  color: rgb(var(--v-theme-on-surface));
}

.ck-config-meta__item .v.bad {
  color: rgb(var(--v-theme-error));
}

.ck-config-meta__item .v.ok {
  color: rgb(var(--v-theme-success));
}

.ck-confirm-card {
  display: grid;
  gap: 14px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
  background:
    linear-gradient(
      180deg,
      rgba(var(--v-theme-primary), 0.06) 0%,
      rgba(var(--v-theme-on-surface), 0.02) 100%
    );
}

.ck-confirm-main {
  display: grid;
  gap: 4px;
}

.ck-confirm-total-label {
  font-size: 0.82rem;
  font-weight: 800;
  color: rgba(var(--v-theme-on-surface), 0.64);
}

.ck-confirm-total {
  font-size: 2rem;
  line-height: 1;
  font-weight: 900;
}

.ck-confirm-grid {
  display: grid;
  gap: 10px;
}

.ck-confirm-row {
  min-height: 42px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  background: rgba(var(--v-theme-surface), 0.85);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.92rem;
}

.ck-confirm-note {
  min-height: 40px;
  padding: 0 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  font-size: 0.82rem;
  font-weight: 800;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.ck-pay-pos__footer {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  flex-wrap: wrap;
}

.ck-kbd-inline {
  font-size: 0.8rem;
  font-weight: 800;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

@media (max-width: 920px) {
  .ck-focus-shell {
    grid-template-columns: 1fr;
  }

  .ck-config-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: stretch;
  }

  .ck-config-meta__item {
    border-bottom: 0;
    padding-bottom: 0;
  }
}

@media (max-width: 640px) {
  .ck-pay-pos {
    padding: 10px;
    gap: 10px;
  }

  .ck-confirm-total {
    font-size: 1.72rem;
  }

  .ck-config-meta {
    grid-template-columns: 1fr;
  }
}
</style>