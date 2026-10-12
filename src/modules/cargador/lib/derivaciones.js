// src/modules/cargador/lib/derivaciones.js
// Lo común de las pantallas de derivación del teléfono.
import http from "@/app/api/http";
import { getTransfer } from "@/modules/dashboard/service/stockTransfer.api";
import { num } from "./formato";

export const ESTADOS = {
  draft: { t: "Borrador", c: "oc" },
  dispatched: { t: "En camino", c: "az" },
  received: { t: "Recibida", c: "ok" },
  partial: { t: "Recibida con diferencias", c: "oc" },
  rejected: { t: "Rechazada", c: "gr" },
  cancelled: { t: "Cancelada", c: "gr" },
};

export const unidadesEnviadas = (t) => (t?.items || []).reduce((a, it) => a + num(it.qty_sent), 0);
export const origenDe = (t) => t?.fromWarehouse?.branch?.name || t?.fromWarehouse?.name || "";
export const destinoDe = (t) => t?.toWarehouse?.branch?.name || t?.toBranch?.name || t?.toWarehouse?.name || "";
export const esParaMi = (t, auth) => Number(t?.to_branch_id) === Number(auth?.branchId || 0);
export const porRecibir = (t, auth) => t?.status === "dispatched" && esParaMi(t, auth);

export async function traerDerivacion(id) {
  const { data } = await getTransfer(id);
  return data?.transfer || data?.data || null;
}

// Crear y editar con el origen elegido: la API toma el depósito de la
// sucursal activa (X-Branch-Id), no el from_warehouse_id del cuerpo.
const conOrigen = (branchId) => (branchId ? { headers: { "X-Branch-Id": String(branchId) } } : {});

export async function guardarDerivacion({ id, origenBranchId, origenWarehouseId, destinoBranchId, nota, lineas }) {
  const items = lineas.map((l) => ({ product_id: l.product_id, qty_sent: l.qty }));
  if (id) {
    const { data } = await http.put(`stock/transfers/${id}`, { items, note: nota || null });
    return data?.transfer;
  }
  const { data } = await http.post(
    "stock/transfers",
    { from_warehouse_id: origenWarehouseId, to_branch_id: destinoBranchId, note: nota || null, items },
    conOrigen(origenBranchId)
  );
  return data?.transfer;
}

export async function despacharDerivacion(id) {
  const { data } = await http.post(`stock/transfers/${id}/dispatch`);
  return data?.transfer;
}

/** 'Stock insuficiente para "X": disponible 2, requerido 3' -> { nombre, disponible } */
export function faltaDeStock(msg) {
  const m = /para "(.+)": disponible ([\d.,]+)/.exec(String(msg || ""));
  return m ? { nombre: m[1], disponible: num(m[2]) } : null;
}
