<template>
  <div class="ck-screen" ref="rootRef" tabindex="-1">
    <div class="ck-screen__head">
      <div class="ck-screen__title">Elegí medio de pago</div>
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
import { nextTick, ref } from "vue";
import PaymentMethodSelector from "../payment/PaymentMethodSelector.vue";

const rootRef = ref(null);

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
  nextTick(() => {
    // Foco al contenedor raíz para que el handler global capture teclas
    // sin interferir con inputs (no hay inputs en esta pantalla)
    rootRef.value?.focus?.();
  });
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
  padding: 4px 6px 6px;
  outline: none;
}

.ck-screen__head {
  display: grid;
  gap: 2px;
  padding-inline: 2px;
}

.ck-screen__title {
  font-size: 0.98rem;
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: rgb(var(--v-theme-on-surface));
}

.ck-screen__subtitle {
  font-size: 0.72rem;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.6);
  line-height: 1.12;
}

.ck-screen__body {
  min-height: 0;
}
</style>