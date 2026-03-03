// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/products/utils/labelPdfA4.js
//
// ✅ FIX (SUPERPOSICIÓN CUOTAS vs MEDIOS):
// - En tamaño "100" (grande) se calcula dinámicamente la posición del STRIP de medios
//   para que quede SIEMPRE debajo de:
//   1) precio final
//   2) cuotas (si aplica)
// - Si hace falta, el strip baja (sin salirse del borde) y/o reduce un poco altura.
// - Mantiene: ML style (tachado + badge verde), QR, logo, sucursal, sin URL, sin "Medios:"
// - Cuotas por PRECIO LISTA:
//    - 50.000 a 100.000  => 3x
//    - > 100.000         => 6x

import { jsPDF } from "jspdf";
import QRCode from "qrcode";

/* =========================
   Assets
========================= */
const STORE_LOGO_URL =
  "https://storage-files.cingulado.org/pos360/media/1770906123233-3976439306ab1686.webp";

const PAY_STRIP_URL =
  "https://storage-files.cingulado.org/pos360/media/1772493744791-665f713788e427fd.webp";

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

// ✅ CUOTAS POR PRECIO LISTA
function computeInstallments(priceList) {
  const pl = Math.round(n(priceList, 0));
  if (pl >= 50000 && pl <= 100000) return { count: 3, amount: Math.round(pl / 3), label: "En 3x" };
  if (pl > 100000) return { count: 6, amount: Math.round(pl / 6), label: "En 6x" };
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
      return extractBranchNameFromAny(j) || "";
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

/* =========================
   Text metrics
========================= */
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
   WEBP -> PNG + aspect (cache)
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
          resolve({ png: canvas.toDataURL("image/png"), w, h, aspect: w / h });
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
 * ✅ NUEVO INTERMEDIO 80x55:
 * A4 portrait, 2x4 = 8 etiquetas por hoja
 */
function computeGrid80Layout() {
  const A4 = getA4Portrait();

  const CELL_W = 80;
  const CELL_H = 55;
  const COLS = 2;
  const ROWS = 4;
  const GAP_X = 5;
  const GAP_Y = 5;

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
    pad: 3.6,
    qr: 19.5,
  };
}

/**
 * ✅ 58 (95x65):
 * A4 portrait, 2x3 = 6 etiquetas por hoja
 */
