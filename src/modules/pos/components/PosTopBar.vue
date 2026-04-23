<template>
  <div class="ptb">
    <div class="ptb-hotkeys" role="toolbar" aria-label="Atajos del POS">
      <template v-for="(group, gi) in renderedGroups" :key="group.id">
        <span
          v-if="gi > 0"
          class="ptb-sep"
          aria-hidden="true"
        />

        <v-tooltip
          v-for="item in group.items"
          :key="item.key"
          location="bottom"
          open-delay="250"
        >
          <template #activator="{ props: tooltipProps }">
            <button
              v-bind="tooltipProps"
              type="button"
              class="ptb-hotkey"
              :class="[item.color, { active: activeHotkey === item.key }]"
              :aria-label="item.tooltip"
              :aria-keyshortcuts="item.key"
              @click="activateAndDispatch(item)"
            >
              <span class="ptb-hotkey-key">{{ item.key }}</span>
              <div class="ptb-hotkey-icon">
                <v-icon>{{ item.icon }}</v-icon>
              </div>
            </button>
          </template>

          <div class="ptb-tooltip">
            <div class="ptb-tooltip__title">{{ item.label }} ({{ item.key }})</div>
            <div v-if="item.description" class="ptb-tooltip__desc">
              {{ item.description }}
            </div>
          </div>
        </v-tooltip>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import {
  POS_SHORTCUTS,
  groupShortcuts,
  getShortcutByKey,
} from "../config/posShortcuts.config";
import { usePosSalesFlow } from "../containers/usePosSalesFlow";

const props = defineProps({
  // Se mantienen props existentes para no romper callers.
  isViewOnly: { type: Boolean, default: false },
  needsBranchPick: { type: Boolean, default: false },
  hasMultiBranches: { type: Boolean, default: false },
  loadingGlobal: { type: Boolean, default: false },
  cartCount: { type: Number, default: 0 },
});

// Emitimos exactamente los eventos declarados en el config.
// Eventos historicos + nuevos: help, find-product, clients, search, refresh,
// show-cart, discount, cash-in, pay, pay-cash, pay-other.
// (fullscreen se resuelve local, no se emite.)
const emit = defineEmits([
  "help",
  "find-product",
  "clients",
  "search",
  "refresh",
  "show-cart",
  "discount",
  "cash-in",
  "pay",
  "pay-cash",
  "pay-other",
]);

const shortcuts = POS_SHORTCUTS;
const renderedGroups = computed(() => groupShortcuts(shortcuts));

// Cuando el checkout / branch-pick / caja-config esta abierto, solo
// permitimos F1 (ayuda) y F11 (fullscreen). El resto lo maneja el
// dialog activo (ej: F10 confirma venta en CheckoutDialog).
const flow = usePosSalesFlow();
const ALWAYS_ALLOWED_KEYS = new Set(["F1", "F11"]);

function isBlockingDialogOpen() {
  return !!(
    flow?.checkoutDialog?.value ||
    flow?.cajaConfigOpen?.value ||
    flow?.cajaArqueoOpen?.value ||
    flow?.branchPickOpen?.value ||
    flow?.receiptOpen?.value
  );
}

// Por defecto F2 (buscador) queda "holdActive" porque es el atajo de uso
// mas frecuente y da feedback visual del estado "default" del cajero.
const initialHold = shortcuts.find((s) => s.holdActive)?.key || null;
const activeHotkey = ref(initialHold);
let activeTimer = null;

function isEditableElement(target) {
  if (!target) return false;
  const tag = String(target.tagName || "").toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable === true
  );
}

function setActiveHotkey(key, hold = false) {
  activeHotkey.value = key;

  if (activeTimer) {
    clearTimeout(activeTimer);
    activeTimer = null;
  }

  if (!hold) {
    activeTimer = setTimeout(() => {
      if (activeHotkey.value === key && key !== initialHold) {
        activeHotkey.value = initialHold;
      }
      activeTimer = null;
    }, 1200);
  }
}

function toggleFullscreen() {
  try {
    const doc = document;
    const inFs =
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.msFullscreenElement;

    if (!inFs) {
      const el = doc.documentElement;
      const req =
        el.requestFullscreen ||
        el.webkitRequestFullscreen ||
        el.msRequestFullscreen;
      if (req) req.call(el);
    } else {
      const exit =
        doc.exitFullscreen ||
        doc.webkitExitFullscreen ||
        doc.msExitFullscreen;
      if (exit) exit.call(doc);
    }
  } catch (err) {
    console.warn("[POS] fullscreen toggle failed", err);
  }
}

function dispatch(item) {
  if (!item) return;

  if (item.localOnly) {
    if (item.event === "fullscreen") {
      toggleFullscreen();
    }
    return;
  }

  if (item.event) {
    emit(item.event);
  }
}

function activateAndDispatch(item) {
  if (!item) return;
  setActiveHotkey(item.key, !!item.holdActive);
  dispatch(item);
}

