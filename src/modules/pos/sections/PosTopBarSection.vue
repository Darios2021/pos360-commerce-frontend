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
      @help="abrir(helpOpen)"
      @find-product="abrir(buscarOpen)"
      @search="abrir(consultaOpen)"
      @refresh="handleRefresh"
      @show-cart="abrir(showCartDialog)"
      @pay="handlePay"
      @new-customer="handleNewCustomer"
      @clear-cart="handleClearCart"
      @cash="handleCash"
      @movements="handleMovements"
    />

    <!-- Ventanas de la barra (maqueta aprobada 10/10) -->
    <PosBuscarDialog v-model="buscarOpen" :branch-id="sucursal" @agregar="agregar" />
    <PosPrecioDialog v-model="consultaOpen" :branch-id="sucursal" @agregar="agregar" />
    <PosCarritoDialog v-model="showCartDialog" :pos-store="posStore" @cobrar="cobrarDesdeCarrito" />
    <PosVaciarDialog v-model="vaciarOpen" :pos-store="posStore" @vaciado="toast('Carrito vaciado')" />
    <PosMovimientosDialog v-model="movementsOpen" :caja-id="Number(currentCashRegister?.id || 0)" :sucursal="sucursal" />
    <PosAyudaDialog v-model="helpOpen" />
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import PosTopBar from "../components/PosTopBar.vue";
import PosBuscarDialog from "../components/modales/PosBuscarDialog.vue";
import PosPrecioDialog from "../components/modales/PosPrecioDialog.vue";
import PosCarritoDialog from "../components/modales/PosCarritoDialog.vue";
import PosVaciarDialog from "../components/modales/PosVaciarDialog.vue";
import PosMovimientosDialog from "../components/modales/PosMovimientosDialog.vue";
import PosAyudaDialog from "../components/modales/PosAyudaDialog.vue";
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
  requestRefreshCatalog,
  isCajaOpen,
  currentCashRegister,
  getActiveBranchIdSafe,
  openCajaConfig,
  onCloseCaja,
  posStore,
  handleAddConsultaToCart,
} = usePosSalesFlow();

const router = useRouter();
const buscarOpen = ref(false);
const vaciarOpen = ref(false);
const movementsOpen = ref(false);
const sucursal = computed(
  () => Number(getActiveBranchIdSafe?.() || currentCashRegister.value?.branch_id || 0) || 0
);

// Qué ventana está a la vista, para el punto de la barra.
const activeStates = computed(() => ({
  F1: !!helpOpen.value,
  F2: !!buscarOpen.value,
  F4: !!consultaOpen.value,
  F6: !!showCartDialog.value,
  F8: !!vaciarOpen.value,
  F9: !!checkoutDialog.value,
  F10: !!movementsOpen.value,
}));

const ventanas = [helpOpen, buscarOpen, consultaOpen, showCartDialog, vaciarOpen, movementsOpen];
function closeAllSecondary() {
  for (const v of ventanas) v.value = false;
}
// Misma tecla: abre o cierra. Otra tecla: cierra la que esté y abre la suya.
function abrir(ventana) {
  if (ventana.value) { ventana.value = false; return; }
  closeAllSecondary();
  ventana.value = true;
}

// Buscar y Consulta: el producto entra con los controles de siempre (caja
// abierta, sucursal) y la cantidad elegida.
function agregar({ product, qty = 1 }) {
  const antes = cartItems.value.find((x) => Number(x.id) === Number(product?.id))?.qty || 0;
  handleAddConsultaToCart(product);
  const despues = cartItems.value.find((x) => Number(x.id) === Number(product?.id))?.qty || 0;
  if (despues > antes) for (let i = 1; i < qty; i++) posStore.increaseQty(product.id);
}

function handleRefresh() {
  requestRefreshCatalog();
  toast("Actualizando catálogo");
}

async function cobrarDesdeCarrito() {
  showCartDialog.value = false;
  await handlePay();
}

// F3: alta en la ficha completa de clientes; al guardar vuelve al POS y el
// carrito sigue en el store.
function handleNewCustomer() {
  closeAllSecondary();
  router.push({ name: "adminCustomerNew", query: { volver: "pos" } });
}

function handleClearCart() {
  if (vaciarOpen.value) { vaciarOpen.value = false; return; }
  if (!cartItems.value.length) {
    toast("El carrito ya está vacío");
    return;
  }
  closeAllSecondary();
  vaciarOpen.value = true;
}

// F7: abrir la caja, o con la caja abierta, arqueo y cierre.
async function handleCash() {
  closeAllSecondary();
  if (isCajaOpen.value) await onCloseCaja();
  else openCajaConfig();
}

// F10: ingresos y egresos de efectivo.
function handleMovements() {
  if (movementsOpen.value) { movementsOpen.value = false; return; }
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
    toast("Agregá productos al carrito antes de cobrar");
    return;
  }
  closeAllSecondary();
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
