// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/pos/composables/usePosCheckout.js
import { ref, computed, watch } from "vue";

function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}

/**
 * ✅ Normaliza lo que venga del dialog/UI
 * Acepta:
 * - "CASH","TRANSFER","CARD","MERCADOPAGO","credit_sjt"
 * - alias: "efectivo","transferencia","tarjeta","mp","mercadopago","qr"
 */
function normalizeMethodUI(v) {
  const raw = String(v || "").trim();
  const s = raw.toLowerCase();
  const up = raw.toUpperCase();

  if (!s) return "CASH";

  // ✅ San Juan Crédito (NO convertir a CASH)
  if (
    s === "credit_sjt" ||
    up === "CREDIT_SJT" ||
    up === "SJCREDIT" ||
    up === "SAN JUAN CREDITO" ||
    up === "SAN JUAN CRÉDITO" ||
    up === "CREDITO SAN JUAN" ||
    up === "CRÉDITO SAN JUAN"
  ) {
    return "credit_sjt";
  }

  // ✅ enums directos
  if (up === "CASH") return "CASH";
  if (up === "TRANSFER") return "TRANSFER";
  if (up === "CARD") return "CARD";
  if (up === "MERCADOPAGO") return "MERCADOPAGO";

  // ✅ español/alias
  if (s === "efectivo") return "CASH";
  if (s === "transferencia") return "TRANSFER";
  if (s === "tarjeta" || s === "credito" || s === "crédito" || s === "debito" || s === "débito") return "CARD";

  // ✅ MercadoPago / QR
  if (s === "mp" || s === "mercadopago" || s === "mercado_pago" || s === "mercado pago" || s === "qr") {
    return "MERCADOPAGO";
  }

  return "CASH";
}

/**
 * ✅ Map UI -> Backend payments.method + reference
 * - DB enum típico: CASH | TRANSFER | CARD | QR | OTHER
 * - SJ Crédito: method=OTHER + reference=SJCREDIT (o si tu backend acepta credit_sjt como method, igual lo soportamos)
 */
function toPaymentsMethodAndReference(uiMethod) {
  const m = normalizeMethodUI(uiMethod);

  if (m === "CASH") return { method: "CASH", reference: null };
  if (m === "TRANSFER") return { method: "TRANSFER", reference: null };
  if (m === "CARD") return { method: "CARD", reference: null };

  // ✅ MercadoPago => QR + reference MERCADOPAGO
  if (m === "MERCADOPAGO") return { method: "QR", reference: "MERCADOPAGO" };

  // ✅ San Juan Crédito => OTHER + reference SJCREDIT
  // (si tu backend/enum soporta "credit_sjt" como method, podés cambiar method acá)
  if (m === "credit_sjt") return { method: "OTHER", reference: "SJCREDIT" };

  return { method: "CASH", reference: null };
}

/* =========================
   CUSTOMER SNAPSHOT (CLAVE)
   - Garantiza que SIEMPRE mandemos:
     customer_name, customer_doc, customer_phone
   - Soporta alias: doc/dni/cuit, phone/whatsapp/tel, etc.
========================= */
function normalizeDigits(v) {
  return String(v ?? "")
    .replace(/[^\d+]/g, "")
    .trim();
}

function pickFirst(...vals) {
  for (const v of vals) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return "";
}

function buildCustomerSnapshot(input = {}) {
  const c = input || {};

  const first_name = pickFirst(c.first_name, c.firstname, c.firstName, c.nombre, c.name);
  const last_name = pickFirst(c.last_name, c.lastname, c.lastName, c.apellido, c.surname);

  const customer_name = pickFirst(
    c.customer_name,
    c.full_name,
    c.fullName,
    (first_name || last_name) ? `${first_name} ${last_name}`.trim() : "",
    c.razon_social,
    c.razonSocial
  ).trim();

  // doc: doc/dni/cuit/cuil/document
  const customer_doc = pickFirst(c.customer_doc, c.doc, c.dni, c.cuit, c.cuil, c.document, c.documento).trim();

  // phone: phone/tel/telefono/whatsapp/celular
  const rawPhone = pickFirst(
    c.customer_phone,
    c.phone,
    c.telefono,
    c.tel,
    c.celular,
    c.mobile,
    c.whatsapp,
    c.wa
  );

  const customer_phone = normalizeDigits(rawPhone);

  // email
  const email = pickFirst(c.email, c.mail).trim();

  // mantener whatsapp (si venía) por compat de UI, pero el snapshot principal es customer_phone
  const whatsapp = normalizeDigits(pickFirst(c.whatsapp, c.wa, c.phone, c.tel, c.telefono));

  return {
    // para UI / recibo
    first_name,
    last_name,
    email,
    whatsapp,

    // ✅ snapshot real para sales.*
    customer_name,
    customer_doc,
    customer_phone,
  };
}

