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
          <v-icon size="20">{{ methodIcon(method) }}</v-icon>
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
          <v-icon size="20">mdi-set-merge</v-icon>
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
  gap: 6px;
  width: 100%;
}

/* ── Grid: 3 columns ── */
.pms-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

/* ── Tile base (compacto y moderno) ── */
.pms-tile {
  position: relative;
  min-height: 58px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.025);
  display: grid;
  grid-template-columns: 32px 1fr;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  text-align: left;
  transition:
    background 0.14s ease,
    border-color 0.14s ease,
    box-shadow 0.14s ease;
  overflow: visible;
}

/* ── Keyboard number badge (esquina superior derecha, sutil) ── */
.pms-kbadge {
  position: absolute;
  top: 5px;
  right: 6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9.5px;
  font-weight: 400;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: background 0.14s, color 0.14s;
  letter-spacing: 0.02em;
}

/* ── Icon container ── */
.pms-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(var(--pc), 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.14s;
}
.pms-icon :deep(.v-icon) {
  font-size: 19px !important;
  color: rgb(var(--pc)) !important;
  transition: color 0.14s;
}

/* ── Name ── */
.pms-name {
  font-size: 12.5px;
  font-weight: 400;
  text-align: left;
  line-height: 1.2;
  color: rgb(var(--v-theme-on-surface));
  word-break: break-word;
  letter-spacing: -0.005em;
  transition: color 0.14s;
  padding-right: 18px; /* espacio para el kbadge */
}

/* ── ACTIVE: fondo color sólido ── */
.pms-tile--active {
  background: rgb(var(--pc)) !important;
  border-color: rgb(var(--pc)) !important;
  box-shadow:
    0 0 0 1px rgba(var(--pc), 0.2),
    0 3px 10px rgba(var(--pc), 0.32) !important;
}

.pms-tile--active .pms-icon {
  background: rgba(255, 255, 255, 0.22);
}
.pms-tile--active .pms-icon :deep(.v-icon) {
  color: #fff !important;
}
.pms-tile--active .pms-name {
  color: #fff;
}
.pms-tile--active .pms-kbadge {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
}

/* ── CURSOR (keyboard focus) ── */
.pms-tile--cursor:not(.pms-tile--active) {
  border-color: rgb(var(--pc)) !important;
  background: rgba(var(--pc), 0.08) !important;
  box-shadow: 0 0 0 2px rgba(var(--pc), 0.28);
}
.pms-tile--cursor:not(.pms-tile--active) .pms-kbadge {
  background: rgba(var(--pc), 0.18);
  color: rgb(var(--pc));
}

/* cursor + active combinado */
.pms-tile--cursor.pms-tile--active {
  box-shadow:
    0 0 0 2px rgb(var(--pc)),
    0 0 0 4px rgba(var(--pc), 0.28),
    0 4px 14px rgba(var(--pc), 0.4) !important;
}

/* ── Hover (mouse) ── */
.pms-tile:not(.pms-tile--active):not(.pms-tile--cursor):hover {
  background: rgba(var(--pc), 0.06);
  border-color: rgba(var(--pc), 0.32);
}

/* ── Responsive ── */
@media (max-width: 760px) {
  .pms-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
