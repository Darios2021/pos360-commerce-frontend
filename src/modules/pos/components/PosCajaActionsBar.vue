<template>
  <div
    class="caja-card"
    :class="[
      isCajaOpen ? 'is-open' : 'is-closed',
      { 'is-idle-warning': showIdleWarning },
    ]"
    role="region"
    :aria-label="isCajaOpen ? 'Caja abierta' : 'Caja cerrada'"
  >
    <!-- Ícono grande de estado (app-tile style) -->
    <div class="caja-card__hero">
      <v-icon size="30" class="caja-card__hero-icon">
        mdi-cash-register
      </v-icon>
      <span class="caja-card__hero-dot" :title="isCajaOpen ? 'Activa' : 'Inactiva'" />
    </div>

    <!-- Info principal -->
    <div class="caja-card__body">
      <div class="caja-card__title-row">
        <span class="caja-card__title">
          {{ isCajaOpen ? "Caja abierta" : "Caja cerrada" }}
        </span>

        <span v-if="isCajaOpen && elapsedLabel" class="caja-card__elapsed">
          <v-icon size="12">mdi-clock-outline</v-icon>
          {{ elapsedLabel }}
        </span>
      </div>

      <div class="caja-card__meta">
        <span v-if="openedByLabel" class="caja-chip">
          <v-icon size="13">mdi-account-circle</v-icon>
          <span class="caja-chip__label">{{ openedByLabel }}</span>
        </span>

        <span v-if="openedAtLabel" class="caja-chip">
          <v-icon size="13">mdi-login-variant</v-icon>
          <span class="caja-chip__label">{{ openedAtLabel }}</span>
        </span>

        <span v-if="!isCajaOpen" class="caja-chip caja-chip--muted">
          <v-icon size="13">mdi-information-outline</v-icon>
          <span class="caja-chip__label">Abrí caja para operar</span>
        </span>
      </div>

      <!-- Alerta sutil de inactividad (cuando caja está abierta) -->
      <Transition name="caja-alert">
        <div v-if="showIdleWarning" class="caja-alert" role="alert">
          <v-icon size="15" class="caja-alert__icon">mdi-alert-outline</v-icon>
          <span class="caja-alert__text">
            Sin movimiento hace {{ idleMinutesLabel }} — ¿querés cerrar caja?
          </span>
          <button
            type="button"
            class="caja-alert__dismiss"
            @click="dismissIdle"
            aria-label="Descartar aviso"
          >
            <v-icon size="14">mdi-close</v-icon>
          </button>
        </div>
      </Transition>

      <!-- Aviso de otras cajas abiertas del mismo usuario -->
      <div v-if="otherOpenRegisters.length" class="caja-alert caja-alert--danger" role="alert">
        <v-icon size="15" class="caja-alert__icon">mdi-alert-decagram-outline</v-icon>
        <span class="caja-alert__text">
          Tenés {{ otherOpenRegisters.length }}
          {{ otherOpenRegisters.length === 1 ? "caja abierta" : "cajas abiertas" }}
          en
          <template v-for="(r, i) in otherOpenRegisters" :key="r.id">
            <strong>sucursal #{{ r.branch_id }} (caja #{{ r.id }})</strong>
            <template v-if="i < otherOpenRegisters.length - 1">, </template>
          </template>.
          Cerralas antes de cambiar de turno.
        </span>
      </div>
    </div>

    <!-- Acciones (app-tile style consistentes con TopBar) -->
    <div class="caja-card__actions">
      <button
        type="button"
        class="caja-tile caja-tile--neutral"
        :disabled="loadingGlobal"
        @click="$emit('refresh')"
      >
        <v-icon size="18" :class="{ 'mdi-spin': loadingGlobal }">
          mdi-refresh
        </v-icon>
        <v-tooltip activator="parent" location="bottom">Actualizar</v-tooltip>
      </button>

      <button
        v-if="!isCajaOpen"
        type="button"
        class="caja-tile caja-tile--open"
        @click="$emit('open-config')"
      >
        <v-icon size="20">mdi-play</v-icon>
        <v-tooltip activator="parent" location="bottom">Abrir caja</v-tooltip>
      </button>

      <button
        v-else
        type="button"
        class="caja-tile caja-tile--close"
        :class="{ 'is-attention': showIdleWarning }"
        @click="$emit('close-caja')"
      >
        <v-icon size="20">mdi-stop</v-icon>
        <v-tooltip activator="parent" location="bottom">
          Cerrar caja{{ showIdleWarning ? " (sin movimiento)" : "" }}
        </v-tooltip>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from "vue";
