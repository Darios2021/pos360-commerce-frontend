// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/shop/service/shop.account.public.api.js
//
// Endpoints correctos (backend):
// - GET    public/account/orders?limit&offset
// - GET    public/account/orders/:id
// - GET    public/account/favorites
// - POST   public/account/favorites   { product_id }
// - DELETE public/account/favorites/:product_id
//
// Usa el mismo httpShop (baseURL=/api/v1 + withCredentials)

import httpShop from "@/modules/shop/service/shop.auth.public.api";

export async function getMyOrders({ limit = 50, offset = 0 } = {}) {
  const r = await httpShop.get("public/account/orders", { params: { limit, offset } });
  return r.data;
}

export async function getMyOrderDetail(id) {
  const r = await httpShop.get(`public/account/orders/${Number(id)}`);
  return r.data;
}

export async function getMyFavorites() {
  const r = await httpShop.get("public/account/favorites");
  return r.data;
}

export async function addFavorite(product_id) {
  const r = await httpShop.post("public/account/favorites", { product_id: Number(product_id) });
  return r.data;
}

export async function removeFavorite(product_id) {
  const r = await httpShop.delete(`public/account/favorites/${Number(product_id)}`);
  return r.data;
}
