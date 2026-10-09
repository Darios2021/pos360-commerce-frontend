// src/modules/pos/utils/escpos.js
//
// EL TICKET EN EL IDIOMA DE LA IMPRESORA (ESC/POS).
//
// Por el navegador, Chrome y el driver de Windows le mandan a la termica el
// ticket como una IMAGEN, punto por punto, y pasa por el cuadro de impresion.
// Aca se arma el mismo comprobante como TEXTO con los comandos de la
// impresora: pocos bytes, su fuente interna y corte de papel al final. Lo
// entrega a la impresora el programa local de la PC del mostrador
// (public/shop/app/impresora/pos360-impresora.ps1), porque el navegador no
// puede escribirle directo a un puerto USB.
//
// Mecanica tomada de Sazonik (utils/escpos.ts). El contenido sigue a
// components/ReceiptDialog.vue renglon por renglon: si el comprobante cambia
// alla, cambia aca.

/** Lo que va en todos los tickets: razon social y Defensa del Consumidor. */
export const EMPRESA = "SAN JUAN TECNOLOGIA";
export const DEFENSA_CONSUMIDOR = "DEF. CONSUMIDOR 4306400-08";

/** "Chimbas" -> "Sucursal Chimbas"; si ya dice "Sucursal", queda igual. */
export function rotuloSucursal(nombre) {
  const n = String(nombre || "").trim();
  if (!n) return "";
  return /^sucursal\b/i.test(n) ? n : `Sucursal ${n}`;
}

/** El cajero por su ID en el sistema, no por el nombre. */
export function idCajero(sale) {
  const id = sale?.user?.id ?? sale?.user_id ?? sale?.seller_id;
  return id != null && id !== "" ? String(id) : "";
}

/** Columnas de la fuente A: 48 en un rollo de 80 (72 mm de area), 32 en uno de 58. */
export const columnasDe = (anchoPapel) => (Number(anchoPapel) === 58 ? 32 : 48);

// ── Texto ──────────────────────────────────────────────────────────────────

/** La plata con espacios comunes: Intl pone un espacio duro entre "$" y el numero. */
export function plata(monto) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" })
    .format(Number(monto || 0))
    .replace(/[  ]/g, " ");
}

/** Parte un texto en renglones de `ancho`, cortando en los espacios. */
export function partir(texto, ancho) {
  const salida = [];
  for (const parrafo of String(texto ?? "").split("\n")) {
    let actual = "";
    for (let palabra of parrafo.split(/\s+/).filter(Boolean)) {
      while (palabra.length > ancho) {
        if (actual) { salida.push(actual); actual = ""; }
        salida.push(palabra.slice(0, ancho));
        palabra = palabra.slice(ancho);
      }
      if (!palabra) continue;
      if (!actual) actual = palabra;
      else if (actual.length + 1 + palabra.length <= ancho) actual += " " + palabra;
      else { salida.push(actual); actual = palabra; }
    }
    if (actual) salida.push(actual);
  }
  return salida.length ? salida : [""];
}

/** Un texto a la izquierda y otro a la derecha en el mismo renglon. */
export function aLosCostados(izq, der, ancho) {
  izq = String(izq ?? "");
  der = String(der ?? "");
  if (izq.length + 1 + der.length <= ancho) return [izq + " ".repeat(ancho - izq.length - der.length) + der];
  const renglones = partir(izq, ancho);
  const ultimo = renglones[renglones.length - 1];
  if (ultimo.length + 1 + der.length <= ancho) {
    renglones[renglones.length - 1] = ultimo + " ".repeat(ancho - ultimo.length - der.length) + der;
  } else {
    renglones.push(" ".repeat(Math.max(0, ancho - der.length)) + der);
  }
  return renglones;
}

// ── Lectura de la venta (los mismos campos que ReceiptDialog.vue) ─────────

