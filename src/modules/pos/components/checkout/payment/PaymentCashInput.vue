<template>
  <div class="ck-cash">
    <div class="ck-cash__quick">
      <button
        ref="quickRefs"
        type="button"
        class="ck-cash-btn"
        :class="{
          active: quickMode === 'exact',
          cursor: cursorIndex === 0,
          cursorActive: cursorIndex === 0
        }"
        @click="applyExactAndContinue"
      >
        <span class="ck-cash-btn__label">Exacto</span>
        <strong class="ck-cash-btn__value">{{ money(total) }}</strong>
      </button>

      <button
        ref="quickRefs"
        type="button"
        class="ck-cash-btn"
        :class="{
          active: quickMode === 'rounded',
          cursor: cursorIndex === 1,
          cursorActive: cursorIndex === 1
        }"
        @click="applyRoundedAndContinue"
      >
        <span class="ck-cash-btn__label">Redondeado</span>
        <strong class="ck-cash-btn__value">{{ money(roundedAmount) }}</strong>
      </button>

      <button
        ref="quickRefs"
        type="button"
        class="ck-cash-btn ck-cash-btn--manual"
        :class="{
          active: manualMode,
          cursor: cursorIndex === 2,
          cursorActive: cursorIndex === 2
        }"
        @click="enableManualMode"
      >
        <span class="ck-cash-btn__label">Insertar</span>
        <strong class="ck-cash-btn__value">Manual</strong>
      </button>
    </div>

    <transition name="ck-fade">
      <div v-if="manualMode" class="ck-cash__manual">
        <div class="ck-cash__manual-label">Importe recibido</div>

        <div class="ck-manual-input-wrap" :class="{ error: error }">
          <span class="ck-manual-input__icon">
            <v-icon size="22">mdi-cash</v-icon>
          </span>

          <input
            :ref="setManualInputRef"
            :value="formattedManualValue"
            type="text"
            inputmode="numeric"
            class="ck-manual-input"
            placeholder="0"
            @input="onManualInputRaw"
            @keydown="onManualKeydown"
          />
        </div>

        <div v-if="error" class="ck-cash__error">
          {{ errorMessage }}
        </div>
      </div>
    </transition>

    <div class="ck-cash__status-line">
      <div v-if="missing > 0" class="ck-status ck-status--error">
        Faltan {{ money(missing) }}
      </div>

      <div v-else-if="change > 0" class="ck-status ck-status--ok">
        Vuelto {{ money(change) }}
      </div>

      <div v-else-if="hasEnteredAmount" class="ck-status ck-status--neutral">
        Importe exacto
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";

const props = defineProps({
  modelValue: { type: [String, Number], default: "" },
  total: { type: Number, default: 0 },
  missing: { type: Number, default: 0 },
  change: { type: Number, default: 0 },
  error: { type: Boolean, default: false },
  errorMessage: { type: String, default: "" },
  money: { type: Function, required: true },
  cashRef: { type: Object, default: null },
});

const emit = defineEmits([
  "update:modelValue",
  "quick-cash",
  "primary-enter",
]);

const manualMode = ref(false);
const quickMode = ref("exact");
const cursorIndex = ref(0);
const quickRefs = ref([]);
const manualInputEl = ref(null);

const roundedAmount = computed(() => {
  const total = Number(props.total || 0);
  if (!Number.isFinite(total) || total <= 0) return 0;

  if (total <= 1000) return Math.ceil(total / 100) * 100;
  if (total <= 5000) return Math.ceil(total / 500) * 500;
  if (total <= 20000) return Math.ceil(total / 1000) * 1000;
  return Math.ceil(total / 5000) * 5000;
});

const formattedManualValue = computed(() => {
  const raw = String(props.modelValue ?? "").replace(/\D/g, "");
  if (!raw) return "";
  const n = Number(raw);
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("es-AR").format(n);
});

