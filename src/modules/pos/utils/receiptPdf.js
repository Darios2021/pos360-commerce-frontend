// src/modules/pos/utils/receiptPdf.js
// PDF del comprobante de venta, en formato rollo de 80 mm (el mismo ancho que
// imprime la ticketera). Se arma con jsPDF y texto: nada de html2canvas, para
// no sumar dependencias al bundle y que el archivo pese poco.
//
// `output`: "save" descarga, "base64" devuelve { base64, filename } para
// mandarlo por mail.

const W = 80;            // ancho del papel en mm
const PAD = 4;           // margen lateral
const INNER = W - PAD * 2;

function money(v) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(Number(v || 0));
}

function fmtDatetime(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtQty(q) {
  const n = Number(q || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

// Las fuentes estándar de jsPDF no soportan emojis ni símbolos raros.
function clean(v) {
  return String(v ?? "")
    .normalize("NFC")
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200B}-\u{200D}]/gu,
      ""
    )
    .replace(/ /g, " ")
    .trim();
}

export async function buildReceiptPdf({
  sale,
  companyName = "",
  branchName = "",
  output = "save",
}) {
  const jsPDFmod = await import("jspdf");
  const JsPDF = jsPDFmod.jsPDF || jsPDFmod.default;

  const items = sale?.items || sale?.sale_items || sale?.saleItems || [];
  const payments = sale?.payments || [];
  const number = sale?.sale_number || sale?.id || "";

  // Alto estimado: el rollo es continuo, así que se calcula para que entre
  // todo sin cortar. Si sobra, el PDF queda un poco largo y no pasa nada.
  const height = 90 + items.length * 9 + payments.length * 5;

  const doc = new JsPDF({ unit: "mm", format: [W, height] });
  doc.setFont("helvetica", "normal");

  let y = 8;

  function line(text, { size = 8, style = "normal", align = "left", gap = 4 } = {}) {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const x = align === "center" ? W / 2 : align === "right" ? W - PAD : PAD;
    const parts = doc.splitTextToSize(clean(text), INNER);
    doc.text(parts, x, y, { align });
    y += gap * parts.length;
  }

  function row(left, right, { size = 7.5, style = "normal", gap = 4 } = {}) {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.text(clean(left), PAD, y);
    doc.text(clean(right), W - PAD, y, { align: "right" });
    y += gap;
  }

  function rule(dashed = true) {
    doc.setLineWidth(0.2);
    doc.setDrawColor(dashed ? 150 : 0);
    doc.line(PAD, y - 2, W - PAD, y - 2);
    y += 2;
  }

  // ── Cabecera ────────────────────────────────────────────────────────────
  if (companyName) line(companyName, { size: 11, style: "bold", align: "center", gap: 5 });
  if (branchName) line(branchName, { size: 8, align: "center" });
  if (sale?.branch?.address) line(sale.branch.address, { size: 7, align: "center", gap: 3.5 });
  if (sale?.branch?.phone) line(`Tel: ${sale.branch.phone}`, { size: 7, align: "center", gap: 3.5 });

  y += 2;
  rule();

  // ── Datos del comprobante ───────────────────────────────────────────────
  row("Comprobante", `N ${number}`, { style: "bold" });
  row("Fecha", fmtDatetime(sale?.sold_at || sale?.created_at));
  const cliente = String(sale?.customer_name || "").trim() || "Consumidor Final";
  row("Cliente", cliente);
  if (sale?.customer_doc) row("Documento", String(sale.customer_doc));

  y += 1;
  rule();

  // ── Renglones ───────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("DETALLE", PAD, y);
  doc.text("IMPORTE", W - PAD, y, { align: "right" });
  y += 4;

  for (const it of items) {
    const qty = Number(it.qty ?? it.quantity ?? 1);
    const unit = Number(it.unit_price ?? it.price ?? 0);
    const name = it.name || it.product_name || it.description || "Producto";

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const parts = doc.splitTextToSize(clean(name), INNER - 22);
    doc.text(parts, PAD, y);
    doc.text(money(qty * unit), W - PAD, y, { align: "right" });
    y += 3.6 * parts.length;

    doc.setFontSize(6.5);
    doc.setTextColor(110);
    doc.text(`${fmtQty(qty)} x ${money(unit)}`, PAD, y);
    doc.setTextColor(0);
    y += 4.5;
  }

  rule();

  // ── Totales ─────────────────────────────────────────────────────────────
  const total = Number(sale?.total || 0);
  const gross = items.reduce(
    (a, it) => a + Number(it.qty ?? it.quantity ?? 1) * Number(it.unit_price ?? it.price ?? 0),
    0
  );
  const discount = Math.max(0, gross - total);
  if (discount > 0.009) {
    row("Subtotal", money(gross));
    row("Descuento", `- ${money(discount)}`);
  }

  y += 1;
  row("TOTAL", money(total), { size: 10, style: "bold", gap: 5 });

  if (payments.length) {
    y += 1;
    rule();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("PAGOS", PAD, y);
    y += 4;
    for (const p of payments) {
      row(clean(p.method_label || p.method || "Pago"), money(p.amount), { size: 7 });
    }
    if (Number(sale?.change_total || 0) > 0) {
      row("Vuelto", money(sale.change_total), { size: 7, style: "bold" });
    }
  }

  y += 3;
  rule();
  line("Gracias por su compra", { size: 7.5, align: "center", gap: 4 });
  line("Este comprobante no es factura", { size: 6.5, align: "center", gap: 3.5 });

  const filename = `comprobante-${number}.pdf`;

  if (output === "base64") {
    const uri = doc.output("datauristring");
    return { base64: String(uri).split("base64,").pop(), filename };
  }

  doc.save(filename);
  return { filename };
}
