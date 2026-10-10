<!-- src/modules/admin/pages/CashRegistersAdminPage.vue -->
<!-- Cajas (maqueta aprobada 10/10): período y sucursal arriba, las cajas
     abiertas ahora como tarjetas, una franja con lo de hoy, filtros con su
     cantidad y la tabla cerrada. Cierre administrativo y eliminar van en el
     detalle de cada caja, no en ventanas. -->
<template>
  <div class="sp cj">
    <div class="sp-cab">
      <div class="sp-cab__txt">
        <h1 class="sp-cab__titulo">Cajas</h1>
        <span class="sp-cab__sub num">{{ abiertas.length }} {{ abiertas.length === 1 ? "abierta" : "abiertas" }} ahora · {{ fmt(meta.total) }} en el período</span>
      </div>
      <div class="cj-filtros">
        <div class="cj-pills">
          <button v-for="o in PERIODOS" :key="o.v" type="button" :class="{ 'is-on': periodo === o.v }" @click="periodo = o.v">{{ o.t }}</button>
        </div>
        <template v-if="periodo === 'elegir'">
          <div class="cj-fecha"><CampoFecha v-model="desde" :clearable="false" /></div>
          <div class="cj-fecha"><CampoFecha v-model="hasta" :clearable="false" /></div>
        </template>
        <div v-if="branches.length > 1" class="cj-suc">
          <v-select v-model="branchId" :items="opcionesSucursal" item-title="t" item-value="v" density="comfortable" variant="outlined" hide-details />
        </div>
      </div>
    </div>

    <!-- Abiertas ahora -->
    <div v-if="abiertas.length" class="cj-abiertas">
      <router-link v-for="c in abiertas" :key="c.id" :to="ruta(c)" class="sp-caja cj-abierta">
        <span class="cj-abierta__ic"><v-icon size="26">mdi-cash-register</v-icon></span>
        <span class="cj-abierta__txt">
          <b>Caja #{{ c.id }} · {{ c.branch_name || "—" }}</b>
          <small>{{ c.opened_by_name || "—" }} · abierta desde {{ desdeTxt(c.opened_at) }}<template v-if="horas(c) >= umbral"> · <span class="cj-largo">más de {{ umbral }} h</span></template></small>
        </span>
        <span class="cj-abierta__num num"><b>{{ pesos(c.sales_total) }}</b><small>{{ c.sales_count || 0 }} {{ Number(c.sales_count) === 1 ? "venta" : "ventas" }}</small></span>
        <v-icon size="20" class="cj-ir">mdi-chevron-right</v-icon>
      </router-link>
    </div>

    <div class="cj-franja num">
      <div><span class="cj-lab">Vendido hoy</span><b>{{ pesos(kpis.sales_total_today) }}</b></div>
      <div><span class="cj-lab">Cerradas hoy</span><b>{{ fmt(kpis.closed_today) }}</b></div>
      <div><span class="cj-lab">Diferencia hoy</span><b :class="{ 'cj-rojo': n(kpis.difference_today) < 0 }">{{ dif(kpis.difference_today) }}</b></div>
    </div>

    <div class="sp-busca">
      <div class="sp-busca__campo">
        <v-icon size="22" class="sp-busca__ic">mdi-magnify</v-icon>
        <input v-model="q" type="search" class="sp-busca__input" placeholder="Cajero o número de caja" @input="buscar" />
      </div>
      <div class="cj-estados">
        <button v-for="e in ESTADOS" :key="e.v" type="button" :class="{ 'is-on': estado === e.v }" @click="estado = e.v; page = 1; cargar()">
          <i v-if="e.c" :style="{ background: e.c }"></i>{{ e.t }}<b class="num">{{ fmt(cuenta(e.v)) }}</b>
        </button>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact">{{ error }}</v-alert>

    <div class="sp-caja">
      <v-progress-linear v-if="cargando" indeterminate color="primary" height="3" />
      <div class="sp-tabla-scroll">
        <table class="sp-tabla cj-tabla">
          <thead>
            <tr><th class="c-caja">Caja</th><th>Cajero</th><th class="c-suc">Sucursal</th><th class="c-tiempo">Apertura → cierre</th><th class="c-plata">Ventas</th><th class="c-plata">Diferencia</th><th class="c-ver"></th></tr>
          </thead>
          <tbody>
            <tr v-for="c in filas" :key="c.id" :class="{ 'is-falta': n(c.difference_cash) < 0, 'is-abierta': c.status === 'OPEN' }" @click="abrir($event, c)" @auxclick="abrir($event, c)">
              <td><router-link :to="ruta(c)" class="sp-nombre num cj-nro" @click.stop>#{{ c.id }}</router-link></td>
              <td class="clamp1">{{ c.opened_by_name || "—" }}</td>
              <td class="clamp1">{{ c.branch_name || "—" }}</td>
              <td class="num">
                <div>{{ fechaHora(c.opened_at) }} → {{ c.status === "OPEN" ? "abierta" : horaSola(c.closed_at, c.opened_at) }}</div>
                <div class="sp-s" :class="{ 'cj-largo': horas(c) >= umbral }">{{ duracion(c) }}<template v-if="horas(c) >= umbral"> · más de {{ umbral }} h</template></div>
              </td>
              <td class="c-plata num"><b>{{ pesos(c.sales_total) }}</b><div class="sp-s">{{ c.sales_count || 0 }} {{ Number(c.sales_count) === 1 ? "venta" : "ventas" }}</div></td>
              <td class="c-plata num sp-b" :class="{ 'cj-rojo': n(c.difference_cash) < 0, 'cj-verde': n(c.difference_cash) > 0, 'sp-tenue': !n(c.difference_cash) }">{{ c.status === "OPEN" ? "—" : dif(c.difference_cash) }}</td>
              <td class="c-ver"><router-link :to="ruta(c)" class="sp-link" @click.stop>Ver<v-icon size="18">mdi-chevron-right</v-icon></router-link></td>
            </tr>
            <tr v-if="!cargando && !filas.length"><td colspan="7" class="sp-vacio">Ninguna caja con estos filtros</td></tr>
          </tbody>
        </table>
      </div>
      <div v-if="n(meta.total) > limit" class="cj-pag num">
        <span>{{ (page - 1) * limit + 1 }}–{{ Math.min(n(meta.total), page * limit) }} de {{ fmt(meta.total) }}</span>
        <button type="button" :disabled="page <= 1" @click="page--; cargar()"><v-icon size="20">mdi-chevron-left</v-icon></button>
        <button type="button" :disabled="page * limit >= n(meta.total)" @click="page++; cargar()"><v-icon size="20">mdi-chevron-right</v-icon></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "@/app/api/http";
