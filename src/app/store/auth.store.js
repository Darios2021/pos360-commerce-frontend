// ✅ COPY-PASTE FINAL COMPLETO
// src/app/store/auth.store.js
import { defineStore } from "pinia";
import http from "../api/http";
import { loadAuth, saveAuth, clearAuth } from "../utils/storage";

// ✅ para hidratar avatar (y datos completos) post-login
import { MeService } from "../services/me.service";

const AUTH_DEBUG =
  String(import.meta?.env?.VITE_AUTH_DEBUG ?? "").toLowerCase() === "true" ||
  import.meta?.env?.DEV;

function adbg(...args) {
  if (!AUTH_DEBUG) return;
  console.log("[AUTH]", ...args);
}

/* ============================================================
   TOKEN SYNC (Admin compat)
============================================================ */
function syncLegacyTokenKeys(accessToken) {
  const t = String(accessToken || "").trim();
  if (!t) return;

  try {
    localStorage.setItem("token", t);
    localStorage.setItem("access_token", t);
    localStorage.setItem("jwt", t);
    localStorage.setItem("auth_token", t);
  } catch {}
}

function clearLegacyTokenKeys() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("jwt");
    localStorage.removeItem("auth_token");
  } catch {}
}

/* ============================================================
   ROLES
============================================================ */
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

  if (roles.includes("admin") && !roles.includes("user")) {
    roles.push("user");
  }

  return roles;
}

/* ============================================================
   BRANCHES (FIX REAL)
============================================================ */
function normalizeBranches(raw) {
  let branches = Array.isArray(raw) ? raw : [];

  // [1,2,3]
  if (branches.length && typeof branches[0] !== "object") {
    branches = branches
      .map((x) => Number(x || 0) || null)
      .filter(Boolean)
      .map((id) => ({ id, name: `Sucursal #${id}` }));
  } else {
    // [{id,name}] o variantes
    branches = branches
      .map((b) => ({
        id: Number(b?.id || b?.branch_id || b?.branchId || 0) || null,
        name: String(b?.name || b?.title || b?.label || "").trim() || null,
      }))
      .filter((b) => b.id)
      .map((b) => ({ id: b.id, name: b.name || `Sucursal #${b.id}` }));
  }

  const map = new Map();
  for (const b of branches) map.set(b.id, b);

  return Array.from(map.values());
}

/* ============================================================
   AVATAR
============================================================ */
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

/* ============================================================
   MERGE USER (PROTEGE AVATAR + BRANCHES)
============================================================ */
function mergeUser(prev, next) {
  const p = prev || {};
  const n = next || {};

  const prevAvatar = pickAvatar(p);
  const nextAvatar = pickAvatar(n);

  const prevBranches = normalizeBranches(p?.branches);
  const nextBranches = normalizeBranches(n?.branches);

  const merged = { ...p, ...n };

  // Avatar
  if (!nextAvatar && prevAvatar) {
    merged.avatar_url = prevAvatar;
  }

  // Branches (NO se pisan si vienen vacías en fetchMe)
  if (nextBranches.length) {
    merged.branches = nextBranches;
  } else if (prevBranches.length) {
    merged.branches = prevBranches;
  } else {
    merged.branches = [];
  }

  // Roles normalizados
  merged.roles = normalizeRoles(merged);

  return merged;
}

/* ============================================================
   STORE
============================================================ */
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
    branches: (s) => normalizeBranches(s.user?.branches),
    roles: (s) => normalizeRoles(s.user),
    isAdmin: (s) => normalizeRoles(s.user).includes("admin"),
  },

  actions: {
    hydrate() {
      const saved = loadAuth();

      if (saved?.accessToken) {
        this.accessToken = saved.accessToken;
        this.refreshToken = saved.refreshToken || null;
        this.user = mergeUser(null, saved.user || {});
        this.status = "authed";

        syncLegacyTokenKeys(this.accessToken);

        adbg("hydrate", {
          email: this.user?.email,
          branch_id: this.user?.branch_id,
          branches_len: this.branches.length,
        });
      } else {
        this.status = "guest";
      }
    },

    setUser(user) {
      this.user = mergeUser(this.user, user);

      saveAuth({
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        user: this.user,
      });

      syncLegacyTokenKeys(this.accessToken);

      adbg("setUser", {
        email: this.user?.email,
        branches_len: this.branches.length,
      });
    },

    async fetchMe() {
      if (!this.accessToken) return;

      try {
        const { data } = await http.get("/auth/me");
        const u = data?.user || data?.data?.user || null;
        if (!u) return;

        adbg("fetchMe raw branches", u?.branches);

        this.setUser(u);
        this.status = "authed";
      } catch (e) {
        this.error = e?.response?.data?.message || e?.message || "FETCH_ME_FAILED";
        adbg("fetchMe ERROR", this.error);
      }
    },

    // ✅ NUEVO: hidrata "me" (incluye avatar_url) al loguear
    async hydrateMeAfterLogin() {
      try {
        const r = await MeService.getMe();
        const me = r?.data?.data || r?.data || {};
        if (!me || typeof me !== "object") return;

        // merge seguro (protege branches + avatar)
        this.setUser(me);

        adbg("hydrateMeAfterLogin OK", {
          email: this.user?.email,
          avatar: pickAvatar(this.user),
        });
      } catch (e) {
        // no rompe login
        adbg("hydrateMeAfterLogin FAIL (ignored)", e?.message || e);
      }
    },

    async login({ identifier, password }) {
      this.error = null;

      const { data } = await http.post("/auth/login", {
        identifier,
        password,
      });

      if (!data?.ok) throw new Error(data?.message || "LOGIN_FAILED");

      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken || null;
      this.user = mergeUser(null, data.user || {});
      this.status = "authed";

      syncLegacyTokenKeys(this.accessToken);

      saveAuth({
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        user: this.user,
      });

      adbg("login OK", {
        email: this.user?.email,
        branches_len: this.branches.length,
      });

      // ✅ FIX: al iniciar sesión, traer /me real (avatar_url) y persistir
      await this.hydrateMeAfterLogin();

      // ✅ mantener tu fetchMe (admin compat) sin romper nada
      await this.fetchMe();
    },

    logout() {
      clearAuth();
      clearLegacyTokenKeys();

      this.status = "guest";
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.error = null;

      adbg("logout");
    },

    hardResetAuth() {
      clearAuth();
      clearLegacyTokenKeys();

      this.status = "guest";
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.error = null;

      adbg("hardResetAuth");
    },
  },
});