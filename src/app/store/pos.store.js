// ✅ COPY-PASTE FINAL COMPLETO
// src/app/store/pos.store.js
//
// ✅ Ajustado a tu DB REAL:
// payments.method enum: CASH, TRANSFER, CARD, QR, MERCADOPAGO, CREDIT_SJT, OTHER
//
// ✅ Reglas:
// - Crédito San Juan => enviar method "credit_sjt" (alias) O "CREDIT_SJT" (si querés)
//   (backend lo normaliza y guarda method=CREDIT_SJT + reference=SJCREDIT)
// - MercadoPago => method "MERCADOPAGO"
// - Cuotas (installments 1..12) SOLO en CARD (si NO es débito) o en Crédito San Juan
// - Para débito: mandar card_kind="DEBIT" (installments queda 1)

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
   ✅ HELPERS: Normalización backend + providers
========================= */

/**
 * ✅ IMPORTANTE:
 * - DB enum Payment.method (backend):
 *   CASH / TRANSFER / CARD / QR / MERCADOPAGO / CREDIT_SJT / OTHER
 *
 * - Para Crédito San Juan, enviá method="credit_sjt" (recomendado)
 *   (backend lo normaliza y persiste CREDIT_SJT + reference=SJCREDIT)
 */
function normalizeMethod(m) {
  const raw = String(m || "").trim();
  const up = raw.toUpperCase();

  // ✅ San Juan Crédito (alias -> "credit_sjt")
  if (
    raw === "credit_sjt" ||
    up === "CREDIT_SJT" ||
    up === "SJCREDIT" ||
    up === "SJ_CREDITO" ||
    up === "SJ CREDITO" ||
    up === "SANJUANCREDITO" ||
    up === "SAN JUAN CREDITO" ||
    up === "SAN JUAN CRÉDITO"
  ) {
    return "credit_sjt";
  }

  // ✅ MercadoPago => enum real
  if (
    up === "MERCADOPAGO" ||
    up === "MERCADO_PAGO" ||
    up === "MERCADO PAGO" ||
    up === "MP" ||
    up === "QR_MP" ||
    up === "QRMERCADOPAGO"
  ) {
    return "MERCADOPAGO";
  }

  // ✅ QR genérico
  if (up === "QR") return "QR";

  // ✅ alias -> CARD
  if (
    up === "DEBIT" ||
    up === "DEBITO" ||
    up === "DÉBITO" ||
    up === "TARJETA" ||
    up === "CREDIT" ||
    up === "CREDITO" ||
    up === "CRÉDITO"
  ) {
    return "CARD";
  }

  // ✅ español -> enums
  if (up === "EFECTIVO") return "CASH";
  if (up === "TRANSFERENCIA") return "TRANSFER";

  // ✅ enums aceptados por backend
  if (up === "CASH" || up === "CARD" || up === "TRANSFER" || up === "QR" || up === "MERCADOPAGO" || up === "CREDIT_SJT" || up === "OTHER")
    return up;

  return "OTHER";
}

/**
 * ✅ FIX CLAVE:
 * a veces el composable puede llamar checkout("CASH", extra)
 * pero el método real está en extra.payment_method (emit del dialog).
 * Priorizamos SIEMPRE extra.* por sobre el parámetro.
 */
function pickPaymentMethodForApi(paymentMethodParam, extra) {
  const ex = extra && typeof extra === "object" ? extra : {};

  // ✅ prioridad extra.*
  const candidate =
    ex.payment_method ||
    ex.paymentMethod ||
    ex.method ||
    ex.pay_method ||
    ex.payMethod ||
    paymentMethodParam;

  // ✅ FIX: si por algún motivo llega OTHER pero reference marca SJ Crédito
  const ref = String(ex.reference || ex.ref || "").trim().toUpperCase();
  if (ref === "SJCREDIT" || ref === "SJ_CREDIT" || ref === "SANJUANCREDITO") return "credit_sjt";

  return normalizeMethod(candidate);
}
/**
 * Para UI/chips de “Pago”
 */
