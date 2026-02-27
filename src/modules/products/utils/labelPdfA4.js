// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/products/utils/labelPdfA4.js
//
// ✅ FIXES (LO QUE PEDISTE):
// 1) ✅ LOGO ARRIBA IZQ MUCHO MÁS GRANDE (100x60 / “GRANDE”)
// 2) ✅ LOGOS DE MEDIOS MÁS GRANDES + ✅ Crédito San Juan (primero) MÁS GRANDE
// 3) ✅ FUENTES MÁS GRANDES (precio/nombre/old/off/cuotas/medios)
// 4) ✅ SUCURSAL CORRECTA AL IMPRIMIR:
//    - Prioriza branchName (param) si viene
//    - Si no viene, busca en MUCHAS keys de localStorage/sessionStorage
//    - Si encuentra JSON, extrae name/title/branch_name
// 5) ✅ CUOTAS MÁS GRANDES (en ambos tamaños) y SIN "(precio lista)"
// 6) ✅ FIX REAL: el 58 estaba “roto” (Medios pisaba el precio). Ahora:
//    - drawLabel58 es dinámico con footer reservado (igual filosofía que el grande)
//    - Medios nunca pisa contenido
//
// Mantiene:
// - Marca/Modelo
// - Precio lista tachado + %OFF
// - Precio final grande auto-fit (y garantiza que entren cuotas cuando aplica)
// - QR + Medios + URL
// - Logos contain (sin estirar)

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

// ✅ Cuotas según PRECIO LISTA (como pediste)
// ✅ FIX: NO debe decir "(precio lista)" (interno)
function computeInstallments(priceList) {
  const pl = Math.round(n(priceList, 0));
  if (pl >= 100000 && pl <= 150000) {
    return { count: 3, amount: Math.round(pl / 3), label: "En 3x" };
  }
  if (pl > 150000) {
    return { count: 6, amount: Math.round(pl / 6), label: "En 6x" };
  }
  return null;
}

function pickBrand(product) {
  return s(
    product?.brand ??
      product?.brand_name ??
      product?.marca ??
      product?.marca_nombre ??
      product?.manufacturer ??
      "",
    ""
  );
}
function pickModel(product) {
  return s(
    product?.model ??
      product?.model_name ??
      product?.modelo ??
      product?.modelo_nombre ??
      product?.variant ??
      "",
    ""
  );
}

/* =========================
   ✅ Branch name robusto
========================= */
function safeParseJSON(v) {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}
function extractBranchNameFromAny(v) {
  if (!v) return "";
  if (typeof v === "string") {
    const str = v.trim();
    if (!str) return "";
    if ((str.startsWith("{") && str.endsWith("}")) || (str.startsWith("[") && str.endsWith("]"))) {
      const j = safeParseJSON(str);
      const nm = extractBranchNameFromAny(j);
      return nm || "";
    }
    return str;
  }
  if (typeof v === "object") {
    return (
      s(v.name) ||
      s(v.title) ||
      s(v.branch_name) ||
      s(v.branchName) ||
      s(v.label) ||
      s(v.nombre) ||
      ""
    );
  }
  return "";
}
function getStorageAny(key) {
  try {
    const a = localStorage?.getItem?.(key);
    if (a) return a;
  } catch {}
  try {
    const b = sessionStorage?.getItem?.(key);
    if (b) return b;
  } catch {}
  return "";
}
function resolveBranchName(branchNameParam) {
  const direct = extractBranchNameFromAny(branchNameParam);
  if (direct) return direct;

  const KEYS = [
    "pos_branch_name",
    "shop_branch_name",
    "branch_name",
    "branchName",
    "selected_branch_name",
    "selectedBranchName",
    "pos_branch",
    "shop_branch",
    "pos_branch_selected",
    "shop_branch_selected",
    "branchSelected",
    "branch_selected",
    "pos_branch_selected_obj",
    "shop_branch_selected_obj",
    "pos_branch_selected_name",
    "shop_branch_selected_name",
  ];

  for (const k of KEYS) {
    const raw = getStorageAny(k);
    const nm = extractBranchNameFromAny(raw);
    if (nm) return nm;
  }

  return "Casa Central";
}

