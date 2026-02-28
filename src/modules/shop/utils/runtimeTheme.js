// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/shop/utils/runtimeTheme.js
//
// applyRuntimeTheme(theme, { scope, strict })
// - Si scope existe: aplica CSS vars SOLO dentro de ese contenedor
// - Si scope NO existe:
//    - strict=true  => NO aplica (evita pisar backoffice)
//    - strict=false => aplica a documentElement (fallback)
// - Compatible con Vuetify 3 (vars --v-theme-*)
// ✅ FIX: setea on-* (on-primary/on-secondary/on-surface/on-background)
// ✅ FIX: calcula contraste (primary claro => texto oscuro)

function clampHex6(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  const h = s.startsWith("#") ? s : `#${s}`;
  return /^#[0-9a-fA-F]{6}$/.test(h) ? h.toLowerCase() : "";
}

function hexToRgb(hex) {
  const h = clampHex6(hex);
  if (!h) return null;
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return { r, g, b };
}

function hexToRgbTriplet(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return `${rgb.r} ${rgb.g} ${rgb.b}`; // ✅ formato Vuetify: "r g b"
}

// sRGB -> luminancia relativa
function relLuminance({ r, g, b }) {
  const srgb = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

// devuelve hex de texto ideal según contraste
function bestOnColor(bgHex) {
  const rgb = hexToRgb(bgHex);
  if (!rgb) return "#ffffff";
  const L = relLuminance(rgb);

  // umbral: si el fondo es claro, usamos texto oscuro; si es oscuro, blanco
  return L > 0.55 ? "#111827" : "#ffffff";
}

export function normalizeTheme(input = {}) {
  const primary = clampHex6(input.primary) || "#0e2134";
  const secondary = clampHex6(input.secondary) || "#3483fa";

  // opcionales (si tu backend los manda, los usamos; si no, no tocamos)
  const background = clampHex6(input.background || "") || "";
  const surface = clampHex6(input.surface || "") || "";
  const error = clampHex6(input.error || "") || "";
  const success = clampHex6(input.success || "") || "";
  const warning = clampHex6(input.warning || "") || "";

  // ✅ on-* (si backend no manda, calculamos)
  const onPrimary =
    clampHex6(input.onPrimary || input["on-primary"] || "") || bestOnColor(primary);

  const onSecondary =
    clampHex6(input.onSecondary || input["on-secondary"] || "") || bestOnColor(secondary);

  // ✅ defaults seguros para texto en superficies claras del shop
  const onSurface =
    clampHex6(input.onSurface || input["on-surface"] || "") || "#212529";
  const onBackground =
    clampHex6(input.onBackground || input["on-background"] || "") || "#212529";

  return {
    primary,
    secondary,
    ...(background ? { background } : {}),
    ...(surface ? { surface } : {}),
    ...(error ? { error } : {}),
    ...(success ? { success } : {}),
    ...(warning ? { warning } : {}),

    // ✅ siempre presentes
    onPrimary,
    onSecondary,
    onSurface,
    onBackground,
  };
}

/**
 * @param {object} theme {primary, secondary, background?, surface?, error?, success?, warning?, onPrimary?, ...}
 * @param {object} opts {scope?: string, strict?: boolean}
 *   - scope: selector CSS, ej ".scope-shop" o ".preview-scope"
 *   - strict: si true y no existe el scope, NO aplica nada (evita pisar global)
 */
export function applyRuntimeTheme(theme = {}, opts = {}) {
  if (typeof document === "undefined") return;

  const t = normalizeTheme(theme);

  const scopeSel = String(opts?.scope || "").trim();
  const strict = opts?.strict !== undefined ? !!opts.strict : true; // ✅ por defecto: seguro

  let el = null;

  if (scopeSel) {
    el = document.querySelector(scopeSel);
    if (!el) {
      // ✅ si pediste scope y no existe, NO caemos a :root (evita romper backoffice)
      if (strict) return;
      el = document.documentElement;
    }
  } else {
    // ✅ sin scope: el que lo llame se hace cargo
    el = document.documentElement;
  }

  const set = (name, hex) => {
    const triplet = hexToRgbTriplet(hex);
    if (!triplet) return;
    el.style.setProperty(`--v-theme-${name}`, triplet);
  };

  // ✅ base
  set("primary", t.primary);
  set("secondary", t.secondary);

  // ✅ opcionales
  if (t.background) set("background", t.background);
  if (t.surface) set("surface", t.surface);
  if (t.error) set("error", t.error);
  if (t.success) set("success", t.success);
  if (t.warning) set("warning", t.warning);

  // ✅ on-* (CLAVE para que el header/footer/botones “se lean”)
  set("on-primary", t.onPrimary);
  set("on-secondary", t.onSecondary);
  set("on-surface", t.onSurface);
  set("on-background", t.onBackground);

  // console.log("[applyRuntimeTheme]", { scope: scopeSel || ":root", strict, t });
}