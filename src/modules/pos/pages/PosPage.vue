<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/pages/PosPage.vue -->
<template>
  <v-container fluid class="pos-root">
    <!-- ================= HEADER ================= -->
    <div class="pos-header">
      <div class="pos-top">
        <div class="pos-top-left">
          <div class="text-h5 font-weight-bold">Punto de Venta</div>
          <div class="text-caption text-medium-emphasis">Productos · Carrito · Cobro</div>

          <div class="pos-chips mt-2">
            <v-chip size="small" variant="tonal" color="primary">
              Sucursal activa: {{ branchChipLabel }}
            </v-chip>

            <v-chip size="small" variant="tonal" color="primary">
              Vendibles con stock: {{ sellableStockTotal }}
            </v-chip>

            <v-chip size="small" variant="tonal" color="surface-variant">
              Con stock (incluye sin precio): {{ stockOnlyTotal }}
            </v-chip>

            <v-chip v-if="isViewOnly" size="small" variant="tonal" color="amber-darken-2">
              Solo vista (sin permiso POS)
            </v-chip>

            <v-chip v-if="needsBranchPick" size="small" variant="tonal" color="deep-purple-darken-1">
              Elegí sucursal activa para operar
            </v-chip>

            <v-chip size="small" variant="tonal" color="surface-variant">
              F1 Ayuda · F2 Buscar · F8 Cobrar · PgUp/PgDn · Ctrl+K
            </v-chip>
          </div>

          <div class="pos-cashier mt-2">
            <v-icon size="16">mdi-account-badge</v-icon>
            <span class="pos-cashier-txt">Cajero: <b>{{ cashierName }}</b></span>
            <span class="pos-dot">·</span>
            <v-icon size="16">mdi-clock-outline</v-icon>
            <span class="pos-cashier-txt">Inicio caja: <b>{{ shiftStartText }}</b></span>
          </div>
        </div>

        <div class="pos-top-actions">
          <v-btn class="pos-action" variant="tonal" @click="refresh" :loading="loadingGlobal">
            <v-icon start>mdi-refresh</v-icon>
            Actualizar
          </v-btn>

          <v-btn
            class="pos-action"
            variant="tonal"
            @click="branchPickOpen = true"
            :disabled="branchItems.length <= 1"
          >
            <v-icon start>mdi-store</v-icon>
            Cambiar sucursal
          </v-btn>

          <!-- ✅ AYUDA -->
          <v-btn class="pos-action" variant="tonal" @click="helpOpen = true">
            <v-icon start>mdi-help-circle-outline</v-icon>
            Ayuda
          </v-btn>

          <v-btn
            class="pos-action"
            color="primary"
            variant="flat"
            @click="openCheckoutSafe"
            :disabled="(posStore.cart || []).length === 0 || !canSell || needsBranchPick"
          >
            <v-icon start>mdi-cash-register</v-icon>
            Cobrar
          </v-btn>
        </div>
      </div>
    </div>

    <!-- ================= BODY (✅ sin v-row/v-col, grid propio) ================= -->
    <div class="pos-body">
      <div class="pos-layout">
        <!-- LEFT -->
        <div class="pos-left">
          <PosFiltersBar
            ref="filtersRef"
            v-model:q="q"
            v-model:rubro-id="rubroId"
            v-model:subrubro-id="subrubroId"
            :rubro-items="rubroItems"
            :subrubro-items="subrubroItems"
            :subrubro-no-data-text="subrubroNoDataText"
            :page="page"
            :pages="pages"
            :limit="limit"
            :shown-count="pagedItems.length"
            :total-count="sellableStockTotal"
            :stock-only-total="stockOnlyTotal"
            :error="errorGlobal"
            :disabled-all="loadingGlobal"
            @typing="debounceSearch"
            @enter="doSearch"
            @clear="clearSearch"
            @rubro-change="onRubroChange"
            @prev="prevPage"
            @next="nextPage"
          />

          <div class="pos-products">
            <div v-if="loadingGlobal" class="d-flex justify-center align-center py-12">
              <v-progress-circular indeterminate />
            </div>

            <div v-else class="pos-list">
              <PosProductRow
                v-for="p in pagedItems"
                :key="p.id"
                :item="p"
                :image="productImage(p)"
                :name="p.name"
                :sku="p.sku || p.code"
                :stkLabel="`STK ${qtyForActive(p)}`"
                :offLabel="
                  resolveUnitPrice(p, 'LIST') > resolveUnitPrice(p, 'DISCOUNT')
                    ? `${Math.round((1 - resolveUnitPrice(p, 'DISCOUNT') / resolveUnitPrice(p, 'LIST')) * 100)}% OFF`
                    : ''
                "
                :rubro-label="rubroTitleFromProduct(p) || ''"
                :subrubro-label="subrubroTitleFromProduct(p) || ''"
                :price-discount="resolveUnitPrice(p, 'DISCOUNT')"
                :price-list="resolveUnitPrice(p, 'LIST')"
                :disabled="!canSell || needsBranchPick"
                @add="add"
                @details="openDetails"
              />

              <div v-if="pagedItems.length" class="mt-2 text-caption text-medium-emphasis">
                Tip: al tocar “+”, si el producto no tiene stock en la sucursal activa, te pregunta de cuál sale.
              </div>
            </div>

            <div v-if="!loadingGlobal && pagedItems.length === 0" class="text-center py-12 text-medium-emphasis">
              <v-icon size="56" class="mb-2">mdi-text-box-search-outline</v-icon>
              <div class="text-h6">No se encontraron productos vendibles con stock</div>
              <div class="text-caption mt-1">
                Nota: hay {{ stockOnlyTotal }} con stock total, pero algunos pueden estar sin precio.
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT -->
        <div class="pos-right">
          <PosCartPanel
            :cart="posStore.cart"
            :total-items="posStore.totalItems"
            :total="checkoutTotalPreview"
            :can-edit="canSell && !needsBranchPick"
            :pos-store="posStore"
            @checkout="openCheckoutSafe"
          />

          <div v-if="cartBranchLabel" class="mt-2 text-caption text-medium-emphasis">
            Carrito: <b>{{ cartBranchLabel }}</b>
          </div>

          <div class="pos-right-spacer" />
        </div>
      </div>
    </div>

    <!-- ================= DIALOGS ================= -->
    <PosProductDetailsDialog
      v-model:open="detailsOpen"
      :item="detailsItem"
      :image="detailsItem ? productImage(detailsItem) : ''"
      @add="addFromDetails"
    />

    <CheckoutDialog
      v-model:open="checkoutDialog"
      :total="checkoutTotal"
      :cart="posStore.cart"
      @confirm="confirmPaymentSafe"
    />

    <ReceiptDialog
      v-model:open="receiptOpen"
      :sale="receiptSale"
      :company-name="receiptCompanyName"
      :branch-name="branchName || ''"
    />

    <PosPickBranchDialog v-model:open="pickBranchOpen" :branches="pickBranchOptions" @confirm="onPickBranchConfirm" />

    <!-- ✅ AYUDA / COMANDOS -->
    <PosShortcutsHelpDialog v-model="helpOpen" />

    <v-snackbar v-model="snack.show" :timeout="3200">{{ snack.text }}</v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { usePosStore } from "../../../app/store/pos.store";

