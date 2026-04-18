<!-- src/modules/products/pages/ProductDetailViewPage.vue -->
<template>
  <div class="pv">

    <!-- TOP BAR -->
    <div class="pv-bar">
      <v-btn icon variant="text" size="small" @click="goBack" class="pv-back">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div class="pv-bar-text">
        <span class="pv-bar-title">{{ raw ? (productForUIFixed.name || 'Producto') : 'Detalle de producto' }}</span>
      </div>
      <v-spacer />
      <v-btn
        v-if="raw"
        variant="tonal"
        size="small"
        prepend-icon="mdi-pencil-outline"
        rounded="lg"
        @click="$router.push({ name: 'productEdit', params: { id: productId } })"
      >
        Editar
      </v-btn>
    </div>

    <!-- ERROR -->
    <v-alert v-if="error" type="error" variant="tonal" class="ma-3">{{ error }}</v-alert>

    <!-- SKELETON -->
    <div v-if="loading && !raw" class="pv-skel">
      <div class="pv-sk pv-sk--hero" />
      <div class="pv-sk pv-sk--tabs" />
      <div class="pv-sk pv-sk--body" />
    </div>

    <!-- MAIN CONTENT -->
    <template v-else-if="raw">

      <!-- HERO -->
      <div class="pv-hero">
        <div class="pv-hero-img-wrap">
          <img v-if="heroImage" :src="heroImage" class="pv-hero-img" />
          <div v-else class="pv-hero-img-placeholder">
            <v-icon size="42" color="medium-emphasis">mdi-image-outline</v-icon>
          </div>
        </div>

        <div class="pv-hero-info">
          <div class="pv-hero-chips">
            <v-chip
              size="x-small"
              :color="productForUIFixed.is_active !== false ? 'success' : 'warning'"
              variant="flat"
              rounded="lg"
            >
              {{ productForUIFixed.is_active !== false ? 'Activo' : 'Inactivo' }}
            </v-chip>
            <span v-if="productForUIFixed.category_name" class="pv-rubro">
              {{ productForUIFixed.category_name }}
              <template v-if="productForUIFixed.subcategory_name">
                <v-icon size="10" class="mx-1">mdi-chevron-right</v-icon>{{ productForUIFixed.subcategory_name }}
              </template>
            </span>
          </div>

          <h1 class="pv-hero-name">{{ productForUIFixed.name || '—' }}</h1>

          <div class="pv-hero-meta">
            <span v-if="productForUIFixed.brand" class="pv-brand">{{ productForUIFixed.brand }}</span>
            <span v-if="productForUIFixed.model" class="pv-model">{{ productForUIFixed.model }}</span>
            <span v-if="productForUIFixed.sku || productForUIFixed.code" class="pv-sku">
              {{ productForUIFixed.sku || productForUIFixed.code }}
            </span>
          </div>

          <!-- Quick stats -->
          <div class="pv-stats">
            <div class="pv-stat">
              <div class="pv-stat-val">${{ fmtPrice(productForUIFixed.price) }}</div>
              <div class="pv-stat-lbl">Precio</div>
            </div>
            <div class="pv-stat-sep" />
            <div class="pv-stat">
              <div class="pv-stat-val" :class="totalStockAllBranches > 0 ? 'clr-ok' : 'clr-zero'">
                {{ totalStockAllBranches }}
              </div>
              <div class="pv-stat-lbl">Stock total</div>
            </div>
            <div class="pv-stat-sep" />
            <div class="pv-stat">
              <div class="pv-stat-val">{{ branchesStock.length }}</div>
              <div class="pv-stat-lbl">Sucursales</div>
            </div>
          </div>
        </div>
      </div>

      <!-- TABS -->
      <v-tabs v-model="activeTab" color="primary" density="compact" class="pv-tabs">
        <v-tab value="info">
          <v-icon start size="15">mdi-information-outline</v-icon>
          Info
        </v-tab>
        <v-tab value="prices">
          <v-icon start size="15">mdi-cash-multiple</v-icon>
          Precios
        </v-tab>
        <v-tab value="stock">
          <v-icon start size="15">mdi-warehouse</v-icon>
          Stock
          <v-chip v-if="branchesStock.length" size="x-small" class="ml-1" color="primary" variant="tonal">
            {{ branchesStock.length }}
          </v-chip>
        </v-tab>
        <v-tab value="label">
          <v-icon start size="15">mdi-qrcode</v-icon>
          Etiqueta
        </v-tab>
      </v-tabs>

      <v-tabs-window v-model="activeTab">

        <!-- ── INFO ── -->
        <v-tabs-window-item value="info" class="pv-tab">
          <div class="pv-rows">

            <div v-if="productForUIFixed.brand" class="pv-row">
              <span class="pv-k">Marca</span>
              <span class="pv-v">{{ productForUIFixed.brand }}</span>
            </div>
            <div v-if="productForUIFixed.model" class="pv-row">
              <span class="pv-k">Modelo</span>
              <span class="pv-v">{{ productForUIFixed.model }}</span>
            </div>
            <div v-if="productForUIFixed.sku || productForUIFixed.code" class="pv-row">
              <span class="pv-k">Código / SKU</span>
              <span class="pv-v pv-mono">{{ productForUIFixed.sku || productForUIFixed.code }}</span>
            </div>
            <div v-if="productForUIFixed.barcode" class="pv-row">
              <span class="pv-k">Código de barras</span>
              <span class="pv-v pv-mono">{{ productForUIFixed.barcode }}</span>
            </div>
            <div v-if="productForUIFixed.category_name" class="pv-row">
              <span class="pv-k">Categoría</span>
              <span class="pv-v">{{ productForUIFixed.category_name }}</span>
            </div>
            <div v-if="productForUIFixed.subcategory_name" class="pv-row">
              <span class="pv-k">Subcategoría</span>
              <span class="pv-v">{{ productForUIFixed.subcategory_name }}</span>
            </div>

            <div v-if="productForUIFixed.description" class="pv-row pv-row--desc">
              <span class="pv-k">Descripción</span>
              <p class="pv-v pv-desc">{{ productForUIFixed.description }}</p>
            </div>

          </div>

          <!-- Extra photos -->
          <div v-if="allImages.length > 1" class="pv-section">
            <div class="pv-section-title">
              <v-icon size="14" color="pink">mdi-image-multiple</v-icon>
              Fotos ({{ allImages.length }})
            </div>
            <div class="pv-thumbs">
              <img
                v-for="(img, i) in allImages"
                :key="i"
                :src="img"
                class="pv-thumb"
                :class="{ 'pv-thumb--active': heroImage === img }"
                @click="heroImage = img"
              />
            </div>
          </div>
        </v-tabs-window-item>

        <!-- ── PRECIOS ── -->
        <v-tabs-window-item value="prices" class="pv-tab">
          <div class="pv-price-hero">
            <div class="pv-price-main">
              <span class="pv-price-cur">$</span>
              <span class="pv-price-big">{{ fmtPrice(productForUIFixed.price) }}</span>
            </div>
            <div class="pv-price-sub">Precio de venta</div>
          </div>

          <div class="pv-price-cards">
            <div class="pv-price-card">
              <div class="pv-pc-k">Lista</div>
              <div class="pv-pc-v">$ {{ fmtPrice(productForUIFixed.price_list) }}</div>
            </div>
            <div class="pv-price-card">
              <div class="pv-pc-k">Descuento</div>
              <div class="pv-pc-v">$ {{ fmtPrice(productForUIFixed.price_discount) }}</div>
            </div>
            <div class="pv-price-card">
              <div class="pv-pc-k">Revendedor</div>
              <div class="pv-pc-v">$ {{ fmtPrice(productForUIFixed.price_reseller) }}</div>
            </div>
            <div class="pv-price-card">
              <div class="pv-pc-k">Costo</div>
              <div class="pv-pc-v">$ {{ fmtPrice(productForUIFixed.cost) }}</div>
            </div>
            <div class="pv-price-card pv-price-card--accent" v-if="productForUIFixed.margin !== null && productForUIFixed.margin !== undefined">
              <div class="pv-pc-k">Margen</div>
              <div class="pv-pc-v pv-pc-margin">{{ Number(productForUIFixed.margin || 0).toFixed(1) }}%</div>
            </div>
          </div>
        </v-tabs-window-item>

        <!-- ── STOCK ── -->
        <v-tabs-window-item value="stock" class="pv-tab">
          <div class="pv-stock-header">
            <div class="pv-stock-total">
              <v-icon size="16" color="primary" class="mr-1">mdi-sigma</v-icon>
              Stock total: <strong>{{ totalStockAllBranches }} uds</strong>
            </div>
            <v-btn size="x-small" variant="text" :loading="mx.loading" @click="refreshBranchesMatrix">
              <v-icon start size="14">mdi-refresh</v-icon>Actualizar
            </v-btn>
          </div>

          <v-alert v-if="mx.error" type="error" variant="tonal" density="compact" class="mb-3 mx-3">{{ mx.error }}</v-alert>

          <div v-if="mx.loading" class="pv-centered">
            <v-progress-circular size="22" indeterminate color="primary" />
            <span class="ml-2 text-body-2">Cargando stock…</span>
          </div>

          <div v-else-if="!branchesStock.length" class="pv-empty">
            <v-icon size="32" color="medium-emphasis">mdi-store-off-outline</v-icon>
            <span>Sin datos de sucursales</span>
          </div>

          <div v-else class="pv-stock-list">
            <div
              v-for="r in branchesStock"
              :key="r.key"
              class="pv-stock-row"
              :class="{ 'pv-stock-row--ok': r.stock_qty > 0 }"
            >
              <div class="pv-stock-av" :class="{ ok: r.stock_qty > 0 }">{{ initials(r.branch_name) }}</div>
              <div class="pv-stock-name">{{ r.branch_name }}</div>
              <div class="pv-stock-qty" :class="r.stock_qty > 0 ? 'clr-ok' : 'clr-zero'">
                {{ r.stock_qty > 0 ? r.stock_qty + ' uds' : 'Sin stock' }}
              </div>
            </div>
          </div>
        </v-tabs-window-item>

        <!-- ── ETIQUETA ── -->
        <v-tabs-window-item value="label" class="pv-tab">
          <div class="pv-label-wrap">
            <div class="pv-size-row">
              <span class="pv-size-lbl">Formato</span>
              <v-btn-toggle v-model="labelSize" mandatory density="compact" rounded="lg">
                <v-btn value="100" size="small">100×60</v-btn>
                <v-btn value="80" size="small">80×55</v-btn>
                <v-btn value="58" size="small">58×40</v-btn>
              </v-btn-toggle>
            </div>

            <ProductLabelPreview
              :product="productForUIFixed"
              :size="labelSize"
              :qrValue="ui.qrValue"
            >
              <template #actions="{ printEl }">
                <div class="pv-label-actions">
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
        </v-tabs-window-item>

      </v-tabs-window>
    </template>

    <!-- Hidden A4 for printing -->
    <div class="pv-hidden">
      <div ref="sheetEl" class="pv-a4">
        <ProductLabelSheetA4
          :product="productForUIFixed"
          :size="labelSize"
          :copies="copies"
          :qrValue="ui.qrValue"
        />
      </div>
    </div>

    <!-- Print dialog -->
    <v-dialog v-model="printDlg" max-width="820">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon>mdi-printer</v-icon>
          <span class="font-weight-black">Vista previa — Etiqueta / QR</span>
        </v-card-title>
        <v-card-text>
          <ProductLabelPreview :product="productForUIFixed" :size="labelSize" :qrValue="ui.qrValue" />
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
const activeTab = ref("info");

