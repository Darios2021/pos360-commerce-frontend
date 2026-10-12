<!--
  BLOQUE AVISO: lo que falta, lo que no se puede consultar o lo que está mal.
  También lo usa la pantalla para el error de conexión y el tope del mes.
  Admite una sola acción ("Reintentar").
-->
<template>
  <div :class="['asis-aviso', nivel]" :role="nivel === 'problema' ? 'alert' : undefined">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <template v-if="nivel === 'atencion'"><path d="M12 3l9.5 17h-19z" /><path d="M12 10v4.5M12 17.5v.5" /></template>
      <template v-else-if="nivel === 'problema'"><circle cx="12" cy="12" r="9" /><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" /></template>
      <template v-else><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></template>
    </svg>
    <p>{{ texto }}</p>
    <button v-if="accion" type="button" @click="$emit('accion')">{{ accion }}</button>
  </div>
</template>

<script setup>
defineProps({
  /** 'info' (sin datos, sin acceso), 'atencion' (tope) o 'problema' (sin stock, error). */
  nivel: { type: String, default: "info" },
  texto: { type: String, required: true },
  /** Texto del único botón; al tocarlo emite `accion`. */
  accion: String,
});
defineEmits(["accion"]);
</script>
