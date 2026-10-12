<!--
  Lector por lote (maqueta, "escaner-lote"): lectura continua; cada código
  suma 1 a la derivación en armado, a la recepción o al conteo, y la hoja
  muestra la última lectura (+1 o el rechazo) y el total. "Listo" vuelve.
  APK: startScan + barcodesScanned; webapp: BarcodeDetector en bucle con
  pausa entre lecturas iguales (lib/useLector.js).
-->
<template>
  <MovilVista :titulo="titulo" cerrar manual class="m-lector" cuerpo-clase="lec-cu" @volver="volver">
    <template #barra>
      <button v-if="puedeLinterna" type="button" class="mv-ib" aria-label="Linterna" @click="alternarLinterna">
        <v-icon size="24">{{ linterna ? "mdi-flashlight" : "mdi-flashlight-off" }}</v-icon>
      </button>
    </template>
    <div class="m-visor">
      <video ref="video" muted playsinline autoplay></video>
      <div v-if="estado === 'sin-permiso'" class="m-permiso">
        <v-icon size="40">mdi-camera-off-outline</v-icon>
        <b>Cámara sin permiso</b>
        <button type="button" class="m-btn" @click="permitir">Permitir cámara</button>
      </div>
      <div v-else-if="estado === 'pausa'" class="m-permiso">
        <button type="button" class="m-btn" @click="reanudar">Escanear</button>
      </div>
      <div v-else class="m-marco"><div class="rayo"></div></div>
      <div v-if="estado === 'sin-camara'" class="estado">Sin acceso a la cámara</div>
    </div>
    <div class="m-hoja">
      <div class="ult">
        <template v-if="ultimo">
          <Miniatura :src="ultimo.image || ''" />
          <span class="tx">
            <b>{{ ultimo.name }}</b>
            <small :class="ultimo.no ? 'no' : 'num'">{{ ultimo.no || ultimo.txt }}</small>
          </span>
          <span class="mas1" :class="{ no: ultimo.no }">{{ ultimo.no ? "×" : "+1" }}</span>
        </template>
        <span v-else class="tx"><small>Sin lecturas</small></span>
      </div>
      <div class="res"><span>{{ productos(resumen.productos) }}</span><b class="num">{{ u(resumen.unidades) }}</b></div>
      <button type="button" class="m-btn" @click="volver">Listo</button>
    </div>
  </MovilVista>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import MovilVista from "@/app/components/movil/MovilVista.vue";
import Miniatura from "../components/Miniatura.vue";
import { useAuthStore } from "@/app/store/auth.store";
import { cant, imagenDe, num, productos, u } from "../lib/formato";
import { useLector } from "../lib/useLector";
import { productoPorCodigo } from "../lib/codigo";
import { sumarProductoADerivacion, sumarProductoAlConteo } from "../lib/ruteo";
import { cargarDepositos, cargarSucursales, depositos, sucursales } from "../lib/depositos";
import { traerDerivacion } from "../lib/derivaciones";
import { textoError } from "../services/conteos.service";
import { derivacion, lineasValidas, unidadesDerivacion } from "../state/derivacion";
import { contado, fijarContado, recepcionDe } from "../state/recepcion";
import { conteo } from "../state/conteo";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const modo = computed(() => String(route.query.modo || "derivar"));
const transfer = ref(null);
const ultimo = ref(null);

const nombreSuc = (bid) => sucursales.value.find((b) => Number(b.id) === Number(bid))?.name || "";
const depNombre = (wid) => {
  const w = depositos.value.find((x) => Number(x.id) === Number(wid));
  return w?.branch?.name || w?.name || "";
};

const titulo = computed(() => {
  if (modo.value === "recibir") return transfer.value?.number || "Recibir";
  if (modo.value === "contar") return `Conteo · ${depNombre(conteo.warehouseId)}`.replace(/ · $/, "");
  const dest = nombreSuc(derivacion.destinoBranchId);
  return dest ? `Derivación a ${dest}` : "Derivación";
});

const resumen = computed(() => {
  if (modo.value === "recibir") {
    recepcionDe(route.query.id);
    const items = transfer.value?.items || [];
    const cont = items.map((it) => contado(route.query.id, it.id));
    return { productos: cont.filter((c) => c > 0).length, unidades: cont.reduce((a, c) => a + c, 0) };
  }
  if (modo.value === "contar") return { productos: conteo.lineas.length, unidades: conteo.lineas.reduce((a, l) => a + num(l.contado), 0) };
  return { productos: lineasValidas().length, unidades: unidadesDerivacion() };
});

const igual = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();

async function leer(codigo) {
  if (modo.value === "recibir") {
    const items = transfer.value?.items || [];
    const it = items.find((x) => [x.product?.barcode, x.product?.sku, x.product?.code].some((c) => c && igual(c, codigo)));
    if (!it) {
      const p = await productoPorCodigo(codigo, { usarCache: true }).catch(() => null);
      ultimo.value = { name: p?.name || codigo, image: imagenDe(p), no: "No viene en esta derivación" };
      return;
    }
    const c = contado(route.query.id, it.id) + 1;
    fijarContado(route.query.id, it.id, c);
    ultimo.value = { name: it.product?.name, image: imagenDe(it.product), txt: `${cant(c)} de ${cant(it.qty_sent)}` };
    return;
  }

  const p = await productoPorCodigo(codigo, { usarCache: true });
  if (!p) { ultimo.value = { name: codigo, no: "Código no encontrado" }; return; }
  if (p._fueraDeAmbito) { ultimo.value = { name: codigo, no: "No habilitado en la sucursal" }; return; }

  if (modo.value === "contar") {
    try {
      const l = await sumarProductoAlConteo(p, auth);
      ultimo.value = { name: p.name, image: imagenDe(p), txt: `Contados ${cant(l?.contado)} · Sistema ${cant(l?.sistema)}` };
    } catch (e) {
      ultimo.value = { name: p.name, image: imagenDe(p), no: textoError(e) };
    }
    return;
  }

  const l = await sumarProductoADerivacion(p, auth);
  const dep = depNombre(derivacion.origenWarehouseId) || "el origen";
  ultimo.value = l.stock > 0
    ? { name: p.name, image: imagenDe(p), txt: `${cant(l.qty)} de ${cant(l.stock)} en ${dep}` }
    : { name: p.name, image: imagenDe(p), no: `Sin stock en ${dep}` };
}

// Una lectura por vez, en orden.
let cola = Promise.resolve();
function alLeer(codigo) {
  cola = cola.then(() => leer(codigo)).catch(() => {
    ultimo.value = { name: codigo, no: "Sin conexión" };
  });
}

const { video, estado, linterna, puedeLinterna, alternarLinterna, reanudar, permitir } = useLector({ alLeer });

function volver() {
  if (window.history.state?.back) router.back();
  else if (modo.value === "recibir") router.replace({ name: "derivRecibir", params: { id: route.query.id } });
  else router.replace({ name: modo.value === "contar" ? "conteo" : "derivNueva" });
}

onMounted(async () => {
  cargarDepositos();
  cargarSucursales();
  if (modo.value === "recibir" && route.query.id) {
    try { transfer.value = await traerDerivacion(route.query.id); } catch { transfer.value = null; }
  }
});
</script>
