<template>
  <v-container fluid class="pa-4">
    <v-card elevation="2" rounded="xl">
      <v-card-title class="text-h6 font-weight-bold">
        Productos
      </v-card-title>

      <v-card-text>
        <v-alert type="info" variant="tonal">
          Vista de Productos conectada correctamente 🎉
        </v-alert>

        <v-btn color="primary" class="mt-4" @click="goHome">
          Volver al dashboard
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

function goHome() {
  router.push({ name: "home" });
}
</script>
