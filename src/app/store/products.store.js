// ✅ COPY-PASTE FINAL COMPLETO
// src/app/store/products.store.js
//
// FIX REAL (server-side products):
// - ✅ DETECTA RESPUESTA HTML / STRING (proxy mal / index.html) => muestra error (antes quedaba “0 sin errores”)
// - Si backend responde ok:false con 200 => muestra error
// - Mantiene unwrap robusto + compactParams + fallback whitelist
// - Evita /api/v1 duplicado (axios ya usa baseURL="/api/v1")

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

/** ✅ quita undefined + null + "" */
function compactParams(obj) {
  const out = {};
  for (const k of Object.keys(obj || {})) {
    const v = obj[k];
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    out[k] = v;
  }
  return out;
}

// =======================
// ✅ Unwrap helpers (ROBUSTO)
// =======================
function unwrapListSmart(payload) {
  const p = payload;

  if (Array.isArray(p)) return p;

  if (p && Array.isArray(p.data)) return p.data;

  if (p && Array.isArray(p.items)) return p.items;
  if (p && Array.isArray(p.rows)) return p.rows;

  if (p && p.data && Array.isArray(p.data.data)) return p.data.data;

  if (p && p.data && Array.isArray(p.data.items)) return p.data.items;

  if (p && Array.isArray(p.result)) return p.result;

  return [];
}

function unwrapMetaSmart(payload) {
  const p = payload;
  if (!p) return {};

  if (p.meta && typeof p.meta === "object") return p.meta;
  if (p.pagination && typeof p.pagination === "object") return p.pagination;

  if (p.data && p.data.meta && typeof p.data.meta === "object") return p.data.meta;
  if (p.data && p.data.pagination && typeof p.data.pagination === "object") return p.data.pagination;

  const hasAny =
    Object.prototype.hasOwnProperty.call(p, "total") ||
    Object.prototype.hasOwnProperty.call(p, "pages") ||
    Object.prototype.hasOwnProperty.call(p, "page") ||
    Object.prototype.hasOwnProperty.call(p, "limit");
  if (hasAny) return { total: p.total, pages: p.pages, page: p.page, limit: p.limit };

  return {};
}

