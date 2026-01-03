<!-- src/modules/shop/components/ProductPurchasePanel.vue -->
<template>
  <v-card class="rounded-xl info" variant="outlined">
    <v-card-text>
      <div class="text-h6 font-weight-bold mb-2">{{ product?.name || "—" }}</div>

      <div class="text-body-2 text-medium-emphasis mb-3">
        {{ product?.description || "—" }}
      </div>

      <div class="price mb-2">
        $ {{ fmtMoney(price) }}
      </div>

      <!-- Cuotas -->
      <div v-if="installments.length" class="installments">
        <div class="text-caption text-medium-emphasis mb-1">Cuotas</div>

        <div class="inst-grid">
          <div v-for="it in installments" :key="it.n" class="inst-item">
            <div class="inst-n">{{ it.n }}x</div>
            <div class="inst-val">$ {{ fmtMoney(it.amount) }}</div>
            <div class="inst-note">{{ it.label }}</div>
          </div>
        </div>
      </div>

      <div class="text-caption mb-4 mt-3">
        <span v-if="product?.track_stock">Stock: {{ Number(product?.stock_qty || 0) }}</span>
        <span v-else>Stock: ∞</span>
      </div>

      <div class="d-flex ga-2 flex-wrap">
        <v-btn
          color="primary"
          size="large"
          :disabled="disabledAdd"
          @click="$emit('add', product, 1)"
        >
          Agregar al carrito
        </v-btn>

        <v-btn to="/shop/cart" variant="tonal" size="large">
          Ir al carrito
        </v-btn>
      </div>

      <v-divider class="my-4" />

      <div class="text-caption text-medium-emphasis">
        Elegís sucursal al finalizar si es retiro.
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  product: { type: Object, default: null },
});

defineEmits(["add"]);

function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(Number(v || 0)));
}

function priceValue(p) {
  const d = Number(p?.price_discount || 0);
  if (d > 0) return d;
  const l = Number(p?.price_list || 0);
  if (l > 0) return l;
  return Number(p?.price || 0);
}

const price = computed(() => priceValue(props.product));

const disabledAdd = computed(() => {
  const p = props.product || {};
  return !!(p.track_stock && Number(p.stock_qty) <= 0);
});

/**
 * Lee cuotas desde backend si existen (varios formatos posibles),
 * y si no existen, calcula 3 y 6 como price/n.
 *
 * Formatos que soporta:
 * - product.installments: [{ n:3, amount: 1234, label:"sin interés" }, ...]
 * - product.cuotas: [{...}]
 * - product.installments_3 / installments_6
 * - product.cuota_3 / cuota_6
 * - product.installment_amount_3 / installment_amount_6
 */
function extractInstallments(p) {
  if (!p) return [];

  const list =
    (Array.isArray(p.installments) && p.installments) ||
    (Array.isArray(p.cuotas) && p.cuotas) ||
    null;

  if (list) {
    const normalized = list
      .map((it) => {
        const n = Number(it?.n ?? it?.cuotas ?? it?.qty ?? it?.q ?? 0);
        const amount = Number(it?.amount ?? it?.monto ?? it?.value ?? 0);
        const label = String(it?.label ?? it?.detalle ?? it?.note ?? "—");
        if (!n || !Number.isFinite(amount) || amount <= 0) return null;
        return { n, amount, label };
      })
      .filter(Boolean)
      .sort((a, b) => a.n - b.n);

    // Aseguramos 1x también
    const has1 = normalized.some((x) => x.n === 1);
    if (!has1) normalized.unshift({ n: 1, amount: priceValue(p), label: "Pago único" });
    return normalized;
  }

  const p3 =
    Number(p.installments_3 || p.cuota_3 || p.installment_amount_3 || 0) ||
    0;
  const p6 =
    Number(p.installments_6 || p.cuota_6 || p.installment_amount_6 || 0) ||
    0;

  const base = priceValue(p);
  const out = [{ n: 1, amount: base, label: "Pago único" }];

  if (p3 > 0) out.push({ n: 3, amount: p3, label: "3 cuotas" });
  if (p6 > 0) out.push({ n: 6, amount: p6, label: "6 cuotas" });

  // Fallback calculado si no vino nada (pero mostramos 3 y 6 igual)
  if (out.length === 1 && base > 0) {
    out.push(
      { n: 3, amount: base / 3, label: "Estimado" },
      { n: 6, amount: base / 6, label: "Estimado" }
    );
  }

  return out;
}

const installments = computed(() => extractInstallments(props.product));
</script>

<style scoped>
.price {
  font-size: 34px;
  font-weight: 900;
  line-height: 1.1;
}

.installments {
  margin-top: 10px;
}
.inst-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.inst-item {
  border: 1px solid rgba(0,0,0,.10);
  border-radius: 14px;
  padding: 10px;
  background: rgba(0,0,0,.02);
}
.inst-n {
  font-weight: 900;
  font-size: 12px;
}
.inst-val {
  font-weight: 900;
  font-size: 14px;
  margin-top: 2px;
}
.inst-note {
  font-size: 11px;
  opacity: .7;
  margin-top: 2px;
}

@media (max-width: 980px) {
  .price { font-size: 30px; }
  .inst-grid { grid-template-columns: 1fr; }
}
</style>
