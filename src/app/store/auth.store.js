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
 * ✅ CLAVE DEL FIX:
 * Tu Admin (useShopOrdersApi) busca el token en:
 * - localStorage.token / access_token / jwt / auth_token
 *
 * Este store guardaba en storage "saveAuth()", pero NO garantizaba localStorage.token.
 * Entonces: sync para que SIEMPRE exista localStorage.token cuando haya sesión.
 */
function syncLegacyTokenKeys(accessToken) {
  const t = String(accessToken || "").trim();
  if (!t) return;

  try {
    localStorage.setItem("token", t);        // ✅ principal (Admin lo usa)
    localStorage.setItem("access_token", t); // compat
    localStorage.setItem("jwt", t);          // compat
    localStorage.setItem("auth_token", t);   // compat
  } catch {
    // noop
  }
}

function clearLegacyTokenKeys() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("jwt");
    localStorage.removeItem("auth_token");
  } catch {
    // noop
  }
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

// ----------
// Avatar helpers
// ----------
function pickAvatar(u) {
  if (!u) return "";
  return (
    u.avatar_url ||
    u.avatarUrl ||
    u.avatar ||
    u.photo_url ||
    u.image_url ||
    u.picture ||
    ""
  );
}

/**
 * ✅ MERGE: si el user nuevo NO trae avatar, conservar el actual
 */
function mergeUserKeepAvatar(prev, next) {
  const p = prev || {};
  const n = next || {};

  const prevAvatar = pickAvatar(p);
  const nextAvatar = pickAvatar(n);

  const merged = { ...p, ...n };

  // si el nuevo no trae avatar, no lo pises
  if (!nextAvatar && prevAvatar) {
    // guardamos en avatar_url para estandarizar
    merged.avatar_url = prevAvatar;
  }

  // roles siempre normalizados
  merged.roles = normalizeRoles(merged);
  return merged;
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

        // ✅ conserva avatar del storage y normaliza roles
        const savedUser = saved.user || null;
        this.user = savedUser ? mergeUserKeepAvatar(null, savedUser) : null;

        this.status = "authed";

        // ✅ IMPORTANTÍSIMO: deja token en localStorage.token (para Admin)
        syncLegacyTokenKeys(this.accessToken);

        adbg("hydrate", {
          branch_id: this.user?.branch_id,
          email: this.user?.email,
          roles: normalizeRoles(this.user),
          avatar: pickAvatar(this.user),
        });
      } else {
        this.status = "guest";
        adbg("hydrate guest");
      }
    },

    /**
     * ✅ setUser persistente
     * y NO pisa avatar si viene vacío
     */
    setUser(user) {
      this.user = mergeUserKeepAvatar(this.user, user);

      saveAuth({
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        user: this.user,
      });

      // ✅ por las dudas, mantener token keys (si el user cambia no debería, pero ok)
      syncLegacyTokenKeys(this.accessToken);

      adbg("setUser", {
        id: this.user?.id,
        email: this.user?.email,
        roles: this.user?.roles,
        avatar: pickAvatar(this.user),
      });
    },

    /**
     * ✅ helper por si tu endpoint devuelve solo la url
     */
    setAvatar(avatar_url) {
      const next = { ...(this.user || {}), avatar_url };
      this.setUser(next);
      adbg("setAvatar", { avatar_url });
    },

    async fetchMe() {
      if (!this.accessToken) return;

      try {
        const { data } = await http.get("/auth/me");
        adbg("GET /auth/me raw", data);

        // soporta: { ok:true, user:{...} } o { user:{...} }
        const u = data?.user || data?.data?.user || null;
        if (!u) return;

        // ✅ MERGE (no pises avatar si /auth/me no lo manda)
        this.setUser(u);
        this.status = "authed";

        // ✅ reafirma keys
        syncLegacyTokenKeys(this.accessToken);
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

      const normalizedUser = mergeUserKeepAvatar(null, data.user);

      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken || null;
      this.user = normalizedUser;
      this.status = "authed";

      // ✅ CLAVE: el Admin lee localStorage.token
      syncLegacyTokenKeys(this.accessToken);

      adbg("login -> user", {
        id: this.user?.id,
        email: this.user?.email,
        branch_id: this.user?.branch_id,
        roles: this.user?.roles,
        avatar: pickAvatar(this.user),
      });

      saveAuth({
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        user: this.user,
      });

      // si /auth/me no trae avatar, NO lo borra gracias al merge
      await this.fetchMe();
    },

    logout() {
      clearAuth();
      clearLegacyTokenKeys(); // ✅ limpia token compat del admin
      this.status = "guest";
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.error = null;
      adbg("logout");
    },

    hardResetAuth() {
      clearAuth();
      clearLegacyTokenKeys(); // ✅
      this.status = "guest";
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.error = null;
      adbg("hardResetAuth (cleared storage)");
    },
  },
});
