// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/shop/utils/setVuetifyThemeColors.js
//
// Actualiza en runtime los colores del theme de Vuetify (p.ej. shopLight)
// SIN tocar adminLight/adminDark (backoffice)

import vuetify from "@/app/plugins/vuetify";

function clampHex6(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  const h = s.startsWith("#") ? s : `#${s}`;
  return /^#[0-9a-fA-F]{6}$/.test(h) ? h.toLowerCase() : "";
}

/**
 * @param {string} themeName por ej "shopLight"
 * @param {object} colors { primary, secondary, background?, surface?, error?, success?, warning? }
 */
export function setVuetifyThemeColors(themeName = "shopLight", colors = {}) {
  try {
    const theme = vuetify?.theme;
    const themes = theme?.themes?.value;
    if (!themes || !themes[themeName]) return;

    const cur = themes[themeName] || {};
    const curColors = cur.colors || {};

    // sanitizar hex para evitar meter basura
    const next = { ...curColors };

    if (colors.primary) {
      const p = clampHex6(colors.primary);
      if (p) next.primary = p;
    }
    if (colors.secondary) {
      const s = clampHex6(colors.secondary);
      if (s) next.secondary = s;
    }
    if (colors.background) {
      const b = clampHex6(colors.background);
      if (b) next.background = b;
    }
    if (colors.surface) {
      const s2 = clampHex6(colors.surface);
      if (s2) next.surface = s2;
    }
    if (colors.error) {
      const e = clampHex6(colors.error);
      if (e) next.error = e;
    }
    if (colors.success) {
      const s3 = clampHex6(colors.success);
      if (s3) next.success = s3;
    }
    if (colors.warning) {
      const w = clampHex6(colors.warning);
      if (w) next.warning = w;
    }

    themes[themeName] = { ...cur, colors: next };

    // fuerza a Vuetify a regenerar css vars
    theme?.resetStyles?.();
  } catch {
    // no-op
  }
}