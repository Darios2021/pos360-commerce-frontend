// src/modules/shop/service/checkout.api.js
// ✅ COPY-PASTE FINAL COMPLETO (fix export getPublicOrderReceipt)
//
// Endpoints esperados:
// - GET  /shop/public/payment-config
// - GET  /shop/public/branches
// - POST /ecom/checkout
// - GET  /ecom/orders/:id/receipt   ✅ (comprobante)

import httpPublic from "@/app/api/httpPublic";
import { getBranches, getShopPaymentConfig } from "@/modules/shop/service/shop.public.api";

// =========================
// Config / Branches (reusa tu API existente)
// =========================
export async function fetchShopPaymentConfig() {
  return await getShopPaymentConfig();
}

export async function fetchShopBranches() {
  return await getBranches();
}

// =========================
// Checkout submit
// =========================
export async function submitCheckout(payload) {
  return await httpPublic.post("/ecom/checkout", payload);
}

// =========================
// Receipt / comprobante
// =========================
export async function fetchOrderReceipt(orderId) {
  if (!orderId) throw new Error("orderId es obligatorio");
  const { data } = await httpPublic.get(`/ecom/orders/${encodeURIComponent(orderId)}/receipt`);
  return data;
}

// ✅ Alias para compat con tu ShopCheckoutSuccess.vue
export async function getPublicOrderReceipt(orderId) {
  return await fetchOrderReceipt(orderId);
}

// =========================
// Helpers
// =========================
export function extractRedirectUrl(data) {
  return (
    data?.redirect_url ||
    data?.payment?.redirect_url ||
    data?.payment?.init_point ||
    data?.payment?.sandbox_init_point ||
    null
  );
}

export function extractOrderMeta(data) {
  const orderId =
    data?.order_id ??
    data?.order?.id ??
    data?.orderId ??
    data?.id ??
    null;

  const orderCode =
    data?.order_code ??
    data?.order?.code ??
    data?.order?.number ??
    data?.code ??
    data?.number ??
    "";

  const status =
    data?.status ??
    data?.order?.status ??
    data?.payment?.status ??
    "";

  const paymentMethod =
    data?.payment_method ??
    data?.payment?.method ??
    data?.method ??
    "";

  return {
    orderId: orderId ? String(orderId) : "",
    orderCode: String(orderCode || ""),
    status: String(status || ""),
    paymentMethod: String(paymentMethod || ""),
  };
}

export function mapCheckoutErrorToHumanMessage(err) {
  const status = Number(err?.response?.status || err?.status || 0);
  const apiCode = String(err?.response?.data?.code || "").toUpperCase();
  const apiMsg = String(err?.response?.data?.message || "").trim();

  if (status === 409 && apiCode.includes("NO_STOCK")) {
    return apiMsg || "No hay stock suficiente en la sucursal elegida.";
  }
  if (status === 400) return apiMsg || "Datos inválidos. Revisá el formulario.";
  if (status === 401 || status === 403) return "No autorizado. Revisá credenciales/servidor.";
  if (status >= 500) return "Error interno creando el pedido. Probá nuevamente.";
  if (apiMsg) return apiMsg;

  return "No se pudo crear el pedido. Revisá los datos.";
}

export function unwrapOkPayload(data) {
  if (!data) return null;
  if (data?.item) return data.item;
  if (data?.order) return data.order;
  if (data?.receipt) return data.receipt;
  return data;
}
