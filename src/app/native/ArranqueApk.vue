<!-- src/app/native/ArranqueApk.vue
     Lo que hace la APK al abrir, ademas de la webapp: el cerrojo de huella
     y el registro del telefono para los avisos push. App.vue lo monta solo
     dentro de la APK. -->
<template>
  <CerrojoHuella />
</template>

<script setup>
import { watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/app/store/auth.store";
import CerrojoHuella from "./CerrojoHuella.vue";
import { AVISOS_CONFIGURADOS, iniciarAvisos } from "./avisos";

const router = useRouter();
const auth = useAuthStore();

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