import PosFiltersBar from "../components/PosFiltersBar.vue";
import { usePosFilters } from "../composables/usePosFilters";

import PosProductRow from "../components/PosProductRow.vue";
import CheckoutDialog from "../components/CheckoutDialog.vue";
import PosProductDetailsDialog from "../components/PosProductDetailsDialog.vue";
import ReceiptDialog from "../components/ReceiptDialog.vue";
import PosCartPanel from "../components/PosCartPanel.vue";
import PosPickBranchDialog from "../components/PosPickBranchDialog.vue";
import PosShortcutsHelpDialog from "../components/PosShortcutsHelpDialog.vue";

import { usePosAccess } from "../composables/usePosAccess";
import { usePosBranch } from "../composables/usePosBranch";
import { usePosBranchScope } from "../composables/usePosBranchScope";
import { usePosPricing } from "../composables/usePosPricing";
import { usePosImages } from "../composables/usePosImages";
import { usePosCheckout } from "../composables/usePosCheckout";
import { usePosMultiBranchCatalog } from "../composables/usePosMultiBranchCatalog";

const posStore = usePosStore();

/* UI */
const helpOpen = ref(false);
const filtersRef = ref(null);
const snack = ref({ show: false, text: "" });
function toast(text) {
  snack.value = { show: true, text: String(text || "") };
}

