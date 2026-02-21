<template>
  <div class="prow" :class="{ disabled }" @dblclick="$emit('add', item)">
    <div class="prow-img">
      <v-img v-if="image" :src="image" class="img" cover />
      <div v-else class="noimg">
        <v-icon size="22">mdi-package-variant</v-icon>
      </div>
    </div>

    <div class="prow-main">
      <div class="prow-title" :title="name">{{ name }}</div>

      <div class="prow-meta">
        <span v-if="sku" class="pill dark">SKU {{ sku }}</span>
        <span v-if="stkLabel" class="pill light">{{ stkLabel }}</span>
        <span v-if="offLabel" class="pill green">{{ offLabel }}</span>
        <span v-if="rubroLabel" class="meta">{{ rubroLabel }}</span>
        <span v-if="subrubroLabel" class="meta">· {{ subrubroLabel }}</span>
      </div>
    </div>

    <div class="prow-price">
      <div class="price-main">{{ money(priceDiscount) }}</div>
      <div v-if="priceList && priceList > priceDiscount" class="price-list">{{ money(priceList) }}</div>
    </div>

    <div class="prow-actions">
      <v-btn
        class="btn-add"
        color="primary"
        size="small"
        :disabled="disabled"
        @click.stop="$emit('add', item)"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>

      <v-btn
        class="btn-eye"
        variant="tonal"
        size="small"
        :disabled="disabled"
        @click.stop="$emit('details', item)"
      >
        <v-icon>mdi-eye</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
defineProps({
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
.prow {
  display: grid;
  grid-template-columns: 54px 1fr auto auto;
  gap: 10px;
  align-items: center;
  padding: 10px 10px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
}

.prow:hover {
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.prow.disabled {
  opacity: 0.65;
}

.prow-img {
  width: 54px;
  height: 42px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.img {
  width: 54px !important;
  height: 42px !important;
}

.noimg {
  width: 54px;
  height: 42px;
  display: grid;
  place-items: center;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.prow-title {
  font-weight: 950;
  font-size: 12.5px;
  line-height: 1.15;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* ✅ 2 líneas max */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.prow-meta {
  margin-top: 4px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.pill {
  font-size: 10px;
  line-height: 1;
  padding: 4px 7px;
  border-radius: 999px;
  white-space: nowrap;
}

.pill.dark {
  background: rgba(0,0,0,0.78);
  color: #fff;
}
.pill.light {
  background: rgba(255,255,255,0.92);
  color: rgba(0,0,0,0.75);
  border: 1px solid rgba(0,0,0,0.10);
}
.pill.green {
  background: rgba(16,185,129,0.92);
  color: #fff;
}

.meta {
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), 0.65);
  white-space: nowrap;
}

.prow-price {
  text-align: right;
  padding-right: 6px;
}

.price-main {
  font-weight: 1000;
  font-size: 14px;
  white-space: nowrap; /* ✅ NO wrap */
}

.price-list {
  margin-top: 2px;
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  text-decoration: line-through;
  white-space: nowrap;
}

.prow-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-add,
.btn-eye {
  min-width: 38px !important;
  width: 38px !important;
  height: 38px !important;
  padding: 0 !important;
  border-radius: 12px !important;
}
</style>