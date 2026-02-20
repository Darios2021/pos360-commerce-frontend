// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/products/utils/labelPdfA4.js
//
// ✅ FIX FINAL “LOGOS CHICOS / ESTIRADOS”
// - Los logos ahora se dibujan con “fit dentro de caja” (contain) usando el aspect REAL
// - Cada logo tiene una caja (slot) de ancho fijo, y adentro se centra sin deformar
// - Aumenté el alto de logos (payLogoH) y el ancho de slot para que se vean GRANDES
// - “Medios:” y URL bajan a un tamaño razonable (no gigantes)
//
// Requiere: npm i jspdf qrcode

import { jsPDF } from "jspdf";
import QRCode from "qrcode";

/* =========================
   Assets
========================= */
const STORE_LOGO_URL =
  "https://storage-files.cingulado.org/pos360/media/1770906123233-3976439306ab1686.webp";

const PAY_LOGOS = [
  { key: "credito_sj", url: "https://storage-files.cingulado.org/pos360/media/1769958150069-55eff4121596f9f8.webp" },
  { key: "mercadopago", url: "https://storage-files.cingulado.org/pos360/media/1769785611712-ef532460bf2a0059.webp" },
  { key: "mastercard", url: "https://storage-files.cingulado.org/pos360/media/1769785816768-9f322efa725c3d5e.webp" },
  { key: "visa", url: "https://storage-files.cingulado.org/pos360/media/1769785603289-8ef15a33274405c8.webp" },
  { key: "naranja", url: "https://storage-files.cingulado.org/pos360/media/1769785599197-627b0a0bac168cee.webp" },
];

/* =========================
   Helpers
========================= */
function s(v, fb = "") {
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
function ellipsize(doc, text, maxW) {
  let t = String(text || "");
  while (t.length > 6 && doc.getTextWidth(t) > maxW) t = t.slice(0, -2);
  if (t !== String(text || "")) t = t.replace(/\s*$/, "") + "…";
  return t;
}
function pickPrices(product) {
  const priceList = n(
    product?.price_list ??
      product?.list_price ??
      product?.price_regular ??
      product?.price_base ??
      product?.price ??
      0,
    0
  );

  const priceDiscount = n(
    product?.price_discount ??
      product?.final_price ??
      product?.sale_price ??
      product?.price_sale ??
      0,
    0
  );

  const finalPrice =
    priceDiscount > 0 && priceList > 0
      ? Math.min(priceDiscount, priceList)
      : priceDiscount > 0
        ? priceDiscount
        : priceList;

  const hasDiscount = priceList > 0 && finalPrice > 0 && finalPrice < priceList;

  const offPct = hasDiscount
    ? Math.max(1, Math.min(99, Math.round(((priceList - finalPrice) / priceList) * 100)))
    : 0;

  return { priceList, finalPrice, hasDiscount, offPct };
}
function computeInstallments(priceList) {
  const pl = Math.round(n(priceList, 0));
  if (pl >= 100000 && pl <= 150000) {
    return { count: 3, amount: Math.round(pl / 3), label: "En 3x (precio lista)" };
  }
  if (pl > 150000) {
    return { count: 6, amount: Math.round(pl / 6), label: "En 6x (precio lista)" };
  }
  return null;
}

/* =========================
   WEBP -> PNG dataURL + aspect real
========================= */
const _imgCache = new Map();

/**
 * @returns {Promise<{png:string, w:number, h:number, aspect:number} | null>}
 */
async function loadPngWithMeta(url) {
  const u = String(url || "").trim();
  if (!u) return null;
  if (_imgCache.has(u)) return _imgCache.get(u);

  const prom = new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const w = img.naturalWidth || img.width || 1;
          const h = img.naturalHeight || img.height || 1;
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          const png = canvas.toDataURL("image/png");
          resolve({ png, w, h, aspect: w / h });
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = u;
    } catch {
      resolve(null);
    }
  });

  _imgCache.set(u, prom);
  return prom;
}

