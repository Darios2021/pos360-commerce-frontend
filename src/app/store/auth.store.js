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
      this.user = saved.user || null;
      this.accessToken = saved.accessToken || null;
      this.refreshToken = saved.refreshToken || null;
      this.status = this.accessToken ? "authenticated" : "guest";
    },

    async login({ identifier, password }) {
      this.status = "loading";
      this.error = null;

      try {
        const { data } = await http.post("/auth/login", { identifier, password });

        // ✅ el backend ya devuelve user + tokens
        this.user = data.user || null;
        this.accessToken = data.accessToken || null;
        this.refreshToken = data.refreshToken || null;

        saveAuth({
          user: this.user,
          accessToken: this.accessToken,
          refreshToken: this.refreshToken,
        });

        this.status = this.accessToken ? "authenticated" : "guest";
        return data;
      } catch (e) {
        this.status = "guest";

        const status = e?.response?.status;
        if (status === 401) this.error = "Credenciales inválidas";
        else if (status === 403) this.error = "Usuario deshabilitado";
        else this.error = "Error de login";

        throw e;
      }
    },

    // ✅ No hay endpoint /protected/me en tu backend.
    // Esta función ahora solo valida que exista token y devuelve user cacheado.
    async me() {
      if (!this.accessToken) {
        throw new Error("No accessToken");
      }

      // si ya tenemos user, devolvemos.
      if (this.user) return this.user;

      // si no hay user pero hay token (caso raro), forzamos guest (o podrías decodificar JWT)
      this.status = "authenticated";
      return null;
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
