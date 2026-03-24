// src/modules/pos/composables/usePosHotkeys.js
import { onMounted, onBeforeUnmount } from "vue";

export function usePosHotkeys({
  filtersRef,
  helpOpen,
  openCheckoutSafe,
  prevPage,
  nextPage,
}) {
  function onKeydown(e) {
    if (!e || e.repeat) return;

    const key = String(e.key || "").toLowerCase();

    if (key === "f1") {
      e.preventDefault();
      helpOpen.value = true;
      return;
    }

    if (key === "f2" || (e.ctrlKey && key === "k")) {
      e.preventDefault();
      filtersRef.value?.focusSearch?.();
      return;
    }

    if (key === "f8") {
      e.preventDefault();
      openCheckoutSafe?.();
      return;
    }

    if (key === "pageup") {
      e.preventDefault();
      prevPage?.();
      return;
    }

    if (key === "pagedown") {
      e.preventDefault();
      nextPage?.();
    }
  }

  onMounted(() => {
    window.addEventListener("keydown", onKeydown, { capture: true });
  });

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", onKeydown, { capture: true });
  });

  return {
    onKeydown,
  };
}