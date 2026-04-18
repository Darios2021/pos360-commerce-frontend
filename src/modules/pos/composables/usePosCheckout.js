// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/pos/composables/usePosCheckout.js

import { ref, computed, watch } from "vue";
import { fetchPosPaymentMethods } from "@/app/services/paymentMethod.service";

function toSafeNum(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function parseAmount(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;

  const s = String(v ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function methodLabel(method) {
  return method?.display_name || method?.name || "Medio";
}

function cleanString(v) {
  const s = String(v ?? "").trim();
  return s || null;
}

function normalizeInvoiceMode(v) {
  const s = String(v ?? "").trim().toUpperCase();

  if (!s) return "NO_FISCAL";

  if (["NO_FISCAL", "FISCAL", "MIXED", "TICKET_ONLY"].includes(s)) {
    return s;
  }

  return "NO_FISCAL";
}

function normalizeInvoiceType(v) {
  const s = String(v ?? "").trim().toUpperCase();

  if (!s) return "TICKET";

  if (["TICKET", "A", "B", "C", "M", "NC", "ND", "OTHER"].includes(s)) {
    return s;
  }

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
    s === "CLIENTE_REGISTRADO" ||
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

function calcCartTotal(cart = []) {
  return (Array.isArray(cart) ? cart : []).reduce((acc, it) => {
    const subtotal = toSafeNum(it?.subtotal, NaN);
    if (Number.isFinite(subtotal) && subtotal > 0) return acc + subtotal;

    const qty = toSafeNum(it?.qty ?? it?.quantity, 0);
    const unit =
      toSafeNum(it?.price, NaN) ||
      toSafeNum(it?.unit_price, NaN) ||
      toSafeNum(it?.unitPrice, 0);

    return acc + qty * unit;
  }, 0);
}

function buildPaymentMethodMeta(raw = {}) {
  const x = raw || {};
  return {
    id: Number(x.id || 0) || null,
    name: String(x.name || "").trim(),
    display_name: String(x.display_name || "").trim(),
    kind: String(x.kind || "OTHER").trim().toUpperCase(),
    pricing_mode: String(x.pricing_mode || "SALE_PRICE").trim().toUpperCase(),
    supports_installments: !!x.supports_installments,
    min_installments: Math.max(1, Number(x.min_installments || 1) || 1),
    max_installments: Math.max(1, Number(x.max_installments || 1) || 1),
    default_installments: Math.max(1, Number(x.default_installments || 1) || 1),
    requires_reference:
      x.requires_reference === true ||
      x.requires_reference === 1 ||
      x.reference_required === true ||
      x.reference_required === 1,
    allows_change:
      x.allows_change === true ||
      x.allows_change === 1,
    only_ecom: !!x.only_ecom,
    is_active: x.is_active !== false,
  };
}

function clampInstallments(method, value) {
  const qty = Math.max(1, Number(value || 1) || 1);
  if (!method?.supports_installments) return 1;

  const min = Math.max(1, Number(method?.min_installments || 1) || 1);
  const max = Math.max(min, Number(method?.max_installments || min) || min);

  return Math.min(max, Math.max(min, qty));
}

export function usePosCheckout({
  posStore,
  canSell,
  needsBranchPick,
  resolveUnitPrice,
  allSellable,
  customerRef = null,
  isCajaOpen,
  currentCashRegisterId,
  activeBranchId = null,
}) {
  const checkoutDialog = ref(false);

  const paymentMethods = ref([]);
  const paymentMethodsLoading = ref(false);
  const paymentMethodId = ref(null);

  const installments = ref(1);
  const applyReseller = ref(false);
  const paymentProof = ref("");
  const cashInput = ref("");
  const cardKind = ref("CREDIT");

  const mixedMode = ref(false);
  const mixedPayments = ref([]);

  const invoiceMode = ref("NO_FISCAL");
  const invoiceType = ref("TICKET");
  const customerType = ref("FINAL_CONSUMER");

  const selectedPaymentMethod = computed(() => {
    return (
      paymentMethods.value.find(
        (x) => Number(x.id) === Number(paymentMethodId.value)
      ) || null
    );
  });

  const selectedPaymentMethodMeta = computed(() =>
    buildPaymentMethodMeta(selectedPaymentMethod.value)
  );

  const defaultCashMethod = computed(() => {
    return (
      paymentMethods.value.find((m) => {
        const meta = buildPaymentMethodMeta(m);
        return meta.kind === "CASH";
      }) || null
    );
  });

  const checkoutTotal = computed(() => {
    const direct = toSafeNum(posStore?.totalAmount, 0);
    if (direct > 0) return direct;
    return calcCartTotal(posStore?.cart || []);
  });

  function getMethodById(id) {
    return (
      paymentMethods.value.find((x) => Number(x.id) === Number(id)) || null
    );
  }

  function getMethodMetaById(id) {
    return buildPaymentMethodMeta(getMethodById(id));
  }

  function methodUsesListPrice(meta, effectiveCardKind = null) {
    if (!meta) return false;
    const kind = String(meta.kind || "").toUpperCase();
    const pricingMode = String(meta.pricing_mode || "SALE_PRICE").toUpperCase();
    if (kind !== "CARD") return pricingMode === "LIST_PRICE";
    const configuredCardKind = String(meta.card_kind || "CREDIT").toUpperCase();
    const effective = String(effectiveCardKind || configuredCardKind || "CREDIT").toUpperCase();
    if (configuredCardKind === "DEBIT") return false;
    if (configuredCardKind === "PREPAID") return false;
    if (configuredCardKind === "CREDIT") return true;
    if (configuredCardKind === "BOTH") return effective !== "DEBIT";
    return pricingMode === "LIST_PRICE";
  }

  function determineSaleUsesListPrice(payload) {
    if (applyReseller.value) return false;
    if (payload?.mixed_mode && Array.isArray(payload?.mixed_payments)) {
      return payload.mixed_payments.some((row) => {
        if (toSafeNum(row.amount, 0) <= 0) return false;
        return methodUsesListPrice(getMethodMetaById(row?.payment_method_id), row.card_kind);
      });
    }
    const methodId = payload?.payment_method_id ?? paymentMethodId.value;
    const cardKindVal = payload?.card_kind ?? cardKind.value;
    return methodUsesListPrice(getMethodMetaById(methodId), cardKindVal);
  }

  function pickItemPrice(it, saleUsesListPrice) {
    const reseller = toSafeNum(it.price_reseller, 0);
    const list = toSafeNum(it.price_list, 0);
    const discount = toSafeNum(it.price_discount, 0);
    const base = toSafeNum(it.price ?? it.unit_price ?? it.unitPrice, 0);
    if (applyReseller.value && reseller > 0) return reseller;
    if (saleUsesListPrice && list > 0) return list;
    if (discount > 0) return discount;
    if (list > 0) return list;
    return base;
  }

  function getDefaultPaymentMethodId() {
    if (!paymentMethods.value.length) return null;

    const cash = defaultCashMethod.value;
    const chosen = cash || paymentMethods.value[0];

    return chosen ? Number(chosen.id) : null;
  }

  async function loadPaymentMethods(branchId = null) {
    paymentMethodsLoading.value = true;
    try {
      const rows = await fetchPosPaymentMethods({
        branch_id: branchId || activeBranchId?.value || undefined,
      });

      paymentMethods.value = Array.isArray(rows)
        ? rows.filter((x) => {
            const meta = buildPaymentMethodMeta(x);
            return meta.id && meta.is_active && !meta.only_ecom;
          })
        : [];

      if (!paymentMethods.value.length) {
        paymentMethodId.value = null;
        mixedPayments.value = [];
        return;
      }

      const exists = paymentMethods.value.some(
        (x) => Number(x.id) === Number(paymentMethodId.value)
      );

      if (!exists) {
        paymentMethodId.value = getDefaultPaymentMethodId();
      }

      mixedPayments.value = (mixedPayments.value || []).map((row) => {
        const valid =
          row?.payment_method_id != null &&
          paymentMethods.value.some(
            (m) => Number(m.id) === Number(row.payment_method_id)
          );

        const methodMeta = getMethodMetaById(
          valid ? Number(row.payment_method_id) : getDefaultPaymentMethodId()
        );

        const normalizedCardKind =
          String(row?.card_kind || "CREDIT").trim().toUpperCase() === "DEBIT"
            ? "DEBIT"
            : "CREDIT";

        return {
          uid: row?.uid || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          payment_method_id: valid
            ? Number(row.payment_method_id)
            : getDefaultPaymentMethodId(),
          amount: row?.amount ?? "",
          installments:
            normalizedCardKind === "DEBIT"
              ? 1
              : clampInstallments(methodMeta, row?.installments),
          reference: row?.reference ?? "",
          card_kind: normalizedCardKind,
        };
      });

      if (!mixedPayments.value.length) {
        mixedPayments.value = [makeMixedRow(paymentMethodId.value)];
      }
    } finally {
      paymentMethodsLoading.value = false;
    }
  }

  function makeMixedRow(methodId = null) {
    const methodMeta = getMethodMetaById(
      methodId != null ? Number(methodId) : getDefaultPaymentMethodId()
    );

    return {
      uid: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      payment_method_id:
        methodId != null ? Number(methodId) : getDefaultPaymentMethodId(),
      amount: "",
      installments: clampInstallments(methodMeta, methodMeta.default_installments || 1),
      reference: "",
      card_kind: "CREDIT",
    };
  }

  function ensureValidSinglePaymentMethod() {
    const valid = paymentMethods.value.some(
      (m) => Number(m.id) === Number(paymentMethodId.value)
    );

    if (!valid) {
      paymentMethodId.value = getDefaultPaymentMethodId();
    }

    return paymentMethodId.value != null ? Number(paymentMethodId.value) : null;
  }

  function normalizeMixedPayments(total) {
    const rows = Array.isArray(mixedPayments.value) ? mixedPayments.value : [];

    return rows
      .map((r) => {
        const amount = parseAmount(r?.amount);
        const methodId = Number(r?.payment_method_id);
        const methodMeta = getMethodMetaById(methodId);

        const safeCardKind =
          String(r?.card_kind || "CREDIT").trim().toUpperCase() === "DEBIT"
            ? "DEBIT"
            : "CREDIT";

        const safeInstallments =
          safeCardKind === "DEBIT"
            ? 1
            : clampInstallments(methodMeta, r?.installments);

        return {
          payment_method_id: Number.isFinite(methodId) ? methodId : null,
          amount,
          installments: safeInstallments,
          reference: cleanString(r?.reference) || (methodMeta?.requires_reference ? "PAGO_MIXTO" : null),
          card_kind: safeCardKind,
        };
      })
      .filter((r) => r.amount > 0 && r.payment_method_id != null);
  }

  function getCustomerSnapshot(payload = {}) {
    const payloadCustomer = payload?.customer || {};
    const storeCustomer = posStore?.customer || {};
    const refCustomer =
      customerRef && "value" in customerRef ? customerRef.value : customerRef || {};

    const merged = {
      ...refCustomer,
      ...storeCustomer,
      ...payloadCustomer,
      customer_id: payload?.customer_id ?? payloadCustomer?.customer_id,
      customer_name: payload?.customer_name ?? payloadCustomer?.customer_name,
      customer_doc: payload?.customer_doc ?? payloadCustomer?.customer_doc,
      customer_phone: payload?.customer_phone ?? payloadCustomer?.customer_phone,
      customer_email: payload?.customer_email ?? payloadCustomer?.customer_email,
    };

    const name =
      cleanString(
        merged.customer_name ||
          merged.name ||
          merged.full_name ||
          merged.razon_social
      ) || "Consumidor Final";

    const doc = cleanString(
      merged.customer_doc ||
        merged.document ||
        merged.doc ||
        merged.cuit ||
        merged.cuil ||
        merged.dni
    );

    const phone = cleanString(
      merged.customer_phone || merged.phone || merged.telefono || merged.mobile
    );

    const email = cleanString(merged.customer_email || merged.email);

    const id = merged.customer_id ?? merged.id ?? null;

    return {
      customer_id: id != null ? Number(id) || id : null,
      customer_name: name,
      customer_doc: doc,
      customer_phone: phone,
      customer_email: email,
    };
  }

  async function openCheckout({ onSnack } = {}) {
    if (needsBranchPick.value) {
      onSnack?.("Elegí sucursal");
      return;
    }

    if (!canSell.value) {
      onSnack?.("Sin permiso POS");
      return;
    }

    if (!isCajaOpen.value || !currentCashRegisterId.value) {
      onSnack?.("Abrí caja primero");
      return;
    }

    await loadPaymentMethods();

    if (!paymentMethods.value.length) {
      onSnack?.("Sin medios de pago");
      return;
    }

    paymentMethodId.value = getDefaultPaymentMethodId();

    installments.value = 1;
    applyReseller.value = false;
    paymentProof.value = "";
    cashInput.value = "";
    cardKind.value = "CREDIT";

    mixedMode.value = false;
    mixedPayments.value = [makeMixedRow(paymentMethodId.value)];

    invoiceMode.value = "NO_FISCAL";
    invoiceType.value = "TICKET";
    customerType.value = "FINAL_CONSUMER";

    checkoutDialog.value = true;
  }

  async function confirmPayment(payload = {}) {
    const saleUsesListPrice = determineSaleUsesListPrice(payload);

    const computedTotal = (posStore.cart || []).reduce((acc, it) => {
      const qty = toSafeNum(it.qty ?? it.quantity, 0);
      return acc + qty * pickItemPrice(it, saleUsesListPrice);
    }, 0);

    const total =
      toSafeNum(payload?.total, 0) > 0
        ? toSafeNum(payload.total, 0)
        : computedTotal || checkoutTotal.value;

    if (!total || total <= 0) {
      console.error("[POS_CHECKOUT] total inválido", {
        storeTotalAmount: posStore?.totalAmount,
        cart: posStore?.cart,
        computedFallbackTotal: calcCartTotal(posStore?.cart || []),
      });
      throw new Error("El total de la venta es inválido.");
    }

    if (!currentCashRegisterId.value) {
      throw new Error("No hay caja abierta.");
    }

    let payments = [];

    if (mixedMode.value) {
      payments = normalizeMixedPayments(total);

      if (!payments.length) {
        throw new Error("Ingresá al menos un pago válido.");
      }

      const paidTotal = payments.reduce(
        (acc, p) => acc + toSafeNum(p.amount, 0),
        0
      );

      if (paidTotal < total - 0.01) {
        const missing = (total - paidTotal).toFixed(2);
        throw new Error(`Faltan $${missing} para completar el pago mixto.`);
      }
    } else {
      const methodId = ensureValidSinglePaymentMethod();

      if (!methodId) {
        throw new Error("Seleccioná un medio de pago válido.");
      }

      const methodMeta = getMethodMetaById(methodId);
      const safeCardKind =
        String(cardKind.value || "CREDIT").trim().toUpperCase() === "DEBIT"
          ? "DEBIT"
          : "CREDIT";

      const safeInstallments =
        safeCardKind === "DEBIT"
          ? 1
          : clampInstallments(methodMeta, installments.value);

      payments = [
        {
          payment_method_id: methodId,
          amount: total,
          installments: safeInstallments,
          reference: cleanString(paymentProof.value),
          card_kind: safeCardKind,
        },
      ];
    }

    const customer = getCustomerSnapshot(payload);

    const finalInvoiceMode = normalizeInvoiceMode(
      payload?.invoice_mode ?? invoiceMode.value
    );

    const finalInvoiceType = normalizeInvoiceTypeByMode(
      finalInvoiceMode,
      payload?.invoice_type ?? invoiceType.value
    );

    const finalCustomerType = normalizeCustomerType(
      payload?.customer_type ?? customerType.value
    );

    const salePayload = {
      items: (posStore.cart || []).map((it) => ({
        product_id: Number(it.product_id ?? it.id),
        quantity: toSafeNum(it.qty ?? it.quantity, 0),
        unit_price: pickItemPrice(it, saleUsesListPrice),
      })),
      payments,
      cash_register_id: Number(currentCashRegisterId.value),

      branch_id:
        Number(
          payload?.branch_id ??
            activeBranchId?.value ??
            posStore?.activeBranchId ??
            posStore?.branchId
        ) || undefined,

      invoice_mode: finalInvoiceMode,
      invoice_type: finalInvoiceType,
      customer_type: finalCustomerType,

      customer_id: customer.customer_id,
      customer_name: customer.customer_name,
      customer_doc: customer.customer_doc,
      customer_phone: customer.customer_phone,
      customer_email: customer.customer_email,

      total,
      paid_total: total,

      note: cleanString(payload?.note),
      payment_note: cleanString(payload?.payment_note),
      apply_reseller: !!applyReseller.value,
    };

    Object.keys(salePayload).forEach((k) => {
      if (salePayload[k] === undefined) delete salePayload[k];
    });

    console.log("[POS_CHECKOUT] total final =>", total);
    console.log(
      "[POS_CHECKOUT] salePayload =>",
      JSON.parse(JSON.stringify(salePayload))
    );

    return await posStore.checkoutSale(salePayload);
  }

  watch(
    paymentMethodId,
    (val) => {
      if (mixedMode.value) return;

      const methodMeta = getMethodMetaById(val);
      if (!methodMeta?.id) return;

      if (!methodMeta.supports_installments) {
        installments.value = 1;
      } else {
        installments.value = clampInstallments(methodMeta, installments.value);
      }

      if (methodMeta.kind !== "CARD") {
        cardKind.value = "CREDIT";
      }

      if (!methodMeta.requires_reference) {
        paymentProof.value = "";
      }
    },
    { immediate: false }
  );

  watch(
    mixedPayments,
    (rows) => {
      if (!Array.isArray(rows)) return;

      for (const row of rows) {
        const methodMeta = getMethodMetaById(row?.payment_method_id);
        if (!methodMeta?.id) continue;

        const safeCardKind =
          String(row?.card_kind || "CREDIT").trim().toUpperCase() === "DEBIT"
            ? "DEBIT"
            : "CREDIT";

        row.card_kind = safeCardKind;

        if (!methodMeta.supports_installments) {
          row.installments = 1;
        } else if (safeCardKind === "DEBIT") {
          row.installments = 1;
        } else {
          row.installments = clampInstallments(methodMeta, row.installments);
        }

        if (!methodMeta.requires_reference) {
          row.reference = "";
        }
      }
    },
    { deep: true }
  );

  watch(
    paymentMethods,
    () => {
      if (!paymentMethods.value.length) {
        paymentMethodId.value = null;
        return;
      }

      const exists = paymentMethods.value.some(
        (m) => Number(m.id) === Number(paymentMethodId.value)
      );

      if (!exists) {
        paymentMethodId.value = getDefaultPaymentMethodId();
      }
    },
    { deep: true }
  );

  watch(
    invoiceMode,
    (mode) => {
      const normalized = normalizeInvoiceMode(mode);

      if (normalized === "NO_FISCAL" || normalized === "TICKET_ONLY") {
        invoiceType.value = "TICKET";
      } else if (!invoiceType.value || invoiceType.value === "TICKET") {
        invoiceType.value = "B";
      }
    },
    { immediate: true }
  );

  return {
    checkoutDialog,
    paymentMethods,
    paymentMethodsLoading,
    paymentMethodId,
    installments,
    applyReseller,
    paymentProof,
    cashInput,
    cardKind,
    mixedMode,
    mixedPayments,
    invoiceMode,
    invoiceType,
    customerType,
    selectedPaymentMethod,
    selectedPaymentMethodMeta,
    checkoutTotal,
    openCheckout,
    confirmPayment,
    loadPaymentMethods,
    makeMixedRow,
    methodLabel,
    getMethodById,
    getMethodMetaById,
  };
}