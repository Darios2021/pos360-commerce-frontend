// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/pos/composables/usePosCheckout.js
import { ref, computed, watch } from "vue";
import { usePosCashRegister } from "./usePosCashRegister";

function money(val) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(Number(val || 0));
}

function normalizeMethodUI(v) {
  const raw = String(v || "").trim();
  const s = raw.toLowerCase();
  const up = raw.toUpperCase();

  if (!s) return "CASH";

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

  if (up === "CASH") return "CASH";
  if (up === "TRANSFER") return "TRANSFER";
  if (up === "CARD") return "CARD";
  if (up === "MERCADOPAGO") return "MERCADOPAGO";

  if (s === "efectivo") return "CASH";
  if (s === "transferencia") return "TRANSFER";
  if (
    s === "tarjeta" ||
    s === "credito" ||
    s === "crédito" ||
    s === "debito" ||
    s === "débito"
  ) {
    return "CARD";
  }

  if (
    s === "mp" ||
    s === "mercadopago" ||
    s === "mercado_pago" ||
    s === "mercado pago" ||
    s === "qr"
  ) {
    return "MERCADOPAGO";
  }

  return "CASH";
}

function toPaymentsMethodAndReference(uiMethod) {
  const m = normalizeMethodUI(uiMethod);

  if (m === "CASH") return { method: "CASH", reference: null };
  if (m === "TRANSFER") return { method: "TRANSFER", reference: null };
  if (m === "CARD") return { method: "CARD", reference: null };
  if (m === "MERCADOPAGO") return { method: "QR", reference: "MERCADOPAGO" };
  if (m === "credit_sjt") return { method: "OTHER", reference: "SJCREDIT" };

  return { method: "CASH", reference: null };
}

