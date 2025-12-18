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
        const resp = await CategoriesService.list(); // { ok, items }
        if (!resp?.ok) throw new Error(resp?.message || "Error listando categorías");

        this.items = resp.items || [];
        this.loaded = true;
      } catch (e) {
        this.error = e?.friendlyMessage || e?.message || String(e);
        this.items = [];
        this.loaded = false;
      } finally {
        this.loading = false;
      }
    },

    invalidate() {
      this.loaded = false;
    },
  },
});
