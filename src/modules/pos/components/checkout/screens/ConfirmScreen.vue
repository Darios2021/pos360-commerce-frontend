<template>
  <div class="ck-screen" ref="rootRef" tabindex="-1">
    <div class="ck-screen__head">
      <div class="ck-screen__title">Confirmar venta</div>
    </div>

    <div class="ck-screen__body">
      <div class="ck-confirm cf">

        <!-- El total, protagonista; el vuelto al lado si hay -->
        <section class="cf-total" :class="{ 'cf-total--vuelto': showChange }">
          <div class="cf-total__col">
            <span class="cf-lab">Total a cobrar</span>
            <span class="cf-total__val num">{{ money(totalSafe) }}</span>
          </div>
          <div v-if="showChange" class="cf-total__col cf-total__vuelto">
            <span class="cf-lab">Vuelto</span>
            <span class="cf-total__val num">{{ money(changeSafe) }}</span>
          </div>
        </section>

        <!-- Cómo se cobra, en tres tarjetas iguales -->
        <section class="cf-datos">
          <div class="cf-dato">
            <span class="cf-dato__ic"><v-icon size="22">mdi-wallet-outline</v-icon></span>
            <span class="cf-lab">Medio de pago</span>
            <strong class="cf-dato__val">{{ paymentSummaryLabel || "Sin medio" }}</strong>
          </div>
          <div class="cf-dato">
            <span class="cf-dato__ic"><v-icon size="22">mdi-receipt-text-outline</v-icon></span>
            <span class="cf-lab">Comprobante</span>
            <strong class="cf-dato__val">{{ invoiceModeText }}</strong>
          </div>
          <div class="cf-dato" :class="{ 'cf-dato--falta': isCustomerMissing }">
            <span class="cf-dato__ic"><v-icon size="22">mdi-account-outline</v-icon></span>
            <span class="cf-lab">Cliente</span>
            <strong class="cf-dato__val">{{ customerLabel }}</strong>
          </div>
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
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.ck-screen__subtitle {
  font-size: 0.74rem;
  line-height: 1.05;
  font-weight: 400;
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
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.62);
  margin-bottom: 8px;
}

.ck-total-card__value {
  font-size: clamp(1.55rem, 3vw, 2.1rem);
  line-height: 1;
  font-weight: 500;
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
  font-weight: 500;
}

.ck-total-card__change strong {
  margin-left: auto;
  font-size: 1.1rem;
  font-weight: 500;
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
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.65);
}

.ck-summary-row strong {
  min-width: 0;
  font-size: 0.74rem;
  font-weight: 500;
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
  font-weight: 500;
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

/* Confirmar con el diseño de las ventanas del POS (10/10) */
.cf { display: flex; flex-direction: column; gap: 14px; }
.cf-lab { font-size: 12px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #5a6678; }
.cf-total { display: flex; gap: 14px; padding: 20px 22px; border-radius: 14px; background: #eef7fd; border: 2px solid #0f6fae; }
.cf-total__col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.cf-total__col .cf-lab { color: #0a466e; }
.cf-total__val { font-size: 44px; font-weight: 900; line-height: 1.05; letter-spacing: -0.02em; color: #0f172a; }
.cf-total__vuelto { padding-left: 18px; border-left: 2px solid rgba(15, 111, 174, 0.25); }
.cf-total__vuelto .cf-lab, .cf-total__vuelto .cf-total__val { color: #1f7a5f; }
.cf-datos { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.cf-dato { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; border-radius: 12px; border: 1px solid #d3dde7; background: #ffffff; min-width: 0; }
.cf-dato__ic { width: 40px; height: 40px; border-radius: 10px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
.cf-dato__ic .v-icon { color: #0f6fae; }
.cf-dato__val { font-size: 18px; font-weight: 800; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cf-dato--falta { border-color: #c2413a; background: #fdeceb; }
.cf-dato--falta .cf-dato__val { color: #a3322c; }
</style>