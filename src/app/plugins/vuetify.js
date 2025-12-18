// src/app/plugins/vuetify.js
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

// Opcional: iconos mdi (si ya los usás)
import "@mdi/font/css/materialdesignicons.css";

export const vuetify = createVuetify({
  components,
  directives,

  theme: {
    defaultTheme: "pos360Light",
    themes: {
      pos360Light: {
        dark: false,
        colors: {
          background: "#F6F7FB",
          surface: "#FFFFFF",
          primary: "#1E5EFF",
          secondary: "#6B7280",
          success: "#16A34A",
          warning: "#F59E0B",
          error: "#DC2626",
          info: "#0EA5E9",

          // textos (Vuetify los usa en varias partes)
          "on-background": "#0F172A",
          "on-surface": "#0F172A",
        },
      },
    },
  },

  // Defaults globales: acá está la magia del "mismo style"
  defaults: {
    VApp: {
      style: "background: rgb(var(--v-theme-background));",
    },

    VContainer: {
      fluid: true,
    },

    VCard: {
      rounded: "xl",
      elevation: 2,
    },

    VBtn: {
      rounded: "lg",
      variant: "flat",
    },

    VTextField: {
      variant: "outlined",
      density: "comfortable",
      hideDetails: "auto",
    },

    VSelect: {
      variant: "outlined",
      density: "comfortable",
      hideDetails: "auto",
    },

    VTextarea: {
      variant: "outlined",
      density: "comfortable",
      hideDetails: "auto",
    },

    VDataTable: {
      density: "comfortable",
    },

    VDataTableServer: {
      density: "comfortable",
    },

    VChip: {
      rounded: "lg",
      variant: "tonal",
    },
  },
});
