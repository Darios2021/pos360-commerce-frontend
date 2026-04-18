<template>
  <div class="ck-screen">
    <div class="ck-screen__head">
      <div class="ck-screen__title">Facturación</div>
      <div class="ck-screen__subtitle">Elegí el comprobante</div>
    </div>

    <div class="ck-screen__body">
      <div class="ck-flow">
        <!-- COMPROBANTE -->
        <section class="ck-group">
          <div class="ck-group__label">Comprobante</div>

          <div class="ck-mode-grid">
            <button
              v-for="(item, idx) in invoiceModeItems"
              :key="item.value"
              ref="invoiceModeRefs"
              type="button"
              class="ck-mode-card"
              :class="{
                active: currentModeValue === item.value,
                cursor: cursorGroup === 0 && cursorIndex === idx,
                cursorActive: cursorGroup === 0 && cursorIndex === idx
              }"
              @click="selectValue(0, item.value, idx)"
            >
              <div class="ck-mode-card__left">
                <span class="ck-mode-card__icon">
                  <v-icon size="20">
                    {{ item.value === "FISCAL" ? "mdi-receipt-text-outline" : "mdi-cash-register" }}
                  </v-icon>
                </span>

                <div class="ck-mode-card__text">
                  <span class="ck-mode-card__title">{{ item.title }}</span>
                  <span class="ck-mode-card__hint">
                    {{ item.value === "FISCAL" ? "Comprobante ARCA" : "Venta sin comprobante fiscal" }}
                  </span>
                </div>
              </div>

              <span
                v-if="cursorGroup === 0 && cursorIndex === idx"
                class="ck-cursor-tag"
              >
                Elegir
              </span>

              <span class="ck-mode-card__state">
                <v-icon v-if="currentModeValue === item.value" size="14">mdi-check</v-icon>
              </span>
            </button>
          </div>
        </section>

        <!-- CONDICION CLIENTE -->
        <section v-if="isFiscal" class="ck-group">
          <div class="ck-group__label">Condición del cliente</div>

          <div class="ck-customer-grid">
            <button
              v-for="(item, idx) in customerTypeItems"
              :key="item.value"
              ref="customerTypeRefs"
              type="button"
              class="ck-customer-card"
              :class="{
                active: state.customerType === item.value,
                cursor: cursorGroup === 1 && cursorIndex === idx,
                cursorActive: cursorGroup === 1 && cursorIndex === idx
              }"
              @click="selectValue(1, item.value, idx)"
            >
              <div class="ck-customer-card__top">
                <span class="ck-doc-chip">
                  {{ item.letter }}
                </span>
              </div>

              <div class="ck-customer-card__title">
                {{ item.title }}
              </div>

              <div class="ck-customer-card__hint">
                {{ item.docLabel }}
              </div>

              <span
                v-if="cursorGroup === 1 && cursorIndex === idx"
                class="ck-cursor-tag"
              >
                Elegir
              </span>

              <span class="ck-customer-card__state">
                <v-icon v-if="state.customerType === item.value" size="14">mdi-check</v-icon>
              </span>
            </button>
          </div>
        </section>

        <!-- TIPO DE COMPROBANTE -->
        <section class="ck-group">
          <div class="ck-group__label">Tipo de comprobante</div>

          <!-- NO FISCAL: misma estructura visual, una sola card X -->
          <div v-if="!isFiscal" class="ck-type-grid ck-type-grid--single">
            <div
              class="ck-type-card ck-type-card--X active"
            >
              <div class="ck-type-card__left">
                <span class="ck-type-card__icon">
                  <v-icon size="20">mdi-file-cancel-outline</v-icon>
                </span>

                <div class="ck-type-card__text">
                  <span class="ck-type-card__title">No fiscal</span>
                  <span class="ck-type-card__hint">Comprobante interno</span>
                </div>
              </div>

              <span class="ck-type-card__letter">X</span>
            </div>
          </div>

          <!-- FISCAL: misma familia visual -->
          <div v-else class="ck-type-grid ck-type-grid--single">
            <div
              class="ck-type-card"
              :class="`ck-type-card--${effectiveInvoiceType}`"
            >
              <div class="ck-type-card__left">
                <span class="ck-type-card__icon">
                  <v-icon size="20">mdi-file-document-outline</v-icon>
                </span>

                <div class="ck-type-card__text">
                  <span class="ck-type-card__title">Fiscal</span>
                  <span class="ck-type-card__hint">Tipo de comprobante</span>
                </div>
              </div>

              <span class="ck-type-card__letter">
                {{ effectiveInvoiceType }}
              </span>
            </div>
          </div>
        </section>
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

const invoiceModeRefs = ref([]);
const customerTypeRefs = ref([]);

const cursorGroup = ref(0);
const cursorIndex = ref(0);

