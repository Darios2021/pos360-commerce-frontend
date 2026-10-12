// src/modules/pos/utils/compartirTicket.js
//
// Ticket en el teléfono (webapp): no hay impresora local, así que el ticket se
// comparte como PDF con la hoja nativa del sistema (WhatsApp, mail, Drive).
// Si el navegador no comparte archivos, se descarga. Mismo PDF que el
// escritorio (receiptPdf.js).
import http from "@/app/api/http";
import { buildReceiptPdf } from "./receiptPdf";
import { EMPRESA } from "./escpos";

function base64ABlob(base64, tipo = "application/pdf") {
  const limpio = String(base64 || "").replace(/^data:[^,]+,/, "");
  const bin = atob(limpio);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: tipo });
}

export async function compartirTicket(sale, { branchName = "" } = {}) {
  const { base64, filename } = await buildReceiptPdf({
    sale,
    companyName: EMPRESA,
    branchName,
    output: "base64",
  });
  const nombre = filename || `ticket-${sale?.id || ""}.pdf`;
  const archivo = new File([base64ABlob(base64)], nombre, { type: "application/pdf" });
  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: `Venta #${sale?.id || ""}` });
      return "compartido";
    } catch (e) {
      if (e?.name === "AbortError") return "cancelado";
    }
  }
  await buildReceiptPdf({ sale, companyName: EMPRESA, branchName, output: "save" });
  return "descargado";
}

export async function enviarTicketPorEmail(sale, to, { branchName = "" } = {}) {
  const { base64, filename } = await buildReceiptPdf({
    sale,
    companyName: EMPRESA,
    branchName,
    output: "base64",
  });
  await http.post(`/pos/sales/${sale.id}/email`, { to, pdf_base64: base64, filename });
}
