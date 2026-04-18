// ✅ COPY-PASTE FINAL COMPLETO
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
   Helpers pago
========================= */
function normalizeMethod(m) {
  const raw = String(m || "").trim();
  const up = raw.toUpperCase();

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

  if (up === "QR") return "QR";

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

  if (up === "EFECTIVO") return "CASH";
  if (up === "TRANSFERENCIA") return "TRANSFER";

  if (
    up === "CASH" ||
    up === "CARD" ||
    up === "TRANSFER" ||
    up === "QR" ||
    up === "MERCADOPAGO" ||
    up === "CREDIT_SJT" ||
    up === "OTHER"
  ) {
    return up;
  }

  return "OTHER";
}

function pickPaymentMethodForApi(paymentMethodParam, extra) {
  const ex = extra && typeof extra === "object" ? extra : {};

  const candidate =
    ex.payment_method ||
    ex.paymentMethod ||
    ex.method ||
    ex.pay_method ||
    ex.payMethod ||
    paymentMethodParam;

  const ref = String(ex.reference || ex.ref || "").trim().toUpperCase();
  if (ref === "SJCREDIT" || ref === "SJ_CREDIT" || ref === "SANJUANCREDITO") {
    return "credit_sjt";
  }

  return normalizeMethod(candidate);
}

function toBackendPaymentMethod(method) {
  const m = String(method || "").trim();

  // San Juan Crédito al backend viaja como OTHER + reference=SJCREDIT
  if (m === "credit_sjt" || m.toUpperCase() === "CREDIT_SJT") {
    return "OTHER";
  }

  return normalizeMethod(m);
}

/* =========================
   Snapshot cliente
========================= */
function pickFirst(...vals) {
  for (const v of vals) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return "";
}

function normalizeDigitsPhone(v) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  return s.replace(/[^\d+]/g, "");
}

function normalizeCustomerSnapshot(extra = {}, storeCustomer = {}) {
  const ex = extra && typeof extra === "object" ? extra : {};
  const c = ex.customer && typeof ex.customer === "object" ? ex.customer : {};
  const sc = storeCustomer && typeof storeCustomer === "object" ? storeCustomer : {};

  const first_name = pickFirst(
    c.first_name,
    c.firstname,
    c.firstName,
    c.nombre,
    sc.first_name,
    sc.firstname,
    sc.firstName,
    sc.nombre
  );

  const last_name = pickFirst(
    c.last_name,
    c.lastname,
    c.lastName,
    c.apellido,
    sc.last_name,
    sc.lastname,
    sc.lastName,
    sc.apellido
  );

  const fullName = first_name || last_name ? `${first_name} ${last_name}`.trim() : "";

  const customer_name =
    pickFirst(
      ex.customer_name,
      c.customer_name,
      c.name,
      c.full_name,
      c.fullName,
      c.razon_social,
      c.razonSocial,
      fullName,
      sc.customer_name,
      sc.name,
      sc.full_name,
      sc.fullName,
      sc.razon_social,
      sc.razonSocial,
      "Consumidor Final"
    ).trim() || "Consumidor Final";

  const customer_doc = pickFirst(
    ex.customer_doc,
    c.customer_doc,
    c.doc,
    c.dni,
    c.cuit,
    c.cuil,
    c.document,
    c.documento,
    sc.customer_doc,
    sc.doc,
    sc.dni,
    sc.cuit,
    sc.cuil,
    sc.document,
    sc.documento
  ).trim();

  const customer_phone_raw = pickFirst(
    ex.customer_phone,
    c.customer_phone,
    c.phone,
    c.tel,
    c.telefono,
    c.celular,
    c.mobile,
    c.whatsapp,
    c.wa,
    sc.customer_phone,
    sc.phone,
    sc.tel,
    sc.telefono,
    sc.celular,
    sc.mobile,
    sc.whatsapp,
    sc.wa
  );

  const customer_phone = normalizeDigitsPhone(customer_phone_raw);

  const customer_email = pickFirst(
    ex.customer_email,
    c.customer_email,
    c.email,
    sc.customer_email,
    sc.email
  ).trim();

  return {
    customer_name,
    customer_doc: customer_doc || null,
    customer_phone: customer_phone || null,
    customer_email: customer_email || null,
  };
}

