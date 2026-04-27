<!-- ✅ COPY-PASTE FINAL COMPLETO (SIDEBAR ML, 1 COLUMNA, SOLO INFO REAL + precio ML + cuotas segun regla 150/300 y base LISTA) -->
<!-- src/modules/shop/components/shop/ProductPurchasePanel.vue -->
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

      <!-- 🏷️ Banner de PROMOCIÓN (sólo si is_promo + ventana vigente) -->
      <div v-if="promoOn" class="ml-promo-banner">
        <div class="ml-promo-banner-left">
          <v-icon size="18" color="white">mdi-tag-heart</v-icon>
          <span class="ml-promo-banner-title">PROMOCIÓN</span>
        </div>
        <div v-if="promoVigencia" class="ml-promo-banner-vig">
          {{ promoVigencia }}
        </div>
      </div>

      <!-- 📦 Hint promo por cantidad (si está configurado) -->
      <div v-if="promoOn && qtyPromoHint" class="ml-promo-qty-hint">
        <v-icon size="16">mdi-package-variant-closed</v-icon>
        <span>{{ qtyPromoHint }}</span>
      </div>

      <!-- ✅ Precio (estilo varía si es promo o cash discount) -->
      <div class="ml-price-block" :class="{ 'is-promo': promoOn }">
        <!-- Precio lista + OFF -->
        <div v-if="hasDiscount" class="ml-price-top">
          <span class="ml-price-list">$ {{ fmtMoney(priceList) }}</span>
          <span class="ml-discount-badge" :class="{ 'is-promo': promoOn }">
            {{ discountPct }}% OFF
          </span>
        </div>

        <!-- Precio final -->
        <div class="ml-price-wrap" :class="{ 'is-promo': promoOn }">
          <span class="ml-currency">$</span>
          <span class="ml-price-int">{{ priceInt }}</span>
          <span v-if="priceDec" class="ml-price-dec">{{ priceDec }}</span>
        </div>

        <!-- Ahorro destacado solo en promo -->
        <div v-if="promoOn && savingsAmount > 0" class="ml-promo-savings">
          Ahorrás <b>$ {{ fmtMoney(savingsAmount) }}</b>
        </div>

        <!-- ✅ Cuotas (siempre verde, no es promo) -->
        <div v-if="installmentHint" class="ml-installment-hint">
          {{ installmentHint }}
        </div>
      </div>

      <v-divider class="my-4" />

      <!-- Stock -->
      <div class="ml-stock">
        <div class="ml-stock-row">
          <div>
            <div class="ml-stock-title">Stock disponible</div>
            <div class="ml-muted">
              <span v-if="!trackStock">Disponible</span>
              <span v-else-if="totalStock <= 0" class="ml-stock-zero">Sin stock</span>
              <span v-else>
                <b>{{ totalStock }}</b> {{ totalStock === 1 ? 'unidad' : 'unidades' }} disponibles
              </span>
            </div>
          </div>
          <span
            v-if="trackStock && totalStock > 0"
            class="ml-stock-pill ml-stock-pill--ok"
          >
            En stock
          </span>
          <span
            v-else-if="trackStock && totalStock <= 0"
            class="ml-stock-pill ml-stock-pill--out"
          >
            Sin stock
          </span>
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
import { isPromoActive } from "@/modules/shop/utils/promo";

const props = defineProps({
  product: { type: Object, default: null },
});
const emit = defineEmits(["add", "buy", "go-payments"]);

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
   - priceFinal: con descuento o promo (grande)
   - promoOn: si is_promo y ventana vigente, manda promo_price (si existe)
*/
const promoOn = computed(() => isPromoActive(props.product || {}));

const priceList = computed(() =>
  Math.max(toNum(props.product?.price_list, 0), toNum(props.product?.price, 0))
);

const priceFinal = computed(() => {
  // 1) Si hay promo activa con promo_price, manda
  if (promoOn.value) {
    const pp = toNum(props.product?.promo_price, 0);
    if (pp > 0) return pp;
  }
  const d = toNum(props.product?.price_discount, 0);
  if (d > 0) return d;
  const l = toNum(props.product?.price_list, 0);
  if (l > 0) return l;
  return toNum(props.product?.price, 0);
});

const hasDiscount = computed(() => priceList.value > 0 && priceFinal.value < priceList.value);

const discountPct = computed(() => {
  if (!hasDiscount.value) return 0;
  return Math.round(((priceList.value - priceFinal.value) / priceList.value) * 100);
});

const savingsAmount = computed(() => {
  if (!hasDiscount.value) return 0;
  return Math.max(0, priceList.value - priceFinal.value);
});

