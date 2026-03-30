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
  gap: 8px;
  padding: 8px 10px;
  border-radius: 20px;
  background: transparent;
  min-width: 0;
}

.ck-screen__head {
  display: grid;
  gap: 2px;
}

.ck-screen__title {
  font-size: 0.98rem;
  line-height: 1.05;
  font-weight: 950;
  color: #f4f7fb;
}

.ck-screen__subtitle {
  font-size: 0.74rem;
  line-height: 1.05;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.62);
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

  border: 1px solid rgba(44, 132, 255, 0.18);

  background:
    linear-gradient(
      180deg,
      rgba(44, 132, 255, 0.12) 0%,
      rgba(44, 132, 255, 0.06) 100%
    ),
    rgba(10, 20, 44, 0.82);

  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 6px 16px rgba(0, 0, 0, 0.16);
}

.ck-total-card__label {
  font-size: 0.7rem;
  line-height: 1;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.62);
  margin-bottom: 8px;
}

.ck-total-card__value {
  font-size: clamp(1.55rem, 3vw, 2.1rem);
  line-height: 1;
  font-weight: 950;
  color: #ffffff;
  word-break: break-word;
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

  border: 1px solid rgba(255, 255, 255, 0.06);

  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.02) 0%,
      rgba(255, 255, 255, 0.01) 100%
    ),
    rgba(10, 20, 44, 0.7);

  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;

  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.02),
    0 4px 12px rgba(0, 0, 0, 0.12);
}

.ck-summary-row span {
  min-width: 0;
  font-size: 0.72rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.68);
}

.ck-summary-row strong {
  min-width: 0;
  font-size: 0.74rem;
  font-weight: 950;
  color: #f4f7fb;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.ck-warn {
  color: #fb7185 !important;
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

  border: 1px solid rgba(34, 197, 94, 0.14);
  background: rgba(34, 197, 94, 0.1);

  font-size: 0.74rem;
  font-weight: 900;
  color: #dcfce7;
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