/* shift / cajero */
const shiftStart = ref(new Date());
const shiftStartText = computed(() => {
  const d = shiftStart.value || new Date();
  return new Date(d).toLocaleString("es-AR", { hour: "2-digit", minute: "2-digit" });
});

/* access */
const { auth, canSell, isViewOnly, cashierName } = usePosAccess();

/* branch */
const {
  userBranches,
  branchItems,
  branchPickOpen,
  activeBranchId,
  branchName,
  branchChipLabel,
  needsBranchPick,
  ensureBranchSelected,
} = usePosBranch({ auth, posStore });

/* branch scope */
const branchScope = usePosBranchScope({ auth, userBranches, branchItems });

/* pricing */
const { resolveUnitPrice, isSellable, toNum } = usePosPricing();

/* images */
const { productImage, prefetchImagesForVisible } = usePosImages();

/* catálogo global */
const { loadingGlobal, errorGlobal, globalItems, fetchGlobalPool, branchesWithStock } =
  usePosMultiBranchCatalog({ branchScope, isSellable });

/* helpers stock */
function getActiveBranchId() {
  return Number(activeBranchId.value || 0) || null;
}
function qtyForActive(p) {
  const ab = getActiveBranchId();
  if (!ab) return Number(p?.total_qty || 0) || 0;
  return Number(p?.stockByBranch?.[String(ab)] || 0) || 0;
}
function activeHasStock(p) {
  return qtyForActive(p) > 0;
}

/* ✅ filtros + taxonomy */
const filters = usePosFilters({ globalItems, isSellable, qtyForActive });

const {
  q,
  page,
  limit,
  rubroId,
  subrubroId,
  rubroItems,
  subrubroItems,
  subrubroNoDataText,
  stockOnlyTotal,
  sellableStockTotal,
  pages,
  pagedItems,
  onRubroChange,
  debounceSearch,
  doSearch,
  clearSearch,
  prevPage,
  nextPage,
  loadTaxonomy,
  rubroTitleFromProduct,
  subrubroTitleFromProduct,
} = filters;

/* details */
const detailsOpen = ref(false);
const detailsItem = ref(null);
function openDetails(p) {
  detailsItem.value = p || null;
  detailsOpen.value = true;
}

/* checkout */
const allSellable = globalItems;
const {
  checkoutDialog,
  checkoutTotal,
  checkoutTotalPreview,
  receiptOpen,
  receiptSale,
  receiptCompanyName,
  openCheckout,
  confirmPayment,
} = usePosCheckout({
  posStore,
  canSell,
  needsBranchPick,
  resolveUnitPrice,
  toNum,
  allSellable,
});

function openCheckoutSafe() {
  openCheckout({ onSnack: toast });
}
async function confirmPaymentSafe() {
  await confirmPayment({ onSnack: toast });
  await fetchGlobalPool({ in_stock: 0 });
}

/* pick branch */
const pickBranchOpen = ref(false);
const pickBranchProduct = ref(null);
const pickBranchOptions = ref([]);

function cartBranchId() {
  const it = (posStore.cart || []).find((x) => Number(x?.chosen_branch_id || 0) > 0);
  return it ? Number(it.chosen_branch_id) : null;
}
const cartBranchLabel = computed(() => {
  const bid = cartBranchId();
  if (!bid) return null;
  const found = (branchScope.branches.value || []).find((b) => Number(b?.id) === Number(bid));
  return found?.name || `Sucursal #${bid}`;
});

async function ensureSingleCartBranchOrWarn(targetBranchId) {
  const current = cartBranchId();
  const target = Number(targetBranchId || 0) || null;
  if (!current || !target) return { ok: true };
  if (current !== target) {
    toast("🧠 El carrito NO puede mezclar sucursales. Terminá esa venta o vaciá el carrito.");
    return { ok: false };
  }
  return { ok: true };
}

function addToCartWithBranch(p, targetBranchId) {
  const unit = resolveUnitPrice(p, "DISCOUNT");
  if (!(unit > 0)) return toast("⚠️ Producto sin precio");

  const available = Number(p?.stockByBranch?.[String(targetBranchId)] || 0);

  posStore.addToCart({
    ...p,
    product_id: p.id,
    image: productImage(p),
    available_qty: available,
    price: unit,
    price_label: "Descuento",
    price_list: toNum(p.price_list),
    price_discount: toNum(p.price_discount),
    price_reseller: toNum(p.price_reseller),
    effective_price: toNum(p.effective_price),
    chosen_branch_id: Number(targetBranchId),
  });

  toast("✅ Agregado al carrito");
}

