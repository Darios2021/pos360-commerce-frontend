<template>
  <div class="cart-card">
    <!-- Header -->
    <div class="cart-head">
      <div class="cart-head-left">
        <div class="cart-icon-wrap">
          <v-icon size="16">mdi-cart</v-icon>
        </div>

        <div class="cart-head-text">
          <span class="cart-title">Carrito</span>
          <span class="cart-sub" v-if="(cart || []).length > 0">
            {{ totalItems }} ítems cargados
          </span>
        </div>
      </div>

      <v-chip class="cart-chip" size="small" variant="tonal">
        {{ totalItems }} ítems
      </v-chip>
    </div>

    <div class="cart-divider" />

    <!-- Body -->
    <div class="cart-body">
      <div v-if="(cart || []).length === 0" class="empty">
        <div class="empty-box">
          <div class="empty-icon-wrap">
            <v-icon size="30">mdi-cart-off</v-icon>
          </div>
          <div class="empty-title">Carrito vacío</div>
          <div class="empty-sub">Agregá productos desde la lista.</div>
        </div>
      </div>

      <div v-else class="cart-items">
        <article
          v-for="it in cart"
          :key="itKey(it)"
          class="cart-item"
        >
          <div class="item-shell">
            <!-- Row 1: name + subtotal -->
            <div class="item-row-top">
              <div class="item-name" :title="it?.name || ''">
                {{ it?.name || "—" }}
              </div>
              <span class="item-total">{{ money(lineTotal(it)) }}</span>
            </div>

            <!-- Row 2: price/stock + qty controls + trash -->
            <div class="item-row-bot">
              <span class="unit-price">{{ money(unitPriceEffective(it)) }}</span>
              <span class="unit-suffix">c/u</span>
              <span v-if="stockText(it)" class="stock-hint">{{ stockText(it) }}</span>
              <div class="row-bot-spacer" />
              <div class="qty-box">
                <v-btn
                  class="qty-btn"
                  size="small"
                  density="compact"
                  variant="tonal"
                  icon="mdi-minus"
                  :disabled="!canEdit"
                  @click="dec(it)"
                />
                <v-text-field
                  v-model="qtyDraft[itKey(it)]"
                  class="qty-input"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!canEdit"
                  inputmode="decimal"
                  @blur="commit(it)"
                  @keyup.enter="commit(it)"
                />
                <v-btn
                  class="qty-btn"
                  size="small"
                  density="compact"
                  variant="tonal"
                  icon="mdi-plus"
                  :disabled="!canEdit || isIncDisabled(it)"
                  @click="inc(it)"
                />
              </div>
              <v-btn
                class="trash-btn"
                size="small"
                density="compact"
                variant="tonal"
                icon="mdi-trash-can-outline"
                color="error"
                :disabled="!canEdit"
                @click="remove(it)"
              />
            </div>
          </div>
        </article>

        <div class="cart-bottom-gap" />
      </div>
    </div>

    <!-- Footer -->
    <div class="cart-foot">
      <div class="foot-card">
        <div class="total-row">
          <div class="total-label-group">
            <span class="total-label">Total</span>
            <span class="total-price-mode">Precio contado</span>
          </div>
          <span class="total-amt">{{ money(total) }}</span>
        </div>

        <v-btn
          block
          color="success"
          class="pay-btn"
          :disabled="(cart || []).length === 0 || !canEdit"
          @click="$emit('checkout')"
        >
          <v-icon start size="16">mdi-cash-register</v-icon>
          COBRAR (F9)
        </v-btn>

        <div v-if="!canEdit" class="cart-lock text-caption text-medium-emphasis">
          🔒 Solo vista
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { reactive, watch } from "vue";
import { useSnackbar } from "../composables/useSnackbar";

const props = defineProps({
  cart: { type: Array, default: () => [] },
  totalItems: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  canEdit: { type: Boolean, default: true },
  posStore: { type: Object, default: null },
});

defineEmits(["checkout"]);

function toNum(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function money(val) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNum(val));
}

function qty3(n) {
  return toNum(n).toFixed(3);
}

function itKey(it) {
  return String(it?.id ?? it?.product_id ?? it?.productId ?? "");
}

