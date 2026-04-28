<template>
  <div class="pmx">

    <div class="pmx-table">
      <div
        v-for="(row, idx) in state.mixedPayments"
        :key="row.uid"
        class="pmx-row"
        :class="activeRowClass(idx)"
      >
        <!-- ① METHOD BUTTON — focusable, handles its own keys -->
        <button
          :ref="(el) => setMethodRef(el, idx)"
          type="button"
          class="pmx-method"
          :style="`--mc: ${methodColor(row)}`"
          :class="{ 'pmx-method--on': isMethodFocused(idx) }"
          tabindex="0"
          @focus="onMethodFocus(idx)"
          @keydown="onMethodKey($event, idx)"
          @click="focusMethod(idx)"
        >
          <span class="pmx-method__icon">
            <v-icon size="15">{{ methodIcon(row) }}</v-icon>
          </span>
          <span class="pmx-method__name">{{ methodName(row) }}</span>
          <span class="pmx-method__hint">← →</span>
        </button>

        <!-- ② AMOUNT INPUT — handles its own keys -->
        <div
          class="pmx-amount"
          :class="{ 'pmx-amount--on': isAmountFocused(idx) }"
          @click="focusAmount(idx)"
        >
          <span class="pmx-amount__sym">$</span>
          <input
            :ref="(el) => setAmountRef(el, idx)"
            v-model="row.amount"
            type="text"
            inputmode="numeric"
            placeholder="0"
            class="pmx-amount__input"
            tabindex="0"
            @focus="onAmountFocus(idx)"
            @keydown="onAmountKey($event, idx)"
          />
        </div>

        <!-- ③ REMOVE -->
        <button
          type="button"
          class="pmx-rm"
          tabindex="-1"
          :disabled="state.mixedPayments.length === 1"
          @click="$emit('remove-mixed-row', row.uid)"
        >
          <v-icon size="13">mdi-close</v-icon>
        </button>
      </div>
    </div>

    <!-- Footer -->
    <div class="pmx-foot">
      <button
        v-if="state.mixedPayments.length < MAX_ROWS"
        type="button"
        class="pmx-add"
        tabindex="-1"
        @click="addRow"
      >
        <v-icon size="14">mdi-plus</v-icon>
        Agregar medio
      </button>

      <span v-if="mixedMissing > 0" class="pmx-badge pmx-badge--missing">
        Falta {{ money(mixedMissing) }}
      </span>
      <span v-else-if="mixedChange > 0" class="pmx-badge pmx-badge--ok">
        Vuelto {{ money(mixedChange) }}
      </span>
      <span v-else-if="mixedPaid > 0" class="pmx-badge pmx-badge--ok">
        ✓ Exacto
      </span>
    </div>

  </div>
</template>

<script setup>
import { nextTick, reactive, ref } from "vue";

const props = defineProps({
  state:             { type: Object,   required: true },
  mixedMethodItems:  { type: Array,    default: () => [] },
  mixedPaid:         { type: Number,   default: 0 },
  mixedMissing:      { type: Number,   default: 0 },
  mixedChange:       { type: Number,   default: 0 },
  totalSafe:         { type: Number,   default: 0 },
  money:             { type: Function, required: true },
  setMixedAmountRef: { type: Function, default: null },
});

const emit = defineEmits(["add-mixed-row", "remove-mixed-row", "ready"]);

// ── cursor ──────────────────────────────────────────────
// col: "method" | "amount"
const cursor = reactive({ row: 0, col: "amount" });

const methodRefs = ref([]);
const amountRefs = ref([]);

function rows() { return props.state?.mixedPayments || []; }

// ── ref setters ─────────────────────────────────────────
function setMethodRef(el, idx) { methodRefs.value[idx] = el; }

function setAmountRef(el, idx) {
  amountRefs.value[idx] = el;
  if (idx === 0 && typeof props.setMixedAmountRef === "function") {
    // wrap so parent's ref helper can call .focus()
    props.setMixedAmountRef({ $el: el, value: el });
  }
}

// ── focus helpers ───────────────────────────────────────
function focusMethod(idx) {
  cursor.row = idx;
  cursor.col = "method";
  nextTick(() => methodRefs.value[idx]?.focus());
}

function focusAmount(idx) {
  cursor.row = idx;
  cursor.col = "amount";
  nextTick(() => {
    const el = amountRefs.value[idx];
    el?.focus();
    el?.select();
  });
}

// ── focus events (sync cursor when user clicks/tabs) ────
function onMethodFocus(idx) { cursor.row = idx; cursor.col = "method"; }
function onAmountFocus(idx) { cursor.row = idx; cursor.col = "amount"; }

