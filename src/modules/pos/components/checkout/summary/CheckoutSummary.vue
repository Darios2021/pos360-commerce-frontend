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

      <!-- FALTA: destaque en vivo cuando falta pagar -->
      <div
        v-if="missingSafe > 0"
        class="ck-total-row ck-total-row--missing ck-live"
      >
        <span class="ck-total-row__left">
          <v-icon size="14">mdi-alert-circle</v-icon>
          <span>Falta</span>
        </span>
        <strong>{{ money(missingSafe) }}</strong>
      </div>

      <!-- VUELTO: destaque en vivo, grande y verde -->
      <div
        v-else-if="changeSafe > 0"
        class="ck-total-row ck-total-row--change ck-live"
      >
        <span class="ck-total-row__left">
          <v-icon size="14">mdi-cash-refund</v-icon>
          <span>Vuelto</span>
        </span>
        <strong>{{ money(changeSafe) }}</strong>
      </div>

      <div
        v-else-if="paidSafe > 0 && totalSafe > 0"
        class="ck-total-row ck-total-row--exact"
      >
        <span class="ck-total-row__left">
          <v-icon size="13">mdi-check-all</v-icon>
          <span>Exacto</span>
        </span>
        <strong>&mdash;</strong>
      </div>

      <div
        v-if="showListPrice"
        class="ck-total-row ck-total-row--preview"
      >
        <span class="ck-total-row__left">
          <v-icon size="13">mdi-tag-outline</v-icon>
          <span>Lista</span>
        </span>
        <strong>{{ money(previewSafe) }}</strong>
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

.ck-total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.65);
  min-height: 32px;
  padding: 6px 10px;
  border-radius: 8px;
}

.ck-total-row strong {
  font-size: 0.92rem;
  font-weight: 900;
  white-space: nowrap;
  letter-spacing: -0.005em;
  color: rgba(var(--v-theme-on-surface), 0.9);
  font-feature-settings: "tnum";
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

/* FALTA: destacado en rojo, pulso suave */
.ck-total-row--missing {
  background: rgba(var(--v-theme-error), 0.12);
  border: 1px solid rgba(var(--v-theme-error), 0.3);
  min-height: 34px;
  color: rgb(var(--v-theme-error));
}

.ck-total-row--missing strong {
  color: rgb(var(--v-theme-error));
  font-size: 0.95rem;
  letter-spacing: -0.01em;
}

.ck-total-row--missing :deep(.v-icon) {
  color: rgb(var(--v-theme-error)) !important;
}

/* VUELTO: destacado en verde, más grande */
.ck-total-row--change {
  background: rgba(var(--v-theme-success), 0.14);
  border: 1px solid rgba(var(--v-theme-success), 0.32);
  min-height: 38px;
  color: rgb(var(--v-theme-success));
}

.ck-total-row--change strong {
  color: rgb(var(--v-theme-success));
  font-size: 1rem;
  letter-spacing: -0.01em;
}

.ck-total-row--change :deep(.v-icon) {
  color: rgb(var(--v-theme-success)) !important;
}

.ck-total-row--exact {
  background: rgba(var(--v-theme-on-surface), 0.04);
  color: rgba(var(--v-theme-on-surface), 0.75);
}

.ck-total-row--exact strong {
  color: rgba(var(--v-theme-on-surface), 0.75);
}

/* Pulso sutil para cambios en vivo */
@keyframes ck-live-pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.18);
  }
  50% {
    transform: scale(1.01);
    box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.08);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0);
  }
}

.ck-live {
  animation: ck-live-pulse 0.32s ease;
}

.ck-total-row--preview {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.ck-total-row--preview strong {
  color: rgba(var(--v-theme-on-surface), 0.7);
  text-decoration: line-through;
  text-decoration-color: rgba(var(--v-theme-on-surface), 0.35);
}
</style>