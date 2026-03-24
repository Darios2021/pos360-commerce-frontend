<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/pages/ProductDetailViewPage.vue -->

<template>
  <div class="pd" data-page="product-detail-view">
    <ProductHeader v-if="raw" :product="productForUIFixed" @back="goBack" />

    <v-alert v-if="error" type="error" variant="tonal" class="mt-3">
      {{ error }}
    </v-alert>

    <div v-if="loading" class="pd-loading">
      <v-progress-circular indeterminate size="22" />
      <span>Cargando producto…</span>
    </div>

    <div v-else-if="raw" class="pd-grid">
      <!-- ================= LEFT ================= -->
      <div class="pd-left">
        <ProductInfoCard :product="productForUIFixed" class="mb-3" />

        <ProductPriceBlock :product="productForUIFixed" class="mb-3" />

        <!-- ✅ BLOQUE EXCLUSIVO: CÓDIGO DE BARRAS -->
        <ProductBarcodeCard
          class="mb-3"
          :product="productForUIFixed"
          :value="
            productForUIFixed.barcode ||
            productForUIFixed.sku ||
            productForUIFixed.code ||
            productForUIFixed.id
          "
          format="CODE128"
          @copied="onBarcodeCopied"
          @print="onBarcodePrint"
        />

        <!-- Stock por sucursal -->
        <v-card rounded="xl" elevation="1" class="pd-card mb-3">
          <div class="pd-card-head">
            <div>
              <div class="pd-card-title">Stock por sucursal</div>
              <div class="pd-card-subtitle">Disponibilidad real del producto por punto de venta</div>
            </div>

            <v-spacer />

            <v-btn
              size="small"
              variant="tonal"
              prepend-icon="mdi-refresh"
              :disabled="mx.loading || !raw"
              @click="refreshBranchesMatrix"
            >
              Refrescar
            </v-btn>

            <v-chip v-if="mx.loading" size="small" variant="tonal">Cargando…</v-chip>
            <v-chip v-else-if="branchesStock.length" size="small" variant="tonal">
              {{ branchesStock.length }} sucursal{{ branchesStock.length === 1 ? "" : "es" }}
            </v-chip>
          </div>

          <v-alert v-if="mx.error" type="error" variant="tonal" class="mb-3" density="comfortable">
            {{ mx.error }}
          </v-alert>

          <div v-if="!mx.loading && !mx.error && !branchesStock.length" class="pd-muted">
            No hay detalle de stock por sucursal para este producto.
          </div>

          <v-alert
            v-else-if="!mx.loading && !mx.error && branchesStock.length && totalStockAllBranches === 0"
            type="info"
            variant="tonal"
            density="comfortable"
            class="mb-3"
          >
            No hay stock en ninguna sucursal (todas en 0).
          </v-alert>

          <div v-if="branchesStock.length" class="pd-matrix">
            <div class="pd-matrix-head">
              <div class="h-left">
                <div class="h-title">Sucursal</div>
                <div class="h-sub">ID</div>
              </div>
              <div class="h-right">Stock</div>
            </div>

            <div class="pd-matrix-body">
              <div v-for="r in branchesStock" :key="r.key" class="pd-matrix-row">
                <div class="row-left">
                  <div class="pd-avatar" :class="{ ok: r.stock_qty > 0 }">
                    {{ initials(r.branch_name) }}
                  </div>

                  <div class="minw-0">
                    <div class="pd-branch-name text-truncate">{{ r.branch_name }}</div>
                    <div class="pd-branch-meta">ID: {{ r.branch_id }}</div>
                  </div>
                </div>

                <div class="row-right">
                  <v-chip
                    size="small"
                    class="pd-stock-chip"
                    :variant="r.stock_qty > 0 ? 'flat' : 'tonal'"
                    :color="r.stock_qty > 0 ? 'success' : undefined"
                  >
                    {{ fmtQty(r.stock_qty) }}
                  </v-chip>
                </div>
              </div>
            </div>
          </div>
        </v-card>
      </div>

      <!-- ================= RIGHT ================= -->
      <div class="pd-right">
        <!-- FOTOS -->
        <v-card rounded="xl" elevation="1" class="pd-card mb-3">
          <div class="pd-card-head">
            <div>
              <div class="pd-card-title">Fotos</div>
              <div class="pd-card-subtitle">Vista previa de imágenes del producto</div>
            </div>
          </div>

          <ProductPhotoGallery :images="ui.images" />
        </v-card>

        <!-- ✅ BLOQUE EXCLUSIVO: QR / ETIQUETA / IMPRESIÓN -->
        <v-card rounded="xl" elevation="1" class="pd-card">
          <div class="pd-card-head pd-card-head--stack">
            <div>
              <div class="pd-card-title">Etiqueta y QR</div>
              <div class="pd-card-subtitle">
                Este bloque es para generar e imprimir la etiqueta comercial con QR.
                No imprime el código de barras del producto.
              </div>
            </div>
          </div>

          <div class="pd-print-panel">
            <ProductLabelPreview
              :product="productForUIFixed"
              :size="labelSize"
              :qrValue="ui.qrValue"
            >
              <template #actions="{ printEl }">
                <div class="mt-3">
                  <div class="pd-sizebar">
                    <div>
                      <div class="pd-sizebar-title">Formato de etiqueta / QR</div>
                      <div class="pd-sizebar-sub">Elegí el tamaño para impresión de etiqueta</div>
                    </div>

                    <v-btn-toggle
                      v-model="labelSize"
                      mandatory
                      density="comfortable"
                      rounded="lg"
                      class="pd-size-toggle"
                    >
                      <v-btn value="100" class="pd-size-btn">100×60</v-btn>
                      <v-btn value="80" class="pd-size-btn">80×55</v-btn>
                      <v-btn value="58" class="pd-size-btn">58×40</v-btn>
                    </v-btn-toggle>
                  </div>

                  <ProductPrintActions
                    v-model="labelSize"
                    v-model:copies="copies"
                    :printEl="printEl"
                    :sheetEl="sheetEl"
                    :title="printTitle"
                    :product="productForUIFixed"
                    :qrValue="ui.qrValue"
                    @open-ecommerce="openEcommerce"
                    @download-pdf="downloadPdf"
                    @print="printDlg = true"
                  />
                </div>
              </template>
            </ProductLabelPreview>
          </div>
        </v-card>
      </div>
    </div>

    <div class="pd-hidden">
      <div ref="sheetEl" class="pd-a4-shell">
        <ProductLabelSheetA4
          :product="productForUIFixed"
          :size="labelSize"
          :copies="copies"
          :qrValue="ui.qrValue"
        />
      </div>
    </div>

    <v-dialog v-model="printDlg" max-width="820">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon>mdi-printer</v-icon>
          <span class="font-weight-black">Vista previa de etiqueta / QR</span>
        </v-card-title>

        <v-card-text>
          <ProductLabelPreview
            :product="productForUIFixed"
            :size="labelSize"
            :qrValue="ui.qrValue"
          />
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="printDlg = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useProductsStore } from "@/app/store/products.store";
import { useAuthStore } from "@/app/store/auth.store";

