// src/modules/budgets/utils/budgetPdf.js
// Generación del PDF de presupuesto, compartida entre el editor y el listado.
//
// Regla del documento: NUNCA lleva costo ni margen. Es la hoja que se le
// entrega al cliente, así que solo salen cantidad, descripción, precio sin IVA
// e importe.
import http from "@/app/api/http";
import { getBudget } from "../services/budgets.service";

function money(v, currency = "ARS") {
  const n = Number(v || 0);
  const symbol = currency === "USD" ? "US$" : "$";
  return `${symbol} ${n.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Las fuentes estándar de jsPDF son WinAnsi: los emojis y los símbolos raros
// que suelen venir pegados en las descripciones del catálogo salen como
// basura ("Ø=Ý"). Los sacamos y normalizamos los espacios.
function pdfText(v) {
  return String(v ?? "")
    .normalize("NFC")
    // emojis, pictogramas, flechas decorativas y selectores de variante
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200B}-\u{200D}]/gu,
      ""
    )
    .replace(/ /g, " ")      // espacio duro
    .replace(/[ \t]{2,}/g, " ")   // espacios repetidos
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Baja una imagen y la devuelve como dataURL para jsPDF. Si falla (CORS, 404,
// red) devolvemos null: el PDF se genera igual, sin logo.
async function fetchImageDataUrl(url) {
  try {
    if (!url) return null;
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Identidad visual del shop + sucursal del usuario. El endpoint admin trae
// además dirección y teléfonos; si el usuario no tiene permiso de admin caemos
// al público, que al menos da nombre y logo.
export async function loadBudgetIdentity(branchId = null) {
  let branding = {};
  try {
    const { data } = await http.get("/admin/shop/branding");
    branding = data?.item || data?.data || {};
  } catch {
    try {
      const { data } = await http.get("/public/shop/branding");
      branding = data?.item || {};
    } catch {
      branding = {};
    }
  }

  let branch = null;
  try {
    const { data } = await http.get("/branches");
    const list = data?.data || data?.items || [];
    branch = list.find((b) => Number(b.id) === Number(branchId)) || list[0] || null;
  } catch {
    branch = null;
  }

  return { branding, branch };
}

// Genera y descarga el PDF. `budget` es la cabecera, `items` los renglones y
// `totals` los acumulados; identity es lo que devuelve loadBudgetIdentity().
// `output`: "save" descarga el archivo (default), "base64" devuelve
// { base64, filename } para mandarlo por mail sin bajarlo.
export async function exportBudgetPdf({
  budget,
  items = [],
  totals = {},
  identity = {},
  fxCaption = "",
  output = "save",
}) {
  const jsPDFmod = await import("jspdf");
  const JsPDF = jsPDFmod.jsPDF || jsPDFmod.default;
  const autoTableMod = await import("jspdf-autotable");
  const autoTable = autoTableMod.default || autoTableMod.autoTable || autoTableMod;

  const { branding = {}, branch = null } = identity;
  const currency = budget?.currency || "ARS";
  // Los importes se guardan en pesos. Si el presupuesto es en USD hay que
  // dividir por la cotización que quedó congelada en el documento, no cambiar
  // el símbolo y listo.
  const rate = (() => {
    const r = Number(budget?.exchange_rate || 1);
    return Number.isFinite(r) && r > 0 ? r : 1;
  })();
  const m = (v) => money(currency === "USD" ? Number(v || 0) / rate : v, currency);

  const companyName = branding?.name || "";
  const companyPhone = branch?.phone || branding?.phone_display || branding?.whatsapp_display || "";
  const companyEmail = branding?.email || "";
  const companyAddress = branch
    ? [branch.address, branch.city, branch.province].filter(Boolean).join(", ")
    : branding?.address || "";
  // El logo completo es apaisado (1920x500) y no entra en el encabezado: para
  // el PDF usamos el isotipo, que es el símbolo solo.
  const companyMark = branding?.favicon_url || branding?.og_image_url || "";

  const doc = new JsPDF({ unit: "pt", format: "a4" });
  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();
  const M = 44;                 // margen
  const RIGHT = PAGE_W - M;
  const INK = 25;               // gris casi negro para reglas y titulos
  const MUTED = 130;

  // Miniaturas: se bajan todas antes de dibujar porque autoTable es sincrono.
  const thumbs = await Promise.all(items.map((i) => fetchImageDataUrl(i.image_url)));

  function label(text, x, y, { align = "left", size = 7.5, gray = MUTED } = {}) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(gray);
    doc.text(String(text).toUpperCase(), x, y, { align, charSpace: 1.1 });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(INK);
  }

  // ── Encabezado ──────────────────────────────────────────────────────────
  const markData = await fetchImageDataUrl(companyMark);
  let infoX = M;
  if (markData) {
    try {
      doc.addImage(markData, M, 40, 40, 40);
      infoX = M + 52;
    } catch (err) {
      console.warn("[budgets] no se pudo insertar el isotipo:", err);
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(INK);
  if (companyName) doc.text(pdfText(companyName), infoX, 52);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(MUTED);
  const headLines = [branch?.name, companyAddress, companyPhone, companyEmail]
    .filter(Boolean)
    .map(pdfText);
  if (headLines.length) doc.text(headLines, infoX, 64, { lineHeightFactor: 1.45 });

  label("Presupuesto", RIGHT, 48, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.setTextColor(INK);
  doc.text(`#${budget?.number ?? ""}`, RIGHT, 68, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(MUTED);
  doc.text("Fecha", RIGHT - 62, 84, { align: "right" });
  doc.text("Vence", RIGHT - 62, 96, { align: "right" });
  doc.setTextColor(INK);
  doc.text(fmtDate(budget?.created_at), RIGHT, 84, { align: "right" });
  doc.text(fmtDate(budget?.valid_until), RIGHT, 96, { align: "right" });

  const headBottom = Math.max(112, 64 + headLines.length * 12 + 8);
  doc.setDrawColor(INK);
  doc.setLineWidth(1.2);
  doc.line(M, headBottom, RIGHT, headBottom);

  // ── Cliente ─────────────────────────────────────────────────────────────
  let y = headBottom + 26;
  label("Cliente", M, y);
  y += 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(INK);
  doc.text(pdfText(budget?.customer_name) || "Consumidor Final", M, y);

  const customerLine = [budget?.customer_phone, budget?.customer_email, budget?.customer_cuit]
    .filter(Boolean)
    .join("  ·  ");
  if (customerLine) {
    y += 13;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(MUTED);
    doc.text(pdfText(customerLine), M, y);
  }

  // ── Renglones ───────────────────────────────────────────────────────────
  // Tabla sin marcos: solo una regla bajo el encabezado y hairlines entre
  // filas. La miniatura va en una columna propia y se dibuja a mano.
  const THUMB = 26;
  autoTable(doc, {
    startY: y + 24,
    margin: { left: M, right: M },
    theme: "plain",
    head: [["Cant.", "", "Detalle", "P. unitario", "Importe"]],
    body: items.map((i) => [
      Number(i.qty),
      "",
      pdfText(i.description) + (i.sku ? `\n${pdfText(i.sku)}` : ""),
      m(i.unit_price),
      m(i.line_total),
    ]),
    styles: {
      fontSize: 9,
      cellPadding: { top: 8, bottom: 8, left: 4, right: 4 },
      textColor: INK,
      lineColor: 222,
      lineWidth: { bottom: 0.5 },
      valign: "middle",
    },
    headStyles: {
      fontSize: 7.5,
      fontStyle: "bold",
      textColor: MUTED,
      lineColor: 150,
      lineWidth: { bottom: 0.8 },
      cellPadding: { top: 0, bottom: 6, left: 4, right: 4 },
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 42 },
      1: { cellWidth: items.some((i) => i.image_url) ? THUMB + 10 : 0 },
      2: { halign: "left" },
      3: { halign: "right", cellWidth: 88 },
      4: { halign: "right", cellWidth: 88, fontStyle: "bold" },
    },
    didParseCell(data) {
      // El codigo va en gris y mas chico que la descripcion.
      if (data.section === "body" && data.column.index === 2) {
        data.cell.styles.minCellHeight = THUMB + 4;
      }
    },
    didDrawCell(data) {
      if (data.section !== "body" || data.column.index !== 1) return;
      const img = thumbs[data.row.index];
      if (!img) return;
      try {
        const cy = data.cell.y + (data.cell.height - THUMB) / 2;
        doc.addImage(img, data.cell.x, cy, THUMB, THUMB);
      } catch (err) {
        console.warn("[budgets] miniatura omitida:", err);
      }
    },
  });

  // ── Totales ─────────────────────────────────────────────────────────────
  y = (doc.lastAutoTable?.finalY || 300) + 22;
  const LABEL_X = RIGHT - 190;

  const rows = [
    ["SubTotal", m(totals?.subtotal)],
    ["IVA 21%", m(totals?.vat_21)],
    ["IVA 10.5%", m(totals?.vat_105)],
  ];
  doc.setFontSize(9.5);
  for (const [k, v] of rows) {
    doc.setTextColor(MUTED);
    doc.text(k, LABEL_X, y);
    doc.setTextColor(INK);
    doc.text(String(v), RIGHT, y, { align: "right" });
    y += 15;
  }

  y += 4;
  doc.setDrawColor(INK);
  doc.setLineWidth(1.2);
  doc.line(LABEL_X, y, RIGHT, y);
  y += 17;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(INK);
  doc.text("TOTAL", LABEL_X, y);
  doc.text(String(m(totals?.total)), RIGHT, y, { align: "right" });
  doc.setFont("helvetica", "normal");

  // Cotizacion aplicada: el cliente tiene que poder ver con que dolar se calculo.
  if (fxCaption) {
    y += 14;
    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.text(String(fxCaption), RIGHT, y, { align: "right" });
    doc.setTextColor(INK);
  }

  // Salta de pagina si lo que viene no entra.
  function ensure(space) {
    if (y + space > PAGE_H - M) {
      doc.addPage();
      y = M;
    }
  }

  // ── Especificaciones ────────────────────────────────────────────────────
  const withSpecs = items
    .map((i, idx) => ({ item: i, thumb: thumbs[idx] }))
    .filter(({ item }) => String(item.specs || "").trim());

  if (withSpecs.length) {
    ensure(70);
    y += 34;
    label("Especificaciones", M, y);
    y += 8;
    doc.setDrawColor(210);
    doc.setLineWidth(0.5);
    doc.line(M, y, RIGHT, y);
    y += 18;

    const SP_THUMB = 40;
    const BODY_SIZE = 8.5;
    const BODY_LH = 1.35;
    const BODY_LINE = BODY_SIZE * BODY_LH;

    for (const { item, thumb } of withSpecs) {
      const textX = thumb ? M + SP_THUMB + 12 : M;
      const textW = RIGHT - textX;

      // El ancho se mide con la MISMA fuente con la que se dibuja, si no
      // jsPDF parte las lineas mal y el texto se sale de la hoja.
      const sku = pdfText(item.sku);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const skuW = sku ? doc.getTextWidth(sku) + 12 : 0;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      const title = doc.splitTextToSize(
        pdfText(item.description) || "Sin descripción",
        Math.max(60, textW - skuW)
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(BODY_SIZE);
      const body = doc.splitTextToSize(pdfText(item.specs), textW);

      const textH = title.length * 12 + 4 + body.length * BODY_LINE;
      const blockH = Math.max(thumb ? SP_THUMB : 0, textH) + 18;

      ensure(blockH);

      if (thumb) {
        try {
          doc.addImage(thumb, M, y - 9, SP_THUMB, SP_THUMB);
        } catch (err) {
          console.warn("[budgets] miniatura de especificacion omitida:", err);
        }
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(INK);
      doc.text(title, textX, y);
      if (sku) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(MUTED);
        doc.text(sku, RIGHT, y, { align: "right" });
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(BODY_SIZE);
      doc.setTextColor(70);
      doc.text(body, textX, y + title.length * 12 + 2, { lineHeightFactor: BODY_LH });
      doc.setTextColor(INK);

      y += blockH;
    }
  }

  // ── Observaciones ───────────────────────────────────────────────────────
  if (budget?.notes) {
    // Igual que arriba: medir con la fuente final, no con la del rótulo.
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const body = doc.splitTextToSize(pdfText(budget.notes), RIGHT - M);
    ensure(46 + body.length * 12);
    y += 26;
    label("Observaciones", M, y);
    y += 8;
    doc.setDrawColor(210);
    doc.setLineWidth(0.5);
    doc.line(M, y, RIGHT, y);
    y += 16;
    doc.setFontSize(8.5);
    doc.setTextColor(70);
    doc.text(body, M, y, { lineHeightFactor: 1.4 });
    doc.setTextColor(INK);
  }

  const filename = `presupuesto-${budget?.number ?? ""}.pdf`;

  if (output === "base64") {
    // datauristring viene como "data:application/pdf;filename=...;base64,XXXX"
    const uri = doc.output("datauristring");
    return { base64: String(uri).split("base64,").pop(), filename };
  }

  doc.save(filename);
  return { filename };
}

// Trae el presupuesto completo por id y lo exporta. Lo usa el listado, donde
// solo tenemos la cabecera.
// Leyenda de la cotización aplicada, para que el documento diga con qué dólar
// se calculó y de cuándo es.
export function buildFxCaption(budget) {
  if (budget?.currency !== "USD") return "";
  const rate = Number(budget?.exchange_rate || 1);
  const parts = [
    `US$ 1 = $ ${rate.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
  ];
  if (budget?.fx_source) parts.push(budget.fx_source);
  if (budget?.fx_date) {
    const d = new Date(budget.fx_date);
    if (!Number.isNaN(d.getTime())) {
      parts.push(
        d.toLocaleString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
  }
  return parts.join(" · ");
}

export async function exportBudgetPdfById(id, identity) {
  const { data } = await getBudget(id);
  const full = data?.data || data?.item || {};
  const ident = identity || (await loadBudgetIdentity(full?.branch_id));
  await exportBudgetPdf({
    budget: full,
    items: full.items || [],
    totals: {
      subtotal: full.subtotal,
      vat_21: full.vat_21,
      vat_105: full.vat_105,
      total: full.total,
    },
    identity: ident,
    fxCaption: buildFxCaption(full),
  });
}