async function add(p) {
  if (needsBranchPick.value) return (branchPickOpen.value = true), toast("🏬 Elegí sucursal activa para operar.");
  if (!canSell.value) return toast("🔒 Sin permiso POS (pos.sale). Solo lectura.");
  if (!isSellable(p) || qtyForActive(p) <= 0) return toast("❌ No vendible (sin stock o sin precio)");

  const forcedCartBranchId = cartBranchId();
  if (forcedCartBranchId) {
    const ok = await ensureSingleCartBranchOrWarn(forcedCartBranchId);
    if (!ok.ok) return;
    const avail = Number(p?.stockByBranch?.[String(forcedCartBranchId)] || 0);
    if (avail <= 0) return toast("⚠️ Este producto no tiene stock en la sucursal del carrito.");
    return addToCartWithBranch(p, forcedCartBranchId);
  }

  const ab = getActiveBranchId();
  if (ab && activeHasStock(p)) {
    const ok = await ensureSingleCartBranchOrWarn(ab);
    if (!ok.ok) return;
    return addToCartWithBranch(p, ab);
  }

  const opts = branchesWithStock(p);
  if (!opts.length) return toast("❌ Sin stock en tus sucursales habilitadas");

  if (opts.length === 1) {
    const targetBranchId = Number(opts[0].id);
    const ok = await ensureSingleCartBranchOrWarn(targetBranchId);
    if (!ok.ok) return;
    return addToCartWithBranch(p, targetBranchId);
  }

  pickBranchProduct.value = p;
  pickBranchOptions.value = opts;
  pickBranchOpen.value = true;
}

async function onPickBranchConfirm({ branch_id }) {
  const p = pickBranchProduct.value;
  if (!p) return;
  const targetBranchId = Number(branch_id || 0) || null;
  if (!targetBranchId) return;

  const ok = await ensureSingleCartBranchOrWarn(targetBranchId);
  if (!ok.ok) return;

  addToCartWithBranch(p, targetBranchId);
}

function addFromDetails(payload) {
  const p = detailsItem.value;
  if (!p) return;

  if (needsBranchPick.value) return (branchPickOpen.value = true), toast("🏬 Elegí sucursal activa para operar.");
  if (!canSell.value) return toast("🔒 Sin permiso POS (pos.sale). Solo lectura.");

  const unit = Number(payload?.unit_price || 0);
  if (!(unit > 0)) return toast("⚠️ No se pudo calcular precio");

  const forced = cartBranchId();
  const targetBranchId = forced || getActiveBranchId();
  if (!targetBranchId) return (branchPickOpen.value = true), toast("🏬 Elegí sucursal para operar.");

  posStore.addToCart({
    ...p,
    product_id: p.id,
    image: productImage(p),
    available_qty: Number(p?.stockByBranch?.[String(targetBranchId)] || 0),
    price: unit,
    price_label: payload?.price_label || "Descuento",
    price_list: toNum(p.price_list),
    price_discount: toNum(p.price_discount),
    price_reseller: toNum(p.price_reseller),
    effective_price: toNum(p.effective_price),
    chosen_payment_method: payload?.paymentMethod || null,
    chosen_installments: Number(payload?.installments || 1),
    chosen_price_policy: payload?.price_policy || "DISCOUNT",
    chosen_branch_id: Number(targetBranchId),
  });

  detailsOpen.value = false;
  toast("✅ Agregado al carrito");
}

/* refresh */
function refresh() {
  fetchGlobalPool({ in_stock: 0 });
}

/* hotkeys ✅ (F1/F2/F8/PgUp/PgDn/Ctrl+K) */
function onKeydown(e) {
  if (!e || e.repeat) return;

  const key = String(e.key || "");
  const lower = key.toLowerCase();

  // F1 ayuda
  if (lower === "f1") {
    e.preventDefault();
    helpOpen.value = true;
    return;
  }

  // F2 / Ctrl+K buscar
  if (lower === "f2" || (e.ctrlKey && lower === "k")) {
    e.preventDefault();
    filtersRef.value?.focusSearch?.();
    return;
  }

  // F8 cobrar
  if (lower === "f8") {
    e.preventDefault();
    openCheckoutSafe();
    return;
  }

  // PgUp/PgDn paginado
  if (lower === "pageup") {
    e.preventDefault();
    prevPage();
    return;
  }
  if (lower === "pagedown") {
    e.preventDefault();
    nextPage();
    return;
  }
}

