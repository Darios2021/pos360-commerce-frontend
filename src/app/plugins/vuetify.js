// ✅ COPY-PASTE FINAL COMPLETO
// src/app/plugins/vuetify.js

import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

const vuetify = createVuetify({
  components,
  directives,

  defaults: {
    // 🔥 regla base: ningún overlay tiene scrim por defecto
    VOverlay: {
      scrim: false,
    },

    // 🔥 dialogs sí tienen scrim
    VDialog: {
      scrim: true,
    },

    // blindaje extra
    VMenu: { scrim: false },
    VSelect: { menuProps: { scrim: false } },
    VAutocomplete: { menuProps: { scrim: false } },
    VCombobox: { menuProps: { scrim: false } },
    VTooltip: { scrim: false },
  },

  theme: {
    defaultTheme: "adminLight",
    options: { customProperties: true },

    themes: {
      /* ============================
         🔵 ADMIN / POS (MEJORADO)
         ============================ */
      adminLight: {
        dark: false,
        colors: {
          primary: "#0e2134",
          secondary: "#3483fa",

          // 🔥 CANVAS (más gris → separa capas)
          background: "#e9eef5",

          // 🔥 SUPERFICIES (cards)
          surface: "#ffffff",
        },
      },

      adminDark: {
        dark: true,
        colors: {
          primary: "#0e2134",
          secondary: "#3483fa",

          // fondo profundo
          background: "#0b1320",

          // superficies
          surface: "#111a2e",
        },
      },

      /* ============================
         🟡 SHOP (no tocar)
         ============================ */
      shopLight: {
        dark: false,
        colors: {
          primary: "#0e2134",
          secondary: "#3483fa",
          background: "#ebebeb",
          surface: "#ffffff",
        },
      },

      shopDark: {
        dark: true,
        colors: {
          primary: "#0e2134",
          secondary: "#3483fa",
          background: "#0b1320",
          surface: "#111a2e",
        },
      },
    },
  },
});

export default vuetify;