export function usePosCheckout({ posStore, canSell, needsBranchPick, resolveUnitPrice, toNum, allSellable }) {
  const checkoutDialog = ref(false);

  // ✅ estado (UI enum)
  const paymentMethod = ref("CASH"); // CASH | TRANSFER | CARD | MERCADOPAGO | credit_sjt
  const installments = ref(1);
  const applyReseller = ref(false);
  const paymentProof = ref("");
  const cashInput = ref("");
  const cashError = ref(false);
  const cashErrorMsg = ref("");

  const receiptOpen = ref(false);
  const receiptSale = ref(null);
  const receiptCompanyName = ref("POS360");

  // ✅ FIX: customer ahora incluye doc/phone (además de whatsapp)
  const customer = ref({
    first_name: "",
    last_name: "",
    doc: "",       // ✅ NUEVO
    phone: "",     // ✅ NUEVO
    whatsapp: "",
    email: "",
  });

  const productById = computed(() => {
    const m = new Map();
    for (const p of allSellable.value || []) m.set(Number(p.id), p);
    return m;
  });

  function pricePolicyLabel(policy) {
    if (policy === "RESELLER") return "Revendedor";
    if (policy === "LIST") return "Lista";
    return "Descuento";
  }

  function currentPricePolicy(method = paymentMethod.value, inst = installments.value, reseller = applyReseller.value) {
    const m = normalizeMethodUI(method);

    if (reseller) return "RESELLER";

    // ✅ San Juan Crédito SIEMPRE lista (si no reseller)
    if (m === "credit_sjt") return "LIST";

    // ✅ CARD: cuotas => lista, 1 pago => descuento
    if (m === "CARD") return Number(inst || 1) > 1 ? "LIST" : "DISCOUNT";

    // efectivo/transfer/mp => descuento
    if (m === "CASH" || m === "TRANSFER" || m === "MERCADOPAGO") return "DISCOUNT";

    return "DISCOUNT";
  }

  const checkoutTotal = computed(() => {
    const pol = currentPricePolicy();
    let sum = 0;
    for (const it of posStore.cart || []) {
      const pid = Number(it.product_id || it.id);
      const p = productById.value.get(pid) || it;
      const unit = resolveUnitPrice(p, pol);
      sum += unit * toNum(it.qty);
    }
    return sum;
  });

  const checkoutTotalPreview = computed(() => {
    let sum = 0;
    for (const it of posStore.cart || []) sum += toNum(it.qty) * toNum(it.price);
    return sum;
  });

  function parseCash(v) {
    if (v === null || v === undefined) return 0;
    const s = String(v).trim().replace(/\./g, "").replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  const paidAmount = computed(() => {
    if (normalizeMethodUI(paymentMethod.value) !== "CASH") return Number(checkoutTotal.value || 0);
    return parseCash(cashInput.value);
  });

  watch([paymentMethod, installments, applyReseller, cashInput], () => {
    if (normalizeMethodUI(paymentMethod.value) !== "CASH") {
      cashError.value = false;
      cashErrorMsg.value = "";
      return;
    }

    const totalAmt = Number(checkoutTotal.value || 0);
    const paid = paidAmount.value;

    if (!cashInput.value) {
      cashError.value = true;
      cashErrorMsg.value = "Ingresá el efectivo recibido.";
      return;
    }

    if (paid < totalAmt) {
      cashError.value = true;
      cashErrorMsg.value = `El efectivo es menor al total (${money(totalAmt)}).`;
      return;
    }

    cashError.value = false;
    cashErrorMsg.value = "";
  });

  function applyCheckoutPricesIntoStore(methodArg, instArg, resellerArg) {
    const pol = currentPricePolicy(methodArg, instArg, resellerArg);

    for (const it of posStore.cart || []) {
      const pid = Number(it.product_id || it.id);
      const p = productById.value.get(pid) || it;
      const unit = resolveUnitPrice(p, pol);

      it.price = unit;
      it.price_label = pricePolicyLabel(pol);
      it.subtotal = unit * toNum(it.qty);
    }
  }

  function openCheckout({ onSnack } = {}) {
    if (needsBranchPick.value) {
      onSnack?.("🏬 Elegí sucursal para operar.");
      return;
    }
    if (!canSell.value) {
      onSnack?.("🔒 Sin permiso POS (pos.sale). No se puede cobrar / registrar ventas.");
      return;
    }

    // reset
    paymentMethod.value = "CASH";
    installments.value = 1;
    applyReseller.value = false;
    paymentProof.value = "";
    cashInput.value = "";
    cashError.value = false;
    cashErrorMsg.value = "";
    checkoutDialog.value = true;
  }

  /**
   * ✅ FIX REAL:
   * confirmPayment recibe payload del dialog:
   *  - { payment_method } (CheckoutDialog emite esto)
   *  - installments / apply_reseller / proof / total_list / per_installment_list / card_kind
   *
   * ✅ CLAVE PARA TU CASO:
   * - Enviamos snapshot a backend como campos top-level:
   *     customer_name, customer_doc, customer_phone
   *   así sales.customer_* NO queda NULL.
   */
  async function confirmPayment(payloadOrCtx = {}) {
    const onSnack = payloadOrCtx?.onSnack;
    const payload = payloadOrCtx?.payloadFromDialog || payloadOrCtx || {};

    if (needsBranchPick.value) {
      onSnack?.("🏬 Elegí sucursal para operar.");
      return;
    }
    if (!canSell.value) {
      onSnack?.("🔒 Sin permiso POS (pos.sale). No se puede confirmar ventas.");
      return;
    }

    try {
      // ✅ 1) método desde dialog (o estado actual)
      const uiMethodIncoming =
        payload?.payment_method ||
        payload?.paymentMethod ||
        payload?.methodCode ||
        payload?.paymentMethodCode ||
        payload?.method ||
        payload?.provider ||
        null;

      const uiMethod = normalizeMethodUI(uiMethodIncoming || paymentMethod.value);

      // ✅ 2) cuotas/reseller desde dialog
      let instIncoming = Number(payload?.installments ?? installments.value ?? 1) || 1;
      const resellerIncoming = Boolean(payload?.apply_reseller ?? payload?.applyReseller ?? applyReseller.value);

      // San Juan Crédito: clamp 1..12 (si no reseller)
      if (uiMethod === "credit_sjt" && !resellerIncoming) {
        if (instIncoming < 1) instIncoming = 1;
        if (instIncoming > 12) instIncoming = 12;
      }

      paymentMethod.value = uiMethod;
      installments.value = instIncoming;
      applyReseller.value = resellerIncoming;

      // ✅ 3) aplicar precios según política real
      applyCheckoutPricesIntoStore(uiMethod, instIncoming, resellerIncoming);

      // ✅ 4) mapear a DB enum + reference
      const payMap = toPaymentsMethodAndReference(uiMethod);

      // ✅ 5) CUSTOMER SNAPSHOT (merge: state + payload.customer + payload.extra.customer)
      const mergedCustomer = {
        ...(customer.value || {}),
        ...(payload?.customer || {}),
        ...(payload?.extra?.customer || {}),
      };

      const snap = buildCustomerSnapshot({
        ...mergedCustomer,
        // también aceptamos que payload traiga ya customer_*:
        customer_name: payload?.customer_name,
        customer_doc: payload?.customer_doc,
        customer_phone: payload?.customer_phone,
      });

      // ✅ 6) extra para el store/backend (para que inserte payments bien)
      // 🔥 IMPORTANTÍSIMO: mandamos customer_* TOP-LEVEL para el backend.
      const extra = {
        // --- pricing / payment meta
        price_policy: currentPricePolicy(uiMethod, instIncoming, resellerIncoming),
        installments: instIncoming,
        proof: payload?.proof ?? paymentProof.value ?? null,
        reference: payload?.reference ?? payMap.reference ?? null,
        total_list: payload?.total_list ?? payload?.totalList ?? null,
        per_installment_list: payload?.per_installment_list ?? payload?.perInstallmentList ?? null,
        card_kind: payload?.card_kind ?? payload?.cardKind ?? null,

        // --- ✅ snapshot top-level (esto llena sales.customer_* en backend)
        customer_name: snap.customer_name,
        customer_doc: snap.customer_doc || null,
        customer_phone: snap.customer_phone || null,

        // --- para UI/recibo (se conserva)
        customer: {
          ...mergedCustomer,
          first_name: snap.first_name,
          last_name: snap.last_name,
          email: snap.email,
          whatsapp: snap.whatsapp,
          doc: snap.customer_doc,
          phone: snap.customer_phone,
        },
      };

      // ✅ 7) llamada CLAVE
      const result = await posStore.checkoutSale(payMap.method, extra);

      checkoutDialog.value = false;
      onSnack?.("✅ Venta registrada correctamente");

      const sale = result?.sale || result?.data?.sale || result?.data || result || null;

      receiptSale.value =
        sale && (sale.id || sale.number || sale.created_at || sale.items)
          ? sale
          : {
              id: Date.now(),
              created_at: new Date().toISOString(),
              payment_method: payMap.method,
              reference: extra.reference,
              installments: instIncoming,
              proof: extra.proof,
              customer: { ...extra.customer },
              customer_name: extra.customer_name,
              customer_doc: extra.customer_doc,
              customer_phone: extra.customer_phone,
              subtotal: checkoutTotal.value,
              total: checkoutTotal.value,
              items: (posStore.cart || []).map((it) => ({
                name: it.name,
                qty: toNum(it.qty),
                unit_price: toNum(it.price),
                subtotal: toNum(it.subtotal),
                price_label: it.price_label || "",
              })),
            };

      receiptOpen.value = true;
    } catch (e) {
      onSnack?.(posStore.error || e?.response?.data?.message || "❌ Error al confirmar la venta");
    }
  }

  return {
    // dialog
    checkoutDialog,

    // state
    paymentMethod,
    installments,
    applyReseller,
    paymentProof,
    cashInput,
    cashError,
    cashErrorMsg,

    // totals
    checkoutTotal,
    checkoutTotalPreview,

    // receipt
    receiptOpen,
    receiptSale,
    receiptCompanyName,

    // customer
    customer,

    // actions
    openCheckout,
    confirmPayment,
  };
}