<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/label/ProductLabel100.vue -->
<template>
  <div class="lbl100" data-label>
    <div class="l-top">
      <div class="l-title">
        <div class="l-name">{{ name }}</div>
        <div class="l-sub">{{ modelOrBrand }}</div>
      </div>

      <div class="l-qr">
        <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR" />
      </div>
    </div>

    <div class="l-mid">
      <div class="l-meta">
        <div class="l-meta-item">COD: <b>{{ code }}</b></div>
        <div class="l-meta-item">SKU: <b>{{ sku }}</b></div>
      </div>

      <div v-if="hasDiscount" class="l-oldrow">
        <span class="l-old">{{ money(priceList) }}</span>
        <span class="l-off">{{ offPct }}% OFF</span>
      </div>

      <div class="l-price">{{ money(finalPrice) }}</div>

      <div class="l-cat">{{ catLine }}</div>
    </div>
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
const modelOrBrand = computed(() => {
  const m = String(props.product?.model || "").trim();
  if (m) return m;
  const b = String(props.product?.brand || props.product?.brand_name || "").trim();
  return b || "—";
});

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
/* ✅ “100×60” VISUAL (no dependas de esto para imprimir A4) */
.lbl100{
  width: 100%;
  height: 100%;
  border-radius: 14px;
  padding: 18px;
  box-sizing: border-box;
  background: #fff;
  display: grid;
  gap: 12px;
  font-family: Arial, Helvetica, sans-serif;
}

.l-top{
  display:flex;
  align-items:flex-start;
  justify-content: space-between;
  gap: 12px;
}

.l-name{
  font-weight: 500;
  font-size: 22px;
  line-height: 1.05;
}
.l-sub{
  margin-top: 6px;
  font-weight: 500;
  opacity: .75;
}

.l-qr{
  width: 96px;
  height: 96px;
  display:grid;
  place-items:center;
}
.l-qr img{ width: 100%; height: 100%; object-fit: contain; }

.l-meta{
  display:flex;
  gap: 18px;
  font-size: 14px;
  font-weight: 500;
}

.l-oldrow{
  display:flex;
  align-items: baseline;
  gap: 12px;
}
.l-old{ opacity:.65; text-decoration: line-through; font-weight: 500; }
.l-off{ font-weight: 500; }

.l-price{
  font-weight: 500;
  font-size: 44px;
  line-height: 1;
}

.l-cat{
  font-size: 12px;
  opacity: .75;
  font-weight: 500;
  letter-spacing: .2px;
}
</style>