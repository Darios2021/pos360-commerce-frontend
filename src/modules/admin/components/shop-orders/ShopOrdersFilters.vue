<template>
  <div class="filters">
    <v-text-field
      v-model="m.q"
      label="Buscar (código, email, cliente, id)"
      variant="outlined"
      density="comfortable"
      prepend-inner-icon="mdi-magnify"
      clearable
      @keyup.enter="$emit('apply')"
    />

    <v-select
      v-model="m.status"
      label="Estado (pedido)"
      :items="statusItems"
      item-title="title"
      item-value="value"
      variant="outlined"
      density="comfortable"
      clearable
    />

    <v-select
      v-model="m.fulfillment_type"
      label="Entrega"
      :items="fulfillmentItems"
      item-title="title"
      item-value="value"
      variant="outlined"
      density="comfortable"
      clearable
    />

    <v-select
      v-model="m.branch_id"
      label="Sucursal"
      :items="branchItems"
      item-title="title"
      item-value="value"
      variant="outlined"
      density="comfortable"
      clearable
    />

    <v-btn color="primary" variant="flat" class="btn-apply" @click="$emit('apply')" :loading="loading">
      Aplicar
    </v-btn>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  statusItems: { type: Array, default: () => [] },
  fulfillmentItems: { type: Array, default: () => [] },
  branchItems: { type: Array, default: () => [] },
});
const emit = defineEmits(["update:modelValue", "apply"]);

const m = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});
</script>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: 1.3fr 0.9fr 0.9fr 0.8fr auto;
  gap: 12px;
  align-items: center;
}
@media (max-width: 1100px) {
  .filters { grid-template-columns: 1fr 1fr; }
  .btn-apply { grid-column: 1 / -1; }
}
</style>
