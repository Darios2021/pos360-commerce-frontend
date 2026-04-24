<template>
  <div class="ck-summary">
    <div class="ck-summary__head">
      <div class="ck-summary__title">Resumen</div>
    </div>

    <div v-if="showItems" class="ck-summary__items">
      <div
        v-for="it in cartUi"
        :key="it._key"
        class="ck-item"
      >
        <div class="ck-item__left">
          <div class="ck-item__icon">
            <v-img
              v-if="itemImage(it)"
              :src="itemImage(it)"
              :aspect-ratio="1"
              cover
              class="ck-item__img"
            />
            <v-icon v-else size="16">mdi-package-variant-closed</v-icon>
          </div>

          <div class="ck-item__text">
            <div class="ck-item__name">
              {{ it.name || it.product_name || "Producto" }}
            </div>

            <div class="ck-item__meta">
              <template v-if="showPrices">
                {{ toNum(it.qty) }} × {{ money(it._unit) }}
              </template>
              <template v-else>
                {{ toNum(it.qty) }}
              </template>
            </div>
          </div>
        </div>

        <div v-if="showPrices" class="ck-item__price">
          {{ money(it._subtotal) }}
        </div>
      </div>
    </div>

    <div class="ck-summary__totals">
      <!-- Total hero -->
      <div class="ck-total-card">
        <div class="ck-total-card__label">
          <v-icon size="13" class="ck-total-card__label-icon">mdi-cart-check</v-icon>
          TOTAL
        </div>
        <div class="ck-total-card__value">{{ money(totalSafe) }}</div>
      </div>

      <!-- Ahorro por descuento (solo si es relevante) -->
      <div v-if="showListPrice" class="ck-savings">
        <span>Precio de lista</span>
        <strong>{{ money(previewSafe) }}</strong>
      </div>

      <!-- Banner de estado único -->
      <div
        v-if="missingSafe > 0"
        class="ck-status-banner ck-status-banner--missing ck-live"
      >
        <div class="ck-status-banner__head">
          <v-icon size="16">mdi-alert-circle</v-icon>
          <span>Falta pagar</span>
        </div>
        <strong class="ck-status-banner__amount">{{ money(missingSafe) }}</strong>
        <div class="ck-status-banner__sub" v-if="paidSafe > 0">
          Pagado {{ money(paidSafe) }} de {{ money(totalSafe) }}
        </div>
      </div>

      <div
        v-else-if="changeSafe > 0"
        class="ck-status-banner ck-status-banner--change ck-live"
      >
        <div class="ck-status-banner__head">
          <v-icon size="16">mdi-cash-refund</v-icon>
          <span>Vuelto a entregar</span>
        </div>
        <strong class="ck-status-banner__amount">{{ money(changeSafe) }}</strong>
        <div class="ck-status-banner__sub">
          Recibido {{ money(paidSafe) }}
        </div>
      </div>

      <div
        v-else-if="paidSafe > 0 && totalSafe > 0"
        class="ck-status-banner ck-status-banner--exact"
      >
        <div class="ck-status-banner__head">
          <v-icon size="16">mdi-check-circle</v-icon>
          <span>Pago exacto</span>
        </div>
        <div class="ck-status-banner__sub">
          {{ money(paidSafe) }} cubre el total
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { usePosImages } from "../../../composables/usePosImages";

const { productImage } = usePosImages();

function itemImage(it) {
  const direct =
    it?.image ||
    it?.image_url ||
    it?.imageUrl ||
    it?.imagen ||
    it?.thumbnail ||
    "";
  if (direct) return direct;
  const id = Number(it?.id || it?.product_id || 0);
  if (!id) return "";
  return productImage({ id });
}

const props = defineProps({
  cartUi: { type: Array, default: () => [] },
  totalSafe: { type: Number, default: 0 },
  previewSafe: { type: Number, default: 0 },
  paidSafe: { type: Number, default: 0 },
  changeSafe: { type: Number, default: 0 },
  money: { type: Function, required: true },
  toNum: { type: Function, required: true },
  showItems: { type: Boolean, default: true },
  showPrices: { type: Boolean, default: true },
});

const showListPrice = computed(() => {
  const total = Number(props.totalSafe || 0);
  const preview = Number(props.previewSafe || 0);
  return preview > 0 && Math.abs(preview - total) > 0.5;
});

