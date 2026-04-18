<template>
  <div
    class="prow"
    :class="{
      disabled,
      'has-stock': hasStockValue && numericStock > 0,
      'no-stock': hasStockValue && numericStock <= 0,
    }"
    tabindex="0"
    @keydown="onKeydown"
  >
    <div class="prow-media">
      <v-img v-if="image" :src="image" class="prow-img" cover />
      <div v-else class="prow-noimg">
        <v-icon size="22">mdi-package-variant-closed</v-icon>
      </div>
    </div>

    <div class="prow-body">
      <div class="prow-head">
        <div class="prow-main">
          <div class="prow-title" :title="displayName">
            {{ displayName }}
          </div>

          <div class="prow-meta-lines">
            <span v-if="brandValue" class="meta-inline">
              <span class="meta-inline__label">Marca:</span>
              <span class="meta-inline__value">{{ brandValue }}</span>
            </span>

            <span v-if="modelValue" class="meta-inline">
              <span class="meta-inline__label">Modelo:</span>
              <span class="meta-inline__value">{{ modelValue }}</span>
            </span>

            <span v-if="categoryValue" class="meta-inline">
              <span class="meta-inline__label">Categoría:</span>
              <span class="meta-inline__value">{{ categoryValue }}</span>
            </span>

            <span v-if="subCategoryValue" class="meta-inline">
              <span class="meta-inline__label">Subcategoría:</span>
              <span class="meta-inline__value">{{ subCategoryValue }}</span>
            </span>

            <span v-if="skuValue" class="meta-inline">
              <span class="meta-inline__label">SKU:</span>
              <span class="meta-inline__value">{{ skuValue }}</span>
            </span>
          </div>

          <div v-if="hasStockValue" class="prow-stock-row">
            <div
              class="stock-badge"
              :class="numericStock > 0 ? 'in-stock' : 'no-stock'"
            >
              <v-icon size="14">
                {{ numericStock > 0 ? "mdi-check-circle" : "mdi-close-circle" }}
              </v-icon>
              <span class="stock-badge__text">
                {{ numericStock > 0 ? `Stock: ${numericStock}` : "Sin stock" }}
              </span>
            </div>
          </div>
        </div>

        <div class="prow-price-box">
          <div class="price-current">
            {{ money(priceDiscountValue) }}
          </div>

          <div v-if="hasRealDiscount" class="price-subline">
            <span class="price-list">
              {{ money(priceListValue) }}
            </span>

            <span class="price-discount-chip">
              -{{ discountPercent }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="prow-actions">
      <v-btn
        icon
        variant="text"
        class="btn-action"
        tabindex="-1"
        :disabled="disabled"
        :ripple="false"
        @click.stop="addToCart"
      >
        <v-icon size="20">mdi-plus</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  item: { type: Object, default: () => ({}) },
  image: { type: String, default: "" },
  name: { type: String, default: "" },

  brandLabel: { type: String, default: "" },
  modelLabel: { type: String, default: "" },
  rubroLabel: { type: String, default: "" },
  subrubroLabel: { type: String, default: "" },
  sku: { type: String, default: "" },
  stockLabel: { type: [String, Number], default: "" },

  priceDiscount: { type: Number, default: 0 },
  priceList: { type: Number, default: 0 },

  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["add"]);

const itemSafe = computed(() => props.item || {});

const displayName = computed(() => {
  return (
    props.name ||
    itemSafe.value.nombre ||
    itemSafe.value.name ||
    itemSafe.value.descripcion ||
    itemSafe.value.description ||
    "Producto"
  );
});

const brandValue = computed(() => {
  return (
    props.brandLabel ||
    itemSafe.value.marca ||
    itemSafe.value.brand ||
    itemSafe.value.nombre_marca ||
    ""
  );
});

const modelValue = computed(() => {
  return (
    props.modelLabel ||
    itemSafe.value.modelo ||
    itemSafe.value.model ||
    itemSafe.value.nombre_modelo ||
    ""
  );
});

const categoryValue = computed(() => {
  return (
    props.rubroLabel ||
    itemSafe.value.categoria ||
    itemSafe.value.category ||
    itemSafe.value.rubro ||
    itemSafe.value.nombre_categoria ||
    ""
  );
});

const subCategoryValue = computed(() => {
  return (
    props.subrubroLabel ||
    itemSafe.value.subcategoria ||
    itemSafe.value.subcategory ||
    itemSafe.value.subrubro ||
    itemSafe.value.nombre_subcategoria ||
    ""
  );
});

