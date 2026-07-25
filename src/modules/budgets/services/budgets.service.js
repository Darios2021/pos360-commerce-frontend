// src/modules/budgets/services/budgets.service.js
import http from "@/app/api/http";

export const listBudgets = (params = {}) => http.get("/admin/budgets", { params });

// Resumen para las tarjetas del listado. Va sobre todos los presupuestos, no
// sobre la página visible.
export const getBudgetStats = () => http.get("/admin/budgets/stats");

export const getBudget = (id) => http.get(`/admin/budgets/${id}`);

export const createBudget = (data = {}) => http.post("/admin/budgets", data);

export const updateBudget = (id, data) => http.put(`/admin/budgets/${id}`, data);

export const deleteBudget = (id) => http.delete(`/admin/budgets/${id}`);

// Envía el presupuesto al cliente con el PDF adjunto. El PDF lo genera el
// navegador y viaja en base64, así el cliente recibe el mismo documento que se
// descarga desde el sistema.
export const emailBudget = (id, payload) => http.post(`/admin/budgets/${id}/email`, payload);

export const addBudgetItem = (id, data) => http.post(`/admin/budgets/${id}/items`, data);

export const updateBudgetItem = (id, itemId, data) =>
  http.put(`/admin/budgets/${id}/items/${itemId}`, data);

export const deleteBudgetItem = (id, itemId) =>
  http.delete(`/admin/budgets/${id}/items/${itemId}`);

// Duplica un presupuesto reusando los endpoints que ya existen: crea la
// cabecera con los datos del cliente y vuelve a cargar los renglones.
//
// Los renglones se copian con los valores congelados (código, descripción,
// costo, alícuota, margen) y NO con product_id: si el producto cambió de precio
// en el catálogo, la copia tiene que mantener el precio que se le presupuestó
// al cliente. El nuevo presupuesto arranca en "generado" con su propio número y
// vencimiento.
export async function duplicateBudget(id) {
  const { data: src } = await getBudget(id);
  const orig = src?.data || src?.item || {};

  const { data: created } = await createBudget({
    customer_id: orig.customer_id || undefined,
    customer_name: orig.customer_name,
    customer_email: orig.customer_email,
    customer_phone: orig.customer_phone,
    customer_address: orig.customer_address,
    customer_cuit: orig.customer_cuit,
    currency: orig.currency,
    notes: orig.notes,
  });
  const nuevo = created?.data || created?.item || {};

  // En serie a propósito: el orden de los renglones es el del presupuesto
  // original y el backend asigna sort_order por orden de alta.
  for (const it of orig.items || []) {
    await addBudgetItem(nuevo.id, {
      sku: it.sku,
      description: it.description,
      image_url: it.image_url,
      cost: it.cost,
      vat_rate: it.vat_rate,
      margin_pct: it.margin_pct,
      qty: it.qty,
    });
  }

  return nuevo;
}

// Etiquetas de estado compartidas entre el listado y el editor.
export const BUDGET_STATUS = [
  { value: "generado", label: "Generado", color: "success" },
  { value: "en_proceso", label: "En proceso", color: "info" },
  { value: "entregado", label: "Entregado", color: "primary" },
  { value: "vendido", label: "Vendido", color: "teal" },
  { value: "no_venta", label: "No venta", color: "error" },
];

export function statusLabel(v) {
  return BUDGET_STATUS.find((s) => s.value === v)?.label || v || "";
}
export function statusColor(v) {
  return BUDGET_STATUS.find((s) => s.value === v)?.color || "default";
}
