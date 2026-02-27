// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/products/utils/labelPdfA4.js
//
// ✅ FIXES (LO QUE PEDISTE AHORA):
// 1) ✅ GRANDE (100): LOGOS DE MEDIOS MUCHO MÁS GRANDES (2 filas WRAP prolijas)
// 2) ✅ GRANDE (100): SE QUITA URL del producto (NO tapa nada)
// 3) ✅ GRANDE (100): PRECIO LISTA TACHADO MÁS GRANDE + %OFF alineado
// 4) ✅ CUOTAS: se mantiene regla por precio lista:
//    - 100.000 a 150.000 => 3x
//    - >150.000 => 6x
// 5) ✅ CHICA (58): se mantiene grilla pro, SIN URL, SIN "Medios:" (no se rompe)
//
// Mantiene:
// - QR + Logo + Sucursal
// - Marca/Modelo
// - Precio final grande auto-fit
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

// ✅ Cuotas según PRECIO LISTA (condiciones que pediste)
function computeInstallments(priceList) {
  const pl = Math.round(n(priceList, 0));
  if (pl >= 100000 && pl <= 150000) return { count: 3, amount: Math.round(pl / 3), label: "En 3x" };
  if (pl > 150000) return { count: 6, amount: Math.round(pl / 6), label: "En 6x" };
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
 * ✅ 58 MÁS GRANDE:
 * ~95×65mm — 2×3 por hoja A4 portrait (6 por hoja)
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

/**
 * ✅ WRAP en filas (para GRANDE): 2 filas reales y logos GRANDES
 */
function drawPayLogosWrappedRows(doc, x, yTop, maxW, logosMeta, cfg) {
  const items = (logosMeta || []).filter((it) => it?.png && it?.aspect);
  if (!items.length) return 0;

  const baseH = cfg.payLogoH;
  const baseW = cfg.paySlotW;
  const gapX = cfg.payLogoGap;
  const rowH = cfg.payRowH;
  const maxRows = cfg.payMaxRows ?? 2;
  const gapY = cfg.payRowGapY ?? 3.0;

  let row = 1;
  let xx = x;
  let yy = yTop;

  for (const it of items) {
    const isCredito = it.key === "credito_sj";
    const mult = isCredito ? (cfg.creditoBoost || 1.0) : 1.0;

    const slotH = Math.min(rowH, baseH * mult);
    const slotW = baseW * mult;

    if (xx + slotW > x + maxW) {
      row++;
      if (row > maxRows) break;
      xx = x;
      yy += rowH + gapY;
    }

    const yCenter = yy + (rowH - slotH) / 2;
    drawLogoContain(doc, it.png, it.aspect, xx, yCenter, slotW, slotH);
    xx += slotW + gapX;
  }

  return row;
}

/**
 * ✅ GRILLA PRO (para CHICA): alineados perfectos (3x2)
 */
function drawPayLogosGrid(doc, x, y, w, logosMeta, cfg) {
  const items = (logosMeta || []).filter((it) => it?.png && it?.aspect);
  if (!items.length) return;

  const rows = cfg.payGridRows ?? 2;
  const cols = cfg.payGridCols ?? 3;

  const gapX = cfg.payGridGapX ?? 3.2;
  const gapY = cfg.payGridGapY ?? 1.8;

  const slotW = cfg.payGridSlotW;
  const slotH = cfg.payGridSlotH;

  const rowW = cols * slotW + (cols - 1) * gapX;
  const startX = x + Math.max(0, (w - rowW) / 2);

  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (idx >= items.length) return;

      const it = items[idx++];
      const isCredito = it.key === "credito_sj";
      const mult = isCredito ? (cfg.creditoBoost || 1.0) : 1.0;

      const innerW = Math.min(slotW, slotW * mult);
      const innerH = Math.min(slotH, slotH * mult);

      const sx = startX + c * (slotW + gapX);
      const sy = y + r * (slotH + gapY);

      const ix = sx + (slotW - innerW) / 2;
      const iy = sy + (slotH - innerH) / 2;

      drawLogoContain(doc, it.png, it.aspect, ix, iy, innerW, innerH);
    }
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
   ✅ DRAW 100x60 (GRANDE)
========================= */
function drawLabelBig(doc, { x, y, w, h, pad, qrSize }, data) {
  doc.setDrawColor(220);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h);

  drawHeader(doc, { x, y, w, headerH: data.headerH, pad }, data);

  const xL = x + pad;
  const contentTop = y + data.headerH + pad * 0.62;

  // ✅ footer block fijo (Medios) - 2 filas
  const footerBlockTop = y + h - pad - data.footerReserveH;

  const xQR = x + w - pad - qrSize;
  const leftW = w - pad * 2 - qrSize - data.qrGap;

  if (data.qrDataUrl) doc.addImage(data.qrDataUrl, "PNG", xQR, contentTop, qrSize, qrSize);

  let yTop = contentTop + data.topPad;

  // Nombre
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

  // ✅ Precio lista tachado + %OFF (MÁS GRANDE)
  if (data.priceList > 0 && data.hasDiscount) {
    const oldTop = yTop;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(data.fsOld);

    const oldTxt = money(data.priceList);
    drawTextAtTop(doc, oldTxt, xL, oldTop, data.fsOld, "bold", [65, 65, 65]);

    const ww = doc.getTextWidth(oldTxt);
    const strikeY = oldTop + baselineFromTop(data.fsOld) - ptToMm(data.fsOld) * 0.28;
    doc.setDrawColor(80);
    doc.setLineWidth(0.52);
    doc.line(xL, strikeY, xL + ww, strikeY);

    if (data.offPct > 0) {
      drawTextAtTop(doc, `${data.offPct}% OFF`, xL + ww + 10, oldTop, data.fsOld, "bold", [0, 0, 0]);
    }

    yTop += lineH(data.fsOld, 1.08) + data.gapAfterOld;
  } else {
    yTop += data.gapAfterOld;
  }

  // Precio final auto-fit (garantiza cuotas si aplican)
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
    const available = footerBlockTop - data.minGapBeforeFooter - yTop;
    if (available >= needed && !tooWide(fsP)) break;
    fsP -= 1;
  }

  drawTextAtTop(doc, priceText, xL, yTop, fsP, "bold", [0, 0, 0]);
  yTop += lineH(fsP, 1.03) + data.gapAfterPrice;

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
  }

  // ===== Footer block (Medios + 2 filas) =====
  const labelY = footerBlockTop + 6.2;
  drawTextAtTop(doc, "Medios:", xL, labelY, data.fsFooter1, "bold", [0, 0, 0]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(data.fsFooter1);
  const labelW = doc.getTextWidth("Medios:");
  const logosX = xL + labelW + 10;

  const logosYTop = labelY + lineH(data.fsFooter1, 1.0) + 1.6;
  const logosMaxW = w - pad * 2 - (logosX - xL);

  // ✅ logos GRANDES y WRAP 2 filas
  drawPayLogosWrappedRows(doc, logosX, logosYTop, logosMaxW, data.payLogosMeta || [], data);

  // ✅ URL QUITADA (como pediste) -> NO dibujamos nada abajo
}

