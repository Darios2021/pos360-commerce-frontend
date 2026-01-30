<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/ProductPurchaseSidebar.vue -->
<template>
  <v-card class="ps-card" variant="flat">
    <v-card-text class="ps-pad">
      <div class="ship">
        <div class="ship-title">
          <span class="ps-green">{{ shippingText }}</span>
          <span v-if="shippingEtaText" class="ps-muted"> {{ shippingEtaText }}</span>
        </div>

        <a href="javascript:void(0)" class="ps-link">Más detalles y formas de entrega</a>
        <div class="ps-muted mt-1">Retirá en sucursal al finalizar la compra</div>
        <a href="javascript:void(0)" class="ps-link">Ver en el mapa</a>
      </div>

      <v-divider class="my-4" />

      <div class="stock">
        <div class="stock-title">Stock disponible</div>
        <div class="ps-muted">{{ stockSubLabel }}</div>
      </div>

      <div class="qty">
        <div class="qty-top">
          <span class="ps-strong">Cantidad:</span>
          <span class="ps-muted qty-hint">{{ qtyHint }}</span>
        </div>

        <v-select
          v-model="qtyVal"
          :items="qtyItems"
          density="compact"
          variant="outlined"
          hide-details
          class="qty-select"
          :disabled="disabledAdd || qtyItems.length <= 1"
        />
      </div>

      <div class="actions">
        <v-btn
          class="ps-btn"
          color="primary"
          size="large"
          block
          :disabled="disabledAdd"
          @click="onBuyNow"
        >
          Comprar ahora
        </v-btn>

        <v-btn
          class="ps-btn"
          variant="tonal"
          size="large"
          block
          :disabled="disabledAdd"
          @click="onAddToCart"
        >
          <v-icon start>mdi-cart-outline</v-icon>
          Agregar al carrito
        </v-btn>
      </div>

      <div v-if="installments.length" class="inst">
        <div class="inst-title">Cuotas</div>
        <div class="inst-grid">
          <div v-for="it in installments" :key="it.n" class="inst-item">
            <div class="inst-n">{{ it.n }}x</div>
            <div class="inst-val">$ {{ fmtMoney(it.amount) }}</div>
            <div class="inst-note">{{ it.label }}</div>
          </div>
        </div>
        <div class="ps-footnote">Elegís sucursal al finalizar si es retiro.</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  product: { type: Object, default: null },
});
const emit = defineEmits(["add", "buy"]);

function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(Number(v || 0)));
}
function toNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function asText(v) {
  const s = String(v ?? "").trim();
  return s ? s : "";
}
function priceValue(p) {
  const d = Number(p?.price_discount || 0);
  if (d > 0) return d;
  const l = Number(p?.price_list || 0);
  if (l > 0) return l;
  return Number(p?.price || 0);
}

const disabledAdd = computed(() => {
  const p = props.product || {};
  return !!(p.track_stock && Number(p.stock_qty) <= 0);
});

const shippingText = computed(() => {
  const p = props.product || {};
  return asText(p.shipping_text || p.shippingTitle || (p.free_shipping ? "Llega gratis" : "Llega entre 24 y 72 hs"));
});
const shippingEtaText = computed(() => {
  const p = props.product || {};
  return asText(p.shipping_eta || p.shippingEta || p.eta_text || "");
});

const stockSubLabel = computed(() => {
  const p = props.product || {};
  const shipBy = asText(p.fulfillment_label || p.shipped_by || "");
  if (shipBy) return shipBy;
  return "Listo para despachar";
});

// qty
const qtyVal = ref(1);
watch(
  () => props.product,
  () => {
    qtyVal.value = 1;
  }
);

const maxQty = computed(() => {
  const p = props.product || {};
  const limit = Math.max(1, Math.floor(toNum(p.max_qty ?? p.max_purchase_qty ?? 2, 2)));
  if (p.track_stock) {
    const stock = Math.max(0, Math.floor(toNum(p.stock_qty ?? 0, 0)));
    return Math.max(1, Math.min(limit, stock || 1));
  }
  return limit;
});

const qtyItems = computed(() => {
  const m = maxQty.value;
  const out = [];
  for (let i = 1; i <= m; i++) out.push(i);
  return out;
});

const qtyHint = computed(() => {
  const p = props.product || {};
  const extra = p.track_stock
    ? `(+${Math.max(0, Math.floor(toNum(p.stock_qty ?? 0, 0)) - 1)} disponibles)`
    : "";
  const limit = maxQty.value;
  const limTxt = limit <= 2 ? "Podés comprar hasta 2 unidades" : `Podés comprar hasta ${limit} unidades`;
  return `${extra ? extra + " · " : ""}${limTxt}`;
});

// cuotas
function extractInstallments(p) {
  if (!p) return [];
  const list =
    (Array.isArray(p.installments) && p.installments) ||
    (Array.isArray(p.cuotas) && p.cuotas) ||
    null;

  if (list) {
    return list
      .map((it) => {
        const n = Number(it?.n ?? it?.cuotas ?? it?.qty ?? it?.q ?? 0);
        const amount = Number(it?.amount ?? it?.monto ?? it?.value ?? 0);
        const label = String(it?.label ?? it?.detalle ?? it?.note ?? "—");
        if (!n || !Number.isFinite(amount) || amount <= 0) return null;
        return { n, amount, label };
      })
      .filter(Boolean)
      .sort((a, b) => a.n - b.n)
      .slice(0, 3);
  }

  const base = priceValue(p);
  return [
    { n: 1, amount: base, label: "Pago único" },
    { n: 3, amount: base / 3, label: "Estimado" },
    { n: 6, amount: base / 6, label: "Estimado" },
  ];
}
const installments = computed(() => extractInstallments(props.product));

function onAddToCart() {
  if (disabledAdd.value) return;
  emit("add", props.product, qtyVal.value);
}
function onBuyNow() {
  if (disabledAdd.value) return;
  emit("buy", props.product, qtyVal.value);
}
</script>

<style scoped>
.ps-card {
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
  position: sticky;
  top: 18px;
}
.ps-pad { padding: 16px; }

.ps-muted { color: rgba(0,0,0,.6); font-size: 13px; }
.ps-strong { font-weight: 900; color: rgba(0,0,0,.9); }
.ps-link { color: #1a73e8; text-decoration: none; font-weight: 900; }
.ps-link:hover { text-decoration: underline; }
.ps-green { color: #00a650; }

.ship-title { font-size: 16px; font-weight: 900; line-height: 1.2; margin-bottom: 6px; }
.stock-title { font-size: 15px; font-weight: 900; margin-bottom: 2px; }

.qty { margin-top: 12px; }
.qty-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
.qty-hint { font-size: 12px; }
.qty-select { border-radius: 12px; }

.actions { margin-top: 14px; display: grid; gap: 10px; }
.ps-btn { border-radius: 12px; font-weight: 900; text-transform: none; }

.inst { margin-top: 16px; }
.inst-title { font-size: 14px; font-weight: 900; margin-bottom: 8px; }
.inst-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.inst-item { border: 1px solid rgba(0,0,0,.12); border-radius: 14px; padding: 10px; background: rgba(0,0,0,.02); }
.inst-n { font-weight: 900; font-size: 12px; }
.inst-val { font-weight: 900; font-size: 14px; margin-top: 2px; }
.inst-note { font-size: 11px; opacity: .7; margin-top: 2px; }

.ps-footnote { margin-top: 10px; font-size: 12px; color: rgba(0,0,0,.55); }

@media (max-width: 1200px) {
  .ps-card { position: static; top: auto; }
  .inst-grid { grid-template-columns: 1fr; }
}
</style>
