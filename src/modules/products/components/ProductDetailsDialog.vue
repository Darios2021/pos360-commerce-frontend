<!-- src/modules/products/components/ProductDetailsDialog.vue -->
<template>
  <v-dialog v-model="openLocal" max-width="1120">
    <v-card rounded="xl" class="pd-root">
      <!-- HEADER -->
      <div class="pd-header">
        <div class="pd-title">
          <div class="text-h6 font-weight-bold">Detalle producto</div>
          <div class="text-caption text-medium-emphasis">ID #{{ productId }}</div>
        </div>

        <div class="pd-actions">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-pencil-outline"
            @click="onEdit"
            :disabled="!item?.id"
          >
            Editar
          </v-btn>

          <v-btn
            v-if="isAdmin"
            color="red"
            variant="tonal"
            prepend-icon="mdi-delete-outline"
            @click="deleteOpen = true"
            :disabled="!item?.id"
          >
            Eliminar
          </v-btn>

          <v-btn icon="mdi-close" variant="text" @click="close" />
        </div>
      </div>

      <v-divider />

      <v-card-text class="pd-body">
        <v-alert v-if="products.error" type="error" variant="tonal" class="mb-3">
          {{ products.error }}
        </v-alert>

        <v-skeleton-loader v-if="loading" type="article" />

        <template v-else>
          <!-- SUMMARY -->
          <div class="pd-summary">
            <div>
              <div class="text-h5 font-weight-bold">{{ item?.name || "—" }}</div>
              <div class="text-caption text-medium-emphasis">
                SKU: {{ item?.sku || "—" }} · Código: {{ item?.code || "—" }}
              </div>

              <!-- ✅ Stock resumen -->
              <div class="text-caption text-medium-emphasis mt-1">
                <span class="font-weight-bold">Stock total:</span>
                <span class="ml-1">{{ totalStockLabel }}</span>
              </div>
            </div>

            <div class="d-flex ga-2 align-center flex-wrap justify-end">
              <v-chip size="small" variant="tonal" :color="item?.is_active ? 'primary' : 'red'">
                {{ item?.is_active ? "Activo" : "Inactivo" }}
              </v-chip>

              <v-chip v-if="hasDiscount" size="small" variant="tonal" color="green" class="font-weight-bold">
                -{{ discountPercent }}%
              </v-chip>
            </div>
          </div>

          <v-row dense>
            <!-- LEFT -->
            <v-col cols="12" md="5">
              <v-card rounded="xl" variant="flat" class="pd-card">
                <div class="pd-card-title">
                  <v-icon size="18">mdi-text-box-outline</v-icon>
                  <span>Datos</span>
                </div>

                <div class="pd-kv">
                  <div class="pd-kv-row">
                    <div class="pd-k">Rubro</div>
                    <div class="pd-v">{{ rubro || "—" }}</div>
                  </div>
                  <div class="pd-kv-row">
                    <div class="pd-k">Subrubro</div>
                    <div class="pd-v">{{ subrubro || "—" }}</div>
                  </div>
                  <div class="pd-kv-row">
                    <div class="pd-k">Marca</div>
                    <div class="pd-v">{{ item?.brand || "—" }}</div>
                  </div>
                  <div class="pd-kv-row">
                    <div class="pd-k">Modelo</div>
                    <div class="pd-v">{{ item?.model || "—" }}</div>
                  </div>
                </div>

                <v-divider class="my-3" />

                <div class="d-flex align-center justify-space-between">
                  <div class="pd-card-title mb-0">
                    <v-icon size="18">mdi-cash</v-icon>
                    <span>Precios</span>
                  </div>

                  <v-chip
                    v-if="hasDiscount"
                    size="small"
                    variant="tonal"
                    color="green"
                    class="font-weight-bold"
                  >
                    Ahorrás {{ money(discountAmount) }}
                  </v-chip>
                </div>

                <v-divider class="my-3" />

                <div class="pd-prices">
                  <div class="pd-price">
                    <div class="pd-price-k">Lista</div>
                    <div class="pd-price-v">
                      <span :class="hasDiscount ? 'pd-strike' : ''">{{ money(priceList) }}</span>
                    </div>
                  </div>

                  <div class="pd-price">
                    <div class="pd-price-k">Descuento</div>
                    <div class="pd-price-v">
                      <span v-if="hasDiscount">{{ money(priceDiscount) }}</span>
                      <span v-else class="text-caption text-medium-emphasis">—</span>
                    </div>
                  </div>

                  <div class="pd-price">
                    <div class="pd-price-k">Revendedor</div>
                    <div class="pd-price-v">
                      <span v-if="hasReseller">{{ money(priceReseller) }}</span>
                      <span v-else class="text-caption text-medium-emphasis">—</span>
                    </div>
                  </div>
                </div>
              </v-card>

              <!-- ✅ STOCK POR SUCURSAL -->
              <v-card rounded="xl" variant="flat" class="pd-card mt-4">
                <div class="d-flex align-center justify-space-between">
                  <div class="pd-card-title mb-0">
                    <v-icon size="18">mdi-warehouse</v-icon>
                    <span>Stock por sucursal</span>
                  </div>

                  <v-btn
                    size="small"
                    variant="tonal"
                    prepend-icon="mdi-refresh"
                    :disabled="!item?.id"
                    :loading="stockLoading"
                    @click="loadStockMatrix"
                  >
                    Refrescar
                  </v-btn>
                </div>

                <v-divider class="my-3" />

                <v-alert v-if="!item?.id" type="info" variant="tonal">
                  Guardá el producto para ver stock por sucursal.
                </v-alert>

                <v-alert v-else-if="!stockRows.length && !stockLoading" type="info" variant="tonal">
                  Sin datos de stock por sucursal todavía.
                </v-alert>

                <div v-else class="pd-stock-table">
                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th>Sucursal</th>
                        <th style="width: 110px" class="text-right">Stock</th>
                        <th style="width: 110px" class="text-right">Habilitada</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="r in stockRows" :key="r.branch_id">
                        <td>
                          <div class="d-flex flex-column">
                            <div class="font-weight-bold">{{ r.branch_name }}</div>
                            <div class="text-caption text-medium-emphasis">ID {{ r.branch_id }}</div>
                          </div>
                        </td>
                        <td class="text-right font-weight-bold">{{ fmtQty(r.current_qty) }}</td>
                        <td class="text-right">
                          <v-chip size="small" variant="tonal" :color="r.enabled ? 'primary' : 'grey'">
                            {{ r.enabled ? "Sí" : "No" }}
                          </v-chip>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>

                  <v-divider class="my-3" />

                  <div class="d-flex align-center justify-space-between">
                    <div class="text-caption text-medium-emphasis">
                      Filas: <b>{{ stockRows.length }}</b>
                    </div>
                    <div class="font-weight-bold">
                      Total: {{ fmtQty(totalStock) }}
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>

            <!-- RIGHT -->
            <v-col cols="12" md="7">
              <v-card rounded="xl" variant="flat" class="pd-card">
                <div class="d-flex align-center justify-space-between">
                  <div class="pd-card-title mb-0">
                    <v-icon size="18">mdi-image-multiple-outline</v-icon>
                    <span>Imágenes</span>
                  </div>

                  <div class="d-flex align-center ga-2">
                    <div class="text-caption text-medium-emphasis">product_images · {{ images.length }}</div>

                    <v-btn
                      v-if="images.length"
                      size="small"
                      variant="tonal"
                      prepend-icon="mdi-fullscreen"
                      @click="viewerOpen = true"
                    >
                      Ver grande
                    </v-btn>
                  </div>
                </div>

                <v-divider class="my-3" />

                <v-alert v-if="!images.length" type="info" variant="tonal">
                  Sin imágenes cargadas.
                </v-alert>

                <div v-else class="pd-carousel">
                  <v-carousel
                    v-model="activeSlide"
                    hide-delimiter-background
                    show-arrows="hover"
                    height="360"
                    class="pd-carousel-inner"
                  >
                    <v-carousel-item v-for="(img, i) in images" :key="img.id || i">
                      <div class="pd-slide">
                        <v-img
                          :src="normalizeUrl(img.url)"
                          :alt="`img-${img.id || i}`"
                          cover
                          class="pd-slide-img"
                        >
                          <template #placeholder>
                            <div class="pd-img-ph">
                              <v-progress-circular indeterminate />
                            </div>
                          </template>
                        </v-img>

                        <div class="pd-slide-overlay">
                          <v-chip size="small" variant="tonal">#{{ i + 1 }} / {{ images.length }}</v-chip>
                          <div class="d-flex ga-2">
                            <v-btn
                              icon="mdi-magnify-plus-outline"
                              size="small"
                              variant="tonal"
                              @click="openViewerAt(i)"
                              title="Zoom / Maximizar"
                            />
                            <v-btn
                              v-if="isAdmin"
                              icon="mdi-delete-outline"
                              size="small"
                              variant="flat"
                              color="red"
                              @click="askRemoveImage(img)"
                              title="Eliminar"
                            />
                          </div>
                        </div>
                      </div>
                    </v-carousel-item>
                  </v-carousel>

                  <div class="pd-thumbs">
                    <button
                      v-for="(img, i) in images"
                      :key="`t-${img.id || i}`"
                      class="pd-thumb"
                      :class="{ active: i === activeSlide }"
                      type="button"
                      @click="activeSlide = i"
                      :title="`Ver imagen ${i + 1}`"
                    >
                      <img :src="normalizeUrl(img.url)" :alt="`thumb-${img.id || i}`" />
                    </button>
                  </div>
                </div>

                <div class="text-caption text-medium-emphasis mt-3">
                  * Para agregar/reemplazar imágenes, entrá a <b>Editar</b>.
                </div>
              </v-card>
            </v-col>
          </v-row>
        </template>
      </v-card-text>
    </v-card>

    <!-- ✅ Viewer full-screen + zoom -->
    <v-dialog v-model="viewerOpen" fullscreen transition="dialog-bottom-transition">
      <v-card class="pd-viewer">
        <div class="pd-viewer-top">
          <div class="d-flex align-center ga-2">
            <v-btn icon="mdi-close" variant="text" @click="viewerOpen = false" />
            <div class="font-weight-bold">{{ item?.name || "Imágenes" }}</div>
            <div class="text-caption text-medium-emphasis" v-if="images.length">
              · {{ activeSlide + 1 }}/{{ images.length }}
            </div>
          </div>

          <div class="d-flex align-center ga-2">
            <v-btn variant="tonal" size="small" prepend-icon="mdi-magnify-minus-outline" @click="zoomOut" :disabled="zoom <= 1">
              Zoom -
            </v-btn>
            <v-btn variant="tonal" size="small" prepend-icon="mdi-magnify-plus-outline" @click="zoomIn" :disabled="zoom >= 3">
              Zoom +
            </v-btn>
            <v-btn variant="tonal" size="small" prepend-icon="mdi-restart" @click="resetZoom">Reset</v-btn>
          </div>
        </div>

        <v-divider />

        <div class="pd-viewer-body">
          <v-carousel
            v-model="activeSlide"
            hide-delimiters
            show-arrows="hover"
            height="calc(100vh - 120px)"
            class="pd-viewer-carousel"
          >
            <v-carousel-item v-for="(img, i) in images" :key="`v-${img.id || i}`">
              <div class="pd-viewer-stage" @dblclick="toggleZoom">
                <img
                  :src="normalizeUrl(img.url)"
                  :alt="`viewer-${img.id || i}`"
                  class="pd-viewer-img"
                  :style="{ transform: `scale(${zoom})` }"
                />
              </div>
            </v-carousel-item>
          </v-carousel>
        </div>
      </v-card>
    </v-dialog>

    <!-- Confirm delete producto -->
    <v-dialog v-model="deleteOpen" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="font-weight-bold">Eliminar producto</v-card-title>
        <v-card-text>
          ¿Eliminar <b>{{ item?.name }}</b> (ID #{{ item?.id }})?
          <div class="text-caption text-medium-emphasis mt-2">No se puede deshacer.</div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="tonal" @click="deleteOpen = false">Cancelar</v-btn>
          <v-btn color="red" variant="flat" @click="doDeleteProduct" :loading="products.loading">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm delete imagen -->
    <v-dialog v-model="deleteImgOpen" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="font-weight-bold">Eliminar imagen</v-card-title>
        <v-card-text>¿Eliminar imagen ID <b>#{{ deleteImg?.id }}</b>?</v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="tonal" @click="deleteImgOpen = false">Cancelar</v-btn>
          <v-btn color="red" variant="flat" @click="doDeleteImage" :loading="products.loading">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useProductsStore } from "../../../app/store/products.store";
