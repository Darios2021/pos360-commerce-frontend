<!-- src/modules/admin/pages/ShopPickupSettingsView.vue -->
<template>
  <v-container class="mx-auto" style="max-width: 1100px;">
    <v-card rounded="xl" elevation="3" class="pa-4">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div>
          <div class="text-h6 font-weight-bold">Tienda · Retiros</div>
          <div class="text-caption text-medium-emphasis">
            Retiro en sucursal según disponibilidad real de stock (MercadoLibre-like).
          </div>
        </div>

        <div class="d-flex ga-2">
          <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="load" :loading="loading">
            Recargar
          </v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save" @click="save" :loading="saving">
            Guardar
          </v-btn>
        </div>
      </v-card-title>

      <v-divider class="my-3" />

      <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
        {{ error }}
      </v-alert>

      <v-row dense>
        <v-col cols="12" md="6">
          <v-card rounded="xl" variant="tonal" class="pa-3">
            <div class="font-weight-bold mb-2">Reglas</div>

            <v-switch v-model="form.pickup_enabled" label="Habilitar retiro en sucursal" inset />
            <v-switch
              v-model="form.only_branches_with_stock"
              label="Mostrar solo sucursales con stock disponible"
              inset
            />

            <v-text-field
              v-model="form.pickup_eta_hours"
              label="Tiempo estimado de preparación (horas)"
              variant="outlined"
              density="comfortable"
              type="number"
              class="mt-2"
            />

            <div class="text-caption text-medium-emphasis mt-2">
              Cuando conectemos el backend: el checkout listará sucursales donde el producto tenga stock &gt; 0.
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card rounded="xl" variant="tonal" class="pa-3">
            <div class="font-weight-bold mb-2">Texto en checkout</div>

            <v-textarea
              v-model="form.pickup_note"
              label="Nota para el cliente"
              variant="outlined"
              density="comfortable"
              rows="4"
            />
            <div class="text-caption text-medium-emphasis mt-2">
              Ej: “Te avisamos cuando esté listo para retirar”.
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <v-alert type="info" variant="tonal">
        Próximo: endpoint “branches disponibles por carrito” para mezclar productos y devolver solo sucursales válidas.
      </v-alert>
    </v-card>

    <v-snackbar v-model="snack.show" :timeout="2800">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";

const loading = ref(false);
const saving = ref(false);
const error = ref("");
const snack = ref({ show: false, text: "" });

const form = ref({
  pickup_enabled: true,
  only_branches_with_stock: true,
  pickup_eta_hours: 2,
  pickup_note: "Retirá en sucursal. Te avisamos cuando esté listo.",
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    // TODO: GET /admin/shop/settings/pickup
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo cargar.";
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  error.value = "";
  try {
    // TODO: PUT /admin/shop/settings/pickup
    snack.value = { show: true, text: "Guardado OK" };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo guardar.";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
