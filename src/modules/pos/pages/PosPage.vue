<template>
  <v-container fluid class="pos-root">
    <div class="pos-header">
      <PosTopBar
        class="pos-surface pos-topbar-shell"
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
        :checkout-disabled="(posStore.cart || []).length === 0 || !canSell.value || needsBranchPick.value"
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
            class="pos-surface pos-filters-shell"
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

          <PosProductsPanel
            class="pos-products-panel pos-surface pos-products-shell"
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
          <div class="pos-surface pos-side-shell pos-customer-shell">
            <PosCustomerPanel
              v-model="customer"
              :disabled="customerDisabled"
              :has-data="customerHasData"
              @clear="clearCustomer"
            />
          </div>

          <div class="pos-cart-wrap">
            <PosCartPanel
              class="pos-surface pos-side-shell pos-cart-shell"
              :cart="posStore.cart"
              :total-items="posStore.totalItems"
              :total="checkoutTotalPreview"
              :can-edit="canSell && !needsBranchPick"
              :pos-store="posStore"
              @checkout="openCheckoutSafe"
            />
          </div>

          <div v-if="cartBranchLabel" class="pos-cart-branch-note text-caption text-medium-emphasis">
            Carrito: <b>{{ cartBranchLabel }}</b>
          </div>
        </div>
      </div>
    </div>

    <PosProductDetailsDialog
      v-model:open="detailsOpen"
      :can-sell="canSell && !needsBranchPick"
      :item="detailsItem"
      :image="detailsItem ? productImage(detailsItem) : ''"
      @add="addFromDetails"
    />

    <CheckoutDialog
      v-model:open="checkoutDialog"
      :total="checkoutTotal"
      :total-preview="checkoutTotalPreview"
      :cart="cartForCheckout"
      :installments-items="installmentsItems12"
      v-model:paymentMethod="paymentMethod"
      v-model:installments="installments"
      v-model:applyReseller="applyReseller"
      v-model:cashInput="cashInput"
      @confirm="onCheckoutConfirm"
      @cancel="onCheckoutCancel"
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

import PosCustomerPanel from "../components/PosCustomerPanel.vue";

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

/* ======================================================
   ✅ CLIENTE: draft local + attach al checkout
====================================================== */
const CUSTOMER_DRAFT_KEY = "pos_customer_draft_v1";

function emptyCustomer() {
  return {
    name: "",
    doc: "",
    phone: "",
    email: "",
    address: "",
    note: "",
  };
}

const customer = ref(emptyCustomer());

function normalizeCustomer(obj) {
  const o = obj && typeof obj === "object" ? obj : {};
  return {
    name: String(o.name ?? o.full_name ?? o.razon_social ?? o.company ?? "").trim(),
    doc: String(o.doc ?? o.dni ?? o.cuit ?? o.document ?? "").trim(),
    phone: String(o.phone ?? o.tel ?? o.telefono ?? "").trim(),
    email: String(o.email ?? "").trim(),
    address: String(o.address ?? o.direccion ?? "").trim(),
    note: String(o.note ?? o.obs ?? o.observaciones ?? "").trim(),
  };
}

const customerHasData = computed(() => {
  const c = customer.value || {};
  return !!(
    String(c.name || "").trim() ||
    String(c.doc || "").trim() ||
    String(c.phone || "").trim() ||
    String(c.email || "").trim() ||
    String(c.address || "").trim() ||
    String(c.note || "").trim()
  );
});

const customerDisabled = computed(() => {
  return !!loadingGlobal.value || !!isViewOnly?.value || !!needsBranchPick?.value || !canSell?.value;
});

