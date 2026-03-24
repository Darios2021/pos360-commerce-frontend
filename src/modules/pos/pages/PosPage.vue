<template>
  <v-container fluid class="pos-root">
    <div class="pos-header">
      <div class="pos-header-main">
        <div class="pos-header-caja">
          <div class="pos-surface pos-caja-actions-shell">
            <PosCajaActionsBar
              :is-caja-open="isCajaOpen"
              :opened-at="currentCashRegister?.opened_at || openedAt"
              :opened-by="
                currentCashRegister?.opened_by_name ||
                currentCashRegister?.user_name ||
                cashierName
              "
              :branch-chip-label="branchChipLabel"
              :has-multi-branches="hasMultiBranches"
              :loading-global="loading || cajaBusy"
              :cart-count="cartCount"
              @open-config="openCajaConfig"
              @close-caja="onCloseCaja"
              @refresh="refresh"
              @open-branch-switch="openBranchSwitch"
            />
          </div>
        </div>

        <div class="pos-header-topbar">
          <PosTopBar
            class="pos-surface pos-topbar-shell"
            :is-view-only="isViewOnly"
            :needs-branch-pick="needsBranchPick"
            :has-multi-branches="hasMultiBranches"
            :loading-global="loading || cajaBusy"
            :cart-count="cartCount"
            @help="handleHelp"
            @clients="handleClients"
            @search="handleSearch"
            @show-cart="openCartDialog"
            @cash-in="handleCashIn"
            @pay="handlePay"
            @blocked-pay="handleBlockedPay"
            @blocked-cash-in="handleBlockedCashIn"
          />
        </div>
      </div>
    </div>

    <div class="pos-body">
      <div class="pos-layout">
        <div class="pos-left">
          <PosScannerSearchBar
            ref="filtersRef"
            class="pos-surface pos-filters-shell pos-scanner-search-shell"
            v-model:q="q"
            v-model:rubro-id="rubroId"
            v-model:subrubro-id="subrubroId"
            :visual-state="scannerVisualState"
            :icon-name="scannerIconName"
            :icon-color="scannerIconColor"
            :state-label="scannerStateLabel"
            :last-scan="scannerLastScan"
            :last-message="scannerLastMessage"
            :is-on="scannerIsOn"
            :sound-enabled="true"
            :vibration-enabled="true"
            :show-test-button="true"
            :rubro-items="rubroItems"
            :subrubro-items="subrubroItems"
            :subrubro-no-data-text="subrubroNoDataText"
            :page="page"
            :pages="pages"
            :shown-count="items.length"
            :total-count="total"
            :stock-only-total="total"
            :error="error"
            :disabled-all="loading"
            @toggle="toggleScanner"
            @test="openScannerTest"
            @typing="onTyping"
            @enter="onEnter"
            @clear="clearQuery"
            @rubro-change="onRubroChange"
            @prev="prevPage"
            @next="nextPage"
          />

          <PosProductsPanel
            class="pos-products-panel pos-surface pos-products-shell"
            :loading="loading"
            :disabled="loading"
            :items="items"
            :shown-count="items.length"
            :total-count="total"
            :stock-only-total="total"
            :page="page"
            :pages="pages"
            @prev="prevPage"
            @next="nextPage"
          >
            <PosProductRow
              v-for="p in items"
              :key="p.id"
              :item="p"
              :image="productImage(p)"
              :name="p.name"
              :sku="p.sku || p.code"
              :stkLabel="`STK ${p.stock_qty ?? p.qty ?? 0}`"
              :offLabel="getOffLabel(p)"
              :rubro-label="rubroTitleFromProduct?.(p) || ''"
              :subrubro-label="subrubroTitleFromProduct?.(p) || ''"
              :price-discount="p.price_discount ?? p.effective_price ?? p.price ?? 0"
              :price-list="p.price_list ?? p.price ?? 0"
              :disabled="productsDisabled"
              @add="add"
              @details="openDetails"
            />
          </PosProductsPanel>
        </div>

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
              :can-edit="cartEditable"
              :pos-store="posStore"
              @checkout="openCheckoutSafe"
            />
          </div>

          <div
            v-if="cartBranchLabel"
            class="pos-cart-branch-note text-caption text-medium-emphasis"
          >
            Carrito: <b>{{ cartBranchLabel }}</b>
          </div>
        </div>
      </div>
    </div>

    <PosCartPreviewDialog
      v-model="showCartDialog"
      :items="cartItems"
      :total-amount="checkoutTotalPreview"
      currency="ARS"
      @go-pay="handleGoPayFromCart"
    />

    <PosProductDetailsDialog
      v-model:open="detailsOpen"
      :can-sell="detailsCanSell"
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

    <PosBranchSwitchDialog
      v-model:open="branchPickOpen"
      v-model:selected="branchPickSelected"
      :items="uiBranchesForSelect"
      :cart-count="cartCount"
      @confirm="confirmActiveBranchChange"
    />

    <PosCajaConfigDialog
      v-model:open="cajaConfigOpen"
      :caja-type="cajaType"
      :invoice-mode="invoiceMode"
      :invoice-type="invoiceType"
      :opening-amount="openingAmount"
      :note="openingNote"
      :caja-type-options="cajaTypeOptions"
      :invoice-mode-options="invoiceModeOptions"
      :invoice-type-options="invoiceTypeOptions"
      @save="onSaveCajaConfig"
    />

    <PosCajaArqueoDialog
      v-model:open="cajaArqueoOpen"
      :is-caja-open="isCajaOpen"
      :caja-type-label="cajaTypeLabel"
      :invoice-type-label="invoiceTypeLabel"
      :summary="summary"
      @save="onSaveArqueo"
    />

    <PosShortcutsHelpDialog v-model="helpOpen" />

    <PosConsultaDialog
      v-model="consultaOpen"
      :items="consultaItems"
      :loading="consultaLoading"
      @manual-search="handleManualConsulta"
      @barcode-search="handleBarcodeConsulta"
      @add-to-cart="handleAddConsultaToCart"
      @select="handleSelectConsultaItem"
    />

    <v-dialog v-model="scannerTestOpen" max-width="460">
      <v-card class="pos-scanner-test-dialog">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Probar scanner</span>
          <v-btn
            icon
            variant="text"
            density="comfortable"
            @click="scannerTestOpen = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pt-2">
          <div class="text-body-2 mb-3">
            Pegá o escribí un código para simular una lectura de pistola.
          </div>

          <v-text-field
            v-model="scannerTestCode"
            label="Código"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            @keyup.enter="runScannerTest"
          />
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="scannerTestOpen = false">
            Cerrar
          </v-btn>
          <v-btn color="primary" variant="flat" @click="runScannerTest">
            Simular lectura
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
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import http from "../../../app/api/http";

