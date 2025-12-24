// src/app/store/pos.store.js
import { defineStore } from "pinia";
import http from "../api/http";

function toNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}
function apiErrorMessage(err, fallback = "Error") {
  try {
    const data = err?.response?.data;
    return data?.message || data?.error || err?.message || fallback;
  } catch {
    return fallback;
  }
}

const LS_BRANCH = "pos_branch_id";
const LS_WAREHOUSE = "pos_warehouse_id";

const POS_DEBUG =
  String(import.meta?.env?.VITE_POS_DEBUG ?? "").toLowerCase() === "true" ||
  import.meta?.env?.DEV;

function dbg(...args) {
  if (!POS_DEBUG) return;
  // eslint-disable-next-line no-console
  console.log("[POS]", ...args);
}

function readLSInt(key) {
  try {
    const v = localStorage.getItem(key);
    const n = toInt(v, 0);
    return n > 0 ? n : null;
  } catch {
    return null;
  }
}
function writeLSInt(key, val) {
  try {
    if (!val) localStorage.removeItem(key);
    else localStorage.setItem(key, String(val));
  } catch {}
}

async function fetchFirstWarehouseIdByBranch(branchId) {
  const bid = toInt(branchId, 0);
  if (!bid) return null;

  try {
    const { data } = await http.get("/warehouses", {
      params: { branch_id: bid, limit: 200 },
    });

    dbg("GET /warehouses raw", data);

    const list = data?.data?.items || data?.items || data?.data || [];
    const arr = Array.isArray(list) ? list : [];
    const sorted = [...arr].sort((a, b) => toInt(a?.id, 0) - toInt(b?.id, 0));
    const first = sorted[0];
    const wid = toInt(first?.id, 0);

    dbg("fetchFirstWarehouseIdByBranch", { branchId: bid, resolvedWarehouseId: wid || null });

    return wid > 0 ? wid : null;
  } catch (e) {
    dbg("fetchFirstWarehouseIdByBranch ERROR", { branchId: bid, status: e?.response?.status, data: e?.response?.data });
  }

  return null;
}

