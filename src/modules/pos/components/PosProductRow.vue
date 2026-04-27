<template>
  <div
    class="prow"
    :class="{
      disabled,
      'has-stock': hasStockValue && numericStock > 0,
      'no-stock': hasStockValue && numericStock <= 0,
      'in-cart': isInCart,
      'is-promo': promoActive,
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
        <span
          v-if="hasStockValue"
          class="badge-stock"
          :class="`level-${stockLevel}`"
          :title="stockLevelTitle"
        >
          <v-icon size="14">
            {{ stockLevel === "out" ? "mdi-close-circle" : "mdi-package-variant-closed" }}
          </v-icon>
          {{ stockInt }}
        </span>
      </div>

      <!-- Badge PROMO (esquina superior derecha) -->
      <div v-if="promoActive" class="prow-badges-tr">
        <span class="badge-promo" title="Producto en promoción">
          <v-icon size="13">mdi-tag-heart</v-icon>
          PROMO
        </span>
      </div>

      <!-- Hint promo por cantidad (overlay flotante abajo a la derecha) -->
      <span v-if="qtyPromoHint" class="prow-qty-promo" :title="qtyPromoHint">
        <v-icon size="11">mdi-tag-multiple</v-icon>
        {{ qtyPromoHint }}
      </span>
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
          <div class="price-current" :class="{ 'is-promo': promoActive }">
            {{ money(effectivePriceValue) }}
          </div>
          <div class="price-meta">
            <span v-if="hasRealDiscount" class="price-list">
              {{ money(priceListValue) }}
            </span>
            <span v-if="offPctEffective > 0" class="price-off" :class="{ 'is-promo': promoActive }">
              -{{ offPctEffective }}%
            </span>
          </div>
        </div>

        <div class="btn-action-wrap">
          <v-btn
            icon
            size="small"
            variant="flat"
            class="btn-action"
            :class="{ 'btn-action--in-cart': isInCart }"
            tabindex="-1"
            :disabled="disabled"
            :ripple="false"
            @click.stop="addToCart"
            :title="isInCart
              ? `En carrito: ${cartQtyInt} · Agregar otra unidad`
              : `Agregar ${displayName} al carrito`"
          >
            <v-icon size="19">
              {{ isInCart ? 'mdi-cart-check' : 'mdi-cart-plus' }}
            </v-icon>
          </v-btn>

          <span v-if="isInCart" class="btn-qty-badge">{{ cartQtyInt }}</span>
        </div>
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

  // Cantidad de este producto que ya está en el carrito
  cartQty: { type: Number, default: 0 },

  disabled: { type: Boolean, default: false },
});