const hasEnteredAmount = computed(() => {
  const raw = String(props.modelValue ?? "").replace(/\D/g, "");
  return raw !== "" && raw !== "0";
});

function setManualInputRef(el) {
  manualInputEl.value = el;
}

function focusQuickButton() {
  nextTick(() => {
    const refEntry = quickRefs.value?.[cursorIndex.value];
    const el = refEntry?.$el || refEntry;
    el?.focus?.();
  });
}

function focusManualInput() {
  nextTick(() => {
    manualInputEl.value?.focus?.();
    manualInputEl.value?.select?.();

    const external =
      props.cashRef?.value?.$el?.querySelector?.("input") ||
      props.cashRef?.value?.querySelector?.("input") ||
      props.cashRef?.value?.$el ||
      props.cashRef?.value;

    external?.focus?.();
  });
}

function closeManualAndReturnToQuick() {
  manualMode.value = false;
  quickMode.value = "manual";
  cursorIndex.value = 2;
  focusQuickButton();
}

function applyExact() {
  quickMode.value = "exact";
  manualMode.value = false;
  cursorIndex.value = 0;
  emit("quick-cash", Number(props.total || 0));
  focusQuickButton();
}

function applyRounded() {
  quickMode.value = "rounded";
  manualMode.value = false;
  cursorIndex.value = 1;
  emit("quick-cash", Number(roundedAmount.value || 0));
  focusQuickButton();
}

function applyExactAndContinue() {
  applyExact();
  nextTick(() => emit("primary-enter"));
}

function applyRoundedAndContinue() {
  applyRounded();
  nextTick(() => emit("primary-enter"));
}

function enableManualMode() {
  quickMode.value = "manual";
  manualMode.value = true;
  cursorIndex.value = 2;
  focusManualInput();
}

function onManualInputRaw(e) {
  const raw = String(e?.target?.value ?? "");
  const digits = raw.replace(/\D/g, "");
  quickMode.value = "manual";
  manualMode.value = true;
  emit("update:modelValue", digits);
}

function onManualKeydown(e) {
  const key = String(e.key || "");
  const rawDigits = String(props.modelValue ?? "").replace(/\D/g, "");
  const input = e.target;
  const selectionStart = Number(input?.selectionStart ?? 0);
  const selectionEnd = Number(input?.selectionEnd ?? 0);
  const fullSelected =
    selectionStart === 0 &&
    selectionEnd === String(input?.value ?? "").length;

  if (key === "Enter") {
    e.preventDefault();
    emit("primary-enter");
    return;
  }

  if (key === "ArrowUp") {
    e.preventDefault();
    closeManualAndReturnToQuick();
    return;
  }

  if (key === "Backspace") {
    const emptyLike = rawDigits === "" || rawDigits === "0";

    if (emptyLike || fullSelected) {
      e.preventDefault();
      closeManualAndReturnToQuick();
    }
  }
}

function moveHorizontal(direction) {
  let next = cursorIndex.value;

  if (direction === "left" && next > 0) next -= 1;
  if (direction === "right" && next < 2) next += 1;

  cursorIndex.value = next;

  if (!manualMode.value) {
    focusQuickButton();
  }

  return true;
}

function handleKeyboardAction(action) {
  if (action === "left") return moveHorizontal("left");
  if (action === "right") return moveHorizontal("right");

  if (action === "up") {
    if (manualMode.value) {
      closeManualAndReturnToQuick();
      return true;
    }
    return true;
  }

  if (action === "down") {
    if (cursorIndex.value === 2) {
      enableManualMode();
      return true;
    }
    return true;
  }

  if (action === "enter") {
    if (manualMode.value) {
      emit("primary-enter");
      return true;
    }

    if (cursorIndex.value === 0) {
      applyExactAndContinue();
      return true;
    }

    if (cursorIndex.value === 1) {
      applyRoundedAndContinue();
      return true;
    }

    if (cursorIndex.value === 2) {
      enableManualMode();
      return true;
    }

    return true;
  }

  return false;
}

