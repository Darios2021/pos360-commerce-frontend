// src/modules/admin/utils/shopOrdersUi.js
// ✅ COPY-PASTE FINAL — helpers UI Shop Orders (Admin)

function s(v) {
  return String(v ?? "").trim();
}
function norm(v) {
  return s(v).toLowerCase();
}
function pick(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && s(v) !== "") return v;
  }
  return null;
}

export function fmtMoney(v) {
  const n = Number(v || 0);
  try {
    return new Intl.NumberFormat("es-AR").format(Math.round(n));
  } catch {
    return String(Math.round(n));
  }
}

export function fmtQty(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return "0";
  if (Math.abs(n - Math.round(n)) < 0.0001) return String(Math.round(n));
  return n.toFixed(3);
}

export function fmtDate(v, withTime = false) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return withTime ? d.toLocaleString("es-AR") : d.toLocaleDateString("es-AR");
}

export function fullName(o) {
  const fn = s(o?.first_name || o?.firstname || o?.name || "");
  const ln = s(o?.last_name || o?.lastname || o?.surname || "");
  const out = `${fn} ${ln}`.trim();
  return out || null;
}

// --- fulfillment ---
export function fulfillmentLabel(v) {
  const x = norm(v);
  if (x === "delivery") return "Envío a domicilio";
  if (x === "pickup") return "Retiro en sucursal";
  return v || "—";
}
export function fulfillmentColor(v) {
  const x = norm(v);
  if (x === "delivery") return "deep-purple";
  if (x === "pickup") return "teal";
  return "grey";
}
export function shortShipLine(o) {
  const a1 = s(o?.ship_address1 || "");
  const city = s(o?.ship_city || "");
  const prov = s(o?.ship_province || "");
  const parts = [];
  if (a1) parts.push(a1);
  if (city) parts.push(city);
  if (prov) parts.push(prov);
  return parts.length ? parts.join(" · ") : "Dirección no informada";
}

// --- order status ---
export function orderStatusLabel(s0) {
  const v = norm(s0);
  if (v === "created" || v === "pending") return "Creado";
  if (v === "confirmed") return "Confirmado";
  if (v === "preparing") return "Preparando";
  if (v === "ready_pickup") return "Listo para retirar";
  if (v === "shipped") return "Enviado";
  if (v === "delivered") return "Entregado";
  if (v === "cancelled") return "Cancelado";
  return s0 || "—";
}
export function statusColor(s0) {
  const v = norm(s0);
  if (v === "created" || v === "pending") return "grey";
  if (v === "confirmed") return "blue";
  if (v === "preparing") return "amber";
  if (v === "ready_pickup") return "teal";
  if (v === "shipped") return "deep-purple";
  if (v === "delivered") return "green";
  if (v === "cancelled") return "red";
  return "grey";
}

// --- order pay ---
export function orderPayLabel(s0) {
  const v = norm(s0);
  if (v === "paid") return "Pagado";
  if (v === "pending") return "Pendiente";
  if (v === "unpaid") return "No pagado";
  return s0 || "—";
}
export function orderPayColor(s0) {
  const v = norm(s0);
  if (v === "paid") return "green";
  if (v === "pending") return "amber";
  if (v === "unpaid") return "grey";
  return "grey";
}

// ✅ export que te faltaba
export function isOrderPaid(orderRow) {
  const ps = norm(orderRow?.payment_status || orderRow?.order_payment_status || "");
  if (ps === "paid") return true;

  const prov = norm(orderRow?.payment_provider || orderRow?.provider || "");
  const st = norm(orderRow?.payment_status || orderRow?.external_status || "");

  if (prov === "mercadopago" || prov === "mp") {
    return ["approved", "paid", "accredited", "success"].includes(st);
  }
  return false;
}

