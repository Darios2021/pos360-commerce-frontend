<!--
  Inicio del teléfono como cargador (maqueta diseno-cargador, "inicio"):
  derivaciones por recibir, accesos (Nueva derivación, Conteo, Nuevo
  producto para el dueño, Vender), últimas lecturas de hoy y pendientes,
  cada uno al listado filtrado.
-->
<template>
  <div class="ic m-vista">
    <div v-if="porRecibir.length" class="m-pz">
      <div class="m-pz-h"><h3>Por recibir</h3><span class="num">{{ porRecibir.length === 1 ? "1 derivación" : `${porRecibir.length} derivaciones` }}</span></div>
      <router-link v-for="t in porRecibir.slice(0, 3)" :key="t.id" :to="{ name: 'derivRecibir', params: { id: t.id } }" class="m-it">
        <span class="m-ico"><v-icon size="20">mdi-truck-outline</v-icon></span>
        <span class="tx"><b class="num">{{ t.number }}</b><small>{{ [`Desde ${origenDe(t)}`, cuando(t.dispatched_at)].filter(Boolean).join(" · ") }}</small></span>
        <span class="der"><b v-if="unidades[t.id] != null" class="num">{{ u(unidades[t.id]) }}</b></span>
        <v-icon size="20" class="chev">mdi-chevron-right</v-icon>
      </router-link>
    </div>

    <div class="m-accesos" :class="{ impar: accesos.length % 2 }">
      <button v-for="a in accesos" :key="a.k" type="button" class="m-acc" @click="a.ir()">
        <span class="m-ico"><v-icon size="20">{{ a.icon }}</v-icon></span>
        <b>{{ a.t }}</b>
      </button>
    </div>

    <div v-if="lecturas.length" class="m-pz">
      <div class="m-pz-h"><h3>Últimas lecturas</h3><span>Hoy</span></div>
      <router-link v-for="l in lecturas.slice(0, 4)" :key="l.id" :to="{ name: 'productoConsulta', params: { id: l.id } }" class="m-it">
        <Miniatura :src="l.image || ''" />
        <span class="tx"><b>{{ l.name }}</b><small class="num">{{ [hora(l.at), l.code].filter(Boolean).join(" · ") }}</small></span>
        <span class="der"><b class="num">{{ pesos(l.price) }}</b><small>{{ l.stock > 0 ? u(l.stock) : "Sin stock" }}</small></span>
      </router-link>
    </div>

    <div v-if="pendientes.length" class="m-pz">
      <div class="m-pz-h"><h3>Pendientes</h3></div>
      <router-link v-for="p in pendientes" :key="p.k" :to="p.to" class="m-it">
        <span class="tx"><b>{{ p.t }}</b></span>
        <span class="der"><b class="num">{{ cant(p.n) }}</b></span>
        <v-icon size="20" class="chev">mdi-chevron-right</v-icon>
      </router-link>
    </div>
    <MovilAviso />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import http from "@/app/api/http";
import MovilAviso from "@/app/components/movil/MovilAviso.vue";
import Miniatura from "./Miniatura.vue";
import { useAuthStore } from "@/app/store/auth.store";
import { useTransferNotifications } from "@/modules/dashboard/composables/useTransferNotifications";
import { listTransfers } from "@/modules/dashboard/service/stockTransfer.api";
import { cant, cuando, hora, pesos, u } from "../lib/formato";
import { origenDe, traerDerivacion, unidadesEnviadas } from "../lib/derivaciones";
import { lecturasDeHoy, lecturas as todas } from "../state/lecturas";
import { nuevaDerivacion } from "../state/derivacion";

const router = useRouter();
const auth = useAuthStore();
const esAdmin = computed(() => auth.isAdmin === true);

const { pendingForMe } = useTransferNotifications();
// Sólo las que vienen a la sucursal del usuario (el composable le da todas al admin).
const porRecibir = computed(() => pendingForMe.value.filter((t) => Number(t.to_branch_id) === Number(auth.branchId || 0)));
const unidades = reactive({});
watch(porRecibir, async (lista) => {
  for (const t of lista.slice(0, 3)) {
    if (t.units_total != null) { unidades[t.id] = t.units_total; continue; } // del listado
    if (unidades[t.id] != null) continue;
    try { unidades[t.id] = unidadesEnviadas(await traerDerivacion(t.id)); } catch { /* sin unidades */ }
  }
}, { immediate: true });

const lecturas = computed(() => { void todas.items; return lecturasDeHoy(); });

const accesos = computed(() => [
  { k: "der", t: "Nueva derivación", icon: "mdi-swap-horizontal", ir: () => { nuevaDerivacion(); router.push({ name: "derivNueva" }); } },
  { k: "con", t: "Conteo", icon: "mdi-clipboard-check-outline", ir: () => router.push({ name: "conteo" }) },
  ...(esAdmin.value ? [{ k: "pro", t: "Nuevo producto", icon: "mdi-plus", ir: () => router.push({ name: "productNew" }) }] : []),
  { k: "ven", t: "Vender", icon: "mdi-cash-register", ir: () => router.push({ name: "pos" }) },
]);

const sinStock = ref(0);
const borradores = ref(0);
const sucursal = computed(() => (auth.branches || []).find((b) => Number(b.id) === Number(auth.branchId))?.name || "");
const pendientes = computed(() => [
  { k: "sin", t: sucursal.value ? `Sin stock en ${sucursal.value}` : "Sin stock", n: sinStock.value, to: { name: "products", query: { stock: "without" } } },
  { k: "bor", t: "Derivaciones en borrador", n: borradores.value, to: { name: "transfers", query: { estado: "draft" } } },
].filter((p) => p.n > 0));

onMounted(async () => {
  try {
    const { data } = await http.get("/products/stats", { params: auth.branchId ? { branch_id: auth.branchId } : {} });
    sinStock.value = Number(data?.data?.without_stock || 0);
  } catch { sinStock.value = 0; }
  try {
    const { data } = await listTransfers({ status: "draft", limit: 1, page: 1 });
    borradores.value = Number(data?.count_by_status?.draft ?? data?.total ?? 0);
  } catch { borradores.value = 0; }
});
</script>

<style scoped>
.ic { display: flex; flex-direction: column; gap: 12px; background: transparent; }
</style>
