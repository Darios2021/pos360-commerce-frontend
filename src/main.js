// ✅ COPY-PASTE FINAL COMPLETO
// main.js

// =============================
// 🔐 PATCH GLOBAL para WebViews capados (Instagram / Facebook / iOS Private)
// Debe ir ANTES de cualquier import
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
// (Opcional) Señal de compatibilidad para prerender por evento
// Ya NO es necesaria si usás renderAfterTime en vite.config.js,
// pero no molesta dejarla.
// =============================
function signalPrerenderReady(routerInstance) {
  try {
    const enabled =
      String(import.meta.env.VITE_ENABLE_PRERENDER || "") === "1" ||
      String(import.meta.env.VITE_ENABLE_PRERENDER || "").toLowerCase() ===
        "true";

    if (!enabled) return;
    if (typeof document === "undefined") return;

    const fire = () => {
      try {
        document.dispatchEvent(new Event("prerender-ready"));
      } catch {}
    };

    // ✅ Fallback SIEMPRE dispara aunque algo se cuelgue
    setTimeout(fire, 1500);

    // ✅ intenta esperar router (si llega)
    routerInstance
      .isReady()
      .then(() => setTimeout(fire, 0))
      .catch(() => setTimeout(fire, 0));
  } catch {}
}

// =============================
// Bootstrap de la app
// =============================
const app = createApp(App);

const head = createHead();

app.use(createPinia());
app.use(head);
app.use(router);
app.use(vuetify);
app.use(VueApexCharts);

app.mount("#app");

// ✅ compat prerender
signalPrerenderReady(router);
