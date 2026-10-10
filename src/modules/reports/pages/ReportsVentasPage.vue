<!-- src/modules/reports/pages/ReportsVentasPage.vue -->
<!-- Reportes rehechos desde cero (maqueta aprobada 10/10). Dos vistas con la
     misma cabecera de período, sucursal y una sola exportación:
     · ventas: por día (columnas), cómo se cobró (dona), por sucursal y por
       cajero (filas con barra fina abajo).
     · productos: los más vendidos por importe y por unidades.
     Estándar de gráficos: ~/.claude/estilo-graficos.md. -->
<template>
  <div class="rv">
    <div class="rv-cab">
      <span class="rv-sub num">{{ textoPeriodo }} · {{ nombreSucursal }}</span>
      <div class="rv-filtros">
        <div class="rv-pills" role="tablist">
          <button v-for="o in PERIODOS" :key="o.v" type="button" :class="{ 'is-on': periodo === o.v }" @click="periodo = o.v">{{ o.t }}</button>
        </div>
        <template v-if="periodo === 'elegir'">
          <div class="rv-fecha"><CampoFecha v-model="desde" :clearable="false" /></div>
          <div class="rv-fecha"><CampoFecha v-model="hasta" :clearable="false" /></div>
        </template>
        <div v-if="branches.length > 1" class="rv-suc">
          <v-select v-model="branchId" :items="opcionesSucursal" item-title="t" item-value="v" density="comfortable" variant="outlined" hide-details />
        </div>
        <button type="button" class="rv-btn" :disabled="exportando || cargando || !ventas.length" @click="exportar">
          <v-progress-circular v-if="exportando" indeterminate size="18" width="2" />
          <v-icon v-else size="20">mdi-download</v-icon>Exportar
        </button>
      </div>
    </div>

    <v-progress-linear v-if="cargando" indeterminate color="primary" height="3" rounded />
    <v-alert v-if="error" type="error" variant="tonal" density="compact">{{ error }}</v-alert>

    <!-- VENTAS -->
    <div v-if="vista === 'ventas'" class="rv-grilla">
      <section class="rv-bloque">
        <div class="rv-bt"><span>1. Ventas por día</span><small>{{ textoColumnas }}</small></div>
        <div class="rv-caja">
          <div class="rv-banda"><span>Vendido</span><small class="num">{{ pesos(resumen.total) }} · {{ resumen.ventas }} {{ resumen.ventas === 1 ? "venta" : "ventas" }}</small></div>
          <div class="rv-cuerpo">
            <div v-if="!resumen.ventas" class="rv-vacio">Sin ventas en el período</div>
            <div v-else class="rv-cols" :class="{ 'is-densa': columnas.length > 14 }">
              <div v-for="c in columnas" :key="c.clave" class="rv-col" :title="`${c.titulo}: ${pesos(c.total)} · ${c.ventas} ${c.ventas === 1 ? 'venta' : 'ventas'}`">
                <span class="rv-col__v num" :class="{ 'is-tenue': !c.total }">{{ c.total && (columnas.length <= 14 || c.total === maxColumna) ? corto(c.total) : "" }}</span>
                <div class="rv-col__b" :style="{ height: c.total ? `${Math.max(6, (c.total / maxColumna) * 170)}px` : '0px' }"></div>
                <div class="rv-col__eje"></div>
                <b class="rv-col__d">{{ c.etiqueta }}</b>
                <span v-if="columnas.length <= 14" class="rv-col__c">{{ c.ventas }} v.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="rv-bloque">
        <div class="rv-bt"><span>2. Cómo se cobró</span><small>una venta mixta suma en cada medio</small></div>
        <div class="rv-caja">
          <div class="rv-banda"><span>Medios de pago</span><small>{{ medios.length }} {{ medios.length === 1 ? "medio" : "medios" }}</small></div>
          <div class="rv-cuerpo">
            <div v-if="!medios.length" class="rv-vacio">Sin cobros en el período</div>
            <div v-else class="rv-dona">
              <svg viewBox="0 0 120 120" class="rv-dona__svg">
                <circle cx="60" cy="60" r="48" fill="none" class="rv-dona__fondo" stroke-width="15" />
                <circle v-for="s in segmentos" :key="s.metodo" cx="60" cy="60" r="48" fill="none" :stroke="s.color" stroke-width="15" :stroke-dasharray="`${s.largo} ${PER}`" :stroke-dashoffset="-s.desde" transform="rotate(-90 60 60)" />
                <text x="60" y="58" text-anchor="middle" class="rv-dona__t">{{ corto(totalMedios) }}</text>
                <text x="60" y="74" text-anchor="middle" class="rv-dona__s">cobrado</text>
              </svg>
              <div class="rv-dona__ley">
                <div v-for="(m, i) in medios" :key="m.metodo" class="rv-ley">
                  <i :style="{ background: COLORES[i % COLORES.length] }"></i>
                  <span>{{ m.etiqueta }}</span>
                  <b class="num">{{ pesos(m.monto) }}</b>
                  <em class="num">{{ pct(m.monto, totalMedios) }} %</em>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="rv-bloque">
        <div class="rv-bt"><span>3. Por sucursal</span><small>{{ sucursales.length }} con ventas</small></div>
        <div class="rv-caja">
          <div class="rv-banda"><span>Sucursales</span><small class="num">{{ pesos(resumen.total) }}</small></div>
          <div class="rv-cuerpo">
            <div v-if="!sucursales.length" class="rv-vacio">Sin ventas en el período</div>
            <div v-for="(s, i) in sucursales" :key="s.id" class="rv-fila">
              <div class="rv-fila__l">
                <span class="rv-fila__m num">{{ pesos(s.total) }}</span>
                <span class="rv-fila__t"><b>{{ s.nombre }}</b><span class="num">{{ s.ventas }} {{ s.ventas === 1 ? "venta" : "ventas" }}</span></span>
                <span class="rv-fila__p num">{{ pct(s.total, resumen.total) }} %</span>
              </div>
              <div class="rv-barra"><div :style="{ width: ancho(s.total, sucursales[0].total), background: COLORES[Math.min(i, 3)] }"></div></div>
            </div>
          </div>
        </div>
      </section>

      <section class="rv-bloque">
        <div class="rv-bt"><span>4. Por cajero</span><small>quién cobró</small></div>
        <div class="rv-caja">
          <div class="rv-banda"><span>Cajeros</span><small>{{ cajeros.length }} {{ cajeros.length === 1 ? "cobró" : "cobraron" }}</small></div>
          <div class="rv-cuerpo">
            <div v-if="!cajeros.length" class="rv-vacio">Sin ventas en el período</div>
            <div v-for="(c, i) in cajeros" :key="c.id" class="rv-fila">
              <div class="rv-fila__l">
                <span class="rv-fila__m num">{{ pesos(c.total) }}</span>
                <span class="rv-fila__t"><b>{{ c.nombre }}</b><span class="num">{{ c.ventas }} {{ c.ventas === 1 ? "venta" : "ventas" }} · {{ c.sucursales }}</span></span>
                <span class="rv-fila__p num">{{ pct(c.total, resumen.total) }} %</span>
              </div>
              <div class="rv-barra"><div :style="{ width: ancho(c.total, cajeros[0].total), background: COLORES[Math.min(i, 3)] }"></div></div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- PRODUCTOS -->
    <div v-else class="rv-grilla">
      <section class="rv-bloque">
        <div class="rv-bt"><span>1. Más vendidos por importe</span><small>{{ textoCuantos(porImporte) }}</small></div>
        <div class="rv-caja">
          <div class="rv-banda"><span>Productos</span><small class="num">{{ pesos(totProductos.importe) }}</small></div>
          <div class="rv-cuerpo">
            <div v-if="!productos.length" class="rv-vacio">{{ errorProductos || "Sin productos vendidos en el período" }}</div>
            <div v-for="p in porImporte" :key="p.id" class="rv-fila">
              <div class="rv-fila__l">
                <span class="rv-fila__m num">{{ pesos(p.importe) }}</span>
                <span class="rv-fila__t"><router-link :to="{ name: 'productView', params: { id: p.id } }" class="rv-prod">{{ p.nombre }}</router-link><span class="num">{{ fmt(p.qty) }} u. · {{ p.sucursales }}</span></span>
                <span class="rv-fila__p num">{{ pct(p.importe, totProductos.importe) }} %</span>
              </div>
              <div class="rv-barra"><div :style="{ width: ancho(p.importe, porImporte[0].importe) }"></div></div>
            </div>
            <button v-if="productos.length > TOPE" type="button" class="rv-mas" @click="todosImporte = !todosImporte">{{ todosImporte ? `Ver los ${TOPE} primeros` : `Ver los ${productos.length}` }}</button>
          </div>
        </div>
      </section>

      <section class="rv-bloque">
        <div class="rv-bt"><span>2. Más vendidos por unidades</span><small>{{ textoCuantos(porUnidades) }}</small></div>
        <div class="rv-caja">
          <div class="rv-banda"><span>Productos</span><small class="num">{{ fmt(totProductos.qty) }} {{ totProductos.qty === 1 ? "unidad" : "unidades" }}</small></div>
          <div class="rv-cuerpo">
            <div v-if="!productos.length" class="rv-vacio">{{ errorProductos || "Sin productos vendidos en el período" }}</div>
            <div v-for="p in porUnidades" :key="p.id" class="rv-fila">
              <div class="rv-fila__l">
                <span class="rv-fila__m rv-fila__m--u num">{{ fmt(p.qty) }} u.</span>
                <span class="rv-fila__t"><router-link :to="{ name: 'productView', params: { id: p.id } }" class="rv-prod">{{ p.nombre }}</router-link><span class="num">{{ pesos(p.importe) }} · {{ p.sucursales }}</span></span>
                <span class="rv-fila__p num">{{ pct(p.qty, totProductos.qty) }} %</span>
              </div>
              <div class="rv-barra"><div :style="{ width: ancho(p.qty, porUnidades[0].qty) }"></div></div>
            </div>
            <button v-if="productos.length > TOPE" type="button" class="rv-mas" @click="todosUnidades = !todosUnidades">{{ todosUnidades ? `Ver los ${TOPE} primeros` : `Ver los ${productos.length}` }}</button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import http from "@/app/api/http";
