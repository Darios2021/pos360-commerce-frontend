<template>
  <div class="ck-step-shell ck-invoice-pos">
    <div class="ck-invoice-pos__header">
      <div>
        <div class="ck-invoice-pos__title">Facturación</div>
        <div class="ck-invoice-pos__subtitle">
          Flechas cambian la selección · Enter confirma · Backspace vuelve
        </div>
      </div>

      <div class="ck-invoice-pos__status">
        <span class="ck-mini-pill">
          {{ isFiscal ? "Fiscal" : "No fiscal" }}
        </span>

        <span v-if="isFiscal" class="ck-mini-pill">
          {{ customerLabel }}
        </span>

        <span class="ck-mini-pill">
          Tipo {{ effectiveInvoiceType }}
        </span>
      </div>
    </div>

    <div class="ck-invoice-pos__body">
      <section
        class="ck-line"
        :class="{ activeLine: cursorGroup === 0 }"
      >
        <div class="ck-line__label">
          <span class="ck-line__step">1</span>
          <span class="ck-line__text">Comprobante</span>
        </div>

        <div class="ck-line__options">
          <button
            v-for="(item, idx) in invoiceModeItems"
            :key="item.value"
            ref="invoiceModeRefs"
            type="button"
            class="ck-chip-option"
            :class="{
              selected: currentModeValue === item.value,
              cursor: cursorGroup === 0 && cursorIndex === idx
            }"
            @click="selectValue(0, item.value, idx)"
            @dblclick="confirmCurrent"
          >
            {{ item.title }}
          </button>
        </div>
      </section>

      <section
        v-if="isFiscal"
        class="ck-line"
        :class="{ activeLine: cursorGroup === 1 }"
      >
        <div class="ck-line__label">
          <span class="ck-line__step">2</span>
          <span class="ck-line__text">Cliente fiscal</span>
        </div>

        <div class="ck-line__options">
          <button
            v-for="(item, idx) in customerTypeItems"
            :key="item.value"
            ref="customerTypeRefs"
            type="button"
            class="ck-chip-option"
            :class="{
              selected: state.customerType === item.value,
              cursor: cursorGroup === 1 && cursorIndex === idx
            }"
            @click="selectValue(1, item.value, idx)"
            @dblclick="confirmCurrent"
          >
            {{ item.title }}
          </button>
        </div>
      </section>

      <section class="ck-line ck-line--info">
        <div class="ck-line__label">
          <span class="ck-line__step ck-line__step--info">i</span>
          <span class="ck-line__text">Resultado</span>
        </div>

        <div class="ck-result">
          <div class="ck-result__item">
            <span class="ck-result__k">Modo</span>
            <span class="ck-result__v">{{ isFiscal ? "Fiscal" : "No fiscal" }}</span>
          </div>

          <div class="ck-result__item">
            <span class="ck-result__k">Cliente</span>
            <span class="ck-result__v">
              {{ isFiscal ? customerLabel : "No aplica" }}
            </span>
          </div>

          <div class="ck-result__item">
            <span class="ck-result__k">Tipo sugerido</span>
            <span class="ck-result__v">Tipo {{ effectiveInvoiceType }}</span>
          </div>
        </div>
      </section>
    </div>

    <div class="ck-invoice-pos__footer">
      <div class="ck-kbd-inline">
        ← → cambia · ↑ ↓ bloque · Enter confirmar · Backspace volver
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["next-step", "prev-step"]);

const invoiceModeRefs = ref([]);
const customerTypeRefs = ref([]);

const cursorGroup = ref(0);
const cursorIndex = ref(0);

const invoiceModeItems = [
  { title: "No fiscal", value: "NO_FISCAL" },
  { title: "Fiscal", value: "FISCAL" },
];

const customerTypeItems = [
  { title: "Consumidor final", value: "CONSUMIDOR_FINAL" },
  { title: "Resp. inscripto", value: "RESPONSABLE_INSCRIPTO" },
  { title: "Monotributo", value: "MONOTRIBUTO" },
  { title: "Exento", value: "EXENTO" },
];

const currentModeValue = computed(() => {
  const raw = String(props.state.invoiceMode || "").toUpperCase();
  return raw === "FISCAL" ? "FISCAL" : "NO_FISCAL";
});

const isFiscal = computed(() => currentModeValue.value === "FISCAL");

