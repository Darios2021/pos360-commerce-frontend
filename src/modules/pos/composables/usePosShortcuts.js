// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/pos/composables/usePosShortcuts.js
//
// FIX:
// - Ataja F1/F2/F8/PgUp/PgDn con capture para que NO lo coma el navegador
// - preventDefault/stopPropagation solo en las teclas que usamos
// - Permite deshabilitar por flag (enabled)
// - Evita disparos repetidos (e.repeat)
// - No rompe cuando estás escribiendo en inputs (pero F-keys igual funcionan)

import { onBeforeUnmount, onMounted } from "vue";

function isEditableTarget(el) {
  if (!el) return false;
  const tag = String(el.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el.isContentEditable) return true;
  return false;
}

function keyIs(e, k) {
  const kk = String(e.key || "").toLowerCase();
  const cc = String(e.code || "").toLowerCase();
  return kk === String(k).toLowerCase() || cc === String(k).toLowerCase();
}

/**
 * usePosShortcuts({
 *   enabled: () => true,
 *   onHelp: () => {},
 *   onFocusSearch: () => {},
 *   onCharge: () => {},
 *   onPrevPage: () => {},
 *   onNextPage: () => {},
 *   onEscape: () => {}, // opcional
 * })
 */
export function usePosShortcuts(opts = {}) {
  const enabledFn = typeof opts.enabled === "function" ? opts.enabled : () => opts.enabled !== false;

  const onHelp = typeof opts.onHelp === "function" ? opts.onHelp : null;
  const onFocusSearch = typeof opts.onFocusSearch === "function" ? opts.onFocusSearch : null;
  const onCharge = typeof opts.onCharge === "function" ? opts.onCharge : null;
  const onPrevPage = typeof opts.onPrevPage === "function" ? opts.onPrevPage : null;
  const onNextPage = typeof opts.onNextPage === "function" ? opts.onNextPage : null;
  const onEscape = typeof opts.onEscape === "function" ? opts.onEscape : null;

  function handler(e) {
    try {
      if (!enabledFn()) return;
      if (!e) return;
      if (e.repeat) return; // evita mantener apretado

      // Si hay modal del navegador / OS, no jodemos
      // (igual esto es best-effort)
      const target = e.target;

      // ====== F1 AYUDA ======
      if (keyIs(e, "F1")) {
        e.preventDefault();
        e.stopPropagation();
        onHelp && onHelp();
        return;
      }

      // ====== F2 BUSCAR ======
      // Aunque estés en un input, lo dejamos funcionar (así el cajero puede saltar al buscador siempre)
      if (keyIs(e, "F2")) {
        e.preventDefault();
        e.stopPropagation();
        onFocusSearch && onFocusSearch();
        return;
      }

      // ====== F8 COBRAR ======
      if (keyIs(e, "F8")) {
        e.preventDefault();
        e.stopPropagation();
        onCharge && onCharge();
        return;
      }

      // ====== PAGINADO ======
      // Si estás tipeando en un input, PgUp/PgDn lo dejamos en paz (evita comportamiento raro en campos)
      const editable = isEditableTarget(target);

      if (!editable && (keyIs(e, "PageUp") || keyIs(e, "pgup"))) {
        e.preventDefault();
        e.stopPropagation();
        onPrevPage && onPrevPage();
        return;
      }

      if (!editable && (keyIs(e, "PageDown") || keyIs(e, "pgdn"))) {
        e.preventDefault();
        e.stopPropagation();
        onNextPage && onNextPage();
        return;
      }

      // ====== ESC ======
      if (keyIs(e, "Escape") || keyIs(e, "Esc")) {
        // No frenamos Esc global salvo que el caller quiera
        onEscape && onEscape();
        return;
      }

      // BONUS: Ctrl+K / Cmd+K => buscar (muy cómodo)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && keyIs(e, "k")) {
        e.preventDefault();
        e.stopPropagation();
        onFocusSearch && onFocusSearch();
      }
    } catch {
      // noop
    }
  }

  onMounted(() => {
    // CAPTURE: clave para ganarle al browser (sobre todo F1)
    window.addEventListener("keydown", handler, { capture: true });
  });

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", handler, { capture: true });
  });

  return {
    // por si querés invocar manualmente desde UI
    triggerHelp: () => onHelp && onHelp(),
    triggerFocusSearch: () => onFocusSearch && onFocusSearch(),
    triggerCharge: () => onCharge && onCharge(),
    triggerPrevPage: () => onPrevPage && onPrevPage(),
    triggerNextPage: () => onNextPage && onNextPage(),
  };
}