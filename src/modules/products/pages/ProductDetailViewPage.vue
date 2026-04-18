<!-- src/modules/products/pages/ProductDetailViewPage.vue -->

<template>
  <div class="pdv">

    <!-- TOP BAR -->
    <div class="pdv-topbar" v-if="raw || loading">
      <v-btn icon variant="text" size="small" @click="goBack" class="pdv-back">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div class="pdv-topbar-info" v-if="raw">
        <div class="pdv-topbar-name">{{ productForUIFixed.name || 'Producto' }}</div>
        <div class="pdv-topbar-meta">
          <v-chip size="x-small" :color="productForUIFixed.is_active !== false ? 'success' : 'warning'" variant="tonal">
            {{ productForUIFixed.is_active !== false ? 'Activo' : 'Inactivo' }}
          </v-chip>
          <span class="pdv-topbar-sku" v-if="productForUIFixed.sku || productForUIFixed.code">
            {{ productForUIFixed.sku || productForUIFixed.code }}
          </span>
        </div>
      </div>
      <v-spacer />
      <v-btn v-if="raw" variant="tonal" size="small" prepend-icon="mdi-pencil-outline" rounded="lg"
        @click="$router.push({ name: 'productEdit', params: { id: productId } })">
        Editar
      </v-btn>
    </div>

    <!-- ERROR -->
    <v-alert v-if="error" type="error" variant="tonal" class="mb-3">{{ error }}</v-alert>

    <!-- LOADING -->
    <div v-if="loading && !raw" class="pdv-loading">
      <v-progress-circular indeterminate size="32" color="primary" />
      <span>Cargando producto…</span>
    </div>

    <!-- CONTENT -->
    <div v-else-if="raw" class="pdv-grid">

      <!-- LEFT -->
      <div class="pdv-left">

        <!-- PHOTOS -->
        <div class="pdv-card pdv-card--photos">
          <div class="pdv-card-head">
            <v-icon size="16" color="pink">mdi-image-multiple</v-icon>
            <span class="pdv-card-title">Fotos</span>
          </div>
          <ProductPhotoGallery :images="ui.images" />
        </div>

        <!-- INFO -->
        <div class="pdv-card">
          <div class="pdv-card-head">
            <v-icon size="16" color="primary">mdi-information-outline</v-icon>
            <span class="pdv-card-title">Información</span>
          </div>
          <ProductInfoCard :product="productForUIFixed" />
        </div>

        <!-- PRICES -->
        <div class="pdv-card">
          <div class="pdv-card-head">
            <v-icon size="16" color="success">mdi-cash-multiple</v-icon>
            <span class="pdv-card-title">Precios</span>
          </div>
          <ProductPriceBlock :product="productForUIFixed" />
        </div>

        <!-- BARCODE -->
        <div class="pdv-card">
          <div class="pdv-card-head">
            <v-icon size="16" color="indigo">mdi-barcode</v-icon>
            <span class="pdv-card-title">Código de barras</span>
          </div>
          <ProductBarcodeCard :product="productForUIFixed"
            :value="productForUIFixed.barcode || productForUIFixed.sku || productForUIFixed.code || productForUIFixed.id"
            format="CODE128" @copied="onBarcodeCopied" @print="onBarcodePrint" />
        </div>
      </div>

      <!-- RIGHT -->
      <div class="pdv-right">

        <!-- STOCK -->
        <div class="pdv-card">
          <div class="pdv-card-head">
            <v-icon size="16" color="cyan">mdi-warehouse</v-icon>
            <span class="pdv-card-title">Stock por sucursal</span>
            <v-spacer />
            <v-chip v-if="branchesStock.length" size="x-small" variant="tonal">{{ branchesStock.length }} suc.</v-chip>
            <v-btn size="x-small" variant="text" icon @click="refreshBranchesMatrix" :disabled="mx.loading || !raw">
              <v-icon size="14">mdi-refresh</v-icon>
            </v-btn>
          </div>

          <v-alert v-if="mx.error" type="error" variant="tonal" density="compact" class="mb-2">{{ mx.error }}</v-alert>
          <div v-if="mx.loading" class="pdv-stock-loading"><v-progress-circular size="18" indeterminate color="primary" /><span>Cargando…</span></div>
          <div v-else-if="!branchesStock.length" class="pdv-muted">Sin datos de stock por sucursal.</div>
          <v-alert v-else-if="totalStockAllBranches === 0" type="info" variant="tonal" density="compact" class="mb-2">Sin stock en todas las sucursales.</v-alert>

          <div v-if="branchesStock.length" class="pdv-stock-list">
            <div v-for="r in branchesStock" :key="r.key" class="pdv-stock-row">
              <div class="pdv-stock-avatar" :class="{ ok: r.stock_qty > 0 }">{{ initials(r.branch_name) }}</div>
              <div class="pdv-stock-name">{{ r.branch_name }}</div>
              <v-chip size="small" :variant="r.stock_qty > 0 ? 'flat' : 'tonal'"
                :color="r.stock_qty > 0 ? 'success' : undefined" class="pdv-stock-chip">
                {{ fmtQty(r.stock_qty) }}
              </v-chip>
            </div>
          </div>
        </div>

        <!-- LABEL / QR -->
        <div class="pdv-card">
          <div class="pdv-card-head">
            <v-icon size="16" color="orange">mdi-qrcode</v-icon>
            <span class="pdv-card-title">Etiqueta y QR</span>
          </div>

          <div class="pdv-label-wrap">
            <ProductLabelPreview :product="productForUIFixed" :size="labelSize" :qrValue="ui.qrValue">
              <template #actions="{ printEl }">
                <div class="pdv-label-actions">
                  <div class="pdv-size-row">
                    <span class="pdv-size-label">Formato</span>
                    <v-btn-toggle v-model="labelSize" mandatory density="compact" rounded="lg" class="pdv-size-toggle">
                      <v-btn value="100" size="small">100×60</v-btn>
                      <v-btn value="80" size="small">80×55</v-btn>
                      <v-btn value="58" size="small">58×40</v-btn>
                    </v-btn-toggle>
                  </div>
                  <ProductPrintActions v-model="labelSize" v-model:copies="copies" :printEl="printEl" :sheetEl="sheetEl"
                    :title="printTitle" :product="productForUIFixed" :qrValue="ui.qrValue"
                    @open-ecommerce="openEcommerce" @download-pdf="downloadPdf" @print="printDlg = true" />
                </div>
              </template>
            </ProductLabelPreview>
          </div>
        </div>

      </div>
    </div>

    <!-- Hidden A4 sheet for printing -->
    <div class="pdv-hidden">
      <div ref="sheetEl" class="pdv-a4-shell">
        <ProductLabelSheetA4 :product="productForUIFixed" :size="labelSize" :copies="copies" :qrValue="ui.qrValue" />
      </div>
    </div>

    <!-- Print dialog -->
    <v-dialog v-model="printDlg" max-width="820">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon>mdi-printer</v-icon>
          <span class="font-weight-black">Vista previa — Etiqueta / QR</span>
        </v-card-title>
        <v-card-text><ProductLabelPreview :product="productForUIFixed" :size="labelSize" :qrValue="ui.qrValue" /></v-card-text>
        <v-card-actions class="justify-end"><v-btn variant="text" @click="printDlg = false">Cerrar</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useProductsStore } from "@/app/store/products.store";
