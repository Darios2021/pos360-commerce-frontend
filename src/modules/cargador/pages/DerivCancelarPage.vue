<!-- Cancelar derivación (maqueta, "deriv-cancelar"): vista completa con el botón rojo. -->
<template>
  <MovilVista titulo="Cancelar derivación" :volver="{ name: 'derivDetalle', params: { id: route.params.id } }">
    <div v-if="t" class="m-pz">
      <div class="m-pz-b m-pz-b--top">
        <div class="num" style="font-size: 19px; font-weight: 800">{{ t.number }}</div>
        <div class="m-ruta" style="margin-top: 6px">{{ origenDe(t) }}<v-icon size="18">mdi-arrow-right</v-icon>{{ destinoDe(t) }}</div>
        <dl class="m-dl" style="margin-top: 12px">
          <dt>Estado</dt><dd>{{ (ESTADOS[t.status] || {}).t || t.status }}</dd>
          <dt>Unidades</dt><dd class="num">{{ cant(unidadesEnviadas(t)) }}</dd>
        </dl>
      </div>
    </div>
    <div v-if="error" class="m-error">{{ error }}</div>
    <template #pie>
      <button type="button" class="m-btn rojo" :disabled="!t || enviando" @click="cancelar">Cancelar derivación</button>
    </template>
  </MovilVista>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import MovilVista from "@/app/components/movil/MovilVista.vue";
import { cancelTransfer } from "@/modules/dashboard/service/stockTransfer.api";
import { cant, mensajeDe } from "../lib/formato";
import { ESTADOS, destinoDe, origenDe, traerDerivacion, unidadesEnviadas } from "../lib/derivaciones";
import { avisar } from "../lib/aviso";

const route = useRoute();
const router = useRouter();
const t = ref(null);
const error = ref("");
const enviando = ref(false);

async function cancelar() {
  enviando.value = true;
  error.value = "";
  try {
    await cancelTransfer(route.params.id);
    avisar("Derivación cancelada");
    router.replace({ name: "transfers" });
  } catch (e) {
    error.value = mensajeDe(e, "No se canceló");
  } finally {
    enviando.value = false;
  }
}

onMounted(async () => {
  try { t.value = await traerDerivacion(route.params.id); } catch (e) { error.value = mensajeDe(e, "Sin conexión"); }
});
</script>
