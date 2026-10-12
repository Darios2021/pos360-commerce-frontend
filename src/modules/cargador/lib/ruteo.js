// src/modules/cargador/lib/ruteo.js
//
// Qué hace el teléfono con una lectura del lector central (o "Ingresar código"):
//  - DER-AAAA-NNNNNN: si la derivación viene en camino a la sucursal del
//    usuario, Recibir; si no, su detalle.
//  - Cualquier otro código, según el modo: Consultar (ficha del producto o
//    Código no encontrado), Derivar (suma a la derivación en armado) o Contar
//    (suma al conteo en curso).
import { listTransfers } from "@/modules/dashboard/service/stockTransfer.api";
import { productoPorCodigo } from "./codigo";
import { esDerivacion, imagenDe } from "./formato";
import { avisar } from "./aviso";
import { textoError } from "../services/conteos.service";
import { anotarLectura } from "../state/lecturas";
import { derivacion, sumarALaDerivacion } from "../state/derivacion";
import { conteo, sumarUnoAlConteo, nuevoConteo } from "../state/conteo";
import { stockEnDeposito } from "../services/conteos.service";
import { cargarDepositos, depositoPropio } from "./depositos";

export async function buscarDerivacion(numero) {
  const n = String(numero || "").trim().toUpperCase();
  const { data } = await listTransfers({ search: n, limit: 5, page: 1 });
  return (data?.transfers || []).find((t) => String(t.number || "").toUpperCase() === n) || null;
}

export function rutaDeDerivacion(t, auth) {
  const mia = Number(t.to_branch_id) === Number(auth.branchId || 0);
  if (t.status === "dispatched" && mia) return { name: "derivRecibir", params: { id: t.id } };
  if (t.status === "draft") return { name: "derivNueva", query: { borrador: t.id } };
  return { name: "derivDetalle", params: { id: t.id } };
}

async function origenDeLaDerivacion(auth) {
  if (derivacion.origenWarehouseId) return derivacion.origenWarehouseId;
  const lista = await cargarDepositos();
  const w = depositoPropio(lista, auth.branchId);
  derivacion.origenWarehouseId = w?.id || null;
  return derivacion.origenWarehouseId;
}

async function depositoDelConteo(auth) {
  if (conteo.warehouseId) return conteo.warehouseId;
  const lista = await cargarDepositos();
  conteo.warehouseId = depositoPropio(lista, auth.branchId)?.id || null;
  return conteo.warehouseId;
}

/** Suma un producto leído a la derivación en armado. Devuelve la línea. */
export async function sumarProductoADerivacion(p, auth) {
  const origen = await origenDeLaDerivacion(auth);
  let stock = null;
  try { stock = origen ? await stockEnDeposito(origen, p) : 0; } catch { stock = 0; }
  return sumarALaDerivacion({ ...p, image: imagenDe(p) }, stock);
}

/** Suma un producto leído al conteo en curso (+1). Devuelve la línea. Tira ErrorConteo. */
export async function sumarProductoAlConteo(p, auth) {
  if (conteo.estado && !["draft", "pending"].includes(conteo.estado)) nuevoConteo(conteo.warehouseId);
  const dep = await depositoDelConteo(auth);
  return sumarUnoAlConteo(p, async () => {
    try { return dep ? await stockEnDeposito(dep, p) : 0; } catch { return 0; }
  });
}

/**
 * Resuelve una lectura y navega. `reemplazar` = la pantalla del lector no
 * queda en el historial (volver desde el resultado lleva a donde se abrió).
 */
export async function rutearLectura(codigo, { modo = "consultar", router, auth, reemplazar = true }) {
  const c = String(codigo || "").trim();
  const ir = (to) => (reemplazar ? router.replace(to) : router.push(to));
  if (!c) return false;

  if (esDerivacion(c)) {
    const t = await buscarDerivacion(c);
    if (!t) {
      avisar("Derivación no encontrada");
      return false;
    }
    await ir(rutaDeDerivacion(t, auth));
    return true;
  }

  const p = await productoPorCodigo(c);
  if (p?._fueraDeAmbito) {
    avisar("Producto no habilitado en la sucursal");
    return false;
  }
  if (!p) {
    await ir({ name: "codigoNoEncontrado", params: { codigo: c } });
    return true;
  }

  if (modo === "derivar") {
    const l = await sumarProductoADerivacion(p, auth);
    await ir({ name: "derivNueva" });
    avisar(l.stock > 0 ? `${p.name} agregado` : `${p.name} sin stock en el origen`);
    return true;
  }
  if (modo === "contar") {
    try {
      await sumarProductoAlConteo(p, auth);
    } catch (e) {
      avisar(`${p.name}: ${textoError(e)}`);
      return false;
    }
    await ir({ name: "conteo" });
    avisar(`${p.name} contado`);
    return true;
  }
  anotarLectura(p);
  await ir({ name: "productoConsulta", params: { id: p.id }, query: p._copia ? { copia: p._copia } : {} });
  return true;
}
