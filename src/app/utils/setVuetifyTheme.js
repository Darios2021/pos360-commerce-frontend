// ✅ COPY-PASTE FINAL COMPLETO
// src/app/utils/setVuetifyTheme.js
//
// Set theme sin warning (Vuetify upgrade):
// - Si existe vuetify.theme.change('name') -> usarlo
// - Si no, fallback a global.name.value

export function setVuetifyThemeName(vuetify, name) {
  try {
    const n = String(name || "").trim();
    if (!n) return;

    // Vuetify nuevo (según tu warning)
    if (typeof vuetify?.theme?.change === "function") {
      vuetify.theme.change(n);
      return;
    }

    // Fallback clásico
    if (vuetify?.theme?.global?.name?.value != null) {
      vuetify.theme.global.name.value = n;
      return;
    }

    // Último recurso
    if (vuetify?.theme?.global?.name != null) {
      vuetify.theme.global.name = n;
    }
  } catch (e) {
    console.warn("[setVuetifyThemeName] error:", e);
  }
}