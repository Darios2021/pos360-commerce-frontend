// ✅ COPY-PASTE FINAL COMPLETO
// src/app/services/paymentMethod.service.js

import http from "@/app/api/http";

/* =========================================================
   Utils
========================================================= */
function toInt(v, def = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
}

function toNum(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function parseBool(v, def = false) {
  if (v === undefined || v === null) return def;
  if (typeof v === "boolean") return v;

  const s = String(v).trim().toLowerCase();
  if (!s) return def;

  if (["1", "true", "t", "yes", "y", "on"].includes(s)) return true;
  if (["0", "false", "f", "no", "n", "off"].includes(s)) return false;

  return def;
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function safeObj(v) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}

function pickRows(res) {
  return res?.data?.data || res?.data?.rows || res?.data?.items || [];
}

function pickOne(res) {
  return res?.data?.data || res?.data?.item || null;
}

function cleanStr(v, maxLen = null) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  return maxLen ? s.slice(0, maxLen) : s;
}

function cleanCode(v) {
  const s = String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return s || null;
}

function normalizeDate(v) {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;

  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function ensureJsonObject(v, def = null) {
  if (v === undefined) return def;
  if (v === null || v === "") return null;

  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : def;
    } catch {
      return def;
    }
  }

  return v && typeof v === "object" && !Array.isArray(v) ? v : def;
}

function ensureJsonArray(v, def = null) {
  if (v === undefined) return def;
  if (v === null || v === "") return null;

  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : def;
    } catch {
      return def;
    }
  }

  return Array.isArray(v) ? v : def;
}

/* =========================================================
   Helpers POS (FIX)
========================================================= */
function resolvePosMethod(kind, providerCode) {
  const k = String(kind || "").trim().toUpperCase();
  const p = String(providerCode || "").trim().toLowerCase();

  if (k === "CASH") return "CASH";
  if (k === "TRANSFER") return "TRANSFER";
  if (k === "CARD") return "CARD";
  if (k === "QR") return "QR";
  if (k === "MERCADOPAGO") return "MERCADOPAGO";

  // Compatibilidad con tu backend actual
  if (k === "CREDIT_SJT") return "OTHER";

  if (p === "cash") return "CASH";
  if (p === "transfer") return "TRANSFER";
  if (p === "card" || p === "debit") return "CARD";
  if (p === "qr") return "QR";
  if (p === "mercadopago" || p === "mercado_pago" || p === "mp") return "MERCADOPAGO";
  if (p === "credit_sjt") return "OTHER";

  return "OTHER";
}

/* =========================================================
   Options
========================================================= */
export const PAYMENT_METHOD_KIND_OPTIONS = [
  { title: "Efectivo", value: "CASH" },
  { title: "Transferencia", value: "TRANSFER" },
  { title: "Tarjeta", value: "CARD" },
  { title: "QR", value: "QR" },
  { title: "Mercado Pago", value: "MERCADOPAGO" },
  { title: "Crédito interno", value: "CREDIT_SJT" },
  { title: "Otro", value: "OTHER" },
];

export const PAYMENT_METHOD_CARD_KIND_OPTIONS = [
  { title: "Crédito", value: "CREDIT" },
  { title: "Débito", value: "DEBIT" },
  { title: "Prepaga", value: "PREPAID" },
  { title: "Ambas", value: "BOTH" },
];

export const PAYMENT_METHOD_REGISTER_GROUP_OPTIONS = [
  { title: "Caja", value: "CASH" },
  { title: "Banco", value: "BANK" },
  { title: "Tarjetas", value: "CARD" },
  { title: "Digital", value: "DIGITAL" },
  { title: "Crédito interno", value: "INTERNAL_CREDIT" },
  { title: "Otro", value: "OTHER" },
];

export const PAYMENT_METHOD_PRICING_MODE_OPTIONS = [
  { title: "Precio de venta", value: "SALE_PRICE" },
  { title: "Precio de lista", value: "LIST_PRICE" },
  { title: "Recargo %", value: "SURCHARGE_PERCENT" },
  { title: "Precio fijo", value: "FIXED_PRICE" },
];

