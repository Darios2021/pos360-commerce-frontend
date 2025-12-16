// src/main.js
import { createApp } from "vue";
import App from "./App.vue";

import router from "./app/router";
import { createPinia } from "pinia";

import { vuetify } from "./app/plugins/vuetify";

import "./style.css";

createApp(App)
  .use(createPinia())
  .use(router)
  .use(vuetify)
  .mount("#app");
