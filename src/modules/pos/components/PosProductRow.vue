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
    @click="addToCart"
  >
    <!-- Imagen cuadrada arriba -->
    <div class="prow-media">
      <v-img
        v-if="image"
        :src="image"
        :aspect-ratio="1"
        class="prow-img"
        cover
      />
      <div v-else class="prow-noimg">
        <v-icon size="42">mdi-package-variant-closed</v-icon>
      </div>

      <!-- Badges flotantes sobre la imagen -->
      <div class="prow-badges-tl">
        <span v-if="hasRealDiscount" class="badge-discount">
          -{{ discountPercent }}%
        </span>
      </div>

      <div class="prow-badges-tr">
        <span
          v-if="hasStockValue"
          class="badge-stock"
          :class="numericStock > 0 ? 'in' : 'out'"
          :title="numericStock > 0 ? `Stock: ${numericStock}` : 'Sin stock'"
        >
          <v-icon size="11">
            {{ numericStock > 0 ? "mdi-check-circle" : "mdi-close-circle" }}
          </v-icon>
          {{ numericStock > 0 ? numericStock : "0" }}
        </span>
      </div>
    </div>

    <!-- Info compacta abajo -->
    <div class="prow-info">
      <div class="prow-title" :title="displayName">
        {{ displayName }}
      </div>

      <div v-if="brandValue || modelValue || categoryValue" class="prow-meta">
        <span v-if="brandValue" class="meta-chip">{{ brandValue }}</span>
        <span v-if="modelValue" class="meta-text">{{ modelValue }}</span>
        <span v-if="categoryValue && !brandValue && !modelValue" class="meta-text">
          {{ categoryValue }}
        </span>
      </div>

      <div class="prow-footer">
        <div class="prow-price-box">
          <div class="price-current">
            {{ money(priceDiscountValue) }}
          </div>
          <div v-if="hasRealDiscount" class="price-list">
            {{ money(priceListValue) }}
          </div>
        </div>

        <v-btn
          icon
          size="small"
          variant="flat"
          class="btn-action"
          tabindex="-1"
          :disabled="disabled"
          :ripple="false"
          @click.stop="addToCart"
          :title="`Agregar ${displayName} al carrito`"
        >
          <v-icon size="19">mdi-cart-plus</v-icon>
        </v-btn>
      </div>
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
    moveGrid(0, 1);
    return;
  }

  if (key === "ArrowUp") {
    e.preventDefault();
    moveGrid(0, -1);
    return;
  }

  if (key === "ArrowRight") {
    e.preventDefault();
    moveGrid(1, 0);
    return;
  }

  if (key === "ArrowLeft") {
    e.preventDefault();
    moveGrid(-1, 0);
    return;
  }
}

// Navegación espacial en grid 2D.
// dx: ±1 columna, dy: ±1 fila.
function moveGrid(dx, dy) {
  const cards = Array.from(
    document.querySelectorAll(".prow[tabindex='0']")
  ).filter((el) => !el.classList.contains("disabled"));

  if (!cards.length) return;

  const current = document.activeElement;
  const idx = cards.indexOf(current);
  if (idx < 0) return;

  // Detectar cuántas columnas por fila a partir del DOM
  const cols = detectColumnCount(cards);

  let target = idx;
  if (dy !== 0) target = idx + dy * cols;
  if (dx !== 0) target = idx + dx;

  if (target < 0 || target >= cards.length) return;

  // Si el movimiento horizontal saltaría a otra fila, cancelar.
  if (dx !== 0) {
    const sameRow = Math.floor(idx / cols) === Math.floor(target / cols);
    if (!sameRow) return;
  }

  cards[target].focus();
  cards[target].scrollIntoView?.({ block: "nearest", behavior: "smooth" });
}

