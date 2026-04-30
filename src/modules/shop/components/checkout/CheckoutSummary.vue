<!-- Checkout Summary · estética Inter + jerarquía clara -->

<template>
  <v-card class="cs-summary" elevation="0">
    <v-card-text class="cs-summary-text">
      <div class="cs-summary-kicker">Resumen</div>
      <div class="cs-summary-title">Tu compra</div>

      <!-- Modo de entrega -->
      <div class="cs-summary-mode">
        <div class="cs-summary-mode-ico" :class="modeIconClass">
          <v-icon size="16">{{ modeIcon }}</v-icon>
        </div>
        <div class="cs-summary-mode-text">
          <div class="cs-summary-mode-label">{{ modeLabel }}</div>
          <div class="cs-summary-mode-sub">{{ modeSub }}</div>
        </div>
      </div>

      <v-divider class="cs-summary-divider" />

      <!-- Filas -->
      <div class="cs-summary-row">
        <span>Productos ({{ items.length }})</span>
        <span>$ {{ fmtMoney(subtotal) }}</span>
      </div>

      <div class="cs-summary-row">
        <span>Envío</span>
        <span class="cs-summary-row-free" v-if="deliveryMode === 'pickup' || shippingAmount === 0">Gratis</span>
        <span v-else>$ {{ fmtMoney(shippingAmount) }}</span>
      </div>

      <div v-if="taxesEstimated > 0" class="cs-summary-row cs-summary-row--muted">
        <span>Impuestos estimados</span>
        <span>$ {{ fmtMoney(taxesEstimated) }}</span>
      </div>

      <v-divider class="cs-summary-divider" />

      <!-- Total -->
      <div class="cs-summary-total">
        <span>Total</span>
        <span class="cs-summary-total-amount">$ {{ fmtMoney(total) }}</span>
      </div>

      <!-- Link secundario -->
      <RouterLink to="/shop/cart" class="cs-summary-back">
        <v-icon size="14">mdi-arrow-left</v-icon>
        Volver al carrito
      </RouterLink>
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
  return new Intl.NumberFormat("es-AR").format(Math.round(Number(v || 0)));
}

const taxesEstimated = computed(() => Math.round(props.subtotal * 0.035));

const modeIcon = computed(() =>
  props.deliveryMode === "delivery" ? "mdi-truck-fast-outline" : "mdi-storefront-outline"
);
const modeIconClass = computed(() =>
  props.deliveryMode === "delivery" ? "is-delivery" : "is-pickup"
);
const modeLabel = computed(() =>
  props.deliveryMode === "delivery" ? "Envío a domicilio" : "Retiro en sucursal"
);
const modeSub = computed(() =>
  props.deliveryMode === "delivery" ? "Llega a tu casa" : "Sin costo · te avisamos cuándo retirar"
);
</script>

<style scoped>
.cs-summary,
.cs-summary :deep(*) {
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

.cs-summary {
  border-radius: 14px;
  border: 1px solid rgba(17, 24, 39, 0.08);
  background: #fff;
  position: sticky;
  top: 16px;
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  letter-spacing: 0.005em;
}

.cs-summary-text {
  padding: 18px !important;
}

.cs-summary-kicker {
  font-size: 11px;
  font-weight: 460;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(17, 24, 39, 0.5);
  margin-bottom: 4px;
}

.cs-summary-title {
  font-size: 18px;
  font-weight: 540;
  letter-spacing: -0.01em;
  color: rgba(17, 24, 39, 0.92);
}

/* Mode card */
.cs-summary-mode {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-top: 12px;
  background: rgba(17, 24, 39, 0.03);
  border-radius: 10px;
}
.cs-summary-mode-ico {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}
.cs-summary-mode-ico.is-pickup {
  background: rgba(0, 153, 102, 0.12);
  color: #009966;
}
.cs-summary-mode-ico.is-delivery {
  background: rgba(21, 101, 192, 0.10);
  color: rgb(var(--v-theme-primary));
}
.cs-summary-mode-text {
  min-width: 0;
}
.cs-summary-mode-label {
  font-weight: 500;
  font-size: 13px;
  color: rgba(17, 24, 39, 0.92);
  letter-spacing: -0.005em;
  line-height: 1.2;
}
.cs-summary-mode-sub {
  font-size: 11.5px;
  color: rgba(17, 24, 39, 0.55);
  font-weight: 400;
  margin-top: 1px;
}

/* Filas */
.cs-summary-divider {
  margin: 14px 0 !important;
  opacity: 0.6;
}

.cs-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 13.5px;
  font-weight: 400;
  color: rgba(17, 24, 39, 0.86);
  margin-bottom: 8px;
}
.cs-summary-row:last-of-type {
  margin-bottom: 0;
}
.cs-summary-row--muted {
  color: rgba(17, 24, 39, 0.6);
  font-size: 12.5px;
}
.cs-summary-row-free {
  color: #009966;
  font-weight: 460;
}

/* Total */
.cs-summary-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-weight: 540;
  font-size: 18px;
  letter-spacing: -0.01em;
  color: rgba(17, 24, 39, 0.94);
  margin-bottom: 14px;
}
.cs-summary-total-amount {
  font-size: 22px;
  font-weight: 540;
}

.cs-summary-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 460;
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  transition: gap 0.16s ease;
}
.cs-summary-back:hover {
  gap: 7px;
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
