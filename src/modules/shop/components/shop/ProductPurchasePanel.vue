<!-- ✅ COPY-PASTE FINAL COMPLETO (SIDEBAR ML, 1 COLUMNA, SOLO INFO REAL + precio ML + cuotas segun umbral) -->
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

      <!-- Marca + Modelo -->
      <div v-if="brandModelLine" class="ml-brandmodel">
        {{ brandModelLine }}
      </div>

      <!-- ✅ Descripción (UNA SOLA: arriba) -->
      <div v-if="shortDesc" class="ml-shortdesc">
        {{ shortDesc }}
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

      <!-- ✅ Precio estilo ML -->
      <div class="ml-price-block">
        <!-- Precio lista + OFF -->
        <div v-if="hasDiscount" class="ml-price-top">
          <span class="ml-price-list">$ {{ fmtMoney(priceList) }}</span>
          <span class="ml-discount-badge">{{ discountPct }}% OFF</span>
        </div>

        <!-- Precio final -->
        <div class="ml-price-wrap">
          <span class="ml-currency">$</span>
          <span class="ml-price-int">{{ priceInt }}</span>
          <span v-if="priceDec" class="ml-price-dec">{{ priceDec }}</span>
        </div>

        <!-- ✅ Cuotas chicas: 3x < 400k | 6x >= 400k (desde precio LISTA) -->
        <div v-if="installmentHint" class="ml-installment-hint">
          {{ installmentHint }}
        </div>
      </div>

      <v-divider class="my-4" />

      <!-- Stock -->
      <div class="ml-stock">
        <div class="ml-stock-title">Stock disponible</div>
        <div class="ml-muted">
          <span v-if="trackStock">{{ stockQtyLabel }}</span>
          <span v-else>Disponible</span>
        </div>
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
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  product: { type: Object, default: null },
});
const emit = defineEmits(["add", "buy"]);

/* ================= utils ================= */
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
function cleanOneLine(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

/* ================= precios =================
   - priceList: lista (tachado)
   - priceFinal: con descuento (grande)
*/
const priceList = computed(() =>
  Math.max(toNum(props.product?.price_list, 0), toNum(props.product?.price, 0))
);

const priceFinal = computed(() =>
  Math.max(toNum(props.product?.price_discount, 0), toNum(props.product?.price, 0))
);

const hasDiscount = computed(() => priceList.value > 0 && priceFinal.value < priceList.value);

const discountPct = computed(() => {
  if (!hasDiscount.value) return 0;
  return Math.round(((priceList.value - priceFinal.value) / priceList.value) * 100);
});

const priceInt = computed(() => {
  const [i] = priceFinal.value.toFixed(2).split(".");
  return fmtMoney(i);
});
const priceDec = computed(() => {
  const d = priceFinal.value.toFixed(2).split(".")[1];
  return d === "00" ? "" : d;
});

/* ✅ cuotas segun umbral (desde precio LISTA) */
const INSTALLMENTS_THRESHOLD = 400000; // 400k

const installmentHint = computed(() => {
  const base = priceList.value;
  if (!base || base <= 0) return "";

  const n = base >= INSTALLMENTS_THRESHOLD ? 6 : 3;
  const per = base / n;

  return `En ${n}x $ ${fmtMoney(per)}`;
});

/* ================= labels ================= */
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

/* rating (si viene) */
const ratingValue = computed(() => {
  const p = props.product || {};
  return Math.max(0, Math.min(5, toNum(p.rating ?? p.stars ?? 0, 0)));
});
const ratingCount = computed(() => {
  const p = props.product || {};
  return Math.max(0, Math.floor(toNum(p.rating_count ?? p.reviews_count ?? p.reviews ?? 0, 0)));
});
const showRating = computed(() => ratingValue.value > 0 && ratingCount.value > 0);

/* ================= marca / modelo / desc (BD) ================= */
const brandText = computed(() => {
  const p = props.product || {};
  return asText(p.brand_name || p.Brand?.name || p.brand || p.marca || "");
});
const modelText = computed(() => {
  const p = props.product || {};
  return asText(p.model || p.model_name || p.modelo || p.model_code || "");
});
const brandModelLine = computed(() => {
  const b = brandText.value;
  const m = modelText.value;
  if (b && m) return `${b} · ${m}`;
  return b || m || "";
});

/* ✅ única descripción (arriba) */
const shortDesc = computed(() => {
  const p = props.product || {};
  const raw =
    asText(p.short_description) ||
    asText(p.short_desc) ||
    asText(p.subtitle) ||
    asText(p.description) ||
    "";
  return cleanOneLine(raw);
});

/* ================= stock / qty ================= */
const trackStock = computed(() => !!props.product?.track_stock);
const stockQty = computed(() => Math.max(0, Math.floor(toNum(props.product?.stock_qty ?? 0, 0))));

const stockQtyLabel = computed(() => {
  if (!trackStock.value) return "Disponible";
  const s = stockQty.value;
  if (s <= 0) return "Sin stock";
  if (s === 1) return "Queda 1 unidad";
  return `${s} unidades`;
});

const disabledAdd = computed(() => {
  const p = props.product || {};
  return !!(p.track_stock && Number(p.stock_qty) <= 0);
});

/* qty */
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
  const limit = maxQty.value;

  if (p.track_stock) {
    const s = Math.max(0, Math.floor(toNum(p.stock_qty ?? 0, 0)));
    if (s <= 0) return "Sin stock";

    const limTxt = limit <= 2 ? "Podés comprar hasta 2 unidades" : `Podés comprar hasta ${limit} unidades`;
    return s > limit ? `${s} disponibles · ${limTxt}` : `${s} disponibles`;
  }

  return limit <= 2 ? "Podés comprar hasta 2 unidades" : `Podés comprar hasta ${limit} unidades`;
});

