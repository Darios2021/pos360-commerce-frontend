<template>
  <div class="ck-cash">

    <!-- =========================
         QUICK OPTIONS
    ========================= -->
    <div class="ck-cash__quick">

      <!-- EXACTO -->
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
        <strong class="ck-cash-btn__value">
          {{ money(total) }}
        </strong>

        <!-- TAG -->
        <span
          v-if="cursorIndex === 0"
          class="ck-cursor-tag"
        >
          Elegir
        </span>
      </button>

      <!-- REDONDEADO -->
      <button
        ref="quickRefs"
        type="button"
        class="ck-cash-btn ck-cash-btn--rounded"
        :class="{
          active: quickMode === 'rounded',
          cursor: cursorIndex === 1,
          cursorActive: cursorIndex === 1
        }"
        @click="applyRoundedAndContinue"
      >
        <span class="ck-cash-btn__label">Redondeado</span>
        <strong class="ck-cash-btn__value">
          {{ money(roundedAmount) }}
        </strong>

        <!-- TAG -->
        <span
          v-if="cursorIndex === 1"
          class="ck-cursor-tag"
        >
          Elegir
        </span>
      </button>

      <!-- MANUAL -->
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

        <!-- TAG -->
        <span
          v-if="cursorIndex === 2"
          class="ck-cursor-tag"
        >
          Elegir
        </span>
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
   CARD BASE
   MISMO ESTÁNDAR QUE FACTURACIÓN
========================= */
/* Color token per button */
.ck-cash-btn { --cc: 34, 197, 94; }                      /* exact = green */
.ck-cash-btn.ck-cash-btn--rounded { --cc: 59, 130, 246; } /* rounded = blue */
.ck-cash-btn.ck-cash-btn--manual { --cc: 139, 92, 246; }  /* manual = violet */

.ck-cash-btn {
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  cursor: pointer;

  position: relative;
  z-index: 1;

  width: 100%;
  min-width: 0;
  min-height: 72px;
  padding: 12px 14px;

  border-radius: 14px;
  border: 1.5px solid rgba(var(--cc), 0.2);
  background: rgba(var(--cc), 0.07);

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 4px;

  text-align: left;
  overflow: visible;

  transition:
    border-color 0.14s ease,
    box-shadow 0.14s ease,
    background 0.14s ease,
    transform 0.13s ease;
}

.ck-cash-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(var(--cc), 0.4);
  box-shadow: 0 4px 14px rgba(var(--cc), 0.18);
}

.ck-cash-btn.active,
.ck-cash-btn.cursorActive {
  z-index: 3;
  background: rgb(var(--cc));
  border-color: rgb(var(--cc));
  box-shadow:
    0 0 0 3px rgba(var(--cc), 0.22),
    0 6px 18px rgba(var(--cc), 0.28);
  transform: translateY(-1px);
}

.ck-cash-btn.cursor {
  border-color: rgba(var(--cc), 0.5);
}

/* =========================
   TEXTOS
========================= */
.ck-cash-btn__label {
  display: block;
  font-size: 0.8rem;
  font-weight: 900;
  line-height: 1.05;
  color: rgb(var(--cc));
  transition: color 0.15s;
}

.ck-cash-btn.active .ck-cash-btn__label,
.ck-cash-btn.cursorActive .ck-cash-btn__label {
  color: #fff;
}

.ck-cash-btn__value {
  display: block;
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1.05;
  color: rgba(var(--v-theme-on-surface), 0.7);
  transition: color 0.15s;
}

.ck-cash-btn.active .ck-cash-btn__value,
.ck-cash-btn.cursorActive .ck-cash-btn__value {
  color: rgba(255, 255, 255, 0.85);
}

/* Si querés que el valor se vea más fuerte como en efectivo viejo,
   cambiá label/value en el template. Acá solo igualamos visual base. */

/* =========================
   TAG ELEGIR
   MISMO QUE FACTURACIÓN
========================= */
.ck-cursor-tag {
  position: absolute;
  top: -10px;
  right: 14px;

  z-index: 5;

  height: 22px;
  padding: 0 10px;

  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;

  font-size: 0.62rem;
  font-weight: 950;
  line-height: 1;

  color: white;

  background: linear-gradient(
    180deg,
    rgba(120, 130, 150, 0.95),
    rgba(90, 100, 120, 0.95)
  );

  border: 1px solid rgba(255, 255, 255, 0.2);

  box-shadow:
    0 4px 10px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
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