// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/pos/composables/usePosCashRegister.js

import { ref, computed } from "vue";
import {
  getCurrentCashRegister,
  openCashRegister,
  getCashRegisterSummary,
  createCashRegisterMovement,
  closeCashRegister,
} from "../services/posCashRegisters.service";

function toNum(v, d = 0) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : d;
}

function upper(v) {
  return String(v || "").trim().toUpperCase();
}

function normalizeCajaType(v) {
  const x = upper(v);
  return ["GENERAL", "SHIFT", "BRANCH", "MOBILE"].includes(x) ? x : "";
}

function normalizeInvoiceMode(v) {
  const x = upper(v);
  return ["NO_FISCAL", "FISCAL", "MIXED", "TICKET_ONLY"].includes(x) ? x : "";
}

function normalizeInvoiceType(v) {
  const x = upper(v);
  return ["TICKET", "A", "B", "C"].includes(x) ? x : "";
}

function getCajaTypeLabel(v) {
  const map = {
    GENERAL: "General",
    SHIFT: "Turno",
    BRANCH: "Sucursal",
    MOBILE: "Móvil",
  };
  return map[upper(v)] || "";
}

function getInvoiceModeLabel(v) {
  const map = {
    NO_FISCAL: "Sin facturación",
    FISCAL: "Fiscal",
    MIXED: "Mixta",
    TICKET_ONLY: "Solo ticket",
  };
  return map[upper(v)] || "";
}

function getInvoiceTypeLabel(v) {
  const map = {
    TICKET: "Ticket",
    A: "Factura A",
    B: "Factura B",
    C: "Factura C",
  };
  return map[upper(v)] || "";
}

