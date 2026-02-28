// ✅ COPY-PASTE FINAL COMPLETO
// src/app/theme/darkMode.js
//
// Setter único del modo oscuro.
// IMPORTANTE: "storage" NO dispara en el mismo tab, por eso usamos evento custom.

export function setDarkMode(dark) {
  const v = dark ? "1" : "0";

  try {
    window.localStorage.setItem("ui.dark", v);
  } catch {}

  try {
    window.dispatchEvent(new CustomEvent("ui-dark-changed", { detail: { dark: !!dark } }));
  } catch {}
}

export function toggleDarkMode() {
  let current = false;
  try {
    const v = window.localStorage.getItem("ui.dark");
    current = v === "1" || v === "true";
  } catch {}
  setDarkMode(!current);
}