// src/app/store/products.store.js
import { defineStore } from "pinia";
import http from "../api/http";

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

// ✅ Unwrap helpers (soporta distintos formatos backend)
function unwrapOne(res) {
  // soporta: {ok, data}, {ok, item}, {ok, product}, {data:{...}} etc.
  if (!res) return null;
  if (res.ok === false) return null;
  return res.data ?? res.item ?? res.product ?? res.user ?? null;
}

function unwrapList(res) {
  // soporta: {ok, data:[...]}, {ok, items:[...]}, {items:[...]}, {data:{items:[...]}}
  if (!res) return [];
  if (res.ok === false) return [];
  const v = res.data ?? res.items ?? res.list ?? res.rows ?? res.result ?? null;
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.items)) return v.items;
  return [];
}

function unwrapMeta(res) {
  // soporta: {meta}, {data:{meta}}, {pagination}
  if (!res) return {};
  return res.meta ?? res.pagination ?? res.data?.meta ?? {};
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
      this.error = e?.response?.data?.message || e?.friendlyMessage || e?.message || String(e || "");
    },

    // ✅ GET /products
    async fetchList({ q = "", page = 1, limit = 20 } = {}) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await http.get("/products", { params: { q, page, limit } });

        const list = unwrapList(data);
        const meta = unwrapMeta(data);

        // si tu backend manda total/pages
        this.items = list;
        this.total = toInt(meta.total, list.length || 0);
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

    // ✅ GET /products/:id
    async fetchOne(id, { force = false } = {}) {
      const pid = toInt(id, 0);
      if (!pid) return null;

      if (!force && this.current?.id === pid) return this.current;

      this.loading = true;
      this.error = null;
      try {
        const { data } = await http.get(`/products/${pid}`);
        const one = unwrapOne(data);

        this.current = one || null;

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

    // ✅ POST /products
    async create(payload) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await http.post("/products", payload);

        const created = unwrapOne(data);
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

    // ✅ PATCH /products/:id
    async update(id, payload) {
      const pid = toInt(id, 0);
      if (!pid) throw new Error("MISSING_ID");

      this.loading = true;
      this.error = null;
      try {
        const { data } = await http.patch(`/products/${pid}`, payload);

        const updated = unwrapOne(data);
        this.current = updated || null;

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

    // ✅ DELETE /products/:id
    async remove(id) {
      const pid = toInt(id, 0);
      if (!pid) return false;

      this.loading = true;
      this.error = null;
      try {
        const { data } = await http.delete(`/products/${pid}`);
        if (data?.ok === false) throw new Error(data?.message || "DELETE_PRODUCT_FAILED");

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
    async fetchImages(productId) {
      const pid = toInt(productId, 0);
      if (!pid) return [];

      this.error = null;
      try {
        const { data } = await http.get(`/products/${pid}/images`);
        // soporta {ok, items} o {ok, data:[...]}
        return unwrapList(data);
      } catch (e) {
        this.setError(e);
        return [];
      }
    },

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

        if (data?.ok === false) throw new Error(data?.message || "UPLOAD_IMAGES_FAILED");
        return unwrapList(data);
      } catch (e) {
        this.setError(e);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async removeImage(productId, imageId) {
      const pid = toInt(productId, 0);
      const iid = toInt(imageId, 0);
      if (!pid || !iid) return false;

      this.loading = true;
      this.error = null;
      try {
        const { data } = await http.delete(`/products/${pid}/images/${iid}`);
        if (data?.ok === false) throw new Error(data?.message || "DELETE_IMAGE_FAILED");
        return true;
      } catch (e) {
        this.setError(e);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // ==========================
    // BRANCHES (para stock en admin)
    // ==========================
    async fetchBranches() {
      this.error = null;
      try {
        const { data } = await http.get("/branches");
        // soporta {ok, items} o {ok, data:[...]}
        return unwrapList(data);
      } catch (e) {
        this.setError(e);
        return [];
      }
    },

    // ==========================
    // STOCK INIT (POST /stock/init)
    // ==========================
    async initStock({ product_id, branch_id, qty }) {
      this.loading = true;
      this.error = null;
      try {
        const payload = {
          product_id: toInt(product_id, 0),
          branch_id: toInt(branch_id, 0),
          qty: Number(qty || 0),
        };

        const { data } = await http.post("/stock/init", payload);
        if (data?.ok === false) throw new Error(data?.message || "INIT_STOCK_FAILED");
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
