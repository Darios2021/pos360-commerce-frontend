<template>
  <div class="pos-caja-only">
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
      :other-open-registers="otherOpenRegisters"
      :current-cash-register-id="currentCashRegister?.id || 0"
      @open-config="openCajaConfig"
      @close-caja="onCloseCaja"
      @refresh="refresh"
      @open-branch-switch="openBranchSwitch"
    />
  </div>
</template>

<script setup>
import PosCajaActionsBar from "../components/PosCajaActionsBar.vue";
import { usePosSalesFlow } from "../containers/usePosSalesFlow";

const {
  isCajaOpen,
  currentCashRegister,
  otherOpenRegisters,
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
} = usePosSalesFlow();
</script>

<style scoped>
.pos-caja-only {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>