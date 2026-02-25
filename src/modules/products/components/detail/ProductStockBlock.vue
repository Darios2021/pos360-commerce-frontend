<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/detail/ProductStockBlock.vue -->
<template>
  <v-card rounded="xl" elevation="1" class="pa-3">
    <div class="ps-head">
      <div class="ps-title">Stock</div>

      <v-chip
        v-if="hasMismatch"
        size="small"
        color="warning"
        variant="tonal"
        class="ps-chip"
        title="La sucursal activa no coincide con la que tiene stock"
      >
        Stock en otra sucursal
      </v-chip>
    </div>

    <div class="ps-grid">
      <div class="ps-item">
        <div class="k">Total</div>
        <div class="v">{{ totalFmt }}</div>
      </div>

      <div class="ps-item">
        <div class="k">Sucursal (activa)</div>
        <div class="v">{{ branchNameSafe }}</div>
      </div>

      <div class="ps-item">
        <div class="k">En sucursal</div>
        <div class="v" :class="{ danger: branchQty === 0 && totalQty > 0 }">
          {{ branchFmt }}
        </div>
      </div>
    </div>

    <!-- ✅ Aviso cuando hay stock pero NO en la sucursal activa -->
    <div v-if="hasMismatch" class="ps-hint">
      <v-icon size="16">mdi-information-outline</v-icon>
      <span>
        Hay stock en <b>{{ bestBranchName }}</b> ({{ bestBranchQtyFmt }}).
      </span>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  product: { type: Object, required: true },
  // opcional: podés seguir pasándolo desde la página si querés
  branchName: { type: String, default: "" },
});

function toNum(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}
function fmtQty(v) {
  return toNum(v, 0).toFixed(3);
}

const totalQty = computed(() =>
  toNum(props.product?.stock_total ?? props.product?.stock ?? props.product?.total_stock ?? 0, 0)
);

const branchQty = computed(() =>
  toNum(
    props.product?.stock_in_branch ??
      props.product?.branch_stock ??
      props.product?.stock_branch ??
      props.product?.stock_by_branch ??
      0,
    0
  )
);

const totalFmt = computed(() => fmtQty(totalQty.value));
const branchFmt = computed(() => fmtQty(branchQty.value));

const branchNameSafe = computed(() => {
  const fromProp = String(props.branchName || "").trim();
  const fromProduct = String(props.product?.branch_name || "").trim();
  return fromProp || fromProduct || "—";
});

/**
 * ✅ detectamos “mismatch”:
 * - total > 0
 * - pero en sucursal activa == 0
 */
const hasMismatch = computed(() => totalQty.value > 0 && branchQty.value === 0);

/**
 * ✅ mostramos “mejor sucursal” si el page te pasó algo como branches_matrix / branchesStock
 * (si no existe, igual no rompe)
 */
const bestRow = computed(() => {
  const arr =
    props.product?.branches_matrix ||
    props.product?.branchesStock ||
    props.product?.stock_matrix ||
    props.product?.branches ||
    null;

  const list = Array.isArray(arr) ? arr : [];

  let best = null;
  for (const x of list) {
    const q = toNum(x?.stock_qty ?? x?.current_qty ?? x?.qty ?? x?.stock ?? 0, 0);
    if (q <= 0) continue;
    if (!best || q > best.qty) {
      best = {
        name: String(x?.branch_name || x?.name || "").trim() || `Sucursal #${Number(x?.branch_id || x?.id || 0)}`,
        qty: q,
      };
    }
  }
  return best;
});

const bestBranchName = computed(() => bestRow.value?.name || "otra sucursal");
const bestBranchQtyFmt = computed(() => fmtQty(bestRow.value?.qty || 0));
</script>

<style scoped>
.ps-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.ps-title {
  font-weight: 900;
}
.ps-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.ps-item {
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 10px;
}
.k {
  font-size: 12px;
  opacity: 0.7;
  font-weight: 800;
}
.v {
  font-size: 16px;
  font-weight: 900;
}
.v.danger {
  color: rgb(var(--v-theme-error));
}
.ps-hint {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  opacity: 0.9;
}
@media (max-width: 900px) {
  .ps-grid {
    grid-template-columns: 1fr;
  }
}
</style>