<template>
  <div class="ck-cash">

    <!-- =========================
         QUICK OPTIONS (app tiles)
    ========================= -->
    <div class="ck-cash__quick">

      <!-- EXACTO -->
      <button
        ref="quickRefs"
        type="button"
        class="ck-cash-tile"
        :class="{
          active: quickMode === 'exact' && !manualMode,
          cursor: cursorIndex === 0,
          cursorActive: cursorIndex === 0 && !manualMode,
        }"
        @click="applyExactAndContinue"
      >
        <span class="ck-cash-tile__icon">
          <v-icon size="22">mdi-cash</v-icon>
        </span>
        <span class="ck-cash-tile__label">Exacto</span>
        <strong class="ck-cash-tile__value">{{ money(total) }}</strong>
      </button>

      <!-- REDONDEADO -->
      <button
        ref="quickRefs"
        type="button"
        class="ck-cash-tile ck-cash-tile--rounded"
        :class="{
          active: quickMode === 'rounded' && !manualMode,
          cursor: cursorIndex === 1,
          cursorActive: cursorIndex === 1 && !manualMode,
        }"
        @click="applyRoundedAndContinue"
      >
        <span class="ck-cash-tile__icon">
          <v-icon size="22">mdi-arrow-up-bold-circle-outline</v-icon>
        </span>
        <span class="ck-cash-tile__label">Redondeado</span>
        <strong class="ck-cash-tile__value">{{ money(roundedAmount) }}</strong>
      </button>

      <!-- MANUAL -->
      <button
        ref="quickRefs"
        type="button"
        class="ck-cash-tile ck-cash-tile--manual"
        :class="{
          active: manualMode,
          cursor: cursorIndex === 2,
          cursorActive: cursorIndex === 2 && manualMode,
        }"
        @click="enableManualMode"
      >
        <span class="ck-cash-tile__icon">
          <v-icon size="22">mdi-pencil-outline</v-icon>
        </span>
        <span class="ck-cash-tile__label">Manual</span>
        <strong class="ck-cash-tile__value">Ingresar</strong>
      </button>

    </div>

    <!-- =========================
         MANUAL INPUT
    ========================= -->
    <transition name="ck-fade">
      <div v-if="manualMode" class="ck-cash__manual">

        <div class="ck-cash__manual-label">
          Importe recibido
        </div>

        <div
          class="ck-manual-input-wrap"
          :class="{ error: error }"
        >
          <span class="ck-manual-input__icon">
            <v-icon size="20">mdi-cash</v-icon>
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

    <!-- =========================
         STATUS
    ========================= -->
    <div class="ck-cash__status-line">

      <div
        v-if="missing > 0"
        class="ck-status ck-status--error"
      >
        Faltan {{ money(missing) }}
      </div>

      <div
        v-else-if="change > 0"
        class="ck-status ck-status--ok"
      >
        Vuelto {{ money(change) }}
      </div>

      <div
        v-else-if="hasEnteredAmount"
        class="ck-status ck-status--neutral"
      >
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
  // Atajo: si el cajero tipea un dígito con los botones rápidos enfocados
  // entramos directo a modo manual con ese dígito preescrito.
  if (typeof action === "string" && action.startsWith("digit:")) {
    const d = action.slice(6);
    if (!manualMode.value) {
      enableManualMode();
      emit("update:modelValue", d);
      return true;
    }
    return false;
  }

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
    // Preferimos siempre que el cajero pueda teclear el monto directo.
    // Si ya había valor manual previo, mantenerlo.
    // Si no, enfocar el botón "Exacto" (default más rápido).
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
/* =========================
   ROOT
========================= */
.ck-cash {
  display: grid;
  gap: 10px;
  min-width: 0;
}

/* =========================
   GRID
========================= */
.ck-cash__quick {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  min-width: 0;
}

/* =========================
   APP TILE (centrado, ícono arriba)
========================= */
.ck-cash-tile { --cc: 34, 197, 94; }                        /* exact = green */
.ck-cash-tile.ck-cash-tile--rounded { --cc: 59, 130, 246; } /* rounded = blue */
.ck-cash-tile.ck-cash-tile--manual { --cc: 139, 92, 246; }  /* manual = violet */

.ck-cash-tile {
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  cursor: pointer;

  position: relative;

  width: 100%;
  min-width: 0;
  min-height: 112px;
  padding: 14px 10px 12px;

  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: rgba(255, 255, 255, 0.035);

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;

  text-align: center;
  overflow: visible;

  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease,
    transform 0.12s ease;
}