function computeGrid58Layout() {
  const A4 = getA4Portrait();

  const CELL_W = 95;
  const CELL_H = 65;
  const COLS = 2;
  const ROWS = 3;
  const GAP_X = 5;
  const GAP_Y = 5;

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
    pad: 4.2,
    qr: 22.5,
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

function drawOffBadge(doc, text, x, yTop, fs, cfg = {}) {
  const padX = cfg.padX ?? 3.2;
  const r = cfg.radius ?? 2.2;
  const bg = cfg.bg ?? [0, 166, 80];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(fs);

  const tw = doc.getTextWidth(String(text));
  const h = lineH(fs, 1.05);
  const w = tw + padX * 2;

  doc.setFillColor(bg[0], bg[1], bg[2]);
  if (typeof doc.roundedRect === "function") doc.roundedRect(x, yTop, w, h, r, r, "F");
  else doc.rect(x, yTop, w, h, "F");

  doc.setTextColor(255, 255, 255);
  doc.text(String(text), x + padX, yTop + baselineFromTop(fs) + 0.25);
  doc.setTextColor(0, 0, 0);

  return { w, h };
}

function drawPayStrip(doc, meta, x, y, w, h) {
  if (!meta?.png || !meta?.aspect) return;
  drawLogoContain(doc, meta.png, meta.aspect, x, y, w, h);
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
   ✅ DRAW 100x60 (GRANDE) - FIX cuotas vs medios
========================= */
function drawLabelBig(doc, { x, y, w, h, pad, qrSize }, data) {
  doc.setDrawColor(220);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h);

  drawHeader(doc, { x, y, w, headerH: data.headerH, pad }, data);

  const xL = x + pad;
  const contentTop = y + data.headerH + pad * 0.62;

  const xQR = x + w - pad - qrSize;
  const leftW = w - pad * 2 - qrSize - data.qrGap;

  if (data.qrDataUrl) doc.addImage(data.qrDataUrl, "PNG", xQR, contentTop, qrSize, qrSize);

  // ✅ límites verticales
  const bottomLimit = y + h - pad; // borde interno inferior
  let stripH = data.payStripH; // altura deseada
  const stripMinH = data.payStripMinH ?? 14.0;
  const gapAfterInstall = data.gapAfterInstall ?? 2.6;
  const gapBeforeStrip = data.gapBeforeStrip ?? 2.8;

  let yTop = contentTop + data.topPad;

  // Nombre
  doc.setFont("helvetica", "bold");
  doc.setFontSize(data.fsName);
  const nameLines = doc.splitTextToSize(data.name, leftW).slice(0, 2);
  for (let i = 0; i < nameLines.length; i++) {
    drawTextAtTop(
      doc,
      nameLines[i],
      xL,
      yTop + i * lineH(data.fsName, 1.10),
      data.fsName,
      "bold",
      [0, 0, 0]
    );
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

  // Old + badge
  if (data.priceList > 0 && data.hasDiscount) {
    const oldTop = yTop;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(data.fsOld);

    const oldTxt = money(data.priceList);
    drawTextAtTop(doc, oldTxt, xL, oldTop, data.fsOld, "bold", [120, 120, 120]);

    const ww = doc.getTextWidth(oldTxt);
    const strikeY = oldTop + baselineFromTop(data.fsOld) - ptToMm(data.fsOld) * 0.28;
    doc.setDrawColor(140);
    doc.setLineWidth(0.60);
    doc.line(xL, strikeY, xL + ww, strikeY);

    if (data.offPct > 0) {
      drawOffBadge(
        doc,
        `${data.offPct}% OFF`,
        xL + ww + 8.5,
        oldTop - 0.6,
        Math.max(11.5, data.fsOld - 3.0),
        { bg: data.mlGreen, padX: 3.4, radius: 2.4 }
      );
    }

    yTop += lineH(data.fsOld, 1.08) + data.gapAfterOld;
  } else {
    yTop += data.gapAfterOld;
  }

  // ✅ Precio final con auto-fit (pero ahora reservando espacio REAL: strip + gap)
  const priceText = money(data.finalPrice);
  let fsP = data.fsPriceMax;

  const instH = data.installment ? lineH(data.fsInstall, 1.06) : 0;
  const neededBelowPrice =
    data.gapAfterPrice + (data.installment ? instH + gapAfterInstall : 0) + gapBeforeStrip + stripH;

  const tooWide = (fs) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(fs);
    return doc.getTextWidth(priceText) > leftW;
  };

  while (fsP >= data.fsPriceMin) {
    const priceH = lineH(fsP, 1.02);
    const available = bottomLimit - yTop;
    if (available >= priceH + neededBelowPrice && !tooWide(fsP)) break;
    fsP -= 1;
  }

  // Dibuja precio
  drawTextAtTop(doc, priceText, xL, yTop, fsP, "bold", [0, 0, 0]);
  const yPriceTop = yTop;
  const priceH = lineH(fsP, 1.03);
  yTop += priceH + data.gapAfterPrice;

  // Dibuja cuotas
  let yAfterInstall = yTop;
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
    yAfterInstall = yTop + instH + gapAfterInstall;
  }

  // ✅ Posición dinámica del strip:
  // - parte después de cuotas (o precio si no hay cuotas)
  // - pero NUNCA se sale por abajo: si no entra, reduce altura hasta mínimo.
  let stripTop = yAfterInstall + gapBeforeStrip;
  let stripBottom = stripTop + stripH;

  if (stripBottom > bottomLimit) {
    // intentamos bajar no, porque ya está abajo; entonces reducimos altura
    const maxH = Math.max(stripMinH, bottomLimit - stripTop);
    stripH = Math.max(stripMinH, Math.min(stripH, maxH));
    stripBottom = stripTop + stripH;

    // si aun así no entra (caso extremo), forzamos stripTop para que entre
    if (stripBottom > bottomLimit) {
      stripTop = Math.max(yPriceTop + priceH + 1.0, bottomLimit - stripH);
    }
  }

  drawPayStrip(doc, data.payStripMeta, xL, stripTop, leftW, stripH);
}

