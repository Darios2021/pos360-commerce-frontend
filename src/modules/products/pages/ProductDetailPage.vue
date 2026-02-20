<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/pages/ProductDetailPage.vue -->
<template>
  <div class="pd" data-page="product-detail">
    <ProductHeader v-if="product" :product="product" @back="goBack">
      <template #actions>
        <v-chip v-if="branchName" size="small" variant="tonal">
          <v-icon start size="16">mdi-store</v-icon>
          {{ branchName }}
        </v-chip>
      </template>
    </ProductHeader>

    <v-alert v-if="error" type="error" variant="tonal" class="mt-3">
      {{ error }}
    </v-alert>

    <div v-if="loading" class="pd-loading">
      <v-progress-circular indeterminate size="22" />
      <span>Cargando producto…</span>
    </div>

    <div v-else-if="product" class="pd-grid">
      <!-- Izquierda: detalle -->
      <div class="pd-left">
        <ProductPriceBlock :product="product" class="mb-3" />
        <ProductStockBlock :product="product" :branchName="branchName" class="mb-3" />
        <ProductInfoCard :product="product" class="mb-3" />
        <ProductGallery :product="product" />
      </div>

      <!-- Derecha: etiqueta + acciones -->
      <div class="pd-right">
        <ProductLabelPreview :product="product" :size="labelSize" :qrValue="qrValue">
          <template #actions="{ printEl }">
            <div class="mt-3">
              <ProductPrintActions
                v-model="labelSize"
                v-model:copies="copies"
                :printEl="printEl"
                :sheetEl="sheetEl"
                :title="printTitle"
              />
            </div>
          </template>
        </ProductLabelPreview>
      </div>
    </div>

    <!-- ✅ Render oculto SOLO para imprimir A4 (grilla). NO se ve en pantalla -->
    <div class="pd-hidden">
      <div ref="sheetEl">
        <ProductLabelSheetA4 :product="product || {}" :size="labelSize" :copies="copies" :qrValue="qrValue" />
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import ProductHeader from "@/modules/products/components/detail/ProductHeader.vue";
import ProductPriceBlock from "@/modules/products/components/detail/ProductPriceBlock.vue";
import ProductStockBlock from "@/modules/products/components/detail/ProductStockBlock.vue";
import ProductInfoCard from "@/modules/products/components/detail/ProductInfoCard.vue";
import ProductGallery from "@/modules/products/components/detail/ProductGallery.vue";

import ProductLabelPreview from "@/modules/products/components/label/ProductLabelPreview.vue";
import ProductLabelSheetA4 from "@/modules/products/components/label/ProductLabelSheetA4.vue";
import ProductPrintActions from "@/modules/products/components/actions/ProductPrintActions.vue";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const error = ref("");
const product = ref(null);

// ✅ tamaños
const labelSize = ref("100");

// ✅ A4 copias
const copies = ref(8);

// ✅ ref DOM para hoja A4
const sheetEl = ref(null);

const branchId = ref(Number(localStorage.getItem("pos_branch_id") || localStorage.getItem("shop_branch_id") || 1));
const branchName = ref(String(localStorage.getItem("pos_branch_name") || localStorage.getItem("shop_branch_name") || "Casa Central"));

const productId = computed(() => Number(route.params?.id || route.query?.id || 0));

const qrValue = computed(() => {
  const id = product.value?.id ?? productId.value;
  return `${window.location.origin}/shop/product/${id}`;
});

const printTitle = computed(() => {
  const p = product.value || {};
  const nm = p?.name || p?.title || "Producto";
  const cd = p?.code || p?.internal_code || p?.barcode || p?.id || "";
  return `Etiquetas - ${nm}${cd ? " (" + cd + ")" : ""}`;
});

function goBack() {
  router.back();
}

function normalizeBaseUrl(base) {
  let b = String(base || "").trim();
  if (!b) return "";
  b = b.replace(/\/+$/, "");
  if (/\/api$/i.test(b)) b = b + "/v1";
  return b;
}

const API_BASE = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || "");
const http = axios.create({
  baseURL: API_BASE || undefined,
  timeout: 20000,
});

async function fetchProduct() {
  error.value = "";
  product.value = null;

  const id = productId.value;
  if (!id) {
    error.value = "Producto inválido.";
    return;
  }

  loading.value = true;
  try {
    const paths = [`/products/${id}`, `/admin/products/${id}`];

    let data = null;
    for (const p of paths) {
      try {
        const res = await http.get(p, { params: { branch_id: branchId.value } });
        data = res?.data?.data ?? res?.data ?? null;
        if (data) break;
      } catch (e) {}
    }

    if (!data) throw new Error("No se pudo obtener el producto.");
    product.value = data;
  } catch (e) {
    error.value = e?.message || "Error al cargar producto.";
  } finally {
    loading.value = false;
  }
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

@media (max-width: 1200px){
  .pd-grid{ grid-template-columns: 1fr 380px; }
}
@media (max-width: 980px){
  .pd-grid{ grid-template-columns: 1fr; }
  .pd-right{ position: static; }
}

/* ✅ Oculto de verdad (pero existe para imprimir) */
.pd-hidden{
  position: fixed;
  left: -99999px;
  top: 0;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
</style>