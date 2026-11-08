<!--
  BLOQUE FILAS: un ranking. Cifra grande a la izquierda, etiqueta y detalle, y
  una barra fina abajo con la proporción contra el primero.

  Todas las filas comparten UNA grilla: la columna de la cifra toma el ancho de
  la más larga ("$ 1.234.567") y nunca corta renglón. El detalle va debajo del
  nombre con su unidad a la vista ("2 u.", "$ 300.000").

  Con fotos de producto (2026-11-08): foto, producto y cifra a la derecha, y la
  barra debajo del nombre. Al final, "y N más" si el servicio recortó.
-->
<template>
  <AsisTarjeta :titulo="titulo" :alcance="alcance">
    <div :class="['asis-filas', { larga, 'con-foto': conFoto }]">
      <template v-for="(i, k) in items" :key="k">
        <AsisFoto v-if="conFoto" :src="i.foto" :alt="i.etiqueta" />
        <span v-if="!conFoto" class="cifra num">{{ valor(i.valor, unidad) }}</span>
        <span class="et">
          <b>{{ i.etiqueta }}</b>
          <small v-if="i.detalle_valor != null" class="num">{{ detalle(i.detalle_valor, i.detalle_unidad, unidad) }}</small>
        </span>
        <span v-if="conFoto" class="cifra num">{{ valor(i.valor, unidad) }}</span>
        <div class="asis-pista"><i :style="{ width: anchoBarra(i.valor, max) + '%' }" /></div>
      </template>
    </div>
    <p v-if="resto > 0" class="asis-resto">y {{ resto }} más</p>
  </AsisTarjeta>
</template>

<script setup>
import { computed } from "vue";
import AsisTarjeta from "./AsisTarjeta.vue";
import AsisFoto from "./AsisFoto.vue";
import { anchoBarra, detalle, valor } from "../lib/dibujo";

const props = defineProps({
  titulo: { type: String, required: true },
  alcance: String,
  /** 'ars' (pesos), 'u' (unidades) o '%'. */
  unidad: { type: String, default: "u" },
  /** Como mucho 10. `detalle_valor` es la segunda cifra, chica; `foto`, la del producto. */
  items: { type: Array, required: true },
  /** Cuántos quedaron afuera del tope. */
  resto: { type: Number, default: 0 },
});
const max = computed(() => Math.max(0, ...props.items.map((i) => i.valor)));
/** Montos de más de 7 caracteres ("$ 300.000") van un punto más chicos. */
const larga = computed(() => props.items.some((i) => valor(i.valor, props.unidad).length > 7));
const conFoto = computed(() => props.items.some((i) => i.foto));
</script>
