import { computed, ref } from "vue";
import {
  getCurrentCashRegister,
  openCashRegister,
  getCashRegisterSummary,
  closeCashRegister,
} from "@/modules/pos/services/posCashRegisters.service";

function toNum(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function pickData(res) {
  if (!res) return null;
  if (res.data && typeof res.data === "object") return res.data;
  return res;
}

function normalizeCurrentCashRegister(raw) {
  const data = pickData(raw);

  if (!data || typeof data !== "object") return null;

  const cashRegister =
    data.cash_register ||
    data.cashRegister ||
    data.current ||
    data.item ||
    data;

  if (!cashRegister || typeof cashRegister !== "object") {
    return null;
  }

  const id = cashRegister.id ?? cashRegister.cash_register_id ?? null;
  if (!id) return null;

  return {
    ...cashRegister,
    id,
    caja_type:
      cashRegister.caja_type ||
      cashRegister.cash_register_type ||
      cashRegister.type ||
      "GENERAL",
    invoice_mode:
      cashRegister.invoice_mode ||
      cashRegister.billing_mode ||
      "NO_FISCAL",
    invoice_type:
      cashRegister.invoice_type ||
      cashRegister.document_type ||
      "TICKET",
    opening_amount:
      cashRegister.opening_amount ??
      cashRegister.opening_cash ??
      cashRegister.initial_amount ??
      0,
    note:
      cashRegister.note ||
      cashRegister.opening_note ||
      "",
    status: cashRegister.status || "OPEN",
  };
}

function normalizeSummary(raw, current = null) {
  const data = pickData(raw) || {};
  const summary =
    data.summary ||
    data.cash_register_summary ||
    data.item ||
    data;

  const totals = summary?.totals || {};

  return {
    ...summary,
    totals: {
      opening_cash: toNum(
        totals.opening_cash ??
          current?.opening_amount ??
          summary?.opening_cash ??
          0
      ),
      manual_in: toNum(totals.manual_in ?? summary?.manual_in ?? 0),
      manual_out: toNum(totals.manual_out ?? summary?.manual_out ?? 0),
      expected_cash: toNum(
        totals.expected_cash ??
          summary?.expected_cash ??
          current?.opening_amount ??
          0
      ),
      sales_count: toNum(totals.sales_count ?? summary?.sales_count ?? 0),
      sales_total: toNum(totals.sales_total ?? summary?.sales_total ?? 0),
      paid_total: toNum(totals.paid_total ?? summary?.paid_total ?? 0),
      cash_sales: toNum(totals.cash_sales ?? summary?.cash_sales ?? 0),
    },
    payments_by_method: {
      cash: toNum(summary?.payments_by_method?.cash ?? 0),
      card: toNum(summary?.payments_by_method?.card ?? 0),
      transfer: toNum(summary?.payments_by_method?.transfer ?? 0),
      qr: toNum(summary?.payments_by_method?.qr ?? 0),
      mercadopago: toNum(summary?.payments_by_method?.mercadopago ?? 0),
      credit_sjt: toNum(summary?.payments_by_method?.credit_sjt ?? 0),
      other: toNum(summary?.payments_by_method?.other ?? 0),
      raw_by_method: summary?.payments_by_method?.raw_by_method || {},
    },
    movements: Array.isArray(summary?.movements) ? summary.movements : [],
    sales: Array.isArray(summary?.sales) ? summary.sales : [],
  };
}

export function usePosCajaUi() {
  const cajaConfigOpen = ref(false);
  const cajaArqueoOpen = ref(false);

  const isCajaOpen = ref(false);

  const cajaType = ref("GENERAL");
  const invoiceMode = ref("NO_FISCAL");
  const invoiceType = ref("TICKET");
  const openingAmount = ref("");
  const openingNote = ref("");

  const currentCashRegister = ref(null);
  const currentCashRegisterId = ref(null);
  const arqueoSummary = ref(null);

  const loadingCurrent = ref(false);
  const loadingSummary = ref(false);
  const savingCajaConfig = ref(false);
  const savingArqueo = ref(false);

  const cajaError = ref("");

  const cajaTypeOptions = [
    { title: "General", value: "GENERAL", icon: "mdi-storefront-outline" },
    { title: "Turno", value: "SHIFT", icon: "mdi-account-clock-outline" },
    { title: "Sucursal", value: "BRANCH", icon: "mdi-domain" },
    { title: "Móvil", value: "MOBILE", icon: "mdi-cellphone" },
  ];

  const invoiceModeOptions = [
    { title: "Sin facturación", value: "NO_FISCAL", icon: "mdi-receipt-text-outline" },
    { title: "Fiscal", value: "FISCAL", icon: "mdi-file-document-check-outline" },
    { title: "Mixta", value: "MIXED", icon: "mdi-swap-horizontal" },
    { title: "Solo ticket", value: "TICKET_ONLY", icon: "mdi-ticket-percent-outline" },
  ];

  const invoiceTypeOptions = [
    { title: "Ticket", value: "TICKET" },
    { title: "Factura A", value: "A" },
    { title: "Factura B", value: "B" },
    { title: "Factura C", value: "C" },
    { title: "Nota crédito", value: "NC" },
  ];

  const cajaTypeLabel = computed(() => {
    return cajaTypeOptions.find((x) => x.value === cajaType.value)?.title || "";
  });

  const invoiceModeLabel = computed(() => {
    return invoiceModeOptions.find((x) => x.value === invoiceMode.value)?.title || "";
  });

  const invoiceTypeLabel = computed(() => {
    return invoiceTypeOptions.find((x) => x.value === invoiceType.value)?.title || "";
  });

  const isLoadingCaja = computed(() => loadingCurrent.value || loadingSummary.value);
  const isSavingCaja = computed(() => savingCajaConfig.value || savingArqueo.value);

  function resetCajaState() {
    isCajaOpen.value = false;
    currentCashRegister.value = null;
    currentCashRegisterId.value = null;
    arqueoSummary.value = null;

    cajaType.value = "GENERAL";
    invoiceMode.value = "NO_FISCAL";
    invoiceType.value = "TICKET";
    openingAmount.value = "";
    openingNote.value = "";
  }

  function applyCurrentCashRegister(cashRegister) {
    if (!cashRegister) {
      resetCajaState();
      return;
    }

    currentCashRegister.value = cashRegister;
    currentCashRegisterId.value = cashRegister.id;
    isCajaOpen.value = String(cashRegister.status || "OPEN").toUpperCase() !== "CLOSED";

    cajaType.value = String(cashRegister.caja_type || "GENERAL");
    invoiceMode.value = String(cashRegister.invoice_mode || "NO_FISCAL");
    invoiceType.value = String(cashRegister.invoice_type || "TICKET");
    openingAmount.value = String(cashRegister.opening_amount ?? "");
    openingNote.value = String(cashRegister.note || "");
  }

  async function loadCurrentCaja() {
    loadingCurrent.value = true;
    cajaError.value = "";

    try {
      const res = await getCurrentCashRegister();
      const current = normalizeCurrentCashRegister(res);

      if (!current) {
        resetCajaState();
        return {
          ok: true,
          data: null,
        };
      }

      applyCurrentCashRegister(current);

      return {
        ok: true,
        data: current,
      };
    } catch (error) {
      if (error?.status === 404) {
        resetCajaState();
        return {
          ok: true,
          data: null,
        };
      }

      cajaError.value = error?.message || "No se pudo cargar la caja actual";
      throw error;
    } finally {
      loadingCurrent.value = false;
    }
  }

  async function loadCajaSummary(id = null) {
    const cashRegisterId = id || currentCashRegisterId.value;

    if (!cashRegisterId) {
      arqueoSummary.value = null;
      return {
        ok: false,
        message: "No hay caja abierta para consultar resumen",
      };
    }

    loadingSummary.value = true;
    cajaError.value = "";

    try {
      const res = await getCashRegisterSummary(cashRegisterId);
      const summary = normalizeSummary(res, currentCashRegister.value);
      arqueoSummary.value = summary;

      return {
        ok: true,
        data: summary,
      };
    } catch (error) {
      cajaError.value = error?.message || "No se pudo cargar el resumen de caja";
      throw error;
    } finally {
      loadingSummary.value = false;
    }
  }

  async function refreshCajaState() {
    const currentRes = await loadCurrentCaja();

    if (currentRes?.data?.id) {
      await loadCajaSummary(currentRes.data.id);
    } else {
      arqueoSummary.value = null;
    }

    return {
      ok: true,
      data: {
        current: currentCashRegister.value,
        summary: arqueoSummary.value,
      },
    };
  }

  function openCajaConfig() {
    cajaError.value = "";
    cajaConfigOpen.value = true;
  }

  function closeCajaConfig() {
    cajaConfigOpen.value = false;
  }

  async function openCajaArqueo() {
    cajaError.value = "";

    if (!currentCashRegisterId.value) {
      await loadCurrentCaja();
    }

    if (!currentCashRegisterId.value) {
      throw new Error("No hay una caja abierta para realizar el arqueo");
    }

    await loadCajaSummary(currentCashRegisterId.value);
    cajaArqueoOpen.value = true;
  }

  function closeCajaArqueo() {
    cajaArqueoOpen.value = false;
  }

  async function saveCajaConfig(payload = {}) {
    savingCajaConfig.value = true;
    cajaError.value = "";

    try {
      const requestPayload = {
        caja_type: String(payload.caja_type || cajaType.value || "GENERAL"),
        invoice_mode: String(payload.invoice_mode || invoiceMode.value || "NO_FISCAL"),
        invoice_type: String(payload.invoice_type || invoiceType.value || "TICKET"),
        opening_cash: toNum(
          payload.opening_cash ?? payload.opening_amount ?? openingAmount.value ?? 0
        ),
        opening_note: String(
          payload.opening_note || payload.note || openingNote.value || ""
        ),
      };

      const res = await openCashRegister(requestPayload);
      const opened = normalizeCurrentCashRegister(res);

      if (opened) {
        applyCurrentCashRegister(opened);
      } else {
        await loadCurrentCaja();
      }

      if (currentCashRegisterId.value) {
        await loadCajaSummary(currentCashRegisterId.value);
      }

      cajaConfigOpen.value = false;

      return {
        ok: true,
        data: currentCashRegister.value,
      };
    } catch (error) {
      cajaError.value = error?.message || "No se pudo abrir la caja";
      throw error;
    } finally {
      savingCajaConfig.value = false;
    }
  }

  async function closeCaja(payload = {}) {
    savingArqueo.value = true;
    cajaError.value = "";

    try {
      if (!currentCashRegisterId.value) {
        throw new Error("No hay caja abierta para cerrar");
      }

      const closePayload = {
        closing_cash: toNum(payload.closing_cash ?? 0),
        closing_note: String(payload.closing_note || payload.note || ""),
      };

      const res = await closeCashRegister(currentCashRegisterId.value, closePayload);

      cajaArqueoOpen.value = false;

      await loadCurrentCaja();
      if (currentCashRegisterId.value) {
        await loadCajaSummary(currentCashRegisterId.value);
      } else {
        arqueoSummary.value = null;
      }

      return {
        ok: true,
        data: pickData(res),
      };
    } catch (error) {
      cajaError.value = error?.message || "No se pudo cerrar la caja";
      throw error;
    } finally {
      savingArqueo.value = false;
    }
  }

  async function saveArqueo(payload = {}) {
    return closeCaja(payload);
  }

  return {
    cajaConfigOpen,
    cajaArqueoOpen,
    isCajaOpen,

    cajaType,
    invoiceMode,
    invoiceType,
    openingAmount,
    openingNote,

    currentCashRegister,
    currentCashRegisterId,
    arqueoSummary,

    loadingCurrent,
    loadingSummary,
    savingCajaConfig,
    savingArqueo,
    isLoadingCaja,
    isSavingCaja,
    cajaError,

    cajaTypeOptions,
    invoiceModeOptions,
    invoiceTypeOptions,

    cajaTypeLabel,
    invoiceModeLabel,
    invoiceTypeLabel,

    openCajaConfig,
    closeCajaConfig,
    openCajaArqueo,
    closeCajaArqueo,
    saveCajaConfig,
    closeCaja,
    saveArqueo,

    loadCurrentCaja,
    loadCajaSummary,
    refreshCajaState,
    resetCajaState,
  };
}

export default usePosCajaUi;