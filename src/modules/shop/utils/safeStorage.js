// src/modules/shop/utils/safeStorage.js
// Helpers para usar localStorage sin explotar en webviews (Instagram, FB, incógnito, iOS)

export function safeLocalGet(key, fallback = null) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(key);
    return raw != null ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}

export function safeLocalSet(key, value) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // nada — modo incógnito / storage deshabilitado
  }
}

export function safeLocalRemove(key) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.removeItem(key);
  } catch (err) {
    // nada
  }
}
