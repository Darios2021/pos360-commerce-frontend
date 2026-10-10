// src/modules/reports/composables/useFiltroReportes.js
// Período y sucursal compartidos entre las vistas de Reportes: el estado vive a
// nivel de módulo para que al pasar de Ventas a Productos no se pierda.
import { computed, ref } from "vue";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const PERIODOS = [
  { v: "hoy", t: "Hoy" },
  { v: "semana", t: "Esta semana" },
  { v: "mes", t: "Este mes" },
  { v: "anterior", t: "Mes pasado" },
  { v: "elegir", t: "Elegir fechas" },
];

const hoy = new Date();
const periodo = ref("mes");
const desde = ref(iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
const hasta = ref(iso(hoy));
const branchId = ref(null);

export function useFiltroReportes() {
  const rango = computed(() => {
    const h = new Date();
    if (periodo.value === "hoy") return { desde: iso(h), hasta: iso(h) };
    if (periodo.value === "semana") {
      const lunes = new Date(h.getFullYear(), h.getMonth(), h.getDate() - ((h.getDay() + 6) % 7));
      return { desde: iso(lunes), hasta: iso(h) };
    }
    if (periodo.value === "mes") return { desde: iso(new Date(h.getFullYear(), h.getMonth(), 1)), hasta: iso(h) };
    if (periodo.value === "anterior") return { desde: iso(new Date(h.getFullYear(), h.getMonth() - 1, 1)), hasta: iso(new Date(h.getFullYear(), h.getMonth(), 0)) };
    return desde.value <= hasta.value ? { desde: desde.value, hasta: hasta.value } : { desde: hasta.value, hasta: desde.value };
  });

  const textoPeriodo = computed(() => {
    const [y1, m1, d1] = rango.value.desde.split("-").map(Number);
    const [y2, m2, d2] = rango.value.hasta.split("-").map(Number);
    if (rango.value.desde === rango.value.hasta) return `${d1} de ${MESES[m1 - 1]} de ${y1}`;
    if (y1 === y2 && m1 === m2) return `Del ${d1} al ${d2} de ${MESES[m1 - 1]} de ${y1}`;
    if (y1 === y2) return `Del ${d1} de ${MESES[m1 - 1]} al ${d2} de ${MESES[m2 - 1]} de ${y1}`;
    return `Del ${d1}/${m1}/${y1} al ${d2}/${m2}/${y2}`;
  });

  return { periodo, desde, hasta, branchId, rango, textoPeriodo };
}
