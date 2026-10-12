// src/modules/cargador/lib/formato.js
// Formatos compartidos por las pantallas del cargador (teléfono).

export const num = (v, d = 0) => {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
};

export function pesos(v) {
  const n = Math.round(num(v, 0));
  return (n < 0 ? "− " : "") + "$ " + Math.abs(n).toLocaleString("es-AR");
}

export function cant(v) {
  const n = num(v, 0);
  return Number.isInteger(n) ? n.toLocaleString("es-AR") : n.toLocaleString("es-AR", { maximumFractionDigits: 3 });
}

export const u = (v) => `${cant(v)} u.`;
export const unidades = (v) => (num(v) === 1 ? "1 unidad" : `${cant(v)} unidades`);
export const productos = (v) => (num(v) === 1 ? "1 producto" : `${cant(v)} productos`);

export function hora(v) {
  const d = v ? new Date(v) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** "hoy 11:48", "ayer 18:20" o "10/10". */
export function cuando(v) {
  const d = v ? new Date(v) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  if (d.toDateString() === hoy.toDateString()) return `hoy ${hora(d)}`;
  if (d.toDateString() === ayer.toDateString()) return `ayer ${hora(d)}`;
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export const nombrePersona = (p) => [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();

/** Sucursal de un depósito: "Centro" (sin el prefijo "Depósito"). */
export const sucursalDe = (w) => String(w?.branch?.name || w?.name || "").replace(/^Depósito\s+/i, "") || "";

export function imagenDe(p) {
  const imgs = p?.images;
  if (Array.isArray(imgs) && imgs.length) {
    const f = imgs[0];
    return typeof f === "string" ? f : f?.url || f?.thumbnail || null;
  }
  return p?.thumbnail || p?.image_url || p?.image || null;
}

export const codigoDe = (p) => String(p?.barcode || p?.sku || p?.code || "");
export const precioDe = (p) => num(p?.price_discount, 0) || num(p?.price_list, 0) || num(p?.price, 0);
export const stockDe = (p) => num(p?.stock_total ?? p?.stock_qty ?? p?.stock ?? p?.qty, 0);

export const esDerivacion = (c) => /^DER-\d{4}-\d{4,}$/i.test(String(c || "").trim());

export function mensajeDe(e, d = "No se pudo completar") {
  const m = e?.response?.data?.message || e?.message || "";
  return String(m || d);
}
