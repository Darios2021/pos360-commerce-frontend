<!--
  BLOQUE LISTA: sugerencias, pasos o productos. Título y una línea de detalle cada uno.
  Si algún item trae la foto del producto, la foto toma el lugar de la viñeta.
-->
<template>
  <div :class="['asis-b-lista', { 'con-foto': conFoto }]">
    <h4 v-if="titulo">{{ titulo }}</h4>
    <ul>
      <li v-for="(i, k) in items" :key="k">
        <AsisFoto v-if="conFoto" :src="i.foto" :alt="i.titulo" />
        <div><b>{{ i.titulo }}</b><span v-if="i.detalle">{{ i.detalle }}</span></div>
      </li>
    </ul>
    <p v-if="resto > 0" class="asis-resto">y {{ resto }} más</p>
  </div>
</template>

<script setup>
import { computed } from "vue";
import AsisFoto from "./AsisFoto.vue";

const props = defineProps({
  titulo: String,
  /** Como mucho 8. */
  items: { type: Array, required: true },
  resto: { type: Number, default: 0 },
});
const conFoto = computed(() => props.items.some((i) => i.foto));
</script>
