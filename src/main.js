// src/main.js

// =============================
// 🔐 PATCH GLOBAL para WebViews capados (Instagram / Facebook / iOS)
// =============================
(function () {
  if (typeof window === "undefined") return;

  const isMetaWebView =
    /instagram|fb_iab|fbav|facebook|messenger/i.test(
      navigator.userAgent || ""
    );

  // --- localStorage ---
  try {
    const k = "__ls_test__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
  } catch {
    const noop = {
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
        value: noop,
        configurable: true,
      });
    } catch {
      window.localStorage = noop;
    }
  }

  // --- sessionStorage ---
  try {
    const k = "__ss_test__";
    window.sessionStorage.setItem(k, "1");
    window.sessionStorage.removeItem(k);
  } catch {
    const noop = {
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
        value: noop,
        configurable: true,
      });
    } catch {
      window.sessionStorage = noop;
    }
  }

  // --- IndexedDB ---
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

  if (isMetaWebView) {
    console.log("[META WEBVIEW]");
  }
})();

// =============================
// App imports
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
// Bootstrap
// =============================
const app = createApp(App);

app.use(createPinia());
app.use(createHead());
app.use(router);
app.use(vuetify);
app.use(VueApexCharts);

app.mount("#app");
