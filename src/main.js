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
      getItem() { return "null"; }, // JSON.parse("null") => null (no rompe)
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
import App from "./App.vue";
import router from "./app/router";
import vuetify from "./app/plugins/vuetify";
import "./style.css";

// ApexCharts
import VueApexCharts from "vue3-apexcharts";

// =============================
// Bootstrap de la app
// =============================
const app = createApp(App);

app
  .use(createPinia())
  .use(router)
  .use(vuetify);

// ⚠️ (Nota tuya: NO registrar dos veces)
app.use(VueApexCharts);

app.mount("#app");
