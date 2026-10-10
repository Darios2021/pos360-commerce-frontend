<!-- src/app/components/AppVersionAviso.vue -->
<!-- Aviso de versión nueva. Cada 2 minutos (y al volver a la pestaña) pide la
     página publicada sin caché y compara su script principal con el que tiene
     cargado este navegador: si cambió, hubo deploy. Con una venta en curso en
     el POS no se ofrece recargar (se perdería el carrito) hasta que termine. -->
<template>
  <transition name="ava">
    <div v-if="hayNueva && !cerrado" class="ava" role="status">
      <span class="ava-ic"><v-icon size="24">mdi-update</v-icon></span>
      <span class="ava-txt">
        <b>Hay una versión nueva</b>
        <small v-if="ventaEnCurso">Se actualiza al terminar la venta</small>
      </span>
      <button v-if="!ventaEnCurso" type="button" class="ava-btn" @click="actualizar">Actualizar</button>
      <button type="button" class="ava-x" aria-label="Más tarde" @click="cerrado = true"><v-icon size="18">mdi-close</v-icon></button>
    </div>
  </transition>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { usePosStore } from "@/app/store/pos.store";

const posStore = usePosStore();
const hayNueva = ref(false);
const cerrado = ref(false);
const ventaEnCurso = computed(() => (posStore?.cart || []).length > 0);

function scriptDe(html) {
  const m = String(html || "").match(/<script[^>]+type="module"[^>]+src="([^"]+)"/i);
  return m ? m[1].split("/").pop() : "";
}
const actual = (() => {
  const s = document.querySelector('script[type="module"][src]');
  return s ? String(s.getAttribute("src")).split("/").pop() : "";
})();

async function revisar() {
  if (!actual || hayNueva.value) return;
  try {
    const r = await fetch(`${location.pathname}?v=${Date.now()}`, { cache: "no-store", credentials: "same-origin" });
    if (!r.ok) return;
    const publicado = scriptDe(await r.text());
    if (publicado && publicado !== actual) hayNueva.value = true;
  } catch { /* sin red: se reintenta en la próxima vuelta */ }
}

function actualizar() {
  location.reload();
}

// Si se cerró el aviso, vuelve a aparecer a los 15 minutos.
let relojCerrado = null;
watch(cerrado, (v) => {
  clearTimeout(relojCerrado);
  if (v) relojCerrado = setTimeout(() => { cerrado.value = false; }, 15 * 60 * 1000);
});

let reloj = null;
function alVolver() { if (!document.hidden) revisar(); }
onMounted(() => {
  reloj = setInterval(revisar, 2 * 60 * 1000);
  document.addEventListener("visibilitychange", alVolver);
  setTimeout(revisar, 20 * 1000);
});
onBeforeUnmount(() => {
  clearInterval(reloj);
  clearTimeout(relojCerrado);
  document.removeEventListener("visibilitychange", alVolver);
});
</script>

<style>
.ava { position: fixed; right: 20px; bottom: 20px; z-index: 3000; display: flex; align-items: center; gap: 12px; padding: 12px 12px 12px 14px; border-radius: 12px; background: #0f6fae; color: #ffffff; box-shadow: 0 12px 30px rgba(10, 70, 110, 0.35); font-family: Inter, sans-serif; max-width: calc(100vw - 32px); }
.ava-ic { width: 40px; height: 40px; border-radius: 10px; background: rgba(255, 255, 255, 0.18); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ava-ic .v-icon, .ava-x .v-icon { color: #ffffff; }
.ava-txt { display: flex; flex-direction: column; min-width: 0; }
.ava-txt b { font-size: 15px; font-weight: 800; color: #ffffff; }
.ava-txt small { font-size: 12px; font-weight: 600; color: rgba(255, 255, 255, 0.85); }
.ava .ava-btn { height: 40px; padding: 0 16px; border: 0; border-radius: 10px; background: #ffffff !important; color: #0f6fae !important; -webkit-text-fill-color: #0f6fae; font: 800 14px Inter, sans-serif !important; opacity: 1 !important; cursor: pointer; white-space: nowrap; }
.ava .ava-btn:hover { background: #e6f1fa !important; }
.ava-x { width: 32px; height: 32px; border: 0; border-radius: 8px; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.ava-x:hover { background: rgba(255, 255, 255, 0.14); }
.ava-enter-active, .ava-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.ava-enter-from, .ava-leave-to { opacity: 0; transform: translateY(12px); }
</style>
