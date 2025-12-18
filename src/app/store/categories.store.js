// src/app/store/categories.store.js
import { defineStore } from "pinia";
import { CategoriesService } from "../services/categories.service";

export const useCategoriesStore = defineStore("categories", {
  state: () => ({
    items: [],
    loading: false,
    error: null,
    loaded: false,
  }),

  actions: {
    async fetchAll(force = false) {
      if (this.loaded && !force) return;

      this.loading = true;
      this.error = null;
      try {
        const resp = await CategoriesService.list();
        if (!resp?.ok) throw new Error(resp?.message || "Error listando categorías");
        this.items = resp.items || [];
        this.loaded = true;
      } catch (e) {
        this.error = e?.friendlyMessage || e?.message || String(e);
      } finally {
        this.loading = false;
      }
    },

    async create(payload) {
      this.loading = true;
      this.error = null;
      try {
        const resp = await CategoriesService.create(payload);
        if (!resp?.ok) throw new Error(resp?.message || "Error creando categoría");
        await this.fetchAll(true);
        return resp.item;
      } catch (e) {
        this.error = e?.friendlyMessage || e?.message || String(e);
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async update(id, payload) {
      this.loading = true;
      this.error = null;
      try {
        const resp = await CategoriesService.update(id, payload);
        if (!resp?.ok) throw new Error(resp?.message || "Error actualizando categoría");
        await this.fetchAll(true);
        return resp.item;
      } catch (e) {
        this.error = e?.friendlyMessage || e?.message || String(e);
        throw e;
      } finally {
        this.loading = false;
      }
    },
  },
});
