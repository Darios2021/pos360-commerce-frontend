<template>
  <div class="pssb">
    <div class="pssb-toolbar">
      <div class="pssb-scanner-wrap">
        <button
          type="button"
          class="pssb-scanner-toggle"
          :class="[scannerToneClass, { 'is-on': isOn }]"
          :disabled="disabledAll"
          :title="scannerTooltip"
          @click="$emit('toggle')"
        >
          <span class="pssb-scanner-led" aria-hidden="true"></span>

          <span class="pssb-scanner-main-icon" aria-hidden="true">
            <svg
              viewBox="0 0 64 64"
              class="pssb-gun-svg"
              :class="{ 'is-reading': visualStateNormalized === 'reading' && isOn }"
            >
              <path
                d="M20 18 L42 18 Q47 18 50 21 Q53 24 53 28 L53 31 L40 31 L31 38 L24 38 Q20 38 18 36 Q16 34 16 30 L16 22 Q16 18 20 18 Z"
                fill="currentColor"
                opacity="0.96"
              />
              <path
                d="M24 38 L35 38 L39 57 Q40 61 36 61 L29 61 Q26 61 25 58 L21 43 Q20 39 24 38 Z"
                fill="currentColor"
                opacity="0.96"
              />
              <rect x="45" y="25" width="9" height="3.6" rx="1.4" fill="currentColor" opacity="0.98" />
              <path
                d="M12 22 L20 18"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                opacity="0.85"
              />
              <path
                d="M49.5 18 C54 16.4 57 13.4 59 10.5"
                stroke="currentColor"
                stroke-width="2.6"
                stroke-linecap="round"
                fill="none"
                class="pssb-beam beam-1"
              />
              <path
                d="M50.5 23.5 C56 22.5 60 20.5 62 18"
                stroke="currentColor"
                stroke-width="2.6"
                stroke-linecap="round"
                fill="none"
                class="pssb-beam beam-2"
              />
            </svg>
          </span>

          <span class="pssb-scanner-mini-state" aria-hidden="true">
            <v-icon size="14">
              {{ isOn ? "mdi-pause" : "mdi-power" }}
            </v-icon>
          </span>
        </button>

        <v-btn
          v-if="showTestButton"
          icon
          size="x-small"
          density="comfortable"
          variant="text"
          class="pssb-test-btn"
          :disabled="disabledAll"
          title="Probar scanner"
          @click="$emit('test')"
        >
          <v-icon size="18">mdi-crosshairs-gps</v-icon>
        </v-btn>
      </div>

      <div class="pssb-search-wrap">
        <v-text-field
          ref="searchRef"
          v-model="qLocal"
          label="Buscar"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          hide-details
          clearable
          :disabled="disabledAll"
          placeholder="Producto, SKU o código"
          class="pssb-field pssb-search"
          @keyup.enter="$emit('enter')"
          @keyup.esc="onEsc"
          @click:clear="onClear"
          @update:model-value="onTyping"
        />
      </div>

      <div class="pssb-selects">
        <v-select
          v-model="rubroLocal"
          :items="rubroItems"
          item-title="title"
          item-value="value"
          label="Rubro"
          variant="outlined"
          density="comfortable"
          hide-details
          clearable
          :disabled="disabledAll"
          class="pssb-field"
          @update:model-value="onRubroChangeLocal"
        />

        <v-select
          v-model="subrubroLocal"
          :items="subrubroItems"
          item-title="title"
          item-value="value"
          label="Subrubro"
          variant="outlined"
          density="comfortable"
          hide-details
          clearable
          class="pssb-field"
          :disabled="disabledAll || !rubroLocal || (subrubroItems?.length || 0) === 0"
          :no-data-text="subrubroNoDataText"
        />
      </div>

      <div class="pssb-pagination">
        <v-btn
          icon
          size="small"
          density="comfortable"
          variant="text"
          class="pssb-page-btn"
          :disabled="disabledAll || page <= 1"
          @click="$emit('prev')"
        >
          <v-icon size="18">mdi-chevron-left</v-icon>
        </v-btn>

        <div class="pssb-page-text">{{ safePage }}/{{ safePages }}</div>

        <v-btn
          icon
          size="small"
          density="comfortable"
          variant="text"
          class="pssb-page-btn"
          :disabled="disabledAll || page >= pages"
          @click="$emit('next')"
        >
          <v-icon size="18">mdi-chevron-right</v-icon>
        </v-btn>
      </div>
    </div>

    <div class="pssb-footer">
      <div class="pssb-stats">
        <span class="pssb-stats-main">{{ showingText }}</span>
        <span class="pssb-dot">·</span>
        <span class="pssb-stats-soft">Stock: <b>{{ stockOnlyTotal }}</b></span>
      </div>

      <div v-if="error" class="pssb-error">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  visualState: { type: String, default: "off" },
  stateLabel: { type: String, default: "" },
  lastScan: { type: String, default: "" },
  lastMessage: { type: String, default: "" },
  isOn: { type: Boolean, default: false },

  soundEnabled: { type: Boolean, default: true },
  vibrationEnabled: { type: Boolean, default: true },
  successFrequency: { type: Number, default: 880 },
  errorFrequency: { type: Number, default: 220 },
  noMatchFrequency: { type: Number, default: 280 },
  multipleFrequency: { type: Number, default: 520 },
  showTestButton: { type: Boolean, default: false },

  q: { type: String, default: "" },
  rubroId: { type: [Number, String, null], default: null },
  subrubroId: { type: [Number, String, null], default: null },
  rubroItems: { type: Array, default: () => [] },
  subrubroItems: { type: Array, default: () => [] },
  subrubroNoDataText: { type: String, default: "Elegí un rubro primero" },

  page: { type: Number, default: 1 },
  pages: { type: Number, default: 1 },
  shownCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },
  stockOnlyTotal: { type: Number, default: 0 },

  error: { type: [String, null], default: null },
  disabledAll: { type: Boolean, default: false },
});

