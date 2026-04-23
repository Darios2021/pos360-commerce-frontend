<template>
  <div v-if="selectedMethod" class="ck-single" ref="rootRef" tabindex="-1">
    <PaymentCashInput
      v-if="singleUsesCashEntry"
      ref="paymentCashRef"
      :cash-ref="singleCashRef"
      :model-value="state.cashInput"
      :total="totalSafe"
      :missing="singleMissing"
      :change="singleChange"
      :error="cashErrorFinal"
      :error-message="cashErrorMsgFinal"
      :money="money"
      @update:model-value="state.cashInput = $event"
      @quick-cash="$emit('quick-cash', $event)"
      @primary-enter="$emit('primary-enter')"
    />

    <div v-if="hasExtraFields" class="ck-sections">
      <section
        v-if="showCardKind"
        class="ck-section"
        :class="{ active: activeGroupKey === 'cardKind' }"
      >
        <div class="ck-section__label">Tipo de tarjeta</div>

        <div class="ck-pay-grid">
          <button
            v-for="(item, idx) in cardKindChoices"
            :key="item.value"
            type="button"
            class="ck-pay"
            :class="{
              active: state.cardKind === item.value,
              cursor: activeGroupKey === 'cardKind' && cursorIndex === idx,
              cursorActive: activeGroupKey === 'cardKind' && cursorIndex === idx
            }"
            @click="selectCardKind(item.value, idx)"
          >
            <div class="ck-pay__left">
              <span class="ck-pay__icon">
                <v-icon size="18">{{ item.icon }}</v-icon>
              </span>

              <div class="ck-pay__text">
                <span class="ck-pay__title">{{ item.title }}</span>
              </div>
            </div>

            <span
              v-if="activeGroupKey === 'cardKind' && cursorIndex === idx"
              class="ck-cursor-tag"
            >
              Elegir
            </span>

            <span class="ck-pay__state">
              <v-icon
                v-if="state.cardKind === item.value"
                size="14"
              >
                mdi-check
              </v-icon>
            </span>
          </button>
        </div>
      </section>

      <section
        v-if="showInstallments"
        class="ck-section"
        :class="{ active: activeGroupKey === 'installments' }"
      >
        <div class="ck-section__label">Cuotas</div>

        <div class="ck-pay-grid ck-pay-grid--installments">
          <button
            v-for="(item, idx) in installmentChoices"
            :key="item.value"
            type="button"
            class="ck-pay ck-pay--installment"
            :class="{
              active: Number(state.installments || 1) === Number(item.value),
              cursor: activeGroupKey === 'installments' && cursorIndex === idx,
              cursorActive: activeGroupKey === 'installments' && cursorIndex === idx
            }"
            :disabled="showCardKind && state.cardKind === 'DEBIT'"
            @click="selectInstallment(item.value, idx)"
          >
            <div class="ck-pay__left">
              <span class="ck-pay__icon">
                <v-icon size="18">mdi-credit-card-outline</v-icon>
              </span>

              <div class="ck-pay__text">
                <span class="ck-pay__title">{{ item.title }}</span>
                <span class="ck-pay__hint">{{ item.amountLabel }}</span>
              </div>
            </div>

            <span
              v-if="activeGroupKey === 'installments' && cursorIndex === idx"
              class="ck-cursor-tag"
            >
              Elegir
            </span>

            <span class="ck-pay__state">
              <v-icon
                v-if="Number(state.installments || 1) === Number(item.value)"
                size="14"
              >
                mdi-check
              </v-icon>
            </span>
          </button>
        </div>
      </section>

      <section
        v-if="showReference"
        class="ck-section ck-section--reference"
      >
        <v-text-field
          v-model="state.paymentProof"
          variant="outlined"
          density="comfortable"
          hide-details
          class="ck-field"
          placeholder="Ingresar referencia"
          @keydown.enter="$emit('primary-enter')"
        />
      </section>
    </div>
  </div>

  <div v-else class="ck-empty">
    <div class="ck-empty__title">Sin medio seleccionado</div>
    <div class="ck-empty__text">
      Elegí un medio de pago para continuar.
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from "vue";
import PaymentCashInput from "./PaymentCashInput.vue";

const props = defineProps({
  state: { type: Object, required: true },
  selectedMethod: { type: Object, default: null },
  singleInstallmentItems: { type: Array, default: () => [] },
  singleUsesCashEntry: { type: Boolean, default: false },
  singleMissing: { type: Number, default: 0 },
  singleChange: { type: Number, default: 0 },
  cashErrorFinal: { type: Boolean, default: false },
  cashErrorMsgFinal: { type: String, default: "" },
  methodLabel: { type: Function, required: true },
  methodNeedsCardKind: { type: Function, required: true },
  methodSupportsInstallments: { type: Function, required: true },
  methodNeedsReference: { type: Function, required: true },
  money: { type: Function, required: true },
  singleCashRef: { type: Object, default: null },
  totalSafe: { type: Number, default: 0 },
});

const emit = defineEmits([
  "quick-cash",
  "set-card-kind",
  "primary-enter",
]);