/* =========================
   ✅ DRAW 58 (CHICA): SIN URL + SIN "Medios:"
========================= */
function drawLabel58(doc, { x, y, w, h, pad, qrSize }, data) {
  doc.setDrawColor(220);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h);

  drawHeader(doc, { x, y, w, headerH: data.headerH, pad }, data);

  const xL = x + pad;
  const contentTop = y + data.headerH + pad * 0.55;

  const xQR = x + w - pad - qrSize;
  const leftW = w - pad * 2 - qrSize - data.qrGap;

  if (data.qrDataUrl) doc.addImage(data.qrDataUrl, "PNG", xQR, contentTop, qrSize, qrSize);

  const footerTopY = y + h - pad - data.footerFixedH;
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
      drawTextAtTop(doc, oldTxt, xL, oldY, data.fsOld, "bold", [70, 70, 70]);

      const ww = doc.getTextWidth(oldTxt);
      const strikeY = oldY + baselineFromTop(data.fsOld) - ptToMm(data.fsOld) * 0.28;
      doc.setDrawColor(90);
      doc.setLineWidth(0.28);
      doc.line(xL, strikeY, xL + ww, strikeY);

      drawTextAtTop(doc, `${data.offPct}% OFF`, xL + ww + 4.0, oldY, data.fsOld, "bold", [0, 0, 0]);
    }
  }

  drawTextAtTop(doc, priceText, xL, yPriceTop, fsP, "bold", [0, 0, 0]);

  if (data.installment) {
    const yInst = yPriceTop + priceH + data.gapAfterPrice;
    drawTextAtTop(
      doc,
      `${data.installment.label}: ${money(data.installment.amount)}`,
      xL,
      yInst,
      data.fsInstall,
      "bold",
      [0, 0, 0]
    );
  }

  // Footer (solo logos)
  const logosX = xL;
  const logosW = w - pad * 2;
  const logosY = footerTopY + data.footerPadTop;

  drawPayLogosGrid(doc, logosX, logosY, logosW, data.payLogosMeta || [], data);
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
    if (meta?.png) payLogosMeta.push({ ...meta, key: it.key });
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

      fsName: 22.0,
      fsBrandModel: 14.0,

      // ✅ MÁS GRANDE el tachado
      fsOld: 16.0,

      fsPriceMax: 56.0,
      fsPriceMin: 38.0,

      fsInstall: 18.0,

      topPad: 7.8,
      gapAfterName: 3.4,
      gapAfterBrand: 3.4,
      gapAfterOld: 4.6,
      gapAfterPrice: 3.2,
      gapAfterInstall: 2.6,
      minGapBeforeFooter: 5.2,

      fsFooter1: 14.2,
      fsFooter2: 10.6,

      // ✅ LOGOS MUCHO MÁS GRANDES
      payLogoH: 17.5,
      paySlotW: 44.0,
      payLogoGap: 8.0,
      creditoBoost: 1.35,
      payRowH: 20.0,
      payMaxRows: 2,
      payRowGapY: 3.4,

      // ✅ footer más alto (2 filas grandes)
      footerReserveH: 44.0,

      qrGap: 8.5,
    };

    for (let i = 0; i < totalCopies; i++) {
      if (i > 0) doc.addPage();
      drawLabelBig(doc, { x: L.box.x, y: L.box.y, w: L.box.w, h: L.box.h, pad: L.pad, qrSize: L.qr }, data);
    }

    doc.setProperties({ title: title || "Etiqueta A4 (100 grande)" });
    return doc;
  }

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
    shortUrl,

    fsName: 14.2,
    fsBrandModel: 10.0,
    fsOld: 9.0,

    fsPriceMax: 30.0,
    fsPriceMin: 22.0,
    fsInstall: 13.4,

    topPad: 2.6,
    gapAfterName: 1.4,
    gapAfterBrand: 1.0,
    gapAfterOld: 1.0,

    gapAfterPrice: 1.2,
    gapAfterInstall: 1.0,

    footerFixedH: 19.8,
    footerPadTop: 1.4,
    safeGapBeforeFooter: 4.0,

    payGridRows: 2,
    payGridCols: 3,
    payGridGapX: 3.2,
    payGridGapY: 1.8,
    payGridSlotW: 18.8,
    payGridSlotH: 7.9,
    creditoBoost: 1.12,

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

        drawLabel58(doc, { x, y, w: G.cell.w, h: G.cell.h, pad: G.pad, qrSize: G.qr }, data58);
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
  const mode = String(size) === "58" ? "58_GRANDE" : "100x60_GRANDE";

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