export const usePosStore = defineStore("pos", {
  state: () => ({
    loading: false,
    error: "",

    branch_id: readLSInt(LS_BRANCH),
    warehouse_id: readLSInt(LS_WAREHOUSE),

    customer: { name: "Consumidor Final" },
    cart: [],

    toast: { show: false, text: "" },
  }),

  getters: {
    totalItems(state) {
      return state.cart.reduce((a, it) => a + (toNum(it.qty, 0) > 0 ? 1 : 0), 0);
    },
    totalAmount(state) {
      return state.cart.reduce((a, it) => a + toNum(it.subtotal, 0), 0);
    },
  },

  actions: {
    setWarehouse(id) {
      const wid = toInt(id, 0);
      this.warehouse_id = wid > 0 ? wid : null;
      writeLSInt(LS_WAREHOUSE, this.warehouse_id);
      dbg("setWarehouse", { warehouse_id: this.warehouse_id });
    },

    setBranch(id) {
      const bid = toInt(id, 0);
      this.branch_id = bid > 0 ? bid : null;
      writeLSInt(LS_BRANCH, this.branch_id);
      dbg("setBranch", { branch_id: this.branch_id });
    },

    resetContext() {
      this.branch_id = null;
      this.warehouse_id = null;
      writeLSInt(LS_BRANCH, null);
      writeLSInt(LS_WAREHOUSE, null);
      dbg("resetContext");
    },

    async ensureContext({ force = false } = {}) {
      const currB = toInt(this.branch_id, 0);
      const currW = toInt(this.warehouse_id, 0);

      if (!force && currB > 0 && currW > 0) {
        dbg("ensureContext skip (already set)", { branch_id: currB, warehouse_id: currW });
        return;
      }

      try {
        dbg("ensureContext start", { force, currB, currW });

        const { data } = await http.get("/pos/context");
        dbg("GET /pos/context raw", data);

        const ctx = data?.data || {};

        const branchId =
          toInt(ctx?.branchId, 0) ||
          toInt(ctx?.branch?.id, 0) ||
          toInt(ctx?.user?.branch_id, 0);

        const warehouseId =
          toInt(ctx?.warehouseId, 0) ||
          toInt(ctx?.warehouse?.id, 0);

        dbg("ensureContext derived", { branchId, warehouseId, ctx });

        if (branchId > 0 && (force || toInt(this.branch_id, 0) <= 0)) {
          this.branch_id = branchId;
          writeLSInt(LS_BRANCH, branchId);
        }

        if (warehouseId > 0 && (force || toInt(this.warehouse_id, 0) <= 0)) {
          this.warehouse_id = warehouseId;
          writeLSInt(LS_WAREHOUSE, warehouseId);
        }

        if (toInt(this.branch_id, 0) > 0 && toInt(this.warehouse_id, 0) <= 0) {
          const wid = await fetchFirstWarehouseIdByBranch(this.branch_id);
          if (wid) {
            this.warehouse_id = wid;
            writeLSInt(LS_WAREHOUSE, wid);
            dbg("ensureContext fallback warehouse resolved", {
              branch_id: this.branch_id,
              warehouse_id: this.warehouse_id,
            });
          } else {
            dbg("ensureContext fallback warehouse NOT found", { branch_id: this.branch_id });
          }
        }

        dbg("ensureContext done", {
          branch_id: this.branch_id,
          warehouse_id: this.warehouse_id,
          ls_branch: readLSInt(LS_BRANCH),
          ls_warehouse: readLSInt(LS_WAREHOUSE),
        });
      } catch (e) {
        this.error = apiErrorMessage(e, "No se pudo cargar contexto POS");
        dbg("ensureContext ERROR", { msg: this.error, status: e?.response?.status, data: e?.response?.data });
        throw e;
      }
    },

    clearCart() {
      this.cart = [];
    },

    _recalcLine(it) {
      const qty = toNum(it.qty, 0);
      const price = toNum(it.price, 0);
      it.subtotal = qty * price;
    },

    addToCart(product) {
      const available = toNum(product?.available_qty, toNum(product?.qty, 0));

      dbg("addToCart input", {
        id: product?.id,
        sku: product?.sku,
        available_qty: available,
        qty: product?.qty,
        branch_id: this.branch_id,
        warehouse_id: this.warehouse_id,
      });

      if (available <= 0) {
        this.toast = { show: true, text: "❌ Producto sin stock en este depósito." };
        return;
      }

      const id = toInt(product?.id, 0);
      if (!id) {
        this.toast = { show: true, text: "❌ Producto inválido." };
        return;
      }

      const price =
        toNum(product?.price_list, 0) ||
        toNum(product?.price, 0) ||
        toNum(product?.effective_price, 0);

      if (price <= 0) {
        this.toast = { show: true, text: "⚠️ Producto sin precio. No se puede vender." };
        return;
      }

      const existing = this.cart.find((x) => toInt(x.id, 0) === id);

      if (!existing) {
        const it = {
          id,
          product_id: toInt(product?.product_id, id) || id,
          name: String(product?.name || ""),
          sku: product?.sku || null,
          barcode: product?.barcode || null,
          image: product?.image || null,
          qty: 1,
          available_qty: available,
          price,
          subtotal: 0,
        };

        this._recalcLine(it);
        this.cart.push(it);
        return;
      }

      if (toNum(existing.qty, 0) + 1 > toNum(existing.available_qty, 0)) {
        this.toast = {
          show: true,
          text: `⚠️ Stock insuficiente. Disponible: ${toNum(existing.available_qty, 0).toFixed(3)}`,
        };
        return;
      }

      existing.qty = toNum(existing.qty, 0) + 1;
      this._recalcLine(existing);
    },
  },
});
