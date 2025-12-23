// src/app/store/theme.store.js
import { defineStore } from "pinia";

const KEY = "pos360_theme";

function readSaved() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (typeof obj?.dark === "boolean") return obj.dark;
    return null;
  } catch {
    return null;
  }
}

function writeSaved(dark) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ dark: !!dark }));
  } catch {
    // ignore
  }
}

export const useThemeStore = defineStore("theme", {
  state: () => ({
    dark: readSaved() ?? false,
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
  },
});
