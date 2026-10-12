<!-- La tarjeta de un gráfico: banda con título y alcance, y el cuerpo. -->
<template>
  <div class="asis-tarjeta">
    <div class="asis-banda"><b>{{ titulo }}</b><span v-if="alcance">{{ alcance }}</span></div>
    <div class="asis-cuerpo"><slot /></div>
  </div>
</template>

<script setup>
defineProps({ titulo: { type: String, required: true }, alcance: String });
</script>
