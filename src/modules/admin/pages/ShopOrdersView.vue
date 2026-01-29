<!-- src/modules/admin/pages/ShopOrdersView.vue -->
<!-- ✅ COPY-PASTE FINAL COMPLETO
     - Vista integradora de pedidos (Admin)
     - Usa componentes:
       ShopOrdersHeader, ShopOrdersFilters, ShopOrdersTable,
       ShopOrderDetailDialog, ShopPaymentProofUploadDialog
     - Usa composable stateful:
       useShopOrdersApi
-->

<template>
  <v-container class="mx-auto" style="max-width:1200px;">
    <v-card rounded="xl" elevation="3" class="pa-4">
      <!-- Header -->
      <ShopOrdersHeader :loading="loading" @reload="reload" />

      <v-divider class="my-3" />

      <!-- Error global -->
      <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
        {{ error }}
      </v-alert>

      <!-- Filtros -->
      <ShopOrdersFilters
        v-model="filters"
        :loading="loading"
        :status-items="statusItems"
        :fulfillment-items="fulfillmentItems"
        :branch-items="branchItems"
        @apply="reload"
      />

      <v-divider class="my-3" />

      <!-- Tabla -->
      <ShopOrdersTable
        :headers="headers"
        :rows="rows"
        :meta="meta"
        :loading="loading"
        @page="onPage"
        @limit="onLimit"
        @view="openDetail"
      />
    </v-card>

    <!-- Detalle -->
    <ShopOrderDetailDialog
      v-model="detail.open"
      :loading="detail.loading"
      :error="detail.error"
      :data="detail.data"
      :pay-action="payAction"
      @close="detail.open=false"
      @create-mp="createMpLink"
      @open-upload="openUpload"
      @review-transfer="reviewTransfer"
    />

    <!-- Subir comprobante -->
    <ShopPaymentProofUploadDialog
      v-model="uploadDlg.open"
      :loading="uploadDlg.loading"
      :error="uploadDlg.error"
      :payment="uploadDlg.payment"
      :order-id="detail.data?.order?.id"
      v-model:bank_reference="uploadDlg.bank_reference"
      v-model:file="uploadDlg.file"
      @submit="doUploadProof"
      @close="uploadDlg.open=false"
    />

    <!-- Snackbar -->
    <v-snackbar v-model="snack.show" :timeout="2800">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

// Components
import ShopOrdersHeader from "@/modules/admin/components/shop-orders/ShopOrdersHeader.vue";
import ShopOrdersFilters from "@/modules/admin/components/shop-orders/ShopOrdersFilters.vue";
import ShopOrdersTable from "@/modules/admin/components/shop-orders/ShopOrdersTable.vue";
import ShopOrderDetailDialog from "@/modules/admin/components/shop-orders/ShopOrderDetailDialog.vue";
import ShopPaymentProofUploadDialog from "@/modules/admin/components/shop-orders/ShopPaymentProofUploadDialog.vue";

// Composable (stateful)
import { useShopOrdersApi } from "@/modules/admin/composables/useShopOrdersApi";

// --------------------
// Table headers
// --------------------
const headers = [
  { title: "Código", key: "public_code", sortable: false, width: 220 },
  { title: "Cliente", key: "customer", sortable: false },
  { title: "Sucursal", key: "branch_name", sortable: false, width: 160 },
  { title: "Entrega", key: "fulfillment_type", sortable: false, width: 200 },
  { title: "Estado / Pago", key: "status", sortable: false, width: 230 },
  { title: "Items", key: "items_qty", sortable: false, width: 120, align: "end" },
  { title: "Total", key: "total", sortable: false, width: 160, align: "end" },
  { title: "", key: "actions", sortable: false, width: 110 },
];

// --------------------
// Filters data
// --------------------
const statusItems = [
  { title: "Creado", value: "created" },
  { title: "Confirmado", value: "confirmed" },
  { title: "Preparando", value: "preparing" },
  { title: "Listo para retirar", value: "ready_pickup" },
  { title: "Enviado", value: "shipped" },
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
const snack = ref({ show: false, text: "" });

// Detalle
const detail = ref({
  open: false,
  loading: false,
  error: "",
  data: null,
});

// Acciones de pago (loading por fila)
const payAction = ref({
  loading: false,
  paymentId: null,
  type: "",
});

// Upload comprobante
const uploadDlg = ref({
  open: false,
  loading: false,
  error: "",
  payment: null,
  bank_reference: "",
  file: null,
});

// --------------------
// API composable
// --------------------
const api = useShopOrdersApi({
  loading,
  error,
  snack,
  rows,
  meta,
  branches,
  detail,
});

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

async function openDetail(item) {
  await api.openDetail(item.id);
}

async function createMpLink(payment) {
  payAction.value = { loading: true, paymentId: payment.id, type: "mp" };
  try {
    await api.createMpLink(payment.id);
  } finally {
    payAction.value = { loading: false, paymentId: null, type: "" };
  }
}

function openUpload(payment) {
  uploadDlg.value = {
    open: true,
    loading: false,
    error: "",
    payment,
    bank_reference: "",
    file: null,
  };
}

async function doUploadProof() {
  uploadDlg.value.loading = true;
  uploadDlg.value.error = "";
  try {
    await api.uploadTransferProof(
      uploadDlg.value.payment?.id,
      uploadDlg.value.file,
      uploadDlg.value.bank_reference
    );
    uploadDlg.value.open = false;
  } catch (e) {
    uploadDlg.value.error = e?.message || "No se pudo subir.";
  } finally {
    uploadDlg.value.loading = false;
  }
}

async function reviewTransfer(payment, action) {
  payAction.value = { loading: true, paymentId: payment.id, type: action };
  try {
    const note =
      window.prompt(
        action === "approve"
          ? "Nota (opcional) para aprobar:"
          : "Motivo/nota (recomendado):",
        ""
      ) || "";
    await api.reviewTransfer(payment.id, action, note);
  } finally {
    payAction.value = { loading: false, paymentId: null, type: "" };
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