// ── state helpers ────────────────────────────────────────
function isMethodFocused(idx) { return cursor.row === idx && cursor.col === "method"; }
function isAmountFocused(idx) { return cursor.row === idx && cursor.col === "amount"; }

function activeRowClass(idx) {
  if (cursor.row !== idx) return "";
  return cursor.col === "method" ? "pmx-row--m" : "pmx-row--a";
}

// ── method meta ──────────────────────────────────────────
function items() { return Array.isArray(props.mixedMethodItems) ? props.mixedMethodItems : []; }

function currentItem(row) {
  return items().find((m) => Number(m.value) === Number(row?.payment_method_id)) || null;
}

function methodName(row) { return currentItem(row)?.title || "Elegir"; }

function methodIcon(row) {
  const n = methodName(row).toLowerCase();
  if (n.includes("efect") || n.includes("cash"))   return "mdi-cash";
  if (n.includes("tarj")  || n.includes("card"))   return "mdi-credit-card-outline";
  if (n.includes("transfer"))                        return "mdi-bank-transfer";
  if (n.includes("qr")    || n.includes("mercado")) return "mdi-qrcode";
  return "mdi-wallet-outline";
}

function methodColor(row) {
  const n = methodName(row).toLowerCase();
  if (n.includes("efect") || n.includes("cash"))   return "34,197,94";
  if (n.includes("tarj")  || n.includes("card"))   return "59,130,246";
  if (n.includes("transfer"))                        return "139,92,246";
  if (n.includes("qr")    || n.includes("mercado")) return "6,182,212";
  return "99,102,241";
}

function cycleMethod(idx, dir) {
  const row = rows()[idx];
  const list = items();
  if (!row || !list.length) return;
  const cur = list.findIndex((m) => Number(m.value) === Number(row.payment_method_id));
  let next = cur >= 0 ? cur : 0;
  if (dir === "left")  next = next > 0               ? next - 1 : list.length - 1;
  else                 next = next < list.length - 1  ? next + 1 : 0;
  row.payment_method_id = list[next]?.value ?? row.payment_method_id;
}

const MAX_ROWS = 2;

// ── add row ──────────────────────────────────────────────
function addRow() {
  if (rows().length >= MAX_ROWS) return;
  emit("add-mixed-row");
  nextTick(() => focusAmount(rows().length - 1));
}

// ── keyboard: METHOD button ──────────────────────────────
function onMethodKey(e, idx) {
  const list = rows();

  switch (e.key) {
    case "ArrowLeft":
      e.preventDefault(); e.stopPropagation();
      cycleMethod(idx, "left");
      break;

    case "ArrowRight":
      e.preventDefault(); e.stopPropagation();
      cycleMethod(idx, "right");
      break;

    case "ArrowUp":
      e.preventDefault(); e.stopPropagation();
      if (idx > 0) focusMethod(idx - 1);
      break;

    case "ArrowDown":
      e.preventDefault(); e.stopPropagation();
      if (idx < list.length - 1) focusMethod(idx + 1);
      break;

    case "Enter":
    case "Tab":
      e.preventDefault(); e.stopPropagation();
      focusAmount(idx);
      break;

    case "Backspace":
      // let it bubble so parent can go back (only if nothing to delete)
      break;

    default:
      // if a digit is pressed while on method → jump straight to amount
      if (e.key.length === 1 && /\d/.test(e.key)) {
        e.preventDefault(); e.stopPropagation();
        focusAmount(idx);
        nextTick(() => { rows()[idx].amount = e.key; });
      }
  }
}

// ── keyboard: AMOUNT input ───────────────────────────────
function onAmountKey(e, idx) {
  const list = rows();

  switch (e.key) {
    case "ArrowUp":
      e.preventDefault(); e.stopPropagation();
      if (idx > 0) focusAmount(idx - 1);
      break;

    case "ArrowDown":
      e.preventDefault(); e.stopPropagation();
      if (idx < list.length - 1) focusAmount(idx + 1);
      else if (list.length < MAX_ROWS && props.mixedMissing > 0) addRow();
      break;

    case "ArrowLeft":
      // only go to method when cursor is at start of field
      if (e.target.selectionStart === 0 && e.target.selectionEnd === 0) {
        e.preventDefault(); e.stopPropagation();
        focusMethod(idx);
      }
      break;

    case "Enter":
      e.preventDefault(); e.stopPropagation();
      if (idx < list.length - 1) {
        focusAmount(idx + 1);
      } else if (props.mixedMissing <= 0) {
        emit("ready");
      } else if (list.length < MAX_ROWS) {
        addRow();
      }
      break;

    case "Backspace":
      // let backspace bubble only when input is empty (so parent can go back)
      if (e.target.value !== "") e.stopPropagation();
      break;

    default:
      // stop all other keys from reaching the dialog handler
      e.stopPropagation();
  }
}

