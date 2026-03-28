<template>
  <div class="ck-screen">
    <div class="ck-screen__head">
      <div class="ck-screen__title">Medio de pago</div>
      <div class="ck-screen__subtitle">
        Elegí cómo paga el cliente
      </div>
    </div>

    <div class="ck-screen__body">
      <PaymentMethodSelector
        :methods="visiblePaymentMethods"
        :selected-method-id="state.paymentMethodId"
        :mixed-mode="state.mixedMode"
        :cursor-index="cursorIndex"
        :cursor-target="cursorTarget"
        :selector-active="selectorActive"
        :method-label="methodLabel"
        :method-icon="methodIcon"
        @select-single-method="$emit('select-single-method', $event)"
        @toggle-mixed-mode="$emit('toggle-mixed-mode')"
      />
    </div>
  </div>
</template>

<script setup>
import { nextTick } from "vue";
import PaymentMethodSelector from "../payment/PaymentMethodSelector.vue";

const props = defineProps({
  state: { type: Object, required: true },
  visiblePaymentMethods: { type: Array, default: () => [] },
  selectedMethod: { type: Object, default: null },
  methodLabel: { type: Function, required: true },
  methodIcon: { type: Function, required: true },
  cursorIndex: { type: Number, default: 0 },
  cursorTarget: {
    type: String,
    default: "method",
  },
  selectorActive: { type: Boolean, default: false },
});

const emit = defineEmits([
  "select-single-method",
  "toggle-mixed-mode",
  "move-cursor",
  "back",
  "next",
]);

function focusCurrent() {
  nextTick(() => {});
}

function hasValidSelection() {
  if (props.state?.mixedMode) return true;
  return !!Number(props.state?.paymentMethodId || 0);
}

function handleKeyboardAction(action) {
  if (action === "left") {
    emit("move-cursor", "left");
    return true;
  }

  if (action === "right") {
    emit("move-cursor", "right");
    return true;
  }

  if (action === "up") {
    emit("move-cursor", "up");
    return true;
  }

  if (action === "down") {
    emit("move-cursor", "down");
    return true;
  }

  if (action === "backspace") {
    emit("back");
    return true;
  }

  if (action === "enter") {
    if (!hasValidSelection()) return true;
    emit("next");
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
  gap: 10px;
  padding: 8px 6px 6px;
  border-radius: 16px;
  background: transparent;
}

.ck-screen__head {
  display: grid;
  gap: 2px;
}

.ck-screen__title {
  font-size: clamp(1.14rem, 1.25vw, 1.42rem);
  font-weight: 950;
  line-height: 1;
  letter-spacing: -0.025em;
}

.ck-screen__subtitle {
  font-size: 0.8rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.68);
  line-height: 1.18;
}

.ck-screen__body {
  min-height: 0;
  display: grid;
  align-content: start;
}

.ck-screen__body :deep(.ck-pay-grid) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  align-content: start;
}

.ck-screen__body :deep(.ck-pay) {
  position: relative;
  min-height: 78px;
  border-radius: 16px;
  padding: 12px 64px 12px 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-surface), 0.3);
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  text-align: left;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease,
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

.ck-screen__body :deep(.ck-pay:hover) {
  transform: translateY(-1px);
  border-color: rgba(var(--v-theme-on-surface), 0.2);
}

