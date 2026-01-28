// src/modules/shop/service/checkout.api.js
// ✅ COPY-PASTE FINAL
//
// Este service centraliza todo lo del checkout.
// Usa httpPublic (como ya venís usando en shop).
//
// Endpoints esperados:
// - GET  /shop/public/payment-config            (o el que ya tengas en getShopPaymentConfig)
// - GET  /shop/public/branches                  (o el que ya tengas en getBranches)
// - POST /ecom/checkout                         (ya lo tenés)

import httpPublic from "@/app/api/httpPublic";
import { getBranches, getShopPaymentConfig } from "@/modules/shop/service/shop.public.api";

// ---------- Config / Branches (reusa tu API existente)
export async function fetchShopPaymentConfig() {
  // Usa tu función existente (si internamente pega a /shop/public/payment-config)
  return await getShopPaymentConfig();
}

export async function fetchShopBranches() {
  // Usa tu función existente
  return await getBranches();
}

// ---------- Checkout submit
export async function submitCheckout(payload) {
  // payload: lo que armás desde el frontend (items qty, contact, shipping, payment)
  return await httpPublic.post("/ecom/checkout", payload);
}

// ---------- Helpers
export function extractRedirectUrl(data) {
  return (
    data?.redirect_url ||
    data?.payment?.redirect_url ||
    data?.payment?.init_point ||
    data?.payment?.sandbox_init_point ||
    null
  );
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
