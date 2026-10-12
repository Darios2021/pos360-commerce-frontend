import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { es } from "vuetify/locale";

const vuetify = createVuetify({
  components,
  directives,

  // Textos propios de Vuetify (calendario, "sin datos", paginado) en español.
  locale: { locale: "es", fallback: "en", messages: { es } },
  date: { locale: { es: "es-AR" } },

  // Un solo corte de "teléfono" en todo el sistema: por debajo de md (960 px).
  // El valor por defecto de Vuetify es lg (1280), así que una notebook con
  // zoom o una tablet apaisada caían en la barra inferior y perdían el menú.
  display: { mobileBreakpoint: "md" },

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
          sidebar:   "#1488d1",
          background: "#c5cbd2",
          surface:    "#ffffff",
        },
      },

      // ── Dark mode REAL (estilo Linear / Vercel / GitHub) ──────────────────
      // Grises neutros casi negros con un tinte frío sutil. NO navy saturado.
      //   background      → canvas, el tono más oscuro
      //   surface         → cards / sheets, un escalón ancho arriba
      //   surface-bright  → modales, popovers, overlays elevados
      //   primary         → brand un poco más vivo para contraste sobre dark
      // ----------------------------------------------------------------------
      adminDark: {
        dark: true,
        colors: {
          primary:          "#3aa5e6",
          secondary:        "#1488d1",
          sidebar:          "#1488d1",
          // Canvas más oscuro que las piezas, con un escalón ancho
          // (rediseño móvil aprobado, informe 4.1). Antes estaba invertido.
          background:       "#111317",
          surface:          "#1f232a",
          "surface-bright": "#262a32",
          "surface-light":  "#262a32",
          "surface-variant":"#2a2f38",
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
          background: "#c5cbd2",
          surface:    "#ffffff",
        },
      },

      shopDark: {
        dark: true,
        colors: {
          primary:          "#3aa5e6",
          secondary:        "#1488d1",
          // Canvas más oscuro que las piezas, con un escalón ancho
          // (rediseño móvil aprobado, informe 4.1). Antes estaba invertido.
          background:       "#111317",
          surface:          "#1f232a",
          "surface-bright": "#262a32",
          "surface-light":  "#262a32",
          "surface-variant":"#2a2f38",
          "on-background":  "#e6e7eb",
          "on-surface":     "#e6e7eb",
          "on-surface-variant": "#a1a4ab",
        },
      },
    },
  },
});

export default vuetify;