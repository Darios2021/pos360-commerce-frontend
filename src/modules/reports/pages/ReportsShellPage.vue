<!-- src/modules/reports/pages/ReportsShellPage.vue -->
<!-- Reportes (maqueta aprobada 10/10): título y la elección del reporte; cada
     reporte trae su período y sucursal. Ventas y Productos comparten filtros. -->
<template>
  <div class="sp rp">
    <div class="sp-cab rp-cab">
      <div class="sp-cab__txt"><h1 class="sp-cab__titulo">Reportes</h1></div>
      <div class="rp-tabs" role="tablist">
        <button v-for="t in TABS" :key="t.v" type="button" role="tab" :aria-selected="vista === t.v" :class="{ 'is-on': vista === t.v }" @click="elegir(t.v)">
          <v-icon size="19">{{ t.i }}</v-icon>{{ t.t }}
        </button>
      </div>
    </div>

    <ReportsGananciaPage v-if="vista === 'ganancia'" />
    <ReportsVentasPage v-else :key="vista" :vista="vista" />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import ReportsVentasPage from "./ReportsVentasPage.vue";
import ReportsGananciaPage from "./ReportsGananciaPage.vue";
import "@/modules/products/styles/proveedores.css";

const TABS = [
  { v: "ventas", t: "Ventas", i: "mdi-cash-multiple" },
  { v: "productos", t: "Productos", i: "mdi-package-variant" },
  { v: "ganancia", t: "Ganancia y reparto", i: "mdi-chart-pie" },
];

const route = useRoute();
const router = useRouter();
const vista = computed(() => (TABS.some((t) => t.v === route.query.vista) ? route.query.vista : "ventas"));
function elegir(v) {
  router.replace({ query: { ...route.query, vista: v === "ventas" ? undefined : v } });
}
</script>

<style>
.sp.rp > * { max-width: 1440px; }
.rp-cab { align-items: center; flex-wrap: wrap; }
.rp-tabs { display: flex; gap: 4px; padding: 4px; border-radius: 12px; background: var(--sp-caja); border: 1px solid var(--sp-borde); flex-wrap: wrap; }
.rp-tabs button { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 16px; border: 0; border-radius: 10px; background: transparent; font: 800 15px Inter, sans-serif; color: var(--sp-texto); cursor: pointer; white-space: nowrap; }
.rp-tabs button .v-icon { color: inherit; opacity: .8; }
.rp-tabs button:hover:not(.is-on) { background: #cfe5f5; }
:is(.v-theme--dark, .v-theme--adminDark) .rp-tabs button:hover:not(.is-on) { background: #1a2a3a; }
.rp-tabs button.is-on { background: #0f6fae; color: #ffffff; }
@media (max-width: 600px) { .rp-tabs { width: 100%; } .rp-tabs button { flex: 1; justify-content: center; padding: 0 10px; } .rp-tabs button .v-icon { display: none; } }
</style>
