import { ref } from "vue";

const cajaBusy = ref(false);
const isCajaOpen = ref(false);
const openedAt = ref("");
const openedBy = ref("Caja");
const branchChipLabel = ref("Sucursal actual");

export function usePosCajaFlow() {
  function openCajaConfig() {
    console.log("[POS][caja] abrir configuración de caja");
  }

  async function onCloseCaja() {
    cajaBusy.value = true;
    try {
      console.log("[POS][caja] cerrar caja");
      isCajaOpen.value = false;
      openedAt.value = "";
    } finally {
      cajaBusy.value = false;
    }
  }

  async function refreshCajaState() {
    cajaBusy.value = true;
    try {
      console.log("[POS][caja] refrescar estado");
    } finally {
      cajaBusy.value = false;
    }
  }

  return {
    cajaBusy,
    isCajaOpen,
    openedAt,
    openedBy,
    branchChipLabel,
    openCajaConfig,
    onCloseCaja,
    refreshCajaState,
  };
}