<template>
  <v-container fluid class="pa-4 bg-grey-lighten-4" style="min-height:100vh;">
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Producto #{{ id }}</div>
        <div class="text-caption text-medium-emphasis">Perfil / ficha</div>
      </div>
      <v-btn variant="tonal" @click="$router.back()">
        <v-icon start>mdi-arrow-left</v-icon> Volver
      </v-btn>
    </div>

    <v-card class="rounded-xl" elevation="1">
      <v-card-text v-if="loading" class="py-10 d-flex justify-center">
        <v-progress-circular indeterminate />
      </v-card-text>

      <v-card-text v-else-if="product">
        <v-row dense>
          <v-col cols="12" md="4">
            <v-card class="rounded-xl" elevation="0" style="background: rgba(0,0,0,.03);">
              <v-card-text>
                <div class="text-caption text-medium-emphasis">Nombre</div>
                <div class="text-h6 font-weight-black">{{ product.name }}</div>

                <div class="d-flex ga-2 mt-3">
                  <v-chip size="small" variant="tonal">SKU: {{ product.sku }}</v-chip>
                  <v-chip size="small" variant="tonal">Code: {{ product.code || "—" }}</v-chip>
                </div>

                <div class="text-caption text-medium-emphasis mt-3">Barcode</div>
                <div class="text-body-2 font-weight-medium">{{ product.barcode || "—" }}</div>

                <div class="text-caption text-medium-emphasis mt-3">Categoría</div>
                <div class="text-body-2 font-weight-medium">
                  {{ product.category?.name || "—" }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="8">
            <v-card class="rounded-xl" elevation="0" style="background: rgba(0,0,0,.03);">
              <v-card-text>
                <div class="text-subtitle-2 font-weight-bold mb-2">Precios</div>

                <v-row dense>
                  <v-col cols="12" sm="6" md="4">
                    <div class="text-caption text-medium-emphasis">Costo</div>
                    <div class="text-h6 font-weight-black">{{ money(product.cost) }}</div>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <div class="text-caption text-medium-emphasis">Precio</div>
                    <div class="text-h6 font-weight-black">{{ money(product.price) }}</div>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <div class="text-caption text-medium-emphasis">Lista</div>
                    <div class="text-h6 font-weight-black">{{ money(product.price_list) }}</div>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <div class="text-caption text-medium-emphasis">Descuento</div>
                    <div class="text-h6 font-weight-black">{{ money(product.price_discount) }}</div>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <div class="text-caption text-medium-emphasis">Revendedor</div>
                    <div class="text-h6 font-weight-black">{{ money(product.price_reseller) }}</div>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <div class="text-caption text-medium-emphasis">IVA</div>
                    <div class="text-h6 font-weight-black">{{ Number(product.tax_rate || 0).toFixed(2) }}%</div>
                  </v-col>
                </v-row>

                <v-divider class="my-3" />

                <div class="text-subtitle-2 font-weight-bold mb-1">Descripción</div>
                <div class="text-body-2">
                  {{ product.description || "—" }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-text v-else class="text-medium-emphasis">
        Producto no encontrado.
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import http from "../../../app/api/http";

const route = useRoute();
const id = computed(() => route.params.id);

const loading = ref(false);
const product = ref(null);

function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}

async function load() {
  loading.value = true;
  try {
    const { data } = await http.get(`/products/${id.value}`);
    if (!data?.ok) throw new Error(data?.message || "Error");
    product.value = data.data;
  } catch (e) {
    product.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
