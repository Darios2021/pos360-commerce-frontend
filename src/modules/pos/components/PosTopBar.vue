<template>
  <div class="ptb">
    <div class="ptb-hotkeys">
      <!-- F1 -->
      <v-tooltip location="top" text="Ayuda rápida (F1)">
        <template #activator="{ props: tooltipProps }">
          <button
            v-bind="tooltipProps"
            class="ptb-hotkey hk-help"
            :class="{ active: activeHotkey === 'F1' }"
            @click="activateAndEmit('F1', 'help')"
          >
            <div class="ptb-hotkey-icon">
              <v-icon>mdi-help-circle-outline</v-icon>
            </div>
            <span class="ptb-hotkey-key">F1</span>
          </button>
        </template>
      </v-tooltip>

      <!-- F2 -->
      <v-tooltip location="top" text="Buscar producto (F2)">
        <template #activator="{ props: tooltipProps }">
          <button
            v-bind="tooltipProps"
            class="ptb-hotkey hk-find"
            :class="{ active: activeHotkey === 'F2' }"
            @click="activateAndEmit('F2', 'find-product')"
          >
            <div class="ptb-hotkey-icon">
              <v-icon>mdi-barcode-scan</v-icon>
            </div>
            <span class="ptb-hotkey-key">F2</span>
          </button>
        </template>
      </v-tooltip>

      <!-- F3 -->
      <v-tooltip location="top" text="Clientes (F3)">
        <template #activator="{ props: tooltipProps }">
          <button
            v-bind="tooltipProps"
            class="ptb-hotkey hk-clients"
            :class="{ active: activeHotkey === 'F3' }"
            @click="activateAndEmit('F3', 'clients')"
          >
            <div class="ptb-hotkey-icon">
              <v-icon>mdi-account-multiple-outline</v-icon>
            </div>
            <span class="ptb-hotkey-key">F3</span>
          </button>
        </template>
      </v-tooltip>

      <!-- F4 -->
      <v-tooltip location="top" text="Consulta (F4)">
        <template #activator="{ props: tooltipProps }">
          <button
            v-bind="tooltipProps"
            class="ptb-hotkey hk-search"
            :class="{ active: activeHotkey === 'F4' }"
            @click="activateAndEmit('F4', 'search')"
          >
            <div class="ptb-hotkey-icon">
              <v-icon>mdi-magnify</v-icon>
            </div>
            <span class="ptb-hotkey-key">F4</span>
          </button>
        </template>
      </v-tooltip>

      <!-- F6 -->
      <v-tooltip location="top" text="Carrito (F6)">
        <template #activator="{ props: tooltipProps }">
          <button
            v-bind="tooltipProps"
            class="ptb-hotkey hk-cart"
            :class="{ active: activeHotkey === 'F6' }"
            @click="activateAndEmit('F6', 'show-cart')"
          >
            <div class="ptb-hotkey-icon">
              <v-icon>mdi-cart-outline</v-icon>
            </div>
            <span class="ptb-hotkey-key">F6</span>
          </button>
        </template>
      </v-tooltip>

      <!-- F7 -->
      <v-tooltip location="top" text="Descuento (F7)">
        <template #activator="{ props: tooltipProps }">
          <button
            v-bind="tooltipProps"
            class="ptb-hotkey hk-discount"
            :class="{ active: activeHotkey === 'F7' }"
            @click="activateAndEmit('F7', 'discount')"
          >
            <div class="ptb-hotkey-icon">
              <v-icon>mdi-percent-outline</v-icon>
            </div>
            <span class="ptb-hotkey-key">F7</span>
          </button>
        </template>
      </v-tooltip>

      <!-- F8 -->
      <v-tooltip location="top" text="Ingreso caja (F8)">
        <template #activator="{ props: tooltipProps }">
          <button
            v-bind="tooltipProps"
            class="ptb-hotkey hk-cash-in"
            :class="{ active: activeHotkey === 'F8' }"
            @click="activateAndEmit('F8', 'cash-in')"
          >
            <div class="ptb-hotkey-icon">
              <v-icon>mdi-cash-plus</v-icon>
            </div>
            <span class="ptb-hotkey-key">F8</span>
          </button>
        </template>
      </v-tooltip>

      <!-- F9 -->
      <v-tooltip location="top" text="Cobrar (F9)">
        <template #activator="{ props: tooltipProps }">
          <button
            v-bind="tooltipProps"
            class="ptb-hotkey hk-pay"
            :class="{ active: activeHotkey === 'F9' }"
            @click="activateAndEmit('F9', 'pay')"
          >
            <div class="ptb-hotkey-icon">
              <v-icon>mdi-cash-register</v-icon>
            </div>
            <span class="ptb-hotkey-key">F9</span>
          </button>
        </template>
      </v-tooltip>

      <!-- F10 -->
      <v-tooltip location="top" text="Pago efectivo (F10)">
        <template #activator="{ props: tooltipProps }">
          <button
            v-bind="tooltipProps"
            class="ptb-hotkey hk-cash"
            :class="{ active: activeHotkey === 'F10' }"
            @click="activateAndEmit('F10', 'pay-cash')"
          >
            <div class="ptb-hotkey-icon">
              <v-icon>mdi-cash</v-icon>
            </div>
            <span class="ptb-hotkey-key">F10</span>
          </button>
        </template>
      </v-tooltip>

      <!-- F12 -->
      <v-tooltip location="top" text="Otros pagos (F12)">
        <template #activator="{ props: tooltipProps }">
          <button
            v-bind="tooltipProps"
            class="ptb-hotkey hk-other-pay"
            :class="{ active: activeHotkey === 'F12' }"
            @click="activateAndEmit('F12', 'pay-other')"
          >
            <div class="ptb-hotkey-icon">
              <v-icon>mdi-qrcode-scan</v-icon>
            </div>
            <span class="ptb-hotkey-key">F12</span>
          </button>
        </template>
      </v-tooltip>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

