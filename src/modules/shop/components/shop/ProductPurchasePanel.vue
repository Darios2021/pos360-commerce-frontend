<!-- ✅ COPY-PASTE FINAL COMPLETO (SIDEBAR ML, 1 COLUMNA, NO DUPLICA) -->
<!-- src/modules/shop/components/ProductPurchasePanel.vue -->
<template>
  <v-card class="ml-side info" variant="flat">
    <v-card-text class="ml-pad">
      <!-- Condición + vendidos -->
      <div class="ml-muted mb-2">
        {{ conditionLabel }}
        <span v-if="soldCountLabel"> | {{ soldCountLabel }}</span>
      </div>

      <!-- Título -->
      <div class="ml-title">
        {{ product?.name || "—" }}
      </div>

      <!-- Rating (si viene) -->
      <div v-if="showRating" class="ml-rating">
        <v-rating
          :model-value="ratingValue"
          density="compact"
          size="16"
          readonly
          half-increments
          color="amber"
        />
        <span class="ml-rating-num">{{ ratingValue.toFixed(1) }}</span>
        <span class="ml-rating-count">({{ ratingCount }})</span>
      </div>

      <!-- Precio -->
      <div class="ml-price-wrap">
        <span class="ml-currency">$</span>
        <span class="ml-price-int">{{ priceInt }}</span>
        <span v-if="priceDec" class="ml-price-dec">{{ priceDec }}</span>
      </div>

      <!-- ✅ Este link ahora hace scroll al bloque de medios de pago (ShopProduct.vue) -->
      <a href="javascript:void(0)" class="ml-link mb-3" @click.prevent="emit('go-payments')">
        Ver los medios de pago
      </a>

      <!-- Bloque envío / retiro -->
      <div class="ship-box">
        <div class="ship-title">
          <span class="ml-green">{{ shippingText }}</span>
          <span v-if="shippingEtaText" class="ml-muted"> {{ shippingEtaText }}</span>
        </div>

        <a href="javascript:void(0)" class="ml-link">Más detalles y formas de entrega</a>
        <div class="ml-muted mt-1">Retirá en sucursal al finalizar la compra</div>
        <a href="javascript:void(0)" class="ml-link">Ver en el mapa</a>
      </div>

      <v-divider class="my-4" />

      <!-- Stock -->
      <div class="ml-stock">
        <div class="ml-stock-title">Stock disponible</div>
        <div class="ml-muted">{{ stockSubLabel }}</div>
      </div>

      <!-- Cantidad -->
      <div class="ml-qty">
        <div class="ml-qty-row">
          <span class="ml-strong">Cantidad:</span>
          <span class="ml-muted ml-qty-hint">{{ qtyHint }}</span>
        </div>

        <v-select
          v-model="qty"
          :items="qtyItems"
          density="compact"
          variant="outlined"
          hide-details
          class="ml-qty-select"
          :disabled="disabledAdd || qtyItems.length <= 1"
        />
      </div>

      <!-- Acciones -->
      <div class="ml-actions">
        <v-btn
          class="ml-btn"
          color="primary"
          size="large"
          block
          :disabled="disabledAdd"
          @click="onBuyNow"
        >
          Comprar ahora
        </v-btn>

        <v-btn
          class="ml-btn"
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

      <!-- Cuotas -->
      <div v-if="installments.length" class="ml-installments">
        <div class="ml-installments-title">Cuotas</div>

        <div class="inst-grid">
          <div v-for="it in installments" :key="it.n" class="inst-item">
            <div class="inst-n">{{ it.n }}x</div>
            <div class="inst-val">$ {{ fmtMoney(it.amount) }}</div>
            <div class="inst-note">{{ it.label }}</div>
          </div>
        </div>

        <div class="ml-footnote">Elegís sucursal al finalizar si es retiro.</div>
      </div>

      <!-- Descripción (debajo, opcional) -->
      <div v-if="descText" class="ml-desc">
        <div class="ml-desc-title">Descripción</div>
        <div class="ml-desc-text" :class="{ clamp: !descOpen }">
          {{ descText }}
        </div>
        <a
          v-if="descCanToggle"
          class="ml-link"
          href="javascript:void(0)"
          @click.prevent="descOpen = !descOpen"
        >
          {{ descOpen ? "Ver menos" : "Ver más" }}
        </a>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  product: { type: Object, default: null },
});
const emit = defineEmits(["add", "buy", "go-payments"]);

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

const price = computed(() => priceValue(props.product));
const priceInt = computed(() => {
  const v = toNum(price.value, 0);
  const [i] = v.toFixed(2).split(".");
  return fmtMoney(i);
});
const priceDec = computed(() => {
  const v = toNum(price.value, 0);
  const parts = v.toFixed(2).split(".");
  const dec = parts?.[1] || "";
  return dec === "00" ? "" : dec;
});

const disabledAdd = computed(() => {
  const p = props.product || {};
  return !!(p.track_stock && Number(p.stock_qty) <= 0);
});

