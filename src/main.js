// ✅ COPY-PASTE FINAL COMPLETO
// src/main.js

(function () {
  if (typeof window === "undefined") return;

  const isMetaWebView =
    /instagram|fb_iab|fbav|facebook|messenger/i.test(navigator.userAgent || "");

  // localStorage patch
  try {
    const k = "__ls_test__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
  } catch {
    const noop = {
      getItem() { return "null"; },
      setItem() {},
      removeItem() {},
      clear() {},
      key() { return null; },
      get length() { return 0; },
    };
    try {
      Object.defineProperty(window, "localStorage", { value: noop, configurable: true });
    } catch {
      window.localStorage = noop;
    }
  }

  // sessionStorage patch
  try {
    const k = "__ss_test__";
    window.sessionStorage.setItem(k, "1");
    window.sessionStorage.removeItem(k);
  } catch {
    const noop = {
      getItem() { return "null"; },
      setItem() {},
      removeItem() {},
      clear() {},
      key() { return null; },
      get length() { return 0; },
    };
    try {
      Object.defineProperty(window, "sessionStorage", { value: noop, configurable: true });
    } catch {
      window.sessionStorage = noop;
    }
  }

  // indexedDB patch
  try {
    if (!window.indexedDB && !window.webkitIndexedDB) {
      window.indexedDB = {
        open() {
          return { onerror() {}, onsuccess() {}, onupgradeneeded() {} };
        },
      };
    }
  } catch {
    window.indexedDB = {
      open() {
        return { onerror() {}, onsuccess() {}, onupgradeneeded() {} };
      },
    };
  }

  if (isMetaWebView) console.log("[META WEBVIEW DETECTADO]");
})();

import { createApp } from "vue";
import { createPinia } from "pinia";
import { createHead } from "@vueuse/head";

import App from "./App.vue";
import router from "./app/router";
import vuetify from "./app/plugins/vuetify";

import VueApexCharts from "vue3-apexcharts";

import "./style.css";
import "@/modules/shop/styles/shop.css";

import { applyThemeAtomic, wireThemeReactivity } from "@/app/theme/themeManager";

function signalPrerenderReady(routerInstance) {
  try {
    const enabled =
      String(import.meta.env.VITE_ENABLE_PRERENDER || "") === "1" ||
      String(import.meta.env.VITE_ENABLE_PRERENDER || "").toLowerCase() === "true";

    if (!enabled) return;

    const fire = () => {
      try {
        document.dispatchEvent(new Event("prerender-ready"));
      } catch {}
    };

    setTimeout(fire, 1500);

    routerInstance
      .isReady()
      .then(() => setTimeout(fire, 0))
      .catch(() => setTimeout(fire, 0));
  } catch {}
}

const DEBUG_THEME =
  String(import.meta.env.VITE_DEBUG_THEME || "") === "1" ||
  String(import.meta.env.VITE_DEBUG_THEME || "").toLowerCase() === "true";

const app = createApp(App);
const head = createHead();

app.use(createPinia());
app.use(head);
app.use(router);
app.use(vuetify);
app.use(VueApexCharts);

app.mount("#app");

// ✅ theme inicial (una sola vez)
applyThemeAtomic({ vuetify, path: window.location.pathname, debug: DEBUG_THEME });

// ✅ reactividad: ruta + toggle (evento local) + storage + system
wireThemeReactivity({ vuetify, router, debug: DEBUG_THEME });

// ✅ prerender
signalPrerenderReady(router);