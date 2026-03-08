<template>
  <div class="cart-card">
    <!-- Header -->
    <div class="cart-head">
      <div class="cart-head-left">
        <v-icon size="16">mdi-cart</v-icon>
        <span class="cart-title">Carrito</span>
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
          <v-icon size="36" class="mb-1">mdi-cart-off</v-icon>
          <div class="empty-title">Carrito vacío</div>
          <div class="empty-sub">Agregá productos desde la lista.</div>
        </div>
      </div>

      <div v-else class="cart-items">
        <div v-for="it in cart" :key="itKey(it)" class="cart-item">
          <div class="item-top">
            <div class="item-name" :title="it?.name || ''">
              {{ it?.name || "—" }}
            </div>

            <div class="item-total">
              {{ money(lineTotal(it)) }}
            </div>
          </div>

          <div class="item-mid">
            <span class="unit-price">{{ money(unitPriceEffective(it)) }}</span>
            <span class="unit-suffix">c/u</span>
            <span v-if="stockText(it)" class="stock-hint">· {{ stockText(it) }}</span>
          </div>

          <div class="item-bot">
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

            <div class="bot-spacer" />

            <v-btn
              class="trash-btn"
              size="small"
              density="compact"
              variant="tonal"
              icon="mdi-trash-can-outline"
              color="red"
              :disabled="!canEdit"
              @click="remove(it)"
            />
          </div>
        </div>

        <div class="cart-bottom-gap" />
      </div>
    </div>

    <!-- Footer -->
    <div class="cart-foot">
      <div class="total-row">
        <span class="total-label">Total</span>
        <span class="total-amt">{{ money(total) }}</span>
      </div>

      <v-btn
        block
        color="primary"
        class="pay-btn"
        :disabled="(cart || []).length === 0 || !canEdit"
        @click="$emit('checkout')"
      >
        Cobrar
      </v-btn>

      <div v-if="!canEdit" class="cart-lock text-caption text-medium-emphasis">
        🔒 Solo vista (no puede editar ni vender).
      </div>
    </div>

    <v-snackbar v-model="snack.show" :timeout="2400">
      {{ snack.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { reactive, watch } from "vue";

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

/* =========================================================
   ✅ PRECIO EFECTIVO (SIEMPRE PRIORIZAR DESCUENTO)
========================================================= */
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

  const meta = it?.__pos_pricing && typeof it.__pos_pricing === "object"
    ? it.__pos_pricing
    : null;

  // 1) SIEMPRE precio descuento primero
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

  // 2) unit price / final price explícito
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

  // 3) si vino policy DISCOUNT, usar price antes que nada
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

  // 4) fallback final
  return (
    pickFirstNumber(it, ["price", "unitPriceValue", "unit_price_value", "list_price", "price_list"]) ||
    pickFirstNumber(meta, ["price", "unitPriceValue", "unit_price_value", "list_price", "price_list"])
  );
}

function lineTotal(it) {
  return round3(toNum(it?.qty) * toNum(unitPriceEffective(it)));
}

/* stock helpers */
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

/* Draft qty */
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

/* store mutations */
function setQtyInStore(it, qty) {
  const store = props.posStore;
  const candidates = ["setQty", "updateQty", "setItemQty", "updateItemQty", "changeQty"];

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
  const candidates = ["removeFromCart", "removeItem", "removeCartItem", "deleteFromCart"];

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

/* snack */
const snack = reactive({ show: false, text: "" });

function toast(text) {
  snack.text = text;
  snack.show = true;
}

/* UI actions */
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

  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(var(--v-theme-surface), 0.99) 0%, rgba(var(--v-theme-surface), 1) 100%);
}

.cart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  padding: 8px 10px;
  min-width: 0;
}

.cart-head-left {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.cart-title {
  font-weight: 900;
  font-size: 13px;
  line-height: 1.1;
}

.cart-chip {
  height: 24px !important;
  min-height: 24px !important;
  border-radius: 999px !important;
}

.cart-divider {
  height: 1px;
  background: rgba(var(--v-theme-on-surface), 0.08);
}

/* BODY */
.cart-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 8px 10px 0;
  scrollbar-gutter: stable;

  scrollbar-width: auto;
  scrollbar-color: rgba(0, 0, 0, 0.28) rgba(0, 0, 0, 0.05);
}

