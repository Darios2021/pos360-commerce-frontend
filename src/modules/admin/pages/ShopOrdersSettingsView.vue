<!-- src/modules/admin/pages/ShopOrdersSettingsView.vue -->
<template>
  <v-container class="mx-auto" style="max-width: 1100px;">
    <v-card rounded="xl" elevation="3" class="pa-4">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div>
          <div class="text-h6 font-weight-bold">Tienda · Pedidos</div>
          <div class="text-caption text-medium-emphasis">
            Configurá la recepción de pedidos, estados y comportamiento del checkout.
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
            <div class="font-weight-bold mb-2">Estados de pedido</div>

            <v-select
              v-model="form.default_status"
              :items="statusItems"
              label="Estado inicial"
              variant="outlined"
              density="comfortable"
            />

            <v-switch
              v-model="form.auto_reserve_stock"
              label="Reservar stock al confirmar checkout"
              inset
              class="mt-2"
            />

            <v-switch
              v-model="form.allow_guest_checkout"
              label="Permitir compra sin cuenta"
              inset
            />

            <div class="text-caption text-medium-emphasis mt-2">
              Recomendado: reservar stock cuando el cliente confirma “Continuar compra”.
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card rounded="xl" variant="tonal" class="pa-3">
            <div class="font-weight-bold mb-2">Notificaciones</div>

            <v-switch
              v-model="form.notify_admin_new_order"
              label="Notificar al admin cuando entra un pedido"
              inset
            />

            <v-text-field
              v-model="form.notify_email"
              label="Email para notificaciones (opcional)"
              variant="outlined"
              density="comfortable"
              class="mt-2"
            />

            <div class="text-caption text-medium-emphasis mt-2">
              Luego lo conectamos con email/WhatsApp/Telegram.
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <v-alert type="info" variant="tonal">
        Esta pantalla es la base. Próximo paso: guardar/leer estas configs desde backend (tabla shop_settings o similar).
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

const statusItems = [
  { title: "Pendiente", value: "PENDING" },
  { title: "Confirmado", value: "CONFIRMED" },
  { title: "En preparación", value: "PREPARING" },
  { title: "Listo para retirar", value: "READY_PICKUP" },
  { title: "Enviado", value: "SHIPPED" },
  { title: "Entregado", value: "DELIVERED" },
  { title: "Cancelado", value: "CANCELLED" },
];

const form = ref({
  default_status: "PENDING",
  auto_reserve_stock: true,
  allow_guest_checkout: true,
  notify_admin_new_order: true,
  notify_email: "",
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    // TODO: GET /admin/shop/settings/orders
    // const data = await api.get...
    // form.value = { ...form.value, ...data }
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
    // TODO: PUT /admin/shop/settings/orders
    // await api.put...
    snack.value = { show: true, text: "Guardado OK" };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo guardar.";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
