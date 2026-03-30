<template>
  <div class="pmx">
    <div class="pmx__topbar">
      <div class="pmx__topbar-left">
        <div class="pmx__title">Pago mixto</div>
        <div class="pmx__subtitle">
          Repartí el cobro entre varios medios
        </div>
      </div>

      <button
        type="button"
        class="pmx__add"
        :class="{ active: activeZone === 'add' }"
        @click="onAddRow"
      >
        <span class="pmx__add-icon">
          <v-icon size="18">mdi-plus</v-icon>
        </span>
        <span>Agregar pago</span>
      </button>
    </div>

    <div class="pmx__list">
      <div
        v-for="(row, idx) in state.mixedPayments"
        :key="row.uid"
        class="pmx-row"
        :class="{ active: activeZone === row.uid }"
      >
        <div class="pmx-row__head">
          <div class="pmx-row__badge">
            Pago {{ idx + 1 }}
          </div>

          <button
            type="button"
            class="pmx-row__remove"
            :class="{
              active: activeZone === row.uid && activeField === 'remove'
            }"
            :disabled="state.mixedPayments.length === 1"
            @click="$emit('remove-mixed-row', row.uid)"
          >
            <v-icon size="16">mdi-close</v-icon>
          </button>
        </div>

        <div class="pmx-row__body">
          <button
            type="button"
            class="pmx-card pmx-card--method"
            :class="{
              active: activeZone === row.uid && activeField === 'method'
            }"
            @click="focusMethodField(idx)"
          >
            <div class="pmx-card__label">Medio</div>

            <div class="pmx-method">
              <div class="pmx-method__left">
                <span class="pmx-method__icon">
                  <v-icon size="18">{{ currentMethodIcon(row) }}</v-icon>
                </span>

                <div class="pmx-method__text">
                  <div class="pmx-method__title">
                    {{ currentMethodLabel(row) }}
                  </div>
                  <div class="pmx-method__hint">
                    ← → cambiar
                  </div>
                </div>
              </div>

              <div class="pmx-method__right">
                <v-icon size="16">mdi-chevron-left</v-icon>
                <v-icon size="16">mdi-chevron-right</v-icon>
              </div>
            </div>
          </button>

          <div
            class="pmx-card pmx-card--amount"
            :class="{
              active: activeZone === row.uid && activeField === 'amount'
            }"
            @click="focusAmountField(idx)"
          >
            <div class="pmx-card__label">Importe</div>

            <v-text-field
              :ref="(el) => setAmountRef(el, idx)"
              v-model="row.amount"
              placeholder="0"
              variant="outlined"
              density="comfortable"
              hide-details
              inputmode="numeric"
              class="pmx-amount"
              @focus="setActive(row.uid, 'amount')"
              @keydown.enter.stop.prevent="focusRemoveField(idx)"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="pmx__summary">
      <div class="pmx-total">
        <div class="pmx-total__left">
          <v-icon size="18">mdi-cash-check</v-icon>
          <span>Pagado</span>
        </div>
        <strong>{{ money(mixedPaid) }}</strong>
      </div>

      <div
        class="pmx-total"
        :class="{ warn: mixedMissing > 0 }"
      >
        <div class="pmx-total__left">
          <v-icon size="18">mdi-alert-circle-outline</v-icon>
          <span>Falta</span>
        </div>
        <strong>{{ money(mixedMissing) }}</strong>
      </div>

      <div
        class="pmx-total"
        :class="{ ok: mixedChange > 0 }"
      >
        <div class="pmx-total__left">
          <v-icon size="18">mdi-cash-refund</v-icon>
          <span>Vuelto</span>
        </div>
        <strong>{{ money(mixedChange) }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from "vue";

const props = defineProps({
  state: { type: Object, required: true },
  mixedMethodItems: { type: Array, default: () => [] },
  mixedPaid: { type: Number, default: 0 },
  mixedMissing: { type: Number, default: 0 },
  mixedChange: { type: Number, default: 0 },
  money: { type: Function, required: true },
  setMixedAmountRef: { type: Function, default: null },
});

const emit = defineEmits([
  "add-mixed-row",
  "remove-mixed-row",
]);

const amountRefs = ref([]);
const activeZone = ref("add");
const activeField = ref("method");

const rowsCountLabel = computed(() => {
  const total = props.state?.mixedPayments?.length || 0;
  return `${total} ${total === 1 ? "pago" : "pagos"}`;
});

function methodsList() {
  return Array.isArray(props.mixedMethodItems) ? props.mixedMethodItems : [];
}

function setAmountRef(el, idx) {
  amountRefs.value[idx] = el;
  if (idx === 0 && typeof props.setMixedAmountRef === "function") {
    props.setMixedAmountRef(el);
  }
}

function getAmountInput(idx) {
  const el = amountRefs.value[idx];
  if (!el?.$el) return null;
  return el.$el.querySelector("input");
}

function currentMethod(row) {
  return methodsList().find(
    (m) => Number(m.value) === Number(row?.payment_method_id)
  ) || null;
}

function currentMethodLabel(row) {
  return currentMethod(row)?.title || "Elegir medio";
}

function currentMethodIcon(row) {
  const label = String(currentMethodLabel(row)).toLowerCase();

  if (label.includes("efect")) return "mdi-cash";
  if (label.includes("tarj")) return "mdi-credit-card-outline";
  if (label.includes("transfer")) return "mdi-bank-transfer";
  if (label.includes("qr")) return "mdi-qrcode";
  if (label.includes("mercado")) return "mdi-qrcode";
  return "mdi-wallet-outline";
}

function setActive(zone, field = "method") {
  activeZone.value = zone;
  activeField.value = field;
}

function rowIndexByUid(uid) {
  return (props.state?.mixedPayments || []).findIndex((x) => x.uid === uid);
}

function focusAdd() {
  setActive("add", "add");
}

function focusMethodField(idx = 0) {
  const row = props.state?.mixedPayments?.[idx];
  if (!row) return;
  setActive(row.uid, "method");
}

function focusAmountField(idx = 0) {
  const row = props.state?.mixedPayments?.[idx];
  if (!row) return;

  setActive(row.uid, "amount");

  nextTick(() => {
    const input = getAmountInput(idx);
    input?.focus?.();
    input?.select?.();
  });
}

function focusRemoveField(idx = 0) {
  const row = props.state?.mixedPayments?.[idx];
  if (!row) return;
  setActive(row.uid, "remove");
}

function focusCurrent() {
  if (activeZone.value === "add") return;

  const idx = rowIndexByUid(activeZone.value);
  if (idx < 0) {
    focusAdd();
    return;
  }

  if (activeField.value === "amount") {
    focusAmountField(idx);
    return;
  }

  if (activeField.value === "method") {
    focusMethodField(idx);
    return;
  }

  if (activeField.value === "remove") {
    focusRemoveField(idx);
  }
}

function onAddRow() {
  emit("add-mixed-row");

  nextTick(() => {
    const rows = props.state?.mixedPayments || [];
    const idx = Math.max(0, rows.length - 1);
    focusAmountField(idx);
  });
}

function cycleMethod(idx, direction) {
  const row = props.state?.mixedPayments?.[idx];
  const items = methodsList();
  if (!row || !items.length) return false;

  const currentIdx = items.findIndex(
    (m) => Number(m.value) === Number(row.payment_method_id)
  );

  let nextIdx = currentIdx >= 0 ? currentIdx : 0;

  if (direction === "left") {
    nextIdx = nextIdx > 0 ? nextIdx - 1 : items.length - 1;
  }

  if (direction === "right") {
    nextIdx = nextIdx < items.length - 1 ? nextIdx + 1 : 0;
  }

  row.payment_method_id = items[nextIdx]?.value ?? row.payment_method_id;
  return true;
}

function moveVertical(direction) {
  const rows = props.state?.mixedPayments || [];
  if (!rows.length) {
    focusAdd();
    return true;
  }

  if (activeZone.value === "add") {
    if (direction === "down") {
      focusMethodField(0);
      return true;
    }
    return true;
  }

  const idx = rowIndexByUid(activeZone.value);
  if (idx < 0) {
    focusAdd();
    return true;
  }

  if (direction === "up") {
    if (idx === 0) {
      focusAdd();
      return true;
    }

    const prevIdx = idx - 1;
    if (activeField.value === "remove") {
      focusRemoveField(prevIdx);
      return true;
    }
    if (activeField.value === "amount") {
      focusAmountField(prevIdx);
      return true;
    }

    focusMethodField(prevIdx);
    return true;
  }

  if (direction === "down") {
    if (idx >= rows.length - 1) return true;

    const nextIdx = idx + 1;
    if (activeField.value === "remove") {
      focusRemoveField(nextIdx);
      return true;
    }
    if (activeField.value === "amount") {
      focusAmountField(nextIdx);
      return true;
    }

    focusMethodField(nextIdx);
    return true;
  }

  return false;
}

function moveHorizontal(direction) {
  const rows = props.state?.mixedPayments || [];

  if (activeZone.value === "add") return true;

  const idx = rowIndexByUid(activeZone.value);
  if (idx < 0 || !rows[idx]) return false;

  if (activeField.value === "method") {
    if (direction === "left" || direction === "right") {
      return cycleMethod(idx, direction);
    }
  }

  if (direction === "right") {
    if (activeField.value === "method") {
      focusAmountField(idx);
      return true;
    }
    if (activeField.value === "amount") {
      focusRemoveField(idx);
      return true;
    }
  }

  if (direction === "left") {
    if (activeField.value === "remove") {
      focusAmountField(idx);
      return true;
    }
    if (activeField.value === "amount") {
      focusMethodField(idx);
      return true;
    }
  }

  return true;
}

function handleKeyboardAction(action) {
  if (action === "up") return moveVertical("up");
  if (action === "down") return moveVertical("down");
  if (action === "left") return moveHorizontal("left");
  if (action === "right") return moveHorizontal("right");

  if (action === "enter") {
    if (activeZone.value === "add") {
      onAddRow();
      return true;
    }

    const idx = rowIndexByUid(activeZone.value);
    if (idx < 0) return false;

    if (activeField.value === "method") {
      focusAmountField(idx);
      return true;
    }

    if (activeField.value === "remove") {
      const row = props.state?.mixedPayments?.[idx];
      if (!row || (props.state?.mixedPayments?.length || 0) <= 1) return true;

      emit("remove-mixed-row", row.uid);

      nextTick(() => {
        const rows = props.state?.mixedPayments || [];
        if (!rows.length) {
          focusAdd();
          return;
        }

        const nextIdx = Math.max(0, Math.min(idx, rows.length - 1));
        focusMethodField(nextIdx);
      });

      return true;
    }

    return false;
  }

  return false;
}

defineExpose({
  focusCurrent,
  handleKeyboardAction,
});
</script>

<style scoped>
.pmx {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.pmx__topbar {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.pmx__topbar-left {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.pmx__title {
  font-size: 1rem;
  font-weight: 950;
  line-height: 1;
  letter-spacing: -0.02em;
}

.pmx__subtitle {
  font-size: 0.76rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.58);
  line-height: 1.1;
}

.pmx__add {
  min-height: 42px;
  padding: 0 14px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-on-surface), 0.04);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.86rem;
  font-weight: 900;
  cursor: pointer;
  transition:
    border-color 0.14s ease,
    background-color 0.14s ease,
    box-shadow 0.14s ease,
    transform 0.14s ease;
}

.pmx__add:hover {
  transform: translateY(-1px);
}

.pmx__add.active {
  border-color: rgba(var(--v-theme-primary), 0.85);
  background: rgba(var(--v-theme-primary), 0.08);
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.12);
}

