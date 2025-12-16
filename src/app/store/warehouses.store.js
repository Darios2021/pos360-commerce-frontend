// src/app/store/warehouses.store.js
import { defineStore } from "pinia";
import { WarehousesService } from "../services/warehouses.service";

export const useWarehousesStore = defineStore("warehouses", {
  state: () => ({
    items: [],
    loading: false,
    error: null,
  }),

  getters: {
    branches(state) {
      // derive branches from warehouses to avoid /branches 502
      const map = new Map();
      for (const w of state.items) {
        const b = w.branch;
        if (b?.id && !map.has(b.id)) map.set(b.id, b);
      }
      return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    },
  },

  actions: {
    async fetch() {
      this.loading = true;
      this.error = null;
      try {
        const data = await WarehousesService.list();
        this.items = data.items || [];
      } catch (e) {
        this.error = e.friendlyMessage || e.message;
      } finally {
        this.loading = false;
      }
    },
  },
});
