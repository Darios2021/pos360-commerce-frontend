<template>
  <!--
    Este componente tiene 2 root nodes (el div principal + el <Teleport>), por lo
    que Vue no puede auto-mergear la class/style que llega del padre. Lo manejamos
    explícitamente en el div con `v-bind="$attrs"` y desactivamos el merge automático
    abajo con `defineOptions({ inheritAttrs: false })`. Así el warning
    "Extraneous non-props attributes" desaparece sin cambiar la estructura.
  -->
  <div
    ref="rootRef"
    class="pos-search-bar"
    :class="{ 'hotkey-active': hotkeyActive, 'dd-open': showDropdown }"
    data-tour="search"
    v-bind="$attrs"
  >
    <div class="search-shell" ref="shellRef">
      <v-text-field
        ref="searchRef"
        v-model="qLocal"
        placeholder="Buscá por nombre, marca, SKU o escaneá un código…"
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
        @focus="onFocus"
        @blur="onBlur"
        @keydown.enter.prevent="onEnter"
        @keydown.down.prevent="onArrowDown"
        @keydown.up.prevent="onArrowUp"
        @keydown.esc="onEsc"
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

  <!-- Dropdown smart search (teleport al body para evadir overflow del layout POS) -->
  <Teleport to="body">
    <transition name="pos-dd">
      <div
        v-if="showDropdown && !disabledAll && dropdownHasContent"
        class="pos-smart-dd"
        :style="ddStyle"
        @mousedown.prevent
        role="listbox"
      >
        <div v-if="loadingSugg" class="pos-dd-status">
          <v-icon size="14" class="pos-dd-status-icon">mdi-loading mdi-spin</v-icon>
          <span>Buscando sugerencias…</span>
        </div>

        <template v-else-if="suggestions.length">
          <ul class="pos-dd-list">
            <!-- Fila 0: buscar texto libre -->
            <li role="option">
              <button
                type="button"
                class="pos-dd-row pos-dd-row--search"
                :class="{ active: activeIdx === -1 }"
                @mouseenter="activeIdx = -1"
                @click.prevent="goSearchLiteral"
              >
                <v-icon size="17" class="pos-dd-row-icon">mdi-magnify</v-icon>
                <span class="pos-dd-row-text">
                  Buscar
                  <span class="pos-dd-typed">«{{ normalizedQ }}»</span>
                  en el catálogo
                </span>
                <span class="pos-dd-kbd">↵</span>
              </button>
            </li>

            <!-- Sugerencias -->
            <li
              v-for="(s, i) in suggestions"
              :key="`${s.product_id}-${i}`"
              role="option"
            >
              <button
                type="button"
                class="pos-dd-row"
                :class="{ active: i === activeIdx }"
                @mouseenter="activeIdx = i"
                @click.prevent="pickSuggestion(s)"
              >
                <v-icon size="15" class="pos-dd-row-icon">mdi-magnify</v-icon>
                <span class="pos-dd-row-text">
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <span v-html="highlightCompletion(s.name)"></span>
                  <span v-if="s.brand || s.category_name" class="pos-dd-row-meta">
                    <template v-if="s.brand">{{ s.brand }}</template>
                    <template v-if="s.brand && s.category_name"> · </template>
                    <template v-if="s.category_name">{{ s.category_name }}</template>
                  </span>
                </span>
                <v-icon size="13" class="pos-dd-row-arrow">mdi-arrow-top-left</v-icon>
              </button>
            </li>
          </ul>

          <div class="pos-dd-footer">
            <span class="pos-dd-hint">
              <span class="pos-dd-kbd-sm">↑</span>
              <span class="pos-dd-kbd-sm">↓</span>
              Navegar
            </span>
            <span class="pos-dd-hint">
              <span class="pos-dd-kbd-sm">↵</span>
              Seleccionar
            </span>
            <span class="pos-dd-hint">
              <span class="pos-dd-kbd-sm">Esc</span>
              Cerrar
            </span>
          </div>
        </template>

        <div v-else-if="showEmptyState" class="pos-dd-empty">
          <v-icon size="20" class="pos-dd-empty-icon">mdi-magnify-close</v-icon>
          <div class="pos-dd-empty-text">
            <strong>Sin sugerencias para «{{ normalizedQ }}»</strong>
            <span>Probá con otra palabra o escaneá el código del producto.</span>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
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
import http from "../../../app/api/http";

