<template>
  <div v-if="selectedMethod" class="ck-single">
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
  });
}

function handleKeyboardAction(action) {
  if (props.singleUsesCashEntry) {
    return !!paymentCashRef.value?.handleKeyboardAction?.(action);
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

<style scoped>
.ck-single {
  display: grid;
  gap: 12px;
}

.ck-sections {
  display: grid;
  gap: 12px;
}

.ck-section {
  display: grid;
  gap: 8px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.ck-section.active {
  border-color: rgba(var(--v-theme-primary), 0.28);
  box-shadow: 0 0 0 1px rgba(var(--v-theme-primary), 0.08);
}

.ck-section__label {
  font-size: 0.8rem;
  font-weight: 900;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.ck-section--reference {
  padding: 14px;
}

.ck-pay-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.ck-pay-grid--installments {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.ck-pay {
  position: relative;
  min-height: 72px;
  border-radius: 16px;
  padding: 12px 58px 12px 14px;
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

.ck-pay:hover {
  transform: translateY(-1px);
  border-color: rgba(var(--v-theme-on-surface), 0.2);
}

.ck-pay.active {
  border-color: rgba(var(--v-theme-primary), 0.95);
  background: rgba(var(--v-theme-primary), 0.1);
  box-shadow:
    0 0 0 1px rgba(var(--v-theme-primary), 0.14),
    inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.ck-pay.cursor {
  border-color: rgba(var(--v-theme-on-surface), 0.28);
}

.ck-pay.cursorActive {
  border-color: rgba(var(--v-theme-primary), 1);
  box-shadow:
    0 0 0 2px rgba(var(--v-theme-primary), 0.18),
    0 6px 14px rgba(0, 0, 0, 0.08);
}

.ck-pay:disabled {
  opacity: 0.52;
  cursor: not-allowed;
  transform: none;
}

.ck-pay__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.ck-pay__icon {
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

.ck-pay.active .ck-pay__icon {
  background: rgba(var(--v-theme-primary), 0.16);
}

.ck-pay__text {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.ck-pay__title {
  font-size: 0.98rem;
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -0.015em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgb(var(--v-theme-on-surface));
}

.ck-pay__hint {
  font-size: 0.76rem;
  font-weight: 800;
  line-height: 1.05;
  color: rgba(var(--v-theme-on-surface), 0.68);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ck-pay__state {
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
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
}

.ck-pay.active .ck-pay__state {
  border-color: rgb(var(--v-theme-on-surface));
  background: rgba(255, 255, 255, 0.08);
}

.ck-cursor-tag {
  position: absolute;
  top: 8px;
  right: 40px;
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

.ck-field {
  width: 100%;
}

.ck-empty {
  min-height: 180px;
  padding: 18px;
  border-radius: 18px;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.14);
  background: rgba(var(--v-theme-on-surface), 0.02);
  display: grid;
  align-content: center;
  gap: 6px;
}

.ck-empty__title {
  font-size: 1rem;
  font-weight: 900;
}

.ck-empty__text {
  font-size: 0.86rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.58);
}

@media (max-width: 960px) {
  .ck-pay-grid {
    grid-template-columns: 1fr;
  }

  .ck-pay-grid--installments {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .ck-section {
    padding: 10px;
  }

  .ck-pay {
    min-height: 68px;
    padding: 10px 54px 10px 12px;
    border-radius: 15px;
  }

  .ck-pay__title {
    font-size: 0.92rem;
  }

  .ck-pay__hint {
    font-size: 0.72rem;
  }

  .ck-pay__icon {
    width: 33px;
    height: 33px;
    border-radius: 10px;
  }

  .ck-pay__state {
    width: 18px;
    height: 18px;
    right: 12px;
  }

  .ck-cursor-tag {
    top: 7px;
    right: 34px;
    font-size: 0.64rem;
    padding: 3px 6px;
    max-width: calc(100% - 82px);
  }
}
</style>