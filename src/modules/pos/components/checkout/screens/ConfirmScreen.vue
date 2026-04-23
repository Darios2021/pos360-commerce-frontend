<template>
  <div class="ck-screen" ref="rootRef" tabindex="-1">
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

          <!-- Vuelto destacado en la confirmación -->
          <div v-if="showChange" class="ck-total-card__change">
            <v-icon size="16">mdi-cash-refund</v-icon>
            <span>Vuelto</span>
            <strong>{{ money(changeSafe) }}</strong>
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
          <span>Enter o F10 para confirmar venta</span>
        </section>

      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from "vue";

const props = defineProps({
  state: { type: Object, required: true },
  paymentSummaryLabel: { type: String, default: "" },
  invoiceModeLabel: { type: String, default: "" },
  customerName: { type: String, default: "" },
  customerDoc: { type: String, default: "" },
  customerPhone: { type: String, default: "" },
  selectedMethod: { type: Object, default: null },
  paidSafe: { type: Number, default: 0 },
  changeSafe: { type: Number, default: 0 },
  previewSafe: { type: Number, default: 0 },
  totalSafe: { type: Number, default: 0 },
  money: { type: Function, required: true },
});

const emit = defineEmits(["confirm", "back"]);

const rootRef = ref(null);

const showChange = computed(() => Number(props.changeSafe || 0) > 0.5);

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
  nextTick(() => {
    rootRef.value?.focus?.();
  });
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
  gap: 8px;
  padding: 8px 10px;
  border-radius: 20px;
  background: transparent;
  min-width: 0;
  outline: none;
}

.ck-screen__head {
  display: grid;
  gap: 2px;
}

.ck-screen__title {
  font-size: 0.98rem;
  line-height: 1.05;
  font-weight: 900;
  color: rgb(var(--v-theme-on-surface));
}

.ck-screen__subtitle {
  font-size: 0.74rem;
  line-height: 1.05;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.ck-screen__body {
  min-height: 0;
}

.ck-confirm {
  display: grid;
  gap: 10px;
  min-height: 0;
  align-content: start;
}

/* =========================
   TOTAL
========================= */
.ck-total-card {
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid rgba(var(--v-theme-primary), 0.22);
  background:
    linear-gradient(
      180deg,
      rgba(var(--v-theme-primary), 0.14) 0%,
      rgba(var(--v-theme-primary), 0.06) 100%
    ),
    rgb(var(--v-theme-surface));
  box-shadow:
    inset 0 1px 0 rgba(var(--v-theme-on-surface), 0.04),
    0 6px 16px rgba(0, 0, 0, 0.12);
}

.ck-total-card__label {
  font-size: 0.7rem;
  line-height: 1;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.62);
  margin-bottom: 8px;
}

.ck-total-card__value {
  font-size: clamp(1.55rem, 3vw, 2.1rem);
  line-height: 1;
  font-weight: 900;
  color: rgb(var(--v-theme-on-surface));
  word-break: break-word;
}

/* VUELTO en la pantalla de confirmación: grande y verde */
.ck-total-card__change {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-success), 0.14);
  border: 1px solid rgba(var(--v-theme-success), 0.32);
  color: rgb(var(--v-theme-success));
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 900;
}

.ck-total-card__change strong {
  margin-left: auto;
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: -0.01em;
}

.ck-total-card__change :deep(.v-icon) {
  color: rgb(var(--v-theme-success)) !important;
}

/* =========================
   SUMMARY
========================= */
.ck-summary-card {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.ck-summary-row {
  min-height: 42px;
  padding: 0 14px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-surface), 0.6);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  box-shadow: inset 0 1px 0 rgba(var(--v-theme-on-surface), 0.04);
}

.ck-summary-row span {
  min-width: 0;
  font-size: 0.72rem;
  font-weight: 800;
  color: rgba(var(--v-theme-on-surface), 0.65);
}

.ck-summary-row strong {
  min-width: 0;
  font-size: 0.74rem;
  font-weight: 900;
  color: rgb(var(--v-theme-on-surface));
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.ck-warn {
  color: rgb(var(--v-theme-error)) !important;
}

/* =========================
   CTA
========================= */
.ck-confirm-cta {
  min-height: 40px;
  border-radius: 14px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(var(--v-theme-success), 0.2);
  background: rgba(var(--v-theme-success), 0.1);
  font-size: 0.74rem;
  font-weight: 900;
  color: rgb(var(--v-theme-success));
}

/* =========================
   AJUSTES EN ANCHOS MÁS CHICOS
========================= */
@media (max-width: 1100px) {
  .ck-total-card__value {
    font-size: clamp(1.4rem, 2.7vw, 1.9rem);
  }

  .ck-summary-row {
    min-height: 40px;
    padding: 0 12px;
  }

  .ck-summary-row strong {
    font-size: 0.72rem;
  }
}

@media (max-width: 760px) {
  .ck-screen {
    padding: 8px;
    gap: 8px;
  }

  .ck-confirm {
    gap: 8px;
  }

  .ck-total-card {
    padding: 12px;
  }

  .ck-total-card__value {
    font-size: 1.45rem;
  }

  .ck-summary-row {
    min-height: 40px;
    padding: 0 10px;
  }

  .ck-summary-row span,
  .ck-summary-row strong {
    font-size: 0.7rem;
  }

  .ck-confirm-cta {
    min-height: 38px;
    font-size: 0.7rem;
  }
}
</style>