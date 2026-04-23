<template>
  <header
    class="pdch"
    role="banner"
    :class="{ 'pdch--busy': confirmBusy || busy }"
  >
    <div class="pdch__row pdch__row--top">
      <div class="pdch__eyebrow">
        <slot name="title">{{ title }}</slot>
      </div>

      <v-btn
        v-if="closable"
        class="pdch__close"
        icon
        variant="text"
        size="small"
        :disabled="confirmBusy"
        :aria-disabled="confirmBusy ? 'true' : 'false'"
        aria-label="Cerrar"
        @click="handleCloseClick"
      >
        <v-icon size="20">mdi-close</v-icon>
        <v-tooltip v-if="confirmBusy" activator="parent" location="bottom">
          Procesando venta...
        </v-tooltip>
      </v-btn>
    </div>

    <div class="pdch__row pdch__row--main">
      <ol
        class="pdch__progress"
        role="progressbar"
        :aria-valuemin="1"
        :aria-valuemax="steps.length"
        :aria-valuenow="currentIndex + 1"
        :aria-label="progressAriaLabel"
      >
        <li
          v-for="(s, i) in steps"
          :key="s.key"
          class="pdch__step"
          :class="{
            'pdch__step--active': i === currentIndex,
            'pdch__step--done': i < currentIndex,
            'pdch__step--pending': i > currentIndex,
            'pdch__step--clickable': stepClickable && i < currentIndex,
          }"
          :aria-current="i === currentIndex ? 'step' : undefined"
          @click="onStepClick(s, i)"
        >
          <span class="pdch__dot">
            <v-icon v-if="i < currentIndex" size="14">mdi-check</v-icon>
            <template v-else>{{ i + 1 }}</template>
          </span>
          <span class="pdch__label">{{ s.label }}</span>
          <span
            v-if="i < steps.length - 1"
            class="pdch__line"
            :class="{ 'pdch__line--done': i < currentIndex }"
            aria-hidden="true"
          />
        </li>
      </ol>

      <div class="pdch__total">
        <span class="pdch__total-lbl">{{ totalLabel }}</span>
        <span class="pdch__total-val" aria-live="polite">{{ formattedTotal }}</span>
      </div>

      <slot name="trailing" />
    </div>

    <div v-if="busy || confirmBusy" class="pdch__busybar" aria-hidden="true">
      <v-progress-linear indeterminate color="primary" height="2" />
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: 'COBRO POS' },
  steps: { type: Array, default: () => [] },
  currentStep: { type: String, default: '' },
  total: { type: Number, default: 0 },
  totalLabel: { type: String, default: 'TOTAL' },
  totalCurrency: { type: String, default: 'ARS' },
  totalLocale: { type: String, default: 'es-AR' },
  busy: { type: Boolean, default: false },
  confirmBusy: { type: Boolean, default: false },
  closable: { type: Boolean, default: true },
  stepClickable: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'close:blocked', 'step:click'])

const currentIndex = computed(() => {
  const idx = props.steps.findIndex((s) => s.key === props.currentStep)
  return idx >= 0 ? idx : 0
})

const formattedTotal = computed(() => {
  try {
    return new Intl.NumberFormat(props.totalLocale, {
      style: 'currency',
      currency: props.totalCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(props.total) || 0)
  } catch {
    return `$ ${Number(props.total || 0).toFixed(2)}`
  }
})

const progressAriaLabel = computed(() => {
  if (!props.steps.length) return ''
  return `Paso ${currentIndex.value + 1} de ${props.steps.length}`
})

function handleCloseClick() {
  if (props.confirmBusy) {
    emit('close:blocked')
    return
  }
  emit('close')
}

function onStepClick(step, index) {
  if (!props.stepClickable) return
  if (index >= currentIndex.value) return
  emit('step:click', { key: step.key, index })
}
</script>

<style scoped>
.pdch {
  position: relative;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.02);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pdch__row--top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pdch__eyebrow {
  font-size: var(--pos-text-xs, 11px);
  font-weight: var(--pos-font-semibold, 700);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.pdch__close { margin-left: auto; }
.pdch__close[aria-disabled="true"] { cursor: not-allowed; opacity: 0.5; }

.pdch__row--main {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 16px;
}

.pdch__progress {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
}

.pdch__step {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.pdch__step--clickable { cursor: pointer; }
.pdch__step--clickable:hover .pdch__dot { filter: brightness(1.1); }

.pdch__dot {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--pos-text-xs, 11px);
  font-weight: var(--pos-font-bold, 900);
  background: transparent;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.20);
  color: rgba(var(--v-theme-on-surface), 0.62);
  transition: background-color 160ms ease, color 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  flex: 0 0 22px;
}

.pdch__step--active .pdch__dot {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.22);
}

.pdch__step--done .pdch__dot {
  background: rgba(var(--v-theme-primary), 0.15);
  border-color: rgba(var(--v-theme-primary), 0.45);
  color: rgb(var(--v-theme-primary));
}

.pdch__label {
  font-size: var(--pos-text-sm, 12px);
  font-weight: var(--pos-font-semibold, 700);
  color: rgba(var(--v-theme-on-surface), 0.70);
  white-space: nowrap;
}

.pdch__step--active .pdch__label { color: rgb(var(--v-theme-on-surface)); }
.pdch__step--pending .pdch__label { color: rgba(var(--v-theme-on-surface), 0.45); }

.pdch__line {
  width: 22px;
  height: 2px;
  background: rgba(var(--v-theme-on-surface), 0.12);
  margin: 0 8px;
  flex: 0 0 22px;
  border-radius: 999px;
}
.pdch__line--done { background: rgba(var(--v-theme-primary), 0.45); }

.pdch__total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1;
  min-width: 0;
}

.pdch__total-lbl {
  font-size: 0.58rem;
  font-weight: var(--pos-font-semibold, 700);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
  margin-bottom: 4px;
}

.pdch__total-val {
  font-size: var(--pos-text-xl, 20px);
  font-weight: var(--pos-font-bold, 900);
  color: rgb(var(--v-theme-on-surface));
  letter-spacing: -0.01em;
  transition: color 180ms ease;
}

.pdch__busybar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  pointer-events: none;
}

@media (max-width: 760px) {
  .pdch__row--main {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "progress total"
      "progress total";
    gap: 10px;
  }
  .pdch__progress { grid-area: progress; }
  .pdch__total { grid-area: total; }
}

@media (max-width: 640px) {
  .pdch__row--main {
    grid-template-columns: 1fr;
    grid-template-areas:
      "progress"
      "total";
  }
  .pdch__total { align-items: flex-start; }
  .pdch__total-val { font-size: var(--pos-text-lg, 16px); }
}

@media (max-width: 480px) {
  .pdch__label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .pdch__line { width: 14px; flex-basis: 14px; margin: 0 4px; }
}

:global(.v-theme--dark) .pdch__step--active .pdch__dot {
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.32);
}
</style>