/* =========================
   Layouts
========================= */
function getA4Landscape() {
  return { W: 297, H: 210, orientation: "landscape" };
}
function getA4Portrait() {
  return { W: 210, H: 297, orientation: "portrait" };
}
function computeBig100Layout() {
  const A4 = getA4Landscape();
  const ratio = 60 / 100;

  const targetW = A4.W * 0.70;
  let boxW = targetW;
  let boxH = boxW * ratio;

  const maxH = A4.H * 0.86;
  if (boxH > maxH) {
    boxH = maxH;
    boxW = boxH / ratio;
  }

  return {
    page: A4,
    box: { x: (A4.W - boxW) / 2, y: (A4.H - boxH) / 2, w: boxW, h: boxH },
    pad: Math.max(6, boxW * 0.04),
    qr: Math.max(28, boxW * 0.17),
  };
}
function computeGrid58Layout() {
  const A4 = getA4Portrait();

  const CELL_W = 58;
  const CELL_H = 40;
  const COLS = 3;
  const ROWS = 6;
  const GAP_X = 3;
  const GAP_Y = 3;

  const gridW = COLS * CELL_W + (COLS - 1) * GAP_X;
  const gridH = ROWS * CELL_H + (ROWS - 1) * GAP_Y;

  return {
    page: A4,
    cell: { w: CELL_W, h: CELL_H },
    grid: {
      cols: COLS,
      rows: ROWS,
      gapX: GAP_X,
      gapY: GAP_Y,
      marginL: Math.max(6, (A4.W - gridW) / 2),
      marginT: Math.max(8, (A4.H - gridH) / 2),
    },
    pad: 3.0,
    qr: 18,
  };
}

/* =========================
   Drawing
========================= */
function drawHeader(doc, { x, y, w, headerH, pad }, data) {
  doc.setFillColor(248, 248, 248);
  doc.rect(x, y, w, headerH, "F");

  doc.setDrawColor(220);
  doc.setLineWidth(0.3);
  doc.line(x, y + headerH, x + w, y + headerH);

  const xL = x + pad;

  // ✅ SOLO LOGO tienda (sin texto)
  if (data.storeLogo?.png) {
    const logoH = data.storeLogoH;
    // fit por ancho máximo, manteniendo aspect
    const naturalW = logoH * data.storeLogo.aspect;
    const logoW = Math.min(data.storeLogoWMax, naturalW);
    const logoY = y + (headerH - logoH) / 2;
    doc.addImage(data.storeLogo.png, "PNG", xL, logoY, logoW, logoH);
  }

  // Sucursal derecha
  doc.setFont("helvetica", "normal");
  doc.setFontSize(data.fsBranch);
  doc.setTextColor(40);

  const brTxt = ellipsize(doc, data.branchName, w * 0.38);
  const brW = doc.getTextWidth(brTxt);
  const yText = y + headerH - data.headerTextDrop;
  doc.text(brTxt, x + w - pad - brW, yText);
}

/**
 * ✅ Dibuja un logo dentro de un “slot” sin deformar (contain).
 * slotW fijo, slotH fijo.
 */
function drawLogoContain(doc, png, aspect, x, y, slotW, slotH) {
  if (!png || !aspect || slotW <= 0 || slotH <= 0) return;

  // Queremos encajar manteniendo aspect:
  // si el logo es ancho, limitamos por slotW; si es alto, por slotH
  let drawW = slotW;
  let drawH = drawW / aspect;

  if (drawH > slotH) {
    drawH = slotH;
    drawW = drawH * aspect;
  }

  const dx = x + (slotW - drawW) / 2;
  const dy = y + (slotH - drawH) / 2;

  doc.addImage(png, "PNG", dx, dy, drawW, drawH);
}

/**
 * ✅ Row de logos: cada uno en su slot (sin estirar)
 */
function drawPayLogosRow(doc, x, yTop, maxW, logosMeta, cfg) {
  const slotH = cfg.payLogoH;
  const slotW = cfg.paySlotW;
  const gap = cfg.payLogoGap;

  let xx = x;
  for (const it of logosMeta) {
    if (!it?.png || !it?.aspect) continue;
    if (xx + slotW > x + maxW) break;

    drawLogoContain(doc, it.png, it.aspect, xx, yTop, slotW, slotH);
    xx += slotW + gap;
  }
  return xx;
}

