// src/app/store/products.store.js
import { defineStore } from "pinia";
import http from "../api/http";

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

export const useProductsStore = defineStore("products", {
  state: () => ({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    pages: 1,

    loading: false,
    error: null,

    current: null,
  }),

  actions: {
    setError(e) {
      this.error = e?.friendlyMessage || e?.message || String(e || "");
    },

    // ✅ Ajustado a backend: { ok, data, meta:{page,limit,total,pages} }
    async fetchList({ q = "", page = 1, limit = 20 } = {}) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await http.get("/products", { params: { q, page, limit } });

        if (!data?.ok) throw new Error(data?.message || "FETCH_PRODUCTS_FAILED");

        const list = data.data || [];
        const meta = data.meta || {};

        this.items = list;
        this.total = toInt(meta.total, 0);
        this.page = toInt(meta.page, page);
        this.limit = toInt(meta.limit, limit);
        this.pages = toInt(meta.pages, 1) || 1;

        return data;
      } catch (e) {
        this.setError(e);
        return null;
      } finally {
        this.loading = false;
      }
    },

    // ✅ Ajustado a backend: { ok, data: product }
    async fetchOne(id, { force = false } = {}) {
      const pid = toInt(id, 0);
      if (!pid) return null;

      if (!force && this.current?.id === pid) return this.current;

      this.loading = true;
      this.error = null;
      try {
        const { data } = await http.get(`/products/${pid}`);
        if (!data?.ok) throw new Error(data?.message || "FETCH_PRODUCT_FAILED");

        this.current = data.data || null;

        if (this.current?.id) {
          const idx = (this.items || []).findIndex((x) => toInt(x.id, 0) === pid);
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

    // ✅ create: backend devuelve { ok, data }
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
          this.total = toInt(this.total, 0) + 1;
        }

        return created;
      } catch (e) {
        this.setError(e);
        return null;
      } finally {
        this.loading = false;
      }
    },

    // ✅ update: backend devuelve { ok, data }
    async update(id, payload) {
      const pid = toInt(id, 0);
      if (!pid) throw new Error("MISSING_ID");

      this.loading = true;
      this.error = null;
      try {
        const { data } = await http.patch(`/products/${pid}`, payload);
        if (!data?.ok) throw new Error(data?.message || "UPDATE_PRODUCT_FAILED");

        const updated = data.data || null;
        this.current = updated;

        if (updated?.id) {
          const idx = (this.items || []).findIndex((x) => toInt(x.id, 0) === pid);
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

    // ✅ DELETE producto (si tu backend lo tiene)
    async remove(id) {
      const pid = toInt(id, 0);
      if (!pid) return false;

      this.loading = true;
      this.error = null;
      try {
        const { data } = await http.delete(`/products/${pid}`);
        if (!data?.ok) throw new Error(data?.message || "DELETE_PRODUCT_FAILED");

        this.items = (this.items || []).filter((x) => toInt(x.id, 0) !== pid);
        this.total = Math.max(0, toInt(this.total, 0) - 1);

        if (this.current?.id === pid) this.current = null;

        return true;
      } catch (e) {
        this.setError(e);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // ==========================
    // IMÁGENES
    // ==========================

    // GET /products/:id/images  => { ok, items }
    async fetchImages(productId) {
      const pid = toInt(productId, 0);
      if (!pid) return [];

      this.error = null;
      try {
        const { data } = await http.get(`/products/${pid}/images`);
        if (!data?.ok) throw new Error(data?.message || "FETCH_IMAGES_FAILED");
        return data.items || [];
      } catch (e) {
        this.setError(e);
        return [];
      }
    },

    // POST /products/:id/images (multipart) => { ok, items }
    async uploadImages(productId, files = []) {
      const pid = toInt(productId, 0);
      if (!pid) return null;

      const arr = Array.isArray(files) ? files : [files];
      if (!arr.length) return null;

      this.loading = true;
      this.error = null;
      try {
        const fd = new FormData();
        for (const f of arr) fd.append("files", f);

        const { data } = await http.post(`/products/${pid}/images`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (!data?.ok) throw new Error(data?.message || "UPLOAD_IMAGES_FAILED");
        return data.items || [];
      } catch (e) {
        this.setError(e);
        return null;
      } finally {
        this.loading = false;
      }
    },

    // DELETE /products/:id/images/:imageId => { ok }
    async removeImage(productId, imageId) {
      const pid = toInt(productId, 0);
      const iid = toInt(imageId, 0);
      if (!pid || !iid) return false;

      this.loading = true;
      this.error = null;
      try {
        const { data } = await http.delete(`/products/${pid}/images/${iid}`);
        if (!data?.ok) throw new Error(data?.message || "DELETE_IMAGE_FAILED");
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
