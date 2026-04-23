// src/modules/pos/composables/usePosPresenceDetector.js
//
// Detector de inactividad del cajero. Escucha eventos de actividad del
// usuario (mouse, teclado, touch, scroll) y activa `isIdle` cuando no
// hubo movimiento por `idleMs` milisegundos.
//
// Uso típico: recordar cerrar caja si la dejó abierta sin movimiento.

import { ref, onMounted, onBeforeUnmount, watch, unref } from "vue";

export function usePosPresenceDetector({
  enabled = ref(true),
  idleMs = 10 * 60 * 1000, // 10 minutos
  onIdle = null,
  onActive = null,
} = {}) {
  const isIdle = ref(false);
  const lastActivityAt = ref(Date.now());
  let timer = null;

  const eventTypes = [
    "mousemove",
    "mousedown",
    "keydown",
    "touchstart",
    "scroll",
    "wheel",
  ];

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function resolveIdleMs() {
    const raw = Number(unref(idleMs));
    return Number.isFinite(raw) && raw > 0 ? raw : 10 * 60 * 1000;
  }

  function scheduleIdleCheck() {
    clearTimer();
    if (!unref(enabled)) return;

    const ms = resolveIdleMs();
    timer = setTimeout(() => {
      if (!unref(enabled) || isIdle.value) return;
      isIdle.value = true;
      try {
        onIdle?.();
      } catch (_e) {
        /* noop */
      }
    }, ms);
  }

  function bumpActivity() {
    lastActivityAt.value = Date.now();

    if (isIdle.value) {
      isIdle.value = false;
      try {
        onActive?.();
      } catch (_e) {
        /* noop */
      }
    }

    if (unref(enabled)) scheduleIdleCheck();
  }

  function attach() {
    for (const ev of eventTypes) {
      window.addEventListener(ev, bumpActivity, { passive: true });
    }
    scheduleIdleCheck();
  }

  function detach() {
    for (const ev of eventTypes) {
      window.removeEventListener(ev, bumpActivity);
    }
    clearTimer();
  }

  onMounted(() => {
    if (unref(enabled)) attach();
  });

  onBeforeUnmount(() => {
    detach();
  });

  watch(
    () => unref(enabled),
    (en) => {
      if (en) {
        attach();
      } else {
        detach();
        isIdle.value = false;
      }
    }
  );

  function reset() {
    bumpActivity();
  }

  return {
    isIdle,
    lastActivityAt,
    reset,
  };
}
