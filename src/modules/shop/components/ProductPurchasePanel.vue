<!-- src/modules/shop/components/ProductPurchasePanel.vue -->
<template>
  <!-- ✅ IMPORTANTE: agregamos la clase info (la usa ShopProduct.vue para el layout) -->
  <v-card class="ml-panel info" variant="outlined">
    <v-card-text class="ml-pad">
      <!-- =======================
           TOP: condición + vendidos
           ======================= -->
      <div class="ml-topline">
        <span class="ml-muted">
          {{ conditionLabel }}
          <span v-if="soldCountLabel"> | {{ soldCountLabel }}</span>
        </span>
      </div>

      <!-- =======================
           TITLE
           ======================= -->
      <div class="ml-title">
        {{ product?.name || "—" }}
      </div>

      <!-- =======================
           RATING
           ======================= -->
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

      <!-- =======================
           PRICE
           ======================= -->
      <div class="ml-price-wrap">
        <span class="ml-currency">$</span>
        <span class="ml-price-int">{{ priceInt }}</span>
        <span v-if="priceDec" class="ml-price-dec">{{ priceDec }}</span>
      </div>

      <div class="ml-payments">
        <a href="javascript:void(0)" class="ml-link">Ver los medios de pago</a>
      </div>

      <!-- =======================
           COLOR
           ======================= -->
      <div v-if="colorLabel" class="ml-color">
        <span class="ml-muted">Color: </span>
        <span class="ml-strong">{{ colorLabel }}</span>
      </div>

      <!-- =======================
           HIGHLIGHTS
           ======================= -->
      <div class="ml-know">
        <div class="ml-know-title">Lo que tenés que saber de este producto</div>
        <ul class="ml-know-list">
          <li v-if="ramLabel">Memoria RAM: {{ ramLabel }}.</li>
          <li v-if="storageLabel">Memoria interna: {{ storageLabel }}.</li>
          <li v-if="product?.track_stock" class="ml-know-stock">
            Stock disponible.
          </li>
        </ul>

        <a href="javascript:void(0)" class="ml-link ml-know-link">Ver características</a>
      </div>

      <!-- =======================
           BOX: stock / cantidad / acciones
           ======================= -->
      <div class="ml-sidebox">
        <div class="ml-sidebox-top">
          <v-chip
            v-if="isInternational"
            size="small"
            class="ml-chip"
            variant="flat"
            color="red-darken-1"
          >
            <v-icon start size="16">mdi-airplane</v-icon>
            Internacional
          </v-chip>

          <div v-if="shippingText" class="ml-shipline">
            <span class="ml-green">{{ shippingText }}</span>
            <span v-if="shippingEtaText" class="ml-muted"> {{ shippingEtaText }}</span>
          </div>

          <div v-if="shippingNote" class="ml-muted ml-shipnote">
            {{ shippingNote }}
          </div>

          <div v-if="taxesText" class="ml-tax">
            <span class="ml-muted">Impuestos:</span>
            <span class="ml-strong"> $ {{ fmtMoney(taxesAmount) }}</span>
          </div>

          <div v-if="taxesHelp" class="ml-muted ml-taxhelp">
            {{ taxesHelp }}
          </div>
        </div>

        <v-divider class="my-4" />

        <!-- STOCK -->
        <div class="ml-stock">
          <div class="ml-stock-title">Stock disponible</div>
          <div class="ml-muted ml-stock-sub">
            {{ stockSubLabel }}
          </div>
        </div>

        <!-- CANTIDAD -->
        <div class="ml-qty">
          <div class="ml-qty-row">
            <span class="ml-strong">Cantidad:</span>
            <span class="ml-qty-hint ml-muted">
              {{ qtyHint }}
            </span>
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

        <!-- CTA -->
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

        <!-- SELLER -->
        <div v-if="sellerLabel" class="ml-seller">
          <div class="ml-muted">Vendido por <span class="ml-link">{{ sellerLabel }}</span></div>
          <div v-if="sellerMeta" class="ml-muted">{{ sellerMeta }}</div>
        </div>

        <!-- RETURN -->
        <div v-if="returnText" class="ml-return">
          <v-icon size="18" class="mr-1">mdi-restore</v-icon>
          <span class="ml-link">{{ returnText }}</span>
          <span v-if="returnNote" class="ml-muted"> {{ returnNote }}</span>
        </div>
      </div>

      <!-- =======================
           CUOTAS
           ======================= -->
      <div v-if="installments.length" class="ml-installments">
        <div class="ml-installments-title">Cuotas</div>

        <div class="inst-grid">
          <div v-for="it in installments" :key="it.n" class="inst-item">
            <div class="inst-n">{{ it.n }}x</div>
            <div class="inst-val">$ {{ fmtMoney(it.amount) }}</div>
            <div class="inst-note">{{ it.label }}</div>
          </div>
        </div>
      </div>

      <div class="ml-footnote">
        Elegís sucursal al finalizar si es retiro.
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
function priceValue(p) {
  const d = Number(p?.price_discount || 0);
  if (d > 0) return d;
  const l = Number(p?.price_list || 0);
  if (l > 0) return l;
  return Number(p?.price || 0);
}
function toNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function asText(v) {
  const s = String(v ?? "").trim();
  return s ? s : "";
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

  const p3 = Number(p.installments_3 || p.cuota_3 || p.installment_amount_3 || 0) || 0;
  const p6 = Number(p.installments_6 || p.cuota_6 || p.installment_amount_6 || 0) || 0;

  const base = priceValue(p);
  const out = [{ n: 1, amount: base, label: "Pago único" }];

  if (p3 > 0) out.push({ n: 3, amount: p3, label: "3 cuotas" });
  if (p6 > 0) out.push({ n: 6, amount: p6, label: "6 cuotas" });

  if (out.length === 1 && base > 0) {
    out.push(
      { n: 3, amount: base / 3, label: "Estimado" },
      { n: 6, amount: base / 6, label: "Estimado" }
    );
  }

  return out;
}
const installments = computed(() => extractInstallments(props.product));

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