const printDlg = ref(false);
const labelSize = ref("100");
const copies = ref(8);
const sheetEl = ref(null);
const heroImage = ref(null);

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

function fmtPrice(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(toNum(v, 0)));
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
  buildProductUI(raw.value, { productId: productId.value, branchId: branchId.value })
);

const productForUI = computed(() => ui.value?.product || {});

const allImages = computed(() => (Array.isArray(ui.value?.images) ? ui.value.images : []));

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

/* ── Stock por sucursal ── */
const mx = ref({ loading: false, error: "", rows: [] });

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

const totalStockAllBranches = computed(() =>
  branchesStock.value.reduce((s, r) => s + toNum(r.stock_qty, 0), 0)
);

const currentBranchRow = computed(() => {
  const bid = Number(branchId.value || 0);
  if (!bid) return null;
  return branchesStock.value.find((r) => Number(r.branch_id) === bid) || null;
});

/* ── Product enriched ── */
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
  heroImage.value = null;

  const id = productId.value;
  if (!id) { error.value = "Producto inválido."; return; }

  loading.value = true;
  try {
    const fullResp = await products.fetchOne(Number(id), { force: true, branch_id: branchId.value });
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

watch(allImages, (imgs) => {
  if (imgs.length && !heroImage.value) heroImage.value = imgs[0];
}, { immediate: true });

onMounted(fetchProduct);
watch(productId, fetchProduct);
watch(branchId, fetchProduct);
</script>

<style scoped>
.pv {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* ── TOP BAR ── */
.pv-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  position: sticky;
  top: 0;
  z-index: 10;
}
.pv-back { flex-shrink: 0; margin-left: -4px; }
.pv-bar-title {
  font-size: 15px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}

/* ── SKELETON ── */
@keyframes pv-pulse { 0%, 100% { opacity: 0.4 } 50% { opacity: 0.9 } }
.pv-skel { display: flex; flex-direction: column; gap: 10px; padding: 14px; }
.pv-sk { border-radius: 12px; background: rgba(var(--v-theme-on-surface), 0.08); animation: pv-pulse 1.4s ease infinite; }
.pv-sk--hero { height: 140px; }
.pv-sk--tabs { height: 40px; }
.pv-sk--body { height: 220px; }

/* ── HERO ── */
.pv-hero {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.pv-hero-img-wrap {
  flex-shrink: 0;
  width: 110px;
  height: 110px;
  border-radius: 14px;
  overflow: hidden;
  border: 1.5px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-on-surface), 0.04);
}
.pv-hero-img { width: 100%; height: 100%; object-fit: cover; }
.pv-hero-img-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}