onMounted(async () => {
  document.body.classList.add("pos-noscroll");
  shiftStart.value = new Date();
  window.addEventListener("keydown", onKeydown, { capture: true });

  try {
    if (typeof auth.fetchMe === "function") await auth.fetchMe();
  } catch {}

  await loadTaxonomy(auth);

  const ok = await ensureBranchSelected();
  if (!ok?.ok) {
    await fetchGlobalPool({ in_stock: 0 });
    return;
  }
  await fetchGlobalPool({ in_stock: 0 });
});

onBeforeUnmount(() => {
  document.body.classList.remove("pos-noscroll");
  window.removeEventListener("keydown", onKeydown, { capture: true });
});

/* prefetch */
watch(
  () => [page.value, sellableStockTotal.value],
  async () => {
    await prefetchImagesForVisible?.(pagedItems.value);
  }
);
</script>

<style scoped>


/* ✅ COPY-PASTE FINAL COMPLETO */
/* src/modules/pos/pages/PosPage.vue */

:global(html),
:global(body) {
  height: 100%;
}

:global(body.pos-noscroll) {
  overflow: hidden !important;
}

/* =========================
   PAGE ROOT
========================= */
.pos-root {
  height: calc(100dvh - var(--v-layout-top, 0px) - var(--v-layout-bottom, 0px));
  min-height: 0;

  overflow: hidden;
  padding: 14px;
  padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px));
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-background));

  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;

  /* ✅ “aire” general abajo (sensación de corte) */
  --pos-bottom-gap: 18px;
}

/* ================= HEADER ================= */
.pos-header {
  flex: 0 0 auto;
}

.pos-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;

  padding: 14px;
  border-radius: 18px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

.pos-top-left {
  min-width: 320px;
}

.pos-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pos-top-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.pos-action {
  border-radius: 12px;
}

.pos-cashier {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 8px 12px;
  border-radius: 999px;

  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  width: fit-content;
}

.pos-cashier-txt {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.85);
}

.pos-dot {
  opacity: 0.55;
}

/* ================= BODY ================= */
.pos-body {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;

  /* ✅ aire al borde inferior del “body” */
  padding-bottom: var(--pos-bottom-gap);
  box-sizing: border-box;
}

/* ✅ Layout determinístico (no dependemos del grid Vuetify) */
.pos-layout {
  height: 100%;
  min-height: 0;

  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 420px);
  gap: 12px;
}

/* LEFT */
.pos-left {
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ✅ acá scrollea la lista y “cierra” donde corresponde */
.pos-products {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;

  border-radius: 16px;
  padding: 10px;

  /* ✅ aire real abajo dentro del contenedor scrolleable */
  padding-bottom: calc(16px + var(--pos-bottom-gap));

  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgb(var(--v-theme-surface));
  scrollbar-gutter: stable;
  box-sizing: border-box;
}

/* ✅ “colchón” visual extra al final del scroll (no rompe nada) */
.pos-products::after {
  content: "";
  display: block;
  height: var(--pos-bottom-gap);
}

.pos-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* RIGHT */
.pos-right {
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;

  /* ✅ aire abajo para que el carrito no “pegue” al borde */
  padding-bottom: var(--pos-bottom-gap);
  box-sizing: border-box;
}

.pos-right-spacer {
  flex: 1 1 0;
  min-height: 0;
}

/* Ajuste opcional en pantallas medianas */
@media (max-width: 1280px) {
  .pos-layout {
    grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);
  }
}

/* mobile */
@media (max-width: 960px) {
  :global(body.pos-noscroll) {
    overflow: auto !important;
  }

  .pos-root {
    height: auto;
    overflow: visible;
  }

  .pos-body {
    overflow: visible;
    padding-bottom: 0;
  }

  .pos-layout {
    height: auto;
    display: block;
  }

  .pos-products {
    height: auto;
    overflow: visible;
    padding-bottom: 16px;
  }

  .pos-products::after {
    display: none;
  }

  .pos-right {
    padding-bottom: 0;
  }
}


</style>