import CampoFecha from "@/app/components/CampoFecha.vue";
import { PERIODOS, iso, useFiltroReportes } from "../composables/useFiltroReportes";

defineProps({ vista: { type: String, default: "ventas" } });

const { periodo, desde, hasta, branchId, rango, textoPeriodo } = useFiltroReportes();

const COLORES = ["#0a466e", "#0f6fae", "#3f8fc6", "#8cc0e3", "#c9e1f2", "#64748b", "#b8c7d6"];
const METODOS = { CASH: "Efectivo", TRANSFER: "Transferencia", CARD: "Tarjeta", QR: "Mercado Pago QR", MERCADOPAGO: "Mercado Pago", CREDIT_SJT: "Crédito SJT", OTHER: "Otro" };
const PER = 2 * Math.PI * 48;
const TOPE = 6;
const MESES_C = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const branches = ref([]);
const ventas = ref([]);
const porDia = ref([]);
const porSucursal = ref([]);
const resumenApi = ref({});
const filasProductos = ref([]);
const cargando = ref(false);
const error = ref("");
const errorProductos = ref("");
const exportando = ref(false);
const todosImporte = ref(false);
const todosUnidades = ref(false);

const n = (v) => Number(v || 0);
const pesos = (v) => `$ ${Math.round(n(v)).toLocaleString("es-AR")}`;
const fmt = (v) => n(v).toLocaleString("es-AR", { maximumFractionDigits: 2 });
const pct = (v, t) => (n(t) > 0 ? Math.round((n(v) / n(t)) * 100) : 0);
const ancho = (v, mx) => `${n(mx) > 0 ? Math.max(4, (n(v) / n(mx)) * 100) : 0}%`;
function corto(v) {
  const x = n(v);
  if (x >= 1e6) return `$ ${(x / 1e6).toLocaleString("es-AR", { maximumFractionDigits: 1 })} M`;
  if (x >= 1e3) return `$ ${Math.round(x / 1e3).toLocaleString("es-AR")} k`;
  return `$ ${Math.round(x)}`;
}