function parseQty(raw) {
  if (raw === null || raw === undefined) return 0;
  const s = String(raw).trim().replace(/\s+/g, "");
  const normalized = s.replace(",", ".");
  const cleaned = normalized.replace(/[^0-9.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function round3(n) {
  return Math.round(toNum(n) * 1000) / 1000;
}

function clampQtyMin(q) {
  const min = 0.001;
  if (!(q > 0)) return 0;
  return Math.max(min, q);
}

function pickFirstNumber(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    const n = toNum(v);
    if (n > 0) return n;
  }
  return 0;
}

function unitPriceEffective(it) {
  if (!it) return 0;

  const meta =
    it?.__pos_pricing && typeof it.__pos_pricing === "object"
      ? it.__pos_pricing
      : null;

  const discountPrice =
    pickFirstNumber(it, [
      "price_discount",
      "discount_price",
      "discountPrice",
      "priceDiscount",
      "discount_unit_price",
      "discountUnitPrice",
    ]) ||
    pickFirstNumber(meta, [
      "price_discount",
      "discount_price",
      "discountPrice",
      "priceDiscount",
      "discount_unit_price",
      "discountUnitPrice",
    ]);

  if (discountPrice > 0) return discountPrice;

  const explicitPrice =
    pickFirstNumber(it, [
      "unit_price",
      "unitPrice",
      "final_price",
      "finalPrice",
    ]) ||
    pickFirstNumber(meta, [
      "unit_price",
      "unitPrice",
      "final_price",
      "finalPrice",
    ]);

  if (explicitPrice > 0) return explicitPrice;

  const policy = String(
    it?.price_policy ||
      it?.pricePolicy ||
      meta?.price_policy ||
      meta?.pricePolicy ||
      ""
  ).toUpperCase();

  if (policy === "DISCOUNT") {
    const byPolicy =
      pickFirstNumber(it, ["price", "amount", "value"]) ||
      pickFirstNumber(meta, ["price", "amount", "value"]);

    if (byPolicy > 0) return byPolicy;
  }

  return (
    pickFirstNumber(it, [
      "price",
      "unitPriceValue",
      "unit_price_value",
      "list_price",
      "price_list",
    ]) ||
    pickFirstNumber(meta, [
      "price",
      "unitPriceValue",
      "unit_price_value",
      "list_price",
      "price_list",
    ])
  );
}

function lineTotal(it) {
  return round3(toNum(it?.qty) * toNum(unitPriceEffective(it)));
}

function maxQtyForItem(it) {
  const candidates = [
    it?.available_qty,
    it?.availableQty,
    it?.qty_available,
    it?.qtyAvailable,
    it?.stock,
    it?.stock_qty,
    it?.stockQty,
    it?.qty_stock,
    it?.qtyStock,
  ];

  for (const v of candidates) {
    const n = toNum(v);
    if (n > 0) return n;
  }

  return null;
}

function stockText(it) {
  const m = maxQtyForItem(it);
  if (!(m > 0)) return "";
  return `Stock: ${qty3(m)}`;
}

function clampQtyToStock(it, q) {
  const m = maxQtyForItem(it);
  if (!(m > 0)) return q;
  return Math.min(q, m);
}

function isIncDisabled(it) {
  const m = maxQtyForItem(it);
  if (!(m > 0)) return false;
  return toNum(it?.qty) >= m - 0.0005;
}

const qtyDraft = reactive({});

function syncDraftFromCart() {
  for (const it of props.cart || []) {
    const k = itKey(it);
    if (!k) continue;
    qtyDraft[k] = qty3(it.qty);
  }

  const keys = new Set((props.cart || []).map((x) => itKey(x)));
  for (const k of Object.keys(qtyDraft)) {
    if (!keys.has(k)) delete qtyDraft[k];
  }
}

watch(
  () => props.cart,
  () => syncDraftFromCart(),
  { deep: true, immediate: true }
);

function setQtyInStore(it, qty) {
  const store = props.posStore;
  const candidates = [
    "setQty",
    "updateQty",
    "setItemQty",
    "updateItemQty",
    "changeQty",
  ];

  if (store) {
    for (const fn of candidates) {
      if (typeof store[fn] === "function") {
        store[fn](it, qty);
        return true;
      }
    }
  }

  it.qty = qty;
  it.subtotal = round3(toNum(unitPriceEffective(it)) * toNum(it.qty));
  return true;
}

function removeFromStore(it) {
  const store = props.posStore;
  const candidates = [
    "removeFromCart",
    "removeItem",
    "removeCartItem",
    "deleteFromCart",
  ];

  if (store) {
    for (const fn of candidates) {
      if (typeof store[fn] === "function") {
        store[fn](it);
        return true;
      }
    }
  }

  const arr = props.cart || [];
  const idx = arr.findIndex((x) => itKey(x) === itKey(it));
  if (idx >= 0) arr.splice(idx, 1);
  return true;
}

const { toast } = useSnackbar();

function commit(it) {
  const k = itKey(it);
  let q = clampQtyMin(round3(parseQty(qtyDraft[k])));

  if (q <= 0) {
    remove(it);
    return;
  }

  const max = maxQtyForItem(it);
  const clamped = clampQtyToStock(it, q);

  if (max && clamped < q) {
    toast(`⚠️ No hay stock suficiente. Máximo: ${qty3(max)}`);
  }

  q = clamped;
  setQtyInStore(it, q);
  qtyDraft[k] = qty3(it.qty);
}

function inc(it) {
  const current = toNum(it.qty);
  const desired = round3(current + 1);

  const max = maxQtyForItem(it);
  const next = clampQtyToStock(it, desired);

  if (max && next < desired) {
    toast(`⚠️ Sin stock. Máximo: ${qty3(max)}`);
    setQtyInStore(it, next);
    qtyDraft[itKey(it)] = qty3(it.qty);
    return;
  }

  setQtyInStore(it, next);
  qtyDraft[itKey(it)] = qty3(it.qty);
}

function dec(it) {
  const next = round3(toNum(it.qty) - 1);

  if (next <= 0) {
    remove(it);
    return;
  }

  setQtyInStore(it, next);
  qtyDraft[itKey(it)] = qty3(it.qty);
}

function remove(it) {
  removeFromStore(it);
}
</script>

<style scoped>
.cart-card {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background:
    linear-gradient(
      180deg,
      rgba(var(--v-theme-surface), 0.985) 0%,
      rgba(var(--v-theme-surface), 1) 100%
    );
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.cart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  padding: 7px 10px 6px;
}

.cart-head-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.cart-icon-wrap {
  width: 30px;
  height: 30px;
  min-width: 30px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: rgba(var(--v-theme-primary), 0.10);
  border: 1px solid rgba(var(--v-theme-primary), 0.14);
}

.cart-head-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.cart-title {
  font-weight: 900;
  font-size: 13px;
  line-height: 1.1;
  letter-spacing: 0.01em;
}

.cart-sub {
  font-size: 11px;
  line-height: 1.1;
  color: rgba(var(--v-theme-on-surface), 0.58);
}

.cart-chip {
  height: 24px !important;
  min-height: 24px !important;
  border-radius: 999px !important;
  font-weight: 800 !important;
}

.cart-divider {
  height: 1px;
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.cart-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 8px 8px 0;
  scrollbar-gutter: stable;
  scrollbar-width: auto;
  scrollbar-color: rgba(var(--v-theme-primary), 0.40) rgba(0, 0, 0, 0.05);
}

.cart-body::-webkit-scrollbar {
  width: 9px;
}

.cart-body::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 999px;
}

.cart-body::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.42);
  border-radius: 999px;
  border: 2px solid rgba(0, 0, 0, 0.05);
}

