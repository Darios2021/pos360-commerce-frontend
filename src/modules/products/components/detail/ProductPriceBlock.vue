<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/detail/ProductPriceBlock.vue -->
<template>
  <v-card rounded="xl" elevation="1" class="pa-3">
    <div class="pp-title">Precio</div>

    <div class="pp-row">
      <div class="pp-main">
        <div class="pp-currency">$</div>
        <div class="pp-amount">{{ price }}</div>
      </div>

      <div class="pp-side">
        <div class="pp-mini">
          <span class="k">Costo</span>
          <span class="v">{{ cost }}</span>
        </div>
        <div class="pp-mini">
          <span class="k">Margen</span>
          <span class="v">{{ margin }}</span>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({ product: { type: Object, required: true } });

const price = computed(() => fmt(props.product?.price ?? props.product?.sale_price ?? props.product?.final_price ?? 0));
const cost = computed(() => fmt(props.product?.cost ?? props.product?.purchase_price ?? 0));
const margin = computed(() => {
  const p = Number(props.product?.price ?? props.product?.sale_price ?? 0);
  const c = Number(props.product?.cost ?? props.product?.purchase_price ?? 0);
  if (!p || !c) return "-";
  const m = ((p - c) / p) * 100;
  return `${m.toFixed(1)}%`;
});

function fmt(n) {
  return Number(n || 0).toLocaleString("es-AR");
}
</script>

<style scoped>
.pp-title{ font-weight:900; margin-bottom:10px; }
.pp-row{ display:flex; align-items:stretch; justify-content:space-between; gap:12px; }
.pp-main{ display:flex; align-items:baseline; gap:6px; }
.pp-currency{ font-weight:900; font-size:20px; }
.pp-amount{ font-weight:900; font-size:34px; letter-spacing:-0.4px; }
.pp-side{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; justify-content:flex-end; }
.pp-mini{ display:flex; flex-direction:column; gap:2px; padding:8px 10px; border-radius:12px; border:1px solid rgba(0,0,0,.06); background:rgba(0,0,0,.03); min-width:110px; }
.k{ font-size:12px; opacity:.7; font-weight:800; }
.v{ font-size:14px; font-weight:900; }
@media (max-width: 900px){
  .pp-row{ flex-direction:column; }
  .pp-side{ justify-content:flex-start; }
}
</style>