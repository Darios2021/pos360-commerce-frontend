// src/app/store/products.store.js
import { defineStore } from "pinia";
import { ProductsService } from "../services/products.service";

export const useProductsStore = defineStore("products", {
  state: () => ({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    q: "",
    loading: false,
    error: null,
  }),

  actions: {
    async fetch({ page = 1, limit = this.limit, q = this.q } = {}) {
      this.loading = true;
      this.error = null;
      try {
        const data = await ProductsService.list({ page, limit, q });
        this.items = data.items || [];
        this.total = data.total || 0;
        this.page = data.page || page;
        this.limit = data.limit || limit;
        this.q = q || "";
      } catch (e) {
        this.error = e.friendlyMessage || e.message;
      } finally {
        this.loading = false;
      }
    },

    async create(payload) {
      this.loading = true;
      this.error = null;
      try {
        await ProductsService.create(payload);
        await this.fetch({ page: 1, q: this.q });
      } catch (e) {
        this.error = e.friendlyMessage || e.message;
      } finally {
        this.loading = false;
      }
    },

    async update(id, payload) {
      this.loading = true;
      this.error = null;
      try {
        await ProductsService.update(id, payload);
        await this.fetch({ page: this.page, q: this.q });
      } catch (e) {
        this.error = e.friendlyMessage || e.message;
      } finally {
        this.loading = false;
      }
    },
  },
});
