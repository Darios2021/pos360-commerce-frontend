<!-- src/modules/reports/pages/ReportsGananciaPage.vue -->
<!-- Ganancia y reparto (maqueta aprobada 10/10): período y sucursal arriba,
     el resultado grande con el reparto, una fila por sucursal y, al tocarla,
     sus productos. Los porcentajes viven en Sistema › Parámetros de precios
     y la carga de costos en Gestión › Costos faltantes. La cuenta es la de la
     planilla: precio / (1 + IVA) / (1 + IIBB) / (1 + recargo) − costo. -->
<template>
  <div class="gr">
    <div class="gr-cab">
      <div class="gr-cab__txt">
        <a v-if="sucursalVista" href="#" class="gr-volver" @click.prevent="sucursalVista = null"><v-icon size="18">mdi-arrow-left</v-icon>Ganancia y reparto</a>
        <h2 class="gr-tit">{{ sucursalVista ? sucursalVista.nombre : "Ganancia y reparto" }}</h2>
        <span class="gr-sub num">{{ textoPeriodo }}<template v-if="sucursalVista"> · {{ pesos(sucursalVista.vendido) }} vendidos</template></span>
      </div>
      <div class="gr-filtros">
        <div class="gr-pills" role="tablist">
          <button v-for="o in PERIODOS" :key="o.v" type="button" :class="{ 'is-on': periodo === o.v }" @click="periodo = o.v">{{ o.t }}</button>
        </div>
        <template v-if="periodo === 'elegir'">
          <div class="gr-fecha"><CampoFecha v-model="desde" :clearable="false" /></div>
          <div class="gr-fecha"><CampoFecha v-model="hasta" :clearable="false" /></div>
        </template>
        <div v-if="branches.length > 1 && !sucursalVista" class="gr-suc">
          <v-select v-model="branchId" :items="opcionesSucursal" item-title="t" item-value="v" density="comfortable" variant="outlined" hide-details />
        </div>
        <button type="button" class="gr-btn" :disabled="exportando || cargando || !operaciones.length" @click="exportar">
          <v-progress-circular v-if="exportando" indeterminate size="18" width="2" />
          <v-icon v-else size="20">mdi-download</v-icon>Exportar
        </button>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact">{{ error }}</v-alert>

    <!-- Resumen -->
    <template v-if="!sucursalVista">
      <section class="gr-caja gr-hero">
        <div class="gr-hero__izq">
          <span class="gr-lab">Ganancia bruta</span>
          <span class="gr-grande num" :class="{ 'gr-tenue': !hayGanancia }">{{ hayGanancia ? pesos(tot.bruta) : "—" }}</span>
          <span class="gr-sub num">Vendido {{ pesos(tot.vendido) }} · {{ fmt(tot.qty) }} {{ tot.qty === 1 ? "unidad" : "unidades" }}</span>
          <router-link v-if="productosSinCosto > 0" :to="{ name: 'costsMissing', query: { desde: rango.desde, hasta: rango.hasta } }" class="gr-falta">
            <v-icon size="22">mdi-package-variant-closed-remove</v-icon>
            <span>{{ productosSinCosto === productosVendidos ? `Los ${productosVendidos} productos vendidos no tienen costo` : `${productosSinCosto} de ${productosVendidos} productos vendidos no tienen costo` }}</span>
            <b>Cargar costos<v-icon size="18">mdi-chevron-right</v-icon></b>
          </router-link>
        </div>
        <div class="gr-hero__der">
          <span class="gr-lab">Reparto</span>
          <div class="gr-barra"><span :style="{ width: `${fr}%` }"></span><span :style="{ width: `${100 - fr}%` }"></span></div>
          <div class="gr-reparto">
            <div><span class="gr-ref"><i class="is-fr"></i>Franquicia {{ fr }} %</span><b class="num" :class="{ 'gr-tenue': !hayGanancia }">{{ hayGanancia ? pesos(repartoTotal.franquicia) : "—" }}</b></div>
            <div><span class="gr-ref"><i class="is-lo"></i>Local {{ 100 - fr }} %</span><b class="num" :class="{ 'gr-tenue': !hayGanancia }">{{ hayGanancia ? pesos(repartoTotal.local) : "—" }}</b></div>
          </div>
        </div>
      </section>

      <section class="gr-caja">
        <div class="gr-banda"><span>Por sucursal</span><small class="num">{{ porSucursal.length }} con ventas</small></div>
        <v-progress-linear v-if="cargando" indeterminate color="primary" height="3" />
        <div class="gr-scroll">
          <table class="gr-tabla num">
            <thead><tr><th>Sucursal</th><th class="c-n">Vendido</th><th class="c-n">Ganancia</th><th class="c-n">Franquicia</th><th class="c-n">Local</th><th class="c-ver"></th></tr></thead>
            <tbody>
              <tr v-for="s in porSucursal" :key="s.id" class="is-link" @click="sucursalVista = s">
                <td class="gr-b">{{ s.nombre }}</td>
                <td class="c-n">{{ pesos(s.vendido) }}</td>
                <td class="c-n gr-b" :class="{ 'gr-tenue': !s.conCosto }">{{ s.conCosto ? pesos(s.bruta) : "—" }}</td>
                <td class="c-n" :class="{ 'gr-tenue': !s.conCosto }">{{ s.conCosto ? pesos(repartoDe(s).franquicia) : "—" }}</td>
                <td class="c-n" :class="{ 'gr-tenue': !s.conCosto }">{{ s.conCosto ? pesos(repartoDe(s).local) : "—" }}</td>
                <td class="c-ver"><span class="gr-link">Ver<v-icon size="18">mdi-chevron-right</v-icon></span></td>
              </tr>
              <tr v-if="!cargando && !porSucursal.length"><td colspan="6" class="gr-vacio">Sin ventas en el período</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <!-- Una sucursal -->
    <section v-else class="gr-caja">
      <div class="gr-banda"><span>Productos vendidos</span><small class="num">{{ productosDeSucursal.length }} productos</small></div>
      <div class="gr-scroll">
        <table class="gr-tabla num">
          <thead><tr><th>Producto</th><th class="c-q">Cant.</th><th class="c-n">Vendido</th><th class="c-n">Costo</th><th class="c-n">Ganancia</th></tr></thead>
          <tbody>
            <tr v-for="r in productosDeSucursal" :key="r.product_id || r.name">
              <td>
                <router-link v-if="r.product_id" :to="{ name: 'productView', params: { id: r.product_id } }" class="gr-prod">{{ r.name }}</router-link>
                <span v-else class="gr-prod">{{ r.name }}</span>
                <small v-if="r.sku" class="gr-sku">{{ r.sku }}</small>
              </td>
              <td class="c-q">{{ fmt(r.qty) }}</td>
              <td class="c-n">{{ pesos(r.vendido) }}</td>
              <td class="c-n">
                <router-link v-if="r.sinCosto" :to="{ name: 'costsMissing', query: { desde: rango.desde, hasta: rango.hasta } }" class="gr-link">Cargar costo</router-link>
                <template v-else>{{ pesos(r.costo) }}<i v-if="r.estimada" class="gr-est" title="Con el costo actual del producto">*</i></template>
              </td>
              <td class="c-n gr-b" :class="{ 'gr-tenue': r.sinCosto, 'gr-neg': !r.sinCosto && r.bruta < 0 }">{{ r.sinCosto ? "—" : pesos(r.bruta) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Operaciones: una fila por venta con su ganancia y el % de franquicia -->
    <section class="gr-caja">
      <div class="gr-banda"><span>Operaciones</span><small class="num">{{ opsFiltradas.length }} {{ opsFiltradas.length === 1 ? "venta" : "ventas" }}</small></div>
      <div class="gr-ops-barra">
        <v-text-field v-model="buscar" placeholder="Buscar por número, cliente o cajero" prepend-inner-icon="mdi-magnify" density="comfortable" variant="outlined" hide-details clearable class="gr-ops-buscar" />
        <div class="gr-pills gr-pills--chicas">
          <button v-for="o in FILTROS_OPS" :key="o.v" type="button" :class="{ 'is-on': filtroOps === o.v }" @click="filtroOps = o.v">{{ o.t }} <span class="num">{{ cuentaOps[o.v] }}</span></button>
        </div>
      </div>
      <div class="gr-scroll">
        <table class="gr-tabla gr-ops num">
          <thead>
            <tr>
              <th class="is-orden" @click="ordenar('fecha')">Fecha<v-icon v-if="orden.c === 'fecha'" size="14">{{ orden.asc ? "mdi-arrow-up" : "mdi-arrow-down" }}</v-icon></th>
              <th>N°</th>
              <th v-if="!sucursalVista">Sucursal</th>
              <th>Cajero</th>
              <th>Cliente</th>
              <th>Cobro</th>
              <th class="c-n is-orden" @click="ordenar('total')">Total<v-icon v-if="orden.c === 'total'" size="14">{{ orden.asc ? "mdi-arrow-up" : "mdi-arrow-down" }}</v-icon></th>
              <th class="c-n">Costo</th>
              <th class="c-n is-orden" @click="ordenar('bruta')">Ganancia<v-icon v-if="orden.c === 'bruta'" size="14">{{ orden.asc ? "mdi-arrow-up" : "mdi-arrow-down" }}</v-icon></th>
              <th class="c-pct">% Franq.</th>
              <th class="c-n">Franquicia</th>
              <th class="c-n">Local</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in opsPagina" :key="o.id">
              <td class="c-f"><b>{{ o.fecha }}</b><small class="gr-sku">{{ o.hora }}</small></td>
              <td><router-link :to="{ name: 'posSaleDetail', params: { id: o.id } }" class="gr-prod">{{ o.numero }}</router-link></td>
              <td v-if="!sucursalVista">{{ o.sucursal }}</td>
              <td>{{ o.cajero }}</td>
              <td class="c-cli">{{ o.cliente }}</td>
              <td class="c-cobro">{{ o.cobro }}</td>
              <td class="c-n gr-b">{{ pesos(o.total) }}</td>
              <td class="c-n">
                <router-link v-if="o.sinCosto" :to="{ name: 'costsMissing', query: { desde: rango.desde, hasta: rango.hasta } }" class="gr-link">Cargar costo</router-link>
                <template v-else>{{ pesos(o.costo) }}<i v-if="o.estimada" class="gr-est" title="Con el costo actual del producto">*</i></template>
              </td>
              <td class="c-n gr-b" :class="{ 'gr-tenue': o.sinCosto, 'gr-neg': !o.sinCosto && o.bruta < 0 }">{{ o.sinCosto ? "—" : pesos(o.bruta) }}</td>
              <td class="c-pct">
                <span class="gr-pct" :class="{ 'is-propio': o.propio }">
                  <input type="number" min="0" max="100" step="1" :value="o.pct" @focus="$event.target.select()" @change="fijarPct(o.id, $event.target.value)" /><i>%</i>
                  <button v-if="o.propio" type="button" title="Volver al % general" @click="quitarPct(o.id)"><v-icon size="14">mdi-restore</v-icon></button>
                </span>
              </td>
              <td class="c-n" :class="{ 'gr-tenue': o.sinCosto }">{{ o.sinCosto ? "—" : pesos(o.franquicia) }}</td>
              <td class="c-n" :class="{ 'gr-tenue': o.sinCosto }">{{ o.sinCosto ? "—" : pesos(o.local) }}</td>
            </tr>
            <tr v-if="!cargando && !opsFiltradas.length"><td :colspan="sucursalVista ? 11 : 12" class="gr-vacio">Sin operaciones</td></tr>
          </tbody>
          <tfoot v-if="opsFiltradas.length">
            <tr>
              <td :colspan="sucursalVista ? 5 : 6" class="gr-b">Total</td>
              <td class="c-n gr-b">{{ pesos(totOps.total) }}</td>
              <td class="c-n gr-b">{{ totOps.conCosto ? pesos(totOps.costo) : "—" }}</td>
              <td class="c-n gr-b">{{ totOps.conCosto ? pesos(totOps.bruta) : "—" }}</td>
              <td></td>
              <td class="c-n gr-b">{{ totOps.conCosto ? pesos(totOps.franquicia) : "—" }}</td>
              <td class="c-n gr-b">{{ totOps.conCosto ? pesos(totOps.local) : "—" }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div v-if="paginas > 1" class="gr-pag num">
        <button type="button" :disabled="pagina === 1" @click="pagina--"><v-icon size="20">mdi-chevron-left</v-icon></button>
        <span>{{ (pagina - 1) * POR_PAGINA + 1 }} a {{ Math.min(pagina * POR_PAGINA, opsFiltradas.length) }} de {{ opsFiltradas.length }}</span>
        <button type="button" :disabled="pagina === paginas" @click="pagina++"><v-icon size="20">mdi-chevron-right</v-icon></button>
      </div>
    </section>

    <router-link :to="{ name: 'priceSettings' }" class="gr-param num">
      <v-icon size="16">mdi-tune-variant</v-icon>IIBB {{ fmt(parametros.iibb) }} % · recargo {{ fmt(parametros.recargo) }} % · reparto {{ fr }} / {{ 100 - fr }}
    </router-link>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import http from "@/app/api/http";
import CampoFecha from "@/app/components/CampoFecha.vue";
import { useParametrosPrecios } from "../composables/useParametrosPrecios";

const { parametros, cargar: cargarParametros } = useParametrosPrecios();

const PERIODOS = [
  { v: "mes", t: "Este mes" },
  { v: "anterior", t: "Mes pasado" },
  { v: "elegir", t: "Elegir fechas" },
];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const hoy = new Date();

const periodo = ref("mes");
const desde = ref(iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
const hasta = ref(iso(hoy));
const branchId = ref(null);
const branches = ref([]);
const filas = ref([]);
const cargando = ref(false);
const error = ref("");
const sucursalVista = ref(null);
const ventasGan = ref([]);
const ventasMeta = ref([]);
const pctPropio = ref({});
const buscar = ref("");
const filtroOps = ref("todas");
const orden = ref({ c: "fecha", asc: false });
const pagina = ref(1);
const exportando = ref(false);
const POR_PAGINA = 25;
const FILTROS_OPS = [
  { v: "todas", t: "Todas" },
  { v: "con", t: "Con ganancia" },
  { v: "sin", t: "Sin costo" },
];
const METODOS = { CASH: "Efectivo", TRANSFER: "Transferencia", CARD: "Tarjeta", QR: "Mercado Pago QR", MERCADOPAGO: "Mercado Pago", CREDIT_SJT: "Crédito SJT", OTHER: "Otro" };

const rango = computed(() => {
  if (periodo.value === "mes") return { desde: iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta: iso(hoy) };
  if (periodo.value === "anterior") return { desde: iso(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)), hasta: iso(new Date(hoy.getFullYear(), hoy.getMonth(), 0)) };
  return { desde: desde.value, hasta: hasta.value };
});
const textoPeriodo = computed(() => {
  const [y1, m1, d1] = rango.value.desde.split("-").map(Number);
  const [y2, m2, d2] = rango.value.hasta.split("-").map(Number);
  if (y1 === y2 && m1 === m2) {
    const mes = `${MESES[m1 - 1].charAt(0).toUpperCase()}${MESES[m1 - 1].slice(1)} ${y1}`;
    const ultimo = new Date(y1, m1, 0).getDate();
    return d1 === 1 && d2 === ultimo ? mes : `${mes} · del ${d1} al ${d2}`;
  }
  return `Del ${d1}/${m1}/${y1} al ${d2}/${m2}/${y2}`;
});

const opcionesSucursal = computed(() => [{ t: "Todas las sucursales", v: null }, ...branches.value.map((b) => ({ t: b.name, v: b.id }))]);

const n = (v) => Number(v || 0);
const pesos = (v) => `$ ${Math.round(n(v)).toLocaleString("es-AR")}`;
const fmt = (v) => n(v).toLocaleString("es-AR", { maximumFractionDigits: 2 });
const fr = computed(() => Math.round(Math.min(100, Math.max(0, n(parametros.franquicia)))));

function calcular(r) {
  const sinCosto = n(r.qty) > 0 && n(r.qty_sin_costo) >= n(r.qty);
  const neto = n(r.vendido) / (1 + n(r.tax_rate) / 100) / (1 + n(parametros.iibb) / 100) / (1 + n(parametros.recargo) / 100);
  const bruta = sinCosto ? 0 : neto - n(r.costo);
  return { sinCosto, bruta, franquicia: (bruta * fr.value) / 100, local: (bruta * (100 - fr.value)) / 100, estimada: n(r.qty_estimada) > 0 };
}
const calculadas = computed(() => filas.value.map((r) => ({ ...r, ...calcular(r) })));

function sumar(lista) {
  const t = { qty: 0, vendido: 0, costo: 0, bruta: 0, franquicia: 0, local: 0, conCosto: false };
  for (const r of lista) {
    t.qty += n(r.qty);
    t.vendido += n(r.vendido);
    if (r.sinCosto) continue;
    t.conCosto = true;
    t.costo += n(r.costo);
    t.bruta += r.bruta;
    t.franquicia += r.franquicia;
    t.local += r.local;
  }
  return t;
}
const tot = computed(() => sumar(calculadas.value));
const hayGanancia = computed(() => tot.value.conCosto);
const productosVendidos = computed(() => new Set(calculadas.value.map((r) => r.product_id || r.name)).size);
const productosSinCosto = computed(() => new Set(calculadas.value.filter((r) => r.sinCosto).map((r) => r.product_id || r.name)).size);

const porSucursal = computed(() => {
  const m = new Map();
  for (const r of calculadas.value) {
    const a = m.get(r.branch_id) || { id: r.branch_id, nombre: r.branch_name || "Sin sucursal", items: [] };
    a.items.push(r);
    m.set(r.branch_id, a);
  }
  return [...m.values()].map((a) => ({ id: a.id, nombre: a.nombre, items: a.items, ...sumar(a.items) })).sort((x, y) => y.vendido - x.vendido);
});
/* Operaciones */
function fijarPct(id, v) {
  const x = Number(v);
  if (!Number.isFinite(x)) return;
  pctPropio.value = { ...pctPropio.value, [id]: Math.min(100, Math.max(0, x)) };
}
function quitarPct(id) {
  const c = { ...pctPropio.value };
  delete c[id];
  pctPropio.value = c;
}
const operaciones = computed(() => {
  const gan = new Map(ventasGan.value.map((v) => [v.sale_id, v]));
  return ventasMeta.value.map((s) => {
    const g = gan.get(Number(s.id)) || { qty: 0, neto: 0, costo: 0, qty_estimada: 0, qty_sin_costo: 0 };
    const sinCosto = !(n(g.qty) > 0) || n(g.qty_sin_costo) > 0;
    const bruta = sinCosto ? 0 : n(g.neto) / (1 + n(parametros.iibb) / 100) / (1 + n(parametros.recargo) / 100) - n(g.costo);
    const propio = Object.prototype.hasOwnProperty.call(pctPropio.value, s.id);
    const pct = propio ? pctPropio.value[s.id] : fr.value;
    const f = new Date(s.sold_at);
    const metodos = Object.entries(s.payments_by_method || {}).filter(([, v]) => n(v) > 0).map(([m]) => METODOS[m] || m);
    return {
      id: s.id,
      numero: s.sale_number || `#${s.id}`,
      ts: f.getTime(),
      fecha: f.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }),
      hora: f.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      branch_id: s.branch_id,
      sucursal: s.branch_name || "",
      cajero: s.user_name || "",
      cliente: s.customer_name || "Consumidor final",
      cobro: metodos.join(" + ") || "Sin cobro",
      total: n(s.total),
      costo: n(g.costo),
      estimada: n(g.qty_estimada) > 0,
      sinCosto,
      bruta,
      pct,
      propio,
      franquicia: (bruta * pct) / 100,
      local: bruta - (bruta * pct) / 100,
    };
  });
});
const opsDelAmbito = computed(() => (sucursalVista.value ? operaciones.value.filter((o) => o.branch_id === sucursalVista.value.id) : operaciones.value));
const cuentaOps = computed(() => {
  const l = opsDelAmbito.value;
  const sin = l.filter((o) => o.sinCosto).length;
  return { todas: l.length, con: l.length - sin, sin };
});
const opsFiltradas = computed(() => {
  const q = (buscar.value || "").trim().toLowerCase();
  let l = opsDelAmbito.value;
  if (filtroOps.value === "con") l = l.filter((o) => !o.sinCosto);
  if (filtroOps.value === "sin") l = l.filter((o) => o.sinCosto);
  if (q) l = l.filter((o) => `${o.numero} ${o.cliente} ${o.cajero}`.toLowerCase().includes(q));
  const k = orden.value.c === "fecha" ? "ts" : orden.value.c;
  const sg = orden.value.asc ? 1 : -1;
  return l.slice().sort((a, b) => (a[k] - b[k]) * sg);
});
const paginas = computed(() => Math.max(1, Math.ceil(opsFiltradas.value.length / POR_PAGINA)));
const opsPagina = computed(() => opsFiltradas.value.slice((pagina.value - 1) * POR_PAGINA, pagina.value * POR_PAGINA));
watch([buscar, filtroOps, sucursalVista], () => { pagina.value = 1; });
function ordenar(c) {
  orden.value = orden.value.c === c ? { c, asc: !orden.value.asc } : { c, asc: false };
}
function sumarOps(l) {
  const t = { total: 0, costo: 0, bruta: 0, franquicia: 0, local: 0, conCosto: false };
  for (const o of l) {
    t.total += o.total;
    if (o.sinCosto) continue;
    t.conCosto = true;
    t.costo += o.costo; t.bruta += o.bruta; t.franquicia += o.franquicia; t.local += o.local;
  }
  return t;
}
const totOps = computed(() => sumarOps(opsFiltradas.value));
/* El reparto respeta el % propio de cada venta; sin datos por venta, el general. */
const repartoTotal = computed(() => (ventasGan.value.length ? sumarOps(operaciones.value) : tot.value));
function repartoDe(suc) {
  if (!ventasGan.value.length) return suc;
  return sumarOps(operaciones.value.filter((o) => o.branch_id === suc.id));
}

async function exportar() {
  exportando.value = true;
  try {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const r2 = (v) => Math.round(n(v) * 100) / 100;
    const ops = operaciones.value.slice().sort((a, b) => a.ts - b.ts).map((o) => ({
      Fecha: o.fecha, Hora: o.hora, "N° venta": o.numero, Sucursal: o.sucursal, Cajero: o.cajero, Cliente: o.cliente, Cobro: o.cobro,
      Total: r2(o.total), Costo: o.sinCosto ? "" : r2(o.costo), Ganancia: o.sinCosto ? "" : r2(o.bruta),
      "% franquicia": o.pct, Franquicia: o.sinCosto ? "" : r2(o.franquicia), Local: o.sinCosto ? "" : r2(o.local),
      Nota: o.sinCosto ? "Sin costo" : o.estimada ? "Costo estimado" : "",
    }));
    const wsO = XLSX.utils.json_to_sheet(ops);
    wsO["!cols"] = [11, 7, 12, 18, 22, 24, 26, 12, 12, 12, 12, 12, 12, 16].map((wch) => ({ wch }));
    const t = repartoTotal.value;
    const wsR = XLSX.utils.aoa_to_sheet([
      ["Ganancia y reparto"], [],
      ["Período", textoPeriodo.value], ["Desde", rango.value.desde], ["Hasta", rango.value.hasta],
      ["Sucursal", branchId.value ? branches.value.find((b) => b.id === branchId.value)?.name || "" : "Todas"], [],
      ["IIBB %", n(parametros.iibb)], ["Recargo %", n(parametros.recargo)], ["Franquicia % general", fr.value], [],
      ["Vendido", r2(tot.value.vendido)], ["Ganancia bruta", hayGanancia.value ? r2(tot.value.bruta) : ""],
      ["Franquicia", hayGanancia.value ? r2(t.franquicia) : ""], ["Local", hayGanancia.value ? r2(t.local) : ""],
    ]);
    wsR["!cols"] = [{ wch: 22 }, { wch: 36 }];
    XLSX.utils.book_append_sheet(wb, wsR, "Resumen");
    XLSX.utils.book_append_sheet(wb, wsO, "Operaciones");
    const prods = calculadas.value.map((r) => ({
      Sucursal: r.branch_name, Producto: r.name, Código: r.sku || "", Cantidad: n(r.qty), Vendido: r2(r.vendido),
      Costo: r.sinCosto ? "" : r2(r.costo), Ganancia: r.sinCosto ? "" : r2(r.bruta),
    }));
    const wsP = XLSX.utils.json_to_sheet(prods);
    wsP["!cols"] = [18, 50, 14, 10, 12, 12, 12].map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(wb, wsP, "Productos");
    XLSX.writeFile(wb, `ganancia_${rango.value.desde}_${rango.value.hasta}${branchId.value ? `_suc${branchId.value}` : ""}.xlsx`);
  } finally {
    exportando.value = false;
  }
}

const productosDeSucursal = computed(() => (sucursalVista.value?.items || []).slice().sort((x, y) => n(y.vendido) - n(x.vendido)));

async function cargar() {
  cargando.value = true;
  error.value = "";
  try {
    const params = { date_from: rango.value.desde, date_to: rango.value.hasta, branch_id: branchId.value || undefined };
    const [{ data }, rv] = await Promise.all([
      http.get("/reports/ganancia", { params: { ...params, por: "venta" } }),
      http.get("/reports/sales", { params: { ...params, status: "PAID" } }),
    ]);
    filas.value = data?.data?.rows || [];
    ventasGan.value = data?.data?.ventas || [];
    ventasMeta.value = rv?.data?.data?.sales || [];
    pctPropio.value = {};
    if (sucursalVista.value) sucursalVista.value = porSucursal.value.find((s) => s.id === sucursalVista.value.id) || null;
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo cargar el reporte";
    filas.value = [];
    ventasGan.value = [];
    ventasMeta.value = [];
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

watch(() => [rango.value.desde, rango.value.hasta, branchId.value], cargar);
onMounted(() => { cargarParametros(); cargarSucursales(); cargar(); });
</script>

<style>
.gr {
  --gr-caja: #ffffff; --gr-borde: #d3dde7; --gr-linea: #e3eaf1; --gr-texto: #0f172a; --gr-suave: #5a6678; --gr-tenue: #94a3b8;
  --gr-banda: #0f6fae; --gr-hover: #f3f8fc; --gr-acento: #0f6fae; --gr-pill: #ffffff;
  display: flex; flex-direction: column; gap: 16px; color: var(--gr-texto);
}
:is(.v-theme--dark, .v-theme--adminDark) .gr {
  --gr-caja: #151c25; --gr-borde: #253141; --gr-linea: #222c39; --gr-texto: #e5edf5; --gr-suave: #9aa8b8; --gr-tenue: #64748b;
  --gr-banda: #0f5f96; --gr-hover: #1a2430; --gr-acento: #5aaee0; --gr-pill: #151c25;
}
.gr .num { font-variant-numeric: tabular-nums; }
.gr-cab { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.gr-cab__txt { display: flex; flex-direction: column; gap: 2px; }
.gr-volver { display: inline-flex; align-items: center; font-size: 14px; font-weight: 700; color: var(--gr-acento); text-decoration: none; margin-left: -4px; }
.gr-tit { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
.gr-sub { font-size: 14px; font-weight: 600; color: var(--gr-suave); }
.gr-filtros { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.gr-pills { display: flex; gap: 4px; padding: 4px; border-radius: 12px; background: var(--gr-pill); border: 1px solid var(--gr-borde); }
.gr-pills button { height: 36px; padding: 0 14px; border: 0; border-radius: 9px; background: transparent; font: 700 14px Inter, sans-serif; color: var(--gr-texto); cursor: pointer; }
.gr-pills button:hover:not(.is-on) { background: var(--gr-hover); }
.gr-pills button.is-on { background: #0f6fae; color: #ffffff; }
.gr-fecha { width: 160px; }
.gr-suc { width: 230px; }
.gr-caja { border-radius: 12px; overflow: hidden; background: var(--gr-caja); border: 1px solid var(--gr-borde); }
.gr-hero { display: grid; grid-template-columns: 1.2fr 1fr; }
.gr-hero__izq, .gr-hero__der { padding: 24px 26px; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.gr-hero__izq { border-right: 1px solid var(--gr-linea); }
.gr-hero__der { gap: 14px; }
.gr-lab { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--gr-suave); }
.gr-grande { font-size: 52px; font-weight: 900; letter-spacing: -0.02em; line-height: 1.05; }
.gr-falta { margin-top: 8px; display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 10px; background: #fff4e5; color: #8a4b0f; font-size: 14px; font-weight: 700; text-decoration: none; }
:is(.v-theme--dark, .v-theme--adminDark) .gr-falta { background: #3a2a12; color: #f5c98a; }
.gr-falta .v-icon { color: inherit; }
.gr-falta span { flex: 1; }
.gr-falta b { display: inline-flex; align-items: center; white-space: nowrap; }
.gr-falta:hover b { text-decoration: underline; }
.gr-barra { height: 14px; border-radius: 9999px; overflow: hidden; display: flex; background: var(--gr-linea); }
.gr-barra span:first-child { background: #0f6fae; }
.gr-barra span:last-child { background: #8cc0e3; }
.gr-reparto { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.gr-reparto > div { display: flex; flex-direction: column; gap: 2px; }
.gr-ref { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; }
.gr-ref i { width: 10px; height: 10px; border-radius: 3px; }
.gr-ref i.is-fr { background: #0f6fae; }
.gr-ref i.is-lo { background: #8cc0e3; }
.gr-reparto b { font-size: 30px; font-weight: 900; }
.gr-banda { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--gr-banda); color: #ffffff; font-size: 15px; font-weight: 800; }
.gr-banda small { font-size: 13px; font-weight: 600; color: rgba(255, 255, 255, .85); }
.gr-scroll { overflow-x: auto; }
.gr-tabla { width: 100%; border-collapse: collapse; min-width: 720px; }
.gr-tabla th { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; color: var(--gr-suave); background: var(--gr-hover); text-align: left; padding: 10px 14px; border: 1px solid var(--gr-linea); border-top: 0; }
.gr-tabla td { padding: 12px 14px; border: 1px solid var(--gr-linea); font-size: 15px; vertical-align: middle; }
.gr-tabla th:first-child, .gr-tabla td:first-child { border-left: 0; }
.gr-tabla th:last-child, .gr-tabla td:last-child { border-right: 0; }
.gr-tabla tr.is-link { cursor: pointer; }
.gr-tabla tbody tr:hover td { background: var(--gr-hover); }
.gr-tabla .c-n { text-align: right; width: 150px; white-space: nowrap; }
.gr-tabla .c-q { text-align: right; width: 70px; }
.gr-tabla .c-ver { width: 70px; text-align: right; }
.gr-b { font-weight: 800; }
.gr-tenue { color: var(--gr-tenue) !important; }
.gr-neg { color: #c2413a; }
.gr-link { display: inline-flex; align-items: center; font-size: 14px; font-weight: 800; color: var(--gr-acento); text-decoration: none; white-space: nowrap; }
.gr-link:hover { text-decoration: underline; }
.gr-prod { font-weight: 700; color: var(--gr-texto); text-decoration: none; }
a.gr-prod:hover { text-decoration: underline; }
.gr-sku { display: block; font-size: 12px; color: var(--gr-suave); }
.gr-est { font-style: normal; color: #b45309; margin-left: 2px; }
.gr-vacio { text-align: center; padding: 30px !important; color: var(--gr-suave); font-weight: 600; }
.gr-btn { display: inline-flex; align-items: center; gap: 8px; height: 44px; padding: 0 18px; border: 0; border-radius: 10px; background: #0f6fae; color: #ffffff !important; font: 800 15px Inter, sans-serif; cursor: pointer; }
.gr-btn .v-icon { color: #ffffff !important; }
.gr-btn:hover:not(:disabled) { background: #0a5a90; }
.gr-btn:disabled { opacity: .5; cursor: default; }
.gr-ops-barra { display: flex; align-items: center; gap: 12px; padding: 12px 16px; flex-wrap: wrap; border-bottom: 1px solid var(--gr-linea); }
.gr-ops-buscar { flex: 1; min-width: 240px; max-width: 420px; }
.gr-pills--chicas button span { margin-left: 4px; opacity: .7; }
.gr-ops { min-width: 1240px; }
.gr-ops td { font-size: 14px; padding: 10px 12px; white-space: nowrap; }
.gr-ops th { padding: 10px 12px; white-space: nowrap; }
.gr-ops th.is-orden { cursor: pointer; user-select: none; }
.gr-ops th.is-orden:hover { color: var(--gr-acento); }
.gr-ops th .v-icon { margin-left: 4px; }
.gr-ops .c-f { white-space: nowrap; }
.gr-ops .c-cli { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gr-ops .c-cobro { white-space: nowrap; }
.gr-ops .c-n { width: 120px; }
.gr-ops .c-pct { width: 110px; text-align: center; }
.gr-ops tfoot td { background: var(--gr-hover); font-size: 15px; }
.gr-pct { display: inline-flex; align-items: center; gap: 2px; }
.gr-pct input { width: 52px; height: 32px; padding: 0 6px; text-align: right; border: 1px solid var(--gr-borde); border-radius: 8px; background: var(--gr-caja); color: var(--gr-texto); font: 700 14px Inter, sans-serif; font-variant-numeric: tabular-nums; }
.gr-pct input:focus { outline: 2px solid #3f8fc6; outline-offset: -1px; }
.gr-pct.is-propio input { border-color: #3f8fc6; background: #e8f2fa; }
:is(.v-theme--dark, .v-theme--adminDark) .gr-pct.is-propio input { background: #12304a; }
.gr-pct i { font-style: normal; font-size: 13px; color: var(--gr-suave); }
.gr-pct button { border: 0; background: transparent; color: var(--gr-acento); cursor: pointer; padding: 2px; display: inline-flex; }
.gr-pag { display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding: 10px 16px; font-size: 14px; font-weight: 700; color: var(--gr-suave); border-top: 1px solid var(--gr-linea); }
.gr-pag button { width: 36px; height: 36px; border: 1px solid var(--gr-borde); border-radius: 9px; background: var(--gr-caja); color: var(--gr-texto); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.gr-pag button:disabled { opacity: .4; cursor: default; }
.gr-param { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--gr-suave); text-decoration: none; }
.gr-param:hover { color: var(--gr-acento); text-decoration: underline; }
@media (max-width: 900px) { .gr-hero { grid-template-columns: 1fr; } .gr-hero__izq { border-right: 0; border-bottom: 1px solid var(--gr-linea); } }
</style>