import { usePosStore } from "../../../app/store/pos.store";
import { useAuthStore } from "../../../app/store/auth.store";

import PosTopBar from "../components/PosTopBar.vue";
import PosProductsPanel from "../components/PosProductsPanel.vue";
import PosProductRow from "../components/PosProductRow.vue";
import CheckoutDialog from "../components/CheckoutDialog.vue";
import PosProductDetailsDialog from "../components/PosProductDetailsDialog.vue";
import ReceiptDialog from "../components/ReceiptDialog.vue";
import PosCartPanel from "../components/PosCartPanel.vue";
import PosCartPreviewDialog from "../components/PosCartPreviewDialog.vue";
import PosPickBranchDialog from "../components/PosPickBranchDialog.vue";
import PosShortcutsHelpDialog from "../components/PosShortcutsHelpDialog.vue";
import PosCustomerPanel from "../components/PosCustomerPanel.vue";
import PosCajaActionsBar from "../components/PosCajaActionsBar.vue";
import PosCajaConfigDialog from "../components/PosCajaConfigDialog.vue";
import PosCajaArqueoDialog from "../components/PosCajaArqueoDialog.vue";
import PosBranchSwitchDialog from "../components/PosBranchSwitchDialog.vue";
import PosScannerSearchBar from "../components/PosScannerSearchBar.vue";
import PosConsultaDialog from "../components/PosConsultaDialog.vue";

import { usePosHotkeys } from "../composables/usePosHotkeys";
import { usePosBranch } from "../composables/usePosBranch";
import { usePosBranchScope } from "../composables/usePosBranchScope";
import { usePosPricing } from "../composables/usePosPricing";
import { usePosImages } from "../composables/usePosImages";
import { usePosBranchSwitch } from "../composables/usePosBranchSwitch";
import { usePosCustomer } from "../composables/usePosCustomer";
import { usePosProductActions } from "../composables/usePosProductActions";
import { usePosCheckout } from "../composables/usePosCheckout";
import { usePosCashRegister } from "../composables/usePosCashRegister";
import { usePosProductSearch } from "../composables/usePosProductSearch";
import { usePosScannerInput } from "../composables/usePosScannerInput";

const posStore = usePosStore();
const auth = useAuthStore();

const filtersRef = ref(null);
const helpOpen = ref(false);
const branchPickOpen = ref(false);

const scannerTestOpen = ref(false);
const scannerTestCode = ref("");
const scannerEnabled = ref(true);

const showCartDialog = ref(false);

const consultaOpen = ref(false);
const consultaLoading = ref(false);
const consultaItems = ref([]);

const snack = ref({
  show: false,
  text: "",
});

function toast(text) {
  snack.value.text = String(text || "");
  snack.value.show = true;
}

function toInt(v, def = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
}

function toArr(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.rows)) return data.rows;
  return [];
}

const {
  branchItems,
  fetchedBranches,
  activeBranchId,
  branchName,
  branchChipLabel,
  ensureBranchSelected,
  needsBranchPick,
  userBranches: userBranchesFromBranch,
} = usePosBranch({ posStore, auth, toast });

const isViewOnly = computed(() => false);

const userBranches = computed(() => {
  if (Array.isArray(userBranchesFromBranch?.value)) return userBranchesFromBranch.value;
  if (Array.isArray(userBranchesFromBranch)) return userBranchesFromBranch;

  if (Array.isArray(auth?.user?.branches)) return auth.user.branches;
  if (Array.isArray(auth?.me?.branches)) return auth.me.branches;

  if (Array.isArray(fetchedBranches?.value)) return fetchedBranches.value;
  if (Array.isArray(branchItems?.value)) return branchItems.value;

  return [];
});