function unwrapOne(res) {
  if (!res) return null;
  if (res.ok === false) return null;

  const v = res.data ?? res.item ?? res.product ?? res.user ?? res.result ?? null;

  if (v && typeof v === "object" && !Array.isArray(v) && v.data && typeof v.data === "object") {
    return v.data;
  }
  return v;
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

// =======================
// ✅ Detecta “HTML / index” (proxy mal)
// =======================
function looksLikeHtml(x) {
  if (typeof x !== "string") return false;
  const s = x.trim().slice(0, 200).toLowerCase();
  return s.startsWith("<!doctype") || s.startsWith("<html") || s.includes("<head") || s.includes("<body");
}
function mustBeJsonObjectOrArray(data) {
  return Array.isArray(data) || isPlainObject(data);
}

/* =========================================
   ✅ FALLBACK /products -> /admin/products (WHITELIST)
========================================= */
function statusOf(e) {
  return Number(e?.response?.status || 0);
}
function is404(e) {
  return statusOf(e) === 404;
}
function is403(e) {
  return statusOf(e) === 403;
}
function toAdminProductsPath(path) {
  const p = String(path || "");
  return p.replace(/^\/products(\/|$)/, "/admin/products$1");
}
function canFallbackPath(path) {
  const p = String(path || "");

  if (!p.startsWith("/products")) return false;
  if (p.startsWith("/admin/products")) return false;

  // ❌ NUNCA fallback para imágenes
  if (/^\/products\/\d+\/images(\/|$)/.test(p)) return false;

  // ❌ NO son "admin products" en tu backend
  if (/^\/products\/\d+\/stock(\/|$)/.test(p)) return false;
  if (/^\/products\/\d+\/branches(\/|$)/.test(p)) return false;

  // ✅ whitelist
  if (p === "/products") return true;
  if (p === "/products/next-code") return true;
  if (/^\/products\/\d+$/.test(p)) return true;

  return false;
}

async function req(method, path, ...args) {
  try {
    return await http[method](path, ...args);
  } catch (e) {
    const p = String(path || "");

    if (canFallbackPath(p) && (is404(e) || is403(e))) {
      const adminPath = toAdminProductsPath(p);
      try {
        return await http[method](adminPath, ...args);
      } catch {
        throw e;
      }
    }
    throw e;
  }
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

  // ── Promo: normalización ───────────────────────────────────────────────
  // promo_qty_mode debe ser 'amount' | 'percent' | null
  if ("promo_qty_mode" in p) {
    const v = String(p.promo_qty_mode ?? "").trim().toLowerCase();
    p.promo_qty_mode = v === "amount" || v === "percent" ? v : null;
  }
  // numéricos promo: null/""/undefined → null; sino number
  // (importante: null debe quedar null — sino el backend lo lee como "configurado")
  for (const f of ["promo_price", "promo_qty_discount"]) {
    if (!(f in p)) continue;
    if (p[f] === null || p[f] === "" || p[f] === undefined) {
      p[f] = null;
      continue;
    }
    p[f] = toNum(p[f], 0);
  }
  if ("promo_qty_threshold" in p) {
    if (p.promo_qty_threshold === null || p.promo_qty_threshold === "" || p.promo_qty_threshold === undefined) {
      p.promo_qty_threshold = null;
    } else {
      p.promo_qty_threshold = toInt(p.promo_qty_threshold, 0) || null;
    }
  }
  // Fechas promo: "" → null; Date → ISO; sino conservar string
  for (const f of ["promo_starts_at", "promo_ends_at"]) {
    if (!(f in p)) continue;
    if (p[f] === "" || p[f] === undefined) p[f] = null;
    else if (p[f] instanceof Date) p[f] = p[f].toISOString();
  }

  if ("code" in p) delete p.code;

  // compactParams elimina null/"". Para los campos de promo SÍ queremos
  // poder enviar null (limpiar) → reinyectamos después de compactar.
  const promoKeys = [
    "promo_price",
    "promo_starts_at",
    "promo_ends_at",
    "promo_qty_threshold",
    "promo_qty_discount",
    "promo_qty_mode",
  ];
  const compacted = compactParams(p);
  for (const k of promoKeys) {
    if (Object.prototype.hasOwnProperty.call(p, k)) compacted[k] = p[k];
  }
  return compacted;
}

export const useProductsStore = defineStore("products", {
  state: () => ({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    pages: 1,
    meta: { page: 1, limit: 20, total: 0, pages: 1 },

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

      this.error = data?.message || data?.error || e?.friendlyMessage || e?.message || String(e || "");
    },

    clearError() {
      this.error = null;
      this.lastError = null;
      this.lastFieldErrors = null;
    },

    async fetchNextCode() {
      this.error = null;
      try {
        const { data } = await req("get", "/products/next-code");
        if (!mustBeJsonObjectOrArray(data) && !looksLikeHtml(data)) return null;
        if (looksLikeHtml(data)) return null;

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

    /**
     * ✅ LIST REAL (server-side)
     */
    async fetchList(paramsIn = {}) {
      this.loading = true;
      this.error = null;
      this.lastError = null;
      this.lastFieldErrors = null;

      try {
        const p = isPlainObject(paramsIn) ? { ...paramsIn } : {};

        const page = toInt(p.page, 1) || 1;
        const limit = Math.min(200, Math.max(1, toInt(p.limit, 20)));

        if ("branch_id" in p) {
          const bid = toInt(p.branch_id, 0);
          p.branch_id = bid > 0 ? bid : null;
        }
        if ("category_id" in p) {
          const cid = toInt(p.category_id, 0);
          p.category_id = cid > 0 ? cid : null;
        }
        if ("subcategory_id" in p) {
          const sid = toInt(p.subcategory_id, 0);
          p.subcategory_id = sid > 0 ? sid : null;
        }

        if ("price_min" in p) {
          const n = toNum(p.price_min, NaN);
          p.price_min = Number.isFinite(n) ? n : null;
        }
        if ("price_max" in p) {
          const n = toNum(p.price_max, NaN);
          p.price_max = Number.isFinite(n) ? n : null;
        }

        if ("stock" in p && p.stock != null) p.stock = String(p.stock).toLowerCase().trim();
        if ("images" in p && p.images != null) p.images = String(p.images).toLowerCase().trim();
        if ("price_presence" in p && p.price_presence != null) p.price_presence = String(p.price_presence).toLowerCase().trim();
        if ("promo" in p && p.promo != null) p.promo = String(p.promo).toLowerCase().trim();

        p.page = page;
        p.limit = limit;

        const params = compactParams(p);

        const { data } = await req("get", "/products", { params });

        // ✅ Debug mínimo (no rompe prod)
        try {
          const ct = http?.defaults?.headers?.common?.["Content-Type"];
          console.log("[products.fetchList] params:", params, "contentTypeDefault:", ct, "respType:", typeof data);
        } catch {}

        // ✅ FIX: si vuelve HTML o string => PROXY MAL (antes quedaba vacío sin error)
        if (looksLikeHtml(data) || (typeof data === "string" && !data.trim().startsWith("{") && !data.trim().startsWith("["))) {
          this.items = [];
          this.total = 0;
          this.page = 1;
          this.pages = 1;
          this.meta = { page: 1, limit, total: 0, pages: 1 };

          this.setError({
            raw: {
              code: "API_PROXY_HTML",
              message:
                "La API /api/v1/products está devolviendo HTML (index/proxy), no JSON. Revisá proxy/baseURL del frontend o el mount del backend.",
              hint:
                "Abrí Network -> /api/v1/products -> Response: si ves <!doctype html> es el problema. El backend no está recibiendo la ruta.",
            },
          });

          // log snippet
          try {
            console.warn("[products.fetchList] HTML snippet:", String(data).slice(0, 200));
          } catch {}

          return null;
        }

        // ✅ si no es objeto/array => también error
        if (!mustBeJsonObjectOrArray(data)) {
          this.items = [];
          this.total = 0;
          this.page = 1;
          this.pages = 1;
          this.meta = { page: 1, limit, total: 0, pages: 1 };

          this.setError({
            raw: {
              code: "API_BAD_RESPONSE",
              message: "Respuesta inesperada de /products (no es JSON).",
              gotType: typeof data,
            },
          });
          return null;
        }

        // ✅ ok:false con HTTP 200 => mostrar error
        if (data && data.ok === false) {
          this.items = [];
          this.total = 0;
          this.page = 1;
          this.pages = 1;
          this.meta = { page: 1, limit, total: 0, pages: 1 };
          this.setError({ raw: data });
          return null;
        }

        const list = unwrapListSmart(data);
        const meta = unwrapMetaSmart(data);

        const total = toInt(meta.total, Array.isArray(list) ? list.length : 0);
        const pages = Math.max(1, toInt(meta.pages, Math.ceil((total || 0) / limit) || 1));
        const pageOut = Math.min(pages, Math.max(1, toInt(meta.page, page)));
        const limitOut = toInt(meta.limit, limit);

        this.items = Array.isArray(list) ? list : [];
        this.total = total;
        this.page = pageOut;
        this.limit = limitOut;
        this.pages = pages;
        this.meta = { page: pageOut, limit: limitOut, total, pages };

        return data;
      } catch (e) {
        this.setError(e);
        this.items = [];
        this.total = 0;
        this.page = 1;
        this.pages = 1;
        this.meta = { page: 1, limit: this.limit || 20, total: 0, pages: 1 };
        return null;
      } finally {
        this.loading = false;
      }
    },

    async fetchStats(paramsIn = {}) {
      try {
        const p = isPlainObject(paramsIn) ? { ...paramsIn } : {};

        if ("branch_id" in p) {
          const bid = toInt(p.branch_id, 0);
          p.branch_id = bid > 0 ? bid : null;
        }
        if ("category_id" in p) {
          const cid = toInt(p.category_id, 0);
          p.category_id = cid > 0 ? cid : null;
        }
        if ("subcategory_id" in p) {
          const sid = toInt(p.subcategory_id, 0);
          p.subcategory_id = sid > 0 ? sid : null;
        }

        // Quitamos parámetros que no aplican a stats agregadas
        delete p.page;
        delete p.limit;
        delete p.stock;
        delete p.price_presence;
        delete p.price_min;
        delete p.price_max;
        delete p.images;

        const params = compactParams(p);
        const { data } = await req("get", "/products/stats", { params });

        if (!data || data.ok === false || !data.data) {
          return null;
        }
        return data.data;
      } catch (e) {
        return null;
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

        const { data } = await req("get", `/products/${pid}`, { params });

        if (looksLikeHtml(data)) {
          this.setError({
            raw: { code: "API_PROXY_HTML", message: "La API devolvió HTML en /products/:id (proxy/baseURL mal)." },
          });
          return null;
        }

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
        const { data } = await req("get", `/products/${pid}/stock`, { params: { branch_id: bid } });
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
        const { data } = await req("get", `/products/${pid}/branches`);
        const list = unwrapListSmart(data) || (Array.isArray(data?.data) ? data.data : []);
        return Array.isArray(list) ? list : [];
      } catch (e) {
        this.setError(e);
        return [];
      }
    },

    async fetchBranches() {
      this.error = null;
      try {
        const { data } = await http.get("/branches");
        const list = unwrapListSmart(data) || (Array.isArray(data?.data) ? data.data : []);
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
        const { data } = await req("post", "/products", clean);

        const created = unwrapOne(data);
        if (created?.id) {
          this.current = created;

          const pid = toInt(created.id, 0);
          const idx = (this.items || []).findIndex((x) => toInt(x.id, 0) === pid);
          if (idx >= 0) this.items[idx] = { ...this.items[idx], ...created };
          else this.items = [created, ...(this.items || [])];

          this.total = toInt(this.total, 0) + (idx >= 0 ? 0 : 1);
          this.meta = { ...this.meta, total: this.total };
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
              ? data?.message || "Conflicto: SKU/Barcode/Code duplicado."
              : data?.message || "Conflicto.";

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

        const { data } = await req("patch", `/products/${pid}`, clean, { params });

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
      if (!pid) return { ok: false, code: "MISSING_ID", message: "ID inválido" };

      this.loading = true;
      this.error = null;
      this.lastError = null;
      this.lastFieldErrors = null;

      try {
        const { data } = await req("delete", `/products/${pid}`);
        const r = unwrapOk(data);

        if (r.ok === false) {
          this.setError({ response: { data: { message: r.message || "No se pudo eliminar", code: r.code } } });
          return { ok: false, code: r.code || "DELETE_FAILED", message: r.message || "No se pudo eliminar" };
        }

        this.items = (this.items || []).filter((x) => toInt(x.id, 0) !== pid);
        this.total = Math.max(0, toInt(this.total, 0) - 1);
        this.meta = { ...this.meta, total: this.total };
        if (toInt(this.current?.id, 0) === pid) this.current = null;

        return true;
      } catch (e) {
        const { status, data } = pickHttpError(e);

        if (status === 409) {
          const code = String(data?.code || "FK_CONSTRAINT");
          const msg = data?.message || "No se pudo borrar: tiene relaciones (ventas/stock/etc).";
          this.setError({ response: { data: { ...data, code, message: msg } } });
          return { ok: false, code, message: msg };
        }

        if (status === 401) {
          const msg = data?.message || "No autorizado.";
          this.setError({ response: { data: { ...data, code: "UNAUTHORIZED", message: msg } } });
          return { ok: false, code: "UNAUTHORIZED", message: msg };
        }

        if (status === 403) {
          const msg = data?.message || "No tenés permisos para eliminar.";
          this.setError({ response: { data: { ...data, code: "FORBIDDEN", message: msg } } });
          return { ok: false, code: "FORBIDDEN", message: msg };
        }

        this.setError(e);
        return { ok: false, code: "DELETE_FAILED", message: this.error || "No se pudo eliminar" };
      } finally {
        this.loading = false;
      }
    },

    async fetchImages(productId) {
      const pid = toInt(productId, 0);
      if (!pid) return [];

      try {
        const { data } = await http.get(`/products/${pid}/images`);
        return unwrapListSmart(data);
      } catch (e) {
        const s = Number(e?.response?.status || 0);
        if (s === 403 || s === 404) return [];
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

        const { data } = await req("post", `/products/${pid}/images`, fd);

        const r = unwrapOk(data);
        if (r.ok === false) throw new Error(r.message || "UPLOAD_IMAGES_FAILED");

        return unwrapListSmart(data);
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
        const { data } = await req("delete", `/products/${pid}/images/${iid}`);
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