const colorLabel = computed(() => asText(props.product?.color || props.product?.color_name));

const ramLabel = computed(() => {
  const p = props.product || {};
  const r = asText(p.ram || p.ram_gb || p.memory_ram);
  if (!r) return "";
  return /gb/i.test(r) ? r : `${r} GB`;
});

const storageLabel = computed(() => {
  const p = props.product || {};
  const s = asText(p.storage || p.storage_gb || p.memory_storage || p.rom);
  if (!s) return "";
  return /gb/i.test(s) ? s : `${s} GB`;
});

const isInternational = computed(() => {
  const p = props.product || {};
  return Boolean(p.is_international ?? p.international ?? p.imported ?? false);
});

const shippingText = computed(() => {
  const p = props.product || {};
  return asText(p.shipping_text || p.shippingTitle || (p.free_shipping ? "Llega gratis" : ""));
});

const shippingEtaText = computed(() => {
  const p = props.product || {};
  return asText(p.shipping_eta || p.shippingEta || p.eta_text || "");
});

const shippingNote = computed(() => {
  const p = props.product || {};
  return asText(p.shipping_note || p.shippingFrom || "");
});

const taxesAmount = computed(() => {
  const p = props.product || {};
  return toNum(p.taxes_amount ?? p.import_taxes ?? p.tax ?? 0, 0);
});
const taxesText = computed(() => (taxesAmount.value > 0 ? "Impuestos" : ""));
const taxesHelp = computed(() => {
  const p = props.product || {};
  return asText(p.taxes_help || p.taxesNote || "");
});

const sellerLabel = computed(() => asText(props.product?.seller_name || props.product?.seller));
const sellerMeta = computed(() => asText(props.product?.seller_meta || props.product?.seller_badge));

const returnText = computed(() =>
  asText(props.product?.return_text || (props.product?.free_returns ? "Devolución gratis" : ""))
);
const returnNote = computed(() => asText(props.product?.return_note || ""));

