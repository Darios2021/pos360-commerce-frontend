// src/app/store/products.store.js
import { defineStore } from "pinia";
import http from "../api/http";

export const useProductsStore = defineStore("products", {
  state: () => ({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    pages: 1,

    loading: false,
    error: null,

    // usado por dialogs
    current: null,
  }),

  actions: {
    setError(e) {
      this.error = e?.friendlyMessage || e?.message || String(e || "");
    },

    // ✅ BACKEND: { ok:true, data:[...], meta:{page,limit,total,pages} }
    async fetchList({ q = "", page = 1, limit = 20 } = {}) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await http.get("/products", { params: { q, page, limit } });
        if (!data?.ok) throw new Error(data?.message || "FETCH_PRODUCTS_FAILED");

        this.items = Array.isArray(data.data) ? data.data : [];
        this.total = Number(data?.meta?.total ?? 0);
        this.page = Number(data?.meta?.page ?? page);
        this.limit = Number(data?.meta?.limit ?? limit);
        this.pages = Number(data?.meta?.pages ?? 1);

        return data;
      } catch (e) {
        this.setError(e);
        return null;
      } finally {
        this.loading = false;
      }
    },

    // ✅ BACKEND: { ok:true, data:{...} }
    async fetchOne(id, { force = false } = {}) {
      const pid = Number(id);
      if (!pid) return null;

      if (!force && this.current?.id === pid) return this.current;

      this.loading = true;
      this.error = null;
      try {
        const { data } = await http.get(`/products/${pid}`);
        if (!data?.ok) throw new Error(data?.message || "FETCH_PRODUCT_FAILED");

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

    // ✅ BACKEND: POST /products => { ok:true, data:{...} }
    async create(payload) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await http.post("/products", payload);
        if (!data?.ok) throw new Error(data?.message || "CREATE_PRODUCT_FAILED");

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

    // ✅ BACKEND: PATCH /products/:id => { ok:true, data:{...} }
    async update(id, payload) {
      const pid = Number(id);
      if (!pid) throw new Error("MISSING_ID");

      this.loading = true;
      this.error = null;
      try {
        const { data } = await http.patch(`/products/${pid}`, payload);
        if (!data?.ok) throw new Error(data?.message || "UPDATE_PRODUCT_FAILED");

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

    // ✅ BACKEND: DELETE /products/:id => { ok:true }
    async remove(id) {
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

    // =========================
    // IMÁGENES
    // =========================
    // ✅ GET /products/:id/images => { ok:true, items:[...] }
    async fetchImages(productId) {
      const pid = Number(productId);
      if (!pid) return [];

      try {
        const { data } = await http.get(`/products/${pid}/images`);
        if (!data?.ok) throw new Error(data?.message || "FETCH_IMAGES_FAILED");
        return Array.isArray(data.items) ? data.items : [];
      } catch (e) {
        this.setError(e);
        return [];
      }
    },

    // ✅ POST /products/:id/images (multipart) => { ok:true, items:[...] }
    async uploadImages(productId, files = []) {
      const pid = Number(productId);
      if (!pid) return [];

      const fd = new FormData();
      for (const f of files) fd.append("files", f);

      try {
        const { data } = await http.post(`/products/${pid}/images`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (!data?.ok) throw new Error(data?.message || "UPLOAD_IMAGES_FAILED");
        return Array.isArray(data.items) ? data.items : [];
      } catch (e) {
        this.setError(e);
        return [];
      }
    },

    // ✅ DELETE /products/:id/images/:imageId => { ok:true }
    async removeImage(productId, imageId) {
      const pid = Number(productId);
      const iid = Number(imageId);
      if (!pid || !iid) return false;

      try {
        const { data } = await http.delete(`/products/${pid}/images/${iid}`);
        if (!data?.ok) throw new Error(data?.message || "DELETE_IMAGE_FAILED");
        return true;
      } catch (e) {
        this.setError(e);
        return false;
      }
    },
  },
});