// "Falta pagar" en vivo
const missingSafe = computed(() => {
  const diff = Number(props.totalSafe || 0) - Number(props.paidSafe || 0);
  return diff > 0 ? diff : 0;
});
</script>

<style scoped>
.ck-summary {
  height: 100%;
  min-height: 100%;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 0;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  background: rgba(var(--v-theme-surface), 1);
  color: rgb(var(--v-theme-on-surface));
  overflow: hidden;
}

.ck-summary__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}

.ck-summary__title {
  font-size: 0.8rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.52);
}

.ck-summary__items {
  min-height: 0;
  overflow: auto;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ck-summary__items::-webkit-scrollbar {
  width: 4px;
}

.ck-summary__items::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 999px;
}

/* Items como cards con aire entre ellos */
.ck-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.035);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  transition: background 0.14s ease;
}

.ck-item:hover {
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.ck-item__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.ck-item__icon {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  opacity: 1;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.ck-item__icon :deep(.v-icon) {
  font-size: 16px !important;
  opacity: 0.55;
}

.ck-item__img {
  width: 100%;
  height: 100%;
}

.ck-item__img :deep(.v-img__img),
.ck-item__img :deep(img) {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.ck-item__text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ck-item__name {
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.005em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgb(var(--v-theme-on-surface));
}

.ck-item__meta {
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.55);
  line-height: 1.2;
  font-feature-settings: "tnum";
}

.ck-item__price {
  font-size: 0.88rem;
  font-weight: 900;
  letter-spacing: -0.01em;
  white-space: nowrap;
  text-align: right;
  font-feature-settings: "tnum";
  color: rgb(var(--v-theme-on-surface));
}

.ck-summary__totals {
  border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.12);
  padding: 14px 14px 16px;
  display: grid;
  gap: 6px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.ck-total-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 2px 12px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  margin-bottom: 6px;
}

.ck-total-card__top {
  display: none;
}

.ck-total-card__label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.4);
}

.ck-total-card__label-icon {
  opacity: 0.6;
}

.ck-total-card__icon {
  display: none;
}

.ck-total-card__value {
  font-size: 1.5rem;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: rgb(var(--v-theme-primary));
}

/* ── Ahorro / precio de lista (sutil, solo si hay descuento real) ── */
.ck-savings {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 2px 10px;
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.45);
}

.ck-savings strong {
  font-weight: 700;
  text-decoration: line-through;
  text-decoration-color: rgba(var(--v-theme-on-surface), 0.3);
  color: rgba(var(--v-theme-on-surface), 0.5);
  font-feature-settings: "tnum";
}

/* ── Banner único de estado (exacto / falta / vuelto) ──────── */
.ck-status-banner {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid transparent;
  margin-top: 4px;
}

.ck-status-banner__head {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1;
}

.ck-status-banner__amount {
  font-size: 1.25rem;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-feature-settings: "tnum";
}

.ck-status-banner__sub {
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.55);
  line-height: 1.2;
  margin-top: 2px;
  font-feature-settings: "tnum";
}

/* Estados */
.ck-status-banner--missing {
  background: rgba(var(--v-theme-error), 0.1);
  border-color: rgba(var(--v-theme-error), 0.32);
  color: rgb(var(--v-theme-error));
}

.ck-status-banner--missing :deep(.v-icon),
.ck-status-banner--missing .ck-status-banner__amount {
  color: rgb(var(--v-theme-error)) !important;
}

.ck-status-banner--change {
  background: rgba(var(--v-theme-success), 0.12);
  border-color: rgba(var(--v-theme-success), 0.36);
  color: rgb(var(--v-theme-success));
}

.ck-status-banner--change :deep(.v-icon),
.ck-status-banner--change .ck-status-banner__amount {
  color: rgb(var(--v-theme-success)) !important;
}

.ck-status-banner--exact {
  background: rgba(var(--v-theme-success), 0.08);
  border-color: rgba(var(--v-theme-success), 0.28);
  color: rgb(var(--v-theme-success));
}

.ck-status-banner--exact :deep(.v-icon) {
  color: rgb(var(--v-theme-success)) !important;
}

.ck-status-banner--exact .ck-status-banner__sub {
  color: rgba(var(--v-theme-success), 0.82);
}

/* Pulso sutil para cambios en vivo */
@keyframes ck-live-pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.012);
  }
  100% {
    transform: scale(1);
  }
}

.ck-live {
  animation: ck-live-pulse 0.36s ease;
}
</style>