function loadCustomerDraft() {
  try {
    const raw = localStorage.getItem(CUSTOMER_DRAFT_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    customer.value = normalizeCustomer(parsed);
  } catch {}
}

function saveCustomerDraft() {
  try {
    localStorage.setItem(CUSTOMER_DRAFT_KEY, JSON.stringify(normalizeCustomer(customer.value)));
  } catch {}
}

function clearCustomer() {
  customer.value = emptyCustomer();
  try {
    localStorage.removeItem(CUSTOMER_DRAFT_KEY);
  } catch {}
  tryAttachCustomerToStore(null);
}

function tryAttachCustomerToStore(custOrNull) {
  const payload = custOrNull ? normalizeCustomer(custOrNull) : null;

  const candidates = [
    ["setCustomer", (s) => s.setCustomer(payload)],
    ["setClient", (s) => s.setClient(payload)],
    ["setBuyer", (s) => s.setBuyer(payload)],
    ["setCustomerDraft", (s) => s.setCustomerDraft(payload)],
    ["setCustomerInfo", (s) => s.setCustomerInfo(payload)],
  ];

  for (const [name, fn] of candidates) {
    try {
      if (typeof posStore?.[name] === "function") {
        fn(posStore);
        return true;
      }
    } catch (e) {
      console.warn("[POS] customer attach method failed:", name, e);
    }
  }

  try {
    if (typeof posStore?.$patch === "function") {
      posStore.$patch({ customer: payload, customer_info: payload, customerInfo: payload });
      return true;
    }
  } catch {}

  try {
    posStore.customer = payload;
    posStore.customer_info = payload;
    posStore.customerInfo = payload;
    return true;
  } catch {}

  return false;
}

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
const { loadingGlobal, errorGlobal, globalItems, fetchGlobalPool } = usePosMultiBranchCatalog({
  branchScope,
  isSellable,
});

const installmentsItems12 = computed(() => {
  const out = [];
  out.push({ title: "1 pago", value: 1 });
  for (let i = 2; i <= 12; i++) out.push({ title: `${i} cuotas`, value: i });
  return out;
});

function cartKey(it) {
  const pid = Number(it?.product_id ?? it?.productId ?? it?.product?.id ?? it?.id ?? 0) || null;
  const sku = String(it?.sku ?? it?.code ?? it?.product?.sku ?? it?.product?.code ?? "").trim();
  return { pid, sku };
}

function findProductInPool(it) {
  const { pid, sku } = cartKey(it);
  const pool = Array.isArray(globalItems?.value) ? globalItems.value : [];

  if (pid) {
    const byId = pool.find((p) => Number(p?.id ?? p?.product_id ?? 0) === pid);
    if (byId) return byId;
  }

  if (sku) {
    const bySku = pool.find((p) => String(p?.sku ?? p?.code ?? "").trim() === sku);
    if (bySku) return bySku;
  }

  return null;
}

const cartForCheckout = computed(() => {
  const cart = Array.isArray(posStore?.cart) ? posStore.cart : [];
  return cart.map((it) => {
    const already = String(it?.image || it?.image_url || it?.imageUrl || it?.thumb || it?.thumbnail || "").trim();
    if (already) return it;

    const p = findProductInPool(it);
    if (!p) return it;

    const img = productImage(p);
    if (!img) return it;

    return {
      ...it,
      image: img,
      image_url: img,
      product: it?.product ? { ...it.product, image: img, image_url: img } : it?.product,
    };
  });
});

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

/* add safe */
function addToCartSafe(product, qty = 1) {
  if (!product) return false;

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
    }
  }

  return false;
}

function add(product) {
  if (!product) return;

  if (!canSell?.value) {
    toast("⛔ No tenés permiso para vender.");
    return;
  }

  if (needsBranchPick?.value) {
    toast("🏬 Elegí una sucursal antes de agregar productos.");
    return;
  }

  const ok = addToCartSafe(product, 1);
  if (!ok) {
    toast("⚠️ No encontré el método para agregar al carrito (posStore).");
    console.warn("[POS] No add method found in posStore. Revisá pos.store:", posStore);
  }
}

