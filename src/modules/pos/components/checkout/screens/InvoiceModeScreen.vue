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
  gap: 12px;
  padding: 10px 12px 12px;
  border-radius: 20px;
  background: transparent;
}

.ck-screen__head {
  display: grid;
  gap: 4px;
  padding-inline: 2px;
}

.ck-screen__title {
  font-size: 1.18rem;
  font-weight: 950;
  line-height: 1.02;
  letter-spacing: -0.02em;
}

.ck-screen__subtitle {
  font-size: 0.86rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.6);
  line-height: 1.15;
}

.ck-screen__body {
  min-height: 0;
}

.ck-flow {
  display: grid;
  gap: 16px;
  align-content: start;
}

.ck-group {
  display: grid;
  gap: 8px;
}

.ck-group__label {
  font-size: 0.82rem;
  font-weight: 900;
  color: rgba(var(--v-theme-on-surface), 0.62);
  padding-inline: 2px;
  letter-spacing: 0.01em;
}

.ck-mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.ck-customer-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.ck-type-grid {
  display: grid;
  gap: 12px;
}

.ck-type-grid--single {
  grid-template-columns: 1fr;
}

.ck-mode-card,
.ck-customer-card,
.ck-type-card {
  position: relative;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-surface), 0.34);
  color: rgb(var(--v-theme-on-surface));
  outline: none;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease,
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

.ck-mode-card:hover,
.ck-customer-card:hover,
.ck-type-card:hover {
  transform: translateY(-1px);
  border-color: rgba(var(--v-theme-on-surface), 0.2);
}

.ck-mode-card.active,
.ck-customer-card.active,
.ck-type-card.active {
  border-color: rgba(var(--v-theme-primary), 0.95);
  background: rgba(var(--v-theme-primary), 0.1);
  box-shadow:
    0 0 0 1px rgba(var(--v-theme-primary), 0.14),
    inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.ck-mode-card.cursor,
.ck-customer-card.cursor {
  border-color: rgba(var(--v-theme-on-surface), 0.28);
}

.ck-mode-card.cursorActive,
.ck-customer-card.cursorActive {
  border-color: rgba(var(--v-theme-primary), 1);
  box-shadow:
    0 0 0 2px rgba(var(--v-theme-primary), 0.18),
    0 6px 14px rgba(0, 0, 0, 0.08);
}

.ck-mode-card {
  min-height: 78px;
  border-radius: 18px;
  padding: 14px 52px 14px 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ck-mode-card__left,
.ck-type-card__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.ck-mode-card__icon,
.ck-type-card__icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.ck-mode-card.active .ck-mode-card__icon {
  background: rgba(var(--v-theme-primary), 0.16);
}

.ck-mode-card__text,
.ck-type-card__text {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.ck-mode-card__title,
.ck-type-card__title {
  font-size: 1rem;
  font-weight: 950;
  line-height: 1.05;
  letter-spacing: -0.015em;
}

.ck-mode-card__hint,
.ck-type-card__hint {
  font-size: 0.74rem;
  font-weight: 800;
  color: rgba(var(--v-theme-on-surface), 0.62);
  line-height: 1.05;
}

.ck-customer-card {
  min-height: 92px;
  border-radius: 18px;
  padding: 12px 44px 12px 12px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 6px;
  align-content: start;
}

.ck-customer-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.ck-doc-chip {
  min-width: 40px;
  height: 40px;
  padding: 0 10px;
  border-radius: 14px;
  background: rgba(var(--v-theme-primary), 0.14);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.02rem;
  font-weight: 950;
  line-height: 1;
}

.ck-customer-card__title {
  text-align: center;
  font-size: 0.96rem;
  font-weight: 950;
  line-height: 1.05;
  letter-spacing: -0.015em;
}

.ck-customer-card__hint {
  text-align: center;
  font-size: 0.74rem;
  font-weight: 800;
  color: rgba(var(--v-theme-on-surface), 0.62);
  line-height: 1.05;
}

.ck-cursor-tag {
  position: absolute;
  top: 8px;
  right: 38px;
  padding: 3px 7px;
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.14);
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.01em;
  line-height: 1;
  pointer-events: none;
}

.ck-mode-card__state,
.ck-customer-card__state {
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 2px solid rgba(var(--v-theme-on-surface), 0.34);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.ck-customer-card__state {
  top: 14px;
  transform: none;
}

.ck-mode-card.active .ck-mode-card__state,
.ck-customer-card.active .ck-customer-card__state {
  border-color: rgb(var(--v-theme-on-surface));
  background: rgba(255, 255, 255, 0.08);
}

.ck-type-card {
  min-height: 84px;
  border-radius: 18px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.03);
}

.ck-type-card__letter {
  min-width: 66px;
  height: 66px;
  padding: 0 14px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: 950;
  line-height: 1;
  letter-spacing: -0.04em;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.ck-type-card--A .ck-type-card__letter {
  background: rgba(var(--v-theme-primary), 0.12);
}

.ck-type-card--B .ck-type-card__letter {
  background: rgba(var(--v-theme-success), 0.1);
}

.ck-type-card--C .ck-type-card__letter {
  background: rgba(var(--v-theme-warning), 0.14);
}

.ck-type-card--X .ck-type-card__letter {
  background: rgba(var(--v-theme-error), 0.1);
}

@media (max-width: 980px) {
  .ck-customer-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .ck-screen {
    padding: 6px 0 0;
    gap: 10px;
  }

  .ck-mode-grid,
  .ck-customer-grid {
    grid-template-columns: 1fr;
  }

  .ck-mode-card {
    min-height: 74px;
  }

  .ck-customer-card {
    min-height: 88px;
  }

  .ck-type-card {
    min-height: 78px;
    padding: 12px;
  }

  .ck-type-card__letter {
    min-width: 58px;
    height: 58px;
    font-size: 1.5rem;
    border-radius: 18px;
  }
}
</style>