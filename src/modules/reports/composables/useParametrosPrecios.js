// src/modules/reports/composables/useParametrosPrecios.js
//
// Parámetros de precios del negocio (Sistema › Parámetros de precios),
// guardados en el servidor (shop_settings, clave "precios") para que valgan
// para todos. Los usa el reporte de ganancia y, más adelante, el alta.
import { reactive } from "vue";
import http from "@/app/api/http";

export const PARAMETROS_POR_DEFECTO = { iibb: 3.5, recargo: 11, franquicia: 60 };

const estado = reactive({ ...PARAMETROS_POR_DEFECTO, cargado: false });

function normalizar(v = {}) {
  const n = (x, d) => (Number.isFinite(Number(x)) && x !== "" && x !== null ? Number(x) : d);
  return {
    iibb: n(v.iibb, PARAMETROS_POR_DEFECTO.iibb),
    recargo: n(v.recargo, PARAMETROS_POR_DEFECTO.recargo),
    franquicia: Math.min(100, Math.max(0, n(v.franquicia, PARAMETROS_POR_DEFECTO.franquicia))),
  };
}

export function useParametrosPrecios() {
  async function cargar() {
    try {
      const { data } = await http.get("/admin/shop/settings/precios");
      Object.assign(estado, normalizar(data?.item?.value || {}));
    } catch {
      Object.assign(estado, PARAMETROS_POR_DEFECTO);
    } finally {
      estado.cargado = true;
    }
  }
  async function guardar(valores) {
    const limpio = normalizar(valores);
    await http.put("/admin/shop/settings/precios", { value: limpio });
    Object.assign(estado, limpio);
  }
  return { parametros: estado, cargar, guardar };
}
