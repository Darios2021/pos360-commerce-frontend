<!-- src/modules/shop/pages/ShopCart.vue -->
<!-- ✅ COPY-PASTE FINAL COMPLETO · Carrito estilo Mercado Libre + control de stock -->

<template>
  <v-container class="py-6">
    <div class="cart-shell">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
        <div class="text-h5 font-weight-bold">Carrito</div>

        <v-btn variant="tonal" to="/shop">
          Seguir comprando
        </v-btn>
      </div>

      <v-row>
        <!-- LEFT: Items -->
        <v-col cols="12" md="8">
          <!-- Toolbar ML-like -->
          <v-card class="ml-card mb-3" elevation="0">
            <v-card-text class="d-flex align-center justify-space-between flex-wrap ga-2">
              <div class="d-flex align-center ga-2">
                <v-checkbox
                  v-model="selectAll"
                  hide-details
                  density="compact"
                  class="ml-check"
                  @update:modelValue="toggleAll"
                />
                <div class="ml-muted">Todos los productos</div>
              </div>

              <div class="ml-muted text-caption">
                {{ items.length }} producto{{ items.length === 1 ? "" : "s" }}
              </div>
            </v-card-text>
          </v-card>

          <!-- Empty -->
          <v-card v-if="!items.length" class="ml-card" elevation="0">
            <v-card-text class="py-10 text-center">
              <div class="text-h6 font-weight-bold mb-2">Tu carrito está vacío</div>
              <div class="text-body-2 ml-muted mb-4">
                Agregá productos para continuar con la compra.
              </div>
              <v-btn color="primary" to="/shop" class="ml-cta">Ver productos</v-btn>
            </v-card-text>
          </v-card>

          <!-- Items list -->
          <v-card v-else class="ml-card" elevation="0">
            <v-card-text class="pa-0">
              <div v-for="it in items" :key="itKey(it)" class="ml-item">
                <div class="ml-item-row">
                  <!-- select -->
                  <v-checkbox
                    v-model="selectedMap[itKey(it)]"
                    hide-details
                    density="compact"
                    class="ml-check"
                  />

                  <!-- image -->
                  <div class="ml-img">
                    <v-img
                      :src="imgSrc(it)"
                      width="72"
                      height="72"
                      cover
                      class="rounded-lg"
                    />
                  </div>

                  <!-- title + meta -->
                  <div class="ml-info">
                    <div class="ml-name" :title="it.name">
                      {{ it.name }}
                    </div>
                    <div class="ml-meta">
                      <span v-if="it.brand">{{ it.brand }}</span>
                      <span v-if="it.model">· {{ it.model }}</span>
                    </div>

                    <div class="ml-actions-inline">
                      <button class="ml-link-btn" type="button" @click="removeItem(it)">
                        Eliminar
                      </button>
                    </div>

                    <div v-if="stockBlockedMsg[itKey(it)]" class="ml-warn">
                      {{ stockBlockedMsg[itKey(it)] }}
                    </div>
                  </div>

                  <!-- qty control -->
                  <div class="ml-qty">
                    <div class="ml-qtybox">
                      <button
                        class="ml-qtybtn"
                        type="button"
                        :disabled="qty(it) <= 1"
                        @click="dec(it)"
                        aria-label="Disminuir"
                      >−</button>

                      <div class="ml-qtyval">{{ qty(it) }}</div>

                      <button
                        class="ml-qtybtn"
                        type="button"
                        :disabled="!canInc(it)"
                        @click="inc(it)"
                        aria-label="Aumentar"
                      >+</button>
                    </div>

                    <div class="ml-stock" v-if="hasStockInfo(it)">
                      <template v-if="isUnlimitedStock(it)">
                        Stock sin límite
                      </template>
                      <template v-else>
                        {{ Math.max(0, maxQty(it)) }} disponibles
                      </template>
                    </div>
                  </div>

                  <!-- price -->
                  <div class="ml-price">
                    <div class="ml-price-main">$ {{ fmtMoney(unitPrice(it)) }}</div>
                    <div class="ml-price-sub ml-muted" v-if="qty(it) > 1">
                      $ {{ fmtMoney(unitPrice(it) * qty(it)) }} total
                    </div>
                  </div>
                </div>

                <v-divider />
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- RIGHT: Summary -->
        <v-col cols="12" md="4">
          <v-card class="ml-card ml-summary" elevation="0">
            <v-card-text>
              <div class="ml-title">Resumen</div>

              <div class="ml-row">
                <span class="ml-muted">Subtotal</span>
                <span>$ {{ fmtMoney(subtotalSelected) }}</span>
              </div>

              <v-divider class="my-3" />

              <v-btn
                block
                size="large"
                color="primary"
                class="ml-cta"
                :disabled="!canCheckout"
                @click="goCheckout"
              >
                Continuar compra
              </v-btn>

              <div class="ml-hint ml-muted">
                Podés revisar envío y pago en el checkout.
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";

