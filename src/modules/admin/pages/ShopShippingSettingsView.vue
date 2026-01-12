<!-- src/modules/admin/pages/ShopShippingSettingsView.vue -->
<template>
  <v-container class="mx-auto" style="max-width: 1100px;">
    <v-card rounded="xl" elevation="3" class="pa-4">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div>
          <div class="text-h6 font-weight-bold">Tienda · Envíos</div>
          <div class="text-caption text-medium-emphasis">
            Reglas de envío para San Juan y resto del país (estilo MercadoLibre).
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
            <div class="font-weight-bold mb-2">San Juan (local)</div>

            <v-switch v-model="form.sj_enabled" label="Habilitar envíos en San Juan" inset />
            <v-text-field
              v-model="form.sj_base_price"
              label="Precio base (ARS)"
              variant="outlined"
              density="comfortable"
              type="number"
              class="mt-2"
            />
            <v-text-field
              v-model="form.sj_free_from"
              label="Envío gratis desde (ARS)"
              variant="outlined"
              density="comfortable"
              type="number"
              class="mt-2"
            />

            <div class="text-caption text-medium-emphasis mt-2">
              Si total >= “gratis desde”, el envío queda en $0.
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card rounded="xl" variant="tonal" class="pa-3">
            <div class="font-weight-bold mb-2">Resto del país</div>

            <v-switch v-model="form.arg_enabled" label="Habilitar envíos Argentina" inset />
            <v-select
              v-model="form.arg_provider"
              :items="providers"
              label="Proveedor (luego conectamos API)"
              variant="outlined"
              density="comfortable"
              class="mt-2"
            />
            <v-text-field
              v-model="form.arg_note"
              label="Texto informativo (checkout)"
              variant="outlined"
              density="comfortable"
              class="mt-2"
            />
          </v-card>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <v-alert type="info" variant="tonal">
        Próximo: calculadora por CP (OCA/Andreani/Correo Argentino) + tiempos estimados.
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

const providers = [
  { title: "Manual (tabla propia)", value: "MANUAL" },
  { title: "Correo Argentino (pendiente)", value: "CORREO_ARG" },
  { title: "Andreani (pendiente)", value: "ANDREANI" },
  { title: "OCA (pendiente)", value: "OCA" },
];

const form = ref({
  sj_enabled: true,
  sj_base_price: 0,
  sj_free_from: 0,

  arg_enabled: true,
  arg_provider: "MANUAL",
  arg_note: "Calcularemos el costo según tu código postal.",
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    // TODO: GET /admin/shop/settings/shipping
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
    // TODO: PUT /admin/shop/settings/shipping
    snack.value = { show: true, text: "Guardado OK" };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo guardar.";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
