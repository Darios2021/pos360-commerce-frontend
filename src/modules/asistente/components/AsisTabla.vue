<!--
  BLOQUE TABLA: pocos registros con estado (stock bajo, cierres). Los números a
  la derecha. Una columna "Estado" se pinta como pastilla: roja si la cifra de
  la fila es 0, ocre si no.
-->
<template>
  <div class="asis-tarjeta">
    <div class="asis-cuerpo">
      <table class="asis-tabla">
        <thead>
          <tr><th v-for="(c, k) in columnas" :key="k" scope="col" :class="{ n: numerica(k) }">{{ c }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="(f, i) in filas" :key="i">
            <td v-for="(_, k) in columnas" :key="k" :class="{ n: typeof f[k] === 'number' }">
              <span v-if="k === estado && f[k] !== '' && f[k] != null" :class="['asis-past', cifra(f) === 0 ? 'problema' : 'atencion']">{{ f[k] }}</span>
              <template v-else>{{ typeof f[k] === "number" ? fmt(f[k]) : f[k] }}</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { fmt } from "../lib/dibujo";

const props = defineProps({
  /** Como mucho 4. */
  columnas: { type: Array, required: true },
  /** Como mucho 6. */
  filas: { type: Array, required: true },
});
const estado = computed(() => props.columnas.findIndex((c) => /^estado$/i.test(String(c).trim())));
const numerica = (k) => props.filas.some((f) => typeof f[k] === "number");
const cifra = (f) => f.find((c) => typeof c === "number");
</script>