const emit = defineEmits([
  "toggle",
  "test",
  "update:q",
  "update:rubro-id",
  "update:subrubro-id",
  "typing",
  "enter",
  "clear",
  "rubro-change",
  "prev",
  "next",
]);

const searchRef = ref(null);

const qLocal = ref(props.q || "");
const rubroLocal = ref(props.rubroId ?? null);
const subrubroLocal = ref(props.subrubroId ?? null);

watch(
  () => props.q,
  (v) => {
    const nv = String(v ?? "");
    if (nv !== String(qLocal.value ?? "")) qLocal.value = nv;
  }
);

watch(
  () => props.rubroId,
  (v) => {
    const nv = v ?? null;
    if (nv !== rubroLocal.value) rubroLocal.value = nv;
  }
);

watch(
  () => props.subrubroId,
  (v) => {
    const nv = v ?? null;
    if (nv !== subrubroLocal.value) subrubroLocal.value = nv;
  }
);

watch(qLocal, (v) => emit("update:q", String(v ?? "")));
watch(rubroLocal, (v) => emit("update:rubro-id", v ?? null));
watch(subrubroLocal, (v) => emit("update:subrubro-id", v ?? null));

function onTyping() {
  emit("typing");
}

function onClear() {
  qLocal.value = "";
  emit("clear");
}

function onEsc() {
  if (props.disabledAll) return;
  if (!String(qLocal.value || "").trim()) return;
  onClear();
}

function onRubroChangeLocal() {
  subrubroLocal.value = null;
  emit("rubro-change");
}

const safePage = computed(() => Math.max(1, Number(props.page || 1)));
const safePages = computed(() => Math.max(1, Number(props.pages || 1)));

const showingText = computed(() => {
  const shown = Math.max(0, Number(props.shownCount || 0));
  const total = Math.max(0, Number(props.totalCount || 0));
  return `${shown} de ${total}`;
});

const visualStateNormalized = computed(() => {
  const v = String(props.visualState || "off").trim().toLowerCase();
  return v || "off";
});

const scannerToneClass = computed(() => {
  if (!props.isOn) return "tone-off";
  if (visualStateNormalized.value === "error" || visualStateNormalized.value === "no_match") {
    return "tone-error";
  }
  if (visualStateNormalized.value === "multiple") return "tone-warning";
  return "tone-success";
});

const scannerTooltip = computed(() => {
  if (!props.isOn) return "Lectora pausada";

  switch (visualStateNormalized.value) {
    case "reading":
      return "Lectora leyendo";
    case "success":
      return "Lectora activa";
    case "error":
      return "Lectora con error";
    case "no_match":
      return "Sin coincidencias";
    case "multiple":
      return "Múltiples coincidencias";
    default:
      return "Lectora activa";
  }
});

function canUseAudio() {
  return typeof window !== "undefined" && !!(window.AudioContext || window.webkitAudioContext);
}

function beep({ frequency = 880, duration = 0.08, type = "sine", volume = 0.03 } = {}) {
  if (!props.soundEnabled) return;
  if (!canUseAudio()) return;

  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = Number(frequency) || 880;
    gainNode.gain.value = Number(volume) || 0.03;

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start();

    gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + Number(duration || 0.08)
    );

    oscillator.stop(ctx.currentTime + Number(duration || 0.08) + 0.01);

    setTimeout(() => {
      try {
        ctx.close();
      } catch {}
    }, Math.max(120, Math.round((Number(duration || 0.08) + 0.08) * 1000)));
  } catch {}
}