const skuValue = computed(() => {
  return (
    props.sku ||
    itemSafe.value.sku ||
    itemSafe.value.codigo ||
    itemSafe.value.codigo_barras ||
    itemSafe.value.barcode ||
    ""
  );
});

const stockRaw = computed(() => {
  const candidates = [
    props.stockLabel,
    itemSafe.value.stock,
    itemSafe.value.stock_actual,
    itemSafe.value.stockActual,
    itemSafe.value.cantidad,
    itemSafe.value.existencias,
    itemSafe.value.existencia,
    itemSafe.value.disponible,
  ];

  return candidates.find(
    (v) => v !== "" && v !== null && v !== undefined
  );
});

const hasStockValue = computed(() => {
  return (
    stockRaw.value !== "" &&
    stockRaw.value !== null &&
    stockRaw.value !== undefined
  );
});

const numericStock = computed(() => {
  const n = Number(stockRaw.value);
  return Number.isFinite(n) ? n : 0;
});

const priceDiscountValue = computed(() => {
  return Number(
    props.priceDiscount ||
      itemSafe.value.precio_descuento ||
      itemSafe.value.precio ||
      itemSafe.value.price ||
      0
  );
});

const priceListValue = computed(() => {
  return Number(
    props.priceList ||
      itemSafe.value.precio_lista ||
      itemSafe.value.precioList ||
      itemSafe.value.list_price ||
      0
  );
});

const hasRealDiscount = computed(() => {
  return (
    priceListValue.value > 0 &&
    priceDiscountValue.value > 0 &&
    priceListValue.value > priceDiscountValue.value
  );
});

const discountPercent = computed(() => {
  if (!hasRealDiscount.value) return 0;
  return Math.round(
    ((priceListValue.value - priceDiscountValue.value) / priceListValue.value) * 100
  );
});

function addToCart() {
  if (props.disabled) return;
  emit("add", props.item);
}

function onKeydown(e) {
  if (props.disabled) return;

  const key = e.key;

  if (key === "Enter" || key === " ") {
    e.preventDefault();
    e.stopPropagation();
    addToCart();
    return;
  }

  if (key === "ArrowDown") {
    e.preventDefault();
    move(1);
    return;
  }

  if (key === "ArrowUp") {
    e.preventDefault();
    move(-1);
    return;
  }
}

function move(dir) {
  const cards = Array.from(
    document.querySelectorAll(".prow[tabindex='0']")
  ).filter((el) => !el.classList.contains("disabled"));

  const current = document.activeElement;
  const i = cards.indexOf(current);
  const next = cards[i + dir];

  if (next) {
    next.focus();
    next.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }
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
  --row-bg: rgb(var(--v-theme-surface));
  --row-border: rgba(var(--v-theme-on-surface), 0.07);
  --row-border-hover: rgba(var(--v-theme-on-surface), 0.13);
  --row-text: rgb(var(--v-theme-on-surface));
  --row-muted: rgba(var(--v-theme-on-surface), 0.5);
  --row-media-bg: rgba(var(--v-theme-on-surface), 0.04);
  --row-btn-bg: rgba(var(--v-theme-on-surface), 0.05);
  --row-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  --row-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.07);

  position: relative;
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr) 38px;
  gap: 8px;
  align-items: center;
  min-height: 76px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  background: var(--row-bg);
  border: 1px solid var(--row-border);
  box-shadow: var(--row-shadow);
  transition:
    border-color 0.12s ease,
    box-shadow 0.12s ease;
  -webkit-tap-highlight-color: transparent;
}

.prow:hover {
  border-color: var(--row-border-hover);
  box-shadow: var(--row-shadow-hover);
}

.prow:focus {
  outline: none;
}

.prow:focus-visible {
  border-color: rgba(var(--v-theme-primary), 0.95);
  box-shadow:
    inset 0 0 0 2px rgba(var(--v-theme-primary), 0.95),
    0 8px 18px rgba(0, 0, 0, 0.12);
}

.prow.disabled {
  opacity: 0.56;
  pointer-events: none;
  transform: none;
}

.prow-media {
  width: 62px;
  height: 62px;
  min-width: 62px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--row-media-bg);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  display: flex;
  align-items: center;
  justify-content: center;
}

.prow-img {
  width: 100%;
  height: 100%;
}

.prow-noimg {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(var(--v-theme-on-surface), 0.4);
}

.prow-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prow-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.prow-main {
  min-width: 0;
  flex: 1 1 auto;
}

