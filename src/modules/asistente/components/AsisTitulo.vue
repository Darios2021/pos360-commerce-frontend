<!-- BLOQUE TITULO: la primera línea de una respuesta y su alcance (sucursal, fechas). -->
<template>
  <div class="asis-b-titulo">
    <h3>{{ texto }}</h3>
    <p v-if="alcance">{{ alcance }}</p>
  </div>
</template>

<script setup>
defineProps({ texto: { type: String, required: true }, alcance: String });
</script>
