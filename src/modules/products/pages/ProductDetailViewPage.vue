<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/pages/ProductDetailViewPage.vue -->
<!-- Vista Admin: detalle + fotos (solo vista) + etiqueta HORIZONTAL (imprimir/PDF) sin foto -->

<template>
  <div class="pd" data-page="product-detail-view">
    <!-- TOP BAR -->
    <v-card class="pd-top" rounded="xl" elevation="1">
      <div class="pd-top-row">
        <div class="pd-left">
          <v-btn variant="text" class="pd-back" @click="goBack">
            <v-icon start>mdi-arrow-left</v-icon>
            Volver
          </v-btn>

          <div class="pd-title minw-0">
            <div class="pd-h1 text-truncate">
              {{ product?.name || "Producto" }}
            </div>
            <div class="pd-sub text-truncate">
              ID: <b>{{ productId }}</b>
              <span v-if="product?.sku"> · SKU: <b>{{ product.sku }}</b></span>
              <span v-if="product?.code"> · Código: <b>{{ product.code }}</b></span>
            </div>
          </div>
        </div>

        <div class="pd-actions">
          <v-btn
            color="primary"
            variant="flat"
            :loading="loadingPrint"
            :disabled="loading || !product"
            @click="printDlg = true"
          >
            <v-icon start>mdi-printer</v-icon>
            Imprimir etiqueta
          </v-btn>

          <v-btn
            color="primary"
            variant="tonal"
            :loading="loadingPdf"
            :disabled="loading || !product"
            @click="downloadPdfLabel"
          >
            <v-icon start>mdi-file-pdf-box</v-icon>
            Descargar PDF
          </v-btn>

          <v-btn variant="tonal" :disabled="loading || !product" @click="openEcommerce">
            <v-icon start>mdi-open-in-new</v-icon>
            Ver eCommerce
          </v-btn>
        </div>
      </div>
    </v-card>

    <!-- BODY -->
    <div class="pd-body">
      <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
        {{ error }}
      </v-alert>

      <div v-if="loading" class="pd-loading">
        <v-progress-circular indeterminate />
        <div class="text-caption mt-2" style="opacity:.8">Cargando producto…</div>
      </div>

      <div v-else-if="product" class="pd-grid">
        <!-- ✅ GALERÍA (SOLO VISTA) -->
        <v-card rounded="xl" elevation="1" class="pd-card pd-card-wide">
          <div class="pd-card-head">
            <div class="pd-card-title">Fotos</div>
            <div class="text-caption ml-auto" style="opacity:.75">
              (no salen en la etiqueta)
            </div>
          </div>

          <ProductPhotoGallery :images="productImages" />
        </v-card>

        <!-- DATOS -->
        <v-card rounded="xl" elevation="1" class="pd-card">
          <div class="pd-card-head">
            <div class="pd-card-title">Datos</div>
            <v-chip size="small" variant="tonal" class="ml-auto">
              {{ product?.is_active ? "Activo" : "Inactivo" }}
            </v-chip>
          </div>

          <div class="pd-kv">
            <div class="k">Nombre</div><div class="v">{{ safe(product.name) }}</div>
            <div class="k">SKU</div><div class="v">{{ safe(product.sku) }}</div>
            <div class="k">Código</div><div class="v">{{ safe(product.code) }}</div>
            <div class="k">Marca</div><div class="v">{{ safe(product.brand) }}</div>
            <div class="k">Modelo</div><div class="v">{{ safe(product.model) }}</div>
            <div class="k">Rubro</div><div class="v">{{ safe(product.category_name || product.category?.name || product.category_id) }}</div>
            <div class="k">Subrubro</div><div class="v">{{ safe(product.subcategory_name || product.subcategory?.name || product.subcategory_id) }}</div>
          </div>

          <div class="mt-3">
            <div class="text-caption" style="opacity:.75; font-weight:800;">Descripción</div>
            <div class="pd-desc">{{ safe(product.description) }}</div>
          </div>
        </v-card>

        <!-- PRECIO / PAGO + QR -->
        <v-card rounded="xl" elevation="1" class="pd-card">
          <div class="pd-card-head">
            <div class="pd-card-title">Precio / Pago</div>
          </div>

          <div class="pd-price-block">
            <div v-if="hasDiscount" class="pd-oldrow">
              <span class="pd-oldprice">{{ money(priceList) }}</span>
              <span class="pd-off">{{ offPct }}% OFF</span>
            </div>

            <div class="pd-finalprice">{{ money(finalPrice) }}</div>

            <div v-if="showInstallments" class="pd-install">
              En 6x <b>{{ money(installmentAmount) }}</b> (precio lista)
            </div>

            <div class="pd-paymethods">
              <div class="pd-pay-title">Medios de pago</div>
              <div class="pd-pay-line">
                Tarjetas · Transferencia · Efectivo · QR
              </div>
            </div>
          </div>

          <v-divider class="my-4" />

          <div class="pd-card-title">QR eCommerce</div>
          <div class="text-caption mb-2" style="opacity:.75">
            Este QR abre la ficha del producto (cliente).
          </div>

          <div class="pd-qr-wrap">
            <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR" class="pd-qr" />
            <div v-else class="text-caption" style="opacity:.75">Generando QR…</div>
          </div>

          <div class="pd-url text-caption">
            {{ ecommerceUrl }}
          </div>
        </v-card>

        <!-- STOCK -->
        <v-card rounded="xl" elevation="1" class="pd-card pd-card-wide">
          <div class="pd-card-head">
            <div class="pd-card-title">Stock</div>
          </div>

          <div v-if="stockRows.length" class="pd-stock">
            <div v-for="r in stockRows" :key="r.branch_id" class="pd-stock-row">
              <div class="n">{{ r.branch_name }}</div>
              <div class="q">{{ num(r.qty).toFixed(3) }}</div>
            </div>
          </div>

          <div v-else class="text-caption" style="opacity:.75">
            Sin stock disponible / no informado.
          </div>
        </v-card>
      </div>
    </div>

    <!-- PRINT DIALOG -->
    <v-dialog v-model="printDlg" max-width="620">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon>mdi-printer</v-icon>
          <span class="font-weight-black">Etiqueta (horizontal)</span>
        </v-card-title>

        <v-card-text>
          <div class="text-caption" style="opacity:.8">
            Etiqueta térmica <b>58×40mm horizontal</b>. Sin foto. Incluye QR + precio + medios de pago.
          </div>

          <v-divider class="my-3" />

          <div class="pd-print-preview">
            <div class="pp-name">{{ safe(product?.name) }}</div>

            <div v-if="hasDiscount" class="pp-oldrow">
              <span class="pp-old">{{ money(priceList) }}</span>
              <span class="pp-off">{{ offPct }}% OFF</span>
            </div>

            <div class="pp-price">{{ money(finalPrice) }}</div>

            <div v-if="showInstallments" class="pp-install">
              En 6x <b>{{ money(installmentAmount) }}</b> (precio lista)
            </div>

            <div class="pp-meta">
              <div>SKU: <b>{{ safe(product?.sku) }}</b></div>
              <div v-if="product?.code">COD: <b>{{ safe(product?.code) }}</b></div>
            </div>

            <div class="pp-pay">
              <div class="pp-pay-t">Medios de pago</div>
              <div class="pp-pay-l">Tarjetas · Transferencia · Efectivo · QR</div>
            </div>

            <div class="pp-qr">
              <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR" />
            </div>

            <div class="pp-url">{{ ecommerceUrl }}</div>
          </div>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="printDlg=false">Cancelar</v-btn>

          <v-btn color="primary" variant="tonal" :loading="loadingPdf" @click="downloadPdfLabel">
            <v-icon start>mdi-file-pdf-box</v-icon>
            PDF
          </v-btn>

          <v-btn color="primary" variant="flat" :loading="loadingPrint" @click="printLabel">
            <v-icon start>mdi-printer</v-icon>
            Imprimir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

