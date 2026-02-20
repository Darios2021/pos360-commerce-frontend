// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/products/utils/labelPdfA4.js
//
// ✅ FIXES (LO QUE PEDISTE):
// 1) ✅ El GRANDE queda “bien” + vuelve la lógica de cuotas 3x/6x (según precio lista).
//    - Ahora el auto-fit del precio tiene en cuenta que SIEMPRE debe entrar la línea de cuotas cuando aplica.
// 2) ✅ El 58×40 (chico) deja de superponerse:
//    - En chico uso layout “posicionado” (y fijos) + tamaños más conservadores.
//    - Old/Off y Precio nunca se pisan.
//
// Mantiene:
// - Marca/Modelo
// - Precio lista tachado + %OFF
// - Precio final grande
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
  // aproximación estable para Helvetica: ~0.78 del tamaño en mm
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

  const targetW = A4.W * 0.70; // ✅ grande como antes
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
    qr: Math.max(34, boxW * 0.19),
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
    pad: 2.6,
    qr: 15.5,
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

  doc.setFont("helvetica", "normal");
  doc.setFontSize(data.fsBranch);
  doc.setTextColor(40);

  const brTxt = ellipsize(doc, data.branchName, w * 0.42);
  const brW = doc.getTextWidth(brTxt);
  const yText = y + headerH - data.headerTextDrop;
  doc.text(brTxt, x + w - pad - brW, yText);
}

/* =========================
   ✅ DRAW GRANDE (anti overlap + cuotas SIEMPRE)
========================= */
function drawLabelBig(doc, { x, y, w, h, pad, qrSize }, data) {
  doc.setDrawColor(220);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h);

  drawHeader(doc, { x, y, w, headerH: data.headerH, pad }, data);

  const xL = x + pad;
  const contentTop = y + data.headerH + pad * 0.65;

  // footer reserve (intocable)
  const footerTop = y + h - pad - data.footerReserveH;

  // columns
  const xQR = x + w - pad - qrSize;
  const leftW = w - pad * 2 - qrSize - data.qrGap;

  if (data.qrDataUrl) doc.addImage(data.qrDataUrl, "PNG", xQR, contentTop, qrSize, qrSize);

  let yTop = contentTop + data.topPad;

  // 1) Nombre (2 líneas)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(data.fsName);
  const nameLines = doc.splitTextToSize(data.name, leftW).slice(0, 2);
  for (let i = 0; i < nameLines.length; i++) {
    drawTextAtTop(doc, nameLines[i], xL, yTop + i * lineH(data.fsName, 1.12), data.fsName, "bold", [0, 0, 0]);
  }
  yTop += nameLines.length * lineH(data.fsName, 1.12) + data.gapAfterName;

  // 2) Marca/Modelo
  const brandModel = [data.brand, data.model].filter(Boolean).join(" · ");
  if (brandModel) {
    drawTextAtTop(doc, ellipsize(doc, brandModel, leftW), xL, yTop, data.fsBrandModel, "normal", [60, 60, 60]);
    yTop += lineH(data.fsBrandModel, 1.10) + data.gapAfterBrand;
  } else {
    yTop += data.gapAfterBrand;
  }

  // 3) Precio lista + OFF
  if (data.priceList > 0) {
    const oldTop = yTop;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(data.fsOld);

    const oldTxt = money(data.priceList);
    drawTextAtTop(doc, oldTxt, xL, oldTop, data.fsOld, "bold", [70, 70, 70]);

    const ww = doc.getTextWidth(oldTxt);
    const strikeY = oldTop + baselineFromTop(data.fsOld) - ptToMm(data.fsOld) * 0.28;
    doc.setDrawColor(90);
    doc.setLineWidth(0.35);
    doc.line(xL, strikeY, xL + ww, strikeY);

    if (data.hasDiscount && data.offPct > 0) {
      drawTextAtTop(doc, `${data.offPct}% OFF`, xL + ww + 6, oldTop, data.fsOld, "bold", [0, 0, 0]);
    }

    yTop += lineH(data.fsOld, 1.08) + data.gapAfterOld;
  } else {
    yTop += data.gapAfterOld;
  }

  // 4) Precio final auto-fit (AHORA contempla cuotas)
  const priceText = money(data.finalPrice);
  let fsP = data.fsPriceMax;

  const needInstall = data.installment ? lineH(data.fsInstall, 1.08) + data.gapAfterInstall : 0;

  const tooWide = (fs) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(fs);
    return doc.getTextWidth(priceText) > leftW;
  };

  // ✅ para que entren cuotas: precioH + gapAfterPrice + cuotas
  while (fsP >= data.fsPriceMin) {
    const priceH = lineH(fsP, 1.02);
    const needed = priceH + data.gapAfterPrice + needInstall; // meta va “si entra”
    const available = footerTop - data.minGapBeforeFooter - yTop;
    if (available >= needed && !tooWide(fsP)) break;
    fsP -= 1;
  }

  // draw price
  drawTextAtTop(doc, priceText, xL, yTop, fsP, "bold", [0, 0, 0]);
  yTop += lineH(fsP, 1.04) + data.gapAfterPrice;

  // 5) ✅ Cuotas SIEMPRE que aplique (ya lo garantizamos arriba)
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
    yTop += lineH(data.fsInstall, 1.08) + data.gapAfterInstall;
  }

  // 6) Meta (solo si entra)
  const metaNeed = lineH(data.fsMeta, 1.05);
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
  const logosX = xL + labelW + 6;
  const logosYTop = footerY1 - data.payLogoH + 1.1;

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
   ✅ DRAW CHICO 58×40 (layout fijo, anti superposición)