usePosBranchScope({
  auth,
  userBranches,
  branchItems,
});

const activeWarehouseId = computed(() => {
  return (
    toInt(posStore?.warehouseId, 0) ||
    toInt(posStore?.currentWarehouseId, 0) ||
    toInt(posStore?.context?.warehouseId, 0) ||
    toInt(posStore?.context?.warehouse_id, 0) ||
    toInt(posStore?.posContext?.warehouseId, 0) ||
    toInt(posStore?.posContext?.warehouse_id, 0) ||
    0
  );
});

const { toNum, resolveUnitPrice } = usePosPricing();
const { productImage, prefetchImagesForVisible } = usePosImages();

const categories = ref([]);
const subcategories = ref([]);
const taxonomyLoading = ref(false);

async function loadCategories() {
  try {
    taxonomyLoading.value = true;
    const { data } = await http.get("/categories");
    categories.value = toArr(data);
  } catch (err) {
    categories.value = [];
    console.error("[POS] loadCategories error", err);
  } finally {
    taxonomyLoading.value = false;
  }
}

async function loadSubcategories(categoryId) {
  const cid = toInt(categoryId, 0);
  if (!cid) {
    subcategories.value = [];
    return;
  }

  try {
    taxonomyLoading.value = true;
    const { data } = await http.get(`/categories/${cid}/subcategories`, {
      params: { is_active: 1 },
    });
    subcategories.value = toArr(data);
  } catch (err) {
    subcategories.value = [];
    console.error("[POS] loadSubcategories error", err);
  } finally {
    taxonomyLoading.value = false;
  }
}

const rubroItems = computed(() => {
  return (categories.value || [])
    .map((c) => ({
      title: String(c?.name || "").trim(),
      value: Number(c?.id || 0),
    }))
    .filter((x) => x.title && x.value);
});

const subrubroItems = computed(() => {
  return (subcategories.value || [])
    .map((s) => ({
      title: String(s?.name || "").trim(),
      value: Number(s?.id || 0),
    }))
    .filter((x) => x.title && x.value);
});

const subrubroNoDataText = computed(() => {
  if (!rubroId.value) return "Elegí un rubro primero";
  if (taxonomyLoading.value) return "Cargando subrubros...";
  if (!subrubroItems.value.length) return "Este rubro no tiene subrubros";
  return "Sin datos";
});

const categoryNameMap = computed(() => {
  const map = new Map();
  for (const c of categories.value || []) {
    const id = Number(c?.id || 0);
    const name = String(c?.name || "").trim();
    if (id && name) map.set(id, name);
  }
  return map;
});

const subcategoryNameMap = computed(() => {
  const map = new Map();
  for (const s of subcategories.value || []) {
    const id = Number(s?.id || 0);
    const name = String(s?.name || "").trim();
    if (id && name) map.set(id, name);
  }
  return map;
});

function rubroTitleFromProduct(product) {
  const id = Number(product?.category_id || 0);
  return categoryNameMap.value.get(id) || "";
}

function subrubroTitleFromProduct(product) {
  const id = Number(product?.subcategory_id || 0);
  return subcategoryNameMap.value.get(id) || "";
}

const {
  q,
  rubroId,
  subrubroId,
  page,
  limit,
  items,
  loading,
  error,
  total,
  pages,
  searchNow,
  onTyping,
  onEnter,
  clearQuery,
  prevPage,
  nextPage,
  resetResults,
  setRubro,
  setSubrubro,
  setQuery,
} = usePosProductSearch({
  branchId: activeBranchId,
  warehouseId: activeWarehouseId,
  initialLimit: 48,
  inStock: true,
  sellable: true,
  minSearchLength: 3,
  debounceMs: 320,
  autoSearch: true,
  keepResultsOnShortQuery: true,
});

async function refreshCatalog() {
  await searchNow({ force: true });
}

async function onRubroChange() {
  setRubro(rubroId.value);
  await loadSubcategories(rubroId.value);
}

const {
  currentCashRegister,
  currentCashRegisterId,
  summary,
  isBusy: cajaBusy,
  isCajaOpen,

  cajaType,
  invoiceMode,
  invoiceType,
  openingAmount,
  openingNote,
  openedAt,

  cajaTypeOptions,
  invoiceModeOptions,
  invoiceTypeOptions,

  cajaTypeLabel,
  invoiceTypeLabel,

  cajaConfigOpen,
  cajaArqueoOpen,
  openCajaConfig,
  closeCajaConfig,
  openCajaArqueo,
  closeCajaArqueo,

  openCaja,
  closeCaja,
  refreshCaja,
  canSellWithCaja,
} = usePosCashRegister();

const shiftStart = ref(new Date());

const cashierName = computed(() => {
  return (
    auth?.user?.name ||
    auth?.user?.username ||
    auth?.me?.name ||
    auth?.me?.username ||
    "Caja"
  );
});

