// src/modules/admin/utils/shopSettings.storage.js
const KEY = "pos360_shop_settings_v1";

export function defaultShopSettings() {
  return {
    orders: {
      enabled: true,
      order_prefix: "SJT-",
      reserve_stock_mode: "ON_PAY", // ON_PAY | ON_CREATE_WITH_EXPIRY
      transfer_hold_minutes: 120,
      customer_note: "Te avisamos cuando esté listo para retirar o despachar.",
    },
    shipping: {
      enabled: true,
      mode: "SJ_FLAT_AND_AR_BY_CP",
      sj_enabled: true,
      sj_flat_price: 0,
      sj_eta: "Llega en 24 hs",
      ar_enabled: true,
      ar_note: "Se calcula con código postal (próximamente).",
      free_over_enabled: true,
      free_over_amount: 50000,
    },
    pickup: {
      enabled: true,
      eta: "Listo en 24 hs",
      note: "Retiro gratis. Te avisamos cuando esté listo.",
      whatsapp_template:
        "✅ Pedido {ORDER_ID}\n📍 Retiro en: {BRANCH}\n💰 Total: {TOTAL}\n\nTe avisamos cuando esté listo para retirar.",
    },
    payments: {
      transfer_enabled: true,
      transfer_bank: "",
      transfer_alias: "",
      transfer_cbu: "",
      transfer_holder: "",
      transfer_instructions:
        "Realizá la transferencia y enviá el comprobante. El pedido se confirma al acreditarse.",
      mp_enabled: false,
      mp_public_key: "",
      mp_mode: "REDIRECT", // REDIRECT | PREFERENCE_LINK
      cash_enabled: true,
      cash_note: "Disponible para retiro en sucursal o envío local San Juan.",
    },
    notify: {
      whatsapp_enabled: true,
      whatsapp_number: "",
      whatsapp_template_new_order:
        "🛒 Nuevo pedido {ORDER_ID}\n👤 {NAME}\n📞 {PHONE}\n💰 Total: {TOTAL}\n📦 Entrega: {FULFILLMENT}\n\nIngresá al panel para prepararlo.",
      email_enabled: true,
      email_from: "",
      email_template_new_order:
        "Nuevo pedido {ORDER_ID}\nTotal: {TOTAL}\nEntrega: {FULFILLMENT}\n\nIngresá al panel para gestionarlo.",
    },
  };
}

function safeParse(s) {
  try {
    const o = JSON.parse(s);
    return o && typeof o === "object" ? o : null;
  } catch {
    return null;
  }
}

export function loadShopSettings() {
  const raw = localStorage.getItem(KEY);
  const base = defaultShopSettings();
  const parsed = raw ? safeParse(raw) : null;
  if (!parsed) return base;

  return {
    ...base,
    ...parsed,
    orders: { ...base.orders, ...(parsed.orders || {}) },
    shipping: { ...base.shipping, ...(parsed.shipping || {}) },
    pickup: { ...base.pickup, ...(parsed.pickup || {}) },
    payments: { ...base.payments, ...(parsed.payments || {}) },
    notify: { ...base.notify, ...(parsed.notify || {}) },
  };
}

export function saveShopSettings(settings) {
  localStorage.setItem(KEY, JSON.stringify(settings || defaultShopSettings()));
}
