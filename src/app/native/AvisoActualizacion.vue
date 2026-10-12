<!-- src/app/native/AvisoActualizacion.vue
     Aviso de APK nueva (solo en la APK: lo monta ArranqueApk.vue).
     Al abrir y cada vez que la app vuelve al frente pide sin caché
     https://sanjuantecnologia.com/app/download/version.json (lo genera
     scripts/generar-version-apk.mjs) y compara su versionCode con el de esta
     APK (VITE_APP_VERSION_CODE, que build-apk.mjs saca de build.gradle).
       - Hay una más nueva: banda fija arriba, debajo de la barra de estado,
         con "Actualizar". Se puede ocultar un rato: vuelve al próximo arranque
         o regreso al frente, o a los 30 minutos.
       - Esta APK es menor que "minimo": vista completa, sin salida, solo
         "Actualizar".
     Sin red o con el manifiesto roto no muestra nada.
     "Actualizar" abre el APK en el navegador del teléfono: Capacitor manda
     al sistema toda URL que no es la de la app (Bridge.launchIntent). -->
<template>
  <div v-if="bloquea" class="apk-bloq">
    <div class="apk-bloq-caja">
      <span class="apk-bloq-ic"><v-icon size="36">mdi-cellphone-arrow-down</v-icon></span>
      <h1>Actualización requerida</h1>
      <p>Versión {{ nueva.versionName }}</p>
      <button type="button" class="apk-btn apk-btn--grande" @click="actualizar">Actualizar</button>
    </div>
  </div>
  <div v-else-if="nueva && !oculto" class="apk-banda" role="status">
    <v-icon size="22" class="apk-banda-ic">mdi-cellphone-arrow-down</v-icon>
    <b>Versión {{ nueva.versionName }} disponible</b>
    <button type="button" class="apk-btn" @click="actualizar">Actualizar</button>
    <button type="button" class="apk-x" aria-label="Ocultar" @click="ocultar"><v-icon size="20">mdi-close</v-icon></button>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from "vue";

const MANIFIESTO = "https://sanjuantecnologia.com/app/download/version.json";
const ORIGEN_APK = "https://sanjuantecnologia.com/";
const VUELVE_EN = 30 * 60 * 1000;

const nueva = ref(null); // manifiesto, solo si trae una versión mayor
const minimo = ref(0);
const instalada = ref(Number(import.meta.env.VITE_APP_VERSION_CODE) || 0);
const oculto = ref(false);
const bloquea = computed(() => !!nueva.value && instalada.value > 0 && instalada.value < minimo.value);

// Corta una promesa colgada (un plugin que no contesta no puede trabar la app).
function conTope(promesa, ms) {
  return Promise.race([promesa, new Promise((_, no) => setTimeout(() => no(new Error("tope")), ms))]);
}

// OJO: los plugins de Capacitor son un Proxy que responde a cualquier
// propiedad, también a `then`: se usan sin devolverlos desde funciones async.
async function core() {
  try {
    const mod = await import("@capacitor/core");
    return { mod };
  } catch {
    return { mod: null };
  }
}

async function versionInstalada() {
  if (instalada.value) return instalada.value;
  const { mod } = await core();
  try {
    if (mod?.Capacitor?.isPluginAvailable?.("App")) {
      const { App } = await import("@capacitor/app");
      const info = await conTope(App.getInfo(), 2000);
      instalada.value = parseInt(info?.build, 10) || 0;
    }
  } catch { /* sin dato: no se avisa */ }
  return instalada.value;
}

function interpretar(datos) {
  let m = datos;
  if (typeof m === "string") m = JSON.parse(m);
  const versionCode = Number(m?.versionCode);
  const url = String(m?.url || "");
  if (!Number.isInteger(versionCode) || versionCode < 1) return null;
  if (!url.startsWith(ORIGEN_APK)) return null;
  return { versionCode, versionName: String(m?.versionName || versionCode), url, minimo: Number(m?.minimo) || 0 };
}

async function leerManifiesto() {
  const url = `${MANIFIESTO}?t=${Date.now()}`;
  const { mod } = await core();
  // Nativo: sin CORS ni caché del WebView.
  try {
    if (mod?.Capacitor?.isPluginAvailable?.("CapacitorHttp")) {
      const r = await conTope(
        mod.CapacitorHttp.get({ url, headers: { "Cache-Control": "no-cache" }, responseType: "text", connectTimeout: 8000, readTimeout: 8000 }),
        12000
      );
      if (r?.status === 200) return interpretar(r.data);
      return null;
    }
  } catch { /* sigue con fetch */ }
  const ctl = new AbortController();
  const reloj = setTimeout(() => ctl.abort(), 10000);
  try {
    const r = await fetch(url, { cache: "no-store", credentials: "omit", signal: ctl.signal });
    if (!r.ok) return null;
    return interpretar(await r.text());
  } finally {
    clearTimeout(reloj);
  }
}

