<template>
  <div class="pos-search-bar" :class="{ 'hotkey-active': hotkeyActive }">
    <div class="search-shell">
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

      <transition name="search-pill">
        <div v-if="hotkeyActive" class="search-hotkey-pill">
          <v-icon size="16">mdi-keyboard</v-icon>
          <span>{{ focusHotkey }} activo</span>
        </div>
      </transition>
    </div>

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
import {
  ref,
  watch,
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount,
} from "vue";

const props = defineProps({
  q: { type: String, default: "" },
  isOn: { type: Boolean, default: false },
  visualState: { type: String, default: "" },
  autoClearOnSubmit: { type: Boolean, default: true },
  keepFocusOnSubmit: { type: Boolean, default: true },
  focusOnEnable: { type: Boolean, default: true },
  disabledAll: { type: Boolean, default: false },
  focusHotkey: { type: String, default: "F2" },
});

const emit = defineEmits([
  "update:q",
  "typing",
  "enter",
  "clear",
  "toggle",
  "submit",
  "scan",
  "focus-hotkey",
  "hotkey-visual-active",
]);

const searchRef = ref(null);
const qLocal = ref(props.q || "");
const isFocused = ref(false);
const hotkeyActive = ref(false);

let hotkeyVisualTimer = null;

const inputStateClass = computed(() => {
  const classes = [];

  if (isFocused.value) classes.push("is-active");
  if (props.visualState === "success") classes.push("is-success");
  if (props.visualState === "error") classes.push("is-error");
  if (hotkeyActive.value) classes.push("is-hotkey-active");

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

function getNativeInput() {
  const refValue = searchRef.value;
  if (!refValue) return null;

  const root = refValue.$el || refValue;

  return (
    root?.querySelector?.("input") ||
    root?.querySelector?.("textarea") ||
    null
  );
}

function focusInput({ select = false } = {}) {
  nextTick(() => {
    const refValue = searchRef.value;
    if (!refValue) return;

    refValue.focus?.();

    const input = getNativeInput();
    input?.focus?.();

    if (select) {
      input?.select?.();
    }
  });
}

function triggerHotkeyVisualState() {
  hotkeyActive.value = false;

  if (hotkeyVisualTimer) {
    clearTimeout(hotkeyVisualTimer);
    hotkeyVisualTimer = null;
  }

  nextTick(() => {
    hotkeyActive.value = true;
    emit("hotkey-visual-active", true);

    hotkeyVisualTimer = setTimeout(() => {
      hotkeyActive.value = false;
      emit("hotkey-visual-active", false);
      hotkeyVisualTimer = null;
    }, 1600);
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

function handleGlobalKeydown(e) {
  if (props.disabledAll) return;
  if (e.repeat) return;
  if (e.key !== props.focusHotkey) return;

  e.preventDefault();
  emit("focus-hotkey");
  focusInput({ select: true });
  triggerHotkeyVisualState();
}

onMounted(() => {
  window.addEventListener("keydown", handleGlobalKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleGlobalKeydown);

  if (hotkeyVisualTimer) {
    clearTimeout(hotkeyVisualTimer);
    hotkeyVisualTimer = null;
  }
});

defineExpose({
  focusSearch: () => {
    focusInput();
  },
  focusSearchAndSelect: () => {
    focusInput({ select: true });
    triggerHotkeyVisualState();
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
  activateHotkeyVisual: () => {
    triggerHotkeyVisualState();
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
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.pos-search-bar.hotkey-active {
  border-color: rgba(var(--v-theme-primary), 0.34);
  box-shadow:
    0 0 0 2px rgba(var(--v-theme-primary), 0.12),
    0 10px 26px rgba(var(--v-theme-primary), 0.12);
  animation: posShellPulse 0.55s ease;
}

.search-shell {
  position: relative;
  flex: 1 1 auto;
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
    0 0 0 2px rgba(var(--v-theme-primary), 0.1),
    0 4px 14px rgba(var(--v-theme-primary), 0.1);
}

.search-input.is-hotkey-active :deep(.v-field) {
  border-color: rgba(var(--v-theme-primary), 0.7);
  box-shadow:
    0 0 0 3px rgba(var(--v-theme-primary), 0.16),
    0 0 18px rgba(var(--v-theme-primary), 0.18),
    0 10px 22px rgba(var(--v-theme-primary), 0.12);
  animation: hotkeyFlash 0.6s ease;
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

.search-hotkey-pill {
  position: absolute;
  top: -10px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.14);
  border: 1px solid rgba(var(--v-theme-primary), 0.24);
  color: rgb(var(--v-theme-primary));
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
  box-shadow: 0 6px 18px rgba(var(--v-theme-primary), 0.14);
  backdrop-filter: blur(4px);
  z-index: 2;
}

@keyframes posShellPulse {
  0% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.006);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes hotkeyFlash {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.012);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes flashSuccess {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.01);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes flashError {
  0% {
    transform: translateX(0);
  }
  30% {
    transform: translateX(-3px);
  }
  60% {
    transform: translateX(3px);
  }
  100% {
    transform: translateX(0);
  }
}

.search-pill-enter-active,
.search-pill-leave-active {
  transition: all 0.18s ease;
}

.search-pill-enter-from,
.search-pill-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.96);
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
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
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