function beepSuccess() {
  beep({ frequency: props.successFrequency, duration: 0.06, type: "sine", volume: 0.035 });
}

function beepError() {
  beep({ frequency: props.errorFrequency, duration: 0.11, type: "square", volume: 0.04 });
}

function beepNoMatch() {
  beep({ frequency: props.noMatchFrequency, duration: 0.09, type: "triangle", volume: 0.032 });
}

function beepMultiple() {
  beep({ frequency: props.multipleFrequency, duration: 0.05, type: "sine", volume: 0.03 });
}

function vibrate(pattern) {
  if (!props.vibrationEnabled) return;
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;

  try {
    navigator.vibrate(pattern);
  } catch {}
}

watch(
  () => visualStateNormalized.value,
  (next, prev) => {
    if (!next || next === prev || !props.isOn) return;

    if (next === "success") {
      beepSuccess();
      vibrate([40, 30, 60]);
      return;
    }

    if (next === "error") {
      beepError();
      vibrate([130]);
      return;
    }

    if (next === "no_match") {
      beepNoMatch();
      vibrate([70, 40, 70]);
      return;
    }

    if (next === "multiple") {
      beepMultiple();
      vibrate([50, 30, 50]);
    }
  }
);

function focusSearch() {
  searchRef.value?.focus?.();
}

defineExpose({ focusSearch });
</script>

<style scoped>
.pssb {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 8px;
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
}

/* =========================
   TOOLBAR
========================= */
.pssb-toolbar {
  display: grid;
  grid-template-columns: auto minmax(240px, 1fr) 290px auto;
  gap: 10px;
  align-items: center;
}

.pssb-scanner-wrap {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* =========================
   BOTON LECTORA
========================= */
.pssb-scanner-toggle {
  position: relative;
  height: 40px;
  min-width: 98px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 10px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-on-surface), 0.03);
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease,
    background-color 0.16s ease,
    color 0.16s ease;
  box-shadow: none;
  overflow: hidden;
}

.pssb-scanner-toggle:hover:not(:disabled) {
  transform: translateY(-1px);
}

.pssb-scanner-toggle:disabled {
  opacity: 0.56;
  cursor: not-allowed;
}

/* ESTADOS */
.pssb-scanner-toggle.tone-success {
  border-color: rgba(var(--v-theme-success), 0.28);
  background: rgba(var(--v-theme-success), 0.08);
  color: rgb(var(--v-theme-success));
}

.pssb-scanner-toggle.tone-off {
  border-color: rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-on-surface), 0.035);
  color: rgba(var(--v-theme-on-surface), 0.82);
}

.pssb-scanner-toggle.tone-error {
  border-color: rgba(var(--v-theme-error), 0.24);
  background: rgba(var(--v-theme-error), 0.08);
  color: rgb(var(--v-theme-error));
}

.pssb-scanner-toggle.tone-warning {
  border-color: rgba(var(--v-theme-warning), 0.28);
  background: rgba(var(--v-theme-warning), 0.1);
  color: rgb(var(--v-theme-warning));
}

.pssb-scanner-led {
  width: 8px;
  height: 8px;
  min-width: 8px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.95;
}

