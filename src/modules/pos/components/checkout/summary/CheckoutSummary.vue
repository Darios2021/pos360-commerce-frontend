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
            <v-icon size="18">mdi-package-variant-closed</v-icon>
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
      <div class="ck-total-card">
        <div class="ck-total-card__label">
          <v-icon size="13" class="ck-total-card__label-icon">mdi-cart-check</v-icon>
          TOTAL
        </div>
        <div class="ck-total-card__value">{{ money(totalSafe) }}</div>
      </div>

      <div class="ck-total-row ck-total-row--paid">
        <span class="ck-total-row__left">
          <v-icon size="13">mdi-check-circle-outline</v-icon>
          <span>Pagado</span>
        </span>
        <strong>{{ money(paidSafe) }}</strong>
      </div>

      <div class="ck-total-row ck-total-row--change">
        <span class="ck-total-row__left">
          <v-icon size="13">mdi-cash-refund</v-icon>
          <span>Vuelto</span>
        </span>
        <strong>{{ money(changeSafe) }}</strong>
      </div>

      <div class="ck-total-row ck-total-row--preview">
        <span class="ck-total-row__left">
          <v-icon size="13">mdi-timer-sand</v-icon>
          <span>Pendiente</span>
        </span>
        <strong>{{ money(previewSafe) }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
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
  padding: 10px 12px 8px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}

.ck-summary__title {
  font-size: 0.75rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.ck-summary__items {
  min-height: 0;
  overflow: auto;
  padding: 4px 0;
}

.ck-summary__items::-webkit-scrollbar {
  width: 4px;
}

.ck-summary__items::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 999px;
}

/* Recibo-style: no borders, just rows with dividers */
.ck-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px;
  align-items: center;
  padding: 6px 12px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}

.ck-item:last-child {
  border-bottom: none;
}

.ck-item__left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.ck-item__icon {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  opacity: 0.35;
}

.ck-item__icon :deep(.v-icon) {
  font-size: 14px !important;
}

.ck-item__text {
  min-width: 0;
}

.ck-item__name {
  font-size: 0.73rem;
  font-weight: 700;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ck-item__meta {
  font-size: 0.64rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.5);
  line-height: 1;
}

.ck-item__price {
  font-size: 0.76rem;
  font-weight: 800;
  white-space: nowrap;
  text-align: right;
}

.ck-summary__totals {
  border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.1);
  padding: 10px 12px;
  display: grid;
  gap: 3px;
}

.ck-total-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 2px 0 8px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  margin-bottom: 4px;
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
  font-weight: 950;
  letter-spacing: -0.04em;
  color: rgb(var(--v-theme-primary));
}

.ck-total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.68rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.55);
  min-height: 24px;
  padding: 2px 6px;
  border-radius: 6px;
}

.ck-total-row strong {
  font-size: 0.76rem;
  font-weight: 900;
  white-space: nowrap;
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.ck-total-row__left {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.ck-total-row--paid {
  background: rgba(var(--v-theme-success), 0.06);
}

.ck-total-row--paid strong {
  color: rgb(var(--v-theme-success));
}

.ck-total-row--change strong {
  color: rgb(var(--v-theme-success));
}

.ck-total-row--preview {
  background: rgba(var(--v-theme-error), 0.06);
}

.ck-total-row--preview strong {
  color: rgb(var(--v-theme-error));
}
</style>