// Necesario porque el <template> tiene 2 root nodes (div + Teleport).
// Sin esto, Vue intenta inferir a cuál pegarle attrs y emite el warning
// "Extraneous non-props attributes". Con inheritAttrs:false desactivamos el
// merge automático y manejamos $attrs a mano en el div principal.
defineOptions({ inheritAttrs: false });

const props = defineProps({
  q: { type: String, default: "" },
  isOn: { type: Boolean, default: false },
  visualState: { type: String, default: "" },
  autoClearOnSubmit: { type: Boolean, default: true },
  keepFocusOnSubmit: { type: Boolean, default: true },
  focusOnEnable: { type: Boolean, default: true },
  disabledAll: { type: Boolean, default: false },
  focusHotkey: { type: String, default: "F2" },
  suggestionsEnabled: { type: Boolean, default: true },
  suggestionsMinChars: { type: Number, default: 2 },
  suggestionsDebounceMs: { type: Number, default: 450 },
  suggestionsLimit: { type: Number, default: 8 },
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
  "suggestion-pick",
]);

const rootRef = ref(null);
const shellRef = ref(null);
const searchRef = ref(null);
const qLocal = ref(props.q || "");
const isFocused = ref(false);
const hotkeyActive = ref(false);

// Smart search dropdown state
const suggestions = ref([]);
const loadingSugg = ref(false);
const showDropdown = ref(false);
const activeIdx = ref(-1);
const ddStyle = ref({});
const hadSuggestionsFetch = ref(false);

let hotkeyVisualTimer = null;
let suggDebounceTimer = null;
let abortCtrl = null;
let blurCloseTimer = null;

const inputStateClass = computed(() => {
  const classes = [];

  if (isFocused.value) classes.push("is-active");
  if (props.visualState === "success") classes.push("is-success");
  if (props.visualState === "error") classes.push("is-error");
  if (hotkeyActive.value) classes.push("is-hotkey-active");

  return classes;
});

const normalizedQ = computed(() => normalizeValue(qLocal.value));

const showEmptyState = computed(
  () =>
    hadSuggestionsFetch.value &&
    !loadingSugg.value &&
    normalizedQ.value.length >= props.suggestionsMinChars &&
    suggestions.value.length === 0 &&
    !looksLikeBarcode(normalizedQ.value)
);

const dropdownHasContent = computed(
  () => loadingSugg.value || suggestions.value.length > 0 || showEmptyState.value
);

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
  // Solo dígitos 6+ o alfanumérico con guiones/puntos con al menos 1 dígito
  if (/^\d{6,}$/.test(v)) return true;
  if (/^[A-Z0-9][A-Z0-9\-._]{3,}$/i.test(v) && /\d/.test(v)) return true;
  return false;
}

function shouldShowSuggestions(qValue) {
  if (!props.suggestionsEnabled) return false;
  if (props.disabledAll) return false;
  const q = normalizeValue(qValue);
  if (q.length < props.suggestionsMinChars) return false;
  // Scanner activo + query que parece código → no molestar
  if (looksLikeBarcode(q)) return false;
  return true;
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
  closeDropdown();
  suggestions.value = [];
  hadSuggestionsFetch.value = false;
}

function onTyping(value) {
  emit("typing", value);
  scheduleSuggestionsFetch();
}

function onFocus() {
  isFocused.value = true;
  if (blurCloseTimer) {
    clearTimeout(blurCloseTimer);
    blurCloseTimer = null;
  }
  updateDropdownPosition();
  // Reabrir si hay contenido previo y aplica
  if (shouldShowSuggestions(qLocal.value)) {
    if (suggestions.value.length || hadSuggestionsFetch.value) {
      showDropdown.value = true;
    } else {
      scheduleSuggestionsFetch(0);
    }
  }
}

