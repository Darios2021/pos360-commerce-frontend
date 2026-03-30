<template>
  <div class="ck-screen">
    <!-- HEADER -->
    <div class="ck-screen__head">
      <div class="ck-screen__title">Facturación</div>
      <div class="ck-screen__subtitle">Elegí el comprobante</div>
    </div>

    <div class="ck-screen__body">
      <div class="ck-flow">

        <!-- =========================
             COMPROBANTE
        ========================= -->
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
                  <v-icon size="18">
                    {{
                      item.value === "FISCAL"
                        ? "mdi-receipt-text-outline"
                        : "mdi-cash-register"
                    }}
                  </v-icon>
                </span>

                <div class="ck-mode-card__text">
                  <span class="ck-mode-card__title">
                    {{ item.title }}
                  </span>
                  <span class="ck-mode-card__hint">
                    {{
                      item.value === "FISCAL"
                        ? "Comprobante ARCA"
                        : "Venta sin comprobante fiscal"
                    }}
                  </span>
                </div>
              </div>

              <!-- TAG -->
              <span
                v-if="cursorGroup === 0 && cursorIndex === idx"
                class="ck-cursor-tag"
              >
                Elegir
              </span>

              <!-- CHECK -->
              <span class="ck-mode-card__state">
                <v-icon
                  v-if="currentModeValue === item.value"
                  size="14"
                >
                  mdi-check
                </v-icon>
              </span>
            </button>
          </div>
        </section>

        <!-- =========================
             CONDICION CLIENTE
        ========================= -->
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
              <!-- LETRA -->
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

              <!-- TAG -->
              <span
                v-if="cursorGroup === 1 && cursorIndex === idx"
                class="ck-cursor-tag"
              >
                Elegir
              </span>

              <!-- CHECK -->
              <span class="ck-customer-card__state">
                <v-icon
                  v-if="state.customerType === item.value"
                  size="14"
                >
                  mdi-check
                </v-icon>
              </span>
            </button>
          </div>
        </section>

        <!-- =========================
             TIPO DE COMPROBANTE
        ========================= -->
        <section class="ck-group">
          <div class="ck-group__label">Tipo de comprobante</div>

          <!-- 🔥 NO FISCAL (MISMO ESTILO QUE LOS DEMÁS) -->
          <div v-if="!isFiscal" class="ck-type-grid ck-type-grid--single">
            <div class="ck-type-card ck-type-card--X active">
              <div class="ck-type-card__left">
                <span class="ck-type-card__icon">
                  <v-icon size="18">mdi-file-cancel-outline</v-icon>
                </span>

                <div class="ck-type-card__text">
                  <span class="ck-type-card__title">
                    No fiscal
                  </span>
                  <span class="ck-type-card__hint">
                    Comprobante interno
                  </span>
                </div>
              </div>

              <span class="ck-type-card__letter">X</span>
            </div>
          </div>

          <!-- 🔥 FISCAL -->
          <div v-else class="ck-type-grid ck-type-grid--single">
            <div
              class="ck-type-card"
              :class="`ck-type-card--${effectiveInvoiceType}`"
            >
              <div class="ck-type-card__left">
                <span class="ck-type-card__icon">
                  <v-icon size="18">mdi-file-document-outline</v-icon>
                </span>

                <div class="ck-type-card__text">
                  <span class="ck-type-card__title">
                    Fiscal
                  </span>
                  <span class="ck-type-card__hint">
                    Tipo de comprobante
                  </span>
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
/* =========================
   SCREEN
========================= */
.ck-screen {
  min-height: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 8px;
  padding: 8px 10px;
}

.ck-screen__head {
  display: grid;
  gap: 2px;
}

.ck-screen__title {
  font-size: 0.95rem;
  font-weight: 950;
  line-height: 1.05;
  color: rgb(var(--v-theme-on-surface));
}