const invoiceModeItems = [
  { title: "No fiscal", value: "NO_FISCAL" },
  { title: "Fiscal", value: "FISCAL" },
];

const customerTypeItems = [
  {
    title: "Consumidor final",
    value: "CONSUMIDOR_FINAL",
    letter: "B",
    docLabel: "Factura B",
  },
  {
    title: "Resp. inscripto",
    value: "RESPONSABLE_INSCRIPTO",
    letter: "A",
    docLabel: "Factura A",
  },
  {
    title: "Monotributo",
    value: "MONOTRIBUTO",
    letter: "C",
    docLabel: "Factura C",
  },
  {
    title: "Exento",
    value: "EXENTO",
    letter: "B",
    docLabel: "Factura B",
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
    case "RESPONSABLE_INSCRIPTO":
      return "A";
    case "MONOTRIBUTO":
      return "C";
    case "EXENTO":
      return "B";
    case "CONSUMIDOR_FINAL":
    default:
      return "B";
  }
});

const groups = computed(() => {
  const base = [
    {
      key: "invoice_mode",
      refs: invoiceModeRefs,
      items: invoiceModeItems,
      value: currentModeValue.value,
      columns: 2,
    },
  ];

  if (isFiscal.value) {
    base.push({
      key: "customer_type",
      refs: customerTypeRefs,
      items: customerTypeItems,
      value: props.state.customerType,
      columns: 4,
    });
  }

  return base;
});

