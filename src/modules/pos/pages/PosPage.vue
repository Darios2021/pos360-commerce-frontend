<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/pages/PosPage.vue -->
<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- TEMPLATE para src/modules/pos/pages/PosPage.vue (header ya usa PosTopBar) -->
<template>
  <v-container fluid class="pos-root">
    <!-- ================= HEADER ================= -->
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

    <!-- ================= BODY ================= -->
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

    <PosPickBranchDialog
      v-model:open="pickBranchOpen"
      :branches="pickBranchOptions"
      @confirm="onPickBranchConfirm"
    />

    <!-- ✅ CAMBIAR SUCURSAL ACTIVA -->
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

/* ✅ NEW: Top bar component */
import PosTopBar from "../components/PosTopBar.vue";

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
  fetchedBranches, // ✅ CLAVE: acá están los nombres reales del /branches (Rawson, etc)
} = usePosBranch({ auth, posStore });

/* ✅ branch scope */
const branchScope = usePosBranchScope({ auth, userBranches, branchItems });

/* =========================================================
   ✅ FIX DEFINITIVO NOMBRES EN SELECT
   - Primero usa fetchedBranches (vienen con name real)
   - Si está vacío, cae a branchItems (fallback)
========================================================= */
const uiBranchesForSelect = computed(() => {
  const fb = Array.isArray(fetchedBranches?.value) ? fetchedBranches.value : [];

  // 1) ✅ si fetchedBranches trae nombres reales -> usar eso
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

  // 2) fallback: branchItems
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

/* dialog selection (SIEMPRE number) */
const branchPickSelected = ref(null);

function getActiveBranchIdSafe() {
  const v = activeBranchId?.value;
  return Number(v?.id ?? v?.value ?? v ?? posStore?.branch_id ?? 0) || null;
}

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
const { loadingGlobal, errorGlobal, globalItems, fetchGlobalPool, branchesWithStock } =
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

/* pick branch (producto) */
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

/* hotkeys */
function onKeydown(e) {
  if (!e || e.repeat) return;

  const key = String(e.key || "");
  const lower = key.toLowerCase();

  if (lower === "f1") {
    e.preventDefault();
    helpOpen.value = true;
    return;
  }

  if (lower === "f2" || (e.ctrlKey && lower === "k")) {
    e.preventDefault();
    filtersRef.value?.focusSearch?.();
    return;
  }

  if (lower === "f8") {
    e.preventDefault();
    openCheckoutSafe();
    return;
  }

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
  --pos-bottom-gap: 18px;
}
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
.pos-body {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  padding-bottom: var(--pos-bottom-gap);
  box-sizing: border-box;
}
.pos-layout {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 420px);
  gap: 12px;
}
.pos-left {
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pos-products {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
  border-radius: 16px;
  padding: 10px;
  padding-bottom: calc(16px + var(--pos-bottom-gap));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgb(var(--v-theme-surface));
  scrollbar-gutter: stable;
  box-sizing: border-box;
}
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
.pos-right {
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding-bottom: var(--pos-bottom-gap);
  box-sizing: border-box;
}
.pos-right-spacer {
  flex: 1 1 0;
  min-height: 0;
}
@media (max-width: 1280px) {
  .pos-layout {
    grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);
  }
}
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