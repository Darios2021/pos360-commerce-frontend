<!-- src/modules/service/pages/ServiceOrdersListPage.vue
     Listado del taller. Punto de entrada del servicio tecnico.

     Lienzo aprobado (artboard «4 · Listado del taller»):
     https://claude.ai/artifact/Qee3bS6R5sweKECTbrDm5K

     Las tarjetas de arriba SON los filtros (un estado no es una seccion: es un
     filtro), y cada una cuenta con el mismo where que filtra en la API
     (`whereGrupo` en service.controller.js). Las ordenes del libro viejo
     entran en las vistas si siguen abiertas, y al buscar. -->
<template>
  <div class="sv">
    <div class="sv-cabecera" style="align-items: center">
      <h1 class="sv-h1">Servicio técnico</h1>
      <div class="d-flex ga-2 flex-wrap">
        <v-btn v-if="auth.isAdmin" variant="text" size="large" :to="{ name: 'serviceTechnicians' }">Técnicos</v-btn>
        <v-btn color="primary" variant="flat" size="large" prepend-icon="mdi-plus" :to="{ name: 'serviceIntake' }">Recibir equipo</v-btn>
      </div>
    </div>

    <div class="vistas">
      <button
        v-for="v in VISTAS"
        :key="v.value"
        type="button"
        class="vista"
        :class="{ on: vista === v.value && !q }"
        :aria-pressed="vista === v.value && !q"
        @click="elegirVista(v.value)"
      >
        <span class="vista-titulo" :style="{ color: v.color }">{{ v.label }}</span>
        <span class="vista-numero">{{ statsCargando ? "…" : grupos[v.value] ?? 0 }}</span>
      </button>
    </div>

    <div class="d-flex align-center ga-3 flex-wrap">
      <div class="buscar">
        <v-icon size="20" class="sv-suave">mdi-magnify</v-icon>
        <input
          v-model="q"
          aria-label="Buscar"
          placeholder="Cliente, teléfono, equipo, IMEI o número de orden (también los del libro)"
          @input="buscarConDemora"
        />
        <v-btn v-if="q" icon="mdi-close" size="x-small" variant="text" aria-label="Borrar búsqueda" @click="limpiarBusqueda" />
      </div>
      <div class="sv-segmentado" role="group" aria-label="De quién">
        <button v-for="a in AMBITOS" :key="a.value" type="button" :class="{ on: ambito === a.value }" @click="elegirAmbito(a.value)">{{ a.label }}</button>
      </div>
    </div>

    <div class="tabla">
      <div class="tabla-fila tabla-cabeza">
        <span>Orden</span><span>Equipo y falla</span><span>Cliente</span><span>Técnico</span><span>Estado</span>
        <span class="text-right">Días</span><span class="text-right">Saldo</span>
      </div>

      <div v-if="cargando" class="tabla-vacia">Cargando…</div>
      <div v-else-if="!items.length" class="tabla-vacia">
        <template v-if="q">Sin resultados para «{{ q }}».</template>
        <template v-else-if="ambito === 'mios'">Sin equipos derivados en esta vista.</template>
        <template v-else>No hay equipos en esta vista.</template>
      </div>

      <template v-else>
        <router-link
          v-for="o in items"
          :key="o.id"
          :to="{ name: 'serviceOrderEdit', params: { id: o.id } }"
          class="tabla-fila"
        >
          <span class="font-weight-bold" :class="{ 'sv-suave': !o.number }">{{ o.numero_visible }}</span>
          <span class="celda">
            <span class="d-block font-weight-bold text-truncate">{{ equipoDe(o) }}</span>
            <span class="d-block text-body-2 sv-suave text-truncate">{{ o.reported_fault || "—" }}</span>
          </span>
          <span class="celda">
            <span class="d-block text-truncate">{{ o.customer_name }}</span>
            <span class="d-block text-body-2 sv-suave">{{ o.customer_phone || "" }}</span>
          </span>
          <span class="text-body-2 text-truncate" :class="{ 'text-warning': !o.technician_name }">{{ o.technician_name || "Sin derivar" }}</span>
          <span><span :class="['sv-estado', `sv-estado--${statusColor(o.status)}`]">{{ statusLabel(o.status) }}</span></span>
          <span class="text-right text-body-2" :class="{ 'text-error font-weight-bold': o.status !== 'entregado' && dias(o) >= 7 }">{{ diasTexto(o) }}</span>
          <span class="text-right" :class="saldo(o) > 0 ? 'font-weight-bold text-warning' : 'sv-suave'">{{ saldo(o) > 0 ? money(saldo(o)) : "—" }}</span>
        </router-link>
      </template>
    </div>

    <div class="d-flex align-center justify-space-between flex-wrap ga-3">
      <div class="text-body-2 sv-suave">
        {{ total }} orden{{ total === 1 ? "" : "es" }}<template v-if="!q"> · las del libro viejo salen al buscar por teléfono, nombre o número</template>
      </div>
      <v-pagination v-if="paginas > 1" v-model="pagina" :length="paginas" density="comfortable" total-visible="5" @update:model-value="cargar" />
    </div>

    <v-snackbar v-model="aviso.show" :color="aviso.color" timeout="3500">{{ aviso.text }}</v-snackbar>
  </div>