========================= */
function drawLabel58(doc, { x, y, w, h, pad, qrSize }, data) {
  doc.setDrawColor(220);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h);

  drawHeader(doc, { x, y, w, headerH: data.headerH, pad }, data);

  const xL = x + pad;
  const contentTop = y + data.headerH + 0.8;

  const footerY1 = y + h - pad - data.footerLine1;
  const footerY2 = y + h - pad - data.footerLine2;

  const footerTop = y + h - pad - data.footerReserveH;

  const xQR = x + w - pad - qrSize;
  const leftW = w - pad * 2 - qrSize - data.qrGap;

  if (data.qrDataUrl) doc.addImage(data.qrDataUrl, "PNG", xQR, contentTop, qrSize, qrSize);

  // ✅ posiciones fijas (en mm) relativas al contentTop
  const yName = contentTop + 0.8;
  const yBrand = yName + 7.2;     // debajo del nombre (2 líneas max)
  const yOld = yBrand + 3.6;      // old/off
  const yPrice = yOld + 3.6;      // precio final SIEMPRE abajo (no pisa)
  const yInstall = yPrice + 5.0;  // cuotas si aplica

  // Nombre (hasta 2 líneas)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(data.fsName);
  const nameLines = doc.splitTextToSize(data.name, leftW).slice(0, 2);
  for (let i = 0; i < nameLines.length; i++) {
    drawTextAtTop(doc, nameLines[i], xL, yName + i * 3.6, data.fsName, "bold", [0, 0, 0]);
  }

  // Marca/Modelo (1 línea)
  const brandModel = [data.brand, data.model].filter(Boolean).join(" · ");
  if (brandModel) {
    drawTextAtTop(doc, ellipsize(doc, brandModel, leftW), xL, yBrand, data.fsBrandModel, "normal", [60, 60, 60]);
  }

  // Precio lista + OFF
  if (data.priceList > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(data.fsOld);

    const oldTxt = money(data.priceList);
    drawTextAtTop(doc, oldTxt, xL, yOld, data.fsOld, "bold", [70, 70, 70]);

    const ww = doc.getTextWidth(oldTxt);
    const strikeY = yOld + baselineFromTop(data.fsOld) - ptToMm(data.fsOld) * 0.28;
    doc.setDrawColor(90);
    doc.setLineWidth(0.25);
    doc.line(xL, strikeY, xL + ww, strikeY);

    if (data.hasDiscount && data.offPct > 0) {
      drawTextAtTop(doc, `${data.offPct}% OFF`, xL + ww + 2.5, yOld, data.fsOld, "bold", [0, 0, 0]);
    }
  }

  // Precio final auto-fit (ancho + no pasar footer)
  const priceText = money(data.finalPrice);
  let fsP = data.fsPriceMax;

  const tooWide = (fs) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(fs);
    return doc.getTextWidth(priceText) > leftW;
  };

  // asegurar que el precio no invada footer
  while (fsP >= data.fsPriceMin) {
    const priceH = lineH(fsP, 1.02);
    const bottom = yPrice + priceH;
    if (bottom <= footerTop - 0.6 && !tooWide(fsP)) break;
    fsP -= 0.5;
  }

  drawTextAtTop(doc, priceText, xL, yPrice, fsP, "bold", [0, 0, 0]);

  // Cuotas (si aplica) — solo si entra
  if (data.installment) {
    const need = lineH(data.fsInstall, 1.06);
    if (yInstall + need <= footerTop - 0.2) {
      drawTextAtTop(
        doc,
        `${data.installment.count}x: ${money(data.installment.amount)}`,
        xL,
        yInstall,
        data.fsInstall,
        "bold",
        [0, 0, 0]
      );
    }
  }

  // Footer fijo
  drawTextAtTop(doc, "Medios:", xL, footerY1 - baselineFromTop(data.fsFooter1), data.fsFooter1, "bold", [0, 0, 0]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(data.fsFooter1);
  const labelW = doc.getTextWidth("Medios:");
  const logosX = xL + labelW + 2.8;
  const logosYTop = footerY1 - data.payLogoH + 0.6;

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
      payLogosMeta,

      headerH: 20.5,
      fsBranch: 11.8,
      headerTextDrop: 5.5,
      storeLogoH: 14.2,
      storeLogoWMax: 70.0,

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

      // tipografías GRANDE
      fsName: 18.8,
      fsBrandModel: 12.4,
      fsOld: 11.6,

      // precio grande (auto-fit)
      fsPriceMax: 42.5,
      fsPriceMin: 30.0,

      // cuotas/meta
      fsInstall: 12.4,
      fsMeta: 11.8,

      // spacing
      topPad: 7.0,
      gapAfterName: 3.0,
      gapAfterBrand: 3.0,
      gapAfterOld: 4.0, // ✅ clave: evita pisada con precio
      gapAfterPrice: 3.0,
      gapAfterInstall: 2.2,
      gapAfterMeta: 1.6,
      minGapBeforeFooter: 3.8,

      // footer
      fsFooter1: 12.6,
      fsFooter2: 9.4,
      footerLine1: 11.0,
      footerLine2: 4.2,
      footerReserveH: 21.0,

      // medios
      payLogoH: 14.0,
      paySlotW: 34.0,
      payLogoGap: 6.4,

      // columns
      qrGap: 7.0,
    };

    for (let i = 0; i < totalCopies; i++) {
      if (i > 0) doc.addPage();
      drawLabelBig(doc, { x: L.box.x, y: L.box.y, w: L.box.w, h: L.box.h, pad: L.pad, qrSize: L.qr }, data);
    }

    doc.setProperties({ title: title || "Etiqueta A4 (100 grande)" });
    return doc;
  }

  // 58×40 (compacto)
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

    headerH: 7.6,
    fsBranch: 5.7,
    headerTextDrop: 2.2,
    storeLogoH: 5.6,
    storeLogoWMax: 22.0,

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

    // tipografías CHICO (conservadoras)
    fsName: 8.4,
    fsBrandModel: 5.8,
    fsOld: 5.6,

    fsPriceMax: 12.8,
    fsPriceMin: 10.5,

    fsInstall: 5.4,

    // footer
    fsFooter1: 5.6,
    fsFooter2: 5.0,
    footerLine1: 6.3,
    footerLine2: 1.7,
    footerReserveH: 10.6,

    // medios
    payLogoH: 3.7,
    paySlotW: 10.0,
    payLogoGap: 1.1,

    // columns
    qrGap: 2.6,
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