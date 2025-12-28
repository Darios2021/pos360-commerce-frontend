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
  } catch {}
}

async function fetchFirstWarehouseIdByBranch(branchId) {
  const bid = toInt(branchId, 0);
  if (!bid) return null;

  try {
    const { data } = await http.get("/warehouses", {
      params: { branch_id: bid, limit: 200 },
    });

    const list = data?.data?.items || data?.items || data?.data || data || [];
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

/* =========================
   ✅ HELPERS: Normalización para ticket
========================= */
function normalizeMethod(m) {
  return String(m || "").toUpperCase() || "CASH";
}

function buildSaleFromCart({ saleId, paymentMethod, extra, branch_id, warehouse_id, cart, totalAmount }) {
  const now = new Date();

  const items = (cart || []).map((it) => {
    const qty = toNum(it.qty, 0);
    const unit = toNum(it.price, 0);
    const sub = toNum(it.subtotal, qty * unit);

    return {
      // formatos “flexibles”
      name: String(it.name || ""),
      qty,
      quantity: qty,

      unit_price: unit,
      unitPrice: unit,
      price: unit,

      subtotal: sub,
      price_label: it.price_label || it.priceLabel || "",

      product_id: toInt(it.product_id, toInt(it.id, 0)),
      sku: it.sku || null,
      barcode: it.barcode || null,
    };
  });

  const total = toNum(totalAmount, 0);

  return {
    id: saleId || `LOCAL-${Date.now()}`,
    number: saleId || `LOCAL-${Date.now()}`,
    created_at: now,
    payment_method: normalizeMethod(paymentMethod),
    installments: toInt(extra?.installments, 1) || 1,
    proof: extra?.proof || null,
    customer: extra?.customer || null,

    branch_id: branch_id || null,
    warehouse_id: warehouse_id || null,

    items,
    subtotal: total,
    total,
    amount_total: total,
  };
}

function normalizeSaleShape(saleMaybe) {
  if (!saleMaybe || typeof saleMaybe !== "object") return null;

  // algunos backends devuelven {data:{...}} o {sale:{...}}
  const s = saleMaybe.sale || saleMaybe.data?.sale || saleMaybe.data || saleMaybe;

  if (!s || typeof s !== "object") return null;

  // items
  const rawItems = s.items || s.lines || s.sale_items || s.cart || [];
  const items = Array.isArray(rawItems) ? rawItems : [];

  // totales
  const total =
    toNum(s.total, 0) ||
    toNum(s.amount_total, 0) ||
    toNum(s.total_amount, 0) ||
    toNum(s.grand_total, 0) ||
    0;

  const subtotal =
    toNum(s.subtotal, 0) ||
    (items.length
      ? items.reduce((a, it) => {
          const qty = toNum(it.qty ?? it.quantity, 0);
          const unit = toNum(it.unit_price ?? it.price ?? it.unitPrice, 0);
          const sub = toNum(it.subtotal, qty * unit);
          return a + sub;
        }, 0)
      : 0);

  return {
    ...s,
    // “unifico” campos útiles para el ticket
    payment_method: normalizeMethod(s.payment_method || s.method || s.paymentMethod),
    installments: toInt(s.installments || s.cuotas, 1) || 1,
    proof: s.proof || s.payment_proof || s.proof_id || s.operation_id || null,

    items,
    subtotal: subtotal || subtotal === 0 ? subtotal : 0,
    total: total || subtotal || 0,
  };
}

async function fetchSaleDetailBestEffort(saleId) {
  const id = toInt(saleId, 0);
  if (!id) return null;

  const endpoints = [
    `/pos/sales/${id}`,
    `/sales/${id}`,
    `/pos/receipts/${id}`,
    `/receipts/${id}`,
  ];

  for (const url of endpoints) {
    try {
      const { data } = await http.get(url);
      const norm = normalizeSaleShape(data);
      if (norm) return norm;
    } catch (e) {
      dbg("fetchSaleDetailBestEffort miss", { url, status: e?.response?.status });
    }
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

    // ✅ último comprobante normalizado (opcional)
    last_sale: null,
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

    /**
     * ✅ Contexto robusto:
     * - llama /pos/context
     * - si isAdmin=true: NO fija warehouse default (lo limpia) para permitir ADMIN_ALL
     */
    async ensureContext({ force = false, isAdmin = false } = {}) {
      const currB = toInt(this.branch_id, 0);
      const currW = toInt(this.warehouse_id, 0);

      if (!force && currB > 0 && (isAdmin || currW > 0)) {
        dbg("ensureContext skip", { isAdmin, branch_id: currB, warehouse_id: currW });
        return;
      }

      try {
        dbg("ensureContext start", { force, isAdmin, currB, currW });

        const { data } = await http.get("/pos/context", {
          params: {
            branch_id: currB || undefined,
            // ✅ admin: NO mandar warehouse_id como hint
            warehouse_id: !isAdmin ? (currW || undefined) : undefined,
          },
        });

        const ctx = data?.data || data || {};

        const branchId =
          toInt(ctx?.branchId, 0) ||
          toInt(ctx?.branch_id, 0) ||
          toInt(ctx?.branch?.id, 0) ||
          toInt(ctx?.user?.branch_id, 0);

        const warehouseId =
          toInt(ctx?.warehouseId, 0) ||
          toInt(ctx?.warehouse_id, 0) ||
          toInt(ctx?.warehouse?.id, 0);

        dbg("ensureContext got /pos/context", { branchId, warehouseId, ctx });

        if (branchId > 0 && (force || toInt(this.branch_id, 0) <= 0)) {
          this.branch_id = branchId;
          writeLSInt(LS_BRANCH, branchId);
        }

        if (isAdmin) {
          // 🔥 clave: admin queda SIN warehouse
          this.warehouse_id = null;
          writeLSInt(LS_WAREHOUSE, null);
          dbg("ensureContext admin: warehouse cleared");
          return;
        }

        if (warehouseId > 0 && (force || toInt(this.warehouse_id, 0) <= 0)) {
          this.warehouse_id = warehouseId;
          writeLSInt(LS_WAREHOUSE, warehouseId);
        }

        // fallback: solo para no-admin
        if (toInt(this.branch_id, 0) > 0 && toInt(this.warehouse_id, 0) <= 0) {
          const wid = await fetchFirstWarehouseIdByBranch(this.branch_id);
          if (wid) {
            this.warehouse_id = wid;
            writeLSInt(LS_WAREHOUSE, wid);
            dbg("ensureContext fallback warehouse resolved", {
              branch_id: this.branch_id,
              warehouse_id: this.warehouse_id,
            });
          }
        }

        dbg("ensureContext done", {
          isAdmin,
          branch_id: this.branch_id,
          warehouse_id: this.warehouse_id,
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
        toNum(product?.price, 0) ||
        toNum(product?.price_list, 0) ||
        toNum(product?.price_discount, 0) ||
        toNum(product?.price_reseller, 0) ||
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
          image: product?.image || product?.image_url || null,
          qty: 1,
          available_qty: available,

          price,
          price_list: toNum(product?.price_list, 0),
          price_discount: toNum(product?.price_discount, 0),
          price_reseller: toNum(product?.price_reseller, 0),

          price_label: product?.price_label || "Precio",
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
    // Checkout (✅ ahora devuelve SALE “ticket-friendly” SIEMPRE)
    // =========================
    async checkoutSale(paymentMethod = "CASH", extra = {}) {
      this.loading = true;
      this.error = "";

      // ✅ snapshot del carrito ANTES de post (porque luego se limpia)
      const cartSnapshot = (this.cart || []).map((it) => ({ ...it }));
      const totalSnapshot = toNum(this.totalAmount, 0);

      try {
        // checkout siempre no-admin (requiere depósito)
        await this.ensureContext({ isAdmin: false });

        if (!this.cart.length) throw new Error("Carrito vacío");

        let wid = toInt(this.warehouse_id, 0);
        if (!wid) {
          await this.ensureContext({ force: true, isAdmin: false });
          wid = toInt(this.warehouse_id, 0);
        }
        if (!wid) throw new Error("No hay depósito seleccionado. Configurá warehouse_id en el POS.");

        const c = extra?.customer || {};
        const fullName = `${String(c.first_name || "").trim()} ${String(c.last_name || "").trim()}`.trim();
        const customer_name =
          (fullName || String(this.customer?.name || "").trim() || "Consumidor Final").trim() || "Consumidor Final";

        const payload = {
          customer_name,
          note: extra?.note || null,
          branch_id: toInt(this.branch_id, 0) || undefined,
          warehouse_id: wid,
          items: this.cart.map((it) => ({
            product_id: toInt(it.product_id, toInt(it.id, 0)),
            quantity: toNum(it.qty, 0),
            unit_price: toNum(it.price, 0),
          })),
          payments: [
            {
              method: normalizeMethod(paymentMethod),
              amount: toNum(this.totalAmount, 0),
              reference: extra?.proof || null,
              note: extra?.price_policy
                ? `price_policy=${extra.price_policy}${extra?.installments ? `; installments=${extra.installments}` : ""}`
                : null,
            },
          ],
        };

        const { data } = await http.post("/pos/sales", payload);

        dbg("checkoutSale POST /pos/sales resp", data);

        // 1) intento normalizar lo que vino
        let sale = normalizeSaleShape(data);

        // 2) saco id como pueda
        const saleId =
          toInt(sale?.id, 0) ||
          toInt(sale?.sale_id, 0) ||
          toInt(data?.sale_id, 0) ||
          toInt(data?.data?.sale_id, 0) ||
          toInt(data?.id, 0) ||
          toInt(data?.data?.id, 0) ||
          0;

        // 3) si no vino con items/totales, intento traer detalle
        const needDetails = !sale || !Array.isArray(sale.items) || sale.items.length === 0 || toNum(sale.total, 0) <= 0;
        if (needDetails && saleId > 0) {
          const full = await fetchSaleDetailBestEffort(saleId);
          if (full) sale = full;
        }

        // 4) último fallback: construyo “sale” desde el carrito snapshot (SIEMPRE muestra items/total)
        if (!sale || !Array.isArray(sale.items) || sale.items.length === 0) {
          sale = buildSaleFromCart({
            saleId: saleId || null,
            paymentMethod,
            extra,
            branch_id: toInt(this.branch_id, 0) || null,
            warehouse_id: wid || null,
            cart: cartSnapshot,
            totalAmount: totalSnapshot,
          });
        } else {
          // aseguro totales si vinieron vacíos
          if (toNum(sale.total, 0) <= 0) sale.total = totalSnapshot;
          if (toNum(sale.subtotal, 0) <= 0) sale.subtotal = totalSnapshot;
        }

        // ✅ guardo el último comprobante para que el UI lo tome
        this.last_sale = sale;

        // ✅ recién ahora limpio carrito
        this.clearCart();

        this.toast = { show: true, text: "✅ Venta registrada correctamente" };

        // ✅ retorno “ticket-friendly”
        return { ok: true, sale, raw: data };
      } catch (e) {
        const msg = apiErrorMessage(e, "Error al confirmar la venta");
        this.error = msg;

        if (e?.response?.status === 409) this.toast = { show: true, text: `⚠️ ${msg}` };
        else if (e?.response?.status === 403) this.toast = { show: true, text: `⛔ ${msg}` };
        else this.toast = { show: true, text: `❌ ${msg}` };

        throw e;
      } finally {
        this.loading = false;
      }
    },

    async checkout(paymentMethod = "CASH", extra = {}) {
      return this.checkoutSale(paymentMethod, extra);
    },
  },
});
