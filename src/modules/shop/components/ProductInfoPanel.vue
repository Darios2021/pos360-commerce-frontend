<!-- ✅ COPY-PASTE FINAL -->
<!-- src/modules/shop/components/ProductInfoPanel.vue -->
<template>
  <v-card class="mi-card" variant="flat">
    <v-card-text class="mi-pad">
      <div class="mi-top">
        <span class="mi-muted">{{ conditionLabel }}</span>
        <span v-if="soldLabel" class="mi-muted"> | {{ soldLabel }}</span>

        <v-spacer />

        <v-btn icon variant="text" size="small" class="mi-fav" aria-label="Favorito">
          <v-icon>mdi-heart-outline</v-icon>
        </v-btn>
      </div>

      <div class="mi-title">{{ product?.name || "—" }}</div>

      <div v-if="showRating" class="mi-rating">
        <v-rating
          :model-value="ratingValue"
          density="compact"
          size="16"
          readonly
          half-increments
          color="amber"
        />
        <span class="mi-rating-num">{{ ratingValue.toFixed(1) }}</span>
        <span class="mi-rating-count">({{ ratingCount }})</span>
      </div>

      <!-- Badge promo -->
      <div v-if="promoActive" class="mi-promo-badge">
        <v-icon size="14">mdi-tag-heart</v-icon>
        Producto en promoción
      </div>

      <!-- Precio anterior tachado -->
      <div v-if="oldPriceVisible" class="mi-old-price">
        $ {{ fmtMoney(oldPrice) }}
      </div>

      <div class="mi-price">
        <span class="mi-currency">$</span>
        <span class="mi-price-int">{{ priceInt }}</span>
        <span v-if="priceDec" class="mi-price-dec">{{ priceDec }}</span>
        <span v-if="offPct > 0" class="mi-off">{{ offPct }}% OFF</span>
      </div>

      <!-- Hint de promo por cantidad -->
      <div v-if="qtyPromoHint" class="mi-qty-promo">
        <v-icon size="16" color="primary">mdi-package-variant-closed</v-icon>
        {{ qtyPromoHint }}
      </div>

      <!-- Vigencia de la promo por tiempo -->
      <div v-if="promoEndsLabel" class="mi-promo-ends">
        <v-icon size="14">mdi-clock-outline</v-icon>
        {{ promoEndsLabel }}
      </div>

      <a class="mi-link" href="javascript:void(0)" @click.prevent="emit('go-payments')">
        Ver los medios de pago
      </a>

      <div class="mi-know">
        <div class="mi-know-title">Lo que tenés que saber de este producto</div>
        <ul class="mi-know-list">
          <li v-for="(b, i) in bullets" :key="i">{{ b }}</li>
        </ul>
      </div>

      <!-- ✅ Tabs: Descripción / Detalles -->
      <ProductDetailsTabs :product="product" />
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from "vue";
import ProductDetailsTabs from "@/modules/shop/components/ProductDetailsTabs.vue";
import { isPromoActive as _isPromoActive } from "@/modules/shop/utils/promo";

const props = defineProps({
  product: { type: Object, default: null },
});
const emit = defineEmits(["go-payments"]);

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

/* promo activa (respeta ventana temporal) */
const promoActive = computed(() => _isPromoActive(props.product || {}));

function priceValue(p) {
  // Si hay promo por tiempo activa con promo_price > 0 → manda
  if (promoActive.value) {
    const pp = Number(p?.promo_price || 0);
    if (pp > 0) return pp;
  }
  const d = Number(p?.price_discount || 0);
  if (d > 0) return d;
  const l = Number(p?.price_list || 0);
  if (l > 0) return l;
  return Number(p?.price || 0);
}

const price = computed(() => priceValue(props.product));

const oldPrice = computed(() => {
  const p = props.product || {};
  const l = Number(p.price_list || 0);
  return l > 0 ? l : Number(p.price || 0);
});
const oldPriceVisible = computed(() => oldPrice.value > 0 && oldPrice.value > price.value);
const offPct = computed(() => {
  if (!oldPriceVisible.value) return 0;
  return Math.round(((oldPrice.value - price.value) / oldPrice.value) * 100);
});

const qtyPromoHint = computed(() => {
  const p = props.product || {};
  if (!promoActive.value) return "";
  const thr = Number(p.promo_qty_threshold) || 0;
  const disc = Number(p.promo_qty_discount) || 0;
  const mode = String(p.promo_qty_mode || "").toLowerCase();
  if (thr < 2 || disc <= 0) return "";
  if (mode === "percent") {
    return `Llevando ${thr} o más, obtenés ${disc}% OFF en cada unidad`;
  }
  return `Llevando ${thr} o más, ahorrás $ ${fmtMoney(disc)} por unidad`;
});