const stockSubLabel = computed(() => {
  const p = props.product || {};
  const shipBy = asText(p.fulfillment_label || p.shipped_by || "");
  if (shipBy) return shipBy;
  return "Listo para despachar";
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
  const extra = p.track_stock
    ? `(+${Math.max(0, Math.floor(toNum(p.stock_qty ?? 0, 0)) - 1)} disponibles)`
    : "";
  const limit = maxQty.value;
  const limTxt = limit <= 2 ? "Podés comprar hasta 2 unidades" : `Podés comprar hasta ${limit} unidades`;
  return `${extra ? extra + " · " : ""}${limTxt}`;
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
.ml-panel {
  border-radius: 18px;
}
.ml-pad {
  padding: 18px;
}

.ml-topline {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}

.ml-muted {
  color: rgba(0, 0, 0, 0.6);
  font-size: 13px;
}

.ml-strong {
  font-weight: 800;
  color: rgba(0, 0, 0, 0.9);
}

.ml-title {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.15;
  margin-bottom: 6px;
}

.ml-brandmodel {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

/* rating */
.ml-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.ml-rating-num {
  font-size: 13px;
  font-weight: 800;
  color: rgba(0, 0, 0, 0.75);
}
.ml-rating-count {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
}

/* price like ML */
.ml-price-wrap {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 2px;
}
.ml-currency {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.2;
  margin-top: 6px;
}
.ml-price-int {
  font-size: 46px;
  font-weight: 900;
  letter-spacing: -0.5px;
  line-height: 1.05;
}
.ml-price-dec {
  font-size: 16px;
  font-weight: 900;
  line-height: 1.2;
  margin-top: 10px;
  opacity: 0.9;
}

.ml-payments {
  margin-top: 6px;
  margin-bottom: 12px;
}

.ml-link {
  color: #1a73e8;
  text-decoration: none;
  font-weight: 700;
  cursor: pointer;
}
.ml-link:hover {
  text-decoration: underline;
}

/* color row */
.ml-color {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 12px;
}

/* ✅ descripción */
.ml-desc {
  margin: 6px 0 14px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(0,0,0,.03);
  border: 1px solid rgba(0,0,0,.08);
}
.ml-desc-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}
.ml-desc-toggle {
  font-size: 12px;
}
.ml-desc-body {
  white-space: pre-line;
  line-height: 1.5;
  font-size: 13px;
  color: rgba(0,0,0,.78);

  /* colapsado */
  max-height: 58px;
  overflow: hidden;
}
.ml-desc-body.open {
  max-height: 500px;
}

/* know section */
.ml-know {
  margin-top: 4px;
  margin-bottom: 14px;
}
.ml-know-title {
  font-size: 14px;
  font-weight: 900;
  margin-bottom: 6px;
}
.ml-know-list {
  margin: 0;
  padding-left: 18px;
  color: rgba(0, 0, 0, 0.75);
  font-size: 13px;
}
.ml-know-list li {
  margin: 3px 0;
}
.ml-know-link {
  display: inline-block;
  margin-top: 8px;
}

.ml-features {
  margin-top: 10px;
}

/* sidebox */
.ml-sidebox {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 14px;
  padding: 14px;
  background: #fff;
}

.ml-chip {
  font-weight: 900;
  border-radius: 10px;
}

.ml-sidebox-top {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ml-shipline {
  font-size: 16px;
  font-weight: 900;
  line-height: 1.2;
}
.ml-green {
  color: #00a650;
}
.ml-shipnote {
  margin-top: -4px;
}

.ml-tax {
  font-size: 14px;
}
.ml-taxhelp {
  margin-top: -4px;
}

/* stock */
.ml-stock-title {
  font-size: 15px;
  font-weight: 900;
  margin-bottom: 2px;
}
.ml-stock-sub {
  font-size: 13px;
}

/* qty */
.ml-qty {
  margin-top: 14px;
}
.ml-qty-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.ml-qty-hint {
  font-size: 12px;
}
.ml-qty-select {
  border-radius: 12px;
}

/* actions */
.ml-actions {
  margin-top: 14px;
  display: grid;
  gap: 10px;
}
.ml-btn {
  border-radius: 12px;
  font-weight: 900;
  text-transform: none;
}

/* seller + return */
.ml-seller {
  margin-top: 14px;
  display: grid;
  gap: 4px;
}
.ml-return {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

/* installments */
.ml-installments {
  margin-top: 16px;
}
.ml-installments-title {
  font-size: 14px;
  font-weight: 900;
  margin-bottom: 8px;
}

.inst-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.inst-item {
  border: 1px solid rgba(0, 0, 0, 0.10);
  border-radius: 14px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.02);
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
  opacity: 0.7;
  margin-top: 2px;
}

.ml-footnote {
  margin-top: 14px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
}

/* responsive */
@media (max-width: 980px) {
  .ml-title {
    font-size: 20px;
  }
  .ml-price-int {
    font-size: 40px;
  }
  .inst-grid {
    grid-template-columns: 1fr;
  }
}
</style>

