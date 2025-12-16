// src/app/store/categories.store.js
import { defineStore } from "pinia";
import { CategoriesService } from "../services/categories.service";

export const useCategoriesStore = defineStore("categories", {
  state: () => ({
    items: [],
    loading: false,
    error: null,
  }),

  getters: {
    activeItems(state) {
      return (state.items || []).filter((c) => c?.is_active === 1 || c?.is_active === true);
    },
  },

  actions: {
    async fetchAll() {
      this.loading = true;
      this.error = null;
      try {
        const res = await CategoriesService.list();
        this.items = res?.items || [];
      } catch (e) {
        this.error = e?.friendlyMessage || e?.message || "Network Error";
      } finally {
        this.loading = false;
      }
    },
  },
});
