<!-- Ingresar código: el mismo ruteo que el lector (maqueta, "Ingresar código"). -->
<template>
  <MovilVista titulo="Ingresar código" :volver="{ name: 'lector' }">
    <form class="m-cmp" @submit.prevent="buscar">
      <label for="cod-ingresado">Código de barras, SKU o número de derivación</label>
      <input id="cod-ingresado" ref="campo" v-model="codigo" class="m-inp num" autocomplete="off" autocapitalize="characters" enterkeyhint="search" />
    </form>
    <MovilAviso />
    <template #pie>
      <button type="button" class="m-btn" :disabled="!codigo.trim() || buscando" @click="buscar">Buscar</button>
    </template>
  </MovilVista>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import MovilVista from "@/app/components/movil/MovilVista.vue";
import MovilAviso from "@/app/components/movil/MovilAviso.vue";
import { useAuthStore } from "@/app/store/auth.store";
import { rutearLectura } from "../lib/ruteo";
import { avisar } from "../lib/aviso";
import { mensajeDe } from "../lib/formato";
import { codigoCapturado } from "../state/captura";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const codigo = ref("");
const campo = ref(null);
const buscando = ref(false);

async function buscar() {
  const c = codigo.value.trim();
  if (!c || buscando.value) return;
  if (route.query.para === "campo") {
    codigoCapturado.value = c;
    router.back();
    return;
  }
  buscando.value = true;
  try {
    await rutearLectura(c, { modo: String(route.query.modo || "consultar"), router, auth });
  } catch (e) {
    avisar(mensajeDe(e, "Sin conexión"));
  } finally {
    buscando.value = false;
  }
}

onMounted(() => campo.value?.focus());
</script>
