import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import http from "../../../app/api/http";
import vuetify from "../../../app/plugins/vuetify";

import { usePosStore } from "../../../app/store/pos.store";
import { useAuthStore } from "../../../app/store/auth.store";

import { usePosBranch } from "../composables/usePosBranch";
import { usePosBranchSwitch } from "../composables/usePosBranchSwitch";
import { usePosCustomer } from "../composables/usePosCustomer";
import { usePosCheckout } from "../composables/usePosCheckout";
import { usePosCashRegister } from "../composables/usePosCashRegister";
import { usePosPricing } from "../composables/usePosPricing";
import { useSnackbar } from "../composables/useSnackbar";

let shared;
let initPromise = null;
let initDone = false;

// Teléfono: lo sensible va en vista completa con ruta propia (rediseño móvil
// aprobado, informe 2.2 y 4.3). El mismo disparador que en escritorio abre una
// ventana, en el teléfono hace router.push. En escritorio no cambia nada.
function esMovil() {
  return !!vuetify?.display?.mobile?.value;
}

function toArr(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.rows)) return data.rows;
  return [];
}

export function usePosSalesFlow() {
  if (shared) return shared;

  // El singleton se arma dentro del setup de un componente del POS.
  let router = null;
  try { router = useRouter(); } catch { router = null; }
  function irA(name) {
    if (router) {
      router.push({ name }).catch(() => {});
      return;
    }
    // Si el singleton nació fuera de un setup, se usa la instancia del router.
    import("../../../app/router").then((m) => m.default.push({ name })).catch(() => {});
  }

  const posStore = usePosStore();
  const auth = useAuthStore();

  const helpOpen = ref(false);
  const showCartDialog = ref(false);
  const consultaOpen = ref(false);
  const consultaLoading = ref(false);
  const consultaItems = ref([]);
  const scannerTestOpen = ref(false);
  const scannerTestCode = ref("");
  const branchPickOpen = ref(false);
  const checkoutSubmitting = ref(false);

  // Señales UI (contadores incrementales) para que secciones que no
  // reciben props/emits directamente (PosLeftSection) puedan reaccionar
  // a atajos del TopBar. Cada incremento dispara un watch en el consumidor.
  const focusSearchSignal = ref(0);
  const refreshCatalogSignal = ref(0);

  function requestFocusSearch() {
    focusSearchSignal.value += 1;
  }

  function requestRefreshCatalog() {
    refreshCatalogSignal.value += 1;
  }

  // compat / UI opcional
  const receiptOpen = ref(false);
  const receiptSale = ref(null);
  const receiptCompanyName = ref("SAN JUAN TECNOLOGIA");

  // Snackbar compartido (singleton module-level). Se mantiene la forma
  // pública `snack` y `toast(text)` por backward compat con
  // `PosDialogs.vue` (usa `snack.show` y `snack.text`).
  const { state: snack, toast, close: closeSnack } = useSnackbar();

  const isViewOnly = computed(() => false);
  const canSell = computed(() => !isViewOnly.value);

  const {
    branchItems,
    fetchedBranches,
    activeBranchId,
    branchName,
    branchChipLabel,
    ensureBranchSelected,
    needsBranchPick,
  } = usePosBranch({
    posStore,
    auth,
    toast,
  });

  const {
    currentCashRegister,
    currentCashRegisterId,
    otherOpenRegisters,
    branchOpenRegisters,
    zombieDialog,
    closeZombieAndOpen,
    cancelZombieDialog,
    summary,
    isBusy: cajaBusy,
    isCajaOpen,

    cajaType,
    invoiceMode,
    invoiceType,
    openingAmount,
    openingNote,
    openedAt,

    cajaTypeOptions,
    invoiceModeOptions,
    invoiceTypeOptions,

    cajaTypeLabel,
    invoiceTypeLabel,

    cajaConfigOpen,
    cajaArqueoOpen,
    openCajaConfig,
    closeCajaConfig,
    openCajaArqueo,
    closeCajaArqueo,

    openCaja,
    closeCaja,
    refreshCaja,
    canSellWithCaja,
    totalsSummary,
    addMovement,
    loadingClose: cajaLoadingClose,
    loadingOpen: cajaLoadingOpen,
  } = usePosCashRegister({
    // La misma sucursal que muestra la pantalla (branchName de usePosBranch):
    // la elegida en el POS, si no la principal del usuario, si no la guardada.
    sucursal: () =>
      Number(activeBranchId.value || auth?.user?.branch_id || posStore?.branch_id || 0) || null,
  });

  const cashierName = computed(() => {
    const completo = [auth?.user?.first_name, auth?.user?.last_name].filter(Boolean).join(" ").trim();
    return (
      completo ||
      auth?.user?.name ||
      auth?.user?.username ||
      auth?.me?.name ||
      auth?.me?.username ||
      "Caja"
    );
  });

  // Abrir caja, cerrar caja: ventana en escritorio, vista completa en el teléfono.
  function abrirCajaUI() {
    if (esMovil()) return irA("cajaAbrir");
    openCajaConfig();
  }
  async function cerrarCajaUI() {
    if (esMovil()) return irA("cajaCerrar");
    await openCajaArqueo();
  }

  const loadingGlobal = computed(
    () => cajaBusy.value || checkoutSubmitting.value
  );

  const {
    branchPickSelected,
    uiBranchesForSelect,
    hasMultiBranches,
    cartBranchLabel,
    getActiveBranchIdSafe,
    openBranchSwitch,
    confirmActiveBranchChange,
  } = usePosBranchSwitch({
    posStore,
    branchPickOpen,
    activeBranchId,
    branchItems,
    fetchedBranches,
    ensureBranchSelected,
    fetchGlobalPool: refreshCaja,
    toast,
  });

  const {
    customer,
    customerHasData,
    customerDisabled,
    tryAttachCustomerToStore,
    loadCustomerDraft,
    saveCustomerDraft,
    clearCustomer,
  } = usePosCustomer({
    posStore,
    loadingGlobal,
    isViewOnly,
    needsBranchPick,
    canSell,
  });

  const { toNum, resolveUnitPrice } = usePosPricing();

  const allSellable = computed(() => {
    return Array.isArray(posStore?.cart) ? posStore.cart : [];
  });

  const {
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

    invoiceMode: checkoutInvoiceMode,
    invoiceType: checkoutInvoiceType,
    customerType,

    selectedPaymentMethod,
    selectedPaymentMethodMeta,
    checkoutTotal,

    loadPaymentMethods,
    openCheckout,
    confirmPayment,
  } = usePosCheckout({
    posStore,
    canSell,
    needsBranchPick,
    resolveUnitPrice,
    toNum,
    allSellable,
    customerRef: customer,
    isCajaOpen,
    currentCashRegisterId,
    activeBranchId,
  });

  const checkoutTotalPreview = computed(() => checkoutTotal.value || 0);

  // compat para componentes que todavía esperan estas refs
  const cashError = computed(() => false);
  const cashErrorMsg = computed(() => "");

  const cartItems = computed(() => {
    return Array.isArray(posStore.cart) ? posStore.cart : [];
  });

  const cartCount = computed(() => {
    return cartItems.value.reduce((acc, item) => {
      const qty = Number(item?.qty ?? item?.quantity ?? item?.cant ?? 1);
      return acc + (Number.isFinite(qty) ? qty : 1);
    }, 0);
  });

  const cartEditable = computed(() => {
    return canSell.value && !needsBranchPick.value;
  });

  const canProceedWithCaja = computed(() => !!isCajaOpen.value);

  function resetCheckoutUiState() {
    paymentMethodId.value = paymentMethods.value?.length
      ? Number(
          selectedPaymentMethod.value?.id ||
            paymentMethods.value.find(
              (m) => String(m?.kind || "").trim().toUpperCase() === "CASH"
            )?.id ||
            paymentMethods.value[0]?.id ||
            0
        ) || null
      : null;

    installments.value = 1;
    applyReseller.value = false;
    paymentProof.value = "";
    cashInput.value = "";
    cardKind.value = "CREDIT";

    mixedMode.value = false;
    mixedPayments.value = [];

    checkoutInvoiceMode.value = "NO_FISCAL";
    checkoutInvoiceType.value = "TICKET";
    customerType.value = "FINAL_CONSUMER";
  }

  function logCajaState(origin = "unknown") {
    // Solo logueamos en dev — en producción ensucia la consola.
    if (!import.meta.env?.DEV) return;
    console.debug(`[POS][${origin}] caja`, {
      canProceedWithCaja: canProceedWithCaja.value,
      canSellWithCaja: canSellWithCaja?.value,
      isCajaOpen: isCajaOpen.value,
      currentCashRegisterId: currentCashRegisterId?.value,
      cajaType: cajaType.value,
      invoiceMode: invoiceMode.value,
      invoiceType: invoiceType.value,
      currentCashRegister: currentCashRegister?.value || null,
      summary: summary?.value || null,
    });
  }

  async function openCheckoutSafe() {
    logCajaState("before-open-checkout");

    if (needsBranchPick.value) {
      toast("Falta la sucursal");
      return;
    }

    // Sin artículos el botón Cobrar queda deshabilitado; esto es un resguardo.
    if (!cartItems.value.length) {
      toast("Sin artículos");
      return;
    }

    if (!canProceedWithCaja.value) {
      await refreshCaja().catch(() => {});
      logCajaState("after-refresh-open-checkout");
    }

    if (!canProceedWithCaja.value) {
      toast("Sin caja abierta");
      abrirCajaUI();
      return;
    }

    if (customerHasData.value) {
      tryAttachCustomerToStore(customer.value);
      saveCustomerDraft();
    } else {
      tryAttachCustomerToStore(null);
    }

    if (!checkoutInvoiceMode.value) {
      checkoutInvoiceMode.value = invoiceMode.value || "NO_FISCAL";
    }

    if (!checkoutInvoiceType.value) {
      checkoutInvoiceType.value =
        checkoutInvoiceMode.value === "NO_FISCAL" ? "TICKET" : (invoiceType.value || "B");
    }

    await openCheckout({ onSnack: toast });

    // En el teléfono el cobro es la vista /app/pos/cobrar, no la ventana.
    if (esMovil() && checkoutDialog.value) {
      checkoutDialog.value = false;
      irA("posCobrar");
    }
  }

  async function handleGoPayFromCart() {
    showCartDialog.value = false;
    await openCheckoutSafe();
  }

  async function refresh() {
    await refreshCaja().catch(() => {});
    logCajaState("manual-refresh");
  }

  async function onCloseCaja() {
    if (!isCajaOpen.value) {
      await refreshCaja().catch(() => {});
    }

    if (!isCajaOpen.value) {
      toast("Sin caja abierta");
      return;
    }

    await cerrarCajaUI();
  }

  async function reloadSummaryFromArqueo() {
    try {
      await refreshCaja({ withSummary: true, silentSummaryError: false });
      toast("Resumen actualizado");
    } catch (err) {
      console.error("[POS] reloadSummaryFromArqueo error", err);
      toast(err?.message || "No se pudo recargar el resumen");
    }
  }

  async function onSaveCajaConfig(payload) {
    try {
      await openCaja({
        opening_cash: payload?.opening_amount ?? payload?.opening_cash ?? 0,
        opening_note: payload?.note ?? payload?.opening_note ?? "",
        caja_type: payload?.caja_type,
        invoice_mode: payload?.invoice_mode,
        invoice_type: payload?.invoice_type,
      });

      closeCajaConfig();
      await refreshCaja().catch(() => {});
      // Varias cajas por sucursal (una por usuario): se avisa, no se traba.
      const otras = (branchOpenRegisters.value || []).map((r) => `${r.opened_by_name} (#${r.id})`);
      toast(
        otras.length
          ? `Caja iniciada. También abierta en la sucursal: ${otras.join(", ")}`
          : `Caja iniciada • ${cajaTypeLabel.value} • ${invoiceTypeLabel.value}`
      );
    } catch (err) {
      if (err?.status === 409) {
        // Si openCaja detectó zombie, ya se abrió el PosZombieCashDialog.
        // Cerramos el dialog de config de caja para que se vea el zombie limpio.
        if (err?.code === "CAJA_USUARIO_YA_ABIERTA" || err?.data?.cash_register_id) {
          closeCajaConfig();
          return;
        }
        // Otros 409: sincronizar y salir silencioso.
        await refreshCaja().catch(() => {});
        closeCajaConfig();
        return;
      }

      toast(err?.message || "Error al abrir caja");
    }
  }

  async function onSaveArqueo(payload) {
    try {
      await closeCaja({
        closing_cash: payload?.closing_cash ?? 0,
        closing_note: payload?.closing_note ?? "",
        declared: payload?.declared || {},
        difference: payload?.difference || {},
      });

      closeCajaArqueo();
      await refreshCaja().catch(() => {});
      toast("Caja cerrada");
    } catch (err) {
      toast(err?.message || "Error al cerrar caja");
    }
  }

  async function onCheckoutConfirm(payload) {
    if (checkoutSubmitting.value) return;

    checkoutSubmitting.value = true;

    try {
      if (!canProceedWithCaja.value) {
        await refreshCaja().catch(() => {});
      }

      if (!canProceedWithCaja.value) {
        toast("Sin caja abierta");
        abrirCajaUI();
        return;
      }

      if (customerHasData.value) {
        tryAttachCustomerToStore(customer.value);
        saveCustomerDraft();
      } else {
        tryAttachCustomerToStore(null);
      }

      if (payload?.payment_method_id != null) {
        paymentMethodId.value = Number(payload.payment_method_id || 0) || null;
      }

      if (payload?.installments != null) {
        installments.value = Number(payload.installments || 1) || 1;
      }

      if (payload?.apply_reseller != null) {
        applyReseller.value = !!payload.apply_reseller;
      }

      if (payload?.proof != null) {
        paymentProof.value = String(payload.proof || "");
      }

      if (payload?.cash_received != null) {
        cashInput.value = String(payload.cash_received || "");
      }

      if (payload?.card_kind != null) {
        cardKind.value = String(payload.card_kind || "CREDIT").toUpperCase();
      }

      if (payload?.mixed_mode != null) {
        mixedMode.value = !!payload.mixed_mode;
      }

      if (Array.isArray(payload?.mixed_payments)) {
        mixedPayments.value = payload.mixed_payments.map((row) => ({
          uid: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          payment_method_id: Number(row?.payment_method_id || 0) || null,
          amount: String(row?.amount ?? ""),
          installments: Number(row?.installments || 1) || 1,
          reference: String(row?.reference || ""),
          card_kind: String(row?.card_kind || "CREDIT").toUpperCase(),
        }));
      }

      if (payload?.invoice_mode != null) {
        checkoutInvoiceMode.value = String(payload.invoice_mode || "NO_FISCAL").toUpperCase();
      }

      if (payload?.invoice_type != null) {
        checkoutInvoiceType.value = String(payload.invoice_type || "TICKET").toUpperCase();
      }

      if (payload?.customer_type != null) {
        customerType.value = String(payload.customer_type || "FINAL_CONSUMER").toUpperCase();
      }

      // ✅ FIX CLAVE:
      // confirmPayment espera EL PAYLOAD DIRECTO
      const result = await confirmPayment(payload || {});

      // ✅ cerrar diálogo correcto
      checkoutDialog.value = false;
      showCartDialog.value = false;

      // ✅ abrir recibo automáticamente después de cada venta (en el
      // teléfono la vista Cobrar muestra "Venta registrada" en su lugar)
      receiptSale.value = result?.sale || posStore?.last_sale || null;
      receiptOpen.value = !esMovil();

      // ✅ limpiar estado visual
      resetCheckoutUiState();

      await refreshCaja().catch(() => {});

      if (typeof loadPaymentMethods === "function") {
        await loadPaymentMethods(activeBranchId.value || null).catch(() => {});
      }

      // En el teléfono la vista Cobrar ya lo dice en grande.
      if (!esMovil()) toast("Venta registrada");
      return result;
    } catch (err) {
      console.error("[POS] checkout confirm error", err);

      if (err?.code === "CAJA_NO_ABIERTA") {
        toast("Sin caja abierta");
        await refreshCaja().catch(() => {});
        abrirCajaUI();
        return;
      }

      toast(
        err?.response?.data?.message ||
          err?.message ||
          "La venta no se registró"
      );
      // La vista Cobrar del teléfono necesita saber que falló para ofrecer Reintentar.
      if (esMovil()) throw err;
    } finally {
      checkoutSubmitting.value = false;
    }
  }

  function onCheckoutCancel() {
    checkoutDialog.value = false;
  }

  async function runConsultaSearch(query, { exact = false } = {}) {
    const raw = String(query || "").trim();

    if (needsBranchPick.value) {
      toast("Falta la sucursal");
      return;
    }

    try {
      consultaLoading.value = true;

      const { data } = await http.get("/pos/products", {
        params: {
          q: raw || undefined,
          page: 1,
          limit: raw ? 80 : 300,
          branch_id: activeBranchId.value || undefined,
          in_stock: "false",
          sellable: "true",
        },
      });

      const rows = toArr(data);

      if (exact) {
        const normalized = raw.toLowerCase();
        const exactRows = rows.filter((p) => {
          const barcode = String(p?.barcode || "").trim().toLowerCase();
          const sku = String(p?.sku || "").trim().toLowerCase();
          const codeField = String(p?.code || "").trim().toLowerCase();
          return (
            barcode === normalized ||
            sku === normalized ||
            codeField === normalized
          );
        });

        consultaItems.value = exactRows.length ? exactRows : rows;
      } else {
        consultaItems.value = rows;
      }

      if (!consultaItems.value.length) {
        toast("Código no encontrado");
      }
    } catch (err) {
      console.error("[POS] consulta search error", err);
      toast(err?.response?.data?.message || err?.message || "No se pudo realizar la consulta");
      consultaItems.value = [];
    } finally {
      consultaLoading.value = false;
    }
  }

  async function handleManualConsulta(query) {
    await runConsultaSearch(query, { exact: false });
  }

  async function handleBarcodeConsulta(code) {
    await runConsultaSearch(code, { exact: true });
  }

  function handleAddConsultaToCart(product) {
    if (needsBranchPick.value) {
      toast("Falta la sucursal");
      return;
    }

    if (!canProceedWithCaja.value) {
      toast("Sin caja abierta");
      return;
    }

    if (typeof posStore.addToCart === "function") {
      posStore.addToCart(product);
    }

    toast(`${product?.name || product?.sku || product?.code || "Producto"} agregado`);
  }

  function handleSelectConsultaItem(product) {
    console.log("[POS][consulta] selected", product);
  }

  async function runScannerTest() {
    const code = String(scannerTestCode.value || "").trim();

    if (!code) {
      toast("Falta el código");
      return;
    }

    await handleBarcodeConsulta(code);
    scannerTestOpen.value = false;
  }

  async function initOnce() {
    if (initDone) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        loadCustomerDraft?.();

        if (customerHasData.value) {
          tryAttachCustomerToStore(customer.value);
        }

        await ensureBranchSelected().catch(() => {});
        await refreshCaja().catch(() => {});

        if (typeof loadPaymentMethods === "function") {
          await loadPaymentMethods(activeBranchId.value || null).catch(() => {});
        }
      } finally {
        initDone = true;
        initPromise = null;
      }
    })();

    return initPromise;
  }

  shared = {
    posStore,
    auth,

    helpOpen,
    showCartDialog,
    consultaOpen,
    consultaLoading,
    consultaItems,
    scannerTestOpen,
    scannerTestCode,
    branchPickOpen,
    snack,
    checkoutSubmitting,

    focusSearchSignal,
    refreshCatalogSignal,
    requestFocusSearch,
    requestRefreshCatalog,

    branchName,
    branchChipLabel,
    needsBranchPick,
    activeBranchId,

    currentCashRegister,
    currentCashRegisterId,
    otherOpenRegisters,
    branchOpenRegisters,
    zombieDialog,
    closeZombieAndOpen,
    cancelZombieDialog,
    summary,
    cajaBusy,
    isCajaOpen,

    cajaType,
    invoiceMode,
    invoiceType,
    openingAmount,
    openingNote,
    openedAt,

    cajaTypeOptions,
    invoiceModeOptions,
    invoiceTypeOptions,

    cajaTypeLabel,
    invoiceTypeLabel,

    cajaConfigOpen,
    cajaArqueoOpen,

    cashierName,
    loadingGlobal,

    branchPickSelected,
    uiBranchesForSelect,
    hasMultiBranches,
    cartBranchLabel,
    getActiveBranchIdSafe,

    customer,
    customerHasData,
    customerDisabled,

    checkoutDialog,
    checkoutTotal,
    checkoutTotalPreview,

    receiptOpen,
    receiptSale,
    receiptCompanyName,

    paymentMethods,
    paymentMethodsLoading,
    paymentMethodId,
    installments,
    applyReseller,
    paymentProof,
    cashInput,
    cashError,
    cashErrorMsg,
    cardKind,

    mixedMode,
    mixedPayments,

    checkoutInvoiceMode,
    checkoutInvoiceType,
    customerType,

    selectedPaymentMethod,
    selectedPaymentMethodMeta,

    cartItems,
    cartCount,
    cartEditable,

    openBranchSwitch,
    confirmActiveBranchChange,
    clearCustomer,

    // Los disparadores públicos ya deciden ventana (escritorio) o vista (teléfono).
    openCajaConfig: abrirCajaUI,
    closeCajaConfig,
    openCajaArqueo: cerrarCajaUI,
    closeCajaArqueo,
    openCaja,
    closeCaja,
    refreshCaja,
    totalsSummary,
    addMovement,
    loadingClose: cajaLoadingClose,
    loadingOpen: cajaLoadingOpen,

    loadPaymentMethods,
    openCheckoutSafe,
    handleGoPayFromCart,
    refresh,
    onCloseCaja,
    reloadSummaryFromArqueo,
    onSaveCajaConfig,
    onSaveArqueo,
    onCheckoutConfirm,
    onCheckoutCancel,

    handleManualConsulta,
    handleBarcodeConsulta,
    handleAddConsultaToCart,
    handleSelectConsultaItem,
    runScannerTest,
    resetCheckoutUiState,
    toast,
    closeSnack,
    initOnce,
  };

  initOnce().catch((err) => {
    console.error("[POS] initOnce error", err);
  });

  return shared;
}