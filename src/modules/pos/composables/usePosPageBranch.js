import { computed, ref } from "vue";

export function usePosPageBranch({
  posStore,
  fetchedBranches,
  branchItems,
  activeBranchId,
  ensureBranchSelected,
  fetchGlobalPool,
  toast,
}) {
  const branchPickSelected = ref(null);

  const uiBranchesForSelect = computed(() => {
    const fb = Array.isArray(fetchedBranches?.value) ? fetchedBranches.value : [];
    if (fb.length) {
      return fb
        .map((b) => {
          const value = Number(b?.id ?? b?.branch_id ?? 0) || null;
          if (!value) return null;
          const title =
            String(b?.name ?? b?.branch_name ?? "").trim() ||
            `Sucursal #${value}`;
          return { title, value };
        })
        .filter(Boolean);
    }

    const raw = Array.isArray(branchItems?.value) ? branchItems.value : [];
    return raw
      .map((it) => {
        const value = Number(it?.value ?? it?.id ?? 0) || null;
        if (!value) return null;
        const title =
          String(it?.title ?? it?.name ?? "").trim() ||
          `Sucursal #${value}`;
        return { title, value };
      })
      .filter(Boolean);
  });

  const hasMultiBranches = computed(
    () => uiBranchesForSelect.value.length > 1
  );

  function getActiveBranchIdSafe() {
    const v = activeBranchId?.value;
    return (
      Number(v?.id ?? v?.value ?? v ?? posStore?.branch_id ?? 0) || null
    );
  }

  const cartBranchLabel = computed(() => {
    const id =
      Number(posStore?.cart_branch_id ?? posStore?.cartBranchId ?? 0) ||
      null;
    if (!id) return "";

    const found = uiBranchesForSelect.value.find(
      (x) => Number(x.value) === id
    );

    return found?.title || `Sucursal #${id}`;
  });

  function openBranchSwitch(cart) {
    if (!hasMultiBranches.value) return;

    if ((cart || []).length) {
      toast("🧠 Terminá la venta antes de cambiar sucursal.");
      return;
    }

    branchPickSelected.value = getActiveBranchIdSafe();
    return true;
  }

  async function confirmActiveBranchChange({
    cart,
    branchPickOpen,
  }) {
    if ((cart || []).length) {
      toast("🧠 Terminá la venta antes de cambiar sucursal.");
      return;
    }

    const nextId = Number(branchPickSelected.value || 0) || null;
    if (!nextId) return;

    try {
      if (typeof posStore.setBranchId === "function")
        posStore.setBranchId(nextId);
      else if (typeof posStore.$patch === "function")
        posStore.$patch({ branch_id: nextId });
      else posStore.branch_id = nextId;
    } catch {}

    try {
      localStorage.setItem("pos_branch_id", String(nextId));
    } catch {}

    try {
      activeBranchId.value = nextId;
    } catch {}

    try {
      await ensureBranchSelected?.();
    } catch {}

    branchPickOpen.value = false;

    try {
      await fetchGlobalPool({ in_stock: 0 });
    } catch {}

    toast("✅ Sucursal actualizada");
  }

  return {
    uiBranchesForSelect,
    hasMultiBranches,
    cartBranchLabel,
    branchPickSelected,
    openBranchSwitch,
    confirmActiveBranchChange,
    getActiveBranchIdSafe,
  };
}