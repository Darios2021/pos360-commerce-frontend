<template>
  <div class="pms-wrap">
    <div class="pms-grid">
      <button
        v-for="(method, idx) in methods"
        :key="method.id"
        type="button"
        class="pms-tile"
        :data-kind="(method.kind || '').toLowerCase()"
        :class="{
          'pms-tile--active': isActive(method),
          'pms-tile--cursor': cursorTarget === 'method' && idx === cursorIndex && selectorActive,
        }"
        @click="$emit('select-single-method', method.id)"
      >
        <!-- keyboard key badge top-right -->
        <span class="pms-kbadge">{{ idx + 1 }}</span>

        <!-- icon container -->
        <span class="pms-icon">
          <v-icon size="24">{{ methodIcon(method) }}</v-icon>
        </span>

        <!-- name -->
        <span class="pms-name">{{ methodLabel(method) }}</span>
      </button>

      <!-- mixto tile -->
      <button
        type="button"
        class="pms-tile pms-tile--mixto"
        data-kind="mixed"
        :class="{
          'pms-tile--active': mixedMode,
          'pms-tile--cursor': cursorTarget === 'mixed' && selectorActive,
        }"
        @click="$emit('toggle-mixed-mode')"
      >
        <span class="pms-kbadge">{{ methods.length + 1 }}</span>
        <span class="pms-icon">
          <v-icon size="24">mdi-set-merge</v-icon>
        </span>
        <span class="pms-name">Mixto</span>
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  methods:          { type: Array,   default: () => [] },
  selectedMethodId: { type: [Number, String, null], default: null },
  mixedMode:        { type: Boolean, default: false },
  cursorIndex:      { type: Number,  default: 0 },
  cursorTarget:     { type: String,  default: "method", validator: v => ["method", "mixed"].includes(v) },
  selectorActive:   { type: Boolean, default: false },
  methodLabel:      { type: Function, required: true },
  methodIcon:       { type: Function, required: true },
});

defineEmits(["select-single-method", "toggle-mixed-mode"]);

function isActive(method) {
  if (props.mixedMode) return false;
  if (props.selectedMethodId == null || method?.id == null) return false;
  return String(props.selectedMethodId) === String(method.id);
}
</script>

<style scoped>
/* ── Color tokens ── */
.pms-tile { --pc: 99,102,241; }
.pms-tile[data-kind="cash"]        { --pc: 34,197,94; }
.pms-tile[data-kind="card"]        { --pc: 59,130,246; }
.pms-tile[data-kind="transfer"]    { --pc: 139,92,246; }
.pms-tile[data-kind="qr"]          { --pc: 6,182,212; }
.pms-tile[data-kind="mercadopago"] { --pc: 6,182,212; }
.pms-tile[data-kind="credit_sjt"]  { --pc: 245,158,11; }
.pms-tile[data-kind="mixed"]       { --pc: 236,72,153; }

/* ── Wrapper ── */
.pms-wrap {
  display: grid;
  gap: 8px;
  width: 100%;
}

/* ── Grid: 3 columns ── */
.pms-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

/* ── Tile base ── */
.pms-tile {
  position: relative;
  min-height: 88px;
  padding: 14px 10px 10px;
  border-radius: 16px;
  border: 2px solid rgba(var(--pc), 0.2);
  background: rgba(var(--pc), 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  cursor: pointer;
  text-align: center;
  transition:
    background 0.14s ease,
    border-color 0.14s ease,
    box-shadow 0.14s ease,
    transform 0.12s ease;
  overflow: visible;
}

/* ── Keyboard number badge (top-right, physical key look) ── */
.pms-kbadge {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  border-radius: 5px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(0, 0, 0, 0.18) 100%);
  border: 1px solid rgba(var(--pc), 0.3);
  border-bottom-width: 2px;
  color: rgb(var(--pc));
  font-family: 'Courier New', monospace;
  font-size: 0.6rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: background 0.14s, border-color 0.14s, color 0.14s;
}

/* ── Icon container ── */
.pms-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: rgba(var(--pc), 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.14s, color 0.14s;
}
.pms-icon :deep(.v-icon) {
  font-size: 24px !important;
  color: rgb(var(--pc)) !important;
  transition: color 0.14s;
}

/* ── Name ── */
.pms-name {
  font-size: 0.76rem;
  font-weight: 800;
  text-align: center;
  line-height: 1.15;
  color: rgb(var(--v-theme-on-surface));
  word-break: break-word;
  transition: color 0.14s;
}

/* ── ACTIVE: solid fill ── */
.pms-tile--active {
  background: rgb(var(--pc)) !important;
  border-color: rgb(var(--pc)) !important;
  box-shadow:
    0 0 0 3px rgba(var(--pc), 0.2),
    0 6px 20px rgba(var(--pc), 0.3) !important;
  transform: translateY(-2px);
}

.pms-tile--active .pms-icon {
  background: rgba(255, 255, 255, 0.2);
}
.pms-tile--active .pms-icon :deep(.v-icon) {
  color: #fff !important;
}
.pms-tile--active .pms-name {
  color: #fff;
}
.pms-tile--active .pms-kbadge {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}

/* ── CURSOR (keyboard focus) ── */
.pms-tile--cursor:not(.pms-tile--active) {
  border-color: rgb(var(--pc)) !important;
  background: rgba(var(--pc), 0.12) !important;
  box-shadow:
    0 0 0 3px rgba(var(--pc), 0.22),
    0 4px 12px rgba(var(--pc), 0.15) !important;
  transform: translateY(-2px);
}
.pms-tile--cursor:not(.pms-tile--active) .pms-kbadge {
  background: linear-gradient(180deg, rgba(var(--pc), 0.18) 0%, rgba(var(--pc), 0.08) 100%);
  border-color: rgba(var(--pc), 0.5);
  color: rgb(var(--pc));
}

/* cursor + active combined ring */
.pms-tile--cursor.pms-tile--active {
  box-shadow:
    0 0 0 3px rgb(var(--pc)),
    0 0 0 5px rgba(var(--pc), 0.25),
    0 8px 24px rgba(var(--pc), 0.38) !important;
}

/* ── Hover (mouse only) ── */
.pms-tile:not(.pms-tile--active):not(.pms-tile--cursor):hover {
  background: rgba(var(--pc), 0.09);
  border-color: rgba(var(--pc), 0.35);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--pc), 0.14);
}

/* ── Responsive: 2 columns at narrow ── */
@media (max-width: 760px) {
  .pms-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .pms-tile {
    min-height: 80px;
  }
}
</style>
