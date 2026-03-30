import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

const vuetify = createVuetify({
  components,
  directives,

  defaults: {
    VOverlay: { scrim: false },
    VDialog: { scrim: true },
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
      adminLight: {
        dark: false,
        colors: {
          primary: "#02498b",
          secondary: "#3483fa",
          sidebar: "#02498b",
          background: "#e9eef5",
          surface: "#ffffff",
        },
      },

      adminDark: {
        dark: true,
        colors: {
          primary: "#02498b",
          secondary: "#4f8cff",
          sidebar: "#02498b",
          background: "#0b1320",
          surface: "#111a2e",
        },
      },

      shopLight: {
        dark: false,
        colors: {
          primary: "#02498b",
          secondary: "#3483fa",
          background: "#ebebeb",
          surface: "#ffffff",
        },
      },

      shopDark: {
        dark: true,
        colors: {
          primary: "#02498b",
          secondary: "#4f8cff",
          background: "#0b1320",
          surface: "#111a2e",
        },
      },
    },
  },
});

export default vuetify;