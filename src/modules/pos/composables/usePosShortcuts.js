// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/pos/composables/usePosShortcuts.js
//
// Atajos POS centralizados (sin acoplar a la UI).
// - No captura teclas mientras escribís (salvo F-keys).
// - Bloquea atajos cuando hay dialogs abiertos (excepto F1).

import { onMounted, onBeforeUnmount } from "vue";

function isTypingTarget(evt) {
  const t = evt?.target;
  if (!t) return false;
  const tag = String(t.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (t.isContentEditable) return true;
  return false;
}

export function usePosShortcuts(handlers) {
  const {
    canUseShortcuts, // () => boolean  (ej: true si no hay dialogs o si querés permitir)
    isDialogOpen, // () => boolean
    onHelpToggle, // () => void
    onFocusSearch, // () => void
    onClearSearch, // () => void
    onRefresh, // () => void
    onNextPage, // () => void
    onPrevPage, // () => void
    onOpenCheckout, // () => void
    onCartClear, // () => void
    onCartIncLast, // () => void
    onCartDecLast, // () => void
    onFocusCustomerFirst, // () => void
    onFocusCustomerLast, // () => void
    onFocusCustomerWa, // () => void
    onFocusCustomerEmail, // () => void
  } = handlers || {};

  function onKeydown(e) {
    if (e.defaultPrevented) return;
    if (typeof canUseShortcuts === "function" && !canUseShortcuts()) return;

    const key = String(e.key || "");
    const code = String(e.code || "");
    const ctrl = !!e.ctrlKey || !!e.metaKey;
    const alt = !!e.altKey;

    const typing = isTypingTarget(e);
    const isFn =
      key === "F1" || key === "F2" || key === "F3" || key === "F5" || key === "F8" ||
      code === "F1" || code === "F2" || code === "F3" || code === "F5" || code === "F8";

    if (typing && !isFn) return;

    // HELP (siempre)
    if (key === "F1" || code === "F1") {
      e.preventDefault();
      onHelpToggle?.();
      return;
    }

    // si hay dialog abierto: no hacemos nada más
    if (typeof isDialogOpen === "function" && isDialogOpen()) return;

    // FOCUS SEARCH
    if (key === "F2" || code === "F2") {
      e.preventDefault();
      onFocusSearch?.();
      return;
    }

    // CLEAR SEARCH
    if (key === "F3" || code === "F3") {
      e.preventDefault();
      onClearSearch?.();
      onFocusSearch?.();
      return;
    }

    // REFRESH
    if (key === "F5" || code === "F5") {
      e.preventDefault();
      onRefresh?.();
      return;
    }

    // PAGINATION
    if (key === "PageDown" || code === "PageDown" || (ctrl && (key === "ArrowRight" || code === "ArrowRight"))) {
      e.preventDefault();
      onNextPage?.();
      return;
    }
    if (key === "PageUp" || code === "PageUp" || (ctrl && (key === "ArrowLeft" || code === "ArrowLeft"))) {
      e.preventDefault();
      onPrevPage?.();
      return;
    }

    // CHECKOUT
    if (key === "F8" || code === "F8") {
      e.preventDefault();
      onOpenCheckout?.();
      return;
    }

    // CART CLEAR
    if (ctrl && (key === "Delete" || key === "Del" || code === "Delete")) {
      e.preventDefault();
      onCartClear?.();
      return;
    }

    // CART +/- last item
    if (key === "+" || key === "=") {
      e.preventDefault();
      onCartIncLast?.();
      return;
    }
    if (key === "-" || key === "_") {
      e.preventDefault();
      onCartDecLast?.();
      return;
    }

    // CUSTOMER QUICK FOCUS
    if (alt && key.toLowerCase() === "n") {
      e.preventDefault();
      onFocusCustomerFirst?.();
      return;
    }
    if (alt && key.toLowerCase() === "a") {
      e.preventDefault();
      onFocusCustomerLast?.();
      return;
    }
    if (alt && key.toLowerCase() === "w") {
      e.preventDefault();
      onFocusCustomerWa?.();
      return;
    }
    if (alt && key.toLowerCase() === "e") {
      e.preventDefault();
      onFocusCustomerEmail?.();
      return;
    }
  }

  onMounted(() => window.addEventListener("keydown", onKeydown, { passive: false }));
  onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
}