function focusCurrent() {
  nextTick(() => {
    if (manualMode.value) {
      focusManualInput();
      return;
    }
    focusQuickButton();
  });
}

watch(
  () => props.modelValue,
  (v) => {
    const raw = String(v ?? "").replace(/\D/g, "");
    if (!raw) {
      if (!manualMode.value) {
        quickMode.value = "exact";
        cursorIndex.value = 0;
      }
      return;
    }

    const n = Number(raw);
    if (!Number.isFinite(n)) return;

    const total = Number(props.total || 0);

    if (!manualMode.value && n === total) {
      quickMode.value = "exact";
      cursorIndex.value = 0;
      return;
    }

    if (!manualMode.value && n === roundedAmount.value) {
      quickMode.value = "rounded";
      cursorIndex.value = 1;
      return;
    }

    quickMode.value = "manual";
    manualMode.value = true;
    cursorIndex.value = 2;
  },
  { immediate: true }
);

defineExpose({
  focusCurrent,
  handleKeyboardAction,
});
</script>

<style scoped>
.ck-cash {
  display: grid;
  gap: 14px;
}

.ck-cash__quick {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.ck-cash-btn {
  min-height: 82px;
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-on-surface), 0.025);
  display: grid;
  align-content: center;
  gap: 6px;
  text-align: left;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.16s ease;
  outline: none;
}

.ck-cash-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.04);
  transform: translateY(-1px);
}

.ck-cash-btn.active {
  border-color: rgba(var(--v-theme-primary), 0.44);
  background: rgba(var(--v-theme-primary), 0.08);
  box-shadow: 0 0 0 1px rgba(var(--v-theme-primary), 0.12);
}

.ck-cash-btn.cursor {
  border-color: rgba(var(--v-theme-on-surface), 0.28);
}

.ck-cash-btn.cursorActive {
  border-color: rgba(var(--v-theme-primary), 0.84);
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.14);
}

.ck-cash-btn__label {
  font-size: 0.8rem;
  font-weight: 900;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.ck-cash-btn__value {
  font-size: 1.08rem;
  font-weight: 900;
  line-height: 1.05;
}

.ck-cash__manual {
  display: grid;
  gap: 8px;
}

.ck-cash__manual-label {
  font-size: 0.8rem;
  font-weight: 900;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.ck-manual-input-wrap {
  min-height: 74px;
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-on-surface), 0.02);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.ck-manual-input-wrap:focus-within {
  border-color: rgba(var(--v-theme-primary), 0.52);
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.12);
}

.ck-manual-input-wrap.error {
  border-color: rgba(var(--v-theme-error), 0.6);
}

.ck-manual-input__icon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.08);
  flex: 0 0 auto;
}

.ck-manual-input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 2rem;
  font-weight: 900;
  line-height: 1;
  color: rgb(var(--v-theme-on-surface));
  letter-spacing: 0.01em;
}

.ck-manual-input::placeholder {
  color: rgba(var(--v-theme-on-surface), 0.34);
}

.ck-cash__error {
  font-size: 0.82rem;
  font-weight: 800;
  color: rgb(var(--v-theme-error));
}

.ck-cash__status-line {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 28px;
}

.ck-status {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 900;
  line-height: 1;
}

.ck-status--error {
  color: rgb(var(--v-theme-error));
  background: rgba(var(--v-theme-error), 0.1);
}

.ck-status--ok {
  color: rgb(var(--v-theme-success));
  background: rgba(var(--v-theme-success), 0.1);
}

.ck-status--neutral {
  color: rgba(var(--v-theme-on-surface), 0.72);
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.ck-fade-enter-active,
.ck-fade-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.ck-fade-enter-from,
.ck-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 760px) {
  .ck-cash__quick {
    grid-template-columns: 1fr;
  }

  .ck-manual-input {
    font-size: 1.6rem;
  }
}
</style>