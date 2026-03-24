<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosScannerBar.vue -->
<template>
  <div class="pos-scanner-bar">
    <div class="pos-scanner-left">
      <div
        class="pos-scanner-indicator"
        :class="indicatorClass"
      >
        <v-icon :color="iconColorNormalized" size="18">
          {{ iconNameNormalized }}
        </v-icon>
      </div>

      <div class="pos-scanner-meta">
        <div class="pos-scanner-title">
          {{ title }}
        </div>

        <div class="pos-scanner-sub">
          <span v-if="subLabelNormalized">
            {{ subLabelNormalized }}
          </span>
          <span v-else-if="isOn">
            Listo para pistola o app móvil
          </span>
          <span v-else>
            Lector pausado
          </span>
        </div>
      </div>
    </div>

    <div class="pos-scanner-right">
      <v-chip
        size="small"
        class="pos-scanner-status"
        :class="statusClass"
      >
        {{ statusText }}
      </v-chip>

      <v-chip
        size="small"
        variant="tonal"
        class="pos-scanner-code"
        :title="lastScanNormalized || 'Sin lectura'"
      >
        {{ lastScanNormalized || "—" }}
      </v-chip>

      <v-btn
        size="small"
        density="comfortable"
        class="pos-scanner-btn"
        :color="isOn ? 'success' : undefined"
        variant="tonal"
        @click="$emit('toggle')"
      >
        <v-icon start size="16">
          {{ isOn ? "mdi-pause" : "mdi-play" }}
        </v-icon>
        {{ isOn ? "Activo" : "Activar" }}
      </v-btn>

      <v-btn
        size="small"
        density="comfortable"
        variant="text"
        class="pos-scanner-test-btn"
        @click="$emit('test')"
      >
        Probar
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from "vue";

const props = defineProps({
  visualState: { type: String, default: "off" }, // off | ready | reading | success | no_match | error | multiple
  iconName: { type: String, default: "mdi-barcode" },
  iconColor: { type: String, default: "success" },
  stateLabel: { type: String, default: "" },
  subLabel: { type: String, default: "" },
  lastScan: { type: String, default: "" },
  lastMessage: { type: String, default: "" },
  isOn: { type: Boolean, default: false },

  title: { type: String, default: "Lector de códigos" },

  soundEnabled: { type: Boolean, default: true },
  vibrationEnabled: { type: Boolean, default: true },

  successFrequency: { type: Number, default: 880 },
  errorFrequency: { type: Number, default: 220 },
  noMatchFrequency: { type: Number, default: 280 },
  multipleFrequency: { type: Number, default: 520 },
});

defineEmits(["toggle", "test"]);

const visualStateNormalized = computed(() => {
  const v = String(props.visualState || "off").trim().toLowerCase();
  return v || "off";
});

const iconNameNormalized = computed(() => {
  return String(props.iconName || "mdi-barcode").trim() || "mdi-barcode";
});

const iconColorNormalized = computed(() => {
  return String(props.iconColor || "success").trim() || "success";
});

const lastScanNormalized = computed(() => {
  return String(props.lastScan || "").trim();
});

const subLabelNormalized = computed(() => {
  if (props.lastMessage) return String(props.lastMessage).trim();
  if (props.subLabel) return String(props.subLabel).trim();
  return "";
});

const indicatorClass = computed(() => {
  return `is-${visualStateNormalized.value}`;
});

const statusClass = computed(() => {
  return `is-${visualStateNormalized.value}`;
});

const statusText = computed(() => {
  if (props.stateLabel) return String(props.stateLabel).trim();

  switch (visualStateNormalized.value) {
    case "reading":
      return "Leyendo...";
    case "success":
      return "OK";
    case "no_match":
      return "Sin match";
    case "error":
      return "Error";
    case "multiple":
      return "Varios";
    case "ready":
      return "Esperando código";
    case "off":
    default:
      return "Inactivo";
  }
});

function canUseAudio() {
  return typeof window !== "undefined" && !!window.AudioContext;
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
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + Number(duration || 0.08));

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
  setTimeout(() => {
    beep({ frequency: props.successFrequency * 1.18, duration: 0.08, type: "sine", volume: 0.03 });
  }, 70);
}

function beepError() {
  beep({ frequency: props.errorFrequency, duration: 0.11, type: "square", volume: 0.04 });
}

function beepNoMatch() {
  beep({ frequency: props.noMatchFrequency, duration: 0.09, type: "triangle", volume: 0.032 });
  setTimeout(() => {
    beep({ frequency: props.noMatchFrequency * 0.9, duration: 0.09, type: "triangle", volume: 0.028 });
  }, 90);
}

function beepMultiple() {
  beep({ frequency: props.multipleFrequency, duration: 0.05, type: "sine", volume: 0.03 });
  setTimeout(() => {
    beep({ frequency: props.multipleFrequency * 1.08, duration: 0.05, type: "sine", volume: 0.028 });
  }, 65);
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
    if (!next || next === prev) return;

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
      vibrate([50, 30, 50, 30, 50]);
    }
  }
);
</script>

<style scoped>
.pos-scanner-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  min-height: 48px;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgb(var(--v-theme-surface));
}

.pos-scanner-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.pos-scanner-indicator {
  width: 30px;
  height: 30px;
  min-width: 30px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-on-surface), 0.06);
  transition:
    transform 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
}

.pos-scanner-indicator.is-ready {
  background: rgba(var(--v-theme-success), 0.14);
}

.pos-scanner-indicator.is-reading {
  background: rgba(var(--v-theme-primary), 0.18);
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.08);
  animation: scannerPulse 0.8s infinite alternate;
}

.pos-scanner-indicator.is-success {
  background: rgba(var(--v-theme-success), 0.22);
  box-shadow: 0 0 0 3px rgba(var(--v-theme-success), 0.08);
}

.pos-scanner-indicator.is-no_match,
.pos-scanner-indicator.is-error {
  background: rgba(var(--v-theme-error), 0.18);
  box-shadow: 0 0 0 3px rgba(var(--v-theme-error), 0.06);
}

.pos-scanner-indicator.is-multiple {
  background: rgba(var(--v-theme-warning), 0.18);
  box-shadow: 0 0 0 3px rgba(var(--v-theme-warning), 0.06);
}

.pos-scanner-indicator.is-off {
  opacity: 0.45;
}

@keyframes scannerPulse {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.08);
  }
}

.pos-scanner-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.12;
}

.pos-scanner-title {
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.pos-scanner-sub {
  font-size: 11px;
  opacity: 0.72;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pos-scanner-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: wrap;
}

.pos-scanner-status {
  font-size: 11px;
  font-weight: 700;
}

.pos-scanner-status.is-ready {
  background: rgba(var(--v-theme-success), 0.14);
}

.pos-scanner-status.is-reading {
  background: rgba(var(--v-theme-primary), 0.18);
}

.pos-scanner-status.is-success {
  background: rgba(var(--v-theme-success), 0.24);
}

.pos-scanner-status.is-no_match,
.pos-scanner-status.is-error {
  background: rgba(var(--v-theme-error), 0.18);
}

.pos-scanner-status.is-multiple {
  background: rgba(var(--v-theme-warning), 0.18);
}

.pos-scanner-code {
  font-size: 11px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pos-scanner-btn,
.pos-scanner-test-btn {
  font-size: 11px;
  text-transform: none !important;
}

@media (max-width: 960px) {
  .pos-scanner-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .pos-scanner-right {
    justify-content: flex-start;
  }

  .pos-scanner-code {
    max-width: 100%;
  }
}
</style>