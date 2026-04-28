<template>
  <div class="ck-screen" ref="rootRef" tabindex="-1">
    <div class="ck-screen__head">
      <div class="ck-screen__title">Tipo de comprobante</div>
    </div>

    <div class="ck-screen__body">
      <div class="ck-invoice-grid">
        <button
          v-for="(card, idx) in invoiceCards"
          :key="card.letter"
          type="button"
          class="ck-inv-card"
          :style="`--cc: ${card.color}`"
          :class="{
            active: isCardActive(card),
            cursor: cursorIndex === idx,
            cursorActive: cursorIndex === idx,
          }"
          @click="selectCard(card, idx)"
        >
          <!-- number key badge -->
          <span class="ck-inv-key">{{ idx + 1 }}</span>

          <span class="ck-inv-letter">{{ card.letter }}</span>

          <div class="ck-inv-info">
            <span class="ck-inv-title">{{ card.title }}</span>
            <span class="ck-inv-desc">{{ card.desc }}</span>
          </div>

          <span class="ck-inv-check">
            <v-icon v-if="isCardActive(card)" size="14">mdi-check</v-icon>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";

const props = defineProps({
  state: { type: Object, required: true },
});

const emit = defineEmits(["next", "back"]);

const cursorIndex = ref(0);
const rootRef = ref(null);

const invoiceCards = [
  {
    letter: "X",
    title: "No Fiscal",
    desc: "Sin comprobante ARCA",
    mode: "NO_FISCAL",
    customerType: null,
    color: "120, 120, 140",
  },
  {
    letter: "B",
    title: "Factura B",
    desc: "Consumidor final / Exento",
    mode: "FISCAL",
    customerType: "CONSUMIDOR_FINAL",
    color: "34, 197, 94",
  },
  {
    letter: "A",
    title: "Factura A",
    desc: "Responsable inscripto",
    mode: "FISCAL",
    customerType: "RESPONSABLE_INSCRIPTO",
    color: "59, 130, 246",
  },
  {
    letter: "C",
    title: "Factura C",
    desc: "Monotributo",
    mode: "FISCAL",
    customerType: "MONOTRIBUTO",
    color: "139, 92, 246",
  },
];

const currentModeValue = computed(() => {
  const raw = String(props.state.invoiceMode || "").toUpperCase();
  return raw === "FISCAL" ? "FISCAL" : "NO_FISCAL";
});

const isFiscal = computed(() => currentModeValue.value === "FISCAL");

const effectiveInvoiceType = computed(() => {
  if (!isFiscal.value) return "X";
  switch (String(props.state.customerType || "").toUpperCase()) {
    case "RESPONSABLE_INSCRIPTO": return "A";
    case "MONOTRIBUTO": return "C";
    default: return "B";
  }
});

function isCardActive(card) {
  if (card.mode === "NO_FISCAL") return !isFiscal.value;
  if (!isFiscal.value) return false;
  return String(props.state.customerType || "").toUpperCase() === card.customerType;
}

function selectCard(card, idx) {
  cursorIndex.value = idx;
  props.state.invoiceMode = card.mode;

  if (card.mode === "NO_FISCAL") {
    props.state.invoiceType = "X";
    props.state.customerType = null;
  } else {
    props.state.customerType = card.customerType;
    props.state.invoiceType = effectiveInvoiceType.value;
  }
}

watch(
  () => props.state.invoiceMode,
  () => {
    if (!isFiscal.value) {
      props.state.invoiceType = "X";
    } else {
      if (!props.state.customerType) props.state.customerType = "CONSUMIDOR_FINAL";
      props.state.invoiceType = effectiveInvoiceType.value;
    }
  },
  { immediate: true }
);

watch(
  () => props.state.customerType,
  () => {
    props.state.invoiceType = effectiveInvoiceType.value;
  },
  { immediate: true }
);

function focusCurrent() {
  nextTick(() => {
    rootRef.value?.focus?.();
  });
}

function handleKeyboardAction(action) {
  const last = invoiceCards.length - 1;

  // Number shortcuts: digit:N sent from CheckoutDialog
  if (action.startsWith?.("digit:")) {
    const n = parseInt(action.slice(6), 10);
    if (Number.isFinite(n) && n >= 1 && n <= invoiceCards.length) {
      selectCard(invoiceCards[n - 1], n - 1);
      return true;
    }
    return false;
  }

  if (action === "left" || action === "up") {
    if (cursorIndex.value > 0) {
      cursorIndex.value -= 1;
      selectCard(invoiceCards[cursorIndex.value], cursorIndex.value);
    }
    return true;
  }

  if (action === "right" || action === "down") {
    if (cursorIndex.value < last) {
      cursorIndex.value += 1;
      selectCard(invoiceCards[cursorIndex.value], cursorIndex.value);
    }
    return true;
  }

  if (action === "enter") {
    emit("next");
    return true;
  }

  if (action === "backspace") {
    emit("back");
    return true;
  }

  return false;
}

