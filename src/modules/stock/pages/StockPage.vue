<template>
  <div class="page">
    <div class="topbar">
      <div>
        <div class="text-h5 font-weight-bold">Stock</div>
        <div class="text-caption text-medium-emphasis">
          Existencias y movimientos (próximo paso)
        </div>
      </div>

      <div class="actions">
        <v-btn color="primary" prepend-icon="mdi-swap-vertical">
          Nuevo movimiento
        </v-btn>
      </div>
    </div>

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

<script setup></script>

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
