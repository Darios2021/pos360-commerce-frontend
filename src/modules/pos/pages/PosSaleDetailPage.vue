<template>
  <v-container fluid class="pa-4 bg-grey-lighten-4" style="min-height:100vh;">
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Venta #{{ id }}</div>
        <div class="text-caption text-medium-emphasis">Detalle completo</div>
      </div>
      <v-btn variant="tonal" @click="$router.back()">
        <v-icon start>mdi-arrow-left</v-icon> Volver
      </v-btn>
    </div>

    <v-card class="rounded-xl" elevation="1">
      <v-card-text v-if="loading" class="py-10 d-flex justify-center">
        <v-progress-circular indeterminate />
      </v-card-text>

      <v-card-text v-else-if="sale">
        <v-row dense>
          <v-col cols="12" md="6">
            <v-card elevation="0" class="rounded-xl pa-4" style="background: rgba(0,0,0,.03);">
              <div class="text-caption text-medium-emphasis">Cliente</div>
              <div class="text-h6 font-weight-black">{{ sale.customer_name || "—" }}</div>

              <div class="text-caption text-medium-emphasis mt-3">Fecha</div>
              <div class="text-body-2 font-weight-medium">{{ dt(sale.sold_at) }}</div>

              <div class="d-flex ga-2 mt-3">
                <v-chip size="small" variant="tonal" :color="statusColor(sale.status)">
                  {{ sale.status }}
                </v-chip>
                <v-chip size="small" variant="tonal" :color="payColor(sale.payments?.[0]?.method)">
                  {{ sale.payments?.[0]?.method || "—" }}
                </v-chip>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card elevation="0" class="rounded-xl pa-4" style="background: rgba(0,0,0,.03);">
              <div class="d-flex justify-space-between"><span>Subtotal</span><b>{{ money(sale.subtotal) }}</b></div>
              <div class="d-flex justify-space-between"><span>Descuento</span><b>{{ money(sale.discount_total) }}</b></div>
              <div class="d-flex justify-space-between"><span>Impuestos</span><b>{{ money(sale.tax_total) }}</b></div>
              <v-divider class="my-2" />
              <div class="d-flex justify-space-between"><span class="text-h6 font-weight-black">TOTAL</span><span class="text-h6 font-weight-black">{{ money(sale.total) }}</span></div>
              <div class="d-flex justify-space-between"><span>Pagado</span><b>{{ money(sale.paid_total) }}</b></div>
              <div class="d-flex justify-space-between"><span>Vuelto</span><b>{{ money(sale.change_total) }}</b></div>
            </v-card>
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <div class="text-subtitle-2 font-weight-bold mb-2">Productos</div>
        <v-data-table
          :headers="itemsHeaders"
          :items="sale.items || []"
          density="comfortable"
          class="elevation-0"
        >
          <template #item.product_name_snapshot="{ item }">
            <div class="font-weight-bold">{{ item.product_name_snapshot || "Item" }}</div>
            <div class="text-caption text-medium-emphasis">SKU: {{ item.product_sku_snapshot || "—" }}</div>
          </template>

          <template #item.unit_price="{ item }">{{ money(item.unit_price) }}</template>
          <template #item.line_total="{ item }"><b>{{ money(item.line_total) }}</b></template>

          <template #item.actions="{ item }">
            <v-btn size="small" variant="tonal" @click="goToProduct(item.product_id)">
              <v-icon start>mdi-package-variant</v-icon> Perfil
            </v-btn>
          </template>
        </v-data-table>

        <v-divider class="my-4" />

        <div class="text-subtitle-2 font-weight-bold mb-2">Pagos</div>
        <v-list density="compact" class="bg-transparent">
          <v-list-item v-for="p in (sale.payments || [])" :key="p.id" class="px-0">
            <v-list-item-title class="text-body-2 font-weight-medium">{{ p.method }}</v-list-item-title>
            <template #append><b>{{ money(p.amount) }}</b></template>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-text v-else class="text-medium-emphasis">
        No se encontró la venta.
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "../../../app/api/http";

const route = useRoute();
const router = useRouter();
const id = computed(() => route.params.id);

const loading = ref(false);
const sale = ref(null);

const itemsHeaders = [
  { title: "Producto", key: "product_name_snapshot", sortable: false },
  { title: "Cant.", key: "quantity", sortable: false, width: 100 },
  { title: "Unit.", key: "unit_price", sortable: false, width: 140 },
  { title: "Total", key: "line_total", sortable: false, width: 140 },
  { title: "", key: "actions", sortable: false, width: 140 },
];

function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}
function dt(val) {
  if (!val) return "—";
  return new Date(val).toLocaleString("es-AR");
}
function statusColor(s) {
  if (s === "PAID") return "green";
  if (s === "CANCELLED") return "red";
  if (s === "REFUNDED") return "orange";
  if (s === "DRAFT") return "blue";
  return "grey";
}
function payColor(m) {
  const v = String(m || "").toUpperCase();
  if (v === "CASH") return "green";
  if (v === "CARD") return "indigo";
  if (v === "TRANSFER") return "purple";
  if (v === "QR") return "orange";
  return "grey";
}

function goToProduct(pid) {
  if (!pid) return;
  router.push({ name: "productProfile", params: { id: pid } });
}

async function load() {
  loading.value = true;
  try {
    const { data } = await http.get(`/pos/sales/${id.value}`);
    if (!data?.ok) throw new Error(data?.message || "Error");
    sale.value = data.data;
  } catch (e) {
    sale.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