/* =========================
   CUSTOMER SNAPSHOT
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

  const explicitName = pickFirst(
    c.customer_name,
    c.name,
    c.full_name,
    c.fullName,
    c.razon_social,
    c.razonSocial,
    c.company
  );

  const first_name = pickFirst(c.first_name, c.firstname, c.firstName, c.nombre);
  const last_name = pickFirst(c.last_name, c.lastname, c.lastName, c.apellido, c.surname);

  const customer_name = pickFirst(
    explicitName,
    first_name || last_name ? `${first_name} ${last_name}`.trim() : ""
  ).trim();

  const customer_doc = pickFirst(
    c.customer_doc,
    c.doc,
    c.dni,
    c.cuit,
    c.cuil,
    c.document,
    c.documento
  ).trim();

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

  const email = pickFirst(c.email, c.mail).trim();
  const whatsapp = normalizeDigits(
    pickFirst(c.whatsapp, c.wa, c.phone, c.tel, c.telefono)
  );
  const address = pickFirst(c.address, c.direccion).trim();
  const note = pickFirst(c.note, c.obs, c.observaciones).trim();

  return {
    first_name,
    last_name,
    email,
    whatsapp,
    address,
    note,
    customer_name,
    customer_doc,
    customer_phone,
  };
}

export function usePosCheckout({
  posStore,
  canSell,
  needsBranchPick,
  resolveUnitPrice,
  toNum,
  allSellable,
  customerRef = null,
}) {
// 🔥 usar caja inyectada desde PosPage
const {
  isCajaOpen: injectedIsCajaOpen,
  currentCashRegisterId: injectedCashRegisterId,
} = arguments[0] || {};

const isCajaOpen = injectedIsCajaOpen;
const currentCashRegisterId = injectedCashRegisterId;
  const checkoutDialog = ref(false);

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

  const productById = computed(() => {
    const m = new Map();
    for (const p of allSellable.value || []) {
      m.set(Number(p.id), p);
    }
    return m;
  });

  function pricePolicyLabel(policy) {
    if (policy === "RESELLER") return "Revendedor";
    if (policy === "LIST") return "Lista";
    return "Descuento";
  }

  function currentPricePolicy(
    method = paymentMethod.value,
    inst = installments.value,
    reseller = applyReseller.value
  ) {
    const m = normalizeMethodUI(method);

    if (reseller) return "RESELLER";
    if (m === "credit_sjt") return "LIST";
    if (m === "CARD") return Number(inst || 1) > 1 ? "LIST" : "DISCOUNT";
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
    for (const it of posStore.cart || []) {
      sum += toNum(it.qty) * toNum(it.price);
    }
    return sum;
  });

  function parseCash(v) {
    if (v === null || v === undefined) return 0;
    const s = String(v).trim().replace(/\./g, "").replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  const paidAmount = computed(() => {
    if (normalizeMethodUI(paymentMethod.value) !== "CASH") {
      return Number(checkoutTotal.value || 0);
    }
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

    if (!isCajaOpen.value || !currentCashRegisterId.value) {
      onSnack?.("🧾 Debés abrir una caja antes de registrar la venta.");
      return;
    }

    paymentMethod.value = "CASH";
    installments.value = 1;
    applyReseller.value = false;
    paymentProof.value = "";
    cashInput.value = "";
    cashError.value = false;
    cashErrorMsg.value = "";
    checkoutDialog.value = true;
  }

  async function confirmPayment(payloadOrCtx = {}) {
    const onSnack = payloadOrCtx?.onSnack;
    const payload = payloadOrCtx?.payloadFromDialog || payloadOrCtx || {};

    if (needsBranchPick.value) {
      onSnack?.("🏬 Elegí sucursal para operar.");
      throw new Error("SUCURSAL_REQUERIDA");
    }

    if (!canSell.value) {
      onSnack?.("🔒 Sin permiso POS (pos.sale). No se puede confirmar ventas.");
      throw new Error("SIN_PERMISO_POS");
    }

    if (!isCajaOpen.value || !currentCashRegisterId.value) {
      onSnack?.("🧾 No hay una caja abierta para asociar la venta.");
      throw new Error("CAJA_REQUERIDA");
    }

    try {
      const uiMethodIncoming =
        payload?.payment_method ||
        payload?.paymentMethod ||
        payload?.methodCode ||
        payload?.paymentMethodCode ||
        payload?.method ||
        payload?.provider ||
        null;

      const uiMethod = normalizeMethodUI(uiMethodIncoming || paymentMethod.value);

      let instIncoming = Number(payload?.installments ?? installments.value ?? 1) || 1;
      const resellerIncoming = Boolean(
        payload?.apply_reseller ?? payload?.applyReseller ?? applyReseller.value
      );

      if (uiMethod === "credit_sjt" && !resellerIncoming) {
        if (instIncoming < 1) instIncoming = 1;
        if (instIncoming > 12) instIncoming = 12;
      }

      paymentMethod.value = uiMethod;
      installments.value = instIncoming;
      applyReseller.value = resellerIncoming;

      applyCheckoutPricesIntoStore(uiMethod, instIncoming, resellerIncoming);

      const payMap = toPaymentsMethodAndReference(uiMethod);

      const liveCustomer =
        customerRef && typeof customerRef === "object" && "value" in customerRef
          ? customerRef.value || {}
          : {};

      const storeCustomer =
        posStore?.customer ||
        posStore?.customer_info ||
        posStore?.customerInfo ||
        {};

      const mergedCustomer = {
        ...liveCustomer,
        ...storeCustomer,
        ...(payload?.customer || {}),
        ...(payload?.extra?.customer || {}),
      };

      const snap = buildCustomerSnapshot({
        ...mergedCustomer,
        customer_name: payload?.customer_name,
        customer_doc: payload?.customer_doc,
        customer_phone: payload?.customer_phone,
      });

      const extra = {
        price_policy: currentPricePolicy(uiMethod, instIncoming, resellerIncoming),
        installments: instIncoming,
        proof: payload?.proof ?? paymentProof.value ?? null,
        reference: payload?.reference ?? payMap.reference ?? null,
        total_list: payload?.total_list ?? payload?.totalList ?? null,
        per_installment_list:
          payload?.per_installment_list ?? payload?.perInstallmentList ?? null,
        card_kind: payload?.card_kind ?? payload?.cardKind ?? null,

        customer_name: snap.customer_name || null,
        customer_doc: snap.customer_doc || null,
        customer_phone: snap.customer_phone || null,

        customer: {
          ...mergedCustomer,
          first_name: snap.first_name,
          last_name: snap.last_name,
          email: snap.email,
          whatsapp: snap.whatsapp,
          address: snap.address,
          note: snap.note,
          doc: snap.customer_doc,
          phone: snap.customer_phone,
          name: snap.customer_name,
        },
      };

      console.log("[POS][checkout] customer snapshot =>", {
        customer_name: extra.customer_name,
        customer_doc: extra.customer_doc,
        customer_phone: extra.customer_phone,
        customer: extra.customer,
      });

      console.log("[POS][checkout] cash_register_id =>", currentCashRegisterId.value);

      const result = await posStore.checkoutSale(payMap.method, {
        ...extra,
        cash_register_id: currentCashRegisterId.value,
      });

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
              cash_register_id: currentCashRegisterId.value,
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
      return result;
    } catch (e) {
      onSnack?.(
        posStore.error ||
          e?.response?.data?.message ||
          e?.message ||
          "❌ Error al confirmar la venta"
      );
      throw e;
    }
  }

  return {
    checkoutDialog,
    paymentMethod,
    installments,
    applyReseller,
    paymentProof,
    cashInput,
    cashError,
    cashErrorMsg,
    checkoutTotal,
    checkoutTotalPreview,
    receiptOpen,
    receiptSale,
    receiptCompanyName,
    openCheckout,
    confirmPayment,
  };
}

export default usePosCheckout;