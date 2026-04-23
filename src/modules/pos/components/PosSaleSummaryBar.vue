<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosSaleSummaryBar.vue -->
<template>
  <v-card class="sale-summary" elevation="0" rounded="xl">
    <div class="sale-summary__head">
      <div class="sale-summary__title-wrap">
        <div class="sale-summary__title">
          <v-icon size="16">mdi-file-document-outline</v-icon>
          <span>Resumen de venta</span>
        </div>

        <div class="sale-summary__meta">
          <v-chip
            size="small"
            variant="flat"
            class="sale-summary__chip sale-summary__chip--soft"
          >
            {{ totalItems }} ítems
          </v-chip>

          <v-chip
            size="small"
            variant="flat"
            class="sale-summary__chip sale-summary__chip--amount"
          >
            {{ money(total) }}
          </v-chip>
        </div>
      </div>
    </div>

    <div class="sale-summary__grid">
      <div class="sale-summary__item">
        <div class="sale-summary__label">Comprobante</div>
        <div class="sale-summary__value">
          <v-icon size="14">mdi-receipt-text-outline</v-icon>
          <span>{{ voucherTypeLabel }}</span>
        </div>
      </div>

      <div class="sale-summary__item">
        <div class="sale-summary__label">Cliente</div>
        <div class="sale-summary__value">
          <v-icon size="14">mdi-account-outline</v-icon>
          <span>{{ customerLabel }}</span>
        </div>
      </div>

      <div class="sale-summary__item">
        <div class="sale-summary__label">Condición</div>
        <div class="sale-summary__value">
          <v-icon size="14">mdi-cash-multiple</v-icon>
          <span>{{ saleConditionLabel }}</span>
        </div>
      </div>

      <div class="sale-summary__item">
        <div class="sale-summary__label">Sucursal / Caja</div>
        <div class="sale-summary__value">
          <v-icon size="14">mdi-store-outline</v-icon>
          <span>{{ branchAndCashLabel }}</span>
        </div>
      </div>
    </div>

    <div
      v-if="showFooter"
      class="sale-summary__footer"
    >
      <div class="sale-summary__footer-left">
        <div class="sale-summary__footer-total-label">Total estimado</div>
        <div class="sale-summary__footer-total-value">{{ money(total) }}</div>
      </div>

      <div class="sale-summary__footer-right">
        <v-chip
          size="small"
          variant="tonal"
          class="sale-summary__status"
          :class="statusClass"
        >
          {{ statusText }}
        </v-chip>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  total: {
    type: Number,
    default: 0,
  },
  totalItems: {
    type: Number,
    default: 0,
  },
  voucherType: {
    type: String,
    default: "PRESUPUESTO",
  },
  customer: {
    type: Object,
    default: () => ({}),
  },
  saleCondition: {
    type: String,
    default: "CONTADO",
  },
  branchLabel: {
    type: String,
    default: "",
  },
  cashLabel: {
    type: String,
    default: "",
  },
  cashOpen: {
    type: Boolean,
    default: false,
  },
  currency: {
    type: String,
    default: "ARS",
  },
  showFooter: {
    type: Boolean,
    default: true,
  },
});

const voucherTypeLabel = computed(() => {
  const raw = String(props.voucherType || "").trim().toUpperCase();

  const map = {
    PRESUPUESTO: "Presupuesto",
    TICKET: "Ticket",
    FACTURA_X: "Factura X",
    FACTURA_B: "Factura B",
    FACTURA_A: "Factura A",
    NOTA_CREDITO: "Nota de crédito",
  };

  return map[raw] || raw || "Presupuesto";
});

const customerLabel = computed(() => {
  const c = props.customer || {};
  const name =
    String(c.name || c.full_name || c.razon_social || "").trim();
  const doc =
    String(c.doc || c.dni || c.cuit || "").trim();

  if (name && doc) return `${name} · ${doc}`;
  if (name) return name;
  if (doc) return doc;
  return "Consumidor final";
});

const saleConditionLabel = computed(() => {
  const raw = String(props.saleCondition || "").trim().toUpperCase();

  const map = {
    CONTADO: "Contado",
    CUENTA_CORRIENTE: "Cuenta corriente",
    CREDITO: "Crédito",
    MIXTO: "Pago mixto",
  };

  return map[raw] || raw || "Contado";
});

