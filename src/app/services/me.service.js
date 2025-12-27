// src/app/services/me.service.js
import http from "../api/http";
import { loadAuth } from "../utils/storage";

function roleLabelFromRoles(roles) {
  const r = Array.isArray(roles) ? roles : [];
  if (r.includes("super_admin")) return "Super Admin";
  if (r.includes("admin")) return "Administrador";
  if (r.includes("manager")) return "Supervisor";
  if (r.includes("seller")) return "Vendedor";
  return r[0] || "Usuario";
}

// ✅ Fallback (sin backend): arma "me" desde storage/auth
function getMeFallback() {
  const auth = loadAuth() || {};
  const u = auth.user || auth.profile || {};

  const roles = auth.roles || u.roles || [];
  const first_name = u.first_name ?? u.firstName ?? u.name ?? "";
  const last_name = u.last_name ?? u.lastName ?? u.lastname ?? "";

  return {
    id: u.id ?? auth.userId ?? null,
    email: u.email ?? auth.email ?? "",
    username: u.username ?? auth.username ?? "",
    first_name,
    last_name,
    avatar_url: u.avatar_url ?? u.avatarUrl ?? "",
    roles,
    role_label: roleLabelFromRoles(roles),
  };
}

export const MeService = {
  async getMe() {
    // Si existe backend, lo usa. Si no, fallback sin romper.
    try {
      const { data } = await http.get("/me");
      return data; // esperado: { data: {...} }
    } catch {
      return { data: getMeFallback() };
    }
  },

  async updateMe(payload) {
    // backend si existe, sino fallback local (sin persistencia real)
    try {
      const { data } = await http.patch("/me", payload);
      return data;
    } catch (err) {
      // Sin backend: devolvemos lo mismo actualizado en memoria del fallback
      const cur = getMeFallback();
      return {
        data: {
          ...cur,
          first_name: payload?.first_name ?? cur.first_name,
          last_name: payload?.last_name ?? cur.last_name,
        },
      };
    }
  },

  async uploadAvatar(file) {
    // backend si existe, sino preview local
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await http.post("/me/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch {
      const cur = getMeFallback();
      const url = URL.createObjectURL(file);
      return { data: { ...cur, avatar_url: url } };
    }
  },

  async changePassword(payload) {
    // Sin backend: error claro
    try {
      const { data } = await http.post("/me/password", payload);
      return data;
    } catch (err) {
      const msg =
        err?.friendlyMessage ||
        err?.message ||
        "Todavía no está implementado el backend para cambiar contraseña.";
      throw new Error(msg);
    }
  },
};