/**
 * ✅ Layout “TOP + baseline”
 * jsPDF: fontSize es pt, posiciones son mm.
 * 1pt = 0.3528mm.
 */
function ptToMm(pt) {
  return pt * 0.3528;
}
function lineH(pt, mult = 1.18) {
  return ptToMm(pt) * mult;
}
function baselineFromTop(pt) {
  return ptToMm(pt) * 0.78;
}
function drawTextAtTop(doc, text, x, yTop, fontSize, fontStyle = "normal", color = [0, 0, 0]) {
  doc.setFont("helvetica", fontStyle);
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(String(text), x, yTop + baselineFromTop(fontSize));
}

/* =========================
   WEBP -> PNG + aspect
========================= */
const _imgCache = new Map();
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
    pad: Math.max(8.2, boxW * 0.05),
    qr: Math.max(40, boxW * 0.215),
  };
}

/**
 * ✅ 58 INTERMEDIA (más grande por hoja)
 * 70x50 (aprox) — 2x5 por página A4 portrait
 */
function computeGrid58Layout() {
  const A4 = getA4Portrait();

  const CELL_W = 70;
  const CELL_H = 50;
  const COLS = 2;
  const ROWS = 5;
  const GAP_X = 4;
  const GAP_Y = 4;

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
    pad: 3.2,
    qr: 19.5,
  };
}