const branchAndCashLabel = computed(() => {
  const branch = String(props.branchLabel || "").trim();
  const cash = String(props.cashLabel || "").trim();

  if (branch && cash) return `${branch} · ${cash}`;
  if (branch) return branch;
  if (cash) return cash;
  return "Sin definir";
});

const statusText = computed(() => {
  if (!props.totalItems) return "Sin productos";
  if (!props.cashOpen) return "Caja pendiente";
  return "Listo para cobrar";
});

const statusClass = computed(() => {
  if (!props.totalItems) return "sale-summary__status--muted";
  if (!props.cashOpen) return "sale-summary__status--warn";
  return "sale-summary__status--ok";
});

function money(value) {
  const n = Number(value || 0) || 0;

  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: props.currency || "ARS",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$ ${n.toFixed(0)}`;
  }
}
</script>

<style scoped>
.sale-summary {
  border: 1px solid rgba(15, 23, 42, 0.10);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.94));
  box-shadow:
    0 8px 18px rgba(15, 23, 42, 0.05),
    0 2px 8px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.sale-summary__head {
  padding: 10px 12px 8px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.07);
}

.sale-summary__title-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.sale-summary__title {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.01em;
  color: rgb(var(--v-theme-on-surface));
}

.sale-summary__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.sale-summary__chip {
  font-weight: 800;
  letter-spacing: 0.01em;
}

.sale-summary__chip--soft {
  background: rgba(var(--v-theme-on-surface), 0.06) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}

.sale-summary__chip--amount {
  background: rgba(var(--v-theme-success), 0.10) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}

.sale-summary__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 10px 12px 12px;
}

.sale-summary__item {
  min-width: 0;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.86);
  border-radius: 12px;
  padding: 9px 10px;
}

.sale-summary__label {
  font-size: 11px;
  line-height: 1.1;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(var(--v-theme-on-surface), 0.58);
  margin-bottom: 5px;
}

.sale-summary__value {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
}

.sale-summary__value span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sale-summary__footer {
  padding: 10px 12px;
  border-top: 1px solid rgba(15, 23, 42, 0.07);
  background: rgba(15, 23, 42, 0.03);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.sale-summary__footer-left {
  min-width: 0;
}

.sale-summary__footer-total-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.56);
}

.sale-summary__footer-total-value {
  font-size: 18px;
  line-height: 1;
  font-weight: 900;
  color: rgb(var(--v-theme-on-surface));
  margin-top: 4px;
}

.sale-summary__footer-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.sale-summary__status {
  font-weight: 800;
}

.sale-summary__status--ok {
  color: rgb(var(--v-theme-success));
}

.sale-summary__status--warn {
  color: rgb(var(--v-theme-warning));
}

.sale-summary__status--muted {
  color: rgba(var(--v-theme-on-surface), 0.62);
}

:global(.v-theme--dark) .sale-summary {
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(17, 24, 39, 0.94));
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.26),
    0 2px 8px rgba(0, 0, 0, 0.18);
}

:global(.v-theme--dark) .sale-summary__head,
:global(.v-theme--dark) .sale-summary__footer {
  border-color: rgba(255, 255, 255, 0.08);
}

:global(.v-theme--dark) .sale-summary__title,
:global(.v-theme--dark) .sale-summary__value,
:global(.v-theme--dark) .sale-summary__footer-total-value {
  color: rgba(255, 255, 255, 0.95);
}

:global(.v-theme--dark) .sale-summary__label,
:global(.v-theme--dark) .sale-summary__footer-total-label {
  color: rgba(255, 255, 255, 0.56);
}

:global(.v-theme--dark) .sale-summary__item {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.08);
}

:global(.v-theme--dark) .sale-summary__chip--soft {
  background: rgba(255, 255, 255, 0.08) !important;
  color: rgba(255, 255, 255, 0.94) !important;
}

:global(.v-theme--dark) .sale-summary__chip--amount {
  background: rgba(34, 197, 94, 0.14) !important;
  color: rgba(255, 255, 255, 0.95) !important;
}

:global(.v-theme--dark) .sale-summary__footer {
  background: rgba(255, 255, 255, 0.03);
}

@media (max-width: 1180px) {
  .sale-summary__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .sale-summary__title-wrap,
  .sale-summary__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .sale-summary__meta,
  .sale-summary__footer-right {
    justify-content: flex-start;
  }

  .sale-summary__value span {
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
  }
}
</style>