<!-- src/modules/budgets/pages/BudgetsListPage.vue
     Listado de presupuestos. Punto de entrada del presupuestador. -->
<template>
  <div class="pa-4">
    <AppPageHeader icon="mdi-file-document-edit-outline" title="Presupuestos">
      <v-btn color="primary" prepend-icon="mdi-plus" :loading="creating" @click="onCreate">
        Nuevo presupuesto
      </v-btn>
    </AppPageHeader>

    <!-- Resumen sobre el total, no sobre la página visible -->
    <v-row class="mb-2" dense>
      <v-col cols="12" sm="6" md="3">
        <KpiCard
          title="Presupuestos"
          :value="String(stats.count)"
          :loading="statsLoading"
          icon="mdi-file-document-multiple-outline"
          tone="primary"
          :sub="`${stats.open} abierto${stats.open === 1 ? '' : 's'}`"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <KpiCard
          title="Monto presupuestado"
          :value="money(stats.amount)"
          :loading="statsLoading"
          icon="mdi-cash-multiple"
          tone="indigo"
          sub="Suma de todos los presupuestos"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <KpiCard
          title="Vencidos"
          :value="String(stats.expired)"
          :loading="statsLoading"
          icon="mdi-clock-alert-outline"
          :tone="stats.expired > 0 ? 'warning' : 'success'"
          sub="Pasados de fecha y sin cerrar"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <KpiCard
          title="Vendidos"
          :value="String(stats.sold)"
          :loading="statsLoading"
          icon="mdi-check-decagram-outline"
          tone="success"
          :sub="money(stats.sold_amount)"
        />
      </v-col>
    </v-row>

    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <div class="text-caption text-medium-emphasis">
        {{ total }} presupuesto{{ total === 1 ? "" : "s" }} en la lista
        <template v-if="items.length"> · {{ sumLabel }} {{ money(pageSum) }}</template>
      </div>

      <v-spacer />

      <v-text-field
        v-model="q"
        density="compact"
        variant="outlined"
        hide-details
        clearable
        placeholder="Buscar por cliente, CUIT o número"
        prepend-inner-icon="mdi-magnify"
        style="max-width: 320px"
        @update:model-value="debouncedFetch"
      />

      <v-select
        v-model="status"
        :items="statusItems"
        label="Estado"
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 190px"
        @update:model-value="onFilter"
      />

      <!-- A los vendedores el backend ya les muestra solo los suyos; el
           interruptor es para que un admin pueda mirar los propios. -->
      <v-switch
        v-if="canSeeAll"
        v-model="mine"
        label="Solo míos"
        color="primary"
        density="compact"
        hide-details
        inset
        @update:model-value="onFilter"
      />
    </div>

    <v-card variant="outlined" rounded="lg">
      <v-data-table-server
        :headers="headers"
        :items="items"
        :items-length="total"
        :loading="loading"
        :page="page"
        :items-per-page="limit"
        :items-per-page-options="perPageOptions"
        items-per-page-text="Filas por página:"
        page-text="{0}-{1} de {2}"
        loading-text="Cargando presupuestos..."
        density="compact"
        item-value="id"
        hover
        class="budgets-table"
        @update:options="onOptions"
        @click:row="onRowClick"
      >
        <template #item.number="{ item }">
          <span class="font-weight-medium">{{ budgetNumber(item) }}</span>
        </template>

        <template #item.user_name="{ item }">
          <span class="text-body-2">{{ sellerName(item) }}</span>
        </template>

        <template #item.customer_name="{ item }">
          <div class="text-body-2">{{ item.customer_name }}</div>
          <div v-if="item.customer_phone || item.customer_cuit" class="text-caption text-medium-emphasis">
            {{ [item.customer_phone, item.customer_cuit].filter(Boolean).join(" / ") }}
          </div>
        </template>

        <template #item.created_at="{ item }">
          {{ fmtDate(item.created_at) }}
        </template>

        <!-- Vencimiento: la fecha sola no dice nada de un vistazo, así que
             debajo va cuánto falta o hace cuánto venció. -->
        <template #item.valid_until="{ item }">
          <div :class="isExpired(item) ? 'text-error' : ''">{{ fmtDate(item.valid_until) }}</div>
          <div class="text-caption" :class="isExpired(item) ? 'text-error' : 'text-medium-emphasis'">
            {{ expiryLabel(item) }}
          </div>
        </template>

        <template #item.status="{ item }">
          <v-chip size="small" :color="statusColor(item.status)" variant="tonal">
            {{ statusLabel(item.status) }}
          </v-chip>
        </template>

        <template #item.total="{ item }">
          <span class="font-weight-medium">{{ money(item.total, item.currency) }}</span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex ga-1 justify-end row-actions">
            <v-btn
              size="small"
              variant="text"
              :to="{ name: 'budgetEdit', params: { id: item.id } }"
              @click.stop
            >
              <v-icon>mdi-pencil-outline</v-icon>
              <v-tooltip activator="parent" location="top">Ver / editar</v-tooltip>
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              :loading="pdfId === item.id"
              @click.stop="onPdf(item)"
            >
              <v-icon>mdi-file-pdf-box</v-icon>
              <v-tooltip activator="parent" location="top">Descargar PDF</v-tooltip>
            </v-btn>
          </div>
        </template>

        <template #no-data>
          <div class="text-center pa-8 text-medium-emphasis">
            <template v-if="q || status">
              No hay presupuestos que coincidan con la búsqueda.
              <div class="mt-2">
                <v-btn size="small" variant="text" @click="clearFilters">Limpiar filtros</v-btn>
              </div>
            </template>
            <template v-else>
              Todavía no hay presupuestos. Creá el primero con el botón de arriba.
            </template>
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3500">
      {{ snack.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import AppPageHeader from "@/app/components/AppPageHeader.vue";
import { useAuthStore } from "@/app/store/auth.store";
import KpiCard from "@/modules/dashboard/components/KpiCard.vue";
import {
  listBudgets,
  createBudget,
  getBudgetStats,
  BUDGET_STATUS,
  statusLabel,
  statusColor,
} from "../services/budgets.service";
import { exportBudgetPdfById, loadBudgetIdentity } from "../utils/budgetPdf";
import { budgetNumber, sellerName, fmtDocDate, daysUntil } from "../utils/budgetDoc";

const router = useRouter();

const items = ref([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);
const loading = ref(false);
const creating = ref(false);
const q = ref("");
const status = ref("");
const mine = ref(false);

// Un cajero/vendedor solo ve los suyos y lo resuelve el backend: para él el
// interruptor no cambiaría nada, así que no se muestra.
const auth = useAuthStore();
const canSeeAll = computed(() => !auth.isCajero);

const pdfId = ref(null);

const statsLoading = ref(false);
const stats = ref({ count: 0, amount: 0, open: 0, expired: 0, sold: 0, sold_amount: 0 });

async function fetchStats() {
  statsLoading.value = true;
  try {
    const { data } = await getBudgetStats();
    stats.value = { ...stats.value, ...(data?.data || {}) };
  } catch {
    // Las tarjetas son informativas: si fallan, el listado tiene que andar igual.
  } finally {
    statsLoading.value = false;
  }
}

const snack = ref({ show: false, text: "", color: "success" });

// La identidad (branding + sucursal) se pide una sola vez y se reusa para
// todos los PDF que se exporten desde el listado.
let identityCache = null;
async function identity() {
  if (!identityCache) identityCache = await loadBudgetIdentity();
  return identityCache;
}

const statusItems = [
  { title: "Todos", value: "" },
  ...BUDGET_STATUS.map((s) => ({ title: s.label, value: s.value })),
];

const perPageOptions = [
  { value: 20, title: "20" },
  { value: 50, title: "50" },
  { value: 100, title: "100" },
];

const headers = [
  { title: "N°", key: "number", width: 110 },
  { title: "Cliente", key: "customer_name" },
  { title: "Vendedor", key: "user_name", width: 150, sortable: false },
  { title: "Creado", key: "created_at", width: 120 },
  { title: "Vence", key: "valid_until", width: 140 },
  { title: "Estado", key: "status", width: 130 },
  { title: "Total", key: "total", align: "end", width: 140 },
  { title: "", key: "actions", align: "end", sortable: false, width: 180 },
];

// Suma de lo que está en pantalla. El endpoint no devuelve el total global, así
// que cuando hay más de una página lo decimos en la etiqueta en vez de mostrar
// un número que parezca el total de todo.
const pageSum = computed(() =>
  items.value.reduce((acc, b) => acc + Number(b.total || 0), 0)
);
const sumLabel = computed(() =>
  items.value.length < total.value ? "Total en pantalla" : "Total"
);

function money(v, currency = "ARS") {
  const n = Number(v || 0);
  const symbol = currency === "USD" ? "US$" : "$";
  return `${symbol} ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const fmtDate = fmtDocDate;

// Días entre hoy y el vencimiento, contando por día calendario para que
// "vence hoy" no dependa de la hora.
function daysToExpiry(item) {
  return daysUntil(item?.valid_until);
}

function isClosed(item) {
  return ["vendido", "no_venta"].includes(item?.status);
}

function isExpired(item) {
  const d = daysToExpiry(item);
  return d !== null && d < 0 && !isClosed(item);
}

function expiryLabel(item) {
  const d = daysToExpiry(item);
  if (d === null) return "";
  if (isClosed(item)) return "";
  if (d < 0) return `vencido hace ${Math.abs(d)} día${Math.abs(d) === 1 ? "" : "s"}`;
  if (d === 0) return "vence hoy";
  return `en ${d} día${d === 1 ? "" : "s"}`;
}

function notify(text, color = "success") {
  snack.value = { show: true, text, color };
}

async function fetch() {
  loading.value = true;
  try {
    const { data } = await listBudgets({
      page: page.value,
      limit: limit.value,
      q: q.value || undefined,
      status: status.value || undefined,
      mine: mine.value ? 1 : undefined,
    });
    items.value = data?.data || [];
    total.value = data?.meta?.total || 0;
  } catch (e) {
    notify(e?.response?.data?.message || "No se pudo cargar el listado.", "error");
  } finally {
    loading.value = false;
  }
}

let debounceId = null;
function debouncedFetch() {
  clearTimeout(debounceId);
  debounceId = setTimeout(() => {
    page.value = 1;
    fetch();
  }, 350);
}

function onFilter() {
  page.value = 1;
  fetch();
}

function clearFilters() {
  q.value = "";
  status.value = "";
  mine.value = false;
  onFilter();
}

function onOptions(opts) {
  page.value = opts.page;
  limit.value = opts.itemsPerPage;
  fetch();
}

function openBudget(item) {
  router.push({ name: "budgetEdit", params: { id: item.id } });
}

// Toda la fila abre el presupuesto. Los botones de acción cortan el evento con
// @click.stop para no abrir el editor de paso.
function onRowClick(_event, { item }) {
  if (item) openBudget(item);
}

async function onCreate() {
  creating.value = true;
  try {
    const { data } = await createBudget({});
    router.push({ name: "budgetEdit", params: { id: data.data.id } });
  } catch (e) {
    notify(e?.response?.data?.message || "No se pudo crear el presupuesto.", "error");
  } finally {
    creating.value = false;
  }
}

async function onPdf(item) {
  pdfId.value = item.id;
  try {
    await exportBudgetPdfById(item.id, await identity());
  } catch (e) {
    console.error("[budgets] onPdf:", e);
    notify(`No se pudo generar el PDF: ${e?.message || e}`, "error");
  } finally {
    pdfId.value = null;
  }
}

onMounted(() => {
  fetch();
  fetchStats();
});
</script>

<style scoped>
.budgets-table :deep(tbody tr) {
  cursor: pointer;
}
</style>
