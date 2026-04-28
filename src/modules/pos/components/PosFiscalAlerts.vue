<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosFiscalAlerts.vue -->
<template>
  <div v-if="visibleAlerts.length" class="fiscal-alerts">
    <v-alert
      v-for="(alert, idx) in visibleAlerts"
      :key="`${alert.code}-${idx}`"
      :type="alert.type"
      variant="tonal"
      density="comfortable"
      class="fiscal-alerts__item"
      border="start"
    >
      <div class="fiscal-alerts__row">
        <div class="fiscal-alerts__text">
          <div class="fiscal-alerts__title">{{ alert.title }}</div>
          <div v-if="alert.text" class="fiscal-alerts__body">{{ alert.text }}</div>
        </div>

        <div v-if="alert.tag" class="fiscal-alerts__tag">
          <v-chip size="x-small" variant="flat">{{ alert.tag }}</v-chip>
        </div>
      </div>
    </v-alert>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
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
  branchReady: {
    type: Boolean,
    default: true,
  },
  cashOpen: {
    type: Boolean,
    default: true,
  },
  maxItems: {
    type: Number,
    default: 3,
  },
});

const visibleAlerts = computed(() => {
  const out = [];
  const voucher = String(props.voucherType || "").trim().toUpperCase();
  const c = props.customer || {};

  const name = String(c.name || c.full_name || c.razon_social || "").trim();
  const doc = String(c.doc || c.dni || c.cuit || "").trim();

  if (!props.branchReady) {
    out.push({
      code: "branch-missing",
      type: "warning",
      title: "Falta definir la sucursal activa.",
      text: "Elegí la sucursal antes de seguir operando para evitar ventas fuera de contexto.",
      tag: "Sucursal",
    });
  }

  if (props.totalItems > 0 && !props.cashOpen) {
    out.push({
      code: "cash-closed",
      type: "warning",
      title: "No hay una caja abierta para cobrar.",
      text: "Podés preparar la venta, pero antes de cobrar vas a necesitar apertura de caja.",
      tag: "Caja",
    });
  }

  if ((voucher === "FACTURA_A" || voucher === "FACTURA_B") && !name) {
    out.push({
      code: "customer-name-missing",
      type: "info",
      title: "Comprobante fiscal con cliente incompleto.",
      text: "Conviene cargar nombre o razón social para dejar la operación lista para facturar.",
      tag: "Cliente",
    });
  }

  if (voucher === "FACTURA_A" && !doc) {
    out.push({
      code: "customer-doc-missing-a",
      type: "error",
      title: "Factura A sin CUIT / documento.",
      text: "Para una Factura A no deberías avanzar sin identificar correctamente al cliente.",
      tag: "Fiscal",
    });
  }

  if (voucher === "FACTURA_B" && !doc) {
    out.push({
      code: "customer-doc-missing-b",
      type: "info",
      title: "Factura B sin DNI / CUIT cargado.",
      text: "Podés dejarlo como consumidor final, pero es mejor identificar al cliente si va a pedir comprobante.",
      tag: "Fiscal",
    });
  }

  if (!props.totalItems) {
    out.push({
      code: "empty-cart",
      type: "info",
      title: "Todavía no hay productos en el carrito.",
      text: "Cuando agregues productos, acá vas a ver alertas operativas y fiscales de la venta.",
      tag: "POS",
    });
  }

  return out.slice(0, Math.max(1, Number(props.maxItems || 3)));
});
</script>

<style scoped>
.fiscal-alerts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fiscal-alerts__item {
  border-radius: 14px !important;
  margin: 0 !important;
}

.fiscal-alerts__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.fiscal-alerts__text {
  min-width: 0;
}

.fiscal-alerts__title {
  font-size: 13px;
  line-height: 1.2;
  font-weight: 500;
}

.fiscal-alerts__body {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.35;
  opacity: 0.9;
}

.fiscal-alerts__tag {
  flex: 0 0 auto;
}

@media (max-width: 960px) {
  .fiscal-alerts__row {
    flex-direction: column;
    align-items: stretch;
  }

  .fiscal-alerts__tag {
    align-self: flex-start;
  }
}
</style>