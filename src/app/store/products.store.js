// src/app/store/products.store.js
import { defineStore } from "pinia";
import { ProductsService } from "../services/products.service";

export const useProductsStore = defineStore("products", {
  state: () => ({
    items: [],
    loading: false,
    error: null,

    page: 1,
    limit: 20,
    total: 0,

    byId: {}, // cache: id -> product completo
  }),

  actions: {
    async fetchList({ q = "", page = 1, limit = 20 } = {}) {
      this.loading = true;
      this.error = null;

      try {
        const resp = await ProductsService.list({ q, page, limit });
        if (!resp?.ok) throw new Error(resp?.message || "Error listando productos");

        this.items = resp.items || [];
        this.page = resp.page || page;
        this.limit = resp.limit || limit;
        this.total = resp.total || 0;

        // cacheo rápido
        for (const p of this.items) {
          if (p?.id) this.byId[p.id] = p;
        }
      } catch (e) {
        this.error = e?.friendlyMessage || e?.message || String(e);
      } finally {
        this.loading = false;
      }
    },

    async fetchOne(id, { force = false } = {}) {
      const pid = Number(id);
      if (!pid) return null;

      if (!force && this.byId[pid] && this.byId[pid].category) {
        // si ya tengo el completo con category (o te sirve lo cacheado) retorno
        return this.byId[pid];
      }

      this.loading = true;
      this.error = null;
      try {
        const resp = await ProductsService.getOne(pid);
        if (!resp?.ok) throw new Error(resp?.message || "Error trayendo producto");

        const item = resp.item || null;
        if (item?.id) this.byId[item.id] = item;
        return item;
      } catch (e) {
        this.error = e?.friendlyMessage || e?.message || String(e);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async create(payload) {
      this.loading = true;
      this.error = null;
      try {
        const resp = await ProductsService.create(payload);
        if (!resp?.ok) throw new Error(resp?.message || "Error creando producto");
        const item = resp.item;
        if (item?.id) this.byId[item.id] = item;
        return item;
      } catch (e) {
        this.error = e?.friendlyMessage || e?.message || String(e);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async update(id, payload) {
      const pid = Number(id);
      this.loading = true;
      this.error = null;
      try {
        const resp = await ProductsService.update(pid, payload);
        if (!resp?.ok) throw new Error(resp?.message || "Error actualizando producto");
        const item = resp.item;
        if (item?.id) this.byId[item.id] = item;
        return item;
      } catch (e) {
        this.error = e?.friendlyMessage || e?.message || String(e);
        return null;
      } finally {
        this.loading = false;
      }
    },
  },
});
