// src/app/store/users.store.js
import { defineStore } from "pinia";
import { UsersService } from "@/app/services/users.service";

function pickErr(e, fallback = "Error") {
  return (
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    e?.message ||
    fallback
  );
}

function toInt(v) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : null;
}

function normalizeIds(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => {
      if (typeof x === "number") return x;
      if (typeof x === "string") return toInt(x);
      return toInt(x?.id);
    })
    .filter(Boolean);
}

export const useUsersStore = defineStore("users", {
  state: () => ({
    items: [],
    loading: false,
    saving: false,
    togglingId: null,
    meta: {
      roles: [],
      branches: [],
      permissions: [],
      hasRolePermissionsPivot: false,
    },
  }),

  actions: {
    async fetchMeta() {
      this.loading = true;
      try {
        this.meta = await UsersService.meta();
        return this.meta;
      } finally {
        this.loading = false;
      }
    },

    async fetchAll() {
      this.loading = true;
      try {
        this.items = await UsersService.list();
        return this.items;
      } finally {
        this.loading = false;
      }
    },

    buildBody(payload) {
      const body = {
        email: String(payload?.email || "").trim(),
        username: String(payload?.username || "").trim(),
        password: payload?.password ? String(payload.password) : undefined,

        first_name: String(payload?.first_name ?? "").trim() || null,
        last_name: String(payload?.last_name ?? "").trim() || null,

        is_active:
          typeof payload?.is_active === "boolean" ? payload.is_active : true,

        role_ids: normalizeIds(payload?.role_ids ?? payload?.roles),
        branch_ids: normalizeIds(payload?.branch_ids ?? payload?.branches),
      };

      Object.keys(body).forEach(
        (k) => body[k] === undefined && delete body[k]
      );
      return body;
    },

    async create(payload) {
      this.saving = true;
      try {
        const body = this.buildBody(payload);
        await UsersService.create(body);
        await this.fetchAll();
      } catch (e) {
        throw new Error(pickErr(e, "Error creando usuario"));
      } finally {
        this.saving = false;
      }
    },

    async update(id, payload) {
      this.saving = true;
      try {
        const body = this.buildBody(payload);

        // En update NO obligamos email / username / password
        if (!body.email) delete body.email;
        if (!body.username) delete body.username;
        if (!body.password) delete body.password;

        await UsersService.update(id, body);
        await this.fetchAll();
      } catch (e) {
        throw new Error(pickErr(e, "Error actualizando usuario"));
      } finally {
        this.saving = false;
      }
    },

    async toggleActive(id) {
      this.togglingId = id;
      try {
        const u = this.items.find((x) => x.id === id);
        if (!u) throw new Error("Usuario no encontrado");

        await UsersService.update(id, { is_active: !u.is_active });

        const idx = this.items.findIndex((x) => x.id === id);
        if (idx >= 0) this.items[idx].is_active = !u.is_active;
      } catch (e) {
        throw new Error(pickErr(e, "Error cambiando estado"));
      } finally {
        this.togglingId = null;
      }
    },
  },
});