/* =========================
   ✅ DRAW COMPACT (GRID) - para 80 y 58
========================= */
function drawLabelCompact(doc, { x, y, w, h, pad, qrSize }, data) {
  doc.setDrawColor(220);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h);

  drawHeader(doc, { x, y, w, headerH: data.headerH, pad }, data);

  const xL = x + pad;
  const contentTop = y + data.headerH + pad * 0.55;

  const xQR = x + w - pad - qrSize;
  const leftW = w - pad * 2 - qrSize - data.qrGap;

  if (data.qrDataUrl) doc.addImage(data.qrDataUrl, "PNG", xQR, contentTop, qrSize, qrSize);

  const stripH = data.payStripH;
  const footerTopY = y + h - pad - stripH;
  const contentMaxY = footerTopY - data.safeGapBeforeFooter;

  let yTop = contentTop + data.topPad;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(data.fsName);

  const nameLines = doc.splitTextToSize(data.name, leftW).slice(0, 2);
  for (let i = 0; i < nameLines.length; i++) {
    const yy = yTop + i * lineH(data.fsName, 1.08);
    if (yy + lineH(data.fsName, 1.08) > contentMaxY) break;
    drawTextAtTop(doc, nameLines[i], xL, yy, data.fsName, "bold", [0, 0, 0]);
  }
  yTop += nameLines.length * lineH(data.fsName, 1.08) + data.gapAfterName;

  const brandModel = [data.brand, data.model].filter(Boolean).join(" · ");
  if (brandModel && yTop + lineH(data.fsBrandModel, 1.05) <= contentMaxY) {
    drawTextAtTop(doc, ellipsize(doc, brandModel, leftW), xL, yTop, data.fsBrandModel, "bold", [55, 55, 55]);
    yTop += lineH(data.fsBrandModel, 1.05) + data.gapAfterBrand;
  }

  const priceText = money(data.finalPrice);

  const tooWide = (fs) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(fs);
    return doc.getTextWidth(priceText) > leftW;
  };

  const needInstall = data.installment ? lineH(data.fsInstall, 1.08) + data.gapAfterInstall : 0;

  let fsP = data.fsPriceMax;
  while (fsP >= data.fsPriceMin) {
    const priceH = lineH(fsP, 1.18);
    const blockH = priceH + data.gapAfterPrice + needInstall;
    const yPriceTop = contentMaxY - blockH;
    if (yPriceTop >= yTop && !tooWide(fsP)) break;
    fsP -= 0.5;
  }
  if (fsP < data.fsPriceMin) fsP = data.fsPriceMin;

  const priceH = lineH(fsP, 1.18);
  const blockH = priceH + data.gapAfterPrice + needInstall;
  const yPriceTop = Math.max(yTop, contentMaxY - blockH);

  if (data.priceList > 0 && data.hasDiscount && data.offPct > 0) {
    const oldLineH = lineH(data.fsOld, 1.08);
    const oldY = yPriceTop - oldLineH - 0.6;
    if (oldY >= yTop) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(data.fsOld);

      const oldTxt = money(data.priceList);
      drawTextAtTop(doc, oldTxt, xL, oldY, data.fsOld, "bold", [120, 120, 120]);

      const ww = doc.getTextWidth(oldTxt);
      const strikeY = oldY + baselineFromTop(data.fsOld) - ptToMm(data.fsOld) * 0.28;
      doc.setDrawColor(140);
      doc.setLineWidth(0.28);
      doc.line(xL, strikeY, xL + ww, strikeY);

      drawOffBadge(doc, `${data.offPct}% OFF`, xL + ww + 3.0, oldY - 0.35, data.fsOffBadge, {
        bg: data.mlGreen,
        padX: data.offPadX,
        radius: data.offRadius,
      });
    }
  }

  drawTextAtTop(doc, priceText, xL, yPriceTop, fsP, "bold", [0, 0, 0]);

  if (data.installment) {
    const yInst = yPriceTop + priceH + data.gapAfterPrice;
    drawTextAtTop(doc, `${data.installment.label}: ${money(data.installment.amount)}`, xL, yInst, data.fsInstall, "bold", [0, 0, 0]);
  }

  drawPayStrip(doc, data.payStripMeta, xL, footerTopY, leftW, stripH);
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

  const branchTxt = resolveBranchName(branchName);

  const storeLogo = await loadPngWithMeta(STORE_LOGO_URL);
  const payStripMeta = await loadPngWithMeta(PAY_STRIP_URL);

  const totalCopies = Math.max(1, Number(copies || 1));
  const mode = String(size || "100");

  // =========================
  // 100x60 GRANDE (1 por hoja)
  // =========================
  if (mode === "100") {
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
      payStripMeta,
      mlGreen: [0, 166, 80],

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

      fsName: 22.0,
      fsBrandModel: 14.0,
      fsOld: 16.0,

      fsPriceMax: 56.0,
      fsPriceMin: 38.0,

      fsInstall: 18.0,

      topPad: 7.8,
      gapAfterName: 3.4,
      gapAfterBrand: 3.4,
      gapAfterOld: 4.6,
      gapAfterPrice: 3.2,

      // ✅ gaps para evitar superposición
      gapAfterInstall: 2.8,
      gapBeforeStrip: 3.2,

      payStripH: 18.5,
      payStripMinH: 14.0,

      qrGap: 8.5,
    };

    for (let i = 0; i < totalCopies; i++) {
      if (i > 0) doc.addPage();
      drawLabelBig(doc, { x: L.box.x, y: L.box.y, w: L.box.w, h: L.box.h, pad: L.pad, qrSize: L.qr }, data);
    }

    doc.setProperties({ title: title || "Etiqueta A4 (100 grande)" });
    return doc;
  }

  // =========================
  // 80x55 INTERMEDIA (8 por hoja)
  // =========================
  if (mode === "80") {
    const G = computeGrid80Layout();
    const capacity = G.grid.cols * G.grid.rows;
    const pages = Math.ceil(totalCopies / capacity);

    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: G.page.orientation,
      compress: true,
    });

    const data80 = {
      branchName: branchTxt,
      storeLogo,
      payStripMeta,
      mlGreen: [0, 166, 80],

      headerH: 11.2,
      fsBranch: 8.4,
      headerTextDrop: 3.1,
      storeLogoH: 8.8,
      storeLogoWMax: 52.0,

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

      fsName: 12.4,
      fsBrandModel: 9.1,
      fsOld: 8.4,

      fsOffBadge: 7.2,
      offPadX: 2.0,
      offRadius: 1.6,

      fsPriceMax: 24.0,
      fsPriceMin: 18.0,

      fsInstall: 11.0,

      topPad: 2.2,
      gapAfterName: 1.1,
      gapAfterBrand: 0.9,
      gapAfterOld: 0.9,
      gapAfterPrice: 1.0,
      gapAfterInstall: 0.9,

      payStripH: 8.2,
      safeGapBeforeFooter: 3.2,

      qrGap: 3.4,
    };

    let printed = 0;
    for (let pg = 0; pg < pages; pg++) {
      if (pg > 0) doc.addPage();

      for (let r = 0; r < G.grid.rows; r++) {
        for (let c = 0; c < G.grid.cols; c++) {
          if (printed >= totalCopies) break;

          const x = G.grid.marginL + c * (G.cell.w + G.grid.gapX);
          const y = G.grid.marginT + r * (G.cell.h + G.grid.gapY);

          drawLabelCompact(doc, { x, y, w: G.cell.w, h: G.cell.h, pad: G.pad, qrSize: G.qr }, data80);
          printed++;
        }
        if (printed >= totalCopies) break;
      }
    }

    doc.setProperties({ title: title || "Etiquetas A4 (80 intermedia)" });
    return doc;
  }

  // =========================
  // 58 (95x65) - 6 por hoja
  // =========================
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
    payStripMeta,
    mlGreen: [0, 166, 80],

    headerH: 13.0,
    fsBranch: 9.2,
    headerTextDrop: 3.6,
    storeLogoH: 10.2,
    storeLogoWMax: 58.0,

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

    fsName: 14.2,
    fsBrandModel: 10.0,
    fsOld: 9.0,

    fsOffBadge: 7.6,
    offPadX: 2.2,
    offRadius: 1.8,

    fsPriceMax: 30.0,
    fsPriceMin: 22.0,

    fsInstall: 13.4,

    topPad: 2.6,
    gapAfterName: 1.4,
    gapAfterBrand: 1.0,
    gapAfterOld: 1.0,

    gapAfterPrice: 1.2,
    gapAfterInstall: 1.0,

    payStripH: 9.2,
    safeGapBeforeFooter: 4.0,

    qrGap: 4.0,
  };

  let printed = 0;
  for (let pg = 0; pg < pages; pg++) {
    if (pg > 0) doc.addPage();

    for (let r = 0; r < G.grid.rows; r++) {
      for (let c = 0; c < G.grid.cols; c++) {
        if (printed >= totalCopies) break;

        const x = G.grid.marginL + c * (G.cell.w + G.grid.gapX);
        const y = G.grid.marginT + r * (G.cell.h + G.grid.gapY);

        drawLabelCompact(doc, { x, y, w: G.cell.w, h: G.cell.h, pad: G.pad, qrSize: G.qr }, data58);
        printed++;
      }
      if (printed >= totalCopies) break;
    }
  }

  doc.setProperties({ title: title || "Etiquetas A4 (58 grande)" });
  return doc;
}

/* =========================
   Public API
========================= */
export async function downloadLabelPdfA4({
  product,
  size = "100", // "100" | "80" | "58"
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
  const mode = String(size) === "58" ? "58_GRANDE" : String(size) === "80" ? "80_INTERMEDIA" : "100x60_GRANDE";

  doc.save(`Etiqueta_A4_${mode}_${id}_${nm}.pdf`);
}

export async function printLabelA4Pdf({
  product,
  size = "100", // "100" | "80" | "58"
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