import ProductHeader from "@/modules/products/components/detail/ProductHeader.vue";
import ProductPriceBlock from "@/modules/products/components/detail/ProductPriceBlock.vue";
import ProductInfoCard from "@/modules/products/components/detail/ProductInfoCard.vue";
import ProductBarcodeCard from "@/modules/products/components/detail/ProductBarcodeCard.vue";
import ProductPhotoGallery from "@/modules/products/components/ProductPhotoGallery.vue";

import ProductLabelPreview from "@/modules/products/components/label/ProductLabelPreview.vue";
import ProductLabelSheetA4 from "@/modules/products/components/label/ProductLabelSheetA4.vue";
import ProductPrintActions from "@/modules/products/components/actions/ProductPrintActions.vue";

import { buildProductUI } from "@/modules/products/utils/productUi.adapter.js";
import { downloadLabelPdfA4 } from "@/modules/products/utils/labelPdfA4.js";

const route = useRoute();
const router = useRouter();

const products = useProductsStore();
const auth = useAuthStore();

const loading = ref(false);
const error = ref("");
const raw = ref(null);

const printDlg = ref(false);
const labelSize = ref("100"); // "100" | "80" | "58"
const copies = ref(8);
const sheetEl = ref(null);

const productId = computed(() => Number(route.params?.id || route.query?.id || 0));

const branchId = computed(() => {
  const u = auth?.user || {};
  const bid = Number(u?.branch_id || 0) || Number(auth?.branchId || 0) || 0;
  const ls = Number(localStorage.getItem("pos_branch_id") || localStorage.getItem("shop_branch_id") || 0) || 0;
  return bid > 0 ? bid : ls > 0 ? ls : null;
});

