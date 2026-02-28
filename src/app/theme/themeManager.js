// ✅ COPY-PASTE FINAL COMPLETO
// src/app/theme/themeManager.js
//
// Theme Manager ATÓMICO + evento local (mismo tab)
// - Evita estados intermedios al togglear dark
// - Cancela llamadas viejas (token)
// - Aplica tema según ruta (/app vs /shop)
// - Reacciona a: router, storage (otros tabs) y evento custom (mismo tab)

import { normalizeTheme, applyRuntimeTheme } from "@/modules/shop/utils/runtimeTheme";
import { getShopThemePublic } from "@/modules/shop/service/shopTheme.public.api";
import { getShopThemeAdmin } from "@/modules/shop/service/admin.shopTheme.api";

function isBackofficePath(pathname = "") {
  const p = String(pathname || "");
  return p.startsWith("/app");
}

function getPreferredDark() {
  try {
    const v = window.localStorage.getItem("ui.dark");
    if (v === "1" || v === "true") return true;
    if (v === "0" || v === "false") return false;
  } catch {}
  try {
    return !!window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  } catch {
    return false;
  }
}

function getThemeNameForRoute(path, dark) {
  const admin = isBackofficePath(path);
  return admin ? (dark ? "adminDark" : "adminLight") : dark ? "shopDark" : "shopLight";
}

async function fetchThemeForRoute(path) {
  try {
    if (isBackofficePath(path)) return await getShopThemeAdmin();
    return await getShopThemePublic();
  } catch {
    return null;
  }
}

function setVuetifyThemeName(vuetify, name) {
  const n = String(name || "").trim();
  if (!n) return;

  // ✅ Vuetify nuevo (tu warning lo confirma)
  if (typeof vuetify?.theme?.change === "function") {
    vuetify.theme.change(n);
    return;
  }

  // fallback
  if (vuetify?.theme?.global?.name?.value != null) {
    vuetify.theme.global.name.value = n;
  }
}

function readCurrentVuetifyThemeName(vuetify) {
  try {
    const v = vuetify?.theme?.global?.name?.value;
    if (typeof v === "string") return v;
  } catch {}
  return null;
}

let applyToken = 0;
let lastAppliedKey = null;

/**
 * ✅ Aplica el theme de forma atómica
 * @param {object} params
 *  - vuetify
 *  - path
 *  - force
 *  - debug
 *  - darkOverride (true/false/null)
 */
export async function applyThemeAtomic({
  vuetify,
  path,
  force = false,
  debug = false,
  darkOverride = null,
} = {}) {
  const token = ++applyToken;
  const p = String(path || window.location.pathname || "/");
  const dark = darkOverride === true || darkOverride === false ? darkOverride : getPreferredDark();
  const themeName = getThemeNameForRoute(p, dark);

  const key = `${p}|${themeName}`;
  if (!force && lastAppliedKey === key) {
    if (debug) console.log("[THEME] skip", key);
    return;
  }

  // 1) set name rápido (evita flashes)
  setVuetifyThemeName(vuetify, themeName);

  if (debug) {
    console.log("[THEME] set", {
      token,
      path: p,
      dark,
      themeName,
      current: readCurrentVuetifyThemeName(vuetify),
    });
  }

  // 2) runtime theme según ruta (admin vs public)
  const thRaw = await fetchThemeForRoute(p);

  // cancel si entró otro apply
  if (token !== applyToken) {
    if (debug) console.log("[THEME] cancel (newer request)", { token, applyToken });
    return;
  }

  const th = normalizeTheme(thRaw);
  if (th) {
    const scope = isBackofficePath(p) ? ".scope-app" : ".scope-shop";
    applyRuntimeTheme(th, { scope });
    if (debug) console.log("[THEME] runtime applied", { token, scope });
  } else {
    if (debug) console.log("[THEME] runtime not available", { token });
  }

  if (token === applyToken) lastAppliedKey = key;
}

/**
 * ✅ Wire reactivity:
 * - router changes
 * - localStorage changes (otros tabs)
 * - evento local (mismo tab): "ui-dark-changed"
 * - system changes (si no hay override)
 */
export function wireThemeReactivity({ vuetify, router, debug = false } = {}) {
  router?.afterEach?.((to) => {
    applyThemeAtomic({ vuetify, path: to?.path, debug });
  });

  // otros tabs
  window.addEventListener("storage", (ev) => {
    if (ev?.key === "ui.dark") {
      applyThemeAtomic({ vuetify, path: window.location.pathname, force: true, debug });
    }
  });

  // mismo tab (nuestro evento)
  window.addEventListener("ui-dark-changed", (ev) => {
    const dark = ev?.detail?.dark;
    applyThemeAtomic({
      vuetify,
      path: window.location.pathname,
      force: true,
      debug,
      darkOverride: typeof dark === "boolean" ? dark : null,
    });
  });

  // system
  try {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener?.("change", () => {
      let hasOverride = false;
      try {
        const v = window.localStorage.getItem("ui.dark");
        hasOverride = v === "1" || v === "0" || v === "true" || v === "false";
      } catch {}
      if (!hasOverride) {
        applyThemeAtomic({ vuetify, path: window.location.pathname, force: true, debug });
      }
    });
  } catch {}
}