const paymentCashRef = ref(null);
const activeGroupKey = ref(null);
const cursorIndex = ref(0);
const rootRef = ref(null);

const cardKindChoices = [
  {
    title: "Débito",
    value: "DEBIT",
    icon: "mdi-credit-card-outline",
  },
  {
    title: "Crédito",
    value: "CREDIT",
    icon: "mdi-credit-card-check-outline",
  },
];

const showCardKind = computed(() => {
  return !!props.selectedMethod && props.methodNeedsCardKind(props.selectedMethod);
});

const showInstallments = computed(() => {
  return !!props.selectedMethod && props.methodSupportsInstallments(props.selectedMethod);
});

const showReference = computed(() => {
  return !!props.selectedMethod && props.methodNeedsReference(props.selectedMethod);
});

const hasExtraFields = computed(() => {
  return showCardKind.value || showInstallments.value || showReference.value;
});

const installmentChoices = computed(() => {
  return (props.singleInstallmentItems || []).map((item) => {
    const installments = Number(item?.value || 1);
    const amount =
      installments > 0
        ? Number(props.totalSafe || 0) / installments
        : Number(props.totalSafe || 0);

    return {
      title: item?.title || `${installments} cuota`,
      value: installments,
      amount,
      amountLabel: `${props.money(amount)} c/u`,
    };
  });
});

const interactiveGroups = computed(() => {
  const groups = [];

  if (showCardKind.value) {
    groups.push({
      key: "cardKind",
      items: cardKindChoices,
    });
  }

  if (showInstallments.value) {
    groups.push({
      key: "installments",
      items: installmentChoices.value,
    });
  }

  return groups;
});

function normalizeIndex(groupKey) {
  if (groupKey === "cardKind") {
    const idx = cardKindChoices.findIndex((x) => x.value === props.state.cardKind);
    return idx >= 0 ? idx : 0;
  }

  if (groupKey === "installments") {
    const idx = installmentChoices.value.findIndex(
      (x) => Number(x.value) === Number(props.state.installments || 1)
    );
    return idx >= 0 ? idx : 0;
  }

  return 0;
}

function initCursor() {
  const first = interactiveGroups.value[0];
  if (!first) {
    activeGroupKey.value = null;
    cursorIndex.value = 0;
    return;
  }

  if (
    !activeGroupKey.value ||
    !interactiveGroups.value.some((g) => g.key === activeGroupKey.value)
  ) {
    activeGroupKey.value = first.key;
  }

  cursorIndex.value = normalizeIndex(activeGroupKey.value);
}

function selectCardKind(value, idx = 0) {
  props.state.cardKind = value;
  activeGroupKey.value = "cardKind";
  cursorIndex.value = idx;
  emit("set-card-kind", value);

  if (value === "DEBIT") {
    props.state.installments = 1;
  }
}

function selectInstallment(value, idx = 0) {
  if (showCardKind.value && props.state.cardKind === "DEBIT") return;
  props.state.installments = Number(value || 1);
  activeGroupKey.value = "installments";
  cursorIndex.value = idx;
}

function moveHorizontal(direction) {
  const group = interactiveGroups.value.find((g) => g.key === activeGroupKey.value);
  if (!group) return false;

  const last = group.items.length - 1;
  let next = cursorIndex.value;

  if (direction === "left" && next > 0) next -= 1;
  if (direction === "right" && next < last) next += 1;

  cursorIndex.value = next;

  const item = group.items[next];
  if (!item) return true;

  if (group.key === "cardKind") {
    selectCardKind(item.value, next);
    return true;
  }

  if (group.key === "installments") {
    selectInstallment(item.value, next);
    return true;
  }

  return true;
}

function moveVertical(direction) {
  const groups = interactiveGroups.value;
  if (!groups.length) return false;

  const currentIdx = groups.findIndex((g) => g.key === activeGroupKey.value);
  let nextGroupIdx = currentIdx >= 0 ? currentIdx : 0;

  if (direction === "up" && nextGroupIdx > 0) nextGroupIdx -= 1;
  if (direction === "down" && nextGroupIdx < groups.length - 1) nextGroupIdx += 1;

  const nextGroup = groups[nextGroupIdx];
  if (!nextGroup) return true;

  activeGroupKey.value = nextGroup.key;
  cursorIndex.value = normalizeIndex(nextGroup.key);
  return true;
}

function focusCurrent() {
  nextTick(() => {
    if (props.singleUsesCashEntry) {
      paymentCashRef.value?.focusCurrent?.();
      return;
    }

    initCursor();
    // Enfocar contenedor para que el handler global reciba teclas
    rootRef.value?.focus?.();
  });
}

function handleKeyboardAction(action) {
  if (props.singleUsesCashEntry) {
    return !!paymentCashRef.value?.handleKeyboardAction?.(action);
  }

  // Dígitos en métodos no-cash no hacen nada
  if (typeof action === "string" && action.startsWith("digit:")) {
    return false;
  }

  if (!interactiveGroups.value.length) {
    if (showReference.value) {
      if (action === "enter") {
        emit("primary-enter");
        return true;
      }
      return false;
    }
    return false;
  }

  if (action === "left") return moveHorizontal("left");
  if (action === "right") return moveHorizontal("right");
  if (action === "up") return moveVertical("up");
  if (action === "down") return moveVertical("down");

  if (action === "enter") {
    emit("primary-enter");
    return true;
  }

  return false;
}