export function usePosCashRegister() {
  const currentCashRegister = ref(null);
  const otherOpenRegisters = ref([]);
  const branchOpenRegisters = ref([]);
  const summary = ref(null);

  const loadingCurrent = ref(false);
  const loadingOpen = ref(false);
  const loadingSummary = ref(false);
  const loadingMovement = ref(false);
  const loadingClose = ref(false);

  const lastError = ref(null);

  // ✅ estado de diálogos que PosPage.vue espera
  const cajaConfigOpen = ref(false);
  const cajaArqueoOpen = ref(false);

  // ✅ opciones que PosPage.vue espera
  const cajaTypeOptions = [
    { title: "General", value: "GENERAL" },
    { title: "Turno", value: "SHIFT" },
    { title: "Sucursal", value: "BRANCH" },
    { title: "Móvil", value: "MOBILE" },
  ];

  const invoiceModeOptions = [
    { title: "Sin facturación", value: "NO_FISCAL" },
    { title: "Fiscal", value: "FISCAL" },
    { title: "Mixta", value: "MIXED" },
    { title: "Solo ticket", value: "TICKET_ONLY" },
  ];

  const invoiceTypeOptions = [
    { title: "Ticket", value: "TICKET" },
    { title: "Factura A", value: "A" },
    { title: "Factura B", value: "B" },
    { title: "Factura C", value: "C" },
  ];

  const currentCashRegisterId = computed(() => {
    return Number(currentCashRegister.value?.id || 0) || 0;
  });

  const isCajaOpen = computed(() => {
    return upper(currentCashRegister.value?.status) === "OPEN";
  });

  const cajaType = computed(() => {
    return normalizeCajaType(currentCashRegister.value?.caja_type);
  });

  const invoiceMode = computed(() => {
    return normalizeInvoiceMode(currentCashRegister.value?.invoice_mode);
  });

  const invoiceType = computed(() => {
    return normalizeInvoiceType(currentCashRegister.value?.invoice_type);
  });

  const cajaTypeLabel = computed(() => getCajaTypeLabel(cajaType.value));
  const invoiceModeLabel = computed(() => getInvoiceModeLabel(invoiceMode.value));
  const invoiceTypeLabel = computed(() => getInvoiceTypeLabel(invoiceType.value));

  const openingAmount = computed(() => {
    return toNum(currentCashRegister.value?.opening_cash, 0);
  });

  const openingNote = computed(() => {
    return String(currentCashRegister.value?.opening_note || "");
  });

  const openedAt = computed(() => {
    return currentCashRegister.value?.opened_at || null;
  });

  const expectedCash = computed(() => {
    return toNum(summary.value?.totals?.expected_cash, 0);
  });

  const paymentsByMethod = computed(() => {
    const src = summary.value?.payments_by_method || {};
    return {
      cash: toNum(src.cash, 0),
      card: toNum(src.card, 0),
      transfer: toNum(src.transfer, 0),
      qr: toNum(src.qr, 0),
      mercadopago: toNum(src.mercadopago, 0),
      credit_sjt: toNum(src.credit_sjt, 0),
      other: toNum(src.other, 0),
    };
  });

  const totalsSummary = computed(() => {
    const src = summary.value?.totals || {};
    return {
      opening_cash: toNum(src.opening_cash, 0),
      sales_count: toNum(src.sales_count, 0),
      sales_total: toNum(src.sales_total, 0),
      paid_total: toNum(src.paid_total, 0),
      manual_in: toNum(src.manual_in, 0),
      manual_out: toNum(src.manual_out, 0),
      cash_sales: toNum(src.cash_sales, 0),
      expected_cash: toNum(src.expected_cash, 0),
    };
  });

  // ✅ FIX:
  // Para vender alcanza con que la caja exista y esté abierta.
  // No bloqueamos por metadata faltante del backend.
const canSellWithCaja = computed(() => {
  return isCajaOpen.value;
});
  const isBusy = computed(() => {
    return (
      loadingCurrent.value ||
      loadingOpen.value ||
      loadingSummary.value ||
      loadingMovement.value ||
      loadingClose.value
    );
  });

  function clearError() {
    lastError.value = null;
  }

  function setError(error) {
    lastError.value = error || null;
    return error;
  }

  // ✅ helpers UI que PosPage.vue espera
  function openCajaConfig() {
    cajaConfigOpen.value = true;
  }

  function closeCajaConfig() {
    cajaConfigOpen.value = false;
  }

  async function openCajaArqueo() {
    if (currentCashRegisterId.value) {
      try {
        await loadSummary(currentCashRegisterId.value);
      } catch (e) {
        console.warn("[POS] no se pudo cargar resumen antes de abrir arqueo", e);
      }
    }
    cajaArqueoOpen.value = true;
  }

  function closeCajaArqueo() {
    cajaArqueoOpen.value = false;
  }

  async function loadCurrentCashRegister() {
    loadingCurrent.value = true;
    clearError();

    try {
      const res = await getCurrentCashRegister();
      currentCashRegister.value = res?.data || null;

      // Otras cajas abiertas del mismo user (zombies al cambiar de branch)
      otherOpenRegisters.value = Array.isArray(res?.other_open_registers)
        ? res.other_open_registers
        : Array.isArray(res?.data?.other_open_registers)
          ? res.data.other_open_registers
          : [];

      // Cajas abiertas en la sucursal por otros usuarios (modo supervisión).
      branchOpenRegisters.value = Array.isArray(res?.branch_open_registers)
        ? res.branch_open_registers
        : Array.isArray(res?.data?.branch_open_registers)
          ? res.data.branch_open_registers
          : [];

      if (!currentCashRegister.value) {
        summary.value = null;
      }

      return currentCashRegister.value;
    } catch (error) {
      setError(error);
      currentCashRegister.value = null;
      otherOpenRegisters.value = [];
      branchOpenRegisters.value = [];
      summary.value = null;
      throw error;
    } finally {
      loadingCurrent.value = false;
    }
  }

  async function openCaja(payload = {}) {
    loadingOpen.value = true;
    clearError();

    try {
      const body = {
        opening_cash: toNum(payload.opening_cash ?? payload.opening_amount, 0),
        opening_note:
          String(payload.opening_note ?? payload.note ?? "").trim() || null,
        caja_type: normalizeCajaType(payload.caja_type) || "GENERAL",
        invoice_mode: normalizeInvoiceMode(payload.invoice_mode) || "NO_FISCAL",
        invoice_type: normalizeInvoiceType(payload.invoice_type) || "TICKET",
      };

      const res = await openCashRegister(body);
      currentCashRegister.value = res?.data || null;

      if (currentCashRegister.value?.id) {
        try {
          await loadSummary(currentCashRegister.value.id);
        } catch (e) {
          console.warn("[POS] summary post-open falló", e);
        }
      }

      return currentCashRegister.value;
    } catch (error) {
      if (error?.status === 409) {
        try {
          const current = await getCurrentCashRegister();
          currentCashRegister.value = current?.data || null;
        } catch {}
      }

      setError(error);
      throw error;
    } finally {
      loadingOpen.value = false;
    }
  }

  async function loadSummary(cashRegisterId = null) {
    loadingSummary.value = true;
    clearError();

    try {
      const id = Number(cashRegisterId || currentCashRegisterId.value || 0);
      if (!id) {
        summary.value = null;
        return null;
      }

      const res = await getCashRegisterSummary(id);

      // ✅ FIX:
      // Soporta varias formas de respuesta del backend.
      const raw =
        res?.data?.data ||
        res?.data?.summary ||
        res?.data ||
        null;

      summary.value = raw;

      console.log("🔥 SUMMARY DEBUG:", raw);

      if (summary.value?.cash_register) {
        currentCashRegister.value = summary.value.cash_register;
      }

      return summary.value;
    } catch (error) {
      setError(error);
      summary.value = null;
      throw error;
    } finally {
      loadingSummary.value = false;
    }
  }

  async function addMovement(payload = {}) {
    loadingMovement.value = true;
    clearError();

    try {
      const id = Number(currentCashRegisterId.value || 0);
      if (!id) throw new Error("No hay caja abierta.");

      const body = {
        type: upper(payload.type || "IN"),
        reason: String(payload.reason || "").trim(),
        note: String(payload.note || "").trim() || null,
        amount: toNum(payload.amount, 0),
      };

      const res = await createCashRegisterMovement(id, body);
      await loadSummary(id);
      return res;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      loadingMovement.value = false;
    }
  }

  async function closeCaja(payload = {}) {
    loadingClose.value = true;
    clearError();

    try {
      const id = Number(currentCashRegisterId.value || 0);
      if (!id) throw new Error("No hay caja abierta.");

      const closingCash = toNum(
        payload.closing_cash ?? payload.cash_counted ?? payload?.declared?.cash,
        0
      );

      const body = {
        closing_cash: closingCash,
        closing_note:
          String(
            payload.closing_note ??
              payload.note ??
              "Cierre de caja"
          ).trim() || "Cierre de caja",
      };

      const res = await closeCashRegister(id, body);

      currentCashRegister.value = null;
      summary.value = res?.data?.summary || res?.data || null;
      cajaArqueoOpen.value = false;

      return res;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      loadingClose.value = false;
    }
  }

  async function refreshCaja(options = {}) {
    const withSummary = options?.withSummary !== false;
    const silentSummaryError = options?.silentSummaryError !== false;

    const current = await loadCurrentCashRegister();

    if (withSummary && current?.id) {
      try {
        await loadSummary(current.id);
      } catch (e) {
        if (!silentSummaryError) throw e;
        console.warn("[POS] summary refresh falló", e);
      }
    }

    return current;
  }

  return {
    currentCashRegister,
    otherOpenRegisters,
    branchOpenRegisters,
    summary,
    lastError,

    loadingCurrent,
    loadingOpen,
    loadingSummary,
    loadingMovement,
    loadingClose,
    isBusy,

    currentCashRegisterId,
    isCajaOpen,
    cajaType,
    invoiceMode,
    invoiceType,
    cajaTypeLabel,
    invoiceModeLabel,
    invoiceTypeLabel,
    openingAmount,
    openingNote,
    openedAt,
    expectedCash,
    paymentsByMethod,
    totalsSummary,
    canSellWithCaja,

    // ✅ opciones para dialogs
    cajaTypeOptions,
    invoiceModeOptions,
    invoiceTypeOptions,

    // ✅ estado dialogs
    cajaConfigOpen,
    cajaArqueoOpen,
    openCajaConfig,
    closeCajaConfig,
    openCajaArqueo,
    closeCajaArqueo,

    clearError,
    loadCurrentCashRegister,
    openCaja,
    loadSummary,
    addMovement,
    closeCaja,
    refreshCaja,
  };
}

export default usePosCashRegister;