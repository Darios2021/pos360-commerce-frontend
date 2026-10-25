// src/modules/service/utils/fechas.js
//
// Formateo de fechas del modulo, con una trampa que ya nos mordio dos veces.
//
// `new Date("2025-11-28")` NO devuelve el 28 de noviembre local: el estandar
// dice que una cadena solo-fecha se interpreta como UTC medianoche, asi que en
// Argentina (UTC-3) se muestra el 27. Las columnas DATE de la API (por ejemplo
// `estimated_pickup`) llegan justamente asi.
//
// Un DATETIME completo, en cambio, si trae zona horaria y se convierte bien.
// Por eso se distinguen los dos casos en vez de aplicar el mismo parche a todo.

const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Convierte un valor de la API a Date, sin correr el dia en las fechas sueltas. */
export function aFecha(v) {
  if (!v) return null;
  const s = String(v);
  if (SOLO_FECHA.test(s)) {
    // Se arma con los componentes, que el constructor interpreta como local.
    const [a, m, d] = s.split("-").map(Number);
    return new Date(a, m - 1, d);
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Fecha corta para pantalla y para el papel. Devuelve "" si no hay dato. */
export function fmtFecha(v, vacio = "") {
  const d = aFecha(v);
  return d ? d.toLocaleDateString("es-AR") : vacio;
}