import { useAuthStore } from "@/app/store/auth.store";

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
.pdv { display: flex; flex-direction: column; gap: 12px; }

/* TOP BAR */
.pdv-topbar {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.pdv-back { flex-shrink: 0; margin-left: -4px; }
.pdv-topbar-name { font-size: 16px; font-weight: 900; line-height: 1.2; }
.pdv-topbar-meta { display: flex; align-items: center; gap: 8px; margin-top: 3px; }
.pdv-topbar-sku { font-size: 11px; opacity: 0.45; font-family: monospace; }

/* LOADING */
.pdv-loading { display: flex; align-items: center; gap: 10px; padding: 40px 20px; opacity: 0.8; }

/* GRID */
.pdv-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  gap: 12px;
  align-items: start;
}
.pdv-left { display: flex; flex-direction: column; gap: 12px; }
.pdv-right { display: flex; flex-direction: column; gap: 12px; position: sticky; top: 12px; }

/* CARD */
.pdv-card {
  border-radius: 14px; overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 1.2));
  background: rgb(var(--v-theme-surface));
}
.pdv-card-head {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.pdv-card-title { font-size: 13px; font-weight: 800; flex: 1; }

.pdv-card :deep(.v-card), .pdv-card :deep([data-comp]) { border-radius: 0 !important; border: none !important; box-shadow: none !important; }

/* STOCK */
.pdv-stock-loading { display: flex; align-items: center; gap: 8px; padding: 12px 14px; font-size: 13px; opacity: 0.7; }
.pdv-muted { padding: 12px 14px; font-size: 13px; opacity: 0.5; }
.pdv-stock-list { display: flex; flex-direction: column; }
.pdv-stock-row {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 14px;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.6));
}
.pdv-stock-row:last-child { border-bottom: none; }
.pdv-stock-avatar {
  width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
  display: grid; place-items: center;
  font-size: 11px; font-weight: 900;
  background: rgba(var(--v-theme-on-surface), 0.07);
}
.pdv-stock-avatar.ok { background: rgba(var(--v-theme-success), 0.12); color: rgb(var(--v-theme-success)); }
.pdv-stock-name { flex: 1; font-size: 13px; font-weight: 700; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pdv-stock-chip { min-width: 72px; justify-content: center; }

/* LABEL */
.pdv-label-wrap { padding: 12px; }
.pdv-label-actions { margin-top: 12px; display: flex; flex-direction: column; gap: 10px; }
.pdv-size-row { display: flex; align-items: center; gap: 10px; }
.pdv-size-label { font-size: 12px; font-weight: 700; opacity: 0.6; white-space: nowrap; }
.pdv-size-toggle { flex: 1; }

/* HIDDEN */
.pdv-hidden { position: fixed; left: -99999px; top: 0; visibility: hidden; pointer-events: none; }
.pdv-a4-shell { width: 210mm; min-height: 297mm; background: #fff; }

/* RESPONSIVE */
@media (max-width: 1100px) {
  .pdv-grid { grid-template-columns: 1fr; }
  .pdv-right { position: static; }
}
@media (max-width: 600px) {
  .pdv-topbar { padding: 8px 12px; }
  .pdv-topbar-name { font-size: 14px; }
}
</style>
