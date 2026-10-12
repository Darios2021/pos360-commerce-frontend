<!-- Despacha un bloque de respuesta a su componente. Un tipo que este cliente no conoce no se pinta. -->
<template>
  <AsisTitulo v-if="b.tipo === 'titulo'" :texto="b.texto" :alcance="b.alcance" />
  <AsisTexto v-else-if="b.tipo === 'texto'" :texto="b.texto" />
  <AsisFilas v-else-if="b.tipo === 'filas'" :titulo="b.titulo" :alcance="b.alcance" :unidad="b.unidad" :items="b.items" />
  <AsisColumnas v-else-if="b.tipo === 'columnas'" :titulo="b.titulo" :alcance="b.alcance" :unidad="b.unidad" :items="b.items" :destacar="b.destacar" />
  <AsisDona v-else-if="b.tipo === 'dona'" :titulo="b.titulo" :alcance="b.alcance" :unidad="b.unidad" :items="b.items" />
  <AsisTabla v-else-if="b.tipo === 'tabla'" :columnas="b.columnas" :filas="b.filas" />
  <AsisLista v-else-if="b.tipo === 'lista'" :titulo="b.titulo" :items="b.items" />
  <AsisAviso v-else-if="b.tipo === 'aviso'" :nivel="b.nivel" :texto="b.texto" />
</template>

<script setup>
import AsisTitulo from "./AsisTitulo.vue";
import AsisTexto from "./AsisTexto.vue";
import AsisFilas from "./AsisFilas.vue";
import AsisColumnas from "./AsisColumnas.vue";
import AsisDona from "./AsisDona.vue";
import AsisTabla from "./AsisTabla.vue";
import AsisLista from "./AsisLista.vue";
import AsisAviso from "./AsisAviso.vue";

/** Un bloque del contrato de mostrador (`src/bloques.js`), versión 1, ya normalizado. */
defineProps({ b: { type: Object, required: true } });
</script>
