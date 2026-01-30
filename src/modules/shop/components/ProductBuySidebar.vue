<!-- ✅ COPY-PASTE FINAL -->
<!-- src/modules/shop/components/ProductBuySidebar.vue -->
<template>
  <v-card class="ms-card" variant="flat">
    <v-card-text class="ms-pad">
      <div class="ms-ship">
        <div class="ms-green">{{ shippingTitle }}</div>
        <a class="ms-link" href="javascript:void(0)">Más detalles y formas de entrega</a>

        <div class="ms-muted mt-1">
          Retirá en sucursal al finalizar la compra
        </div>

        <a class="ms-link mt-1" href="javascript:void(0)">Ver en el mapa</a>
      </div>

      <v-divider class="my-4" />

      <div class="ms-stock">
        <div class="ms-stock-title">Stock disponible</div>
        <div class="ms-muted">Listo para despachar</div>
      </div>

      <div class="ms-qty">
        <div class="ms-qty-row">
          <span class="ms-strong">Cantidad:</span>
          <span class="ms-muted">{{ qtyHint }}</span>
        </div>

        <v-select
          v-model="qty"
          :items="qtyItems"
          density="compact"
          variant="outlined"
          hide-details
          class="ms-select"
          :disabled="disabledAdd || qtyItems.length <= 1"
        />
      </div>

      <div class="ms-actions">
        <v-btn
          class="ms-btn"
          color="primary"
          size="large"
          block
          :disabled="disabledAdd"
          @click="onBuyNow"
        >
          Comprar ahora
        </v-btn>

        <v-btn
          class="ms-btn"
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

      <div v-if="installments.length" class="ms-installments">
        <div class="ms-inst-title">Cuotas</div>

        <div class="ms-inst-grid">
          <div v-for="it in installments" :key="it.n" class="ms-inst-item">
            <div class="ms-inst-n">{{ it.n }}x</div>
            <div class="ms-inst-val">$ {{ fmtMoney(it.amount) }}</div>
            <div class="ms-inst-note">{{ it.label }}</div>
          </div>
        </div>

        <div class="ms-footnote">Elegís sucursal al finalizar si es retiro.</div>
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

const qty = ref(1);
watch(
  () => props.product,
  () => {
    qty.value = 1;
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
  const stock = p.track_stock ? Math.max(0, Math.floor(toNum(p.stock_qty ?? 0, 0))) : 0;
  const extra = p.track_stock ? `(+${Math.max(0, stock - 1)} disponibles)` : "";
  const limit = maxQty.value;
  const limTxt = limit <= 2 ? "Podés comprar hasta 2 unidades" : `Podés comprar hasta ${limit} unidades`;
  return `${extra ? extra + " · " : ""}${limTxt}`;
});

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

    const has1 = normalized.some((x) => x.n === 1);
    if (!has1) normalized.unshift({ n: 1, amount: priceValue(p), label: "Pago único" });
    return normalized;
  }

  const base = priceValue(p);
  const out = [{ n: 1, amount: base, label: "Pago único" }];

  // fallback estimado
  if (base > 0) {
    out.push(
      { n: 3, amount: base / 3, label: "Estimado" },
      { n: 6, amount: base / 6, label: "Estimado" }
    );
  }

  return out;
}

const installments = computed(() => extractInstallments(props.product));

const shippingTitle = computed(() => {
  const p = props.product || {};
  return String(p.shipping_text || p.shippingTitle || "Llega entre 24 y 72 hs");
});

function onAddToCart() {
  if (disabledAdd.value) return;
  emit("add", props.product, qty.value);
}
function onBuyNow() {
  if (disabledAdd.value) return;
  emit("buy", props.product, qty.value);
}
</script>

<style scoped>
.ms-card {
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
  position: sticky;
  top: 16px;
}
.ms-pad { padding: 18px; }

.ms-green {
  color: #00a650;
  font-weight: 900;
  font-size: 16px;
}
.ms-muted {
  color: rgba(0,0,0,.62);
  font-size: 13px;
}
.ms-link {
  display: inline-block;
  color: #1a73e8;
  text-decoration: none;
  font-weight: 800;
  margin-top: 4px;
}
.ms-link:hover { text-decoration: underline; }

.ms-stock-title {
  font-weight: 900;
  font-size: 14px;
}

.ms-qty { margin-top: 14px; }
.ms-qty-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.ms-strong { font-weight: 900; }

.ms-select { border-radius: 12px; }

.ms-actions {
  margin-top: 14px;
  display: grid;
  gap: 10px;
}
.ms-btn {
  border-radius: 12px;
  font-weight: 900;
  text-transform: none;
}

.ms-installments { margin-top: 16px; }
.ms-inst-title {
  font-size: 14px;
  font-weight: 900;
  margin-bottom: 8px;
}
.ms-inst-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.ms-inst-item {
  border: 1px solid rgba(0,0,0,.10);
  border-radius: 14px;
  padding: 10px;
  background: rgba(0,0,0,.02);
}
.ms-inst-n { font-weight: 900; font-size: 12px; }
.ms-inst-val { font-weight: 900; font-size: 14px; margin-top: 2px; }
.ms-inst-note { font-size: 11px; opacity: .7; margin-top: 2px; }

.ms-footnote {
  margin-top: 10px;
  font-size: 12px;
  color: rgba(0,0,0,.55);
}

@media (max-width: 1200px) {
  .ms-card { position: static; top: auto; }
  .ms-inst-grid { grid-template-columns: 1fr; }
}
</style>
