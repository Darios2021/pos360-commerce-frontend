// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/pos/composables/usePosScannerInput.js

import { ref, computed, unref, watch, onMounted, onBeforeUnmount } from "vue";

function nowTs() {
  return Date.now();
}

function toStr(v) {
  return String(v ?? "").trim();
}

function isEditableTarget(target) {
  if (!target) return false;

  const tag = String(target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;

  const role = String(target.getAttribute?.("role") || "").toLowerCase();
  return role === "textbox" || role === "searchbox" || role === "combobox";
}

function isModifierEvent(e) {
  return !!(e.ctrlKey || e.altKey || e.metaKey);
}

function isIgnoredKey(key) {
  return [
    "Shift",
    "Control",
    "Alt",
    "Meta",
    "CapsLock",
    "Tab",
    "Escape",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
    "PageUp",
    "PageDown",
  ].includes(String(key || ""));
}

function isPrintableKey(key) {
  return typeof key === "string" && key.length === 1;
}

export function usePosScannerInput(options = {}) {
  const {
    enabled = ref(true),

    maxAvgCharMs = 45,
    maxGapMs = 90,
    minLength = 4,
    maxLength = 120,

    captureInsideInputs = false,
    preventEnterDefault = true,

    onScan = null,
    searchExact = null,
    onMatch = null,
    onMultiple = null,
    onNoMatch = null,
    onError = null,

    normalizeCode = (code) => toStr(code),
  } = options;

  const isEnabled = computed(() => !!unref(enabled));
  const isAttached = ref(false);

  const buffer = ref("");
  const keyTimes = ref([]);
  const lastKeyAt = ref(0);

  const lastScan = ref("");
  const lastScanAt = ref(null);

  const isReading = ref(false);
  const isProcessing = ref(false);

  const lastStatus = ref("idle");
  const lastMessage = ref("");
  const lastResultCount = ref(0);

  let statusTimer = null;

  function setStatus(status, message = "", autoBackToReady = false) {
    lastStatus.value = status;
    lastMessage.value = message || "";

    clearTimeout(statusTimer);
    statusTimer = null;

    if (autoBackToReady) {
      statusTimer = setTimeout(() => {
        lastStatus.value = isEnabled.value ? "ready" : "off";
        lastMessage.value = "";
      }, 1400);
    }
  }

  const isScannerOn = computed(() => isEnabled.value);

  const visualState = computed(() => {
    if (!isEnabled.value) return "off";
    if (isProcessing.value || isReading.value) return "reading";
    if (lastStatus.value && lastStatus.value !== "idle") return lastStatus.value;
    return "ready";
  });

  const iconName = computed(() => {
    switch (visualState.value) {
      case "off":
        return "mdi-barcode-off";
      case "reading":
        return "mdi-barcode-scan";
      case "success":
        return "mdi-check-circle-outline";
      case "multiple":
        return "mdi-format-list-bulleted-square";
      case "no_match":
        return "mdi-close-circle-outline";
      case "error":
        return "mdi-alert-circle-outline";
      default:
        return "mdi-barcode";
    }
  });

  const iconColor = computed(() => {
    switch (visualState.value) {
      case "off":
        return "grey";
      case "reading":
        return "primary";
      case "success":
        return "success";
      case "multiple":
        return "warning";
      case "no_match":
        return "error";
      case "error":
        return "error";
      default:
        return "success";
    }
  });

  const stateLabel = computed(() => {
    switch (visualState.value) {
      case "off":
        return "Scanner apagado";
      case "reading":
        return "Leyendo";
      case "success":
        return "Lectura OK";
      case "multiple":
        return "Varios resultados";
      case "no_match":
        return "Sin coincidencias";
      case "error":
        return "Error";
      default:
        return "Scanner listo";
    }
  });

  function clearBuffer() {
    buffer.value = "";
    keyTimes.value = [];
    lastKeyAt.value = 0;
    isReading.value = false;
  }

  function getAverageGap(times) {
    if (!Array.isArray(times) || times.length < 2) return Infinity;

    let sum = 0;
    for (let i = 1; i < times.length; i += 1) {
      sum += times[i] - times[i - 1];
    }
    return sum / (times.length - 1);
  }

  function looksLikeScannerRead(code, times) {
    const normalized = toStr(code);
    if (!normalized) return false;
    if (normalized.length < minLength) return false;
    if (normalized.length > maxLength) return false;
    return getAverageGap(times) <= maxAvgCharMs;
  }

  async function processScan(rawCode) {
    const code = normalizeCode ? normalizeCode(rawCode) : toStr(rawCode);
    if (!code) {
      clearBuffer();
      return;
    }

    lastScan.value = code;
    lastScanAt.value = new Date().toISOString();

    if (typeof onScan === "function") {
      try {
        await onScan(code);
      } catch {}
    }

    if (typeof searchExact !== "function") {
      setStatus("success", `Leído: ${code}`, true);
      clearBuffer();
      return;
    }

    try {
      isProcessing.value = true;
      setStatus("reading", `Buscando ${code}...`);

      const rows = await searchExact(code);
      const list = Array.isArray(rows) ? rows : [];
      lastResultCount.value = list.length;

      if (list.length === 1) {
        if (typeof onMatch === "function") {
          await onMatch(list[0], code);
        }
        setStatus("success", "1 producto encontrado", true);
      } else if (list.length > 1) {
        if (typeof onMultiple === "function") {
          await onMultiple(list, code);
        }
        setStatus("multiple", `${list.length} resultados`, true);
      } else {
        if (typeof onNoMatch === "function") {
          await onNoMatch(code);
        }
        setStatus("no_match", "Sin coincidencias", true);
      }
    } catch (err) {
      if (typeof onError === "function") {
        try {
          await onError(err, code);
        } catch {}
      }
      setStatus("error", err?.message || "Error leyendo scanner", true);
    } finally {
      isProcessing.value = false;
      clearBuffer();
    }
  }

  async function flushBufferByEnter() {
    const code = buffer.value;
    const times = [...keyTimes.value];

    if (!code) {
      clearBuffer();
      return false;
    }

    const scannerLike = looksLikeScannerRead(code, times);
    if (!scannerLike) {
      clearBuffer();
      return false;
    }

    await processScan(code);
    return true;
  }

  function pushChar(char) {
    const t = nowTs();

    if (lastKeyAt.value && t - lastKeyAt.value > maxGapMs) {
      clearBuffer();
    }

    buffer.value += char;
    keyTimes.value.push(t);
    lastKeyAt.value = t;
    isReading.value = true;
    setStatus("reading", buffer.value);
  }

  async function handleKeydown(e) {
    if (!isEnabled.value) {
      setStatus("off");
      return;
    }

    if (isModifierEvent(e)) return;

    const targetIsEditable = isEditableTarget(e.target);
    if (targetIsEditable && !captureInsideInputs) return;

    const key = String(e.key || "");

    if (isIgnoredKey(key)) return;

    if (key === "Enter") {
      const didHandle = await flushBufferByEnter();
      if (didHandle && preventEnterDefault) {
        e.preventDefault?.();
        e.stopPropagation?.();
      }
      return;
    }

    if (!isPrintableKey(key)) return;

    pushChar(key);
  }

  function attach() {
    if (isAttached.value) return;
    window.addEventListener("keydown", handleKeydown, true);
    isAttached.value = true;
    setStatus(isEnabled.value ? "ready" : "off");
  }

  function detach() {
    if (!isAttached.value) return;
    window.removeEventListener("keydown", handleKeydown, true);
    isAttached.value = false;
    clearTimeout(statusTimer);
    statusTimer = null;
    clearBuffer();
    setStatus("off");
  }

  function enable() {
    if (typeof enabled?.value !== "undefined") enabled.value = true;
    setStatus("ready");
  }

  function disable() {
    if (typeof enabled?.value !== "undefined") enabled.value = false;
    clearBuffer();
    setStatus("off");
  }

  function toggle() {
    if (isEnabled.value) disable();
    else enable();
  }

  function simulateScan(code) {
    const normalized = normalizeCode ? normalizeCode(code) : toStr(code);
    return processScan(normalized);
  }

  watch(
    isEnabled,
    (val) => {
      if (val) {
        setStatus(isAttached.value ? "ready" : "idle");
      } else {
        clearBuffer();
        setStatus("off");
      }
    },
    { immediate: true }
  );

  onMounted(() => {
    attach();
  });

  onBeforeUnmount(() => {
    detach();
  });

  return {
    isAttached,
    isScannerOn,
    isReading,
    isProcessing,
    buffer,
    lastScan,
    lastScanAt,
    lastStatus,
    lastMessage,
    lastResultCount,

    visualState,
    iconName,
    iconColor,
    stateLabel,

    attach,
    detach,
    enable,
    disable,
    toggle,
    clearBuffer,
    simulateScan,
    processScan,
  };
}