watch(
  () => props.state.invoiceMode,
  () => {
    if (currentModeValue.value === "NO_FISCAL") {
      props.state.invoiceType = "X";
    } else {
      if (!props.state.customerType) {
        props.state.customerType = "CONSUMIDOR_FINAL";
      }
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

watch(isFiscal, (v) => {
  if (!v && cursorGroup.value > 0) {
    cursorGroup.value = 0;
    cursorIndex.value = normalizeIndexByValue(0);
    nextTick(() => focusCurrent());
  } else if (v && !props.state.customerType) {
    props.state.customerType = "CONSUMIDOR_FINAL";
  }
});

function normalizeIndexByValue(groupIdx) {
  const group = groups.value[groupIdx];
  if (!group) return 0;
  const idx = group.items.findIndex((x) => x.value === group.value);
  return idx >= 0 ? idx : 0;
}

function clampCursor() {
  const group = groups.value[cursorGroup.value];
  if (!group) {
    cursorGroup.value = 0;
    cursorIndex.value = 0;
    return;
  }

  const max = Math.max(0, group.items.length - 1);
  if (cursorIndex.value > max) cursorIndex.value = max;
  if (cursorIndex.value < 0) cursorIndex.value = 0;
}

function focusCurrent() {
  nextTick(() => {
    const group = groups.value[cursorGroup.value];
    if (!group) return;

    const refEntry = group.refs.value?.[cursorIndex.value];
    const el = refEntry?.$el || refEntry;
    el?.focus?.();
  });
}

function selectValue(groupIdx, value, idx = 0) {
  cursorGroup.value = groupIdx;
  cursorIndex.value = idx;

  if (groupIdx === 0) {
    props.state.invoiceMode = value;

    if (value === "NO_FISCAL") {
      props.state.invoiceType = "X";
    } else {
      if (!props.state.customerType) {
        props.state.customerType = "CONSUMIDOR_FINAL";
      }
      props.state.invoiceType = effectiveInvoiceType.value;
    }

    nextTick(() => focusCurrent());
    return;
  }

  if (groupIdx === 1) {
    props.state.customerType = value;
    props.state.invoiceType = effectiveInvoiceType.value;
    nextTick(() => focusCurrent());
  }
}

function activateCursorSelection() {
  const group = groups.value[cursorGroup.value];
  if (!group) return true;

  const item = group.items[cursorIndex.value];
  if (!item) return true;

  selectValue(cursorGroup.value, item.value, cursorIndex.value);
  return true;
}

function moveHorizontal(direction) {
  const group = groups.value[cursorGroup.value];
  if (!group) return true;

  const last = group.items.length - 1;
  let next = cursorIndex.value;

  if (direction === "left" && next > 0) next -= 1;
  if (direction === "right" && next < last) next += 1;

  cursorIndex.value = next;
  return activateCursorSelection();
}

function moveVertical(direction) {
  const group = groups.value[cursorGroup.value];
  if (!group) return true;

  if (cursorGroup.value === 0 && direction === "down" && groups.value.length > 1) {
    const targetIdx = Math.min(cursorIndex.value, groups.value[1].items.length - 1);
    cursorGroup.value = 1;
    cursorIndex.value = Math.max(0, targetIdx);
    return activateCursorSelection();
  }

  if (cursorGroup.value === 1 && direction === "up") {
    const targetIdx = Math.min(cursorIndex.value, groups.value[0].items.length - 1);
    cursorGroup.value = 0;
    cursorIndex.value = Math.max(0, targetIdx);
    return activateCursorSelection();
  }

  if (cursorGroup.value === 1) {
    const cols = group.columns || 4;
    const last = group.items.length - 1;
    let next = cursorIndex.value;

    if (direction === "down") {
      if (next + cols <= last) next += cols;
    }

    if (direction === "up") {
      if (next - cols >= 0) next -= cols;
      else {
        cursorGroup.value = 0;
        cursorIndex.value = Math.min(next, groups.value[0].items.length - 1);
        return activateCursorSelection();
      }
    }

    cursorIndex.value = next;
    return activateCursorSelection();
  }

  return true;
}

function confirmCurrent() {
  if (cursorGroup.value === 0) {
    if (currentModeValue.value === "NO_FISCAL") {
      emit("next");
      return true;
    }

    if (isFiscal.value) {
      cursorGroup.value = 1;
      cursorIndex.value = normalizeIndexByValue(1);
      focusCurrent();
      return true;
    }
  }

  if (cursorGroup.value === 1) {
    emit("next");
    return true;
  }

  return true;
}

function goBack() {
  if (cursorGroup.value > 0) {
    cursorGroup.value -= 1;
    cursorIndex.value = normalizeIndexByValue(cursorGroup.value);
    focusCurrent();
    return true;
  }

  emit("back");
  return true;
}

function handleKeyboardAction(action) {
  if (action === "left") return moveHorizontal("left");
  if (action === "right") return moveHorizontal("right");
  if (action === "up") return moveVertical("up");
  if (action === "down") return moveVertical("down");
  if (action === "enter") return confirmCurrent();
  if (action === "backspace") return goBack();
  return false;
}

watch(
  () => [props.state.invoiceMode, props.state.customerType],
  () => {
    clampCursor();
  },
  { immediate: true }
);

defineExpose({
  focusCurrent,
  handleKeyboardAction,
});
</script>


<style scoped>
.ck-screen {
  min-height: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 10px;
  padding: 8px 10px;
}

.ck-screen__head {
  display: grid;
  gap: 2px;
}

.ck-screen__body {
  min-height: 0;
}

.ck-flow {
  display: grid;
  gap: 12px;
}

.ck-group {
  display: grid;
  gap: 6px;
}

.ck-group__label {
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.58);
}

.ck-screen__title {
  font-size: 1rem;
  line-height: 1.1;
  font-weight: 950;
  color: rgb(var(--v-theme-on-surface));
}

.ck-screen__subtitle {
  font-size: 0.76rem;
  line-height: 1.1;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

/* =========================
   GRIDS
========================= */
.ck-mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.ck-customer-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.ck-type-grid {
  display: grid;
  gap: 10px;
}

.ck-type-grid--single {
  grid-template-columns: 1fr;
}

/* =========================
   BASE CARDS
========================= */
.ck-mode-card,
.ck-customer-card,
.ck-type-card {
  position: relative;
  isolation: isolate;
  width: 100%;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-surface), 0.92);
  color: rgb(var(--v-theme-on-surface));
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition:
    border-color 0.16s ease,
    background 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.16s ease;
}

.ck-mode-card,
.ck-customer-card {
  cursor: pointer;
}

.ck-mode-card:focus-visible,
.ck-customer-card:focus-visible {
  outline: none;
}

.ck-mode-card:hover,
.ck-customer-card:hover {
  transform: translateY(-1px);
  border-color: rgba(var(--v-theme-primary), 0.28);
}

/* =========================
   MODO / TIPO
========================= */
.ck-mode-card,
.ck-type-card {
  min-height: 54px;
  padding: 8px 36px 8px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.ck-mode-card__left,
.ck-type-card__left {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.ck-mode-card__icon,
.ck-type-card__icon {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgb(var(--v-theme-primary));
  display: flex;
  align-items: center;
  justify-content: center;
}

.ck-mode-card__text,
.ck-type-card__text {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.ck-mode-card__title,
.ck-type-card__title {
  font-size: 0.82rem;
  line-height: 1.1;
  font-weight: 950;
  color: rgb(var(--v-theme-on-surface));
}

.ck-mode-card__hint,
.ck-type-card__hint {
  font-size: 0.69rem;
  line-height: 1.15;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.64);
}

/* =========================
   CUSTOMER CARD
========================= */
.ck-customer-card {
  min-height: 80px;
  padding: 8px;
  display: grid;
  align-content: center;
  justify-items: center;
  text-align: center;
  gap: 4px;
}

.ck-customer-card__top {
  display: flex;
  justify-content: center;
  align-items: center;
}

.ck-doc-chip {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.92rem;
  line-height: 1;
  font-weight: 950;
}

.ck-customer-card__title {
  font-size: 0.8rem;
  line-height: 1.1;
  font-weight: 900;
  color: rgb(var(--v-theme-on-surface));
}

.ck-customer-card__hint {
  font-size: 0.66rem;
  line-height: 1.1;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

/* =========================
   TYPE LETTER
========================= */
.ck-type-card__letter {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  border: 1px solid rgba(var(--v-theme-primary), 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  line-height: 1;
  font-weight: 950;
}

.ck-type-card--A .ck-type-card__letter,
.ck-type-card--B .ck-type-card__letter,
.ck-type-card--C .ck-type-card__letter,
.ck-type-card--X .ck-type-card__letter {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

/* =========================
   CHECK
========================= */
.ck-mode-card__state,
.ck-customer-card__state {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.14);
  color: rgb(var(--v-theme-primary));
  opacity: 0;
  transform: scale(0.9);
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}

.ck-mode-card.active .ck-mode-card__state,
.ck-customer-card.active .ck-customer-card__state {
  opacity: 1;
  transform: scale(1);
}

/* =========================
   SELECCIÓN / CURSOR
========================= */
.ck-mode-card.active,
.ck-customer-card.active,
.ck-type-card.active,
.ck-mode-card.cursor,
.ck-customer-card.cursor,
.ck-mode-card.cursorActive,
.ck-customer-card.cursorActive {
  border-color: rgba(var(--v-theme-primary), 0.72);
  background:
    linear-gradient(
      180deg,
      rgba(var(--v-theme-primary), 0.12) 0%,
      rgba(var(--v-theme-primary), 0.08) 100%
    ),
    rgba(var(--v-theme-surface), 0.98);
  box-shadow:
    0 0 0 1px rgba(var(--v-theme-primary), 0.18),
    0 0 0 3px rgba(var(--v-theme-primary), 0.18),
    0 8px 22px rgba(0, 0, 0, 0.14);
}

.ck-mode-card.cursorActive,
.ck-customer-card.cursorActive {
  transform: translateY(-1px);
}

/* =========================
   TAG ELEGIR
========================= */
.ck-cursor-tag {
  position: absolute;
  top: -9px;
  right: 10px;
  z-index: 4;
  height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-size: 0.64rem;
  line-height: 1;
  font-weight: 950;
  letter-spacing: 0.02em;
  color: #fff;
  background: rgb(var(--v-theme-primary));
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

/* =========================
   DARK MODE REFUERZO
========================= */
:deep(.v-theme--dark) .ck-mode-card,
:deep(.v-theme--dark) .ck-customer-card,
:deep(.v-theme--dark) .ck-type-card {
  background: rgba(22, 27, 36, 0.96);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.22);
}

:deep(.v-theme--dark) .ck-mode-card.active,
:deep(.v-theme--dark) .ck-customer-card.active,
:deep(.v-theme--dark) .ck-type-card.active,
:deep(.v-theme--dark) .ck-mode-card.cursor,
:deep(.v-theme--dark) .ck-customer-card.cursor,
:deep(.v-theme--dark) .ck-mode-card.cursorActive,
:deep(.v-theme--dark) .ck-customer-card.cursorActive {
  border-color: rgba(2, 73, 139, 0.95);
  background:
    linear-gradient(
      180deg,
      rgba(2, 73, 139, 0.26) 0%,
      rgba(2, 73, 139, 0.14) 100%
    ),
    rgba(22, 27, 36, 0.98);
  box-shadow:
    0 0 0 1px rgba(2, 73, 139, 0.28),
    0 0 0 3px rgba(2, 73, 139, 0.28),
    0 10px 24px rgba(0, 0, 0, 0.3);
}

:deep(.v-theme--dark) .ck-mode-card__icon,
:deep(.v-theme--dark) .ck-type-card__icon,
:deep(.v-theme--dark) .ck-doc-chip,
:deep(.v-theme--dark) .ck-type-card__letter,
:deep(.v-theme--dark) .ck-mode-card__state,
:deep(.v-theme--dark) .ck-customer-card__state {
  background: rgba(2, 73, 139, 0.18);
  color: #d7ebff;
  border-color: rgba(2, 73, 139, 0.28);
}

:deep(.v-theme--dark) .ck-cursor-tag {
  background: #02498b;
  color: #fff;
}

/* =========================
   RESPONSIVE
========================= */
@media (max-width: 980px) {
  .ck-customer-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .ck-mode-grid,
  .ck-customer-grid {
    grid-template-columns: 1fr;
  }

  .ck-mode-card,
  .ck-type-card {
    min-height: 68px;
  }

  .ck-customer-card {
    min-height: 94px;
  }
}
</style>