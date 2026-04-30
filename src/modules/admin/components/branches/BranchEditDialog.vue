<!-- Dialog de creación / edición de sucursal -->

<template>
  <v-dialog v-model="open" max-width="900" scrollable @after-enter="onAfterEnter">
    <v-card rounded="xl">
      <v-toolbar color="surface" density="compact" class="px-3">
        <v-icon class="me-2">{{ isEdit ? "mdi-map-marker-outline" : "mdi-plus-circle-outline" }}</v-icon>
        <v-toolbar-title class="text-subtitle-1 font-weight-medium">
          {{ isEdit ? `Editar · ${form.name || "Sucursal"}` : "Nueva sucursal" }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-divider />

      <v-card-text class="pa-4">
        <v-alert
          v-if="errorMsg"
          type="error"
          variant="tonal"
          rounded="lg"
          class="mb-3"
        >
          {{ errorMsg }}
        </v-alert>

        <!-- DATOS BÁSICOS -->
        <div class="text-subtitle-2 font-weight-medium mb-3">Datos básicos</div>

        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="form.code"
              label="Código *"
              placeholder="Ej. RIV"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details="auto"
              :rules="[(v) => !!v || 'Obligatorio']"
            />
          </v-col>
          <v-col cols="12" md="8">
            <v-text-field
              v-model="form.name"
              label="Nombre *"
              placeholder="Ej. Sucursal Rivadavia"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details="auto"
              :rules="[(v) => !!v || 'Obligatorio']"
            />
          </v-col>

          <v-col cols="12">
            <v-text-field
              v-model="form.address"
              label="Dirección"
              placeholder="Calle y número"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              prepend-inner-icon="mdi-map-marker-outline"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.city"
              label="Ciudad / Departamento"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.province"
              label="Provincia"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
            />
          </v-col>
        </v-row>

        <v-divider class="my-5" />

        <!-- UBICACIÓN GEO -->
        <div class="d-flex align-center justify-space-between mb-1">
          <div class="text-subtitle-2 font-weight-medium">Ubicación en el mapa</div>
        </div>
        <div class="text-caption text-medium-emphasis mb-3">
          Se muestra al cliente en el checkout para que pueda ver y elegir la sucursal.
          <strong>Si tu negocio está cargado en Google Maps</strong>, buscalo por nombre
          (ej. "San Juan Tecnología") y autocompletamos teléfono, horarios y dirección.
        </div>

        <BranchLocationPicker
          ref="locationPickerRef"
          v-model="geo"
          :initial-address="addressForGeocoding"
          @geocode="onGeocoded"
        />

        <v-divider class="my-5" />

        <!-- CONTACTO -->
        <div class="text-subtitle-2 font-weight-medium mb-3">Contacto y horarios</div>

        <v-row dense>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.phone"
              label="Teléfono"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              prepend-inner-icon="mdi-phone-outline"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.hours"
              label="Horarios"
              placeholder="Ej. Lun a Vie 9 a 18 hs"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              prepend-inner-icon="mdi-clock-outline"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="form.maps_url"
              label="Link directo a Google Maps (opcional)"
              placeholder="https://maps.app.goo.gl/..."
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              prepend-inner-icon="mdi-link-variant"
            />
          </v-col>
        </v-row>

        <v-divider class="my-5" />

        <!-- ESTADO -->
        <div class="text-subtitle-2 font-weight-medium mb-2">Estado</div>
        <v-switch
          v-model="form.is_active"
          color="primary"
          density="comfortable"
          hide-details
          inset
          :label="form.is_active ? 'Activa (visible para clientes)' : 'Inactiva (oculta del shop)'"
        />
      </v-card-text>

      <v-divider />

      <v-card-actions class="px-4 py-3">
        <v-btn variant="text" rounded="lg" @click="close" :disabled="saving">Cancelar</v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          prepend-icon="mdi-content-save"
          :loading="saving"
          :disabled="!canSave"
          @click="save"
        >
          {{ isEdit ? "Guardar cambios" : "Crear sucursal" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { createBranch, updateBranch } from "@/modules/admin/services/branches.api";
import BranchLocationPicker from "@/modules/admin/components/branches/BranchLocationPicker.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  branch: { type: Object, default: null },
});

const emit = defineEmits(["update:modelValue", "saved"]);

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const isEdit = computed(() => !!props.branch?.id);
const saving = ref(false);
const errorMsg = ref("");
const locationPickerRef = ref(null);

const emptyForm = () => ({
  code: "",
  name: "",
  address: "",
  city: "",
  province: "San Juan",
  phone: "",
  hours: "",
  maps_url: "",
  is_active: true,
});

const form = ref(emptyForm());
const geo = ref({ latitude: null, longitude: null });

const canSave = computed(() => !!form.value.code?.trim() && !!form.value.name?.trim());

const addressForGeocoding = computed(() => {
  return [form.value.address, form.value.city, form.value.province]
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .join(", ");
});

watch(
  () => [props.modelValue, props.branch],
  ([isOpen, b]) => {
    if (!isOpen) return;
    errorMsg.value = "";
    if (b && b.id) {
      form.value = {
        code: b.code || "",
        name: b.name || "",
        address: b.address || "",
        city: b.city || "",
        province: b.province || "San Juan",
        phone: b.phone || "",
        hours: b.hours || "",
        maps_url: b.maps_url || "",
        is_active: b.is_active !== false && b.is_active !== 0,
      };
      geo.value = {
        latitude: b.latitude !== null && b.latitude !== undefined ? Number(b.latitude) : null,
        longitude: b.longitude !== null && b.longitude !== undefined ? Number(b.longitude) : null,
      };
    } else {
      form.value = emptyForm();
      geo.value = { latitude: null, longitude: null };
    }
  },
  { immediate: true }
);

/**
 * Cuando el user busca un lugar en el mapa y Places API devuelve datos del
 * negocio (teléfono, horarios, link de Maps), autocompletamos los campos
 * del form que estén vacíos. NO pisa lo que el admin ya haya escrito.
 */
function onGeocoded(data = {}) {
  const { display_name, name, address, phone, hours, maps_url } = data;

  // Nombre: si vacío, usar el displayName de Places.
  if (!form.value.name && name) {
    form.value.name = name;
  }

  // Dirección: usar la formattedAddress de Places, sino derivar del display_name.
  if (!form.value.address) {
    if (address) {
      form.value.address = address;
    } else if (display_name) {
      const head = String(display_name).split(",").slice(0, 1).join(",").trim();
      if (head) form.value.address = head;
    }
  }

  // Teléfono: nationalPhoneNumber de Places.
  if (!form.value.phone && phone) {
    form.value.phone = phone;
  }

  // Horarios: resumen de regularOpeningHours.
  if (!form.value.hours && hours) {
    form.value.hours = hours;
  }

  // Link directo a Google Maps.
  if (!form.value.maps_url && maps_url) {
    form.value.maps_url = maps_url;
  }
}

function close() {
  if (saving.value) return;
  open.value = false;
}

/**
 * Cuando termina la transición de apertura del v-dialog (~300ms),
 * forzamos al picker a recentrar el mapa. Sin esto Google Maps queda
 * mostrando una zona random porque el contenedor estaba con size 0
 * cuando se inicializó.
 */
function onAfterEnter() {
  const picker = locationPickerRef.value;
  if (picker?.recenterMap) {
    picker.recenterMap();
    setTimeout(() => picker.recenterMap?.(), 200);
  }
}

async function save() {
  errorMsg.value = "";
  saving.value = true;
  try {
    const payload = {
      ...form.value,
      latitude: geo.value.latitude,
      longitude: geo.value.longitude,
    };
    let saved;
    if (isEdit.value) {
      saved = await updateBranch(props.branch.id, payload);
    } else {
      saved = await createBranch(payload);
    }
    emit("saved", saved);
    open.value = false;
  } catch (e) {
    const status = e?.response?.status;
    const msg = e?.response?.data?.message || e?.message || "No se pudo guardar la sucursal.";
    if (status === 403) {
      errorMsg.value = "No tenés permisos para gestionar sucursales (requiere super_admin).";
    } else {
      errorMsg.value = msg;
    }
    console.warn("[BranchEditDialog] save error", e);
  } finally {
    saving.value = false;
  }
}
</script>
