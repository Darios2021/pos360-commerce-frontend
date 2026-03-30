// ✅ COPY-PASTE FINAL COMPLETO
// src/app/store/theme.store.js

import { defineStore } from "pinia";

const KEY = "ui.dark";

function readSaved() {
  try {
    const raw = window.localStorage.getItem(KEY);

    if (raw === "1" || raw === "true") return true;
    if (raw === "0" || raw === "false") return false;

    return null;
  } catch {
    return null;
  }
}

function writeSaved(dark) {
  try {
    window.localStorage.setItem(KEY, dark ? "1" : "0");
  } catch {
    // ignore
  }
}

function readSystemPref() {
  try {
    return !!window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  } catch {
    return false;
  }
}

export const useThemeStore = defineStore("theme", {
  state: () => ({
    dark: readSaved() ?? readSystemPref(),
  }),

  getters: {
    isDark: (s) => !!s.dark,
  },

  actions: {
    setDark(v) {
      this.dark = !!v;
      writeSaved(this.dark);
    },

    toggle() {
      this.setDark(!this.dark);
    },

    syncFromStorage() {
      const saved = readSaved();
      if (typeof saved === "boolean") {
        this.dark = saved;
      }
    },
  },
});