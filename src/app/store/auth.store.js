// src/app/store/auth.store.js
import { defineStore } from "pinia";
import http from "../api/http";
import { loadAuth, saveAuth, clearAuth } from "../utils/storage";

/**
 * Normaliza roles desde cualquier formato posible:
 * - user.roles = ["admin"]
 * - user.role = "admin"
 * - user.rol = "admin"
 */
function normalizeRoles(user) {
  const raw =
    user?.roles ??
    (user?.role ? [user.role] : null) ??
    (user?.rol ? [user.rol] : null) ??
    [];

  const arr = Array.isArray(raw) ? raw : [raw];

  const roles = arr
    .map((r) => {
      if (!r) return null;
      if (typeof r === "string") return r.toLowerCase();
      if (typeof r === "object" && r.name) return String(r.name).toLowerCase();
      return null;
    })
    .filter(Boolean);

  // ✅ regla CLAVE:
  // admin siempre incluye permisos de user
  if (roles.includes("admin") && !roles.includes("user")) {
    roles.push("user");
  }

  return roles;
}

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

    // 👉 siempre roles normalizados
    roles: (s) => normalizeRoles(s.user),

    isAdmin: (s) => normalizeRoles(s.user).includes("admin"),
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
        const { data } = await http.get("/auth/me");

        if (data?.ok && data.user) {
          // ✅ normalizar roles SIEMPRE
          this.user = {
            ...data.user,
            roles: normalizeRoles(data.user),
          };

          saveAuth({
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            user: this.user,
          });
        }
      } catch (e) {
        this.error =
          e?.response?.data?.message ||
          e?.message ||
          "FETCH_ME_FAILED";
      }
    },

    async login({ identifier, password }) {
      this.error = null;

      const { data } = await http.post("/auth/login", {
        identifier,
        password,
      });

      if (!data?.ok) throw new Error(data?.message || "LOGIN_FAILED");

      // ✅ normalizar roles desde login
      const normalizedUser = {
        ...data.user,
        roles: normalizeRoles(data.user),
      };

      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken || null;
      this.user = normalizedUser;
      this.status = "authed";

      saveAuth({
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        user: this.user,
      });

      // refresca branch_id / estado real desde backend
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