.ck-screen__body :deep(.ck-pay.active) {
  border-color: rgba(var(--v-theme-primary), 0.95);
  background: rgba(var(--v-theme-primary), 0.12);
  box-shadow:
    0 0 0 1px rgba(var(--v-theme-primary), 0.16),
    inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.ck-screen__body :deep(.ck-pay.cursor) {
  border-color: rgba(var(--v-theme-on-surface), 0.26);
}

.ck-screen__body :deep(.ck-pay.cursorActive) {
  border-color: rgba(var(--v-theme-primary), 1);
  box-shadow:
    0 0 0 2px rgba(var(--v-theme-primary), 0.2),
    0 6px 14px rgba(0, 0, 0, 0.1);
}

.ck-screen__body :deep(.ck-pay__left),
.ck-screen__body :deep(.ck-pay__main),
.ck-screen__body :deep(.ck-pay__content) {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.ck-screen__body :deep(.ck-pay__icon) {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  color: rgb(var(--v-theme-on-surface));
}

.ck-screen__body :deep(.ck-pay.active .ck-pay__icon) {
  background: rgba(var(--v-theme-primary), 0.16);
  color: rgb(var(--v-theme-on-surface));
}

.ck-screen__body :deep(.ck-pay__icon .v-icon),
.ck-screen__body :deep(.ck-pay__icon i) {
  font-size: 19px !important;
  color: inherit !important;
  opacity: 1 !important;
}

.ck-screen__body :deep(.ck-pay__text) {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.ck-screen__body :deep(.ck-pay__title),
.ck-screen__body :deep(.ck-pay__name) {
  font-size: clamp(0.9rem, 0.96vw, 1rem);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -0.015em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgb(var(--v-theme-on-surface)) !important;
  opacity: 1 !important;
}

.ck-screen__body :deep(.ck-pay__hint),
.ck-screen__body :deep(.ck-pay__action) {
  font-size: 0.74rem;
  font-weight: 800;
  color: rgba(var(--v-theme-on-surface), 0.66) !important;
  opacity: 1 !important;
}

.ck-screen__body :deep(.ck-pay.active .ck-pay__title),
.ck-screen__body :deep(.ck-pay.active .ck-pay__name),
.ck-screen__body :deep(.ck-pay.active .ck-pay__hint),
.ck-screen__body :deep(.ck-pay.active .ck-pay__action),
.ck-screen__body :deep(.ck-pay.active .v-icon),
.ck-screen__body :deep(.ck-pay.active i),
.ck-screen__body :deep(.ck-pay.active span),
.ck-screen__body :deep(.ck-pay.active small),
.ck-screen__body :deep(.ck-pay.active div) {
  color: rgb(var(--v-theme-on-surface)) !important;
  opacity: 1 !important;
}

.ck-screen__body :deep(.ck-pay__radio),
.ck-screen__body :deep(.ck-pay__check),
.ck-screen__body :deep(.ck-pay__state) {
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 2px solid rgba(var(--v-theme-on-surface), 0.34);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  background: transparent;
}

.ck-screen__body :deep(.ck-pay.active .ck-pay__radio),
.ck-screen__body :deep(.ck-pay.active .ck-pay__check),
.ck-screen__body :deep(.ck-pay.active .ck-pay__state) {
  border-color: rgb(var(--v-theme-on-surface));
  background: rgba(255, 255, 255, 0.08);
}

.ck-screen__body :deep(.ck-cursor-tag) {
  position: absolute;
  top: 8px;
  right: 40px;
  bottom: auto;
  padding: 3px 7px;
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.14);
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.01em;
  line-height: 1;
  pointer-events: none;
  max-width: calc(100% - 92px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 1100px) {
  .ck-screen__body :deep(.ck-pay-grid) {
    gap: 10px;
  }

  .ck-screen__body :deep(.ck-pay) {
    min-height: 74px;
    padding: 11px 60px 11px 13px;
  }
}

@media (max-width: 960px) {
  .ck-screen {
    padding: 4px 0 0;
  }

  .ck-screen__body :deep(.ck-pay-grid) {
    grid-template-columns: 1fr;
    gap: 9px;
  }

  .ck-screen__body :deep(.ck-pay) {
    min-height: 72px;
  }
}

@media (max-width: 760px) {
  .ck-screen__title {
    font-size: 1.08rem;
  }

  .ck-screen__subtitle {
    font-size: 0.76rem;
  }

  .ck-screen__body :deep(.ck-pay) {
    padding: 10px 56px 10px 12px;
    border-radius: 15px;
    min-height: 68px;
  }

  .ck-screen__body :deep(.ck-pay__title),
  .ck-screen__body :deep(.ck-pay__name) {
    font-size: 0.88rem;
  }

  .ck-screen__body :deep(.ck-pay__icon) {
    width: 33px;
    height: 33px;
    border-radius: 10px;
  }

  .ck-screen__body :deep(.ck-pay__icon .v-icon),
  .ck-screen__body :deep(.ck-pay__icon i) {
    font-size: 17px !important;
  }

  .ck-screen__body :deep(.ck-pay__radio),
  .ck-screen__body :deep(.ck-pay__check),
  .ck-screen__body :deep(.ck-pay__state) {
    width: 18px;
    height: 18px;
    right: 12px;
  }

  .ck-screen__body :deep(.ck-cursor-tag) {
    top: 7px;
    right: 34px;
    font-size: 0.64rem;
    padding: 3px 6px;
    max-width: calc(100% - 82px);
  }
}
</style>