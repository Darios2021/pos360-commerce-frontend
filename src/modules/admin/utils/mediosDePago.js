// src/modules/admin/utils/mediosDePago.js
// Opciones y rotulos de medios de pago, compartidos por el listado
// (PaymentMethodsAdminPage) y la vista de edicion (PaymentMethodEditPage).

export const KIND_OPTIONS = [
  { title: "Efectivo", value: "CASH" },
  { title: "Tarjeta", value: "CARD" },
  { title: "Transferencia", value: "TRANSFER" },
  { title: "QR / Digital", value: "QR" },
  { title: "Crédito / Financiación", value: "CREDIT_SJT" },
  { title: "Otro", value: "OTHER" },
];

export const CARD_KIND_SIMPLE_OPTIONS = [
  { title: "Crédito", value: "CREDIT" },
  { title: "Débito", value: "DEBIT" },
  { title: "Débito y crédito", value: "BOTH" },
];

export const PRICE_SOURCE_OPTIONS = [
  { title: "Precio contado", value: "SALE_PRICE" },
  { title: "Precio lista", value: "LIST_PRICE" },
];

export const INSTALLMENT_SUGGESTIONS = [1, 3, 6, 9, 12, 18];

export function kindLabel(kind) {
  return KIND_OPTIONS.find((x) => x.value === kind)?.title || kind || "—";
}

export function pricingLabel(item) {
  if (item?.kind === "CARD" && item?.card_kind === "BOTH") return "Débito contado, crédito lista";
  return item?.pricing_mode === "LIST_PRICE" ? "Precio lista" : "Precio contado";
}

export function normalizeInstallmentOptions(values) {
  const nums = (Array.isArray(values) ? values : [])
    .map((v) => parseInt(String(v ?? "").trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  return [...new Set(nums)].sort((a, b) => a - b);
}

export function buildInstallmentPlan(options) {
  return normalizeInstallmentOptions(options).map((n) => ({
    installments: n,
    pricing_mode: "SAME_AS_BASE",
    surcharge_percent: 0,
  }));
}

export function extractInstallmentOptions(item) {
  const raw = Array.isArray(item?.installment_plan_json) ? item.installment_plan_json : [];
  const fromPlan = raw
    .map((x) => parseInt(String(x?.installments ?? ""), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (fromPlan.length) return [...new Set(fromPlan)].sort((a, b) => a - b);

  const min = Number(item?.min_installments);
  const max = Number(item?.max_installments);
  if (Number.isFinite(min) && Number.isFinite(max) && max >= min && min > 0) {
    const out = [];
    for (let i = min; i <= max; i += 1) out.push(i);
    return out;
  }
  return [];
}

export function installmentsSummary(item) {
  if (!item?.supports_installments) return "Sin cuotas";
  const plan = extractInstallmentOptions(item);
  if (plan.length) return plan.join(", ");
  return "Con cuotas";
}
