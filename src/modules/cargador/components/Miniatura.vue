<!-- Miniatura del producto en las listas del cargador (52 px, foto o caja). -->
<template>
  <span class="m-foto">
    <img v-if="src && !roto" :src="src" alt="" loading="lazy" @error="roto = true" />
    <v-icon v-else size="24">mdi-package-variant-closed</v-icon>
    <span v-if="q" class="q num">{{ q }}</span>
  </span>
</template>

<script setup>
import { ref } from "vue";
defineProps({ src: { type: String, default: "" }, q: { type: [Number, String], default: 0 } });
const roto = ref(false);
</script>
