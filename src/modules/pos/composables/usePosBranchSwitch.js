// src/modules/pos/composables/usePosBranchSwitch.js
import { ref, computed } from "vue";

export function usePosBranchSwitch({
  posStore,
  branchPickOpen,
  activeBranchId,
  branchItems,
  fetchedBranches,
  ensureBranchSelected,
  fetchGlobalPool,
  toast,
}) {
  const branchPickSelected = ref(null);

  const uiBranchesForSelect = computed(() => {
    const fetched = Array.isArray(fetchedBranches?.value) ? fetchedBranches.value : [];

    if (fetched.length) {
      return fetched
        .map((branch) => {
          const value = Number(branch?.id ?? branch?.branch_id ?? 0) || null;
          if (!value) return null;

          const title =
            String(branch?.name ?? branch?.branch_name ?? "").trim() ||
            `Sucursal #${value}`;

          return { title, value };
        })
        .filter(Boolean);
    }

    const localItems = Array.isArray(branchItems?.value) ? branchItems.value : [];

    return localItems
      .map((item) => {
        const value = Number(item?.value ?? item?.id ?? 0) || null;
        if (!value) return null;

        const title =
          String(item?.title ?? item?.name ?? "").trim() ||
          `Sucursal #${value}`;

        return { title, value };
      })
      .filter(Boolean);
  });

  const hasMultiBranches = computed(() => uiBranchesForSelect.value.length > 1);

  function getActiveBranchIdSafe() {
    const current = activeBranchId?.value;
    return Number(
      current?.id ??
        current?.value ??
        current ??
        posStore?.branch_id ??
        posStore?.active_branch_id ??
        0
    ) || null;
  }

  const cartBranchLabel = computed(() => {
    const branchId =
      Number(posStore?.cart_branch_id ?? posStore?.cartBranchId ?? 0) || null;

    if (!branchId) return "";

    const found = uiBranchesForSelect.value.find(
      (option) => Number(option.value) === branchId
    );

    return found?.title || `Sucursal #${branchId}`;
  });

  function openBranchSwitch() {
    if (!hasMultiBranches.value) return;

    if ((posStore?.cart || []).length > 0) {
      toast?.("🧠 Terminá la venta o vaciá el carrito antes de cambiar sucursal.");
      return;
    }

    branchPickSelected.value = getActiveBranchIdSafe();
    branchPickOpen.value = true;
  }

  async function persistBranchLocally(branchId) {
    try {
      localStorage.setItem("pos_branch_id", String(branchId));
      localStorage.setItem("active_branch_id", String(branchId));
      localStorage.setItem("branch_id", String(branchId));
    } catch {}
  }

  function applyBranchToStore(branchId) {
    try {
      if (typeof posStore?.setBranchId === "function") {
        posStore.setBranchId(branchId);
        return true;
      }

      if (typeof posStore?.setActiveBranch === "function") {
        posStore.setActiveBranch(branchId);
        return true;
      }

      if (typeof posStore?.$patch === "function") {
        posStore.$patch({
          branch_id: branchId,
          active_branch_id: branchId,
        });
        return true;
      }

      posStore.branch_id = branchId;
      posStore.active_branch_id = branchId;
      return true;
    } catch (error) {
      console.warn("[POS] No se pudo aplicar branch al store", error);
      return false;
    }
  }

  async function confirmActiveBranchChange() {
    if ((posStore?.cart || []).length > 0) {
      toast?.("🧠 Terminá la venta o vaciá el carrito antes de cambiar sucursal.");
      branchPickOpen.value = false;
      return;
    }

    const nextId = Number(branchPickSelected.value || 0) || null;
    if (!nextId) {
      toast?.("⚠️ Seleccioná una sucursal.");
      return;
    }

    const currentId = getActiveBranchIdSafe();
    if (currentId && currentId === nextId) {
      branchPickOpen.value = false;
      return;
    }

    applyBranchToStore(nextId);
    await persistBranchLocally(nextId);

    try {
      activeBranchId.value = nextId;
    } catch {}

    try {
      await ensureBranchSelected?.();
    } catch (error) {
      console.warn("[POS] ensureBranchSelected falló al cambiar sucursal", error);
    }

    branchPickOpen.value = false;

    try {
      await fetchGlobalPool?.({ in_stock: 0 });
    } catch (error) {
      console.warn("[POS] fetchGlobalPool falló al cambiar sucursal", error);
    }

    toast?.("✅ Sucursal activa actualizada");
  }

  return {
    branchPickSelected,
    uiBranchesForSelect,
    hasMultiBranches,
    cartBranchLabel,
    getActiveBranchIdSafe,
    openBranchSwitch,
    confirmActiveBranchChange,
  };
}