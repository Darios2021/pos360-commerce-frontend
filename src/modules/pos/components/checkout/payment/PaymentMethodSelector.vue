<template>
  <div class="ck-pay-grid">
    <button
      v-for="(method, idx) in methods"
      :key="method.id"
      type="button"
      class="ck-pay"
      :class="{
        active: !mixedMode && Number(selectedMethodId) === Number(method.id),
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

      <v-icon size="26">
        {{
          !mixedMode && Number(selectedMethodId) === Number(method.id)
            ? "mdi-check-circle"
            : "mdi-circle-outline"
        }}
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

      <v-icon size="26">
        {{ mixedMode ? "mdi-check-circle" : "mdi-circle-outline" }}
      </v-icon>
    </button>
  </div>
</template>

<script setup>
defineProps({
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
</script>

<style scoped>
.ck-pay-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  min-width: 0;
}

.ck-pay {
  position: relative;
  min-height: 92px;
  padding: 16px 18px;
  border-radius: 20px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-on-surface), 0.025);
  color: rgb(var(--v-theme-on-surface));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    color 0.16s ease,
    transform 0.16s ease;
  overflow: hidden;
  min-width: 0;
}

.ck-pay:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.18);
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.ck-pay::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 6px;
  background: transparent;
  transition: background-color 0.16s ease;
}

.ck-pay.active {
  color: rgb(var(--v-theme-primary));
  border-color: rgba(var(--v-theme-primary), 0.36);
  background: rgba(var(--v-theme-primary), 0.08);
}

.ck-pay.cursor::before {
  background: rgba(var(--v-theme-primary), 0.42);
}

.ck-pay.cursor {
  border-color: rgba(var(--v-theme-primary), 0.34);
}

.ck-pay.cursorActive {
  box-shadow:
    0 0 0 2px rgba(var(--v-theme-primary), 0.14),
    0 12px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.ck-cursor-tag {
  position: absolute;
  top: 8px;
  right: 10px;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  background: rgba(var(--v-theme-primary), 0.14);
  color: rgb(var(--v-theme-primary));
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.ck-pay-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1 1 auto;
}

.ck-pay-icon {
  width: 46px;
  height: 46px;
  border-radius: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.08);
  flex: 0 0 auto;
}

.ck-pay-name {
  font-size: 1.08rem;
  font-weight: 900;
  line-height: 1.08;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .ck-pay-grid {
    grid-template-columns: 1fr;
  }

  .ck-pay {
    min-height: 84px;
  }

  .ck-pay-name {
    font-size: 1rem;
  }
}
</style>