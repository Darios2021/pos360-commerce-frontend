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
      @find-product="handleFindProduct"
      @clients="handleClients"
      @search="handleSearch"
      @refresh="handleRefresh"
      @show-cart="handleShowCart"
      @discount="handleDiscount"
      @cash-in="handleCashIn"
      @pay="handlePay"
      @pay-cash="handlePayCash"
      @pay-other="handlePayOther"
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
  cartItems,
  helpOpen,
  consultaOpen,
  showCartDialog,
  isCajaOpen,
  openCheckoutSafe,
  openCajaConfig,
  toast,
  requestFocusSearch,
  requestRefreshCatalog,
} = usePosSalesFlow();

// F6 toggle: abre/cierra el dialog de carrito con la misma tecla.
function handleShowCart() {
  showCartDialog.value = !showCartDialog.value;
  if (showCartDialog.value) {
    helpOpen.value = false;
    consultaOpen.value = false;
  }
}

function handleHelp() {
  helpOpen.value = !helpOpen.value;
  if (helpOpen.value) {
    consultaOpen.value = false;
    showCartDialog.value = false;
  }
}

function handleFindProduct() {
  // F2: enfocar el buscador de productos / scanner a la izquierda.
  // Si un dialog esta abierto lo cerramos para que el foco llegue real.
  helpOpen.value = false;
  consultaOpen.value = false;
  showCartDialog.value = false;
  requestFocusSearch();
}

function handleSearch() {
  consultaOpen.value = !consultaOpen.value;
  if (consultaOpen.value) {
    helpOpen.value = false;
    showCartDialog.value = false;
  }
}

function handleRefresh() {
  // F5: refrescar catalogo de productos.
  requestRefreshCatalog();
  toast("Actualizando catalogo...");
}

async function handlePay() {
  await openCheckoutSafe();
}

async function handlePayCash() {
  // F10: cobro rapido. Abre checkout; el modo efectivo queda como
  // default del PaymentMethodSelector (kind CASH) definido en
  // usePosSalesFlow.resetCheckoutUiState.
  if (!cartItems.value.length) {
    toast("Agrega productos al carrito antes de cobrar");
    return;
  }
  await openCheckoutSafe();
}

async function handlePayOther() {
  // F12: abrir checkout general. El cajero elige QR/transferencia/etc.
  if (!cartItems.value.length) {
    toast("Agrega productos al carrito antes de cobrar");
    return;
  }
  await openCheckoutSafe();
}

async function handleCashIn() {
  if (!isCajaOpen.value) {
    toast("Primero abri una caja");
    openCajaConfig();
    return;
  }

  toast("Ingreso de dinero: conecta este boton al modal de movimientos de caja");
}

function handleClients() {
  toast("Cliente: usa el panel de la derecha");
}

function handleDiscount() {
  // F7: descuento manual. Todavia no hay UI dedicada en el dominio.
  if (!cartItems.value.length) {
    toast("Agrega productos antes de aplicar descuento");
    return;
  }
  toast("Descuento manual: proximamente");
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

/* .pos-surface se define globalmente en PosPage.vue (clases compartidas) */

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
</style>
