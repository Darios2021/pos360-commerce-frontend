<template>
  <v-container fluid class="pos-wrap">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-3">
      <div>
        <div class="text-h5 font-weight-bold">Punto de Venta</div>
        <div class="text-caption text-medium-emphasis">Productos · Carrito · Cobro</div>
      </div>

      <div class="d-flex ga-2">
        <v-btn variant="tonal" @click="refresh" :loading="loadingList">
          <v-icon start>mdi-refresh</v-icon>
          Actualizar
        </v-btn>

        <v-btn color="primary" @click="openCheckout" :disabled="posStore.cart.length === 0">
          <v-icon start>mdi-cash-register</v-icon>
          Cobrar
        </v-btn>
      </div>
    </div>

    <v-row dense class="pos-grid">
      <!-- LEFT: Productos -->
      <v-col cols="12" md="8" class="pos-left">
        <v-card class="rounded-xl pos-toolbar" elevation="1">
          <v-card-text class="py-3">
            <v-row dense class="align-center">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="q"
                  label="Buscar productos"
                  placeholder="Nombre / SKU / Marca / Modelo"
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  clearable
                  @keyup.enter="doSearch"
                  @click:clear="clearSearch"
                  @update:model-value="debounceSearch"
                />
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="priceMode"
                  :items="priceModeItems"
                  label="Precio a usar"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="limit"
                  :items="limitItems"
                  label="Por página"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>
            </v-row>

            <div class="d-flex justify-space-between flex-wrap ga-2 mt-2">
              <div class="text-caption text-medium-emphasis">
                Mostrando {{ productsStore.items.length }} de {{ productsStore.total || 0 }}
              </div>

              <div class="d-flex ga-2">
                <v-btn size="small" variant="tonal" @click="prevPage" :disabled="page <= 1">
                  <v-icon start>mdi-chevron-left</v-icon> Anterior
                </v-btn>
                <v-btn size="small" variant="tonal" @click="nextPage" :disabled="page >= pages">
                  Siguiente <v-icon end>mdi-chevron-right</v-icon>
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Grid productos -->
        <div class="pos-products mt-3">
          <div v-if="loadingList" class="d-flex justify-center align-center py-12">
            <v-progress-circular indeterminate />
          </div>

          <v-row v-else dense>
            <v-col
              v-for="p in productsStore.items"
              :key="p.id"
              cols="12"
              sm="6"
              md="4"
              lg="3"
              xl="2"
            >
              <v-card
                class="rounded-xl product-card"
                elevation="1"
                :class="{ 'product-disabled': !hasPrice(p) }"
              >
                <div class="thumb-wrap">
                  <v-img
                    v-if="productImage(p)"
                    :src="productImage(p)"
                    cover
                    class="thumb"
                  />
                  <div v-else class="thumb thumb-empty">
                    <v-icon size="34">mdi-package-variant</v-icon>
                  </div>

                  <div class="badge-sku">
                    SKU: {{ p.sku || "—" }}
                  </div>
                </div>

                <v-card-text class="pt-3 pb-2">
                  <div class="title line-clamp-2" :title="p.name">
                    {{ p.name }}
                  </div>

                  <div class="meta">
                    <span class="muted">Marca:</span> {{ p.brand || "—" }}
                    <span class="dot">·</span>
                    <span class="muted">Modelo:</span> {{ p.model || "—" }}
                  </div>

                  <div class="price-row mt-2">
                    <div v-if="hasPrice(p)" class="price">
                      {{ money(getPrice(p)) }}
                    </div>
                    <v-chip v-else size="small" color="red" variant="tonal">
                      SIN PRECIO
                    </v-chip>
                  </div>
                </v-card-text>

                <v-card-actions class="pt-0 pb-3 px-3">
                  <v-btn
                    block
                    size="small"
                    color="primary"
                    variant="tonal"
                    :disabled="!hasPrice(p)"
                    @click="add(p)"
                  >
                    <v-icon start>mdi-plus</v-icon>
                    Agregar
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>

          <div v-if="!loadingList && productsStore.items.length === 0" class="text-center py-12 text-medium-emphasis">
            <v-icon size="56" class="mb-2">mdi-text-box-search-outline</v-icon>
            <div class="text-h6">No se encontraron productos</div>
          </div>
        </div>
      </v-col>

      <!-- RIGHT: Carrito -->
      <v-col cols="12" md="4" class="pos-right">
        <v-card class="rounded-xl cart-card" elevation="1">
          <!-- Cart Header fijo -->
          <div class="cart-head">
            <div class="d-flex align-center justify-space-between px-4 py-3">
              <div class="d-flex align-center ga-2">
                <v-icon>mdi-cart</v-icon>
                <span class="font-weight-bold">Carrito</span>
              </div>

              <v-chip size="small" variant="tonal">
                {{ posStore.totalItems }} ítems
              </v-chip>
            </div>

            <v-divider />

            <div class="px-4 pt-3">
              <v-text-field
                v-model="posStore.customer.name"
                label="Cliente"
                placeholder="Consumidor Final"
                variant="outlined"
                density="comfortable"
                hide-details
                prepend-inner-icon="mdi-account"
              />
            </div>
          </div>

          <!-- Cart Body scrolleable -->
          <div class="cart-body px-4 pt-3">
            <div v-if="posStore.cart.length === 0" class="empty">
              <v-icon size="56" class="mb-2">mdi-cart-off</v-icon>
              <div class="font-weight-bold">Carrito vacío</div>
              <div class="text-caption text-medium-emphasis">Agregá productos para cobrar</div>
            </div>

            <v-list v-else density="compact" class="pa-0" bg-color="transparent">
              <v-list-item
                v-for="it in posStore.cart"
                :key="it.id"
                class="cart-item rounded-lg mb-2"
              >
                <template #prepend>
                  <v-avatar rounded="lg" size="44" class="border">
                    <v-img v-if="it.image" :src="it.image" cover />
                    <v-icon v-else>mdi-package-variant</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="cart-title">
                  {{ it.name }}
                </v-list-item-title>

                <v-list-item-subtitle class="text-caption text-medium-emphasis">
                  {{ qty3(it.qty) }} × {{ money(it.price) }}
                </v-list-item-subtitle>

                <template #append>
                  <div class="d-flex align-center ga-2">
                    <div class="text-right">
                      <div class="font-weight-bold">{{ money(it.subtotal) }}</div>
                    </div>

                    <v-btn
                      icon="mdi-minus"
                      size="x-small"
                      variant="tonal"
                      @click.stop="posStore.decreaseQty(it.id)"
                    />
                    <v-btn
                      icon="mdi-plus"
                      size="x-small"
                      variant="tonal"
                      @click.stop="posStore.addToCart({ ...it, price_list: it.price, price: it.price })"
                    />
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </div>

          <!-- Cart Footer fijo -->
          <div class="cart-foot">
            <v-divider />

            <div class="px-4 py-3">
              <div class="totals">
                <div class="row">
                  <span class="muted">Subtotal</span>
                  <span class="font-weight-bold">{{ money(posStore.totalAmount) }}</span>
                </div>
                <div class="row">
                  <span class="muted">Descuento</span>
                  <span class="font-weight-bold">{{ money(0) }}</span>
                </div>
                <div class="row">
                  <span class="muted">Impuestos</span>
                  <span class="font-weight-bold">{{ money(0) }}</span>
                </div>

                <div class="row total">
                  <span class="text-subtitle-1 font-weight-bold">Total</span>
                  <span class="text-h6 font-weight-black">{{ money(posStore.totalAmount) }}</span>
                </div>
              </div>

              <div class="d-flex ga-2 mt-3">
                <v-btn
                  block
                  variant="tonal"
                  color="grey-darken-1"
                  :disabled="posStore.cart.length === 0"
                  @click="posStore.clearCart()"
                >
                  <v-icon start>mdi-broom</v-icon>
                  Vaciar
                </v-btn>

                <v-btn
                  block
                  color="primary"
                  :disabled="posStore.cart.length === 0"
                  @click="openCheckout"
                >
                  <v-icon start>mdi-cash-register</v-icon>
                  Cobrar
                </v-btn>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog: Cobro -->
    <v-dialog v-model="checkoutDialog" max-width="520" persistent>
      <v-card class="rounded-xl overflow-hidden">
        <div class="bg-primary pa-4 text-center">
          <div class="text-overline text-white opacity-80 mb-1">Confirmar Cobro</div>
          <div class="text-h4 font-weight-black text-white">
            {{ money(posStore.totalAmount) }}
          </div>
        </div>

        <v-card-text class="pa-5">
          <div class="text-subtitle-2 font-weight-bold mb-3">Método de pago</div>

          <v-radio-group v-model="paymentMethod" color="primary">
            <v-radio value="CASH">
              <template #label>
                <div class="d-flex align-center w-100">
                  <v-icon start class="mr-3">mdi-cash</v-icon>
                  <div>
                    <div class="font-weight-bold">Efectivo</div>
                    <div class="text-caption text-medium-emphasis">Pago en caja</div>
                  </div>
                </div>
              </template>
            </v-radio>

            <v-divider class="my-2" />

            <v-radio value="CARD">
              <template #label>
                <div class="d-flex align-center w-100">
                  <v-icon start class="mr-3">mdi-credit-card</v-icon>
                  <div>
                    <div class="font-weight-bold">Tarjeta / Débito</div>
                    <div class="text-caption text-medium-emphasis">Posnet</div>
                  </div>
                </div>
              </template>
            </v-radio>

            <v-divider class="my-2" />

            <v-radio value="TRANSFER">
              <template #label>
                <div class="d-flex align-center w-100">
                  <v-icon start class="mr-3">mdi-bank-transfer</v-icon>
                  <div>
                    <div class="font-weight-bold">Transferencia</div>
                    <div class="text-caption text-medium-emphasis">Banco / Billetera</div>
                  </div>
                </div>
              </template>
            </v-radio>

            <v-divider class="my-2" />

            <!-- ✅ Mercado Pago -->
            <v-radio value="QR">
              <template #label>
                <div class="d-flex align-center w-100">
                  <v-icon start class="mr-3">mdi-qrcode-scan</v-icon>
                  <div>
                    <div class="font-weight-bold">Mercado Pago</div>
                    <div class="text-caption text-medium-emphasis">QR / Billetera</div>
                  </div>
                </div>
              </template>
            </v-radio>
          </v-radio-group>

          <v-divider class="my-4" />

          <div class="d-flex align-center justify-space-between">
            <div class="text-caption text-medium-emphasis">Pagado</div>
            <div class="font-weight-bold">{{ money(paidAmount) }}</div>
          </div>

          <v-text-field
            v-if="paymentMethod === 'CASH'"
            v-model="cashInput"
            label="Efectivo recibido"
            variant="outlined"
            density="comfortable"
            class="mt-3"
            prepend-inner-icon="mdi-cash"
            placeholder="Ej: 20000"
            :error="cashError"
            :error-messages="cashErrorMsg"
            @keyup.enter="confirmPayment"
          />

          <div v-if="paymentMethod === 'CASH'" class="d-flex align-center justify-space-between mt-2">
            <div class="text-caption text-medium-emphasis">Vuelto</div>
            <div class="text-h6 font-weight-black">{{ money(changeAmount) }}</div>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4 bg-grey-lighten-5">
          <v-btn size="large" variant="text" color="grey-darken-1" @click="checkoutDialog = false" :disabled="posStore.loading">
            Cancelar
          </v-btn>
          <v-spacer />

          <v-btn
            size="large"
            color="green-darken-1"
            variant="flat"
            class="px-6"
            :loading="posStore.loading"
            :disabled="cannotConfirm"
            @click="confirmPayment"
          >
            <v-icon start>mdi-check</v-icon>
            Confirmar venta
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3200">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useProductsStore } from "../../../app/store/products.store";
import { usePosStore } from "../../../app/store/pos.store";

