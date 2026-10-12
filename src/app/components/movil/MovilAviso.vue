<!--
  MovilAviso: el aviso breve del POS ("{producto} agregado", "Caja #N abierta")
  en las vistas del teléfono. Lee el mismo estado compartido que PosDialogs
  (useSnackbar), que en escritorio sigue pintando el suyo.
-->
<template>
  <v-snackbar
    v-model="snack.show"
    :timeout="snack.timeout || 2600"
    location="bottom"
    class="m-aviso"
    :style="{ '--m-aviso-alto': alto }"
  >
    {{ snack.text }}
  </v-snackbar>
</template>

<script setup>
import { useSnackbar } from "@/modules/pos/composables/useSnackbar";

defineProps({
  // Distancia desde abajo, para no tapar el pie o la barra de carrito.
  alto: { type: String, default: "96px" },
});
const { state: snack } = useSnackbar();
</script>

<style>
.m-aviso .v-overlay__content {
  margin-bottom: calc(var(--m-aviso-alto, 96px) + env(safe-area-inset-bottom, 0px)) !important;
  border-radius: 10px !important;
  background: #1f2937 !important;
  color: #fff !important;
  font: 600 14px Inter, system-ui, sans-serif;
}
</style>