const shiftStartText = computed(() => {
  const base = openedAt.value || shiftStart.value || new Date();
  return new Date(base).toLocaleString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
});

const {
  branchPickSelected,
  uiBranchesForSelect,
  hasMultiBranches,
  cartBranchLabel,
  getActiveBranchIdSafe,
  openBranchSwitch,
  confirmActiveBranchChange,
} = usePosBranchSwitch({
  posStore,
  branchPickOpen,
  activeBranchId,
  branchItems,
  fetchedBranches,
  ensureBranchSelected,
  fetchGlobalPool: refreshCatalog,
  toast,
});

const {
  customer,
  customerHasData,
  customerDisabled,
  tryAttachCustomerToStore,
  loadCustomerDraft,
  saveCustomerDraft,
  clearCustomer,
} = usePosCustomer({
  posStore,
  loadingGlobal: loading,
  isViewOnly,
  needsBranchPick,
  canSell: computed(() => true),
});

const canSell = computed(() => !isViewOnly.value);

const canProceedWithCaja = computed(() => {
  return !!isCajaOpen.value;
});

function logCajaState(origin = "unknown") {
  console.log(`[POS][${origin}] caja`, {
    canProceedWithCaja: canProceedWithCaja.value,
    canSellWithCaja: canSellWithCaja?.value,
    isCajaOpen: isCajaOpen.value,
    currentCashRegisterId: currentCashRegisterId?.value,
    cajaType: cajaType.value,
    invoiceMode: invoiceMode.value,
    invoiceType: invoiceType.value,
    currentCashRegister: currentCashRegister?.value || null,
    summary: summary?.value || null,
  });
}

const cartItems = computed(() => {
  return Array.isArray(posStore.cart) ? posStore.cart : [];
});

const cartCount = computed(() => {
  return cartItems.value.reduce((acc, item) => {
    const qty = Number(item?.qty ?? item?.quantity ?? item?.cant ?? 1);
    return acc + (Number.isFinite(qty) ? qty : 1);
  }, 0);
});

const productsDisabled = computed(() => {
  return loading.value || !canSell.value || needsBranchPick.value;
});

const cartEditable = computed(() => {
  return canSell.value && !needsBranchPick.value;
});

const detailsCanSell = computed(() => {
  return canSell.value && !needsBranchPick.value;
});

const checkoutDisabled = computed(() => {
  return (
    cartCount.value === 0 ||
    !canSell.value ||
    needsBranchPick.value ||
    !canProceedWithCaja.value
  );
});

function getOffLabel(product) {
  const list = Number(product?.price_list || resolveUnitPrice(product, "LIST") || 0);
  const discount = Number(
    product?.price_discount ??
      product?.effective_price ??
      resolveUnitPrice(product, "DISCOUNT") ??
      product?.price ??
      0
  );

  if (!list || !discount || discount >= list) return "";
  return `${Math.round((1 - discount / list) * 100)}% OFF`;
}

const {
  detailsOpen,
  detailsItem,
  cartForCheckout,
  openDetails,
  add,
  addFromDetails,
} = usePosProductActions({
  posStore,
  canSell,
  needsBranchPick,
  globalItems: items,
  productImage,
  toast,
});

async function searchExactByScanner(code) {
  const raw = String(code || "").trim();
  if (!raw) return [];

  try {
    const { data } = await http.get("/pos/products", {
      params: {
        q: raw,
        page: 1,
        limit: 10,
        branch_id: activeBranchId.value || undefined,
        warehouse_id: activeWarehouseId.value || undefined,
        in_stock: "true",
        sellable: "true",
      },
    });

    const rows = toArr(data);
    const normalized = raw.toLowerCase();

    const exact = rows.filter((p) => {
      const barcode = String(p?.barcode || "").trim().toLowerCase();
      const sku = String(p?.sku || "").trim().toLowerCase();
      const codeField = String(p?.code || "").trim().toLowerCase();
      return barcode === normalized || sku === normalized || codeField === normalized;
    });

    return exact.length ? exact : rows;
  } catch (err) {
    console.error("[POS] scanner search error", err);
    throw new Error(err?.response?.data?.message || err?.message || "No se pudo buscar el código");
  }
}

async function handleScannerMatch(product, code) {
  if (needsBranchPick.value) {
    toast("Elegí una sucursal antes de usar el scanner");
    return;
  }

  if (!canProceedWithCaja.value) {
    toast("Abrí una caja antes de vender con scanner");
    return;
  }

  add(product);
  setQuery(String(code || ""));
  toast(`Agregado: ${product?.name || product?.sku || product?.code || "Producto"}`);
}

async function handleScannerMultiple(rows, code) {
  setQuery(String(code || ""));
  await searchNow({ force: true, resetPage: true });
  toast(`Se encontraron ${rows.length} productos para ${code}`);
}

function handleScannerNoMatch(code) {
  setQuery(String(code || ""));
  toast(`Sin coincidencias para ${code}`);
}

function handleScannerError(err, code) {
  console.error("[POS] scanner error", code, err);
  toast(err?.message || `Error leyendo ${code}`);
}

function handleScannerRead(code) {
  setQuery(String(code || ""));
}