</template>

<script setup>
import "../styles/servicio.css";
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/app/store/auth.store";
import { listOrders, getOrderStats, statusLabel, statusColor } from "../services/service.service";

const auth = useAuthStore();

const VISTAS = [
  { value: "taller", label: "En el taller", color: "rgb(var(--v-theme-primary))" },
  { value: "listos", label: "Listos para entregar", color: "rgb(var(--v-theme-success))" },
  { value: "aprobacion", label: "Esperan aprobación", color: "rgb(var(--v-theme-warning))" },
  { value: "sin_retirar", label: "Sin retirar (+15 días)", color: "rgb(var(--v-theme-error))" },
];
const AMBITOS = [
  { value: "todos", label: "Todos" },
  { value: "mios", label: "Mis equipos" },
  { value: "sin_derivar", label: "Sin derivar" },
];

const items = ref([]);
const total = ref(0);
const paginas = ref(1);
const pagina = ref(1);
const cargando = ref(false);

const vista = ref("taller");
const ambito = ref("todos");
const q = ref("");

const grupos = ref({});
const statsCargando = ref(false);

const aviso = ref({ show: false, text: "", color: "success" });
function notificar(text, color = "success") {
  aviso.value = { show: true, text, color };
}

const money = (v) =>
  Number(v || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const equipoDe = (o) => [o.device_brand, o.device_model].filter(Boolean).join(" ") || "Equipo";
const saldo = (o) => (o.status === "entregado" ? 0 : Number(o.balance || 0));

function dias(o) {
  if (!o.created_at) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(o.created_at).getTime()) / 86400000));
}
const diasTexto = (o) => (o.status === "entregado" ? "—" : String(dias(o)));

function params() {
  const p = { page: pagina.value, limit: 25 };
  // Buscar es en todo: el cliente que vuelve con el papel no sabe en que
  // vista esta su equipo.
  if (q.value.trim()) p.q = q.value.trim();
  else p.grupo = vista.value;
  if (ambito.value === "mios") p.mios = 1;
  if (ambito.value === "sin_derivar") p.sin_derivar = 1;
  return p;
}

async function cargar() {
  cargando.value = true;
  try {
    const { data } = await listOrders(params());
    items.value = data?.data || [];
    total.value = data?.meta?.total || 0;
    paginas.value = data?.meta?.pages || 1;
  } catch (e) {
    notificar(e?.response?.data?.message || "No se pudo cargar el listado.", "error");
    items.value = [];
  } finally {
    cargando.value = false;
  }
}

async function cargarStats() {
  statsCargando.value = true;
  try {
    const { data } = await getOrderStats(ambito.value === "mios" ? { mios: 1 } : {});
    grupos.value = data?.data?.grupos || {};
  } catch {
    // Las tarjetas informan: si fallan, el listado sigue sirviendo.
  } finally {
    statsCargando.value = false;
  }
}

function elegirVista(v) {
  vista.value = v;
  q.value = "";
  pagina.value = 1;
  cargar();
}

function elegirAmbito(a) {
  ambito.value = a;
  pagina.value = 1;
  cargar();
  cargarStats();
}

let demora = null;
function buscarConDemora() {
  clearTimeout(demora);
  demora = setTimeout(() => {
    pagina.value = 1;
    cargar();
  }, 350);
}

function limpiarBusqueda() {
  q.value = "";
  pagina.value = 1;
  cargar();
}

onMounted(() => {
  cargar();
  cargarStats();
});
</script>

<style scoped>
.vistas {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 760px) {
  .vistas {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.vista {
  text-align: left;
  padding: 14px 18px;
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  color: rgb(var(--v-theme-on-surface));
  font: inherit;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.vista.on {
  background: rgba(var(--v-theme-primary), 0.14);
  border: 2px solid rgb(var(--v-theme-primary));
}
.vista-titulo {
  font-size: 14px;
  font-weight: 600;
}
.vista-numero {
  font-size: 30px;
  font-weight: 800;
  line-height: 1.2;
}

.buscar {
  flex: 1 1 320px;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 46px;
  padding: 0 10px 0 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
}
.buscar input {
  flex-grow: 1;
  min-width: 0;
  background: transparent;
  border: 0;
  outline: none;
  color: rgb(var(--v-theme-on-surface));
  font: inherit;
  font-size: 15px;
}

.tabla {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 16px;
  overflow-x: auto;
}
.tabla-fila {
  display: grid;
  grid-template-columns: 130px minmax(160px, 1.4fr) minmax(150px, 1.2fr) 140px 170px 60px 110px;
  gap: 12px;
  align-items: center;
  padding: 12px 20px;
  min-width: 920px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  color: rgb(var(--v-theme-on-surface));
  text-decoration: none;
}
a.tabla-fila:hover {
  background: rgba(var(--v-theme-primary), 0.06);
}
.tabla-cabeza {
  border-top: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.66);
}
.celda {
  min-width: 0;
}
.tabla-vacia {
  padding: 40px 20px;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.66);
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