const isInCart = computed(() => Number(props.cartQty) > 0);
const cartQtyInt = computed(() => {
  const n = Math.floor(Number(props.cartQty) || 0);
  return n > 0 ? n : 0;
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
    // Backend POS devuelve qty / stock_qty
    itemSafe.value.qty,
    itemSafe.value.stock_qty,
    itemSafe.value.stockQty,
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

// Stock como entero (1, 2, 3...) — ignora decimales típicos de stock (5.000 → 5).
const stockInt = computed(() => {
  const n = numericStock.value;
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
});

// Semáforo de stock:
//   > 10 → "high" (verde)  | 5..10 → "mid" (amarillo)  | 1..4 → "low" (rojo)  | 0 → "out" (rojo)
const stockLevel = computed(() => {
  const n = stockInt.value;
  if (n <= 0) return "out";
  if (n < 5) return "low";
  if (n <= 10) return "mid";
  return "high";
});

const stockLevelTitle = computed(() => {
  const n = stockInt.value;
  if (n <= 0) return "Sin stock";
  if (n < 5) return `Stock bajo: ${n}`;
  if (n <= 10) return `Stock medio: ${n}`;
  return `Stock disponible: ${n}`;
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

/* ─── PROMO ─── */
function _toNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
const promoActive = computed(() => {
  const it = itemSafe.value;
  if (!it?.is_promo) return false;
  const now = new Date();
  const s = it.promo_starts_at ? new Date(it.promo_starts_at) : null;
  const e = it.promo_ends_at   ? new Date(it.promo_ends_at)   : null;
  if (s && Number.isFinite(s.getTime()) && now < s) return false;
  if (e && Number.isFinite(e.getTime()) && now > e) return false;
  return true;
});

// Precio efectivo: si hay promo por tiempo activa con promo_price → manda
const effectivePriceValue = computed(() => {
  if (promoActive.value) {
    const pp = _toNum(itemSafe.value?.promo_price, 0);
    if (pp > 0) return pp;
  }
  return priceDiscountValue.value;
});

// % OFF respecto a price_list (lo que el cliente "ahorra")
const offPctEffective = computed(() => {
  const list = priceListValue.value;
  const eff = effectivePriceValue.value;
  if (!(list > 0) || !(eff > 0) || eff >= list) return 0;
  return Math.round(((list - eff) / list) * 100);
});

// Hint compacto de promo por cantidad (mismo formato que el shop)
const qtyPromoHint = computed(() => {
  if (!promoActive.value) return "";
  const thr  = Number(itemSafe.value?.promo_qty_threshold) || 0;
  const disc = _toNum(itemSafe.value?.promo_qty_discount, 0);
  const mode = String(itemSafe.value?.promo_qty_mode || "").toLowerCase();
  if (thr < 2 || disc <= 0) return "";
  if (mode === "percent") return `${thr}+ unid · ${disc}% OFF`;
  return `${thr}+ unid · -$${Math.round(disc)}`;
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
    e.stopPropagation();
    moveGrid(0, 1);
    return;
  }

  if (key === "ArrowUp") {
    e.preventDefault();
    e.stopPropagation();
    moveGrid(0, -1);
    return;
  }

  if (key === "ArrowRight") {
    e.preventDefault();
    e.stopPropagation();
    moveGrid(1, 0);
    return;
  }

  if (key === "ArrowLeft") {
    e.preventDefault();
    e.stopPropagation();
    moveGrid(-1, 0);
    return;
  }
}

// Navegación espacial en grid 2D.
// dx: ±1 columna, dy: ±1 fila.
// ↑ desde la primera fila → vuelve al buscador.
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

  // ↑ desde la primera fila → volver al buscador
  if (dy === -1 && target < 0) {
    focusSearchBar();
    return;
  }

  if (target < 0 || target >= cards.length) return;

  // Si el movimiento horizontal saltaría a otra fila, cancelar.
  if (dx !== 0) {
    const sameRow = Math.floor(idx / cols) === Math.floor(target / cols);
    if (!sameRow) return;
  }

  cards[target].focus();
  cards[target].scrollIntoView?.({ block: "nearest", behavior: "smooth" });
}

function focusSearchBar() {
  const input =
    document.querySelector(".pos-search-bar .search-input input") ||
    document.querySelector(".pos-search-bar input");
  if (input) {
    input.focus();
    try {
      input.select?.();
    } catch (_e) {
      /* noop */
    }
    input.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }
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

/* Estilo "pill premium" inspirado en el botón del carrito:
   fondo sólido, sombra coloreada, texto blanco bold, bordes suaves. */
.badge-discount {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 9px;
  background: rgb(var(--v-theme-error));
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.02em;
  box-shadow:
    0 3px 10px rgba(var(--v-theme-error), 0.48),
    0 1px 2px rgba(0, 0, 0, 0.15);
  line-height: 1.1;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.22);
}

.badge-stock {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.1;
  color: #fff;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.22);
  box-shadow:
    0 3px 10px rgba(0, 0, 0, 0.18),
    0 1px 2px rgba(0, 0, 0, 0.15);
}

/* Badge PROMO (esquina superior derecha) */
.badge-promo {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.6px;
  color: #fff;
  background: linear-gradient(135deg, #ff5722 0%, #ff9100 100%);
  box-shadow:
    0 3px 10px rgba(255, 87, 34, 0.45),
    0 1px 2px rgba(0, 0, 0, 0.15);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.22);
  text-transform: uppercase;
}

/* Chip flotante de promo por cantidad (abajo a la derecha del media) */
.prow-qty-promo {
  position: absolute;
  bottom: 6px;
  right: 6px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1px;
  color: #fff;
  background: linear-gradient(135deg, #ff5722 0%, #ff9100 100%);
  padding: 3px 8px;
  border-radius: 999px;
  line-height: 1.1;
  box-shadow: 0 3px 8px rgba(255, 87, 34, 0.40);
  z-index: 2;
  white-space: nowrap;
  pointer-events: none;
  max-width: calc(100% - 12px);
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge-stock .v-icon {
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.25));
}

/* Semáforo de stock: >10 verde | 5-10 amarillo | 1-4 rojo | 0 rojo */
.badge-stock.level-high {
  background: rgb(var(--v-theme-success));
  box-shadow:
    0 3px 10px rgba(var(--v-theme-success), 0.5),
    0 1px 2px rgba(0, 0, 0, 0.15);
}

.badge-stock.level-mid {
  background: rgb(var(--v-theme-warning));
  box-shadow:
    0 3px 10px rgba(var(--v-theme-warning), 0.5),
    0 1px 2px rgba(0, 0, 0, 0.15);
}

.badge-stock.level-low,
.badge-stock.level-out {
  background: rgb(var(--v-theme-error));
  box-shadow:
    0 3px 10px rgba(var(--v-theme-error), 0.48),
    0 1px 2px rgba(0, 0, 0, 0.15);
}

/* Pulso sutil cuando el stock está crítico para llamar la atención */
.badge-stock.level-out {
  animation: stockOutPulse 2s ease-in-out infinite;
}

@keyframes stockOutPulse {
  0%, 100% {
    box-shadow:
      0 3px 10px rgba(var(--v-theme-error), 0.48),
      0 1px 2px rgba(0, 0, 0, 0.15);
  }
  50% {
    box-shadow:
      0 3px 14px rgba(var(--v-theme-error), 0.75),
      0 1px 2px rgba(0, 0, 0, 0.15);
  }
}

/* ── Info compacta ────────────────────────────────────────── */
.prow-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 7px 9px 8px;
  flex: 1 1 auto;
  min-height: 0;
}

.prow-title {
  font-size: 12.5px;
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
  padding: 1px 6px;
  border-radius: 5px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.82);
  font-size: 10px;
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
  font-size: 11px;
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
  font-size: 15px;
  line-height: 1.05;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--row-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Precio en naranja cuando es promo activa */
.price-current.is-promo { color: #ff5722; }

.price-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  flex-wrap: wrap;
}
.price-list {
  font-size: 10.5px;
  line-height: 1;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.42);
  text-decoration: line-through;
}
.price-off {
  font-size: 10.5px;
  line-height: 1;
  font-weight: 800;
  color: #00a650; /* verde — descuento contado normal */
}
.price-off.is-promo {
  color: #fff;
  background: #ff5722;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.2px;
}

.btn-action {
  width: 30px !important;
  height: 30px !important;
  min-width: 30px !important;
  border-radius: 8px !important;
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

/* Botón en estado "ya en carrito" (verde + ícono mdi-cart-check) */
.btn-action--in-cart {
  background: rgb(var(--v-theme-success)) !important;
  color: #fff !important;
  box-shadow: 0 2px 8px rgba(var(--v-theme-success), 0.42) !important;
}

.btn-action--in-cart:hover {
  box-shadow: 0 4px 12px rgba(var(--v-theme-success), 0.56) !important;
}

/* Contenedor del botón + badge de cantidad */
.btn-action-wrap {
  position: relative;
  flex-shrink: 0;
}

.btn-qty-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: rgb(var(--v-theme-error));
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  line-height: 18px;
  text-align: center;
  border: 2px solid rgb(var(--v-theme-surface));
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22);
  pointer-events: none;
  font-feature-settings: "tnum";
}

