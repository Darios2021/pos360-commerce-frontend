<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/shop/ProductRightPanel.vue -->
<template>
  <div class="rp">
    <!-- Si querés un link arriba tipo ML -->
    <div class="rp-top">
      <a class="rp-link" href="javascript:void(0)" @click.prevent="emit('go-payments')">
        Ver los medios de pago
      </a>
    </div>

    <ProductPurchasePanel
      :product="product"
      @add="onAdd"
      @buy="onBuy"
    />
  </div>
</template>

<script setup>
import ProductPurchasePanel from "./ProductPurchasePanel.vue";

const props = defineProps({
  product: { type: Object, required: true },
});

const emit = defineEmits(["add", "buy", "go-payments"]);

function onAdd(p, qty = 1) {
  emit("add", p || props.product, qty || 1);
}
function onBuy(p, qty = 1) {
  emit("buy", p || props.product, qty || 1);
}
</script>

<style scoped>
.rp {
  width: 100%;
  position: sticky;
  top: 92px; /* appbar */
  align-self: start;
}

.rp-top {
  padding: 8px 2px 10px;
}

.rp-link {
  font-size: 14px;
  color: #3483fa;
  text-decoration: none;
  font-weight: 600;
}
.rp-link:hover {
  text-decoration: underline;
}

@media (max-width: 1200px) {
  .rp {
    position: static;
    top: auto;
  }
}
</style>