import { useAuthStore } from "../../../app/store/auth.store";

const props = defineProps({
  open: { type: Boolean, default: false },
  productId: { type: [Number, String], default: null },
});

const emit = defineEmits(["update:open", "edit", "deleted"]);

const products = useProductsStore();
const auth = useAuthStore();

const openLocal = ref(false);
const loading = ref(false);

const item = ref(null);
const images = ref([]);

const deleteOpen = ref(false);
const deleteImgOpen = ref(false);
const deleteImg = ref(null);

const activeSlide = ref(0);
const viewerOpen = ref(false);
const zoom = ref(1);

/* ✅ stock por sucursal */
const stockLoading = ref(false);
const stockRows = ref([]); // [{branch_id,branch_name,enabled,current_qty}]
const totalStock = computed(() => (stockRows.value || []).reduce((a, r) => a + toNum(r.current_qty, 0), 0));
const totalStockLabel = computed(() => fmtQty(totalStock.value));

const isAdmin = computed(() => {
  const roles = auth.roles || [];
  return roles.includes("admin") || roles.includes("super_admin");
});

const rubro = computed(() => item.value?.category?.parent?.name || (item.value?.category?.name || null));
const subrubro = computed(() => item.value?.category?.parent ? item.value?.category?.name : null);

function toNum(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}

