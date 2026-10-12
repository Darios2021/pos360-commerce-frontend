// src/app/native/catalogoOffline.js
//
// CATALOGO SIN CONEXION, MINIMO (solo en la APK).
//
// En el telefono la senal se corta mas que en el mostrador. Sin esto, al
// caerse la red el buscador del POS y el escaner dejan de encontrar productos
// y el vendedor no puede ni decir un precio. Aca se guarda una copia del
// catalogo de la sucursal (lo mismo que devuelve GET /pos/products: nombre,
// codigos, precio y stock) y, si la red se cae, las busquedas se contestan con
// esa copia.
//
// Lo que NO hace: cobrar. Sin conexion el cobro queda bloqueado
// (containers/usePosSalesFlow.js). La copia sirve para buscar, escanear,
// consultar precio y armar la venta.
//
// Se refresca sola: cada vez que el POS busca con red y la copia de esa
// sucursal tiene mas de 15 minutos, se baja de nuevo en segundo plano.
// El enganche esta en app/api/http.js (dos lineas).

import { isCapacitor } from "@/app/utils/runtime";

const BASE = "pos360-catalogo";
const TIENDA = "sucursales";
const VIGENCIA_MS = 15 * 60 * 1000;
const TOPE = 5000; // el maximo que acepta la API por pagina

const RUTA = /\/pos\/products\/?$/;

// Se apaga desde Más › Catálogo sin conexión (pantalla del cargador).
const CLAVE_ACTIVO = "pos360.catalogo_sin_conexion";
export function catalogoActivo() {
  try { return localStorage.getItem(CLAVE_ACTIVO) !== "0"; } catch { return true; }
}
export function activarCatalogo(v) {
  try { localStorage.setItem(CLAVE_ACTIVO, v ? "1" : "0"); } catch { /* modo privado */ }
}

