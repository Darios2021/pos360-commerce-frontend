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
          open-delay="280"
        >
          <template #activator="{ props: tooltipProps }">
            <button
              v-bind="tooltipProps"
              type="button"
              class="ptb-tile"
              :class="[item.color, {
                active: activeHotkey === item.key,
                'is-open': isStateActive(item),
              }]"
              :aria-label="item.tooltip"
              :aria-keyshortcuts="item.key"
              :aria-pressed="isStateActive(item) ? 'true' : 'false'"
              @click="activateAndDispatch(item)"
            >
              <span class="ptb-tile-icon">
                <v-icon>{{ item.icon }}</v-icon>
              </span>
              <span class="ptb-tile-key">{{ item.key }}</span>

              <!-- Dot indicador: se enciende cuando el estado asociado está abierto -->
              <span v-if="isStateActive(item)" class="ptb-tile-dot" aria-hidden="true" />
            </button>
          </template>

          <div class="ptb-tooltip">
            <div class="ptb-tooltip__title">{{ item.label }} ({{ item.key }})</div>
            <div v-if="item.description" class="ptb-tooltip__desc">
              {{ item.description }}
            </div>
            <div v-if="isStateActive(item)" class="ptb-tooltip__hint">
              Presioná {{ item.key }} de nuevo para cerrar
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
  isViewOnly: { type: Boolean, default: false },
  needsBranchPick: { type: Boolean, default: false },
  hasMultiBranches: { type: Boolean, default: false },
  loadingGlobal: { type: Boolean, default: false },
  cartCount: { type: Number, default: 0 },
  // Mapa { F1: bool, F4: bool, ... } que indica qué shortcuts están "abiertos"
  // — el padre lo provee desde el flow de sales.
  activeStates: { type: Object, default: () => ({}) },
});

const emit = defineEmits([
  "help",
  "find-product",
  "search",
  "refresh",
  "show-cart",
  "pay",
]);

const shortcuts = POS_SHORTCUTS;
const renderedGroups = computed(() => groupShortcuts(shortcuts));

// El padre decide cuándo una F-key queda "activa visualmente" porque su UI
// asociada está abierta. Caemos a props.activeStates antes que a nada.
function isStateActive(item) {
  return !!props.activeStates?.[item.key];
}

// Fullscreen nativo: detectamos el estado para reflejarlo en el tile F11.
const isFullscreen = ref(false);
function syncFullscreenState() {
  isFullscreen.value = !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  );
}

const flow = usePosSalesFlow();
const ALWAYS_ALLOWED_KEYS = new Set(["F1", "F11"]);

function isBlockingDialogOpen() {
  return !!(
    flow?.cajaConfigOpen?.value ||
    flow?.cajaArqueoOpen?.value ||
    flow?.branchPickOpen?.value ||
    flow?.receiptOpen?.value
  );
}

// F2 queda resaltado por default porque es el atajo de uso más frecuente.
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

  // Dialogs bloqueantes (arqueo, config de caja, branch pick): solo dejamos
  // pasar F1 (ayuda) y F11 (fullscreen).
  if (isBlockingDialogOpen() && !ALWAYS_ALLOWED_KEYS.has(item.key)) {
    return;
  }

  // Bloqueamos la acción default del browser (F1 ayuda, F3 find, F5 reload,
  // F11 fullscreen nativo, F12 devtools, etc.).
  e.preventDefault();
  e.stopPropagation();

  activateAndDispatch(item);
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown, { capture: true });
  document.addEventListener("fullscreenchange", syncFullscreenState);
  document.addEventListener("webkitfullscreenchange", syncFullscreenState);
  syncFullscreenState();
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown, { capture: true });
  document.removeEventListener("fullscreenchange", syncFullscreenState);
  document.removeEventListener("webkitfullscreenchange", syncFullscreenState);

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
  gap: 10px;
  flex-wrap: nowrap;
  padding: 0 10px;
  height: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}

.ptb-hotkeys::-webkit-scrollbar {
  display: none;
}

.ptb-sep {
  flex: 0 0 auto;
  width: 1px;
  height: 40px;
  margin: 0 4px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 1px;
}

/* ─────────── App tile (cuadrado estilo launcher) ─────────── */
.ptb-tile {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex: 0 0 auto;
  width: 62px;
  height: 62px;
  padding: 8px 6px 6px;
  border-radius: 14px;
  cursor: pointer;
  color: inherit;
  background: linear-gradient(
    180deg,
    rgba(var(--v-theme-on-surface), 0.04) 0%,
    rgba(var(--v-theme-on-surface), 0.02) 100%
  );
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  transition:
    transform 0.12s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;
}

