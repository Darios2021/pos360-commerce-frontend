// ✅ COPY-PASTE FINAL COMPLETO
// src/app/theme/themeManager.js

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

  if (typeof vuetify?.theme?.change === "function") {
    vuetify.theme.change(n);
    return;
  }

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
  const dark =
    darkOverride === true || darkOverride === false
      ? darkOverride
      : getPreferredDark();

  const themeName = getThemeNameForRoute(p, dark);
  const key = `${p}|${themeName}`;

  if (!force && lastAppliedKey === key) {
    if (debug) console.log("[THEME] skip", key);
    return;
  }

  // ✅ 1) Aplicar theme base Vuetify (rápido)
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

  // ✅ 2) SOLO ecommerce usa runtime theme
  if (!isBackofficePath(p)) {
    const thRaw = await fetchThemeForRoute(p);

    // cancel si hay una nueva ejecución
    if (token !== applyToken) {
      if (debug) console.log("[THEME] cancel (newer request)", { token, applyToken });
      return;
    }

    const th = normalizeTheme(thRaw);

    if (th) {
      applyRuntimeTheme(th, { scope: ".scope-shop" });

      if (debug) {
        console.log("[THEME] runtime applied (shop only)", {
          token,
        });
      }
    } else {
      if (debug) console.log("[THEME] runtime not available", { token });
    }
  } else {
    if (debug) {
      console.log("[THEME] admin: runtime theme SKIPPED");
    }
  }

  if (token === applyToken) lastAppliedKey = key;
}

/**
 * ✅ Reactividad
 */
export function wireThemeReactivity({ vuetify, router, debug = false } = {}) {
  router?.afterEach?.((to) => {
    applyThemeAtomic({ vuetify, path: to?.path, debug });
  });

  // otros tabs
  window.addEventListener("storage", (ev) => {
    if (ev?.key === "ui.dark") {
      applyThemeAtomic({
        vuetify,
        path: window.location.pathname,
        force: true,
        debug,
      });
    }
  });

  // mismo tab
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
        hasOverride =
          v === "1" ||
          v === "0" ||
          v === "true" ||
          v === "false";
      } catch {}

      if (!hasOverride) {
        applyThemeAtomic({
          vuetify,
          path: window.location.pathname,
          force: true,
          debug,
        });
      }
    });
  } catch {}
}