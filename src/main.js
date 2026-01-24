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
      getItem() { return "null"; },
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
// ✅ Prerender watchdog (ANTES de imports)
// Si la app crashea, igual dispara el evento.
// =============================
(function () {
  if (typeof document === "undefined") return;

  const enabled =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      (String(import.meta.env.VITE_ENABLE_PRERENDER || "") === "1" ||
        String(import.meta.env.VITE_ENABLE_PRERENDER || "").toLowerCase() === "true")) ||
    false;

  if (!enabled) return;

  // ✅ fallback duro: a los 3s lo disparo sí o sí
  const t = setTimeout(() => {
    try {
      document.dispatchEvent(new Event("prerender-ready"));
      console.log("[prerender] watchdog fired");
    } catch {}
  }, 3000);

  // ✅ si ocurre error, disparo y listo
  window.addEventListener(
    "error",
    () => {
      clearTimeout(t);
      try {
        document.dispatchEvent(new Event("prerender-ready"));
      } catch {}
    },
    { once: true }
  );

  window.addEventListener(
    "unhandledrejection",
    () => {
      clearTimeout(t);
      try {
        document.dispatchEvent(new Event("prerender-ready"));
      } catch {}
    },
    { once: true }
  );
})();

// =============================
// Imports
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
// ✅ Prerender signal (normal)
// =============================
function signalPrerenderReady(routerInstance) {
  if (typeof document === "undefined") return;

  const enabled =
    String(import.meta.env.VITE_ENABLE_PRERENDER || "") === "1" ||
    String(import.meta.env.VITE_ENABLE_PRERENDER || "").toLowerCase() === "true";

  if (!enabled) return;

  Promise.resolve()
    .then(() => routerInstance.isReady())
    .catch(() => null)
    .finally(() => {
      setTimeout(() => {
        try {
          document.dispatchEvent(new Event("prerender-ready"));
          console.log("[prerender] router ready fired");
        } catch {}
      }, 0);
    });
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

signalPrerenderReady(router);
