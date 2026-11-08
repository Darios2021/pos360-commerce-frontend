<template>
  <!-- Asistente en escritorio (2026-11-08, como Alade /ia): pestaña propia, sin el
       menú del sistema, con la barra lateral de conversaciones a lo alto. -->
  <v-app>
    <AsistentePage ventana />
  </v-app>
</template>

<script setup>
import AsistentePage from "./AsistentePage.vue";
</script>