const promoEndsLabel = computed(() => {
  const p = props.product || {};
  if (!promoActive.value) return "";
  const e = p.promo_ends_at ? new Date(p.promo_ends_at) : null;
  if (!e || !Number.isFinite(e.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `Promoción válida hasta ${pad(e.getDate())}/${pad(e.getMonth() + 1)} ${pad(e.getHours())}:${pad(e.getMinutes())}`;
});

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

const conditionLabel = computed(() => {
  const p = props.product || {};
  const c = asText(p.condition || p.estado);
  if (c) return c.charAt(0).toUpperCase() + c.slice(1);
  if (p.is_new === true) return "Nuevo";
  if (p.is_new === false) return "Usado";
  return "Nuevo";
});

const soldLabel = computed(() => {
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

const bullets = computed(() => {
  const p = props.product || {};
  const out = [];

  const brand = asText(p.brand || p.brand_name);
  const model = asText(p.model || p.model_name);

  if (brand) out.push(`Marca: ${brand}.`);
  if (model) out.push(`Modelo: ${model}.`);

  if (p.track_stock) out.push("Stock disponible.");

  const short = asText(p.short_description);
  if (short) out.push(short.endsWith(".") ? short : `${short}.`);

  // fallback si no viene nada
  if (!out.length) out.push("Producto seleccionado en San Juan Tecnología.");

  return out.slice(0, 8);
});
</script>

<style scoped>
.mi-card {
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
}
.mi-pad { padding: 18px; }

.mi-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.mi-muted {
  color: rgba(0,0,0,.6);
  font-size: 13px;
}
.mi-fav { opacity: .85; }

.mi-title {
  font-size: 22px;
  font-weight: 900;
  line-height: 1.15;
  margin-bottom: 8px;
}

.mi-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.mi-rating-num {
  font-size: 13px;
  font-weight: 900;
  color: rgba(0,0,0,.75);
}
.mi-rating-count {
  font-size: 13px;
  color: rgba(0,0,0,.55);
}

.mi-promo-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: linear-gradient(135deg, #ff5722 0%, #ff9100 100%);
  color: #fff;
  font-size: 11.5px;
  font-weight: 900;
  letter-spacing: 0.7px;
  padding: 6px 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  text-transform: uppercase;
  box-shadow: 0 3px 10px rgba(255, 87, 34, 0.30);
}
.mi-old-price {
  font-size: 14px;
  color: rgba(0,0,0,.45);
  text-decoration: line-through;
  margin-top: 6px;
}
.mi-off {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  font-weight: 900;
  color: #00a650;
  margin-left: 8px;
  margin-top: 14px;
}
.mi-qty-promo {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 87, 34, 0.10);
  border: 1px solid rgba(255, 87, 34, 0.28);
  color: #ff5722;
  font-size: 13px;
  font-weight: 800;
  padding: 8px 11px;
  border-radius: 8px;
  margin-top: 10px;
  line-height: 1.3;
}
.mi-promo-ends {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: rgba(0,0,0,.55);
  margin-top: 6px;
}

.mi-price {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 2px;
}
.mi-currency {
  font-size: 22px;
  font-weight: 900;
  line-height: 1.2;
  margin-top: 6px;
}
.mi-price-int {
  font-size: 46px;
  font-weight: 900;
  letter-spacing: -0.5px;
  line-height: 1.05;
}
.mi-price-dec {
  font-size: 16px;
  font-weight: 900;
  line-height: 1.2;
  margin-top: 10px;
  opacity: 0.9;
}

.mi-link {
  display: inline-block;
  margin-top: 8px;
  color: #1a73e8;
  text-decoration: none;
  font-weight: 800;
}
.mi-link:hover { text-decoration: underline; }

.mi-know { margin-top: 14px; }
.mi-know-title {
  font-size: 14px;
  font-weight: 900;
  margin-bottom: 6px;
}
.mi-know-list {
  margin: 0;
  padding-left: 18px;
  color: rgba(0,0,0,.78);
  font-size: 13px;
}
.mi-know-list li { margin: 4px 0; }

@media (max-width: 980px) {
  .mi-title { font-size: 20px; }
  .mi-price-int { font-size: 40px; }
}
</style>