.ck-cash-tile:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--cc), 0.45);
  background: rgba(var(--cc), 0.06);
  box-shadow: 0 6px 18px rgba(var(--cc), 0.18);
}

/* Cursor (foco por teclado) */
.ck-cash-tile.cursor:not(.active) {
  border-color: rgba(var(--cc), 0.6);
  box-shadow: 0 0 0 2px rgba(var(--cc), 0.25);
}

/* Seleccionado / activo */
.ck-cash-tile.active,
.ck-cash-tile.cursorActive {
  background: linear-gradient(
    180deg,
    rgb(var(--cc)) 0%,
    rgba(var(--cc), 0.88) 100%
  );
  border-color: rgb(var(--cc));
  box-shadow:
    0 0 0 3px rgba(var(--cc), 0.25),
    0 8px 20px rgba(var(--cc), 0.32);
  transform: translateY(-2px);
}

.ck-cash-tile.active .ck-cash-tile__icon,
.ck-cash-tile.cursorActive .ck-cash-tile__icon {
  background: rgba(255, 255, 255, 0.22);
}

.ck-cash-tile.active .ck-cash-tile__icon :deep(.v-icon),
.ck-cash-tile.cursorActive .ck-cash-tile__icon :deep(.v-icon) {
  color: #fff !important;
}

.ck-cash-tile.active .ck-cash-tile__label,
.ck-cash-tile.cursorActive .ck-cash-tile__label {
  color: #fff;
}

.ck-cash-tile.active .ck-cash-tile__value,
.ck-cash-tile.cursorActive .ck-cash-tile__value {
  color: rgba(255, 255, 255, 0.95);
}

/* =========================
   ÍCONO (chip grande arriba)
========================= */
.ck-cash-tile__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--cc), 0.14);
  transition: background 0.15s ease;
  flex: 0 0 40px;
}

.ck-cash-tile__icon :deep(.v-icon) {
  color: rgb(var(--cc)) !important;
  transition: color 0.15s ease;
  font-size: 22px !important;
}

/* =========================
   TEXTOS
========================= */
.ck-cash-tile__label {
  display: block;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1;
  color: rgba(255, 255, 255, 0.75);
  transition: color 0.15s;
}

.ck-cash-tile__value {
  display: block;
  font-size: 0.88rem;
  font-weight: 900;
  letter-spacing: -0.01em;
  line-height: 1.1;
  color: rgba(255, 255, 255, 0.95);
  font-feature-settings: "tnum";
  transition: color 0.15s;
}

/* =========================
   MANUAL
========================= */
.ck-cash__manual {
  display: grid;
  gap: 6px;
}

.ck-cash__manual-label {
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.ck-manual-input-wrap {
  min-height: 58px;
  border-radius: 14px;
  border: 1.5px solid rgba(139, 92, 246, 0.2);
  background: rgba(139, 92, 246, 0.06);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  transition:
    border-color 0.14s ease,
    box-shadow 0.14s ease,
    background 0.14s ease;
}

.ck-manual-input-wrap:focus-within {
  border-color: rgba(139, 92, 246, 0.6);
  background: rgba(139, 92, 246, 0.1);
  box-shadow:
    0 0 0 3px rgba(139, 92, 246, 0.18),
    0 6px 18px rgba(139, 92, 246, 0.2);
}

.ck-manual-input-wrap.error {
  border-color: rgba(var(--v-theme-error), 0.6);
}

.ck-manual-input__icon {
  width: 28px;
  height: 28px;
  border-radius: 10px;

  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.ck-manual-input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;

  font-size: 1.15rem;
  font-weight: 900;
  line-height: 1.05;
  color: #f4f7fb;
}

.ck-manual-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.ck-cash__error {
  font-size: 0.78rem;
  font-weight: 800;
  color: rgb(var(--v-theme-error));
}

/* =========================
   STATUS
========================= */
.ck-cash__status-line {
  display: flex;
  align-items: center;
  min-height: 26px;
}

.ck-status {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;

  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 900;
  line-height: 1;
}

.ck-status--error {
  color: rgb(var(--v-theme-error));
  background: rgba(var(--v-theme-error), 0.12);
}

.ck-status--ok {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.14);
}

.ck-status--neutral {
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.05);
}

/* =========================
   ANIM
========================= */
.ck-fade-enter-active,
.ck-fade-leave-active {
  transition: opacity 0.14s ease, transform 0.14s ease;
}

.ck-fade-enter-from,
.ck-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* =========================
   RESPONSIVE
========================= */
@media (max-width: 760px) {
  .ck-cash__quick {
    grid-template-columns: 1fr;
  }

  .ck-manual-input {
    font-size: 1rem;
  }
}
</style>