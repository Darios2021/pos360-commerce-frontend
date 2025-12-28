// src/app/store/users.store.js
import { defineStore } from "pinia";
import { UsersService } from "@/app/services/users.service";

export const useUsersStore = defineStore("usersAdmin", {
  state: () => ({
    items: [],
    meta: { roles: [], branches: [] },
    loading: false,
    saving: false,
    togglingId: null,
  }),

  actions: {
    async fetchMeta() {
      try {
        const m = await UsersService.meta();
        this.meta.roles = Array.isArray(m.roles) ? m.roles : [];
        this.meta.branches = Array.isArray(m.branches) ? m.branches : [];
      } catch (e) {
        // no rompe UI
        this.meta.roles = [];
        this.meta.branches = [];
        throw e;
      }
    },

    async fetchAll() {
      this.loading = true;
      try {
        const arr = await UsersService.list();
        this.items = Array.isArray(arr) ? arr : [];
      } finally {
        this.loading = false;
      }
    },

    async create(payload) {
      this.saving = true;
      try {
        await UsersService.create(payload);
        await this.fetchAll();
      } finally {
        this.saving = false;
      }
    },

    async update(id, payload) {
      this.saving = true;
      try {
        await UsersService.update(id, payload);
        await this.fetchAll();
      } finally {
        this.saving = false;
      }
    },

    async toggleActive(id) {
      this.togglingId = id;
      try {
        await UsersService.toggleActive(id);
        await this.fetchAll();
      } finally {
        this.togglingId = null;
      }
    },
  },
});