.pv-hero-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.pv-hero-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.pv-rubro {
  font-size: 11px;
  opacity: 0.55;
  display: flex;
  align-items: center;
}

.pv-hero-name {
  font-size: 18px;
  font-weight: 900;
  line-height: 1.2;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.pv-hero-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.pv-brand { font-size: 12px; font-weight: 700; opacity: 0.7; }
.pv-model { font-size: 12px; opacity: 0.5; }
.pv-sku   { font-size: 11px; font-family: monospace; opacity: 0.4; }

/* Stats row */
.pv-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  padding: 10px 14px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: 10px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.pv-stat { text-align: center; min-width: 0; }
.pv-stat-val { font-size: 18px; font-weight: 900; line-height: 1; }
.pv-stat-lbl { font-size: 10px; opacity: 0.5; margin-top: 2px; }
.pv-stat-sep { width: 1px; height: 28px; background: rgba(var(--v-border-color), calc(var(--v-border-opacity) * 1.5)); }

.clr-ok   { color: rgb(var(--v-theme-success)); }
.clr-zero { opacity: 0.4; }

/* ── TABS ── */
.pv-tabs {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  position: sticky;
  top: 49px;
  z-index: 9;
}

/* ── TAB BODY ── */
.pv-tab {
  padding: 14px 16px 24px;
}

/* ── INFO tab rows ── */
.pv-rows { display: flex; flex-direction: column; }
.pv-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.7));
}
.pv-row:last-child { border-bottom: none; }
.pv-row--desc { flex-direction: column; gap: 4px; }
.pv-k {
  font-size: 11px;
  font-weight: 700;
  opacity: 0.45;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  min-width: 110px;
  flex-shrink: 0;
}
.pv-v { font-size: 14px; font-weight: 600; flex: 1; }
.pv-mono { font-family: monospace; font-size: 13px; }
.pv-desc { margin: 0; font-size: 14px; line-height: 1.5; opacity: 0.8; font-weight: 400; }