function normalizeInvoiceMode(v) {
  const s = String(v ?? "").trim().toUpperCase();

  if (!s) return "NO_FISCAL";
  if (["NO_FISCAL", "FISCAL", "MIXED", "TICKET_ONLY"].includes(s)) return s;

  return "NO_FISCAL";
}

function normalizeInvoiceType(v) {
  const s = String(v ?? "").trim().toUpperCase();

  if (!s) return "TICKET";
  if (["TICKET", "A", "B", "C", "M", "NC", "ND", "OTHER"].includes(s)) return s;

  return "TICKET";
}

function normalizeInvoiceTypeByMode(mode, type) {
  const finalMode = normalizeInvoiceMode(mode);
  const finalType = normalizeInvoiceType(type);

  if (finalMode === "NO_FISCAL" || finalMode === "TICKET_ONLY") {
    return "TICKET";
  }

  if (finalType === "TICKET") return "B";
  return finalType || "B";
}

function normalizeCustomerType(v) {
  const s = String(v ?? "").trim().toUpperCase();

  if (!s) return "FINAL_CONSUMER";
  if (s === "CONSUMIDOR_FINAL") return "FINAL_CONSUMER";
  if (s === "FINAL_CONSUMER") return "FINAL_CONSUMER";

  if (
    s === "RESPONSABLE_INSCRIPTO" ||
    s === "MONOTRIBUTO" ||
    s === "REGISTERED"
  ) {
    return "REGISTERED";
  }

  if (s === "WALK_IN") return "WALK_IN";
  if (s === "COMPANY") return "COMPANY";
  if (s === "OTHER") return "OTHER";

  return "FINAL_CONSUMER";
}

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

