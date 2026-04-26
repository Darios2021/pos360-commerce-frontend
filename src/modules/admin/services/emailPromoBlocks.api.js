// src/modules/admin/services/emailPromoBlocks.api.js
//
// CRUD de bloques promocionales del CRM email. Cada bloque referencia un
// producto del catálogo (product_id). El sistema arma la pieza visual
// automáticamente: imagen + nombre + precios desde la tabla `products`.
//
// Endpoints (montados bajo /api/v1/admin/email-promo-blocks):
//   GET    /                                listar (hidratados)
//   GET    /?active=1                       listar solo activos
//   GET    /:id                             detalle hidratado
//   POST   /bulk-from-products              crear N en bulk desde productos
//   PUT    /:id                             editar (solo overrides + flags)
//   DELETE /:id                             eliminar

import http from "@/app/api/http";

export async function listPromoBlocks({ activeOnly = false } = {}) {
  const r = await http.get("/admin/email-promo-blocks", {
    params: activeOnly ? { active: 1 } : {},
  });
  return Array.isArray(r.data?.items) ? r.data.items : [];
}

export async function getPromoBlock(id) {
  const r = await http.get(`/admin/email-promo-blocks/${id}`);
  return r.data?.item || null;
}

// Crea N bloques de una vez a partir de una selección de productos.
// payload = { product_ids: [..], badge_text?, installments_text?, cta_label? }
export async function createPromoBlocksFromProducts(payload) {
  const r = await http.post("/admin/email-promo-blocks/bulk-from-products", payload);
  return r.data || null;
}

export async function updatePromoBlock(id, payload) {
  const r = await http.put(`/admin/email-promo-blocks/${id}`, payload);
  return r.data?.item || null;
}

export async function deletePromoBlock(id) {
  const r = await http.delete(`/admin/email-promo-blocks/${id}`);
  return r.data || null;
}