// ── exposed API (called by parent on screen focus) ───────
function focusCurrent() {
  const list = rows();
  if (!list.length) return;
  const idx = Math.min(cursor.row, list.length - 1);
  if (cursor.col === "method") focusMethod(idx);
  else focusAmount(idx);
}

// parent calls this only when NO input is focused (safe to handle)
function handleKeyboardAction(action) {
  // these only fire when focus is outside our inputs (shouldn't happen normally)
  if (action === "up")    { const i = cursor.row; if (i > 0) { focusAmount(i - 1); } return true; }
  if (action === "down")  { const i = cursor.row; const l = rows(); if (i < l.length - 1) focusAmount(i + 1); else addRow(); return true; }
  if (action === "enter") { focusAmount(cursor.row); return true; }
  return false;
}

defineExpose({ handleKeyboardAction, focusCurrent });
</script>

<style scoped>
.pmx {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ── table ── */
.pmx-table {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ── row ── */
.pmx-row {
  display: grid;
  grid-template-columns: minmax(140px, 1fr) minmax(120px, 160px) 24px;
  gap: 4px;
  align-items: stretch;
  padding: 2px;
  border-radius: 10px;
  border: 1.5px solid transparent;
  transition: border-color 0.1s;
}

.pmx-row--m { border-color: rgba(var(--v-theme-primary), 0.22); }
.pmx-row--a { border-color: rgba(var(--v-theme-primary), 0.22); }

/* ── method button ── */
.pmx-method {
  --mc: 99, 102, 241;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1.5px solid rgba(var(--mc), 0.2);
  background: rgba(var(--mc), 0.06);
  cursor: pointer;
  outline: none;
  min-width: 0;
  text-align: left;
  transition: border-color 0.1s, background 0.1s, box-shadow 0.1s;
}

.pmx-method:focus,
.pmx-method--on {
  border-color: rgb(var(--mc));
  background: rgba(var(--mc), 0.14);
  box-shadow: 0 0 0 3px rgba(var(--mc), 0.22);
}

.pmx-method:hover:not(:focus):not(.pmx-method--on) {
  border-color: rgba(var(--mc), 0.45);
  background: rgba(var(--mc), 0.1);
}

.pmx-method__icon {
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: rgba(var(--mc), 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pmx-method__icon :deep(.v-icon) { color: rgb(var(--mc)) !important; }

.pmx-method__name {
  flex: 1 1 auto;
  font-size: 0.83rem;
  font-weight: 500;
  line-height: 1;
  color: rgb(var(--mc));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pmx-method__hint {
  flex: 0 0 auto;
  font-size: 0.62rem;
  font-weight: 400;
  color: rgba(var(--mc), 0.55);
  letter-spacing: 0.03em;
}

/* ── amount ── */
.pmx-amount {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.14);
  background: rgba(var(--v-theme-on-surface), 0.03);
  cursor: text;
  transition: border-color 0.1s, box-shadow 0.1s;
}

.pmx-amount--on {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.18);
  background: rgba(var(--v-theme-primary), 0.04);
}

.pmx-amount__sym {
  font-size: 0.8rem;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.4);
  flex: 0 0 auto;
}

.pmx-amount__input {
  flex: 1 1 auto;
  background: none;
  border: none;
  outline: none;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: rgb(var(--v-theme-on-surface));
  width: 100%;
  min-width: 0;
  padding: 9px 0;
  line-height: 1;
  caret-color: rgb(var(--v-theme-primary));
}

.pmx-amount__input::placeholder {
  color: rgba(var(--v-theme-on-surface), 0.22);
  font-weight: 500;
}

/* ── remove ── */
.pmx-rm {
  border-radius: 7px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(var(--v-theme-on-surface), 0.28);
  transition: background 0.1s, color 0.1s;
}

.pmx-rm:hover:not(:disabled) {
  background: rgba(var(--v-theme-error), 0.1);
  color: rgb(var(--v-theme-error));
}

.pmx-rm:disabled { opacity: 0.18; cursor: default; }

/* ── footer ── */
.pmx-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pmx-add {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1.5px dashed rgba(var(--v-theme-on-surface), 0.2);
  background: transparent;
  font-size: 0.76rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.48);
  cursor: pointer;
  transition: border-color 0.1s, color 0.1s, background 0.1s;
}

.pmx-add:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.04);
}

.pmx-badge {
  font-size: 0.76rem;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 999px;
}

.pmx-badge--missing {
  color: rgb(var(--v-theme-error));
  background: rgba(var(--v-theme-error), 0.1);
}

.pmx-badge--ok {
  color: rgb(var(--v-theme-success));
  background: rgba(var(--v-theme-success), 0.1);
}
</style>