let _db = null;
function abrir() {
  if (_db) return _db;
  _db = new Promise((ok, mal) => {
    const r = indexedDB.open(BASE, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(TIENDA);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => mal(r.error);
  });
  return _db;
}

async function leer(clave) {
  const db = await abrir();
  return new Promise((ok) => {
    const r = db.transaction(TIENDA).objectStore(TIENDA).get(clave);
    r.onsuccess = () => ok(r.result || null);
    r.onerror = () => ok(null);
  });
}

async function escribir(clave, valor) {
  const db = await abrir();
  return new Promise((ok) => {
    const t = db.transaction(TIENDA, "readwrite");
    t.objectStore(TIENDA).put(valor, clave);
    t.oncomplete = () => ok(true);
    t.onerror = () => ok(false);
  });
}

function claveDe(params = {}) {
  return String(params.branch_id || params.warehouse_id || "general");
}

/** Es una busqueda de catalogo del POS (no el detalle de un producto). */
export function esBusquedaDeCatalogo(config) {
  if (!isCapacitor()) return false;
  if (!catalogoActivo()) return false;
  if (String(config?.method || "get").toLowerCase() !== "get") return false;
  if (config?._copiaCatalogo) return false; // la propia descarga de la copia
  return RUTA.test(String(config?.url || "").split("?")[0]);
}

const _bajando = new Set();

/**
 * Llamar despues de una busqueda que salio bien. Si la copia de esa sucursal
 * esta vieja, la baja de nuevo sin frenar nada.
 */
export async function refrescarSiHaceFalta(http, config) {
  const params = config?.params || {};
  const clave = claveDe(params);
  if (_bajando.has(clave)) return;
  _bajando.add(clave);
  try {
    const previa = await leer(clave);
    if (previa && Date.now() - previa.guardada < VIGENCIA_MS) return;

    const pedido = { page: 1, limit: TOPE };
    if (params.branch_id) pedido.branch_id = params.branch_id;
    if (params.warehouse_id) pedido.warehouse_id = params.warehouse_id;
    const { data } = await http.get("/pos/products", { params: pedido, _copiaCatalogo: true });
    const filas = Array.isArray(data) ? data : data?.data || data?.items || [];
    await escribir(clave, { guardada: Date.now(), filas });
  } catch {
    // Sin copia nueva se sigue con la anterior: no es un error para el usuario.
  } finally {
    _bajando.delete(clave);
  }
}

function sinAcentos(s) {
  return String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function coincide(p, palabras) {
  const texto = sinAcentos([p.name, p.sku, p.code, p.barcode, p.brand, p.model].join(" "));
  return palabras.every((w) => texto.includes(w));
}

/**
 * Arma, con la copia, la misma respuesta que habria dado la API. Devuelve
 * null si no hay copia de esa sucursal (entonces el error sigue su curso).
 */
export async function respuestaSinConexion(config) {
  try {
    const params = config?.params || {};
    const copia = await leer(claveDe(params));
    if (!copia) return null;

    const palabras = sinAcentos(params.q || "").split(/\s+/).filter(Boolean);
    let filas = copia.filas;
    if (palabras.length) filas = filas.filter((p) => coincide(p, palabras));
    if (params.category_id) filas = filas.filter((p) => String(p.category_id) === String(params.category_id));
    if (params.subcategory_id) filas = filas.filter((p) => String(p.subcategory_id) === String(params.subcategory_id));
    if (String(params.in_stock) === "true") filas = filas.filter((p) => Number(p.qty ?? p.stock_qty ?? 0) > 0);
    if (params.ids) {
      const ids = new Set(String(params.ids).split(","));
      filas = filas.filter((p) => ids.has(String(p.id)));
    }

    const limit = Math.max(1, Number(params.limit) || 48);
    const page = Math.max(1, Number(params.page) || 1);
    const data = {
      data: filas.slice((page - 1) * limit, page * limit),
      meta: {
        total: filas.length,
        page,
        limit,
        branch_id: params.branch_id || null,
        warehouse_id: params.warehouse_id || null,
        // Para quien quiera avisar que el precio y el stock son de la copia.
        sin_conexion: true,
        copia_de: copia.guardada,
      },
    };
    return { data, status: 200, statusText: "OK (copia local)", headers: {}, config };
  } catch {
    return null;
  }
}

/** Busca un codigo exacto en cualquier copia guardada (para el escaner). */
export async function buscarCodigo(codigo) {
  if (!isCapacitor()) return null;
  try {
    const q = sinAcentos(codigo).trim();
    if (!q) return null;
    const db = await abrir();
    const todas = await new Promise((ok) => {
      const r = db.transaction(TIENDA).objectStore(TIENDA).getAll();
      r.onsuccess = () => ok(r.result || []);
      r.onerror = () => ok([]);
    });
    for (const copia of todas) {
      const p = copia.filas.find((f) =>
        [f.barcode, f.sku, f.code].some((c) => c && sinAcentos(c) === q)
      );
      if (p) return p;
    }
  } catch { /* sin copia */ }
  return null;
}

/** Igual que buscarCodigo, con la hora de la copia (la consulta la muestra). */
export async function buscarCodigoConCopia(codigo) {
  if (!isCapacitor() || !catalogoActivo()) return null;
  try {
    const q = sinAcentos(codigo).trim();
    if (!q) return null;
    const db = await abrir();
    const todas = await new Promise((ok) => {
      const r = db.transaction(TIENDA).objectStore(TIENDA).getAll();
      r.onsuccess = () => ok(r.result || []);
      r.onerror = () => ok([]);
    });
    for (const copia of todas) {
      const p = copia.filas.find((f) => [f.barcode, f.sku, f.code].some((c) => c && sinAcentos(c) === q));
      if (p) return { producto: p, guardada: copia.guardada };
    }
  } catch { /* sin copia */ }
  return null;
}

/** Hora de la copia más nueva guardada en este teléfono (o null). */
export async function ultimaCopia() {
  if (!isCapacitor()) return null;
  try {
    const db = await abrir();
    const todas = await new Promise((ok) => {
      const r = db.transaction(TIENDA).objectStore(TIENDA).getAll();
      r.onsuccess = () => ok(r.result || []);
      r.onerror = () => ok([]);
    });
    const t = Math.max(0, ...todas.map((c) => Number(c?.guardada || 0)));
    return t || null;
  } catch {
    return null;
  }
}
