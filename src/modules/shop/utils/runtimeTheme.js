// src/modules/shop/utils/runtimeTheme.js
// ✅ COPY-PASTE FINAL COMPLETO
// - Normaliza {primary, secondary}
// - Aplica runtime theme a Vuetify 3 (CSS vars) en el scope correcto

function isHex6(v) {
  const s = String(v || "").trim();
  const h = s.startsWith("#") ? s : `#${s}`;
  return /^#[0-9a-fA-F]{6}$/.test(h);
}

export function normalizeTheme(input) {
  const t = input && typeof input === "object" ? input : {};
  const primary = isHex6(t.primary) ? (t.primary.startsWith("#") ? t.primary : `#${t.primary}`) : "#0e2134";
  const secondary = isHex6(t.secondary) ? (t.secondary.startsWith("#") ? t.secondary : `#${t.secondary}`) : "#3483fa";
  return { primary: primary.toLowerCase(), secondary: secondary.toLowerCase() };
}

function hexToRgbTriplet(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`; // Vuetify usa "R G B"
}

// texto blanco/negro para on-primary
function pickOnColor(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // luminancia relativa simple
  const y = (r * 299 + g * 587 + b * 114) / 1000;
  return y >= 150 ? "#111111" : "#ffffff";
}

function setVarsOnEl(el, vars) {
  if (!el || !el.style) return;
  Object.entries(vars).forEach(([k, v]) => {
    try {
      el.style.setProperty(k, v);
    } catch {}
  });
}

function applyNow(theme) {
  const t = normalizeTheme(theme);
  const primaryRgb = hexToRgbTriplet(t.primary);
  const secondaryRgb = hexToRgbTriplet(t.secondary);

  const onPrimary = pickOnColor(t.primary);
  const onSecondary = pickOnColor(t.secondary);

  const vars = {
    // ✅ Vuetify theme vars (los que realmente usa rgb(var(--v-theme-primary)))
    "--v-theme-primary": primaryRgb,
    "--v-theme-secondary": secondaryRgb,
    "--v-theme-on-primary": hexToRgbTriplet(onPrimary),
    "--v-theme-on-secondary": hexToRgbTriplet(onSecondary),

    // ✅ helpers tuyos (por si algún CSS custom usa hex directo)
    "--pos-primary": t.primary,
    "--pos-secondary": t.secondary,
  };

  // 1) :root
  setVarsOnEl(document.documentElement, vars);

  // 2) v-application (muchas veces ahí queda el scope real)
  const app = document.querySelector(".v-application");
  if (app) setVarsOnEl(app, vars);

  // 3) nodos de tema Vuetify
  document.querySelectorAll(".v-theme--light, .v-theme--dark").forEach((node) => {
    setVarsOnEl(node, vars);
  });

  return t;
}

let observerStarted = false;

export function applyRuntimeTheme(theme) {
  if (typeof window === "undefined" || typeof document === "undefined") return null;

  const t = applyNow(theme);

  // ✅ Vuetify a veces monta .v-theme--light después => re-aplico cuando aparezca
  if (!observerStarted) {
    observerStarted = true;

    const obs = new MutationObserver(() => {
      // re-aplicar cuando cambia el DOM
      applyNow(t);
    });

    obs.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: false,
    });

    // fallback: un par de reintentos post-mount
    setTimeout(() => applyNow(t), 50);
    setTimeout(() => applyNow(t), 300);
    setTimeout(() => applyNow(t), 800);
  }

  return t;
}
