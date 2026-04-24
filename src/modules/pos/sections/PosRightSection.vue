<template>
  <div class="pos-right-section">
    <div class="pos-surface pos-right-section__box">
      <PosCajaActionsBar
        :is-caja-open="isCajaOpen"
        :opened-at="currentCashRegister?.opened_at || openedAt"
        :opened-by="
          currentCashRegister?.opened_by_name ||
          currentCashRegister?.user_name ||
          cashierName
        "
        :branch-chip-label="branchChipLabel"
        :has-multi-branches="hasMultiBranches"
        :loading-global="loadingGlobal"
        :cart-count="cartCount"
        @open-config="openCajaConfig"
        @close-caja="onCloseCaja"
        @refresh="refresh"
        @open-branch-switch="openBranchSwitch"
      />

      <PosBranchOpenRegistersPanel
        v-if="!isCajaOpen && branchOpenRegisters?.length"
        :registers="branchOpenRegisters"
        class="pos-right-section__branch-open"
      />
    </div>

    <div class="pos-surface pos-right-section__customer">
      <PosCustomerPanel
        v-model="customer"
        :disabled="customerDisabled"
        :has-data="customerHasData"
        @clear="clearCustomer"
      />
    </div>

    <div class="pos-cart-wrap">
      <PosCartPanel
        class="pos-surface pos-right-section__cart"
        :cart="posStore.cart"
        :total-items="posStore.totalItems"
        :total="checkoutTotalPreview"
        :can-edit="cartEditable"
        :pos-store="posStore"
        @checkout="openCheckoutSafe"
      />
    </div>

    <div
      v-if="cartBranchLabel"
      class="pos-cart-branch-note text-caption text-medium-emphasis"
    >
      Carrito: <b>{{ cartBranchLabel }}</b>
    </div>
  </div>
</template>

<script setup>
import PosCajaActionsBar from "../components/PosCajaActionsBar.vue";
import PosBranchOpenRegistersPanel from "../components/PosBranchOpenRegistersPanel.vue";
import PosCustomerPanel from "../components/PosCustomerPanel.vue";
import PosCartPanel from "../components/PosCartPanel.vue";
import { usePosSalesFlow } from "../containers/usePosSalesFlow";

const {
  posStore,
  currentCashRegister,
  branchOpenRegisters,
  openedAt,
  cashierName,
  branchChipLabel,
  hasMultiBranches,
  loadingGlobal,
  cartCount,
  openCajaConfig,
  onCloseCaja,
  refresh,
  openBranchSwitch,
  customer,
  customerDisabled,
  customerHasData,
  clearCustomer,
  checkoutTotalPreview,
  cartEditable,
  openCheckoutSafe,
  cartBranchLabel,
  isCajaOpen,
} = usePosSalesFlow();
</script>

<style scoped>
.pos-right-section {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 10px;
  min-height: 0;
  height: 100%;
}

.pos-right-section__box,
.pos-right-section__customer,
.pos-right-section__cart {
  border-radius: 16px;
  min-width: 0;
}

.pos-right-section__box,
.pos-right-section__customer {
  padding: 8px;
}

.pos-right-section__box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pos-right-section__branch-open {
  margin-top: 2px;
}

.pos-cart-wrap {
  min-height: 0;
  display: flex;
}

.pos-right-section__cart {
  min-height: 0;
  display: flex;
  width: 100%;
}

.pos-cart-branch-note {
  padding: 0 6px;
}

/* .pos-surface se define globalmente en PosPage.vue (clases compartidas) */

@media (max-width: 960px) {
  .pos-right-section {
    grid-template-rows: auto auto minmax(320px, 1fr) auto;
  }
}
</style>