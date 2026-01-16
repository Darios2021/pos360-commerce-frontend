<!-- src/modules/products/components/panels/ProductPricesPanel.vue -->
<template>
  <v-row dense>
    <v-col cols="12" md="4">
      <v-text-field v-model="m.price_list" label="Precio lista" type="number" variant="outlined" density="comfortable" :disabled="disabled" />
    </v-col>
    <v-col cols="12" md="4">
      <v-text-field v-model="m.price_discount" label="Precio descuento" type="number" variant="outlined" density="comfortable" :disabled="disabled" />
    </v-col>
    <v-col cols="12" md="4">
      <v-text-field v-model="m.price_reseller" label="Precio revendedor" type="number" variant="outlined" density="comfortable" :disabled="disabled" />
    </v-col>
  </v-row>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);

const m = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});
</script>