const scanner = usePosScannerInput({
  enabled: scannerEnabled,
  minLength: 4,
  maxLength: 120,
  maxAvgCharMs: 45,
  maxGapMs: 90,
  captureInsideInputs: false,
  preventEnterDefault: true,
  onScan: handleScannerRead,
  searchExact: searchExactByScanner,
  onMatch: handleScannerMatch,
  onMultiple: handleScannerMultiple,
  onNoMatch: handleScannerNoMatch,
  onError: handleScannerError,
  normalizeCode: (code) => String(code || "").trim(),
});

const scannerVisualState = computed(() => scanner.visualState.value);
const scannerIconName = computed(() => scanner.iconName.value);
const scannerIconColor = computed(() => scanner.iconColor.value);
const scannerStateLabel = computed(() => scanner.stateLabel.value);
const scannerLastMessage = computed(() => scanner.lastMessage.value);
const scannerLastScan = computed(() => scanner.lastScan.value);
const scannerIsOn = computed(() => scanner.isScannerOn.value);

function toggleScanner() {
  scanner.toggle();
}

function openScannerTest() {
  scannerTestCode.value = "";
  scannerTestOpen.value = true;
}

async function runScannerTest() {
  const code = String(scannerTestCode.value || "").trim();
  if (!code) {
    toast("Ingresá un código");
    return;
  }

  await scanner.simulateScan(code);
  scannerTestOpen.value = false;
}

function openCartDialog() {
  showCartDialog.value = true;
}

function closeCartDialog() {
  showCartDialog.value = false;
}

function handleBlockedPay(payload) {
  const reason = String(payload?.reason || "");

  if (reason === "EMPTY_CART") {
    toast("Agregá productos al carrito antes de cobrar");
    return;
  }

  if (reason === "NEEDS_BRANCH") {
    toast("Seleccioná una sucursal para operar");
    return;
  }

  if (reason === "VIEW_ONLY") {
    toast("La vista está en modo solo lectura");
    return;
  }

  if (reason === "LOADING") {
    toast("Esperá a que termine la operación actual");
    return;
  }

  toast("No se puede iniciar el cobro todavía");
}

function handleBlockedCashIn(payload) {
  const reason = String(payload?.reason || "");

  if (reason === "NEEDS_BRANCH") {
    toast("Seleccioná una sucursal para operar");
    return;
  }

  if (reason === "VIEW_ONLY") {
    toast("La vista está en modo solo lectura");
    return;
  }

  if (reason === "LOADING") {
    toast("Esperá a que termine la operación actual");
    return;
  }

  toast("No se pudo abrir el ingreso de dinero");
}

async function handleGoPayFromCart() {
  showCartDialog.value = false;
  await openCheckoutSafe();
}

const pickBranchOpen = ref(false);
const pickBranchProduct = ref(null);
const pickBranchOptions = ref([]);

function onPickBranchConfirm() {
  pickBranchOpen.value = false;
  pickBranchProduct.value = null;
  pickBranchOptions.value = [];
}

const allSellable = items;

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
  isCajaOpen,
  currentCashRegisterId,
});

const installmentsItems12 = computed(() => {
  const out = [{ title: "1 pago", value: 1 }];
  for (let i = 2; i <= 12; i++) out.push({ title: `${i} cuotas`, value: i });
  return out;
});

async function openCheckoutSafe() {
  logCajaState("before-open-checkout");

  if (needsBranchPick.value) {
    toast("Elegí una sucursal antes de vender");
    return;
  }

  if (!cartItems.value.length) {
    toast("Agregá productos al carrito antes de cobrar");
    return;
  }

  if (!canProceedWithCaja.value) {
    await refreshCaja().catch(() => {});
    logCajaState("after-refresh-open-checkout");
  }

  if (!canProceedWithCaja.value) {
    toast("Debés abrir una caja antes de registrar la venta");
    openCajaConfig();
    return;
  }

  openCheckout({ onSnack: toast });
}

async function onCheckoutConfirm(payload) {
  try {
    logCajaState("before-confirm-checkout");

    if (!canProceedWithCaja.value) {
      await refreshCaja().catch(() => {});
      logCajaState("after-refresh-confirm-checkout");
    }

    if (!canProceedWithCaja.value) {
      toast("Debés abrir una caja antes de registrar la venta");
      openCajaConfig();
      return;
    }

    if (customerHasData.value) {
      tryAttachCustomerToStore(customer.value);
      saveCustomerDraft();
    } else {
      tryAttachCustomerToStore(null);
    }

    if (payload?.payment_method) {
      paymentMethod.value = String(payload.payment_method).toUpperCase();
    }

    if (payload?.installments != null) {
      installments.value = Number(payload.installments || 1);
    }

    if (payload?.apply_reseller != null) {
      applyReseller.value = !!payload.apply_reseller;
    }

    if (payload?.cash_received != null) {
      cashInput.value = String(payload.cash_received || "");
    }

    await confirmPayment({
      onSnack: toast,
      payloadFromDialog: payload,
    });

    showCartDialog.value = false;

    await refreshCatalog();
    await refreshCaja().catch(() => {});
  } catch (err) {
    console.error("[POS] onCheckoutConfirm error", err);

    if (err?.code === "CAJA_NO_ABIERTA") {
      toast(err?.message || "No hay caja abierta");
      await refreshCaja().catch(() => {});
      openCajaConfig();
      return;
    }

    toast(err?.message || "Error al confirmar la venta");
  }
}