function handleKeydown(e) {
  if (!e || e.repeat) return;
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  const key = String(e.key || "");
  if (!/^F([1-9]|1[0-2])$/.test(key)) return;

  const item = getShortcutByKey(key);
  if (!item) return;

  const editing = isEditableElement(e.target);
  if (editing && !item.allowInInput) return;

  // Si hay un dialog bloqueante abierto, cedemos todas las F-keys al
  // dialog (que ya escucha las que le importan con su propio listener).
  // Solo mantenemos F1 (ayuda) y F11 (fullscreen) siempre activos.
  if (isBlockingDialogOpen() && !ALWAYS_ALLOWED_KEYS.has(item.key)) {
    return;
  }

  // Bloqueamos la accion default del browser (F1 ayuda, F3 find,
  // F5 reload, F11 fullscreen nativo, F12 devtools, etc.).
  e.preventDefault();
  e.stopPropagation();

  activateAndDispatch(item);
}

onMounted(() => {
  // capture: true para ganarle al navegador y al resto del DOM.
  window.addEventListener("keydown", handleKeydown, { capture: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown, { capture: true });

  if (activeTimer) {
    clearTimeout(activeTimer);
    activeTimer = null;
  }
});
</script>

<style scoped>
.ptb {
  width: 100%;
  overflow: hidden;
}

.ptb-hotkeys {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: nowrap;
  padding: 0 10px;
  height: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}

.ptb-hotkeys::-webkit-scrollbar {
  display: none;
}

/* Separador vertical translucido entre grupos (sutil). */
.ptb-sep {
  flex: 0 0 auto;
  width: 1px;
  height: 20px;
  margin: 0 6px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 1px;
}

.ptb-hotkey {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-width: 0;
  height: 38px;
  padding: 0 10px;
  border-radius: 10px;
  cursor: pointer;
  flex: 0 0 auto;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  color: inherit;
  transition:
    background 0.13s ease,
    border-color 0.13s ease,
    box-shadow 0.13s ease,
    transform 0.08s ease;
}

.ptb-hotkey:hover {
  background: rgba(var(--v-theme-on-surface), 0.07);
  border-color: rgba(var(--v-theme-on-surface), 0.16);
  filter: brightness(1.05);
}

/* Foco visible por teclado (keyboard-first). */
.ptb-hotkey:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
  z-index: 1;
}

/* Pulsado: escala sutil + flash primary. */
.ptb-hotkey:active {
  transform: scale(0.97);
}

.ptb-hotkey.active {
  background: rgba(var(--v-theme-primary), 0.12);
  border-color: rgba(var(--v-theme-primary), 0.32);
  box-shadow: 0 0 0 1px rgba(var(--v-theme-primary), 0.14);
}

.ptb-hotkey.active .ptb-hotkey-key {
  color: rgb(var(--v-theme-primary));
}

.ptb-hotkey[disabled],
.ptb-hotkey[aria-disabled="true"] {
  opacity: 0.4;
  cursor: not-allowed;
}

.ptb-hotkey-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.95;
}

.ptb-hotkey-icon :deep(.v-icon) {
  font-size: 18px;
}

.ptb-hotkey-key {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.02em;
  opacity: 0.82;
  line-height: 1;
  color: rgba(var(--v-theme-on-surface), 0.85);
  padding: 2px 5px;
  border-radius: 5px;
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.ptb-hotkey.active .ptb-hotkey-icon {
  opacity: 1;
}

/* Contenido del tooltip (v-tooltip) */
.ptb-tooltip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 260px;
}

.ptb-tooltip__title {
  font-weight: 700;
  font-size: 12px;
  line-height: 1.2;
}

.ptb-tooltip__desc {
  font-size: 11px;
  opacity: 0.85;
  line-height: 1.3;
}

/* Mobile: mas compacto, mantener scroll horizontal. */
@media (max-width: 599px) {
  .ptb-hotkey {
    padding: 0 8px;
    gap: 5px;
    height: 36px;
  }
  .ptb-hotkey-key {
    font-size: 10px;
    padding: 2px 4px;
  }
  .ptb-hotkeys {
    justify-content: flex-start;
  }
}

/* COLORES semanticos por grupo / hotkey.
   Se mapean a tokens del theme de Vuetify para que dark mode funcione
   sin sombras invisibles. */
.hk-help       { color: rgb(var(--v-theme-primary)); }
.hk-find       { color: rgb(var(--v-theme-info)); }
.hk-clients    { color: rgba(var(--v-theme-primary), 0.78); }
.hk-search     { color: rgba(var(--v-theme-info), 0.78); }
.hk-refresh    { color: rgba(var(--v-theme-info), 0.68); }
.hk-cart       { color: rgb(var(--v-theme-primary)); }
.hk-discount   { color: rgb(var(--v-theme-error)); }
.hk-cash-in    { color: rgb(var(--v-theme-warning)); }
.hk-pay        { color: rgb(var(--v-theme-success)); }
.hk-cash       { color: rgba(var(--v-theme-success), 0.78); }
.hk-other-pay  { color: rgba(var(--v-theme-on-surface), 0.72); }
.hk-fullscreen { color: rgba(var(--v-theme-on-surface), 0.72); }
</style>
