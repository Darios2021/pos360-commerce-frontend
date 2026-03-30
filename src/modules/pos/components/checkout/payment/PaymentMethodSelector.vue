<template>
  <div class="ck-pay-grid">
    <button
      v-for="(method, idx) in methods"
      :key="method.id"
      type="button"
      class="ck-pay"
      :class="{
        active: isActive(method),
        cursor: cursorTarget === 'method' && idx === cursorIndex,
        cursorActive:
          cursorTarget === 'method' &&
          idx === cursorIndex &&
          selectorActive
      }"
      @click="$emit('select-single-method', method.id)"
    >
      <span
        v-if="cursorTarget === 'method' && idx === cursorIndex"
        class="ck-cursor-tag"
      >
        Elegir
      </span>

      <div class="ck-pay-left">
        <span class="ck-pay-icon">
          <v-icon size="24">{{ methodIcon(method) }}</v-icon>
        </span>

        <span class="ck-pay-name">
          {{ methodLabel(method) }}
        </span>
      </div>

      <v-icon size="26" class="ck-pay-state">
        {{ isActive(method) ? "mdi-check-circle" : "mdi-circle-outline" }}
      </v-icon>
    </button>

    <button
      type="button"
      class="ck-pay"
      :class="{
        active: mixedMode,
        cursor: cursorTarget === 'mixed',
        cursorActive: cursorTarget === 'mixed' && selectorActive
      }"
      @click="$emit('toggle-mixed-mode')"
    >
      <span
        v-if="cursorTarget === 'mixed'"
        class="ck-cursor-tag"
      >
        Elegir
      </span>

      <div class="ck-pay-left">
        <span class="ck-pay-icon">
          <v-icon size="24">mdi-set-merge</v-icon>
        </span>

        <span class="ck-pay-name">Mixto</span>
      </div>

      <v-icon size="26" class="ck-pay-state">
        {{ mixedMode ? "mdi-check-circle" : "mdi-circle-outline" }}
      </v-icon>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  methods: { type: Array, default: () => [] },
  selectedMethodId: { type: [Number, String, null], default: null },
  mixedMode: { type: Boolean, default: false },
  cursorIndex: { type: Number, default: 0 },
  cursorTarget: {
    type: String,
    default: "method",
    validator: (v) => ["method", "mixed"].includes(v),
  },
  selectorActive: { type: Boolean, default: false },
  methodLabel: { type: Function, required: true },
  methodIcon: { type: Function, required: true },
});

defineEmits([
  "select-single-method",
  "toggle-mixed-mode",
]);

function isActive(method) {
  if (props.mixedMode) return false;
  if (props.selectedMethodId == null) return false;
  if (method?.id == null) return false;
  return String(props.selectedMethodId) === String(method.id);
}
</script>

<style scoped>
.ck-pay-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 430px));
  align-content: start;
  justify-content: start;
  gap: 8px 10px;
  width: fit-content;
  max-width: 100%;
}

.ck-pay {
  position: relative;
  min-height: 58px;
  padding: 7px 10px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-on-surface), 0.02);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  transition:
    background 0.14s ease,
    border-color 0.14s ease,
    box-shadow 0.14s ease,
    transform 0.14s ease;
}

.ck-pay-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1 1 auto;
}

.ck-pay-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.ck-pay-icon :deep(.v-icon) {
  font-size: 19px !important;
}

.ck-pay-name {
  min-width: 0;
  font-size: 0.82rem;
  font-weight: 900;
  line-height: 1.08;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgb(var(--v-theme-on-surface));
}

.ck-pay-state {
  flex: 0 0 auto;
  font-size: 20px;
  opacity: 0.95;
}

.ck-cursor-tag {
  position: absolute;
  top: 4px;
  right: 6px;
  height: 15px;
  padding: 0 5px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.48rem;
  font-weight: 900;
  line-height: 1;
  background: rgba(var(--v-theme-primary), 0.16);
  color: rgb(var(--v-theme-on-surface));
}

.ck-pay.active {
  border: 2px solid rgba(var(--v-theme-primary), 0.9);
  background:
    linear-gradient(
      135deg,
      rgba(var(--v-theme-primary), 0.1) 0%,
      rgba(var(--v-theme-primary), 0.045) 100%
    );
  box-shadow:
    0 0 0 1px rgba(var(--v-theme-primary), 0.16),
    0 6px 14px rgba(0, 0, 0, 0.1);
}

.ck-pay.cursor {
  border-color: rgba(var(--v-theme-primary), 0.32);
}

.ck-pay.cursorActive {
  box-shadow:
    0 0 0 1px rgba(var(--v-theme-primary), 0.24),
    0 4px 10px rgba(0, 0, 0, 0.08);
}

@media (max-width: 1200px) {
  .ck-pay-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }
}

@media (max-width: 760px) {
  .ck-pay-grid {
    grid-template-columns: 1fr;
  }

  .ck-pay {
    min-height: 54px;
  }
}
</style>