.cart-body::-webkit-scrollbar {
  width: 10px;
}

.cart-body::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 999px;
}

.cart-body::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.45);
  border-radius: 999px;
  border: 2px solid rgba(0, 0, 0, 0.05);
}

.cart-body::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-primary), 0.70);
}

/* EMPTY */
.empty {
  padding: 4px 0 8px;
}

.empty-box {
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.15);
  border-radius: 14px;
  padding: 12px 10px;
  background: rgba(var(--v-theme-on-surface), 0.018);
  text-align: center;
}

.empty-title {
  margin-top: 2px;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.1;
}

.empty-sub {
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

/* ITEMS */
.cart-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cart-item {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 12px;
  padding: 8px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease,
    box-shadow 0.16s ease;
}

.cart-item:hover {
  border-color: rgba(var(--v-theme-primary), 0.22);
  background: rgba(var(--v-theme-primary), 0.03);
  box-shadow: 0 8px 18px rgba(var(--v-theme-primary), 0.07);
}

.item-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.item-name {
  min-width: 0;
  font-size: 12px;
  line-height: 1.15;
  font-weight: 850;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-total {
  flex: 0 0 auto;
  font-size: 12.5px;
  line-height: 1;
  font-weight: 950;
  white-space: nowrap;
}

.item-mid {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: baseline;
  color: rgba(var(--v-theme-on-surface), 0.68);
}

.unit-price {
  font-size: 11.25px;
  font-weight: 800;
}

.unit-suffix,
.stock-hint {
  font-size: 10.5px;
  opacity: 0.76;
}

.item-bot {
  margin-top: 6px;
  display: grid;
  grid-template-columns: 30px 72px 30px 1fr 30px;
  align-items: center;
  gap: 6px;
}

.bot-spacer {
  min-width: 0;
}

.qty-btn {
  width: 30px !important;
  height: 30px !important;
  min-width: 30px !important;
  border-radius: 999px !important;
}

.trash-btn {
  width: 30px !important;
  height: 30px !important;
  min-width: 30px !important;
  border-radius: 10px !important;
}

.qty-input {
  width: 72px;
}

.qty-input :deep(.v-field) {
  border-radius: 10px !important;
}

.qty-input :deep(.v-field__input) {
  min-height: 30px;
  padding-top: 4px;
  padding-bottom: 4px;
  text-align: center;
  font-size: 12px;
  font-weight: 900;
}

.cart-bottom-gap {
  height: 8px;
}

/* FOOTER */
.cart-foot {
  flex: 0 0 auto;
  padding: 8px 10px 10px;
  background: rgba(var(--v-theme-surface), 0.98);
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.total-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.total-label {
  font-size: 12px;
  font-weight: 900;
}

.total-amt {
  font-size: 16px;
  line-height: 1;
  font-weight: 1000;
  white-space: nowrap;
}

.pay-btn {
  margin-top: 8px;
  height: 34px !important;
  border-radius: 12px !important;
  font-size: 12px !important;
  font-weight: 950 !important;
  letter-spacing: 0.02em;
  text-transform: none !important;
}

.cart-lock {
  margin-top: 6px;
  line-height: 1.2;
}

/* NOTEBOOK */
@media (max-width: 1366px) {
  .cart-head {
    padding: 7px 9px;
  }

  .cart-body {
    padding: 7px 9px 0;
  }

  .cart-foot {
    padding: 7px 9px 9px;
  }

  .cart-title {
    font-size: 12.5px;
  }

  .item-name {
    font-size: 11.5px;
  }

  .item-total {
    font-size: 12px;
  }

  .total-amt {
    font-size: 15px;
  }
}

@media (max-width: 420px) {
  .item-bot {
    grid-template-columns: 30px 1fr 30px;
  }

  .qty-input {
    width: 100%;
  }

  .trash-btn {
    grid-column: 1 / -1;
    justify-self: end;
  }
}
</style>