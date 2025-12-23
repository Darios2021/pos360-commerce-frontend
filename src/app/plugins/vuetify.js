// src/app/plugins/vuetify.js
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: "light",
    themes: {
      light: { dark: false, colors: {} },
      dark: { dark: true, colors: {} },
    },
  },
});

export default vuetify;
