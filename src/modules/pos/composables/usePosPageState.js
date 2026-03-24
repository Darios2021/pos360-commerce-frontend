import { ref, computed } from "vue";

export function usePosPageState() {
  const helpOpen = ref(false);
  const filtersRef = ref(null);

  const snack = ref({
    show: false,
    text: "",
  });

  const shiftStart = ref(new Date());

  const detailsOpen = ref(false);
  const detailsItem = ref(null);

  const pickBranchOpen = ref(false);
  const pickBranchProduct = ref(null);
  const pickBranchOptions = ref([]);

  const branchPickSelected = ref(null);

  const shiftStartText = computed(() => {
    const d = shiftStart.value || new Date();
    return new Date(d).toLocaleString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  });

  function toast(text) {
    snack.value = {
      show: true,
      text: String(text || ""),
    };
  }

  function openDetails(item) {
    detailsItem.value = item || null;
    detailsOpen.value = true;
  }

  function closeDetails() {
    detailsOpen.value = false;
    detailsItem.value = null;
  }

  function resetPickBranchState() {
    pickBranchOpen.value = false;
    pickBranchProduct.value = null;
    pickBranchOptions.value = [];
  }

  return {
    helpOpen,
    filtersRef,
    snack,
    shiftStart,
    shiftStartText,

    detailsOpen,
    detailsItem,
    openDetails,
    closeDetails,

    pickBranchOpen,
    pickBranchProduct,
    pickBranchOptions,
    resetPickBranchState,

    branchPickSelected,
    toast,
  };
}