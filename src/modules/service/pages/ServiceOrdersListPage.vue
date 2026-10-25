<!-- src/modules/service/pages/ServiceOrdersListPage.vue
     Listado de ordenes de servicio tecnico. Punto de entrada del taller.

     Reemplaza la hoja Datos del libro SERV_TEC.xlsm. Las tarjetas de arriba
     responden las dos preguntas que en el Excel habia que contar a mano:
     cuantos equipos hay en el taller ahora y cuantos estan listos esperando
     que el cliente los venga a buscar. -->
<template>
  <div class="pa-4">
    <AppPageHeader icon="mdi-tools" title="Servicio tecnico">
      <v-btn
        v-if="auth.isAdmin"
        variant="text"
        prepend-icon="mdi-account-wrench-outline"
        :to="{ name: 'serviceTechnicians' }"
      >
        Tecnicos
      </v-btn>
      <v-btn color="primary" prepend-icon="mdi-plus" :loading="creando" @click="onRecibir">
        Recibir equipo
      </v-btn>
    </AppPageHeader>

    <v-row class="mb-2" dense>
      <v-col cols="12" sm="6" md="3">
        <KpiCard
          title="En el taller"
          :value="String(stats.en_taller)"
          :loading="statsLoading"
          icon="mdi-wrench-outline"
          tone="primary"
          sub="Recibidos, en diagnostico o en reparacion"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <KpiCard
          title="Listos para entregar"
          :value="String(stats.para_entregar)"
          :loading="statsLoading"
          icon="mdi-package-variant-closed-check"
          :tone="stats.para_entregar > 0 ? 'success' : 'primary'"
          sub="Reparados, esperando al cliente"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <KpiCard
          title="Sin retirar"
          :value="String(stats.sin_retirar)"
          :loading="statsLoading"
          icon="mdi-clock-alert-outline"
          :tone="stats.sin_retirar > 0 ? 'warning' : 'success'"
          sub="Hace rato que estan listos"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <KpiCard
          title="Ordenes"
          :value="String(stats.total)"
          :loading="statsLoading"
          icon="mdi-clipboard-list-outline"
          tone="indigo"
          :sub="historico ? 'Incluye el libro viejo' : 'Serie nueva del sistema'"
        />
      </v-col>
    </v-row>

    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <div class="text-caption text-medium-emphasis">
        {{ total }} orden{{ total === 1 ? "" : "es" }} en la lista
      </div>

      <v-spacer />

      <v-text-field
        v-model="q"
        density="compact"
        variant="outlined"
        hide-details
        clearable
        placeholder="Cliente, telefono, equipo, IMEI o numero de orden"
        prepend-inner-icon="mdi-magnify"
        style="max-width: 380px"
        @update:model-value="buscarConDemora"
        @click:clear="cargar"
      />

      <v-select
        v-model="estado"
        :items="itemsEstado"
        density="compact"
        variant="outlined"
        hide-details
        clearable
        placeholder="Estado"
        style="max-width: 220px"
        @update:model-value="cargar"
      />

      <!-- La cola del tecnico: lo que le derivaron a quien mira. -->
      <v-switch
        v-model="mios"
        color="primary"
        density="compact"
        hide-details
        label="Mis equipos"
        @update:model-value="cargar"
      />

      <!-- Las 645 ordenes del Excel estan pero no molestan: solo aparecen si
           se las pide. En el mostrador se busca por telefono y salen igual. -->
      <v-switch
        v-model="historico"
        color="primary"
        density="compact"
        hide-details
        label="Incluir libro viejo"
        @update:model-value="cargar"
      />
    </div>

    <v-card variant="flat" border rounded="lg">
      <v-table density="comfortable">
        <thead>
          <tr>
            <th>Orden</th>
            <th>Ingreso</th>
            <th>Cliente</th>
            <th>Equipo</th>
            <th>Falla</th>
            <th>Estado</th>
            <th>Tecnico</th>
            <th class="text-right">Presupuesto</th>
            <th class="text-right">Saldo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargando">
            <td colspan="9" class="text-center py-8 text-medium-emphasis">Cargando…</td>
          </tr>
          <tr v-else-if="!items.length">
            <td colspan="9" class="text-center py-8 text-medium-emphasis">
              <template v-if="mios && !q && !estado">Sin equipos derivados.</template>
              <template v-else-if="q || estado || mios">Sin resultados con ese filtro.</template>
              <template v-else>Todavia no hay ordenes. Empeza recibiendo un equipo.</template>
            </td>
          </tr>
          <tr
            v-for="o in items"
            :key="o.id"
            class="fila"
            @click="abrir(o)"
          >
            <td class="text-no-wrap">
              <span :class="{ 'text-medium-emphasis': !o.number }">{{ o.numero_visible }}</span>
            </td>
            <td class="text-no-wrap">{{ fecha(o.created_at) }}</td>
            <td>
              <div>{{ o.customer_name }}</div>
              <div v-if="o.customer_phone" class="text-caption text-medium-emphasis">
                {{ o.customer_phone }}
              </div>
            </td>
            <td>{{ [o.device_brand, o.device_model].filter(Boolean).join(" ") || "—" }}</td>
            <td class="falla">{{ o.reported_fault || "—" }}</td>
            <td>
              <v-chip size="small" :color="statusColor(o.status)" variant="tonal">
                <v-icon start size="14">{{ statusIcon(o.status) }}</v-icon>
                {{ statusLabel(o.status) }}
              </v-chip>
            </td>
            <td class="text-no-wrap">
              <span v-if="o.technician_name">{{ o.technician_name }}</span>
              <span v-else class="text-medium-emphasis">Sin derivar</span>
            </td>
            <td class="text-right text-no-wrap">{{ money(o.quoted_amount) }}</td>
            <td class="text-right text-no-wrap">
              <span :class="Number(o.balance) > 0 ? 'text-warning font-weight-medium' : 'text-medium-emphasis'">
                {{ money(o.balance) }}
              </span>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <div v-if="paginas > 1" class="d-flex justify-center mt-4">
      <v-pagination v-model="pagina" :length="paginas" density="comfortable" @update:model-value="cargar" />
    </div>

    <v-snackbar v-model="aviso.show" :color="aviso.color" timeout="3500">{{ aviso.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/app/store/auth.store";
import AppPageHeader from "@/app/components/AppPageHeader.vue";
import KpiCard from "@/modules/dashboard/components/KpiCard.vue";
import {
  listOrders,
  getOrderStats,
  createOrder,
  SERVICE_STATUS,
  statusLabel,
  statusColor,
  statusIcon,
} from "../services/service.service";
import { fmtFecha } from "../utils/fechas";

const router = useRouter();
const auth = useAuthStore();

const items = ref([]);
const total = ref(0);
const paginas = ref(1);
const pagina = ref(1);
const cargando = ref(false);
const creando = ref(false);

const q = ref("");
const estado = ref(null);
const historico = ref(false);
const mios = ref(false);

const statsLoading = ref(false);
const stats = ref({ total: 0, en_taller: 0, para_entregar: 0, sin_retirar: 0 });

const aviso = ref({ show: false, text: "", color: "success" });
function notificar(text, color = "success") {
  aviso.value = { show: true, text, color };
}

const itemsEstado = computed(() =>
  SERVICE_STATUS.map((s) => ({ title: s.label, value: s.value }))
);

function money(v) {
  const n = Number(v || 0);
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

const fecha = (v) => fmtFecha(v, "—");

function params() {
  const p = { page: pagina.value, limit: 20 };
  if (q.value) p.q = q.value;
  if (estado.value) p.status = estado.value;
  if (historico.value) p.incluir_historico = 1;
  if (mios.value) p.mios = 1;
  return p;
}

let demora = null;
function buscarConDemora() {
  clearTimeout(demora);
  demora = setTimeout(() => {
    pagina.value = 1;
    cargar();
  }, 350);
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
  cargarStats();
}

async function cargarStats() {
  statsLoading.value = true;
  try {
    const p = {};
    if (historico.value) p.incluir_historico = 1;
    if (mios.value) p.mios = 1;
    const { data } = await getOrderStats(p);
    stats.value = data?.data || stats.value;
  } catch {
    // El resumen es informativo: si falla, el listado sigue sirviendo.
  } finally {
    statsLoading.value = false;
  }
}

// Recibir un equipo crea la orden vacia y abre el editor. Es el mismo gesto que
// arrancar un presupuesto: el mostrador completa con el cliente enfrente.
async function onRecibir() {
  creando.value = true;
  try {
    const { data } = await createOrder({});
    const creada = data?.data;
    if (creada?.id) router.push({ name: "serviceOrderEdit", params: { id: creada.id } });
    else notificar("La orden se creo pero no volvio el id.", "warning");
  } catch (e) {
    notificar(e?.response?.data?.message || "No se pudo crear la orden.", "error");
  } finally {
    creando.value = false;
  }
}

function abrir(o) {
  router.push({ name: "serviceOrderEdit", params: { id: o.id } });
}

onMounted(cargar);
</script>

<style scoped>
.fila {
  cursor: pointer;
}
.fila:hover {
  background: rgba(var(--v-theme-primary), 0.04);
}
.falla {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