.ptb-tile:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--v-theme-primary), 0.32);
  box-shadow:
    0 8px 18px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.ptb-tile:active {
  transform: translateY(0);
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.ptb-tile:focus-visible {
  outline: none;
  border-color: rgb(var(--v-theme-primary));
  box-shadow:
    0 0 0 3px rgba(var(--v-theme-primary), 0.28),
    0 8px 18px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

/* Pulso momentáneo al activar */
.ptb-tile.active {
  border-color: rgba(var(--v-theme-primary), 0.38);
  background: linear-gradient(
    180deg,
    rgba(var(--v-theme-primary), 0.12) 0%,
    rgba(var(--v-theme-primary), 0.06) 100%
  );
}

/* Estado "abierto": la UI asociada está visible → el tile queda resaltado */
.ptb-tile.is-open {
  border-color: rgb(var(--v-theme-primary));
  background: linear-gradient(
    180deg,
    rgba(var(--v-theme-primary), 0.22) 0%,
    rgba(var(--v-theme-primary), 0.1) 100%
  );
  box-shadow:
    0 0 0 1px rgba(var(--v-theme-primary), 0.38),
    0 4px 12px rgba(var(--v-theme-primary), 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.ptb-tile[disabled],
.ptb-tile[aria-disabled="true"] {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Ícono grande centrado — "cara" del app */
.ptb-tile-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  line-height: 1;
}

.ptb-tile-icon :deep(.v-icon) {
  font-size: 26px !important;
  line-height: 1;
}

/* Chip F{número} — siempre visible, monoespacio */
.ptb-tile-key {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 1;
  color: rgba(var(--v-theme-on-surface), 0.72);
  padding: 2px 6px;
  border-radius: 5px;
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.ptb-tile.is-open .ptb-tile-key {
  color: rgb(var(--v-theme-on-primary));
  background: rgb(var(--v-theme-primary));
}

.ptb-tile.active .ptb-tile-key {
  color: rgb(var(--v-theme-primary));
}

/* Dot indicador de estado abierto (esquina superior derecha del tile) */
.ptb-tile-dot {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 2px rgb(var(--v-theme-surface));
  animation: ptbTileDotPulse 1.4s ease-in-out infinite;
}

@keyframes ptbTileDotPulse {
  0%, 100% {
    box-shadow: 0 0 0 2px rgb(var(--v-theme-surface)), 0 0 0 0 rgba(var(--v-theme-primary), 0.4);
  }
  50% {
    box-shadow: 0 0 0 2px rgb(var(--v-theme-surface)), 0 0 0 5px rgba(var(--v-theme-primary), 0);
  }
}

/* Tooltip */
.ptb-tooltip {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-width: 260px;
}

.ptb-tooltip__title {
  font-weight: 400;
  font-size: 12px;
  line-height: 1.2;
}

.ptb-tooltip__desc {
  font-size: 11px;
  opacity: 0.85;
  line-height: 1.3;
}

.ptb-tooltip__hint {
  font-size: 10.5px;
  opacity: 0.72;
  font-style: italic;
  border-top: 1px solid rgba(255, 255, 255, 0.16);
  padding-top: 3px;
  margin-top: 2px;
}

/* Mobile: tiles un toque más chicos pero aún square */
@media (max-width: 599px) {
  .ptb-tile {
    width: 56px;
    height: 56px;
    padding: 6px 4px;
    border-radius: 12px;
  }
  .ptb-tile-icon :deep(.v-icon) {
    font-size: 22px !important;
  }
  .ptb-tile-key {
    font-size: 9.5px;
    padding: 1px 5px;
  }
  .ptb-hotkeys {
    justify-content: flex-start;
    gap: 8px;
  }
}

/* Colores por grupo — para el tint de íconos.
   El tile base ya resalta por fondo/borde; acá pintamos el ícono. */
.hk-help       :deep(.v-icon) { color: rgb(var(--v-theme-primary)); }
.hk-find       :deep(.v-icon) { color: rgb(var(--v-theme-info)); }
.hk-search     :deep(.v-icon) { color: rgba(var(--v-theme-info), 0.82); }
.hk-refresh    :deep(.v-icon) { color: rgba(var(--v-theme-info), 0.72); }
.hk-cart       :deep(.v-icon) { color: rgb(var(--v-theme-primary)); }
.hk-pay        :deep(.v-icon) { color: rgb(var(--v-theme-success)); }
.hk-fullscreen :deep(.v-icon) { color: rgba(var(--v-theme-on-surface), 0.76); }

/* Cuando el tile está "is-open", forzamos el ícono a blanco puro para máximo contraste */
.ptb-tile.is-open :deep(.v-icon) {
  color: rgb(var(--v-theme-on-primary)) !important;
}
</style>
