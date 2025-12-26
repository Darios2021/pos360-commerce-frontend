<!-- src/modules/pos/pages/PosSaleDetailPage.vue -->
<template>
  <v-container fluid class="pa-4 bg-grey-lighten-4" style="min-height:100vh;">
    <!-- HEADER -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Venta #{{ id }}</div>
        <div class="text-caption text-medium-emphasis">Detalle completo</div>
      </div>

      <v-btn variant="tonal" @click="router.back()">
        <v-icon start>mdi-arrow-left</v-icon>
        Volver
      </v-btn>
    </div>

    <v-card class="rounded-xl" elevation="1">
      <v-card-text v-if="loading" class="py-10 d-flex justify-center">
        <v-progress-circular indeterminate />
      </v-card-text>

      <v-card-text v-else-if="sale">
        <!-- RESUMEN -->
        <v-row dense>
          <v-col cols="12" md="6">
            <v-card elevation="0" class="rounded-xl pa-4 bg-grey-lighten-3">
              <div class="text-caption">Cliente</div>
              <div class="text-h6 font-weight-bold">{{ sale.customer_name || "Consumidor Final" }}</div>

              <div class="text-caption mt-3">Fecha</div>
              <div>{{ dt(sale.sold_at || sale.created_at) }}</div>

              <div class="d-flex ga-2 mt-3">
                <v-chip size="small" variant="tonal" :color="statusColor(sale.status)">
                  {{ sale.status }}
                </v-chip>

                <v-chip size="small" variant="tonal" color="primary">
                  {{ sale.payments?.[0]?.method || "—" }}
                </v-chip>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card elevation="0" class="rounded-xl pa-4 bg-grey-lighten-3">
              <div class="d-flex justify-space-between"><span>Subtotal</span><b>{{ money(sale.subtotal) }}</b></div>
              <div class="d-flex justify-space-between"><span>Descuento</span><b>{{ money(sale.discount_total) }}</b></div>
              <div class="d-flex justify-space-between"><span>Impuestos</span><b>{{ money(sale.tax_total) }}</b></div>
              <v-divider class="my-2" />
              <div class="d-flex justify-space-between text-h6 font-weight-bold">
                <span>TOTAL</span>
                <span>{{ money(sale.total) }}</span>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <!-- PRODUCTOS -->
        <div class="text-subtitle-2 font-weight-bold mb-2">Productos</div>

        <v-data-table
          :headers="itemsHeaders"
          :items="sale.items || []"
          item-key="id"
          density="comfortable"
          class="elevation-0"
        >
          <!-- PRODUCTO -->
          <template #item.product="{ item }">
            <div class="d-flex align-center ga-3">
              <v-avatar size="42" rounded="lg">
                <v-img
                  v-if="thumb(item)"
                  :src="thumb(item)"
                  cover
                />
                <v-icon v-else>mdi-image-off-outline</v-icon>
              </v-avatar>

              <div>
                <div
                  class="font-weight-bold"
                  style="cursor:pointer"
                  @click="goToProduct(item.product_id)"
                >
                  {{ item.product_name_snapshot || "Producto" }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  SKU: {{ item.product_sku_snapshot || "—" }}
                </div>
              </div>
            </div>
          </template>

          <template #item.quantity="{ item }">
            <b>{{ item.quantity }}</b>
          </template>

          <template #item.unit_price="{ item }">
            {{ money(item.unit_price) }}
          </template>

          <template #item.line_total="{ item }">
            <b>{{ money(item.line_total) }}</b>
          </template>

          <!-- ACCIONES -->
          <template #item.actions="{ item }">
            <v-btn
              size="small"
              variant="tonal"
              color="primary"
              @click="goToProduct(item.product_id)"
            >
              <v-icon start>mdi-package-variant</v-icon>
              Perfil
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>

      <v-card-text v-else>
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

// headers tabla
const itemsHeaders = [
  { title: "Producto", key: "product", sortable: false },
  { title: "Cant.", key: "quantity", sortable: false, width: 90 },
  { title: "Unit.", key: "unit_price", sortable: false, width: 140 },
  { title: "Total", key: "line_total", sortable: false, width: 140 },
  { title: "Acciones", key: "actions", sortable: false, width: 160 },
];

function money(v) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" })
    .format(Number(v || 0));
}

function dt(v) {
  return v ? new Date(v).toLocaleString("es-AR") : "—";
}

function statusColor(s) {
  if (s === "PAID") return "green";
  if (s === "CANCELLED") return "red";
  if (s === "REFUNDED") return "orange";
  return "grey";
}

function thumb(item) {
  return (
    item.product_image_snapshot ||
    item.image_snapshot ||
    item.product?.image_url ||
    ""
  );
}

function goToProduct(pid) {
  if (!pid) return;
  router.push({ name: "productProfile", params: { id: pid } });
}

async function load() {
  loading.value = true;
  try {
    const { data } = await http.get(`/pos/sales/${id.value}`);
    if (!data?.ok) throw new Error();
    sale.value = data.data;
  } catch {
    sale.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
