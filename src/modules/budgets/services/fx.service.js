// src/modules/budgets/services/fx.service.js
// Cotización oficial del dólar para presupuestar en USD.
//
// Fuente: dolarapi.com, que publica el oficial del BCRA/Banco Nación. Se eligió
// porque responde con CORS abierto y sin API key, así que el navegador la puede
// consultar directo. La API del BCRA (api.bcra.gob.ar) da el mismo dato pero NO
// manda cabeceras CORS: para usarla habría que proxearla desde nuestra API.
//
// Importante: la cotización se GUARDA en el presupuesto (exchange_rate). El
// documento tiene que poder reimprimirse mañana mostrando el mismo total que
// se le pasó al cliente, aunque el dólar haya cambiado.

const DOLARAPI_OFICIAL = "https://dolarapi.com/v1/dolares/oficial";

export const FX_SOURCE_LABEL = "Dólar oficial (venta), dolarapi.com";

// Devuelve { rate, compra, venta, date, source } o lanza si no se pudo obtener.
// Se usa la punta VENDEDORA: es la que paga quien compra dólares, y es el
// criterio con el que se presupuesta en moneda extranjera.
export async function fetchOfficialUsdRate({ timeoutMs = 8000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(DOLARAPI_OFICIAL, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`La fuente respondió ${res.status}.`);
    const data = await res.json();

    const venta = Number(data?.venta);
    const compra = Number(data?.compra);
    if (!Number.isFinite(venta) || venta <= 0) {
      throw new Error("La fuente no devolvió una cotización válida.");
    }

    return {
      rate: venta,
      venta,
      compra: Number.isFinite(compra) ? compra : null,
      date: data?.fechaActualizacion || null,
      source: FX_SOURCE_LABEL,
    };
  } catch (e) {
    if (e?.name === "AbortError") {
      throw new Error("La fuente de cotización no respondió a tiempo.");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
