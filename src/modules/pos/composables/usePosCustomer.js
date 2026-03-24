// src/modules/pos/composables/usePosCustomer.js
import { ref, computed, watch } from "vue";

const CUSTOMER_DRAFT_KEY = "pos_customer_draft_v1";

function emptyCustomer() {
  return {
    name: "",
    doc: "",
    phone: "",
    email: "",
    address: "",
    note: "",
  };
}

function normalizeCustomer(obj) {
  const o = obj && typeof obj === "object" ? obj : {};
  return {
    name: String(o.name ?? o.full_name ?? o.razon_social ?? o.company ?? "").trim(),
    doc: String(o.doc ?? o.dni ?? o.cuit ?? o.document ?? "").trim(),
    phone: String(o.phone ?? o.tel ?? o.telefono ?? "").trim(),
    email: String(o.email ?? "").trim(),
    address: String(o.address ?? o.direccion ?? "").trim(),
    note: String(o.note ?? o.obs ?? o.observaciones ?? "").trim(),
  };
}

export function usePosCustomer({
  posStore,
  loadingGlobal,
  isViewOnly,
  needsBranchPick,
  canSell,
}) {
  const customer = ref(emptyCustomer());

  const customerHasData = computed(() => {
    const c = customer.value || {};
    return !!(
      String(c.name || "").trim() ||
      String(c.doc || "").trim() ||
      String(c.phone || "").trim() ||
      String(c.email || "").trim() ||
      String(c.address || "").trim() ||
      String(c.note || "").trim()
    );
  });

  const customerDisabled = computed(() => {
    return !!loadingGlobal?.value || !!isViewOnly?.value || !!needsBranchPick?.value || !canSell?.value;
  });

  function tryAttachCustomerToStore(custOrNull) {
    const payload = custOrNull ? normalizeCustomer(custOrNull) : null;

    const candidates = [
      ["setCustomer", (s) => s.setCustomer(payload)],
      ["setClient", (s) => s.setClient(payload)],
      ["setBuyer", (s) => s.setBuyer(payload)],
      ["setCustomerDraft", (s) => s.setCustomerDraft(payload)],
      ["setCustomerInfo", (s) => s.setCustomerInfo(payload)],
    ];

    for (const [name, fn] of candidates) {
      try {
        if (typeof posStore?.[name] === "function") {
          fn(posStore);
          return true;
        }
      } catch (e) {
        console.warn("[POS] customer attach method failed:", name, e);
      }
    }

    try {
      if (typeof posStore?.$patch === "function") {
        posStore.$patch({
          customer: payload,
          customer_info: payload,
          customerInfo: payload,
        });
        return true;
      }
    } catch {}

    try {
      posStore.customer = payload;
      posStore.customer_info = payload;
      posStore.customerInfo = payload;
      return true;
    } catch {}

    return false;
  }

  function loadCustomerDraft() {
    try {
      const raw = localStorage.getItem(CUSTOMER_DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      customer.value = normalizeCustomer(parsed);
    } catch {}
  }

  function saveCustomerDraft() {
    try {
      localStorage.setItem(CUSTOMER_DRAFT_KEY, JSON.stringify(normalizeCustomer(customer.value)));
    } catch {}
  }

  function clearCustomer() {
    customer.value = emptyCustomer();

    try {
      localStorage.removeItem(CUSTOMER_DRAFT_KEY);
    } catch {}

    tryAttachCustomerToStore(null);
  }

  watch(
    () => customer.value,
    () => {
      if (customerDisabled.value) return;
      saveCustomerDraft();
    },
    { deep: true }
  );

  return {
    customer,
    customerHasData,
    customerDisabled,
    normalizeCustomer,
    emptyCustomer,
    tryAttachCustomerToStore,
    loadCustomerDraft,
    saveCustomerDraft,
    clearCustomer,
  };
}