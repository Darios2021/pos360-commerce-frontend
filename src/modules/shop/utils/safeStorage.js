// src/modules/shop/utils/safeStorage.js
// ✅ COPY-PASTE FINAL
// - localStorage con try/catch
// - parse seguro
// - logs cuando algo falla (solo en dev)
// - útil para depurar "vuelve a aparecer el carrito"

const isDev = typeof import.meta !== "undefined" ? !!import.meta.env?.DEV : true;

function log(...args) {
  if (isDev) console.log("[safeStorage]", ...args);
}

function getLS() {
  try {
    if (typeof window === "undefined") return null;
    const ls = window.localStorage;
    // test
    const k = "__pos360_ls_test__";
    ls.setItem(k, "1");
    ls.removeItem(k);
    return ls;
  } catch (e) {
    log("localStorage not available:", e?.message || e);
    return null;
  }
}

export function safeLocalGet(key, fallback = null) {
  const ls = getLS();
  if (!ls) return fallback;

  try {
    const raw = ls.getItem(key);
    if (raw === null || raw === undefined || raw === "") return fallback;
    return JSON.parse(raw);
  } catch (e) {
    log("GET failed", key, e?.message || e);
    return fallback;
  }
}

export function safeLocalSet(key, value) {
  const ls = getLS();
  if (!ls) return;

  try {
    ls.setItem(key, JSON.stringify(value));
  } catch (e) {
    log("SET failed", key, e?.message || e);
  }
}

export function safeLocalRemove(key) {
  const ls = getLS();
  if (!ls) return;

  try {
    ls.removeItem(key);
  } catch (e) {
    log("REMOVE failed", key, e?.message || e);
  }
}