watch(
  () => [props.selectedMethod, props.state.cardKind, props.state.installments, props.totalSafe],
  () => {
    initCursor();
  },
  { immediate: true }
);

defineExpose({
  focusCurrent,
  handleKeyboardAction,
});
</script>

<!-- SOLO TE DEJO EL STYLE CORREGIDO (EL TEMPLATE Y SCRIPT YA ESTÁN BIEN) -->
<style scoped>
.ck-single {
  display: grid;
  gap: 10px;
  outline: none;
}

.ck-sections {
  display: grid;
  gap: 10px;
}

.ck-section {
  display: grid;
  gap: 6px;
  padding: 0;            /* 🔥 sin padding contenedor */
  border: none;          /* 🔥 sin caja */
  background: transparent;
}



.ck-section__label {
  font-size: 0.76rem;
  font-weight: 900;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

/* =========================
   GRID
========================= */
.ck-pay-grid {
  display: grid;
  gap: 10px;
  width: 100%;
  min-width: 0;

  grid-template-columns: repeat(2, minmax(0, 1fr));

  /* 🔥 CLAVE */
  overflow: visible;
}

.ck-pay-grid--installments {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

/* Color tokens */
.ck-pay { --pc: 99, 102, 241; }
.ck-pay[data-kind="credit"] { --pc: 59, 130, 246; }
.ck-pay[data-kind="debit"] { --pc: 34, 197, 94; }
.ck-pay[data-kind="prepaid"] { --pc: 245, 158, 11; }

/* =========================
   CARD
========================= */
.ck-pay {
  position: relative;
  z-index: 1;

  width: 100%;
  min-width: 0;
  min-height: 56px;

  border-radius: 12px;
  padding: 8px 40px 8px 10px;

  border: 1.5px solid rgba(var(--pc), 0.18);
  background: rgba(var(--pc), 0.06);

  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;

  transition:
    border-color 0.14s ease,
    background 0.14s ease,
    transform 0.13s ease,
    box-shadow 0.14s ease;
}

.ck-pay:hover {
  transform: translateY(-1px);
  border-color: rgba(var(--pc), 0.36);
  box-shadow: 0 4px 12px rgba(var(--pc), 0.15);
}

.ck-pay.active,
.ck-pay.cursorActive {
  z-index: 3;
  background: rgb(var(--pc));
  border-color: rgb(var(--pc));
  box-shadow:
    0 0 0 3px rgba(var(--pc), 0.22),
    0 6px 16px rgba(var(--pc), 0.28);
  transform: translateY(-1px);
}

.ck-pay.cursor {
  border-color: rgba(var(--pc), 0.5);
}

.ck-pay:disabled {
  opacity: 0.4;
}

/* =========================
   CONTENIDO
========================= */
.ck-pay__left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.ck-pay__icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: rgba(var(--pc), 0.14);
  color: rgb(var(--pc));
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}

.ck-pay.active .ck-pay__icon,
.ck-pay.cursorActive .ck-pay__icon {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.ck-pay__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ck-pay__title {
  font-size: 0.82rem;
  font-weight: 800;
  transition: color 0.15s;
}

.ck-pay.active .ck-pay__title,
.ck-pay.cursorActive .ck-pay__title {
  color: #fff;
}

.ck-pay__hint {
  font-size: 0.66rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.6);
  transition: color 0.15s;
}

.ck-pay.active .ck-pay__hint,
.ck-pay.cursorActive .ck-pay__hint {
  color: rgba(255, 255, 255, 0.82);
}

/* =========================
   CHECK
========================= */
.ck-pay__state {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  color: rgba(var(--pc), 0.5);
  transition: color 0.15s;
}

.ck-pay.active .ck-pay__state,
.ck-pay.cursorActive .ck-pay__state {
  color: rgba(255, 255, 255, 0.85);
}

/* =========================
   TAG (ELEGIR)
========================= */
.ck-cursor-tag {
  position: absolute;

  /* 🔥 AHORA NO SE CORTA */
  top: -12px;
  right: 14px;

  z-index: 5;

  height: 22px;
  padding: 0 10px;

  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 900;

  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.25);

  backdrop-filter: blur(6px);

  box-shadow:
    0 2px 6px rgba(0,0,0,0.3);
}

/* =========================
   EMPTY
========================= */
.ck-empty {
  min-height: 160px;
  padding: 16px;
  border-radius: 16px;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.14);
  background: rgba(var(--v-theme-on-surface), 0.02);
}

/* =========================
   RESPONSIVE
========================= */
@media (max-width: 1100px) {
  .ck-pay-grid--installments {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .ck-pay-grid {
    grid-template-columns: 1fr;
  }

  .ck-pay-grid--installments {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>