export const PAYMENT_METHOD_ROUNDING_MODE_OPTIONS = [
  { title: "Sin redondeo", value: "NONE" },
  { title: "Al más cercano", value: "NEAREST" },
  { title: "Hacia arriba", value: "UP" },
  { title: "Hacia abajo", value: "DOWN" },
];

export const PAYMENT_METHOD_INSTALLMENT_PRICING_MODE_OPTIONS = [
  { title: "Igual a base", value: "SAME_AS_BASE" },
  { title: "Precio de venta", value: "SALE_PRICE" },
  { title: "Precio de lista", value: "LIST_PRICE" },
  { title: "Recargo %", value: "SURCHARGE_PERCENT" },
  { title: "Plan por cuotas", value: "PLAN" },
];

/* =========================================================
   Default form
========================================================= */
export function createPaymentMethodForm(overrides = {}) {
  return {
    id: null,
    branch_id: null,

    code: "",
    name: "",
    display_name: "",
    description: "",

    kind: "OTHER",
    provider_code: "",
    card_brand: "",
    card_kind: null,

    is_active: true,
    is_default: false,
    is_system: false,
    is_featured: false,
    sort_order: 100,

    allow_mixed: true,
    only_pos: false,
    only_ecom: false,
    only_backoffice: false,

    allows_change: false,
    change_limit_amount: null,
    counts_as_cash_in_register: false,
    impacts_cash_register: false,
    register_group: "OTHER",
    settlement_delay_days: 0,
    auto_reconcile: false,

    pricing_mode: "SALE_PRICE",
    surcharge_percent: 0,
    surcharge_fixed_amount: 0,
    fixed_price_value: null,

    rounding_mode: "NONE",
    rounding_value: null,

    supports_installments: false,
    min_installments: 1,
    max_installments: 1,
    default_installments: 1,
    installment_pricing_mode: "SAME_AS_BASE",
    installment_surcharge_percent: 0,
    installment_plan_json: [],

    requires_reference: false,
    requires_auth_code: false,
    requires_last4: false,
    requires_card_holder: false,
    requires_bank_name: false,
    requires_customer_doc: false,
    requires_customer_phone: false,

    min_amount: null,
    max_amount: null,
    valid_from: null,
    valid_to: null,

    input_schema_json: { fields: [] },
    meta: {},

    ...safeObj(overrides),
  };
}

