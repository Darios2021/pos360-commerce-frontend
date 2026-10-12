// src/modules/cargador/lib/depositos.js
// Depósitos (orígenes de derivación y conteo) y sucursales (destinos), con
// una sola carga por sesión.
import { ref } from "vue";
import http from "@/app/api/http";
import { listBranchesApi } from "@/modules/dashboard/service/stockTransfer.api";

const depositos = ref([]);
const sucursales = ref([]);
let cargaDep = null;
let cargaSuc = null;

const filasDe = (data) => (Array.isArray(data) ? data : data?.items || data?.data || data?.rows || []);

export function cargarDepositos() {
  if (!cargaDep) {
    cargaDep = http.get("/warehouses")
      .then(({ data }) => {
        depositos.value = filasDe(data)
          .filter((w) => w && w.id && w.is_active !== false && w.is_active !== 0)
          .sort((a, b) => Number(a.id) - Number(b.id));
      })
      .catch(() => { depositos.value = []; cargaDep = null; });
  }
  return cargaDep.then(() => depositos.value);
}

export function cargarSucursales() {
  if (!cargaSuc) {
    cargaSuc = listBranchesApi()
      .then(({ data }) => {
        sucursales.value = filasDe(data).filter((b) => b && b.id && b.is_active !== false && b.is_active !== 0);
      })
      .catch(() => { sucursales.value = []; cargaSuc = null; });
  }
  return cargaSuc.then(() => sucursales.value);
}

/** "Centro · Depósito principal" */
export function rotuloDeposito(w) {
  const suc = w?.branch?.name || "";
  const dep = w?.name || "";
  return suc && dep && suc !== dep ? `${suc} · ${dep}` : suc || dep || `Depósito ${w?.id || ""}`;
}

/** El primer depósito activo de la sucursal del usuario (el que usa la API). */
export function depositoPropio(lista, branchId) {
  const bid = Number(branchId || 0);
  return lista.find((w) => Number(w.branch_id) === bid) || lista[0] || null;
}

export { depositos, sucursales };
