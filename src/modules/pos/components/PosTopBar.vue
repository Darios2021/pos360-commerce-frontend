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
                'is-armed': armedKey === item.key,
                'ptb-tile--clave': item.clave,
                'ptb-tile--icono': item.soloIcono,
              }]"
              :aria-label="item.tooltip"
              :aria-keyshortcuts="item.key"
              :aria-pressed="isStateActive(item) ? 'true' : 'false'"
              @click="activateAndDispatch(item)"
            >
              <span class="ptb-tile-icon">
                <v-icon>{{ iconOf(item) }}</v-icon>
              </span>
              <span class="ptb-tile-label">{{ labelOf(item) }}</span>
              <span class="ptb-tile-key">{{ item.key }}</span>

              <!-- Dot indicador: se enciende cuando el estado asociado está abierto -->
              <span v-if="isStateActive(item)" class="ptb-tile-dot" aria-hidden="true" />
            </button>
          </template>

          <div class="ptb-tooltip">
            <div class="ptb-tooltip__title">{{ labelOf(item) }} ({{ item.key }})</div>
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
  cajaOpen: { type: Boolean, default: false },
});

const emit = defineEmits([
  "help",
  "find-product",
  "search",
  "refresh",
  "show-cart",
  "pay",
  "new-customer",
  "clear-cart",
  "cash",
  "movements",
]);

// F7 cambia con el estado de la caja, como en Zondito.
function iconOf(item) {
  if (item.key === "F7") return props.cajaOpen ? "mdi-lock-outline" : "mdi-lock-open-variant-outline";
  return item.icon;
}
function labelOf(item) {
  if (item.key === "F7") return props.cajaOpen ? "Cerrar caja" : "Abrir caja";
  if (armedKey.value === item.key) return "¿Vaciar?";
  return item.label;
}

// Teclas con confirmación (F8): la primera pulsación la arma por 3 s y la
// segunda ejecuta. Con el carrito vacío no hay nada que confirmar.
const armedKey = ref(null);
let armedTimer = null;
function disarm() {
  armedKey.value = null;
  if (armedTimer) { clearTimeout(armedTimer); armedTimer = null; }
}

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
  if (item.confirm && props.cartCount > 0 && armedKey.value !== item.key) { // (F8 ya no lo usa: confirma en su ventana)
    disarm();
    armedKey.value = item.key;
    armedTimer = setTimeout(disarm, 3000);
    return;
  }
  disarm();
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
  // Con el cobro abierto, sus teclas son del cobro (F10 confirma la venta):
  // la barra sólo atiende F1, F11 y F9, que lo cierra.
  if (flow?.checkoutDialog?.value && !ALWAYS_ALLOWED_KEYS.has(item.key) && item.key !== "F9") {
    return;
  }

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
  disarm();
});
</script>

<style scoped>
/* Barra de teclas con el diseño de Zondito (BarraPOS): cada tecla es un
   botón bajo con su figurita de 32 px en el color de la acción. La tecla se
   ve siempre en F2 (buscar) y F9 (cobrar); en las demás aparece flotando en
   la esquina al pasar el mouse, y el botón entero se tiñe del color de la
   marca, como el hover de Zondito. La etiqueta aparece cuando la barra tiene
   ancho para todas. */
.ptb {
  width: 100%;
  height: 100%;
  overflow: hidden;
  container-type: inline-size;
}

.ptb-hotkeys {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  flex-wrap: nowrap;
  padding: 12px 16px 6px;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: visible;
  scrollbar-width: none;
}
.ptb-hotkeys::-webkit-scrollbar { display: none; }

