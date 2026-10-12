// src/modules/pos/utils/cajaResumen.js
//
// Lectura del resumen de caja (GET /pos/cash-registers/:id/summary) para las
// vistas del teléfono: totales y "Cobrado en el turno" en filas. Misma lectura
// que PosCajaArqueoDialog (escritorio).

function n(v, d = 0) {
  const x = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(x) ? x : d;
}

export function totalesCaja(summary) {
  const t = summary?.totals || {};
  return {
    fondo: n(t.opening_cash),
    ventas: n(t.sales_count),
    facturado: n(t.sales_total ?? t.sales_total_created ?? t.total_sales),
    ingresos: n(t.manual_in),
    egresos: n(t.manual_out),
    efectivoVentas: n(t.cash_sales),
    esperado: n(t.expected_cash),
  };
}

// Filas por medio con su cantidad de ventas; sólo las que tienen importe.
export function cobradoEnElTurno(summary) {
  const p = summary?.payments_by_method || {};
  const c = summary?.payments_count_by_method || {};
  const t = totalesCaja(summary);
  const efectivo = Number.isFinite(Number(p.cash)) ? n(p.cash) : Math.max(0, t.esperado - t.fondo);
  const filas = [
    { key: "cash", label: "Efectivo", total: efectivo },
    { key: "card", label: "Tarjeta", total: n(p.card) },
    { key: "transfer", label: "Transferencia", total: n(p.transfer) },
    { key: "mercadopago", label: "Mercado Pago", total: n(p.mercadopago) + n(p.qr) },
    { key: "credit_sjt", label: "Crédito SJT", total: n(p.credit_sjt) },
    { key: "other", label: "Otros", total: n(p.other) },
  ]
    .map((f) => ({ ...f, count: n(c[f.key]) + (f.key === "mercadopago" ? n(c.qr) : 0) }))
    .filter((f) => f.total > 0)
    .sort((a, b) => b.total - a.total);
  const max = Math.max(1, ...filas.map((f) => f.total));
  return filas.map((f) => ({ ...f, pct: Math.max(4, (f.total / max) * 100) }));
}

export function movimientosCaja(summary) {
  const arr = Array.isArray(summary?.movements) ? summary.movements : [];
  return arr
    .filter((m) => String(m?.reason || "") !== "APERTURA_CAJA")
    .slice()
    .reverse();
}

export function hora(v) {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime())
    ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
    : "";
}

export function fechaHora(v) {
  const d = v ? new Date(v) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${hora(v)}`;
}