function fmtQty(v) {
  const n = toNum(v, 0);
  return n.toFixed(3);
}

function money(n) {
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(toNum(n, 0));
  } catch {
    return `$ ${toNum(n, 0).toFixed(2)}`;
  }
}

const priceList = computed(() => toNum(item.value?.price_list, 0));
const priceDiscount = computed(() => toNum(item.value?.price_discount, 0));
const priceReseller = computed(() => toNum(item.value?.price_reseller, 0));

const hasDiscount = computed(() => priceDiscount.value > 0 && priceDiscount.value < priceList.value);
const hasReseller = computed(() => priceReseller.value > 0);
const discountAmount = computed(() => (hasDiscount.value ? priceList.value - priceDiscount.value : 0));
const discountPercent = computed(() => {
  if (!hasDiscount.value || priceList.value <= 0) return 0;
  return Math.round((discountAmount.value / priceList.value) * 100);
});

watch(
  () => props.open,
  async (v) => {
    openLocal.value = v;
    if (v) await load();
  },
  { immediate: true }
);

watch(openLocal, (v) => emit("update:open", v));

function normalizeUrl(u) {
  if (!u) return "";
  const s = String(u);
  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  const base = (import.meta.env.VITE_S3_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  if (!base) return s;
  return base + (s.startsWith("/") ? s : `/${s}`);
}

function normalizeStockRows(arr) {
  const list = Array.isArray(arr) ? arr : [];
  return list
    .map((x) => ({
      branch_id: Number(x?.branch_id || x?.branchId || 0),
      branch_name: String(x?.branch_name || x?.name || `Sucursal #${x?.branch_id || ""}`),
      enabled: Number(x?.enabled || 0) === 1 || x?.enabled === true,
      current_qty: toNum(x?.current_qty ?? x?.qty ?? x?.stock_qty ?? 0, 0),
    }))
    .filter((x) => x.branch_id > 0)
    .sort((a, b) => a.branch_name.localeCompare(b.branch_name, "es"));
}

async function loadStockMatrix() {
  const id = Number(props.productId);
  if (!id) return;

  stockLoading.value = true;
  try {
    const rows = await products.fetchBranchesMatrix(id);
    stockRows.value = normalizeStockRows(rows);
  } finally {
    stockLoading.value = false;
  }
}

async function load() {
  const id = Number(props.productId);
  if (!id) return;

  loading.value = true;
  try {
    const p = await products.fetchOne(id, { force: true });
    item.value = p || null;

    const imgs = await products.fetchImages(id);
    images.value = Array.isArray(imgs) ? imgs : [];

    await loadStockMatrix();

    activeSlide.value = 0;
    zoom.value = 1;
  } finally {
    loading.value = false;
  }
}

function close() {
  openLocal.value = false;
}

function onEdit() {
  if (!item.value?.id) return;
  emit("edit", { id: item.value.id });
}

function askRemoveImage(img) {
  deleteImg.value = img;
  deleteImgOpen.value = true;
}

async function doDeleteImage() {
  const pid = Number(props.productId);
  if (!pid || !deleteImg.value?.id) return;

  const ok = await products.removeImage(pid, deleteImg.value.id);
  if (ok) {
    images.value = images.value.filter((x) => x.id !== deleteImg.value.id);
    deleteImgOpen.value = false;
    deleteImg.value = null;
  }
}

async function doDeleteProduct() {
  const pid = Number(props.productId);
  if (!pid) return;

  const r = await products.remove(pid);
  if (r?.ok === true) {
    deleteOpen.value = false;
    emit("deleted", { id: pid });
    close();
  }
}

function openViewerAt(i) {
  activeSlide.value = Number(i || 0);
  zoom.value = 1;
  viewerOpen.value = true;
}

function zoomIn() {
  zoom.value = Math.min(3, Math.round((zoom.value + 0.25) * 100) / 100);
}
function zoomOut() {
  zoom.value = Math.max(1, Math.round((zoom.value - 0.25) * 100) / 100);
}
function resetZoom() {
  zoom.value = 1;
}
function toggleZoom() {
  zoom.value = zoom.value === 1 ? 2 : 1;
}
</script>

<style scoped>
.pd-root { overflow: hidden; }
.pd-header { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:18px 20px; }
.pd-actions { display:flex; align-items:center; gap:10px; }
.pd-body { padding:18px 20px 22px; }
.pd-summary { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:14px; }
.pd-card { border: 1px solid rgba(0,0,0,.06); box-shadow: 0 10px 24px rgba(0,0,0,.05); padding:16px; }
.pd-card-title { display:flex; align-items:center; gap:8px; font-weight:800; margin-bottom:10px; }
.pd-kv { display:grid; gap:8px; }
.pd-kv-row { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
.pd-k { font-size:12px; opacity:.7; }
.pd-v { font-size:14px; font-weight:700; text-align:right; }

.pd-prices { display:grid; gap:10px; }
.pd-price { display:flex; align-items:baseline; justify-content:space-between; gap:10px; }
.pd-price-k { font-size:12px; opacity:.7; }
.pd-price-v { font-size:15px; font-weight:900; }
.pd-strike { text-decoration: line-through; opacity: .6; font-weight: 700; }

.pd-carousel { display:grid; gap:12px; }
.pd-carousel-inner { border-radius: 18px; overflow:hidden; border:1px solid rgba(0,0,0,.06); box-shadow:0 10px 24px rgba(0,0,0,.06); }
.pd-slide { position:relative; width:100%; height:100%; }
.pd-slide-img { width:100%; height:360px; }
.pd-img-ph { height:360px; display:grid; place-items:center; background: rgba(0,0,0,.03); }
.pd-slide-overlay {
  position:absolute;
  left:12px; right:12px; bottom:12px;
  display:flex; align-items:center; justify-content:space-between;
  gap:10px; pointer-events:none;
}
.pd-slide-overlay :deep(.v-btn),
.pd-slide-overlay :deep(.v-chip) { pointer-events:auto; }

.pd-thumbs { display:flex; gap:10px; overflow:auto; padding: 2px 2px 6px; }
.pd-thumb {
  width: 82px; height: 54px;
  border-radius: 12px; overflow:hidden;
  border: 1px solid rgba(0,0,0,.10);
  background: rgba(0,0,0,.03);
  flex: 0 0 auto; cursor: pointer;
  transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
}
.pd-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
.pd-thumb:hover { transform: translateY(-1px); box-shadow: 0 10px 18px rgba(0,0,0,.10); }
.pd-thumb.active { border-color: rgba(25,118,210,.6); box-shadow: 0 10px 18px rgba(25,118,210,.12); }

.pd-viewer { background: rgb(var(--v-theme-background)); }
.pd-viewer-top { display:flex; align-items:center; justify-content:space-between; gap:12px; padding: 12px 14px; }
.pd-viewer-body { height: calc(100vh - 60px); }
.pd-viewer-stage {
  height: calc(100vh - 120px);
  display:grid; place-items:center;
  background: rgba(0,0,0,.92);
  overflow:auto;
}
.pd-viewer-img {
  max-width: 100%;
  max-height: 100%;
  transform-origin: center center;
  transition: transform 120ms ease;
  user-select: none;
  -webkit-user-drag: none;
}

.pd-stock-table {
  border-radius: 14px;
  overflow: auto;
  border: 1px solid rgba(0,0,0,.06);
}
</style>
