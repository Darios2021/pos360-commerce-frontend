<template>
  <div class="pos-search-bar">
    <v-text-field
      ref="searchRef"
      v-model="qLocal"
      placeholder="Buscar producto, SKU o código..."
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      density="comfortable"
      hide-details
      clearable
      autocomplete="off"
      spellcheck="false"
      class="search-input"
      :class="inputStateClass"
      :disabled="disabledAll"
      @focus="isFocused = true"
      @blur="onBlur"
      @keydown.enter.prevent="onEnter"
      @click:clear="onClear"
      @update:model-value="onTyping"
    />

    <div
      class="scanner-toggle"
      :class="{ active: isOn, disabled: disabledAll }"
      @click="handleToggle"
      :title="isOn ? 'Lector activo' : 'Lector inactivo'"
    >
      <v-icon :color="isOn ? 'success' : 'grey'" size="22">
        mdi-barcode-scan
      </v-icon>

      <div class="switch" :class="{ active: isOn }"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, nextTick } from "vue";

const props = defineProps({
  q: { type: String, default: "" },
  isOn: { type: Boolean, default: false },
  visualState: { type: String, default: "" },
  autoClearOnSubmit: { type: Boolean, default: true },
  keepFocusOnSubmit: { type: Boolean, default: true },
  focusOnEnable: { type: Boolean, default: true },
  disabledAll: { type: Boolean, default: false },
});

const emit = defineEmits([
  "update:q",
  "typing",
  "enter",
  "clear",
  "toggle",
  "submit",
  "scan",
]);

const searchRef = ref(null);
const qLocal = ref(props.q || "");
const isFocused = ref(false);

const inputStateClass = computed(() => {
  const classes = [];

  if (isFocused.value) classes.push("is-active");
  if (props.visualState === "success") classes.push("is-success");
  if (props.visualState === "error") classes.push("is-error");

  return classes;
});

watch(
  () => props.q,
  (v) => {
    if (v !== qLocal.value) qLocal.value = v || "";
  }
);

watch(qLocal, (v) => {
  emit("update:q", v);
});

watch(
  () => props.isOn,
  async (enabled, prev) => {
    if (enabled && !prev && props.focusOnEnable && !props.disabledAll) {
      await nextTick();
      focusInput({ select: true });
    }
  }
);

function normalizeValue(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/\n/g, "")
    .trim();
}

function looksLikeBarcode(value) {
  const v = normalizeValue(value);
  if (!v) return false;

  return /^[0-9A-Z\-_.]+$/i.test(v) && v.length >= 6;
}

function focusInput({ select = false } = {}) {
  nextTick(() => {
    const refValue = searchRef.value;
    if (!refValue) return;

    refValue.focus?.();

    const root = refValue.$el || refValue;
    const input =
      root?.querySelector?.("input") ||
      root?.querySelector?.("textarea");

    input?.focus?.();
    if (select) input?.select?.();
  });
}

function clearInternal(emitClear = true) {
  qLocal.value = "";
  emit("update:q", "");
  if (emitClear) emit("clear");
}

function onTyping(value) {
  emit("typing", value);
}

function onBlur() {
  isFocused.value = false;
}

function emitSubmit(value, source = "manual") {
  const code = normalizeValue(value);
  if (!code) return;

  const isBarcode = looksLikeBarcode(code);

  emit("submit", {
    value: code,
    source,
    isBarcode,
  });

  if (source === "scanner" || isBarcode) {
    emit("scan", code);
  }

  emit("enter", code);

  if (props.autoClearOnSubmit) {
    clearInternal(false);
  }

  if (props.keepFocusOnSubmit && props.isOn && !props.disabledAll) {
    focusInput({ select: true });
  }
}

function onEnter() {
  const code = normalizeValue(qLocal.value);
  if (!code) return;

  const source = props.isOn && looksLikeBarcode(code) ? "scanner" : "manual";
  emitSubmit(code, source);
}

function onClear() {
  clearInternal(true);

  if (props.keepFocusOnSubmit && props.isOn && !props.disabledAll) {
    focusInput();
  }
}

function handleToggle() {
  if (props.disabledAll) return;
  emit("toggle");
}

defineExpose({
  focusSearch: () => {
    focusInput();
  },
  clearSearch: () => {
    clearInternal(false);
  },
  submitCurrent: () => {
    onEnter();
  },
  setValueAndSubmit: (value) => {
    qLocal.value = normalizeValue(value);
    onEnter();
  },
});
</script>

<style scoped>
.pos-search-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.search-input {
  flex: 1 1 auto;
}

.search-input :deep(.v-field) {
  border-radius: 14px;
  min-height: 52px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s ease;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.search-input :deep(.v-field__input) {
  min-height: 52px;
  padding-top: 0;
  padding-bottom: 0;
}

.search-input.is-active :deep(.v-field) {
  border-color: rgba(var(--v-theme-primary), 0.42);
  box-shadow:
    0 0 0 2px rgba(var(--v-theme-primary), 0.10),
    0 4px 14px rgba(var(--v-theme-primary), 0.10);
}

.search-input.is-success :deep(.v-field) {
  border-color: rgba(var(--v-theme-success), 0.52);
  box-shadow:
    0 0 0 2px rgba(var(--v-theme-success), 0.14),
    0 0 10px rgba(var(--v-theme-success), 0.18);
  animation: flashSuccess 0.28s ease;
}

.search-input.is-error :deep(.v-field) {
  border-color: rgba(var(--v-theme-error), 0.52);
  box-shadow:
    0 0 0 2px rgba(var(--v-theme-error), 0.14),
    0 0 10px rgba(var(--v-theme-error), 0.18);
  animation: flashError 0.28s ease;
}

@keyframes flashSuccess {
  0% { transform: scale(1); }
  50% { transform: scale(1.01); }
  100% { transform: scale(1); }
}

@keyframes flashError {
  0% { transform: translateX(0); }
  30% { transform: translateX(-3px); }
  60% { transform: translateX(3px); }
  100% { transform: translateX(0); }
}

.scanner-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  user-select: none;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  transition: 0.2s ease;
}

.scanner-toggle:hover {
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.scanner-toggle.disabled {
  opacity: 0.55;
  pointer-events: none;
}

.switch {
  width: 38px;
  height: 20px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.18);
  position: relative;
  transition: 0.2s;
}

.switch::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  transition: 0.2s;
}

.switch.active {
  background: rgb(var(--v-theme-success));
}

.switch.active::after {
  left: 19px;
}

@media (max-width: 768px) {
  .pos-search-bar {
    gap: 10px;
    padding: 10px;
  }

  .scanner-toggle {
    padding: 10px;
  }
}
</style>