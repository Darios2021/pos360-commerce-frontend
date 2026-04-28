<template>
  <div class="pos-cart-only">
    <PosCartPanel
      :cart="posStore.cart"
      :total-items="posStore.totalItems"
      :total="checkoutTotalPreview"
      :can-edit="cartEditable"
      :pos-store="posStore"
      @checkout="openCheckoutSafe"
    />
  </div>
</template>

<script setup>
import PosCartPanel from "../components/PosCartPanel.vue";
import { usePosSalesFlow } from "../containers/usePosSalesFlow";

const {
  posStore,
  checkoutTotalPreview,
  cartEditable,
  openCheckoutSafe,
} = usePosSalesFlow();
</script>

<style scoped>
.pos-cart-only {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.pos-cart-only > * {
  flex: 1 1 0;
  min-height: 0;
}
</style>