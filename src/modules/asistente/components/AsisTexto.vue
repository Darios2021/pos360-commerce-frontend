<!--
  BLOQUE TEXTO: dos o tres oraciones. Es también como se pinta una respuesta del
  servicio viejo, que manda texto plano con saltos de línea: se respetan.
-->
<template>
  <div class="asis-b-texto"><p>{{ texto }}</p></div>
</template>

<script setup>
defineProps({ texto: { type: String, required: true } });
</script>
