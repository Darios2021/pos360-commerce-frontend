<template>
  <div class="pms-wrap">
    <!-- shortcut hint -->
    <div class="pms-hint">
      <v-icon size="13" class="mr-1">mdi-keyboard-outline</v-icon>
      Presioná <strong>1–{{ methods.length + 1 }}</strong> para seleccionar · flechas para mover
    </div>

    <div class="pms-grid">
      <button
        v-for="(method, idx) in methods"
        :key="method.id"
        type="button"
        class="pms-tile"
        :data-kind="(method.kind || '').toLowerCase()"
        :class="{
          'pms-tile--active':  isActive(method),
          'pms-tile--cursor':  cursorTarget === 'method' && idx === cursorIndex && selectorActive,
        }"
        @click="$emit('select-single-method', method.id)"
      >
        <!-- keyboard key badge -->
        <span class="pms-key">{{ idx + 1 }}</span>

        <!-- icon -->
        <span class="pms-icon">
          <v-icon size="20">{{ methodIcon(method) }}</v-icon>
        </span>

        <!-- name -->
        <span class="pms-name">{{ methodLabel(method) }}</span>

        <!-- state -->
        <span class="pms-state">
          <v-icon size="16">
            {{ isActive(method) ? 'mdi-check-circle' : 'mdi-circle-outline' }}
          </v-icon>
        </span>
      </button>

      <!-- mixto -->
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
        <span class="pms-key">{{ methods.length + 1 }}</span>
        <span class="pms-icon">
          <v-icon size="20">mdi-set-merge</v-icon>
        </span>
        <span class="pms-name">Mixto</span>
        <span class="pms-state">
          <v-icon size="16">{{ mixedMode ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
        </span>
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
  cursorTarget:     { type: String,  default: "method", validator: v => ["method","mixed"].includes(v) },
  selectorActive:   { type: Boolean, default: false },
  methodLabel:      { type: Function, required: true },
  methodIcon:       { type: Function, required: true },
});

defineEmits(["select-single-method","toggle-mixed-mode"]);

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

/* ── Shortcut hint ── */
.pms-hint {
  display: flex;
  align-items: center;
  font-size: 0.68rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.45);
  padding-left: 2px;
}
.pms-hint strong { font-weight: 900; color: rgba(var(--v-theme-on-surface), 0.7); margin: 0 2px; }

/* ── Grid ── */
.pms-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
}

/* ── Tile base ── */
.pms-tile {
  position: relative;
  min-height: 58px;
  padding: 8px 12px 8px 10px;
  border-radius: 13px;
  border: 1.5px solid rgba(var(--pc), 0.2);
  background: rgba(var(--pc), 0.05);
  display: flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  text-align: left;
  transition:
    background 0.14s ease,
    border-color 0.14s ease,
    box-shadow 0.14s ease,
    transform 0.12s ease;
  overflow: visible;
}

/* ── Number key badge (physical key look) ── */
.pms-key {
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  /* dark key cap */
  background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.18) 100%);
  border: 1px solid rgba(var(--pc), 0.28);
  border-bottom-width: 3px;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.08),
    0 1px 3px rgba(0,0,0,0.22);
  color: rgb(var(--pc));
  font-size: 0.68rem;
  font-weight: 900;
  font-family: 'Courier New', monospace;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: background 0.14s, border-color 0.14s, color 0.14s, box-shadow 0.14s;
}

/* ── Icon ── */
.pms-icon {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(var(--pc), 0.12);
  color: rgb(var(--pc));
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.14s, color 0.14s;
}
.pms-icon :deep(.v-icon) {
  font-size: 20px !important;
  color: rgb(var(--pc)) !important;
  transition: color 0.14s;
}

/* ── Name ── */
.pms-name {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.84rem;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgb(var(--v-theme-on-surface));
  transition: color 0.14s;
}

/* ── State icon ── */
.pms-state {
  flex: 0 0 auto;
  color: rgba(var(--pc), 0.45);
  transition: color 0.14s, transform 0.14s;
}
.pms-state :deep(.v-icon) {
  font-size: 16px !important;
}

/* ── ACTIVE: solid fill ── */
.pms-tile--active {
  background: rgb(var(--pc)) !important;
  border-color: rgb(var(--pc)) !important;
  box-shadow:
    0 0 0 3px rgba(var(--pc), 0.2),
    0 5px 16px rgba(var(--pc), 0.28) !important;
  transform: translateY(-1px);
}
.pms-tile--active .pms-key {
  background: linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%);
  border-color: rgba(255,255,255,0.3);
  border-bottom-color: rgba(0,0,0,0.15);
  color: #fff;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.25),
    0 1px 3px rgba(0,0,0,0.15);
}
.pms-tile--active .pms-icon {
  background: rgba(255,255,255,0.2);
  color: #fff;
}
.pms-tile--active .pms-icon :deep(.v-icon) { color: #fff !important; }
.pms-tile--active .pms-name  { color: #fff; }
.pms-tile--active .pms-state { color: rgba(255,255,255,0.9); }

/* ── CURSOR (keyboard focus) ── */
.pms-tile--cursor:not(.pms-tile--active) {
  border-color: rgb(var(--pc)) !important;
  background: rgba(var(--pc), 0.1) !important;
  box-shadow:
    0 0 0 2px rgba(var(--pc), 0.28),
    0 4px 12px rgba(var(--pc), 0.15) !important;
  transform: translateY(-1px);
}
.pms-tile--cursor:not(.pms-tile--active) .pms-key {
  background: linear-gradient(180deg, rgba(var(--pc),0.18) 0%, rgba(var(--pc),0.08) 100%);
  border-color: rgba(var(--pc), 0.5);
  color: rgb(var(--pc));
}

/* cursor + active: reinforce the ring */
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

/* ── Responsive ── */
@media (max-width: 760px) {
  .pms-grid { grid-template-columns: 1fr; }
  .pms-tile { min-height: 52px; }
}
</style>
