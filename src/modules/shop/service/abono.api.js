// src/modules/shop/service/abono.api.js
//
// El ABONO DE MONITOREO "EL OJO" no es contenido escrito a mano: es un producto
// real del catalogo, en la categoria MONITOREO (88). De ahi salen el nombre y el
// precio que muestran la landing de seguridad, la tarjeta de kit y la ficha.
//
// Se pide UNA sola vez por sesion y se comparte. Tres componentes lo necesitan;
// tres pedidos del mismo producto serian tres pedidos de mas.
//
// ⚠ Si la categoria no responde, o el pack no tiene precio cargado, esto
// devuelve null y el que llama NO dibuja nada. Nunca un precio inventado ni un
// bloque vacio: en esa misma categoria vive el pack 794, cargado en $0.

import { getCatalog, getCatalogBranchId } from "@/modules/shop/service/shop.public.api";

/** Categoria MONITOREO en la taxonomia del shop. */
export const CATEGORIA_MONITOREO = 88;

/** Subcategoria del abono que hoy esta cargado con precio. */
const SUB_PACK_BASICO = "PACK BASICO";

function toNum(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Precio que el shop muestra para un producto: el mismo orden que usa
 * ProductCard (descuento, si no lista, si no base).
 */
export function precioVigente(p) {
  const desc = toNum(p?.price_discount);
  if (desc > 0) return desc;
  const lista = toNum(p?.price_list);
  if (lista > 0) return lista;
  return toNum(p?.price);
}

// El cache va por sucursal: el abono esta cargado en unas y en otras no, asi
// que un resultado no vale para la sucursal de al lado. Guardar uno solo hacia
// que al cambiar de sucursal siguiera mostrandose un abono que ahi no se vende.
const cachePorSucursal = new Map();
const pendientePorSucursal = new Map();

async function traer() {
  const data = await getCatalog({
    category_id: CATEGORIA_MONITOREO,
    include_children: 1,
    page: 1,
    limit: 50,
  });

  const items = Array.isArray(data?.items) ? data.items : [];

  // El pack basico primero; si no esta, cualquier otro con precio cargado.
  const conPrecio = items.filter((p) => precioVigente(p) > 0);
  const basico = conPrecio.find(
    (p) => String(p?.subcategory_name || "").toUpperCase() === SUB_PACK_BASICO
  );

  const elegido = basico || conPrecio[0] || null;
  if (!elegido) return null;

  return {
    producto: elegido,
    monto: precioVigente(elegido),
    lista: toNum(elegido?.price_list),
  };
}

/**
 * Devuelve `{ producto, monto, lista }` o `null` si no hay abono publicable.
 * Nunca lanza: un fallo de red apaga la funcion, no rompe la pantalla.
 */
export async function getAbonoMonitoreo() {
  // ⚠ El abono se pide con la sucursal del visitante, como cualquier producto.
  // Hoy solo esta cargado en Casa Central y San Juan Centro: en Rivadavia y
  // Rawson esta funcion devuelve null y las pantallas no dibujan el abono.
  // El arreglo es de backoffice (darlo de alta en las cuatro), no de codigo:
  // ofrecer un servicio que la sucursal no tiene romperia el carrito, que
  // clampea por stock de sucursal.
  const suc = getCatalogBranchId();

  if (cachePorSucursal.has(suc)) return cachePorSucursal.get(suc);
  if (pendientePorSucursal.has(suc)) return pendientePorSucursal.get(suc);

  const p = traer()
    .then((r) => {
      cachePorSucursal.set(suc, r);
      return r;
    })
    .catch(() => {
      cachePorSucursal.set(suc, null);
      return null;
    })
    .finally(() => {
      pendientePorSucursal.delete(suc);
    });

  pendientePorSucursal.set(suc, p);
  return p;
}

/** Texto corto para la franja de la tarjeta. Devuelve "" si no hay abono. */
export function lineaAbono(abono, fmtMoney) {
  if (!abono || !(abono.monto > 0)) return "";
  const monto = typeof fmtMoney === "function"
    ? fmtMoney(abono.monto)
    : new Intl.NumberFormat("es-AR").format(abono.monto);
  return `Abono EL OJO $ ${monto} por mes`;
}