function onBlur() {
  isFocused.value = false;
  // Delay para permitir click en items del dropdown
  blurCloseTimer = setTimeout(() => {
    closeDropdown();
    blurCloseTimer = null;
  }, 140);
}

function onEsc() {
  if (showDropdown.value) {
    closeDropdown();
    return;
  }
  // Sin dropdown → no interferir con comportamiento global (ESC puede cancelar algo en el flow)
}

function onArrowDown() {
  // Dropdown con sugerencias visibles → navegar dentro
  if (showDropdown.value && suggestions.value.length) {
    // Si ya estoy en la última sugerencia → saltar al grid
    if (activeIdx.value >= suggestions.value.length - 1) {
      closeDropdown();
      focusFirstProduct();
      return;
    }
    moveActive(1);
    return;
  }
  // Si está cargando, esperar
  if (showDropdown.value && loadingSugg.value) return;
  // Dropdown cerrado o vacío → saltar al grid de productos
  closeDropdown();
  focusFirstProduct();
}

function onArrowUp() {
  if (!showDropdown.value) return;
  moveActive(-1);
}

function focusFirstProduct() {
  const first = document.querySelector(".prow[tabindex='0']:not(.disabled)");
  if (first) {
    first.focus();
    first.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }
}

function moveActive(dir) {
  const max = suggestions.value.length - 1;
  if (max < 0) {
    activeIdx.value = -1;
    return;
  }
  let i = activeIdx.value + dir;
  if (i < -1) i = max;
  if (i > max) i = -1;
  activeIdx.value = i;
}

function closeDropdown() {
  showDropdown.value = false;
  activeIdx.value = -1;
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
  // Si el dropdown está abierto y hay una sugerencia seleccionada → elegirla
  if (showDropdown.value && activeIdx.value >= 0 && suggestions.value[activeIdx.value]) {
    pickSuggestion(suggestions.value[activeIdx.value]);
    return;
  }

  // Si hay dropdown abierto pero sin selección → "Buscar «q»" (submit texto libre)
  if (showDropdown.value && activeIdx.value === -1) {
    goSearchLiteral();
    return;
  }

  // Comportamiento original
  const code = normalizeValue(qLocal.value);
  if (!code) return;
  const source = props.isOn && looksLikeBarcode(code) ? "scanner" : "manual";
  emitSubmit(code, source);
}

function goSearchLiteral() {
  const code = normalizeValue(qLocal.value);
  if (!code) return;
  closeDropdown();
  const source = props.isOn && looksLikeBarcode(code) ? "scanner" : "manual";
  emitSubmit(code, source);
}

