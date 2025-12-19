// src/modules/products/utils/csvProductMapper.js

function pick(row, keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
      return String(row[k]).trim();
    }
  }
  return "";
}

function toNum(v, def = 0) {
  if (v === null || v === undefined || v === "") return def;

  // 317.000,00 -> 317000.00
  const s = String(v)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\./g, "")
    .replace(",", ".");

  const n = Number(s);
  return Number.isFinite(n) ? n : def;
}

function normBool(v, def = 0) {
  if (v === null || v === undefined || v === "") return def;
  const s = String(v).trim().toLowerCase();
  if (["1", "true", "si", "sí", "yes", "y"].includes(s)) return 1;
  if (["0", "false", "no", "n"].includes(s)) return 0;
  return def;
}

/**
 * Mapea una fila del CSV a payload del backend.
 * - name: desde "Descripcion" (o "Nombre")
 * - description: desde "Descripcion" (si no hay una columna de descripción real)
 * - sku: si falta, intenta usar "Codigo" (porque SKU es NOT NULL y UNIQUE en tu DB)
 */
export function mapCsvRowToProductPayload(row) {
  // Nombre comercial (en tu Excel suele venir como "Descripcion")
  const nameFromExcel = pick(row, [
    "name",
    "Name",
    "Nombre",
    "NOMBRE",
    "Descripcion",
    "DESCRIPCION",
    "Descripción",
    "DESCRIPCIÓN",
  ]);

  // Si tenés una descripción larga real, la toma; si no, usa el name
  const descFromExcel = pick(row, [
    "description",
    "Description",
    "DescripcionLarga",
    "Detalle",
    "Detalles",
    "Observaciones",
    "OBSERVACIONES",
  ]);

  const code = pick(row, ["code", "Code", "Codigo", "CODIGO", "CÓDIGO"]);
  const sku = pick(row, ["sku", "SKU"]) || code; // ✅ fallback clave
  const barcode = pick(row, ["barcode", "Barcode", "EAN", "ean"]);

  const rubroTxt = pick(row, ["Rubro", "RUBRO", "Categoria", "CATEGORIA"]);
  const subrubroTxt = pick(row, ["Subrubro", "SUBRUBRO", "Sub rubro", "SubRubro"]);

  const payload = {
    code: code || null,
    sku: sku || "",
    barcode: barcode || null,

    name: nameFromExcel || "",
    // ✅ acá está el FIX: description se llena desde Descripcion si no hay otra
    description: (descFromExcel || nameFromExcel) ? (descFromExcel || nameFromExcel) : null,

    // categoría (subrubro hoja) se resuelve en el import (creando/obteniendo IDs)
    category_id: null,

    brand: pick(row, ["brand", "Brand", "Marca", "MARCA"]) || null,
    model: pick(row, ["model", "Model", "Modelo", "MODELO"]) || null,

    warranty_months: toNum(pick(row, ["warranty_months", "Garantia", "GARANTIA"]), 0),

    is_new: normBool(pick(row, ["is_new", "Nuevo", "NUEVO"]), 0),
    is_promo: normBool(pick(row, ["is_promo", "Promo", "PROMO"]), 0),
    track_stock: normBool(pick(row, ["track_stock", "Stock", "STOCK"]), 1),
    is_active: normBool(pick(row, ["is_active", "Activo", "ACTIVO"]), 1),

    cost: toNum(pick(row, ["cost", "Costo", "PrecioCompra", "PRECIOCOMPRA"]), 0),
    price: toNum(pick(row, ["price", "Precio", "PRECIO"]), 0),
    price_list: toNum(pick(row, ["price_list", "PrecioLista", "PrecioVenta", "PRECIOVENTA"]), 0),
    price_discount: toNum(pick(row, ["price_discount", "PrecioDescuento", "Descuento", "DTO"]), 0),
    price_reseller: toNum(pick(row, ["price_reseller", "PrecioRevendedor", "Revendedor"]), 0),

    tax_rate: toNum(pick(row, ["tax_rate", "IVA", "iva"]), 21),
  };

  // Textos para crear rubro/subrubro (los usa la página import)
  payload.__rubroTxt = rubroTxt || null;
  payload.__subrubroTxt = subrubroTxt || null;

  if (!payload.name) throw new Error("Falta Nombre/Descripcion (para name)");
  if (!payload.sku) throw new Error("Falta SKU (y no vino Codigo para fallback)");

  return payload;
}