/* =========================
   Drawing helpers
========================= */
function drawLogoContain(doc, png, aspect, x, y, slotW, slotH) {
  if (!png || !aspect || slotW <= 0 || slotH <= 0) return;

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
 * ✅ FIX: fila de medios con altura REAL + crédito más grande
 * - cfg.payRowH define el alto total de la fila
 * - creditoBoost agranda el primer logo sin desalinear
 */
function drawPayLogosRow(doc, x, yTop, maxW, logosMeta, cfg) {
  const baseH = cfg.payLogoH;
  const baseW = cfg.paySlotW;
  const gap = cfg.payLogoGap;

  const rowH = cfg.payRowH || baseH;

  let xx = x;
  for (const it of logosMeta) {
    if (!it?.png || !it?.aspect) continue;

    const isCredito = it.key === "credito_sj";
    const mult = isCredito ? (cfg.creditoBoost || 1.0) : 1.0;

    const slotH = baseH * mult;
    const slotW = baseW * mult;

    if (xx + slotW > x + maxW) break;

    const yy = yTop + (rowH - slotH) / 2; // ✅ centrado vertical
    drawLogoContain(doc, it.png, it.aspect, xx, yy, slotW, slotH);

    xx += slotW + gap;
  }
}

function drawHeader(doc, { x, y, w, headerH, pad }, data) {
  doc.setFillColor(248, 248, 248);
  doc.rect(x, y, w, headerH, "F");

  doc.setDrawColor(220);
  doc.setLineWidth(0.28);
  doc.line(x, y + headerH, x + w, y + headerH);

  const xL = x + pad;

  if (data.storeLogo?.png) {
    const logoH = data.storeLogoH;
    const naturalW = logoH * data.storeLogo.aspect;
    const logoW = Math.min(data.storeLogoWMax, naturalW);
    const logoY = y + (headerH - logoH) / 2;
    doc.addImage(data.storeLogo.png, "PNG", xL, logoY, logoW, logoH);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(data.fsBranch);
  doc.setTextColor(35);

  const brTxt = ellipsize(doc, data.branchName, w * 0.46);
  const brW = doc.getTextWidth(brTxt);
  const yText = y + headerH - data.headerTextDrop;
  doc.text(brTxt, x + w - pad - brW, yText);
}

/* =========================
   ✅ DRAW GRANDE (100x60)
========================= */
function drawLabelBig(doc, { x, y, w, h, pad, qrSize }, data) {
  doc.setDrawColor(220);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h);

  drawHeader(doc, { x, y, w, headerH: data.headerH, pad }, data);

  const xL = x + pad;
  const contentTop = y + data.headerH + pad * 0.62;

  const footerTop = y + h - pad - data.footerReserveH;

  const xQR = x + w - pad - qrSize;
  const leftW = w - pad * 2 - qrSize - data.qrGap;

  if (data.qrDataUrl) doc.addImage(data.qrDataUrl, "PNG", xQR, contentTop, qrSize, qrSize);

  let yTop = contentTop + data.topPad;

  // Nombre (2 líneas)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(data.fsName);
  const nameLines = doc.splitTextToSize(data.name, leftW).slice(0, 2);
  for (let i = 0; i < nameLines.length; i++) {
    drawTextAtTop(doc, nameLines[i], xL, yTop + i * lineH(data.fsName, 1.10), data.fsName, "bold", [0, 0, 0]);
  }
  yTop += nameLines.length * lineH(data.fsName, 1.10) + data.gapAfterName;

  // Marca/Modelo
  const brandModel = [data.brand, data.model].filter(Boolean).join(" · ");
  if (brandModel) {
    drawTextAtTop(doc, ellipsize(doc, brandModel, leftW), xL, yTop, data.fsBrandModel, "bold", [55, 55, 55]);
    yTop += lineH(data.fsBrandModel, 1.08) + data.gapAfterBrand;
  } else {
    yTop += data.gapAfterBrand;
  }

  // Old + OFF
  if (data.priceList > 0) {
    const oldTop = yTop;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(data.fsOld);

    const oldTxt = money(data.priceList);
    drawTextAtTop(doc, oldTxt, xL, oldTop, data.fsOld, "bold", [65, 65, 65]);

    const ww = doc.getTextWidth(oldTxt);
    const strikeY = oldTop + baselineFromTop(data.fsOld) - ptToMm(data.fsOld) * 0.28;
    doc.setDrawColor(80);
    doc.setLineWidth(0.42);
    doc.line(xL, strikeY, xL + ww, strikeY);

    if (data.hasDiscount && data.offPct > 0) {
      drawTextAtTop(doc, `${data.offPct}% OFF`, xL + ww + 8, oldTop, data.fsOld, "bold", [0, 0, 0]);
    }

    yTop += lineH(data.fsOld, 1.06) + data.gapAfterOld;
  } else {
    yTop += data.gapAfterOld;
  }

  // Precio final auto-fit (contempla cuotas)
  const priceText = money(data.finalPrice);
  let fsP = data.fsPriceMax;

  const needInstall = data.installment ? lineH(data.fsInstall, 1.06) + data.gapAfterInstall : 0;

  const tooWide = (fs) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(fs);
    return doc.getTextWidth(priceText) > leftW;
  };

  while (fsP >= data.fsPriceMin) {
    const priceH = lineH(fsP, 1.02);
    const needed = priceH + data.gapAfterPrice + needInstall;
    const available = footerTop - data.minGapBeforeFooter - yTop;
    if (available >= needed && !tooWide(fsP)) break;
    fsP -= 1;
  }

  drawTextAtTop(doc, priceText, xL, yTop, fsP, "bold", [0, 0, 0]);
  yTop += lineH(fsP, 1.03) + data.gapAfterPrice;

  // Cuotas (más grande)
  if (data.installment) {
    drawTextAtTop(
      doc,
      `${data.installment.label}: ${money(data.installment.amount)}`,
      xL,
      yTop,
      data.fsInstall,
      "bold",
      [0, 0, 0]
    );
    yTop += lineH(data.fsInstall, 1.06) + data.gapAfterInstall;
  }

  // Meta (si entra)
  const metaNeed = lineH(data.fsMeta, 1.04);
  if (data.sku && yTop + metaNeed <= footerTop - data.minGapBeforeFooter) {
    drawTextAtTop(doc, ellipsize(doc, `SKU: ${data.sku}`, leftW), xL, yTop, data.fsMeta, "bold", [0, 0, 0]);
    yTop += metaNeed + data.gapAfterMeta;
  }
  if (data.code && yTop + metaNeed <= footerTop - data.minGapBeforeFooter) {
    drawTextAtTop(doc, ellipsize(doc, `COD: ${data.code}`, leftW), xL, yTop, data.fsMeta, "bold", [0, 0, 0]);
    yTop += metaNeed + data.gapAfterMeta;
  }

  // Footer fijo
  const footerY1 = y + h - pad - data.footerLine1;
  const footerY2 = y + h - pad - data.footerLine2;

  drawTextAtTop(doc, "Medios:", xL, footerY1 - baselineFromTop(data.fsFooter1), data.fsFooter1, "bold", [0, 0, 0]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(data.fsFooter1);
  const labelW = doc.getTextWidth("Medios:");
  const logosX = xL + labelW + 8;

  // ✅ fila con altura real
  const logosYTop = footerY1 - data.payRowH + 1.0;

  drawPayLogosRow(doc, logosX, logosYTop, w - pad * 2 - (logosX - xL), data.payLogosMeta || [], data);

  drawTextAtTop(
    doc,
    ellipsize(doc, data.shortUrl, w - pad * 2),
    xL,
    footerY2 - baselineFromTop(data.fsFooter2),
    data.fsFooter2,
    "bold",
    [65, 65, 65]
  );
}

/* =========================
   ✅ DRAW 58 INTERMEDIA (FIX REAL: dinámico + footer reservado)
========================= */
function drawLabel58(doc, { x, y, w, h, pad, qrSize }, data) {
  doc.setDrawColor(220);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h);

  drawHeader(doc, { x, y, w, headerH: data.headerH, pad }, data);

  const xL = x + pad;
  const contentTop = y + data.headerH + pad * 0.55;

  // ✅ footer intocable
  const footerTop = y + h - pad - data.footerReserveH;

  // columns
  const xQR = x + w - pad - qrSize;
  const leftW = w - pad * 2 - qrSize - data.qrGap;

  if (data.qrDataUrl) doc.addImage(data.qrDataUrl, "PNG", xQR, contentTop, qrSize, qrSize);

  let yTop = contentTop + data.topPad;

  // 1) Nombre (máx 2 líneas)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(data.fsName);
  const nameLines = doc.splitTextToSize(data.name, leftW).slice(0, 2);
  for (let i = 0; i < nameLines.length; i++) {
    drawTextAtTop(doc, nameLines[i], xL, yTop + i * lineH(data.fsName, 1.10), data.fsName, "bold", [0, 0, 0]);
  }
  yTop += nameLines.length * lineH(data.fsName, 1.10) + data.gapAfterName;

  // 2) Marca/Modelo (1 línea)
  const brandModel = [data.brand, data.model].filter(Boolean).join(" · ");
  if (brandModel) {
    drawTextAtTop(doc, ellipsize(doc, brandModel, leftW), xL, yTop, data.fsBrandModel, "bold", [55, 55, 55]);
    yTop += lineH(data.fsBrandModel, 1.05) + data.gapAfterBrand;
  } else {
    yTop += data.gapAfterBrand;
  }

  // 3) Old + OFF (si hay)
  if (data.priceList > 0) {
    const oldTop = yTop;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(data.fsOld);

    const oldTxt = money(data.priceList);
    drawTextAtTop(doc, oldTxt, xL, oldTop, data.fsOld, "bold", [70, 70, 70]);

    const ww = doc.getTextWidth(oldTxt);
    const strikeY = oldTop + baselineFromTop(data.fsOld) - ptToMm(data.fsOld) * 0.28;
    doc.setDrawColor(90);
    doc.setLineWidth(0.28);
    doc.line(xL, strikeY, xL + ww, strikeY);

    if (data.hasDiscount && data.offPct > 0) {
      drawTextAtTop(doc, `${data.offPct}% OFF`, xL + ww + 3.4, oldTop, data.fsOld, "bold", [0, 0, 0]);
    }

    yTop += lineH(data.fsOld, 1.04) + data.gapAfterOld;
  } else {
    yTop += data.gapAfterOld;
  }

  // 4) Precio final auto-fit (GARANTIZA cuotas si aplican)
  const priceText = money(data.finalPrice);
  let fsP = data.fsPriceMax;

  const tooWide = (fs) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(fs);
    return doc.getTextWidth(priceText) > leftW;
  };

  const needInstall = data.installment ? lineH(data.fsInstall, 1.06) + data.gapAfterInstall : 0;

  while (fsP >= data.fsPriceMin) {
    const priceH = lineH(fsP, 1.02);
    const needed = priceH + data.gapAfterPrice + needInstall;
    const available = footerTop - data.minGapBeforeFooter - yTop;
    if (available >= needed && !tooWide(fsP)) break;
    fsP -= 0.5;
  }

  drawTextAtTop(doc, priceText, xL, yTop, fsP, "bold", [0, 0, 0]);
  yTop += lineH(fsP, 1.03) + data.gapAfterPrice;

  // 5) Cuotas (más grandes)
  if (data.installment && yTop + lineH(data.fsInstall, 1.06) <= footerTop - data.minGapBeforeFooter) {
    drawTextAtTop(
      doc,
      `${data.installment.label}: ${money(data.installment.amount)}`,
      xL,
      yTop,
      data.fsInstall,
      "bold",
      [0, 0, 0]
    );
    yTop += lineH(data.fsInstall, 1.06) + data.gapAfterInstall;
  }

  // Footer fijo (SIEMPRE abajo)
  const footerY1 = y + h - pad - data.footerLine1;
  const footerY2 = y + h - pad - data.footerLine2;

  drawTextAtTop(doc, "Medios:", xL, footerY1 - baselineFromTop(data.fsFooter1), data.fsFooter1, "bold", [0, 0, 0]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(data.fsFooter1);
  const labelW = doc.getTextWidth("Medios:");
  const logosX = xL + labelW + data.mediosGapX;

  const logosYTop = footerY1 - data.payRowH + data.mediosRowDrop;

  drawPayLogosRow(doc, logosX, logosYTop, w - pad * 2 - (logosX - xL), data.payLogosMeta || [], data);

  drawTextAtTop(
    doc,
    ellipsize(doc, data.shortUrl, w - pad * 2),
    xL,
    footerY2 - baselineFromTop(data.fsFooter2),
    data.fsFooter2,
    "normal",
    [70, 70, 70]
  );
}

