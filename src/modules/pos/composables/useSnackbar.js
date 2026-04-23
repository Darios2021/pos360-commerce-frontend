import { reactive } from "vue";

/**
 * Snackbar compartido a nivel módulo (singleton por import JS).
 *
 * Motivación: permite que cualquier componente del POS dispare
 * el mismo snackbar que ya consume `PosDialogs.vue` a través de
 * `usePosSalesFlow`, sin tener que cablear props/emits manualmente.
 *
 * API pública:
 *   const { state, toast, close } = useSnackbar()
 *
 * - state: objeto reactivo con { show, text, color, timeout, location, variant, icon }
 * - toast(text, options?):
 *     options puede ser un objeto { color, timeout, location, variant, icon }
 *     o, por compatibilidad, argumentos posicionales toast(text, color, timeout).
 * - close(): fuerza cierre y limpia timer.
 *
 * El estado es reactive() fuera de la función para garantizar singleton.
 */

const DEFAULT_TIMEOUT = 3200;

const state = reactive({
  show: false,
  text: "",
  color: undefined,
  timeout: DEFAULT_TIMEOUT,
  location: undefined,
  variant: undefined,
  icon: undefined,
});

let hideTimer = null;

function clearHideTimer() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

function scheduleAutoClose(timeout) {
  clearHideTimer();
  const ms = Number(timeout);
  if (!Number.isFinite(ms) || ms <= 0) return;
  hideTimer = setTimeout(() => {
    state.show = false;
    hideTimer = null;
  }, ms);
}

/**
 * Dispara el snackbar. Reinicia el timer si ya estaba visible.
 *
 * Firmas soportadas:
 *   toast("texto")
 *   toast("texto", { color: "info", timeout: 2000 })
 *   toast("texto", "info")                 // compat legacy
 *   toast("texto", "info", 2000)           // compat legacy (text, color, timeout)
 */
function toast(text, optionsOrColor, maybeTimeout) {
  let options = {};

  if (optionsOrColor && typeof optionsOrColor === "object") {
    options = optionsOrColor;
  } else if (typeof optionsOrColor === "string") {
    options.color = optionsOrColor;
    if (maybeTimeout !== undefined) {
      options.timeout = maybeTimeout;
    }
  }

  state.text = String(text ?? "");
  state.color = options.color !== undefined ? options.color : undefined;
  state.timeout =
    options.timeout !== undefined ? Number(options.timeout) : DEFAULT_TIMEOUT;
  state.location = options.location !== undefined ? options.location : undefined;
  state.variant = options.variant !== undefined ? options.variant : undefined;
  state.icon = options.icon !== undefined ? options.icon : undefined;

  state.show = true;
  scheduleAutoClose(state.timeout);
}

function close() {
  clearHideTimer();
  state.show = false;
}

export function useSnackbar() {
  return { state, toast, close };
}

export default useSnackbar;
