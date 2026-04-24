<!-- src/modules/products/pages/ProductDetailViewPage.vue -->
<template>
  <div class="pv">

    <!-- TOP BAR -->
    <div class="pv-bar">
      <v-btn icon variant="text" size="small" @click="goBack" class="pv-back">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>

      <div v-if="raw" class="pv-breadcrumb">
        <v-icon size="14" class="pv-bc-ic">mdi-package-variant-closed</v-icon>
        <span v-if="productForUIFixed.category_name" class="pv-bc-root">{{ productForUIFixed.category_name }}</span>
        <v-icon v-if="productForUIFixed.subcategory_name" size="14" class="pv-bc-sep">mdi-chevron-right</v-icon>
        <span v-if="productForUIFixed.subcategory_name" class="pv-bc-leaf">{{ productForUIFixed.subcategory_name }}</span>
        <span v-if="!productForUIFixed.category_name && !productForUIFixed.subcategory_name">Detalle de producto</span>
      </div>
      <span v-else class="pv-breadcrumb">Detalle de producto</span>

      <v-spacer />

      <v-btn
        v-if="raw"
        variant="tonal"
        size="small"
        prepend-icon="mdi-qrcode"
        rounded="lg"
        class="mr-2"
        @click="printDlg = true"
      >
        Etiqueta / QR
      </v-btn>

      <v-btn
        v-if="raw"
        color="primary"
        variant="flat"
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
      <div class="pv-sk pv-sk--gallery" />
      <div class="pv-sk-stack">
        <div class="pv-sk pv-sk--card" />
        <div class="pv-sk pv-sk--card" />
        <div class="pv-sk pv-sk--card" />
      </div>
    </div>

    <!-- MAIN -->
    <div v-else-if="raw" class="pv-layout">

      <!-- ── GALLERY (left, sticky) ── -->
      <aside class="pv-gallery">
        <div class="pv-gallery-main">
          <img v-if="heroImage" :src="heroImage" class="pv-gallery-img" />
          <div v-else class="pv-gallery-placeholder">
            <v-icon size="72" color="medium-emphasis">mdi-image-outline</v-icon>
            <span class="mt-2">Sin imagen</span>
          </div>
          <div v-if="allImages.length > 1" class="pv-gallery-count">
            {{ activeImageIndex + 1 }} / {{ allImages.length }}
          </div>
          <button
            v-if="allImages.length > 1"
            type="button"
            class="pv-gallery-nav pv-gallery-nav--prev"
            @click="prevImage"
            aria-label="Anterior"
          >
            <v-icon size="22">mdi-chevron-left</v-icon>
          </button>
          <button
            v-if="allImages.length > 1"
            type="button"
            class="pv-gallery-nav pv-gallery-nav--next"
            @click="nextImage"
            aria-label="Siguiente"
          >
            <v-icon size="22">mdi-chevron-right</v-icon>
          </button>
        </div>

        <div v-if="allImages.length > 1" class="pv-gallery-thumbs">
          <button
            v-for="(img, i) in allImages"
            :key="i"
            type="button"
            class="pv-gallery-thumb"
            :class="{ 'pv-gallery-thumb--active': heroImage === img }"
            @click="heroImage = img"
          >
            <img :src="img" />
          </button>
        </div>

        <!-- Videos (debajo de imágenes) -->
        <section v-if="vd.loading || videosList.length || vd.error" class="pv-card pv-card--videos">
          <div class="pv-card-head">
            <div class="pv-card-title">
              <v-icon size="16" color="red">mdi-play-circle</v-icon>
              Videos
              <v-chip v-if="videosList.length" size="x-small" class="ml-2" color="primary" variant="flat">
                {{ videosList.length }}
              </v-chip>
            </div>
            <v-btn size="x-small" variant="text" :loading="vd.loading" @click="loadVideos">
              <v-icon start size="14">mdi-refresh</v-icon>Actualizar
            </v-btn>
          </div>

          <v-alert v-if="vd.error" type="error" variant="tonal" density="compact" class="mb-3">{{ vd.error }}</v-alert>

          <div v-if="vd.loading && !videosList.length" class="pv-centered">
            <v-progress-circular size="22" indeterminate color="primary" />
            <span class="ml-2 text-body-2">Cargando videos…</span>
          </div>

          <div v-else-if="!videosList.length" class="pv-empty pv-empty--sm">
            <v-icon size="32" color="medium-emphasis">mdi-video-off-outline</v-icon>
            <span>Sin videos cargados</span>
          </div>

          <div v-else class="pv-video-grid">
            <button
              v-for="v in videosList"
              :key="v.id"
              type="button"
              class="pv-video-card"
              @click="openVideo(v)"
            >
              <div
                class="pv-video-thumb"
                :style="v.isYoutube && v.thumbUrl ? { backgroundImage: `url('${v.thumbUrl}')` } : null"
              >
                <img
                  v-if="v.isYoutube && v.thumbUrl"
                  :src="v.thumbUrl"
                  :alt="v.title"
                  class="pv-video-fg"
                  @error="(e) => onThumbError(e, v.raw)"
                />
                <video
                  v-else-if="v.url"
                  :src="v.url + '#t=0.5'"
                  preload="metadata"
                  muted
                  playsinline
                  class="pv-video-fg"
                />
                <div v-else class="pv-video-thumb-fallback">
                  <v-icon size="44" color="white">mdi-file-video</v-icon>
                </div>
                <div class="pv-video-play">
                  <v-icon size="32" color="white">mdi-play</v-icon>
                </div>
              </div>
              <div v-if="v.title" class="pv-video-title">{{ v.title }}</div>
            </button>
          </div>
        </section>
      </aside>

      <!-- ── CONTENT (right, scroll) ── -->
      <div class="pv-content">

        <!-- Identity -->
        <section class="pv-card pv-card--identity">
          <div class="pv-chips-row">
            <v-chip
              size="small"
              :color="productForUIFixed.is_active !== false ? 'success' : 'error'"
              variant="flat"
              rounded="md"
              class="pv-chip-status"
            >
              <v-icon start size="14">
                {{ productForUIFixed.is_active !== false ? 'mdi-check-circle' : 'mdi-close-circle' }}
              </v-icon>
              {{ productForUIFixed.is_active !== false ? 'Activo' : 'Inactivo' }}
            </v-chip>
            <v-chip v-if="productForUIFixed.is_new" size="small" color="primary" variant="tonal" rounded="md">Nuevo</v-chip>
            <v-chip v-if="productForUIFixed.is_promo" size="small" color="warning" variant="tonal" rounded="md">Promo</v-chip>
            <v-chip v-if="productForUIFixed.track_stock === false" size="small" variant="tonal" rounded="md">Sin control stock</v-chip>
          </div>

          <h1 class="pv-name">{{ productForUIFixed.name || '—' }}</h1>

          <div class="pv-meta">
            <span v-if="productForUIFixed.brand" class="pv-meta-brand">{{ productForUIFixed.brand }}</span>
            <span v-if="productForUIFixed.model" class="pv-meta-sep">·</span>
            <span v-if="productForUIFixed.model" class="pv-meta-model">{{ productForUIFixed.model }}</span>
          </div>

          <div class="pv-codes">
            <div v-if="productForUIFixed.sku || productForUIFixed.code" class="pv-code-pill">
              <v-icon size="13" class="pv-code-ic">mdi-pound</v-icon>
              <span class="pv-code-k">SKU</span>
              <span class="pv-code-v">{{ productForUIFixed.sku || productForUIFixed.code }}</span>
            </div>
            <div v-if="productForUIFixed.barcode" class="pv-code-pill">
              <v-icon size="13" class="pv-code-ic">mdi-barcode</v-icon>
              <span class="pv-code-k">Barcode</span>
              <span class="pv-code-v">{{ productForUIFixed.barcode }}</span>
            </div>
          </div>
        </section>

        <!-- Prices -->
        <section class="pv-card">
          <div class="pv-card-head">
            <div class="pv-card-title">
              <v-icon size="16" color="success">mdi-cash-multiple</v-icon>
              Precios
            </div>
          </div>

          <div class="pv-price-hero">
            <div class="pv-price-main">
              <div class="pv-price-cash">
                <div class="pv-price-cash-lbl">Contado / MP</div>
                <div class="pv-price-cash-val">
                  <span class="pv-price-cur">$</span>
                  <span class="pv-price-big">{{ fmtPrice(productForUIFixed.price_discount) }}</span>
                </div>
              </div>
              <div
                v-if="productForUIFixed.price_list > productForUIFixed.price_discount && productForUIFixed.price_list"
                class="pv-price-delta"
              >
                <v-icon size="14">mdi-arrow-down-bold</v-icon>
                {{ Math.round(((productForUIFixed.price_list - productForUIFixed.price_discount) / productForUIFixed.price_list) * 100) }}%
              </div>
            </div>
            <div
              v-if="productForUIFixed.price_list && productForUIFixed.price_list !== productForUIFixed.price_discount"
              class="pv-price-compare"
            >
              <span class="pv-price-compare-k">Lista / Crédito:</span>
              <span class="pv-price-compare-v">${{ fmtPrice(productForUIFixed.price_list) }}</span>
            </div>
          </div>

          <div class="pv-price-grid">
            <div class="pv-pg-item">
              <span class="pv-pg-k">Lista</span>
              <span class="pv-pg-v">${{ fmtPrice(productForUIFixed.price_list) }}</span>
            </div>
            <div class="pv-pg-item">
              <span class="pv-pg-k">Contado</span>
              <span class="pv-pg-v">${{ fmtPrice(productForUIFixed.price_discount) }}</span>
            </div>
            <div class="pv-pg-item">
              <span class="pv-pg-k">Revendedor</span>
              <span class="pv-pg-v">${{ fmtPrice(productForUIFixed.price_reseller) }}</span>
            </div>
            <div class="pv-pg-item">
              <span class="pv-pg-k">Costo</span>
              <span class="pv-pg-v pv-pg-v--dim">${{ fmtPrice(productForUIFixed.cost) }}</span>
            </div>
            <div class="pv-pg-item pv-pg-item--margin" v-if="productForUIFixed.margin !== null && productForUIFixed.margin !== undefined">
              <span class="pv-pg-k">Margen</span>
              <span class="pv-pg-v pv-pg-v--ok">{{ Number(productForUIFixed.margin || 0).toFixed(1) }}%</span>
            </div>
          </div>
        </section>

        <!-- Stock -->
        <section class="pv-card">
          <div class="pv-card-head">
            <div class="pv-card-title">
              <v-icon size="16" color="primary">mdi-warehouse</v-icon>
              Stock por sucursal
              <v-chip size="x-small" class="ml-2" :color="totalStockAllBranches > 0 ? 'success' : 'grey'" variant="flat">
                {{ totalStockAllBranches }} uds
              </v-chip>
            </div>
            <v-btn size="x-small" variant="text" :loading="mx.loading" @click="refreshBranchesMatrix">
              <v-icon start size="14">mdi-refresh</v-icon>Actualizar
            </v-btn>
          </div>

          <v-alert v-if="mx.error" type="error" variant="tonal" density="compact" class="mb-3">{{ mx.error }}</v-alert>

          <div v-if="mx.loading" class="pv-centered">
            <v-progress-circular size="22" indeterminate color="primary" />
            <span class="ml-2 text-body-2">Cargando stock…</span>
          </div>

          <div v-else-if="!branchesStock.length" class="pv-empty pv-empty--sm">
            <v-icon size="32" color="medium-emphasis">mdi-store-off-outline</v-icon>
            <span>Sin datos de sucursales</span>
          </div>

          <div v-else class="pv-stock-grid">
            <div
              v-for="r in branchesStock"
              :key="r.key"
              class="pv-stock-card"
              :class="{ 'pv-stock-card--ok': r.stock_qty > 0 }"
            >
              <div class="pv-stock-av" :class="{ ok: r.stock_qty > 0 }">{{ initials(r.branch_name) }}</div>
              <div class="pv-stock-body">
                <div class="pv-stock-name">{{ r.branch_name }}</div>
                <div class="pv-stock-qty" :class="r.stock_qty > 0 ? 'clr-ok' : 'clr-zero'">
                  {{ r.stock_qty > 0 ? r.stock_qty + ' uds' : 'Sin stock' }}
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Details -->
        <section class="pv-card">
          <div class="pv-card-head">
            <div class="pv-card-title">
              <v-icon size="16" color="indigo">mdi-information-outline</v-icon>
              Detalles
            </div>
          </div>

          <dl class="pv-dl">
            <template v-if="productForUIFixed.brand">
              <dt>Marca</dt><dd>{{ productForUIFixed.brand }}</dd>
            </template>
            <template v-if="productForUIFixed.model">
              <dt>Modelo</dt><dd>{{ productForUIFixed.model }}</dd>
            </template>
            <template v-if="productForUIFixed.category_name">
              <dt>Categoría</dt><dd>{{ productForUIFixed.category_name }}</dd>
            </template>
            <template v-if="productForUIFixed.subcategory_name">
              <dt>Subcategoría</dt><dd>{{ productForUIFixed.subcategory_name }}</dd>
            </template>
            <template v-if="productForUIFixed.warranty_months">
              <dt>Garantía</dt><dd>{{ productForUIFixed.warranty_months }} meses</dd>
            </template>
            <template v-if="productForUIFixed.sku || productForUIFixed.code">
              <dt>SKU</dt><dd class="pv-mono">{{ productForUIFixed.sku || productForUIFixed.code }}</dd>
            </template>
            <template v-if="productForUIFixed.barcode">
              <dt>Código de barras</dt><dd class="pv-mono">{{ productForUIFixed.barcode }}</dd>
            </template>
          </dl>
        </section>

        <!-- Description -->
        <section v-if="productForUIFixed.description" class="pv-card">
          <div class="pv-card-head">
            <div class="pv-card-title">
              <v-icon size="16" color="medium-emphasis">mdi-text-long</v-icon>
              Descripción
            </div>
          </div>
          <p class="pv-desc">{{ productForUIFixed.description }}</p>
        </section>

      </div>
    </div>

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

    <!-- Video player dialog -->
    <v-dialog :model-value="!!activeVideo" max-width="900" @update:model-value="(v) => { if (!v) closeVideo() }">
      <v-card rounded="xl" class="pv-video-dialog">
        <v-card-title class="d-flex align-center ga-2 pa-3">
          <v-icon :color="activeVideo?.isYoutube ? 'red' : 'primary'">
            {{ activeVideo?.isYoutube ? 'mdi-youtube' : 'mdi-play-circle' }}
          </v-icon>
          <span class="font-weight-bold text-truncate">{{ activeVideo?.title || 'Video' }}</span>
          <v-spacer />
          <v-btn
            v-if="activeVideo?.url"
            icon="mdi-open-in-new"
            variant="text"
            size="small"
            :href="activeVideo.url"
            target="_blank"
            title="Abrir en pestaña nueva"
          />
          <v-btn icon="mdi-close" variant="text" size="small" @click="closeVideo" />
        </v-card-title>
        <div class="pv-video-player">
          <iframe
            v-if="activeVideo?.isYoutube && activeVideo.embedUrl"
            :src="activeVideo.embedUrl + '&autoplay=1'"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          />
          <video
            v-else-if="activeVideo?.url"
            :src="activeVideo.url"
            controls
            autoplay
            playsinline
            preload="metadata"
          />
          <div v-else class="pv-video-unavailable">
            <v-icon size="48" color="medium-emphasis">mdi-alert-circle-outline</v-icon>
            <span>Video no disponible</span>
          </div>
        </div>
      </v-card>
    </v-dialog>

    <!-- Label / QR dialog -->
    <v-dialog v-model="printDlg" max-width="860" scrollable>
      <v-card rounded="xl" class="pv-label-dialog">
        <v-card-title class="d-flex align-center ga-2 pa-4">
          <v-icon color="primary">mdi-qrcode</v-icon>
          <span class="font-weight-black">Etiqueta / QR</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="printDlg = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <div class="pv-size-row mb-4">
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
              <div class="mt-4">
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
                />
              </div>
            </template>
          </ProductLabelPreview>
        </v-card-text>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useProductsStore } from "@/app/store/products.store";