export function paymentMethodLabel(m) {
  const raw = String(m || "").trim();
  const up = raw.toUpperCase();
  if (raw === "credit_sjt" || up === "CREDIT_SJT" || up === "SJCREDIT") return "San Juan Crédito";
  if (up === "CASH") return "Efectivo";
  if (up === "CARD") return "Tarjeta";
  if (up === "TRANSFER") return "Transferencia";
  if (up === "QR") return "QR";
  if (up === "MERCADOPAGO") return "Mercado Pago";
  if (up === "OTHER") return "Otro";
  return raw || "—";
}

function buildSaleFromCart({ saleId, paymentMethod, extra, branch_id, warehouse_id, cart, totalAmount }) {
  const now = new Date();

  const items = (cart || []).map((it) => {
    const qty = toNum(it.qty, 0);
    const unit = toNum(it.price, 0);
    const sub = toNum(it.subtotal, qty * unit);

    return {
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
      image: it.image || it.image_url || null,
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

  const s = saleMaybe.sale || saleMaybe.data?.sale || saleMaybe.data || saleMaybe;
  if (!s || typeof s !== "object") return null;

  const rawItems = s.items || s.lines || s.sale_items || s.cart || [];
  const items = Array.isArray(rawItems) ? rawItems : [];

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

    async ensureContext({ force = false, isAdmin = false } = {}) {
      const currB = toInt(this.branch_id, 0);
      const currW = toInt(this.warehouse_id, 0);

      // ✅ Para POS “normal” exigimos warehouse; para admin permitimos operar sin warehouse
      if (!force && currB > 0 && (isAdmin || currW > 0)) {
        dbg("ensureContext skip", { isAdmin, branch_id: currB, warehouse_id: currW });
        return;
      }

      try {
        dbg("ensureContext start", { force, isAdmin, currB, currW });

        const { data } = await http.get("/pos/context", {
          params: {
            branch_id: currB || undefined,
            // ✅ admin: no forzamos warehouse
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
          this.warehouse_id = null;
          writeLSInt(LS_WAREHOUSE, null);
          dbg("ensureContext admin: warehouse cleared");
          return;
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
    // Checkout
    // =========================
    async checkoutSale(paymentMethod = "CASH", extra = {}) {
      this.loading = true;
      this.error = "";

      const cartSnapshot = (this.cart || []).map((it) => ({ ...it }));
      const totalSnapshot = toNum(this.totalAmount, 0);

      function logPayload(label, payload) {
        try {
          // eslint-disable-next-line no-console
          console.log(`[POS_STORE] ${label}`, JSON.parse(JSON.stringify(payload)));
        } catch {
          // eslint-disable-next-line no-console
          console.log(`[POS_STORE] ${label}`, payload);
        }
      }

      function logApiError(e) {
        try {
          // eslint-disable-next-line no-console
          console.log("[POS_STORE] API ERROR status:", e?.response?.status);
          // eslint-disable-next-line no-console
          console.log("[POS_STORE] API ERROR data:", e?.response?.data);
        } catch {}
      }

      try {
        await this.ensureContext({ isAdmin: false });

        if (!this.cart.length) throw new Error("Carrito vacío");

        let wid = toInt(this.warehouse_id, 0);
        if (!wid) {
          await this.ensureContext({ force: true, isAdmin: false });
          wid = toInt(this.warehouse_id, 0);
        }
        if (!wid) throw new Error("No hay depósito seleccionado. Configurá warehouse_id en el POS.");

        const ex = extra && typeof extra === "object" ? extra : {};

        const c = ex?.customer || {};
        const fullName = `${String(c.first_name || "").trim()} ${String(c.last_name || "").trim()}`.trim();
        const customer_name =
          (fullName || String(this.customer?.name || "").trim() || "Consumidor Final").trim() || "Consumidor Final";

        const items = (this.cart || [])
          .map((it) => {
            const product_id = toInt(it.product_id, toInt(it.id, 0));
            const qty = toNum(it.qty, 0);
            const unit_price = toNum(it.price, 0);

            return {
              product_id,
              quantity: qty,
              qty,
              unit_price,
              unitPrice: unit_price,
              price: unit_price,
            };
          })
          .filter((x) => toInt(x.product_id, 0) > 0 && toNum(x.quantity, 0) > 0 && toNum(x.unit_price, 0) > 0);

        if (!items.length) throw new Error("Carrito inválido (items vacíos o sin precio/cantidad).");

        const amount = toNum(this.totalAmount, 0);
        const bid = toInt(this.branch_id, 0) || null;

        // ✅ FIX: método real SIEMPRE desde extra.payment_method primero
        const methodForApi = pickPaymentMethodForApi(paymentMethod, ex);

        // ✅ cuotas / meta
        let installments = toInt(ex?.installments, 1) || 1;
        installments = Math.max(1, Math.min(12, installments));

        const total_list = toNum(ex?.total_list, 0) || null;
        const per_installment_list = toNum(ex?.per_installment_list, 0) || null;

        // ✅ card_kind (para detectar débito)
        const card_kind = String(ex?.card_kind || ex?.cardKind || "").trim().toUpperCase() || null;

        const isCreditSjt = methodForApi === "credit_sjt" || methodForApi === "CREDIT_SJT";
        const isCard = methodForApi === "CARD";

        // 🔒 Débito: forzamos contado
        const isDebit =
          card_kind === "DEBIT" ||
          card_kind === "DEBITO" ||
          card_kind === "DÉBITO" ||
          ex?.is_debit === true ||
          ex?.isDebit === true;

        if (isDebit && isCard) installments = 1;

        // ✅ policy: cuotas usan LIST
        const price_basis = (isCreditSjt || (isCard && installments > 1 && !isDebit)) ? "LIST" : null;

        const payload = {
          customer_name,
          note: ex?.note || null,

          branch_id: bid,
          warehouse_id: wid,

          branchId: bid,
          warehouseId: wid,

          items,

          payments: [
            {
              // ✅ CLAVE: SJ Crédito mandamos "credit_sjt"
              method: isCreditSjt ? "credit_sjt" : methodForApi,
              amount,
             reference: ex?.reference || ex?.proof || null,
            proof: ex?.proof || null,

              installments,
              price_basis,
              total_list,
              per_installment_list,

              card_kind: isCard ? (isDebit ? "DEBIT" : card_kind || "CREDIT") : null,

              note: ex?.price_policy
                ? `price_policy=${ex.price_policy}${installments ? `; installments=${installments}` : ""}`
                : null,
            },
          ],
        };

        dbg("checkoutSale payload ready", {
          bid,
          wid,
          items: items.length,
          amount,
          paymentMethodParam: paymentMethod,
          paymentMethodExtra: ex?.payment_method,
          methodForApi,
          installments,
          price_basis,
          card_kind,
        });
        logPayload("POST /pos/sales payload =>", payload);

        const { data } = await http.post("/pos/sales", payload);

        dbg("checkoutSale POST /pos/sales resp", data);

        let sale = normalizeSaleShape(data);

        const saleId =
          toInt(sale?.id, 0) ||
          toInt(sale?.sale_id, 0) ||
          toInt(data?.sale_id, 0) ||
          toInt(data?.data?.sale_id, 0) ||
          toInt(data?.id, 0) ||
          toInt(data?.data?.id, 0) ||
          0;

        const needDetails =
          !sale || !Array.isArray(sale.items) || sale.items.length === 0 || toNum(sale.total, 0) <= 0;

        if (needDetails && saleId > 0) {
          const full = await fetchSaleDetailBestEffort(saleId);
          if (full) sale = full;
        }

        if (!sale || !Array.isArray(sale.items) || sale.items.length === 0) {
          sale = buildSaleFromCart({
            saleId: saleId || null,
            paymentMethod: methodForApi,
            extra: ex,
            branch_id: bid,
            warehouse_id: wid || null,
            cart: cartSnapshot,
            totalAmount: totalSnapshot,
          });
        } else {
          if (toNum(sale.total, 0) <= 0) sale.total = totalSnapshot;
          if (toNum(sale.subtotal, 0) <= 0) sale.subtotal = totalSnapshot;
        }

        // ✅ guardamos para ticket (y UI)
        sale.payment_method = methodForApi;
        sale.installments = installments;

        this.last_sale = sale;
        this.clearCart();

        this.toast = { show: true, text: "✅ Venta registrada correctamente" };

        return { ok: true, sale, raw: data };
      } catch (e) {
        logApiError(e);

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