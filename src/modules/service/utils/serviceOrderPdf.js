// src/modules/service/utils/serviceOrderPdf.js
//
// Orden de trabajo imprimible del servicio tecnico.
//
// Replica la hoja PrintPage del libro SERV_TEC.xlsm, que es la que se imprimia
// y se cortaba en tres: una copia queda en el local, otra va con el equipo al
// taller y la tercera se la lleva el cliente como constancia de que dejo algo.
//
// Las tres copias entran en una A4. No es una decision estetica: es como se
// venia trabajando y el mostrador ya tiene el gesto de cortar por la linea.
//
// Diferencias con el papel viejo, todas a favor:
//   - La copia del taller trae la grilla del patron de desbloqueo (en el Excel
//     eran nueve "O" tipeadas a mano) y el PIN, que es lo que el tecnico
//     necesita para probar que la reparacion funciono.
//   - Las condiciones legales van completas en la copia del cliente, que es la
//     unica que las necesita.

import http from "@/app/api/http";
import { fmtFecha } from "./fechas";

function money(v) {
  const n = Number(v || 0);
  return `$ ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const fecha = (v) => fmtFecha(v);

// Las fuentes estandar de jsPDF son WinAnsi: los simbolos raros salen como
// basura. Mismo criterio que el PDF de presupuestos.
function txt(v) {
  return String(v ?? "")
    .normalize("NFC")
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200B}-\u{200D}]/gu,
      ""
    )
    .replace(/ /g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

// Condiciones del dorso del papel viejo, tal cual las tenia el Excel. No se
// tocan sin que lo decida el local: es lo que se le opone al cliente cuando
// deja un equipo y no lo retira.
const CONDICIONES = [
  "1. La casa no se hace responsable por roturas y/o problemas durante la reparacion del dispositivo.",
  "2. Pasados 15 dias de la fecha pactada de entrega tendra un cargo diario. Pasados 45 dias de la fecha",
  "acordada sera considerado abandono y la casa se reserva el derecho de dar el destino pertinente al",
  "dispositivo, segun lo establecido por los arts. 2375 / 2225 / 2524 del Codigo Civil y Comercial de la Nacion.",
  "3. La casa se reserva el derecho de entregar el dispositivo sin la presente constancia.",
];

export async function loadServiceIdentity(branchId = null) {
  let branding = {};
  try {
    const { data } = await http.get("/admin/shop/branding");
    branding = data?.item || data?.data || {};
  } catch {
    branding = {};
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

export async function exportServiceOrderPdf({ orden = {}, identity = {}, output = "save" }) {
  const jsPDFmod = await import("jspdf");
  const JsPDF = jsPDFmod.jsPDF || jsPDFmod.default;

  const { branding = {}, branch = null } = identity;

  const doc = new JsPDF({ unit: "pt", format: "a4" });
  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();
  const M = 34;
  const RIGHT = PAGE_W - M;
  const INK = 25;
  const MUTED = 130;

  const nombreLocal = txt(branding?.name) || "SERVICIO TECNICO";
  const lemaLocal = txt(branding?.slogan || branding?.tagline) || "";
  const direccion = txt(
    branch ? [branch.address, branch.city].filter(Boolean).join(", ") : branding?.address
  );
  const telefono = txt(
    branch?.phone || branding?.phone_display || branding?.whatsapp_display
  );

  const numero = orden.numero_visible || (orden.number ? `OT-${String(orden.number).padStart(5, "0")}` : "");
  const equipo = [orden.device_brand, orden.device_model].filter(Boolean).join(" ");

  // Alto de cada copia: la hoja se divide en tres partes iguales.
  const ALTO = (PAGE_H - M * 2) / 3;

  function fila(y, etiqueta, valor, x = M, anchoEtiqueta = 74) {
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(MUTED);
    doc.text(txt(etiqueta), x, y);
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(INK);
    doc.text(txt(valor) || "-", x + anchoEtiqueta, y);
  }

  // Grilla 3x3 del patron de desbloqueo. En el Excel eran nueve "O" tipeadas.
  function patron(x, y) {
    doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(MUTED);
    doc.text("Patron", x, y - 5);
    doc.setDrawColor(170);
    for (let f = 0; f < 3; f++) {
      for (let c = 0; c < 3; c++) {
        doc.circle(x + 6 + c * 15, y + 6 + f * 15, 3.2, "S");
      }
    }
  }

  function copia(indice, titulo, opciones = {}) {
    const top = M + ALTO * indice;
    const y0 = top + 14;

    // Linea de corte entre copias.
    if (indice > 0) {
      doc.setDrawColor(200).setLineDashPattern([2, 3], 0);
      doc.line(M, top - 6, RIGHT, top - 6);
      doc.setLineDashPattern([], 0);
    }

    // Encabezado
    doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(INK);
    doc.text(nombreLocal, M, y0);

    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(MUTED);
    let yh = y0 + 11;
    for (const linea of [lemaLocal, direccion, telefono].filter(Boolean)) {
      doc.text(txt(linea), M, yh);
      yh += 9;
    }

    // Identificacion de la copia + fecha y numero
    doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(INK);
    doc.text(txt(titulo), RIGHT, y0, { align: "right" });
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(MUTED);
    doc.text(`Fecha: ${fecha(orden.created_at)}`, RIGHT, y0 + 12, { align: "right" });
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(INK);
    doc.text(`Orden ${numero}`, RIGHT, y0 + 26, { align: "right" });

    doc.setDrawColor(210);
    doc.line(M, y0 + 34, RIGHT, y0 + 34);

    // Cuerpo, en dos columnas como el papel
    const colB = M + (RIGHT - M) / 2 + 10;
    let y = y0 + 50;

    fila(y, "Cliente:", orden.customer_name);
    fila(y, "Contacto:", orden.customer_phone, colB, 56);
    y += 16;

    fila(y, "Equipo:", equipo);
    fila(y, "Estado gral.:", orden.intake_condition, colB, 56);
    y += 16;

    fila(y, "Falla:", orden.reported_fault);
    fila(y, "Recibido por:", orden.received_by, colB, 56);
    y += 16;

    if (opciones.tecnica) {
      // Copia del taller: lo que el tecnico necesita para trabajar y probar.
      fila(y, "IMEI:", orden.device_imei);
      fila(y, "PIN / clave:", orden.device_unlock, colB, 56);
      y += 16;
      fila(y, "Accesorios:", orden.device_accessories);
      y += 16;
      fila(y, "Tecnico:", orden.technician_name);
      patron(colB, y - 4);
      y += 16;
    } else {
      fila(y, "Retiro estimado:", fecha(orden.estimated_pickup), M, 84);
      y += 16;

      // Importes: solo en la copia del local y en la del cliente. La del
      // taller no lleva plata a proposito.
      fila(y, "Valor total:", money(orden.quoted_amount));
      y += 14;
      fila(y, "Seña:", money(orden.deposit));
      y += 14;
      doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(INK);
      doc.text("Saldo:", M, y);
      doc.text(money(orden.balance), M + 74, y);
      y += 16;
    }

    if (opciones.condiciones) {
      doc.setFont("helvetica", "normal").setFontSize(5.6).setTextColor(MUTED);
      for (const linea of CONDICIONES) {
        doc.text(txt(linea), M, y);
        y += 6.4;
      }
      y += 4;
    }

    if (opciones.firma) {
      const yFirma = top + ALTO - 24;
      doc.setDrawColor(180);
      doc.line(RIGHT - 150, yFirma, RIGHT, yFirma);
      doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(MUTED);
      doc.text(txt(opciones.firma), RIGHT - 75, yFirma + 9, { align: "center" });
    }
  }

  copia(0, "COPIA LOCAL", { firma: "Firma del cliente" });
  copia(1, "COPIA SERVICIO TECNICO", { tecnica: true });
  copia(2, "COPIA CLIENTE", { condiciones: true, firma: "Firma del receptor" });

  const nombreArchivo = `orden-${(numero || "servicio").replace(/[^\w-]/g, "")}.pdf`;

  if (output === "base64") {
    return { base64: doc.output("datauristring").split(",")[1], filename: nombreArchivo };
  }
  doc.save(nombreArchivo);
  return { filename: nombreArchivo };
}
