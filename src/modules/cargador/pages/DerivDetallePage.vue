<!--
  Derivación (maqueta, "deriv-detalle"): recorrido y estado, el QR con el
  número (Compartir QR en la webapp, Imprimir etiqueta en la APK), productos
  y "Cancelar derivación". Si viene en camino a la sucursal del usuario abre
  Recibir; un borrador abre Nueva derivación.
-->
<template>
  <MovilVista :titulo="t?.number || 'Derivación'" :volver="{ name: 'transfers' }">
    <div v-if="cargando && !t" class="m-vacio">Cargando…</div>
    <div v-else-if="!t" class="m-error">{{ error || "Derivación no encontrada" }}</div>
    <template v-else>
      <div class="m-pz">
        <div class="m-pz-b m-pz-b--top">
          <div class="dd-cab">
            <div class="m-ruta">{{ origenDe(t) }}<v-icon size="18">mdi-arrow-right</v-icon>{{ destinoDe(t) }}</div>
            <span class="m-est" :class="est.c">{{ est.t }}</span>
          </div>
          <div class="m-sub" style="margin-top: 6px">{{ linea }}</div>
        </div>
      </div>

      <div v-if="t.status === 'dispatched'" class="m-pz m-qrbox">
        <div class="qr" role="img" :aria-label="`QR ${t.number}`" v-html="qrSvg"></div>
        <b class="num">{{ t.number }}</b>
        <button v-if="enApk" type="button" class="m-btn" style="margin-top: 6px" @click="imprimir"><v-icon size="20">mdi-printer-outline</v-icon>Imprimir etiqueta</button>
        <button v-else type="button" class="m-btn" style="margin-top: 6px" @click="compartir"><v-icon size="20">mdi-share-variant-outline</v-icon>Compartir QR</button>
      </div>

      <div class="m-pz">
        <div class="m-pz-h"><h3>Productos</h3><span class="num">{{ u(unidadesEnviadas(t)) }}</span></div>
        <div v-for="it in t.items" :key="it.id" class="m-ln">
          <Miniatura :src="imagenDe(it.product) || ''" />
          <span class="tx">
            <b>{{ it.product?.name || `Producto ${it.product_id}` }}</b>
            <small class="num">{{ recibida ? `Enviadas ${cant(it.qty_sent)} · Recibidas ${cant(it.qty_received)}` : codigoDe(it.product) }}</small>
          </span>
          <b class="num">{{ u(it.qty_sent) }}</b>
        </div>
      </div>

      <div v-if="['draft', 'dispatched'].includes(t.status)" class="m-centro">
        <router-link :to="{ name: 'derivCancelar', params: { id: t.id } }" class="m-lnk rojo">Cancelar derivación</router-link>
      </div>
    </template>
    <MovilAviso alto="24px" />
  </MovilVista>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import QRCode from "qrcode";
import MovilVista from "@/app/components/movil/MovilVista.vue";
import MovilAviso from "@/app/components/movil/MovilAviso.vue";
import Miniatura from "../components/Miniatura.vue";
import { useAuthStore } from "@/app/store/auth.store";
import { isCapacitor } from "@/app/utils/runtime";
import { cant, codigoDe, cuando, imagenDe, mensajeDe, nombrePersona, u } from "../lib/formato";
import { ESTADOS, destinoDe, origenDe, porRecibir, traerDerivacion, unidadesEnviadas } from "../lib/derivaciones";
import { etiquetaDerivacion, imprimirEtiqueta, textoImpresion } from "../lib/etiquetas";
import { avisar } from "../lib/aviso";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const enApk = isCapacitor();
const t = ref(null);
const cargando = ref(true);
const error = ref("");
const qrSvg = ref("");

const est = computed(() => ESTADOS[t.value?.status] || { t: t.value?.status, c: "gr" });
const recibida = computed(() => ["received", "partial"].includes(t.value?.status));
const linea = computed(() => {
  const x = t.value;
  if (!x) return "";
  if (recibida.value) return [`Recibida ${cuando(x.received_at)}`, nombrePersona(x.receiver)].filter(Boolean).join(" · ");
  if (x.status === "dispatched") return [`Despachada ${cuando(x.dispatched_at)}`, nombrePersona(x.dispatcher)].filter(Boolean).join(" · ");
  return [`Creada ${cuando(x.created_at)}`, nombrePersona(x.creator)].filter(Boolean).join(" · ");
});

async function compartir() {
  const n = t.value.number;
  try {
    const url = await QRCode.toDataURL(n, { margin: 2, scale: 10 });
    const blob = await (await fetch(url)).blob();
    const archivo = new File([blob], `${n}.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [archivo] })) {
      await navigator.share({ files: [archivo], title: n });
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = `${n}.png`;
    a.click();
  } catch (e) {
    if (e?.name !== "AbortError") avisar("No se pudo compartir");
  }
}

async function imprimir() {
  avisar(textoImpresion[await imprimirEtiqueta((ancho) => etiquetaDerivacion(t.value, ancho))]);
}

onMounted(async () => {
  try {
    const x = await traerDerivacion(route.params.id);
    if (x && porRecibir(x, auth)) return router.replace({ name: "derivRecibir", params: { id: x.id } });
    if (x?.status === "draft") return router.replace({ name: "derivNueva", query: { borrador: x.id } });
    t.value = x;
    if (x?.number) qrSvg.value = await QRCode.toString(x.number, { type: "svg", margin: 0, errorCorrectionLevel: "M" });
  } catch (e) {
    error.value = e?.response?.status === 403 ? "Sin acceso a esta derivación" : mensajeDe(e, "Sin conexión");
  } finally {
    cargando.value = false;
  }
});
</script>

<style>
.dd-cab { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
</style>