const promoVigencia = computed(() => {
  if (!promoOn.value) return "";
  const e = props.product?.promo_ends_at;
  if (!e) return ""; // sin ventana → no decir "por tiempo limitado", puede ser solo qty
  const d = new Date(e);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `Vigente hasta ${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
});

// Hint para promo POR CANTIDAD (si está configurada)
const qtyPromoHint = computed(() => {
  const p = props.product || {};
  if (!promoOn.value) return "";
  const thr = Number(p.promo_qty_threshold) || 0;
  const disc = toNum(p.promo_qty_discount, 0);
  const mode = String(p.promo_qty_mode || "").toLowerCase();
  if (thr < 2 || disc <= 0) return "";
  if (mode === "percent") {
    return `Llevando ${thr} o más, obtenés ${disc}% OFF en cada unidad`;
  }
  return `Llevando ${thr} o más, ahorrás $ ${fmtMoney(disc)} por unidad`;
});

const priceInt = computed(() => {
  const [i] = priceFinal.value.toFixed(2).split(".");
  return fmtMoney(i);
});
const priceDec = computed(() => {
  const d = priceFinal.value.toFixed(2).split(".")[1];
  return d === "00" ? "" : d;
});

/* ✅ cuotas segun regla:
   - display > 300 => 6x
   - 150..300 => 3x
   - si no => sin cuotas
   - cálculo SIEMPRE sobre LISTA (si hay), sino sobre display
*/
const installmentsCount = computed(() => {
  const display = priceFinal.value; // lo que el usuario ve grande (descuento)
  if (!display || display <= 0) return 0;
  if (display > 300) return 6;
  if (display >= 150 && display <= 300) return 3;
  return 0;
});

const installmentHint = computed(() => {
  const n = installmentsCount.value;
  if (!n) return "";

  const base = priceList.value > 0 ? priceList.value : priceFinal.value; // ✅ base lista
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

// Total real (suma de todas las sucursales)
const totalStock = computed(() => {
  const p = props.product || {};
  const explicit = toNum(p.stock_total ?? p.stock_qty ?? 0, 0);
  if (Array.isArray(p.stock_by_branch) && p.stock_by_branch.length) {
    return p.stock_by_branch.reduce(
      (acc, r) => acc + Math.max(0, Math.floor(toNum(r?.qty ?? r?.stock_qty ?? 0, 0))),
      0
    );
  }
  return Math.max(0, Math.floor(explicit));
});

const disabledAdd = computed(() => {
  const p = props.product || {};
  if (!p.track_stock) return false;
  return totalStock.value <= 0;
});

/* qty */
const qty = ref(1);

watch(
  () => props.product,
  () => {
    qty.value = 1;
  }
);

// Sin tope artificial: si el producto trackea stock, max = stock real.
// Si no trackea, dejamos un techo alto (99) sólo para el dropdown.
const maxQty = computed(() => {
  const p = props.product || {};
  if (p.track_stock) {
    const stock = totalStock.value;
    return Math.max(1, stock || 1);
  }
  return 99;
});

const qtyItems = computed(() => {
  const m = maxQty.value;
  const out = [];
  for (let i = 1; i <= m; i++) out.push(i);
  return out;
});

const qtyHint = computed(() => {
  const p = props.product || {};
  if (p.track_stock) {
    const s = totalStock.value;
    if (s <= 0) return ""; // "Sin stock" ya se muestra en el bloque de arriba
    return `${s} ${s === 1 ? 'disponible' : 'disponibles'}`;
  }
  return "";
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

/* ===== Banner PROMO ===== */
.ml-promo-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 13px;
  margin-bottom: 12px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ff5722 0%, #ff9100 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(255, 87, 34, 0.30);
}
.ml-promo-banner-left {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}
.ml-promo-banner-title {
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 1.3px;
  text-transform: uppercase;
}
.ml-promo-banner-vig {
  font-size: 11px;
  font-weight: 700;
  opacity: 0.92;
  text-align: right;
  flex-shrink: 0;
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
  color: #00a650; /* verde = cash discount default */
}
/* Bordó cuando es promo real */
.ml-discount-badge.is-promo {
  color: #fff;
  background: #ff5722;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  letter-spacing: 0.4px;
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

/* Precio en bordó cuando es promo */
.ml-price-wrap.is-promo .ml-currency,
.ml-price-wrap.is-promo .ml-price-int,
.ml-price-wrap.is-promo .ml-price-dec {
  color: #ff5722;
}

.ml-promo-savings {
  font-size: 13px;
  font-weight: 800;
  color: #ff5722;
  margin-top: 2px;
  margin-bottom: 4px;
}

.ml-promo-qty-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 700;
  color: #ff5722;
  background: rgba(255, 87, 34, 0.10);
  border: 1px solid rgba(255, 87, 34, 0.28);
  padding: 7px 10px;
  border-radius: 8px;
  margin-bottom: 10px;
  line-height: 1.3;
}

.ml-installment-hint {
  font-size: 13px;
  font-weight: 700;
  color: #00a650;
  margin-top: 2px;
}

/* Stock / qty */
.ml-stock-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.ml-stock-title { font-size: 15px; font-weight: 900; margin-bottom: 2px; }
.ml-stock-zero { color: #d23f3f; font-weight: 700; }

.ml-stock-pill {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 9px;
  border-radius: 999px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  flex-shrink: 0;
  margin-top: 2px;
}
.ml-stock-pill--ok {
  background: rgba(0, 166, 80, 0.12);
  color: #00a650;
  border: 1px solid rgba(0, 166, 80, 0.25);
}
.ml-stock-pill--out {
  background: rgba(210, 63, 63, 0.10);
  color: #d23f3f;
  border: 1px solid rgba(210, 63, 63, 0.25);
}

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
