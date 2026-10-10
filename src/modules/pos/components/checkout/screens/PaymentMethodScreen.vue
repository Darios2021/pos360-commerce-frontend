<template>
  <div class="ck-screen" ref="rootRef" tabindex="-1">
    <div class="ck-screen__head">
      <div class="ck-screen__title">Elegí medio de pago</div>
    </div>

    <!-- Cliente mayorista: con qué precio se cobra. -->
    <div v-if="clienteMayorista" class="cpm">
      <div class="cpm-cli">
        <span class="cpm-av">{{ String(clienteMayorista).trim().charAt(0).toUpperCase() }}</span>
        <span class="cpm-txt"><b>{{ clienteMayorista }}</b><span class="cpm-tag">Mayorista</span></span>
      </div>
      <div class="cpm-seg" role="radiogroup" aria-label="Precio de la venta">
        <button type="button" role="radio" :aria-checked="state.applyReseller" :class="{ 'is-on': state.applyReseller }" @click="state.applyReseller = true">
          <v-icon size="22">mdi-tag-outline</v-icon>Precio revendedor
        </button>
        <button type="button" role="radio" :aria-checked="!state.applyReseller" :class="{ 'is-on': !state.applyReseller }" @click="state.applyReseller = false">
          <v-icon size="22">mdi-cash</v-icon>Precio normal
        </button>
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

/* Cliente mayorista (10/10): ficha y dos botones grandes para el precio. */
.cpm { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 16px; padding: 12px 14px; border-radius: 12px; background: #eef7fd; border: 1px solid #8cc0e3; }
.cpm-cli { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 200px; }
.cpm-av { width: 40px; height: 40px; border-radius: 9999px; background: #0f6fae; color: #ffffff; display: flex; align-items: center; justify-content: center; font: 900 17px Inter, sans-serif; flex-shrink: 0; }
.cpm-txt { display: flex; flex-direction: column; min-width: 0; }
.cpm-txt b { font-size: 16px; font-weight: 800; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cpm-tag { align-self: flex-start; margin-top: 2px; padding: 2px 8px; border-radius: 9999px; background: #0f6fae; color: #ffffff; font-size: 11px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
.cpm-seg { display: flex; gap: 8px; }
.cpm-seg button { height: 48px; display: flex; align-items: center; gap: 8px; padding: 0 16px; border-radius: 10px; border: 1px solid #c9d5e1; background: #ffffff; color: #334155; font: 800 15px Inter, sans-serif; cursor: pointer; transition: background-color 120ms ease, border-color 120ms ease; }
.cpm-seg button .v-icon { color: #5a6678; }
.cpm-seg button:hover { background: #cfe5f5; border-color: #3f8fc6; }
.cpm-seg button.is-on { background: #0f6fae; border-color: #0f6fae; color: #ffffff; box-shadow: 0 4px 12px rgba(15, 111, 174, 0.25); }
.cpm-seg button.is-on .v-icon { color: #ffffff; }
</style>