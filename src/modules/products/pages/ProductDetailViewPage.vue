<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/pages/ProductDetailViewPage.vue -->

<template>
  <div class="pd" data-page="product-detail-view">
    <ProductHeader v-if="raw" :product="ui.product" @back="goBack">
      <template #actions>
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
      </template>
    </ProductHeader>

    <v-alert v-if="error" type="error" variant="tonal" class="mt-3">
      {{ error }}
    </v-alert>

    <div v-if="loading" class="pd-loading">
      <v-progress-circular indeterminate size="22" />
      <span>Cargando producto…</span>
    </div>

    <div v-else-if="raw" class="pd-grid">
      <!-- Izq -->
      <div class="pd-left">
        <ProductPriceBlock :product="ui.product" class="mb-3" />
        <ProductStockBlock :product="ui.product" class="mb-3" />
        <ProductInfoCard :product="ui.product" class="mb-3" />

        <v-card rounded="xl" elevation="1" class="pd-card">
          <div class="pd-card-head">
            <div class="pd-card-title">Fotos</div>
          </div>
          <ProductPhotoGallery :images="ui.images" />
        </v-card>
      </div>

      <!-- Der -->
      <div class="pd-right">
        <ProductLabelPreview :product="ui.product" :size="labelSize" :qrValue="ui.qrValue">
          <template #actions="{ printEl }">
            <div class="mt-3">
              <ProductPrintActions
                v-model="labelSize"
                v-model:copies="copies"
                :printEl="printEl"
                :sheetEl="sheetEl"
                :title="printTitle"
                :product="ui.product"
                :qrValue="ui.qrValue"
              />
            </div>
          </template>
        </ProductLabelPreview>
      </div>
    </div>

    <!-- ✅ Render oculto SOLO para A4 -->
    <div class="pd-hidden">
      <div ref="sheetEl" class="pd-a4-shell">
        <ProductLabelSheetA4 :product="ui.product" :size="labelSize" :copies="copies" :qrValue="ui.qrValue" />
      </div>
    </div>

    <!-- Modal preview -->
    <v-dialog v-model="printDlg" max-width="820">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon>mdi-printer</v-icon>
          <span class="font-weight-black">Etiqueta</span>
        </v-card-title>

        <v-card-text>
          <ProductLabelPreview :product="ui.product" :size="labelSize" :qrValue="ui.qrValue" />
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="printDlg=false">Cerrar</v-btn>
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

// ✅ tamaños dentro de A4: "100" = 100x60 / "58" = 58x40
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

const ui = computed(() => buildProductUI(raw.value, { productId: productId.value }));

const printTitle = computed(() => {
  const nm = ui.value.product?.name || "Producto";
  const cd = ui.value.product?.code || ui.value.product?.id || "";
  return `Etiquetas A4 - ${nm}${cd ? " (" + cd + ")" : ""}`;
});

function goBack() {
  router.back();
}
function openEcommerce() {
  window.open(ui.value.ecommerceUrl, "_blank", "noopener,noreferrer");
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
    const full = await products.fetchOne(Number(id), { force: true, branch_id: branchId.value });
    if (!full) throw new Error(products.error || "No se pudo obtener el producto.");
    raw.value = full;
  } catch (e) {
    error.value = e?.friendlyMessage || e?.message || "No se pudo obtener el producto.";
  } finally {
    loading.value = false;
  }
}

// ✅ PDF A4 (NO 58 suelta)
async function downloadPdf() {
  if (!raw.value) return;
  await downloadLabelPdfA4({
    product: ui.value.product,
    size: labelSize.value,
    copies: copies.value,
    qrValue: ui.value.qrValue,
    title: printTitle.value,
  });
}

onMounted(fetchProduct);
watch(productId, fetchProduct);
</script>

<style scoped>
.pd{ padding: 14px; }

.pd-loading{
  margin-top: 16px;
  display:flex;
  gap:10px;
  align-items:center;
  opacity:.8;
}

.pd-grid{
  margin-top: 12px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 12px;
  align-items: start;
}

.pd-left{ min-width:0; }
.pd-right{ position: sticky; top: 12px; }

.pd-card{ padding: 14px; }
.pd-card-head{ display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.pd-card-title{ font-weight:900; }

@media (max-width: 1200px){
  .pd-grid{ grid-template-columns: 1fr 380px; }
}
@media (max-width: 980px){
  .pd-grid{ grid-template-columns: 1fr; }
  .pd-right{ position: static; }
}

/* ✅ Oculto, pero con tamaño REAL para que no salga "blanco" si algún util mide el DOM */
.pd-hidden{
  position: fixed;
  left: -99999px;
  top: 0;
  visibility: hidden;
  pointer-events: none;
}
.pd-a4-shell{
  width: 210mm;   /* ✅ tamaño real A4 */
  min-height: 297mm;
  background: #fff;
}
</style>