/* Card en estado PROMO: borde naranja + glow sutil para que se distinga */
.prow.is-promo {
  border-color: rgba(255, 87, 34, 0.55);
  box-shadow:
    0 0 0 1px rgba(255, 87, 34, 0.25),
    0 4px 14px rgba(255, 87, 34, 0.12),
    var(--row-shadow);
}
.prow.is-promo:hover {
  border-color: rgba(255, 87, 34, 0.75);
  box-shadow:
    0 0 0 1px rgba(255, 87, 34, 0.40),
    0 8px 22px rgba(255, 87, 34, 0.18),
    var(--row-shadow-hover);
}
.prow.is-promo::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(
    180deg,
    rgba(255, 87, 34, 0.06) 0%,
    rgba(255, 87, 34, 0) 50%
  );
  z-index: 1;
}

/* Si está en carrito Y en promo, prevalece el verde (cart) pero con tint naranja sutil */
.prow.in-cart.is-promo {
  border-color: rgba(255, 87, 34, 0.55);
  box-shadow:
    0 0 0 1px rgba(255, 87, 34, 0.30),
    0 0 0 2px rgba(var(--v-theme-success), 0.18),
    var(--row-shadow);
}

/* Card en estado "en carrito": borde verde + badge sutil en esquina */
.prow.in-cart {
  border-color: rgba(var(--v-theme-success), 0.55);
  box-shadow:
    0 0 0 1px rgba(var(--v-theme-success), 0.28),
    var(--row-shadow);
}

.prow.in-cart:hover {
  border-color: rgba(var(--v-theme-success), 0.75);
  box-shadow:
    0 0 0 1px rgba(var(--v-theme-success), 0.4),
    var(--row-shadow-hover);
}

.prow.in-cart::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(
    180deg,
    rgba(var(--v-theme-success), 0.06) 0%,
    rgba(var(--v-theme-success), 0) 50%
  );
  z-index: 1;
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
