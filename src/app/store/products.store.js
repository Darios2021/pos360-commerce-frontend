// ✅ COPY-PASTE FINAL COMPLETO
// src/app/store/products.store.js
// FIX: initStock acepta warehouse_id + fetchBranches() existe (para ProductStockPanel con producto nuevo)

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

function isPlainObject(x) {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function stripUndefined(obj) {
  const out = {};
  for (const k of Object.keys(obj || {})) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

// ✅ Unwrap helpers
function unwrapOne(res) {
  if (!res) return null;
  if (res.ok === false) return null;

  const v = res.data ?? res.item ?? res.product ?? res.user ?? res.result ?? null;
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
  if (v && Array.isArray(v.data)) return v.data;
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
    const k = String(it?.field || it?.path || it?.param || "").trim();
    const m = String(it?.message || it?.msg || "").trim();
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

/**
 * ✅ SANITIZE para CREATE/UPDATE
 */
function sanitizeProductPayload(raw = {}) {
  const p = isPlainObject(raw) ? { ...raw } : {};

  const DROP = [
    "images",
    "imagesQueue",
    "queuedImages",
    "queuedFiles",
    "files",
    "file",
    "fileList",
    "stock",
    "stockByBranch",
    "stock_preview",
    "branchesMatrix",
    "branches_matrix",
    "branches",
    "warehouses",
    "warehousesMatrix",
    "barcodePreview",
    "nextCode",
    "codePreview",
    "ui",
    "_ui",
  ];
  for (const k of DROP) if (k in p) delete p[k];

  if ("sku" in p && p.sku != null) p.sku = String(p.sku).trim();
  if ("name" in p && p.name != null) p.name = String(p.name).trim();

  if ("barcode" in p) {
    const b = String(p.barcode ?? "").trim();
    p.barcode = b ? b : null;
  }
  if ("description" in p && p.description != null) {
    const d = String(p.description).trim();
    p.description = d ? d : null;
  }
  if ("brand" in p && p.brand != null) {
    const b = String(p.brand).trim();
    p.brand = b ? b : null;
  }
  if ("model" in p && p.model != null) {
    const m = String(p.model).trim();
    p.model = m ? m : null;
  }

  const idFields = ["category_id", "subcategory_id", "branch_id"];
  for (const f of idFields) {
    if (!(f in p)) continue;
    if (p[f] === "" || p[f] === undefined) p[f] = null;
    if (p[f] === null) continue;
    const n = toInt(p[f], 0);
    p[f] = n > 0 ? n : null;
  }

  const numFields = ["cost", "price", "price_list", "price_discount", "price_reseller", "tax_rate", "warranty_months"];
  for (const f of numFields) {
    if (!(f in p)) continue;
    if (p[f] === "" || p[f] === undefined) {
      p[f] = null;
      continue;
    }
    p[f] = f === "warranty_months" ? toInt(p[f], 0) : toNum(p[f], 0);
  }

  const boolFields = ["is_new", "is_promo", "is_active", "track_stock", "sheet_has_stock"];
  for (const f of boolFields) {
    if (!(f in p)) continue;
    const v = p[f];
    if (typeof v === "boolean") continue;
    const s = String(v ?? "").trim().toLowerCase();
    if (s === "true" || s === "1") p[f] = true;
    else if (s === "false" || s === "0") p[f] = false;
  }

  if ("code" in p) delete p.code;

  return stripUndefined(p);
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

    nextCode: null,

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

    clearError() {
      this.error = null;
      this.lastError = null;
      this.lastFieldErrors = null;
    },

    async fetchNextCode() {
      this.error = null;
      try {
        const { data } = await http.get("/products/next-code");
        const one = unwrapOne(data) || data?.data || data || null;
        const code = one?.code || null;
        this.nextCode = code;
        return code;
      } catch (e) {
        this.lastError = e?.response?.data || e || null;
        this.nextCode = null;
        return null;
      }
    },

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

    // ✅ CLAVE: EXISTE para producto NUEVO (ProductStockPanel cuando pid=0)
    async fetchBranches() {
      this.error = null;
      try {
        const { data } = await http.get("/branches");
        // soporta [] o {data:[]} o {items:[]} etc
        const list = unwrapList(data) || (Array.isArray(data?.data) ? data.data : []);
        return Array.isArray(list) ? list : [];
      } catch (e) {
        this.setError(e);
        return [];
      }
    },

    async create(payload) {
      this.loading = true;
      this.error = null;
      this.lastError = null;
      this.lastFieldErrors = null;

      try {
        const clean = sanitizeProductPayload(payload);
        const { data } = await http.post("/products", clean);

        const created = unwrapOne(data);
        if (created?.id) {
          this.current = created;

          const pid = toInt(created.id, 0);
          const idx = (this.items || []).findIndex((x) => toInt(x.id, 0) === pid);
          if (idx >= 0) this.items[idx] = { ...this.items[idx], ...created };
          else this.items = [created, ...(this.items || [])];

          this.total = toInt(this.total, 0) + (idx >= 0 ? 0 : 1);
        }

        return data;
      } catch (e) {
        const { status, data } = pickHttpError(e);

        if (status === 400) {
          this.setError(e);
          return null;
        }

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

    async update(id, payload, { branch_id = null } = {}) {
      const pid = toInt(id, 0);
      if (!pid) throw new Error("MISSING_ID");

      this.loading = true;
      this.error = null;
      this.lastError = null;
      this.lastFieldErrors = null;

      try {
        const clean = sanitizeProductPayload(payload);

        const params = {};
        const bid = toInt(branch_id, 0);
        if (bid > 0) params.branch_id = bid;

        const { data } = await http.patch(`/products/${pid}`, clean, { params });

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
      const realFiles = arr.filter((f) => f instanceof File);
      if (!realFiles.length) return null;

      this.loading = true;
      this.error = null;
      this.lastError = null;
      this.lastFieldErrors = null;

      try {
        const fd = new FormData();
        for (const f of realFiles) fd.append("files", f);
        for (const f of realFiles) fd.append("images", f);

        const { data } = await http.post(`/products/${pid}/images`, fd);

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
    // STOCK INIT (branch_id + warehouse_id)
    // ==========================
    async initStock({ product_id, branch_id = null, warehouse_id = null, qty }) {
      this.loading = true;
      this.error = null;
      this.lastError = null;
      this.lastFieldErrors = null;

      const pid = toInt(product_id, 0);
      const bid = toInt(branch_id, 0);
      const wid = toInt(warehouse_id, 0);

      const q = toNum(qty, NaN);

      const payload = {
        product_id: pid,
        qty: Number.isFinite(q) ? q : 0,
      };

      // ✅ mandamos ambos (backend decide)
      if (bid > 0) payload.branch_id = bid;
      if (wid > 0) payload.warehouse_id = wid;

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
