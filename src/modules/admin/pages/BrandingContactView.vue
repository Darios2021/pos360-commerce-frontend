<!-- /admin/shop/branding/contact — Datos institucionales del negocio para emails CRM -->

<template>
  <v-container class="mx-auto" style="max-width: 920px">
    <AppPageHeader
      icon="mdi-card-account-mail-outline"
      title="Contacto del negocio"
      :back-to="{ name: 'shopBranding' }"
    >
      <template #subtitle>
        Datos institucionales que aparecen en el pie de los emails CRM y en la metadata del shop.
        Es <strong>una sola</strong> dirección — los puntos físicos para retiro se gestionan en
        <router-link :to="{ name: 'adminBranches' }" class="text-decoration-underline">Sucursales</router-link>.
      </template>

      <v-btn
        color="primary"
        variant="flat"
        size="small"
        rounded="lg"
        prepend-icon="mdi-content-save"
        :loading="saving"
        :disabled="saving"
        @click="save"
      >
        Guardar
      </v-btn>
    </AppPageHeader>

    <v-card rounded="xl" elevation="3" class="pa-4">
      <v-alert v-if="error" type="error" variant="tonal" rounded="lg" class="mb-3" closable @click:close="error = ''">
        {{ error }}
      </v-alert>

      <!-- UBICACIÓN -->
      <div class="text-subtitle-2 font-weight-medium mb-1">Ubicación principal</div>
      <div class="text-caption text-medium-emphasis mb-3">
        Dirección que se muestra en el pie de cada email CRM y en la página de contacto.
      </div>

      <v-row dense>
        <v-col cols="12">
          <v-text-field
            v-model="form.address"
            label="Dirección del local"
            placeholder="Av. Siempreviva 742, San Juan"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            hide-details
            prepend-inner-icon="mdi-map-marker-outline"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="form.maps_url"
            label="URL de Google Maps (opcional)"
            placeholder="https://maps.app.goo.gl/..."
            variant="outlined"
            density="comfortable"
            rounded="lg"
            hide-details
            prepend-inner-icon="mdi-google-maps"
          />
        </v-col>
      </v-row>

      <v-divider class="my-5" />

      <!-- TELÉFONOS Y HORARIOS -->
      <div class="text-subtitle-2 font-weight-medium mb-1">Teléfonos y horarios</div>
      <div class="text-caption text-medium-emphasis mb-3">
        Datos de contacto que el cliente ve en el footer del shop y en los emails.
      </div>

      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.phone_display"
            label="Teléfono visible"
            placeholder="+54 264 1234-567"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            hide-details
            prepend-inner-icon="mdi-phone-outline"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.whatsapp_display"
            label="WhatsApp visible"
            placeholder="+54 9 264 1234-567"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            hide-details
            prepend-inner-icon="mdi-whatsapp"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="form.business_hours"
            label="Horario de atención"
            placeholder="Lun a Sáb · 9 a 19hs"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            hide-details
            prepend-inner-icon="mdi-clock-outline"
          />
        </v-col>
      </v-row>

      <v-divider class="my-5" />

      <!-- DATOS FISCALES -->
      <div class="text-subtitle-2 font-weight-medium mb-1">Datos fiscales</div>
      <div class="text-caption text-medium-emphasis mb-3">
        Salen en el encabezado del presupuesto, debajo de la dirección. Es lo que el
        cliente necesita para cargarlo en su contabilidad.
      </div>

      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.tax_id"
            label="CUIT"
            placeholder="30-71234567-8"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            hide-details
            prepend-inner-icon="mdi-card-account-details-outline"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.iibb"
            label="Ingresos Brutos"
            placeholder="Convenio Multilateral 901-123456-7"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            hide-details
            prepend-inner-icon="mdi-file-document-outline"
          />
        </v-col>
      </v-row>

      <v-divider class="my-5" />

      <!-- PRESUPUESTOS -->
      <div class="text-subtitle-2 font-weight-medium mb-1">Observaciones del presupuesto</div>
      <div class="text-caption text-medium-emphasis mb-3">
        Con esto arranca cada presupuesto nuevo. Adentro del presupuesto se puede
        cambiar sin tocar esta plantilla.
      </div>

      <v-textarea
        v-model="form.budget_notes_default"
        label="Condiciones de pago, entrega y garantía"
        placeholder="Condiciones de Pago&#10;     Tarjetas bancarias: Hasta 6 cuotas sin interés.&#10;     Contado efectivo / Transferencia: 20% de descuento sobre el total.&#10;Plazo de Entrega e Instalación&#10;     Coordinación: La fecha de instalación se definirá de común acuerdo con el cliente.&#10;Garantía&#10;     SOBRE LA INSTALACION: 30 días de cobertura directa.&#10;     SOBRE LOS EQUIPOS INSTALADOS: POR FALLA DE FABRICA 1 año de garantía oficial del fabricante."
        variant="outlined"
        density="comfortable"
        rounded="lg"
        hide-details
        rows="8"
        auto-grow
      />

      <v-divider class="my-5" />

      <!-- COPY EMAILS -->
      <div class="text-subtitle-2 font-weight-medium mb-1">Mensajes en emails CRM</div>
      <div class="text-caption text-medium-emphasis mb-3">
        El <strong>tagline</strong> aparece en el header de cada email; la <strong>nota legal</strong> aparece en el pie.
      </div>

      <v-row dense>
        <v-col cols="12">
          <v-text-field
            v-model="form.tagline"
            label="Tagline / slogan"
            placeholder="Tecnología de confianza desde 2010"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            hide-details
            prepend-inner-icon="mdi-format-quote-open-outline"
          />
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="form.footer_note"
            label="Nota legal del pie del email (opcional)"
            placeholder="Recibís este correo porque sos cliente de…"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            hide-details
            rows="2"
            auto-grow
          />
        </v-col>
      </v-row>
    </v-card>

    <v-snackbar v-model="snack.show" :timeout="2400">{{ snack.text }}</v-snackbar>
  </v-container>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { getShopBranding, updateShopBranding } from "@/modules/shop/service/admin.shopBranding.api";
import AppPageHeader from "@/app/components/AppPageHeader.vue";

const saving = ref(false);
const error = ref("");
const snack = ref({ show: false, text: "" });

const form = ref({
  address: "",
  maps_url: "",
  phone_display: "",
  whatsapp_display: "",
  business_hours: "",
  tagline: "",
  footer_note: "",
  tax_id: "",
  iibb: "",
  budget_notes_default: "",
});

async function load() {
  error.value = "";
  try {
    const it = await getShopBranding();
    if (it) {
      form.value = {
        address: it.address || "",
        maps_url: it.maps_url || "",
        phone_display: it.phone_display || "",
        whatsapp_display: it.whatsapp_display || "",
        business_hours: it.business_hours || "",
        tagline: it.tagline || "",
        footer_note: it.footer_note || "",
        tax_id: it.tax_id || "",
        iibb: it.iibb || "",
        budget_notes_default: it.budget_notes_default || "",
      };
    }
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo cargar el contacto.";
  }
}

async function save() {
  saving.value = true;
  error.value = "";
  try {
    await updateShopBranding({ ...form.value });
    snack.value = { show: true, text: "Datos guardados" };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo guardar.";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
