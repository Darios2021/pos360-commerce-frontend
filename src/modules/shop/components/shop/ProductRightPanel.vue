<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/ProductRightPanel.vue -->
<template>
  <div class="rp">
    <ProductPurchasePanel
      :product="product"
      @add="onAdd"
      @buy="onBuy"
      @go-payments="emit('go-payments')"
    />
  </div>
</template>

<script setup>
import ProductPurchasePanel from "./ProductPurchasePanel.vue";

const props = defineProps({
  product: { type: Object, required: true },
});

const emit = defineEmits(["add", "buy", "go-payments"]);

function onAdd(p, qty = 1, abono = null) {
  emit("add", p || props.product, qty || 1, abono);
}
function onBuy(p, qty = 1, abono = null) {
  emit("buy", p || props.product, qty || 1, abono);
}
</script>

<style scoped>
.rp {
  width: 100%;
  position: sticky;
  top: 92px; /* appbar */
  align-self: start;
}

@media (max-width: 1200px) {
  .rp {
    position: static;
    top: auto;
  }
}
</style>
