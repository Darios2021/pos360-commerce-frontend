<!--
  BLOQUE FILAS: un ranking. Cifra grande a la izquierda, etiqueta y detalle, y
  una barra fina abajo con la proporción contra el primero.
-->
<template>
  <AsisTarjeta :titulo="titulo" :alcance="alcance">
    <div v-for="(i, k) in items" :key="k" class="asis-fila">
      <span class="cifra num">{{ valor(i.valor, unidad) }}</span>
      <span class="et">
        <b>{{ i.etiqueta }}</b>
        <small v-if="i.detalle_valor != null" class="num">{{ valor(i.detalle_valor, i.detalle_unidad || "ars") }}</small>
      </span>
      <div class="asis-pista"><i :style="{ width: anchoBarra(i.valor, max) + '%' }" /></div>
    </div>
  </AsisTarjeta>
</template>

<script setup>
import { computed } from "vue";
import AsisTarjeta from "./AsisTarjeta.vue";
import { anchoBarra, valor } from "../lib/dibujo";

const props = defineProps({
  titulo: { type: String, required: true },
  alcance: String,
  /** 'ars' (pesos), 'u' (unidades) o '%'. */
  unidad: { type: String, default: "u" },
  /** Como mucho 8. `detalle_valor` es la segunda cifra, chica. */
  items: { type: Array, required: true },
});
const max = computed(() => Math.max(0, ...props.items.map((i) => i.valor)));
</script>
