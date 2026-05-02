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

// ============================================================
// Boot guard de auth shop + biometría (solo Capacitor / mobile)
// ----------------------------------------------------------------
// Si la app móvil tiene un token de sesión guardado y el usuario
// activó biometría, pedimos huella ANTES de hidratar.
// Si la huella falla → limpiamos el token (forzamos re-login).
// Si todo OK → hidratamos el store de auth para que todas las
// llamadas API arranquen ya autenticadas.
// ============================================================
(async () => {
  try {
    const { isCapacitor } = await import("@/app/utils/runtime");
    const { getToken, isBiometricEnabled, clearToken } = await import("@/app/utils/tokenStorage");
    const { useShopAuthStore } = await import("@/modules/shop/service/shopAuth.store");

    const auth = useShopAuthStore();

    if (isCapacitor()) {
      const tok = await getToken();
      if (tok) {
        const bioOn = await isBiometricEnabled();
        if (bioOn) {
          const { authenticateBiometric } = await import("@/app/utils/biometric");
          const ok = await authenticateBiometric({
            reason: "Ingresá con tu huella para abrir Sj Tecnología",
          });
          if (!ok) {
            // Si falló la biometría, NO borramos el token: lo dejamos
            // para que el usuario pueda reintentar. Pero forzamos a la
            // pantalla de login (no hidratamos automáticamente).
            // El usuario puede tocar "Reintentar" desde el login.
            return;
          }
        }
        await auth.hydrate();
      } else {
        // No hay token → no hidratamos, queda invitado.
      }
    } else {
      // Web: igual hidratamos (la cookie httpOnly suele estar disponible).
      await auth.hydrate();
    }
  } catch (e) {
    console.warn("[boot] hydrate falló:", e?.message);
  }
})();

// ✅ theme inicial (una sola vez)
applyThemeAtomic({ vuetify, path: window.location.pathname, debug: DEBUG_THEME });

// ✅ reactividad: ruta + toggle (evento local) + storage + system
wireThemeReactivity({ vuetify, router, debug: DEBUG_THEME });

// ✅ prerender
signalPrerenderReady(router);