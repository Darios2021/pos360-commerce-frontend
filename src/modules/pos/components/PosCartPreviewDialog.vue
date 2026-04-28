<template>
  <v-dialog
    :model-value="modelValue"
    max-width="920"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="cart-modal">
      <PosDialogHeader
        eyebrow="Carrito"
        title="Carrito actual"
        :subtitle="itemCountLabel"
        @close="emit('update:modelValue', false)"
      />

      <v-divider />

      <div class="cart-modal__body">
        <div v-if="normalizedItems.length" class="cart-modal__list">
          <article
            v-for="(item, index) in normalizedItems"
            :key="item.id || item.product_id || index"
            class="cart-item"
          >
            <!-- Miniatura -->
            <div class="cart-item__media">
              <v-img
                v-if="itemImage(item)"
                :src="itemImage(item)"
                :aspect-ratio="1"
                cover
                class="cart-item__img"
              />
              <div v-else class="cart-item__noimg">
                <v-icon size="22">mdi-package-variant-closed</v-icon>
              </div>
              <span
                v-if="item.stock !== null"
                class="cart-item__stock"
                :class="stockLevelClass(item.stock)"
                :title="`Stock: ${item.stock}`"
              >
                {{ item.stock }}
              </span>
            </div>

            <!-- Info -->
            <div class="cart-item__main">
              <div class="cart-item__name" :title="item.name">
                {{ item.name }}
              </div>
              <div class="cart-item__meta">
                <span v-if="item.sku" class="cart-meta-chip">
                  SKU {{ item.sku }}
                </span>
                <span v-if="item.barcode && item.barcode !== item.sku" class="cart-meta-chip">
                  {{ item.barcode }}
                </span>
                <span class="cart-item__unit">
                  {{ formatMoney(item.unitPrice) }}
                  <span class="cart-item__unit-sfx">c/u</span>
                </span>
              </div>
            </div>

            <!-- Cantidad -->
            <div class="cart-item__qty">
              <span class="cart-item__qty-label">Cant.</span>
              <strong>{{ formatQty(item.qty) }}</strong>
            </div>

            <!-- Total línea -->
            <div class="cart-item__total">
              {{ formatMoney(item.lineTotal) }}
            </div>
          </article>
        </div>

        <div v-else class="cart-modal__empty">
          <div class="cart-modal__empty-icon-wrap">
            <v-icon size="32">mdi-cart-off</v-icon>
          </div>
          <div class="cart-modal__empty-title">El carrito está vacío</div>
          <div class="cart-modal__empty-text">
            Agregá productos desde el catálogo para poder cobrar.
          </div>
        </div>
      </div>

      <v-divider />

      <div class="cart-modal__footer">
        <div class="cart-modal__totals">
          <div class="cart-stat">
            <span class="cart-stat__label">Ítems</span>
            <strong class="cart-stat__value">{{ totalQty }}</strong>
          </div>
          <div class="cart-stat cart-stat--grand">
            <span class="cart-stat__label">Total</span>
            <strong class="cart-stat__value">{{ formatMoney(totalAmountComputed) }}</strong>
          </div>
        </div>

        <div class="cart-modal__actions">
          <v-btn
            variant="text"
            size="small"
            @click="emit('update:modelValue', false)"
          >
            Cerrar
          </v-btn>

          <v-btn
            color="success"
            variant="flat"
            size="small"
            prepend-icon="mdi-cash-register"
            :disabled="!normalizedItems.length"
            @click="handleGoPay"
          >
            Ir a cobrar
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from "vue";
import PosDialogHeader from "./shared/PosDialogHeader.vue";
import { usePosImages } from "../composables/usePosImages";

const { productImage } = usePosImages();

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  totalAmount: { type: Number, default: null },
  currency: { type: String, default: "ARS" },
});

const emit = defineEmits(["update:modelValue", "go-pay"]);

const normalizedItems = computed(() => {
  return (props.items || []).map((item, index) => {
    const qty = Number(
      item?.qty ?? item?.quantity ?? item?.cant ?? 1
    );
    const unitPrice = Number(
      item?.unit_price ??
        item?.unitPrice ??
        item?.price ??
        item?.precio ??
        0
    );
    const lineTotalRaw =
      item?.line_total ??
      item?.lineTotal ??
      item?.total ??
      item?.subtotal;
    const lineTotal = Number(lineTotalRaw ?? qty * unitPrice);

    const stockRaw =
      item?.available_qty ??
      item?.availableQty ??
      item?.stock_qty ??
      item?.stockQty ??
      item?.stock ??
      null;
    const stockNum = Number(stockRaw);
    const stock =
      stockRaw === null || stockRaw === undefined || !Number.isFinite(stockNum)
        ? null
        : Math.max(0, Math.floor(stockNum));

    return {
      id: item?.id ?? `row-${index}`,
      product_id: item?.product_id ?? item?.productId ?? null,
      name:
        item?.name ??
        item?.nombre ??
        item?.title ??
        item?.product_name ??
        "Producto",
      sku: item?.sku ?? item?.code ?? item?.codigo ?? "",
      barcode: item?.barcode ?? item?.bar_code ?? "",
      qty: Number.isFinite(qty) ? qty : 1,
      unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
      lineTotal: Number.isFinite(lineTotal) ? lineTotal : 0,
      stock,
      raw: item,
    };
  });
});

const totalQty = computed(() =>
  normalizedItems.value.reduce((acc, it) => acc + Number(it.qty || 0), 0)
);

