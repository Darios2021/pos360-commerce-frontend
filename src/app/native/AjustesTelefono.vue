<!-- src/app/native/AjustesTelefono.vue
     Ajustes que solo existen en la APK: entrar con huella y avisos de ventas
     y pedidos. Es un bloque suelto para que la pantalla Más (Cuenta) de la
     webapp movil lo pueda usar; hoy se muestra en Punto de Venta > Impresión.
     Fuera de la APK no muestra nada. -->
<template>
  <div v-if="enApk && (huellaOk || AVISOS_CONFIGURADOS)" class="tel">
    <div class="tel-label">Este teléfono</div>
    <v-switch
      v-if="huellaOk"
      v-model="conHuella"
      label="Entrar con huella"
      color="primary"
      density="compact"
      hide-details
      inset
    />
    <v-switch
      v-if="AVISOS_CONFIGURADOS"
      v-model="conAvisos"
      label="Avisos de ventas y pedidos"
      color="primary"
      density="compact"
      hide-details
      inset
      :loading="cambiandoAvisos"
    />
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { isCapacitor } from "@/app/utils/runtime";
import { useAuthStore } from "@/app/store/auth.store";
import { huellaDisponible, huellaActiva, activarHuella } from "./huella";
import { AVISOS_CONFIGURADOS, avisosActivos, apagarAvisos, prenderAvisos } from "./avisos";

const enApk = isCapacitor();
const router = useRouter();
const auth = useAuthStore();

const huellaOk = ref(false);
const conHuella = ref(huellaActiva());
if (enApk) huellaDisponible().then((ok) => { huellaOk.value = ok; });
watch(conHuella, (v) => activarHuella(v));

const conAvisos = ref(avisosActivos());
const cambiandoAvisos = ref(false);
watch(conAvisos, async (v) => {
  cambiandoAvisos.value = true;
  try {
    if (v) await prenderAvisos(router, { branch_id: auth.branchId });
    else await apagarAvisos();
  } finally {
    cambiandoAvisos.value = false;
  }
});
</script>

<style scoped>
.tel { margin-top: 20px; }
.tel-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: rgba(var(--v-theme-on-surface), .6);
  margin-bottom: 4px;
}
</style>
