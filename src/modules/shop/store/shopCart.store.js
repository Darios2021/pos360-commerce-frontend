// src/modules/shop/store/shopCart.store.js
import { defineStore } from "pinia";

function toNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

export const useShopCartStore = defineStore("shopCart", {
  state: () => ({
    // ✅ Sucursal se elige al final (checkout)
    branch_id: null,
    branches: [],
    // ✅ items planos: { product_id, name, price_list, price_discount, image_url, ... , qty }
    items: [],
  }),

  getters: {
    count: (s) => (s.items || []).reduce((a, i) => a + toNum(i.qty, 0), 0),

    total: (s) =>
      (s.items || []).reduce((a, i) => {
        const price = toNum(i.price_discount, 0) > 0 ? toNum(i.price_discount, 0) : toNum(i.price_list, 0) || toNum(i.price, 0);
        return a + toNum(i.qty, 0) * price;
      }, 0),
  },

  actions: {
    setBranches(list) {
      this.branches = Array.isArray(list) ? list : [];
    },

    setBranch(id) {
      this.branch_id = id ? Number(id) : null;
    },

    add(product, qty = 1) {
      if (!product) return;
      const pid = Number(product.product_id ?? product.id ?? 0);
      if (!pid) return;

      const q = Math.max(1, Number(qty || 1));
      const it = this.items.find((x) => Number(x.product_id) === pid);

      if (it) it.qty += q;
      else this.items.push({ ...product, product_id: pid, qty: q });
    },

    inc(product_id) {
      const pid = Number(product_id || 0);
      const it = this.items.find((x) => Number(x.product_id) === pid);
      if (it) it.qty += 1;
    },

    dec(product_id) {
      const pid = Number(product_id || 0);
      const it = this.items.find((x) => Number(x.product_id) === pid);
      if (!it) return;
      it.qty = Math.max(1, Number(it.qty || 1) - 1);
    },

    updateQty(product_id, qty) {
      const pid = Number(product_id || 0);
      const it = this.items.find((x) => Number(x.product_id) === pid);
      if (!it) return;
      it.qty = Math.max(1, Number(qty || 1));
    },

    remove(product_id) {
      const pid = Number(product_id || 0);
      this.items = (this.items || []).filter((x) => Number(x.product_id) !== pid);
    },

    clear() {
      this.items = [];
      this.branch_id = null;
    },
  },
});