function addFromDetails(payload) {
  const product = detailsItem.value;
  const meta = payload || {};
  const unitPrice = Number(meta.unit_price || 0) || 0;

  if (!product) {
    toast("⚠️ No hay producto seleccionado (detailsItem null).");
    return;
  }

  if (!canSell?.value) {
    toast("⛔ No tenés permiso para vender.");
    return;
  }

  if (needsBranchPick?.value) {
    toast("🏬 Elegí una sucursal antes de agregar productos.");
    return;
  }

  if (unitPrice <= 0) {
    toast("⚠️ Producto sin precio válido.");
    return;
  }

  const pricedCandidates = [
    ["addToCartWithPrice", (s) => s.addToCartWithPrice(product, unitPrice, meta)],
    ["addWithPrice", (s) => s.addWithPrice(product, unitPrice, meta)],
    ["addPriced", (s) => s.addPriced(product, unitPrice, meta)],
    ["addFromDetails", (s) => s.addFromDetails(product, meta)],
  ];

  for (const [name, fn] of pricedCandidates) {
    try {
      if (typeof posStore?.[name] === "function") {
        fn(posStore);
        toast("✅ Agregado al carrito");
        detailsOpen.value = false;
        return;
      }
    } catch (e) {
      console.warn("[POS] priced add method failed:", name, e);
    }
  }

  const cloned = {
    ...product,
    unit_price: unitPrice,
    price_policy: meta.price_policy || null,
    price_label: meta.price_label || null,
    paymentMethod: meta.paymentMethod || null,
    installments: Number(meta.installments || 1) || 1,
    applyReseller: Boolean(meta.applyReseller),
    __pos_pricing: { ...meta, unit_price: unitPrice },
  };

  const ok = addToCartSafe(cloned, 1);
  if (!ok) {
    toast("⚠️ No encontré el método para agregar al carrito (posStore).");
    console.warn("[POS] No add method found in posStore. Revisá pos.store:", posStore);
    return;
  }

  toast("✅ Agregado al carrito");
  detailsOpen.value = false;
}

/* pick branch (producto) */
const pickBranchOpen = ref(false);
const pickBranchProduct = ref(null);
const pickBranchOptions = ref([]);

function onPickBranchConfirm() {
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
  paymentMethod,
  installments,
  applyReseller,
  cashInput,
  openCheckout,
  confirmPayment,
} = usePosCheckout({
  posStore,
  canSell,
  needsBranchPick,
  resolveUnitPrice,
  toNum,
  allSellable,
  customerRef: customer,
});

function openCheckoutSafe() {
  openCheckout({ onSnack: toast });
}

async function onCheckoutConfirm(payload) {
  try {
    if (customerHasData.value) {
      tryAttachCustomerToStore(customer.value);
      saveCustomerDraft();
    } else {
      tryAttachCustomerToStore(null);
    }

    if (payload?.payment_method) paymentMethod.value = String(payload.payment_method).toUpperCase();
    if (payload?.installments != null) installments.value = Number(payload.installments || 1);
    if (payload?.apply_reseller != null) applyReseller.value = !!payload.apply_reseller;
    if (payload?.cash_received != null) cashInput.value = String(payload.cash_received || "");

    await confirmPayment({
      onSnack: toast,
      payloadFromDialog: payload,
    });

    await fetchGlobalPool({ in_stock: 0 });
  } catch (e) {
    console.error("[POS] onCheckoutConfirm error", e);
  }
}

function onCheckoutCancel() {}

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

  loadCustomerDraft();
  if (customerHasData.value) tryAttachCustomerToStore(customer.value);

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

watch(
  () => [page.value, sellableStockTotal.value],
  async () => {
    await prefetchImagesForVisible?.(pagedItems.value);
  }
);

watch(
  () => branchPickOpen.value,
  (open) => {
    if (open) branchPickSelected.value = getActiveBranchIdSafe();
  }
);

watch(
  () => customer.value,
  () => {
    if (customerDisabled.value) return;
    saveCustomerDraft();
  },
  { deep: true }
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

  --pos-gap: clamp(10px, 0.9vw, 16px);
  --pos-pad: clamp(8px, 0.85vw, 14px);
  --pos-radius: 16px;
  --pos-radius-lg: 18px;
  --pos-border-light: rgba(0, 0, 0, 0.07);
  --pos-border-dark: rgba(255, 255, 255, 0.09);
  --pos-shadow-light:
    0 8px 20px rgba(15, 23, 42, 0.06),
    0 2px 6px rgba(15, 23, 42, 0.04);
  --pos-shadow-light-hover:
    0 12px 24px rgba(15, 23, 42, 0.08),
    0 3px 8px rgba(15, 23, 42, 0.05);
  --pos-shadow-dark:
    0 10px 24px rgba(0, 0, 0, 0.28),
    0 2px 8px rgba(0, 0, 0, 0.18);
  --pos-shadow-dark-hover:
    0 14px 28px rgba(0, 0, 0, 0.34),
    0 3px 10px rgba(0, 0, 0, 0.22);

  padding: var(--pos-pad);
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-background));

  display: flex;
  flex-direction: column;
  gap: var(--pos-gap);
  box-sizing: border-box;
}

