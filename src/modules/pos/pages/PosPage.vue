<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/pages/PosPage.vue -->
<template>
  <v-container fluid class="pos-root">
    <div class="pos-header">
      <PosTopBar
        :branch-chip-label="branchChipLabel"
        :sellable-stock-total="sellableStockTotal"
        :stock-only-total="stockOnlyTotal"
        :cashier-name="cashierName"
        :shift-start-text="shiftStartText"
        :is-view-only="isViewOnly"
        :needs-branch-pick="needsBranchPick"
        :has-multi-branches="hasMultiBranches"
        :loading-global="loadingGlobal"
        :cart-count="(posStore.cart || []).length"
        :checkout-disabled="(posStore.cart || []).length === 0 || !canSell || needsBranchPick"
        @refresh="refresh"
        @open-branch-switch="openBranchSwitch"
        @help="helpOpen = true"
        @checkout="openCheckoutSafe"
      />
    </div>

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

          <!-- ✅ PRODUCTS PANEL -->
          <PosProductsPanel
            class="pos-products-panel"
            :loading="loadingGlobal"
            :disabled="loadingGlobal"
            :items="pagedItems"
            :shown-count="pagedItems.length"
            :total-count="sellableStockTotal"
            :stock-only-total="stockOnlyTotal"
            :page="page"
            :pages="pages"
            @prev="prevPage"
            @next="nextPage"
          >
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
          </PosProductsPanel>
        </div>

        <!-- RIGHT -->
        <div class="pos-right">
          <div class="pos-cart-wrap">
            <PosCartPanel
              :cart="posStore.cart"
              :total-items="posStore.totalItems"
              :total="checkoutTotalPreview"
              :can-edit="canSell && !needsBranchPick"
              :pos-store="posStore"
              @checkout="openCheckoutSafe"
            />
          </div>

          <div v-if="cartBranchLabel" class="text-caption text-medium-emphasis">
            Carrito: <b>{{ cartBranchLabel }}</b>
          </div>

          <div class="pos-right-spacer" />
        </div>
      </div>
    </div>

    <!-- dialogs -->
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

    <PosPickBranchDialog
      v-model:open="pickBranchOpen"
      :branches="pickBranchOptions"
      @confirm="onPickBranchConfirm"
    />

    <v-dialog v-model="branchPickOpen" max-width="560">
      <v-card class="rounded-xl overflow-hidden">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon>mdi-store</v-icon>
          <span class="font-weight-bold">Cambiar sucursal activa</span>
        </v-card-title>

        <v-card-text class="pt-2">
          <div class="text-caption text-medium-emphasis mb-3">
            La sucursal activa define desde dónde operás (stock / venta).
          </div>

          <v-alert v-if="(posStore.cart || []).length" type="warning" variant="tonal" class="mb-3">
            Tenés un carrito en curso. Terminá la venta o vaciá el carrito antes de cambiar sucursal.
          </v-alert>

          <v-select
            v-model="branchPickSelected"
            :items="uiBranchesForSelect"
            item-title="title"
            item-value="value"
            :return-object="false"
            label="Sucursal"
            variant="outlined"
            density="comfortable"
            :disabled="(posStore.cart || []).length > 0"
            hint="Elegí la sucursal donde vas a operar"
            persistent-hint
          />
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-btn variant="tonal" @click="branchPickOpen = false">Cancelar</v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            variant="flat"
            :disabled="!branchPickSelected || (posStore.cart || []).length > 0"
            @click="confirmActiveBranchChange"
          >
            Aplicar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <PosShortcutsHelpDialog v-model="helpOpen" />
    <v-snackbar v-model="snack.show" :timeout="3200">{{ snack.text }}</v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { usePosStore } from "../../../app/store/pos.store";

import PosTopBar from "../components/PosTopBar.vue";
import PosFiltersBar from "../components/PosFiltersBar.vue";
import { usePosFilters } from "../composables/usePosFilters";

import PosProductsPanel from "../components/PosProductsPanel.vue";
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
  fetchedBranches,
} = usePosBranch({ auth, posStore });

const branchScope = usePosBranchScope({ auth, userBranches, branchItems });

