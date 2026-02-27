// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/pos/composables/usePosCheckout.js
import { ref, computed, watch } from "vue";

function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}

/**
 * ✅ Normaliza lo que venga del dialog/UI
 * Acepta: "CASH","TRANSFER","CARD","QR" y también "cash","transfer","card","mercadopago","mp"
 */
function normalizeMethodUI(v) {
  const s = String(v || "").trim().toLowerCase();

  if (!s) return "CASH";
  if (s === "cash" || s === "efectivo" || s === "CASH".toLowerCase()) return "CASH";
  if (s === "transfer" || s === "transferencia" || s === "TRANSFER".toLowerCase()) return "TRANSFER";
  if (
    s === "card" ||
    s === "tarjeta" ||
    s === "debito" ||
    s === "crédito" ||
    s === "credito" ||
    s === "CARD".toLowerCase()
  )
    return "CARD";

  // ✅ tu caso: QR == MercadoPago
  if (s === "qr" || s === "mp" || s === "mercadopago" || s === "mercado_pago") return "QR";

  // fallback
  return "CASH";
}

/**
 * ✅ Lo que mandamos al store/backend:
 * - Si tu backend/DB trabaja con codes: cash/transfer/card/mercadopago => mandamos eso.
 * - Si tu backend trabaja con enum: CASH/TRANSFER/CARD/QR, lo dejamos también dentro de extra.
 */
function toBackendMethodCode(uiMethod) {
  const m = normalizeMethodUI(uiMethod);
  if (m === "CASH") return "cash";
  if (m === "TRANSFER") return "transfer";
  if (m === "CARD") return "card";
  return "mercadopago"; // QR
}

export function usePosCheckout({ posStore, canSell, needsBranchPick, resolveUnitPrice, toNum, allSellable }) {
  const checkoutDialog = ref(false);

  // ✅ estado (UI enum)
  const paymentMethod = ref("CASH");
  const installments = ref(1);
  const applyReseller = ref(false);
  const paymentProof = ref("");
  const cashInput = ref("");
  const cashError = ref(false);
  const cashErrorMsg = ref("");

  const receiptOpen = ref(false);
  const receiptSale = ref(null);
  const receiptCompanyName = ref("POS360");

  const customer = ref({ first_name: "", last_name: "", whatsapp: "", email: "" });

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
    if (m === "CARD") return Number(inst || 1) > 1 ? "LIST" : "DISCOUNT";
    if (m === "CASH" || m === "TRANSFER" || m === "QR") return "DISCOUNT";
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
   * confirmPayment puede recibir payload del dialog:
   *  - { methodCode } o { payment_method } o { paymentMethod }
   *  - installments / apply_reseller / applyReseller / proof
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
      // ✅ 1) Tomar método desde dialog (si viene) y sincronizar estado
      const uiMethodIncoming =
        payload?.methodCode ||
        payload?.payment_method ||
        payload?.paymentMethod ||
        payload?.paymentMethodCode ||
        payload?.method ||
        payload?.provider ||
        null;

      const uiMethod = normalizeMethodUI(uiMethodIncoming || paymentMethod.value);

      // si viene installments/reseller desde dialog, respetarlo
      const instIncoming = Number(payload?.installments ?? installments.value ?? 1) || 1;
      const resellerIncoming = Boolean(payload?.apply_reseller ?? payload?.applyReseller ?? applyReseller.value);

      paymentMethod.value = uiMethod;
      installments.value = instIncoming;
      applyReseller.value = resellerIncoming;

      // ✅ 2) Aplicar precios con política correcta (según método real)
      applyCheckoutPricesIntoStore(uiMethod, instIncoming, resellerIncoming);

      // ✅ 3) Armar extra + método backend
      const backendMethodCode = toBackendMethodCode(uiMethod);

      const extra = {
        // para pricing/recibo
        price_policy: currentPricePolicy(uiMethod, instIncoming, resellerIncoming),
        installments: instIncoming,

        // si tu backend lo usa:
        proof: payload?.proof ?? paymentProof.value ?? null,

        // guardamos ambos por auditoría
        payment_method_ui: uiMethod, // CASH/TRANSFER/CARD/QR
        payment_method_code: backendMethodCode, // cash/transfer/card/mercadopago

        customer: { ...customer.value, ...(payload?.customer || {}) },
      };

      // ✅ 4) LLAMADA CLAVE:
      // Mandamos code backend (cash/transfer/card/mercadopago)
      // Si tu store/backend espera enum, lo sigue teniendo en extra.payment_method_ui
      const result = await posStore.checkoutSale(backendMethodCode, extra);

      checkoutDialog.value = false;
      onSnack?.("✅ Venta registrada correctamente");

      const sale = result?.sale || result?.data?.sale || result?.data || result || null;

      receiptSale.value =
        sale && (sale.id || sale.number || sale.created_at || sale.items)
          ? sale
          : {
              id: Date.now(),
              created_at: new Date().toISOString(),
              payment_method: backendMethodCode,
              payment_method_ui: uiMethod,
              installments: instIncoming,
              proof: extra.proof,
              customer: { ...extra.customer },
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