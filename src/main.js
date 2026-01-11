// =============================
// 🔐 PATCH GLOBAL localStorage
// (Instagram / Facebook WebView / iOS incógnito / navegadores capados)
// Debe ir antes de cualquier import
// =============================
(function () {
  if (typeof window === "undefined") return;

  try {
    const testKey = "__ls_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    // Si esto funciona, localStorage está OK → no tocamos nada
  } catch (err) {
    // localStorage explotó → reemplazamos por dummy storage
    const noopStorage = {
      getItem() { return null; },
      setItem() {},
      removeItem() {},
      clear() {},
      key() { return null; },
      get length() { return 0; },
    };

    try {
      Object.defineProperty(window, "localStorage", {
        value: noopStorage,
        configurable: true,
      });
    } catch (e) {
      window.localStorage = noopStorage;
    }
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

app.use(createPinia())
   .use(router)
   .use(vuetify);

// ⚠️ (Nota tuya: NO registrar dos veces)
app.use(VueApexCharts);

app.mount("#app");
