<template>
  <section class="pos-header-stack">
    <PosTopBar
      class="pos-surface pos-topbar-shell"
      :branch-chip-label="branchChipLabel"
      :sellable-stock-total="sellableStockTotal"
      :stock-only-total="stockOnlyTotal"
      :cashier-name="cashierName"
      :shift-start-text="shiftStartText"
      :is-view-only="isViewOnly"
      :needs-branch-pick="needsBranchPick"
      :has-multi-branches="hasMultiBranches"
      :loading-global="loadingGlobal"
      :cart-count="cartCount"
      :checkout-disabled="checkoutDisabled"
      @refresh="$emit('refresh')"
      @open-branch-switch="$emit('open-branch-switch')"
      @help="$emit('help')"
      @checkout="$emit('checkout')"
    />

    <PosFiscalAlerts
      class="pos-surface pos-alerts-shell"
      :cart="cart"
      :customer="customer"
      :payment-method="paymentMethod"
      :total="total"
    />
  </section>
</template>

<script setup>
import PosTopBar from "./PosTopBar.vue";
import PosFiscalAlerts from "./PosFiscalAlerts.vue";

defineProps({
  branchChipLabel: { type: String, default: "" },
  sellableStockTotal: { type: Number, default: 0 },
  stockOnlyTotal: { type: Number, default: 0 },
  cashierName: { type: String, default: "" },
  shiftStartText: { type: String, default: "" },
  isViewOnly: { type: Boolean, default: false },
  needsBranchPick: { type: Boolean, default: false },
  hasMultiBranches: { type: Boolean, default: false },
  loadingGlobal: { type: Boolean, default: false },
  cartCount: { type: Number, default: 0 },
  checkoutDisabled: { type: Boolean, default: false },

  cart: { type: Array, default: () => [] },
  customer: { type: Object, default: () => ({}) },
  paymentMethod: { type: String, default: "" },
  total: { type: Number, default: 0 },
});

defineEmits(["refresh", "open-branch-switch", "help", "checkout"]);
</script>

<style scoped>
.pos-header-stack {
  flex: 0 0 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--pos-gap, 10px);
}

.pos-alerts-shell {
  border-radius: var(--pos-radius, 14px);
}
</style>