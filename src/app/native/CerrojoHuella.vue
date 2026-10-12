<!-- src/app/native/CerrojoHuella.vue
     Cerrojo de huella al abrir la APK (ver app/native/huella.js). Tapa toda la
     pantalla hasta que el usuario pone la huella o elige Usar contraseña, que
     cierra la sesion y lleva al ingreso. En el navegador no se monta. -->
<template>
  <div v-if="cerrado" class="cerrojo" role="dialog" aria-modal="true" aria-label="Entrar con huella">
    <div class="cerrojo-caja">
      <div class="cerrojo-avatar">{{ iniciales }}</div>
      <div class="cerrojo-nombre">{{ nombre }}</div>
      <div v-if="sucursal" class="cerrojo-sub">{{ sucursal }}</div>

      <span class="cerrojo-huella"><v-icon size="44">mdi-fingerprint</v-icon></span>

      <button type="button" class="cerrojo-btn" :disabled="pidiendo" @click="pedir">Entrar con huella</button>
      <button type="button" class="cerrojo-lnk" @click="usarContrasena">Usar contraseña</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { isCapacitor } from "@/app/utils/runtime";
import { loadAuth } from "@/app/utils/storage";
import { useAuthStore } from "@/app/store/auth.store";
import { huellaActiva, pedirHuella } from "./huella";

const router = useRouter();
const auth = useAuthStore();

const sesion = loadAuth();
const hayToken = !!(sesion?.accessToken || sesion?.token || sesion?.access_token);

// Se decide una sola vez, al abrir la app: es un cerrojo de arranque.
const cerrado = ref(isCapacitor() && hayToken && huellaActiva());
const pidiendo = ref(false);

const usuario = computed(() => auth.user || sesion?.user || {});
const nombre = computed(() => {
  const u = usuario.value;
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || u.name || u.username || u.email || "POS 360";
});
const iniciales = computed(() =>
  nombre.value.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase()
);
const sucursal = computed(() => usuario.value?.branch?.name || "");

async function pedir() {
  pidiendo.value = true;
  try {
    if (await pedirHuella()) cerrado.value = false;
  } finally {
    pidiendo.value = false;
  }
}

function usarContrasena() {
  auth.logout();
  cerrado.value = false;
  router.replace({ name: "login" });
}

onMounted(() => {
  if (cerrado.value) pedir();
});
</script>

<style scoped>
.cerrojo {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-background));
  display: grid;
  place-items: center;
  padding: 24px 16px calc(24px + env(safe-area-inset-bottom, 0px));
}
.cerrojo-caja {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.cerrojo-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgb(var(--v-theme-primary));
  color: #fff;
  font-size: 22px;
  font-weight: 800;
}
.cerrojo-nombre { font-size: 19px; font-weight: 800; text-align: center; }
.cerrojo-sub { font-size: 14px; opacity: .65; margin-top: -8px; }
.cerrojo-huella {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin: 16px 0;
  background: rgba(var(--v-theme-primary), .12);
  color: rgb(var(--v-theme-primary));
}
.cerrojo-btn {
  width: 100%;
  height: 52px;
  border-radius: 10px;
  border: 0;
  background: rgb(var(--v-theme-primary));
  color: #fff;
  font-size: 16px;
  font-weight: 700;
}
.cerrojo-btn:disabled { opacity: .6; }
.cerrojo-lnk {
  border: 0;
  background: none;
  color: rgb(var(--v-theme-primary));
  font-size: 15px;
  font-weight: 600;
  padding: 10px 0;
}
</style>
