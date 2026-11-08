<!--
  Foto de un producto en una respuesta (2026-11-08). La URL viene de la consulta
  (mostrador descarta cualquier otra). Sin foto o si no carga, una caja con el ícono.
-->
<template>
  <span class="asis-foto">
    <img v-if="src && !fallo" :src="src" :alt="alt" loading="lazy" decoding="async" @error="fallo = true" />
    <v-icon v-else size="22" aria-hidden="true">mdi-package-variant-closed</v-icon>
  </span>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({ src: String, alt: { type: String, default: "" } });
const fallo = ref(false);
watch(() => props.src, () => { fallo.value = false; });
</script>
