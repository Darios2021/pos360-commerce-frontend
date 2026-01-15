<!-- src/modules/products/components/form/ProductEstadoPanel.vue -->
<template>
  <v-row dense>
    <v-col cols="12" md="4">
      <v-switch v-model="m.is_active" label="Activo" inset />
    </v-col>
    <v-col cols="12" md="4">
      <v-switch v-model="m.track_stock" label="Track stock" inset />
    </v-col>
  </v-row>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
});
const emit = defineEmits(["update:modelValue"]);

const m = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});
</script>