.pmx__add-icon {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.pmx__list {
  display: grid;
  gap: 8px;
  max-height: 370px;
  overflow: auto;
  padding-right: 4px;
}

.pmx__list::-webkit-scrollbar {
  width: 8px;
}

.pmx__list::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.14);
  border-radius: 999px;
}

.pmx-row {
  display: grid;
  gap: 8px;
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background:
    linear-gradient(
      180deg,
      rgba(var(--v-theme-surface), 0.78) 0%,
      rgba(var(--v-theme-on-surface), 0.02) 100%
    );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 4px 10px rgba(0, 0, 0, 0.025);
}

.pmx-row.active {
  border-color: rgba(var(--v-theme-primary), 0.24);
  box-shadow:
    0 0 0 1px rgba(var(--v-theme-primary), 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.pmx-row__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pmx-row__badge {
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 0.74rem;
  font-weight: 900;
}

.pmx-row__remove {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.72;
}

.pmx-row__remove.active {
  border-color: rgba(var(--v-theme-primary), 0.85);
  background: rgba(var(--v-theme-primary), 0.08);
  opacity: 1;
}

.pmx-row__remove:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.pmx-row__body {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(180px, 0.8fr);
  gap: 8px;
  min-width: 0;
}

.pmx-card {
  min-width: 0;
  padding: 8px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.02);
  transition:
    border-color 0.14s ease,
    background-color 0.14s ease,
    box-shadow 0.14s ease;
}

.pmx-card.active {
  border-color: rgba(var(--v-theme-primary), 0.85);
  background: rgba(var(--v-theme-primary), 0.05);
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.1);
}

