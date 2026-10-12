<!--
  LA PIEZA DE RESPUESTA: los bloques en una grilla de dos columnas (gráficos de a
  dos, el resto a lo ancho; una sola columna en el teléfono) y, al final,
  "Redactando" mientras llegan o el pie con lo consultado y la hora.
-->
<template>
  <div :class="['asis-respuesta', { 'asis-entra': vivo }]">
    <div v-for="(b, i) in bloques" :key="i" :class="{ 'asis-par': lugar[i] === 'par', 'asis-entra asis-vivo': vivo }">
      <AsisBloque :b="b" />
    </div>
    <div v-if="redactando" class="asis-redactando">Redactando</div>
    <div v-else-if="consultado.length" class="asis-pie">
      <span>Consultado: {{ enumerar(consultado) }}</span>
      <span v-if="hora" class="num">{{ hora }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import AsisBloque from "./AsisBloque.vue";
import { emparejar, enumerar } from "../lib/dibujo";

const props = defineProps({
  bloques: { type: Array, required: true },
  /** Mientras llegan bloques por el stream. */
  redactando: Boolean,
  /** Etiquetas de lo consultado ("ventas", "más vendidos"); sin ninguna, sin pie. */
  consultado: { type: Array, default: () => [] },
  /** HH:MM de San Juan. */
  hora: String,
  /** Recién llegada: entra y los gráficos se dibujan una vez. Al repintar, quieta. */
  vivo: Boolean,
});
const lugar = computed(() => emparejar(props.bloques));
</script>