const router = useRouter();
const cart = useShopCartStore();

const items = computed(() => cart.items || []);

function itKey(it) {
  return String(it?.product_id ?? it?.id ?? it?.sku ?? it?.code ?? Math.random());
}

function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(Number(v || 0)));
}

function unitPrice(p) {
  const d = Number(p.price_discount || 0);
  if (d > 0) return d;
  const l = Number(p.price_list || 0);
  if (l > 0) return l;
  return Number(p.price || 0);
}

function imgSrc(it) {
  return it?.image_url || it?.image || it?.cover_url || "";
}

function qty(it) {
  return Math.max(1, Number(it?.qty || 1));
}

// -------------------------
// ✅ Stock helpers
// Regla:
// - Si track_stock == 0 => ilimitado
// - Si hay stock_qty / available_qty / stock => limite
// - Si NO hay info => no bloquea (backend valida igual)
function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

function trackStock(it) {
  // soporta variantes comunes
  const v = it?.track_stock ?? it?.trackStock ?? it?.track ?? 1;
  return String(v) === "0" ? 0 : 1;
}

function hasStockInfo(it) {
  return (
    it?.stock_qty !== undefined ||
    it?.available_qty !== undefined ||
    it?.stock !== undefined ||
    it?.qty_available !== undefined ||
    it?.availability !== undefined
  );
}

function isUnlimitedStock(it) {
  return trackStock(it) === 0;
}

function rawStock(it) {
  // prioriza campos típicos
  if (it?.stock_qty !== undefined) return toInt(it.stock_qty, 0);
  if (it?.available_qty !== undefined) return toInt(it.available_qty, 0);
  if (it?.qty_available !== undefined) return toInt(it.qty_available, 0);
  if (it?.stock !== undefined) return toInt(it.stock, 0);
  return 0;
}

function maxQty(it) {
  if (isUnlimitedStock(it)) return 999999;
  if (!hasStockInfo(it)) return 999999; // fallback
  return Math.max(0, rawStock(it));
}

function canInc(it) {
  if (isUnlimitedStock(it)) return true;
  if (!hasStockInfo(it)) return true; // fallback: permitimos, backend valida
  return qty(it) < maxQty(it);
}

// Mensajito por item cuando intenta pasarse
const stockBlockedMsg = reactive({});

function flashStockMsg(it, msg) {
  const k = itKey(it);
  stockBlockedMsg[k] = msg;
  window.clearTimeout(flashStockMsg._t?.[k]);
  flashStockMsg._t = flashStockMsg._t || {};
  flashStockMsg._t[k] = window.setTimeout(() => {
    stockBlockedMsg[k] = "";
  }, 1500);
}

// -------------------------
// ✅ selección tipo ML
const selectedMap = reactive({});
const selectAll = ref(true);

function syncSelectionDefaults() {
  const map = selectedMap;
  const keys = items.value.map(itKey);
  for (const k of keys) {
    if (map[k] === undefined) map[k] = true;
  }
  for (const k of Object.keys(map)) {
    if (!keys.includes(k)) delete map[k];
  }
  selectAll.value = keys.length ? keys.every((k) => !!map[k]) : false;
}

watch(items, syncSelectionDefaults, { immediate: true });

