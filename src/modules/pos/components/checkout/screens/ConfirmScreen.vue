<template>
  <div class="ck-screen">
    <div class="ck-screen__head">
      <div class="ck-screen__title">Confirmar venta</div>
      <div class="ck-screen__subtitle">
        Revisá antes de finalizar
      </div>
    </div>

    <div class="ck-screen__body">
      <div class="ck-confirm">

        <!-- TOTAL (PROTAGONISTA) -->
        <section class="ck-total-card">
          <div class="ck-total-card__label">TOTAL</div>
          <div class="ck-total-card__value">
            {{ money(totalSafe) }}
          </div>
        </section>

        <!-- RESUMEN LIMPIO -->
        <section class="ck-summary-card">

          <div class="ck-summary-row">
            <span>Medio de pago</span>
            <strong>{{ paymentSummaryLabel || "Sin medio" }}</strong>
          </div>

          <div class="ck-summary-row">
            <span>Comprobante</span>
            <strong>{{ invoiceModeText }}</strong>
          </div>

          <div class="ck-summary-row">
            <span>Cliente</span>
            <strong :class="{ 'ck-warn': isCustomerMissing }">
              {{ customerLabel }}
            </strong>
          </div>

        </section>

        <!-- ACCION -->
        <section class="ck-confirm-cta">
          <v-icon size="18">mdi-check-circle-outline</v-icon>
          <span>Enter para confirmar venta</span>
        </section>

      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick } from "vue";

const props = defineProps({
  state: { type: Object, required: true },
  paymentSummaryLabel: { type: String, default: "" },
  customerName: { type: String, default: "" },
  customerDoc: { type: String, default: "" },
  totalSafe: { type: Number, default: 0 },
  money: { type: Function, required: true },
});

const emit = defineEmits(["confirm", "back"]);

const invoiceModeText = computed(() => {
  const mode = String(props.state?.invoiceMode || "").toUpperCase();
  const type = String(props.state?.invoiceType || "").toUpperCase();

  if (mode === "FISCAL") {
    return type ? `Fiscal · ${type}` : "Fiscal";
  }

  return "No fiscal";
});

const customerLabel = computed(() => {
  const name = String(props.customerName || "").trim();
  const doc = String(props.customerDoc || "").trim();

  if (name && doc) return `${name} · ${doc}`;
  if (name) return name;
  if (doc) return doc;

  const isFiscal = String(props.state?.invoiceMode || "").toUpperCase() === "FISCAL";
  return isFiscal ? "Falta completar" : "Sin cliente";
});

const isCustomerMissing = computed(() => {
  const isFiscal = String(props.state?.invoiceMode || "").toUpperCase() === "FISCAL";
  return isFiscal && !props.customerName && !props.customerDoc;
});

function focusCurrent() {
  nextTick(() => {});
}

function handleKeyboardAction(action) {
  if (action === "enter") {
    emit("confirm");
    return true;
  }

  if (action === "backspace") {
    emit("back");
    return true;
  }

  return false;
}

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
  padding: 10px 12px;
  border-radius: 20px;
  background: transparent;
}

.ck-screen__head {
  display: grid;
  gap: 4px;
}

.ck-screen__title {
  font-size: 1.2rem;
  font-weight: 950;
}

.ck-screen__subtitle {
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.ck-confirm {
  display: grid;
  gap: 12px;
}

/* TOTAL */
.ck-total-card {
  padding: 16px;
  border-radius: 18px;
  background: rgba(var(--v-theme-primary), 0.08);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.ck-total-card__label {
  font-size: 0.75rem;
  font-weight: 900;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.ck-total-card__value {
  font-size: 2rem;
  font-weight: 950;
}

/* SUMMARY */
.ck-summary-card {
  display: grid;
  gap: 8px;
}

.ck-summary-row {
  min-height: 46px;
  padding: 0 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ck-summary-row span {
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.ck-summary-row strong {
  font-weight: 900;
}

.ck-warn {
  color: rgb(var(--v-theme-error));
}

/* CTA */
.ck-confirm-cta {
  min-height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  background: rgba(var(--v-theme-success), 0.1);
  font-weight: 900;
}
</style>