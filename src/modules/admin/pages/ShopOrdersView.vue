<!--
  ShopOrdersView (Admin) — Lista de pedidos del shop.
  - Filtros: búsqueda, status, fulfillment, sucursal.
  - Tabla con preview compacto.
  - Botón "Ver" navega a /admin/shop/orders/:id (página completa, no modal).
  - Acciones rápidas para cambiar estado en la fila (vía PATCH .../status).
-->
<template>
  <v-container class="mx-auto sho-container" fluid>
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
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";

import ShopOrdersHeader from "@/modules/admin/components/shop-orders/ShopOrdersHeader.vue";
import ShopOrdersFilters from "@/modules/admin/components/shop-orders/ShopOrdersFilters.vue";
import ShopOrdersTable from "@/modules/admin/components/shop-orders/ShopOrdersTable.vue";

import { useShopOrdersApi } from "@/modules/admin/composables/useShopOrdersApi";
import { adminUpdateShopOrderStatus } from "@/modules/shop/service/admin.shopOrders.api";
import { orderStatusLabel } from "@/modules/admin/utils/shopOrdersUi";

const router = useRouter();

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
const meta = ref({ page: 1, limit: 20, total: 0, pages: 1 });

const filters = ref({
  q: "",
  status: null,
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
</style>
