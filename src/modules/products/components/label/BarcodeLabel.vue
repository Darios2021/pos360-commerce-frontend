<!--
  BarcodeLabel — Etiqueta única para gondola con código de barras lineal.

  Soporta 3 tamaños fijos para impresión en hoja A4:
    - small  : 50 × 30 mm  (etiquetas chicas para colgantes)
    - medium : 70 × 50 mm  (estándar gondola)
    - large  : 100 × 60 mm (escaparate / display destacado)

  Estética moderna alineada con la ficha de producto del shop
  (sin imagen): jerarquía clara marca/modelo · nombre · precio · OFF
  estilo ML, y código de barras centrado al pie con SKU debajo.

  Para impresión usa unidades fijas en mm así no depende del zoom del browser.
-->
<template>
  <div class="bcl" :class="`bcl--${size}`" data-label>
    <!-- Header strip: logo + marca/modelo (proporcionados, balanceados) -->
    <header v-if="(showLogo && logoUrl) || (size !== 'small' && subline)" class="bcl__top">
      <img
        v-if="showLogo && logoUrl"
        :src="logoUrl"
        alt=""
        class="bcl__logo"
      />
      <div v-if="size !== 'small' && subline" class="bcl__brand">{{ subline }}</div>
    </header>

    <!-- Nombre del producto -->
    <div class="bcl__name">{{ name }}</div>

    <!-- Bloque de precios estilo ficha shop.
         En small ocultamos old/OFF para que entre el contenido. -->
    <div class="bcl__price-block">
      <div v-if="hasDiscount && size !== 'small'" class="bcl__old-row">
        <span class="bcl__old">{{ money(priceList) }}</span>
        <span class="bcl__off">{{ offPct }}% OFF</span>
      </div>
      <div class="bcl__price">{{ money(finalPrice) }}</div>
    </div>

    <!-- Código de barras centrado + SKU debajo + Sucursal -->
    <div class="bcl__barcode">
      <svg ref="svgRef" class="bcl__barcode-svg"></svg>
      <div class="bcl__foot">
        <span class="bcl__sku">{{ sku }}</span>
        <span v-if="branchName" class="bcl__branch">
          <svg class="bcl__branch-ico" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 2L3 8.5V21h6v-7h6v7h6V8.5L12 2z"
            />
          </svg>
          {{ branchName }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch, nextTick } from "vue";
import JsBarcode from "jsbarcode";

const props = defineProps({
  product: { type: Object, required: true },
  size: { type: String, default: "medium" }, // small | medium | large
  showLogo: { type: Boolean, default: true },
  logoUrl: { type: String, default: "" },
  branchName: { type: String, default: "" },
});

const svgRef = ref(null);

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
const sku = computed(() => s(props.product?.sku || props.product?.code, "—"));
const barcodeValue = computed(() =>
  s(props.product?.barcode || props.product?.sku || props.product?.code, "")
);

const subline = computed(() => {
  const brand = String(props.product?.brand || props.product?.brand_name || "").trim();
  const model = String(props.product?.model || "").trim();
  const cat = String(props.product?.category_name || props.product?.category?.name || "").trim();
  const parts = [brand, model || cat].filter(Boolean);
  return parts.join(" · ");
});

const priceList = computed(() =>
  n(
    props.product?.price_list ??
    props.product?.priceList ??
    props.product?.list_price ??
    props.product?.price ??
    0,
  ),
);

const finalPrice = computed(() => {
  const eff = n(
    props.product?.effective_price ??
    props.product?.price_discount ??
    props.product?.price_final ??
    props.product?.price ??
    priceList.value,
  );
  return eff > 0 ? eff : priceList.value;
});

const hasDiscount = computed(
  () => priceList.value > 0 && finalPrice.value > 0 && finalPrice.value < priceList.value,
);
const offPct = computed(() => {
  if (!hasDiscount.value) return 0;
  return Math.round((1 - finalPrice.value / priceList.value) * 100);
});

function renderBarcode() {
  if (!svgRef.value) return;
  const code = barcodeValue.value;
  if (!code || code === "—") {
    svgRef.value.innerHTML = "";
    return;
  }
  const cfg = {
    format: "CODE128",
    displayValue: false,
    margin: 0,
    height: props.size === "small" ? 20 : props.size === "medium" ? 36 : 64,
    width: props.size === "small" ? 1.0 : props.size === "medium" ? 1.6 : 2.8,
    background: "#ffffff",
    lineColor: "#000000",
  };
  try {
    JsBarcode(svgRef.value, code, cfg);
  } catch (e) {
    svgRef.value.innerHTML = "";
  }
}

onMounted(async () => { await nextTick(); renderBarcode(); });
watch(() => [barcodeValue.value, props.size], async () => {
  await nextTick();
  renderBarcode();
});
</script>

<style scoped>
/* ──────────────────────────────────────────────────────────────────
   Etiquetas — tamaños fijos en mm para impresión exacta.
   Estética: card limpia tipo shop, jerarquía clara, sin saturación.
   ────────────────────────────────────────────────────────────────── */
.bcl {
  background: #fff;
  color: #111;
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  page-break-inside: avoid;
  break-inside: avoid;
  /* Recuadro = línea de corte. Hairline gris claro para no ensuciar
     visualmente, pero plenamente visible al imprimir. */
  border: 0.18mm solid #94a3b8;
  border-radius: 1mm;
}
.bcl--small  { width: 50mm;  height: 30mm; padding: 1.5mm 2mm;   gap: 0.4mm; }
.bcl--medium { width: 70mm;  height: 50mm; padding: 2.5mm 3mm;   gap: 1mm;   }
.bcl--large  { width: 100mm; height: 60mm; padding: 3.5mm 4mm;   gap: 1.5mm; }