function drawLabel(doc, { x, y, w, h, pad, qrSize }, data) {
  doc.setDrawColor(220);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h);

  drawHeader(doc, { x, y, w, headerH: data.headerH, pad }, data);

  const xL = x + pad;
  const contentTop = y + data.headerH + pad * 0.8;

  const xQR = x + w - pad - qrSize;
  const yQR = contentTop;

  const leftW = w - pad * 2 - qrSize - 4;

  if (data.qrDataUrl) doc.addImage(data.qrDataUrl, "PNG", xQR, yQR, qrSize, qrSize);

  // Nombre
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(data.fsName);
  const nameLines = doc.splitTextToSize(data.name, leftW).slice(0, 2);
  doc.text(nameLines, xL, contentTop + data.nameTop);
  let yy = contentTop + data.nameTop + nameLines.length * data.nameLine;

  // Precio lista tachado
  if (data.priceList > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(data.fsOld);
    doc.setTextColor(70);

    const oldTxt = money(data.priceList);
    doc.text(oldTxt, xL, yy + data.oldTop);

    const ww = doc.getTextWidth(oldTxt);
    doc.setDrawColor(90);
    doc.setLineWidth(0.4);
    doc.line(xL, yy + data.oldStrike, xL + ww, yy + data.oldStrike);

    if (data.hasDiscount && data.offPct > 0) {
      doc.setTextColor(0);
      doc.text(`${data.offPct}% OFF`, xL + ww + 3, yy + data.oldTop);
    }
    yy += data.oldAdvance;
  } else {
    yy += data.noOldAdvance;
  }

  // Precio final grande
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(data.fsPrice);
  doc.text(money(data.finalPrice), xL, yy + data.priceTop);
  yy += data.priceAdvance;

  // Cuotas
  if (data.installment) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(data.fsInstall);
    doc.setTextColor(0);
    doc.text(`${data.installment.label}: ${money(data.installment.amount)}`, xL, yy + data.installTop);
    yy += data.installAdvance;
  }

  // SKU / COD
  doc.setFont("helvetica", "bold");
  doc.setFontSize(data.fsMeta);
  doc.setTextColor(0);

  if (data.sku) {
    doc.text(ellipsize(doc, `SKU: ${data.sku}`, leftW), xL, yy + data.metaTop);
    yy += data.metaAdvance;
  }
  if (data.code) {
    doc.text(ellipsize(doc, `COD: ${data.code}`, leftW), xL, yy + data.metaTop);
    yy += data.metaAdvance;
  }

  // Footer
  const footerY2 = y + h - pad - data.footerLine2;
  const footerY1 = y + h - pad - data.footerLine1;

  // ✅ “Medios:” NO gigante
  doc.setFont("helvetica", "bold");
  doc.setFontSize(data.fsFooter1);
  doc.setTextColor(0);
  doc.text("Medios:", xL, footerY1);

  // Logos: en slots sin estirar
  const labelW = doc.getTextWidth("Medios:");
  const logosX = xL + labelW + 4;

  // yTop del row (porque ahora es caja)
  const logosYTop = footerY1 - data.payLogoH + 1.0;

  drawPayLogosRow(
    doc,
    logosX,
    logosYTop,
    w - pad * 2 - (logosX - xL),
    data.payLogosMeta || [],
    data
  );

  // URL más chica
  doc.setFont("helvetica", "normal");
  doc.setFontSize(data.fsFooter2);
  doc.setTextColor(60);
  doc.text(ellipsize(doc, data.shortUrl, w - pad * 2), xL, footerY2);
}

