<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- Checkout Summary · Estilo Mercado Libre (SIN CTA) -->

<template>
  <v-card class="ml-summary" elevation="0">
    <v-card-text>
      <!-- Header -->
      <div class="ml-title">Resumen de compra</div>

      <!-- Rows -->
      <div class="ml-row">
        <span>Productos ({{ items.length }})</span>
        <span>$ {{ fmtMoney(subtotal) }}</span>
      </div>

      <div class="ml-row">
        <span>Envío</span>
        <span class="ml-free">
          <template v-if="deliveryMode === 'pickup' || shippingAmount === 0">
            Gratis
          </template>
          <template v-else>
            $ {{ fmtMoney(shippingAmount) }}
          </template>
        </span>
      </div>

      <div class="ml-row ml-muted">
        <span>Impuestos estimados</span>
        <span>$ {{ fmtMoney(taxesEstimated) }}</span>
      </div>

      <v-divider class="my-3" />

      <!-- Total -->
      <div class="ml-total">
        <span>Total</span>
        <span>$ {{ fmtMoney(total) }}</span>
      </div>

      <!-- Secondary action -->
      <div class="ml-link">
        <RouterLink to="/shop/cart">
          Volver al carrito
        </RouterLink>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  items: { type: Array, required: true },
  subtotal: { type: Number, required: true },
  shippingAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  deliveryMode: { type: String, default: "pickup" },
});

function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(
    Math.round(Number(v || 0))
  );
}

/**
 * Impuestos estimados (estilo ML)
 * Ajustá o poné 0 si no los querés mostrar
 */
const taxesEstimated = computed(() => {
  return Math.round(props.subtotal * 0.035);
});
</script>

<style scoped>
/* Card base */
.ml-summary {
  border-radius: 10px;
  border: 1px solid #e6e6e6;
  background: #fff;
  position: sticky;
  top: 96px;
}

/* Header */
.ml-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 14px;
}

/* Rows */
.ml-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 6px;
}

.ml-muted {
  color: #737373;
}

/* Gratis */
.ml-free {
  color: #00a650;
  font-weight: 600;
}

/* Total */
.ml-total {
  display: flex;
  justify-content: space-between;
  font-size: 20px;
  font-weight: 700;
  margin: 10px 0 14px;
}

/* Secondary link */
.ml-link {
  text-align: center;
  margin-top: 10px;
  font-size: 13px;
}

.ml-link a {
  color: #3483fa;
  text-decoration: none;
}

.ml-link a:hover {
  text-decoration: underline;
}
</style>