const totalAmountComputed = computed(() => {
  if (props.totalAmount !== null && props.totalAmount !== undefined) {
    const explicit = Number(props.totalAmount);
    if (Number.isFinite(explicit)) return explicit;
  }
  return normalizedItems.value.reduce(
    (acc, it) => acc + Number(it.lineTotal || 0),
    0
  );
});

const itemCountLabel = computed(() => {
  const count = normalizedItems.value.length;
  if (count === 1) return "1 producto en carrito";
  return `${count} productos en carrito`;
});

function itemImage(item) {
  const raw = item?.raw || item;
  const direct =
    raw?.image ||
    raw?.image_url ||
    raw?.imageUrl ||
    raw?.imagen ||
    raw?.thumbnail ||
    "";
  if (direct) return direct;
  const id = Number(raw?.id || raw?.product_id || 0);
  if (!id) return "";
  return productImage({ id });
}

function stockLevelClass(n) {
  const v = Number(n || 0);
  if (v <= 0) return "stock-out";
  if (v < 5) return "stock-low";
  if (v <= 10) return "stock-mid";
  return "stock-high";
}

function formatQty(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function formatMoney(value) {
  const n = Number(value || 0);
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: props.currency || "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(n) ? n : 0);
  } catch {
    return `$ ${Number.isFinite(n) ? n.toFixed(2) : "0.00"}`;
  }
}

function handleGoPay() {
  emit("go-pay");
  emit("update:modelValue", false);
}
</script>

<style scoped>
.cart-modal {
  border-radius: 18px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 0 0 1px rgba(var(--v-theme-primary), 0.08),
    0 24px 56px rgba(0, 0, 0, 0.55);
}

.cart-modal__body {
  max-height: 64vh;
  overflow: auto;
  padding: 12px 18px 16px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
}

.cart-modal__body::-webkit-scrollbar {
  width: 8px;
}

.cart-modal__body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 999px;
}

.cart-modal__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ─── Cart item ────────────────────────────────────────────── */
.cart-item {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition:
    border-color 0.14s ease,
    background 0.14s ease;
}

.cart-item:hover {
  border-color: rgba(var(--v-theme-primary), 0.32);
  background: rgba(255, 255, 255, 0.06);
}

/* Miniatura con badge de stock */
.cart-item__media {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-item__img {
  width: 100%;
  height: 100%;
}

.cart-item__img :deep(.v-img__img),
.cart-item__img :deep(img) {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.cart-item__noimg {
  color: rgba(255, 255, 255, 0.3);
}

.cart-item__stock {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  color: #fff;
  font-feature-settings: "tnum";
  border: 2px solid rgb(var(--v-theme-surface));
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.28);
}

.cart-item__stock.stock-high {
  background: rgb(var(--v-theme-success));
}

.cart-item__stock.stock-mid {
  background: rgb(var(--v-theme-warning));
}

.cart-item__stock.stock-low,
.cart-item__stock.stock-out {
  background: rgb(var(--v-theme-error));
}

/* Info principal */
.cart-item__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cart-item__name {
  font-size: 13px;
  font-weight: 400;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: -0.005em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cart-item__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.cart-meta-chip {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.65);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.02em;
  line-height: 1.5;
  white-space: nowrap;
}

.cart-item__unit {
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
  font-feature-settings: "tnum";
  white-space: nowrap;
}

.cart-item__unit-sfx {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 500;
  margin-left: 2px;
}

/* Cantidad */
.cart-item__qty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.1);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  min-width: 52px;
}

.cart-item__qty-label {
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
}

.cart-item__qty strong {
  font-size: 15px;
  font-weight: 500;
  color: rgb(var(--v-theme-primary));
  letter-spacing: -0.01em;
  font-feature-settings: "tnum";
  line-height: 1.1;
}

/* Total línea */
.cart-item__total {
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: rgba(255, 255, 255, 0.96);
  font-feature-settings: "tnum";
  text-align: right;
  white-space: nowrap;
  min-width: 100px;
}

/* Empty state */
.cart-modal__empty {
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  text-align: center;
  padding: 40px 20px;
}

.cart-modal__empty-icon-wrap {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 4px;
}

.cart-modal__empty-title {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
}

.cart-modal__empty-text {
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.55);
  max-width: 280px;
  line-height: 1.4;
}

/* Footer */
.cart-modal__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px 16px;
  background: rgba(255, 255, 255, 0.02);
}

.cart-modal__totals {
  display: flex;
  align-items: center;
  gap: 16px;
}

.cart-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cart-stat__label {
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
}

.cart-stat__value {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: -0.01em;
  font-feature-settings: "tnum";
}

.cart-stat--grand .cart-stat__value {
  font-size: 20px;
  font-weight: 500;
  color: rgb(var(--v-theme-primary));
}

.cart-modal__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Responsive */
@media (max-width: 760px) {
  .cart-item {
    grid-template-columns: 52px minmax(0, 1fr) auto;
    grid-template-rows: auto auto;
    gap: 10px;
  }

  .cart-item__qty {
    grid-row: 1;
    grid-column: 3;
  }

  .cart-item__total {
    grid-row: 2;
    grid-column: 1 / -1;
    text-align: right;
    font-size: 13px;
  }

  .cart-modal__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .cart-modal__actions {
    width: 100%;
  }

  .cart-modal__actions :deep(.v-btn) {
    flex: 1 1 auto;
  }
}
</style>
