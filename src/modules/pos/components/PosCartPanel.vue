<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosCartPanel.vue -->
<template>
  <v-card class="cart-card" elevation="0">
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
      <div v-if="(cart || []).length === 0" class="empty">
        <div class="empty-box">
          <v-icon size="58" class="mb-2">mdi-cart-off</v-icon>
          <div class="empty-title">Carrito vacío</div>
          <div class="empty-sub">Agregá productos desde la lista (doble click o “+”).</div>
        </div>
      </div>

      <div v-else class="cart-items">
        <div v-for="it in cart" :key="itKey(it)" class="cart-item">
          <!-- TOP: name + line total -->
          <div class="item-top">
            <div class="item-name" :title="it?.name || ''">
              {{ it?.name || "—" }}
            </div>

            <div class="item-total">
              {{ money(lineTotal(it)) }}
            </div>
          </div>

          <!-- MID: unit + stock -->
          <div class="item-mid">
            <span class="unit-price">{{ money(it.price) }}</span>
            <span class="unit-suffix">c/u</span>
            <span v-if="stockText(it)" class="stock-hint">· {{ stockText(it) }}</span>
          </div>

          <!-- BOT: qty controls -->
          <div class="item-bot">
            <v-btn
              class="qty-btn"
              size="small"
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
              variant="tonal"
              icon="mdi-plus"
              :disabled="!canEdit || isIncDisabled(it)"
              @click="inc(it)"
            />

            <div class="bot-spacer" />

            <v-btn
              class="trash-btn"
              size="small"
              variant="tonal"
              icon="mdi-trash-can-outline"
              color="red"
              :disabled="!canEdit"
              @click="remove(it)"
            />
          </div>
        </div>

        <!-- aire abajo para que no parezca cortado con el sticky footer -->
        <div class="cart-bottom-gap" />
      </div>
    </div>

    <!-- Footer (sticky visual) -->
    <div class="cart-foot px-4 py-3">
      <div class="total-row">
        <span class="total-label">Total</span>
        <span class="total-amt">{{ money(total) }}</span>
      </div>

      <v-btn
        block
        color="primary"
        class="mt-3 pay-btn"
        :disabled="(cart || []).length === 0 || !canEdit"
        @click="$emit('checkout')"
      >
        Cobrar
      </v-btn>

      <div v-if="!canEdit" class="text-caption text-medium-emphasis mt-2">
        🔒 Solo vista (no puede editar ni vender).
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
   Mutations (store or fallback)
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

  const max = maxQtyForItem(it);
  const clamped = clampQtyToStock(it, q);

  if (max && clamped < q) toast(`⚠️ No hay stock suficiente. Máximo: ${qty3(max)}`);

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
/* =========================
   CARD LAYOUT (llenar altura)
========================= */
.cart-card {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border-radius: 18px;

  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgb(var(--v-theme-surface));

  display: flex;
  flex-direction: column;

  /* 🔥 más sombra para destacar del fondo */
  box-shadow:
    0 10px 26px rgba(0,0,0,0.06),
    0 26px 64px rgba(0,0,0,0.08);
}

.cart-title {
  font-weight: 950;
  font-size: 14px;
  line-height: 1.2;
}

/* =========================
   BODY SCROLL
========================= */
.cart-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  scrollbar-gutter: stable;

  padding-top: 14px !important;

  /* Firefox */
  scrollbar-width: auto;
  scrollbar-color: rgba(0, 0, 0, 0.35) rgba(0, 0, 0, 0.06);
}

/* ✅ Scrollbar estándar (Webkit: Chrome/Edge) */
.cart-body::-webkit-scrollbar {
  width: 14px;
}

.cart-body::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.06);
  border-radius: 999px;
}

.cart-body::-webkit-scrollbar-thumb {
  /* ✅ FIX CLAVE: Vuetify usa rgb(var(--v-theme-primary)) */
  background: rgba(var(--v-theme-primary), 0.55);
  border-radius: 999px;
  border: 3px solid rgba(0,0,0,0.06);
}

.cart-body::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-primary), 0.85);
}

/* =========================
   ITEMS
========================= */
.cart-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-item {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 16px;
  padding: 12px 12px;
  background: rgba(var(--v-theme-on-surface), 0.02);

  transition: all 160ms ease;
}

.cart-item:hover {
  border-color: rgba(var(--v-theme-primary), 0.30);
  background: rgba(var(--v-theme-primary), 0.05);
  box-shadow: 0 10px 24px rgba(var(--v-theme-primary), 0.14);
}

.item-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.item-name {
  min-width: 0;
  font-weight: 950;
  font-size: 12.5px;
  line-height: 1.2;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-total {
  flex: 0 0 auto;
  font-weight: 1000;
  font-size: 13px;
  white-space: nowrap;
}

.item-mid {
  margin-top: 6px;
  display: flex;
  gap: 6px;
  align-items: baseline;
  flex-wrap: wrap;
  color: rgba(var(--v-theme-on-surface), 0.70);
}

.unit-price {
  font-size: 12px;
  font-weight: 800;
}
.unit-suffix {
  font-size: 11px;
  opacity: 0.75;
}
.stock-hint {
  font-size: 11px;
  opacity: 0.75;
}

/* BOT controls: grid para que nunca “se rompa” */
.item-bot {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 40px 96px 40px 1fr 40px;
  align-items: center;
  gap: 10px;
}

.bot-spacer {
  min-width: 0;
}

/* botones más “tocables” */
.qty-btn {
  border-radius: 999px !important;
  width: 40px !important;
  height: 40px !important;
}

.qty-input {
  width: 96px;
}
.qty-input :deep(.v-field__input) {
  padding-top: 6px;
  padding-bottom: 6px;
  min-height: 40px;
  text-align: center;
  font-weight: 1000;
  font-size: 13px;
}

.trash-btn {
  border-radius: 12px !important;
  width: 40px !important;
  height: 40px !important;
}

.cart-bottom-gap {
  height: 18px;
}

/* =========================
   FOOTER (siempre visible)
========================= */
.cart-foot {
  flex: 0 0 auto;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);

  box-shadow: 0 -10px 24px rgba(0,0,0,0.06);
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.total-label {
  font-weight: 950;
  font-size: 15px;
}
.total-amt {
  font-size: 20px;
  font-weight: 1000;
  white-space: nowrap;
}

.pay-btn {
  height: 44px;
  border-radius: 14px;
  font-weight: 950;
  letter-spacing: 0.4px;
}

/* =========================
   EMPTY
========================= */
.empty {
  padding: 8px 0 14px;
}
.empty-box {
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.18);
  border-radius: 16px;
  padding: 18px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  text-align: center;
}
.empty-title {
  font-weight: 950;
  margin-top: 2px;
}
.empty-sub {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.65);
}

/* responsive */
@media (max-width: 420px) {
  .item-bot {
    grid-template-columns: 40px 1fr 40px;
    grid-auto-rows: auto;
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