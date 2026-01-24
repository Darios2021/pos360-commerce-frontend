// ✅ COPY-PASTE FINAL COMPLETO
// main.js
// (IMPORTANTE: este archivo debe ser el que realmente carga tu index.html)

//
// =============================
// 🔐 PATCH GLOBAL para WebViews capados (Instagram / Facebook / iOS Private)
// Debe ir ANTES de cualquier import
// =============================
(function () {
  if (typeof window === "undefined") return;

  const ua = navigator.userAgent || "";
  const isMetaWebView = /instagram|fb_iab|fbav|facebook|messenger/i.test(ua);

  // --- PATCH localStorage ---
  try {
    const k = "__ls_test__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
  } catch (_) {
    const noopLS = {
      getItem() { return "null"; },
      setItem() {},
      removeItem() {},
      clear() {},
      key() { return null; },
      get length() { return 0; },
    };
    try {
      Object.defineProperty(window, "localStorage", { value: noopLS, configurable: true });
    } catch {
      window.localStorage = noopLS;
    }
  }

  // --- PATCH sessionStorage ---
  try {
    const k = "__ss_test__";
    window.sessionStorage.setItem(k, "1");
    window.sessionStorage.removeItem(k);
  } catch (_) {
    const noopSS = {
      getItem() { return "null"; },
      setItem() {},
      removeItem() {},
      clear() {},
      key() { return null; },
      get length() { return 0; },
    };
    try {
      Object.defineProperty(window, "sessionStorage", { value: noopSS, configurable: true });
    } catch {
      window.sessionStorage = noopSS;
    }
  }

  // --- PATCH IndexedDB (algunos WebViews rompen) ---
  try {
    if (!window.indexedDB && !window.webkitIndexedDB) {
      window.indexedDB = { open() { return { onerror() {}, onsuccess() {}, onupgradeneeded() {} }; } };
    }
  } catch {
    window.indexedDB = { open() { return { onerror() {}, onsuccess() {}, onupgradeneeded() {} }; } };
  }

  if (isMetaWebView) console.log("[META WEBVIEW DETECTADO]");
})();

//
// =============================
// Imports del proyecto
// =============================
import { createApp } from "vue";
import { createPinia } from "pinia";
import { createHead } from "@vueuse/head";

import App from "./App.vue";
import router from "./app/router";
import vuetify from "./app/plugins/vuetify";
import "./style.css";

import VueApexCharts from "vue3-apexcharts";

//
// =============================
// ✅ Prerender signal (CRÍTICO)
// - El prerenderer espera "prerender-ready" por cada ruta.
// - Si tu app se cuelga o tarda, el build falla.
// - Esto lo hace EXTREMADAMENTE robusto.
// =============================
function signalPrerenderReady(routerInstance) {
  if (typeof document === "undefined") return;

  const enabled =
    String(import.meta.env.VITE_ENABLE_PRERENDER || "").trim() === "1" ||
    String(import.meta.env.VITE_ENABLE_PRERENDER || "").trim().toLowerCase() === "true";

  if (!enabled) return;

  let fired = false;

  const fire = () => {
    if (fired) return;
    fired = true;
    try {
      document.dispatchEvent(new Event("prerender-ready"));
    } catch {
      // por si Event no existe en algún contexto
      const ev = document.createEvent("Event");
      ev.initEvent("prerender-ready", true, true);
      document.dispatchEvent(ev);
    }
  };

  // ✅ 1) cuando el router está listo
  Promise.resolve()
    .then(() => routerInstance?.isReady?.())
    .then(() => {
      // micro delay para asegurar render final
      setTimeout(fire, 0);
    })
    .catch(() => {
      // incluso si falla, NO bloquees el prerender
      setTimeout(fire, 0);
    });

  // ✅ 2) failsafe duro: si algo rompe, dispará igual antes del timeout
  // (default del plugin: 120s → acá lo tiramos a los 3s)
  setTimeout(fire, 3000);

  // ✅ 3) si hay error global que frena la app, dispará igual
  window.addEventListener("error", () => setTimeout(fire, 0), { once: true });
  window.addEventListener("unhandledrejection", () => setTimeout(fire, 0), { once: true });
}

//
// =============================
// Bootstrap
// =============================
const app = createApp(App);

const head = createHead();

app.use(createPinia());
app.use(head);
app.use(router);
app.use(vuetify);
app.use(VueApexCharts);

app.mount("#app");

// ✅ IMPORTANTÍSIMO: disparar señal para el prerender
signalPrerenderReady(router);
