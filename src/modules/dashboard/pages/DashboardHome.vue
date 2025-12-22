<template>
  <v-container class="py-6" style="max-width: 1400px;">
    <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Dashboard</div>
        <div class="text-caption text-medium-emphasis">
          Inventario y Ventas (resumen en tiempo real).
        </div>
      </div>

      <div class="d-flex ga-2">
        <v-btn variant="tonal" @click="refreshAll" :loading="loadingAny">
          <v-icon start icon="mdi-refresh" />
          Actualizar
        </v-btn>

        <v-btn color="primary" @click="$router.push('/pos')" prepend-icon="mdi-point-of-sale">
          Ir a POS
        </v-btn>
      </div>
    </div>

    <v-card rounded="xl" elevation="2">
      <v-tabs v-model="tab" color="primary" class="px-2">
        <v-tab value="inventory">
          <v-icon start icon="mdi-warehouse" />
          Inventario
        </v-tab>
        <v-tab value="sales">
          <v-icon start icon="mdi-chart-line" />
          Ventas
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-window v-model="tab">
        <!-- ===================== INVENTARIO ===================== -->
        <v-window-item value="inventory">
          <v-card-text class="py-6">
            <v-row dense>
              <v-col cols="12" md="3">
                <KpiCard
                  title="Productos"
                  :value="inv.totalProducts"
                  icon="mdi-package-variant-closed"
                  :loading="loadingInv"
                />
              </v-col>

              <v-col cols="12" md="3">
                <KpiCard
                  title="Activos"
                  :value="inv.activeProducts"
                  icon="mdi-check-circle-outline"
                  :loading="loadingInv"
                />
              </v-col>

              <v-col cols="12" md="3">
                <KpiCard
                  title="Sin precio"
                  :value="inv.noPriceProducts"
                  icon="mdi-currency-usd-off"
                  :loading="loadingInv"
                />
              </v-col>

              <v-col cols="12" md="3">
                <KpiCard
                  title="Categorías"
                  :value="inv.categories"
                  icon="mdi-shape-outline"
                  :loading="loadingInv"
                />
              </v-col>
            </v-row>

            <v-divider class="my-6" />

            <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
              <div class="text-subtitle-1 font-weight-bold">Últimos productos</div>
              <v-btn variant="tonal" @click="$router.push('/products')">
                Ver productos
                <v-icon end icon="mdi-chevron-right" />
              </v-btn>
            </div>

            <v-data-table
              :headers="productHeaders"
              :items="inv.lastProducts"
              :loading="loadingInv"
              item-key="id"
              density="comfortable"
              hover
              class="rounded-xl"
            >
              <template #item.name="{ item }">
                <div class="font-weight-bold">{{ item.name }}</div>
                <div class="text-caption text-medium-emphasis">
                  SKU: {{ item.sku || "—" }} · ID: {{ item.id }}
                </div>
              </template>

              <template #item.category="{ item }">
                <div>{{ item.category?.name || "—" }}</div>
                <div class="text-caption text-medium-emphasis">
                  Padre: {{ item.category?.parent?.name || "—" }}
                </div>
              </template>

              <template #item.price_list="{ item }">
                <div class="font-weight-bold">{{ money(item.price_list) }}</div>
                <div class="text-caption text-medium-emphasis">Precio: {{ money(item.price) }}</div>
              </template>

              <template #item.actions="{ item }">
                <v-btn size="small" variant="tonal" color="primary" @click="goProduct(item.id)">
                  <v-icon start icon="mdi-eye" />
                  Ver
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-window-item>

        <!-- ===================== VENTAS ===================== -->
        <v-window-item value="sales">
          <v-card-text class="py-6">
            <v-row dense>
              <v-col cols="12" md="3">
                <KpiCard
                  title="Ventas hoy"
                  :value="sales.todayCount"
                  icon="mdi-receipt-text-outline"
                  :loading="loadingSales"
                />
              </v-col>

              <v-col cols="12" md="3">
                <KpiCard
                  title="Facturación hoy"
                  :value="money(sales.todayTotal)"
                  icon="mdi-cash-multiple"
                  :loading="loadingSales"
                />
              </v-col>

              <v-col cols="12" md="3">
                <KpiCard
                  title="Ticket promedio"
                  :value="money(sales.avgTicket)"
                  icon="mdi-calculator"
                  :loading="loadingSales"
                />
              </v-col>

              <v-col cols="12" md="3">
                <KpiCard
                  title="Pago principal"
                  :value="sales.topPaymentLabel"
                  icon="mdi-credit-card-outline"
                  :loading="loadingSales"
                />
              </v-col>
            </v-row>

            <v-divider class="my-6" />

            <!-- GRÁFICOS -->
            <DashboardCharts
              :sales-by-day="sales.salesByDay"
              :payments="sales.paymentsByMethod"
            />

            <v-divider class="my-6" />

            <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
              <div class="text-subtitle-1 font-weight-bold">Últimas ventas</div>
              <v-btn variant="tonal" @click="$router.push('/pos/sales')">
                Ver ventas
                <v-icon end icon="mdi-chevron-right" />
              </v-btn>
            </div>

            <v-data-table
              :headers="salesHeaders"
              :items="sales.lastSales"
              :loading="loadingSales"
              item-key="id"
              density="comfortable"
              hover
              class="rounded-xl"
            >
              <template #item.sold_at="{ item }">
                <div class="font-weight-medium">{{ dt(item.sold_at) }}</div>
                <div class="text-caption text-medium-emphasis">ID: {{ item.id }}</div>
              </template>

              <template #item.customer_name="{ item }">
                <div class="font-weight-bold">{{ item.customer_name || "Consumidor Final" }}</div>
                <div class="text-caption text-medium-emphasis">
                  Pago: {{ methodLabel(item.payments?.[0]?.method) }}
                </div>
              </template>

              <template #item.total="{ item }">
                <div class="font-weight-black">{{ money(item.total) }}</div>
                <div class="text-caption text-medium-emphasis">
                  Pagado: {{ money(item.paid_total) }}
                </div>
              </template>

              <template #item.actions="{ item }">
                <v-btn size="small" variant="tonal" color="primary" @click="goSale(item.id)">
                  <v-icon start icon="mdi-eye" />
                  Ver
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-window-item>
      </v-window>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import http from "../../../app/api/http";

