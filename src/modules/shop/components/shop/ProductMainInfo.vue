<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/ProductMainInfo.vue -->
<template>
  <v-card class="mi-card" variant="flat">
    <v-card-text class="mi-pad">
      <div class="mi-top">
        <div class="mi-muted">
          {{ conditionLabel }}
          <span v-if="soldCountLabel"> | {{ soldCountLabel }}</span>
        </div>

        <v-btn icon variant="text" class="mi-fav" aria-label="Favorito">
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

      <div class="mi-price-wrap">
        <span class="mi-currency">$</span>
        <span class="mi-price-int">{{ priceInt }}</span>
        <span v-if="priceDec" class="mi-price-dec">{{ priceDec }}</span>
      </div>

      <div class="mi-subtext" v-if="taxesInfo">
        {{ taxesInfo }}
      </div>

      <a href="javascript:void(0)" class="mi-link">Ver los medios de pago</a>

      <div class="mi-know">
        <div class="mi-know-title">Lo que tenés que saber de este producto</div>
        <ul class="mi-know-list">
          <li v-for="(x, i) in highlights" :key="i">{{ x }}</li>
          <li v-if="product?.track_stock">Stock disponible.</li>
        </ul>

        <a
          href="javascript:void(0)"
          class="mi-link mi-know-link"
          @click.prevent="emit('go-specs')"
        >
          Ver características
        </a>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  product: { type: Object, default: null },
});
const emit = defineEmits(["go-specs"]);

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

const taxesInfo = computed(() => {
  const p = props.product || {};
  const val = toNum(p.taxes_amount ?? p.import_taxes ?? p.tax ?? 0, 0);
  if (val <= 0) return "";
  return `Precio sin impuestos nacionales: $ ${fmtMoney(priceValue(p) - val)}`;
});

const highlights = computed(() => {
  const p = props.product || {};
  const out = [];

  // ✅ si ya te llega lista de bullets desde backend
  if (Array.isArray(p.highlights) && p.highlights.length) {
    for (const it of p.highlights) {
      const s = asText(it);
      if (s) out.push(s);
    }
    return out.slice(0, 10);
  }

  // ✅ fallback con campos comunes
  const brand = asText(p.brand || p.marca);
  const model = asText(p.model || p.modelo);
  const content = asText(p.content || p.size || p.capacity);
  if (brand) out.push(`Marca: ${brand}.`);
  if (model) out.push(`Modelo: ${model}.`);
  if (content) out.push(`Contenido/medida: ${content}.`);

  return out;
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
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}
.mi-muted { color: rgba(0,0,0,.6); font-size: 13px; }
.mi-fav { opacity: .9; }

.mi-title {
  font-size: 24px;
  font-weight: 900;
  line-height: 1.15;
  margin-bottom: 8px;
}

.mi-rating { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.mi-rating-num { font-size: 13px; font-weight: 900; color: rgba(0,0,0,.75); }
.mi-rating-count { font-size: 13px; color: rgba(0,0,0,.55); }

.mi-price-wrap { display: flex; align-items: baseline; gap: 6px; margin-top: 2px; }
.mi-currency { font-size: 22px; font-weight: 900; }
.mi-price-int { font-size: 48px; font-weight: 900; letter-spacing: -0.5px; line-height: 1.05; }
.mi-price-dec { font-size: 16px; font-weight: 900; opacity: .9; }

.mi-subtext { margin-top: 6px; color: rgba(0,0,0,.55); font-size: 12px; }

.mi-link {
  display: inline-block;
  margin-top: 8px;
  color: #1a73e8;
  text-decoration: none;
  font-weight: 900;
}
.mi-link:hover { text-decoration: underline; }

.mi-know { margin-top: 16px; }
.mi-know-title { font-size: 14px; font-weight: 900; margin-bottom: 6px; }
.mi-know-list {
  margin: 0;
  padding-left: 18px;
  color: rgba(0,0,0,.75);
  font-size: 13px;
}
.mi-know-list li { margin: 4px 0; }
.mi-know-link { margin-top: 10px; }
</style>