/* Header strip: logo + brand alineados horizontalmente,
   estética azul tipo shop (banda primary con texto blanco). */
.bcl__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2mm;
  min-height: 0;
  /* sangrado lateral para que la banda llegue al borde del recuadro */
  margin: -1.5mm -2mm 0;
  padding: 0.8mm 2mm;
  background: #1488d1;
  color: #fff;
  /* preserva el color de fondo en impresión (Chrome/Safari) */
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.bcl--medium .bcl__top { margin: -2.5mm -3mm 0; padding: 1.4mm 3mm; }
.bcl--large  .bcl__top { margin: -3.5mm -4mm 0; padding: 1.8mm 4mm; }

.bcl__logo {
  flex-shrink: 0;
  object-fit: contain;
  object-position: left center;
  display: block;
}
.bcl--small  .bcl__logo { height: 3.5mm; max-width: 18mm; }
.bcl--medium .bcl__logo { height: 7mm;   max-width: 32mm; }
.bcl--large  .bcl__logo { height: 10mm;  max-width: 46mm; }

.bcl__brand {
  font-size: 7pt;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  line-height: 1;
  text-align: right;
  flex: 1 1 auto;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bcl--large .bcl__brand { font-size: 8.5pt; }

.bcl__name {
  flex: 1 1 auto;
  font-weight: 600;
  color: #111;
  line-height: 1.1;
  letter-spacing: -0.01em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
}
.bcl--small  .bcl__name { font-size: 7pt;  -webkit-line-clamp: 1; line-height: 1.05; }
.bcl--medium .bcl__name { font-size: 10.5pt; }
.bcl--large  .bcl__name { font-size: 14pt; }

/* Bloque de precios */
.bcl__price-block {
  display: flex;
  flex-direction: column;
  gap: 0.4mm;
  margin-top: 0.5mm;
}

.bcl__old-row {
  display: flex;
  align-items: center;
  gap: 1.5mm;
  line-height: 1;
}
.bcl__old {
  font-size: 7pt;
  font-weight: 400;
  color: #9ca3af;
  text-decoration: line-through;
}
.bcl--medium .bcl__old { font-size: 8pt; }
.bcl--large  .bcl__old { font-size: 10pt; }

.bcl__off {
  font-size: 6.5pt;
  font-weight: 600;
  color: #00a650;
  background: rgba(0, 166, 80, 0.12);
  padding: 0.3mm 1.2mm;
  border-radius: 0.8mm;
  letter-spacing: 0.02em;
  line-height: 1.1;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.bcl--medium .bcl__off { font-size: 7.5pt; padding: 0.4mm 1.4mm; }
.bcl--large  .bcl__off { font-size: 9pt;   padding: 0.6mm 1.8mm; }

.bcl__price {
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1;
  color: #111;
}
.bcl--small  .bcl__price { font-size: 11pt; }
.bcl--medium .bcl__price { font-size: 20pt; }
.bcl--large  .bcl__price { font-size: 30pt; }

/* Código de barras — siempre centrado al pie */
.bcl__barcode {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 0.6mm;
  width: 100%;
  padding-top: 1mm;
  border-top: 0.15mm solid #f1f5f9;
}
.bcl--small .bcl__barcode { padding-top: 0.4mm; gap: 0.3mm; border-top: none; }

.bcl__barcode-svg {
  display: block;
  max-width: 100%;
  margin: 0 auto;
}
.bcl--small  .bcl__barcode-svg { height: 6.5mm; }
.bcl--medium .bcl__barcode-svg { height: 11mm; }
.bcl--large  .bcl__barcode-svg { height: 18mm; max-width: 80mm; }

.bcl__foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.8mm;
  flex-wrap: nowrap;
  width: 100%;
  line-height: 1;
}
.bcl--small .bcl__foot { gap: 1mm; }

.bcl__sku {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 6.5pt;
  font-weight: 500;
  color: #4b5563;
  letter-spacing: 0.08em;
  line-height: 1;
  white-space: nowrap;
}
.bcl--small  .bcl__sku { font-size: 5.5pt; letter-spacing: 0.04em; }
.bcl--medium .bcl__sku { font-size: 7.5pt; }
.bcl--large  .bcl__sku { font-size: 9.5pt; }

.bcl__branch {
  display: inline-flex;
  align-items: center;
  gap: 0.6mm;
  font-size: 6.2pt;
  font-weight: 600;
  color: #1488d1;
  background: rgba(20, 136, 209, 0.10);
  padding: 0.4mm 1.2mm;
  border-radius: 0.8mm;
  letter-spacing: 0.02em;
  line-height: 1;
  max-width: 60%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.bcl--small  .bcl__branch { font-size: 5.5pt; padding: 0.3mm 1mm;   max-width: 55%; }
.bcl--medium .bcl__branch { font-size: 7pt;   padding: 0.5mm 1.4mm; }
.bcl--large  .bcl__branch { font-size: 8.5pt; padding: 0.7mm 1.8mm; }

.bcl__branch-ico {
  width: 2.2mm;
  height: 2.2mm;
  flex-shrink: 0;
}
.bcl--small  .bcl__branch-ico { width: 1.8mm; height: 1.8mm; }
.bcl--medium .bcl__branch-ico { width: 2.6mm; height: 2.6mm; }
.bcl--large  .bcl__branch-ico { width: 3.2mm; height: 3.2mm; }
</style>
