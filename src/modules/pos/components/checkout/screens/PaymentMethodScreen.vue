<template>
  <div class="ck-screen" ref="rootRef" tabindex="-1">
    <div class="ck-screen__head">
      <div class="ck-screen__title">Elegí medio de pago</div>
    </div>

    <!-- Cliente mayorista: con que precio se cobra. -->
    <div v-if="clienteMayorista" class="ck-precio">
      <div class="ck-precio__cliente">
        <v-icon size="16">mdi-account-tie-outline</v-icon>
        {{ clienteMayorista }}
      </div>
      <v-btn-toggle
        :model-value="state.applyReseller ? 'revendedor' : 'normal'"
        mandatory
        density="comfortable"
        color="primary"
        variant="outlined"
        divided
        @update:model-value="(v) => (state.applyReseller = v === 'revendedor')"
      >
        <v-btn value="revendedor">Precio revendedor</v-btn>
        <v-btn value="normal">Precio normal</v-btn>
      </v-btn-toggle>
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
import { computed, nextTick, ref } from "vue";
import PaymentMethodSelector from "../payment/PaymentMethodSelector.vue";
import { usePosStore } from "@/app/store/pos.store";
import { esMayorista } from "@/app/utils/clienteMayorista";

const posStore = usePosStore();
// Nombre del cliente si es mayorista; vacio si no (y el bloque no se muestra).
const clienteMayorista = computed(() =>
  esMayorista(posStore.clienteVenta) ? posStore.clienteVenta?.display_name || "Cliente mayorista" : ""
);

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
  grid-template-rows: auto auto 1fr;
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

.ck-precio {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.07);
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
}

.ck-precio__cliente {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 0.9rem;
}
</style>