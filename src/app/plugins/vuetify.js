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
      light: {
        dark: false,
        colors: {
          primary: "#0e2134",
          secondary: "#3483fa",
          background: "#f5f6f8",
          surface: "#ffffff",
          error: "#d32f2f",
          success: "#2e7d32",
          warning: "#ed6c02",
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: "#0e2134",
          secondary: "#3483fa",
          background: "#0b1320",
          surface: "#111a2e",
          error: "#ef5350",
          success: "#66bb6a",
          warning: "#ffa726",
        },
      },
    },
  },
});

export default vuetify;