.ptb-sep { display: block; width: 1px; height: 34px; margin: 0 6px; background: var(--z-linea, #d3dde7); flex-shrink: 0; }

.ptb-tile {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  height: 54px;
  padding: 7px 12px 7px 7px;
  box-sizing: border-box;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--z-texto2, #334155);
  font: 700 14px Inter, sans-serif;
  cursor: pointer;
  transition: background-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
}
.ptb-tile:hover {
  background: #cfe5f5;
  box-shadow: inset 0 0 0 1.5px #3f8fc6;
  color: #0a466e;
}
.ptb-tile:active { transform: scale(0.95); }
.ptb-tile:focus-visible {
  outline: 2px solid var(--z-primario, #0f6fae);
  outline-offset: 1px;
}
.ptb-tile[disabled],
.ptb-tile[aria-disabled="true"] {
  opacity: 0.4;
  cursor: not-allowed;
}

/* La figurita: icono y fondo del mismo color (tonos medidos en Zondito). */
.ptb-tile-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(100, 116, 139, 0.2);
  transition: filter 0.15s ease;
}
.ptb-tile:hover .ptb-tile-icon { filter: brightness(1.1) saturate(1.2); }
.ptb-tile-icon :deep(.v-icon) {
  font-size: 24px !important;
  color: #334155;
}

/* La tecla, como una tecla de verdad. */
.ptb-tile-key {
  display: none;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 26px;
  padding: 0 8px;
  box-sizing: border-box;
  border-radius: 6px;
  font: 900 14.5px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  letter-spacing: -0.02em;
  line-height: 1;
  color: #1e293b;
  background: linear-gradient(#f8fafc, #cbd5e1);
  border: 1px solid rgba(100, 116, 139, 0.6);
  box-shadow: 0 2px 0 rgba(15, 23, 42, 0.45), 0 2px 4px rgba(0, 0, 0, 0.18);
}
/* F2 y F9: la tecla al lado, siempre. Las demás: flotando en la esquina,
   sólo con el mouse encima o con foco de teclado. */
.ptb-tile--clave .ptb-tile-key { display: inline-flex; }
.ptb-tile:not(.ptb-tile--clave) .ptb-tile-key {
  display: inline-flex;
  position: absolute;
  top: -9px;
  right: -10px;
  z-index: 3;
  opacity: 0;
  transform: translateY(3px);
  transition: opacity 120ms ease, transform 120ms ease;
  pointer-events: none;
}
.ptb-tile:not(.ptb-tile--clave):is(:hover, :focus-visible, .is-armed) .ptb-tile-key {
  opacity: 1;
  transform: none;
}

/* Etiqueta: con lugar para todas. */
.ptb-tile-label { display: none; }
@container (min-width: 1250px) {
  .ptb-tile-label { display: inline; }
}
.ptb-tile.is-armed .ptb-tile-label { display: inline; }
.ptb-tile--icono .ptb-tile-label { display: none !important; }

.ptb-tile.active,
.ptb-tile.is-open { background: rgba(15, 111, 174, 0.10); }

/* F8 armada: esperando la segunda pulsación. */
.ptb-tile.is-armed,
.ptb-tile.is-armed:hover {
  background: #fde2e2;
  box-shadow: inset 0 0 0 1.5px #dc2626;
  color: #991b1b;
}

/* Punto de "abierto" (la ventana de esa tecla está a la vista) */
.ptb-tile-dot {
  position: absolute;
  top: 4px;
  left: 40px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--z-primario, #0f6fae);
  box-shadow: 0 0 0 2px var(--z-barra, #ffffff);
}

/* Tonos por acción (Zondito: 500 al 20-25 % de fondo, icono en 700). */
.hk-help       .ptb-tile-icon { background: rgba(100, 116, 139, 0.2); }
.hk-help       .ptb-tile-icon :deep(.v-icon) { color: #334155; }
.hk-find       .ptb-tile-icon { background: rgba(100, 116, 139, 0.2); }
.hk-find       .ptb-tile-icon :deep(.v-icon) { color: #334155; }
.hk-search     .ptb-tile-icon { background: rgba(20, 184, 166, 0.25); }
.hk-search     .ptb-tile-icon :deep(.v-icon) { color: #0f766e; }
.hk-refresh    .ptb-tile-icon { background: rgba(14, 165, 233, 0.2); }
.hk-refresh    .ptb-tile-icon :deep(.v-icon) { color: #0369a1; }
.hk-cart       .ptb-tile-icon { background: rgba(139, 92, 246, 0.2); }
.hk-cart       .ptb-tile-icon :deep(.v-icon) { color: #6d28d9; }
.hk-customer   .ptb-tile-icon { background: rgba(14, 165, 233, 0.2); }
.hk-customer   .ptb-tile-icon :deep(.v-icon) { color: #0369a1; }
.hk-clear      .ptb-tile-icon { background: rgba(239, 68, 68, 0.2); }
.hk-clear      .ptb-tile-icon :deep(.v-icon) { color: #b91c1c; }
.hk-cash       .ptb-tile-icon { background: rgba(245, 158, 11, 0.25); }
.hk-cash       .ptb-tile-icon :deep(.v-icon) { color: #b45309; }
.hk-movements  .ptb-tile-icon { background: rgba(20, 184, 166, 0.25); }
.hk-movements  .ptb-tile-icon :deep(.v-icon) { color: #0f766e; }
.hk-pay        .ptb-tile-icon { background: #10b981; box-shadow: 0 3px 9px rgba(16, 185, 129, 0.4); }
.hk-pay        .ptb-tile-icon :deep(.v-icon) { color: #ffffff; }
.hk-fullscreen .ptb-tile-icon { background: rgba(100, 116, 139, 0.2); }
.hk-fullscreen .ptb-tile-icon :deep(.v-icon) { color: #334155; }

/* Oscuro: fondo al 20 % e icono en 400. */
.v-theme--dark .hk-help .ptb-tile-icon :deep(.v-icon),
.v-theme--dark .hk-find .ptb-tile-icon :deep(.v-icon),
.v-theme--dark .hk-fullscreen .ptb-tile-icon :deep(.v-icon),
.v-theme--adminDark .hk-help .ptb-tile-icon :deep(.v-icon),
.v-theme--adminDark .hk-find .ptb-tile-icon :deep(.v-icon),
.v-theme--adminDark .hk-fullscreen .ptb-tile-icon :deep(.v-icon) { color: #cbd5e1; }
.v-theme--dark .hk-search .ptb-tile-icon :deep(.v-icon),
.v-theme--adminDark .hk-search .ptb-tile-icon :deep(.v-icon) { color: #2dd4bf; }
.v-theme--dark .hk-refresh .ptb-tile-icon :deep(.v-icon),
.v-theme--adminDark .hk-refresh .ptb-tile-icon :deep(.v-icon) { color: #38bdf8; }
.v-theme--dark .hk-cart .ptb-tile-icon :deep(.v-icon),
.v-theme--adminDark .hk-cart .ptb-tile-icon :deep(.v-icon) { color: #a78bfa; }
.v-theme--dark .hk-customer .ptb-tile-icon :deep(.v-icon),
.v-theme--adminDark .hk-customer .ptb-tile-icon :deep(.v-icon) { color: #38bdf8; }
.v-theme--dark .hk-clear .ptb-tile-icon :deep(.v-icon),
.v-theme--adminDark .hk-clear .ptb-tile-icon :deep(.v-icon) { color: #f87171; }
.v-theme--dark .hk-cash .ptb-tile-icon :deep(.v-icon),
.v-theme--adminDark .hk-cash .ptb-tile-icon :deep(.v-icon) { color: #fbbf24; }
.v-theme--dark .hk-movements .ptb-tile-icon :deep(.v-icon),
.v-theme--adminDark .hk-movements .ptb-tile-icon :deep(.v-icon) { color: #2dd4bf; }
.v-theme--dark .ptb-tile:hover,
.v-theme--adminDark .ptb-tile:hover {
  background: #1d3a55;
  box-shadow: inset 0 0 0 1.5px #8cc0e3;
  color: #e2eefa;
}

/* Tooltip */
.ptb-tooltip {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-width: 260px;
}
.ptb-tooltip__title { font-weight: 600; font-size: 12px; line-height: 1.2; }
.ptb-tooltip__desc { font-size: 11px; opacity: 0.85; line-height: 1.3; }
.ptb-tooltip__hint {
  font-size: 10.5px;
  opacity: 0.72;
  border-top: 1px solid rgba(255, 255, 255, 0.16);
  padding-top: 3px;
  margin-top: 2px;
}

/* Teléfono: sin tecla (no hay teclado), sólo la figurita. */
@media (max-width: 599px) {
  .ptb-hotkeys { padding: 4px 8px; }
  .ptb-tile-key { display: none !important; }
}
</style>
