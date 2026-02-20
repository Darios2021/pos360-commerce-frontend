<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/detail/ProductStockBlock.vue -->
<template>
  <v-card rounded="xl" elevation="1" class="pa-3">
    <div class="ps-title">Stock</div>

    <div class="ps-grid">
      <div class="ps-item">
        <div class="k">Total</div>
        <div class="v">{{ total }}</div>
      </div>

      <div class="ps-item">
        <div class="k">Sucursal</div>
        <div class="v">{{ branchName }}</div>
      </div>

      <div class="ps-item">
        <div class="k">En sucursal</div>
        <div class="v">{{ branchStock }}</div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  product: { type: Object, required: true },
  branchName: { type: String, default: "-" },
});

const total = computed(() => String(props.product?.stock_total ?? props.product?.stock ?? props.product?.total_stock ?? "-"));
const branchStock = computed(() => String(props.product?.branch_stock ?? props.product?.stock_branch ?? props.product?.stock_by_branch ?? "-"));
</script>

<style scoped>
.ps-title{ font-weight:900; margin-bottom:10px; }
.ps-grid{ display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:10px; }
.ps-item{ background: rgba(0,0,0,.03); border:1px solid rgba(0,0,0,.06); border-radius:12px; padding:10px; }
.k{ font-size:12px; opacity:.7; font-weight:800; }
.v{ font-size:16px; font-weight:900; }
@media (max-width: 900px){
  .ps-grid{ grid-template-columns: 1fr; }
}
</style>