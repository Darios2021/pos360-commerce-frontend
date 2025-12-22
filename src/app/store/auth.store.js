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
    branchId: (s) => Number(s.user?.branch_id || 0) || null,
    roles: (s) => (Array.isArray(s.user?.roles) ? s.user.roles : []),

    // ✅ helper directo
    isAdmin: (s) => Array.isArray(s.user?.roles) && s.user.roles.includes("admin"),
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

    async fetchMe() {
      if (!this.accessToken) return;

      try {
        // ✅ FIX: tu ruta real es /auth/me
        const { data } = await http.get("/auth/me");

        if (data?.ok && data.user) {
          this.user = data.user;

          saveAuth({
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            user: this.user,
          });
        }
      } catch (e) {
        // Si falla /me, no tiramos el login abajo, pero guardamos error para debug
        this.error = e?.response?.data?.message || e?.message || "FETCH_ME_FAILED";
      }
    },

    async login({ identifier, password }) {
      this.error = null;

      const { data } = await http.post("/auth/login", { identifier, password });
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

      // ✅ siempre refrescar "me" (branch_id, roles, etc.)
      await this.fetchMe();
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
