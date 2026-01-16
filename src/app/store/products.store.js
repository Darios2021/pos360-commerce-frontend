// src/app/store/products.store.js
// ✅ COPY-PASTE FINAL COMPLETO (incluye fetchNextCode para preview barcode + errores robustos)

import { defineStore } from "pinia";
import http from "../api/http";

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

function toNum(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}

// ✅ Unwrap helpers (soporta distintos formatos backend)
function unwrapOne(res) {
  if (!res) return null;
  if (res.ok === false) return null;

  const v = res.data ?? res.item ?? res.product ?? res.user ?? res.result ?? null;

  // si data viene como {data:{...}}
  if (v && typeof v === "object" && !Array.isArray(v) && v.data && typeof v.data === "object") {
    return v.data;
  }

  return v;
}

function unwrapList(res) {
  if (!res) return [];
  if (res.ok === false) return [];

  const v = res.data ?? res.items ?? res.list ?? res.rows ?? res.result ?? null;
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.items)) return v.items;
  if (v && Array.isArray(v.rows)) return v.rows;
  return [];
}

function unwrapMeta(res) {
  if (!res) return {};
  return res.meta ?? res.pagination ?? res.data?.meta ?? {};
}

function unwrapOk(res) {
  if (!res) return { ok: false, code: "NO_RESPONSE", message: "Sin respuesta del servidor" };
  if (typeof res.ok === "boolean") {
    return { ok: res.ok, code: res.code || null, message: res.message || null, data: res.data ?? null };
  }
  return { ok: true, code: null, message: null, data: res.data ?? null };
}

function errorsArrayToMap(arr) {
  const out = {};
  const a = Array.isArray(arr) ? arr : [];
  for (const it of a) {
    const k = String(it?.field || it?.path || "").trim();
    const m = String(it?.message || "").trim();
    if (!k || !m) continue;
    if (!out[k]) out[k] = m;
  }
  return out;
}

