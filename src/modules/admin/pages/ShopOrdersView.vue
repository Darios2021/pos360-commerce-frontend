<!--
  ShopOrdersView (Admin) — Lista de pedidos del shop.
  - Filtros: búsqueda, status, fulfillment, sucursal.
  - Tabla con preview compacto.
  - Botón "Ver" navega a /admin/shop/orders/:id (página completa, no modal).
  - Acciones rápidas para cambiar estado en la fila (vía PATCH .../status).
-->
<template>
  <!-- Teléfono (pantalla 19, plan del 2026-10-31): chips por estado con su
       cantidad y una fila por pedido; tocarla abre el pedido completo. -->
  <div v-if="mobile" class="shm m-vista">
    <div class="m-chips">
      <button v-for="c in CHIPS_MOVIL" :key="c.v" type="button" class="m-chip num" :class="{ on: filters.status === c.v }" @click="elegirEstado(c.v)">{{ c.t }} {{ conteos[c.v] ?? "" }}</button>
    </div>
    <div class="m-pz">
      <div v-if="loading && !rows.length" class="m-it"><span class="tx"><small>Cargando…</small></span></div>
      <div v-else-if="!rows.length" class="m-it"><span class="tx"><small>No hay pedidos en este estado.</small></span></div>
      <button v-for="o in rows" :key="o.id" type="button" class="m-it shm-it" @click="goDetail(o)">
        <span class="tx">
          <b class="num">#{{ o.public_code || o.id }} · {{ String(o.customer_name || "").trim() || "Cliente" }}</b>
          <small>{{ [o.fulfillment_type === "delivery" ? "Envío" : o.branch_name ? `Retira en ${o.branch_name}` : "Retiro", o.payment_method_title, pagoTxt(o)].filter(Boolean).join(" · ") }}</small>
        </span>
        <span class="der"><b class="num">$ {{ Math.round(Number(o.total || 0)).toLocaleString("es-AR") }}</b><small class="num">{{ horaPedido(o.created_at) }}</small></span>
        <v-icon size="20" class="chev">mdi-chevron-right</v-icon>
      </button>
    </div>
    <div v-if="(meta.pages || 1) > 1" class="shm-pag">
      <button type="button" class="m-lnk" :disabled="meta.page <= 1" @click="onPage(meta.page - 1)">Anteriores</button>
      <button type="button" class="m-lnk" :disabled="meta.page >= meta.pages" @click="onPage(meta.page + 1)">Siguientes</button>
    </div>
  </div>
  <v-container v-else class="mx-auto sho-container" fluid>
    <!-- Header -->
    <ShopOrdersHeader :loading="loading" @reload="reload" />

    <!-- Error global -->
    <v-alert v-if="error" type="error" variant="tonal" class="mb-3" closable @click:close="error=''">
      {{ error }}
    </v-alert>

    <!-- Filtros -->
    <v-card rounded="lg" class="sho-filters" variant="flat">
      <ShopOrdersFilters
        v-model="filters"
        :loading="loading"
        :status-items="statusItems"
        :fulfillment-items="fulfillmentItems"
        :branch-items="branchItems"
        @apply="reload"
      />
    </v-card>

    <!-- Tabla -->
    <v-card rounded="lg" class="sho-table-card mt-3" variant="flat">
      <ShopOrdersTable
        :headers="headers"
        :rows="rows"
        :meta="meta"
        :loading="loading"
        :status-busy-id="statusBusy.id"
        @page="onPage"
        @limit="onLimit"
        @view="goDetail"
        @change-status="onChangeStatus"
      />
    </v-card>

    <!-- Snackbar -->
    <v-snackbar v-model="snack.show" :timeout="2800" :color="snack.color">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { useDisplay } from "vuetify";
import http from "@/app/api/http";
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import ShopOrdersHeader from "@/modules/admin/components/shop-orders/ShopOrdersHeader.vue";
import ShopOrdersFilters from "@/modules/admin/components/shop-orders/ShopOrdersFilters.vue";
import ShopOrdersTable from "@/modules/admin/components/shop-orders/ShopOrdersTable.vue";

import { useShopOrdersApi } from "@/modules/admin/composables/useShopOrdersApi";
import { adminUpdateShopOrderStatus } from "@/modules/shop/service/admin.shopOrders.api";
import { orderStatusLabel } from "@/modules/admin/utils/shopOrdersUi";

const router = useRouter();
// Los avisos del Inicio llegan con ?status=created (Sin preparar).
const routeActual = useRoute();

// --------------------
// Headers
// --------------------
const headers = [
  { title: "Pedido", key: "public_code", sortable: false, width: 200 },
  { title: "Cliente", key: "customer", sortable: false },
  { title: "Sucursal", key: "branch_name", sortable: false, width: 140 },
  { title: "Entrega", key: "fulfillment_type", sortable: false, width: 180 },
  { title: "Estado / Pago", key: "status", sortable: false, width: 230 },
  { title: "Items", key: "items_qty", sortable: false, width: 90, align: "end" },
  { title: "Total", key: "total", sortable: false, width: 150, align: "end" },
  { title: "", key: "actions", sortable: false, width: 110, align: "end" },
];

