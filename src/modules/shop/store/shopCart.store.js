// src/modules/shop/store/shopCart.store.js
import { defineStore } from "pinia";
import { safeLocalGet, safeLocalSet, safeLocalRemove } from "../utils/safeStorage";

const STORAGE_KEY = "pos360_shop_cart_v1";

function toNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
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
    branch_id,
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
      persistState(this);
    },

    add(product, qty = 1) {
      if (!product) return;
      const pid = Number(product.product_id ?? product.id ?? 0);
      if (!pid) return;

      const q = Math.max(1, Number(qty || 1));
      const it = this.items.find((x) => Number(x.product_id) === pid);

      if (it) it.qty += q;
      else this.items.push({ ...product, product_id: pid, qty: q });

      persistState(this);

      // ✅ comportamiento MercadoLibre: abrir drawer lateral
      this.openDrawer();
    },

    inc(product_id) {
      const pid = Number(product_id || 0);
      const it = this.items.find((x) => Number(x.product_id) === pid);
      if (it) {
        it.qty += 1;
        persistState(this);
      }
    },

    dec(product_id) {
      const pid = Number(product_id || 0);
      const it = this.items.find((x) => Number(x.product_id) === pid);
      if (!it) return;
      it.qty = Math.max(1, Number(it.qty || 1) - 1);
      persistState(this);
    },

    updateQty(product_id, qty) {
      const pid = Number(product_id || 0);
      const it = this.items.find((x) => Number(x.product_id) === pid);
      if (!it) return;
      it.qty = Math.max(1, Number(qty || 1));
      persistState(this);
    },

    remove(product_id) {
      const pid = Number(product_id || 0);
      this.items = (this.items || []).filter((x) => Number(x.product_id) !== pid);
      persistState(this);
    },

    clear() {
      this.items = [];
      this.branch_id = null;
      this.branches = [];
      safeLocalRemove(STORAGE_KEY);
    },
  },
});
