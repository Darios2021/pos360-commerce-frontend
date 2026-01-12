<!-- src/modules/admin/pages/ShopNotificationsSettingsView.vue -->
<template>
  <v-container class="mx-auto" style="max-width: 1100px;">
    <v-card rounded="xl" elevation="3" class="pa-4">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div>
          <div class="text-h6 font-weight-bold">Tienda · Notificaciones</div>
          <div class="text-caption text-medium-emphasis">
            Mensajes automáticos para pedidos: admin, cliente y estado.
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
            <div class="font-weight-bold mb-2">Admin</div>
            <v-switch v-model="form.admin_email_enabled" label="Email admin (nuevo pedido)" inset />
            <v-text-field
              v-model="form.admin_email_to"
              label="Email destino"
              variant="outlined"
              density="comfortable"
              class="mt-2"
            />
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card rounded="xl" variant="tonal" class="pa-3">
            <div class="font-weight-bold mb-2">Cliente</div>
            <v-switch v-model="form.customer_email_enabled" label="Email cliente (confirmación)" inset />
            <v-switch v-model="form.customer_whatsapp_enabled" label="WhatsApp cliente (pendiente)" inset />
            <div class="text-caption text-medium-emphasis mt-2">
              WhatsApp lo conectamos con proveedor (ej. Twilio / WppConnect / etc).
            </div>
          </v-card>
        </v-col>

        <v-col cols="12">
          <v-card rounded="xl" variant="tonal" class="pa-3">
            <div class="font-weight-bold mb-2">Plantillas</div>

            <v-textarea
              v-model="form.template_order_created"
              label="Pedido creado"
              variant="outlined"
              density="comfortable"
              rows="3"
            />
            <v-textarea
              v-model="form.template_ready_pickup"
              label="Listo para retirar"
              variant="outlined"
              density="comfortable"
              rows="3"
              class="mt-2"
            />
          </v-card>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <v-alert type="info" variant="tonal">
        Próximo: disparar eventos desde backend cuando cambia estado del pedido (order_events).
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
  admin_email_enabled: true,
  admin_email_to: "",

  customer_email_enabled: true,
  customer_whatsapp_enabled: false,

  template_order_created: "¡Gracias! Tu pedido fue recibido. Te avisaremos cuando avance.",
  template_ready_pickup: "Tu pedido está listo para retirar. Gracias por elegirnos.",
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    // TODO: GET /admin/shop/settings/notifications
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
    // TODO: PUT /admin/shop/settings/notifications
    snack.value = { show: true, text: "Guardado OK" };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo guardar.";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
