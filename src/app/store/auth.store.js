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
// Detecta si un name viene del fallback "Sucursal #N" (no es real).
function isPlaceholderBranchName(name, id) {
  if (!name) return true;
  return String(name).trim() === `Sucursal #${id}`;
}

// Mezcla dos listas de branches: misma id ⇒ mismo objeto, pero preferimos
// el que tenga un name REAL sobre el placeholder. Así el refresco desde /me
// (que puede devolver names null si la query falla) no pisa los nombres
// que ya teníamos cacheados desde el login.
function mergeBranchLists(prevList, nextList) {
  const out = new Map();
  for (const b of prevList || []) if (b?.id) out.set(b.id, b);

  for (const b of nextList || []) {
    if (!b?.id) continue;
    const existing = out.get(b.id);
    if (!existing) {
      out.set(b.id, b);
      continue;
    }
    // Si el next tiene un name real y el existing es placeholder, lo pisamos.
    // Si ambos son reales, gana el next (es más fresco).
    // Si el next es placeholder y el existing es real, mantenemos el existing.
    const existingPlaceholder = isPlaceholderBranchName(existing.name, existing.id);
    const nextPlaceholder = isPlaceholderBranchName(b.name, b.id);
    if (existingPlaceholder && !nextPlaceholder) out.set(b.id, b);
    else if (!existingPlaceholder && nextPlaceholder) {
      // mantener existing
    } else {
      out.set(b.id, b);
    }
  }
  return Array.from(out.values());
}

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

  // Branches: combinamos prev + next preservando los nombres reales.
  // Antes el next con name=null reemplazaba al prev con name="Rivadavia"
  // y el chip de scope mostraba "Sucursal #3" — ahora se mantiene "Rivadavia".
  if (nextBranches.length || prevBranches.length) {
    merged.branches = mergeBranchLists(prevBranches, nextBranches);
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

    // ÁMBITOS DE ROLES (alineados al backend src/utils/accessScope.js)
    //   - super_admin / superadmin / root / owner: ven TODO el sistema.
    //   - admin: ven y administran TODA su sucursal.
    //   - cajero / cashier / vendedor / seller (o sin rol): ven SOLO lo suyo.
    isSuperAdmin: (s) => {
      const roles = normalizeRoles(s.user);
      return roles.some((r) => ["super_admin", "superadmin", "root", "owner"].includes(r));
    },
    isBranchAdmin: (s) => {
      const roles = normalizeRoles(s.user);
      // Cualquier admin (incluido super) tiene poder de admin sobre su sucursal.
      return roles.some((r) =>
        ["admin", "super_admin", "superadmin", "root", "owner"].includes(r)
      );
    },
    isCajero: (s) => {
      const roles = normalizeRoles(s.user);
      const isAdminLike = roles.some((r) =>
        ["admin", "super_admin", "superadmin", "root", "owner"].includes(r)
      );
      if (isAdminLike) return false;
      const cajeroRoles = ["cajero", "cashier", "vendedor", "seller"];
      if (roles.some((r) => cajeroRoles.includes(r))) return true;
      return roles.length === 0; // sin roles claros → tratamos como cajero
    },

    // LEGACY: `isAdmin` se mantiene por compatibilidad con el código existente.
    // Indica "puede actuar como admin" (super_admin O admin de sucursal).
    isAdmin: (s) => {
      const roles = normalizeRoles(s.user);
      return roles.some((r) => ["admin", "super_admin", "superadmin", "root", "owner"].includes(r));
    },
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

        // ✅ IMPORTANTE: refrescar roles/branches desde la DB en cada hydrate.
        // Sin esto, el localStorage (cacheado al loguear) podía mantener
        // privilegios viejos cuando un admin le revocaba un rol al usuario.
        // No bloqueamos la UI: si falla, queda con lo cacheado.
        this.hydrateMeAfterLogin?.().catch(() => {});
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