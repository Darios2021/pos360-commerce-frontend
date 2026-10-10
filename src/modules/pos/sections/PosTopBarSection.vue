<template>
  <div class="pos-topbar-section">
    <PosTopBar
      class="pos-surface pos-topbar-shell"
      :is-view-only="false"
      :needs-branch-pick="needsBranchPick"
      :has-multi-branches="hasMultiBranches"
      :loading-global="loadingGlobal"
      :cart-count="cartCount"
      :active-states="activeStates"
      :caja-open="!!isCajaOpen"
      @help="handleHelp"
      @find-product="handleFindProduct"
      @search="handleSearch"
      @refresh="handleRefresh"
      @show-cart="handleShowCart"
      @pay="handlePay"
      @new-customer="handleNewCustomer"
      @clear-cart="handleClearCart"
      @cash="handleCash"
      @movements="handleMovements"
    />
    <PosCashMovementsDialog
      v-model="movementsOpen"
      :caja-id="Number(currentCashRegister?.id || 0)"
      :sucursal="movementsSucursal"
    />
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import PosTopBar from "../components/PosTopBar.vue";
import PosCashMovementsDialog from "../components/PosCashMovementsDialog.vue";
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
  checkoutDialog,
  openCheckoutSafe,
  toast,
  requestFocusSearch,
  requestRefreshCatalog,
  isCajaOpen,
  currentCashRegister,
  getActiveBranchIdSafe,
  openCajaConfig,
  onCloseCaja,
  posStore,
} = usePosSalesFlow();

const router = useRouter();
const movementsOpen = ref(false);
const movementsSucursal = computed(
  () => Number(getActiveBranchIdSafe?.() || currentCashRegister.value?.branch_id || 0) || 0
);

// Mapa de estados activos por F-key para que el TopBar resalte los que
// están abiertos (toggle visual).
const activeStates = computed(() => ({
  F1: !!helpOpen.value,
  F4: !!consultaOpen.value,
  F6: !!showCartDialog.value,
  F9: !!checkoutDialog.value,
  F10: !!movementsOpen.value,
}));

function closeAllSecondary() {
  helpOpen.value = false;
  consultaOpen.value = false;
  showCartDialog.value = false;
  movementsOpen.value = false;
}

function handleHelp() {
  if (helpOpen.value) {
    helpOpen.value = false;
    return;
  }
  closeAllSecondary();
  helpOpen.value = true;
}

function handleFindProduct() {
  // F2: enfocar el buscador. Cierra cualquier dialog secundario para que el
  // foco llegue al input real.
  closeAllSecondary();
  requestFocusSearch();
}

function handleSearch() {
  if (consultaOpen.value) {
    consultaOpen.value = false;
    return;
  }
  closeAllSecondary();
  consultaOpen.value = true;
}

function handleRefresh() {
  requestRefreshCatalog();
  toast("Actualizando catalogo...");
}

function handleShowCart() {
  if (showCartDialog.value) {
    showCartDialog.value = false;
    return;
  }
  closeAllSecondary();
  showCartDialog.value = true;
}

// F3: alta en la ficha completa de clientes; al guardar vuelve al POS y el
// carrito sigue en el store.
function handleNewCustomer() {
  closeAllSecondary();
  router.push({ name: "adminCustomerNew", query: { volver: "pos" } });
}

// F8 llega ya confirmado (segunda pulsación) desde el TopBar.
function handleClearCart() {
  if (!cartItems.value.length) {
    toast("El carrito ya está vacío");
    return;
  }
  closeAllSecondary();
  posStore.clearCart();
  toast("Carrito vaciado");
}

// F7: abrir la caja, o con la caja abierta, arqueo y cierre.
async function handleCash() {
  closeAllSecondary();
  if (isCajaOpen.value) await onCloseCaja();
  else openCajaConfig();
}

// F10: ingresos y egresos de efectivo, ventana que abre y cierra.
function handleMovements() {
  if (movementsOpen.value) {
    movementsOpen.value = false;
    return;
  }
  if (!isCajaOpen.value || !currentCashRegister.value?.id) {
    toast("No hay caja abierta");
    return;
  }
  closeAllSecondary();
  movementsOpen.value = true;
}

async function handlePay() {
  // F9 toggle: si ya está abierto el checkout, lo cerramos.
  if (checkoutDialog.value) {
    checkoutDialog.value = false;
    return;
  }
  if (!cartItems.value.length) {
    toast("Agrega productos al carrito antes de cobrar");
    return;
  }
  await openCheckoutSafe();
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
