<template>
  <div class="ck-screen">
 

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
.ck-pay-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 360px));
  justify-content: start;
  gap: 6px 8px;
  width: 100%;
  max-width: 760px;
}

.ck-pay {
  position: relative;
  min-height: 52px;
  padding: 6px 8px;
  border-radius: 12px;

  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-on-surface), 0.02);

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;

  transition: all 0.12s ease;
}

.ck-pay-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.ck-pay-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ck-pay-icon :deep(.v-icon) {
  font-size: 18px !important;
}

.ck-pay-name {
  font-size: 0.78rem;
  font-weight: 800;
}

.ck-pay-state {
  font-size: 18px;
}

.ck-cursor-tag {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 0.48rem;
  height: 14px;
  padding: 0 4px;
  border-radius: 999px;
}

.ck-pay.active {
  border: 2px solid rgba(var(--v-theme-primary), 0.9);
  background: rgba(var(--v-theme-primary), 0.08);
}

/* responsive */
@media (max-width: 960px) {
  .ck-pay-grid {
    grid-template-columns: repeat(2, 1fr);
    max-width: none;
  }
}

@media (max-width: 760px) {
  .ck-pay-grid {
    grid-template-columns: 1fr;
  }
}
</style>