.ck-screen__subtitle {
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.05;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

/* =========================
   FLOW
========================= */
.ck-flow {
  display: grid;
  gap: 10px;
}

.ck-group {
  display: grid;
  gap: 4px;
}

.ck-group__label {
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

/* =========================
   GRID
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

/* 🔥 IMPORTANTE: evita que la X sea gigante */
.ck-type-grid--compact {
  display: grid;
  justify-content: start;
}

.ck-type-grid--compact .ck-type-card {
  width: min(420px, 100%);
}

/* =========================
   CARD BASE (COMPACTA)
========================= */
.ck-mode-card,
.ck-customer-card,
.ck-type-card {
  position: relative;
  z-index: 1;
  width: 100%;
  min-width: 0;

  border-radius: 20px;

  border: 1px solid rgba(255, 255, 255, 0.1);

  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.02) 0%,
      rgba(255, 255, 255, 0.01) 100%
    ),
    rgba(10, 20, 44, 0.75);

  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 6px 16px rgba(0, 0, 0, 0.18);

  transition:
    border-color 0.14s ease,
    box-shadow 0.14s ease,
    background 0.14s ease,
    transform 0.14s ease;
}

/* tamaños compactos */
.ck-mode-card,
.ck-type-card {
  min-height: 60px;
  padding: 10px 40px 10px 12px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.ck-customer-card {
  min-height: 78px;
  padding: 8px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
}

/* hover */
.ck-mode-card:hover,
.ck-customer-card:hover {
  transform: translateY(-1px);
  border-color: rgba(44, 132, 255, 0.25);
}

/* =========================
   ACTIVO (ESTILO CUOTAS)
========================= */
.ck-mode-card.active,
.ck-customer-card.active,
.ck-type-card.active,
.ck-mode-card.cursorActive,
.ck-customer-card.cursorActive {
  z-index: 3;

  border: 1px solid rgba(44, 132, 255, 0.6);

  background:
    linear-gradient(
      180deg,
      rgba(44, 132, 255, 0.16) 0%,
      rgba(44, 132, 255, 0.1) 100%
    ),
    rgba(10, 20, 44, 0.9);

  box-shadow:
    0 0 0 2px rgba(44, 132, 255, 0.35),
    0 0 0 5px rgba(44, 132, 255, 0.12),
    0 10px 22px rgba(0, 0, 0, 0.22);

  transform: translateY(-1px);
}

.ck-mode-card.cursor,
.ck-customer-card.cursor {
  border-color: rgba(44, 132, 255, 0.35);
}

/* =========================
   CONTENT
========================= */
.ck-mode-card__left,
.ck-type-card__left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

/* iconos chicos */
.ck-mode-card__icon,
.ck-type-card__icon,
.ck-doc-chip,
.ck-type-card__letter {
  width: 28px;
  height: 28px;
  border-radius: 10px;

  background: rgba(255, 255, 255, 0.06);

  display: flex;
  align-items: center;
  justify-content: center;
}

/* textos compactos */
.ck-mode-card__title,
.ck-type-card__title {
  font-size: 0.78rem;
  font-weight: 900;
  line-height: 1.05;
  color: #f4f7fb;
}

.ck-mode-card__hint,
.ck-type-card__hint,
.ck-customer-card__hint {
  font-size: 0.64rem;
  font-weight: 800;
  line-height: 1.05;
  color: rgba(255, 255, 255, 0.7);
}

.ck-customer-card__title {
  font-size: 0.72rem;
  font-weight: 900;
}

/* =========================
   TYPE LETTER (A/B/C/X IGUALES)
========================= */
.ck-type-card__letter {
  font-size: 0.8rem;
  font-weight: 950;
}

/* =========================
   CHECK
========================= */
.ck-mode-card__state,
.ck-customer-card__state {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  color: #fff;
}

/* =========================
   TAG "ELEGIR"
========================= */
.ck-cursor-tag {
  position: absolute;
  top: -10px;
  right: 14px;

  z-index: 5;

  height: 22px;
  padding: 0 10px;

  border-radius: 999px;
  font-size: 0.62rem;
  font-weight: 950;

  color: white;

  background: linear-gradient(
    180deg,
    rgba(120, 130, 150, 0.95),
    rgba(90, 100, 120, 0.95)
  );

  border: 1px solid rgba(255, 255, 255, 0.2);

  box-shadow:
    0 4px 10px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

/* =========================
   RESPONSIVE
========================= */
@media (max-width: 900px) {
  .ck-customer-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 760px) {
  .ck-mode-grid,
  .ck-customer-grid {
    grid-template-columns: 1fr;
  }
}
</style>