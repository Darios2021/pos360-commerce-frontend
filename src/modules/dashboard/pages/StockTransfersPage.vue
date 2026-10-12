<!-- src/modules/dashboard/pages/StockTransfersPage.vue -->
<!-- Derivaciones, listado (maqueta aprobada 10/10): un botón, buscador,
     estados con su cantidad y tabla cerrada con el recorrido origen → destino
     y las fechas de cada paso. Cada fila abre la derivación en su vista. -->
<template>
  <!-- Teléfono (maqueta diseno-cargador, "derivaciones"): buscador con QR,
       chips con su cantidad (suman Todas) y filas que abren Recibir, el
       borrador o el detalle. El "+" va en la banda. -->
  <div v-if="mobile" class="dlm m-vista">
    <Teleport to="#m-barra-acc" defer>
      <button type="button" class="mv-ib" aria-label="Nueva derivación" @click="nuevaMovil">
        <v-icon size="24">mdi-plus</v-icon>
      </button>
    </Teleport>
    <label class="m-bus">
      <v-icon size="20">mdi-magnify</v-icon>
      <input v-model="q" type="search" enterkeyhint="search" placeholder="Número o nota" aria-label="Número o nota" @input="buscar" />
      <router-link :to="{ name: 'lector', query: { modo: 'consultar' } }" class="cam" aria-label="Escanear QR"><v-icon size="24">mdi-qrcode-scan</v-icon></router-link>
    </label>
    <div class="m-chips">
      <button v-for="c in chipsMovil" :key="c.v" type="button" class="m-chip num" :class="{ on: estado === c.v }" @click="estado = c.v; page = 1; cargar()">{{ c.t }} {{ fmt(c.n) }}</button>
    </div>
    <div v-if="error" class="m-error">{{ error }}</div>
    <div class="m-pz">
      <div v-if="cargando && !filas.length" class="m-vacio">Cargando…</div>
      <div v-else-if="!filas.length" class="m-vacio">Sin derivaciones</div>
      <router-link v-for="t in filas" :key="t.id" :to="rutaMovil(t)" class="m-it">
        <span class="m-ico"><v-icon size="20">{{ recibeMovil(t) ? "mdi-truck-outline" : "mdi-swap-horizontal" }}</v-icon></span>
        <span class="tx">
          <b class="num">{{ t.number }}</b>
          <small>{{ sucMovil(t.fromWarehouse) }} → {{ sucMovil(t.toWarehouse) }} · {{ cuandoMovil(t) }}</small>
          <span class="m-est" :class="recibeMovil(t) ? 'az' : estMovil(t).c" style="margin-top: 6px">{{ recibeMovil(t) ? "Por recibir" : estMovil(t).t }}</span>
        </span>
        <span class="der"><b class="num">{{ fmt((t.items || []).length) }}</b><small>{{ (t.items || []).length === 1 ? "producto" : "productos" }}</small></span>
        <v-icon size="20" class="chev">mdi-chevron-right</v-icon>
      </router-link>
      <div v-if="total > limit" class="dlm-pag">
        <button type="button" class="m-lnk" :disabled="page <= 1" @click="page--; cargar()">Anteriores</button>
        <span class="m-sub num">{{ page }} de {{ Math.ceil(total / limit) }}</span>
        <button type="button" class="m-lnk" :disabled="page * limit >= total" @click="page++; cargar()">Siguientes</button>
      </div>
    </div>
    <MovilAviso />
  </div>
  <div v-else class="sp dl">
    <div class="sp-cab">
      <div class="sp-cab__txt">
        <h1 class="sp-cab__titulo">Derivaciones</h1>
        <span class="sp-cab__sub num">Stock que se manda entre sucursales · {{ fmt(totalTodas) }} en total</span>
      </div>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" class="sp-nuevo" :to="{ name: 'transferNew' }">Nueva derivación</v-btn>
    </div>

    <div class="sp-busca">
      <div class="sp-busca__campo">
        <v-icon size="22" class="sp-busca__ic">mdi-magnify</v-icon>
        <input v-model="q" type="search" class="sp-busca__input" placeholder="Número, sucursal o nota" @input="buscar" />
      </div>
    </div>

    <div class="dl-estados" role="tablist">
      <button v-for="e in ESTADOS" :key="e.v" type="button" :class="{ 'is-on': estado === e.v }" @click="estado = e.v; page = 1; cargar()">
        <i v-if="e.v" :class="`dl-dot dl-dot--${e.v}`"></i>{{ e.t }}<b class="num">{{ fmt(cuenta(e.v)) }}</b>
      </button>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact">{{ error }}</v-alert>

    <div class="sp-caja">
      <v-progress-linear v-if="cargando" indeterminate color="primary" height="3" />
      <div class="sp-tabla-scroll">
        <table class="sp-tabla dl-tabla">
          <thead>
            <tr>
              <th class="c-nro">Número</th>
              <th>Origen y destino</th>
              <th class="c-prod">Productos</th>
              <th class="c-est">Estado</th>
              <th class="c-fechas">Creada → despachada → recibida</th>
              <th class="c-ver"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in filas" :key="t.id" :class="{ 'is-borrador': t.status === 'draft' }" @click="abrir($event, t)" @auxclick="abrir($event, t)">
              <td class="c-nro">
                <router-link :to="ruta(t)" class="sp-nombre num dl-nro" @click.stop>{{ corto(t.number) }}</router-link>
                <div class="sp-s num">{{ prefijo(t.number) }}</div>
              </td>
              <td>
                <span class="dl-ruta">
                  <span><v-icon size="18">mdi-store-outline</v-icon>{{ suc(t.fromWarehouse) }}</span>
                  <v-icon size="20" class="dl-flecha">mdi-arrow-right</v-icon>
                  <span class="is-dest"><v-icon size="18">mdi-store-outline</v-icon>{{ suc(t.toWarehouse) }}</span>
                </span>
                <div v-if="t.note" class="sp-s clamp1">{{ t.note }}</div>
              </td>
              <td class="c-prod num">{{ (t.items || []).length }}</td>
              <td><span :class="`dl-est dl-est--${t.status}`">{{ etiqueta(t.status) }}</span></td>
              <td class="num sp-s">
                <template v-if="t.status === 'draft'">creada {{ fecha(t.created_at) }}</template>
                <template v-else-if="t.status === 'cancelled'">cancelada</template>
                <template v-else>{{ fecha(t.created_at) }} → {{ fecha(t.dispatched_at) || "…" }} → <b :class="{ 'dl-ok': t.received_at }">{{ fecha(t.received_at) || "en camino" }}</b></template>
              </td>
              <td class="c-ver">
                <router-link :to="ruta(t)" class="sp-link" @click.stop>{{ accion(t) }}<v-icon size="18">mdi-chevron-right</v-icon></router-link>
              </td>
            </tr>
            <tr v-if="!cargando && !filas.length">
              <td colspan="6" class="sp-vacio">{{ q || estado ? "Ninguna derivación coincide" : "Todavía no hay derivaciones" }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="total > limit" class="dl-pag num">
        <span>{{ (page - 1) * limit + 1 }}–{{ Math.min(total, page * limit) }} de {{ fmt(total) }}</span>
        <button type="button" :disabled="page <= 1" @click="page--; cargar()"><v-icon size="20">mdi-chevron-left</v-icon></button>
        <button type="button" :disabled="page * limit >= total" @click="page++; cargar()"><v-icon size="20">mdi-chevron-right</v-icon></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/app/store/auth.store";
import { listTransfers } from "../service/stockTransfer.api";
import "@/modules/products/styles/proveedores.css";
import { useDisplay } from "vuetify";
import MovilAviso from "@/app/components/movil/MovilAviso.vue";
import { nuevaDerivacion } from "@/modules/cargador/state/derivacion";
import { cuando } from "@/modules/cargador/lib/formato";
import { ESTADOS as ESTADOS_MOVIL } from "@/modules/cargador/lib/derivaciones";

const { mobile } = useDisplay();

const router = useRouter();
// Los avisos del Inicio llegan con ?estado=dispatched (Por recibir).
const routeActual = useRoute();
const auth = useAuthStore();
const ESTADOS = [
  { v: "", t: "Todas" },
  { v: "draft", t: "Borrador" },
  { v: "dispatched", t: "En camino" },
  { v: "received", t: "Recibidas" },
  { v: "cancelled", t: "Canceladas" },
];
const NOMBRES = { draft: "Borrador", dispatched: "En camino", received: "Recibida", partial: "Recibida con diferencias", rejected: "Rechazada", cancelled: "Cancelada" };

const filas = ref([]);
const total = ref(0);
const totalTodas = ref(0);
const porEstado = ref({});
const q = ref("");
const estado = ref(["draft", "dispatched", "received", "cancelled"].includes(String(routeActual.query.estado || "")) ? String(routeActual.query.estado) : "");
const page = ref(1);
const limit = 30;
const cargando = ref(false);
const error = ref("");

const fmt = (v) => Number(v || 0).toLocaleString("es-AR");
// DER-2026-000026 → "000026" grande y "DER-2026" chico: entra en la columna.
const corto = (num) => String(num || "").split("-").pop();
const prefijo = (num) => String(num || "").split("-").slice(0, -1).join("-");
const etiqueta = (s) => NOMBRES[s] || s;
const suc = (w) => String(w?.branch?.name || w?.name || "").replace(/^Depósito\s+/i, "") || "—";
function fecha(v) {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d) ? "" : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function cuenta(v) {
  if (!v) return totalTodas.value;
  if (v === "received") return n(porEstado.value.received) + n(porEstado.value.partial);
  return n(porEstado.value[v]);
}
const n = (x) => Number(x || 0);
const ruta = (t) => ({ name: "transferView", params: { id: t.id } });
const miSucursal = computed(() => Number(auth.branchId || 0));
function accion(t) {
  if (t.status === "draft" && (auth.isAdmin || Number(t.fromWarehouse?.branch_id) === miSucursal.value)) return "Despachar";
  if (t.status === "dispatched" && (auth.isAdmin || Number(t.to_branch_id) === miSucursal.value)) return "Recibir";
  return "Ver";
}
function abrir(e, t) {
  if (window.getSelection?.()?.toString()) return;
  if (e.button === 1 || e.ctrlKey || e.metaKey) { window.open(router.resolve(ruta(t)).href, "_blank"); return; }
  if (e.type === "click") router.push(ruta(t));
}

// ── Teléfono ──
// Recibidas incluye las recibidas con diferencias y Canceladas las rechazadas:
// así las cantidades de los chips suman Todas.
const GRUPOS_MOVIL = { received: ["received", "partial"], cancelled: ["cancelled", "rejected"] };
const chipsMovil = computed(() => {
  const c = porEstado.value || {};
  const lista = [
    { v: "", t: "Todas", n: totalTodas.value },
    { v: "draft", t: "Borrador", n: n(c.draft) },
    { v: "dispatched", t: "En camino", n: n(c.dispatched) },
    { v: "received", t: "Recibidas", n: n(c.received) + n(c.partial) },
    { v: "cancelled", t: "Canceladas", n: n(c.cancelled) + n(c.rejected) },
  ];
  const resto = totalTodas.value - lista.slice(1).reduce((a, x) => a + x.n, 0);
  return resto > 0 ? [...lista, { v: "__otras", t: "Otras", n: resto }] : lista;
});
const sucMovil = (w) => w?.branch?.name || w?.name || "";
const recibeMovil = (t) => t.status === "dispatched" && Number(t.to_branch_id) === miSucursal.value;
const estMovil = (t) => ESTADOS_MOVIL[t.status] || { t: t.status, c: "gr" };
const cuandoMovil = (t) => cuando(t.dispatched_at || t.created_at);
function rutaMovil(t) {
  if (recibeMovil(t)) return { name: "derivRecibir", params: { id: t.id } };
  if (t.status === "draft") return { name: "derivNueva", query: { borrador: t.id } };
  return { name: "derivDetalle", params: { id: t.id } };
}
function nuevaMovil() {
  nuevaDerivacion();
  router.push({ name: "derivNueva" });
}
function estadoParaApi() {
  if (!estado.value || estado.value === "__otras") return undefined;
  if (mobile.value && GRUPOS_MOVIL[estado.value]) return GRUPOS_MOVIL[estado.value];
  return estado.value;
}

async function cargar() {
  cargando.value = true;
  error.value = "";
  try {
    const { data } = await listTransfers({ status: estadoParaApi(), search: q.value.trim() || undefined, page: page.value, limit });
    filas.value = data?.transfers || [];
    total.value = Number(data?.total || 0);
    totalTodas.value = Number(data?.total_all ?? data?.total ?? 0);
    porEstado.value = data?.count_by_status || {};
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudieron cargar las derivaciones";
  } finally {
    cargando.value = false;
  }
}
let reloj = null;
function buscar() { clearTimeout(reloj); reloj = setTimeout(() => { page.value = 1; cargar(); }, 300); }

onMounted(cargar);
</script>

<style>
.dlm { display: flex; flex-direction: column; gap: 12px; background: transparent; }
.dlm-pag { display: flex; align-items: center; justify-content: space-between; padding: 4px 16px; border-top: 1px solid var(--m-linea2); }
.dlm-pag .m-lnk[disabled] { opacity: 0.4; }
.dl-estados { display: flex; gap: 6px; flex-wrap: wrap; }
.dl-estados button { height: 38px; display: inline-flex; align-items: center; gap: 8px; padding: 0 14px; border-radius: 10px; border: 1px solid var(--sp-borde); background: var(--sp-caja); color: var(--sp-texto); font: 700 14px Inter, sans-serif; cursor: pointer; }
.dl-estados button b { font-weight: 800; opacity: .7; }
.dl-estados button:hover:not(.is-on) { background: #cfe5f5; border-color: #3f8fc6; }
.dl-estados button.is-on { background: #0f6fae; border-color: #0f6fae; color: #ffffff; }
.dl-dot, .dl-est::before { width: 9px; height: 9px; border-radius: 9999px; background: #C3C9D6; }
.dl-dot--draft, .dl-est--draft::before { background: #f0b429; }
.dl-dot--dispatched, .dl-est--dispatched::before { background: #3f8fc6; }
.dl-dot--received, .dl-est--received::before, .dl-est--partial::before { background: #2E9E7B; }
.dl-est { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; }
.dl-est::before { content: ""; }
.dl-tabla { min-width: 900px; }
.dl-tabla .c-nro { width: 110px; }
.dl-tabla .c-prod { width: 100px; text-align: right; }
.dl-tabla .c-est { width: 120px; }
.dl-tabla .c-fechas { width: 200px; }
.dl-tabla .c-ver { width: 136px; text-align: right; }
.dl-tabla td { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dl-nro { font-size: 16px; }
.dl-tabla tr.is-borrador td { background: rgba(240, 180, 41, 0.07); }
.dl-nro { color: #0f6fae !important; white-space: nowrap; }
.dl-ruta { display: inline-flex; align-items: center; gap: 8px; font-weight: 800; flex-wrap: wrap; }
.dl-ruta > span { display: inline-flex; align-items: center; gap: 5px; }
.dl-ruta .v-icon { color: var(--sp-suave); }
.dl-ruta .is-dest .v-icon, .dl-flecha { color: #0f6fae !important; }
.dl-ok { color: #1f7a5f; }
.dl-pag { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 10px 14px; border-top: 1px solid var(--sp-linea); font-size: 14px; font-weight: 600; color: var(--sp-suave); }
.dl-pag button { width: 36px; height: 36px; border-radius: 9px; border: 1px solid var(--sp-borde); background: var(--sp-caja); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.dl-pag button:disabled { opacity: .4; cursor: default; }
</style>
