// src/modules/cargador/lib/codigo.js
//
// Buscar un producto por código exacto (barcode, SKU o código interno).
// 1) GET /products/by-code/:code (API del cargador; 404 si no existe).
// 2) Si falla con 404 (API vieja sin la ruta, o producto inexistente) se cae
//    a GET /products?q= y se queda con la coincidencia exacta.
// 3) En la APK sin red: la copia del catálogo (catalogoOffline.js), con la
//    hora de la copia en `_copia`.
import http from "@/app/api/http";
import * as catalogoOffline from "@/app/native/catalogoOffline";

const cache = new Map();

const igual = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
const coincide = (p, c) => [p?.barcode, p?.sku, p?.code].some((x) => x && igual(x, c));

function esFalloDeRed(e) {
  return !e?.response && (e?.code === "ERR_NETWORK" || e?.code === "ECONNABORTED" || /network/i.test(String(e?.message || "")));
}

async function porBusqueda(c) {
  const { data } = await http.get("/products", { params: { q: c, limit: 20, page: 1, include_inactive: 1 } });
  const filas = Array.isArray(data) ? data : data?.data || data?.items || data?.rows || [];
  return filas.find((p) => coincide(p, c)) || null;
}

export async function productoPorCodigo(codigo, { usarCache = false } = {}) {
  const c = String(codigo || "").trim();
  if (!c) return null;
  if (usarCache && cache.has(c.toLowerCase())) return cache.get(c.toLowerCase());
  let p = null;
  try {
    const { data } = await http.get(`/products/by-code/${encodeURIComponent(c)}`);
    p = data?.data || data?.product || (data?.id ? data : null);
  } catch (e) {
    // Existe pero no está habilitado en la sucursal del usuario.
    if (e?.response?.status === 403) return { _fueraDeAmbito: true, codigo: c };
    if (esFalloDeRed(e)) {
      const copia = await catalogoOffline.buscarCodigoConCopia?.(c);
      { const r = copia ? { ...copia.producto, _copia: copia.guardada } : null; if (r?.id) cache.set(c.toLowerCase(), r); return r; }
    }
    try {
      p = await porBusqueda(c);
    } catch (e2) {
      if (esFalloDeRed(e2)) {
        const copia = await catalogoOffline.buscarCodigoConCopia?.(c);
        { const r = copia ? { ...copia.producto, _copia: copia.guardada } : null; if (r?.id) cache.set(c.toLowerCase(), r); return r; }
      }
      throw e2;
    }
  }
  if (p?.id) cache.set(c.toLowerCase(), p);
  return p?.id ? p : null;
}


export function olvidarCodigo(codigo) {
  cache.delete(String(codigo || "").trim().toLowerCase());
}

/** El último producto leído con ese id (sirve sin red, desde la copia). */
export function productoEnCache(id) {
  for (const p of cache.values()) if (Number(p?.id) === Number(id)) return p;
  return null;
}