/* ================= actions ================= */
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

/* ✅ anti “texto vertical” */
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
  margin-bottom: 6px;
}

.ml-brandmodel{
  font-size: 13px;
  font-weight: 900;
  color: rgba(0,0,0,.72);
  margin-bottom: 6px;
}

.ml-shortdesc{
  font-size: 13px;
  color: rgba(0,0,0,.72);
  line-height: 1.35;
  margin-bottom: 10px;

  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ===== Precio estilo ML ===== */
.ml-price-block { margin-bottom: 6px; }

.ml-price-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 2px;
}

.ml-price-list {
  font-size: 14px;
  color: rgba(0,0,0,.55);
  text-decoration: line-through;
  font-weight: 700;
}

.ml-discount-badge {
  font-size: 13px;
  font-weight: 900;
  color: #00a650;
}

.ml-price-wrap {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: nowrap;
  white-space: nowrap;
  margin-bottom: 2px;
}
.ml-currency { font-size: 22px; font-weight: 900; }
.ml-price-int { font-size: 46px; font-weight: 900; letter-spacing: -0.5px; line-height: 1.05; }
.ml-price-dec { font-size: 16px; font-weight: 900; margin-top: 10px; opacity: .9; }

.ml-installment-hint {
  font-size: 13px;
  font-weight: 700;
  color: #00a650;
  margin-top: 2px;
}

/* Stock / qty */
.ml-stock-title { font-size: 15px; font-weight: 900; margin-bottom: 2px; }
.ml-qty { margin-top: 14px; }
.ml-qty-row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
.ml-qty-hint { font-size: 12px; }
.ml-qty-select { border-radius: 12px; }

/* Botones */
.ml-actions { margin-top: 14px; display: grid; gap: 10px; }
.ml-btn { border-radius: 12px; font-weight: 900; text-transform: none; }

@media (max-width: 980px) {
  .ml-price-int { font-size: 40px; }
}
</style>