function pickHttpError(e) {
  const status = e?.response?.status ?? null;
  const data = e?.response?.data ?? null;
  return { status, data };
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

    // ✅ preview code (P000000xxx)
    nextCode: null,

    // ✅ debug
    lastError: null,
    lastFieldErrors: null,
  }),

  actions: {
    setError(e) {
      const data = e?.response?.data || e?.raw || null;
      this.lastError = data || e || null;

      const errsArr = Array.isArray(data?.errors) ? data.errors : [];
      this.lastFieldErrors = errsArr.length ? errorsArrayToMap(errsArr) : null;

      this.error =
        data?.message ||
        data?.error ||
        e?.friendlyMessage ||
        e?.message ||
        String(e || "");
    },

    // ✅ GET /products/next-code (para preview de barcode en create)
    async fetchNextCode() {
      this.error = null;
      try {
        const { data } = await http.get("/products/next-code");

        // soporta {ok:true,data:{code}} o {data:{code}} o directo
        const one = unwrapOne(data) || data?.data || data || null;
        const code = one?.code || null;

        this.nextCode = code;
        return code;
      } catch (e) {
        // no rompas la UI por esto
        this.lastError = e?.response?.data || e || null;
        this.nextCode = null;
        return null;
      }
    },

    // ✅ GET /products
    async fetchList({ q = "", page = 1, limit = 20, branch_id = null } = {}) {
      this.loading = true;
      this.error = null;
      this.lastError = null;
      this.lastFieldErrors = null;

      try {
        const params = { q, page, limit };
        const bid = toInt(branch_id, 0);
        if (bid > 0) params.branch_id = bid;

        const { data } = await http.get("/products", { params });

        const list = unwrapList(data);
        const meta = unwrapMeta(data);

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
    async fetchOne(id, { force = false, branch_id = null } = {}) {
      const pid = toInt(id, 0);
      if (!pid) return null;

      if (!force && this.current?.id === pid) return this.current;

      this.loading = true;
      this.error = null;
      this.lastError = null;
      this.lastFieldErrors = null;

      try {
        const params = {};
        const bid = toInt(branch_id, 0);
        if (bid > 0) params.branch_id = bid;

        const { data } = await http.get(`/products/${pid}`, { params });
        const one = unwrapOne(data);

        this.current = one || null;

        if (one?.id) {
          const idx = (this.items || []).findIndex((x) => toInt(x.id, 0) === pid);
          if (idx >= 0) {
            const prev = this.items[idx] || {};
            const next = { ...prev, ...one };
            if (one.stock_qty == null && prev.stock_qty != null) next.stock_qty = prev.stock_qty;
            this.items[idx] = next;
          }
        }

        return this.current;
      } catch (e) {
        this.setError(e);
        return null;
      } finally {
        this.loading = false;
      }
    },

    // ✅ GET /products/:id/stock?branch_id=
    async fetchStockQty(productId, branch_id) {
      const pid = toInt(productId, 0);
      const bid = toInt(branch_id, 0);
      if (!pid || !bid) return 0;

      try {
        const { data } = await http.get(`/products/${pid}/stock`, { params: { branch_id: bid } });
        const obj = unwrapOne(data) || data?.data || data || null;
        return toNum(obj?.qty ?? obj?.stock_qty ?? obj?.current_qty ?? 0, 0);
      } catch {
        return 0;
      }
    },

    // ✅ GET /products/:id/branches
    async fetchBranchesMatrix(productId) {
      const pid = toInt(productId, 0);
      if (!pid) return [];

      this.error = null;

      try {
        const { data } = await http.get(`/products/${pid}/branches`);
        const list = unwrapList(data) || (Array.isArray(data?.data) ? data.data : []);
        return Array.isArray(list) ? list : [];
      } catch (e) {
        this.setError(e);
        return [];
      }
    },

    // ✅ PATCH /products/:id con branch_ids (admin)
    async enableBranches(productId, branchIds = []) {
      const pid = toInt(productId, 0);
      const bids = Array.isArray(branchIds) ? branchIds.map((x) => toInt(x, 0)).filter(Boolean) : [];
      if (!pid || !bids.length) return false;

      this.loading = true;
      this.error = null;
      this.lastError = null;
      this.lastFieldErrors = null;

      try {
        const { data } = await http.patch(`/products/${pid}`, { branch_ids: bids });
        const r = unwrapOk(data);
        if (r.ok === false) throw new Error(r.message || "ENABLE_BRANCHES_FAILED");
        return true;
      } catch (e) {
        this.setError(e);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // ✅ POST /products
    async create(payload) {
      this.loading = true;
      this.error = null;
      this.lastError = null;
      this.lastFieldErrors = null;

      try {
        const { data } = await http.post("/products", payload);

        const created = unwrapOne(data);
        if (created?.id) {
          this.current = created;

          // evitar duplicado en items si ya existe
          const pid = toInt(created.id, 0);
          const idx = (this.items || []).findIndex((x) => toInt(x.id, 0) === pid);
          if (idx >= 0) this.items[idx] = { ...this.items[idx], ...created };
          else this.items = [created, ...(this.items || [])];

          this.total = toInt(this.total, 0) + (idx >= 0 ? 0 : 1);
        }

        return data;
      } catch (e) {
        const { status, data } = pickHttpError(e);

        if (status === 409) {
          const msg =
            data?.code === "DUPLICATE"
              ? (data?.message || "Conflicto: SKU/Barcode/Code duplicado.")
              : (data?.message || "Conflicto.");

          this.setError({ response: { data: { ...data, message: msg } } });
          return null;
        }

        this.setError(e);
        return null;
      } finally {
        this.loading = false;
      }
    },

    // ✅ PATCH /products/:id
    async update(id, payload, { branch_id = null } = {}) {
      const pid = toInt(id, 0);
      if (!pid) throw new Error("MISSING_ID");

      this.loading = true;
      this.error = null;
      this.lastError = null;
      this.lastFieldErrors = null;

      try {
        const params = {};
        const bid = toInt(branch_id, 0);
        if (bid > 0) params.branch_id = bid;

        const { data } = await http.patch(`/products/${pid}`, payload, { params });

        const updated = unwrapOne(data);
        this.current = updated || null;

        if (updated?.id) {
          const idx = (this.items || []).findIndex((x) => toInt(x.id, 0) === pid);
          if (idx >= 0) {
            const prev = this.items[idx] || {};
            const next = { ...prev, ...updated };
            if (updated.stock_qty == null && prev.stock_qty != null) next.stock_qty = prev.stock_qty;
            this.items[idx] = next;
          }
        }

        return data;
      } catch (e) {
        this.setError(e);
        return null;
      } finally {
        this.loading = false;
      }
    },

    // ✅ DELETE /products/:id
    // NOTA: backend puede devolver:
    // - 200 ok true (borrado)
    // - 200 ok true code=SOFT_DELETED
    // - 409 ok false code=STOCK_NOT_ZERO
    async remove(id) {
      const pid = toInt(id, 0);
      if (!pid) return false;

      this.loading = true;
      this.error = null;
      this.lastError = null;
      this.lastFieldErrors = null;

      try {
        const { data } = await http.delete(`/products/${pid}`);
        const r = unwrapOk(data);

        if (r.ok === false) throw new Error(r.message || "DELETE_FAILED");

        // si fue soft delete, lo sacamos igual del listado (para UX)
        this.items = (this.items || []).filter((x) => toInt(x.id, 0) !== pid);
        this.total = Math.max(0, toInt(this.total, 0) - 1);
        if (toInt(this.current?.id, 0) === pid) this.current = null;

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
      this.lastError = null;
      this.lastFieldErrors = null;

      try {
        const fd = new FormData();
        for (const f of arr) fd.append("files", f);

        const { data } = await http.post(`/products/${pid}/images`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const r = unwrapOk(data);
        if (r.ok === false) throw new Error(r.message || "UPLOAD_IMAGES_FAILED");

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
      this.lastError = null;
      this.lastFieldErrors = null;

      try {
        const { data } = await http.delete(`/products/${pid}/images/${iid}`);
        const r = unwrapOk(data);
        if (r.ok === false) throw new Error(r.message || "DELETE_IMAGE_FAILED");
        return true;
      } catch (e) {
        this.setError(e);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // ==========================
    // BRANCHES
    // ==========================
    async fetchBranches() {
      this.error = null;
      try {
        const { data } = await http.get("/branches");
        return unwrapList(data);
      } catch (e) {
        this.setError(e);
        return [];
      }
    },

    // ==========================
    // STOCK INIT
    // ==========================
    async initStock({ product_id, branch_id, qty }) {
      this.loading = true;
      this.error = null;
      this.lastError = null;
      this.lastFieldErrors = null;

      const payload = {
        product_id: toInt(product_id, 0),
        branch_id: toInt(branch_id, 0),
        qty: Number(qty || 0),
      };

      try {
        const { data } = await http.post("/stock/init", payload);
        const r = unwrapOk(data);
        if (r.ok === false) throw new Error(r.message || "INIT_STOCK_FAILED");
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
