<!-- src/modules/products/components/form/ProductPreciosPanel.vue -->
<template>
  <v-row dense>
    <v-col cols="12" md="4">
      <v-text-field
        v-model="m.price_list"
        label="Precio lista"
        type="number"
        variant="outlined"
        density="comfortable"
        :error-messages="fieldErr('price_list')"
      />
    </v-col>

    <v-col cols="12" md="4">
      <v-text-field
        v-model="m.price_discount"
        label="Precio descuento"
        type="number"
        variant="outlined"
        density="comfortable"
        :error-messages="fieldErr('price_discount')"
      />
    </v-col>

    <v-col cols="12" md="4">
      <v-text-field
        v-model="m.price_reseller"
        label="Precio revendedor"
        type="number"
        variant="outlined"
        density="comfortable"
        :error-messages="fieldErr('price_reseller')"
      />
    </v-col>
  </v-row>
</template>

<script setup>
import { computed } from "vue";
import { useProductsStore } from "../../../../app/store/products.store";

const props = defineProps({
  modelValue: { type: Object, required: true },
});
const emit = defineEmits(["update:modelValue"]);

const products = useProductsStore();

const m = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

function fieldErr(key) {
  const map = products.lastFieldErrors || null;
  if (!map) return [];
  const v = map[key];
  return v ? [String(v)] : [];
}
</script>