const emit = defineEmits([
  "help",
  "clients",
  "find-product",
  "search",
  "show-cart",
  "discount",
  "cash-in",
  "pay",
  "pay-cash",
  "pay-other",
]);

const activeHotkey = ref("F2");
let activeTimer = null;

function isEditableElement(target) {
  if (!target) return false;

  const tag = String(target.tagName || "").toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    target.isContentEditable === true
  );
}

function setActiveHotkey(key, hold = false) {
  activeHotkey.value = key;

  if (activeTimer) {
    clearTimeout(activeTimer);
    activeTimer = null;
  }

  if (!hold) {
    activeTimer = setTimeout(() => {
      if (activeHotkey.value === key && key !== "F2") {
        activeHotkey.value = "F2";
      }
      activeTimer = null;
    }, 1200);
  }
}

function activateAndEmit(key, eventName) {
  const hold = key === "F2";
  setActiveHotkey(key, hold);
  emit(eventName);
}

function handleKeydown(e) {
  if (e.repeat) return;
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  const editing = isEditableElement(e.target);

  switch (e.key) {
    case "F1":
      e.preventDefault();
      activateAndEmit("F1", "help");
      break;

    case "F2":
      e.preventDefault();
      activateAndEmit("F2", "find-product");
      break;

    case "F3":
      if (editing) return;
      e.preventDefault();
      activateAndEmit("F3", "clients");
      break;

    case "F4":
      if (editing) return;
      e.preventDefault();
      activateAndEmit("F4", "search");
      break;

    case "F6":
      if (editing) return;
      e.preventDefault();
      activateAndEmit("F6", "show-cart");
      break;

    case "F7":
      if (editing) return;
      e.preventDefault();
      activateAndEmit("F7", "discount");
      break;

    case "F8":
      if (editing) return;
      e.preventDefault();
      activateAndEmit("F8", "cash-in");
      break;

    case "F9":
      if (editing) return;
      e.preventDefault();
      activateAndEmit("F9", "pay");
      break;

    case "F10":
      if (editing) return;
      e.preventDefault();
      activateAndEmit("F10", "pay-cash");
      break;

    case "F12":
      if (editing) return;
      e.preventDefault();
      activateAndEmit("F12", "pay-other");
      break;
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);

  if (activeTimer) {
    clearTimeout(activeTimer);
    activeTimer = null;
  }
});
</script>

<style scoped>
.ptb {
  width: 100%;
  overflow: hidden;
}

.ptb-hotkeys {
  width: 100%;
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 10px;
  flex-wrap: nowrap;
  padding: 10px 14px;
  overflow-x: auto;
  scrollbar-width: none;
}

.ptb-hotkeys::-webkit-scrollbar {
  display: none;
}

.ptb-hotkey {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: 74px;
  height: 54px;
  padding: 6px 10px;
  border-radius: 16px;
  cursor: pointer;
  flex: 0 0 auto;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  transition:
    transform 0.16s ease,
    background 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.ptb-hotkey:hover {
  transform: translateY(-1px);
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-color: rgba(var(--v-theme-on-surface), 0.16);
}

.ptb-hotkey.active {
  transform: translateY(-1px);
  background: rgba(var(--v-theme-primary), 0.12);
  border-color: rgba(var(--v-theme-primary), 0.32);
  box-shadow:
    0 0 0 2px rgba(var(--v-theme-primary), 0.12),
    0 10px 22px rgba(var(--v-theme-primary), 0.12);
}

.ptb-hotkey.active .ptb-hotkey-key {
  color: rgb(var(--v-theme-primary));
}

.ptb-hotkey.active .ptb-hotkey-icon :deep(.v-icon) {
  transform: scale(1.05);
}

.ptb-hotkey-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ptb-hotkey-icon :deep(.v-icon) {
  font-size: 22px;
  transition: transform 0.16s ease;
}

.ptb-hotkey-key {
  text-align: center;
  font-size: 1rem;
  font-weight: 900;
}

/* COLORES */
.hk-help { color: #3b82f6; }
.hk-clients { color: #8b5cf6; }
.hk-find { color: #06b6d4; }
.hk-search { color: #0ea5e9; }
.hk-cart { color: #2563eb; }
.hk-discount { color: #ec4899; }
.hk-cash-in { color: #f59e0b; }
.hk-pay { color: #22c55e; }
.hk-cash { color: #16a34a; }
.hk-other-pay { color: #14b8a6; }
</style>