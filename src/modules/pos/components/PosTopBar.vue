<template>
  <div class="ptb">
    <div class="ptb-hotkeys">

      <!-- F1 -->
      <v-tooltip location="top" text="Ayuda rápida (F1)">
        <template #activator="{ props: tooltipProps }">
          <button v-bind="tooltipProps" class="ptb-hotkey hk-help" @click="emitToggle('help')">
            <div class="ptb-hotkey-icon">
              <v-icon>mdi-help-circle-outline</v-icon>
            </div>
            <span class="ptb-hotkey-key">F1</span>
          </button>
        </template>
      </v-tooltip>

      <!-- F2 -->
      <v-tooltip location="top" text="Clientes (F2)">
        <template #activator="{ props: tooltipProps }">
          <button v-bind="tooltipProps" class="ptb-hotkey hk-clients" @click="emitToggle('clients')">
            <div class="ptb-hotkey-icon">
              <v-icon>mdi-account-multiple-outline</v-icon>
            </div>
            <span class="ptb-hotkey-key">F2</span>
          </button>
        </template>
      </v-tooltip>

      <!-- F3 -->
      <v-tooltip location="top" text="Buscar producto (F3)">
        <template #activator="{ props: tooltipProps }">
          <button v-bind="tooltipProps" class="ptb-hotkey hk-find" @click="emitToggle('find-product')">
            <div class="ptb-hotkey-icon">
              <v-icon>mdi-barcode-scan</v-icon>
            </div>
            <span class="ptb-hotkey-key">F3</span>
          </button>
        </template>
      </v-tooltip>

      <!-- F4 -->
      <v-tooltip location="top" text="Consulta (F4)">
        <template #activator="{ props: tooltipProps }">
          <button v-bind="tooltipProps" class="ptb-hotkey hk-search" @click="emitToggle('search')">
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
          <button v-bind="tooltipProps" class="ptb-hotkey hk-cart" @click="emitToggle('show-cart')">
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
          <button v-bind="tooltipProps" class="ptb-hotkey hk-discount" @click="emitToggle('discount')">
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
          <button v-bind="tooltipProps" class="ptb-hotkey hk-cash-in" @click="handleCashIn">
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
          <button v-bind="tooltipProps" class="ptb-hotkey hk-pay" @click="handlePay">
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
          <button v-bind="tooltipProps" class="ptb-hotkey hk-cash" @click="emitToggle('pay-cash')">
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
          <button v-bind="tooltipProps" class="ptb-hotkey hk-other-pay" @click="emitToggle('pay-other')">
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
import { onMounted, onBeforeUnmount } from "vue";

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
  "pay-other"
]);

const emitToggle = (e) => emit(e);

const handleCashIn = () => emit("cash-in");
const handlePay = () => emit("pay");

/* 🔥 SIN F5 Y SIN F11 */
function handleKeydown(e) {
  if (e.repeat) return;

  switch (e.key) {
    case "F1": e.preventDefault(); emit("help"); break;
    case "F2": e.preventDefault(); emit("clients"); break;
    case "F3": e.preventDefault(); emit("find-product"); break;
    case "F4": e.preventDefault(); emit("search"); break;
    case "F6": e.preventDefault(); emit("show-cart"); break;
    case "F7": e.preventDefault(); emit("discount"); break;
    case "F8": e.preventDefault(); emit("cash-in"); break;
    case "F9": e.preventDefault(); emit("pay"); break;
    case "F10": e.preventDefault(); emit("pay-cash"); break;
    case "F12": e.preventDefault(); emit("pay-other"); break;
  }
}

onMounted(() => window.addEventListener("keydown", handleKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", handleKeydown));
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
.ptb-hotkeys::-webkit-scrollbar { display: none; }

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
}

.ptb-hotkey-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ptb-hotkey-icon :deep(.v-icon) {
  font-size: 22px;
}

.ptb-hotkey-key {
  text-align: center;
  font-size: 1rem;
  font-weight: 900;
}

/* COLORES */
.hk-help { color:#3b82f6; }
.hk-clients { color:#8b5cf6; }
.hk-find { color:#06b6d4; }
.hk-search { color:#0ea5e9; }
.hk-cart { color:#2563eb; }
.hk-discount { color:#ec4899; }
.hk-cash-in { color:#f59e0b; }
.hk-pay { color:#22c55e; }
.hk-cash { color:#16a34a; }
.hk-other-pay { color:#14b8a6; }
</style>