.pmx-card--method {
  cursor: pointer;
  text-align: left;
}

.pmx-card__label {
  font-size: 0.72rem;
  font-weight: 900;
  color: rgba(var(--v-theme-on-surface), 0.58);
  line-height: 1;
  padding: 0 2px 6px;
}

.pmx-method {
  min-height: 50px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}

.pmx-method__left {
  min-width: 0;
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
}

.pmx-method__icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.pmx-method__text {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.pmx-method__title {
  font-size: 0.98rem;
  font-weight: 900;
  line-height: 1.05;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pmx-method__hint {
  font-size: 0.7rem;
  font-weight: 800;
  color: rgba(var(--v-theme-on-surface), 0.52);
  line-height: 1;
}

.pmx-method__right {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: rgba(var(--v-theme-on-surface), 0.48);
}

.pmx-amount :deep(.v-field) {
  border-radius: 12px;
}

.pmx-amount :deep(input) {
  font-size: 1.02rem;
  font-weight: 950;
}

.pmx__summary {
  display: grid;
  gap: 8px;
}

.pmx-total {
  min-height: 44px;
  padding: 0 12px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  background: rgba(var(--v-theme-on-surface), 0.02);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.9rem;
}

.pmx-total__left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-weight: 800;
}

.pmx-total strong {
  font-weight: 950;
  white-space: nowrap;
  font-size: 0.98rem;
  letter-spacing: -0.01em;
}

.pmx-total.warn {
  color: rgb(var(--v-theme-error));
  border-color: rgba(var(--v-theme-error), 0.16);
  background: rgba(var(--v-theme-error), 0.05);
}

.pmx-total.warn .pmx-total__left {
  color: rgb(var(--v-theme-error));
}

.pmx-total.ok {
  color: rgb(var(--v-theme-success));
  border-color: rgba(var(--v-theme-success), 0.16);
  background: rgba(var(--v-theme-success), 0.05);
}

.pmx-total.ok .pmx-total__left {
  color: rgb(var(--v-theme-success));
}

@media (max-width: 760px) {
  .pmx__topbar {
    align-items: stretch;
  }

  .pmx__add {
    width: 100%;
    justify-content: center;
  }

  .pmx-row__body {
    grid-template-columns: 1fr;
  }

  .pmx-amount :deep(input) {
    font-size: 0.98rem;
  }
}
</style>