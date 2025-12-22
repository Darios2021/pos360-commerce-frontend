// src/app/store/products.store.js
import { defineStore } from "pinia";
import http from "../api/http";

export const useProductsStore = defineStore("products", {
  state: () => ({
    items: [],
    total: 0,
    page: 1,
    limit: 20,

    loading: false,
    error: null,

    current: null,
  }),

  actions: {
    setError(e) {
      this.error = e?.friendlyMessage || e?.message || String(e || "");
    },

    async fetchList({ q = "", page = 1, limit = 20 } = {}) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await http.get("/products", { params: { q, page, limit } });
        if (!data?.ok) throw new Error(data?.message || "FETCH_PRODUCTS_FAILED");

        // ✅ tu backend responde { ok:true, data:[], meta:{} }
        this.items = data.data || [];
        this.total = Number(data.meta?.total || 0);
        this.page = Number(data.meta?.page || page);
        this.limit = Number(data.meta?.limit || limit);

        return data;
      } catch (e) {
        this.setError(e);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async fetchOne(id, { force = false } = {}) {
      const pid = Number(id);
      if (!pid) return null;
      if (!force && this.current?.id === pid) return this.current;

      this.loading = true;
      this.error = null;
      try {
        const { data } = await http.get(`/products/${pid}`);
        if (!data?.ok) throw new Error(data?.message || "FETCH_PRODUCT_FAILED");

        // ✅ backend: { ok:true, data:{...} }
        this.current = data.data || null;

        if (this.current?.id) {
          const idx = (this.items || []).findIndex((x) => Number(x.id) === pid);
          if (idx >= 0) this.items[idx] = this.current;
        }

        return this.current;
      } catch (e) {
        this.setError(e);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async create(payload) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await http.post("/products", payload);
        if (!data?.ok) throw new Error(data?.message || "CREATE_PRODUCT_FAILED");

        // ✅ backend: { ok:true, data:{...} }
        const created = data.data || null;

        if (created?.id) {
          this.current = created;
          this.items = [created, ...(this.items || [])];
          this.total = Number(this.total || 0) + 1;
        }
        return created;
      } catch (e) {
        this.setError(e);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async update(id, payload) {
      const pid = Number(id);
      if (!pid) throw new Error("MISSING_ID");

      this.loading = true;
      this.error = null;
      try {
        const { data } = await http.patch(`/products/${pid}`, payload);
        if (!data?.ok) throw new Error(data?.message || "UPDATE_PRODUCT_FAILED");

        // ✅ backend: { ok:true, data:{...} }
        const updated = data.data || null;
        this.current = updated;

        if (updated?.id) {
          const idx = (this.items || []).findIndex((x) => Number(x.id) === pid);
          if (idx >= 0) this.items[idx] = updated;
        }

        return updated;
      } catch (e) {
        this.setError(e);
        return null;
      } finally {
        this.loading = false;
      }
    },

    // ✅ DELETE
    async delete(id) {
      const pid = Number(id);
      if (!pid) throw new Error("MISSING_ID");

      this.loading = true;
      this.error = null;
      try {
        const { data } = await http.delete(`/products/${pid}`);
        if (!data?.ok) throw new Error(data?.message || "DELETE_PRODUCT_FAILED");

        // sacar de lista
        this.items = (this.items || []).filter((x) => Number(x.id) !== pid);
        this.total = Math.max(0, Number(this.total || 0) - 1);

        if (this.current?.id === pid) this.current = null;

        return true;
      } catch (e) {
        this.setError(e);
        return false;
      } finally {
        this.loading = false;
      }
    },
  },
});
