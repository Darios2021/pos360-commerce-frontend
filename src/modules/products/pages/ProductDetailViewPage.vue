<!-- src/modules/products/pages/ProductDetailViewPage.vue -->
<template>
  <div class="pd">
    <!-- ── Encabezado ───────────────────────────────────── -->
    <div class="pd-cab">
      <div class="pd-cab__txt">
        <router-link :to="{ name: 'products' }" class="pd-volver"><v-icon size="18">mdi-chevron-left</v-icon>Productos</router-link>
        <span v-if="rubroTexto" class="pd-rubro">{{ rubroTexto }}</span>
        <h1 class="pd-cab__nombre">{{ raw?.name || "Producto" }}</h1>
        <span v-if="raw" class="pd-cab__sub num">
          {{ lineaCodigos }}<template v-if="lineaCodigos"> · </template><a href="#" class="pd-link pd-link--chico" @click.prevent="printDlg = true">Etiqueta y QR</a>
        </span>
      </div>
      <div v-if="raw" class="pd-cab__der">
        <span class="pd-estado" :class="productForUIFixed.is_active !== false ? 'is-activo' : 'is-inactivo'"><i></i>{{ productForUIFixed.is_active !== false ? "Activo" : "Inactivo" }}</span>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-pencil-outline" class="pd-editar" :to="{ name: 'productEdit', params: { id: productId } }">Editar</v-btn>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

    <div v-if="loading && !raw" class="pd-grilla">
      <div class="pd-caja pd-esq" style="height: 420px" />
      <div class="pd-caja pd-esq" style="height: 420px" />
      <div class="pd-caja pd-esq" style="height: 420px" />
    </div>

    <div v-else-if="raw" class="pd-grilla">
      <!-- 1. Fotos y videos -->
      <section class="pd-col">
        <div class="pd-caja pd-foto">
          <img v-if="heroImage" :src="heroImage" :alt="raw.name" />
          <div v-else class="pd-foto__vacia"><v-icon size="64">mdi-image-outline</v-icon><span>Sin foto</span></div>
          <template v-if="allImages.length > 1">
            <button type="button" class="pd-foto__nav pd-foto__nav--ant" aria-label="Foto anterior" @click="prevImage"><v-icon size="22">mdi-chevron-left</v-icon></button>
            <button type="button" class="pd-foto__nav pd-foto__nav--sig" aria-label="Foto siguiente" @click="nextImage"><v-icon size="22">mdi-chevron-right</v-icon></button>
            <span class="pd-foto__n num">{{ activeImageIndex + 1 }} / {{ allImages.length }}</span>
          </template>
        </div>
        <div v-if="allImages.length > 1" class="pd-miniaturas">
          <button v-for="(img, i) in allImages" :key="i" type="button" class="pd-mini" :class="{ 'is-on': heroImage === img }" :aria-label="`Foto ${i + 1}`" @click="heroImage = img">
            <img :src="img" alt="" />
          </button>
        </div>

        <div v-if="videosList.length" class="pd-caja">
          <div class="pd-banda"><span>Videos</span><small class="num">{{ videosList.length }}</small></div>
          <div class="pd-videos">
            <button v-for="v in videosList" :key="v.id" type="button" class="pd-video" @click="openVideo(v)">
              <span class="pd-video__cuadro">
                <img v-if="v.isYoutube && v.thumbUrl" :src="v.thumbUrl" :alt="v.title" @error="(e) => onThumbError(e, v.raw)" />
                <video v-else-if="v.url" :src="v.url + '#t=0.5'" preload="metadata" muted playsinline />
                <v-icon class="pd-video__play" size="30" color="white">mdi-play</v-icon>
              </span>
              <span v-if="v.title" class="pd-s clamp1">{{ v.title }}</span>
            </button>
          </div>
        </div>
      </section>

      <!-- 2. Precios, kit y ficha -->
      <section class="pd-col">
        <div class="pd-caja">
          <div class="pd-banda"><span>Precios</span><small v-if="Number(raw.tax_rate) > 0" class="num">IVA {{ Number(raw.tax_rate) }} % incluido</small></div>
          <!-- Los tres precios de venta, cada uno en su tarjeta -->
          <div class="pd-tres">
            <div class="pd-pr">
              <span class="pd-pr__lab">Precio contado</span>
              <span class="pd-pr__val num">$ {{ fmtPrice(productForUIFixed.price_discount) }}</span>
              <span class="pd-s">contado y Mercado Pago</span>
            </div>
            <div class="pd-pr pd-pr--lista">
              <span class="pd-pr__lab">Precio lista</span>
              <span class="pd-pr__val num">$ {{ fmtPrice(productForUIFixed.price_list) }}</span>
              <span class="pd-s">crédito<template v-if="recargoLista"> · {{ recargoLista }} % más</template></span>
            </div>
            <div class="pd-pr">
              <span class="pd-pr__lab">Precio revendedor</span>
              <span class="pd-pr__val num" :class="{ 'pd-tenue': !(Number(raw.price_reseller) > 0) }">{{ Number(raw.price_reseller) > 0 ? `$ ${fmtPrice(raw.price_reseller)}` : "sin cargar" }}</span>
              <span class="pd-s">clientes mayoristas</span>
            </div>
          </div>
          <dl class="pd-datos num">
            <template v-if="Number(raw.price_installer) > 0"><dt>Instalador</dt><dd>$ {{ fmtPrice(raw.price_installer) }}</dd></template>
            <dt>Costo</dt>
            <dd>
              <template v-if="costo > 0 && raw.cost_currency === 'USD'">US$ {{ Number(costo).toLocaleString("es-AR") }}<span v-if="Number(raw.fx_rate) > 0" class="pd-suave"> · dólar $ {{ fmtPrice(raw.fx_rate) }}</span></template>
              <template v-else-if="costo > 0">$ {{ fmtPrice(costo) }}</template>
              <span v-else class="pd-tenue">sin cargar</span>
            </dd>
            <dt>Margen</dt>
            <dd><template v-if="costoPesos > 0 && Number(productForUIFixed.price_discount) > 0">{{ Math.round(((Number(productForUIFixed.price_discount) - costoPesos) / Number(productForUIFixed.price_discount)) * 100) }} % <span class="pd-suave">en contado</span></template><span v-else class="pd-tenue">sin costo no se calcula</span></dd>
          </dl>
        </div>

        <div v-if="productForUIFixed.is_kit" class="pd-caja">
          <div class="pd-banda"><span>Qué incluye el kit</span><small class="num">{{ kitItemsList.length }} {{ kitItemsList.length === 1 ? "producto" : "productos" }}</small></div>
          <div v-if="!kitItemsList.length" class="pd-vacio">El kit todavía no tiene componentes</div>
          <div v-else class="pd-filas">
            <router-link v-for="it in kitItemsList" :key="it.component_id" :to="{ name: 'productView', params: { id: it.component_id } }" class="pd-kit">
              <span class="pd-kit__foto"><img v-if="it.image_url" :src="it.image_url" alt="" /><v-icon v-else size="20">mdi-package-variant-closed</v-icon></span>
              <span class="pd-kit__txt"><span class="pd-b clamp1">{{ it.name }}</span><span class="pd-s num">× {{ it.qty }}<template v-if="it.sku"> · {{ it.sku }}</template></span></span>
              <span v-if="it.price_list" class="pd-b num">$ {{ fmtPrice(it.price_list) }}</span>
            </router-link>
            <div v-if="kitSavingsView && kitSavingsView.savings > 0" class="pd-kit__ahorro num">
              Suelto $ {{ fmtPrice(kitSavingsView.componentsTotal) }} · kit $ {{ fmtPrice(kitSavingsView.kitPrice) }} · ahorro $ {{ fmtPrice(kitSavingsView.savings) }} ({{ kitSavingsView.savingsPct }} %)
            </div>
          </div>
        </div>

        <div class="pd-caja">
          <div class="pd-banda"><span>Ficha</span></div>
          <dl class="pd-datos">
            <dt>Marca</dt><dd><template v-if="raw.brand">{{ raw.brand }}</template><span v-else class="pd-tenue">sin marca</span></dd>
            <template v-if="raw.model"><dt>Modelo</dt><dd>{{ raw.model }}</dd></template>
            <dt>Garantía</dt><dd><template v-if="Number(raw.warranty_months) > 0">{{ raw.warranty_months }} {{ Number(raw.warranty_months) === 1 ? "mes" : "meses" }}</template><span v-else class="pd-tenue">sin garantía cargada</span></dd>
            <template v-if="raw.barcode"><dt>Código de barras</dt><dd class="num">{{ raw.barcode }}</dd></template>
            <template v-if="productForUIFixed.track_stock === false"><dt>Stock</dt><dd>sin control de stock</dd></template>
            <template v-if="raw.unit && raw.unit !== 'unidad'"><dt>Unidad</dt><dd>{{ raw.unit }}</dd></template>
            <template v-if="nombreProveedor"><dt>Proveedor</dt><dd>{{ nombreProveedor }}<template v-if="raw.supplier_code"> · {{ raw.supplier_code }}</template></dd></template>
            <template v-else-if="raw.supplier_code"><dt>Código del proveedor</dt><dd class="num">{{ raw.supplier_code }}</dd></template>
            <template v-if="raw.purchase_date"><dt>Última compra</dt><dd class="num">{{ fechaCorta(raw.purchase_date) }}</dd></template>
            <template v-if="raw.location"><dt>Ubicación</dt><dd>{{ raw.location }}</dd></template>
            <template v-if="raw.min_stock != null"><dt>Stock mínimo</dt><dd class="num">{{ fmtPrice(raw.min_stock) }}</dd></template>
            <template v-if="altaTexto"><dt>Alta</dt><dd class="num">{{ altaTexto }}</dd></template>
          </dl>
          <p v-if="raw.description" class="pd-desc">{{ raw.description }}</p>
          <p v-else class="pd-desc pd-tenue">Sin descripción.</p>
        </div>
      </section>

      <!-- 3. Stock y ventas -->
      <section class="pd-col">
        <div class="pd-caja">
          <div class="pd-banda"><span>Stock por sucursal</span><small class="num">{{ fmtPrice(totalStockAllBranches) || 0 }} {{ totalStockAllBranches === 1 ? "unidad" : "unidades" }}</small></div>
          <v-alert v-if="mx.error" type="error" variant="tonal" density="compact" class="ma-3">{{ mx.error }}</v-alert>
          <div v-if="mx.loading" class="pd-vacio"><v-progress-circular size="22" indeterminate color="primary" /></div>
          <div v-else-if="!branchesStock.length" class="pd-vacio">Sin datos de sucursales</div>
          <div v-else class="pd-filas">
            <div v-for="r in stockOrdenado" :key="r.key" class="pd-stock">
              <div class="pd-stock__linea">
                <i :class="nivelStock(r.stock_qty)"></i>
                <span class="pd-b">{{ r.branch_name }}</span>
                <span class="pd-stock__n num" :class="{ 'pd-tenue': r.stock_qty <= 0 }">{{ r.stock_qty > 0 ? `${fmtPrice(r.stock_qty)} ${r.stock_qty === 1 ? "unidad" : "unidades"}` : "sin stock" }}</span>
              </div>
              <span class="pd-pista"><span :class="nivelStock(r.stock_qty)" :style="{ width: anchoStock(r.stock_qty) }"></span></span>
            </div>
          </div>
        </div>

        <div class="pd-caja">
          <div class="pd-banda"><span>Ventas</span><small>últimos 12 meses</small></div>
          <div v-if="ventas.cargando" class="pd-vacio"><v-progress-circular size="22" indeterminate color="primary" /></div>
          <div v-else-if="!ventas.unidades" class="pd-vacio">Todavía no se vendió</div>
          <template v-else>
            <div class="pd-ventas__cifras num">
              <span><b>{{ fmtPrice(ventas.unidades) }}</b> vendidos</span>
              <span><b>$ {{ fmtPrice(ventas.total) }}</b> facturado</span>
            </div>
            <div class="pd-filas">
              <router-link v-for="v in ventas.ultimas" :key="v.id" :to="{ name: 'posSaleDetail', params: { id: v.id } }" class="pd-venta">
                <span class="pd-venta__n num">#{{ v.id }}</span>
                <span class="pd-venta__txt"><span class="pd-b num">{{ v.fecha }}</span><span class="pd-s clamp1">{{ v.detalle }}</span></span>
                <span class="pd-b num">$ {{ fmtPrice(v.precio) }}</span>
              </router-link>
            </div>
            <router-link :to="{ name: 'posSales', query: { producto: String(productId), nombre: raw.name } }" class="pd-ver-todas">
              Ver todas sus ventas<v-icon size="20">mdi-chevron-right</v-icon>
            </router-link>
          </template>
        </div>
      </section>
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
    is_kit: Number(r.is_kit ?? base.is_kit ?? 0) === 1,
    branches_matrix: branchesStock.value,
    stock_total,
    stock_in_branch,
    branch_name,
    stock: stock_total,
    stock_qty: stock_total,
    qty: stock_total,
  };
});

