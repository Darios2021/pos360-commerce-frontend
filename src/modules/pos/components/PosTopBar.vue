<template>
  <div class="ptb">
    <!-- HEADER -->
    <div class="ptb-row ptb-row1">
      <div class="ptb-title-wrap">
        <div class="ptb-h">
          <span class="ptb-title-text">Punto de Venta</span>

          <span v-if="isViewOnly" class="ptb-badge">
            Solo vista
          </span>

          <span v-else-if="needsBranchPick" class="ptb-badge ptb-badge--warn">
            Elegí sucursal
          </span>
        </div>

        <div class="ptb-subtitle">
          Acciones rápidas del sistema
        </div>
      </div>
    </div>

    <!-- HOTKEY BAR -->
    <div class="ptb-hotkeys">
      <button
        type="button"
        class="ptb-hotkey hk-help"
        @click="emit('help')"
      >
        <div class="ptb-hotkey-left">
          <v-icon size="16">mdi-help-circle-outline</v-icon>
          <span class="ptb-hotkey-text">Ayuda</span>
        </div>
        <span class="ptb-hotkey-key">F1</span>
      </button>

      <button
        type="button"
        class="ptb-hotkey hk-clients"
        @click="emit('clients')"
      >
        <div class="ptb-hotkey-left">
          <v-icon size="16">mdi-account-multiple-outline</v-icon>
          <span class="ptb-hotkey-text">Clientes</span>
        </div>
        <span class="ptb-hotkey-key">F2</span>
      </button>

      <button
        type="button"
        class="ptb-hotkey hk-search"
        @click="emit('search')"
      >
        <div class="ptb-hotkey-left">
          <v-icon size="16">mdi-magnify</v-icon>
          <span class="ptb-hotkey-text">Consulta</span>
        </div>
        <span class="ptb-hotkey-key">F4</span>
      </button>

      <button
        type="button"
        class="ptb-hotkey hk-cart"
        @click="handleCart"
      >
        <div class="ptb-hotkey-left">
          <v-icon size="16">mdi-cart-outline</v-icon>
          <span class="ptb-hotkey-text">Carrito</span>
        </div>

        <div class="ptb-hotkey-right">
          <span class="ptb-hotkey-count">
            {{ safeCartCount }}
          </span>
          <span class="ptb-hotkey-key">F6</span>
        </div>
      </button>

      <button
        type="button"
        class="ptb-hotkey hk-cash-in"
        :disabled="isBlockedForMoneyActions"
        @click="handleCashIn"
      >
        <div class="ptb-hotkey-left">
          <v-icon size="16">mdi-cash-plus</v-icon>
          <span class="ptb-hotkey-text">Ingreso</span>
        </div>
        <span class="ptb-hotkey-key">F8</span>
      </button>

      <button
        type="button"
        class="ptb-hotkey hk-pay"
        :disabled="isPayDisabled"
        @click="handlePay"
      >
        <div class="ptb-hotkey-left">
          <v-icon size="16">mdi-cash-register</v-icon>
          <span class="ptb-hotkey-text">Cobro</span>
        </div>
        <span class="ptb-hotkey-key">F9</span>
      </button>
    </div>

    <div class="ptb-hints">
      <span v-if="needsBranchPick" class="ptb-hint ptb-hint--warn">
        Debés seleccionar una sucursal para operar.
      </span>

      <span v-else-if="!hasCartItems" class="ptb-hint">
        Para cobrar primero agregá productos al carrito.
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted } from "vue";

const props = defineProps({
  branchChipLabel: { type: String, default: "—" },
  isViewOnly: { type: Boolean, default: false },
  needsBranchPick: { type: Boolean, default: false },
  hasMultiBranches: { type: Boolean, default: false },
  loadingGlobal: { type: Boolean, default: false },
  cartCount: { type: Number, default: 0 },
});

const emit = defineEmits([
  "help",
  "clients",
  "search",
  "show-cart",
  "cash-in",
  "pay",
  "blocked-pay",
  "blocked-cash-in",
]);