// --------------------
// Filters data — REALES de la DB
// --------------------
const statusItems = [
  { title: "Creado", value: "created" },
  { title: "En preparación", value: "processing" },
  { title: "Listo", value: "ready" },
  { title: "Entregado", value: "delivered" },
  { title: "Cancelado", value: "cancelled" },
];

const fulfillmentItems = [
  { title: "Retiro en sucursal", value: "pickup" },
  { title: "Envío a domicilio", value: "delivery" },
];

// --------------------
// State
// --------------------
const rows = ref([]);

// ── Teléfono ──
const { mobile } = useDisplay();
const CHIPS_MOVIL = [
  { v: "created", t: "Sin preparar" },
  { v: "processing", t: "Preparando" },
  { v: "ready", t: "Listos" },
  { v: "delivered", t: "Entregados" },
];
const conteos = ref({});
async function cargarConteos() {
  const r = await Promise.all(CHIPS_MOVIL.map((c) =>
    http.get("/admin/shop/orders", { params: { page: 1, limit: 1, status: c.v } })
      .then(({ data }) => Number(data?.meta?.total || 0)).catch(() => null)));
  conteos.value = Object.fromEntries(CHIPS_MOVIL.map((c, i) => [c.v, r[i]]));
}
function elegirEstado(v) { filters.value = { ...filters.value, status: v }; reload(); }
function pagoTxt(o) {
  const st = String(o.payment_status || "").toLowerCase();
  if (!st) return "";
  if (["approved", "paid", "accredited"].includes(st)) return "cobrado";
  if (["pending", "in_process", "pending_proof"].includes(st)) return "cobro a confirmar";
  if (["rejected", "cancelled"].includes(st)) return "cobro rechazado";
  return "";
}
function horaPedido(v) {
  const d = new Date(v); if (Number.isNaN(d.getTime())) return "";
  const dd = (x) => String(x).padStart(2, "0");
  return d.toDateString() === new Date().toDateString() ? `${dd(d.getHours())}:${dd(d.getMinutes())}` : `${dd(d.getDate())}/${dd(d.getMonth() + 1)}`;
}
const meta = ref({ page: 1, limit: 20, total: 0, pages: 1 });

const filters = ref({
  q: "",
  status: routeActual.query.status ? String(routeActual.query.status) : null,
  fulfillment_type: null,
  branch_id: null,
});

const branches = ref([]);
const branchItems = computed(() =>
  (branches.value || []).map((b) => ({ title: b.name, value: b.id }))
);

const loading = ref(false);
const error = ref("");
const snack = ref({ show: false, text: "", color: "" });

// detalle queda solo para que el composable no se queje
const detail = ref({ open: false, loading: false, error: "", data: null });

const statusBusy = ref({ id: null });

// --------------------
// API composable
// --------------------
const api = useShopOrdersApi({ loading, error, snack, rows, meta, branches, detail });

// --------------------
// Actions
// --------------------
function reload() {
  meta.value.page = 1;
  api.fetchOrders(filters.value);
}

function onPage(p) {
  meta.value.page = p;
  api.fetchOrders(filters.value);
}

function onLimit(l) {
  meta.value.limit = l;
  meta.value.page = 1;
  api.fetchOrders(filters.value);
}

function goDetail(item) {
  // Navegamos por path para no depender del name (evita conflictos si AppShell
  // u otros lugares usan otro name para el mismo path).
  router.push(`/app/admin/shop/orders/${item.id}`).catch(() => {});
}

async function onChangeStatus({ item, status }) {
  if (!item?.id || !status) return;

  // Cancelaciones requieren motivo. Para mantener simple este listing,
  // mandamos al usuario al detalle del pedido donde está el dialog
  // dedicado con textarea de motivo.
  if (status === "cancelled") {
    goDetail(item);
    snack.value = {
      show: true,
      text: "Para cancelar, indicá el motivo desde el detalle del pedido.",
      color: "info",
    };
    return;
  }

  const ok = window.confirm(
    `¿Marcar el pedido #${item.id} como "${orderStatusLabel(status)}"?`
  );
  if (!ok) return;

  statusBusy.value.id = item.id;
  try {
    await adminUpdateShopOrderStatus(item.id, status);
    snack.value = {
      show: true,
      text: `Pedido #${item.id} → ${orderStatusLabel(status)}`,
      color: "success",
    };
    // refrescar lista para mostrar el nuevo estado
    await api.fetchOrders(filters.value);
  } catch (e) {
    snack.value = {
      show: true,
      text: e?.message || "No se pudo cambiar el estado.",
      color: "error",
    };
  } finally {
    statusBusy.value.id = null;
  }
}

// --------------------
// Init
// --------------------
onMounted(async () => {
  // En el teléfono se arranca por "Sin preparar" (lo que pide una acción).
  if (mobile.value && !filters.value.status) filters.value = { ...filters.value, status: "created" };
  if (mobile.value) cargarConteos();
  await api.loadBranches();
  await api.fetchOrders(filters.value);
});
</script>

<style scoped>
.sho-container {
  max-width: 1400px;
  padding: 16px 16px 32px;
}

.sho-filters {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  padding: 12px 14px;
}

.sho-table-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  overflow: hidden;
}
.shm { display: flex; flex-direction: column; gap: 12px; }
.shm-it { width: 100%; text-align: left; }
.shm .der { display: flex; flex-direction: column; align-items: flex-end; }
.shm-pag { display: flex; justify-content: space-between; }
</style>
