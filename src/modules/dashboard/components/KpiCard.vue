<template>
  <div class="kc" :class="`kc--${tone}`">
    <div class="kc__body">
      <div class="kc__label">{{ theLabel }}</div>
      <div class="kc__value">
        <v-skeleton-loader v-if="loading" type="text" class="kc__skel" />
        <span v-else>{{ displayValue }}</span>
      </div>
      <div v-if="sub && !loading" class="kc__sub">{{ sub }}</div>
    </div>
    <div class="kc__icon-box">
      <v-icon :icon="icon" size="20" />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  label: { type: String, default: "" },
  title: { type: String, default: "" },
  value: { type: [String, Number], default: "—" },
  sub: { type: String, default: "" },
  icon: { type: String, default: "mdi-chart-box-outline" },
  loading: { type: Boolean, default: false },
  tone: { type: String, default: "primary" },
});

const theLabel = computed(() => props.label || props.title || "");
const displayValue = computed(() => {
  const v = props.value;
  if (v === null || v === undefined || v === "") return "—";
  return v;
});
</script>

<style scoped>
.kc {
  position: relative;
  padding: 18px 18px 14px 22px;
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  cursor: default;
}

.kc:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.14);
}

/* Left accent bar */
.kc::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  background: var(--kc-accent);
  border-radius: 16px 0 0 16px;
}

/* Background glow */
.kc::after {
  content: '';
  position: absolute;
  top: -30%; right: -10%;
  width: 100px; height: 100px;
  border-radius: 50%;
  background: var(--kc-accent);
  opacity: 0.07;
  pointer-events: none;
}

.kc__body { position: relative; z-index: 1; min-width: 0; }

.kc__label {
  font-size: 10.5px;
  font-weight: 400;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.50);
  line-height: 1;
  margin-bottom: 8px;
}

.kc__value {
  font-size: 1.65rem;
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: rgb(var(--v-theme-on-surface));
  min-height: 2rem;
}

.kc__skel {
  width: 110px;
  margin-top: 4px;
}

.kc__sub {
  font-size: 11px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.48);
  margin-top: 6px;
  line-height: 1.3;
}

.kc__icon-box {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--kc-icon-bg);
  border: 1px solid var(--kc-icon-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--kc-accent);
  z-index: 1;
}

/* ─── Tone tokens ─── */
.kc--primary {
  --kc-accent: rgb(var(--v-theme-primary));
  --kc-icon-bg: rgba(var(--v-theme-primary), 0.13);
  --kc-icon-border: rgba(var(--v-theme-primary), 0.25);
}
.kc--success {
  --kc-accent: rgb(var(--v-theme-success));
  --kc-icon-bg: rgba(var(--v-theme-success), 0.13);
  --kc-icon-border: rgba(var(--v-theme-success), 0.25);
}
.kc--warning {
  --kc-accent: rgb(var(--v-theme-warning));
  --kc-icon-bg: rgba(var(--v-theme-warning), 0.13);
  --kc-icon-border: rgba(var(--v-theme-warning), 0.25);
}
.kc--error {
  --kc-accent: rgb(var(--v-theme-error));
  --kc-icon-bg: rgba(var(--v-theme-error), 0.13);
  --kc-icon-border: rgba(var(--v-theme-error), 0.25);
}
.kc--info {
  --kc-accent: #00BCD4;
  --kc-icon-bg: rgba(0,188,212,0.13);
  --kc-icon-border: rgba(0,188,212,0.25);
}
.kc--indigo {
  --kc-accent: #5C6BC0;
  --kc-icon-bg: rgba(92,107,192,0.13);
  --kc-icon-border: rgba(92,107,192,0.28);
}
.kc--deep-orange {
  --kc-accent: #FF7043;
  --kc-icon-bg: rgba(255,112,67,0.13);
  --kc-icon-border: rgba(255,112,67,0.25);
}
.kc--purple {
  --kc-accent: #AB47BC;
  --kc-icon-bg: rgba(171,71,188,0.13);
  --kc-icon-border: rgba(171,71,188,0.25);
}
.kc--teal {
  --kc-accent: #26A69A;
  --kc-icon-bg: rgba(38,166,154,0.13);
  --kc-icon-border: rgba(38,166,154,0.25);
}
</style>