function fechaHora(v) {
  if (!v) return "";
  return new Date(v).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
}
function cantidad(q) {
  const n = Number(q || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
const cantDe = (it) => Number(it.qty ?? it.quantity ?? 1);
const precioDe = (it) => Number(it.unit_price ?? it.price ?? 0);

function medio(p) {
  const ref = String(p?.reference || "").trim().toUpperCase();
  const m = ref === "SJCREDIT" || ref === "SJ_CREDIT" ? "CREDIT_SJT" : String(p?.method || "OTHER").toUpperCase();
  if (m === "CASH") return "Efectivo";
  if (m === "TRANSFER") return "Transferencia bancaria";
  if (m === "CARD") return "Tarjeta";
  if (m === "MERCADOPAGO" || m === "QR") return "Mercado Pago / QR";
  if (m.includes("CREDIT_SJ") || m.includes("SJCREDIT")) return "San Juan Credito";
  return p?.method || "Otro";
}

// ── El comprobante ─────────────────────────────────────────────────────────

/**
 * El ticket como renglones. Sirve para imprimir (`codificar`) y para la vista
 * de Impresion, que muestra exactamente lo que va a salir.
 */
export function armarTicket({ sale, companyName = EMPRESA, branchName = "" }, columnas) {
  const r = [];
  const mitad = Math.floor(columnas / 2);
  const raya = "-".repeat(columnas);
  const centro = (texto, extra = {}) =>
    partir(texto, columnas).forEach((s) => r.push({ texto: s, centro: true, ...extra }));
  const grande = (texto) =>
    partir(texto, mitad).forEach((s) => r.push({ texto: s, centro: true, negrita: true, doble: true }));
  const fila = (izq, der, extra = {}) =>
    aLosCostados(izq, der, columnas).forEach((s) => r.push({ texto: s, ...extra }));

  const numero = sale?.sale_number || sale?.id || "";
  const sucursal = rotuloSucursal(branchName || sale?.branch?.name);
  const direccion = String(sale?.branch?.address || "").trim();
  const telefono = String(sale?.branch?.phone || "").trim();

  // Cabecera
  grande(String(companyName || EMPRESA).toUpperCase());
  if (sucursal) centro(sucursal);
  if (direccion) centro(direccion);
  if (telefono) centro(`Tel: ${telefono}`);
  r.push({ texto: raya });

  // Datos
  fila("Comprobante", `N° ${numero}`);
  fila("Fecha y hora", fechaHora(sale?.sold_at || sale?.created_at));
  const cajero = idCajero(sale);
  if (cajero) fila("Cajero ID", cajero);
  fila("Cliente", String(sale?.customer_name || "").trim() || "Consumidor Final");
  const doc = String(sale?.customer_doc || "").trim();
  if (doc) fila("Doc.", doc);
  const modo = String(sale?.invoice_mode || "").toUpperCase();
  const tipo = String(sale?.invoice_type || "").toUpperCase();
  if (modo === "FISCAL") fila("Tipo comprobante", tipo ? `Fiscal ${tipo}` : "Fiscal");
  r.push({ texto: raya });

  // Items: el nombre en un renglon y "cant x precio ..... total" abajo.
  const items = sale?.items || sale?.sale_items || sale?.saleItems || [];
  fila("DESCRIPCION", "TOTAL", { negrita: true });
  let bruto = 0;
  for (const it of items) {
    const total = cantDe(it) * precioDe(it);
    bruto += total;
    const nombre = it.product_name_snapshot || it.product?.name || `Prod. #${it.product_id}`;
    partir(nombre, columnas).forEach((s) => r.push({ texto: s }));
    const sku = it.product_sku_snapshot || it.product?.sku;
    if (sku) partir(`SKU: ${sku}`, columnas - 2).forEach((s) => r.push({ texto: "  " + s }));
    fila(`  ${cantidad(cantDe(it))} x ${plata(precioDe(it))}`, plata(total));
  }
  r.push({ texto: "=".repeat(columnas) });

  // Totales
  const totalVenta = Number(sale?.total || 0);
  const descuento = Math.max(0, bruto - totalVenta);
  if (descuento > 0.009) {
    fila("Subtotal bruto", plata(bruto));
    fila("Descuento", `- ${plata(descuento)}`);
  }
  aLosCostados("TOTAL", plata(totalVenta), mitad).forEach((s) => r.push({ texto: s, negrita: true, doble: true }));
  r.push({ texto: raya });

  // Pagos
  r.push({ texto: "FORMA DE PAGO", negrita: true });
  for (const p of sale?.payments || []) {
    const etiqueta = medio(p) + (p.reference ? ` · ${p.reference}` : "");
    fila(etiqueta, plata(p.amount));
  }
  const entregado = Number(sale?.paid_total || 0);
  if (entregado > 0 && entregado !== totalVenta) fila("Entregado", plata(entregado));
  const vuelto = Number(sale?.change_total || 0);
  if (vuelto > 0) fila("Vuelto", plata(vuelto), { negrita: true });
  r.push({ texto: raya });

  // Pie
  centro("¡Gracias por su compra!", { negrita: true });
  centro(`Comprobante N° ${numero} · ID #${sale?.id ?? ""}`);
  if (sucursal) centro(sucursal);
  centro(DEFENSA_CONSUMIDOR, { negrita: true });
  return r;
}

// ── Bytes ──────────────────────────────────────────────────────────────────

/**
 * La tabla de caracteres de la impresora: la PC437, la que imprime su autotest.
 * Tiene las minusculas acentuadas, la ñ, la Ñ, el ° y el ¡; de las mayusculas
 * con tilde solo la É: las demas salen sin tilde.
 */
const PC437 =
  "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐" +
  "└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ";

const EQUIVALENTES = {
  "–": "-", "—": "-", "“": '"', "”": '"', "‘": "'", "’": "'", "…": "...",
  " ": " ", " ": " ", "•": "·",
};

export function aPC437(texto) {
  const bytes = [];
  for (const ch of String(texto)) {
    const c = ch.codePointAt(0);
    if (c >= 0x20 && c < 0x7f) { bytes.push(c); continue; }
    const eq = EQUIVALENTES[ch];
    if (eq !== undefined) { bytes.push(...aPC437(eq)); continue; }
    const i = PC437.indexOf(ch);
    if (i >= 0 && i < 127) { bytes.push(0x80 + i); continue; }
    const base = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (base !== ch && base.length === 1) { bytes.push(...aPC437(base)); continue; }
    bytes.push(0x3f); // '?'
  }
  return bytes;
}

const ESC = 0x1b, GS = 0x1d, LF = 0x0a;

/** Los renglones como bytes ESC/POS, con avance y corte al final. */
export function codificar(renglones) {
  const b = [ESC, 0x40, ESC, 0x74, 0];
  for (const r of renglones) {
    b.push(ESC, 0x61, r.centro ? 1 : 0, ESC, 0x45, r.negrita ? 1 : 0, GS, 0x21, r.doble ? 0x11 : 0);
    b.push(...aPC437(r.texto), LF);
  }
  b.push(ESC, 0x45, 0, GS, 0x21, 0, ESC, 0x61, 0);
  // Avance para que el ultimo renglon pase la cuchilla, y corte total en la
  // forma A (GS V 0): la que entienden todas las termicas con cortador. La
  // forma B (GS V 66), que trae Sazonik, la ignoran algunas genericas.
  b.push(ESC, 0x64, 6, GS, 0x56, 0x00); // avanzar y cortar
  return Uint8Array.from(b);
}

export function ticketEscPos(datos, anchoPapel) {
  return codificar(armarTicket(datos, columnasDe(anchoPapel)));
}
