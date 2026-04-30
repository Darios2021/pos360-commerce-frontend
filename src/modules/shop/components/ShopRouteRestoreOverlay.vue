<!--
  ShopRouteRestoreOverlay
  Loader OPACO con kill-switch automático.
  - Oculta el contenido durante el restore de scroll
  - Solo barra de progreso fina arriba (sin texto, sin spinner)
  - Auto-cierre por timeout de seguridad: NUNCA queda visible más de 4s
  - Auto-cierre cuando cambia la ruta (escucha popstate / pushstate)
-->

<template>
  <transition name="srl-fade">
    <div v-if="visible" class="srl-mask" aria-hidden="true">
      <div class="srl-progress">
        <span class="srl-progress-bar"></span>
      </div>
      <div class="srl-spinner-wrap">
        <span class="srl-spinner" />
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** Tiempo máximo (ms) que el overlay puede estar visible antes de auto-cerrarse. */
  maxVisibleMs: { type: Number, default: 5000 },
  /** Tiempo MÍNIMO (ms) que el overlay debe quedar visible una vez mostrado.
   *  Evita que aparezca-desaparezca tan rápido que el spinner no se llegue a ver. */
  minVisibleMs: { type: Number, default: 280 },
});
const emit = defineEmits(["update:modelValue"]);

const internal = ref(false);
// Flag de "muerto": cuando el kill-switch dispara, sobreescribe a modelValue
// hasta que el padre baje el prop. Evita que la pantalla quede en blanco
// si el padre se olvidó de bajar modelValue.
const killed = ref(false);
const visible = computed(() => !killed.value && (props.modelValue || internal.value));

let killTimer = null;
let pendingHideTimer = null;
let shownAt = 0;

function showOverlay() {
  internal.value = true;
  killed.value = false;
  shownAt = Date.now();
  clearPendingHide();
  // Kill-switch: si por alguna razón no se cierra solo en maxVisibleMs,
  // forzamos cierre para evitar que la pantalla quede en blanco.
  clearKillTimer();
  killTimer = setTimeout(() => {
    forceHide();
  }, Math.max(500, props.maxVisibleMs));
}

/** Cierre "amable": respeta el tiempo mínimo de visualización. */
function gracefulHide() {
  const elapsed = Date.now() - shownAt;
  const remaining = Math.max(0, props.minVisibleMs - elapsed);
  clearPendingHide();
  if (remaining <= 0) {
    forceHide();
    return;
  }
  pendingHideTimer = setTimeout(forceHide, remaining);
}

function forceHide() {
  internal.value = false;
  killed.value = true;
  emit("update:modelValue", false);
  clearKillTimer();
  clearPendingHide();
}

function clearKillTimer() {
  if (killTimer) {
    clearTimeout(killTimer);
    killTimer = null;
  }
}

function clearPendingHide() {
  if (pendingHideTimer) {
    clearTimeout(pendingHideTimer);
    pendingHideTimer = null;
  }
}

function onScrollRestoring() {
  showOverlay();
}

function onScrollRestored() {
  // Cierre amable: respeta minVisibleMs para que se vea el spinner.
  gracefulHide();
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      // Nueva navegación: reset killed para permitir mostrar de nuevo.
      killed.value = false;
      showOverlay();
    } else {
      // Cuando el padre baja modelValue, hacemos cierre amable
      // para respetar minVisibleMs y que el spinner se llegue a ver.
      gracefulHide();
    }
  }
);

onMounted(() => {
  if (props.modelValue) showOverlay();
  window.addEventListener("shop:scroll-restoring", onScrollRestoring);
  window.addEventListener("shop:scroll-restored", onScrollRestored);

  // Si el browser dispara navegación nativa (back/forward sin pasar por
  // scrollBehavior), también cerramos el overlay después de un breve delay.
  window.addEventListener("popstate", () => setTimeout(forceHide, 1500));
});

onBeforeUnmount(() => {
  clearKillTimer();
  clearPendingHide();
  window.removeEventListener("shop:scroll-restoring", onScrollRestoring);
  window.removeEventListener("shop:scroll-restored", onScrollRestored);
});
</script>

<style scoped>
/* Color de marca: usa la variable del theme runtime, con fallback sólido. */
.srl-mask {
  position: fixed;
  inset: 0;
  z-index: 4000;
  background: #ffffff;
  pointer-events: all;

  /* Color sólido azul institucional como base — siempre disponible.
     Si el layout del shop expone --v-theme-primary, se sobreescribe
     desde un bloque global más abajo. */
  --srl-brand: #1565c0;
}

/* ── Barra de progreso superior (NProgress style) ── */
.srl-progress {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: rgba(21, 101, 192, 0.06);
  overflow: hidden;
}

.srl-progress-bar {
  display: block;
  width: 30%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--srl-brand) 50%,
    transparent 100%
  );
  border-radius: 0 999px 999px 0;
  animation: srl-progress-slide 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  box-shadow: 0 0 8px var(--srl-brand);
}

@keyframes srl-progress-slide {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(450%); }
}

/* ── Spinner circular grande, centrado ── */
.srl-spinner-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.srl-spinner {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 6px solid rgba(21, 101, 192, 0.15);
  border-top-color: var(--srl-brand);
  border-right-color: var(--srl-brand);
  animation: srl-spin 0.8s linear infinite;
  box-shadow: 0 6px 28px rgba(21, 101, 192, 0.22);
}

@keyframes srl-spin {
  to { transform: rotate(360deg); }
}

/* ── Transición suave ── */
.srl-fade-enter-active,
.srl-fade-leave-active {
  transition: opacity 0.28s ease;
}
.srl-fade-enter-from,
.srl-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .srl-progress-bar {
    animation: none;
    width: 100%;
    background: var(--srl-brand);
    opacity: 0.6;
  }
  .srl-spinner {
    animation: none;
    border-color: var(--srl-brand);
  }
}

@media (max-width: 600px) {
  .srl-progress {
    height: 2.5px;
  }
  .srl-spinner {
    width: 56px;
    height: 56px;
    border-width: 5px;
  }
}
</style>

<!-- Bloque NO-scoped: permite que el color de marca del shop pise el azul
     base si el theme runtime ya cargó la variable --v-theme-primary.
     !important para garantizar que pise al scoped style. -->
<style>
.scope-shop .srl-mask {
  --srl-brand: rgb(var(--v-theme-primary)) !important;
}
</style>