function onCheckoutCancel() {}

async function refresh() {
  await refreshCatalog();
  await refreshCaja().catch(() => {});
  logCajaState("manual-refresh");
}

async function onSaveCajaConfig(payload) {
  try {
    await openCaja({
      opening_cash: payload?.opening_amount ?? payload?.opening_cash ?? 0,
      opening_note: payload?.note ?? payload?.opening_note ?? "",
      caja_type: payload?.caja_type,
      invoice_mode: payload?.invoice_mode,
      invoice_type: payload?.invoice_type,
    });

    closeCajaConfig();
    await refreshCaja().catch(() => {});
    logCajaState("after-open-caja");

    toast(`Caja iniciada • ${cajaTypeLabel.value} • ${invoiceTypeLabel.value}`);
  } catch (err) {
    if (err?.status === 409) {
      toast("Ya hay una caja abierta, sincronizando...");
      await refreshCaja().catch(() => {});
      closeCajaConfig();
      logCajaState("open-caja-409");
      return;
    }

    toast(err?.message || "Error al abrir caja");
  }
}

async function onCloseCaja() {
  if (!isCajaOpen.value) {
    await refreshCaja().catch(() => {});
  }

  if (!isCajaOpen.value) {
    toast("No hay caja abierta");
    return;
  }

  await openCajaArqueo();
}

async function onSaveArqueo(payload) {
  try {
    await closeCaja({
      closing_cash: payload?.closing_cash ?? 0,
      closing_note: payload?.closing_note ?? "",
      declared: payload?.declared || {},
      difference: payload?.difference || {},
    });

    closeCajaArqueo();
    await refreshCaja().catch(() => {});
    logCajaState("after-close-caja");
    toast("Caja cerrada");
  } catch (err) {
    toast(err?.message || "Error al cerrar caja");
  }
}

function handleHelp() {
  helpOpen.value = true;
}

async function handleSearch() {
  consultaOpen.value = true;

  if (!consultaItems.value.length) {
    try {
      consultaLoading.value = true;
      const { data } = await http.get("/pos/products", {
        params: {
          page: 1,
          limit: 30,
          branch_id: activeBranchId.value || undefined,
          warehouse_id: activeWarehouseId.value || undefined,
          in_stock: "true",
          sellable: "true",
        },
      });
      consultaItems.value = toArr(data);
    } catch (err) {
      console.error("[POS] handleSearch error", err);
      toast("No se pudo abrir la consulta");
    } finally {
      consultaLoading.value = false;
    }
  }
}

async function handlePay() {
  await openCheckoutSafe();
}

async function handleCashIn() {
  if (!isCajaOpen.value) {
    await refreshCaja().catch(() => {});
  }

  if (!isCajaOpen.value) {
    toast("Primero abrí una caja");
    openCajaConfig();
    return;
  }

  toast("Ingreso de dinero: conectá este botón al modal de movimientos de caja");
}

async function handleClients() {
  toast("Clientes: usá el panel de cliente de la derecha o conectá este botón a tu modal");
}

async function runConsultaSearch(query, { exact = false } = {}) {
  const raw = String(query || "").trim();

  if (!raw) {
    consultaItems.value = [];
    return;
  }

  if (needsBranchPick.value) {
    toast("Seleccioná una sucursal antes de consultar");
    return;
  }

  try {
    consultaLoading.value = true;

    const { data } = await http.get("/pos/products", {
      params: {
        q: raw,
        page: 1,
        limit: 50,
        branch_id: activeBranchId.value || undefined,
        warehouse_id: activeWarehouseId.value || undefined,
        in_stock: "true",
        sellable: "true",
      },
    });

    const rows = toArr(data);

    if (exact) {
      const normalized = raw.toLowerCase();
      const exactRows = rows.filter((p) => {
        const barcode = String(p?.barcode || "").trim().toLowerCase();
        const sku = String(p?.sku || "").trim().toLowerCase();
        const codeField = String(p?.code || "").trim().toLowerCase();
        return barcode === normalized || sku === normalized || codeField === normalized;
      });

      consultaItems.value = exactRows.length ? exactRows : rows;
    } else {
      consultaItems.value = rows;
    }

    if (!consultaItems.value.length) {
      toast(`Sin resultados para "${raw}"`);
    }
  } catch (err) {
    console.error("[POS] consulta search error", err);
    toast(err?.response?.data?.message || err?.message || "No se pudo realizar la consulta");
    consultaItems.value = [];
  } finally {
    consultaLoading.value = false;
  }
}

async function handleManualConsulta(query) {
  await runConsultaSearch(query, { exact: false });
}

async function handleBarcodeConsulta(code) {
  await runConsultaSearch(code, { exact: true });
}