function toggleAll(v) {
  const keys = items.value.map(itKey);
  for (const k of keys) selectedMap[k] = !!v;
  selectAll.value = !!v;
}

const selectedItems = computed(() => {
  return (items.value || []).filter((it) => !!selectedMap[itKey(it)]);
});

const subtotalSelected = computed(() => {
  return selectedItems.value.reduce((acc, it) => {
    return acc + unitPrice(it) * qty(it);
  }, 0);
});

const canCheckout = computed(() => selectedItems.value.length > 0);

// -------------------------
// qty actions con control stock
function inc(it) {
  if (!canInc(it)) {
    flashStockMsg(it, `Máximo disponible: ${maxQty(it)}`);
    return;
  }

  cart.increaseQty?.(it.product_id ?? it.id);

  if (!cart.increaseQty) {
    it.qty = qty(it) + 1;
    cart.persist?.();
  }
}

function dec(it) {
  const q = qty(it);
  if (q <= 1) return;

  cart.decreaseQty?.(it.product_id ?? it.id);

  if (!cart.decreaseQty) {
    it.qty = q - 1;
    cart.persist?.();
  }
}

function removeItem(it) {
  cart.removeItem?.(it.product_id ?? it.id);

  if (!cart.removeItem) {
    const pid = it.product_id ?? it.id;
    cart.items = (cart.items || []).filter((x) => (x.product_id ?? x.id) !== pid);
    cart.persist?.();
  }
}

function goCheckout() {
  router.push("/shop/checkout");
}
</script>

<style scoped>
.cart-shell {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.ml-card {
  border-radius: 10px;
  border: 1px solid #e6e6e6;
  background: #fff;
}

.ml-summary {
  position: sticky;
  top: 96px;
}

.ml-muted {
  color: #737373;
}

.ml-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.ml-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.ml-cta {
  border-radius: 6px;
  text-transform: none;
  font-weight: 700;
}

.ml-item-row {
  display: grid;
  grid-template-columns: 32px 84px 1fr 170px 140px;
  gap: 10px;
  align-items: center;
  padding: 14px 14px;
}

.ml-img {
  width: 84px;
  display: flex;
  justify-content: center;
}

.ml-info {
  min-width: 0;
}

.ml-name {
  font-size: 14px;
  font-weight: 700;
  color: #111;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ml-meta {
  margin-top: 4px;
  font-size: 12.5px;
  color: #737373;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ml-actions-inline {
  margin-top: 8px;
}

.ml-link-btn {
  background: transparent;
  border: 0;
  padding: 0;
  color: #3483fa;
  font-size: 13px;
  cursor: pointer;
}
.ml-link-btn:hover {
  text-decoration: underline;
}

.ml-warn {
  margin-top: 6px;
  font-size: 12.5px;
  color: #b45309;
}

.ml-qty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.ml-qtybox {
  display: grid;
  grid-template-columns: 34px 44px 34px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.ml-qtybtn {
  border: 0;
  background: #f5f5f5;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  height: 34px;
}
.ml-qtybtn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ml-qtyval {
  display: grid;
  place-items: center;
  height: 34px;
  font-weight: 700;
  font-size: 13px;
}

.ml-stock {
  font-size: 12px;
  color: #737373;
}

.ml-price {
  text-align: right;
}
.ml-price-main {
  font-size: 16px;
  font-weight: 800;
  color: #111;
}
.ml-price-sub {
  font-size: 12px;
  margin-top: 4px;
}

.ml-check :deep(.v-selection-control__wrapper) {
  margin: 0;
}

.ml-hint {
  text-align: center;
  font-size: 12.5px;
  margin-top: 10px;
}

@media (max-width: 960px) {
  .ml-summary {
    position: static;
  }
  .ml-item-row {
    grid-template-columns: 32px 84px 1fr;
    grid-auto-rows: auto;
  }
  .ml-qty {
    grid-column: 2 / 4;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px 14px;
  }
  .ml-price {
    grid-column: 3 / 4;
    text-align: right;
    padding-right: 14px;
  }
}
</style>
