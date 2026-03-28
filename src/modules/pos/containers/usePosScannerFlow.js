import { ref, computed } from "vue";

export function usePosScannerFlow(options = {}) {
  const {
    searchExact = async () => [],
    onMatch = () => {},
  } = options;

  const scannerIsOn = ref(true);
  const scannerLastScan = ref("");
  const scannerLastMessage = ref("Scanner listo");

  function normalizeCode(value) {
    return String(value || "")
      .replace(/\r/g, "")
      .replace(/\n/g, "")
      .trim();
  }

  function isProbablyBarcode(value) {
    const v = normalizeCode(value);
    if (!v) return false;
    return /^[0-9A-Z\-_.]+$/i.test(v) && v.length >= 4;
  }

  const scannerVisualState = computed(() => {
    return scannerIsOn.value ? "success" : "disabled";
  });

  const scannerIconName = computed(() => {
    return scannerIsOn.value ? "mdi-barcode-scan" : "mdi-barcode-off";
  });

  const scannerIconColor = computed(() => {
    return scannerIsOn.value ? "success" : "medium-emphasis";
  });

  const scannerStateLabel = computed(() => {
    return scannerIsOn.value ? "Scanner activo" : "Scanner inactivo";
  });

  function toggleScanner() {
    scannerIsOn.value = !scannerIsOn.value;
    scannerLastMessage.value = scannerIsOn.value
      ? "Scanner activado"
      : "Scanner desactivado";
  }

  async function runScannerFlowFromInput(code) {
    const raw = normalizeCode(code);

    if (!scannerIsOn.value) return false;
    if (!isProbablyBarcode(raw)) return false;

    try {
      scannerLastScan.value = raw;
      scannerLastMessage.value = `Buscando ${raw}...`;

      const rows = await searchExact(raw, { exact: true });

      if (!Array.isArray(rows) || !rows.length) {
        scannerLastMessage.value = `Sin coincidencias para ${raw}`;
        return true;
      }

      if (rows.length === 1) {
        onMatch(rows[0]);
        scannerLastMessage.value = `Agregado: ${rows[0]?.name || raw}`;
        return true;
      }

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

      if (exactRows.length === 1) {
        onMatch(exactRows[0]);
        scannerLastMessage.value = `Agregado: ${exactRows[0]?.name || raw}`;
        return true;
      }

      scannerLastMessage.value = `Se encontraron ${rows.length} coincidencias`;
      return true;
    } catch (err) {
      console.error("[POS][scanner] error", err);
      scannerLastMessage.value =
        err?.response?.data?.message ||
        err?.message ||
        "Error al leer código";
      return true;
    }
  }

  return {
    scannerIsOn,
    scannerVisualState,
    scannerIconName,
    scannerIconColor,
    scannerStateLabel,
    scannerLastScan,
    scannerLastMessage,
    toggleScanner,
    runScannerFlowFromInput,
  };
}