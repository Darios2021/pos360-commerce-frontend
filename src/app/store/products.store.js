// src/app/store/products.store.js
import { defineStore } from "pinia";
import http from "../api/http";

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

// ✅ Unwrap helpers (soporta distintos formatos backend)
function unwrapOne(res) {
  if (!res) return null;
  if (res.ok === false) return null;
  return res.data ?? res.item ?? res.product ?? res.user ?? null;
}

function unwrapList(res) {
  if (!res) return [];
  if (res.ok === false) return [];
  const v = res.data ?? res.items ?? res.list ?? res.rows ?? res.result ?? null;
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.items)) return v.items;
  return [];
}

function unwrapMeta(res) {
  if (!res) return {};
  return res.meta ?? res.pagination ?? res.data?.meta ?? {};
}

// ✅ Unwrap resultado OK genérico
function unwrapOk(res) {
  if (!res) return { ok: false, code: "NO_RESPONSE", message: "Sin respuesta del servidor" };
  if (typeof res.ok === "boolean") {
    return { ok: res.ok, code: res.code || null, message: res.message || null, data: res.data ?? null };
  }
  return { ok: true, code: null, message: null, data: res.data ?? null };
}

// Detecta si un error es 404 de ruta
function is404(err) {
  const code = err?.response?.status;
  const msg = String(err?.response?.data?.message || err?.message || "");
  return code === 404 || msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("ruta no encontrada");
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
      this.error =
        e?.response?.data?.message ||
        e?.friendlyMessage ||
        e?.message ||
        String(e || "");
    },

    // ✅ GET /products
    async fetchList({ q = "", page = 1, limit = 20, branch_id = null } = {}) {
      this.loading = true;
      this.error = null;
      try {
        const params = { q, page, limit };
        const bid = toInt(branch_id, 0);
        if (bid > 0) params.branch_id = bid; // admin filtra stock_qty por sucursal

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

    // ✅ GET /products/:id (con branch_id opcional => stock_qty correcto)
    async fetchOne(id, { force = false, branch_id = null } = {}) {
      const pid = toInt(id, 0);
      if (!pid) return null;

      if (!force && this.current?.id === pid) return this.current;

      this.loading = true;
      this.error = null;
      try {
        const params = {};
        const bid = toInt(branch_id, 0);
        if (bid > 0) params.branch_id = bid;

        const { data } = await http.get(`/products/${pid}`, { params });
        const one = unwrapOne(data);

        this.current = one || null;

        // ✅ NO pisar listado con objeto peor (evita “stock 0” al tocar lápiz)
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
        const obj = unwrapOne(data) || data?.data || null;
        const qty = Number(obj?.qty ?? 0);
        return Number.isFinite(qty) ? qty : 0;
      } catch {
        return 0;
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
    async update(id, payload, { branch_id = null } = {}) {
      const pid = toInt(id, 0);
      if (!pid) throw new Error("MISSING_ID");

      this.loading = true;
      this.error = null;
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
      if (!pid) return { ok: false, code: "MISSING_ID", message: "ID inválido" };

      this.loading = true;
      this.error = null;

      try {
        const { data } = await http.delete(`/products/${pid}`);
        const r = unwrapOk(data);

        if (r.ok === true) {
          this.items = (this.items || []).filter((x) => toInt(x.id, 0) !== pid);
          this.total = Math.max(0, toInt(this.total, 0) - 1);
          if (this.current?.id === pid) this.current = null;

          return { ok: true, code: null, message: r.message || "Producto eliminado" };
        }

        return { ok: false, code: r.code || "DELETE_DENIED", message: r.message || "No se pudo eliminar" };
      } catch (e) {
        this.setError(e);
        return {
          ok: false,
          code: `HTTP_${e?.response?.status || "ERR"}`,
          message: e?.response?.data?.message || e?.message || "No se pudo eliminar",
        };
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

      const payload = {
        product_id: toInt(product_id, 0),
        branch_id: toInt(branch_id, 0),
        qty: Number(qty || 0),
      };

      const candidates = [
        "pos/stock/init",
        "pos/stocks/init",
        "pos/stock",
        "pos/stocks",
        "stock/init",
        "stocks/init",
        "stock",
        "stocks",
        "inventory/stock/init",
        "inventory/stock",
      ];

      let lastErr = null;

      try {
        for (const path of candidates) {
          try {
            // eslint-disable-next-line no-console
            console.log("[initStock] TRY:", path, payload);

            const { data } = await http.post(path, payload);
            const r = unwrapOk(data);
            if (r.ok === false) throw new Error(r.message || `INIT_STOCK_FAILED (${path})`);

            // eslint-disable-next-line no-console
            console.log("[initStock] OK:", path, data);
            return true;
          } catch (e) {
            lastErr = e;
            const status = e?.response?.status;
            const msg = String(e?.response?.data?.message || e?.message || "");
            // eslint-disable-next-line no-console
            console.warn("[initStock] FAIL:", path, "status=", status, "msg=", msg);

            if (!is404(e)) throw e;
          }
        }

        const msg = lastErr?.response?.data?.message || lastErr?.message || "INIT_STOCK_ROUTE_NOT_FOUND";
        throw new Error(msg);
      } catch (e) {
        this.setError(e);
        return false;
      } finally {
        this.loading = false;
      }
    },
  },
});