import { useProductsStore } from "@/app/store/products.store";
import { useAuthStore } from "@/app/store/auth.store";
import ProductPhotoGallery from "@/modules/products/components/ProductPhotoGallery.vue";

const route = useRoute();
const router = useRouter();

const products = useProductsStore();
const auth = useAuthStore();

const productId = computed(() => Number(route.params.id || 0));

const loading = ref(false);
const error = ref("");
const product = ref(null);

const qrDataUrl = ref("");

const loadingPrint = ref(false);
const loadingPdf = ref(false);
const printDlg = ref(false);

function safe(v) {
  const s = String(v ?? "").trim();
  return s ? s : "—";
}
function num(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}
function money(v) {
  const n = Math.round(num(v, 0));
  const parts = String(n).split("");
  let out = "";
  for (let i = 0; i < parts.length; i++) {
    const p = parts[parts.length - 1 - i];
    out = p + out;
    if (i % 3 === 2 && i !== parts.length - 1) out = "." + out;
  }
  return "$ " + out;
}

const priceList = computed(() => num(product.value?.price_list, 0));
const priceDiscount = computed(() => num(product.value?.price_discount, 0));
const finalPrice = computed(() => (priceDiscount.value > 0 ? priceDiscount.value : priceList.value));

const hasDiscount = computed(() => priceDiscount.value > 0 && priceList.value > 0 && priceDiscount.value < priceList.value);