const conditionLabel = computed(() => {
  const p = props.product || {};
  const c = asText(p.condition || p.estado);
  if (c) return c.charAt(0).toUpperCase() + c.slice(1);
  if (p.is_new === true) return "Nuevo";
  if (p.is_new === false) return "Usado";
  return "Nuevo";
});

const soldCountLabel = computed(() => {
  const p = props.product || {};
  const v = toNum(p.sold_count ?? p.vendidos ?? p.sold ?? 0, 0);
  return v > 0 ? `+${v} vendidos` : "";
});

const ratingValue = computed(() => {
  const p = props.product || {};
  return Math.max(0, Math.min(5, toNum(p.rating ?? p.stars ?? 0, 0)));
});
const ratingCount = computed(() => {
  const p = props.product || {};
  return Math.max(0, Math.floor(toNum(p.rating_count ?? p.reviews_count ?? p.reviews ?? 0, 0)));
});
const showRating = computed(() => ratingValue.value > 0 && ratingCount.value > 0);

const shippingText = computed(() => {
  const p = props.product || {};
  return asText(
    p.shipping_text ||
      p.shippingTitle ||
      (p.free_shipping ? "Llega gratis" : "Llega entre 24 y 72 hs")
  );
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
const qty = ref(1);
const descOpen = ref(false);

watch(
  () => props.product,
  () => {
    qty.value = 1;
    descOpen.value = false;
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
  return [
    { n: 1, amount: base, label: "Pago único" },
    { n: 3, amount: base / 3, label: "Estimado" },
    { n: 6, amount: base / 6, label: "Estimado" },
  ];
}
const installments = computed(() => extractInstallments(props.product));

// descripción
const descText = computed(() => {
  const p = props.product || {};
  const t = asText(p.description || p.long_description || p.detail || p.details || "");
  return t.replace(/\s+/g, " ").trim();
});
const descCanToggle = computed(() => descText.value.length > 180);

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
.ml-side {
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
}
.ml-pad { padding: 18px; }

/* ✅ CLAVE anti “texto vertical” */
.ml-side, .ml-side * {
  word-break: normal !important;
  overflow-wrap: normal !important;
  white-space: normal !important;
}

.ml-muted { color: rgba(0,0,0,.6); font-size: 13px; }
.ml-strong { font-weight: 900; color: rgba(0,0,0,.9); }

.ml-title {
  font-size: 22px;
  font-weight: 900;
  line-height: 1.15;
  margin-bottom: 8px;
}

.ml-rating { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.ml-rating-num { font-size: 13px; font-weight: 900; color: rgba(0,0,0,.75); }
.ml-rating-count { font-size: 13px; color: rgba(0,0,0,.55); }

.ml-price-wrap {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: nowrap;
  white-space: nowrap;
  margin-bottom: 4px;
}
.ml-currency { font-size: 22px; font-weight: 900; }
.ml-price-int { font-size: 46px; font-weight: 900; letter-spacing: -0.5px; line-height: 1.05; }
.ml-price-dec { font-size: 16px; font-weight: 900; margin-top: 10px; opacity: .9; }

.ml-link {
  color: #1a73e8;
  text-decoration: none;
  font-weight: 900;
  cursor: pointer;
}
.ml-link:hover { text-decoration: underline; }

.ship-box {
  border: 1px solid rgba(0,0,0,.10);
  border-radius: 14px;
  padding: 12px;
  background: rgba(0,0,0,.01);
  margin-top: 10px;
}
.ship-title { font-size: 16px; font-weight: 900; line-height: 1.2; margin-bottom: 6px; }
.ml-green { color: #00a650; }

.ml-stock-title { font-size: 15px; font-weight: 900; margin-bottom: 2px; }
.ml-qty { margin-top: 14px; }
.ml-qty-row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
.ml-qty-hint { font-size: 12px; }
.ml-qty-select { border-radius: 12px; }

.ml-actions { margin-top: 14px; display: grid; gap: 10px; }
.ml-btn { border-radius: 12px; font-weight: 900; text-transform: none; }

.ml-installments { margin-top: 16px; }
.ml-installments-title { font-size: 14px; font-weight: 900; margin-bottom: 8px; }
.inst-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.inst-item { border: 1px solid rgba(0,0,0,.12); border-radius: 14px; padding: 10px; background: rgba(0,0,0,.02); }
.inst-n { font-weight: 900; font-size: 12px; }
.inst-val { font-weight: 900; font-size: 14px; margin-top: 2px; }
.inst-note { font-size: 11px; opacity: .7; margin-top: 2px; }
.ml-footnote { margin-top: 12px; font-size: 12px; color: rgba(0,0,0,.55); }

.ml-desc { margin-top: 16px; }
.ml-desc-title { font-size: 14px; font-weight: 900; margin-bottom: 6px; }
.ml-desc-text { font-size: 13px; color: rgba(0,0,0,.78); line-height: 1.45; }
.ml-desc-text.clamp {
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 980px) {
  .inst-grid { grid-template-columns: 1fr; }
  .ml-price-int { font-size: 40px; }
}
</style>
