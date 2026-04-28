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
      // ── Paleta brand POS 360 ─────────────────────────────────────────────
      // Tomada del logo oficial (gradiente):
      //   primary   = #1488d1  (celeste vivo, CTAs y acentos)
      //   secondary = #121e47  (navy profundo, sidebar / hover oscuro)
      // ----------------------------------------------------------------------
      adminLight: {
        dark: false,
        colors: {
          primary:   "#1488d1",
          secondary: "#121e47",
          sidebar:   "#121e47",
          background: "#eef3f9",
          surface:    "#ffffff",
        },
      },

      // ── Dark mode REAL (estilo Linear / Vercel / GitHub) ──────────────────
      // Grises neutros casi negros con un tinte frío sutil. NO navy saturado.
      //   background      → casi negro, tinte cool muy leve
      //   surface         → cards / sheets, un escalón arriba
      //   surface-bright  → modales, popovers, overlays elevados
      //   primary         → brand un poco más vivo para contraste sobre dark
      // ----------------------------------------------------------------------
      adminDark: {
        dark: true,
        colors: {
          primary:          "#3aa5e6",
          secondary:        "#1488d1",
          sidebar:          "#0d1840",
          background:       "#0b0c0f",
          surface:          "#16181d",
          "surface-bright": "#1f2228",
          "surface-light":  "#1f2228",
          "surface-variant":"#2a2d34",
          "on-background":  "#e6e7eb",
          "on-surface":     "#e6e7eb",
          "on-surface-variant": "#a1a4ab",
        },
      },

      shopLight: {
        dark: false,
        colors: {
          primary:   "#1488d1",
          secondary: "#121e47",
          background: "#eef3f9",
          surface:    "#ffffff",
        },
      },

      shopDark: {
        dark: true,
        colors: {
          primary:          "#3aa5e6",
          secondary:        "#1488d1",
          background:       "#0b0c0f",
          surface:          "#16181d",
          "surface-bright": "#1f2228",
          "surface-light":  "#1f2228",
          "surface-variant":"#2a2d34",
          "on-background":  "#e6e7eb",
          "on-surface":     "#e6e7eb",
          "on-surface-variant": "#a1a4ab",
        },
      },
    },
  },
});

export default vuetify;