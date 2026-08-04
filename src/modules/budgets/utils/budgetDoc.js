// src/modules/budgets/utils/budgetDoc.js
// Cómo se lee un presupuesto: numeración, vendedor y datos del emisor.
//
// Vive suelto porque lo usan las tres salidas del módulo —el editor, el listado
// y el PDF— y las tres tienen que decir exactamente lo mismo.

// Número del documento: local + correlativo, "001-00035".
//
// El correlativo sigue siendo uno solo para todo el sistema; el local va
// adelante para saber de dónde salió el presupuesto. El código de sucursal
// puede ser cualquier cosa ("CC", "Casa Central", "2"), así que nos quedamos
// con los dígitos y, si no tiene, caemos al id.
export function budgetNumber(budget) {
  const raw = String(budget?.branch_code || budget?.branch?.code || "").trim();
  const digits = raw.replace(/\D/g, "");
  const local = (digits || String(budget?.branch_id || 1)).padStart(3, "0").slice(-3);
  const num = String(Number(budget?.number || 0)).padStart(5, "0");
  return `${local}-${num}`;
}

// Vendedor: el snapshot que quedó guardado al emitirlo. Los presupuestos
// anteriores al snapshot lo resuelven desde el usuario asociado.
export function sellerName(budget) {
  const snap = String(budget?.user_name || "").trim();
  if (snap) return snap;

  const u = budget?.user;
  if (!u) return "";
  const full = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return full || u.username || u.email || "";
}

// Descuento: lo calcula el backend a partir de los renglones con margen
// negativo. `subtotal_gross` es lo que valdría sin bonificar.
export function hasDiscount(totals) {
  return Number(totals?.discount || 0) > 0;
}

// Etiqueta de la línea de descuento. El porcentaje solo se muestra si cierra
// exacto contra el subtotal: con varios renglones y uno solo bonificado, el
// promedio redondeado no da la cuenta y es peor poner un número que no cierra.
export function discountLabel(totals) {
  const gross = Number(totals?.subtotal_gross || 0);
  const discount = Number(totals?.discount || 0);
  if (gross <= 0 || discount <= 0) return "Descuento";

  const pct = Math.round((discount / gross) * 1000) / 10;
  const exact = Math.abs((gross * pct) / 100 - discount) < 0.01;
  if (!exact || pct <= 0) return "Descuento";

  return `Descuento ${pct.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;
}

// Fechas del documento.
//
// `valid_until` viaja como DATEONLY ("2026-08-18") y `new Date()` lo interpreta
// en UTC: en Argentina eso mostraba el día anterior. Las fechas sueltas se
// arman en hora local; las que traen hora (created_at) se parsean normal.
export function toDocDate(v) {
  if (!v) return null;
  const str = String(v);
  const onlyDate = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const d = onlyDate
    ? new Date(Number(onlyDate[1]), Number(onlyDate[2]) - 1, Number(onlyDate[3]))
    : new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fmtDocDate(v) {
  const d = toDocDate(v);
  if (!d) return "";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Días que faltan para una fecha, contados por día calendario para que "vence
// hoy" no dependa de la hora.
export function daysUntil(v) {
  const d = toDocDate(v);
  if (!d) return null;
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

// Líneas del emisor bajo el logo: sucursal, dirección, teléfono y los datos
// fiscales, que son los que el cliente necesita para cargar el presupuesto en
// su contabilidad.
export function issuerLines({ branding = {}, branch = null } = {}) {
  const address = branch
    ? [branch.address, branch.city, branch.province].filter(Boolean).join(", ")
    : branding?.address || "";

  const fiscal = [
    branding?.tax_id ? `CUIT ${branding.tax_id}` : "",
    branding?.iibb ? `Ing. Brutos ${branding.iibb}` : "",
  ].filter(Boolean);

  return [
    branch?.name || "",
    address,
    branch?.phone || branding?.phone_display || branding?.whatsapp_display || "",
    fiscal.join("  ·  "),
  ].filter(Boolean);
}
