// src/app/store/auth.store.js
import { defineStore } from "pinia";
import http from "../api/http";
import { loadAuth, saveAuth, clearAuth } from "../utils/storage";

const AUTH_DEBUG =
  String(import.meta?.env?.VITE_AUTH_DEBUG ?? "").toLowerCase() === "true" ||
  import.meta?.env?.DEV;

function adbg(...args) {
  if (!AUTH_DEBUG) return;
  // eslint-disable-next-line no-console
  console.log("[AUTH]", ...args);
}

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

  // admin siempre incluye user
  if (roles.includes("admin") && !roles.includes("user")) roles.push("user");
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
        adbg("hydrate", { branch_id: this.user?.branch_id, email: this.user?.email, roles: normalizeRoles(this.user) });
      } else {
        this.status = "guest";
        adbg("hydrate guest");
      }
    },

    async fetchMe() {
      if (!this.accessToken) return;

      try {
        const { data } = await http.get("/auth/me");

        adbg("GET /auth/me raw", data);

        if (data?.ok && data.user) {
          this.user = {
            ...data.user,
            roles: normalizeRoles(data.user),
          };

          adbg("fetchMe -> user", {
            id: this.user?.id,
            email: this.user?.email,
            branch_id: this.user?.branch_id,
            roles: this.user?.roles,
          });

          saveAuth({
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            user: this.user,
          });
        }
      } catch (e) {
        this.error = e?.response?.data?.message || e?.message || "FETCH_ME_FAILED";
        adbg("fetchMe ERROR", { status: e?.response?.status, data: e?.response?.data, msg: this.error });
      }
    },

    async login({ identifier, password }) {
      this.error = null;

      const { data } = await http.post("/auth/login", { identifier, password });

      adbg("POST /auth/login raw", data);

      if (!data?.ok) throw new Error(data?.message || "LOGIN_FAILED");

      const normalizedUser = {
        ...data.user,
        roles: normalizeRoles(data.user),
      };

      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken || null;
      this.user = normalizedUser;
      this.status = "authed";

      adbg("login -> user", {
        id: this.user?.id,
        email: this.user?.email,
        branch_id: this.user?.branch_id,
        roles: this.user?.roles,
      });

      saveAuth({
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        user: this.user,
      });

      await this.fetchMe();
    },

    logout() {
      clearAuth();
      this.status = "guest";
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.error = null;
      adbg("logout");
    },

    // 🔥 útil para testeo: fuerza limpiar todo y rehidratar
    hardResetAuth() {
      clearAuth();
      this.status = "guest";
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.error = null;
      adbg("hardResetAuth (cleared storage)");
    },
  },
});
