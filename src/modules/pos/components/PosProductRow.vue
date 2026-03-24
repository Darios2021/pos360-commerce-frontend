<template>
  <div
    class="prow"
    :class="{ disabled }"
    tabindex="0"
    @click="onRowClick"
    @dblclick.stop="$emit('add', item)"
    @keyup.enter="$emit('add', item)"
  >
    <!-- IMAGE -->
    <div class="prow-img">
      <v-img v-if="image" :src="image" class="img" cover />
      <div v-else class="noimg">
        <v-icon size="18">mdi-package-variant</v-icon>
      </div>
    </div>

    <!-- MAIN -->
    <div class="prow-main">
      <div class="prow-title" :title="name">
        {{ name }}
      </div>

      <div class="prow-meta">
        <span v-if="sku" class="pill dark">SKU {{ sku }}</span>
        <span v-if="stkLabel" class="pill stock">{{ stkLabel }}</span>
        <span v-if="offLabel" class="pill off">{{ offLabel }}</span>
        <span v-if="rubroLabel" class="meta-text">{{ rubroLabel }}</span>
        <span v-if="subrubroLabel" class="meta-text">· {{ subrubroLabel }}</span>
      </div>
    </div>

    <!-- PRICE -->
    <div class="prow-price">
      <div class="price-discount">
        {{ money(priceDiscount) }}
      </div>

      <div v-if="priceList && priceList > priceDiscount" class="price-list">
        {{ money(priceList) }}
      </div>
    </div>

    <!-- ACTIONS -->
    <div class="prow-actions">
      <v-btn
        icon
        variant="tonal"
        density="compact"
        class="btn-action"
        :disabled="disabled"
        @click.stop="$emit('add', item)"
      >
        <v-icon size="16">mdi-plus</v-icon>
      </v-btn>

      <v-btn
        icon
        variant="tonal"
        density="compact"
        class="btn-action"
        @click.stop="$emit('details', item)"
      >
        <v-icon size="16">mdi-eye-outline</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
defineProps({
  item: Object,
  image: String,
  name: String,
  sku: String,
  stkLabel: String,
  offLabel: String,
  rubroLabel: String,
  subrubroLabel: String,
  priceDiscount: Number,
  priceList: Number,
  disabled: Boolean,
});

defineEmits(["add", "details"]);

function onRowClick() {
  /* opcional */
}

function money(v) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));
}
</script>

<style scoped>
.prow {
  position: relative;
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 8px;

  padding: 7px 9px;
  border-radius: 12px;
  cursor: pointer;

  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);

  box-shadow:
    0 4px 12px rgba(15, 23, 42, 0.04),
    0 1px 3px rgba(15, 23, 42, 0.03);

  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease,
    border-color 0.12s ease,
    background-color 0.12s ease;
}

/* ✅ TEST FUERTE LIGHT: si esto no se nota, el problema es el padre */
:global(.v-theme--light) .prow {
  background: #f4f8ff;
  border-color: #cfdcf0;
  box-shadow:
    0 8px 18px rgba(15, 23, 42, 0.08),
    0 2px 6px rgba(15, 23, 42, 0.05);
}

:global(.v-theme--dark) .prow {
  background: rgb(var(--v-theme-surface));
  border-color: rgba(255, 255, 255, 0.06);

  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.20),
    0 2px 6px rgba(0, 0, 0, 0.14);
}

.prow:hover {
  transform: translateY(-1px);
  border-color: rgba(var(--v-theme-primary), 0.28);
  background: rgba(var(--v-theme-primary), 0.07);

  box-shadow:
    0 10px 22px rgba(15, 23, 42, 0.10),
    0 3px 8px rgba(15, 23, 42, 0.06);
}

:global(.v-theme--light) .prow:hover {
  background: #eaf2ff;
}

:global(.v-theme--dark) .prow:hover {
  background: rgba(var(--v-theme-primary), 0.10);
}

