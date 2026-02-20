<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/label/ProductLabel58.vue -->
<template>
  <div class="lbl58" data-label>
    <div class="t-name">{{ name }}</div>

    <div class="t-row">
      <div class="t-left">
        <div v-if="hasDiscount" class="t-oldrow">
          <span class="t-old">{{ money(priceList) }}</span>
          <span class="t-off">{{ offPct }}% OFF</span>
        </div>

        <div class="t-price">{{ money(finalPrice) }}</div>

        <div class="t-meta">
          <div>SKU: <b>{{ sku }}</b></div>
          <div v-if="code !== '—'">COD: <b>{{ code }}</b></div>
        </div>
      </div>

      <div class="t-qr">
        <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR" />
      </div>
    </div>

    <div class="t-foot">{{ catLine }}</div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import QRCode from "qrcode";

const props = defineProps({
  product: { type: Object, required: true },
  qrValue: { type: String, default: "" },
});

function s(v, fb = "—") {
  const x = String(v ?? "").trim();
  return x ? x : fb;
}
function n(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const num = Number(String(v).replace(",", "."));
  return Number.isFinite(num) ? num : d;
}
function money(v) {
  const nn = Math.round(n(v, 0));
  const parts = String(nn).split("");
  let out = "";
  for (let i = 0; i < parts.length; i++) {
    const p = parts[parts.length - 1 - i];
    out = p + out;
    if (i % 3 === 2 && i !== parts.length - 1) out = "." + out;
  }
  return "$ " + out;
}

const name = computed(() => s(props.product?.name || props.product?.title, "Producto"));
const sku = computed(() => s(props.product?.sku, "—"));
const code = computed(() => s(props.product?.code || props.product?.internal_code || props.product?.barcode, "—"));

const categoryName = computed(() => s(props.product?.category_name || props.product?.category?.name || props.product?.category, "—"));
const subcategoryName = computed(() => s(props.product?.subcategory_name || props.product?.subcategory?.name || props.product?.subcategory, "—"));
const catLine = computed(() => `${categoryName.value} · ${subcategoryName.value}`);

/* ✅ PRECIOS MULTI-CLAVE (fix $0) */
const priceList = computed(() =>
  n(
    props.product?.price_list ??
      props.product?.list_price ??
      props.product?.price_regular ??
      props.product?.price_base ??
      props.product?.price ??
      0,
    0
  )
);

const priceDiscount = computed(() =>
  n(
    props.product?.price_discount ??
      props.product?.final_price ??
      props.product?.sale_price ??
      props.product?.price_sale ??
      0,
    0
  )
);

const finalPrice = computed(() => (priceDiscount.value > 0 ? priceDiscount.value : priceList.value));
const hasDiscount = computed(() => priceDiscount.value > 0 && priceList.value > 0 && priceDiscount.value < priceList.value);

const offPct = computed(() => {
  if (!hasDiscount.value) return 0;
  const pct = Math.round(((priceList.value - priceDiscount.value) / priceList.value) * 100);
  return Math.max(1, Math.min(99, pct));
});

/* ✅ QR */
const qrDataUrl = ref("");

const qrUrl = computed(() => {
  const fallback = `${window.location.origin}/shop/product/${props.product?.id ?? props.product?.product_id ?? ""}`;
  return String(props.qrValue || fallback).trim();
});

async function buildQr() {
  try {
    qrDataUrl.value = await QRCode.toDataURL(qrUrl.value, {
      errorCorrectionLevel: "M",
      margin: 1,
      scale: 7,
    });
  } catch {
    qrDataUrl.value = "";
  }
}

onMounted(buildQr);
watch(qrUrl, buildQr);
</script>

<style scoped>
/* ✅ etiqueta compacta (58×40 look) */
.lbl58{
  width: 100%;
  height: 100%;
  padding: 14px;
  box-sizing: border-box;
  background: #fff;
  border-radius: 14px;
  display: grid;
  gap: 10px;
  font-family: Arial, Helvetica, sans-serif;
}

.t-name{
  font-weight: 900;
  font-size: 18px;
  line-height: 1.05;
}

.t-row{
  display:flex;
  justify-content: space-between;
  gap: 10px;
}

.t-left{ min-width: 0; }

.t-oldrow{
  display:flex;
  gap: 10px;
  align-items: baseline;
}
.t-old{ opacity:.65; text-decoration: line-through; font-weight: 900; font-size: 12px; }
.t-off{ font-weight: 900; font-size: 12px; }

.t-price{
  font-weight: 900;
  font-size: 34px;
  line-height: 1;
  margin-top: 2px;
}

.t-meta{
  margin-top: 8px;
  font-size: 12px;
  font-weight: 800;
  opacity: .9;
  display:grid;
  gap: 4px;
}

.t-qr{
  width: 92px;
  height: 92px;
  display:grid;
  place-items:center;
  flex: 0 0 auto;
}
.t-qr img{ width: 100%; height: 100%; object-fit: contain; }

.t-foot{
  font-size: 11px;
  opacity: .75;
  font-weight: 800;
}
</style>