const productsStore = useProductsStore();
const posStore = usePosStore();

const q = ref("");
const page = ref(1);
const limit = ref(24);

const priceMode = ref("LIST");
const priceModeItems = [
  { title: "Precio de lista", value: "LIST" },
  { title: "Precio base", value: "BASE" },
  { title: "Descuento", value: "DISCOUNT" },
  { title: "Mayorista", value: "RESELLER" },
];

const limitItems = [
  { title: "12", value: 12 },
  { title: "24", value: 24 },
  { title: "48", value: 48 },
  { title: "96", value: 96 },
];

const loadingList = ref(false);
let tSearch = null;

const checkoutDialog = ref(false);
const paymentMethod = ref("CASH");
const cashInput = ref("");

const cashError = ref(false);
const cashErrorMsg = ref("");

const snack = ref({ show: false, text: "" });

const pages = computed(() => {
  const total = Number(productsStore.total || 0);
  return Math.max(1, Math.ceil(total / Number(limit.value || 24)));
});

function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}
function qty3(n) {
  return Number(n || 0).toFixed(3);
}

function normalizeUrl(u) {
  if (!u) return "";
  const s = String(u);
  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  const base =
    (import.meta.env.VITE_S3_PUBLIC_BASE_URL || "").replace(/\/$/, "") ||
    (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

  if (!base) return s;
  return base + (s.startsWith("/") ? s : `/${s}`);
}

function productImage(p) {
  const imgs = p?.images || [];
  const first = imgs[0];
  const url = first?.url || first?.public_url || first?.path || "";
  return normalizeUrl(url);
}

function getPrice(p) {
  const base = Number(p?.price || 0);
  const list = Number(p?.price_list || 0);
  const disc = Number(p?.price_discount || 0);
  const res = Number(p?.price_reseller || 0);

  if (priceMode.value === "BASE") return base;
  if (priceMode.value === "DISCOUNT") return disc || list || base;
  if (priceMode.value === "RESELLER") return res || list || base;

  return list || base;
}

function hasPrice(p) {
  return getPrice(p) > 0;
}

function add(p) {
  const img = productImage(p);
  posStore.addToCart({ ...p, image: img });
}

async function fetchList() {
  loadingList.value = true;
  try {
    await productsStore.fetchList({
      q: q.value,
      page: page.value,
      limit: limit.value,
    });
  } finally {
    loadingList.value = false;
  }
}

function debounceSearch() {
  clearTimeout(tSearch);
  tSearch = setTimeout(() => {
    page.value = 1;
    fetchList();
  }, 350);
}

function doSearch() {
  page.value = 1;
  fetchList();
}

function clearSearch() {
  q.value = "";
  page.value = 1;
  fetchList();
}

function prevPage() {
  if (page.value <= 1) return;
  page.value--;
  fetchList();
}
function nextPage() {
  if (page.value >= pages.value) return;
  page.value++;
  fetchList();
}

function refresh() {
  fetchList();
}

function openCheckout() {
  paymentMethod.value = "CASH";
  cashInput.value = "";
  cashError.value = false;
  cashErrorMsg.value = "";
  checkoutDialog.value = true;
}

function parseCash(v) {
  if (v === null || v === undefined) return 0;
  const s = String(v).trim().replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

const paidAmount = computed(() => {
  if (paymentMethod.value !== "CASH") return Number(posStore.totalAmount || 0);
  return parseCash(cashInput.value);
});

const changeAmount = computed(() => {
  const ch = paidAmount.value - Number(posStore.totalAmount || 0);
  return ch > 0 ? ch : 0;
});

const cannotConfirm = computed(() => {
  if (posStore.loading) return true;
  if (posStore.cart.length === 0) return true;
  if (paymentMethod.value !== "CASH") return false;
  return paidAmount.value < Number(posStore.totalAmount || 0);
});

watch([paymentMethod, cashInput], () => {
  if (paymentMethod.value !== "CASH") {
    cashError.value = false;
    cashErrorMsg.value = "";
    return;
  }

  const total = Number(posStore.totalAmount || 0);
  const paid = paidAmount.value;

  if (!cashInput.value) {
    cashError.value = true;
    cashErrorMsg.value = "Ingresá el efectivo recibido.";
    return;
  }

  if (paid < total) {
    cashError.value = true;
    cashErrorMsg.value = `El efectivo es menor al total (${money(total)}).`;
    return;
  }

  cashError.value = false;
  cashErrorMsg.value = "";
});

async function confirmPayment() {
  const total = Number(posStore.totalAmount || 0);

  if (paymentMethod.value === "CASH") {
    const paid = paidAmount.value;
    if (paid <= 0) {
      cashError.value = true;
      cashErrorMsg.value = "Ingresá el efectivo recibido.";
      return;
    }
    if (paid < total) {
      cashError.value = true;
      cashErrorMsg.value = `El efectivo es menor al total (${money(total)}).`;
      return;
    }
  }

  try {
    await posStore.checkout(paymentMethod.value);
    checkoutDialog.value = false;
    snack.value = { show: true, text: "✅ Venta registrada correctamente" };
  } catch (e) {
    snack.value = { show: true, text: posStore.error || "❌ Error al confirmar la venta" };
  }
}

onMounted(async () => {
  await fetchList();
});
</script>

<style scoped>
.pos-wrap {
  background: #f6f7f9;
  min-height: calc(100vh - 24px);
  padding: 16px;
}

.pos-grid {
  align-items: flex-start;
}

.pos-left,
.pos-right {
  display: flex;
  flex-direction: column;
}

/* =========================
   ✅ NUEVO: “CAJA” para productos (no en el aire)
   - Hace que la lista/grilla de productos viva dentro de un panel
   - Con altura controlada y scroll interno
========================= */
.pos-left {
  min-height: calc(100vh - 110px);
}

.pos-products {
  flex: 1 1 auto;
  min-height: 0;

  /* caja */
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  padding: 12px;

  /* altura + scroll interno */
  max-height: calc(100vh - 190px);
  overflow: auto;

  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.04);
}

/* si querés que el loader/empty no quede pegado */
.pos-products .py-12 {
  padding-top: 24px !important;
  padding-bottom: 24px !important;
}

.pos-toolbar {
  position: sticky;
  top: 12px;
  z-index: 2;
}

/* =========================
   PRODUCTOS
========================= */
.product-card {
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.product-card:hover {
  transform: translateY(-2px);
}
.product-disabled {
  opacity: 0.65;
}

.thumb-wrap {
  height: 110px;
  position: relative;
  background: white;
}
.thumb {
  height: 110px;
}
.thumb-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 110px;
  background: #f2f4f7;
}

.badge-sku {
  position: absolute;
  left: 10px;
  bottom: 8px;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.title {
  font-weight: 800;
  font-size: 13px;
  line-height: 1.2;
  min-height: 32px;
}

.meta {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 6px;
}
.meta .muted {
  color: rgba(0, 0, 0, 0.45);
}
.meta .dot {
  margin: 0 6px;
  opacity: 0.5;
}

.price-row .price {
  font-weight: 900;
  font-size: 16px;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* =========================
   CARRITO (FIX ALTURA + FOOTER SIEMPRE VISIBLE)
   - NO se estira hacia abajo.
   - El scroll solo en el body.
========================= */

.cart-card {
  position: sticky;
  top: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 16px;
  background: white;

  /* ✅ altura controlada (clave) */
  height: calc(100vh - 110px);
  max-height: calc(100vh - 110px);
}

/* Header fijo */
.cart-head {
  flex: 0 0 auto;
  background: white;
}

/* Body scrolleable (clave: min-height:0) */
.cart-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding-bottom: 14px;

  /* opcional, evita saltos por scrollbar */
  scrollbar-gutter: stable;
}

/* Footer fijo (NO sticky, en flex queda siempre visible) */
.cart-foot {
  flex: 0 0 auto;
  background: white;
  z-index: 2;
  box-shadow: 0 -8px 18px rgba(0, 0, 0, 0.06);
}

.cart-foot .v-btn {
  min-height: 44px;
}

.cart-item {
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: white;
}

.cart-title {
  font-weight: 800;
  font-size: 13px;
  line-height: 1.2;
}

.border {
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.empty {
  border: 1px dashed rgba(0, 0, 0, 0.15);
  border-radius: 14px;
  padding: 18px;
  text-align: center;
  background: white;
}

.totals .row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 6px 0;
}
.totals .row.total {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.muted {
  color: rgba(0, 0, 0, 0.55);
}

/* =========================
   FIX: BOTONES DEL FOOTER (VACÍAR / COBRAR)
   - Mantiene 2 botones visibles siempre.
========================= */
.cart-foot .d-flex.ga-2 {
  flex-wrap: nowrap;
}
.cart-foot .d-flex.ga-2 > .v-btn {
  flex: 1 1 0;
  min-width: 0;
}
.cart-foot .v-btn.v-btn--block {
  width: auto !important;
}

/* =========================
   MOBILE TUNING
========================= */
@media (max-width: 960px) {
  .pos-wrap {
    padding: 10px;
  }

  .pos-toolbar {
    position: relative;
    top: auto;
  }

  /* en mobile, evitamos cajas con height fijo */
  .pos-left {
    min-height: auto;
  }

  .pos-products {
    max-height: none;
    overflow: visible;
    padding: 10px;
  }

  .cart-card {
    position: relative;
    top: auto;
    height: auto;
    max-height: none;
  }

  .cart-body {
    min-height: auto;
    overflow: visible;
  }

  .cart-foot {
    box-shadow: none;
  }
}
</style>