import CampoFecha from "@/app/components/CampoFecha.vue";
import { adminListCashRegisters } from "@/modules/pos/services/posCashRegisters.service";
import "@/modules/products/styles/proveedores.css";

const route = useRoute();
const router = useRouter();
const PERIODOS = [{ v: "hoy", t: "Hoy" }, { v: "semana", t: "Esta semana" }, { v: "mes", t: "Este mes" }, { v: "todo", t: "Todo" }, { v: "elegir", t: "Elegir fechas" }];
const ESTADOS = [
  { v: "", t: "Todas" },
  { v: "abiertas", t: "Abiertas", c: "#2E9E7B" },
  { v: "faltante", t: "Con faltante", c: "#c2413a" },
  { v: "largas", t: "Más de 8 h abiertas", c: "#f0b429" },
];

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const hoy = new Date();
const periodo = ref("todo");
const desde = ref(iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
const hasta = ref(iso(hoy));
const branchId = ref(null);
const branches = ref([]);
const q = ref("");
const estado = ref("");
const page = ref(1);
const limit = 25;
const filas = ref([]);
const abiertas = ref([]);
const meta = ref({ total: 0 });
const kpis = ref({});
const umbral = ref(8);
const cargando = ref(false);
const error = ref("");

const n = (v) => Number(v || 0);
const fmt = (v) => n(v).toLocaleString("es-AR");
const pesos = (v) => `$ ${n(v).toLocaleString("es-AR", { maximumFractionDigits: 2 })}`;
const dif = (v) => (!n(v) ? "$ 0" : n(v) < 0 ? `− ${pesos(-n(v))}` : `+ ${pesos(v)}`);
const opcionesSucursal = computed(() => [{ t: "Todas las sucursales", v: null }, ...branches.value.map((b) => ({ t: b.name, v: b.id }))]);
const ruta = (c) => ({ name: "adminCashRegisterDetail", params: { id: c.id } });

const rango = computed(() => {
  const d = new Date();
  if (periodo.value === "hoy") return { desde: iso(d), hasta: iso(d) };
  if (periodo.value === "semana") { const l = new Date(d); l.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return { desde: iso(l), hasta: iso(d) }; }
  if (periodo.value === "mes") return { desde: iso(new Date(d.getFullYear(), d.getMonth(), 1)), hasta: iso(d) };
  if (periodo.value === "elegir") return { desde: desde.value, hasta: hasta.value };
  return { desde: "", hasta: "" };
});

function cuenta(v) {
  const k = kpis.value || {};
  if (!v) return n(k.filtered_open) + n(k.filtered_closed);
  if (v === "abiertas") return n(k.filtered_open);
  if (v === "faltante") return n(k.filtered_shortage_count);
  return n(k.filtered_overtime);
}
function horas(c) {
  const a = new Date(c.opened_at);
  const b = c.closed_at ? new Date(c.closed_at) : new Date();
  return isNaN(a) ? 0 : (b - a) / 3600000;
}
function duracion(c) {
  const h = horas(c);
  if (h >= 48) return `${Math.floor(h / 24)} días`;
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  return hh ? `${hh} h ${mm} min` : `${mm} min`;
}
const dd = (x) => String(x).padStart(2, "0");
function fechaHora(v) { const d = new Date(v); return isNaN(d) ? "" : `${dd(d.getDate())}/${dd(d.getMonth() + 1)} ${dd(d.getHours())}:${dd(d.getMinutes())}`; }
function horaSola(v, ref0) {
  const d = new Date(v), r = new Date(ref0);
  if (isNaN(d)) return "";
  return d.toDateString() === r.toDateString() ? `${dd(d.getHours())}:${dd(d.getMinutes())}` : fechaHora(v);
}
function desdeTxt(v) { const d = new Date(v); return isNaN(d) ? "" : d.toDateString() === new Date().toDateString() ? `${dd(d.getHours())}:${dd(d.getMinutes())}` : fechaHora(v); }
function abrir(e, c) {
  if (window.getSelection?.()?.toString()) return;
  if (e.button === 1 || e.ctrlKey || e.metaKey) { window.open(router.resolve(ruta(c)).href, "_blank"); return; }
  if (e.type === "click") router.push(ruta(c));
}

async function cargar() {
  cargando.value = true;
  error.value = "";
  try {
    const res = await adminListCashRegisters({
      q: q.value.trim(),
      status: estado.value === "abiertas" ? "OPEN" : "",
      shortage_only: estado.value === "faltante",
      overtime_only: estado.value === "largas",
      branch_id: branchId.value || "",
      date_from: rango.value.desde,
      date_to: rango.value.hasta,
      page: page.value,
      limit,
    });
    filas.value = Array.isArray(res?.data) ? res.data : [];
    meta.value = res?.meta || { total: 0 };
    kpis.value = res?.kpis || {};
    umbral.value = n(res?.audit_thresholds?.max_session_hours) || 8;
  } catch (e) {
    error.value = e?.friendlyMessage || e?.message || "No se pudieron cargar las cajas";
    filas.value = [];
  } finally {
    cargando.value = false;
  }
}
async function cargarAbiertas() {
  try {
    const res = await adminListCashRegisters({ status: "OPEN", branch_id: branchId.value || "", page: 1, limit: 20 });
    abiertas.value = Array.isArray(res?.data) ? res.data : [];
  } catch { abiertas.value = []; }
}
async function cargarSucursales() {
  try {
    const r = await http.get("/branches");
    branches.value = Array.isArray(r?.data?.data) ? r.data.data : Array.isArray(r?.data) ? r.data : [];
  } catch { branches.value = []; }
}
let reloj = null;
function buscar() { clearTimeout(reloj); reloj = setTimeout(() => { page.value = 1; cargar(); }, 300); }

watch(() => [rango.value.desde, rango.value.hasta, branchId.value], () => { page.value = 1; cargar(); cargarAbiertas(); });
onMounted(() => {
  if (String(route.query?.estado || "") === "abiertas") estado.value = "abiertas";
  cargarSucursales();
  cargar();
  cargarAbiertas();
});
</script>

<style>
.cj-filtros { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.cj-pills { display: flex; gap: 4px; padding: 4px; border-radius: 12px; background: var(--sp-caja); border: 1px solid var(--sp-borde); }
.cj-pills button { height: 36px; padding: 0 12px; border: 0; border-radius: 9px; background: transparent; font: 700 14px Inter, sans-serif; color: var(--sp-texto); cursor: pointer; }
.cj-pills button:hover:not(.is-on) { background: var(--sp-hover); }
.cj-pills button.is-on { background: #0f6fae; color: #ffffff; }
.cj-fecha { width: 160px; }
.cj-suc { width: 220px; }
.cj-abiertas { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 14px; }
.cj-abierta { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border: 2px solid #2E9E7B !important; text-decoration: none; color: var(--sp-texto); transition: box-shadow 120ms ease, transform 120ms ease; }
.cj-abierta:hover { box-shadow: 0 10px 22px rgba(10, 70, 110, 0.15); transform: translateY(-2px); }
.cj-abierta__ic { width: 44px; height: 44px; border-radius: 12px; background: #e3f4ee; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cj-abierta__ic .v-icon { color: #2E9E7B; }
.cj-abierta__txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.cj-abierta__txt b { font-size: 16px; }
.cj-abierta__txt small { font-size: 13px; color: var(--sp-suave); }
.cj-abierta__num { display: flex; flex-direction: column; align-items: flex-end; }
.cj-abierta__num b { font-size: 22px; font-weight: 900; }
.cj-abierta__num small { font-size: 13px; color: var(--sp-suave); }
.cj-ir { color: var(--sp-tenue) !important; }
.cj-franja { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-radius: 12px; overflow: hidden; background: var(--sp-caja); border: 1px solid var(--sp-borde); }
.cj-franja > div { display: flex; flex-direction: column; gap: 2px; padding: 12px 16px; border-left: 1px solid var(--sp-linea); }
.cj-franja > div:first-child { border-left: 0; }
.cj-franja b { font-size: 22px; font-weight: 900; }
.cj-lab { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--sp-suave); }
.cj-estados { display: flex; gap: 6px; flex-wrap: wrap; }
.cj-estados button { height: 40px; display: inline-flex; align-items: center; gap: 8px; padding: 0 14px; border-radius: 10px; border: 1px solid var(--sp-borde); background: var(--sp-caja); color: var(--sp-texto); font: 700 14px Inter, sans-serif; cursor: pointer; }
.cj-estados button i { width: 9px; height: 9px; border-radius: 9999px; }
.cj-estados button b { opacity: .7; }
.cj-estados button:hover:not(.is-on) { background: #cfe5f5; border-color: #3f8fc6; }
.cj-estados button.is-on { background: #0f6fae; border-color: #0f6fae; color: #ffffff; }
.cj-tabla .c-caja { width: 90px; }
.cj-tabla .c-suc { width: 150px; }
.cj-tabla .c-tiempo { width: 240px; }
.cj-tabla .c-plata { width: 150px; text-align: right; }
.cj-tabla .c-ver { width: 80px; text-align: right; }
.cj-tabla tr.is-falta td { background: rgba(194, 65, 58, 0.05); }
.cj-tabla tr.is-abierta td:first-child { box-shadow: inset 3px 0 0 #2E9E7B; }
.cj-nro { color: #0f6fae !important; font-size: 15px; }
.cj-rojo { color: #c2413a !important; }
.cj-verde { color: #1f7a5f !important; }
.cj-largo { color: #b45309 !important; font-weight: 700; }
.cj-pag { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 10px 14px; border-top: 1px solid var(--sp-linea); font-size: 14px; font-weight: 600; color: var(--sp-suave); }
.cj-pag button { width: 36px; height: 36px; border-radius: 9px; border: 1px solid var(--sp-borde); background: var(--sp-caja); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.cj-pag button:disabled { opacity: .4; cursor: default; }
@media (max-width: 900px) { .cj-franja { grid-template-columns: 1fr; } }
</style>