/* =========================
   Build docs
========================= */
async function buildDocA4({ product, size, copies, qrValue, title, branchName } = {}) {
  const p = product || {};
  const name = s(p.name || p.title || "Producto", "Producto");
  const sku = s(p.sku, "");
  const code = s(p.code || p.internal_code || p.barcode, "");

  const { priceList, finalPrice, hasDiscount, offPct } = pickPrices(p);
  const installment = computeInstallments(priceList);

  const ecommerceUrl =
    s(qrValue) ||
    `${window.location.origin}/shop/product/${p.id ?? p.product_id ?? ""}`;

  const qrDataUrl = await QRCode.toDataURL(ecommerceUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 7,
  });

  const shortUrl = String(ecommerceUrl || "").replace(/^https?:\/\//, "");

  const branchTxt =
    s(branchName) ||
    s(localStorage?.getItem?.("pos_branch_name")) ||
    s(localStorage?.getItem?.("shop_branch_name")) ||
    "Casa Central";

  const storeLogo = await loadPngWithMeta(STORE_LOGO_URL);

  const payLogosMeta = [];
  for (const it of PAY_LOGOS) {
    const meta = await loadPngWithMeta(it.url);
    if (meta?.png) payLogosMeta.push(meta);
  }

  const totalCopies = Math.max(1, Number(copies || 1));
  const is58 = String(size) === "58";

  if (!is58) {
    const L = computeBig100Layout();

    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: L.page.orientation,
      compress: true,
    });

    const data = {
      branchName: branchTxt,
      storeLogo,
      headerH: 15.2,
      fsBranch: 10.0,
      headerTextDrop: 4.6,
      storeLogoH: 9.0,
      storeLogoWMax: 40.0,

      name,
      sku,
      code,
      priceList,
      finalPrice,
      hasDiscount,
      offPct,
      installment,
      qrDataUrl,
      shortUrl,
      payLogosMeta,

      fsName: 17.5,
      nameTop: 7.2,
      nameLine: 6.6,

      fsOld: 10.6,
      oldTop: 5.7,
      oldStrike: 4.9,
      oldAdvance: 9.2,
      noOldAdvance: 4.0,

      fsPrice: 39,
      priceTop: 12.2,
      priceAdvance: 15.2,

      fsInstall: 11.4,
      installTop: 5.2,
      installAdvance: 7.2,

      fsMeta: 11.0,
      metaTop: 5.0,
      metaAdvance: 6.2,

      // ✅ Footer más prolijo
      fsFooter1: 10.0,  // antes gigante
      fsFooter2: 8.2,
      footerLine1: 8.3,
      footerLine2: 3.8,

      // ✅ LOGOS GRANDES SIN ESTIRAR
      payLogoH: 9.0,        // más alto => más grande
      paySlotW: 24.0,       // slot ancho fijo
      payLogoGap: 4.0,      // separación
    };

    for (let i = 0; i < totalCopies; i++) {
      if (i > 0) doc.addPage();
      drawLabel(doc, { x: L.box.x, y: L.box.y, w: L.box.w, h: L.box.h, pad: L.pad, qrSize: L.qr }, data);
    }

    doc.setProperties({ title: title || "Etiqueta A4 (100 grande)" });
    return doc;
  }

  // 58×40 grilla A4 vertical
  const G = computeGrid58Layout();
  const capacity = G.grid.cols * G.grid.rows;
  const pages = Math.ceil(totalCopies / capacity);

  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: G.page.orientation,
    compress: true,
  });

  const data58 = {
    branchName: branchTxt,
    storeLogo,
    headerH: 8.4,
    fsBranch: 6.6,
    headerTextDrop: 2.7,
    storeLogoH: 5.3,
    storeLogoWMax: 22.0,

    name,
    sku,
    code,
    priceList,
    finalPrice,
    hasDiscount,
    offPct,
    installment,
    qrDataUrl,
    shortUrl,
    payLogosMeta,

    fsName: 10.4,
    nameTop: 4.0,
    nameLine: 3.9,

    fsOld: 7.2,
    oldTop: 2.8,
    oldStrike: 2.2,
    oldAdvance: 4.0,
    noOldAdvance: 2.0,

    fsPrice: 20.6,
    priceTop: 6.8,
    priceAdvance: 7.6,

    fsInstall: 6.9,
    installTop: 3.4,
    installAdvance: 4.0,

    fsMeta: 8.0,
    metaTop: 3.0,
    metaAdvance: 3.8,

    fsFooter1: 6.4,
    fsFooter2: 6.0,
    footerLine1: 4.9,
    footerLine2: 1.6,

    // ✅ en 58×40 no entran enormes, pero SIN estirar igual
    payLogoH: 4.3,
    paySlotW: 11.2,
    payLogoGap: 1.4,
  };

  let printed = 0;
  for (let pg = 0; pg < pages; pg++) {
    if (pg > 0) doc.addPage();

    for (let r = 0; r < G.grid.rows; r++) {
      for (let c = 0; c < G.grid.cols; c++) {
        if (printed >= totalCopies) break;

        const x = G.grid.marginL + c * (G.cell.w + G.grid.gapX);
        const y = G.grid.marginT + r * (G.cell.h + G.grid.gapY);

        drawLabel(doc, { x, y, w: G.cell.w, h: G.cell.h, pad: G.pad, qrSize: G.qr }, data58);
        printed++;
      }
      if (printed >= totalCopies) break;
    }
  }

  doc.setProperties({ title: title || "Etiquetas A4 (58 grilla)" });
  return doc;
}

/* =========================
   Public API
========================= */
export async function downloadLabelPdfA4({
  product,
  size = "100",
  copies = 1,
  qrValue = "",
  title = "",
  branchName = "",
} = {}) {
  const doc = await buildDocA4({ product, size, copies, qrValue, title, branchName });

  const nm = s(product?.name || "Producto")
    .replace(/[\\/:*?"<>|]/g, "")
    .slice(0, 40);

  const id = s(product?.id || product?.product_id || "");
  const mode = String(size) === "58" ? "58x40" : "100x60_GRANDE";

  doc.save(`Etiqueta_A4_${mode}_${id}_${nm}.pdf`);
}

export async function printLabelA4Pdf({
  product,
  size = "100",
  copies = 1,
  qrValue = "",
  title = "",
  branchName = "",
} = {}) {
  const doc = await buildDocA4({ product, size, copies, qrValue, title, branchName });

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
}