import { usePosPresenceDetector } from "../composables/usePosPresenceDetector";

const props = defineProps({
  isCajaOpen: Boolean,
  openedAt: [String, Date],
  openedBy: String,
  loadingGlobal: Boolean,
  // Minutos de inactividad antes de mostrar el aviso (default 10)
  idleMinutes: { type: Number, default: 10 },
  // Otras cajas abiertas del mismo usuario (zombies en otras sucursales)
  otherOpenRegisters: { type: Array, default: () => [] },
  currentCashRegisterId: { type: [Number, String], default: 0 },
});

defineEmits(["open-config", "close-caja", "refresh"]);

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const openedAtLabel = computed(() => formatDate(props.openedAt));
const openedByLabel = computed(() => props.openedBy || "");

// ── Duración de la caja abierta ──────────────────────────────
const elapsedMs = ref(0);
let elapsedTimer = null;

function recomputeElapsed() {
  if (!props.isCajaOpen || !props.openedAt) {
    elapsedMs.value = 0;
    return;
  }
  const t = new Date(props.openedAt).getTime();
  if (!Number.isFinite(t)) {
    elapsedMs.value = 0;
    return;
  }
  elapsedMs.value = Math.max(0, Date.now() - t);
}

const elapsedLabel = computed(() => {
  const ms = elapsedMs.value;
  if (!ms) return "";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m < 1) return "recién";
  return `${m} min`;
});

// ── Detector de inactividad ──────────────────────────────────
const enabled = computed(() => !!props.isCajaOpen);
const dismissedAt = ref(0);
const { isIdle, reset } = usePosPresenceDetector({
  enabled,
  idleMs: computed(() => Math.max(1, Number(props.idleMinutes) || 10) * 60 * 1000),
});

const showIdleWarning = computed(() => {
  if (!isIdle.value) return false;
  // Si lo descartó hace <2 min, no volverlo a mostrar aún
  if (dismissedAt.value && Date.now() - dismissedAt.value < 2 * 60 * 1000) {
    return false;
  }
  return true;
});

const idleMinutesLabel = computed(() => {
  const mins = Math.max(1, Math.round((Number(props.idleMinutes) || 10)));
  return mins === 1 ? "1 min" : `${mins} min`;
});

function dismissIdle() {
  dismissedAt.value = Date.now();
  reset();
}

// Resetear dismiss cuando la caja se cierra/abre o cambia el timer
watch(
  () => props.isCajaOpen,
  () => {
    dismissedAt.value = 0;
    reset();
    recomputeElapsed();
  }
);

onMounted(() => {
  recomputeElapsed();
  elapsedTimer = setInterval(recomputeElapsed, 30 * 1000); // cada 30s
});

onBeforeUnmount(() => {
  if (elapsedTimer) clearInterval(elapsedTimer);
});
</script>

<style scoped>
.caja-card {
  width: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.caja-card.is-open {
  border-color: rgba(var(--v-theme-success), 0.35);
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-success), 0.06) 0%,
    rgb(var(--v-theme-surface)) 60%
  );
}

.caja-card.is-closed {
  border-color: rgba(var(--v-theme-error), 0.28);
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-error), 0.05) 0%,
    rgb(var(--v-theme-surface)) 60%
  );
}

.caja-card.is-idle-warning {
  border-color: rgb(var(--v-theme-warning));
  box-shadow:
    0 0 0 1px rgba(var(--v-theme-warning), 0.36),
    0 4px 14px rgba(var(--v-theme-warning), 0.18);
  animation: cajaAttention 2.4s ease-in-out infinite;
}

