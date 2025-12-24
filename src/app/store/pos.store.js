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

export const usePosStore = defineStore("pos", {
  state: () => ({
    loading: false,
    error: "",

    // contexto POS
    branch_id: null,
    warehouse_id: null,

    // cliente
    customer: { name: "Consumidor Final" },

    // carrito
    cart: [],

    // opcional: si querés un "toast" global desde store
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
    // =========================
    // Contexto POS
    // =========================
    async ensureContext() {
      // Si ya lo tenemos, no molestamos
      if (toInt(this.branch_id, 0) > 0 && toInt(this.warehouse_id, 0) > 0) return;

      try {
        const { data } = await http.get("/pos/context");
        const ctx = data?.data || {};

        // el middleware te puede setear ctx.* o el user trae branch_id
        const branchId =
          toInt(ctx?.branchId, 0) ||
          toInt(ctx?.branch?.id, 0) ||
          toInt(ctx?.user?.branch_id, 0);

        const warehouseId =
          toInt(ctx?.warehouseId, 0) ||
          toInt(ctx?.warehouse?.id, 0);

        this.branch_id = branchId || null;
        this.warehouse_id = warehouseId || null;

        // si no viene warehouse, no rompemos acá: el backend la puede resolver
      } catch (e) {
        this.error = apiErrorMessage(e, "No se pudo cargar contexto POS");
        throw e;
      }
    },

    // =========================
    // Carrito
    // =========================
    clearCart() {
      this.cart = [];
    },

    _recalcLine(it) {
      const qty = toNum(it.qty, 0);
      const price = toNum(it.price, 0);
      it.subtotal = qty * price;
    },

    addToCart(product) {
      // product.available_qty = stock disponible (por depósito)
      const available = toNum(product?.available_qty, toNum(product?.qty, 0));

      // ✅ si no hay stock disponible, avisamos por UI
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
          name: String(product?.name || ""),
          sku: product?.sku || null,
          barcode: product?.barcode || null,
          image: product?.image || null,

          // ✅ campos clave
          qty: 1, // cantidad a vender (arranca en 1)
          available_qty: available, // stock disponible

          price, // precio unitario
          subtotal: 0,
        };

        this._recalcLine(it);
        this.cart.push(it);
        return;
      }

      // ya existe: intentamos sumar 1 pero sin pasar stock
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

    increaseQty(id) {
      const it = this.cart.find((x) => toInt(x.id, 0) === toInt(id, 0));
      if (!it) return;

      if (toNum(it.qty, 0) + 1 > toNum(it.available_qty, 0)) {
        this.toast = {
          show: true,
          text: `⚠️ Stock insuficiente. Disponible: ${toNum(it.available_qty, 0).toFixed(3)}`,
        };
        return;
      }

      it.qty = toNum(it.qty, 0) + 1;
      this._recalcLine(it);
    },

    decreaseQty(id) {
      const it = this.cart.find((x) => toInt(x.id, 0) === toInt(id, 0));
      if (!it) return;

      it.qty = Math.max(0, toNum(it.qty, 0) - 1);
      if (it.qty <= 0) {
        this.cart = this.cart.filter((x) => toInt(x.id, 0) !== toInt(id, 0));
        return;
      }

      this._recalcLine(it);
    },

    // =========================
    // Checkout
    // =========================
    async checkout(paymentMethod = "CASH") {
      this.loading = true;
      this.error = "";

      try {
        await this.ensureContext();

        if (!this.cart.length) {
          throw new Error("Carrito vacío");
        }

        // ✅ pre-validación local (evita 409)
        for (const it of this.cart) {
          if (toNum(it.qty, 0) <= 0) throw new Error("Cantidad inválida en carrito");
          if (toNum(it.price, 0) <= 0) throw new Error("Precio inválido en carrito");
          if (toNum(it.available_qty, 0) > 0 && toNum(it.qty, 0) > toNum(it.available_qty, 0)) {
            throw new Error(
              `Stock insuficiente para ${it.name}. Disponible: ${toNum(it.available_qty, 0).toFixed(3)}`
            );
          }
        }

        const payload = {
          customer_name: (this.customer?.name || "Consumidor Final").trim() || "Consumidor Final",

          // ✅ el backend resuelve branch/warehouse, pero lo mandamos igual para contexto
          branch_id: this.branch_id || undefined,
          warehouse_id: this.warehouse_id || undefined,

          items: this.cart.map((it) => ({
            product_id: toInt(it.id, 0),
            quantity: toNum(it.qty, 0),
            unit_price: toNum(it.price, 0),
          })),

          payments: [
            {
              method: String(paymentMethod || "CASH").toUpperCase(),
              amount: toNum(this.totalAmount, 0),
            },
          ],
        };

        const { data } = await http.post("/pos/sales", payload);

        // ok
        this.clearCart();
        this.toast = { show: true, text: "✅ Venta registrada correctamente" };
        return data;
      } catch (e) {
        // ✅ mostrar mensajes del backend (409 STOCK_INSUFFICIENT, etc.)
        const msg = apiErrorMessage(e, "Error al confirmar la venta");
        this.error = msg;

        // UX friendly
        if (e?.response?.status === 409) {
          this.toast = { show: true, text: `⚠️ ${msg}` };
        } else if (e?.response?.status === 403) {
          this.toast = { show: true, text: `⛔ ${msg}` };
        } else {
          this.toast = { show: true, text: `❌ ${msg}` };
        }

        throw e;
      } finally {
        this.loading = false;
      }
    },
  },
});