// --- payment status (fila pago) ---
export function paymentStatusLabel(s0) {
  const v = norm(s0);
  if (["approved", "paid", "accredited", "success"].includes(v)) return "Pagado";
  if (["pending", "in_process", "inprocess", "created"].includes(v))
    return v === "created" ? "Creado" : "Pendiente";
  if (["rejected", "cancelled", "canceled", "failed"].includes(v)) return "Rechazado";
  if (["refunded"].includes(v)) return "Reintegrado";
  return s0 || "—";
}
export function paymentStatusColor(s0) {
  const v = norm(s0);
  if (["approved", "paid", "accredited", "success"].includes(v)) return "green";
  if (["pending", "in_process", "inprocess"].includes(v)) return "amber";
  if (["created"].includes(v)) return "grey";
  if (["rejected", "cancelled", "canceled", "failed"].includes(v)) return "red";
  if (["refunded"].includes(v)) return "blue";
  return "grey";
}

// --- provider fallback ---
export function providerFallbackLabel(p) {
  const v = norm(p);
  if (v === "mercadopago" || v === "mp") return "Mercado Pago";
  if (v === "transfer" || v === "transferencia") return "Transferencia";
  if (v === "cash" || v === "efectivo") return "Efectivo";
  if (v === "seller") return "Acordar con vendedor";
  if (v === "credit_sjt") return "Crédito San Juan Tecnología";
  if (v === "other" || v === "otro") return "Otro";
  return p || "—";
}

export function paymentSummaryLine(item) {
  const prov = providerFallbackLabel(item.payment_provider || item.provider);
  const st = paymentStatusLabel(item.payment_status || item.order_payment_status);
  return `Pago: ${prov} · ${st}`;
}

// ===== payment “bonito” (join ecom_payment_methods) =====
function pickAny(p, keys) {
  return pick(p, keys);
}

export function paymentMethodTitle(p) {
  const t = pickAny(p, ["method_title", "payment_method_title", "pm_title", "title"]);
  if (t) return String(t);
  return providerFallbackLabel(p?.provider);
}
export function paymentMethodDesc(p) {
  const d = pickAny(p, ["method_description", "payment_method_description", "pm_description", "description"]);
  return d ? String(d) : null;
}
export function paymentMethodBadgeText(p) {
  const t = pickAny(p, ["method_badge_text", "payment_method_badge_text", "pm_badge_text", "badge_text"]);
  return t ? String(t) : null;
}
export function paymentMethodBadgeVariant(p) {
  const v = pickAny(p, ["method_badge_variant", "payment_method_badge_variant", "pm_badge_variant", "badge_variant"]);
  return v ? String(v) : null;
}
export function badgeColor(variant) {
  const v = norm(variant);
  if (v === "primary") return "primary";
  if (v === "info") return "info";
  if (v === "warning") return "warning";
  if (v === "success") return "success";
  return "grey";
}
export function paymentMethodIcon(p) {
  const ic = pickAny(p, ["method_icon", "payment_method_icon", "pm_icon", "icon"]);
  return ic ? String(ic) : null;
}

function flagFromPayment(p, key) {
  const v = pickAny(p, [key, `method_${key}`, `payment_method_${key}`, `pm_${key}`]);
  if (v === null) return null;
  const n = Number(v);
  if (Number.isFinite(n)) return n === 1;
  return Boolean(v);
}

export function canCreateMpLink(p) {
  const prov = norm(p?.provider || "");
  const rr = flagFromPayment(p, "requires_redirect");
  if (rr === true) return true;
  return prov === "mercadopago" || prov === "mp";
}
export function canUploadProof(p) {
  const prov = norm(p?.provider || "");
  const ap = flagFromPayment(p, "allows_proof_upload");
  if (ap === true) return true;
  return prov === "transfer" || prov === "transferencia";
}
export function canReviewTransfer(p) {
  return canUploadProof(p);
}

function parsePayload(p) {
  const raw = p?.external_payload;
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(String(raw));
  } catch {
    return null;
  }
}

export function mpInitPointFromPayment(p) {
  const direct = pickAny(p, ["mp_init_point", "init_point"]);
  if (direct) return String(direct);
  const pl = parsePayload(p);
  return pl?.mp_preference?.init_point || pl?.mp?.init_point || null;
}

export function proofUrlFromPayment(p) {
  if (p?.proof_url) return p.proof_url;
  const pl = parsePayload(p);
  return pl?.transfer_proof?.proof_url || pl?.transfer_proof?.url || null;
}
