<template>
  <div class="ptile" :class="{ 'is-disabled': disabled }">
    <div class="ptile-top">
      <div class="ptile-thumb">
        <v-img v-if="image" :src="image" class="ptile-img" contain />
        <div v-else class="ptile-noimg">
          <v-icon size="28">mdi-image-off-outline</v-icon>
        </div>

        <div class="ptile-badges">
          <div v-if="sku" class="ptile-badge ptile-badge-dark">SKU {{ sku }}</div>
          <div v-if="stkLabel" class="ptile-badge ptile-badge-light">{{ stkLabel }}</div>
          <div v-if="offLabel" class="ptile-badge ptile-badge-green">{{ offLabel }}</div>
        </div>
      </div>
    </div>

    <div class="ptile-mid">
      <div class="ptile-name" :title="name">{{ name }}</div>

      <div class="ptile-meta">
        <span v-if="rubroLabel" class="ptile-cat" :title="rubroLabel">{{ rubroLabel }}</span>
        <span v-if="subrubroLabel" class="ptile-sub" :title="subrubroLabel">{{ subrubroLabel }}</span>
      </div>
    </div>

    <div class="ptile-bot">
      <div class="ptile-price">
        <div class="ptile-price-main">{{ money(priceDiscount) }}</div>
        <div v-if="priceList && priceList > priceDiscount" class="ptile-price-list">
          {{ money(priceList) }}
        </div>
      </div>

      <div class="ptile-actions">
        <v-btn
          size="small"
          class="ptile-btn"
          color="primary"
          :disabled="disabled"
          @click.stop="$emit('add', item)"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>

        <v-btn
          size="small"
          class="ptile-btn"
          variant="tonal"
          :disabled="disabled"
          @click.stop="$emit('details', item)"
        >
          <v-icon>mdi-eye</v-icon>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  item: { type: Object, required: true },
  image: { type: String, default: "" },
  name: { type: String, default: "" },
  sku: { type: String, default: "" },
  stkLabel: { type: String, default: "" },
  offLabel: { type: String, default: "" },
  rubroLabel: { type: String, default: "" },
  subrubroLabel: { type: String, default: "" },
  priceDiscount: { type: Number, default: 0 },
  priceList: { type: Number, default: 0 },
  disabled: { type: Boolean, default: false },
});

defineEmits(["add", "details"]);

function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}
</script>

<style scoped>
/* ✅ Tile compacto (no se estira) */
.ptile {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 176px; /* ✅ altura fija */
  min-height: 176px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
}

.ptile.is-disabled {
  opacity: 0.65;
}

.ptile-top {
  padding: 8px 8px 0 8px;
}

.ptile-thumb {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  height: 72px; /* ✅ thumbnail fijo */
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
}

.ptile-img {
  height: 72px !important;
  width: 100%;
}

.ptile-noimg {
  height: 72px;
  display: grid;
  place-items: center;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.ptile-badges {
  position: absolute;
  left: 6px;
  top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  pointer-events: none;
}

.ptile-badge {
  font-size: 10px;
  line-height: 1;
  padding: 4px 6px;
  border-radius: 999px;
  width: fit-content;
  white-space: nowrap;
}

.ptile-badge-dark {
  background: rgba(0, 0, 0, 0.78);
  color: #fff;
}

.ptile-badge-light {
  background: rgba(255, 255, 255, 0.92);
  color: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.10);
}

.ptile-badge-green {
  background: rgba(16, 185, 129, 0.92);
  color: #fff;
}

.ptile-mid {
  padding: 8px 10px 0 10px;
  flex: 1 1 auto;
  min-height: 0;
}

.ptile-name {
  font-weight: 500;
  font-size: 12px;
  line-height: 1.15;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* ✅ max 2 líneas */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ptile-meta {
  margin-top: 4px;
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  min-height: 16px;
}

.ptile-cat,
.ptile-sub {
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), 0.65);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 48%;
}

.ptile-bot {
  padding: 8px 10px 10px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex: 0 0 auto;
}

.ptile-price {
  min-width: 0;
}
.ptile-price-main {
  font-weight: 500;
  font-size: 14px;
  line-height: 1.1;
  white-space: nowrap; /* ✅ NO wrap */
}
.ptile-price-list {
  margin-top: 2px;
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  text-decoration: line-through;
  white-space: nowrap; /* ✅ NO wrap */
}

.ptile-actions {
  display: flex;
  gap: 6px;
}
.ptile-btn {
  min-width: 34px !important;
  width: 34px !important;
  height: 34px !important;
  padding: 0 !important;
}
</style>