.prow:focus-visible {
  outline: none;
  border-color: rgba(var(--v-theme-primary), 0.35);

  box-shadow:
    0 0 0 3px rgba(var(--v-theme-primary), 0.12),
    0 10px 22px rgba(15, 23, 42, 0.08);
}

.prow.disabled {
  opacity: 0.58;
  pointer-events: none;
  transform: none;
}

/* IMAGE */
.prow-img {
  width: 56px;
  height: 42px;
  border-radius: 9px;
  overflow: hidden;

  background: rgba(var(--v-theme-on-surface), 0.04);

  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}

:global(.v-theme--light) .prow-img {
  background: #eef3f9;
  border-color: #d8e2ee;
}

.img {
  width: 100%;
  height: 100%;
}

.noimg {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
}

/* MAIN */
.prow-main {
  min-width: 0;
}

.prow-title {
  font-size: 12.25px;
  line-height: 1.12;
  font-weight: 850;
  letter-spacing: 0.005em;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prow-meta {
  margin-top: 2px;
  min-width: 0;

  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: nowrap;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-text {
  min-width: 0;
  font-size: 10.5px;
  line-height: 1.1;
  opacity: 0.68;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* CHIPS */
.pill {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;

  min-height: 18px;
  padding: 1px 6px;
  border-radius: 999px;

  font-size: 9.75px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.pill.dark {
  background: rgba(var(--v-theme-on-surface), 0.07);
  color: rgba(var(--v-theme-on-surface), 0.88);
}

:global(.v-theme--light) .pill.dark {
  background: #e9eef5;
  color: #263445;
}

.pill.stock {
  background: rgba(var(--v-theme-primary), 0.11);
  color: rgb(var(--v-theme-primary));
}

.pill.off {
  background: rgba(0, 180, 95, 0.11);
  color: #0d8c4a;
}

/* PRICE */
.prow-price {
  min-width: 88px;
  text-align: right;
}

.price-discount {
  font-size: 13px;
  line-height: 1.05;
  font-weight: 900;
  letter-spacing: -0.01em;
}

.price-list {
  margin-top: 1px;
  font-size: 10.5px;
  line-height: 1;
  opacity: 0.56;
  text-decoration: line-through;
}

/* ACTIONS */
.prow-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-action {
  width: 30px !important;
  height: 30px !important;
  min-width: 30px !important;
  border-radius: 10px !important;
}

:global(.v-theme--light) .btn-action {
  background: #e8eef6 !important;
}

/* NOTEBOOK */
@media (max-width: 1366px) {
  .prow {
    grid-template-columns: 52px minmax(0, 1fr) auto auto;
    gap: 7px;
    padding: 6px 8px;
  }

  .prow-img {
    width: 52px;
    height: 40px;
  }

  .prow-title {
    font-size: 11.75px;
  }

  .meta-text {
    font-size: 10px;
  }

  .pill {
    font-size: 9.4px;
    padding: 1px 5px;
    min-height: 17px;
  }

  .prow-price {
    min-width: 82px;
  }

  .price-discount {
    font-size: 12.5px;
  }

  .price-list {
    font-size: 10px;
  }

  .btn-action {
    width: 28px !important;
    height: 28px !important;
    min-width: 28px !important;
    border-radius: 9px !important;
  }
}

/* MOBILE */
@media (max-width: 960px) {
  .prow {
    grid-template-columns: 52px minmax(0, 1fr) auto;
    align-items: start;
  }

  .prow-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
    margin-top: 4px;
  }

  .prow-meta {
    flex-wrap: wrap;
    white-space: normal;
  }
}

@media (max-width: 600px) {
  .prow {
    grid-template-columns: 48px minmax(0, 1fr) auto;
    padding: 5px 6px;
    border-radius: 10px;
  }

  .prow-img {
    width: 48px;
    height: 38px;
    border-radius: 8px;
  }

  .prow-title {
    font-size: 11.5px;
  }

  .price-discount {
    font-size: 12px;
  }

  .btn-action {
    width: 27px !important;
    height: 27px !important;
    min-width: 27px !important;
  }
}
</style>