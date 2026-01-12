<!-- src/modules/admin/pages/ShopOrdersInboxView.vue -->
<template>
  <v-container class="mx-auto" style="max-width: 1300px;">
    <v-card rounded="xl" elevation="3" class="pa-4">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div>
          <div class="text-h6 font-weight-bold">Tienda · Pedidos</div>
          <div class="text-caption text-medium-emphasis">
            Bandeja de pedidos (ecom_orders + items + pagos).
          </div>
        </div>

        <div class="d-flex ga-2">
          <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="load" :loading="loading">
            Recargar
          </v-btn>
        </div>
      </v-card-title>

      <v-divider class="my-3" />

      <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
        {{ error }}
      </v-alert>

      <!-- filtros -->
      <div class="d-flex flex-wrap ga-2 mb-3">
        <v-text-field
          v-model="filters.q"
          label="Buscar (código, email, nombre, #id)"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 420px;"
          @keyup.enter="applyFilters"
        />

        <v-select
          v-model="filters.status"
          :items="statusItems"
          label="Estado"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 220px;"
        />

        <v-select
          v-model="filters.fulfillment_type"
          :items="fulfillmentItems"
          label="Tipo"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 220px;"
        />

        <v-text-field
          v-model="filters.branch_id"
          label="Sucursal (id)"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 160px;"
        />

        <v-spacer />

        <v-btn variant="tonal" @click="resetFilters" :disabled="loading">Reset</v-btn>
        <v-btn color="primary" variant="flat" @click="applyFilters" :disabled="loading">Buscar</v-btn>
      </div>

      <v-data-table-server
        :headers="headers"
        :items="rows"
        :items-length="meta.total"
        :loading="loading"
        item-value="id"
        density="comfortable"
        v-model:page="meta.page"
        v-model:items-per-page="meta.limit"
        @update:options="onOptions"
      >
        <template #item.public_code="{ item }">
          <div class="d-flex align-center ga-2">
            <v-chip size="small" label color="blue" variant="tonal">{{ item.public_code }}</v-chip>
            <span class="text-caption text-medium-emphasis">#{{ item.id }}</span>
          </div>
        </template>

        <template #item.customer="{ item }">
          <div class="d-flex flex-column">
            <b class="text-body-2">{{ (item.customer_name || "").trim() || "Cliente" }}</b>
            <span class="text-caption text-medium-emphasis">{{ item.customer_email || "—" }}</span>
          </div>
        </template>

        <template #item.branch_name="{ item }">
          <b>{{ item.branch_name || item.branch_id }}</b>
        </template>

        <template #item.fulfillment_type="{ item }">
          <v-chip size="small" label variant="outlined">
            {{ item.fulfillment_type === "delivery" ? "Envío" : "Retiro" }}
          </v-chip>
        </template>

        <template #item.status="{ item }">
          <v-chip size="small" label :color="statusColor(item.status)" variant="tonal">
            {{ item.status }}
          </v-chip>
        </template>

        <template #item.total="{ item }">
          <b>$ {{ fmtMoney(item.total) }}</b>
        </template>

        <template #item.payment="{ item }">
          <div class="d-flex flex-column align-end">
            <span class="text-caption">{{ item.last_payment_provider || "—" }}</span>
            <span class="text-caption text-medium-emphasis">{{ item.last_payment_status || "—" }}</span>
          </div>
        </template>

        <template #item.created_at="{ item }">
          <span class="text-caption">{{ fmtDate(item.created_at) }}</span>
        </template>

        <template #item.actions="{ item }">
          <v-btn size="small" variant="tonal" @click="openDetail(item)">Ver</v-btn>
        </template>

        <template #no-data>
          <div class="py-10 text-center text-medium-emphasis">
            No hay pedidos aún. Confirmá una compra desde el shop.
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Drawer detalle -->
    <v-navigation-drawer v-model="detail.open" location="right" temporary width="520">
      <div class="pa-4 d-flex align-center justify-space-between">
        <div class="d-flex flex-column">
          <b>Pedido {{ detail.order?.public_code || "—" }}</b>
          <span class="text-caption text-medium-emphasis">#{{ detail.order?.id || "—" }}</span>
        </div>
        <v-btn icon variant="text" @click="detail.open=false"><v-icon>mdi-close</v-icon></v-btn>
      </div>

      <v-divider />

      <div class="pa-4" v-if="detail.loading">Cargando…</div>

      <div class="pa-4" v-else>
        <v-alert v-if="detail.error" type="error" variant="tonal" class="mb-3">
          {{ detail.error }}
        </v-alert>

        <div v-if="detail.order">
          <div class="d-flex justify-space-between mb-2">
            <span class="text-medium-emphasis">Estado</span>
            <v-chip size="small" label :color="statusColor(detail.order.status)" variant="tonal">
              {{ detail.order.status }}
            </v-chip>
          </div>

          <div class="d-flex justify-space-between mb-2">
            <span class="text-medium-emphasis">Sucursal</span>
            <b>{{ detail.order.branch_name || detail.order.branch_id }}</b>
          </div>

          <div class="d-flex justify-space-between mb-2">
            <span class="text-medium-emphasis">Tipo</span>
            <b>{{ detail.order.fulfillment_type === "delivery" ? "Envío" : "Retiro" }}</b>
          </div>

          <div class="d-flex justify-space-between mb-2">
            <span class="text-medium-emphasis">Total</span>
            <b>$ {{ fmtMoney(detail.order.total) }}</b>
          </div>

          <v-divider class="my-3" />

          <div class="font-weight-bold mb-2">Items</div>
          <v-card variant="tonal" rounded="lg" class="pa-3 mb-3">
            <div v-for="it in detail.items" :key="it.id" class="d-flex justify-space-between py-1">
              <div class="d-flex flex-column" style="min-width:0;">
                <b class="text-body-2" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  {{ it.product_name || ("Producto #" + it.product_id) }}
                </b>
                <span class="text-caption text-medium-emphasis">
                  {{ it.qty }} × $ {{ fmtMoney(it.unit_price) }}
                </span>
              </div>
              <b>$ {{ fmtMoney(it.line_total) }}</b>
            </div>
          </v-card>

          <div class="font-weight-bold mb-2">Pagos</div>
          <v-card variant="tonal" rounded="lg" class="pa-3">
            <div v-if="!detail.payments.length" class="text-caption text-medium-emphasis">
              Sin pagos registrados
            </div>
            <div v-for="p in detail.payments" :key="p.id" class="d-flex justify-space-between py-1">
              <div class="d-flex flex-column">
                <b class="text-body-2">{{ p.provider }}</b>
                <span class="text-caption text-medium-emphasis">
                  status: {{ p.status }} · ref: {{ p.external_id || "—" }}
                </span>
              </div>
              <b>$ {{ fmtMoney(p.amount) }}</b>
            </div>
          </v-card>
        </div>
      </div>
    </v-navigation-drawer>
  </v-container>