import { useAuthStore } from "@/app/store/auth.store";

import http from "@/app/api/http";

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

function pickFirstNumber(obj, keys, def = 0) {
  for (const k of keys) {
    const v = obj?.[k];
    const n = toNum(v, NaN);
    if (Number.isFinite(n) && n > 0) return n;
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

const allImages = computed(() => {
  const imgs = ui.value?.images || [];
  return imgs.map(img => (typeof img === 'string' ? img : img?.url || '')).filter(Boolean);
});

const activeImageIndex = computed(() => {
  const idx = allImages.value.indexOf(heroImage.value);
  return idx >= 0 ? idx : 0;
});

function prevImage() {
  const arr = allImages.value;
  if (!arr.length) return;
  const i = activeImageIndex.value;
  heroImage.value = arr[(i - 1 + arr.length) % arr.length];
}

function nextImage() {
  const arr = allImages.value;
  if (!arr.length) return;
  const i = activeImageIndex.value;
  heroImage.value = arr[(i + 1) % arr.length];
}

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

/* ── Videos ── */
const vd = ref({ loading: false, error: "", rows: [] });
const activeVideo = ref(null);

function extractYoutubeId(url) {
  const u = String(url || "").trim();
  if (!u) return "";
  const patterns = [
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/i,
    /[?&]v=([a-zA-Z0-9_-]{6,})/i,
    /youtu\.be\/([a-zA-Z0-9_-]{6,})/i,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/i,
  ];
  for (const p of patterns) {
    const m = u.match(p);
    if (m?.[1]) return m[1];
  }
  return "";
}

function isYoutubeVideo(v) {
  if (!v) return false;
  if (String(v.provider || "").toLowerCase().includes("youtube")) return true;
  return !!extractYoutubeId(v.url);
}

function youtubeEmbedUrl(v) {
  const id = extractYoutubeId(v?.url);
  if (!id) return "";
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
}

function youtubeThumbUrl(v) {
  const id = extractYoutubeId(v?.url);
  if (!id) return "";
  return `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
}

function onThumbError(ev, v) {
  const id = extractYoutubeId(v?.url);
  if (!id || !ev?.target) return;
  const current = ev.target.src || "";
  if (current.includes("maxresdefault")) {
    ev.target.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  } else if (current.includes("hqdefault")) {
    ev.target.src = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
  }
}

function videoTypeLabel(v) {
  if (isYoutubeVideo(v)) return "YouTube";
  const p = String(v?.provider || "").toLowerCase();
  if (p === "minio" || v?.storage_key) return "Archivo";
  return "Video";
}

const videosList = computed(() => {
  const arr = Array.isArray(vd.value.rows) ? vd.value.rows : [];
  return arr.map((v) => ({
    id: v.id,
    title: v.title || videoTypeLabel(v),
    url: v.url,
    mime: v.mime || "",
    provider: String(v.provider || "").toLowerCase(),
    storage_key: v.storage_key || "",
    isYoutube: isYoutubeVideo(v),
    embedUrl: isYoutubeVideo(v) ? youtubeEmbedUrl(v) : "",
    thumbUrl: isYoutubeVideo(v) ? youtubeThumbUrl(v) : "",
    raw: v,
  }));
});

async function loadVideos() {
  const pid = Number(productId.value || 0);
  vd.value.rows = [];
  vd.value.error = "";
  if (!pid) return;

  vd.value.loading = true;
  try {
    const paths = [`/products/${pid}/videos`, `/admin/products/${pid}/videos`, `/public/products/${pid}/videos`];
    let ok = null;
    for (const p of paths) {
      try {
        const r = await http.get(p);
        const arr = r?.data?.data ?? r?.data?.rows ?? r?.data;
        if (Array.isArray(arr)) { ok = arr; break; }
      } catch (_) {}
    }
    vd.value.rows = ok || [];
  } catch (e) {
    vd.value.error = e?.friendlyMessage || e?.message || "No se pudo cargar videos";
  } finally {
    vd.value.loading = false;
  }
}

function openVideo(v) {
  activeVideo.value = v;
}
function closeVideo() {
  activeVideo.value = null;
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

  const price = pickFirstNumber(r, ["price_discount", "price_list", "price", "price_reseller"], 0);
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
    await Promise.all([refreshBranchesMatrix(), loadVideos()]);
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
  background: rgb(var(--v-theme-background));
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
.pv-breadcrumb {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}
.pv-bc-ic { opacity: 0.45; }
.pv-bc-root {
  color: rgba(var(--v-theme-on-surface), 0.85);
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pv-bc-sep { opacity: 0.4; flex-shrink: 0; }
.pv-bc-leaf {
  color: rgba(var(--v-theme-on-surface), 0.55);
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── SKELETON ── */
@keyframes pv-pulse { 0%, 100% { opacity: 0.4 } 50% { opacity: 0.9 } }
.pv-skel {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 24px;
  padding: 20px;
}
.pv-sk { border-radius: 14px; background: rgba(var(--v-theme-on-surface), 0.08); animation: pv-pulse 1.4s ease infinite; }
.pv-sk--gallery { height: 500px; }
.pv-sk-stack { display: flex; flex-direction: column; gap: 14px; }
.pv-sk--card { height: 140px; }

/* ── LAYOUT ── */
.pv-layout {
  display: grid;
  grid-template-columns: minmax(380px, 420px) minmax(0, 1fr);
  gap: 24px;
  padding: 20px;
  align-items: start;
}

/* ── GALLERY ── */
.pv-gallery {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pv-card--videos {
  margin-top: 6px;
  padding: 14px 16px;
}
.pv-gallery-main {
  position: relative;
  aspect-ratio: 1;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  display: grid;
  place-items: center;
}
.pv-gallery-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #fff;
}
.pv-gallery-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0.4;
  font-size: 12px;
  font-weight: 600;
}
.pv-gallery-count {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  letter-spacing: 0.03em;
  backdrop-filter: blur(4px);
}
.pv-gallery-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  border: none;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s;
}
.pv-gallery-main:hover .pv-gallery-nav { opacity: 1; }
.pv-gallery-nav:hover { background: rgba(0, 0, 0, 0.75); }
.pv-gallery-nav--prev { left: 10px; }
.pv-gallery-nav--next { right: 10px; }

.pv-gallery-thumbs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
  gap: 8px;
}
.pv-gallery-thumb {
  aspect-ratio: 1;
  padding: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid transparent;
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
  opacity: 0.8;
}
.pv-gallery-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.pv-gallery-thumb:hover { opacity: 1; transform: translateY(-1px); }
.pv-gallery-thumb--active {
  border-color: rgb(var(--v-theme-primary));
  opacity: 1;
}

/* ── CONTENT ── */
.pv-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.pv-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 14px;
  padding: 18px 20px;
}

.pv-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;
}
.pv-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.75;
}

/* Identity */
.pv-card--identity { padding: 20px; }
.pv-chips-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.pv-chip-status { font-weight: 700; }
.pv-name {
  font-size: 26px;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: -0.01em;
  margin: 0 0 8px;
  color: rgb(var(--v-theme-on-surface));
}
.pv-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.pv-meta-brand {
  font-size: 13px;
  font-weight: 800;
  color: rgba(var(--v-theme-on-surface), 0.95);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.pv-meta-sep { opacity: 0.35; }
.pv-meta-model {
  font-size: 13px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.65);
}

.pv-codes {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.pv-code-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  font-size: 12px;
}
.pv-code-ic { opacity: 0.5; }
.pv-code-k {
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 10px;
  opacity: 0.6;
}
.pv-code-v {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 700;
  font-size: 12.5px;
  color: rgb(var(--v-theme-on-surface));
}

/* Prices */
.pv-price-hero {
  padding: 8px 0 16px;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.7));
  margin-bottom: 14px;
}
.pv-price-main {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
.pv-price-cash-lbl {
  font-size: 11px;
  font-weight: 800;
  opacity: 0.55;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 2px;
}
.pv-price-cash-val {
  display: flex;
  align-items: flex-end;
  gap: 4px;
}
.pv-price-cur {
  font-size: 22px;
  font-weight: 900;
  opacity: 0.5;
  padding-bottom: 8px;
}
.pv-price-big {
  font-size: 44px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.02em;
  color: rgb(var(--v-theme-success));
}
.pv-price-delta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 800;
  color: rgb(var(--v-theme-success));
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(var(--v-theme-success), 0.12);
}
.pv-price-compare {
  margin-top: 8px;
  font-size: 13px;
  opacity: 0.65;
}
.pv-price-compare-k {
  font-weight: 700;
  margin-right: 6px;
}
.pv-price-compare-v {
  font-weight: 800;
  text-decoration: line-through;
  opacity: 0.7;
}

.pv-price-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 4px 20px;
}
.pv-pg-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 8px 0;
  border-bottom: 1px dashed rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.6));
}
.pv-pg-k {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.65;
}
.pv-pg-v {
  font-size: 14px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
}
.pv-pg-v--dim { opacity: 0.7; }
.pv-pg-v--ok { color: rgb(var(--v-theme-success)); }

/* Stock */
.pv-stock-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}
.pv-stock-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: border-color 0.15s, background 0.15s;
}
.pv-stock-card--ok {
  background: rgba(var(--v-theme-success), 0.05);
  border-color: rgba(var(--v-theme-success), 0.25);
}
.pv-stock-av {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 900;
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.75);
}
.pv-stock-av.ok {
  background: rgba(var(--v-theme-success), 0.18);
  color: rgb(var(--v-theme-success));
}
.pv-stock-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.pv-stock-name {
  font-size: 13px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pv-stock-qty {
  font-size: 13px;
  font-weight: 800;
}

.clr-ok   { color: rgb(var(--v-theme-success)); }
.clr-zero { opacity: 0.5; }

/* Details DL */
.pv-dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 20px;
  margin: 0;
}
.pv-dl dt {
  font-size: 11px;
  font-weight: 800;
  opacity: 0.55;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 0;
  align-self: center;
}
.pv-dl dd {
  margin: 0;
  padding: 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.5));
}
.pv-dl dt + dd:last-of-type,
.pv-dl dd:last-of-type { border-bottom: none; }
.pv-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  letter-spacing: 0.02em;
}

/* Description */
.pv-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(var(--v-theme-on-surface), 0.85);
  font-weight: 400;
  white-space: pre-line;
}

/* Generic */
.pv-centered {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
}
.pv-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 20px;
  opacity: 0.5;
  font-size: 13px;
  font-weight: 600;
}
.pv-empty--sm { padding: 20px; }

/* Videos */
.pv-video-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.pv-video-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  width: 100%;
}
.pv-video-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 14px;
  overflow: hidden;
  background: #0a0a0a center/cover no-repeat;
  box-shadow: 0 8px 24px -10px rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: border-color 0.15s, transform 0.15s;
}
.pv-video-thumb::before {
  content: '';
  position: absolute;
  inset: -8%;
  background-image: inherit;
  background-size: cover;
  background-position: center;
  filter: blur(32px) brightness(0.55) saturate(1.1);
  z-index: 0;
}
.pv-video-fg {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  transition: transform 0.2s;
}
.pv-video-card:hover .pv-video-thumb {
  border-color: rgba(var(--v-theme-primary), 0.45);
}
.pv-video-card:hover .pv-video-fg {
  transform: scale(1.02);
}
.pv-video-thumb-fallback {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #1e293b, #0f172a);
}
.pv-video-play {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 0.35) 100%);
  opacity: 1;
  transition: background 0.15s;
}
.pv-video-play::before {
  content: '';
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  border: 2px solid rgba(255, 255, 255, 0.9);
  position: absolute;
}
.pv-video-play .v-icon {
  position: relative;
  z-index: 1;
  margin-left: 3px;
}
.pv-video-card:hover .pv-video-thumb {
  border-color: rgba(var(--v-theme-primary), 0.4);
}
.pv-video-card:hover .pv-video-thumb img {
  transform: scale(1.04);
}
.pv-video-card:hover .pv-video-play {
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.65) 100%);
}
.pv-video-title {
  font-size: 13px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  padding: 0 2px;
}

.pv-video-dialog { overflow: hidden; }
.pv-video-player {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
}
.pv-video-player iframe,
.pv-video-player video {
  width: 100%;
  height: 100%;
  display: block;
  border: none;
}
.pv-video-unavailable {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  font-weight: 600;
}

/* Label dialog */
.pv-size-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pv-size-lbl {
  font-size: 12px;
  font-weight: 700;
  opacity: 0.6;
  white-space: nowrap;
}

/* HIDDEN */
.pv-hidden {
  position: absolute;
  left: -99999px;
  top: 0;
  width: 0;
  height: 0;
  overflow: hidden;
  visibility: hidden;
  pointer-events: none;
}
.pv-a4 {
  width: 210mm;
  min-height: 297mm;
  background: #fff;
}

/* ── RESPONSIVE ── */
@media (max-width: 1100px) {
  .pv-layout { grid-template-columns: minmax(320px, 360px) minmax(0, 1fr); gap: 18px; padding: 16px; }
  .pv-skel { grid-template-columns: 320px 1fr; }
}

@media (max-width: 860px) {
  .pv-layout {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 14px;
  }
  .pv-skel { grid-template-columns: 1fr; }
  .pv-gallery {
    position: static;
    top: auto;
  }
  .pv-gallery-main { max-width: 420px; margin: 0 auto; }
  .pv-gallery-thumbs { max-width: 420px; margin: 0 auto; }
  .pv-name { font-size: 22px; }
  .pv-price-big { font-size: 36px; }
}

@media (max-width: 480px) {
  .pv-bar { padding: 8px 12px; }
  .pv-breadcrumb { font-size: 12px; }
  .pv-card { padding: 14px; }
  .pv-card--identity { padding: 16px; }
  .pv-gallery-thumbs { grid-template-columns: repeat(auto-fill, minmax(52px, 1fr)); gap: 6px; }
}
</style>