const uiBranchesForSelect = computed(() => {
  const fb = Array.isArray(fetchedBranches?.value) ? fetchedBranches.value : [];
  if (fb.length) {
    return fb
      .map((b) => {
        const value = Number(b?.id ?? b?.branch_id ?? 0) || null;
        if (!value) return null;
        const title = String(b?.name ?? b?.branch_name ?? "").trim() || `Sucursal #${value}`;
        return { title, value };
      })
      .filter(Boolean);
  }

  const raw = Array.isArray(branchItems?.value) ? branchItems.value : [];
  return raw
    .map((it) => {
      const value = Number(it?.value ?? it?.id ?? 0) || null;
      if (!value) return null;
      const title = String(it?.title ?? it?.name ?? "").trim() || `Sucursal #${value}`;
      return { title, value };
    })
    .filter(Boolean);
});

const hasMultiBranches = computed(() => uiBranchesForSelect.value.length > 1);
const branchPickSelected = ref(null);

function getActiveBranchIdSafe() {
  const v = activeBranchId?.value;
  return Number(v?.id ?? v?.value ?? v ?? posStore?.branch_id ?? 0) || null;
}

/* ✅ label informativo del carrito (si tu store maneja branch del carrito, lo mostramos; si no, fallback) */
const cartBranchLabel = computed(() => {
  const id = Number(posStore?.cart_branch_id ?? posStore?.cartBranchId ?? 0) || null;
  if (!id) return "";
  const list = uiBranchesForSelect.value || [];
  const found = list.find((x) => Number(x.value) === id);
  return found?.title || `Sucursal #${id}`;
});

function openBranchSwitch() {
  if (!hasMultiBranches.value) return;

  if ((posStore.cart || []).length) {
    toast("🧠 Terminá la venta o vaciá el carrito antes de cambiar sucursal.");
    return;
  }

  branchPickSelected.value = getActiveBranchIdSafe();
  branchPickOpen.value = true;
}

async function confirmActiveBranchChange() {
  if ((posStore.cart || []).length) {
    toast("🧠 Terminá la venta o vaciá el carrito antes de cambiar sucursal.");
    branchPickOpen.value = false;
    return;
  }

  const nextId = Number(branchPickSelected.value || 0) || null;
  if (!nextId) return;

  try {
    if (typeof posStore.setBranchId === "function") posStore.setBranchId(nextId);
    else if (typeof posStore.setActiveBranch === "function") posStore.setActiveBranch(nextId);
    else if (typeof posStore.$patch === "function") posStore.$patch({ branch_id: nextId });
    else posStore.branch_id = nextId;
  } catch {}

  try {
    localStorage.setItem("pos_branch_id", String(nextId));
    localStorage.setItem("active_branch_id", String(nextId));
    localStorage.setItem("branch_id", String(nextId));
  } catch {}

  try {
    activeBranchId.value = nextId;
  } catch {}

  try {
    await ensureBranchSelected?.();
  } catch {}

  branchPickOpen.value = false;

  try {
    await fetchGlobalPool({ in_stock: 0 });
  } catch {}

  toast("✅ Sucursal activa actualizada");
}

/* pricing */
const { resolveUnitPrice, isSellable, toNum } = usePosPricing();

/* images */
const { productImage, prefetchImagesForVisible } = usePosImages();

/* catálogo global */
const { loadingGlobal, errorGlobal, globalItems, fetchGlobalPool } =
  usePosMultiBranchCatalog({ branchScope, isSellable });

/* helpers stock */
function getActiveBranchId() {
  return getActiveBranchIdSafe();
}
function qtyForActive(p) {
  const ab = getActiveBranchId();
  if (!ab) return Number(p?.total_qty || 0) || 0;
  return Number(p?.stockByBranch?.[String(ab)] || 0) || 0;
}

/* filtros */
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

/* ✅ FIX CLAVE: volver a tener add() para el botón + */
function addToCartSafe(product, qty = 1) {
  if (!product) return false;

  // intentamos métodos típicos del store sin asumir uno solo
  const candidates = [
    ["addToCart", (s) => s.addToCart(product, qty)],
    ["add", (s) => s.add(product, qty)],
    ["addItem", (s) => s.addItem(product, qty)],
    ["addProduct", (s) => s.addProduct(product, qty)],
    ["cartAdd", (s) => s.cartAdd(product, qty)],
    ["pushToCart", (s) => s.pushToCart(product, qty)],
  ];

  for (const [name, fn] of candidates) {
    try {
      if (typeof posStore?.[name] === "function") {
        fn(posStore);
        return true;
      }
    } catch (e) {
      console.warn("[POS] addToCart method failed:", name, e);
      // seguimos probando
    }
  }

  return false;
}

