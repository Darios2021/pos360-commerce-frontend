<!--
  Lector central (botón Escanear de la barra). Maqueta diseno-cargador,
  pantalla "Lector". Modos Consultar, Derivar y Contar; "Ingresar código" para
  escribirlo. Un QR DER-AAAA-NNNNNN abre Recibir si la derivación viene a la
  sucursal del usuario, si no su detalle (lib/ruteo.js).
  Con ?para=campo lee un solo código y lo devuelve al formulario que lo abrió.
-->
<template>
  <MovilVista titulo="Escanear" cerrar manual class="m-lector" cuerpo-clase="lec-cu" @volver="salir">
    <template #barra>
      <button v-if="puedeLinterna" type="button" class="mv-ib" aria-label="Linterna" @click="alternarLinterna">
        <v-icon size="24">{{ linterna ? "mdi-flashlight" : "mdi-flashlight-off" }}</v-icon>
      </button>
    </template>
    <div class="m-visor">
      <video ref="video" muted playsinline autoplay></video>
      <div class="m-marco"><div class="rayo"></div></div>
      <div v-if="estado === 'sin-camara'" class="estado">Sin acceso a la cámara</div>
      <div v-else-if="buscando" class="estado">Buscando…</div>
    </div>
    <div class="m-esc-pie">
      <div v-if="!paraCampo" class="m-esc-modos" role="tablist">
        <button v-for="m in MODOS" :key="m.v" type="button" role="tab" :class="{ on: modo === m.v }" :aria-selected="modo === m.v" @click="elegir(m.v)">{{ m.t }}</button>
      </div>
      <router-link :to="{ name: 'lectorCodigo', query: { modo, para: route.query.para } }" replace class="m-lnk">Ingresar código</router-link>
    </div>
    <MovilAviso alto="150px" />
  </MovilVista>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import MovilVista from "@/app/components/movil/MovilVista.vue";
import MovilAviso from "@/app/components/movil/MovilAviso.vue";
import { useAuthStore } from "@/app/store/auth.store";
import { useLector } from "../lib/useLector";
import { rutearLectura } from "../lib/ruteo";
import { avisar } from "../lib/aviso";
import { mensajeDe } from "../lib/formato";
import { codigoCapturado } from "../state/captura";

const MODOS = [
  { v: "consultar", t: "Consultar" },
  { v: "derivar", t: "Derivar" },
  { v: "contar", t: "Contar" },
];
const CLAVE = "pos360.cargador.modo";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const paraCampo = computed(() => route.query.para === "campo");

const inicial = (() => {
  const q = String(route.query.modo || "");
  if (MODOS.some((m) => m.v === q)) return q;
  try { const g = localStorage.getItem(CLAVE); if (MODOS.some((m) => m.v === g)) return g; } catch { /* sin storage */ }
  return "consultar";
})();
const modo = ref(inicial);
function elegir(v) {
  modo.value = v;
  try { localStorage.setItem(CLAVE, v); } catch { /* sin storage */ }
  router.replace({ query: { ...route.query, modo: v } });
}

function salir() {
  if (window.history.state?.back) router.back();
  else router.replace({ name: "home" });
}

const buscando = ref(false);
async function alLeer(codigo) {
  if (buscando.value) return;
  if (paraCampo.value) {
    codigoCapturado.value = codigo;
    router.back();
    return;
  }
  buscando.value = true;
  try {
    const listo = await rutearLectura(codigo, { modo: modo.value, router, auth });
    if (!listo) olvidarUltimo();
  } catch (e) {
    avisar(mensajeDe(e, "Sin conexión"));
    olvidarUltimo();
  } finally {
    buscando.value = false;
  }
}

const { video, estado, linterna, puedeLinterna, alternarLinterna, olvidarUltimo } = useLector({
  alLeer,
  activo: () => !buscando.value,
});
</script>