const offPct = computed(() => {
  if (!hasDiscount.value) return 0;
  const pct = Math.round(((priceList.value - priceDiscount.value) / priceList.value) * 100);
  return Math.max(1, Math.min(99, pct));
});

const showInstallments = computed(() => priceList.value > 250000);
const installmentAmount = computed(() => (showInstallments.value ? Math.round(priceList.value / 6) : 0));

const userBranchId = computed(() => {
  const u = auth?.user || {};
  const bid = Number(u?.branch_id || 0) || Number(auth?.branchId || 0) || 0;
  return bid > 0 ? bid : null;
});
const branchIdForFetch = computed(() => (userBranchId.value ? Number(userBranchId.value) : null));

const ecommerceBase = String(import.meta.env.VITE_SHOP_BASE_URL || "").trim() || window.location.origin;
const ecommercePathTpl = String(import.meta.env.VITE_SHOP_PRODUCT_PATH || "").trim() || "/shop/product/{id}";

const ecommerceUrl = computed(() => {
  const id = productId.value || product.value?.id || 0;
  const tpl = ecommercePathTpl.includes("{id}") ? ecommercePathTpl : "/shop/product/{id}";
  const path = tpl.replace("{id}", String(id));
  return ecommerceBase.replace(/\/$/, "") + path;
});

/** ✅ Imágenes (para la vista) */
const productImages = computed(() => {
  const p = product.value || {};
  const arr =
    (Array.isArray(p.images) && p.images) ||
    (Array.isArray(p.media?.images) && p.media.images) ||
    (Array.isArray(p.product_images) && p.product_images) ||
    (Array.isArray(p.gallery) && p.gallery) ||
    [];

  // normalizamos a [{url, title?}]
  const out = [];
  for (const it of arr) {
    if (!it) continue;
    if (typeof it === "string") {
      const u = it.trim();
      if (u) out.push({ url: u, title: "" });
      continue;
    }
    const u =
      String(it.url || it.image_url || it.src || it.path || it.public_url || it.publicUrl || "").trim();
    if (u) out.push({ url: u, title: String(it.title || it.alt || "").trim() });
  }

  // fallback por si tu API manda image_url directo
  const main = String(p.image_url || p.imageUrl || p.thumbnail_url || p.thumbnailUrl || "").trim();
  if (main && !out.some((x) => x.url === main)) out.unshift({ url: main, title: "" });

  return out;
});

const stockRows = computed(() => {
  const p = product.value || {};
  const arr = Array.isArray(p.stock_matrix)
    ? p.stock_matrix
    : Array.isArray(p.stock)
      ? p.stock
      : [];

  return arr
    .map((r) => ({
      branch_id: Number(r.branch_id || r.branchId || 0),
      branch_name:
        String(r.branch_name || r.branchName || r.branch || "").trim() ||
        `Sucursal #${r.branch_id || "—"}`,
      qty: num(r.qty ?? r.current_qty ?? r.currentQty ?? 0, 0),
    }))
    .filter((x) => x.branch_id > 0);
});

async function fetchProduct() {
  error.value = "";
  loading.value = true;

  try {
    const id = productId.value;
    if (!id) throw new Error("ID inválido.");

    const bid = branchIdForFetch.value ? Number(branchIdForFetch.value) : null;
    const full = await products.fetchOne(Number(id), { force: true, branch_id: bid });

    if (!full) throw new Error(products.error || `No se pudo cargar el producto #${id}`);

    product.value = full;
    await buildQr();
  } catch (e) {
    error.value = e?.friendlyMessage || e?.message || "No se pudo cargar el producto.";
    product.value = null;
  } finally {
    loading.value = false;
  }
}

async function buildQr() {
  try {
    qrDataUrl.value = await QRCode.toDataURL(ecommerceUrl.value, {
      errorCorrectionLevel: "M",
      margin: 1,
      scale: 7,
    });
  } catch {
    qrDataUrl.value = "";
  }
}

