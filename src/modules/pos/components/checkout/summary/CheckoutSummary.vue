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
        <div class="ck-total-card__top">
          <div class="ck-total-card__label">TOTAL</div>
          <v-icon size="24" class="ck-total-card__icon">mdi-cash-multiple</v-icon>
        </div>

        <div class="ck-total-card__value">
          {{ money(totalSafe) }}
        </div>
      </div>

      <div class="ck-total-row ck-total-row--paid">
        <span>Pagado</span>
        <strong>{{ money(paidSafe) }}</strong>
      </div>

      <div class="ck-total-row ck-total-row--change">
        <span>Vuelto</span>
        <strong>{{ money(changeSafe) }}</strong>
      </div>

      <div class="ck-total-row ck-total-row--preview">
        <span class="ck-total-row__left">
          <span>Prev.</span>
          <v-icon size="18">mdi-history</v-icon>
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
  grid-template-rows: auto minmax(0, auto) 1fr;
  gap: 8px;
  padding: 10px;
  border-radius: 18px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background:
    linear-gradient(
      145deg,
      rgba(var(--v-theme-on-surface), 0.018) 0%,
      rgba(var(--v-theme-on-surface), 0.01) 100%
    );
  color: rgb(var(--v-theme-on-surface));
}

.ck-summary__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.ck-summary__title {
  font-size: 0.92rem;
  font-weight: 950;
  line-height: 1;
  letter-spacing: -0.03em;
}

.ck-summary__items {
  min-height: 0;
  overflow: auto;
  display: grid;
  align-content: start;
  gap: 5px;
  padding-right: 2px;
}

.ck-summary__items::-webkit-scrollbar {
  width: 6px;
}

.ck-summary__items::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.14);
  border-radius: 999px;
}

.ck-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px;
  align-items: center;
  min-height: 36px;
  padding: 5px 8px;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.ck-item__left {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.ck-item__icon {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.ck-item__icon :deep(.v-icon) {
  font-size: 13px !important;
}

.ck-item__text {
  min-width: 0;
}

.ck-item__name {
  font-size: 0.74rem;
  font-weight: 800;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ck-item__meta {
  font-size: 0.66rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.58);
  line-height: 1;
}

.ck-item__price {
  font-size: 0.78rem;
  font-weight: 900;
  white-space: nowrap;
  text-align: right;
}

.ck-summary__totals {
  display: grid;
  align-content: start;
  gap: 5px;
}

.ck-total-card {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.ck-total-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 8px;
}

.ck-total-card__label {
  font-size: 0.66rem;
  font-weight: 950;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.56);
}

.ck-total-card__icon {
  opacity: 0.5;
}

.ck-total-card__value {
  font-size: 1.02rem;
  line-height: 1;
  font-weight: 950;
  letter-spacing: -0.04em;
}

.ck-total-row {
  min-height: 32px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  background: rgba(var(--v-theme-on-surface), 0.018);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.74rem;
  font-weight: 800;
}

.ck-total-row strong {
  font-size: 0.8rem;
  font-weight: 950;
  white-space: nowrap;
}

.ck-total-row__left {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.ck-total-row--paid strong {
  color: rgb(var(--v-theme-success));
}

.ck-total-row--change strong {
  color: rgb(var(--v-theme-success));
}

.ck-total-row--preview strong {
  color: rgb(var(--v-theme-error));
}
</style>