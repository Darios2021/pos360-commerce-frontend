import { defineStore } from "pinia";
import { http } from "../api/http";
import { loadAuth, saveAuth, clearAuth } from "../utils/storage";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    status: "idle", // idle | loading | authenticated | guest
    error: null,
  }),

  getters: {
    isAuthed: (s) => !!s.accessToken,
    roles: (s) => s.user?.roles || [],
    isSuperAdmin: (s) => (s.user?.roles || []).includes("super_admin"),
  },

  actions: {
    hydrate() {
      const saved = loadAuth();
      if (!saved) {
        this.status = "guest";
        return;
      }
      this.user = saved.user;
      this.accessToken = saved.accessToken;
      this.refreshToken = saved.refreshToken;
      this.status = this.accessToken ? "authenticated" : "guest";
    },

    async login({ identifier, password }) {
      this.status = "loading";
      this.error = null;

      try {
        const { data } = await http.post("/auth/login", {
          identifier,
          password,
        });

        this.user = data.user;
        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken;

        saveAuth({
          user: this.user,
          accessToken: this.accessToken,
          refreshToken: this.refreshToken,
        });

        this.status = "authenticated";
        return data;
      } catch (e) {
        this.status = "guest";
        this.error = "Credenciales inválidas";
        throw e;
      }
    },

    async me() {
      const { data } = await http.get("/protected/me");

      this.user = {
        id: data.user.sub,
        email: data.user.email,
        username: data.user.username,
        roles: data.user.roles || [],
      };

      saveAuth({
        user: this.user,
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
      });

      return this.user;
    },

    logout() {
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.status = "guest";
      this.error = null;
      clearAuth();
    },
  },
});