const opcionesSucursal = computed(() => [{ t: "Todas las sucursales", v: null }, ...branches.value.map((b) => ({ t: b.name, v: b.id }))]);
const nombreSucursal = computed(() => (branchId.value ? branches.value.find((b) => b.id === branchId.value)?.name || "Sucursal" : "todas las sucursales"));

const resumen = computed(() => ({ ventas: n(resumenApi.value.sales_count), total: n(resumenApi.value.total_sum) }));

/* Columnas: un día por columna; con más de 62 días, un mes por columna. */
const columnas = computed(() => {
  const mapa = new Map(porDia.value.map((d) => [d.date, d]));
  const [y1, m1, d1] = rango.value.desde.split("-").map(Number);
  const [y2, m2, d2] = rango.value.hasta.split("-").map(Number);
  const ini = new Date(y1, m1 - 1, d1);
  const fin = new Date(y2, m2 - 1, d2);
  const dias = Math.round((fin - ini) / 864e5) + 1;
  if (dias <= 62) {
    const out = [];
    for (let i = 0; i < dias; i++) {
      const f = new Date(y1, m1 - 1, d1 + i);
      const d = mapa.get(iso(f));
      out.push({ clave: iso(f), etiqueta: dias > 14 ? `${f.getDate()}` : `${f.getDate()}/${f.getMonth() + 1}`, titulo: `${f.getDate()}/${f.getMonth() + 1}`, total: n(d?.total_sum), ventas: n(d?.sales_count) });
    }
    return out;
  }
  const meses = new Map();
  for (let f = new Date(y1, m1 - 1, 1); f <= fin; f = new Date(f.getFullYear(), f.getMonth() + 1, 1)) {
    const k = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`;
    meses.set(k, { clave: k, etiqueta: MESES_C[f.getMonth()], titulo: `${MESES_C[f.getMonth()]} ${f.getFullYear()}`, total: 0, ventas: 0 });
  }
  for (const d of porDia.value) {
    const c = meses.get(String(d.date).slice(0, 7));
    if (c) { c.total += n(d.total_sum); c.ventas += n(d.sales_count); }
  }
  return [...meses.values()];
});
const maxColumna = computed(() => Math.max(0, ...columnas.value.map((c) => c.total)));
const textoColumnas = computed(() => {
  const c = columnas.value;
  if (!c.length) return "";
  if (c[0].clave.length === 7) return "un mes por columna";
  return c.length === 1 ? c[0].titulo : `del ${c[0].titulo} al ${c[c.length - 1].titulo}`;
});

/* Medios de pago */
const medios = computed(() =>
  Object.entries(resumenApi.value.by_method || {})
    .map(([metodo, monto]) => ({ metodo, etiqueta: METODOS[metodo] || metodo, monto: n(monto) }))
    .filter((m) => m.monto > 0)
    .sort((a, b) => b.monto - a.monto)
);
const totalMedios = computed(() => medios.value.reduce((a, m) => a + m.monto, 0));
const segmentos = computed(() => {
  let desdeSeg = 0;
  return medios.value.map((m, i) => {
    const largo = (m.monto / totalMedios.value) * PER;
    const s = { metodo: m.metodo, color: COLORES[i % COLORES.length], largo: Math.max(largo - (medios.value.length > 1 ? 2.5 : 0), 0.5), desde: desdeSeg };
    desdeSeg += largo;
    return s;
  });
});

/* Sucursales y cajeros */
const sucursales = computed(() =>
  porSucursal.value.map((b) => ({ id: b.branch_id, nombre: b.branch_name, ventas: n(b.sales_count), total: n(b.total_sum) })).sort((a, b) => b.total - a.total)
);
const cajeros = computed(() => {
  const m = new Map();
  for (const s of ventas.value) {
    const k = n(s.user_id);
    const a = m.get(k) || { id: k, nombre: s.user_name || "Sin cajero", ventas: 0, total: 0, suc: new Set() };
    a.ventas += 1;
    a.total += n(s.total);
    if (s.branch_name) a.suc.add(s.branch_name);
    m.set(k, a);
  }
  return [...m.values()].map((a) => ({ ...a, sucursales: [...a.suc].join(", ") || "Sin sucursal" })).sort((a, b) => b.total - a.total);
});

/* Productos: las filas de /reports/ganancia vienen por (sucursal, producto). */
const productos = computed(() => {
  const m = new Map();
  for (const r of filasProductos.value) {
    const k = r.product_id || r.name;
    const a = m.get(k) || { id: r.product_id, nombre: r.name, sku: r.sku, qty: 0, importe: 0, suc: new Set() };
    a.qty += n(r.qty);
    a.importe += n(r.vendido);
    if (r.branch_name) a.suc.add(r.branch_name);
    m.set(k, a);
  }
  return [...m.values()].map((a) => ({ ...a, sucursales: [...a.suc].join(", ") || "Sin sucursal" }));
});
const totProductos = computed(() => productos.value.reduce((t, p) => ({ qty: t.qty + p.qty, importe: t.importe + p.importe }), { qty: 0, importe: 0 }));
const porImporte = computed(() => {
  const l = productos.value.slice().sort((a, b) => b.importe - a.importe);
  return todosImporte.value ? l : l.slice(0, TOPE);
});
const porUnidades = computed(() => {
  const l = productos.value.slice().sort((a, b) => b.qty - a.qty || b.importe - a.importe);
  return todosUnidades.value ? l : l.slice(0, TOPE);
});
function textoCuantos(lista) {
  const t = productos.value.length;
  if (!t) return "";
  return lista.length >= t ? `${t} ${t === 1 ? "producto" : "productos"}` : `los ${lista.length} primeros de ${t}`;
}

/* Carga */
async function cargarVentas() {
  const { data } = await http.get("/reports/sales", { params: { date_from: rango.value.desde, date_to: rango.value.hasta, status: "PAID", branch_id: branchId.value || undefined } });
  const d = data?.data || {};
  ventas.value = Array.isArray(d.sales) ? d.sales : [];
  porDia.value = Array.isArray(d.by_day) ? d.by_day : [];
  porSucursal.value = Array.isArray(d.by_branch) ? d.by_branch : [];
  resumenApi.value = d.summary || {};
}
async function cargarProductos() {
  errorProductos.value = "";
  try {
    const { data } = await http.get("/reports/ganancia", { params: { date_from: rango.value.desde, date_to: rango.value.hasta, branch_id: branchId.value || undefined } });
    filasProductos.value = data?.data?.rows || [];
  } catch (e) {
    filasProductos.value = [];
    errorProductos.value = e?.response?.data?.message || "No se pudieron cargar los productos";
  }
}
async function cargar() {
  cargando.value = true;
  error.value = "";
  try {
    await Promise.all([cargarVentas(), cargarProductos()]);
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo cargar el reporte";
    ventas.value = []; porDia.value = []; porSucursal.value = []; resumenApi.value = {};
  } finally {
    cargando.value = false;
  }
}
async function cargarSucursales() {
  try {
    const r = await http.get("/branches");
    branches.value = Array.isArray(r?.data?.data) ? r.data.data : Array.isArray(r?.data) ? r.data : [];
  } catch { branches.value = []; }
}

/* Exportación: un libro con el resumen, cada gráfico como tabla y el detalle. */
async function exportar() {
  exportando.value = true;
  try {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const hoja = (filas, nombre, anchos) => {
      const ws = XLSX.utils.json_to_sheet(filas);
      if (anchos) ws["!cols"] = anchos.map((wch) => ({ wch }));
      XLSX.utils.book_append_sheet(wb, ws, nombre);
    };
    const r2 = (v) => Math.round(n(v) * 100) / 100;
    const resumenAoA = [
      ["Reporte de ventas"], [],
      ["Período", textoPeriodo.value],
      ["Desde", rango.value.desde], ["Hasta", rango.value.hasta],
      ["Sucursal", branchId.value ? nombreSucursal.value : "Todas"], [],
      ["Ventas", resumen.value.ventas],
      ["Vendido", r2(resumen.value.total)],
      ["Unidades", n(resumenApi.value.items_qty)],
      ["Descuentos", r2(resumenApi.value.discount_sum)],
    ];
    const wsR = XLSX.utils.aoa_to_sheet(resumenAoA);
    wsR["!cols"] = [{ wch: 14 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsR, "Resumen");
    hoja(columnas.value.map((c) => ({ Fecha: c.titulo, Ventas: c.ventas, Vendido: r2(c.total) })), "Por día", [14, 10, 14]);
    hoja(medios.value.map((m) => ({ Medio: m.etiqueta, Cobrado: r2(m.monto), "%": pct(m.monto, totalMedios.value) })), "Medios de pago", [20, 14, 6]);
    hoja(sucursales.value.map((s) => ({ Sucursal: s.nombre, Ventas: s.ventas, Vendido: r2(s.total) })), "Sucursales", [24, 10, 14]);
    hoja(cajeros.value.map((c) => ({ Cajero: c.nombre, Sucursal: c.sucursales, Ventas: c.ventas, Vendido: r2(c.total) })), "Cajeros", [26, 24, 10, 14]);
    if (productos.value.length) {
      hoja(productos.value.slice().sort((a, b) => b.importe - a.importe).map((p) => ({ Producto: p.nombre, Código: p.sku || "", Sucursal: p.sucursales, Unidades: p.qty, Vendido: r2(p.importe) })), "Productos", [50, 14, 24, 10, 14]);
    }
    hoja(ventas.value.map((s) => {
      const f = new Date(s.sold_at);
      return {
        "N° venta": s.sale_number || s.id,
        Fecha: f.toLocaleDateString("es-AR"),
        Hora: f.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
        Sucursal: s.branch_name || "",
        Cajero: s.user_name || "",
        Cliente: s.customer_name || "",
        Unidades: n(s.items_qty),
        Subtotal: r2(s.subtotal),
        Descuento: r2(s.discount_total),
        Total: r2(s.total),
        Cobro: Object.entries(s.payments_by_method || {}).map(([m, v]) => `${METODOS[m] || m}: ${r2(v)}`).join(" | "),
      };
    }), "Ventas", [12, 11, 7, 18, 22, 24, 9, 12, 11, 12, 40]);
    XLSX.writeFile(wb, `reporte_ventas_${rango.value.desde}_${rango.value.hasta}${branchId.value ? `_suc${branchId.value}` : ""}.xlsx`);
  } finally {
    exportando.value = false;
  }
}

watch(() => [rango.value.desde, rango.value.hasta, branchId.value], () => { todosImporte.value = false; todosUnidades.value = false; cargar(); });
onMounted(() => { cargarSucursales(); cargar(); });
</script>

<style>
.rv {
  --rv-caja: #ffffff; --rv-borde: #d3dde7; --rv-linea: #eef2f6; --rv-texto: #0f172a; --rv-suave: #5a6678; --rv-tenue: #94a3b8;
  --rv-banda: #0f6fae; --rv-hover: #cfe5f5; --rv-hover-borde: #3f8fc6; --rv-acento: #0f6fae; --rv-pista: rgba(15, 23, 42, .06); --rv-eje: #d3dde7;
  display: flex; flex-direction: column; gap: 16px; color: var(--rv-texto); min-width: 0;
}
:is(.v-theme--dark, .v-theme--adminDark) .rv {
  --rv-caja: #151c25; --rv-borde: #253141; --rv-linea: #222c39; --rv-texto: #e5edf5; --rv-suave: #9aa8b8; --rv-tenue: #64748b;
  --rv-banda: #0f5f96; --rv-hover: #1a2a3a; --rv-hover-borde: #3f8fc6; --rv-acento: #5aaee0; --rv-pista: rgba(255, 255, 255, .08); --rv-eje: #334155;
}
.rv .num { font-variant-numeric: tabular-nums; }
.rv-cab { display: flex; align-items: center; justify-content: space-between; gap: 12px 16px; flex-wrap: wrap; }
.rv-sub { font-size: 15px; font-weight: 700; color: var(--rv-suave); }
.rv-filtros { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.rv-pills { display: flex; gap: 4px; padding: 4px; border-radius: 12px; background: var(--rv-caja); border: 1px solid var(--rv-borde); flex-wrap: wrap; }
.rv-pills button { height: 36px; padding: 0 14px; border: 0; border-radius: 9px; background: transparent; font: 700 14px Inter, sans-serif; color: var(--rv-texto); cursor: pointer; white-space: nowrap; }
.rv-pills button:hover:not(.is-on) { background: var(--rv-hover); }
.rv-pills button.is-on { background: #0f6fae; color: #ffffff; }
.rv-fecha { width: 160px; }
.rv-suc { width: 230px; }
.rv-btn { display: inline-flex; align-items: center; gap: 8px; height: 44px; padding: 0 18px; border: 0; border-radius: 10px; background: #0f6fae; color: #ffffff !important; font: 800 15px Inter, sans-serif; cursor: pointer; }
.rv-btn .v-icon { color: #ffffff !important; }
.rv-btn:hover:not(:disabled) { background: #0a5a90; }
.rv-btn:disabled { opacity: .5; cursor: default; }

.rv-grilla { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.rv-bloque { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.rv-bt { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.rv-bt span { font-size: 22px; font-weight: 800; letter-spacing: -0.01em; }
.rv-bt small { font-size: 13px; color: var(--rv-suave); }
.rv-caja { flex: 1; border-radius: 12px; overflow: hidden; background: var(--rv-caja); border: 1px solid var(--rv-borde); }
.rv-banda { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 12px 16px; background: var(--rv-banda); color: #ffffff; font-size: 15px; font-weight: 800; }
.rv-banda small { font-size: 13px; font-weight: 600; color: rgba(255, 255, 255, .88); }
.rv-cuerpo { padding: 8px 18px 14px; }
.rv-vacio { padding: 40px 0; text-align: center; font-size: 15px; font-weight: 600; color: var(--rv-suave); }

/* Columnas */
.rv-cols { display: flex; gap: 4px; align-items: flex-end; padding-top: 10px; }
.rv-col { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 6px; height: 250px; }
.rv-col__v { font-size: 12px; font-weight: 800; white-space: nowrap; }
.rv-col__v.is-tenue { color: var(--rv-tenue); }
.rv-col__b { width: min(34px, 80%); border-radius: 6px 6px 0 0; background: #0f6fae; }
.rv-col:hover .rv-col__b { background: #3f8fc6; }
.rv-col__eje { width: 100%; border-top: 1px solid var(--rv-eje); }
.rv-col__d { font-size: 13px; }
.rv-col__c { font-size: 11px; color: var(--rv-tenue); }
.rv-cols.is-densa { gap: 2px; }
.rv-cols.is-densa .rv-col__b { width: 80%; border-radius: 3px 3px 0 0; }
.rv-cols.is-densa .rv-col__d { font-size: 11px; font-weight: 700; }
.rv-cols.is-densa .rv-col__v { font-size: 11px; }

/* Dona */
.rv-dona { display: flex; align-items: center; gap: 22px; padding-top: 6px; }
.rv-dona__svg { width: 190px; height: 190px; flex-shrink: 0; }
.rv-dona__fondo { stroke: var(--rv-pista); }
.rv-dona__t { font: 800 15px Inter, sans-serif; fill: var(--rv-texto); }
.rv-dona__s { font: 600 9px Inter, sans-serif; fill: var(--rv-suave); }
.rv-dona__ley { flex: 1; min-width: 0; }
.rv-ley { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--rv-linea); }
.rv-ley:last-child { border-bottom: 0; }
.rv-ley i { width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; }
.rv-ley span { flex: 1; min-width: 0; font-size: 15px; font-weight: 700; }
.rv-ley b { font-size: 18px; font-weight: 800; white-space: nowrap; }
.rv-ley em { font-style: normal; font-size: 14px; color: var(--rv-suave); min-width: 44px; text-align: right; }

/* Filas con barra fina abajo */
.rv-fila { padding: 10px 0; border-bottom: 1px solid var(--rv-linea); }
.rv-fila:last-of-type { border-bottom: 0; }
.rv-fila__l { display: flex; align-items: baseline; gap: 14px; }
.rv-fila__m { font-size: 22px; font-weight: 800; min-width: 130px; white-space: nowrap; }
.rv-fila__m--u { min-width: 64px; }
.rv-fila__t { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.rv-fila__t b, .rv-prod { font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--rv-texto); text-decoration: none; }
a.rv-prod:hover { color: var(--rv-acento); text-decoration: underline; }
.rv-fila__t > span { font-size: 13px; color: var(--rv-suave); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rv-fila__p { font-size: 15px; font-weight: 800; color: var(--rv-suave); }
.rv-barra { margin-top: 6px; height: 8px; border-radius: 9999px; background: var(--rv-pista); }
.rv-barra > div { height: 8px; border-radius: 9999px; background: #0f6fae; }
.rv-mas { margin-top: 8px; border: 0; background: transparent; padding: 6px 0; font: 800 14px Inter, sans-serif; color: var(--rv-acento); cursor: pointer; }
.rv-mas:hover { text-decoration: underline; }

@media (max-width: 1100px) { .rv-grilla { grid-template-columns: 1fr; } }
@media (max-width: 600px) {
  .rv-suc, .rv-fecha { width: 100%; }
  .rv-filtros, .rv-btn { width: 100%; }
  .rv-btn { justify-content: center; }
  .rv-dona { flex-direction: column; align-items: stretch; }
  .rv-dona__svg { align-self: center; width: 160px; height: 160px; }
  .rv-fila__m { font-size: 19px; min-width: 104px; }
  .rv-cuerpo { padding: 6px 14px 12px; }
  .rv-col { height: 200px; }
  .rv-cols:not(.is-densa) .rv-col__v { font-size: 10px; }
}
</style>
