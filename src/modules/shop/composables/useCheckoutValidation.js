// src/modules/shop/composables/useCheckoutValidation.js
// ✅ COPY-PASTE FINAL
import { computed } from "vue";

function isEmail(v) {
  const s = String(v || "").trim().toLowerCase();
  return !!s && s.includes("@") && s.includes(".");
}

function cleanPhone(v) {
  return String(v || "").replace(/[^\d+]/g, "").trim();
}

export function useCheckoutValidation({ items, buyer, delivery, payment, mpEnabled, pickupBranches, shippingQuote }) {
  const buyerErrors = computed(() => {
    const errs = [];
    if (!String(buyer.value?.name || "").trim()) errs.push("Nombre y apellido");
    if (!isEmail(buyer.value?.email)) errs.push("Email válido");
    if (cleanPhone(buyer.value?.phone).length < 6) errs.push("Teléfono válido");
    return errs;
  });

  const buyerOk = computed(() => buyerErrors.value.length === 0);

  const deliveryOk = computed(() => {
    if (!items.value?.length) return false;

    if (delivery.value?.mode === "pickup") {
      return !!delivery.value?.pickup_branch_id && (pickupBranches.value?.length || 0) > 0;
    }

    return (
      !!delivery.value?.contact_name &&
      !!delivery.value?.ship_phone &&
      !!delivery.value?.zip &&
      !!delivery.value?.province &&
      !!delivery.value?.city &&
      !!delivery.value?.address1 &&
      shippingQuote.value?.status === "ok"
    );
  });

  const canGoPayment = computed(() => buyerOk.value && deliveryOk.value);

  const canGoReview = computed(() => {
    if (!canGoPayment.value) return false;
    if (!payment.value?.method) return false;
    if (payment.value?.method === "MERCADO_PAGO" && !mpEnabled.value) return false;
    return true;
  });

  const canSubmit = computed(() => canGoReview.value);

  return { buyerErrors, buyerOk, deliveryOk, canGoPayment, canGoReview, canSubmit };
}