function goBack() {
  router.back();
}

function openEcommerce() {
  window.open(ecommerceUrl.value, "_blank", "noopener,noreferrer");
}

/* =========================
   ✅ PRINT — HORIZONTAL 58×40
========================= */
async function printLabel() {
  if (!product.value) return;

  loadingPrint.value = true;
  try {
    if (!qrDataUrl.value) await buildQr();

    const html = buildPrintHtmlHorizontal({
      name: safe(product.value.name),
      priceFinal: money(finalPrice.value),
      priceList: money(priceList.value),
      hasDiscount: hasDiscount.value,
      offPct: offPct.value,
      showInstallments: showInstallments.value,
      installment: money(installmentAmount.value),
      sku: safe(product.value.sku),
      code: safe(product.value.code),
      qr: qrDataUrl.value,
      url: ecommerceUrl.value,
      pay: "Tarjetas · Transferencia · Efectivo · QR",
    });

    const w = window.open("", "_blank", "width=740,height=520");
    if (!w) throw new Error("Popup bloqueado para impresión.");

    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();

    setTimeout(() => {
      try { w.print(); } catch {}
    }, 250);
  } catch (e) {
    error.value = e?.message || "No se pudo imprimir.";
  } finally {
    loadingPrint.value = false;
  }
}

function buildPrintHtmlHorizontal({
  name, priceFinal, priceList, hasDiscount, offPct, showInstallments, installment, sku, code, qr, url, pay
}) {
  // ✅ HORIZONTAL: 58×40mm con aire (no se pisa)
  // ✅ QR grande derecha
  // ✅ Pagos + URL abajo (sin romper)
  const shortUrl = String(url || "").replace(/^https?:\/\//, "");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Etiqueta</title>
  <style>
    @page { size: 58mm 40mm; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body { font-family: Arial, Helvetica, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

    .label{
      width: 58mm;
      height: 40mm;
      box-sizing: border-box;
      padding: 3mm;
      display: grid;
      grid-template-columns: 1fr 20mm; /* derecha QR más grande */
      grid-template-rows: auto auto auto 1fr auto; /* footer abajo */
      column-gap: 2.2mm;
      row-gap: 1.1mm;
    }

    .name{
      grid-column: 1 / 2;
      font-weight: 900;
      font-size: 10.6pt;
      line-height: 1.06;
      letter-spacing: .1px;
      max-height: 12.5mm; /* 2 líneas aprox */
      overflow: hidden;
    }

    .qr{
      grid-column: 2 / 3;
      grid-row: 1 / 5;
      align-self: start;
      justify-self: end;
      width: 20mm;
      height: 20mm;
      display: grid;
      place-items: center;
    }
    .qr img{ width: 100%; height: 100%; object-fit: contain; }

    .oldrow{
      grid-column: 1 / 2;
      display:flex;
      align-items: baseline;
      gap: 2mm;
      margin-top: .2mm;
    }
    .old{
      font-weight: 800;
      font-size: 7.4pt;
      opacity: .75;
      text-decoration: line-through;
    }
    .off{
      font-weight: 900;
      font-size: 7.4pt;
    }

    .price{
      grid-column: 1 / 2;
      font-weight: 900;
      font-size: 18.5pt; /* ✅ más grande */
      line-height: 1;
      margin-top: .4mm;
    }

    .install{
      grid-column: 1 / 2;
      font-weight: 900;
      font-size: 7.3pt;
      opacity: .92;
      margin-top: .2mm;
    }

    .meta{
      grid-column: 1 / 2;
      display:grid;
      gap: .5mm;
      margin-top: .2mm;
      font-size: 7.8pt;
      font-weight: 900;
      letter-spacing: .1px;
    }
    .meta span{ font-weight: 800; }

    .footer{
      grid-column: 1 / 3;
      grid-row: 5 / 6;
      display:flex;
      flex-direction: column;
      gap: .6mm;
      align-self: end;
      padding-top: .4mm;
    }

    .payline{
      font-size: 7.0pt;
      font-weight: 900;
      opacity: .92;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .urlline{
      font-size: 6.4pt;
      opacity: .78;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      word-break: keep-all;
    }
  </style>
</head>
<body>
  <div class="label">
    <div class="name">${escapeHtml(name)}</div>

    <div class="qr">${qr ? `<img src="${qr}" alt="QR"/>` : ""}</div>

    ${hasDiscount
      ? `<div class="oldrow"><span class="old">${escapeHtml(priceList)}</span><span class="off">${escapeHtml(String(offPct))}% OFF</span></div>`
      : `<div style="grid-column:1/2;height:1mm;"></div>`
    }

    <div class="price">${escapeHtml(priceFinal)}</div>

    ${showInstallments ? `<div class="install">En 6x ${escapeHtml(installment)} (precio lista)</div>` : ``}

    <div class="meta">
      <div>SKU: <span>${escapeHtml(sku)}</span></div>
      ${code && code !== "—" ? `<div>COD: <span>${escapeHtml(code)}</span></div>` : ``}
    </div>

    <div class="footer">
      <div class="payline">Medios: ${escapeHtml(pay)}</div>
      <div class="urlline">${escapeHtml(shortUrl)}</div>
    </div>
  </div>
</body>
</html>`;
}


function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================
   ✅ PDF DOWNLOAD — HORIZONTAL 58×40mm
   (arregla el “roto”)
========================= */
async function downloadPdfLabel() {
  if (!product.value) return;

  loadingPdf.value = true;
  try {
    if (!qrDataUrl.value) await buildQr();

    const W = 58; // mm
    const H = 40; // mm

    const doc = new jsPDF({
      unit: "mm",
      format: [W, H],
      orientation: "landscape",
      compress: true,
    });

    const pad = 3.0;
    const gap = 2.2;
    const qrSize = 20.0;

    const xL = pad;
    const leftW = W - pad * 2 - qrSize - gap;

    const xQR = W - pad - qrSize;
    const yQR = pad;

    const shortUrl = String(ecommerceUrl.value || "").replace(/^https?:\/\//, "");
    const payLine = "Tarjetas · Transferencia · Efectivo · QR";

    let y = pad;

    // 1) NOMBRE (2 líneas)
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.0);

    const nameLines = doc.splitTextToSize(safe(product.value.name), leftW).slice(0, 2);
    doc.text(nameLines, xL, y + 4.0);
    y += 4.0 + nameLines.length * 4.0; // aire

    // 2) OLD + OFF (si aplica)
    if (hasDiscount.value) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.6);
      doc.setTextColor(60);

      const oldTxt = money(priceList.value);
      doc.text(oldTxt, xL, y + 2.8);

      // strike line
      const w = doc.getTextWidth(oldTxt);
      doc.setDrawColor(80);
      doc.setLineWidth(0.25);
      doc.line(xL, y + 2.2, xL + w, y + 2.2);

      doc.setTextColor(0);
      doc.text(`${offPct.value}% OFF`, xL + w + 2.0, y + 2.8);

      y += 4.1;
    } else {
      y += 1.2;
    }

    // 3) PRECIO FINAL (grande)
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(19.0);
    doc.text(money(finalPrice.value), xL, y + 6.3);
    y += 7.6;

    // 4) CUOTAS (si aplica)
    if (showInstallments.value) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.6);
      doc.text(`En 6x ${money(installmentAmount.value)} (precio lista)`, xL, y + 2.8);
      y += 4.2;
    }

    // 5) META SKU/COD
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.text(`SKU: ${safe(product.value.sku)}`, xL, y + 3.1);
    y += 4.0;

    const code = String(product.value?.code || "").trim();
    if (code) {
      doc.text(`COD: ${safe(code)}`, xL, y + 3.1);
      y += 4.0;
    }

    // 6) FOOTER (pagos + URL) abajo fijo (no se pisa)
    const footerY1 = H - pad - 5.0;
    const footerY2 = H - pad - 1.6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.0);
    // recorte simple por ancho (jsPDF no tiene ellipsis automático)
    const maxPayW = W - pad * 2;
    let payTxt = `Medios: ${payLine}`;
    while (doc.getTextWidth(payTxt) > maxPayW && payTxt.length > 10) payTxt = payTxt.slice(0, -2);
    if (!payTxt.endsWith(payLine)) payTxt = payTxt.replace(/\s*$/, "") + "…";
    doc.text(payTxt, pad, footerY1);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.4);
    let urlTxt = shortUrl;
    while (doc.getTextWidth(urlTxt) > maxPayW && urlTxt.length > 12) urlTxt = urlTxt.slice(0, -2);
    if (urlTxt !== shortUrl) urlTxt = urlTxt.replace(/\s*$/, "") + "…";
    doc.text(urlTxt, pad, footerY2);

    // 7) QR grande
    if (qrDataUrl.value) {
      doc.addImage(qrDataUrl.value, "PNG", xQR, yQR, qrSize, qrSize);
    }

    const fileNameSafe = (safe(product.value.name) || "producto").replace(/[\\/:*?"<>|]/g, "").slice(0, 40);
    doc.save(`Etiqueta_${product.value.id || productId.value}_${fileNameSafe}.pdf`);
  } catch (e) {
    error.value = e?.message || "No se pudo generar el PDF.";
  } finally {
    loadingPdf.value = false;
  }
}


watch(() => ecommerceUrl.value, () => buildQr());
onMounted(fetchProduct);
</script>

<style scoped>
.pd { padding: 12px; }
.pd-top { padding: 10px 12px; position: sticky; top: 0; z-index: 5; }
.pd-top-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.pd-left { display: flex; align-items: center; gap: 10px; min-width: 280px; flex: 1; }
.pd-title { min-width: 0; }
.pd-h1 { font-size: 18px; font-weight: 900; line-height: 1.1; }
.pd-sub { font-size: 12px; opacity: .8; margin-top: 2px; }
.pd-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.pd-body { margin-top: 12px; }
.pd-loading { padding: 22px; display: grid; place-items: center; }

.pd-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 12px; }
@media (max-width: 1100px) { .pd-grid { grid-template-columns: 1fr; } }

.pd-card { padding: 14px; }
.pd-card-wide { grid-column: 1 / -1; }

.pd-card-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.pd-card-title { font-weight: 900; }

.pd-kv { display: grid; grid-template-columns: 140px 1fr; gap: 8px 12px; align-items: baseline; }
.pd-kv .k { font-size: 12px; opacity: .75; }
.pd-kv .v { font-weight: 800; word-break: break-word; }

.pd-desc { margin-top: 6px; padding: 10px 12px; border-radius: 12px; background: rgba(0,0,0,.04); white-space: pre-wrap; min-height: 52px; }

.pd-price-block { display: grid; gap: 6px; }
.pd-oldrow { display: flex; align-items: baseline; gap: 10px; }
.pd-oldprice { font-size: 13px; opacity: .65; text-decoration: line-through; font-weight: 800; }
.pd-off { font-size: 13px; font-weight: 900; opacity: .95; }
.pd-finalprice { font-size: 34px; font-weight: 900; line-height: 1; }
.pd-install { font-size: 13px; font-weight: 800; opacity: .85; }

.pd-paymethods { margin-top: 6px; padding: 10px 12px; border-radius: 12px; background: rgba(0,0,0,.04); }
.pd-pay-title { font-weight: 900; font-size: 12px; opacity: .9; }
.pd-pay-line { font-size: 12px; opacity: .85; margin-top: 2px; }

.pd-qr-wrap { display: grid; place-items: center; padding: 10px; border-radius: 14px; background: rgba(0,0,0,.04); }
.pd-qr { width: 170px; max-width: 100%; height: auto; }
.pd-url { margin-top: 10px; opacity: .75; word-break: break-all; }

.pd-stock { display: grid; gap: 8px; }
.pd-stock-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 12px; background: rgba(0,0,0,.04); }
.pd-stock-row .n { font-weight: 900; }
.pd-stock-row .q { font-weight: 900; }

/* Preview dialog */
.pd-print-preview { border: 1px dashed rgba(0,0,0,.25); border-radius: 14px; padding: 12px; display: grid; gap: 8px; }
.pp-name { font-weight: 900; line-height: 1.1; }
.pp-oldrow { display:flex; align-items: baseline; gap: 10px; }
.pp-old { font-weight: 900; opacity: .65; text-decoration: line-through; }
.pp-off { font-weight: 900; opacity: .95; }
.pp-price { font-weight: 900; font-size: 26px; line-height: 1; }
.pp-install { font-size: 13px; font-weight: 900; opacity: .85; }
.pp-meta { font-size: 12px; opacity: .85; font-weight: 800; }
.pp-pay { padding: 10px 12px; border-radius: 12px; background: rgba(0,0,0,.04); }
.pp-pay-t { font-weight: 900; font-size: 12px; opacity: .9; }
.pp-pay-l { font-size: 12px; opacity: .85; margin-top: 2px; }
.pp-qr img { width: 160px; height: auto; }
.pp-url { font-size: 11px; opacity: .75; word-break: break-all; }
</style>