/* Photos */
.pv-section { margin-top: 16px; }
.pv-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 800;
  opacity: 0.5;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
}
.pv-thumbs { display: flex; gap: 8px; flex-wrap: wrap; }
.pv-thumb {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.15s, opacity 0.15s;
  opacity: 0.75;
}
.pv-thumb:hover { opacity: 1; }
.pv-thumb--active { border-color: rgb(var(--v-theme-primary)); opacity: 1; }

/* ── PRICES tab ── */
.pv-price-hero {
  text-align: center;
  padding: 20px 16px 16px;
}
.pv-price-main { display: flex; align-items: flex-end; justify-content: center; gap: 2px; }
.pv-price-cur { font-size: 22px; font-weight: 900; opacity: 0.5; padding-bottom: 5px; }
.pv-price-big { font-size: 48px; font-weight: 900; line-height: 1; }
.pv-price-sub { font-size: 12px; opacity: 0.45; margin-top: 4px; font-weight: 600; }

.pv-price-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 10px;
  margin-top: 4px;
}
.pv-price-card {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1.5px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-on-surface), 0.02);
}
.pv-price-card--accent {
  border-color: rgba(var(--v-theme-success), 0.4);
  background: rgba(var(--v-theme-success), 0.04);
}
.pv-pc-k { font-size: 11px; opacity: 0.45; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
.pv-pc-v { font-size: 17px; font-weight: 900; }
.pv-pc-margin { color: rgb(var(--v-theme-success)); }

/* ── STOCK tab ── */
.pv-stock-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0 12px;
}
.pv-stock-total { font-size: 13px; opacity: 0.7; display: flex; align-items: center; }

