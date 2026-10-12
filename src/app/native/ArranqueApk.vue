<!-- src/app/native/ArranqueApk.vue
     Lo que hace la APK al abrir, ademas de la webapp: el cerrojo de huella
     y el registro del telefono para los avisos push, el aviso de APK nueva y
     la franja de la barra de estado (Android 15/16 dibuja la app debajo de
     ella). App.vue lo monta solo dentro de la APK. -->
<template>
  <div class="apk-barra-estado" aria-hidden="true"></div>
  <CerrojoHuella />
  <AvisoActualizacion />
</template>

<script setup>
import { watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/app/store/auth.store";
import CerrojoHuella from "./CerrojoHuella.vue";
import AvisoActualizacion from "./AvisoActualizacion.vue";
import { AVISOS_CONFIGURADOS, iniciarAvisos } from "./avisos";

const router = useRouter();
const auth = useAuthStore();

// Barra de estado con iconos claros sobre la franja azul (capacitor.config.json,
// SystemBars.style DARK); la de gestos sigue el tema del telefono, porque la
// barra inferior de la app es clara en el tema claro.
import("@capacitor/core")
  .then(({ Capacitor, SystemBars }) => {
    if (Capacitor.isPluginAvailable("SystemBars")) SystemBars.setStyle({ style: "DEFAULT", bar: "NavigationBar" }).catch(() => {});
  })
  .catch(() => {});

// Los avisos son para el dueño y el admin de sucursal: el cajero no los recibe
// (la API tampoco se los manda), asi que ni se le pide el permiso.
if (AVISOS_CONFIGURADOS) {
  watch(
    () => auth.isAuthed && (auth.isSuperAdmin || auth.isBranchAdmin),
    (corresponde) => {
      if (corresponde) iniciarAvisos(router, { branch_id: auth.branchId });
    },
    { immediate: true }
  );
}
</script>
