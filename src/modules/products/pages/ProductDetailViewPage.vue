<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/pages/ProductDetailViewPage.vue -->
<!-- ✅ FIX DEFINITIVO:
     - Stock por sucursal usa el MISMO flujo que tu ProductStockBranchesPanel:
       products.fetchBranchesMatrix(productId)
     - Elimina tryGet / endpoints inventados (evita 404 en consola)
     - Muestra tabla con stock_qty por sucursal
     - Si total stock == 0, muestra aviso “sin stock en ninguna sucursal”
-->

<template>
  <div class="pd" data-page="product-detail-view">
    <!-- 🔹 HEADER SIN BOTONES -->
    <ProductHeader v-if="raw" :product="productForUI" @back="goBack" />

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
        <ProductPriceBlock :product="productForUI" class="mb-3" />
        <ProductStockBlock :product="productForUI" class="mb-3" />

        <!-- ✅ Stock por sucursal (DB integral) -->
        <v-card rounded="xl" elevation="1" class="pd-card mb-3">
          <div class="pd-card-head">
            <div class="pd-card-title">Stock por sucursal</div>
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

          <v-table v-if="branchesStock.length" density="compact" class="pd-table">
            <thead>
              <tr>
                <th class="text-left">Sucursal</th>
                <th class="text-right">Stock</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in branchesStock" :key="r.key">
                <td class="pd-branch">
                  <div class="pd-branch-name">{{ r.branch_name }}</div>
                  <div class="pd-branch-meta">ID: {{ r.branch_id }}</div>
                </td>
                <td class="text-right">
                  <v-chip
                    size="small"
                    :variant="r.stock_qty > 0 ? 'flat' : 'tonal'"
                    :color="r.stock_qty > 0 ? 'success' : undefined"
                  >
                    {{ fmtQty(r.stock_qty) }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>

        <ProductInfoCard :product="productForUI" class="mb-3" />

        <v-card rounded="xl" elevation="1" class="pd-card">
          <div class="pd-card-head">
            <div class="pd-card-title">Fotos</div>
          </div>
          <ProductPhotoGallery :images="ui.images" />
        </v-card>
      </div>

      <!-- ================= RIGHT ================= -->
      <div class="pd-right">
        <!-- 🔹 BARRA DE ACCIONES -->
        <v-card rounded="xl" elevation="1" class="pd-actions mb-3">
          <div class="pd-actions-row">
            <v-btn color="primary" variant="flat" :disabled="loading || !raw" @click="printDlg = true">
              <v-icon start>mdi-printer</v-icon>
              Imprimir etiqueta
            </v-btn>

            <v-btn color="primary" variant="tonal" :disabled="loading || !raw" @click="downloadPdf">
              <v-icon start>mdi-file-pdf-box</v-icon>
              Descargar PDF
            </v-btn>

            <v-btn variant="tonal" :disabled="loading || !raw" @click="openEcommerce">
              <v-icon start>mdi-open-in-new</v-icon>
              Ver eCommerce
            </v-btn>
          </div>
        </v-card>

        <ProductLabelPreview :product="productForUI" :size="labelSize" :qrValue="ui.qrValue">
          <template #actions="{ printEl }">
            <div class="mt-3">
              <ProductPrintActions
                v-model="labelSize"
                v-model:copies="copies"
                :printEl="printEl"
                :sheetEl="sheetEl"
                :title="printTitle"
                :product="productForUI"
                :qrValue="ui.qrValue"
              />
            </div>
          </template>
        </ProductLabelPreview>
      </div>
    </div>

    <!-- 🔹 Render oculto SOLO para A4 -->
    <div class="pd-hidden">
      <div ref="sheetEl" class="pd-a4-shell">
        <ProductLabelSheetA4 :product="productForUI" :size="labelSize" :copies="copies" :qrValue="ui.qrValue" />
      </div>
    </div>

    <!-- 🔹 Modal preview -->
    <v-dialog v-model="printDlg" max-width="820">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon>mdi-printer</v-icon>
          <span class="font-weight-black">Etiqueta</span>
        </v-card-title>

        <v-card-text>
          <ProductLabelPreview :product="productForUI" :size="labelSize" :qrValue="ui.qrValue" />
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
import ProductStockBlock from "@/modules/products/components/detail/ProductStockBlock.vue";
import ProductInfoCard from "@/modules/products/components/detail/ProductInfoCard.vue";
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
const labelSize = ref("100");
const copies = ref(8);
const sheetEl = ref(null);

const productId = computed(() => Number(route.params?.id || route.query?.id || 0));

const branchId = computed(() => {
  const u = auth?.user || {};
  const bid = Number(u?.branch_id || 0) || Number(auth?.branchId || 0) || 0;
  const ls = Number(localStorage.getItem("pos_branch_id") || localStorage.getItem("shop_branch_id") || 0) || 0;
  return bid > 0 ? bid : ls > 0 ? ls : null;
});

const ui = computed(() => buildProductUI(raw.value, { productId: productId.value, branchId: branchId.value }));
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

function toNum(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}
function fmtQty(v) {
  return toNum(v, 0).toFixed(3);
}

/* =========================
   ✅ Stock por sucursal (MISMO store que el panel)
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
      stock_qty: toNum(x?.stock_qty ?? x?.qty ?? x?.stock ?? 0, 0),
    }))
    .filter((r) => r.branch_id > 0)
    .sort((a, b) => a.branch_id - b.branch_id);
});

const totalStockAllBranches = computed(() => {
  let s = 0;
  for (const r of branchesStock.value) s += toNum(r.stock_qty, 0);
  return s;
});

async function refreshBranchesMatrix() {
  const pid = Number(productId.value || 0);
  if (!pid) return;

  mx.value.loading = true;
  mx.value.error = "";
  try {
    const matrix = await products.fetchBranchesMatrix(pid); // ✅ ESTA es la clave
    mx.value.rows = Array.isArray(matrix) ? matrix : [];
  } catch (e) {
    mx.value.rows = [];
    mx.value.error = e?.message || products.error || "No se pudo cargar stock por sucursal";
  } finally {
    mx.value.loading = false;
  }
}

/* =========================
   Fetch
========================= */
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
    const full = await products.fetchOne(Number(id), {
      force: true,
      branch_id: branchId.value,
    });

    if (!full) throw new Error(products.error || "No se pudo obtener el producto.");
    raw.value = full;

    // ✅ siempre traer matriz por sucursal desde DB (como el panel)
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
    product: productForUI.value,
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
.pd { padding: 14px; }

.pd-loading {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  align-items: center;
  opacity: 0.8;
}

.pd-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 12px;
  align-items: start;
}

.pd-left { min-width: 0; }

.pd-right {
  position: sticky;
  top: 12px;
}

.pd-actions { padding: 14px; }

.pd-actions-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pd-card { padding: 14px; }

.pd-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.pd-card-title { font-weight: 900; }

.pd-muted {
  opacity: 0.85;
  font-size: 13px;
  line-height: 1.35;
}

.pd-table {
  border-radius: 12px;
  overflow: hidden;
}

.pd-branch-name { font-weight: 900; }
.pd-branch-meta { font-size: 12px; opacity: 0.7; }

@media (max-width: 1200px) {
  .pd-grid { grid-template-columns: 1fr 380px; }
}

@media (max-width: 980px) {
  .pd-grid { grid-template-columns: 1fr; }
  .pd-right { position: static; }
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