<template>
  <div class="page">
    <AppPageHeader
      icon="mdi-warehouse"
      title="Stock"
      subtitle="Existencias y movimientos (próximo paso)"
    >
      <v-btn color="primary" variant="flat" size="small" rounded="lg" prepend-icon="mdi-swap-vertical">
        Nuevo movimiento
      </v-btn>
    </AppPageHeader>

    <v-alert type="info" variant="tonal" class="mb-4">
      Esta pantalla la dejamos estable y después armamos: <b>Existencias</b>, <b>Movimientos</b>, <b>Kardex</b>.
    </v-alert>

    <v-card rounded="xl">
      <v-card-text class="py-10 text-center text-medium-emphasis">
        Módulo en preparación.
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import AppPageHeader from "@/app/components/AppPageHeader.vue";
</script>

<style scoped>
.page {
  padding-bottom: 80px;
}

.topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
</style>
