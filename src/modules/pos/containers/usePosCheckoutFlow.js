import { ref, computed } from "vue";

const helpOpen = ref(false);
const showCartDialog = ref(false);
const checkoutDialog = ref(false);
const receiptOpen = ref(false);

const paymentMethod = ref("CASH");
const installments = ref(1);
const applyReseller = ref(false);
const cashInput = ref("");

const receiptSale = ref(null);
const receiptCompanyName = ref("San Juan Tecnología");
const branchName = ref("");

const customer = ref(null);
const cart = ref([]);

export function usePosCheckoutFlow(options = {}) {
  const { isCajaOpen = ref(true) } = options;

  const customerHasData = computed(() => {
    return !!customer.value;
  });

  const cartTotal = computed(() => {
    return cart.value.reduce((acc, item) => {
      const qty = Number(item?.qty ?? item?.quantity ?? 1);
      const price = Number(
        item?.price_discount ??
        item?.price ??
        item?.unit_price ??
        0
      );

      return acc + qty * price;
    }, 0);
  });

  function clearCustomer() {
    customer.value = null;
  }

  function openCheckout() {
    if (!cart.value.length) {
      console.warn("[POS][checkout] carrito vacío");
      return;
    }

    if (!isCajaOpen.value) {
      console.warn("[POS][checkout] no hay caja abierta");
      return;
    }

    checkoutDialog.value = true;
  }

  function closeCheckout() {
    checkoutDialog.value = false;
  }

  async function confirmCheckout(payload = {}) {
    console.log("[POS][checkout] confirm", payload);

    receiptSale.value = {
      id: Date.now(),
      total: cartTotal.value,
      items: [...cart.value],
      payment_method: payload?.payment_method || paymentMethod.value,
      installments: payload?.installments || installments.value,
    };

    checkoutDialog.value = false;
    receiptOpen.value = true;
  }

  return {
    helpOpen,
    showCartDialog,
    checkoutDialog,
    receiptOpen,
    paymentMethod,
    installments,
    applyReseller,
    cashInput,
    receiptSale,
    receiptCompanyName,
    branchName,
    customer,
    customerHasData,
    cart,
    cartTotal,
    clearCustomer,
    openCheckout,
    closeCheckout,
    confirmCheckout,
  };
}