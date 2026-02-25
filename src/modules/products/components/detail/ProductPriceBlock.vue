<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/detail/ProductPriceBlock.vue -->
<template>
  <v-card rounded="xl" elevation="1" class="pp pa-3">
    <div class="pp-title">Precio</div>

    <!-- PRECIO GRANDE (Sucursal = descuento si existe) -->
    <div class="pp-row">
      <div class="pp-main">
        <div class="pp-currency">$</div>
        <div class="pp-amount">{{ fmtInt(priceBranch) }}</div>
      </div>

      <div class="pp-side">
        <div class="pp-mini">
          <span class="k">Costo</span>
          <span class="v">{{ fmtInt(cost) }}</span>
        </div>

        <div class="pp-mini highlight">
          <span class="k">Ganancia revendedor</span>
          <span class="v">
            {{ gainResellerPctTxt }}
          </span>
          <span class="sub">
            $ {{ fmtInt(gainResellerMoney) }}
          </span>
        </div>
      </div>
    </div>

    <!-- DETALLE PRECIOS -->
    <div class="pp-grid mt-3">
      <div class="pp-chip">
        <div class="kk">Lista</div>
        <div class="vv">$ {{ fmtInt(priceList) }}</div>
      </div>

      <div class="pp-chip">
        <div class="kk">Descuento</div>
        <div class="vv">$ {{ fmtInt(priceDiscount) }}</div>
      </div>

      <div class="pp-chip">
        <div class="kk">Revendedor</div>
        <div class="vv">$ {{ fmtInt(priceReseller) }}</div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  product: { type: Object, required: true }
});

function toNum(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}

function fmtInt(n) {
  return Number(toNum(n, 0)).toLocaleString("es-AR");
}

/* ====== INPUTS ====== */

const cost = computed(() =>
  toNum(props.product?.cost ?? 0, 0)
);

const priceList = computed(() =>
  toNum(props.product?.price_list ?? 0, 0)
);

const priceDiscount = computed(() =>
  toNum(props.product?.price_discount ?? 0, 0)
);

const priceReseller = computed(() =>
  toNum(props.product?.price_reseller ?? 0, 0)
);

/* ====== PRECIO SUCURSAL ====== */

const priceBranch = computed(() => {
  if (priceDiscount.value > 0) return priceDiscount.value;
  if (priceList.value > 0) return priceList.value;
  return 0;
});

/* ====== GANANCIA REVENDEDOR ======
   Calculada sobre precio de descuento
==================================== */

const gainResellerMoney = computed(() => {
  const discount = priceDiscount.value;
  const reseller = priceReseller.value;

  if (!(discount > 0) || !(reseller > 0)) return 0;
  return discount - reseller;
});

const gainResellerPct = computed(() => {
  const discount = priceDiscount.value;
  const gain = gainResellerMoney.value;

  if (!(discount > 0) || !(gain > 0)) return null;
  return (gain / discount) * 100;
});

const gainResellerPctTxt = computed(() => {
  if (gainResellerPct.value == null) return "-";
  return `${gainResellerPct.value.toFixed(1)}%`;
});
</script>

<style scoped>
.pp-title{ font-weight:900; margin-bottom:10px; }

.pp-row{
  display:flex;
  align-items:stretch;
  justify-content:space-between;
  gap:12px;
}

.pp-main{
  display:flex;
  align-items:baseline;
  gap:6px;
}

.pp-currency{ font-weight:900; font-size:20px; }
.pp-amount{ font-weight:900; font-size:34px; letter-spacing:-0.4px; }

.pp-side{
  display:flex;
  gap:10px;
  align-items:center;
  flex-wrap:wrap;
  justify-content:flex-end;
}

.pp-mini{
  display:flex;
  flex-direction:column;
  gap:2px;
  padding:8px 10px;
  border-radius:12px;
  border:1px solid rgba(0,0,0,.06);
  background:rgba(0,0,0,.03);
  min-width:150px;
}

.highlight{
  border-color: rgba(0,150,0,.3);
  background: rgba(0,150,0,.08);
}

.k{ font-size:12px; opacity:.7; font-weight:800; }
.v{ font-size:14px; font-weight:900; }
.sub{ font-size:12px; font-weight:700; opacity:.8; }

.pp-grid{
  display:grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap:10px;
}

.pp-chip{
  padding:10px 12px;
  border-radius:12px;
  border:1px solid rgba(0,0,0,.06);
  background:rgba(0,0,0,.03);
}

.kk{ font-size:12px; opacity:.7; font-weight:800; }
.vv{ font-size:14px; font-weight:900; margin-top:2px; }

@media (max-width: 900px){
  .pp-row{ flex-direction:column; }
  .pp-side{ justify-content:flex-start; }
  .pp-grid{ grid-template-columns:1fr; }
}
</style>