/* =========================================================
   Normalizers
========================================================= */
export function normalizePaymentMethod(row = {}) {
  const x = safeObj(row);

  return {
    id: toInt(x.id, 0) || null,
    branch_id: toInt(x.branch_id, 0) || null,

    code: cleanCode(x.code) || "",
    name: cleanStr(x.name, 140) || "",
    display_name: cleanStr(x.display_name, 180) || "",
    description: cleanStr(x.description, 255) || "",

    kind: cleanStr(x.kind, 40)?.toUpperCase() || "OTHER",
    provider_code: cleanStr(x.provider_code, 80) || "",
    card_brand: cleanStr(x.card_brand, 60) || "",
    card_kind: cleanStr(x.card_kind, 20)?.toUpperCase() || null,

    is_active: parseBool(x.is_active, false),
    is_default: parseBool(x.is_default, false),
    is_system: parseBool(x.is_system, false),
    is_featured: parseBool(x.is_featured, false),
    sort_order: toInt(x.sort_order, 100),

    allow_mixed: parseBool(x.allow_mixed, true),
    only_pos: parseBool(x.only_pos, false),
    only_ecom: parseBool(x.only_ecom, false),
    only_backoffice: parseBool(x.only_backoffice, false),

    allows_change: parseBool(x.allows_change, false),
    change_limit_amount: x.change_limit_amount == null ? null : toNum(x.change_limit_amount, 0),
    counts_as_cash_in_register: parseBool(x.counts_as_cash_in_register, false),
    impacts_cash_register: parseBool(x.impacts_cash_register, false),
    register_group: cleanStr(x.register_group, 40)?.toUpperCase() || "OTHER",
    settlement_delay_days: toInt(x.settlement_delay_days, 0),
    auto_reconcile: parseBool(x.auto_reconcile, false),

    pricing_mode: cleanStr(x.pricing_mode, 40)?.toUpperCase() || "SALE_PRICE",
    surcharge_percent: toNum(x.surcharge_percent, 0),
    surcharge_fixed_amount: toNum(x.surcharge_fixed_amount, 0),
    fixed_price_value: x.fixed_price_value == null ? null : toNum(x.fixed_price_value, 0),

    rounding_mode: cleanStr(x.rounding_mode, 20)?.toUpperCase() || "NONE",
    rounding_value: x.rounding_value == null ? null : toNum(x.rounding_value, 0),

    supports_installments: parseBool(x.supports_installments, false),
    min_installments: Math.max(1, toInt(x.min_installments, 1)),
    max_installments: Math.max(1, toInt(x.max_installments, 1)),
    default_installments: Math.max(1, toInt(x.default_installments, 1)),
    installment_pricing_mode: cleanStr(x.installment_pricing_mode, 40)?.toUpperCase() || "SAME_AS_BASE",
    installment_surcharge_percent: toNum(x.installment_surcharge_percent, 0),
    installment_plan_json: ensureJsonArray(x.installment_plan_json, []) || [],

    requires_reference: parseBool(x.requires_reference, false),
    requires_auth_code: parseBool(x.requires_auth_code, false),
    requires_last4: parseBool(x.requires_last4, false),
    requires_card_holder: parseBool(x.requires_card_holder, false),
    requires_bank_name: parseBool(x.requires_bank_name, false),
    requires_customer_doc: parseBool(x.requires_customer_doc, false),
    requires_customer_phone: parseBool(x.requires_customer_phone, false),

    min_amount: x.min_amount == null ? null : toNum(x.min_amount, 0),
    max_amount: x.max_amount == null ? null : toNum(x.max_amount, 0),
    valid_from: x.valid_from || null,
    valid_to: x.valid_to || null,

    input_schema_json: ensureJsonObject(x.input_schema_json, { fields: [] }) || { fields: [] },
    meta: ensureJsonObject(x.meta, {}) || {},

    created_at: x.created_at || null,
    updated_at: x.updated_at || null,
  };
}

export function normalizePaymentMethodList(rows) {
  return safeArray(rows).map(normalizePaymentMethod);
}

/* =========================================================
   Payload builder
========================================================= */
export function buildPaymentMethodPayload(form = {}) {
  const x = normalizePaymentMethod(form);

  return {
    branch_id: x.branch_id || null,

    code: cleanCode(x.code),
    name: cleanStr(x.name, 140),
    display_name: cleanStr(x.display_name, 180),
    description: cleanStr(x.description, 255),

    kind: cleanStr(x.kind, 40)?.toUpperCase() || "OTHER",
    provider_code: cleanStr(x.provider_code, 80)?.toLowerCase() || null,
    card_brand: cleanStr(x.card_brand, 60)?.toUpperCase() || null,
    card_kind: cleanStr(x.card_kind, 20)?.toUpperCase() || null,

    is_active: !!x.is_active,
    is_default: !!x.is_default,
    is_system: !!x.is_system,
    is_featured: !!x.is_featured,
    sort_order: toInt(x.sort_order, 100),

    allow_mixed: !!x.allow_mixed,
    only_pos: !!x.only_pos,
    only_ecom: !!x.only_ecom,
    only_backoffice: !!x.only_backoffice,

    allows_change: !!x.allows_change,
    change_limit_amount: x.change_limit_amount == null ? null : toNum(x.change_limit_amount, 0),
    counts_as_cash_in_register: !!x.counts_as_cash_in_register,
    impacts_cash_register: !!x.impacts_cash_register,
    register_group: cleanStr(x.register_group, 40)?.toUpperCase() || "OTHER",
    settlement_delay_days: toInt(x.settlement_delay_days, 0),
    auto_reconcile: !!x.auto_reconcile,

    pricing_mode: cleanStr(x.pricing_mode, 40)?.toUpperCase() || "SALE_PRICE",
    surcharge_percent: toNum(x.surcharge_percent, 0),
    surcharge_fixed_amount: toNum(x.surcharge_fixed_amount, 0),
    fixed_price_value: x.fixed_price_value == null ? null : toNum(x.fixed_price_value, 0),

    rounding_mode: cleanStr(x.rounding_mode, 20)?.toUpperCase() || "NONE",
    rounding_value: x.rounding_value == null ? null : toNum(x.rounding_value, 0),

    supports_installments: !!x.supports_installments,
    min_installments: Math.max(1, toInt(x.min_installments, 1)),
    max_installments: Math.max(1, toInt(x.max_installments, 1)),
    default_installments: Math.max(1, toInt(x.default_installments, 1)),
    installment_pricing_mode: cleanStr(x.installment_pricing_mode, 40)?.toUpperCase() || "SAME_AS_BASE",
    installment_surcharge_percent: toNum(x.installment_surcharge_percent, 0),
    installment_plan_json: ensureJsonArray(x.installment_plan_json, []) || [],

    requires_reference: !!x.requires_reference,
    requires_auth_code: !!x.requires_auth_code,
    requires_last4: !!x.requires_last4,
    requires_card_holder: !!x.requires_card_holder,
    requires_bank_name: !!x.requires_bank_name,
    requires_customer_doc: !!x.requires_customer_doc,
    requires_customer_phone: !!x.requires_customer_phone,

    min_amount: x.min_amount == null ? null : toNum(x.min_amount, 0),
    max_amount: x.max_amount == null ? null : toNum(x.max_amount, 0),
    valid_from: normalizeDate(x.valid_from),
    valid_to: normalizeDate(x.valid_to),

    input_schema_json: ensureJsonObject(x.input_schema_json, { fields: [] }) || { fields: [] },
    meta: ensureJsonObject(x.meta, {}) || {},
  };
}

