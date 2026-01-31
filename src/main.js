// ✅ COPY-PASTE FINAL COMPLETO
// src/main.js

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
      Object.defineProperty(window, "sessionStorage", { value: noopSS, configurable: true });
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

// ✅ Runtime theme (tu util actual)
import { applyRuntimeTheme, normalizeTheme } from "@/modules/shop/utils/runtimeTheme";

// ✅ Theme endpoints
import { getShopThemePublic } from "@/modules/shop/service/shopTheme.public.api";
import { getShopThemeAdmin } from "@/modules/shop/service/admin.shopTheme.api";

// =============================
// (Opcional) Señal prerender
// =============================
function signalPrerenderReady(routerInstance) {
  try {
    const enabled =
      String(import.meta.env.VITE_ENABLE_PRERENDER || "") === "1" ||
      String(import.meta.env.VITE_ENABLE_PRERENDER || "").toLowerCase() === "true";

    if (!enabled) return;
    if (typeof document === "undefined") return;

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

// =============================
// ✅ Bootstrap THEME (después del mount, porque tu runtimeTheme re-aplica scopes)
// - /shop  => public theme
// - /app   => admin theme (si hay token)
// =============================
function isBackofficePath() {
  try {
    const p = window.location.pathname || "";
    return p.startsWith("/app");
  } catch {
    return false;
  }
}

async function bootstrapThemeOnce() {
  try {
    if (typeof window === "undefined") return;

    if (isBackofficePath()) {
      // BACKOFFICE: requiere token (si todavía no hay, puede fallar y no pasa nada)
      const th = await getShopThemeAdmin();
      if (th) applyRuntimeTheme(normalizeTheme(th));
      return;
    }

    // PUBLICO / SHOP
    const th = await getShopThemePublic();
    if (th) applyRuntimeTheme(normalizeTheme(th));
  } catch {
    // silencioso
  }
}

// Reintentos cortos para el caso "acabo de loguearme y recién se guardó token"
async function bootstrapThemeWithRetries() {
  await bootstrapThemeOnce();
  setTimeout(() => bootstrapThemeOnce(), 400);
  setTimeout(() => bootstrapThemeOnce(), 1200);
}

// =============================
// Bootstrap app
// =============================
const app = createApp(App);
const head = createHead();

app.use(createPinia());
app.use(head);
app.use(router);
app.use(vuetify);
app.use(VueApexCharts);

app.mount("#app");

// ✅ aplica theme runtime (shop o backoffice)
bootstrapThemeWithRetries();

// ✅ compat prerender
signalPrerenderReady(router);