/* ── Kit items ── */
const kitItemsList = computed(() => {
  const r = raw.value || {};
  const arr = Array.isArray(r.kitItems) ? r.kitItems : Array.isArray(r.kit_items) ? r.kit_items : [];
  return arr.map((ki) => {
    const c = ki?.component || ki?.product || ki;
    const cid = Number(ki?.component_id ?? c?.id ?? ki?.id ?? 0);
    const firstImg = Array.isArray(c?.images)
      ? (c.images[0]?.url || c.images[0]?.image_url || null)
      : (c?.image_url || null);
    return {
      component_id: cid,
      name: String(c?.name || "—"),
      sku: String(c?.sku || ""),
      qty: Number(ki?.qty || 1),
      price_list: Number(c?.price_list || c?.price || 0),
      image_url: firstImg,
    };
  }).filter((x) => x.component_id > 0);
});

const kitSavingsView = computed(() => {
  const items = kitItemsList.value;
  if (!items.length) return null;
  const componentsTotal = items.reduce((acc, it) => acc + Number(it.price_list || 0) * Number(it.qty || 1), 0);
  const r = raw.value || {};
  const kitPrice = Number(r.price_discount || r.price_list || r.price || 0);
  if (!componentsTotal && !kitPrice) return null;
  const savings = componentsTotal - kitPrice;
  const savingsPct = componentsTotal > 0 ? Math.round((savings / componentsTotal) * 100) : 0;
  return { componentsTotal, kitPrice, savings, savingsPct };
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


/* ── Rediseño: textos, stock ordenado y ventas del producto ── */
const rubroTexto = computed(() => [productForUIFixed.value.category_name, productForUIFixed.value.subcategory_name].filter(Boolean).join(" › "));
const lineaCodigos = computed(() => {
  const r = raw.value || {};
  const sku = r.sku || "";
  const code = r.code && r.code !== sku ? r.code : "";
  return [r.brand, r.model, sku ? `SKU ${sku}` : "", code ? `Código ${code}` : ""].filter(Boolean).join(" · ");
});
const costo = computed(() => Number(raw.value?.cost || 0));
// El margen se calcula en pesos: un costo en dólares se pasa con la cotización guardada
const costoPesos = computed(() => {
  if (raw.value?.cost_currency !== "USD") return costo.value;
  const r = Number(raw.value?.fx_rate || 0);
  return r > 0 ? costo.value * r : 0;
});
const recargoLista = computed(() => {
  const l = Number(productForUIFixed.value.price_list || 0), c = Number(productForUIFixed.value.price_discount || 0);
  return l > c && c > 0 ? Math.round(((l - c) / l) * 100) : 0;
});
const altaTexto = computed(() => {
  const r = raw.value || {};
  if (!r.created_at) return "";
  const d = new Date(r.created_at);
  const fecha = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  const u = r.createdByUser || r.created_by_user || {};
  const quien = [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.username || "";
  return quien ? `${fecha} · ${quien}` : fecha;
});
const proveedoresMapa = ref({});
async function cargarProveedor() {
  const sid = Number(raw.value?.supplier_id || 0);
  if (!sid || proveedoresMapa.value[sid]) return;
  try {
    const { data } = await http.get("/products/suppliers");
    const mapa = {};
    for (const p of Array.isArray(data?.data) ? data.data : []) mapa[p.id] = p.name;
    proveedoresMapa.value = mapa;
  } catch { /* sin nombre se muestra solo el código */ }
}
const nombreProveedor = computed(() => proveedoresMapa.value[Number(raw.value?.supplier_id || 0)] || "");
watch(() => raw.value?.supplier_id, cargarProveedor);
function fechaCorta(v) {
  const [y, m, d] = String(v || "").slice(0, 10).split("-");
  return d ? `${d}/${m}/${y}` : "";
}
const stockOrdenado = computed(() => [...branchesStock.value].sort((a, b) => b.stock_qty - a.stock_qty));
function nivelStock(n) { return n <= 0 ? "is-sin" : n <= 3 ? "is-bajo" : "is-bien"; }
function anchoStock(n) {
  const max = Math.max(1, ...branchesStock.value.map((r) => r.stock_qty));
  return n > 0 ? `${Math.max(4, (n / max) * 100)}%` : "0%";
}

const ventas = ref({ cargando: false, unidades: 0, total: 0, ultimas: [] });
async function cargarVentas() {
  const pid = Number(productId.value || 0);
  if (!pid) return;
  ventas.value = { cargando: true, unidades: 0, total: 0, ultimas: [] };
  try {
    const desde = new Date(); desde.setFullYear(desde.getFullYear() - 1);
    const base = { status: "PAID", product_id: pid, from: desde.toISOString() };
    const [lista, todas] = await Promise.all([
      http.get("/pos/sales", { params: { ...base, limit: 4, page: 1 } }),
      http.get("/pos/sales", { params: { ...base, limit: 200, page: 1 } }),
    ]);
    const filas = (r) => (Array.isArray(r?.data?.data) ? r.data.data : []);
    const deEste = (s) => (Array.isArray(s.items) ? s.items : []).filter((it) => Number(it.product_id) === pid);
    let unidades = 0, total = 0;
    for (const s of filas(todas)) for (const it of deEste(s)) { unidades += Number(it.quantity || 0); total += Number(it.line_total || 0); }
    const ultimas = filas(lista).map((s) => {
      const d = new Date(s.sold_at);
      const its = deEste(s);
      const q = its.reduce((a, it) => a + Number(it.quantity || 0), 0);
      const cajero = [s.user?.first_name, s.user?.last_name].filter(Boolean).join(" ").trim() || s.user?.username || "";
      return {
        id: s.id,
        fecha: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} h`,
        detalle: [`${q} ${q === 1 ? "unidad" : "unidades"}`, cajero, s.branch?.name].filter(Boolean).join(" · "),
        precio: its[0] ? Number(its[0].unit_price || 0) : Number(s.total || 0),
      };
    });
    ventas.value = { cargando: false, unidades, total, ultimas };
  } catch {
    ventas.value = { cargando: false, unidades: 0, total: 0, ultimas: [] };
  }
}
watch(productId, cargarVentas);
onMounted(cargarVentas);

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
.pv-cat-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex-wrap: wrap;
}
.pv-cat-chip {
  font-size: 11.5px !important;
  font-weight: 400 !important;
  letter-spacing: 0.01em;
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
  font-weight: 400;
}
.pv-gallery-count {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 11px;
  font-weight: 400;
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
  font-weight: 500;
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
.pv-chip-status { font-weight: 400; }
.pv-name {
  font-size: 26px;
  font-weight: 500;
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
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.95);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.pv-meta-sep { opacity: 0.35; }
.pv-meta-model {
  font-size: 13px;
  font-weight: 400;
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
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 10px;
  opacity: 0.6;
}
.pv-code-v {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 400;
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
  font-weight: 500;
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
  font-weight: 500;
  opacity: 0.5;
  padding-bottom: 8px;
}
.pv-price-big {
  font-size: 44px;
  font-weight: 500;
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
  font-weight: 500;
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
  font-weight: 400;
  margin-right: 6px;
}
.pv-price-compare-v {
  font-weight: 500;
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
  font-weight: 400;
  opacity: 0.65;
}
.pv-pg-v {
  font-size: 14px;
  font-weight: 500;
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
  font-weight: 500;
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
  font-weight: 400;
  color: rgb(var(--v-theme-on-surface));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pv-stock-qty {
  font-size: 13px;
  font-weight: 500;
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
  font-weight: 500;
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
  font-weight: 400;
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
  font-weight: 400;
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
  font-weight: 400;
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
  font-weight: 400;
}

/* Label dialog */
.pv-size-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pv-size-lbl {
  font-size: 12px;
  font-weight: 400;
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
  .pv-cat-chip { font-size: 11px !important; }
  .pv-card { padding: 14px; }
  .pv-card--identity { padding: 16px; }
  .pv-gallery-thumbs { grid-template-columns: repeat(auto-fill, minmax(52px, 1fr)); gap: 6px; }
}

/* ── MOBILE app-like ────────────────────────────────────────── */
@media (max-width: 600px) {
  .pv-layout { padding: 8px; gap: 10px; }
  /* Galería full-width sin máximo, ratio cuadrado */
  .pv-gallery-main {
    max-width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 14px;
  }
  .pv-gallery-thumbs { max-width: 100%; }
  /* Cards más compactas */
  .pv-card {
    padding: 12px;
    border-radius: 12px;
  }
  .pv-card--identity { padding: 14px; }
  /* Tipografía mobile */
  .pv-name { font-size: 19px !important; line-height: 1.25 !important; }
  .pv-price-big { font-size: 28px !important; }
  .pv-card-title { font-size: 13px; }
  /* Las flechas de la galería en mobile siempre visibles (sin hover) */
  .pv-gallery-nav { opacity: 1 !important; }
}

/* ── KIT / COMBO ── */
.pv-card--kit {
  border-color: rgba(124, 58, 237, 0.30) !important;
  background: linear-gradient(180deg,
    rgba(124, 58, 237, 0.04),
    rgba(124, 58, 237, 0.01)
  ) !important;
}
.pv-kit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}
.pv-kit-card {
  display: flex; flex-direction: column;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 10px;
  background: rgba(var(--v-theme-surface), 0.6);
  cursor: pointer;
  transition: transform 0.12s, border-color 0.12s, box-shadow 0.12s;
  overflow: hidden;
}
.pv-kit-card:hover {
  transform: translateY(-2px);
  border-color: rgba(124, 58, 237, 0.4);
  box-shadow: 0 6px 18px rgba(124, 58, 237, 0.12);
}
.pv-kit-img {
  position: relative;
  aspect-ratio: 1 / 1;
  background: rgba(var(--v-theme-on-surface), 0.04);
  display: flex; align-items: center; justify-content: center;
}
.pv-kit-img img {
  width: 100%; height: 100%;
  object-fit: cover;
}
.pv-kit-qty {
  position: absolute; top: 6px; right: 6px;
  background: rgba(124, 58, 237, 0.95);
  color: #fff;
  font-size: 11px; font-weight: 600;
  padding: 2px 7px; border-radius: 999px;
  box-shadow: 0 2px 6px rgba(124, 58, 237, 0.4);
}
.pv-kit-info { padding: 8px 10px 10px; }
.pv-kit-name {
  font-size: 12.5px; font-weight: 500; line-height: 1.25;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 30px;
}
.pv-kit-meta {
  margin-top: 4px;
  font-size: 10.5px; opacity: 0.65;
  display: flex; align-items: center; justify-content: space-between; gap: 4px;
}
.pv-kit-price { font-weight: 500; opacity: 0.85; }

.pv-kit-savings-block {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(124, 58, 237, 0.05);
  border: 1px solid rgba(124, 58, 237, 0.18);
  font-size: 12.5px;
}
.pv-kit-savings-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 3px 0;
}
.pv-kit-savings-final {
  display: flex; align-items: center; gap: 4px;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px dashed rgba(124, 58, 237, 0.25);
  font-size: 13px;
}
</style>

<style>
/* Ficha de producto (rediseño). Sin scoped: todo cuelga de .pd. */
.pos-container:has(.pd) { max-width: none !important; padding: 0 !important; margin: 0 !important; }
.pd {
  --pd-fondo: #d6e6f3; --pd-caja: #ffffff; --pd-borde: #d3dde7; --pd-linea: #eef2f6; --pd-texto: #0f172a;
  --pd-suave: #5a6678; --pd-tenue: #94a3b8; --pd-acento: #0f6fae; --pd-banda: #0f6fae; --pd-rubro: #3f8fc6;
  --pd-hover: #f3f8fc; --pd-pista: rgba(15, 23, 42, 0.06);
  padding: 20px 28px 40px; min-height: calc(100vh - 56px); box-sizing: border-box; background: var(--pd-fondo); color: var(--pd-texto);
  display: flex; flex-direction: column; gap: 16px;
}
.v-theme--dark .pd {
  --pd-fondo: #0b0f14; --pd-caja: #151c25; --pd-borde: #253141; --pd-linea: #222c39; --pd-texto: #e5edf5;
  --pd-suave: #9aa8b8; --pd-tenue: #64748b; --pd-acento: #5aaee0; --pd-banda: #0f5f96; --pd-rubro: #6fb3e0;
  --pd-hover: #1a2430; --pd-pista: rgba(255, 255, 255, 0.07);
}
.pd > * { max-width: 1440px; width: 100%; margin-left: auto; margin-right: auto; box-sizing: border-box; }
.pd .num { font-variant-numeric: tabular-nums; }
.pd .clamp1 { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pd-s { font-size: 13px; color: var(--pd-suave); }
.pd-b { font-weight: 700; }
.pd-suave { font-weight: 600; color: var(--pd-suave); }
.pd-tenue { color: var(--pd-tenue); font-weight: 600; }
.pd-link { color: var(--pd-acento); font-weight: 800; text-decoration: none; }
.pd-link:hover { text-decoration: underline; }
.pd-link--chico { font-size: 14px; }

.pd-cab { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.pd-cab__txt { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.pd-volver { display: inline-flex; align-items: center; font-size: 14px; font-weight: 700; color: var(--pd-acento); text-decoration: none; margin-left: -4px; }
.pd-volver:hover { text-decoration: underline; }
.pd-rubro { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--pd-rubro); }
.pd-cab__nombre { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.01em; line-height: 1.15; }
.pd-cab__sub { font-size: 14px; font-weight: 600; color: var(--pd-suave); }
.pd-cab__der { display: flex; align-items: center; gap: 14px; }
.pd-estado { height: 38px; display: inline-flex; align-items: center; gap: 8px; padding: 0 14px; border-radius: 10px; background: var(--pd-caja); border: 1px solid var(--pd-borde); font-size: 15px; font-weight: 800; }
.pd-estado i { width: 10px; height: 10px; border-radius: 9999px; display: block; }
.pd-estado.is-activo { color: #1f7a5f; } .pd-estado.is-activo i { background: #2E9E7B; }
.pd-estado.is-inactivo { color: var(--pd-suave); } .pd-estado.is-inactivo i { background: #C3C9D6; }
.v-theme--dark .pd-estado.is-activo { color: #5fc9a6; }
.pd-editar { height: 42px !important; border-radius: 10px !important; font-weight: 800 !important; text-transform: none !important; letter-spacing: 0 !important; }

.pd-grilla { display: grid; grid-template-columns: minmax(320px, 420px) minmax(340px, 1fr) minmax(320px, 360px); gap: 18px; align-items: start; }
.pd-col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.pd-caja { border-radius: 12px; overflow: hidden; background: var(--pd-caja); border: 1px solid var(--pd-borde); }
.pd-esq { background: linear-gradient(90deg, var(--pd-caja), var(--pd-hover), var(--pd-caja)); }
.pd-banda { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 16px; background: var(--pd-banda); color: #ffffff; font-size: 15px; font-weight: 800; }
.pd-banda small { font-size: 13px; font-weight: 600; color: rgba(255, 255, 255, 0.85); }
.pd-vacio { padding: 26px 16px; text-align: center; font-size: 15px; font-weight: 600; color: var(--pd-suave); }

.pd-foto { position: relative; height: 420px; display: flex; align-items: center; justify-content: center; background: #ffffff; }
.pd-foto img { width: 100%; height: 100%; object-fit: contain; padding: 20px; box-sizing: border-box; }
.pd-foto__vacia { display: flex; flex-direction: column; align-items: center; gap: 6px; color: #94a3b8; font-weight: 700; }
.pd-foto__nav { position: absolute; top: 50%; transform: translateY(-50%); width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 10px; border: 1px solid #d3dde7; background: rgba(255, 255, 255, 0.92); color: #0f172a; cursor: pointer; }
.pd-foto__nav--ant { left: 10px; } .pd-foto__nav--sig { right: 10px; }
.pd-foto__n { position: absolute; bottom: 10px; right: 10px; height: 24px; padding: 0 8px; border-radius: 6px; background: rgba(15, 23, 42, 0.7); color: #ffffff; font-size: 12px; font-weight: 700; display: flex; align-items: center; }
.pd-miniaturas { display: flex; gap: 8px; flex-wrap: wrap; }
.pd-mini { width: 72px; height: 72px; padding: 4px; border-radius: 10px; border: 1px solid var(--pd-borde); background: #ffffff; cursor: pointer; box-sizing: border-box; }
.pd-mini.is-on { border: 2px solid #0f6fae; }
.pd-mini img { width: 100%; height: 100%; object-fit: contain; }
.pd-videos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 12px; }
.pd-video { display: flex; flex-direction: column; gap: 4px; border: 0; padding: 0; background: transparent; color: var(--pd-texto); cursor: pointer; text-align: left; font-family: inherit; }
.pd-video__cuadro { position: relative; aspect-ratio: 16 / 9; border-radius: 8px; overflow: hidden; background: #0f172a; display: block; }
.pd-video__cuadro img, .pd-video__cuadro video { width: 100%; height: 100%; object-fit: cover; }
.pd-video__play { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }

.pd-precio { display: flex; flex-direction: column; gap: 2px; padding: 16px 16px 4px; }
.pd-tres { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; padding: 14px 14px 4px; }
.pd-pr { display: flex; flex-direction: column; gap: 2px; padding: 12px 14px; border-radius: 12px; background: #f3f8fc; border: 1px solid #d3dde7; }
.pd-pr--lista { background: #eef7fd; border: 2px solid #0f6fae; }
.pd-pr__lab { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: #0a466e; }
.pd-pr__val { font-size: 34px; font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; }
.v-theme--dark .pd-pr { background: #1a2430; border-color: #253141; }
.v-theme--dark .pd-pr--lista { background: #12324b; border-color: #5aaee0; }
.v-theme--dark .pd-pr__lab { color: #9cc9ea; }
.pd-precio__grande { font-size: 40px; font-weight: 800; line-height: 1; }
.pd-datos { display: grid; grid-template-columns: max-content 1fr; gap: 10px 18px; margin: 0; padding: 14px 16px; }
.pd-datos dt { font-size: 14px; font-weight: 600; color: var(--pd-suave); }
.pd-datos dd { margin: 0; font-size: 15px; font-weight: 700; text-align: right; overflow-wrap: break-word; }
.pd-desc { margin: 0; padding: 0 16px 16px; font-size: 14px; line-height: 1.55; white-space: pre-line; }

.pd-filas { display: flex; flex-direction: column; padding: 2px 16px 8px; }
.pd-kit { display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--pd-linea); color: var(--pd-texto); text-decoration: none; }
.pd-kit__foto { width: 40px; height: 40px; flex-shrink: 0; border-radius: 8px; border: 1px solid var(--pd-linea); background: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; color: #94a3b8; }
.pd-kit__foto img { width: 100%; height: 100%; object-fit: contain; }
.pd-kit__txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.pd-kit__ahorro { padding: 10px 0 4px; font-size: 13px; font-weight: 700; color: #1f7a5f; }

.pd-stock { display: flex; flex-direction: column; gap: 6px; padding: 10px 0; border-bottom: 1px solid var(--pd-linea); }
.pd-stock:last-child { border-bottom: 0; }
.pd-stock__linea { display: flex; align-items: center; gap: 10px; font-size: 15px; }
.pd-stock__linea > i { width: 8px; height: 8px; border-radius: 9999px; display: block; flex-shrink: 0; }
.pd-stock__n { margin-left: auto; font-weight: 800; }
.pd-pista { display: block; height: 8px; border-radius: 9999px; background: var(--pd-pista); }
.pd-pista > span { display: block; height: 8px; border-radius: 9999px; }
.pd .is-bien { background: #2E9E7B; } .pd .is-bajo { background: #8cc0e3; } .pd .is-sin { background: #C3C9D6; }

.pd-ventas__cifras { display: flex; gap: 22px; padding: 14px 16px 6px; font-size: 14px; font-weight: 700; color: var(--pd-suave); }
.pd-ventas__cifras b { font-size: 22px; color: var(--pd-texto); }
.pd-venta { display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--pd-linea); color: var(--pd-texto); text-decoration: none; }
.pd-venta:hover .pd-venta__n { text-decoration: underline; }
.pd-venta__n { width: 52px; flex-shrink: 0; font-size: 14px; font-weight: 800; color: var(--pd-acento); }
.pd-venta__txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.pd-ver-todas { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-top: 1px solid var(--pd-linea); font-size: 15px; font-weight: 800; color: var(--pd-acento); text-decoration: none; }
.pd-ver-todas:hover { background: var(--pd-hover); }

@media (max-width: 1560px) {
  .pd-grilla { grid-template-columns: minmax(300px, 400px) minmax(0, 1fr); }
  .pd-grilla > .pd-col:last-child { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; }
}
@media (max-width: 900px) {
  .pd { padding: 14px 12px 96px; }
  .pd-grilla, .pd-grilla > .pd-col:last-child { grid-template-columns: minmax(0, 1fr); }
  .pd-foto { height: 300px; }
  .pd-cab__nombre { font-size: 22px; }
  .pd-cab__der { width: 100%; justify-content: space-between; }
}
</style>
