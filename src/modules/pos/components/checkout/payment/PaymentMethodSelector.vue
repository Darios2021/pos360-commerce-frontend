<template>
  <div class="ck-pay-grid">
    <button
      v-for="(method, idx) in methods"
      :key="method.id"
      type="button"
      class="ck-pay"
      :data-kind="(method.kind || '').toLowerCase()"
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
      <span class="ck-pay-num">{{ idx + 1 }}</span>

      <div class="ck-pay-left">
        <span class="ck-pay-icon">
          <v-icon size="18">{{ methodIcon(method) }}</v-icon>
        </span>

        <span class="ck-pay-name">
          {{ methodLabel(method) }}
        </span>
      </div>

      <v-icon size="18" class="ck-pay-state">
        {{ isActive(method) ? "mdi-check-circle" : "mdi-circle-outline" }}
      </v-icon>
    </button>

    <button
      type="button"
      class="ck-pay"
      data-kind="mixed"
      :class="{
        active: mixedMode,
        cursor: cursorTarget === 'mixed',
        cursorActive: cursorTarget === 'mixed' && selectorActive
      }"
      @click="$emit('toggle-mixed-mode')"
    >
      <span class="ck-pay-num">{{ methods.length + 1 }}</span>

      <div class="ck-pay-left">
        <span class="ck-pay-icon">
          <v-icon size="18">mdi-set-merge</v-icon>
        </span>

        <span class="ck-pay-name">Mixto</span>
      </div>

      <v-icon size="18" class="ck-pay-state">
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
/* ── Grid ── */
.ck-pay-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
}

/* ── Color tokens per payment kind ── */
.ck-pay { --pc: 99, 102, 241; }           /* default indigo */
.ck-pay[data-kind="cash"] { --pc: 34, 197, 94; }
.ck-pay[data-kind="card"] { --pc: 59, 130, 246; }
.ck-pay[data-kind="transfer"] { --pc: 139, 92, 246; }
.ck-pay[data-kind="qr"] { --pc: 6, 182, 212; }
.ck-pay[data-kind="mercadopago"] { --pc: 6, 182, 212; }
.ck-pay[data-kind="credit_store"] { --pc: 245, 158, 11; }
.ck-pay[data-kind="mixed"] { --pc: 236, 72, 153; }

/* ── Card base ── */
.ck-pay {
  position: relative;
  min-height: 64px;
  padding: 10px 14px;
  border-radius: 14px;
  border: 1.5px solid rgba(var(--pc), 0.18);
  background: rgba(var(--pc), 0.06);
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.13s ease;
  overflow: hidden;
}

.ck-pay:hover {
  background: rgba(var(--pc), 0.11);
  border-color: rgba(var(--pc), 0.36);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--pc), 0.18);
}

/* ── Number badge ── */
.ck-pay-num {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  border-radius: 6px;
  background: rgba(var(--pc), 0.14);
  color: rgb(var(--pc));
  font-size: 0.6rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: background 0.15s, color 0.15s;
}

/* ── Left group ── */
.ck-pay-left {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  flex: 1 1 auto;
}

/* ── Icon ── */
.ck-pay-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(var(--pc), 0.14);
  color: rgb(var(--pc));
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  transition: background 0.15s, color 0.15s;
}

.ck-pay-icon :deep(.v-icon) {
  font-size: 22px !important;
  color: rgb(var(--pc)) !important;
  transition: color 0.15s;
}

/* ── Name ── */
.ck-pay-name {
  min-width: 0;
  font-size: 0.88rem;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgb(var(--v-theme-on-surface));
  transition: color 0.15s;
}

/* ── State icon ── */
.ck-pay-state {
  flex: 0 0 auto;
  color: rgba(var(--pc), 0.5) !important;
  transition: color 0.15s, transform 0.15s;
}

/* ── ACTIVE: solid fill ── */
.ck-pay.active {
  background: rgb(var(--pc));
  border-color: rgb(var(--pc));
  box-shadow:
    0 0 0 3px rgba(var(--pc), 0.22),
    0 6px 18px rgba(var(--pc), 0.3);
  transform: translateY(-1px);
}

.ck-pay.active .ck-pay-num {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
}

.ck-pay.active .ck-pay-icon {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.ck-pay.active .ck-pay-icon :deep(.v-icon) {
  color: #fff !important;
}

.ck-pay.active .ck-pay-name {
  color: #fff;
}

.ck-pay.active .ck-pay-state {
  color: rgba(255, 255, 255, 0.9) !important;
}

/* ── Cursor keyboard highlight ── */
.ck-pay.cursor {
  border-color: rgba(var(--pc), 0.5);
}

.ck-pay.cursorActive {
  box-shadow: 0 0 0 2px rgba(var(--pc), 0.3);
}

@media (max-width: 760px) {
  .ck-pay-grid {
    grid-template-columns: 1fr;
  }
  .ck-pay {
    min-height: 58px;
  }
}
</style>