.pos-header {
  flex: 0 0 auto;
  min-height: 0;
}

.pos-body {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.pos-layout {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(300px, 24vw, 360px);
  gap: var(--pos-gap);
  align-items: stretch;
}

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

/* ✅ CLAVE DEL FIX */
.pos-right {
  min-height: 0;
  min-width: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: var(--pos-gap);
  overflow: hidden;
}

.pos-customer-shell {
  min-height: 0;
  min-width: 0;
  flex: 0 0 auto;
}

.pos-cart-wrap {
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  display: flex;
}

.pos-cart-shell {
  min-height: 0;
  min-width: 0;
  width: 100%;
  height: 100%;
}

.pos-cart-branch-note {
  padding-inline: 2px;
  opacity: 0.88;
}

.pos-surface {
  position: relative;
  background:
    linear-gradient(180deg, rgba(var(--v-theme-surface), 1) 0%, rgba(var(--v-theme-surface), 1) 100%);
  border: 1px solid var(--pos-border-light);
  border-radius: var(--pos-radius);
  box-shadow: var(--pos-shadow-light);
  overflow: hidden;
  transition:
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

.pos-surface:hover {
  box-shadow: var(--pos-shadow-light-hover);
  border-color: rgba(0, 0, 0, 0.09);
}

.pos-topbar-shell,
.pos-filters-shell,
.pos-products-shell,
.pos-side-shell {
  backdrop-filter: saturate(1.05);
}

.pos-topbar-shell {
  border-radius: var(--pos-radius-lg);
}

:global(.v-theme--dark) .pos-surface {
  border-color: var(--pos-border-dark);
  box-shadow: var(--pos-shadow-dark);
}

:global(.v-theme--dark) .pos-surface:hover {
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: var(--pos-shadow-dark-hover);
}

@media (max-width: 1440px) {
  .pos-root {
    --pos-gap: 10px;
    --pos-pad: 10px;
    --pos-radius: 15px;
    --pos-radius-lg: 16px;
  }

  .pos-layout {
    grid-template-columns: minmax(0, 1fr) 338px;
  }
}

@media (max-width: 1280px) {
  .pos-root {
    --pos-gap: 9px;
    --pos-pad: 9px;
    --pos-radius: 14px;
    --pos-radius-lg: 15px;
  }

  .pos-layout {
    grid-template-columns: minmax(0, 1fr) 320px;
  }
}

@media (max-width: 1100px) {
  .pos-layout {
    grid-template-columns: minmax(0, 1fr) 300px;
  }
}

@media (max-width: 960px) {
  :global(body.pos-noscroll) {
    overflow: auto !important;
  }

  .pos-root {
    height: auto;
    overflow: visible;
    --pos-gap: 12px;
    --pos-pad: 12px;
  }

  .pos-body {
    overflow: visible;
  }

  .pos-layout {
    height: auto;
    min-height: auto;
    display: flex;
    flex-direction: column;
  }

  .pos-left,
  .pos-right,
  .pos-cart-wrap,
  .pos-products-panel {
    min-height: auto;
  }

  .pos-right {
    display: flex;
    overflow: visible;
  }

  .pos-customer-shell,
  .pos-cart-shell,
  .pos-products-shell,
  .pos-filters-shell,
  .pos-topbar-shell {
    border-radius: 16px;
  }
}

@media (max-width: 600px) {
  .pos-root {
    --pos-gap: 10px;
    --pos-pad: 10px;
  }

  .pos-customer-shell,
  .pos-cart-shell,
  .pos-products-shell,
  .pos-filters-shell,
  .pos-topbar-shell {
    border-radius: 14px;
  }
}
</style>