let revisando = false;
let ultimaRevision = 0;
async function revisar() {
  if (revisando || Date.now() - ultimaRevision < 5000) return;
  revisando = true;
  ultimaRevision = Date.now();
  try {
    const actual = await versionInstalada();
    if (!actual) return;
    const m = await leerManifiesto();
    if (!m) return;
    minimo.value = m.minimo;
    nueva.value = m.versionCode > actual ? m : null;
  } catch { /* sin red o manifiesto roto: nada */ } finally {
    revisando = false;
  }
}

let relojOculto = null;
function ocultar() {
  oculto.value = true;
  clearTimeout(relojOculto);
  relojOculto = setTimeout(() => { oculto.value = false; }, VUELVE_EN);
}

// Arranque o regreso al frente: el aviso oculto vuelve y se revisa de nuevo.
function alFrente() {
  oculto.value = false;
  clearTimeout(relojOculto);
  revisar();
}

function actualizar() {
  const url = nueva.value?.url;
  if (!url) return;
  window.open(url, "_system");
}

// La banda ocupa lugar arriba: movil.css corre las barras con --apk-banda.
watchEffect(() => {
  document.documentElement.classList.toggle("apk-aviso-on", !!nueva.value && !oculto.value && !bloquea.value);
});

let quitarEscucha = null;
function alCambiarVisibilidad() {
  if (!document.hidden) alFrente();
}
onMounted(async () => {
  revisar();
  let conApp = false;
  try {
    const { mod } = await core();
    if (mod?.Capacitor?.isPluginAvailable?.("App")) {
      const { App } = await import("@capacitor/app");
      const h = await conTope(App.addListener("appStateChange", ({ isActive }) => { if (isActive) alFrente(); }), 2000);
      quitarEscucha = () => h?.remove?.();
      conApp = true;
    }
  } catch { /* sin plugin: visibilitychange */ }
  if (!conApp) document.addEventListener("visibilitychange", alCambiarVisibilidad);
});
onBeforeUnmount(() => {
  clearTimeout(relojOculto);
  try { quitarEscucha?.(); } catch { /* ya quitada */ }
  document.removeEventListener("visibilitychange", alCambiarVisibilidad);
  document.documentElement.classList.remove("apk-aviso-on");
});
</script>

<style>
.apk-banda {
  position: fixed; left: 0; right: 0; top: var(--m-sat, 0px); height: var(--apk-banda, 52px); z-index: 1950;
  display: flex; align-items: center; gap: 8px; padding: 0 4px 0 12px; box-sizing: border-box;
  background: var(--m-accion-tinte, #eef7fd); color: var(--m-tinta, #0f172a); border-bottom: 1px solid var(--m-linea, #d3dde7);
  font-family: Inter, sans-serif;
}
.apk-banda-ic { color: var(--m-accion, #0f6fae) !important; flex: none; }
.apk-banda b { flex: 1; min-width: 0; font-size: 14px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.apk-btn {
  flex: none; height: 38px; padding: 0 14px; border: 0; border-radius: 10px; cursor: pointer;
  background: var(--m-accion, #0f6fae) !important; color: #ffffff !important; -webkit-text-fill-color: #ffffff;
  font: 700 15px Inter, sans-serif !important;
}
.apk-btn--grande { width: 100%; height: 48px; font-size: 16px !important; }
.apk-x { flex: none; width: 36px; height: 36px; border: 0; border-radius: 8px; background: transparent; cursor: pointer; display: grid; place-items: center; color: var(--m-suave, #5a6678); }
.apk-x .v-icon { color: var(--m-suave, #5a6678); }
.apk-bloq {
  position: fixed; inset: 0; z-index: 10001; display: grid; place-items: center;
  padding: calc(24px + var(--m-sat, 0px)) 16px calc(24px + var(--m-sab, 0px));
  background: var(--m-canvas, #c5cbd2); font-family: Inter, sans-serif; color: var(--m-tinta, #0f172a);
}
.apk-bloq-caja {
  width: 100%; max-width: 360px; box-sizing: border-box; padding: 28px 20px 20px; border-radius: 14px;
  background: var(--m-pieza, #ffffff); display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center;
}
.apk-bloq-ic { width: 64px; height: 64px; border-radius: 12px; background: var(--m-accion-tinte, #eef7fd); display: grid; place-items: center; margin-bottom: 6px; }
.apk-bloq-ic .v-icon { color: var(--m-accion, #0f6fae); }
.apk-bloq h1 { margin: 0; font-size: 20px; font-weight: 800; }
.apk-bloq p { margin: 0 0 14px; font-size: 15px; color: var(--m-suave, #5a6678); }
/* Franja de la barra de estado con el color de la banda de la app */
.apk-barra-estado { position: fixed; left: 0; right: 0; top: 0; height: var(--m-sat, 0px); z-index: 10002; background: var(--m-banda, #0f6fae); pointer-events: none; }
</style>