/* =========================================================
   Validation
========================================================= */
export function validatePaymentMethodForm(form = {}) {
  const x = buildPaymentMethodPayload(form);
  const errors = {};

  if (!x.code) errors.code = "Código requerido";
  if (!x.name) errors.name = "Nombre requerido";

  if (x.kind === "CARD" && !x.card_kind) {
    errors.card_kind = "Tipo de tarjeta requerido";
  }

  if (x.pricing_mode === "FIXED_PRICE" && !(toNum(x.fixed_price_value, 0) > 0)) {
    errors.fixed_price_value = "Requerido para precio fijo";
  }

  if (x.supports_installments) {
    if (x.min_installments < 1) errors.min_installments = "Mínimo inválido";
    if (x.max_installments < x.min_installments) errors.max_installments = "Máximo inválido";
    if (x.default_installments < x.min_installments || x.default_installments > x.max_installments) {
      errors.default_installments = "Default fuera de rango";
    }
    if (x.installment_pricing_mode === "PLAN" && !safeArray(x.installment_plan_json).length) {
      errors.installment_plan_json = "El plan de cuotas es requerido";
    }
  }

  if (x.min_amount != null && x.max_amount != null && x.max_amount < x.min_amount) {
    errors.max_amount = "No puede ser menor que el mínimo";
  }

  if (x.valid_from && x.valid_to) {
    const d1 = new Date(x.valid_from).getTime();
    const d2 = new Date(x.valid_to).getTime();
    if (Number.isFinite(d1) && Number.isFinite(d2) && d2 < d1) {
      errors.valid_to = "No puede ser anterior a la fecha desde";
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    payload: x,
  };
}

/* =========================================================
   API - POS / PUBLIC
========================================================= */
export async function fetchPosPaymentMethods(params = {}) {
  const query = {};
  if (params.branch_id || params.branchId) {
    query.branch_id = toInt(params.branch_id ?? params.branchId, 0) || undefined;
  }

  const res = await http.get("/pos/payment-methods", { params: query });
  return normalizePaymentMethodList(pickRows(res));
}

export async function fetchPublicPaymentMethods(params = {}) {
  const query = {};
  if (params.branch_id || params.branchId) {
    query.branch_id = toInt(params.branch_id ?? params.branchId, 0) || undefined;
  }

  const res = await http.get("/public/payment-methods", { params: query });
  return normalizePaymentMethodList(pickRows(res));
}

/* =========================================================
   API - ADMIN
========================================================= */
export async function fetchAdminPaymentMethods(params = {}) {
  const query = {};

  if (params.branch_id || params.branchId) {
    query.branch_id = toInt(params.branch_id ?? params.branchId, 0) || undefined;
  }
  if (params.active_only !== undefined || params.activeOnly !== undefined) {
    query.active_only = parseBool(params.active_only ?? params.activeOnly, false);
  }
  if (params.q) {
    query.q = String(params.q).trim();
  }

  const res = await http.get("/admin/payment-methods", { params: query });
  return normalizePaymentMethodList(pickRows(res));
}

export async function fetchAdminPaymentMethodById(id) {
  const methodId = toInt(id, 0);
  if (!methodId) throw new Error("ID inválido");

  const res = await http.get(`/admin/payment-methods/${methodId}`);
  return normalizePaymentMethod(pickOne(res));
}

export async function createAdminPaymentMethod(form) {
  const check = validatePaymentMethodForm(form);
  if (!check.ok) {
    const err = new Error("Formulario inválido");
    err.validation = check.errors;
    throw err;
  }

  const res = await http.post("/admin/payment-methods", check.payload);
  return normalizePaymentMethod(pickOne(res));
}

export async function updateAdminPaymentMethod(id, form) {
  const methodId = toInt(id, 0);
  if (!methodId) throw new Error("ID inválido");

  const check = validatePaymentMethodForm(form);
  if (!check.ok) {
    const err = new Error("Formulario inválido");
    err.validation = check.errors;
    throw err;
  }

  const res = await http.put(`/admin/payment-methods/${methodId}`, check.payload);
  return normalizePaymentMethod(pickOne(res));
}

export async function toggleAdminPaymentMethodActive(id) {
  const methodId = toInt(id, 0);
  if (!methodId) throw new Error("ID inválido");

  const res = await http.patch(`/admin/payment-methods/${methodId}/toggle-active`);
  return normalizePaymentMethod(pickOne(res));
}

export async function deleteAdminPaymentMethod(id) {
  const methodId = toInt(id, 0);
  if (!methodId) throw new Error("ID inválido");

  const res = await http.delete(`/admin/payment-methods/${methodId}`);
  return res?.data || { ok: true };
}

/* =========================================================
   POS helpers
========================================================= */
export function getPaymentMethodLabel(method) {
  const x = normalizePaymentMethod(method);
  return x.display_name || x.name || x.code || "Medio de pago";
}

export function isPaymentMethodVisibleInPos(method) {
  const x = normalizePaymentMethod(method);
  return x.is_active && !x.only_ecom;
}

export function getPaymentMethodInstallmentOptions(method) {
  const x = normalizePaymentMethod(method);

  if (!x.supports_installments) {
    return [{ title: "1 cuota", value: 1 }];
  }

  const min = Math.max(1, toInt(x.min_installments, 1));
  const max = Math.max(min, toInt(x.max_installments, min));

  const out = [];
  for (let i = min; i <= max; i += 1) {
    out.push({
      title: i === 1 ? "1 cuota" : `${i} cuotas`,
      value: i,
    });
  }

  return out;
}

export function resolvePaymentMethodDefaults(method) {
  const x = normalizePaymentMethod(method);

  return {
    payment_method_id: x.id,
    method: resolvePosMethod(x.kind, x.provider_code),
    label: getPaymentMethodLabel(x),
    amount: 0,
    installments: x.supports_installments ? x.default_installments : 1,
    reference: "",
    note: "",
    card_kind: x.card_kind || null,
    card_brand: x.card_brand || null,
    requires_reference: !!x.requires_reference,
    requires_auth_code: !!x.requires_auth_code,
    requires_last4: !!x.requires_last4,
    requires_card_holder: !!x.requires_card_holder,
    requires_bank_name: !!x.requires_bank_name,
    requires_customer_doc: !!x.requires_customer_doc,
    requires_customer_phone: !!x.requires_customer_phone,
  };
}

export function buildPosSalePayment(method, extra = {}) {
  const base = resolvePaymentMethodDefaults(method);
  return {
    ...base,
    ...safeObj(extra),
    payment_method_id: base.payment_method_id,
    method: extra.method || base.method,
    installments:
      extra.installments !== undefined && extra.installments !== null
        ? toInt(extra.installments, base.installments)
        : base.installments,
    amount:
      extra.amount !== undefined && extra.amount !== null
        ? toNum(extra.amount, 0)
        : 0,
  };
}