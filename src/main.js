// src/main.js

// =============================
// 🔐 PATCH GLOBAL para WebViews capados (Instagram / Facebook / iOS Private)
// Debe ir antes de cualquier import
// =============================
(function () {
  if (typeof window === "undefined") return;

  const isMetaWebView =
    /instagram|fb_iab|fbav|facebook|messenger/i.test(navigator.userAgent || "");

  // --- PATCH localStorage ---
  try {
    const testKey = "__ls_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
  } catch (_) {
    const noopLS = {
      getItem() { return "null"; }, // JSON.parse("null") => null
      setItem() {},
      removeItem() {},
      clear() {},
      key() { return null; },
      get length() { return 0; },
    };
    try {
      Object.defineProperty(window, "localStorage", {
        value: noopLS,
        configurable: true,
      });
    } catch {
      window.localStorage = noopLS;
    }
  }

  // --- PATCH sessionStorage ---
  try {
    const testKey = "__ss_test__";
    window.sessionStorage.setItem(testKey, "1");
    window.sessionStorage.removeItem(testKey);
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
      Object.defineProperty(window, "sessionStorage", {
        value: noopSS,
        configurable: true,
      });
    } catch {
      window.sessionStorage = noopSS;
    }
  }

  // --- PATCH IndexedDB ---
  try {
    if (!window.indexedDB && !window.webkitIndexedDB) {
      window.indexedDB = {
        open() {
          return { onerror() {}, onsuccess() {}, onupgradeneeded() {} };
        },
      };
    }
  } catch (_) {
    window.indexedDB = {
      open() {
        return { onerror() {}, onsuccess() {}, onupgradeneeded() {} };
      },
    };
  }

  if (isMetaWebView) console.log("[META WEBVIEW DETECTADO]");
})();

// =============================
// Imports del proyecto
// =============================
import { createApp, nextTick } from "vue";
import { createPinia } from "pinia";
import { createHead } from "@vueuse/head";

import App from "./App.vue";
import router from "./app/router";
import vuetify from "./app/plugins/vuetify";
import "./style.css";

import VueApexCharts from "vue3-apexcharts";

// =============================
// ✅ Prerender signal ULTRA ROBUSTO
// =============================
function signalPrerenderReady(routerInstance) {
  if (typeof document === "undefined") return;

  const enabled =
    String(import.meta.env.VITE_ENABLE_PRERENDER || "") === "1" ||
    String(import.meta.env.VITE_ENABLE_PRERENDER || "").toLowerCase() === "true";

  if (!enabled) return;

  let fired = false;

  const fire = () => {
    if (fired) return;
    fired = true;
    try {
      document.dispatchEvent(new Event("prerender-ready"));
      // opcional log
      // console.log("[prerender] ready fired");
    } catch {
      // nada
    }
  };

  // ✅ 1) camino ideal: router listo + DOM estable
  routerInstance
    .isReady()
    .then(async () => {
      await nextTick();

      // 2 raf para asegurar que el layout terminó (cubre Vuetify)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fire();
        });
      });
    })
    .catch(() => {
      // aunque falle, disparamos igual
      setTimeout(fire, 0);
    });

  // ✅ 2) fallback duro: NO dejes colgar el build (10s)
  // (si tus OG dependen de fetch y tardan más, subilo a 15000/20000)
  setTimeout(fire, 10000);
}

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

// ✅ IMPORTANTÍSIMO
signalPrerenderReady(router);