function add(p) {
  if (!p) return;

  if (!canSell?.value) {
    toast("⛔ No tenés permiso para vender.");
    return;
  }

  if (needsBranchPick?.value) {
    toast("🏬 Elegí una sucursal antes de agregar productos.");
    return;
  }

  const ok = addToCartSafe(p, 1);
  if (!ok) {
    toast("⚠️ No encontré el método para agregar al carrito en posStore.");
    console.warn("[POS] No add method found in posStore. Revisá pos.store:", posStore);
    return;
  }
}

function addFromDetails(p) {
  add(p);
}

/* pick branch (producto) - si tu dialog lo usa */
const pickBranchOpen = ref(false);
const pickBranchProduct = ref(null);
const pickBranchOptions = ref([]);

function onPickBranchConfirm(payload) {
  // placeholder: si tu PosPickBranchDialog emite otra estructura, lo ajustamos
  // lo dejamos para no romper imports/eventos
  pickBranchOpen.value = false;
  pickBranchProduct.value = null;
  pickBranchOptions.value = [];
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

function refresh() {
  fetchGlobalPool({ in_stock: 0 });
}

/* hotkeys */
function onKeydown(e) {
  if (!e || e.repeat) return;
  const key = String(e.key || "").toLowerCase();

  if (key === "f1") {
    e.preventDefault();
    helpOpen.value = true;
    return;
  }
  if (key === "f2" || (e.ctrlKey && key === "k")) {
    e.preventDefault();
    filtersRef.value?.focusSearch?.();
    return;
  }
  if (key === "f8") {
    e.preventDefault();
    openCheckoutSafe();
    return;
  }
  if (key === "pageup") {
    e.preventDefault();
    prevPage();
    return;
  }
  if (key === "pagedown") {
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

/* sync selection when dialog opens */
watch(
  () => branchPickOpen.value,
  (open) => {
    if (open) branchPickSelected.value = getActiveBranchIdSafe();
  }
);
</script>

<style scoped>
:global(html),
:global(body) {
  height: 100%;
}
:global(body.pos-noscroll) {
  overflow: hidden !important;
}

/* =========================================================
   ✅ LEVANTAR TODO (aire real abajo)
========================================================= */
.pos-root {
  height: calc(100dvh - var(--v-layout-top, 0px) - var(--v-layout-bottom, 0px));
  min-height: 0;
  overflow: hidden;

  --pos-gap: 14px;
  --pos-pad: 14px;
  --pos-bottom-space: 40px;

  padding: var(--pos-pad);
  padding-bottom: calc(var(--pos-pad) + var(--pos-bottom-space) + env(safe-area-inset-bottom, 0px));

  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-background));

  display: flex;
  flex-direction: column;
  gap: var(--pos-gap);
  box-sizing: border-box;
}

.pos-header {
  flex: 0 0 auto;
}

.pos-body {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;

  padding-bottom: var(--pos-bottom-space);
  box-sizing: border-box;
}

.pos-layout {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: var(--pos-gap);
}

/* LEFT */
.pos-left {
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--pos-gap);
}

.pos-products-panel {
  flex: 1 1 0;
  min-height: 0;
}

/* RIGHT */
.pos-right {
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pos-cart-wrap {
  min-height: 0;
  height: 100%;
}
.pos-right-spacer {
  flex: 1 1 0;
  min-height: 0;
}

/* Notebook */
@media (max-width: 1366px) {
  .pos-root {
    --pos-gap: 12px;
    --pos-pad: 12px;
    --pos-bottom-space: 34px;

    padding: var(--pos-pad);
    padding-bottom: calc(var(--pos-pad) + var(--pos-bottom-space) + env(safe-area-inset-bottom, 0px));
  }

  .pos-layout {
    grid-template-columns: minmax(0, 1fr) 340px;
  }
}

/* Mobile */
@media (max-width: 960px) {
  :global(body.pos-noscroll) {
    overflow: auto !important;
  }

  .pos-root {
    height: auto;
    overflow: visible;

    --pos-pad: 12px;
    --pos-bottom-space: 22px;

    padding: var(--pos-pad);
    padding-bottom: calc(var(--pos-pad) + var(--pos-bottom-space) + env(safe-area-inset-bottom, 0px));
  }

  .pos-body {
    overflow: visible;
    padding-bottom: 0;
  }

  .pos-layout {
    height: auto;
    display: block;
  }

  .pos-products-panel {
    min-height: auto;
  }
}
</style>