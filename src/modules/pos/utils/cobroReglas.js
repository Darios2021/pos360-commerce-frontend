// src/modules/pos/utils/cobroReglas.js
//
// Reglas del cobro para la vista Cobrar del teléfono. Son copia fiel de las
// funciones puras de checkout/CheckoutDialog.vue (escritorio), que no se toca:
// precio lista o contado según medio y cuotas, cuotas disponibles, medios que
// reciben efectivo o piden número de operación. Si cambia una regla allá,
// cambiarla también acá.

export function toNum(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export function parseAmount(v) {
  if (v === null || v === undefined) return 0;
  const raw = String(v).trim();
  if (!raw) return 0;
  const n = Number(raw.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function normalizeCardKind(v, fallback = "CREDIT") {
  const k = String(v || fallback).toUpperCase();
  if (k === "DEBIT") return "DEBIT";
  if (k === "BOTH") return "BOTH";
  if (k === "PREPAID") return "PREPAID";
  return "CREDIT";
}

export function normalizeMethod(method = {}) {
  const x = method || {};
  return {
    id: Number(x.id || 0),
    name: String(x.name || "").trim(),
    display_name: String(x.display_name || "").trim(),
    kind: String(x.kind || "OTHER").toUpperCase(),
    pricing_mode: String(x.pricing_mode || "SALE_PRICE").toUpperCase(),
    card_kind: normalizeCardKind(x.card_kind, "CREDIT"),
    supports_installments: !!x.supports_installments,
    min_installments: Number(x.min_installments || 1) || 1,
    max_installments: Number(x.max_installments || 1) || 1,
    default_installments: Number(x.default_installments || 1) || 1,
    installment_plan_json: Array.isArray(x.installment_plan_json) ? x.installment_plan_json : [],
    requires_reference: !!x.requires_reference,
    allows_change: !!x.allows_change,
    is_active: x.is_active !== false,
    only_ecom: !!x.only_ecom,
  };
}

export function methodLabel(method) {
  return method?.display_name || method?.name || "Medio";
}

export function methodIcon(method) {
  const kind = String(method?.kind || "").toUpperCase();
  if (kind === "CASH") return "mdi-cash";
  if (kind === "CARD") return "mdi-credit-card-outline";
  if (kind === "TRANSFER") return "mdi-bank-transfer";
  if (kind === "QR" || kind === "MERCADOPAGO") return "mdi-qrcode";
  if (kind === "CREDIT_SJT") return "mdi-card-account-details-outline";
  return "mdi-wallet-outline";
}

export function methodNeedsReference(method) {
  const kind = String(method?.kind || "").toUpperCase();
  return !!method?.requires_reference || ["TRANSFER", "QR", "MERCADOPAGO"].includes(kind);
}

export function methodNeedsCardKind(method) {
  if (String(method?.kind || "").toUpperCase() !== "CARD") return false;
  return String(method?.card_kind || "CREDIT").toUpperCase() === "BOTH";
}

export function methodSupportsInstallments(method, effectiveCardKind = null) {
  if (!method) return false;
  const kind = String(method.kind || "").toUpperCase();
  if (kind !== "CARD") return !!method.supports_installments;
  const configured = String(method.card_kind || "CREDIT").toUpperCase();
  const effective = String(effectiveCardKind || configured || "CREDIT").toUpperCase();
  if (configured === "DEBIT") return false;
  if (configured === "PREPAID") return false;
  if (configured === "CREDIT") return !!method.supports_installments;
  if (configured === "BOTH") return effective !== "DEBIT";
  return !!method.supports_installments;
}

// Crédito en 1 pago: contado. Crédito en 2 o más cuotas: lista. Débito,
// prepaga y efectivo: contado. pricing_mode LIST_PRICE forzado se respeta.
export function methodUsesListPrice(method, effectiveCardKind = null, installmentsCount = 1) {
  if (!method) return false;
  const kind = String(method.kind || "").toUpperCase();
  const pricingMode = String(method.pricing_mode || "SALE_PRICE").toUpperCase();
  if (kind !== "CARD") return pricingMode === "LIST_PRICE";
  const configured = String(method.card_kind || "CREDIT").toUpperCase();
  const effective = String(effectiveCardKind || configured || "CREDIT").toUpperCase();
  const n = Math.max(1, Number(installmentsCount) || 1);
  if (configured === "DEBIT") return false;
  if (configured === "PREPAID") return false;
  if (configured === "CREDIT") return n > 1;
  if (configured === "BOTH") {
    if (effective === "DEBIT") return false;
    return n > 1;
  }
  return pricingMode === "LIST_PRICE";
}

export function methodUsesCashEntry(method) {
  return String(method?.kind || "").toUpperCase() === "CASH" || !!method?.allows_change;
}

// Cuotas del medio, con el recargo del plan si lo tiene cargado.
export function installmentOptions(method, effectiveCardKind = null) {
  if (!methodSupportsInstallments(method, effectiveCardKind)) return [{ n: 1, recargo: 0 }];
  const plan = (Array.isArray(method?.installment_plan_json) ? method.installment_plan_json : [])
    .map((x) => ({ n: Number(x?.installments || 0), recargo: Number(x?.surcharge_percent || 0) || 0 }))
    .filter((x) => Number.isFinite(x.n) && x.n > 0);
  if (plan.length) {
    const vistos = new Map();
    for (const p of plan) if (!vistos.has(p.n)) vistos.set(p.n, p);
    return [...vistos.values()].sort((a, b) => a.n - b.n);
  }
  const min = Math.max(1, Number(method?.min_installments || 1));
  const max = Math.max(min, Number(method?.max_installments || min));
  return Array.from({ length: max - min + 1 }, (_, i) => ({ n: min + i, recargo: 0 }));
}

export function effectiveCardKind(method, chosen) {
  if (!method) return "CREDIT";
  const configured = String(method.card_kind || "CREDIT").toUpperCase();
  if (configured === "DEBIT" || configured === "PREPAID") return "DEBIT";
  if (configured === "CREDIT") return "CREDIT";
  return normalizeCardKind(chosen, "CREDIT");
}

// Precio unitario del ítem según la venta use lista, contado o revendedor.
export function pickPrice(it, { usesList = false, reseller = false } = {}) {
  const x = it || {};
  const qty = toNum(x.qty ?? x.quantity ?? 0);
  const rs = toNum(x.price_reseller ?? x.reseller_price ?? x.priceReseller ?? x.resellerPrice);
  const list = toNum(x.price_list ?? x.list_price ?? x.priceList ?? x.listPrice);
  const discount = toNum(x.price_discount ?? x.discount_price ?? x.priceDiscount ?? x.discountPrice);
  const base = toNum(x.price ?? x.unit_price ?? x.unitPrice);
  let unit = 0;
  if (reseller && rs > 0) unit = rs;
  else if (usesList && list > 0) unit = list;
  else if (discount > 0) unit = discount;
  else if (list > 0) unit = list;
  else unit = base;
  return { unit, subtotal: unit * qty, qty };
}

// Montos como en la maqueta: "$ 31.900", sin decimales salvo que los haya.
export function pesos(n) {
  const v = Number(n || 0);
  const abs = Math.abs(v).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${v < 0 ? "− " : ""}$ ${abs}`;
}
