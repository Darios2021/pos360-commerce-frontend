// src/modules/shop/store/shopCart.store.js
// ✅ COPY-PASTE FINAL COMPLETO (persist + control stock + branch stock)
// - Persiste: branch_id, branches, items
// - NO persiste UI: drawer_open
// - Controla stock en add/inc/updateQty (si hay info de stock)
// - Soporta stock_by_branch cuando está presente en el item

import { defineStore } from "pinia";
import { safeLocalGet, safeLocalSet, safeLocalRemove } from "../utils/safeStorage";

const STORAGE_KEY = "pos360_shop_cart_v1";

function toNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}
function isTruthyStockTrack(v) {
  // track_stock puede venir 1/"1"/true
  return v === true || v === 1 || v === "1";
}

function loadInitialState() {
  const data = safeLocalGet(STORAGE_KEY, null);

  if (!data || typeof data !== "object") {
    return {
      branch_id: null,
      branches: [],
      items: [],
      // ✅ UI (no persistimos)
      drawer_open: false,
    };
  }

  const { branch_id = null, branches = [], items = [] } = data;

  return {
    branch_id: branch_id ? Number(branch_id) : null,
    branches: Array.isArray(branches) ? branches : [],
    items: Array.isArray(items) ? items : [],
    // ✅ UI (no persistimos)
    drawer_open: false,
  };
}

function persistState(state) {
  safeLocalSet(STORAGE_KEY, {
    branch_id: state.branch_id,
    branches: state.branches,
    items: state.items,
  });
}

/**
 * Intenta determinar stock disponible para el item, priorizando:
 * 1) stock_by_branch (si existe y hay branch_id seleccionado)
 * 2) stock_qty del item
 *
 * Retorna:
 * - Infinity si track_stock = 0
 * - null si no hay info confiable de stock (no bloqueamos)
 * - number >= 0 si se pudo determinar
 */
function getAvailableStockForItem(item, branch_id) {
  if (!item) return null;

  const track = isTruthyStockTrack(item.track_stock);
  if (!track) return Infinity;

  const bid = toInt(branch_id, 0);

  // 1) stock_by_branch
  const list =
    item.stock_by_branch ||
    item.branch_stock ||
    item.branches_stock ||
    item.availability ||
    item.branches_available ||
    null;

  if (bid && Array.isArray(list) && list.length) {
    const found = list.find((x) => toInt(x?.branch_id ?? x?.id ?? x?.branchId, 0) === bid);
    if (found) {
      const qty = toNum(found?.qty ?? found?.stock_qty ?? found?.stock, 0);
      return Math.max(0, qty);
    }
    // si hay lista pero no aparece la sucursal, asumimos 0 (no disponible ahí)
    return 0;
  }

  // 2) stock_qty
  if (item.stock_qty !== undefined && item.stock_qty !== null && item.stock_qty !== "") {
    const qty = toNum(item.stock_qty, 0);
    return Math.max(0, qty);
  }

  // 3) sin data => no bloqueamos
  return null;
}

function clampQty(desiredQty, availableStock) {
  const q = Math.max(1, toInt(desiredQty, 1));

  if (availableStock === Infinity) return q;
  if (availableStock === null) return q; // sin info => no bloqueamos

  const max = Math.max(0, toInt(availableStock, 0));
  if (max <= 0) return 1; // si no hay stock, dejamos 1 (UI debería advertir en checkout)
  return Math.min(q, max);
}

function normalizeProductForCart(product) {
  if (!product) return null;

  const pid = toInt(product.product_id ?? product.id, 0);
  if (!pid) return null;

  return {
    ...product,
    product_id: pid,
    qty: Math.max(1, toInt(product.qty ?? 1, 1)),
  };
}

export const useShopCartStore = defineStore("shopCart", {
  state: () => loadInitialState(),

  getters: {
    count: (s) => (s.items || []).reduce((a, i) => a + toNum(i.qty, 0), 0),

    total: (s) =>
      (s.items || []).reduce((a, i) => {
        const price =
          toNum(i.price_discount, 0) > 0
            ? toNum(i.price_discount, 0)
            : toNum(i.price_list, 0) || toNum(i.price, 0);
        return a + toNum(i.qty, 0) * price;
      }, 0),
  },

  actions: {
    // ======================
    // UI Drawer (NO PERSIST)
    // ======================
    openDrawer() {
      this.drawer_open = true;
    },
    closeDrawer() {
      this.drawer_open = false;
    },
    toggleDrawer(v) {
      this.drawer_open = typeof v === "boolean" ? v : !this.drawer_open;
    },

    setBranches(list) {
      this.branches = Array.isArray(list) ? list : [];
      persistState(this);
    },

    setBranch(id) {
      this.branch_id = id ? Number(id) : null;

      // ✅ si cambió la sucursal y tenemos stock_by_branch, clamp para no quedar pasado
      if (this.items?.length) {
        this.items = (this.items || []).map((it) => {
          const avail = getAvailableStockForItem(it, this.branch_id);
          const nextQty = clampQty(it.qty, avail);
          return { ...it, qty: nextQty };
        });
      }

      persistState(this);
    },

    add(product, qty = 1) {
      const p = normalizeProductForCart(product);
      if (!p) return;

      const qAdd = Math.max(1, toInt(qty, 1));
      const pid = p.product_id;

      const it = (this.items || []).find((x) => toInt(x.product_id, 0) === pid);

      if (it) {
        const avail = getAvailableStockForItem(it, this.branch_id);
        const desired = toInt(it.qty, 1) + qAdd;
        it.qty = clampQty(desired, avail);
      } else {
        const avail = getAvailableStockForItem(p, this.branch_id);
        const initialQty = clampQty(qAdd, avail);
        this.items.push({ ...p, qty: initialQty });
      }

      persistState(this);

      // ✅ comportamiento MercadoLibre: abrir drawer lateral solo al agregar
      this.openDrawer();
    },

    inc(product_id) {
      const pid = toInt(product_id, 0);
      const it = (this.items || []).find((x) => toInt(x.product_id, 0) === pid);
      if (!it) return;

      const avail = getAvailableStockForItem(it, this.branch_id);
      const desired = toInt(it.qty, 1) + 1;
      it.qty = clampQty(desired, avail);

      persistState(this);
    },

    dec(product_id) {
      const pid = toInt(product_id, 0);
      const it = (this.items || []).find((x) => toInt(x.product_id, 0) === pid);
      if (!it) return;

      it.qty = Math.max(1, toInt(it.qty, 1) - 1);
      persistState(this);
    },

    updateQty(product_id, qty) {
      const pid = toInt(product_id, 0);
      const it = (this.items || []).find((x) => toInt(x.product_id, 0) === pid);
      if (!it) return;

      const avail = getAvailableStockForItem(it, this.branch_id);
      it.qty = clampQty(qty, avail);

      persistState(this);
    },

remove(product_id) {
  const pid = Number(product_id || 0);
  this.items = (this.items || []).filter((x) => Number(x.product_id) !== pid);
  persistState(this);

  if (import.meta?.env?.DEV) {
    console.log("[shopCart] remove -> persisted", { pid, items: this.items.length });
    console.log("[shopCart] storage snapshot", safeLocalGet(STORAGE_KEY, null));
  }
},

clear() {
  this.items = [];
  this.branch_id = null;
  this.branches = [];
  safeLocalRemove(STORAGE_KEY);

  if (import.meta?.env?.DEV) {
    console.log("[shopCart] clear -> removed storage");
    console.log("[shopCart] storage snapshot", safeLocalGet(STORAGE_KEY, null));
  }
},

  },
});