.pv-centered { display: flex; align-items: center; justify-content: center; padding: 24px; }

.pv-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  opacity: 0.5;
  font-size: 13px;
}

.pv-stock-list { display: flex; flex-direction: column; }
.pv-stock-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.7));
}
.pv-stock-row:last-child { border-bottom: none; }
.pv-stock-row--ok { }

.pv-stock-av {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 900;
  background: rgba(var(--v-theme-on-surface), 0.07);
}
.pv-stock-av.ok { background: rgba(var(--v-theme-success), 0.12); color: rgb(var(--v-theme-success)); }
.pv-stock-name { flex: 1; font-size: 14px; font-weight: 700; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pv-stock-qty { font-size: 14px; font-weight: 800; flex-shrink: 0; }

/* ── LABEL tab ── */
.pv-label-wrap { display: flex; flex-direction: column; gap: 14px; }
.pv-size-row { display: flex; align-items: center; gap: 12px; }
.pv-size-lbl { font-size: 12px; font-weight: 700; opacity: 0.55; white-space: nowrap; }
.pv-label-actions { margin-top: 12px; }

/* ── HIDDEN print area ── */
.pv-hidden { position: fixed; left: -99999px; top: 0; visibility: hidden; pointer-events: none; }
.pv-a4 { width: 210mm; min-height: 297mm; background: #fff; }

/* ── RESPONSIVE ── */
@media (max-width: 480px) {
  .pv-bar { padding: 8px 12px; }
  .pv-bar-title { font-size: 14px; max-width: 180px; }
  .pv-hero { padding: 12px; gap: 12px; }
  .pv-hero-img-wrap { width: 88px; height: 88px; }
  .pv-hero-name { font-size: 16px; }
  .pv-stats { padding: 8px 10px; gap: 8px; }
  .pv-stat-val { font-size: 16px; }
  .pv-price-big { font-size: 38px; }
  .pv-tab { padding: 12px 14px 20px; }
  .pv-k { min-width: 90px; }
}
</style>