.pssb-scanner-main-icon,
.pssb-scanner-mini-state {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pssb-gun-svg {
  width: 18px;
  height: 18px;
  display: block;
}

.pssb-beam {
  opacity: 0.72;
}

.pssb-gun-svg:not(.is-reading) .pssb-beam {
  opacity: 0.14;
}

.pssb-gun-svg.is-reading .beam-1 {
  animation: pssbBeamPulse 0.9s infinite ease-in-out;
}

.pssb-gun-svg.is-reading .beam-2 {
  animation: pssbBeamPulse 0.9s infinite ease-in-out 0.12s;
}

.pssb-scanner-mini-state {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

@keyframes pssbBeamPulse {
  0%, 100% {
    opacity: 0.18;
  }
  50% {
    opacity: 0.95;
  }
}

.pssb-test-btn {
  opacity: 0.86;
}

/* =========================
   CAMPOS
========================= */
.pssb-search-wrap,
.pssb-selects {
  min-width: 0;
}

.pssb-selects {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.pssb-field :deep(.v-field) {
  border-radius: 14px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  box-shadow: none !important;
}

.pssb-field :deep(.v-field:hover) {
  border-color: rgba(var(--v-theme-on-surface), 0.18);
}

.pssb-field :deep(.v-field--focused) {
  border-color: rgba(var(--v-theme-primary), 0.34);
  box-shadow: 0 0 0 1px rgba(var(--v-theme-primary), 0.12) !important;
}

.pssb-field :deep(.v-field__overlay) {
  opacity: 0 !important;
}

.pssb-field :deep(.v-field__input) {
  min-height: 38px;
  padding-top: 0;
  padding-bottom: 0;
  font-size: 13px;
}

.pssb-field :deep(input) {
  font-size: 13px;
}

.pssb-field :deep(.v-label) {
  font-size: 11px;
}

.pssb-field :deep(.v-field__prepend-inner .v-icon),
.pssb-field :deep(.v-field__append-inner .v-icon) {
  opacity: 0.8;
}

/* =========================
   PAGINACION / FOOTER
========================= */
.pssb-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 22px;
}

.pssb-stats {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
}

.pssb-stats-main {
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
}

.pssb-stats-soft {
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.pssb-stats-soft b {
  color: rgb(var(--v-theme-on-surface));
  font-weight: 800;
}

.pssb-dot {
  opacity: 0.32;
}

.pssb-pagination {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.pssb-page-btn {
  color: rgba(var(--v-theme-on-surface), 0.84);
}

.pssb-page-text {
  min-width: 42px;
  text-align: center;
  font-size: 13px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
}

.pssb-error {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-error));
}

/* =========================
   LIGHT MODE AJUSTES
========================= */
:global(.v-theme--light) .pssb {
  background: #f3f4f6;
  border-color: rgba(15, 23, 42, 0.08);
  box-shadow: none;
}

:global(.v-theme--light) .pssb-scanner-toggle {
  background: #edf6ee;
  border-color: rgba(34, 197, 94, 0.22);
  box-shadow: none;
}

:global(.v-theme--light) .pssb-scanner-toggle.tone-off {
  background: #f1f3f5;
  border-color: rgba(15, 23, 42, 0.12);
  color: rgba(15, 23, 42, 0.8);
}

:global(.v-theme--light) .pssb-scanner-toggle.tone-success {
  background: #edf8f0;
  border-color: rgba(34, 197, 94, 0.24);
  color: #28a745;
}

:global(.v-theme--light) .pssb-scanner-toggle.tone-error {
  background: #fff1f1;
  border-color: rgba(239, 68, 68, 0.2);
}

:global(.v-theme--light) .pssb-scanner-toggle.tone-warning {
  background: #fff8e8;
  border-color: rgba(245, 158, 11, 0.25);
}

:global(.v-theme--light) .pssb-scanner-mini-state {
  background: rgba(15, 23, 42, 0.045);
  border-color: rgba(15, 23, 42, 0.08);
}

:global(.v-theme--light) .pssb-field :deep(.v-field) {
  background: #ffffff;
  border-color: rgba(15, 23, 42, 0.14);
}

:global(.v-theme--light) .pssb-field :deep(.v-field:hover) {
  border-color: rgba(15, 23, 42, 0.2);
}

/* =========================
   DARK MODE AJUSTES
========================= */
:global(.v-theme--dark) .pssb {
  background: linear-gradient(
    180deg,
    rgba(10, 22, 48, 0.98) 0%,
    rgba(8, 18, 40, 1) 100%
  );
  border-color: rgba(148, 163, 184, 0.08);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
}

:global(.v-theme--dark) .pssb-scanner-toggle {
  background: rgba(255, 255, 255, 0.035);
  border-color: rgba(255, 255, 255, 0.08);
}

:global(.v-theme--dark) .pssb-scanner-toggle.tone-success {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.28);
}

:global(.v-theme--dark) .pssb-scanner-toggle.tone-off {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.82);
}

:global(.v-theme--dark) .pssb-scanner-toggle.tone-error {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.24);
}

:global(.v-theme--dark) .pssb-scanner-toggle.tone-warning {
  background: rgba(245, 158, 11, 0.14);
  border-color: rgba(245, 158, 11, 0.26);
}

:global(.v-theme--dark) .pssb-scanner-mini-state {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.08);
}

:global(.v-theme--dark) .pssb-field :deep(.v-field) {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.09);
}

/* =========================
   RESPONSIVE
========================= */
@media (max-width: 1320px) {
  .pssb-toolbar {
    grid-template-columns: 1fr;
  }

  .pssb-pagination {
    justify-content: flex-start;
  }
}

@media (max-width: 760px) {
  .pssb {
    padding: 9px;
  }

  .pssb-scanner-toggle {
    min-width: 92px;
    height: 38px;
    border-radius: 13px;
  }

  .pssb-selects {
    grid-template-columns: 1fr;
  }

  .pssb-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>