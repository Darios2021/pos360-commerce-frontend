// src/modules/pos/utils/montoTexto.js
//
// Importes tipeados en los campos grandes de las ventanas del POS: se ven con
// punto de miles y coma decimal mientras se escriben (25.000,50). El punto del
// teclado numérico al final y sin coma se toma como coma.

export function formatearMonto(crudo, decimales = 2) {
  let s = String(crudo ?? "");
  if (s.endsWith(".") && !s.includes(",") && decimales > 0) s = s.slice(0, -1) + ",";
  s = s.replace(/[^\d,]/g, "");
  const i = s.indexOf(",");
  let entero = (i >= 0 ? s.slice(0, i) : s).replace(/^0+(?=\d)/, "");
  const dec = i >= 0 ? s.slice(i + 1).replace(/,/g, "").slice(0, decimales) : "";
  entero = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return i >= 0 && decimales > 0 ? `${entero || "0"},${dec}` : entero;
}

export function montoANumero(texto) {
  const t = String(texto || "").trim();
  if (!t) return 0;
  const n = Number(t.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function pesos(n) {
  return `$ ${Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