function buildSaleFromCart({
  saleId,
  paymentMethod,
  extra,
  branch_id,
  warehouse_id,
  cart,
  totalAmount,
  payments = [],
}) {
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
    payments,
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

/* =========================
   Helpers payload moderno
========================= */
function isModernSalePayload(input) {
  return !!(
    input &&
    typeof input === "object" &&
    !Array.isArray(input) &&
    (
      Array.isArray(input.items) ||
      Array.isArray(input.payments) ||
      input.cash_register_id !== undefined ||
      input.invoice_mode !== undefined ||
      input.invoice_type !== undefined ||
      input.customer_type !== undefined ||
      input.extra !== undefined
    )
  );
}

function normalizeSaleItemsForApi(inputItems = [], cartFallback = []) {
  const source = Array.isArray(inputItems) && inputItems.length ? inputItems : cartFallback;

  return source
    .map((it) => {
      const product_id = toInt(it.product_id, toInt(it.id, 0));
      const quantity = toNum(it.quantity ?? it.qty, 0);
      const unit_price = toNum(it.unit_price ?? it.unitPrice ?? it.price, 0);

      return {
        product_id,
        quantity,
        qty: quantity,
        unit_price,
        unitPrice: unit_price,
        price: unit_price,
      };
    })
    .filter((x) => toInt(x.product_id, 0) > 0 && toNum(x.quantity, 0) > 0 && toNum(x.unit_price, 0) > 0);
}

function normalizeSingleLegacyPayment({
  paymentMethod,
  extra,
  amount,
  customer,
}) {
  const ex = extra && typeof extra === "object" ? extra : {};

  const methodForApiRaw = pickPaymentMethodForApi(paymentMethod, ex);
  const isCreditSjt =
    methodForApiRaw === "credit_sjt" || methodForApiRaw === "CREDIT_SJT";

  const methodForApi = toBackendPaymentMethod(methodForApiRaw);
  const isCard = methodForApi === "CARD";

  let installments = toInt(ex?.installments, 1) || 1;
  const card_kind_raw = String(ex?.card_kind || ex?.cardKind || "").trim().toUpperCase() || null;

  const isDebit =
    card_kind_raw === "DEBIT" ||
    card_kind_raw === "DEBITO" ||
    card_kind_raw === "DÉBITO" ||
    ex?.is_debit === true ||
    ex?.isDebit === true;

  if (isCard && isDebit) installments = 1;

  if (isCreditSjt || (isCard && !isDebit)) {
    installments = Math.max(1, Math.min(12, installments));
  } else {
    installments = 1;
  }

  const total_list = toNum(ex?.total_list, 0) || null;
  const per_installment_list = toNum(ex?.per_installment_list, 0) || null;
  const price_basis = isCreditSjt || (isCard && installments > 1 && !isDebit) ? "LIST" : null;

  let referenceTop =
    ex?.reference ||
    ex?.ref ||
    ex?.proof ||
    null;

  if (isCreditSjt && !referenceTop) {
    referenceTop = "SJCREDIT";
  }

  return {
    method: methodForApi,
    amount,
    reference: referenceTop,
    proof: ex?.proof || null,
    installments,
    price_basis,
    total_list,
    per_installment_list,
    card_kind: isCard
      ? (isDebit ? "DEBIT" : card_kind_raw || "CREDIT")
      : (isCreditSjt ? "CREDIT" : null),
    customer_name: customer.customer_name,
    customer_doc: customer.customer_doc,
    customer_phone: customer.customer_phone,
    note: ex?.price_policy
      ? `price_policy=${ex.price_policy}${installments ? `; installments=${installments}` : ""}`
      : (ex?.note || null),
  };
}

function normalizePaymentRowForApi(row, fallbackCustomer) {
  const p = row && typeof row === "object" ? row : {};
  const payment_method_id = toInt(p.payment_method_id ?? p.paymentMethodId, 0) || null;

  const rawMethod = pickFirst(
    p.method,
    p.payment_method,
    p.paymentMethod,
    p.kind,
    p.provider_code
  );

  const rawReference = pickFirst(
    p.reference,
    p.ref,
    p.proof
  );

  const methodForApiRaw = rawMethod ? normalizeMethod(rawMethod) : "";
  const inferredMethod = rawReference &&
    ["SJCREDIT", "SJ_CREDIT", "SANJUANCREDITO"].includes(String(rawReference).trim().toUpperCase())
    ? "credit_sjt"
    : methodForApiRaw;

  const finalRawMethod = inferredMethod || rawMethod || "";
  const finalMethod = finalRawMethod ? toBackendPaymentMethod(finalRawMethod) : null;

  const amount = toNum(p.amount, 0);
  const installments = Math.max(1, toInt(p.installments, 1) || 1);

  const card_kind = p.card_kind == null
    ? null
    : String(p.card_kind).trim().toUpperCase() || null;

  return {
    payment_method_id,
    ...(finalMethod ? { method: finalMethod } : {}),
    amount,
    reference: rawReference || null,
    proof: p.proof || null,
    installments,
    price_basis: p.price_basis || p.priceBasis || null,
    total_list: p.total_list ?? p.totalList ?? null,
    per_installment_list:
      p.per_installment_list ?? p.perInstallmentList ?? null,
    card_kind,
    customer_name: p.customer_name || fallbackCustomer.customer_name,
    customer_doc: p.customer_doc || fallbackCustomer.customer_doc,
    customer_phone: p.customer_phone || fallbackCustomer.customer_phone,
    note: p.note || null,
  };
}

function sumPayments(payments = []) {
  return (payments || []).reduce((acc, p) => acc + toNum(p?.amount, 0), 0);
}

export const usePosStore = defineStore("pos", {
  state: () => ({
    loading: false,
    error: "",
    branch_id: readLSInt(LS_BRANCH),
    warehouse_id: readLSInt(LS_WAREHOUSE),
    customer: null,
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

    setCustomer(payload) {
      this.customer = payload && typeof payload === "object" ? { ...payload } : null;
      dbg("setCustomer", this.customer);
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

      if (!force && currB > 0 && (isAdmin || currW > 0)) {
        dbg("ensureContext skip", { isAdmin, branch_id: currB, warehouse_id: currW });
        return;
      }

      try {
        dbg("ensureContext start", { force, isAdmin, currB, currW });

        const { data } = await http.get("/pos/context", {
          params: {
            branch_id: currB || undefined,
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

        if (branchId > 0 && (force || toInt(this.branch_id, 0) <= 0)) {
          this.branch_id = branchId;
          writeLSInt(LS_BRANCH, branchId);
        }

        if (isAdmin) {
          this.warehouse_id = null;
          writeLSInt(LS_WAREHOUSE, null);
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
          }
        }
      } catch (e) {
        this.error = apiErrorMessage(e, "No se pudo cargar contexto POS");
        throw e;
      }
    },

    clearCart() {
      this.cart = [];
    },

    _recalcLine(it) {
      const qty = toNum(it.qty, 0);
      const price = toNum(it.price_discount, 0) || toNum(it.price, 0);
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

    async checkoutSale(paymentMethod = "CASH", extra = {}) {
      this.loading = true;
      this.error = "";

      const cartSnapshot = (this.cart || []).map((it) => ({ ...it }));
      const totalSnapshot = toNum(this.totalAmount, 0);

      try {
        await this.ensureContext({ isAdmin: false });

        if (!this.cart.length) throw new Error("Carrito vacío");

        let wid = toInt(this.warehouse_id, 0);
        if (!wid) {
          await this.ensureContext({ force: true, isAdmin: false });
          wid = toInt(this.warehouse_id, 0);
        }
        if (!wid) throw new Error("No hay depósito seleccionado. Configurá warehouse_id en el POS.");

        const modernMode = isModernSalePayload(paymentMethod);
        const incoming = modernMode ? paymentMethod : null;
        const ex = modernMode
          ? (incoming?.extra && typeof incoming.extra === "object" ? incoming.extra : {})
          : (extra && typeof extra === "object" ? extra : {});

        const snap = normalizeCustomerSnapshot(
          {
            ...ex,
            customer_name: modernMode ? (incoming?.customer_name ?? ex.customer_name) : ex.customer_name,
            customer_doc: modernMode ? (incoming?.customer_doc ?? ex.customer_doc) : ex.customer_doc,
            customer_phone: modernMode ? (incoming?.customer_phone ?? ex.customer_phone) : ex.customer_phone,
            customer_email: modernMode ? (incoming?.customer_email ?? ex.customer_email) : ex.customer_email,
          },
          this.customer
        );

        const items = normalizeSaleItemsForApi(
          modernMode ? incoming?.items : null,
          this.cart || []
        );

        if (!items.length) {
          throw new Error("Carrito inválido (items vacíos o sin precio/cantidad).");
        }

        const bid =
          toInt(
            modernMode
              ? (incoming?.branch_id ?? incoming?.branchId ?? this.branch_id)
              : this.branch_id,
            0
          ) || null;

        const warehouseIdFinal =
          toInt(
            modernMode
              ? (incoming?.warehouse_id ?? incoming?.warehouseId ?? wid)
              : wid,
            0
          ) || null;

        const amount =
          toNum(
            modernMode
              ? (
                  incoming?.total ??
                  incoming?.paid_total ??
                  incoming?.subtotal ??
                  items.reduce((acc, it) => acc + toNum(it.quantity, 0) * toNum(it.unit_price, 0), 0)
                )
              : this.totalAmount,
            0
          );

        let payments = [];

        if (modernMode && Array.isArray(incoming?.payments) && incoming.payments.length) {
          payments = incoming.payments
            .map((row) => normalizePaymentRowForApi(row, snap))
            .filter((p) => toNum(p.amount, 0) > 0);
        } else {
          payments = [
            normalizeSingleLegacyPayment({
              paymentMethod,
              extra: ex,
              amount,
              customer: snap,
            }),
          ];
        }

        if (!payments.length) {
          throw new Error("No hay pagos válidos para registrar.");
        }

        const paymentsTotal = sumPayments(payments);
        const effectiveTotal = amount > 0 ? amount : paymentsTotal;

        const cashRegisterId =
          toInt(
            modernMode
              ? (incoming?.cash_register_id ?? incoming?.cashRegisterId ?? ex?.cash_register_id)
              : ex?.cash_register_id,
            0
          ) || null;

        const firstPaymentMethod = payments.length === 1
          ? (payments[0]?.method || null)
          : null;

        // ✅ FIX CLAVE:
        // mandar invoice_mode / invoice_type / customer_type
        // también a nivel TOP-LEVEL, no sólo en extra
        const invoiceMode =
          modernMode
            ? normalizeInvoiceMode(incoming?.invoice_mode ?? incoming?.extra?.invoice_mode ?? ex?.invoice_mode)
            : normalizeInvoiceMode(ex?.invoice_mode);

        const invoiceType =
          modernMode
            ? normalizeInvoiceTypeByMode(
                invoiceMode,
                incoming?.invoice_type ?? incoming?.extra?.invoice_type ?? ex?.invoice_type
              )
            : normalizeInvoiceTypeByMode(invoiceMode, ex?.invoice_type);

        const customerType =
          modernMode
            ? normalizeCustomerType(
                incoming?.customer_type ?? incoming?.extra?.customer_type ?? ex?.customer_type
              )
            : normalizeCustomerType(ex?.customer_type);

        const payload = {
          customer_name: snap.customer_name,
          customer_doc: snap.customer_doc,
          customer_phone: snap.customer_phone,
          customer_email: snap.customer_email,

          payment_method: firstPaymentMethod,
          method: firstPaymentMethod,

          installments:
            payments.length === 1
              ? Math.max(1, toInt(payments[0]?.installments, 1) || 1)
              : 1,

          reference:
            payments.length === 1
              ? (payments[0]?.reference || null)
              : null,

          card_kind:
            payments.length === 1
              ? (payments[0]?.card_kind || null)
              : null,

          note: modernMode ? (incoming?.note || null) : (ex?.note || null),

          branch_id: bid,
          warehouse_id: warehouseIdFinal,
          branchId: bid,
          warehouseId: warehouseIdFinal,

          cash_register_id: cashRegisterId,

          // ✅ TOP-LEVEL fiscales
          invoice_mode: invoiceMode,
          invoice_type: invoiceType,
          customer_type: customerType,

          items,
          payments,

          extra: {
            ...(ex || {}),
            ...(modernMode && incoming?.extra && typeof incoming.extra === "object" ? incoming.extra : {}),
            invoice_mode: invoiceMode,
            invoice_type: invoiceType,
            customer_type: customerType,
            mixed_mode:
              modernMode
                ? (incoming?.extra?.mixed_mode ?? ex?.mixed_mode ?? payments.length > 1)
                : (ex?.mixed_mode ?? payments.length > 1),
            customer: {
              ...(ex?.customer || {}),
              ...(modernMode && incoming?.extra?.customer ? incoming.extra.customer : {}),
              name: snap.customer_name,
              doc: snap.customer_doc,
              phone: snap.customer_phone,
              email: snap.customer_email,
            },
          },
        };

        console.log("[POS_STORE] store.customer =>", this.customer);
        console.log("[POS_STORE] checkout modernMode =>", modernMode);
        console.log("[POS_STORE] checkout extra =>", ex);
        console.log("[POS_STORE] customer snapshot =>", snap);
        console.log("[POS_STORE] normalized fiscal =>", {
          invoice_mode: invoiceMode,
          invoice_type: invoiceType,
          customer_type: customerType,
        });
        console.log("[POS_STORE] POST /pos/sales payload =>", JSON.parse(JSON.stringify(payload)));

        const { data } = await http.post("/pos/sales", payload);

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
            paymentMethod:
              payments.length === 1
                ? payments[0]?.method || "OTHER"
                : "OTHER",
            extra: payload.extra || {},
            branch_id: bid,
            warehouse_id: warehouseIdFinal || null,
            cart: cartSnapshot,
            totalAmount: effectiveTotal || totalSnapshot,
            payments,
          });
        } else {
          if (toNum(sale.total, 0) <= 0) sale.total = effectiveTotal || totalSnapshot;
          if (toNum(sale.subtotal, 0) <= 0) sale.subtotal = effectiveTotal || totalSnapshot;
          if (!Array.isArray(sale.payments) || !sale.payments.length) sale.payments = payments;
        }

        sale.payment_method =
          payments.length === 1
            ? (payments[0]?.method || "OTHER")
            : "OTHER";

        sale.installments =
          payments.length === 1
            ? Math.max(1, toInt(payments[0]?.installments, 1) || 1)
            : 1;

        sale.customer_name = snap.customer_name;
        sale.customer_doc = snap.customer_doc;
        sale.customer_phone = snap.customer_phone;
        sale.customer_email = snap.customer_email;

        this.last_sale = sale;
        this.clearCart();

        this.toast = { show: true, text: "✅ Venta registrada correctamente" };

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