function unwrap(x) {
  if (!x || typeof x !== "object") return x;
  if (x.data && typeof x.data === "object") return x.data;
  if (x.item && typeof x.item === "object") return x.item;
  if (x.product && typeof x.product === "object") return x.product;
  if (x.row && typeof x.row === "object") return x.row;
  return x;
}

function unwrapArray(x) {
  if (Array.isArray(x)) return x;
  if (!x || typeof x !== "object") return [];
  if (Array.isArray(x.rows)) return x.rows;
  if (Array.isArray(x.data)) return x.data;
  if (Array.isArray(x.items)) return x.items;
  return [];
}

function toNum(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}

function fmtQty(v) {
  return toNum(v, 0).toFixed(3);
}

function pickFirstNumber(obj, keys, def = 0) {
  for (const k of keys) {
    const v = obj?.[k];
    const n = toNum(v, NaN);
    if (Number.isFinite(n)) return n;
  }
  return def;
}

function initials(name) {
  const s = String(name || "").trim();
  if (!s) return "—";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase() || s.slice(0, 2).toUpperCase();
}

const ui = computed(() =>
  buildProductUI(raw.value, {
    productId: productId.value,
    branchId: branchId.value,
  })
);

const productForUI = computed(() => ui.value?.product || {});

const printTitle = computed(() => {
  const nm = productForUI.value?.name || "Producto";
  const cd = productForUI.value?.code || productForUI.value?.id || "";
  return `Etiquetas A4 - ${nm}${cd ? " (" + cd + ")" : ""}`;
});

function goBack() {
  router.back();
}

function openEcommerce() {
  window.open(ui.value.ecommerceUrl, "_blank", "noopener,noreferrer");
}

function onBarcodeCopied(value) {
  console.log("[barcode copied]", value);
}

function onBarcodePrint(value) {
  console.log("[barcode print]", value);
}

/* =========================
   Stock por sucursal
========================= */
const mx = ref({
  loading: false,
  error: "",
  rows: [],
});

const branchesStock = computed(() => {
  const arr = Array.isArray(mx.value.rows) ? mx.value.rows : [];
  return arr
    .map((x) => ({
      key: String(x?.branch_id ?? x?.id ?? Math.random()),
      branch_id: Number(x?.branch_id || 0),
      branch_name: String(x?.branch_name || x?.name || "").trim() || `Sucursal #${Number(x?.branch_id || 0)}`,
      stock_qty: toNum(x?.stock_qty ?? x?.current_qty ?? x?.qty ?? x?.stock ?? 0, 0),
    }))
    .filter((r) => r.branch_id > 0)
    .sort((a, b) => a.branch_id - b.branch_id);
});

const totalStockAllBranches = computed(() => {
  let s = 0;
  for (const r of branchesStock.value) s += toNum(r.stock_qty, 0);
  return s;
});

const currentBranchRow = computed(() => {
  const bid = Number(branchId.value || 0);
  if (!bid) return null;
  return branchesStock.value.find((r) => Number(r.branch_id) === bid) || null;
});

/* =========================
   Enriquecer producto
========================= */
const productForUIFixed = computed(() => {
  const base = productForUI.value || {};
  const r = raw.value || {};

  const price = pickFirstNumber(r, ["price", "price_list", "price_discount", "price_reseller"], 0);
  const cost = pickFirstNumber(r, ["cost"], 0);

  const stock_total = Number.isFinite(totalStockAllBranches.value) ? totalStockAllBranches.value : 0;
  const stock_in_branch = toNum(currentBranchRow.value?.stock_qty ?? 0, 0);
  const branch_name = currentBranchRow.value?.branch_name || base?.branch_name || "";

  const margin = price > 0 ? ((price - cost) / price) * 100 : null;

  return {
    ...base,

    price,
    cost,
    margin,

    price_list: pickFirstNumber(r, ["price_list"], price),
    price_discount: pickFirstNumber(r, ["price_discount"], price),
    price_reseller: pickFirstNumber(r, ["price_reseller"], price),

    branches_matrix: branchesStock.value,

    stock_total,
    stock_in_branch,
    branch_name,

    stock: stock_total,
    stock_qty: stock_total,
    qty: stock_total,
  };
});

async function refreshBranchesMatrix() {
  const pid = Number(productId.value || 0);
  if (!pid) return;

  mx.value.loading = true;
  mx.value.error = "";

  try {
    const matrixResp = await products.fetchBranchesMatrix(pid);
    mx.value.rows = unwrapArray(matrixResp);
  } catch (e) {
    mx.value.rows = [];
    mx.value.error = e?.message || products.error || "No se pudo cargar stock por sucursal";
  } finally {
    mx.value.loading = false;
  }
}

