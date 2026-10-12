<!--
  Recibir derivación (maqueta, "deriv-recibir"): progreso de lo contado, cada
  producto con Enviadas, Completo / Faltan / Sobran, stepper y nota si hay
  diferencia. Lo contado queda en el teléfono hasta confirmar. "Confirmar
  recepción" manda POST /:id/receive; el estado lo decide la API.
-->
<template>
  <MovilVista :titulo="t?.number || 'Recibir'" :volver="{ name: 'transfers' }">
    <div v-if="cargando && !t" class="m-vacio">Cargando…</div>
    <div v-else-if="!t" class="m-error">{{ error || "Derivación no encontrada" }}</div>
    <template v-else>
      <div v-if="error" class="m-error">{{ error }}</div>
      <div class="m-pz">
        <div class="m-pz-b m-pz-b--top">
          <div class="dd-cab">
            <div class="m-ruta">{{ origenDe(t) }}<v-icon size="18">mdi-arrow-right</v-icon>{{ destinoDe(t) }}</div>
            <span class="m-est az">En camino</span>
          </div>
          <div class="m-sub" style="margin-top: 6px">{{ [`Despachada ${cuando(t.dispatched_at)}`, nombrePersona(t.dispatcher)].filter(Boolean).join(" · ") }}</div>
          <div class="m-precio-fila" style="margin-top: 14px">
            <span class="m-sub">Contadas</span>
            <b class="num" style="font-size: 20px; font-weight: 800">{{ cant(totalContado) }} de {{ u(totalEnviado) }}</b>
          </div>
          <div class="m-prog"><s :style="{ width: Math.min(100, totalEnviado ? (totalContado / totalEnviado) * 100 : 0) + '%' }"></s></div>
        </div>
      </div>

      <div class="m-pz">
        <div class="m-pz-h"><h3>Productos</h3><span class="num">{{ t.items.length }}</span></div>
        <div v-for="it in t.items" :key="it.id" class="m-ln" style="flex-wrap: wrap">
          <Miniatura :src="imagenDe(it.product) || ''" />
          <span class="tx">
            <b>{{ it.product?.name || `Producto ${it.product_id}` }}</b>
            <small class="num">Enviadas {{ cant(it.qty_sent) }}</small>
            <small v-if="contado(t.id, it.id)">
              <span class="m-est" :class="difDe(it) === 0 ? 'ok' : difDe(it) < 0 ? 'no' : 'oc'" style="margin-top: 4px">{{ difDe(it) === 0 ? "Completo" : difDe(it) < 0 ? `Faltan ${cant(-difDe(it))}` : `Sobran ${cant(difDe(it))}` }}</span>
            </small>
          </span>
          <span class="m-stp">
            <button type="button" aria-label="Menos" @click="fijarContado(t.id, it.id, contado(t.id, it.id) - 1)"><v-icon size="20">mdi-minus</v-icon></button>
            <span class="num">{{ cant(contado(t.id, it.id)) }}</span>
            <button type="button" aria-label="Más" @click="fijarContado(t.id, it.id, contado(t.id, it.id) + 1)"><v-icon size="20">mdi-plus</v-icon></button>
          </span>
          <input v-if="contado(t.id, it.id) && difDe(it)" class="m-inp nota" placeholder="Nota" :value="notaDe(t.id, it.id)" @input="fijarNota(t.id, it.id, $event.target.value)" />
        </div>
        <div class="m-pz-f" style="padding-top: 12px">
          <router-link :to="{ name: 'lote', query: { modo: 'recibir', id: t.id } }" class="m-btn"><v-icon size="20">mdi-barcode-scan</v-icon>Escanear</router-link>
        </div>
      </div>
    </template>
    <template #pie>
      <div class="res">
        <span :class="{ 'm-dif-neg': conDif || sinContar }">{{ textoRes }}</span>
        <b class="num">{{ u(totalContado) }}</b>
      </div>
      <button type="button" class="m-btn" :disabled="!t || enviando" @click="confirmar">Confirmar recepción</button>
    </template>
  </MovilVista>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import MovilVista from "@/app/components/movil/MovilVista.vue";
import Miniatura from "../components/Miniatura.vue";
import { receiveTransfer } from "@/modules/dashboard/service/stockTransfer.api";
import { cant, cuando, imagenDe, mensajeDe, nombrePersona, num, u } from "../lib/formato";
import { destinoDe, origenDe, traerDerivacion } from "../lib/derivaciones";
import { contado, fijarContado, fijarNota, notaDe, olvidarRecepcion, recepcionDe } from "../state/recepcion";

const route = useRoute();
const router = useRouter();
const t = ref(null);
const cargando = ref(true);
const error = ref("");
const enviando = ref(false);

const difDe = (it) => contado(t.value.id, it.id) - num(it.qty_sent);
const totalEnviado = computed(() => (t.value?.items || []).reduce((a, it) => a + num(it.qty_sent), 0));
const totalContado = computed(() => {
  if (!t.value) return 0;
  recepcionDe(t.value.id);
  return t.value.items.reduce((a, it) => a + contado(t.value.id, it.id), 0);
});
const conDif = computed(() => (t.value?.items || []).filter((it) => contado(t.value.id, it.id) && difDe(it) !== 0).length);
const sinContar = computed(() => (t.value?.items || []).filter((it) => !contado(t.value.id, it.id)).length);
const textoRes = computed(() =>
  conDif.value || sinContar.value
    ? [conDif.value ? `${conDif.value} con diferencia` : "", sinContar.value ? `${sinContar.value} sin contar` : ""].filter(Boolean).join(" · ")
    : "Sin diferencias"
);

async function confirmar() {
  enviando.value = true;
  error.value = "";
  try {
    const receptions = t.value.items.map((it) => ({ item_id: it.id, qty_received: contado(t.value.id, it.id), note: notaDe(t.value.id, it.id) || undefined }));
    await receiveTransfer(t.value.id, { receptions });
    olvidarRecepcion(t.value.id);
    router.replace({ name: "derivRecibida", params: { id: t.value.id } });
  } catch (e) {
    error.value = mensajeDe(e, "No se registró la recepción");
  } finally {
    enviando.value = false;
  }
}

onMounted(async () => {
  try {
    const x = await traerDerivacion(route.params.id);
    if (x && x.status === "draft") return router.replace({ name: "derivNueva", query: { borrador: x.id } });
    if (x && x.status !== "dispatched") return router.replace({ name: "derivDetalle", params: { id: x.id } });
    t.value = x;
  } catch (e) {
    error.value = e?.response?.status === 403 ? "Sin acceso a esta derivación" : mensajeDe(e, "Sin conexión");
  } finally {
    cargando.value = false;
  }
});
</script>