.cart-body::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-primary), 0.62);
}

.empty {
  padding: 2px 0 10px;
}

.empty-box {
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.15);
  border-radius: 16px;
  padding: 16px 12px;
  background:
    linear-gradient(
      180deg,
      rgba(var(--v-theme-on-surface), 0.018) 0%,
      rgba(var(--v-theme-on-surface), 0.028) 100%
    );
  text-align: center;
}

.empty-icon-wrap {
  width: 52px;
  height: 52px;
  margin: 0 auto 8px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.empty-title {
  font-size: 13px;
  font-weight: 900;
  line-height: 1.05;
}

.empty-sub {
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.cart-item {
  display: block;
}

.item-shell {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  border-radius: 8px;
  padding: 6px 8px;
  background: rgba(var(--v-theme-surface), 1);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  transition: border-color 0.14s ease;
}

.item-shell:hover {
  border-color: rgba(var(--v-theme-primary), 0.2);
}

/* Row 1: name + subtotal */
.item-row-top {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.item-name {
  flex: 1 1 0;
  min-width: 0;
  font-size: 12px;
  line-height: 1.2;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-total {
  flex: 0 0 auto;
  font-size: 13px;
  line-height: 1;
  font-weight: 800;
  white-space: nowrap;
}

/* Row 2: price/stock + controls */
.item-row-bot {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 5px;
  min-width: 0;
}

.unit-price {
  font-size: 11px;
  font-weight: 700;
  opacity: 0.7;
  white-space: nowrap;
}

.unit-suffix {
  font-size: 10px;
  opacity: 0.5;
}

.stock-hint {
  font-size: 10px;
  opacity: 0.7;
  padding: 1px 5px;
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.08);
  border: 1px solid rgba(var(--v-theme-primary), 0.10);
  white-space: nowrap;
}

.row-bot-spacer {
  flex: 1 1 auto;
}

.qty-box {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 30px 60px 30px;
  gap: 4px;
  align-items: center;
}

.qty-btn {
  width: 30px !important;
  height: 30px !important;
  min-width: 30px !important;
  border-radius: 8px !important;
}

.trash-btn {
  width: 30px !important;
  height: 30px !important;
  min-width: 30px !important;
  border-radius: 8px !important;
  margin-left: 4px;
}

.qty-input {
  width: 100%;
}

.qty-input :deep(.v-field) {
  border-radius: 6px !important;
  background: rgba(var(--v-theme-on-surface), 0.025);
}

.qty-input :deep(.v-field__outline) {
  opacity: 0.6;
}

.qty-input :deep(.v-field__input) {
  min-height: 30px;
  padding-top: 2px;
  padding-bottom: 2px;
  padding-left: 4px;
  padding-right: 4px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
}

.cart-bottom-gap {
  height: 10px;
}

.cart-foot {
  flex: 0 0 auto;
  padding: 7px 8px 8px;
  background: rgba(var(--v-theme-surface), 0.98);
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.foot-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  border-radius: 10px;
  padding: 8px;
  background:
    linear-gradient(
      180deg,
      rgba(var(--v-theme-surface), 1) 0%,
      rgba(var(--v-theme-on-surface), 0.018) 100%
    );
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.035);
}

.total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.total-label-group {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.total-label {
  font-size: 12px;
  font-weight: 900;
}

.total-price-mode {
  font-size: 10px;
  font-weight: 500;
  opacity: 0.5;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.total-amt {
  font-size: 19px;
  line-height: 1;
  font-weight: 900;
  white-space: nowrap;
}

.pay-btn {
  margin-top: 10px;
  height: 42px !important;
  border-radius: 13px !important;
  font-size: 13px !important;
  font-weight: 900 !important;
  letter-spacing: 0.02em;
  text-transform: none !important;
}

.cart-lock {
  margin-top: 6px;
  line-height: 1.1;
}

@media (max-width: 1366px) {
  .cart-head {
    padding: 9px 10px 8px;
  }

  .cart-body {
    padding: 9px 9px 0;
  }

  .cart-foot {
    padding: 9px;
  }

  .item-shell {
    padding: 9px;
  }

  .item-name {
    font-size: 12px;
  }

  .item-total {
    font-size: 14px;
  }

  .total-amt {
    font-size: 18px;
  }

  .pay-btn {
    height: 40px !important;
  }
}

@media (max-width: 640px) {
  .item-main {
    grid-template-columns: 1fr;
  }

  .item-total-box {
    align-items: flex-start;
    min-width: 0;
  }

  .item-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .trash-btn {
    width: 100% !important;
    height: 36px !important;
  }
}

@media (max-width: 420px) {
  .cart-head {
    padding: 8px 8px 7px;
  }

  .cart-body {
    padding: 8px 8px 0;
  }

  .cart-foot {
    padding: 8px;
  }

  .qty-box {
    grid-template-columns: 32px minmax(0, 1fr) 32px;
  }

  .qty-btn {
    width: 32px !important;
    height: 32px !important;
    min-width: 32px !important;
  }

  .qty-input :deep(.v-field__input) {
    min-height: 32px;
    font-size: 12px;
  }

  .pay-btn {
    height: 38px !important;
    font-size: 13px !important;
  }
}
</style>