import KpiCard from "../components/KpiCard.vue";
import DashboardCharts from "../components/DashboardCharts.vue";

const router = useRouter();
const tab = ref("inventory");

const loadingInv = ref(false);
const loadingSales = ref(false);
const loadingAny = computed(() => loadingInv.value || loadingSales.value);

const inv = ref({
  totalProducts: 0,
  activeProducts: 0,
  noPriceProducts: 0,
  categories: 0,
  lastProducts: [],
});

const sales = ref({
  todayCount: 0,
  todayTotal: 0,
  avgTicket: 0,
  topPaymentLabel: "—",
  salesByDay: [],
  paymentsByMethod: {},
  lastSales: [],
});

const productHeaders = [
  { title: "Producto", key: "name", sortable: false },
  { title: "Categoría", key: "category", sortable: false, width: 260 },
  { title: "Lista", key: "price_list", sortable: false, width: 180 },
  { title: "Acción", key: "actions", sortable: false, width: 130 },
];

const salesHeaders = [
  { title: "Fecha", key: "sold_at", sortable: false, width: 180 },
  { title: "Cliente", key: "customer_name", sortable: false },
  { title: "Total", key: "total", sortable: false, width: 180 },
  { title: "Acción", key: "actions", sortable: false, width: 130 },
];

function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}
function dt(val) {
  if (!val) return "—";
  return new Date(val).toLocaleString("es-AR");
}
function methodLabel(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "Efectivo";
  if (x === "CARD") return "Tarjeta / Débito";
  if (x === "TRANSFER") return "Transferencia";
  if (x === "QR") return "QR";
  if (x === "OTHER") return "Otro";
  return m || "—";
}

function goProduct(id) {
  router.push(`/products/${id}`).catch(() => router.push("/products"));
}
function goSale(id) {
  router.push(`/pos/sales/${id}`).catch(() => router.push("/pos/sales"));
}

async function fetchInventory() {
  loadingInv.value = true;
  try {
    const { data } = await http.get("/dashboard/inventory");
    if (!data?.ok) throw new Error(data?.message || "Error inventario");
    inv.value = data.data;
  } finally {
    loadingInv.value = false;
  }
}

async function fetchSales() {
  loadingSales.value = true;
  try {
    const { data } = await http.get("/dashboard/sales");
    if (!data?.ok) throw new Error(data?.message || "Error ventas");
    sales.value = data.data;
  } finally {
    loadingSales.value = false;
  }
}

async function refreshAll() {
  await Promise.all([fetchInventory(), fetchSales()]);
}

onMounted(refreshAll);
</script>
