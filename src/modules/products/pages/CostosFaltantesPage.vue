<!-- src/modules/products/pages/CostosFaltantesPage.vue -->
<!-- Costos faltantes (maqueta aprobada 10/10): los productos vendidos en el
     período que no tienen costo, ordenados por lo vendido, para cargarlos de
     corrido. Un solo botón guarda todos los que se completaron. -->
<template>
  <div class="sp cf-pg">
    <div class="sp-cab">
      <div class="sp-cab__txt">
        <router-link :to="{ name: 'reports' }" class="se-volver"><v-icon size="18">mdi-chevron-left</v-icon>Reportes</router-link>
        <h1 class="sp-cab__titulo">Costos faltantes</h1>
        <span class="sp-cab__sub num">{{ cargando ? "Buscando…" : `${filas.length} ${filas.length === 1 ? "producto vendido" : "productos vendidos"} sin costo · ordenados por lo vendido` }}</span>
      </div>
      <v-btn color="primary" variant="flat" class="sp-nuevo" :loading="guardando" :disabled="!completos.length" @click="guardar">
        {{ completos.length ? `Guardar ${completos.length} ${completos.length === 1 ? "costo" : "costos"}` : "Guardar costos" }}
      </v-btn>
    </div>

    <div class="cf-filtros">
      <label><span>Vendidos desde</span><CampoFecha v-model="desde" :clearable="false" /></label>
      <label><span>Hasta</span><CampoFecha v-model="hasta" :clearable="false" /></label>
      <span v-if="dolar" class="cf-dolar num">Dólar oficial $ {{ dolar.toLocaleString("es-AR") }}</span>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact">{{ error }}</v-alert>

    <div class="sp-caja">
      <v-progress-linear v-if="cargando" indeterminate color="primary" height="3" />
      <div class="sp-tabla-scroll">
        <table class="sp-tabla cf-tabla">
          <thead>
            <tr><th>Producto</th><th class="c-v">Vendido</th><th class="c-m">Moneda</th><th class="c-c">Costo</th></tr>
          </thead>
          <tbody>
            <tr v-for="r in filas" :key="r.id" :class="{ 'is-ok': r.guardado }">
              <td>
                <router-link :to="{ name: 'productView', params: { id: r.id } }" class="sp-nombre">{{ r.nombre }}</router-link>
                <span class="sp-s cf-sku">{{ r.sku }}</span>
              </td>
              <td class="c-v num">{{ pesos(r.vendido) }}</td>
              <td class="c-m">
                <div class="cf-seg">
                  <button type="button" :class="{ 'is-on': !r.usd }" @click="r.usd = false">$</button>
                  <button type="button" :class="{ 'is-on': r.usd }" @click="r.usd = true">US$</button>
                </div>
              </td>
              <td class="c-c">
                <span v-if="r.guardado" class="cf-guardado num"><v-icon size="18">mdi-check</v-icon>{{ r.usd ? "US$" : "$" }} {{ Number(r.costo).toLocaleString("es-AR") }}</span>
                <CampoPlata v-else v-model="r.costo" :moneda="r.usd ? 'USD' : 'ARS'" hide-details placeholder="" />
              </td>
            </tr>
            <tr v-if="!cargando && !filas.length">
              <td colspan="4" class="sp-vacio">Todos los productos vendidos en el período tienen costo</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <v-snackbar v-model="aviso.open" :timeout="2600">{{ aviso.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import http from "@/app/api/http";
import CampoFecha from "@/app/components/CampoFecha.vue";
import CampoPlata from "@/app/components/CampoPlata.vue";
import { fetchOfficialUsdRate } from "@/modules/budgets/services/fx.service";
import "../styles/proveedores.css";

const route = useRoute();
const hoy = new Date();
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const desde = ref(String(route.query.desde || iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1))));
const hasta = ref(String(route.query.hasta || iso(hoy)));

const filas = ref([]);
const cargando = ref(false);
const guardando = ref(false);
const error = ref("");
const dolar = ref(null);
const aviso = reactive({ open: false, text: "" });

const pesos = (v) => `$ ${Math.round(Number(v || 0)).toLocaleString("es-AR")}`;
const completos = computed(() => filas.value.filter((r) => !r.guardado && Number(r.costo) > 0));

async function cargar() {
  cargando.value = true;
  error.value = "";
  try {
    const { data } = await http.get("/reports/ganancia", { params: { date_from: desde.value, date_to: hasta.value } });
    const m = new Map();
    for (const r of data?.data?.rows || []) {
      if (!r.product_id || !(Number(r.qty_sin_costo) > 0)) continue;
      const a = m.get(r.product_id) || { id: r.product_id, nombre: r.name, sku: r.sku, vendido: 0, usd: false, costo: null, guardado: false };
      a.vendido += Number(r.vendido || 0);
      m.set(r.product_id, a);
    }
    filas.value = [...m.values()].sort((x, y) => y.vendido - x.vendido);
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudieron cargar los productos";
    filas.value = [];
  } finally {
    cargando.value = false;
  }
}

async function guardar() {
  const lista = completos.value;
  if (!lista.length || guardando.value) return;
  guardando.value = true;
  error.value = "";
  try {
    let fx = null;
    if (lista.some((r) => r.usd)) {
      fx = dolar.value || (await fetchOfficialUsdRate())?.rate || null;
      if (!(fx > 0)) throw new Error("No se pudo traer la cotización del dólar");
      dolar.value = fx;
    }
    await http.post("/products/costs", {
      items: lista.map((r) => ({ id: r.id, cost: Number(r.costo), cost_currency: r.usd ? "USD" : null, fx_rate: r.usd ? fx : null })),
    });
    for (const r of lista) r.guardado = true;
    aviso.text = `${lista.length} ${lista.length === 1 ? "costo guardado" : "costos guardados"}`;
    aviso.open = true;
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudieron guardar los costos";
  } finally {
    guardando.value = false;
  }
}

watch([desde, hasta], cargar);
onMounted(async () => {
  cargar();
  try { dolar.value = (await fetchOfficialUsdRate())?.rate || null; } catch { dolar.value = null; }
});
</script>

<style>
.cf-filtros { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
.cf-filtros label { display: flex; flex-direction: column; gap: 6px; width: 170px; }
.cf-filtros label span { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--sp-suave); }
.cf-dolar { margin-left: auto; font-size: 14px; font-weight: 700; color: var(--sp-suave); padding-bottom: 12px; }
.cf-tabla .c-v { width: 160px; text-align: right; }
.cf-tabla .c-m { width: 130px; }
.cf-tabla .c-c { width: 220px; }
.cf-tabla tbody tr { cursor: default; }
.cf-sku { display: block; }
.cf-seg { display: flex; height: 42px; padding: 3px; gap: 3px; border-radius: 10px; border: 1px solid var(--sp-borde); box-sizing: border-box; }
.cf-seg button { flex: 1; border: 0; border-radius: 8px; background: transparent; font: 800 14px Inter, sans-serif; color: var(--sp-texto); cursor: pointer; }
.cf-seg button.is-on { background: #0f6fae; color: #ffffff; }
.cf-guardado { display: inline-flex; align-items: center; gap: 6px; font-weight: 800; color: #1f7a5f; }
.cf-guardado .v-icon { color: #2e9e7b; }
.cf-tabla tr.is-ok td { background: rgba(46, 158, 123, 0.06); }
:is(.v-theme--dark, .v-theme--adminDark) .cf-guardado { color: #6ee7b7; }
</style>