function handleAddConsultaToCart(product) {
  if (needsBranchPick.value) {
    toast("Elegí una sucursal antes de agregar productos");
    return;
  }

  if (!canProceedWithCaja.value) {
    toast("Abrí una caja antes de vender");
    return;
  }

  add(product);
  toast(`Agregado: ${product?.name || product?.sku || product?.code || "Producto"}`);
}

function handleSelectConsultaItem(product) {
  if (!product) return;
  openDetails(product);
}

usePosHotkeys({
  filtersRef,
  helpOpen,
  openCheckoutSafe,
  prevPage,
  nextPage,
});

onMounted(async () => {
  document.body.classList.add("pos-noscroll");
  shiftStart.value = new Date();

  try {
    if (typeof auth.fetchMe === "function") {
      await auth.fetchMe();
    }
  } catch {}

  loadCustomerDraft();

  if (customerHasData.value) {
    tryAttachCustomerToStore(customer.value);
  }

  await loadCategories();

  const ok = await ensureBranchSelected();

  if (ok?.ok) {
    await refreshCaja().catch(() => {});
    logCajaState("mounted-ok");
  } else {
    await refreshCaja({ withSummary: false }).catch(() => {});
    logCajaState("mounted-no-ok");
  }

  await refreshCatalog();
  filtersRef.value?.focusSearch?.();
});

onBeforeUnmount(() => {
  document.body.classList.remove("pos-noscroll");
  closeCajaConfig();
  closeCajaArqueo();
});

watch(
  () => [page.value, items.value.length],
  async () => {
    await prefetchImagesForVisible?.(items.value);
  },
  { flush: "post" }
);

watch(
  () => branchPickOpen.value,
  (open) => {
    if (open) {
      branchPickSelected.value = getActiveBranchIdSafe();
    }
  }
);

watch(
  () => activeBranchId?.value,
  async (newVal, oldVal) => {
    if (!newVal || newVal === oldVal) return;

    resetResults();
    consultaItems.value = [];
    await refreshCaja().catch(() => {});
    logCajaState("branch-change");
    await refreshCatalog();
  }
);

watch(
  () => rubroId.value,
  async (newVal, oldVal) => {
    if (newVal === oldVal) return;

    if (!newVal) {
      subcategories.value = [];
      subrubroId.value = null;
      return;
    }

    await loadSubcategories(newVal);
  },
  { immediate: true }
);

watch(
  () => subrubroId.value,
  (newVal, oldVal) => {
    if (newVal === oldVal) return;
    setSubrubro(newVal ?? null);
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

  --pos-gap: clamp(8px, 0.7vw, 12px);
  --pos-pad: clamp(6px, 0.65vw, 10px);
  --pos-radius: 14px;
  --pos-radius-lg: 16px;

  --pos-border-light: rgba(15, 23, 42, 0.1);
  --pos-border-strong: rgba(15, 23, 42, 0.16);

  --pos-shadow:
    0 8px 20px rgba(15, 23, 42, 0.05),
    0 2px 8px rgba(15, 23, 42, 0.04);

  --pos-shadow-hover:
    0 10px 22px rgba(15, 23, 42, 0.07),
    0 3px 10px rgba(15, 23, 42, 0.05);

  --pos-surface-shadow-dark:
    0 10px 24px rgba(0, 0, 0, 0.26),
    0 2px 8px rgba(0, 0, 0, 0.18);

  --pos-surface-shadow-dark-hover:
    0 12px 28px rgba(0, 0, 0, 0.3),
    0 4px 10px rgba(0, 0, 0, 0.22);

  padding: var(--pos-pad);
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-background));

  display: flex;
  flex-direction: column;
  gap: var(--pos-gap);
  box-sizing: border-box;
}

:global(.v-theme--light) .pos-root {
  background: #dfe6ee;
}

.pos-header {
  flex: 0 0 auto;
  min-height: 0;
}

.pos-header-main {
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  gap: var(--pos-gap);
  align-items: stretch;
}

.pos-header-caja,
.pos-header-topbar {
  min-width: 0;
  display: flex;
}

.pos-header-caja > *,
.pos-header-topbar > * {
  width: 100%;
}

.pos-caja-actions-shell {
  width: 100%;
  min-height: 100%;
  padding: 6px 8px;
  border-radius: var(--pos-radius-lg);
  display: flex;
  align-items: stretch;
  justify-content: flex-start;
  overflow: visible;
}

.pos-topbar-shell {
  border-radius: var(--pos-radius-lg);
  width: 100%;
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
  grid-template-columns: minmax(0, 0.62fr) minmax(340px, 0.38fr);
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
  overflow: hidden;
}

.pos-right {
  min-height: 0;
  min-width: 0;
  display: grid;
  grid-template-rows: minmax(190px, auto) minmax(0, 1fr) auto;
  gap: var(--pos-gap);
  overflow: hidden;
}

.pos-customer-shell {
  min-height: 190px;
  min-width: 0;
  overflow: hidden;
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
  overflow: hidden;
}

.pos-cart-branch-note {
  padding-inline: 2px;
  opacity: 0.88;
  line-height: 1.15;
  font-size: 12px;
}

.pos-surface {
  position: relative;
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--pos-border-light);
  border-radius: var(--pos-radius);
  box-shadow: var(--pos-shadow);
  overflow: hidden;
  transition:
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