/* =========================
   Build docs
========================= */
async function buildDocA4({ product, size, copies, qrValue, title, branchName } = {}) {
  const p = product || {};
  const name = s(p.name || p.title || "Producto", "Producto");
  const sku = s(p.sku, "");
  const code = s(p.code || p.internal_code || p.barcode, "");
  const brand = pickBrand(p);
  const model = pickModel(p);

  const { priceList, finalPrice, hasDiscount, offPct } = pickPrices(p);
  const installment = computeInstallments(priceList);

  const ecommerceUrl =
    s(qrValue) || `${window.location.origin}/shop/product/${p.id ?? p.product_id ?? ""}`;

  const qrDataUrl = await QRCode.toDataURL(ecommerceUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 7,
  });

  const shortUrl = String(ecommerceUrl || "").replace(/^https?:\/\//, "");

  const branchTxt = resolveBranchName(branchName);

  const storeLogo = await loadPngWithMeta(STORE_LOGO_URL);

  const payLogosMeta = [];
  for (const it of PAY_LOGOS) {
    const meta = await loadPngWithMeta(it.url);
    if (meta?.png) payLogosMeta.push({ ...meta, key: it.key }); // ✅ key para boost
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
      payLogosMeta,

      // HEADER grande
      headerH: 25.5,
      fsBranch: 14.2,
      headerTextDrop: 6.6,
      storeLogoH: 19.8,
      storeLogoWMax: 120.0,

      name,
      brand,
      model,
      sku,
      code,
      priceList,
      finalPrice,
      hasDiscount,
      offPct,
      installment,
      qrDataUrl,
      shortUrl,

      // tipografías GRANDES
      fsName: 22.0,
      fsBrandModel: 14.0,
      fsOld: 13.2,

      fsPriceMax: 56.0,
      fsPriceMin: 38.0,

      // ✅ cuotas más grandes
      fsInstall: 18.0,
      fsMeta: 13.2,

      // spacing
      topPad: 7.8,
      gapAfterName: 3.4,
      gapAfterBrand: 3.4,
      gapAfterOld: 4.4,
      gapAfterPrice: 3.2,
      gapAfterInstall: 2.6,
      gapAfterMeta: 1.8,
      minGapBeforeFooter: 4.2,

      // footer
      fsFooter1: 14.2,
      fsFooter2: 10.6,
      footerLine1: 12.2,
      footerLine2: 4.6,

      // ✅ medios + fila real + boost
      payLogoH: 17.0,
      paySlotW: 41.0,
      payLogoGap: 7.0,
      creditoBoost: 1.55,
      payRowH: 17.0 * 1.55, // ✅ fila contempla el crédito grande

      // footer reserve: debe cubrir fila medios + url
      footerReserveH: 25.0,

      // columns
      qrGap: 8.5,
    };

    for (let i = 0; i < totalCopies; i++) {
      if (i > 0) doc.addPage();
      drawLabelBig(doc, { x: L.box.x, y: L.box.y, w: L.box.w, h: L.box.h, pad: L.pad, qrSize: L.qr }, data);
    }

    doc.setProperties({ title: title || "Etiqueta A4 (100 grande)" });
    return doc;
  }

  // ✅ 58 INTERMEDIA (2x5, más grande)
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
    payLogosMeta,

    // header más alto
    headerH: 11.2,
    fsBranch: 8.2,
    headerTextDrop: 3.3,
    storeLogoH: 8.8,
    storeLogoWMax: 46.0,

    name,
    brand,
    model,
    sku,
    code,
    priceList,
    finalPrice,
    hasDiscount,
    offPct,
    installment,
    qrDataUrl,
    shortUrl,

    // ✅ tipografías 58 GRANDES (legible pegado en producto)
    fsName: 12.6,
    fsBrandModel: 8.6,
    fsOld: 8.4,

    fsPriceMax: 22.0,
    fsPriceMin: 17.0,

    // ✅ cuotas 58 grandes
    fsInstall: 10.8,

    // spacing dinámica
    topPad: 3.2,
    gapAfterName: 1.6,
    gapAfterBrand: 1.6,
    gapAfterOld: 1.8,
    gapAfterPrice: 1.6,
    gapAfterInstall: 1.2,
    minGapBeforeFooter: 1.4,

    // footer
    fsFooter1: 8.6,
    fsFooter2: 7.2,
    footerLine1: 10.0,
    footerLine2: 3.2,

    // ✅ medios 58 + fila real + boost
    payLogoH: 6.8,
    paySlotW: 18.0,
    payLogoGap: 2.8,
    creditoBoost: 1.55,
    payRowH: 6.8 * 1.55,

    // tweaks “Medios”
    mediosGapX: 3.8,
    mediosRowDrop: 0.8,

    // ✅ footer reserve (CLAVE: evita que Medios pise precio)
    footerReserveH: 18.5,

    // columns
    qrGap: 3.2,
  };

  let printed = 0;
  for (let pg = 0; pg < pages; pg++) {
    if (pg > 0) doc.addPage();

    for (let r = 0; r < G.grid.rows; r++) {
      for (let c = 0; c < G.grid.cols; c++) {
        if (printed >= totalCopies) break;

        const x = G.grid.marginL + c * (G.cell.w + G.grid.gapX);
        const y = G.grid.marginT + r * (G.cell.h + G.grid.gapY);

        drawLabel58(doc, { x, y, w: G.cell.w, h: G.cell.h, pad: G.pad, qrSize: G.qr }, data58);
        printed++;
      }
      if (printed >= totalCopies) break;
    }
  }

  doc.setProperties({ title: title || "Etiquetas A4 (58 intermedia)" });
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
  const mode = String(size) === "58" ? "58_INTERMEDIA" : "100x60_GRANDE";

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