watch(
  () => [props.state.invoiceMode, props.state.customerType],
  () => {
    const active = invoiceCards.findIndex((c) => isCardActive(c));
    if (active >= 0) cursorIndex.value = active;
  },
  { immediate: true }
);

defineExpose({ focusCurrent, handleKeyboardAction });
</script>

<style scoped>
.ck-screen {
  min-height: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 14px;
  padding: 10px 12px;
  outline: none;
}

.ck-screen__head {
  display: grid;
  gap: 2px;
}

.ck-screen__title {
  font-size: 1rem;
  line-height: 1.1;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.ck-screen__subtitle {
  font-size: 0.76rem;
  line-height: 1.1;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.ck-screen__body {
  min-height: 0;
  display: flex;
  align-items: flex-start;
}

/* ── Grid ── */
.ck-invoice-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
}

/* ── Card ── */
.ck-inv-card {
  --cc: 120, 120, 140;
  position: relative;
  border: 1.5px solid rgba(var(--cc), 0.2);
  background: rgba(var(--cc), 0.06);
  border-radius: 16px;
  padding: 16px 10px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.13s ease;
  overflow: hidden;
}

.ck-inv-card:hover {
  background: rgba(var(--cc), 0.1);
  border-color: rgba(var(--cc), 0.4);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(var(--cc), 0.18);
}

/* ── Number key badge ── */
.ck-inv-key {
  position: absolute;
  top: 7px;
  left: 8px;
  width: 20px;
  height: 20px;
  border-radius: 5px;
  background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.18) 100%);
  border: 1px solid rgba(var(--cc), 0.3);
  border-bottom-width: 2px;
  color: rgb(var(--cc));
  font-size: 0.62rem;
  font-weight: 500;
  font-family: 'Courier New', monospace;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 2px rgba(0,0,0,0.2);
  transition: background 0.14s, color 0.14s, border-color 0.14s;
}
.ck-inv-card.active .ck-inv-key {
  background: linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%);
  border-color: rgba(255,255,255,0.28);
  color: #fff;
}

/* ── Letter ── */
.ck-inv-letter {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(var(--cc), 0.14);
  color: rgb(var(--cc));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.9rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.03em;
  transition: background 0.15s, color 0.15s;
  flex: 0 0 auto;
}

/* ── Info ── */
.ck-inv-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-width: 0;
  width: 100%;
}

.ck-inv-title {
  font-size: 0.82rem;
  font-weight: 500;
  line-height: 1;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  transition: color 0.15s;
}

.ck-inv-desc {
  font-size: 0.65rem;
  font-weight: 400;
  line-height: 1.2;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.55);
  transition: color 0.15s;
}

/* ── Check ── */
.ck-inv-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: rgba(var(--cc), 0.14);
  color: rgb(var(--cc));
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 0.14s, transform 0.14s;
}

.ck-inv-card.active .ck-inv-check {
  opacity: 1;
  transform: scale(1);
}

/* ── ACTIVE ── */
.ck-inv-card.active {
  background: rgb(var(--cc));
  border-color: rgb(var(--cc));
  box-shadow:
    0 0 0 3px rgba(var(--cc), 0.2),
    0 8px 22px rgba(var(--cc), 0.3);
  transform: translateY(-2px);
}

.ck-inv-card.active .ck-inv-letter {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
}

.ck-inv-card.active .ck-inv-title {
  color: #fff;
}

.ck-inv-card.active .ck-inv-desc {
  color: rgba(255, 255, 255, 0.8);
}

.ck-inv-card.active .ck-inv-check {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
}

/* ── Cursor ── */
.ck-inv-card.cursorActive:not(.active) {
  border-color: rgba(var(--cc), 0.5);
  box-shadow: 0 0 0 2px rgba(var(--cc), 0.25);
}

/* ── Responsive ── */
@media (max-width: 760px) {
  .ck-invoice-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ck-inv-card {
    padding: 14px 10px 12px;
  }

  .ck-inv-letter {
    width: 48px;
    height: 48px;
    font-size: 1.6rem;
  }
}
</style>