.pos-surface:hover {
  box-shadow: var(--pos-shadow-hover);
  border-color: var(--pos-border-strong);
}

.pos-topbar-shell,
.pos-filters-shell,
.pos-products-shell,
.pos-side-shell,
.pos-caja-actions-shell {
  backdrop-filter: none;
}

.pos-scanner-search-shell {
  border-radius: var(--pos-radius-lg);
  overflow: hidden;
}

:global(.v-theme--light) .pos-surface {
  border-color: rgba(15, 23, 42, 0.09);
}

:global(.v-theme--light) .pos-topbar-shell,
:global(.v-theme--light) .pos-filters-shell,
:global(.v-theme--light) .pos-side-shell,
:global(.v-theme--light) .pos-caja-actions-shell {
  background: #fbfcfe;
}

:global(.v-theme--light) .pos-products-shell {
  background: #f5f7fb;
  border-color: rgba(15, 23, 42, 0.1);
}

:global(.v-theme--light) .pos-scanner-search-shell {
  background: #fbfcfe;
}

:global(.v-theme--dark) .pos-surface {
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: var(--pos-surface-shadow-dark);
}

:global(.v-theme--dark) .pos-surface:hover {
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: var(--pos-surface-shadow-dark-hover);
}

:global(.v-theme--dark) .pos-caja-actions-shell {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.015));
}

.pos-left :deep(.pssb) {
  padding: 10px 12px 8px !important;
}

.pos-left :deep(.pssb-toolbar) {
  align-items: center !important;
}

.pos-left :deep(.pssb-footer) {
  padding-top: 2px;
}

.pos-left :deep(.pssb-pagination) {
  justify-content: flex-end;
}

.pos-scanner-test-dialog {
  border-radius: 18px;
  overflow: hidden;
}

@media (max-height: 900px) {
  .pos-root {
    --pos-gap: 8px;
    --pos-pad: 8px;
  }

  .pos-right {
    grid-template-rows: minmax(176px, auto) minmax(0, 1fr) auto;
  }

  .pos-customer-shell {
    min-height: 176px;
  }
}

@media (max-height: 820px) {
  .pos-root {
    --pos-gap: 7px;
    --pos-pad: 7px;
    --pos-radius: 13px;
    --pos-radius-lg: 14px;
  }

  .pos-right {
    grid-template-rows: minmax(162px, auto) minmax(0, 1fr) auto;
  }

  .pos-customer-shell {
    min-height: 162px;
  }

  .pos-cart-branch-note {
    font-size: 11px;
  }
}

@media (max-height: 760px) {
  .pos-root {
    --pos-gap: 6px;
    --pos-pad: 6px;
    --pos-radius: 12px;
    --pos-radius-lg: 13px;
  }

  .pos-right {
    grid-template-rows: minmax(148px, auto) minmax(0, 1fr) auto;
  }

  .pos-customer-shell {
    min-height: 148px;
  }

  .pos-cart-branch-note {
    font-size: 11px;
    line-height: 1.05;
  }
}

@media (max-width: 1440px) {
  .pos-root {
    --pos-gap: 8px;
    --pos-pad: 8px;
    --pos-radius: 14px;
    --pos-radius-lg: 15px;
  }

  .pos-layout {
    grid-template-columns: minmax(0, 0.6fr) 360px;
  }

  .pos-header-main {
    grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  }
}

@media (max-width: 1280px) {
  .pos-root {
    --pos-gap: 7px;
    --pos-pad: 7px;
    --pos-radius: 13px;
    --pos-radius-lg: 14px;
  }

  .pos-layout {
    grid-template-columns: minmax(0, 0.6fr) 320px;
  }

  .pos-right {
    grid-template-rows: minmax(154px, auto) minmax(0, 1fr) auto;
  }

  .pos-customer-shell {
    min-height: 154px;
  }

  .pos-header-main {
    grid-template-columns: minmax(210px, 250px) minmax(0, 1fr);
  }
}

@media (max-width: 1100px) {
  .pos-layout {
    grid-template-columns: minmax(0, 0.6fr) 300px;
  }

  .pos-right {
    grid-template-rows: minmax(146px, auto) minmax(0, 1fr) auto;
  }

  .pos-customer-shell {
    min-height: 146px;
  }

  .pos-header-main {
    grid-template-columns: minmax(200px, 230px) minmax(0, 1fr);
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

  .pos-header-main {
    display: flex;
    flex-direction: column;
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
    flex-direction: column;
    overflow: visible;
  }

  .pos-customer-shell,
  .pos-cart-shell {
    min-height: auto;
  }

  .pos-customer-shell,
  .pos-cart-shell,
  .pos-products-shell,
  .pos-filters-shell,
  .pos-topbar-shell,
  .pos-caja-actions-shell {
    border-radius: 16px;
  }

  .pos-caja-actions-shell {
    width: 100%;
    padding: 10px;
  }

  .pos-left :deep(.pssb) {
    padding: 9px !important;
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
  .pos-topbar-shell,
  .pos-caja-actions-shell {
    border-radius: 14px;
  }
}
</style>