@keyframes cajaAttention {
  0%, 100% {
    box-shadow:
      0 0 0 1px rgba(var(--v-theme-warning), 0.36),
      0 4px 14px rgba(var(--v-theme-warning), 0.18);
  }
  50% {
    box-shadow:
      0 0 0 1px rgba(var(--v-theme-warning), 0.6),
      0 6px 20px rgba(var(--v-theme-warning), 0.38);
  }
}

/* ─── Hero icon ───────────────────────────────────────── */
.caja-card__hero {
  position: relative;
  width: 50px;
  height: 50px;
  min-width: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
}

.caja-card.is-open .caja-card__hero {
  background: linear-gradient(
    180deg,
    rgba(var(--v-theme-success), 0.18) 0%,
    rgba(var(--v-theme-success), 0.08) 100%
  );
  border-color: rgba(var(--v-theme-success), 0.38);
  box-shadow: 0 3px 10px rgba(var(--v-theme-success), 0.2);
}

.caja-card.is-closed .caja-card__hero {
  background: linear-gradient(
    180deg,
    rgba(var(--v-theme-error), 0.12) 0%,
    rgba(var(--v-theme-error), 0.05) 100%
  );
  border-color: rgba(var(--v-theme-error), 0.32);
}

.caja-card__hero-icon {
  line-height: 1;
}

.caja-card.is-open .caja-card__hero-icon {
  color: rgb(var(--v-theme-success));
}

.caja-card.is-closed .caja-card__hero-icon {
  color: rgb(var(--v-theme-error));
}

.caja-card__hero-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  border: 2px solid rgb(var(--v-theme-surface));
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.caja-card.is-open .caja-card__hero-dot {
  background: rgb(var(--v-theme-success));
  animation: cajaPulseDot 2s ease-in-out infinite;
}

.caja-card.is-closed .caja-card__hero-dot {
  background: rgb(var(--v-theme-error));
}

@keyframes cajaPulseDot {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(var(--v-theme-success), 0);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(var(--v-theme-success), 0.28);
  }
}

/* ─── Body ────────────────────────────────────────────── */
.caja-card__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.caja-card__title-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.caja-card__title {
  font-weight: 900;
  font-size: 14.5px;
  letter-spacing: -0.005em;
  line-height: 1.1;
}

.caja-card.is-open .caja-card__title {
  color: rgb(var(--v-theme-success));
}

.caja-card.is-closed .caja-card__title {
  color: rgb(var(--v-theme-error));
}

.caja-card__elapsed {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(var(--v-theme-success), 0.14);
  color: rgb(var(--v-theme-success));
  font-size: 10.5px;
  font-weight: 700;
  line-height: 1.4;
}

.caja-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.caja-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 7px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgb(var(--v-theme-on-surface));
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.4;
  max-width: 100%;
}

.caja-chip :deep(.v-icon) {
  opacity: 0.72;
  flex-shrink: 0;
}

.caja-chip__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.caja-chip--muted {
  background: rgba(var(--v-theme-warning), 0.1);
  color: rgba(var(--v-theme-warning), 0.92);
}

.caja-chip--muted :deep(.v-icon) {
  color: rgb(var(--v-theme-warning));
  opacity: 0.92;
}

/* ─── Alerta de inactividad ──────────────────────────── */
.caja-alert {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding: 5px 8px;
  border-radius: 8px;
  background: rgba(var(--v-theme-warning), 0.14);
  color: rgb(var(--v-theme-warning));
  border: 1px solid rgba(var(--v-theme-warning), 0.32);
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.2;
}

.caja-alert--danger {
  background: rgba(var(--v-theme-error), 0.12);
  color: rgb(var(--v-theme-error));
  border-color: rgba(var(--v-theme-error), 0.32);
}

.caja-alert--danger .caja-alert__text strong {
  font-weight: 800;
}

