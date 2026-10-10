<!-- src/modules/reports/pages/ReportsGananciaPage.vue -->
<!-- Ganancia y reparto: lo vendido en el período, su costo, la ganancia bruta
     y el reparto entre franquicia y local. La cuenta es la de la planilla del
     negocio: precio / (1 + IVA) / (1 + IIBB) / (1 + recargo) − costo. Los
     porcentajes son parámetros (se recuerdan en este navegador); el costo es
     el guardado en cada venta, o el actual del producto para ventas viejas. -->
<template>
  <div class="gr">
    <section class="gr-filtros">
      <label class="gr-c"><span>Desde</span><CampoFecha v-model="f.desde" :clearable="false" /></label>
      <label class="gr-c"><span>Hasta</span><CampoFecha v-model="f.hasta" :clearable="false" /></label>
      <label v-if="branches.length > 1" class="gr-c gr-c--suc">
        <span>Sucursal</span>
        <v-select v-model="f.branch_id" :items="opcionesSucursal" item-title="t" item-value="v" density="comfortable" variant="outlined" hide-details />
      </label>
      <span class="gr-sep"></span>
      <label class="gr-c gr-c--pct"><span>IIBB</span><v-text-field v-model.number="p.iibb" type="number" min="0" suffix="%" density="comfortable" variant="outlined" hide-details /></label>
      <label class="gr-c gr-c--pct"><span>Recargo</span><v-text-field v-model.number="p.recargo" type="number" min="0" suffix="%" density="comfortable" variant="outlined" hide-details /></label>
      <label class="gr-c gr-c--pct"><span>Franquicia</span><v-text-field v-model.number="p.franquicia" type="number" min="0" max="100" suffix="%" density="comfortable" variant="outlined" hide-details /></label>
    </section>

    <v-alert v-if="error" type="error" variant="tonal" density="compact">{{ error }}</v-alert>

    <section class="gr-franja num">
      <div><span class="gr-lab">Vendido</span><b>{{ pesos(tot.vendido) }}</b><small>{{ fmt(tot.qty) }} unidades</small></div>
      <div><span class="gr-lab">Costo</span><b>{{ pesos(tot.costo) }}</b><small v-if="tot.qtyEstimada">{{ fmt(tot.qtyEstimada) }} con costo actual</small></div>
      <div class="gr-franja__dest"><span class="gr-lab">Ganancia bruta</span><b>{{ pesos(tot.bruta) }}</b><small v-if="tot.vendidoConCosto > 0">{{ pct(tot.bruta, tot.costo) }} sobre el costo</small></div>
      <div><span class="gr-lab">Franquicia {{ p.franquicia }} %</span><b>{{ pesos(tot.franquicia) }}</b></div>
      <div><span class="gr-lab">Local {{ 100 - p.franquicia }} %</span><b>{{ pesos(tot.local) }}</b></div>
    </section>

    <div v-if="tot.qtySinCosto > 0" class="gr-aviso">
      <v-icon size="20">mdi-alert-outline</v-icon>
      <span class="num"><b>{{ fmt(tot.qtySinCosto) }} de {{ fmt(tot.qty) }} unidades</b> vendidas ({{ pesos(tot.vendidoSinCosto) }}) son de productos sin costo cargado y no entran en la ganancia.</span>
      <router-link :to="{ name: 'products' }" class="gr-link">Cargar costos</router-link>
    </div>

    <section v-if="!f.branch_id && porSucursal.length > 1" class="gr-caja">
      <div class="gr-banda"><span>Por sucursal</span></div>
      <div class="gr-scroll">
        <table class="gr-tabla num">
          <thead><tr><th>Sucursal</th><th class="c-n">Vendido</th><th class="c-n">Costo</th><th class="c-n">Ganancia bruta</th><th class="c-n">Franquicia</th><th class="c-n">Local</th></tr></thead>
          <tbody>
            <tr v-for="s in porSucursal" :key="s.id">
              <td class="gr-b">{{ s.nombre }}</td>
              <td class="c-n">{{ pesos(s.vendido) }}</td>
              <td class="c-n">{{ pesos(s.costo) }}</td>
              <td class="c-n gr-b">{{ pesos(s.bruta) }}</td>
              <td class="c-n">{{ pesos(s.franquicia) }}</td>
              <td class="c-n">{{ pesos(s.local) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="gr-caja">
      <div class="gr-banda"><span>Por producto</span><small class="num">{{ porProducto.length }} productos</small></div>
      <v-progress-linear v-if="cargando" indeterminate color="primary" height="3" />
      <div class="gr-scroll">
        <table class="gr-tabla num">
          <thead>
            <tr><th>Producto</th><th class="c-q">Cant.</th><th class="c-n">Vendido</th><th class="c-n">Costo</th><th class="c-n">Ganancia bruta</th><th class="c-n">Franquicia</th><th class="c-n">Local</th></tr>
          </thead>
          <tbody>
            <tr v-for="r in porProducto" :key="r.id" :class="{ 'is-sin': r.sinCosto }">
              <td>
                <router-link v-if="r.id" :to="{ name: 'productView', params: { id: r.id } }" class="gr-prod">{{ r.nombre }}</router-link>
                <span v-else>{{ r.nombre }}</span>
                <small v-if="r.sku" class="gr-sku">{{ r.sku }}</small>
              </td>
              <td class="c-q">{{ fmt(r.qty) }}</td>
              <td class="c-n">{{ pesos(r.vendido) }}</td>
              <template v-if="r.sinCosto">
                <td colspan="4" class="gr-sincosto">sin costo cargado</td>
              </template>
              <template v-else>
                <td class="c-n">{{ pesos(r.costo) }}<i v-if="r.estimada" class="gr-est" title="Con el costo actual del producto">*</i></td>
                <td class="c-n gr-b" :class="{ 'gr-neg': r.bruta < 0 }">{{ pesos(r.bruta) }}</td>
                <td class="c-n">{{ pesos(r.franquicia) }}</td>
                <td class="c-n">{{ pesos(r.local) }}</td>
              </template>
            </tr>
            <tr v-if="!cargando && !porProducto.length"><td colspan="7" class="gr-vacio">Sin ventas en el período</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import http from "@/app/api/http";
import CampoFecha from "@/app/components/CampoFecha.vue";

const CLAVE = "pos360.reporte_ganancia.parametros";
const hoy = new Date();
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const f = reactive({ desde: iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta: iso(hoy), branch_id: null });
const p = reactive((() => {
  const base = { iibb: 3.5, recargo: 11, franquicia: 60 };
  try { return { ...base, ...JSON.parse(localStorage.getItem(CLAVE) || "{}") }; } catch { return base; }
})());
watch(p, (v) => { try { localStorage.setItem(CLAVE, JSON.stringify(v)); } catch { /* sin almacenamiento */ } }, { deep: true });

const filas = ref([]);
const branches = ref([]);
const cargando = ref(false);
const error = ref("");

const opcionesSucursal = computed(() => [{ t: "Todas", v: null }, ...branches.value.map((b) => ({ t: b.name, v: b.id }))]);

const n = (v) => Number(v || 0);
const pesos = (v) => `$ ${Math.round(n(v)).toLocaleString("es-AR")}`;
const fmt = (v) => n(v).toLocaleString("es-AR", { maximumFractionDigits: 2 });
const pct = (a, b) => (n(b) > 0 ? `${Math.round((n(a) / n(b)) * 100)} %` : "");

// La cuenta de la planilla, por fila (cada producto tiene su IVA).
function calcular(r) {
  const sinCosto = n(r.qty_sin_costo) >= n(r.qty) && n(r.qty) > 0;
  const neto = n(r.vendido) / (1 + n(r.tax_rate) / 100) / (1 + n(p.iibb) / 100) / (1 + n(p.recargo) / 100);
  const bruta = sinCosto ? 0 : neto - n(r.costo);
  const fr = Math.min(100, Math.max(0, n(p.franquicia))) / 100;
  return { sinCosto, bruta, franquicia: bruta * fr, local: bruta * (1 - fr), estimada: n(r.qty_estimada) > 0 };
}

const calculadas = computed(() => filas.value.map((r) => ({ ...r, ...calcular(r) })));

function sumar(lista) {
  const t = { qty: 0, vendido: 0, costo: 0, bruta: 0, franquicia: 0, local: 0, qtySinCosto: 0, vendidoSinCosto: 0, qtyEstimada: 0, vendidoConCosto: 0 };
  for (const r of lista) {
    t.qty += n(r.qty);
    t.vendido += n(r.vendido);
    if (r.sinCosto) { t.qtySinCosto += n(r.qty); t.vendidoSinCosto += n(r.vendido); continue; }
    t.costo += n(r.costo);
    t.bruta += r.bruta;
    t.franquicia += r.franquicia;
    t.local += r.local;
    t.vendidoConCosto += n(r.vendido);
    t.qtyEstimada += n(r.qty_estimada);
  }
  return t;
}

const tot = computed(() => sumar(calculadas.value));

const porProducto = computed(() => {
  const m = new Map();
  for (const r of calculadas.value) {
    const k = r.product_id || r.name;
    const a = m.get(k) || { id: r.product_id, nombre: r.name, sku: r.sku, items: [] };
    a.items.push(r);
    m.set(k, a);
  }
  return [...m.values()]
    .map((a) => {
      const t = sumar(a.items);
      return { id: a.id, nombre: a.nombre, sku: a.sku, qty: t.qty, vendido: t.vendido, costo: t.costo, bruta: t.bruta, franquicia: t.franquicia, local: t.local, sinCosto: t.qtySinCosto >= t.qty, estimada: t.qtyEstimada > 0 };
    })
    .sort((x, y) => y.vendido - x.vendido);
});

const porSucursal = computed(() => {
  const m = new Map();
  for (const r of calculadas.value) {
    const a = m.get(r.branch_id) || { id: r.branch_id, nombre: r.branch_name || "Sin sucursal", items: [] };
    a.items.push(r);
    m.set(r.branch_id, a);
  }
  return [...m.values()].map((a) => ({ id: a.id, nombre: a.nombre, ...sumar(a.items) })).sort((x, y) => y.vendido - x.vendido);
});

async function cargar() {
  cargando.value = true;
  error.value = "";
  try {
    const { data } = await http.get("/reports/ganancia", { params: { date_from: f.desde, date_to: f.hasta, branch_id: f.branch_id || undefined } });
    filas.value = data?.data?.rows || [];
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo cargar el reporte";
    filas.value = [];
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

watch(() => [f.desde, f.hasta, f.branch_id], cargar);
onMounted(() => { cargarSucursales(); cargar(); });
</script>

<style>
.gr {
  --gr-caja: #ffffff; --gr-borde: #d3dde7; --gr-linea: #e3eaf1; --gr-texto: #0f172a; --gr-suave: #5a6678; --gr-tenue: #94a3b8;
  --gr-banda: #0f6fae; --gr-banda-borde: #0d5f96; --gr-tinte: #eef7fd; --gr-hover: #f3f8fc;
  display: flex; flex-direction: column; gap: 14px; color: var(--gr-texto);
}
:is(.v-theme--dark, .v-theme--adminDark) .gr {
  --gr-caja: #151c25; --gr-borde: #253141; --gr-linea: #222c39; --gr-texto: #e5edf5; --gr-suave: #9aa8b8; --gr-tenue: #64748b;
  --gr-banda: #0f5f96; --gr-banda-borde: #0c4f7d; --gr-tinte: #12324b; --gr-hover: #1a2430;
}
.gr .num { font-variant-numeric: tabular-nums; }
.gr-filtros { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; padding: 14px 16px; border-radius: 12px; background: var(--gr-caja); border: 1px solid var(--gr-borde); }
.gr-c { display: flex; flex-direction: column; gap: 6px; width: 170px; }
.gr-c--suc { width: 210px; }
.gr-c--pct { width: 110px; }
.gr-c > span { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--gr-suave); }
.gr-sep { width: 1px; align-self: stretch; background: var(--gr-linea); margin: 0 4px; }
.gr-franja { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); border-radius: 12px; overflow: hidden; background: var(--gr-caja); border: 1px solid var(--gr-borde); }
.gr-franja > div { display: flex; flex-direction: column; gap: 2px; padding: 14px 16px; border-left: 1px solid var(--gr-linea); min-width: 0; }
.gr-franja > div:first-child { border-left: 0; }
.gr-franja b { font-size: 24px; font-weight: 900; letter-spacing: -0.02em; }
.gr-franja small { font-size: 12px; color: var(--gr-suave); font-weight: 600; }
.gr-franja__dest { background: var(--gr-tinte); }
.gr-lab { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--gr-suave); }
.gr-aviso { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; background: #fff4e5; border: 1px solid #f5c98a; color: #8a4b0f; font-size: 14px; }
:is(.v-theme--dark, .v-theme--adminDark) .gr-aviso { background: #3a2a12; border-color: #7a5a22; color: #f5c98a; }
.gr-aviso .v-icon { color: inherit; }
.gr-aviso span { flex: 1; }
.gr-link { font-weight: 800; color: var(--gr-banda); text-decoration: none; white-space: nowrap; }
:is(.v-theme--dark, .v-theme--adminDark) .gr-link { color: #5aaee0; }
.gr-link:hover { text-decoration: underline; }
.gr-caja { border-radius: 12px; overflow: hidden; background: var(--gr-caja); border: 1px solid var(--gr-borde); }
.gr-banda { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--gr-banda); color: #ffffff; font-size: 15px; font-weight: 800; }
.gr-banda small { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.85); }
.gr-scroll { overflow-x: auto; }
.gr-tabla { width: 100%; border-collapse: collapse; min-width: 820px; }
.gr-tabla th { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; color: var(--gr-suave); background: var(--gr-hover); text-align: left; padding: 10px 12px; border: 1px solid var(--gr-linea); border-top: 0; }
.gr-tabla td { padding: 9px 12px; border: 1px solid var(--gr-linea); font-size: 14px; vertical-align: middle; }
.gr-tabla th:first-child, .gr-tabla td:first-child { border-left: 0; }
.gr-tabla th:last-child, .gr-tabla td:last-child { border-right: 0; }
.gr-tabla tbody tr:hover td { background: var(--gr-hover); }
.gr-tabla .c-n { text-align: right; width: 140px; white-space: nowrap; }
.gr-tabla .c-q { text-align: right; width: 70px; }
.gr-b { font-weight: 800; }
.gr-prod { font-weight: 700; color: var(--gr-texto); text-decoration: none; }
.gr-prod:hover { text-decoration: underline; }
.gr-sku { display: block; font-size: 12px; color: var(--gr-suave); }
.gr-sincosto { text-align: center; font-size: 13px; font-weight: 700; color: var(--gr-tenue); font-style: italic; }
.gr-tabla tr.is-sin td { color: var(--gr-suave); }
.gr-est { font-style: normal; color: #b45309; margin-left: 2px; }
.gr-neg { color: #c2413a; }
.gr-vacio { text-align: center; padding: 30px !important; color: var(--gr-suave); font-weight: 600; }
@media (max-width: 900px) { .gr-franja { grid-template-columns: 1fr 1fr; } }
</style>
