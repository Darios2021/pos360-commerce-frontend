<!-- Recepción registrada (maqueta, "deriv-ok"): el estado que devolvió la API y las diferencias. -->
<template>
  <MovilVista :titulo="t?.number || 'Recepción'" :volver="{ name: 'transfers' }">
    <template v-if="t">
      <div class="m-hecho">
        <span class="circ" :class="{ oc: difs.length }"><v-icon size="40">{{ difs.length ? "mdi-alert-outline" : "mdi-check" }}</v-icon></span>
        <h3>{{ t.status === "partial" ? "Recibida con diferencias" : "Recibida" }}</h3>
        <div class="m-sub num">{{ u(recibidas) }} sumadas al stock de {{ destinoDe(t) }}</div>
      </div>
      <div v-if="difs.length" class="m-pz">
        <div class="m-pz-h"><h3>Diferencias</h3></div>
        <div v-for="it in difs" :key="it.id" class="m-ln">
          <span class="tx">
            <b>{{ it.product?.name || `Producto ${it.product_id}` }}</b>
            <small class="num">Enviadas {{ cant(it.qty_sent) }} · Recibidas {{ cant(it.qty_received) }}</small>
          </span>
          <span class="m-dif num" :style="{ color: num(it.qty_received) < num(it.qty_sent) ? 'var(--m-rojo)' : 'var(--m-ocre)' }">{{ signo(num(it.qty_received) - num(it.qty_sent)) }}</span>
        </div>
      </div>
      <router-link :to="{ name: 'home' }" replace class="m-btn">Volver a Inicio</router-link>
    </template>
    <div v-else-if="!cargando" class="m-error">Derivación no encontrada</div>
  </MovilVista>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import MovilVista from "@/app/components/movil/MovilVista.vue";
import { cant, num, u } from "../lib/formato";
import { destinoDe, traerDerivacion } from "../lib/derivaciones";

const route = useRoute();
const t = ref(null);
const cargando = ref(true);
const difs = computed(() => (t.value?.items || []).filter((it) => num(it.qty_received) !== num(it.qty_sent)));
const recibidas = computed(() => (t.value?.items || []).reduce((a, it) => a + num(it.qty_received), 0));
const signo = (d) => (d > 0 ? "+" : "−") + cant(Math.abs(d));

onMounted(async () => {
  try { t.value = await traerDerivacion(route.params.id); } finally { cargando.value = false; }
});
</script>
