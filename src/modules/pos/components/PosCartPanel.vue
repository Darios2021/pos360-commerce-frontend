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
            <!-- Miniatura cuadrada -->
            <div class="item-media">
              <v-img
                v-if="itemImage(it)"
                :src="itemImage(it)"
                :aspect-ratio="1"
                cover
                class="item-media-img"
              />
              <div v-else class="item-media-placeholder">
                <v-icon size="22">mdi-package-variant-closed</v-icon>
              </div>
              <span class="item-media-qty">{{ qtyInt(it) }}</span>
            </div>

            <!-- Contenido -->
            <div class="item-body">
              <div class="item-row-top">
                <div class="item-name" :title="it?.name || ''">
                  {{ it?.name || "—" }}
                  <span v-if="it?.is_promo" class="promo-tag">PROMO</span>
                </div>
                <span class="item-total">{{ money(lineTotal(it)) }}</span>
              </div>

              <div class="item-meta">
                <span class="unit-price">
                  <span v-if="it?.promo_applied && unitPriceList(it) > unitPriceEffective(it)" class="unit-old">
                    {{ money(unitPriceList(it)) }}
                  </span>
                  {{ money(unitPriceEffective(it)) }}
                  <span class="unit-suffix">c/u</span>
                </span>
                <span v-if="it?.sku" class="item-sku" :title="`SKU: ${it.sku}`">
                  {{ it.sku }}
                </span>
                <span v-if="stockText(it)" class="stock-hint">{{ stockText(it) }}</span>
              </div>

              <!-- Hint promo por cantidad cuando aún no llegó al umbral -->
              <div v-if="qtyPromoHint(it)" class="qty-promo-hint">
                <v-icon size="13">mdi-tag-multiple</v-icon>
                {{ qtyPromoHint(it) }}
              </div>

              <div class="item-actions">
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
                  :title="`Quitar ${it?.name || 'ítem'}`"
                />
              </div>
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
import { usePosImages } from "../composables/usePosImages";

const { productImage } = usePosImages();

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

function qtyInt(it) {
  const n = Math.floor(toNum(it?.qty));
  return n > 0 ? n : 0;
}

function itemImage(it) {
  const direct =
    it?.image ||
    it?.image_url ||
    it?.imageUrl ||
    it?.imagen ||
    it?.thumbnail ||
    "";
  if (direct) return direct;

  // Fallback: items agregados antes del fix pueden no tener imagen guardada.
  // Resolvemos vía el caché/fetch compartido de usePosImages.
  const id = Number(it?.id || it?.product_id || 0);
  if (!id) return "";
  return productImage({ id });
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

  // Si el store ya marcó la línea con promo aplicada, usamos el unit_price
  // efectivo persistido (no price_discount, que es el original)
  if (it?.promo_applied) {
    const eff = toNum(it?.unit_price) || toNum(it?.price);
    if (eff > 0) return eff;
  }

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

function unitPriceList(it) {
  // Precio "antes" para mostrar tachado: price_list o price_discount original
  const list = toNum(it?.price_list);
  if (list > 0) return list;
  const disc = toNum(it?.price_discount);
  if (disc > 0) return disc;
  return 0;
}

function qtyPromoHint(it) {
  if (!it?.is_promo) return "";
  const thr = Number(it?.promo_qty_threshold) || 0;
  const disc = toNum(it?.promo_qty_discount);
  const mode = String(it?.promo_qty_mode || "").toLowerCase();
  if (thr < 2 || disc <= 0) return "";
  const qty = toNum(it?.qty);
  if (qty >= thr) return ""; // ya aplicado
  const falta = thr - qty;
  const off = mode === "percent" ? `${disc}% OFF` : `$ ${money(disc)}`;
  return `Sumá ${falta} u. más para ${off} c/u`;
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
  font-weight: 500;
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
  font-weight: 500 !important;
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
  font-weight: 500;
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
  gap: 8px;
}

.cart-item {
  display: block;
}

.item-shell {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  padding: 8px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  transition:
    border-color 0.14s ease,
    box-shadow 0.14s ease;
}

.item-shell:hover {
  border-color: rgba(var(--v-theme-primary), 0.32);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

/* Miniatura con badge de cantidad */
.item-media {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-media-img {
  width: 100%;
  height: 100%;
}

.item-media-img :deep(.v-img__img),
.item-media-img :deep(img) {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.item-media-placeholder {
  color: rgba(var(--v-theme-on-surface), 0.35);
}

.item-media-qty {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 12px;
  font-weight: 500;
  line-height: 22px;
  text-align: center;
  border: 2px solid rgb(var(--v-theme-surface));
  box-shadow: 0 2px 6px rgba(var(--v-theme-primary), 0.4);
  font-feature-settings: "tnum";
}

/* Contenido al costado */
.item-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
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
  font-size: 13px;
  line-height: 1.2;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-total {
  flex: 0 0 auto;
  font-size: 14px;
  line-height: 1;
  font-weight: 500;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

/* Row 2: meta (precio unit / SKU / stock) */
.item-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.unit-price {
  font-size: 11.5px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.7);
  white-space: nowrap;
}

.unit-suffix {
  font-size: 10.5px;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin-left: 2px;
}

.unit-old {
  font-size: 10.5px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.45);
  text-decoration: line-through;
  margin-right: 4px;
}

.promo-tag {
  display: inline-block;
  margin-left: 6px;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.6px;
  background: linear-gradient(135deg, #02498b, #036ec1);
  color: #fff;
  padding: 1px 5px;
  border-radius: 3px;
  vertical-align: middle;
  text-transform: uppercase;
}

.qty-promo-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 10.5px;
  font-weight: 400;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  padding: 2px 7px;
  border-radius: 5px;
  align-self: flex-start;
  line-height: 1.2;
  width: fit-content;
}

.item-sku {
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.02em;
  color: rgba(var(--v-theme-on-surface), 0.6);
  padding: 1px 6px;
  border-radius: 5px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  white-space: nowrap;
  text-transform: uppercase;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stock-hint {
  font-size: 10px;
  font-weight: 400;
  color: rgba(var(--v-theme-success), 0.85);
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(var(--v-theme-success), 0.1);
  border: 1px solid rgba(var(--v-theme-success), 0.2);
  white-space: nowrap;
}

/* Row 3: acciones (qty + trash) */
.item-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.qty-box {
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 28px;
  gap: 4px;
  align-items: center;
  max-width: 150px;
}

.qty-btn {
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  border-radius: 7px !important;
}

.trash-btn {
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  border-radius: 7px !important;
  margin-left: auto;
  flex-shrink: 0;
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
  min-height: 28px;
  padding-top: 0;
  padding-bottom: 0;
  padding-left: 4px;
  padding-right: 4px;
  text-align: center;
  font-size: 12px;
  font-weight: 400;
  font-feature-settings: "tnum";
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
  font-weight: 500;
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
  font-weight: 500;
  white-space: nowrap;
}

.pay-btn {
  margin-top: 10px;
  height: 42px !important;
  border-radius: 13px !important;
  font-size: 13px !important;
  font-weight: 500 !important;
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