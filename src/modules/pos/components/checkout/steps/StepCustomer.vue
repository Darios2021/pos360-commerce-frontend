<template>
  <div class="ck-panel">
    <div class="ck-panel-head">
      <div>
        <div class="ck-panel-title">Datos del cliente</div>
        <div class="ck-panel-subtitle">
          {{ subtitleText }}
        </div>
      </div>

      <div
        v-if="isFacturaMode"
        class="ck-mode-chip"
      >
        Requerido para factura
      </div>
    </div>

    <div class="ck-fields-grid">
      <v-text-field
        :ref="customerNameRef"
        :model-value="customerName"
        label="Nombre / Razón social"
        variant="outlined"
        density="comfortable"
        hide-details="auto"
        :error="nameError"
        :error-messages="nameError ? nameErrorMsg : ''"
        @update:model-value="$emit('update:customer-name', $event)"
      />

      <div class="ck-fields-2">
        <v-text-field
          :model-value="customerDoc"
          label="DNI / CUIT / CUIL"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
          :error="docError"
          :error-messages="docError ? docErrorMsg : ''"
          @update:model-value="$emit('update:customer-doc', $event)"
        />

        <v-text-field
          :model-value="customerPhone"
          label="Teléfono"
          variant="outlined"
          density="comfortable"
          hide-details
          @update:model-value="$emit('update:customer-phone', $event)"
        />
      </div>
    </div>

    <div class="ck-hint-box">
      <v-icon size="16">mdi-account-outline</v-icon>

      <span v-if="isFacturaMode">
        Esta venta va con factura. Completá los datos del cliente antes de confirmar.
      </span>

      <span v-else>
        Cliente opcional. Podés dejarlo vacío si la venta sale por ticket.
      </span>
    </div>

    <div class="ck-review">
      <div class="ck-review-title">Resumen final</div>

      <div class="ck-review-grid">
        <div class="ck-review-row">
          <span>Pago</span>
          <strong>{{ paymentSummaryLabel }}</strong>
        </div>

        <div class="ck-review-row">
          <span>Comprobante</span>
          <strong>{{ comprobanteLabel }}</strong>
        </div>

        <div class="ck-review-row" v-if="isFacturaMode">
          <span>Tipo de factura</span>
          <strong>{{ facturaTypeLabel }}</strong>
        </div>

        <div class="ck-review-row">
          <span>Cliente</span>
          <strong>{{ customerSummary }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  state: { type: Object, required: true },
  customerNameRef: { type: Object, default: null },
  customerName: { type: String, default: "" },
  customerDoc: { type: String, default: "" },
  customerPhone: { type: String, default: "" },
  paymentSummaryLabel: { type: String, default: "" },
  invoiceModeLabel: { type: String, default: "" },
});

defineEmits([
  "update:customer-name",
  "update:customer-doc",
  "update:customer-phone",
]);

const isFacturaMode = computed(() => {
  return String(props.state?.invoiceMode || "").toUpperCase() === "FISCAL";
});

const subtitleText = computed(() => {
  return isFacturaMode.value
    ? "Completá los datos necesarios para emitir la factura."
    : "Podés asociar un cliente a la venta, pero no es obligatorio.";
});

const cleanName = computed(() => String(props.customerName || "").trim());
const cleanDoc = computed(() => String(props.customerDoc || "").trim());

const nameError = computed(() => {
  return isFacturaMode.value && !cleanName.value;
});

const docError = computed(() => {
  return isFacturaMode.value && !cleanDoc.value;
});

const nameErrorMsg = computed(() => {
  return "Ingresá el nombre o razón social.";
});

const docErrorMsg = computed(() => {
  return "Ingresá DNI, CUIT o CUIL.";
});

const comprobanteLabel = computed(() => {
  return isFacturaMode.value ? "Factura" : "Ticket";
});

const facturaTypeLabel = computed(() => {
  const t = String(props.state?.invoiceType || "").toUpperCase();
  if (["A", "B", "C"].includes(t)) return t;
  return "—";
});

const customerSummary = computed(() => {
  if (cleanName.value) return cleanName.value;
  if (isFacturaMode.value) return "Falta completar";
  return "Sin cliente";
});
</script>

<style scoped>
.ck-panel {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-surface), 1);
  border-radius: 16px;
  padding: 12px;
  display: grid;
  gap: 12px;
}

.ck-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.ck-panel-title {
  font-size: 1.05rem;
  font-weight: 900;
  line-height: 1.1;
}

.ck-panel-subtitle {
  font-size: 0.78rem;
  opacity: 0.68;
  margin-top: 4px;
  font-weight: 700;
}

.ck-mode-chip {
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  font-size: 0.76rem;
  font-weight: 900;
  white-space: nowrap;
}

.ck-fields-grid {
  display: grid;
  gap: 10px;
}

.ck-fields-2 {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr;
}

.ck-hint-box {
  min-height: 40px;
  padding: 0 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.82);
  font-size: 0.86rem;
  font-weight: 700;
}

.ck-review {
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-surface-variant), 0.14);
}

.ck-review-title {
  font-size: 0.95rem;
  font-weight: 900;
  margin-bottom: 10px;
}

.ck-review-grid {
  display: grid;
  gap: 8px;
}

.ck-review-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.92rem;
}

@media (max-width: 760px) {
  .ck-fields-2 {
    grid-template-columns: 1fr;
  }
}
</style>