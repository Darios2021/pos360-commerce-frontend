// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/products/utils/labelPdf58.js
// Genera y guarda PDF 58×40 usando UI normalizada del adapter.

import QRCode from "qrcode";
import { jsPDF } from "jspdf";

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

export async function downloadLabelPdf58FromUI(ui) {
  const p = ui?.product || {};
  const id = p?.id || "";
  const name = String(p?.name || "Producto");

  const priceList = num(p?.price_list, 0);
  const priceDiscount = num(p?.price_discount, 0);
  const finalPrice = priceDiscount > 0 ? priceDiscount : priceList;
  const hasDiscount = priceDiscount > 0 && priceList > 0 && priceDiscount < priceList;
  const offPct = hasDiscount ? Math.max(1, Math.min(99, Math.round(((priceList - priceDiscount) / priceList) * 100))) : 0;

  const qrDataUrl = await QRCode.toDataURL(ui.ecommerceUrl, { errorCorrectionLevel: "M", margin: 1, scale: 7 });

  const W = 58;
  const H = 40;

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

  const shortUrl = String(ui.ecommerceUrl || "").replace(/^https?:\/\//, "");
  const payLine = "Tarjetas · Transferencia · Efectivo · QR";

  let y = pad;

  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.0);

  const nameLines = doc.splitTextToSize(name, leftW).slice(0, 2);
  doc.text(nameLines, xL, y + 4.0);
  y += 4.0 + nameLines.length * 4.0;

  if (hasDiscount) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.6);
    doc.setTextColor(60);

    const oldTxt = money(priceList);
    doc.text(oldTxt, xL, y + 2.8);

    const w = doc.getTextWidth(oldTxt);
    doc.setDrawColor(80);
    doc.setLineWidth(0.25);
    doc.line(xL, y + 2.2, xL + w, y + 2.2);

    doc.setTextColor(0);
    doc.text(`${offPct}% OFF`, xL + w + 2.0, y + 2.8);

    y += 4.1;
  } else {
    y += 1.2;
  }

  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19.0);
  doc.text(money(finalPrice), xL, y + 6.3);
  y += 7.6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);

  if (p?.sku) {
    doc.text(`SKU: ${p.sku}`, xL, y + 3.1);
    y += 4.0;
  }
  if (p?.code) {
    doc.text(`COD: ${p.code}`, xL, y + 3.1);
    y += 4.0;
  }

  const footerY1 = H - pad - 5.0;
  const footerY2 = H - pad - 1.6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.0);

  const maxW = W - pad * 2;
  let payTxt = `Medios: ${payLine}`;
  while (doc.getTextWidth(payTxt) > maxW && payTxt.length > 10) payTxt = payTxt.slice(0, -2);
  if (!payTxt.endsWith(payLine)) payTxt = payTxt.replace(/\s*$/, "") + "…";
  doc.text(payTxt, pad, footerY1);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.4);

  let urlTxt = shortUrl;
  while (doc.getTextWidth(urlTxt) > maxW && urlTxt.length > 12) urlTxt = urlTxt.slice(0, -2);
  if (urlTxt !== shortUrl) urlTxt = urlTxt.replace(/\s*$/, "") + "…";
  doc.text(urlTxt, pad, footerY2);

  doc.addImage(qrDataUrl, "PNG", xQR, yQR, qrSize, qrSize);

  const fileNameSafe = name.replace(/[\\/:*?"<>|]/g, "").slice(0, 40);
  doc.save(`Etiqueta_${id}_${fileNameSafe}.pdf`);
}