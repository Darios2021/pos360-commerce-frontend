<!--
  BLOQUE DONA: cómo se compone un total (medios de pago, por ejemplo). Hasta
  cinco gajos; el total al centro y la leyenda con monto y porcentaje.
-->
<template>
  <AsisTarjeta :titulo="titulo" :alcance="alcance">
    <div class="asis-dona">
      <svg viewBox="0 0 120 120" role="img" :aria-label="`${titulo}: total ${valor(d.total, unidad)}`">
        <circle v-for="(g, k) in d.gajos" :key="k" cx="60" cy="60" :r="DONA.R" fill="none" :stroke="g.color" :stroke-width="DONA.ARO"
          :stroke-dasharray="g.trazo" :stroke-dashoffset="g.desplazamiento" transform="rotate(-90 60 60)"
          :style="{ animationDelay: `${k * 60}ms` }" />
        <text class="tot num" x="60" y="62" text-anchor="middle">{{ centroDona(d.total, unidad) }}</text>
        <text class="tot-e" x="60" y="76" text-anchor="middle">total</text>
      </svg>
      <div class="asis-ley">
        <div v-for="(g, k) in d.gajos" :key="k">
          <i :style="{ background: g.color }" />
          <b>{{ g.etiqueta }}</b>
          <span class="num">{{ valor(g.valor, unidad) }}</span>
          <span class="num">{{ g.porcentaje }} %</span>
        </div>
      </div>
    </div>
  </AsisTarjeta>
</template>

<script setup>
import { computed } from "vue";
import AsisTarjeta from "./AsisTarjeta.vue";
import { centroDona, DONA, gajos, valor } from "../lib/dibujo";

const props = defineProps({
  titulo: { type: String, required: true },
  alcance: String,
  unidad: { type: String, default: "u" },
  /** Lo que pase de cinco se suma en "Otros". */
  items: { type: Array, required: true },
});
const d = computed(() => gajos(props.items));
</script>