</template>

<script setup>
import { reactive, ref } from "vue";
import { adminListShopOrders, adminGetShopOrderById } from "@/modules/shop/service/admin.shopOrders.api";

const loading = ref(false);
const error = ref("");

const headers = [
  { title: "Código", key: "public_code", sortable: false },
  { title: "Cliente", key: "customer", sortable: false },
  { title: "Sucursal", key: "branch_name", sortable: false },
  { title: "Items", key: "items_count", sortable: false, align: "end" },
  { title: "Tipo", key: "fulfillment_type", sortable: false },
  { title: "Estado", key: "status", sortable: false },
  { title: "Pago", key: "payment", sortable: false, align: "end" },
  { title: "Total", key: "total", sortable: false, align: "end" },
  { title: "Fecha", key: "created_at", sortable: false },
  { title: "", key: "actions", sortable: false, align: "end" },
];

const statusItems = ["", "created", "pending", "paid", "cancelled", "shipped", "delivered", "ready_pickup"];
const fulfillmentItems = ["", "pickup", "delivery"];

const rows = ref([]);
const meta = reactive({ page: 1, limit: 20, total: 0, pages: 1 });

const filters = reactive({
  q: "",
  status: "",
  fulfillment_type: "",
  branch_id: "",
});

function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(Number(v || 0)));
}
function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString("es-AR");
}
function statusColor(s) {
  const x = String(s || "").toLowerCase();
  if (x === "paid") return "green";
  if (x === "pending") return "amber";
  if (x === "cancelled") return "red";
  if (x === "created") return "blue";
  return "grey";
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const params = {
      page: meta.page,
      limit: meta.limit,
      q: filters.q || undefined,
      status: filters.status || undefined,
      fulfillment_type: filters.fulfillment_type || undefined,
      branch_id: filters.branch_id ? Number(filters.branch_id) : undefined,
    };

    const r = await adminListShopOrders(params);
    if (!r?.ok) throw new Error(r?.message || "Error listando pedidos.");

    rows.value = r.data || [];
    meta.total = r.meta?.total || 0;
    meta.pages = r.meta?.pages || 1;
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudieron cargar los pedidos.";
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  meta.page = 1;
  load();
}
function resetFilters() {
  filters.q = "";
  filters.status = "";
  filters.fulfillment_type = "";
  filters.branch_id = "";
  meta.page = 1;
  load();
}

function onOptions() {
  load();
}

const detail = reactive({
  open: false,
  loading: false,
  error: "",
  order: null,
  items: [],
  payments: [],
});

async function openDetail(item) {
  detail.open = true;
  detail.loading = true;
  detail.error = "";
  detail.order = null;
  detail.items = [];
  detail.payments = [];
  try {
    const r = await adminGetShopOrderById(item.id);
    if (!r?.ok) throw new Error(r?.message || "Error cargando pedido.");
    detail.order = r.order || null;
    detail.items = r.items || [];
    detail.payments = r.payments || [];
  } catch (e) {
    detail.error = e?.response?.data?.message || e?.message || "No se pudo cargar el detalle.";
  } finally {
    detail.loading = false;
  }
}

load();
</script>