const safeCartCount = computed(() => {
  const n = Number(props.cartCount || 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
});

const hasCartItems = computed(() => safeCartCount.value > 0);

const isBlockedForMoneyActions = computed(() => {
  return props.isViewOnly || props.loadingGlobal || props.needsBranchPick;
});

const isPayDisabled = computed(() => {
  return isBlockedForMoneyActions.value || !hasCartItems.value;
});

function isTypingTarget(target) {
  if (!target) return false;

  const tag = target.tagName?.toLowerCase?.();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;

  return false;
}

function handleCart() {
  emit("show-cart");
}

function handleCashIn() {
  if (isBlockedForMoneyActions.value) {
    emit("blocked-cash-in", {
      reason: props.needsBranchPick
        ? "NEEDS_BRANCH"
        : props.isViewOnly
          ? "VIEW_ONLY"
          : "LOADING",
    });
    return;
  }

  emit("cash-in");
}

function handlePay() {
  if (isPayDisabled.value) {
    emit("blocked-pay", {
      reason: props.needsBranchPick
        ? "NEEDS_BRANCH"
        : props.isViewOnly
          ? "VIEW_ONLY"
          : props.loadingGlobal
            ? "LOADING"
            : !hasCartItems.value
              ? "EMPTY_CART"
              : "BLOCKED",
    });
    return;
  }

  emit("pay");
}

function handleKeydown(e) {
  if (isTypingTarget(e.target)) return;

  switch (e.key) {
    case "F1":
      e.preventDefault();
      emit("help");
      break;

    case "F2":
      e.preventDefault();
      emit("clients");
      break;

    case "F4":
      e.preventDefault();
      emit("search");
      break;

    case "F6":
      e.preventDefault();
      handleCart();
      break;

    case "F8":
      e.preventDefault();
      handleCashIn();
      break;

    case "F9":
      e.preventDefault();
      handlePay();
      break;
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
.ptb {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.04);
}

.ptb-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.ptb-row1 {
  flex-wrap: wrap;
}

.ptb-title-wrap {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ptb-h {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ptb-title-text {
  font-size: 13px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.1;
  letter-spacing: 0.01em;
}

.ptb-subtitle {
  font-size: 11px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.64);
}

.ptb-badge {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.03em;
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgb(var(--v-theme-on-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.ptb-badge--warn {
  background: rgba(var(--v-theme-warning), 0.14);
  color: rgb(var(--v-theme-warning));
  border-color: rgba(var(--v-theme-warning), 0.2);
}

.ptb-hotkeys {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}

.ptb-hotkey {
  appearance: none;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  outline: none;
  width: 100%;
  min-height: 44px;
  border-radius: 14px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease,
    opacity 0.15s ease;
  font: inherit;
  box-shadow: none;
}

.ptb-hotkey:hover:not(:disabled) {
  transform: translateY(-1px);
}

.ptb-hotkey:active:not(:disabled) {
  transform: translateY(0);
}

.ptb-hotkey:disabled {
  cursor: not-allowed;
  opacity: 0.56;
  filter: grayscale(0.08);
}

.ptb-hotkey-left {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  overflow: hidden;
}

.ptb-hotkey-right {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.ptb-hotkey-text {
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ptb-hotkey-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 22px;
  padding: 0 7px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.02em;
  border: 1px solid currentColor;
  opacity: 0.9;
  flex-shrink: 0;
}

.ptb-hotkey-count {
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 900;
  line-height: 1;
  border: 1px solid currentColor;
  opacity: 0.95;
  flex-shrink: 0;
}

.ptb-hints {
  min-height: 18px;
  display: flex;
  align-items: center;
}

.ptb-hint {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.62);
  line-height: 1.2;
}

.ptb-hint--warn {
  color: rgb(var(--v-theme-warning));
}

/* COLORES */
.hk-help {
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgb(var(--v-theme-primary));
  border-color: rgba(var(--v-theme-primary), 0.16);
}

.hk-clients {
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
  border-color: rgba(124, 58, 237, 0.2);
}

.hk-search {
  background: rgba(var(--v-theme-info), 0.1);
  color: rgb(var(--v-theme-info));
  border-color: rgba(var(--v-theme-info), 0.18);
}

.hk-cart {
  background: rgba(var(--v-theme-secondary), 0.1);
  color: rgb(var(--v-theme-secondary));
  border-color: rgba(var(--v-theme-secondary), 0.18);
}

.hk-cash-in {
  background: rgba(var(--v-theme-warning), 0.12);
  color: rgb(var(--v-theme-warning));
  border-color: rgba(var(--v-theme-warning), 0.2);
}

.hk-pay {
  background: rgba(var(--v-theme-success), 0.12);
  color: rgb(var(--v-theme-success));
  border-color: rgba(var(--v-theme-success), 0.2);
}

/* LIGHT */
:global(.v-theme--light) .ptb {
  background: #ffffff;
  border-color: rgba(15, 23, 42, 0.08);
}

:global(.v-theme--light) .ptb-title-text {
  color: #172033;
}

:global(.v-theme--light) .ptb-subtitle,
:global(.v-theme--light) .ptb-hint {
  color: rgba(23, 32, 51, 0.68);
}

:global(.v-theme--light) .ptb-hotkey-key,
:global(.v-theme--light) .ptb-hotkey-count {
  background: rgba(255, 255, 255, 0.66);
}

/* DARK */
:global(.v-theme--dark) .ptb {
  background: linear-gradient(180deg, #0e1d3c, #0b1833);
  border-color: rgba(255, 255, 255, 0.08);
}

:global(.v-theme--dark) .ptb-title-text {
  color: rgba(255, 255, 255, 0.96);
}

:global(.v-theme--dark) .ptb-subtitle,
:global(.v-theme--dark) .ptb-hint {
  color: rgba(255, 255, 255, 0.68);
}

:global(.v-theme--dark) .ptb-hotkey-key,
:global(.v-theme--dark) .ptb-hotkey-count {
  background: rgba(255, 255, 255, 0.08);
}

/* RESPONSIVE */
@media (max-width: 1280px) {
  .ptb-hotkeys {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .ptb-hotkeys {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .ptb {
    padding: 10px;
    border-radius: 14px;
  }

  .ptb-title-text {
    font-size: 13px;
  }

  .ptb-hotkeys {
    grid-template-columns: 1fr;
  }

  .ptb-hotkey {
    min-height: 42px;
  }
}
</style>