<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosCartPanel.vue -->
<template>
  <v-card class="rounded-xl cart-card" elevation="1">
    <!-- Header -->
    <div class="cart-head px-4 py-3 d-flex justify-space-between align-center">
      <div class="d-flex align-center ga-2">
        <v-icon>mdi-cart</v-icon>
        <span class="cart-title">Carrito</span>
      </div>

      <v-chip size="small" variant="tonal">
        {{ totalItems }} ítems
      </v-chip>
    </div>

    <v-divider />

    <!-- Body -->
    <div class="cart-body px-4 pt-3">
      <div v-if="(cart || []).length === 0" class="empty text-center">
        <v-icon size="56" class="mb-2">mdi-cart-off</v-icon>
        <div class="font-weight-bold">Carrito vacío</div>
      </div>

      <div v-else class="cart-items">
        <div v-for="it in cart" :key="itKey(it)" class="cart-item">
          <!-- LINEA 1: nombre + total -->
          <div class="row-top">
            <div class="name" :title="it?.name || ''">{{ it?.name || "—" }}</div>
            <div class="line-total">{{ money(lineTotal(it)) }}</div>
          </div>

          <!-- LINEA 2: unit + qty + trash -->
          <div class="row-bot">
            <div class="unit">
              <span class="unit-price">{{ money(it.price) }}</span>
              <span class="unit-suffix">c/u</span>
              <span v-if="stockText(it)" class="stock-hint">
                · {{ stockText(it) }}
              </span>
            </div>

            <div class="qty">
              <v-btn
                class="qty-btn"
                size="x-small"
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
                size="x-small"
                variant="tonal"
                icon="mdi-plus"
                :disabled="!canEdit || isIncDisabled(it)"
                @click="inc(it)"
              />

              <v-btn
                class="trash-btn"
                size="x-small"
                variant="text"
                icon="mdi-trash-can-outline"
                color="red"
                :disabled="!canEdit"
                @click="remove(it)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <v-divider />

    <!-- Footer -->
    <div class="cart-foot px-4 py-3">
      <div class="d-flex justify-space-between align-center">
        <span class="font-weight-bold">Total</span>
        <span class="total-amt">{{ money(total) }}</span>
      </div>

      <v-btn
        block
        color="primary"
        class="mt-3"
        :disabled="(cart || []).length === 0 || !canEdit"
        @click="$emit('checkout')"
      >
        Cobrar
      </v-btn>

      <div v-if="!canEdit" class="text-caption text-medium-emphasis mt-2">
        🔒 Admin: solo vista (no puede editar ni vender).
      </div>
    </div>

    <!-- Snack -->
    <v-snackbar v-model="snack.show" :timeout="2400">
      {{ snack.text }}
    </v-snackbar>
  </v-card>
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

/* =========================
   Helpers
========================= */
function toNum(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(toNum(val));
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

function lineTotal(it) {
  return round3(toNum(it?.qty) * toNum(it?.price));
}

/* =========================
   Stock helpers (MAX)
========================= */
/**
 * Intentamos detectar stock disponible desde varios campos.
 * Si NO encontramos un número > 0 => devolvemos null (sin límite).
 */
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
  return null; // sin límite
}

function stockText(it) {
  const m = maxQtyForItem(it);
  if (!(m > 0)) return "";
  return `Stock: ${qty3(m)}`;
}

function clampQtyToStock(it, q) {
  const m = maxQtyForItem(it);
  if (!(m > 0)) return q; // sin límite
  return Math.min(q, m);
}

function isIncDisabled(it) {
  const m = maxQtyForItem(it);
  if (!(m > 0)) return false;
  return toNum(it?.qty) >= m - 0.0005; // tolerancia
}

/* =========================
   Draft qty state
========================= */
const qtyDraft = reactive({});

function syncDraftFromCart() {
  for (const it of props.cart || []) {
    const k = itKey(it);
    if (!k) continue;
    if (qtyDraft[k] === undefined) qtyDraft[k] = qty3(it.qty);
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

/* =========================
   Mutations (actions if exist, fallback direct)
========================= */
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
  it.subtotal = round3(toNum(it.price) * toNum(it.qty));
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

/* =========================
   Snack
========================= */
const snack = reactive({ show: false, text: "" });
function toast(text) {
  snack.text = text;
  snack.show = true;
}

/* =========================
   UI actions
========================= */
function commit(it) {
  const k = itKey(it);
  let q = clampQtyMin(round3(parseQty(qtyDraft[k])));

  if (q <= 0) {
    remove(it);
    return;
  }

  // ✅ clamp a stock
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
    // igual dejamos en max si ya no estaba
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
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  display: flex;
  flex-direction: column;
}

.cart-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  scrollbar-gutter: stable;
}

.cart-foot {
  flex: 0 0 auto;
  background: rgb(var(--v-theme-surface));
}

.cart-title {
  font-weight: 900;
  font-size: 13px;
  line-height: 1.2;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 6px;
}

.cart-item {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  border-radius: 12px;
  padding: 10px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.row-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.name {
  min-width: 0;
  font-weight: 950;
  font-size: 12.5px;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.line-total {
  flex: 0 0 auto;
  font-weight: 1000;
  font-size: 12.5px;
  white-space: nowrap;
}

.row-bot {
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.unit {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  white-space: nowrap;
}

.unit-price {
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.70);
  font-weight: 700;
}
.unit-suffix {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}
.stock-hint {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.qty {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.qty-btn {
  border-radius: 999px;
}

.qty-input {
  width: 78px;
}
.qty-input :deep(.v-field__input) {
  padding-top: 5px;
  padding-bottom: 5px;
  min-height: 32px;
  text-align: center;
  font-weight: 900;
  font-size: 12px;
}

.trash-btn {
  border-radius: 999px;
}

.total-amt {
  font-size: 18px;
  font-weight: 1000;
}

.empty {
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.18);
  border-radius: 14px;
  padding: 18px;
  text-align: center;
  background: rgba(var(--v-theme-on-surface), 0.03);
}

@media (max-width: 960px) {
  .row-bot {
    flex-wrap: wrap;
    align-items: flex-start;
  }
  .qty {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>