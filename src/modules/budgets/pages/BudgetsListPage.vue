<!-- src/modules/budgets/pages/BudgetsListPage.vue
     Listado de presupuestos. Punto de entrada del presupuestador. -->
<template>
  <!-- Presupuestos con el lenguaje de Ventas y Productos (10/10): un solo
       botón, buscador con los estados, franja de resumen (no tarjetas) y
       tabla cerrada con enlace real por fila. -->
  <div class="sp bl">
    <div class="sp-cab">
      <div class="sp-cab__txt">
        <h1 class="sp-cab__titulo">Presupuestos</h1>
        <span class="sp-cab__sub num">{{ fmtInt(total) }} {{ total === 1 ? "presupuesto" : "presupuestos" }}<template v-if="status || q || mine"> con estos filtros</template></span>
      </div>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" class="sp-nuevo" :loading="creating" @click="onCreate">Nuevo presupuesto</v-btn>
    </div>

    <div class="sp-busca">
      <div class="sp-busca__campo">
        <v-icon size="22" class="sp-busca__ic">mdi-magnify</v-icon>
        <input v-model="q" type="search" class="sp-busca__input" placeholder="Cliente, número o vendedor" @input="debouncedFetch" />
      </div>
      <label v-if="canSeeAll" class="sp-check"><input v-model="mine" type="checkbox" @change="onFilter" />Solo los míos</label>
    </div>

    <div class="bl-estados" role="tablist">
      <button v-for="e in estados" :key="e.value" type="button" role="tab" :aria-selected="status === e.value" :class="{ 'is-on': status === e.value }" @click="status = e.value; onFilter()">
        <i v-if="e.value" :class="`bl-dot bl-dot--${e.value}`"></i>{{ e.title }}
      </button>
    </div>

    <!-- Franja de resumen sobre todos los presupuestos -->
    <div class="bl-franja num">
      <div><span class="bl-lab">Presupuestado</span><b>{{ money(stats.amount) }}</b><small>{{ fmtInt(stats.count) }} presupuestos</small></div>
      <div><span class="bl-lab">Abiertos</span><b>{{ fmtInt(stats.open) }}</b></div>
      <div><span class="bl-lab">Vencidos sin cerrar</span><b :class="{ 'bl-rojo': stats.expired > 0 }">{{ fmtInt(stats.expired) }}</b></div>
      <div><span class="bl-lab">Vendidos</span><b>{{ fmtInt(stats.sold) }}</b><small>{{ money(stats.sold_amount) }}</small></div>
    </div>

    <div class="sp-caja">
      <v-progress-linear v-if="loading" indeterminate color="primary" height="3" />
      <div class="sp-tabla-scroll">
        <table class="sp-tabla bl-tabla">
          <thead>
            <tr>
              <th class="c-nro">N°</th>
              <th>Cliente</th>
              <th class="c-vend">Vendedor</th>
              <th class="c-fecha">Creado</th>
              <th class="c-vence">Vence</th>
              <th class="c-est">Estado</th>
              <th class="c-total">Total</th>
              <th class="c-pdf"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id" @click="abrir($event, item)" @auxclick="abrir($event, item)">
              <td class="num"><router-link :to="ruta(item)" class="sp-nombre" @click.stop>{{ budgetNumber(item) }}</router-link></td>
              <td>
                <div class="sp-b clamp1">{{ item.customer_name || "Consumidor final" }}</div>
                <div v-if="item.customer_phone" class="sp-s num">{{ item.customer_phone }}</div>
              </td>
              <td class="clamp1">{{ sellerName(item) }}</td>
              <td class="num">{{ fmtDate(item.created_at) }}</td>
              <td class="num">
                <div :class="{ 'bl-rojo': isExpired(item) }">{{ fmtDate(item.valid_until) }}</div>
                <div v-if="expiryLabel(item)" class="sp-s" :class="{ 'bl-rojo': isExpired(item) }">{{ expiryLabel(item) }}</div>
              </td>
              <td><span :class="`bl-est bl-est--${item.status}`">{{ statusLabel(item.status) }}</span></td>
              <td class="c-total num sp-b">{{ money(item.total, item.currency) }}</td>
              <td class="c-pdf">
                <button type="button" class="bl-pdf" title="Descargar PDF" :disabled="pdfId === item.id" @click.stop="onPdf(item)">
                  <v-progress-circular v-if="pdfId === item.id" indeterminate size="16" width="2" />
                  <v-icon v-else size="20">mdi-file-pdf-box</v-icon>
                </button>
              </td>
            </tr>
            <tr v-if="!loading && !items.length">
              <td colspan="8" class="sp-vacio">{{ q || status || mine ? "Ningún presupuesto coincide" : "Todavía no hay presupuestos" }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="total > limit" class="bl-pag num">
        <span>{{ desdeN }}–{{ hastaN }} de {{ fmtInt(total) }}</span>
        <button type="button" :disabled="page <= 1" @click="irPagina(page - 1)"><v-icon size="20">mdi-chevron-left</v-icon></button>
        <button type="button" :disabled="hastaN >= total" @click="irPagina(page + 1)"><v-icon size="20">mdi-chevron-right</v-icon></button>
      </div>
    </div>

    <v-snackbar v-model="snack.show" :color="snack.color" :timeout="3000">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/app/store/auth.store";
import "@/modules/products/styles/proveedores.css";
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

const estados = [{ title: "Todos", value: "" }, ...BUDGET_STATUS.map((x) => ({ title: x.label, value: x.value }))];
const fmtInt = (v) => Number(v || 0).toLocaleString("es-AR");
const desdeN = computed(() => (total.value ? (page.value - 1) * limit.value + 1 : 0));
const hastaN = computed(() => Math.min(total.value, page.value * limit.value));
function irPagina(p) { page.value = p; fetch(); }
const ruta = (item) => ({ name: "budgetEdit", params: { id: item.id } });
// Fila entera abre; ctrl/cmd o rueda abren en otra pestaña.
function abrir(e, item) {
  if (window.getSelection?.()?.toString()) return;
  if (e.button === 1 || e.ctrlKey || e.metaKey) { window.open(router.resolve(ruta(item)).href, "_blank"); return; }
  if (e.type === "click") openBudget(item);
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

<style>
.bl-estados { display: flex; gap: 6px; flex-wrap: wrap; }
.bl-estados button { height: 38px; display: inline-flex; align-items: center; gap: 8px; padding: 0 14px; border-radius: 10px; border: 1px solid var(--sp-borde); background: var(--sp-caja); color: var(--sp-texto); font: 700 14px Inter, sans-serif; cursor: pointer; }
.bl-estados button:hover:not(.is-on) { background: #cfe5f5; border-color: #3f8fc6; }
.bl-estados button.is-on { background: #0f6fae; border-color: #0f6fae; color: #ffffff; }
.bl-dot { width: 9px; height: 9px; border-radius: 9999px; }
.bl-dot--generado, .bl-est--generado::before { background: #8cc0e3; }
.bl-dot--en_proceso, .bl-est--en_proceso::before { background: #3f8fc6; }
.bl-dot--entregado, .bl-est--entregado::before { background: #0f6fae; }
.bl-dot--vendido, .bl-est--vendido::before { background: #2E9E7B; }
.bl-dot--no_venta, .bl-est--no_venta::before { background: #C3C9D6; }
.bl-franja { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-radius: 12px; overflow: hidden; background: var(--sp-caja); border: 1px solid var(--sp-borde); }
.bl-franja > div { display: flex; flex-direction: column; gap: 2px; padding: 12px 16px; border-left: 1px solid var(--sp-linea); }
.bl-franja > div:first-child { border-left: 0; }
.bl-franja b { font-size: 22px; font-weight: 900; }
.bl-franja small { font-size: 12px; font-weight: 600; color: var(--sp-suave); }
.bl-lab { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--sp-suave); }
.bl-rojo { color: #c2413a !important; }
.bl-tabla .c-nro { width: 120px; }
.bl-tabla .c-vend { width: 170px; }
.bl-tabla .c-fecha { width: 110px; }
.bl-tabla .c-vence { width: 150px; }
.bl-tabla .c-est { width: 130px; }
.bl-tabla .c-total { width: 150px; text-align: right; }
.bl-tabla .c-pdf { width: 56px; text-align: center; }
.bl-est { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; }
.bl-est::before { content: ""; width: 9px; height: 9px; border-radius: 9999px; }
.bl-pdf { width: 36px; height: 36px; border: 0; border-radius: 9px; background: transparent; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.bl-pdf .v-icon { color: var(--sp-suave); }
.bl-pdf:hover { background: #cfe5f5; }
.bl-pdf:hover .v-icon { color: #0a466e; }
.bl-pag { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 10px 14px; border-top: 1px solid var(--sp-linea); font-size: 14px; font-weight: 600; color: var(--sp-suave); }
.bl-pag button { width: 36px; height: 36px; border-radius: 9px; border: 1px solid var(--sp-borde); background: var(--sp-caja); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.bl-pag button:disabled { opacity: .4; cursor: default; }
@media (max-width: 900px) { .bl-franja { grid-template-columns: 1fr 1fr; } }
</style>
