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

// ===== localStorage keys =====
const LS_BRANCH = "pos_branch_id";
const LS_WAREHOUSE = "pos_warehouse_id";

// debug flag (podés activar con VITE_POS_DEBUG=true)
const POS_DEBUG =
  String(import.meta?.env?.VITE_POS_DEBUG ?? "").toLowerCase() === "true" ||
  import.meta?.env?.DEV;

function dbg(...args) {
  if (!POS_DEBUG) return;
  // eslint-disable-next-line no-console
  console.log("[POS_STORE]", ...args);
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
  } catch {
    // ignore
  }
}

async function fetchFirstWarehouseIdByBranch(branchId) {
  const bid = toInt(branchId, 0);
  if (!bid) return null;

  try {
    const { data } = await http.get("/warehouses", {
      params: { branch_id: bid, limit: 200 },
    });

    const list = data?.data?.items || data?.items || data?.data || [];
    const arr = Array.isArray(list) ? list : [];
    const sorted = [...arr].sort((a, b) => toInt(a?.id, 0) - toInt(b?.id, 0));
    const first = sorted[0];
    const wid = toInt(first?.id, 0);

    dbg("fetchFirstWarehouseIdByBranch OK", { branchId: bid, wid, first });

    return wid > 0 ? wid : null;
  } catch (e) {
    dbg("fetchFirstWarehouseIdByBranch FAIL", {
      branchId: bid,
      status: e?.response?.status,
      data: e?.response?.data,
      err: e?.message,
    });
    return null;
  }
}

export const usePosStore = defineStore("pos", {
  state: () => ({
    loading: false,
    error: "",

    // contexto POS
    branch_id: readLSInt(LS_BRANCH),
    warehouse_id: readLSInt(LS_WAREHOUSE),

    // cliente
    customer: { name: "Consumidor Final" },

    // carrito
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
    // =========================
    // Contexto POS
    // =========================
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

    /**
     * ✅ Contexto robusto para TODOS:
     * - lee /pos/context
     * - setea branch si viene
     * - setea warehouse si viene
     * - si NO viene warehouse, intenta resolver por sucursal (primer depósito)
     * - persiste en localStorage
     */
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
        const ctx = data?.data || {};

        const branchId =
          toInt(ctx?.branchId, 0) ||
          toInt(ctx?.branch?.id, 0) ||
          toInt(ctx?.user?.branch_id, 0);

        const warehouseId =
          toInt(ctx?.warehouseId, 0) ||
          toInt(ctx?.warehouse?.id, 0);

        dbg("ensureContext got /pos/context", { ctx, branchId, warehouseId });

        if (branchId > 0 && (force || toInt(this.branch_id, 0) <= 0)) {
          this.branch_id = branchId;
          writeLSInt(LS_BRANCH, branchId);
        }

        if (warehouseId > 0 && (force || toInt(this.warehouse_id, 0) <= 0)) {
          this.warehouse_id = warehouseId;
          writeLSInt(LS_WAREHOUSE, warehouseId);
        }

        // ✅ fallback si vino sin warehouse:
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
        dbg("ensureContext error", {
          msg: this.error,
          status: e?.response?.status,
          data: e?.response?.data,
          raw: e?.message,
        });
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
      const available = toNum(product?.available_qty, toNum(product?.qty, 0));

      dbg("addToCart", {
        id: product?.id,
        sku: product?.sku,
        available,
        warehouse_id: this.warehouse_id,
        branch_id: this.branch_id,
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

    /**
     * ✅ NUEVO nombre “real”
     * (y abajo dejamos alias checkout() para que JAMÁS vuelva a romper)
     */
    async checkoutSale(paymentMethod = "CASH") {
      this.loading = true;
      this.error = "";

      try {
        dbg("checkoutSale start", {
          paymentMethod,
          cartItems: this.cart.length,
          branch_id: this.branch_id,
          warehouse_id: this.warehouse_id,
        });

        await this.ensureContext();

        if (!this.cart.length) throw new Error("Carrito vacío");

        let wid = toInt(this.warehouse_id, 0);
        if (!wid) {
          dbg("checkoutSale: warehouse missing, force ensureContext...");
          await this.ensureContext({ force: true });
          wid = toInt(this.warehouse_id, 0);
        }

        if (!wid) {
          dbg("checkoutSale BLOCKED: warehouse missing", {
            branch_id: this.branch_id,
            warehouse_id: this.warehouse_id,
            ls_branch: readLSInt(LS_BRANCH),
            ls_warehouse: readLSInt(LS_WAREHOUSE),
          });
          throw new Error("No hay depósito seleccionado. Configurá warehouse_id en el POS.");
        }

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
          branch_id: toInt(this.branch_id, 0) || undefined,
          warehouse_id: wid,
          items: this.cart.map((it) => ({
            product_id: toInt(it.product_id, toInt(it.id, 0)),
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

        dbg("checkoutSale payload", payload);

        const { data } = await http.post("/pos/sales", payload);

        dbg("checkoutSale OK", data);

        this.clearCart();
        this.toast = { show: true, text: "✅ Venta registrada correctamente" };
        return data;
      } catch (e) {
        const msg = apiErrorMessage(e, "Error al confirmar la venta");
        this.error = msg;

        dbg("checkoutSale ERROR", {
          msg,
          status: e?.response?.status,
          data: e?.response?.data,
          err: e?.message,
        });

        if (e?.response?.status === 409) this.toast = { show: true, text: `⚠️ ${msg}` };
        else if (e?.response?.status === 403) this.toast = { show: true, text: `⛔ ${msg}` };
        else this.toast = { show: true, text: `❌ ${msg}` };

        throw e;
      } finally {
        this.loading = false;
      }
    },

    /**
     * ✅ ALIAS CRÍTICO:
     * Si el frontend llama posStore.checkout() y por HMR tenés versión vieja/nueva,
     * NO rompe más: siempre existe checkout().
     */
    async checkout(paymentMethod = "CASH") {
      return this.checkoutSale(paymentMethod);
    },
  },
});
