<template>
  <v-dialog v-model="open" max-width="520">
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="text-h6 font-weight-bold">Subir comprobante</div>
        <v-btn icon variant="text" @click="close"><v-icon>mdi-close</v-icon></v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-alert v-if="error" type="error" variant="tonal" class="mb-3">{{ error }}</v-alert>

        <div class="muted mb-2">Pago #{{ payment?.id }} · Pedido #{{ orderId }}</div>

        <v-text-field
          v-model="bankRef"
          label="Referencia / Nro operación (opcional)"
          variant="outlined"
          density="comfortable"
        />

        <v-file-input
          v-model="fileModel"
          label="Archivo"
          variant="outlined"
          density="comfortable"
          accept="image/*,.pdf"
          prepend-icon="mdi-paperclip"
        />

        <div class="text-caption text-medium-emphasis mt-1">
          Se sube a storage (S3/MinIO) y queda asociado al pago.
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="tonal" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" :loading="loading" prepend-icon="mdi-cloud-upload" @click="$emit('submit')">
          Subir
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
  payment: { type: Object, default: null },
  orderId: { type: [String, Number], default: null },
  bank_reference: { type: String, default: "" },
  file: { default: null },
});

const emit = defineEmits([
  "update:modelValue",
  "close",
  "submit",
  "update:bank_reference",
  "update:file",
]);

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const bankRef = computed({
  get: () => props.bank_reference,
  set: (v) => emit("update:bank_reference", v),
});

const fileModel = computed({
  get: () => props.file,
  set: (v) => emit("update:file", v),
});

function close() {
  emit("update:modelValue", false);
  emit("close");
}
</script>

<style scoped>
.muted { opacity: .72; font-size: 12px; }
</style>