async function fetchProduct() {
  error.value = "";
  raw.value = null;

  const id = productId.value;
  if (!id) {
    error.value = "Producto inválido.";
    return;
  }

  loading.value = true;
  try {
    const fullResp = await products.fetchOne(Number(id), {
      force: true,
      branch_id: branchId.value,
    });

    const full = unwrap(fullResp);
    if (!full) throw new Error(products.error || "No se pudo obtener el producto.");

    raw.value = full;
    await refreshBranchesMatrix();
  } catch (e) {
    error.value = e?.friendlyMessage || e?.message || "No se pudo obtener el producto.";
  } finally {
    loading.value = false;
  }
}

async function downloadPdf() {
  if (!raw.value) return;

  await downloadLabelPdfA4({
    product: productForUIFixed.value,
    size: labelSize.value,
    copies: copies.value,
    qrValue: ui.value.qrValue,
    title: printTitle.value,
  });
}

onMounted(fetchProduct);
watch(productId, fetchProduct);
watch(branchId, fetchProduct);
</script>

<style scoped>
.pd {
  padding: 14px;
  min-height: calc(100vh - 72px);
  color: rgb(var(--v-theme-on-background));
  background: rgb(var(--v-theme-background));
}

.pd-loading {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  align-items: center;
  opacity: 0.9;
}

.pd-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 520px;
  gap: 12px;
  align-items: start;
}

.pd-left {
  min-width: 0;
}

.pd-right {
  position: sticky;
  top: 12px;
  min-width: 0;
}

.pd-card,
.pd-actions {
  padding: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}

.pd-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.pd-card-head--stack {
  align-items: flex-start;
}

.pd-card-title {
  font-weight: 900;
  letter-spacing: 0.2px;
}

.pd-card-subtitle {
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.3;
  opacity: 0.72;
}

.pd-muted {
  opacity: 0.85;
  font-size: 13px;
  line-height: 1.35;
}

/* panel QR / etiqueta */
.pd-print-panel {
  max-width: 420px;
  margin: 0 auto;
}

.pd-sizebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.pd-sizebar-title {
  font-weight: 900;
  letter-spacing: 0.2px;
  font-size: 13px;
  opacity: 0.95;
}

.pd-sizebar-sub {
  margin-top: 2px;
  font-size: 11px;
  opacity: 0.68;
}

.pd-size-toggle {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.pd-size-btn {
  font-weight: 900;
  letter-spacing: 0.2px;
}

/* Stock por sucursal */
.pd-matrix {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.pd-matrix-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.h-left .h-title {
  font-weight: 900;
  letter-spacing: 0.2px;
  font-size: 13px;
}

.h-left .h-sub {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 1px;
}

.h-right {
  font-size: 12px;
  font-weight: 900;
  opacity: 0.85;
}

.pd-matrix-body {
  max-height: 280px;
  overflow: auto;
  background: rgb(var(--v-theme-surface));
}

.pd-matrix-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.pd-matrix-row:last-child {
  border-bottom: none;
}

.pd-matrix-row:hover {
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.row-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.row-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.pd-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-weight: 900;
  font-size: 12px;
  letter-spacing: 0.5px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  flex: 0 0 auto;
}

.pd-avatar.ok {
  background: rgba(var(--v-theme-success), 0.12);
  border-color: rgba(var(--v-theme-success), 0.25);
}

.pd-branch-name {
  font-weight: 900;
  line-height: 1.1;
}

.pd-branch-meta {
  font-size: 12px;
  opacity: 0.72;
  line-height: 1.1;
  margin-top: 2px;
}

.pd-stock-chip {
  min-width: 86px;
  justify-content: center;
}

.pd-right :deep(.plp-root),
.pd-right :deep([data-comp="product-label-preview"]) {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
}

@media (max-width: 1350px) {
  .pd-grid {
    grid-template-columns: 1fr 460px;
  }

  .pd-print-panel {
    max-width: 100%;
    margin: 0;
  }
}

@media (max-width: 1100px) {
  .pd-grid {
    grid-template-columns: 1fr;
  }

  .pd-right {
    position: static;
  }
}

.pd-hidden {
  position: fixed;
  left: -99999px;
  top: 0;
  visibility: hidden;
  pointer-events: none;
}

.pd-a4-shell {
  width: 210mm;
  min-height: 297mm;
  background: #fff;
}
</style>