// src/app/store/auth.store.js
import { defineStore } from "pinia";
import http from "../api/http";
import { loadAuth, saveAuth, clearAuth } from "../utils/storage";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    status: "idle", // idle | authed | guest
    user: null,
    accessToken: null,
    refreshToken: null,
    error: null,
  }),

  getters: {
    isAuthed: (s) => !!s.accessToken && s.status === "authed",
  },

  actions: {
    hydrate() {
      const saved = loadAuth();
      if (saved?.accessToken) {
        this.accessToken = saved.accessToken;
        this.refreshToken = saved.refreshToken || null;
        this.user = saved.user || null;
        this.status = "authed";
      } else {
        this.status = "guest";
      }
    },

    async login({ identifier, password }) {
      this.error = null;

      // debug opcional
      console.log("[AUTH] login payload", { identifier, password: "***" });

      const { data } = await http.post("/auth/login", {
        identifier,
        password,
      });

      if (!data?.ok) throw new Error(data?.message || "LOGIN_FAILED");

      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken || null;
      this.user = data.user || null;
      this.status = "authed";

      saveAuth({
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        user: this.user,
      });
    },

    logout() {
      clearAuth();
      this.status = "guest";
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.error = null;
    },
  },
});
