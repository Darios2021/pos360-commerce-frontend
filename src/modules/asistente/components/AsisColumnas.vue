<!--
  BLOQUE COLUMNAS: una serie con orden propio (días, horas). Las destacadas van
  en el tono fuerte, con su cifra y etiqueta en negrita. Con más de 7 columnas
  sólo llevan cifra la mayor y las destacadas: si no, los montos se pisan.
-->
<template>
  <AsisTarjeta :titulo="titulo" :alcance="alcance">
    <div :class="['asis-cols', { densa: items.length > COLUMNAS_DENSAS }]">
      <div v-for="(i, k) in items" :key="k" :class="['asis-col', { dest: destacadas.has(k) }]">
        <span class="v num">{{ rotularColumna(k, items, destacar) ? corto(i.valor, unidad) : "\u00a0" }}</span>
        <span class="barra" :style="{ height: altoColumna(i.valor, max) + 'px' }" />
        <span class="e" :title="i.etiqueta">{{ i.etiqueta }}</span>
      </div>
    </div>
  </AsisTarjeta>
</template>

<script setup>
import { computed } from "vue";
import AsisTarjeta from "./AsisTarjeta.vue";
import { altoColumna, COLUMNAS_DENSAS, corto, rotularColumna } from "../lib/dibujo";

const props = defineProps({
  titulo: { type: String, required: true },
  alcance: String,
  unidad: { type: String, default: "u" },
  /** Como mucho 12, en el orden en que se leen. */
  items: { type: Array, required: true },
  /** Índices de las columnas a destacar. */
  destacar: { type: Array, default: () => [] },
});
const max = computed(() => Math.max(0, ...props.items.map((i) => i.valor)));
const destacadas = computed(() => new Set(props.destacar || []));
</script>
