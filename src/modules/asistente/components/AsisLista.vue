<!-- BLOQUE LISTA: sugerencias o pasos. Título y una línea de detalle cada uno. -->
<template>
  <div class="asis-b-lista">
    <h4 v-if="titulo">{{ titulo }}</h4>
    <ul>
      <li v-for="(i, k) in items" :key="k"><div><b>{{ i.titulo }}</b><span v-if="i.detalle">{{ i.detalle }}</span></div></li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  titulo: String,
  /** Como mucho 5. */
  items: { type: Array, required: true },
});
</script>
