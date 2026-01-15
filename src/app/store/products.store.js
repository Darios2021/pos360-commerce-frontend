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

function toNum(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
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

    // ✅ GET /products/:id/stock
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

    // ✅ GET /products/:id/branches  (matriz enabled + current_qty)
    async fetchBranchesMatrix(productId) {
      const pid = toInt(productId, 0);
      if (!pid) return [];

      this.error = null;
      try {
        const { data } = await http.get(`/products/${pid}/branches`);
        return unwrapList(data) || (Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        this.setError(e);
        return [];
      }
    },

    // ✅ ✅ NUEVO: traer producto + matriz (para EDITAR / DETALLE)
    async fetchOneWithStockMatrix(id, { branch_id = null } = {}) {
      const pid = toInt(id, 0);
      if (!pid) return null;

      const p = await this.fetchOne(pid, { force: true, branch_id });
      if (!p?.id) return null;

      const matrix = await this.fetchBranchesMatrix(pid);

      // Normalizamos para que UI tenga algo consistente
      const rows = (Array.isArray(matrix) ? matrix : []).map((x) => ({
        branch_id: toInt(x.branch_id ?? x.id, 0),
        branch_name: x.branch_name || x.name || "",
        enabled: x.enabled === true || Number(x.enabled || 0) === 1,
        current_qty: toNum(x.current_qty ?? x.qty ?? x.stock_qty ?? 0, 0),
      })).filter((r) => r.branch_id > 0);

      const total_qty = rows.reduce((acc, r) => acc + (Number(r.current_qty) || 0), 0);

      // ✅ Se lo pegamos al objeto para que ProductForm/Details lo use directo
      const enriched = { ...p, stock_matrix: rows, stock_total_qty: total_qty };

      // Si current era este, lo actualizamos también
      if (this.current?.id === pid) this.current = enriched;

      return enriched;
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
          this.items = [created, ...(this.items || [])];
          this.total = toInt(this.total, 0) + 1;
        }
        return data;
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
    async remove(id) {
      const pid = toInt(id, 0);
      if (!pid) return { ok: false, code: "MISSING_ID", message: "ID inválido" };

      this.loading = true;
      this.error = null;
      this.lastError = null;
      this.lastFieldErrors = null;

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
    // ✅ STOCK INIT (RUTA REAL)
    // ==========================
    async initStock({ product_id, branch_id, qty }) {
      // ✅ NO MÁS spam 404: usamos la ruta real que te funcionó en consola
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
        // eslint-disable-next-line no-console
        console.log("[initStock] POST stock/init", payload);

        const { data } = await http.post("stock/init", payload);
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
