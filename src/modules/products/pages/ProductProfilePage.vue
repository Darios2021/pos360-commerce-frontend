<template>
  <v-container fluid class="pa-4 bg-grey-lighten-4" style="min-height:100vh;">
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Perfil de Producto</div>
        <div class="text-caption text-medium-emphasis">
          ID: {{ id }} · {{ product?.sku || "—" }}
        </div>
      </div>

      <div class="d-flex ga-2">
        <v-btn variant="tonal" @click="$router.back()">
          <v-icon start>mdi-arrow-left</v-icon> Volver
        </v-btn>
        <v-btn color="primary" variant="flat" :loading="loading" @click="load">
          <v-icon start>mdi-refresh</v-icon> Actualizar
        </v-btn>
      </div>
    </div>

    <v-card class="rounded-xl" elevation="1">
      <v-card-text v-if="loading" class="py-10 d-flex justify-center">
        <v-progress-circular indeterminate />
      </v-card-text>

      <v-card-text v-else-if="product">
        <v-row dense>
          <!-- Columna izquierda -->
          <v-col cols="12" md="4">
            <v-card class="rounded-xl" elevation="0" style="background: rgba(0,0,0,.03);">
              <v-card-text>
                <div class="text-caption text-medium-emphasis">Nombre</div>
                <div class="text-h6 font-weight-black">{{ product.name }}</div>

                <div class="d-flex flex-wrap ga-2 mt-3">
                  <v-chip size="small" variant="tonal">SKU: {{ product.sku }}</v-chip>
                  <v-chip size="small" variant="tonal">Código: {{ product.code || "—" }}</v-chip>
                  <v-chip size="small" variant="tonal">Barcode: {{ product.barcode || "—" }}</v-chip>
                </div>

                <div class="text-caption text-medium-emphasis mt-3">Categoría</div>
                <div class="text-body-2 font-weight-medium">
                  {{ product.category?.name || "—" }}
                  <span v-if="product.category?.parent?.name" class="text-medium-emphasis">
                    · Padre: {{ product.category.parent.name }}
                  </span>
                </div>

                <div class="text-caption text-medium-emphasis mt-3">Marca / Modelo</div>
                <div class="text-body-2 font-weight-medium">
                  {{ product.brand || "—" }} · {{ product.model || "—" }}
                </div>

                <div class="text-caption text-medium-emphasis mt-3">Garantía</div>
                <div class="text-body-2 font-weight-medium">
                  {{ product.warranty_months || 0 }} meses
                </div>

                <div class="d-flex flex-wrap ga-2 mt-3">
                  <v-chip size="small" variant="tonal" :color="product.is_active ? 'green' : 'grey'">
                    {{ product.is_active ? "Activo" : "Inactivo" }}
                  </v-chip>
                  <v-chip size="small" variant="tonal" :color="product.is_new ? 'primary' : 'grey'">
                    {{ product.is_new ? "Nuevo" : "No nuevo" }}
                  </v-chip>
                  <v-chip size="small" variant="tonal" :color="product.is_promo ? 'orange' : 'grey'">
                    {{ product.is_promo ? "Promo" : "No promo" }}
                  </v-chip>
                  <v-chip size="small" variant="tonal" :color="product.track_stock ? 'indigo' : 'grey'">
                    {{ product.track_stock ? "Control stock" : "Sin stock" }}
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>

            <!-- Imágenes -->
            <v-card class="rounded-xl mt-3" elevation="1">
              <v-card-title class="text-subtitle-1 font-weight-bold">Imágenes</v-card-title>
              <v-divider />
              <v-card-text>
                <div v-if="!product.images || product.images.length === 0" class="text-caption text-medium-emphasis">
                  Sin imágenes
                </div>

                <v-row v-else dense>
                  <v-col
                    v-for="img in product.images"
                    :key="img.id"
                    cols="6"
                  >
                    <v-img
                      :src="img.url || img.public_url || img.path"
                      aspect-ratio="1"
                      cover
                      class="rounded-lg border"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Columna derecha -->
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

                <v-divider class="my-4" />

                <div class="text-subtitle-2 font-weight-bold mb-1">Descripción</div>
                <div class="text-body-2">
                  {{ product.description || "—" }}
                </div>
              </v-card-text>
            </v-card>

            <!-- Información técnica / timestamps -->
            <v-card class="rounded-xl mt-3" elevation="1">
              <v-card-title class="text-subtitle-1 font-weight-bold">Información</v-card-title>
              <v-divider />
              <v-card-text class="text-body-2">
                <div class="d-flex justify-space-between py-1">
                  <span class="text-medium-emphasis">Creado</span>
                  <span class="font-weight-medium">{{ dt(product.created_at) }}</span>
                </div>
                <div class="d-flex justify-space-between py-1">
                  <span class="text-medium-emphasis">Actualizado</span>
                  <span class="font-weight-medium">{{ dt(product.updated_at) }}</span>
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

    <v-snackbar v-model="snack.show" :timeout="3000">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import http from "../../../app/api/http";

const route = useRoute();
const id = computed(() => route.params.id);

const loading = ref(false);
const product = ref(null);
const snack = ref({ show: false, text: "" });

function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}
function dt(val) {
  if (!val) return "—";
  return new Date(val).toLocaleString("es-AR");
}

async function load() {
  loading.value = true;
  try {
    // ✅ TU API REAL DEVUELVE: { ok: true, item }
    const { data } = await http.get(`/products/${id.value}`);
    if (!data?.ok) throw new Error(data?.message || "Error");
    product.value = data.item;
  } catch (e) {
    product.value = null;
    snack.value = { show: true, text: e.message || "Error cargando producto" };
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(id, () => load());
</script>

<style scoped>
.border {
  border: 1px solid rgba(0,0,0,.08);
}
</style>