function pickSuggestion(s) {
  if (!s || !s.name) return;
  const name = String(s.name).trim();
  qLocal.value = name;
  closeDropdown();
  emit("suggestion-pick", s);
  // Emite enter sin auto-clear para que la lista principal muestre resultados del texto
  emit("enter", name);
  if (!props.disabledAll) focusInput();
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

function onDocClick(e) {
  const root = rootRef.value;
  if (!root) return;
  if (root.contains(e.target)) return;
  // click fuera del input/toolbar → también validar que no sea dentro del dropdown
  const t = e.target;
  if (t && t.closest && t.closest(".pos-smart-dd")) return;
  closeDropdown();
}

// ───── Fetch de sugerencias ─────

function scheduleSuggestionsFetch(delay = props.suggestionsDebounceMs) {
  if (!shouldShowSuggestions(qLocal.value)) {
    cancelPendingFetch();
    suggestions.value = [];
    closeDropdown();
    hadSuggestionsFetch.value = false;
    return;
  }
  cancelPendingFetch();
  suggDebounceTimer = setTimeout(fetchSuggestionsNow, delay);
}

function cancelPendingFetch() {
  if (suggDebounceTimer) {
    clearTimeout(suggDebounceTimer);
    suggDebounceTimer = null;
  }
  if (abortCtrl) {
    try {
      abortCtrl.abort();
    } catch (_e) {
      /* noop */
    }
    abortCtrl = null;
  }
}

async function fetchSuggestionsNow() {
  const q = normalizeValue(qLocal.value);
  if (!shouldShowSuggestions(q)) {
    closeDropdown();
    return;
  }

  loadingSugg.value = true;
  showDropdown.value = true;
  activeIdx.value = -1;
  updateDropdownPosition();

  if (abortCtrl) {
    try { abortCtrl.abort(); } catch (_e) { /* noop */ }
  }
  abortCtrl = new AbortController();

  try {
    const { data } = await http.get("/pos/suggestions", {
      params: { q, limit: props.suggestionsLimit },
      signal: abortCtrl.signal,
    });
    const arr = Array.isArray(data?.items) ? data.items : [];
    suggestions.value = arr;
    hadSuggestionsFetch.value = true;
    activeIdx.value = -1;
    updateDropdownPosition();
  } catch (err) {
    if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
    console.warn("[POS] fetchSuggestions error", err);
    suggestions.value = [];
    hadSuggestionsFetch.value = true;
  } finally {
    loadingSugg.value = false;
  }
}

// ───── Posicionamiento del dropdown ─────

function updateDropdownPosition() {
  const root = rootRef.value;
  if (!root) return;
  const rect = root.getBoundingClientRect();
  const vw = window.innerWidth;
  const width = Math.min(rect.width, vw - 24);
  const left = Math.max(12, Math.min(rect.left, vw - width - 12));
  ddStyle.value = {
    position: "fixed",
    top: `${Math.round(rect.bottom + 6)}px`,
    left: `${Math.round(left)}px`,
    width: `${Math.round(width)}px`,
    zIndex: 2000,
  };
}

function onWindowResizeOrScroll() {
  if (!showDropdown.value) return;
  updateDropdownPosition();
}

// ───── Highlight del prefijo tipeado ─────

function escHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightCompletion(name) {
  const q = normalizedQ.value.toLowerCase();
  const n = String(name || "");
  const nLower = n.toLowerCase();

  if (q && nLower.startsWith(q)) {
    const typed = escHtml(n.slice(0, q.length));
    const rest = escHtml(n.slice(q.length));
    return `<span class="pos-dd-prefix">${typed}</span><span class="pos-dd-rest">${rest}</span>`;
  }

  // Fallback: intentar resaltar primera ocurrencia del query en cualquier posición
  const idx = q ? nLower.indexOf(q) : -1;
  if (idx >= 0) {
    const before = escHtml(n.slice(0, idx));
    const match = escHtml(n.slice(idx, idx + q.length));
    const after = escHtml(n.slice(idx + q.length));
    return `${before}<span class="pos-dd-prefix">${match}</span>${after}`;
  }

  return escHtml(n);
}

// ───── Lifecycle ─────

onMounted(() => {
  window.addEventListener("keydown", handleGlobalKeydown);
  window.addEventListener("scroll", onWindowResizeOrScroll, { passive: true, capture: true });
  window.addEventListener("resize", onWindowResizeOrScroll);
  document.addEventListener("mousedown", onDocClick);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleGlobalKeydown);
  window.removeEventListener("scroll", onWindowResizeOrScroll, { capture: true });
  window.removeEventListener("resize", onWindowResizeOrScroll);
  document.removeEventListener("mousedown", onDocClick);

  if (hotkeyVisualTimer) clearTimeout(hotkeyVisualTimer);
  if (suggDebounceTimer) clearTimeout(suggDebounceTimer);
  if (blurCloseTimer) clearTimeout(blurCloseTimer);
  if (abortCtrl) {
    try { abortCtrl.abort(); } catch (_e) { /* noop */ }
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
    closeDropdown();
    onEnter();
  },
  activateHotkeyVisual: () => {
    triggerHotkeyVisualState();
  },
  closeSuggestions: () => {
    closeDropdown();
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

.pos-search-bar.dd-open {
  border-color: rgba(var(--v-theme-primary), 0.22);
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
  font-weight: 500;
  letter-spacing: 0.02em;
  box-shadow: 0 6px 18px rgba(var(--v-theme-primary), 0.14);
  backdrop-filter: blur(4px);
  z-index: 2;
}

@keyframes posShellPulse {
  0% { transform: scale(1); }
  45% { transform: scale(1.006); }
  100% { transform: scale(1); }
}

@keyframes hotkeyFlash {
  0% { transform: scale(1); }
  50% { transform: scale(1.012); }
  100% { transform: scale(1); }
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

<style>
/* ─────────── Dropdown smart search (teleported al body; estilos no-scoped) ─────────── */

.pos-smart-dd {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 14px;
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.18),
    0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  font-family: inherit;
}

.v-theme--dark .pos-smart-dd {
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 14px 32px rgba(0, 0, 0, 0.55),
    0 4px 12px rgba(0, 0, 0, 0.35);
}

.pos-dd-list {
  list-style: none;
  margin: 0;
  padding: 6px 0;
  max-height: min(58vh, 420px);
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.pos-dd-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
  line-height: 1.25;
  transition: background 0.12s ease;
}

.pos-dd-row:hover,
.pos-dd-row.active {
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.pos-dd-row.active {
  background: rgba(var(--v-theme-primary), 0.12);
}

.pos-dd-row-icon {
  color: rgba(var(--v-theme-on-surface), 0.42);
  flex: 0 0 auto;
}

.pos-dd-row-text {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.pos-dd-row-text > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.pos-dd-row-meta {
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-weight: 500;
  letter-spacing: 0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pos-dd-prefix {
  color: rgb(var(--v-theme-primary));
  font-weight: 400;
  background: rgba(var(--v-theme-primary), 0.08);
  border-radius: 3px;
  padding: 0 2px;
}

.pos-dd-rest {
  color: rgb(var(--v-theme-on-surface));
}

.pos-dd-row-arrow {
  color: rgba(var(--v-theme-on-surface), 0.35);
  flex: 0 0 auto;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.pos-dd-row.active .pos-dd-row-arrow {
  opacity: 1;
  color: rgb(var(--v-theme-primary));
}

/* Fila "Buscar «X»" — destacada */
.pos-dd-row--search {
  background: rgba(var(--v-theme-primary), 0.06);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  font-weight: 400;
}

.pos-dd-row--search:hover,
.pos-dd-row--search.active {
  background: rgba(var(--v-theme-primary), 0.14);
}

.pos-dd-row--search .pos-dd-row-icon {
  color: rgb(var(--v-theme-primary));
}

.pos-dd-typed {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
  margin: 0 3px;
}

/* Kbd hint grande (enter) */
.pos-dd-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 6px;
  background: rgba(var(--v-theme-primary), 0.14);
  color: rgb(var(--v-theme-primary));
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0;
  border: 1px solid rgba(var(--v-theme-primary), 0.22);
}

/* Footer con atajos */
.pos-dd-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 8px 14px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  background: rgba(var(--v-theme-on-surface), 0.02);
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.pos-dd-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pos-dd-kbd-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 5px;
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 10.5px;
  font-weight: 400;
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
}

/* Status/Empty */
.pos-dd-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.pos-dd-status-icon {
  opacity: 0.7;
}

.pos-dd-empty {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
}

.pos-dd-empty-icon {
  color: rgba(var(--v-theme-on-surface), 0.4);
  margin-top: 2px;
  flex: 0 0 auto;
}

.pos-dd-empty-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.pos-dd-empty-text strong {
  color: rgb(var(--v-theme-on-surface));
  font-weight: 400;
}

.pos-dd-empty-text span {
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-size: 12.5px;
}

/* Transition */
.pos-dd-enter-active,
.pos-dd-leave-active {
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}

.pos-dd-enter-from,
.pos-dd-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.985);
}

@media (max-width: 640px) {
  .pos-dd-row {
    padding: 10px 12px;
    font-size: 13.5px;
  }
  .pos-dd-footer {
    gap: 12px;
    padding: 8px 12px;
  }
}
</style>