const customerLabel = computed(() => {
  return (
    customerTypeItems.find((x) => x.value === props.state.customerType)?.title ||
    props.state.customerType ||
    "Consumidor final"
  );
});

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
      refs: invoiceModeRefs,
      items: invoiceModeItems,
      get value() {
        return currentModeValue.value;
      },
    },
  ];

  if (isFiscal.value) {
    base.push({
      refs: customerTypeRefs,
      items: customerTypeItems,
      get value() {
        return props.state.customerType;
      },
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

watch(
  isFiscal,
  (v) => {
    if (!v && cursorGroup.value > 0) {
      cursorGroup.value = 0;
      cursorIndex.value = normalizeIndexByValue(0);
    }
  }
);

function normalizeIndexByValue(groupIdx) {
  const group = groups.value[groupIdx];
  if (!group) return 0;
  const idx = group.items.findIndex((x) => x.value === group.value);
  return idx >= 0 ? idx : 0;
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

/**
 * Acá está el cambio clave:
 * seleccionar NO avanza.
 * seleccionar = cambia el estado real y actualiza el resumen inferior.
 */
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

function moveHorizontal(direction) {
  const group = groups.value[cursorGroup.value];
  if (!group) return true;

  const last = group.items.length - 1;
  let next = cursorIndex.value;

  if (direction === "left" && next > 0) next -= 1;
  if (direction === "right" && next < last) next += 1;

  cursorIndex.value = next;

  const item = group.items[next];
  if (item) {
    selectValue(cursorGroup.value, item.value, next);
  } else {
    focusCurrent();
  }

  return true;
}

function moveVertical(direction) {
  const lastGroup = groups.value.length - 1;

  if (direction === "up" && cursorGroup.value > 0) {
    cursorGroup.value -= 1;
    cursorIndex.value = normalizeIndexByValue(cursorGroup.value);
    focusCurrent();
    return true;
  }

  if (direction === "down" && cursorGroup.value < lastGroup) {
    cursorGroup.value += 1;
    cursorIndex.value = normalizeIndexByValue(cursorGroup.value);
    focusCurrent();
    return true;
  }

  return true;
}

function confirmCurrent() {
  if (cursorGroup.value === 0) {
    if (currentModeValue.value === "NO_FISCAL") {
      emit("next-step");
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
    emit("next-step");
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

  emit("prev-step");
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

defineExpose({
  handleKeyboardAction,
  focusCurrent,
});
</script>

<style scoped>
.ck-invoice-pos {
  min-height: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border-radius: 18px;
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
}

.ck-invoice-pos__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.ck-invoice-pos__title {
  font-size: 1.05rem;
  font-weight: 900;
  line-height: 1.1;
}

.ck-invoice-pos__subtitle {
  margin-top: 4px;
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.64);
}

.ck-invoice-pos__status {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ck-mini-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.07);
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.78rem;
  font-weight: 800;
  white-space: nowrap;
}

.ck-invoice-pos__body {
  display: grid;
  gap: 10px;
  flex: 1 1 auto;
  min-height: 0;
}

.ck-line {
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgba(var(--v-theme-on-surface), 0.025);
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;
}

.ck-line.activeLine {
  border-color: rgba(var(--v-theme-primary), 0.38);
  box-shadow: 0 0 0 1px rgba(var(--v-theme-primary), 0.12);
}

.ck-line--info {
  background: rgba(var(--v-theme-primary), 0.035);
}

.ck-line__label {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.ck-line__step {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  font-size: 0.78rem;
  font-weight: 900;
  flex: 0 0 auto;
}

.ck-line__step--info {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.ck-line__text {
  font-size: 0.92rem;
  font-weight: 900;
  line-height: 1.1;
}

.ck-line__options {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.ck-chip-option {
  min-height: 40px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.88rem;
  font-weight: 800;
  white-space: nowrap;
  outline: none;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;
}

.ck-chip-option:hover {
  border-color: rgba(var(--v-theme-primary), 0.25);
}

.ck-chip-option.selected {
  background: rgba(var(--v-theme-primary), 0.1);
  border-color: rgba(var(--v-theme-primary), 0.52);
  color: rgb(var(--v-theme-on-surface));
}

.ck-chip-option.cursor {
  border-color: rgba(var(--v-theme-primary), 0.9);
  box-shadow:
    0 0 0 2px rgba(var(--v-theme-primary), 0.22),
    0 6px 18px rgba(0, 0, 0, 0.12);
  background: rgba(var(--v-theme-primary), 0.14);
}

.ck-result {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.ck-result__item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
}

.ck-result__k {
  font-size: 0.78rem;
  font-weight: 800;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.ck-result__v {
  font-size: 0.88rem;
  font-weight: 900;
  color: rgb(var(--v-theme-on-surface));
}

.ck-invoice-pos__footer {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  flex-wrap: wrap;
}

.ck-kbd-inline {
  font-size: 0.8rem;
  font-weight: 800;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

@media (max-width: 840px) {
  .ck-line {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .ck-line__label {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .ck-line__options {
    gap: 6px;
  }

  .ck-chip-option {
    min-height: 38px;
    padding: 0 12px;
    font-size: 0.84rem;
  }

  .ck-mini-pill {
    font-size: 0.74rem;
  }

  .ck-result {
    gap: 10px;
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>