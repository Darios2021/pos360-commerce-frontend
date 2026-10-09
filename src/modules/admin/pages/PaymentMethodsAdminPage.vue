<!-- src/modules/admin/pages/PaymentMethodsAdminPage.vue
     Listado de medios de pago. Crear, editar, activar y eliminar se hacen en
     la vista completa (PaymentMethodEditPage), no en un modal. -->
<template>
  <v-container fluid class="pm-page pa-4 pa-md-6">
    <AppPageHeader icon="mdi-credit-card-outline" title="Medios de pago">
      <v-btn
        color="primary"
        variant="flat"
        size="small"
        rounded="lg"
        prepend-icon="mdi-plus"
        :to="{ name: 'adminPaymentMethodNew' }"
      >
        Nuevo medio
      </v-btn>
    </AppPageHeader>

    <div class="pm-filtros">
      <v-text-field
        v-model="q"
        placeholder="Buscar por nombre o código"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        class="pm-filtros__q"
      />
      <v-select
        v-model="sucursal"
        :items="opcionesSucursal"
        item-title="name"
        item-value="id"
        variant="outlined"
        density="compact"
        hide-details
        class="pm-filtros__sel"
      />
      <v-btn-toggle v-model="estado" mandatory density="compact" variant="outlined" color="primary" divided>
        <v-btn value="todos">Todos ({{ cuenta.todos }})</v-btn>
        <v-btn value="activos">Activos ({{ cuenta.activos }})</v-btn>
        <v-btn value="inactivos">Inactivos ({{ cuenta.inactivos }})</v-btn>
      </v-btn-toggle>
    </div>

    <div class="pm-tabla">
      <v-data-table
        :headers="headers"
        :items="visibles"
        :loading="loading"
        item-value="id"
        density="comfortable"
        :items-per-page="25"
        no-data-text="Sin medios de pago"
        loading-text="Cargando..."
        hover
        @click:row="(_, { item }) => editar(item)"
      >
        <template #item.name="{ item }">
          <div class="pm-nombre">
            <span class="pm-nombre__txt">{{ item.display_name || item.name }}</span>
            <span class="pm-nombre__code">{{ item.code }}</span>
          </div>
        </template>
        <template #item.kind="{ item }">{{ kindLabel(item.kind) }}</template>
        <template #item.precio="{ item }">{{ pricingLabel(item) }}</template>
        <template #item.cuotas="{ item }">{{ installmentsSummary(item) }}</template>
        <template #item.sucursal="{ item }">{{ nombreSucursal(item.branch_id) }}</template>
        <template #item.is_active="{ item }">
          <span class="pm-estado" :class="item.is_active ? 'is-on' : 'is-off'">
            {{ item.is_active ? "Activo" : "Inactivo" }}
          </span>
        </template>
        <template #item.actions="{ item }">
          <v-btn size="small" variant="tonal" prepend-icon="mdi-pencil-outline" @click.stop="editar(item)">
            Editar
          </v-btn>
        </template>
      </v-data-table>
    </div>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top right" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { fetchAdminPaymentMethods } from "@/app/services/paymentMethod.service";
import { listBranches } from "@/modules/admin/services/branches.api";
import AppPageHeader from "@/app/components/AppPageHeader.vue";
import { kindLabel, pricingLabel, installmentsSummary } from "@/modules/admin/utils/mediosDePago";

const router = useRouter();

const loading = ref(false);
const rows = ref([]);
const branches = ref([]);
const snackbar = ref({ show: false, text: "", color: "success" });

const q = ref("");
const sucursal = ref("todas");
const estado = ref("todos");

const headers = [
  { title: "Nombre", key: "name", sortable: false },
  { title: "Tipo", key: "kind", sortable: false },
  { title: "Precio", key: "precio", sortable: false },
  { title: "Cuotas", key: "cuotas", sortable: false },
  { title: "Sucursal", key: "sucursal", sortable: false },
  { title: "Estado", key: "is_active", sortable: false },
  { title: "", key: "actions", sortable: false, align: "end" },
];

function nombreSucursal(bid) {
  if (!bid) return "Todas";
  return branches.value.find((b) => Number(b.id) === Number(bid))?.name || `#${bid}`;
}

const opcionesSucursal = computed(() => [
  { id: "todas", name: "Todas las sucursales" },
  ...branches.value.map((b) => ({ id: b.id, name: b.name })),
]);

// Busqueda y sucursal primero; el estado cuenta sobre eso, asi los tres
// numeros suman el total de lo que se esta mirando.
const filtradas = computed(() => {
  const texto = String(q.value || "").trim().toLowerCase();
  return rows.value.filter((r) => {
    if (sucursal.value !== "todas" && r.branch_id && Number(r.branch_id) !== Number(sucursal.value)) return false;
    if (!texto) return true;
    return [r.name, r.display_name, r.code, kindLabel(r.kind)]
      .some((v) => String(v || "").toLowerCase().includes(texto));
  });
});
const cuenta = computed(() => ({
  todos: filtradas.value.length,
  activos: filtradas.value.filter((r) => r.is_active).length,
  inactivos: filtradas.value.filter((r) => !r.is_active).length,
}));
const visibles = computed(() =>
  filtradas.value.filter((r) =>
    estado.value === "activos" ? r.is_active : estado.value === "inactivos" ? !r.is_active : true
  )
);

function editar(item) {
  if (item?.id) router.push({ name: "adminPaymentMethodEdit", params: { id: item.id } });
}

async function load() {
  loading.value = true;
  try {
    const [medios, sucursales] = await Promise.all([
      fetchAdminPaymentMethods({}),
      listBranches().catch(() => []),
    ]);
    rows.value = medios || [];
    branches.value = sucursales || [];
  } catch (e) {
    snackbar.value = { show: true, text: e?.friendlyMessage || e?.message || "Error al cargar medios de pago", color: "error" };
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.pm-page { max-width: 1200px; }
.pm-filtros {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.pm-filtros__q { flex: 1 1 260px; }
.pm-filtros__sel { flex: 0 1 240px; }
.pm-tabla {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  overflow: hidden;
}
.pm-tabla :deep(tbody tr) { cursor: pointer; }
.pm-nombre { display: flex; flex-direction: column; padding: 6px 0; }
.pm-nombre__txt { font-weight: 600; }
.pm-nombre__code { font-size: 12px; color: rgba(var(--v-theme-on-surface), .55); }
.pm-estado {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
}
.pm-estado.is-on { background: rgba(var(--v-theme-success), .14); color: rgb(var(--v-theme-success)); }
.pm-estado.is-off { background: rgba(var(--v-theme-on-surface), .08); color: rgba(var(--v-theme-on-surface), .6); }
</style>