.caja-alert__icon {
  flex-shrink: 0;
}

.caja-alert__text {
  flex: 1 1 auto;
  min-width: 0;
}

.caja-alert__dismiss {
  all: unset;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  opacity: 0.72;
  display: inline-flex;
  transition: background 0.14s ease, opacity 0.14s ease;
}

.caja-alert__dismiss:hover {
  opacity: 1;
  background: rgba(var(--v-theme-warning), 0.2);
}

.caja-alert-enter-active,
.caja-alert-leave-active {
  transition:
    opacity 0.18s ease,
    max-height 0.22s ease,
    transform 0.18s ease;
  overflow: hidden;
}

.caja-alert-enter-from,
.caja-alert-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-4px);
}

.caja-alert-enter-to,
.caja-alert-leave-from {
  opacity: 1;
  max-height: 44px;
  transform: translateY(0);
}

/* ─── Acciones (tile consistente con TopBar) ─────────── */
.caja-card__actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.caja-tile {
  all: unset;
  box-sizing: border-box;
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  transition:
    background 0.14s ease,
    border-color 0.14s ease,
    transform 0.08s ease,
    box-shadow 0.14s ease;
}

.caja-tile:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
  border-color: rgba(var(--v-theme-on-surface), 0.18);
}

.caja-tile:active {
  transform: scale(0.96);
}

.caja-tile:focus-visible {
  outline: none;
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.28);
}

.caja-tile[disabled] {
  opacity: 0.4;
  cursor: not-allowed;
}

.caja-tile--neutral :deep(.v-icon) {
  color: rgba(var(--v-theme-on-surface), 0.78);
}

.caja-tile--open {
  background: rgba(var(--v-theme-success), 0.14);
  border-color: rgba(var(--v-theme-success), 0.32);
}

.caja-tile--open :deep(.v-icon) {
  color: rgb(var(--v-theme-success));
}

.caja-tile--open:hover {
  background: rgba(var(--v-theme-success), 0.22);
  border-color: rgba(var(--v-theme-success), 0.5);
}

.caja-tile--close {
  background: rgba(var(--v-theme-error), 0.12);
  border-color: rgba(var(--v-theme-error), 0.28);
}

.caja-tile--close :deep(.v-icon) {
  color: rgb(var(--v-theme-error));
}

.caja-tile--close:hover {
  background: rgba(var(--v-theme-error), 0.2);
  border-color: rgba(var(--v-theme-error), 0.44);
}

/* Cuando hay alerta, el botón de cerrar caja pulsa para llamar la atención */
.caja-tile--close.is-attention {
  background: rgb(var(--v-theme-warning));
  border-color: rgb(var(--v-theme-warning));
  animation: cajaCloseAttention 1.5s ease-in-out infinite;
}

.caja-tile--close.is-attention :deep(.v-icon) {
  color: rgb(var(--v-theme-on-warning, #000));
}

@keyframes cajaCloseAttention {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(var(--v-theme-warning), 0);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(var(--v-theme-warning), 0.4);
  }
}

/* ─── Dark mode ─────────────────────────────────────── */
:global(.v-theme--dark) .caja-card {
  border-color: rgba(255, 255, 255, 0.08);
}

:global(.v-theme--dark) .caja-card__hero {
  border-color: rgba(255, 255, 255, 0.1);
}

:global(.v-theme--dark) .caja-tile {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
}

:global(.v-theme--dark) .caja-tile:hover {
  background: rgba(255, 255, 255, 0.08);
}

:global(.v-theme--dark) .caja-chip {
  background: rgba(255, 255, 255, 0.06);
}

/* ─── Responsive ────────────────────────────────────── */
@media (max-width: 900px) {
  .caja-card {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 10px;
  }

  .caja-card__actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
    padding-top: 4px;
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
    margin-top: 2px;
  }

  .caja-card__meta {
    gap: 5px;
  }

  .caja-chip {
    font-size: 11px;
  }
}

.mdi-spin {
  animation: cajaSpin 1s linear infinite;
}

@keyframes cajaSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
