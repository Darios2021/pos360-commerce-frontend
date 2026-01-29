<template>
  <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
    <div>
      <div class="text-h6 font-weight-bold">Tienda · Pedidos</div>
      <div class="text-caption text-medium-emphasis">Bandeja de pedidos del ecommerce (ecom_orders).</div>
    </div>

    <div class="d-flex ga-2">
      <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="$emit('reload')" :loading="loading">
        Recargar
      </v-btn>
    </div>
  </v-card-title>
</template>

<script setup>
defineProps({ loading: { type: Boolean, default: false } });
defineEmits(["reload"]);
</script>
