// src/main.js
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./app/router";
import vuetify from "./app/plugins/vuetify";
import "./style.css";

// ApexCharts
import VueApexCharts from "vue3-apexcharts";

const app = createApp(App);

app.use(createPinia()).use(router).use(vuetify);

// ✅ NO lo registres dos veces
app.use(VueApexCharts);

app.mount("#app");
