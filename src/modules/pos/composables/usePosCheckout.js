// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/pos/composables/usePosCheckout.js
import { ref, computed, watch } from "vue";

function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}

export function usePosCheckout({ posStore, canSell, needsBranchPick, resolveUnitPrice, toNum, allSellable }) {
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

  function currentPricePolicy() {
    if (applyReseller.value) return "RESELLER";
    if (paymentMethod.value === "CARD") return Number(installments.value || 1) > 1 ? "LIST" : "DISCOUNT";
    if (paymentMethod.value === "CASH" || paymentMethod.value === "TRANSFER" || paymentMethod.value === "QR") return "DISCOUNT";
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
    if (paymentMethod.value !== "CASH") return Number(checkoutTotal.value || 0);
    return parseCash(cashInput.value);
  });

  watch([paymentMethod, installments, applyReseller, cashInput], () => {
    if (paymentMethod.value !== "CASH") {
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

  function applyCheckoutPricesIntoStore() {
    const pol = currentPricePolicy();
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

    paymentMethod.value = "CASH";
    installments.value = 1;
    applyReseller.value = false;
    paymentProof.value = "";
    cashInput.value = "";
    cashError.value = false;
    cashErrorMsg.value = "";
    checkoutDialog.value = true;
  }

  async function confirmPayment({ onSnack } = {}) {
    if (needsBranchPick.value) {
      onSnack?.("🏬 Elegí sucursal para operar.");
      return;
    }
    if (!canSell.value) {
      onSnack?.("🔒 Sin permiso POS (pos.sale). No se puede confirmar ventas.");
      return;
    }

    try {
      applyCheckoutPricesIntoStore();

      const extra = {
        price_policy: currentPricePolicy(),
        installments: Number(installments.value || 1),
        proof: paymentProof.value || null,
        customer: { ...customer.value },
      };

      const result = await posStore.checkoutSale(paymentMethod.value, extra);

      checkoutDialog.value = false;
      onSnack?.("✅ Venta registrada correctamente");

      const sale = result?.sale || result?.data?.sale || result?.data || result || null;
      receiptSale.value =
        sale && (sale.id || sale.number || sale.created_at || sale.items)
          ? sale
          : {
              id: Date.now(),
              created_at: new Date().toISOString(),
              payment_method: paymentMethod.value,
              installments: Number(installments.value || 1),
              proof: paymentProof.value || null,
              customer: { ...customer.value },
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