.prow-title {
  font-size: 13px;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--row-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.prow-meta-lines {
  display: flex;
  flex-wrap: wrap;
  gap: 3px 8px;
  margin-top: 4px;
}

.meta-inline {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  min-width: 0;
  max-width: 100%;
  font-size: 10.5px;
  line-height: 1.1;
}

.meta-inline__label {
  font-weight: 600;
  color: var(--row-muted);
  white-space: nowrap;
}

.meta-inline__value {
  font-weight: 600;
  color: var(--row-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prow-stock-row {
  margin-top: 4px;
}

.stock-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 20px;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  border: 1px solid transparent;
}

.stock-badge__text {
  line-height: 1;
}

.stock-badge.in-stock {
  background: rgba(var(--v-theme-success), 0.14);
  color: rgb(var(--v-theme-success));
  border-color: rgba(var(--v-theme-success), 0.26);
}

.stock-badge.no-stock {
  background: rgba(var(--v-theme-error), 0.14);
  color: rgb(var(--v-theme-error));
  border-color: rgba(var(--v-theme-error), 0.26);
}

.prow-price-box {
  min-width: 120px;
  text-align: right;
  flex: 0 0 auto;
}

.price-current {
  font-size: 17px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--row-text);
}

.price-subline {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.price-list {
  font-size: 11px;
  line-height: 1;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.45);
  text-decoration: line-through;
}

.price-discount-chip {
  display: inline-flex;
  align-items: center;
  min-height: 17px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(var(--v-theme-success), 0.1);
  color: rgb(var(--v-theme-success));
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

.prow-actions {
  display: flex;
  justify-content: center;
  align-items: center;
}

.btn-action {
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  border-radius: 8px !important;
  background: var(--row-btn-bg) !important;
  color: var(--row-text) !important;
}

:deep(.v-theme--dark) .prow {
  --row-bg: rgba(10, 18, 32, 0.96);
  --row-border: rgba(255, 255, 255, 0.12);
  --row-border-hover: rgba(255, 255, 255, 0.2);
  --row-text: rgba(255, 255, 255, 0.96);
  --row-muted: rgba(255, 255, 255, 0.66);
  --row-media-bg: rgba(255, 255, 255, 0.05);
  --row-btn-bg: rgba(255, 255, 255, 0.07);
  --row-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
  --row-shadow-hover: 0 10px 24px rgba(0, 0, 0, 0.28);
}

:deep(.v-theme--dark) .prow:focus-visible {
  border-color: rgba(255, 255, 255, 0.98);
  box-shadow:
    inset 0 0 0 2px rgba(255, 255, 255, 0.98),
    0 10px 22px rgba(0, 0, 0, 0.28);
}

:deep(.v-theme--dark) .btn-action {
  background: rgba(255, 255, 255, 0.07) !important;
  color: rgba(255, 255, 255, 0.96) !important;
}

@media (max-width: 900px) {
  .prow {
    grid-template-columns: 56px minmax(0, 1fr) 34px;
    min-height: 68px;
    gap: 7px;
    padding: 7px 9px;
  }

  .prow-media {
    width: 56px;
    height: 56px;
    min-width: 56px;
  }

  .prow-title {
    font-size: 12px;
  }

  .prow-meta-lines {
    gap: 3px 7px;
    margin-top: 3px;
  }

  .meta-inline {
    font-size: 10px;
  }

  .stock-badge {
    min-height: 18px;
    padding: 2px 6px;
    font-size: 9px;
  }

  .prow-price-box {
    min-width: 100px;
  }

  .price-current {
    font-size: 15px;
  }

  .price-list {
    font-size: 10px;
  }

  .price-discount-chip {
    min-height: 15px;
    padding: 0 5px;
    font-size: 9px;
  }
}

@media (max-width: 640px) {
  .prow {
    grid-template-columns: 68px minmax(0, 1fr) 38px;
    min-height: 88px;
    gap: 8px;
    padding: 8px;
    border-radius: 14px;
  }

  .prow-media {
    width: 68px;
    height: 68px;
    min-width: 68px;
    border-radius: 12px;
  }

  .prow-title {
    font-size: 13px;
  }

  .prow-meta-lines {
    gap: 4px 8px;
    margin-top: 6px;
  }

  .meta-inline {
    font-size: 10px;
  }

  .prow-stock-row {
    margin-top: 6px;
  }

  .stock-badge {
    min-height: 22px;
    padding: 3px 7px;
    font-size: 9px;
  }

  .prow-price-box {
    min-width: 106px;
  }

  .price-current {
    font-size: 17px;
  }

  .price-list {
    font-size: 10px;
  }

  .price-discount-chip {
    min-height: 16px;
    padding: 0 6px;
    font-size: 9px;
  }

  .btn-action {
    width: 34px !important;
    height: 34px !important;
    min-width: 34px !important;
    border-radius: 10px !important;
  }
}
</style>