function detectColumnCount(cards) {
  if (cards.length < 2) return 1;
  const firstTop = cards[0].getBoundingClientRect().top;
  let cols = 1;
  for (let i = 1; i < cards.length; i++) {
    if (Math.abs(cards[i].getBoundingClientRect().top - firstTop) < 2) {
      cols++;
    } else {
      break;
    }
  }
  return cols;
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
  --row-border: rgba(var(--v-theme-on-surface), 0.08);
  --row-border-hover: rgba(var(--v-theme-on-surface), 0.16);
  --row-text: rgb(var(--v-theme-on-surface));
  --row-muted: rgba(var(--v-theme-on-surface), 0.55);
  --row-media-bg: rgba(var(--v-theme-on-surface), 0.04);
  --row-btn-bg: rgb(var(--v-theme-primary));
  --row-btn-text: rgb(var(--v-theme-on-primary));
  --row-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  --row-shadow-hover: 0 6px 16px rgba(0, 0, 0, 0.1);

  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
  background: var(--row-bg);
  border: 1px solid var(--row-border);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: var(--row-shadow);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.prow:hover {
  border-color: var(--row-border-hover);
  box-shadow: var(--row-shadow-hover);
  transform: translateY(-2px);
}

.prow:focus {
  outline: none;
}

.prow:focus-visible {
  outline: none;
  border-color: rgb(var(--v-theme-primary));
  box-shadow:
    0 0 0 3px rgb(var(--v-theme-primary)),
    0 0 0 6px rgba(var(--v-theme-primary), 0.22),
    0 12px 28px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
  z-index: 2;
}

.prow.disabled {
  opacity: 0.55;
  pointer-events: none;
}

/* ── Imagen cuadrada (ocupa el ancho del card) ───────────── */
.prow-media {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: var(--row-media-bg);
  overflow: hidden;
  flex: 0 0 auto;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.prow-img {
  width: 100%;
  height: 100%;
}

.prow-img :deep(.v-img__img),
.prow-img :deep(img) {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.prow-noimg {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(var(--v-theme-on-surface), 0.35);
}

/* Badges flotantes sobre la imagen */
.prow-badges-tl {
  position: absolute;
  top: 6px;
  left: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 2;
  pointer-events: none;
}

.prow-badges-tr {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 2;
  pointer-events: none;
}

.badge-discount {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgb(var(--v-theme-success));
  color: rgb(var(--v-theme-on-success));
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.01em;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  line-height: 1.3;
}

.badge-stock {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  line-height: 1;
}

.badge-stock.in {
  background: rgba(var(--v-theme-success), 0.94);
  color: rgb(var(--v-theme-on-success));
}

.badge-stock.out {
  background: rgba(var(--v-theme-error), 0.94);
  color: rgb(var(--v-theme-on-error));
}

/* ── Info compacta ────────────────────────────────────────── */
.prow-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 9px 10px 10px;
  flex: 1 1 auto;
  min-height: 0;
}

.prow-title {
  font-size: 13.5px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.005em;
  color: var(--row-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.prow-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  min-height: 0;
  overflow: hidden;
  flex-shrink: 0;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 5px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.82);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.meta-text {
  font-size: 12px;
  color: var(--row-muted);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

/* ── Footer: precio + botón add ───────────────────────────── */
.prow-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 6px;
  margin-top: auto;
  padding-top: 2px;
  flex-shrink: 0;
}

.prow-price-box {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
  flex: 1 1 auto;
}

.price-current {
  font-size: 17px;
  line-height: 1.05;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--row-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.price-list {
  font-size: 11.5px;
  line-height: 1;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.42);
  text-decoration: line-through;
  margin-top: 2px;
}

.btn-action {
  width: 34px !important;
  height: 34px !important;
  min-width: 34px !important;
  border-radius: 9px !important;
  background: var(--row-btn-bg) !important;
  color: var(--row-btn-text) !important;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.32) !important;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.btn-action:hover {
  transform: scale(1.06);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.48) !important;
}

/* ── Dark mode ─────────────────────────────────────────────── */
:deep(.v-theme--dark) .prow {
  --row-bg: rgba(14, 22, 38, 0.96);
  --row-border: rgba(255, 255, 255, 0.1);
  --row-border-hover: rgba(255, 255, 255, 0.22);
  --row-text: rgba(255, 255, 255, 0.96);
  --row-muted: rgba(255, 255, 255, 0.6);
  --row-media-bg: rgba(255, 255, 255, 0.04);
  --row-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
  --row-shadow-hover: 0 12px 28px rgba(0, 0, 0, 0.5);
}

:deep(.v-theme--dark) .prow:focus-visible {
  border-color: rgb(var(--v-theme-primary));
  box-shadow:
    0 0 0 3px rgb(var(--v-theme-primary)),
    0 0 0 6px rgba(var(--v-theme-primary), 0.28),
    0 14px 30px rgba(0, 0, 0, 0.5);
}

:deep(.v-theme--dark) .meta-chip {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.88);
}

/* ── Out of stock visual state ─────────────────────────────── */
.prow.no-stock .prow-img {
  filter: grayscale(0.55) brightness(0.85);
}

.prow.no-stock .price-current {
  opacity: 0.72;
}

/* ── Responsive ────────────────────────────────────────────── */
@media (max-width: 900px) {
  .prow-title {
    font-size: 12.5px;
  }

  .prow-info {
    padding: 9px 10px 10px;
    gap: 3px;
  }

  .meta-chip,
  .meta-text {
    font-size: 10px;
  }

  .price-current {
    font-size: 15px;
  }

  .price-list {
    font-size: 10px;
  }

  .btn-action {
    width: 30px !important;
    height: 30px !important;
    min-width: 30px !important;
  }
}

@media (max-width: 520px) {
  .prow-title {
    font-size: 13px;
    -webkit-line-clamp: 2;
  }

  .prow-info {
    padding: 10px 12px 12px;
  }

  .price-current {
    font-size: 16px;
  }

  .btn-action {
    width: 36px !important;
    height: 36px !important;
    min-width: 36px !important;
  }
}
</style>
