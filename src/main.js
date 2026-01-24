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
      getItem() {
        return "null";
      }, // JSON.parse("null") => null (no rompe)
      setItem() {},
      removeItem() {},
      clear() {},
      key() {
        return null;
      },
      get length() {
        return 0;
      },
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
      getItem() {
        return "null";
      },
      setItem() {},
      removeItem() {},
      clear() {},
      key() {
        return null;
      },
      get length() {
        return 0;
      },
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

  // --- PATCH IndexedDB (evita crash silencioso en algunos WebViews) ---
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

  if (isMetaWebView) {
    console.log("[META WEBVIEW DETECTADO]");
  }
})();

// =============================
// Imports originales del proyecto
// =============================
import { createApp } from "vue";
import { createPinia } from "pinia";
import { createHead } from "@vueuse/head";

import App from "./App.vue";
import router from "./app/router";
import vuetify from "./app/plugins/vuetify";
import "./style.css";

import VueApexCharts from "vue3-apexcharts";

// =============================
// ✅ Prerender signal (CRÍTICO)
// Para @prerenderer/rollup-plugin: si no disparás este evento, se cuelga y no genera HTML estático.
// =============================
function signalPrerenderReady(routerInstance) {
  if (typeof document === "undefined") return;

  const enabled =
    String(import.meta.env.VITE_ENABLE_PRERENDER || "") === "1" ||
    String(import.meta.env.VITE_ENABLE_PRERENDER || "").toLowerCase() === "true";

  if (!enabled) return;

  routerInstance
    .isReady()
    .then(() => {
      // micro delay para asegurar que la vista final renderizó
      setTimeout(() => {
        document.dispatchEvent(new Event("prerender-ready"));
      }, 0);
    })
    .catch(() => {
      // incluso si falla, no bloquees el build
      setTimeout(() => {
        document.dispatchEvent(new Event("prerender-ready"));
      }, 0);
    });
}

// =============================
// Bootstrap de la app
// =============================
const app = createApp(App);

// ✅ Head manager (para OG tags en páginas prerenderizadas)
const head = createHead();

app.use(createPinia());
app.use(head);
app.use(router);
app.use(vuetify);
app.use(VueApexCharts);

app.mount("#app");

// ✅ IMPORTANTÍSIMO: disparar señal para el prerender
signalPrerenderReady(router);
