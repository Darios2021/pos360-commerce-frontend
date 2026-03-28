<template>
  <div class="pos-topbar-section">
    <PosTopBar
      class="pos-surface pos-topbar-shell"
      :is-view-only="false"
      :needs-branch-pick="needsBranchPick"
      :has-multi-branches="hasMultiBranches"
      :loading-global="loadingGlobal"
      :cart-count="cartCount"
      @help="handleHelp"
      @clients="handleClients"
      @search="handleSearch"
      @show-cart="openCartDialog"
      @cash-in="handleCashIn"
      @pay="handlePay"
      @blocked-pay="handleBlockedPay"
      @blocked-cash-in="handleBlockedCashIn"
    />
  </div>
</template>

<script setup>
import PosTopBar from "../components/PosTopBar.vue";
import { usePosSalesFlow } from "../containers/usePosSalesFlow";

const {
  needsBranchPick,
  hasMultiBranches,
  loadingGlobal,
  cartCount,
  helpOpen,
  consultaOpen,
  showCartDialog,
  isCajaOpen,
  openCheckoutSafe,
  openCajaConfig,
  toast,
} = usePosSalesFlow();

function openCartDialog() {
  showCartDialog.value = true;
  helpOpen.value = false;
  consultaOpen.value = false;
}

function handleHelp() {
  helpOpen.value = !helpOpen.value;
  if (helpOpen.value) {
    consultaOpen.value = false;
    showCartDialog.value = false;
  }
}

function handleSearch() {
  consultaOpen.value = !consultaOpen.value;
  if (consultaOpen.value) {
    helpOpen.value = false;
    showCartDialog.value = false;
  }
}

async function handlePay() {
  await openCheckoutSafe();
}

async function handleCashIn() {
  if (!isCajaOpen.value) {
    toast("Primero abrí una caja");
    openCajaConfig();
    return;
  }

  toast("Ingreso de dinero: conectá este botón al modal de movimientos de caja");
}

function handleClients() {
  toast("Clientes: usá el panel de cliente de la derecha");
}

function handleBlockedPay(payload) {
  const reason = String(payload?.reason || "");

  if (reason === "EMPTY_CART") {
    toast("Agregá productos al carrito antes de cobrar");
    return;
  }

  if (reason === "NEEDS_BRANCH") {
    toast("Seleccioná una sucursal para operar");
    return;
  }

  if (reason === "VIEW_ONLY") {
    toast("La vista está en modo solo lectura");
    return;
  }

  if (reason === "LOADING") {
    toast("Esperá a que termine la operación actual");
    return;
  }

  toast("No se puede iniciar el cobro todavía");
}

function handleBlockedCashIn(payload) {
  const reason = String(payload?.reason || "");

  if (reason === "NEEDS_BRANCH") {
    toast("Seleccioná una sucursal para operar");
    return;
  }

  if (reason === "VIEW_ONLY") {
    toast("La vista está en modo solo lectura");
    return;
  }

  if (reason === "LOADING") {
    toast("Esperá a que termine la operación actual");
    return;
  }

  toast("No se pudo abrir el ingreso de dinero");
}
</script>

<style scoped>
.pos-topbar-section {
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 0;
  display: flex;
}

.pos-topbar-shell {
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: var(--pos-topbar-shell-padding, 8px 10px);
  border-radius: var(--pos-shell-radius, 14px);
  overflow: hidden;
}

.pos-surface {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(15, 23, 42, 0.1);
  box-shadow:
    0 8px 20px rgba(15, 23, 42, 0.05),
    0 2px 8px rgba(15, 23, 42, 0.04);
}

/* ===== FIX REAL DEL TOPBAR ===== */
.pos-topbar-shell :deep(.ptb-root),
.pos-topbar-shell :deep(.ptb-wrap),
.pos-topbar-shell :deep(.ptb-list),
.pos-topbar-shell :deep(.ptb-row) {
  height: 100%;
  min-height: 0;
  align-items: center;
}

.pos-topbar-shell :deep(.ptb-root) {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.pos-topbar-shell :deep(.ptb-wrap),
.pos-topbar-shell :deep(.ptb-list),
.pos-topbar-shell :deep(.ptb-row) {
  width: 100%;
  display: flex;
  gap: clamp(8px, 1vw, 16px);
  justify-content: space-evenly;
  overflow: hidden;
}

/* botón / hotkey */
.pos-topbar-shell :deep(.ptb-hotkey),
.pos-topbar-shell :deep(.ptb-action),
.pos-topbar-shell :deep(.ptb-item),
.pos-topbar-shell :deep(.ptb-btn) {
  min-height: 0;
  height: var(--pos-topbar-button-height, 64px);
  max-height: var(--pos-topbar-button-height, 64px);
  padding: 4px 8px;
  border-radius: 18px;
}

/* ícono */
.pos-topbar-shell :deep(.ptb-icon),
.pos-topbar-shell :deep(.v-icon) {
  font-size: var(--pos-topbar-icon-size, 22px) !important;
}

/* tecla grande */
.pos-topbar-shell :deep(.ptb-hotkey-key),
.pos-topbar-shell :deep(.ptb-key),
.pos-topbar-shell :deep(.ptb-title-text) {
  font-size: var(--pos-topbar-key-size, 18px) !important;
  line-height: 1.05 !important;
  font-weight: 800;
}

/* textos chicos que lo estaban inflando */
.pos-topbar-shell :deep(.ptb-subtitle),
.pos-topbar-shell :deep(.ptb-hint),
.pos-topbar-shell :deep(.ptb-label-small),
.pos-topbar-shell :deep(.ptb-caption) {
  display: none !important;
}

/* cualquier stack interno */
.pos-topbar-shell :deep(.d-flex),
.pos-topbar-shell :deep(.flex-column) {
  min-height: 0;
}

@media (max-width: 960px) {
  .pos-topbar-shell :deep(.ptb-wrap),
  .pos-topbar-shell :deep(.ptb-list),
  .pos-topbar-shell :deep(.ptb-row) {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>