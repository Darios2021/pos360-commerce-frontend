<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/ProductFormDialog.vue -->
<!-- SKU AUTO (FIX “COMO DEBE SER”):
  ✅ SKU se calcula “en serio” AL FINAL (Paso 5 / Resumen) porque ahí tiene sentido fijarlo:
     - En CREATE todavía NO hay ID real → solo preview
     - Al CREAR: se fija SKU definitivo con el ID real y se persiste con update
  ✅ Mientras tanto, mostramos un preview (no lo “grabamos” en draft hasta el final)
  ✅ Prefijo = iniciales (2 + 2) de Rubro + Subrubro (por nombre)
  ✅ Sufijo = ID real (cuando existe) o nextCodePreview (preview)
-->

<template>
  <v-dialog
    v-model="openLocal"
    fullscreen
    persistent
    content-class="pf-overlay"
    transition="dialog-bottom-transition"
  >
    <v-card class="pf-card" :rounded="mdAndUp ? '0' : '0'">
      <!-- HEADER -->
      <div class="pf-top">
        <div class="pf-appbar">
          <div class="pf-appbar-left minw-0">
            <div class="pf-h1 text-truncate">
              {{ isEdit ? "Editar producto" : "Nuevo producto" }}
            </div>
            <div class="pf-sub text-truncate">
              Carga guiada por pasos (Anterior / Siguiente)
            </div>
          </div>

          <div class="pf-appbar-right d-flex align-center ga-2">
            <v-chip
              v-if="step === 5"
              :color="isReadyToCreate ? 'green' : 'grey'"
              variant="tonal"
              size="small"
              class="pf-ready-chip"
            >
              {{ isReadyToCreate ? "Listo" : "Faltan datos" }}
            </v-chip>

            <v-btn icon variant="text" @click="onCancel" :disabled="busy" class="pf-close">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </div>

        <div class="pf-progress">
          <v-progress-linear
            :model-value="(step / 5) * 100"
            height="6"
            rounded
            color="primary"
            bg-color="surface-variant"
          />
        </div>

        <v-divider />

        <!-- STEPPER -->
        <div v-if="mdAndUp" class="pf-stepper-head">
          <v-stepper v-model="step" alt-labels class="pf-stepper" density="comfortable">
            <v-stepper-header>
              <v-stepper-item :value="1" title="Datos" subtitle="Obligatorio" />
              <v-divider />
              <v-stepper-item :value="2" title="Precios" subtitle="Opcional" :disabled="!canGoAfterStep1" />
              <v-divider />
              <v-stepper-item :value="3" title="Stock" subtitle="Sucursal" :disabled="!canGoAfterStep1" />
              <v-divider />
              <v-stepper-item :value="4" title="Media" subtitle="Imágenes + Videos" :disabled="!canGoAfterStep1" />
              <v-divider />
              <v-stepper-item :value="5" title="Resumen" subtitle="Preview" :disabled="!canGoAfterStep1" />
            </v-stepper-header>
          </v-stepper>
        </div>

        <div v-else class="pf-stepper-mobile">
          <v-slide-group show-arrows center-active class="pf-slide">
            <v-slide-group-item v-for="s in steps" :key="s.value">
              <v-chip
                class="pf-stepchip"
                :color="step === s.value ? 'primary' : undefined"
                :variant="step === s.value ? 'flat' : 'tonal'"
                size="small"
                :disabled="!canGoTo(s.value)"
                @click="goToStep(s.value)"
              >
                <span class="pf-stepchip-n">{{ s.value }}</span>
                <span class="pf-stepchip-t">{{ s.title }}</span>
              </v-chip>
            </v-slide-group-item>
          </v-slide-group>

          <div class="pf-stephint text-caption text-medium-emphasis">
            Paso <b>{{ step }}</b> de <b>5</b>
            <span v-if="draft?.id"> · Producto <b>#{{ draft.id }}</b></span>
          </div>
        </div>

        <v-divider />
      </div>

      <!-- BODY -->
      <div class="pf-body">
        <div class="pf-pad">
          <!-- STEP 1 -->
          <div v-show="step === 1" class="pf-step">
            <!-- ProductDataPanel debe renderizar SKU readonly, pero OJO:
                 - El valor “oficial” se fija al final (Paso 5)
                 - Igual podés mostrar el preview en el input (si ProductDataPanel usa draft.sku)
                 👉 Por eso: acá NO pisamos draft.sku todavía, solo mostramos preview abajo
            -->
            <ProductDataPanel v-model="draft" :disabled="busy" :product-id="draft?.id || null" />

            <div class="pf-meta mt-3 d-flex align-center flex-wrap ga-2">
              <div>ID: <b>{{ draft?.id || "—" }}</b></div>
              <div>
                · Código:
                <b>{{ draft?.code || nextCodePreview || "—" }}</b>
                <span v-if="!draft?.id && nextCodePreview" class="ml-1">(preview)</span>
              </div>

              <div>
                · SKU auto (preview):
                <b>{{ skuPreview || "—" }}</b>
                <span v-if="skuPreviewHint" class="ml-1">({{ skuPreviewHint }})</span>
                <span class="ml-2 text-medium-emphasis">(se fija al final)</span>
              </div>

              <v-btn
                size="small"
                variant="tonal"
                class="ml-auto"
                @click="reloadNextCode"
                :disabled="busy || isEdit"
              >
                <v-icon start size="18">mdi-refresh</v-icon>
                Recalcular
              </v-btn>
            </div>

            <div class="mt-3">
              <v-alert v-if="products.error" type="error" variant="tonal" density="comfortable">
                {{ products.error }}
                <div v-if="products.lastFieldErrors" class="mt-2">
                  <div v-for="(msg, field) in products.lastFieldErrors" :key="field" class="text-caption">
                    • <b>{{ field }}</b>: {{ msg }}
                  </div>
                </div>
              </v-alert>
            </div>
          </div>

          <!-- STEP 2 -->
          <div v-show="step === 2" class="pf-step">
            <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
              <div>
                <div class="text-subtitle-1 font-weight-bold">Precios</div>
                <div class="text-caption text-medium-emphasis">Opcional.</div>
              </div>
              <v-chip size="small" variant="tonal">Preview</v-chip>
            </div>

            <ProductPricesPanel v-model="draft" :disabled="busy" />
          </div>

          <!-- STEP 3 -->
          <div v-show="step === 3" class="pf-step">
            <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
              <div>
                <div class="text-subtitle-1 font-weight-bold">Stock por sucursal</div>
                <div class="text-caption text-medium-emphasis">
                  Cargá cantidades. Se aplican cuando toques <b>{{ isEdit ? "GUARDAR" : "CREAR" }}</b> en el Resumen.
                </div>
              </div>
              <v-chip size="small" variant="tonal">Preview</v-chip>
            </div>

            <ProductStockPanel :product-id="draft?.id || null" v-model="stockMatrix" :disabled="busy" />
          </div>

          <!-- STEP 4 -->
          <div v-show="step === 4" class="pf-step">
            <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
              <div>
                <div class="text-subtitle-1 font-weight-bold">Media</div>
                <div class="text-caption text-medium-emphasis">
                  Imágenes + Videos. Quedan en cola y se suben al tocar <b>{{ isEdit ? "GUARDAR" : "CREAR" }}</b>.
                </div>
              </div>

              <div class="d-flex align-center ga-2">
                <v-chip v-if="queuedImages.length" size="small" color="primary" variant="tonal">
                  {{ queuedImages.length }} img en cola
                </v-chip>
                <v-chip
                  v-if="queuedYoutubeVideos.length || queuedVideoFiles.length"
                  size="small"
                  color="primary"
                  variant="tonal"
                >
                  {{ queuedYoutubeVideos.length + queuedVideoFiles.length }} vid en cola
                </v-chip>
                <v-chip
                  v-if="!queuedImages.length && !queuedYoutubeVideos.length && !queuedVideoFiles.length"
                  size="small"
                  variant="tonal"
                >
                  Sin cola
                </v-chip>
              </div>
            </div>

            <ProductImagesPanel
              :product-id="draft?.id || null"
              v-model="queuedImages"
              @changed="onQueuedChanged"
            />

            <v-card class="pf-media-card mt-2" rounded="xl" variant="tonal">
              <div class="d-flex align-center justify-space-between flex-wrap ga-2">
                <div class="d-flex align-center ga-2">
                  <v-icon size="20">mdi-play-circle</v-icon>
                  <div class="font-weight-bold">Videos</div>
                </div>

                <div class="d-flex align-center ga-2">
                  <v-btn size="small" variant="text" @click="clearVideosQueue" :disabled="busy">
                    Limpiar cola
                  </v-btn>
                </div>
              </div>

              <div class="text-caption text-medium-emphasis mt-1">
                Agregá <b>YouTube/Shorts</b> por URL o subí un <b>archivo</b>. Se sube recién cuando toques
                <b>{{ isEdit ? "GUARDAR" : "CREAR" }}</b>.
              </div>

              <v-divider class="my-3" />

              <div class="pf-video-grid">
                <div>
                  <div class="text-subtitle-2 font-weight-bold mb-2">YouTube / Shorts (URL)</div>

                  <div class="d-flex flex-wrap ga-2">
                    <v-text-field
                      v-model="ytUrl"
                      :disabled="busy"
                      density="comfortable"
                      label="Pegá URL (youtube.com / youtu.be / shorts)"
                      prepend-inner-icon="mdi-youtube"
                      variant="outlined"
                      hide-details
                      class="flex-1"
                    />

                    <v-btn color="primary" variant="flat" @click="addYoutubeUrl" :disabled="busy">
                      <v-icon start size="18">mdi-plus</v-icon>
                      Agregar
                    </v-btn>
                  </div>

                  <v-alert v-if="ytError" type="error" variant="tonal" density="comfortable" class="mt-2">
                    {{ ytError }}
                  </v-alert>

                  <div v-if="queuedYoutubeVideos.length" class="pf-queue mt-3">
                    <div class="text-caption text-medium-emphasis mb-1">
                      En cola: <b>{{ queuedYoutubeVideos.length }}</b>
                    </div>

                    <div class="pf-queue-list">
                      <div v-for="(v, idx) in queuedYoutubeVideos" :key="v.key" class="pf-queue-item">
                        <div class="minw-0">
                          <div class="pf-queue-title text-truncate">
                            <v-icon size="16" class="mr-1">mdi-youtube</v-icon>
                            {{ v.title || "YouTube" }}
                          </div>
                          <div class="pf-queue-sub text-truncate">{{ v.url }}</div>
                        </div>

                        <v-btn size="small" variant="text" icon @click="removeYoutubeAt(idx)" :disabled="busy">
                          <v-icon>mdi-close</v-icon>
                        </v-btn>
                      </div>
                    </div>
                  </div>

                  <div v-else class="text-caption text-medium-emphasis mt-2">
                    No hay URLs en cola.
                  </div>
                </div>

                <div>
                  <div class="text-subtitle-2 font-weight-bold mb-2">Subir archivo (video/*)</div>

                  <v-file-input
                    v-model="queuedVideoFiles"
                    :disabled="busy"
                    density="comfortable"
                    variant="outlined"
                    prepend-icon="mdi-upload"
                    label="Elegí uno o varios videos"
                    multiple
                    accept="video/*"
                    show-size
                    chips
                    hide-details
                  />

                  <div class="d-flex align-center justify-space-between mt-2">
                    <div class="text-caption text-medium-emphasis">
                      En cola: <b>{{ queuedVideoFiles.length }}</b>
                    </div>

                    <v-btn
                      v-if="queuedVideoFiles.length"
                      size="small"
                      variant="text"
                      @click="queuedVideoFiles = []"
                      :disabled="busy"
                    >
                      Quitar archivos
                    </v-btn>
                  </div>

                  <div class="text-caption text-medium-emphasis mt-2">
                    Tip: si el archivo es pesado, tarda más; igual se sube recién al guardar/crear.
                  </div>
                </div>
              </div>
            </v-card>

            <ProductVideosPanel
              v-if="isEdit"
              class="mt-2"
              :product-id="draft?.id || null"
              :mode="'edit'"
              :youtube-queue="queuedYoutubeVideos"
              :files-queue="queuedVideoFiles"
              @update:youtubeQueue="queuedYoutubeVideos = normalizeYoutubeQueue($event)"
              @update:filesQueue="queuedVideoFiles = normalizeFilesQueue($event)"
              @changed="onVideosChanged"
            />
          </div>

          <!-- STEP 5 -->
          <div v-show="step === 5" class="pf-step">
            <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
              <div>
                <div class="text-subtitle-1 font-weight-bold">Resumen final</div>
                <div class="text-caption text-medium-emphasis">
                  Al tocar <b>{{ isEdit ? "GUARDAR" : "CREAR" }}</b> se registra el producto y se aplica stock/media.
                  <br />
                  El <b>SKU</b> se fija acá con el <b>ID real</b> cuando existe.
                </div>
              </div>

              <v-chip :color="isReadyToCreate ? 'green' : 'grey'" variant="tonal" size="small">
                {{ isReadyToCreate ? "Listo" : "Faltan datos obligatorios" }}
              </v-chip>
            </div>

            <v-alert v-if="products.error" type="error" variant="tonal" class="mt-1" density="comfortable">
              {{ products.error }}
              <div v-if="products.lastFieldErrors" class="mt-2">
                <div v-for="(msg, field) in products.lastFieldErrors" :key="field" class="text-caption">
                  • <b>{{ field }}</b>: {{ msg }}
                </div>
              </div>
            </v-alert>

            <div class="pf-summary-grid mt-3">
              <v-card variant="tonal" rounded="xl" class="pf-summary-card">
                <div class="text-subtitle-1 font-weight-bold mb-2">Producto</div>

                <div class="pf-kv">
                  <div class="k">Nombre</div><div class="v">{{ safe(draft.name) }}</div>
                  <div class="k">SKU</div><div class="v">{{ safe(finalSku) }}</div>
                  <div class="k">Rubro</div><div class="v">{{ safe(draft.category_id) }}</div>
                  <div class="k">Subrubro</div><div class="v">{{ safe(draft.subcategory_id) }}</div>
                  <div class="k">Marca</div><div class="v">{{ safe(draft.brand) }}</div>
                  <div class="k">Modelo</div><div class="v">{{ safe(draft.model) }}</div>
                </div>

                <div class="mt-3">
                  <div class="text-caption text-medium-emphasis mb-1">Descripción</div>
                  <div class="pf-desc">{{ safe(draft.description) }}</div>
                </div>

                <v-divider class="my-4" />

                <div class="text-subtitle-2 font-weight-bold mb-2">Precios (preview)</div>
                <div class="pf-kv">
                  <div class="k">Lista</div><div class="v">{{ num(draft.price_list).toFixed(2) }}</div>
                  <div class="k">Desc.</div><div class="v">{{ num(draft.price_discount).toFixed(2) }}</div>
                  <div class="k">Reventa</div><div class="v">{{ num(draft.price_reseller).toFixed(2) }}</div>
                </div>

                <v-divider class="my-4" />

                <div class="text-subtitle-2 font-weight-bold mb-2">Stock (preview)</div>
                <div v-if="stockPreviewList.length" class="pf-stock-preview">
                  <div v-for="r in stockPreviewList" :key="r.branch_id" class="pf-stock-row">
                    <div class="n">{{ r.branch_name }}</div>
                    <div class="q">{{ num(r.qty).toFixed(3) }}</div>
                  </div>
                </div>
                <div v-else class="text-caption text-medium-emphasis">Sin stock cargado.</div>

                <v-divider class="my-4" />

                <div class="text-subtitle-2 font-weight-bold mb-2">Media en cola</div>
                <div class="text-caption">
                  Imágenes: <b>{{ queuedImages.length }}</b> · Videos:
                  <b>{{ queuedYoutubeVideos.length + queuedVideoFiles.length }}</b>
                </div>
              </v-card>

              <v-card variant="tonal" rounded="xl" class="pf-summary-card">
                <div class="text-subtitle-1 font-weight-bold mb-2">Código de barras</div>

                <ProductBarcodeCard
                  :value="draft?.code || ''"
                  :preview="nextCodePreview || ''"
                  :label="draft?.id ? 'REAL' : 'PREVIEW'"
                />

                <div class="text-caption text-medium-emphasis mt-3">
                  {{ draft?.id ? "Código real del producto." : "Previsualización del próximo código." }}
                </div>
              </v-card>
            </div>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="pf-footer">
        <v-divider />
        <v-card-actions class="pf-actions d-flex align-center justify-space-between">
          <div class="text-caption text-medium-emphasis pf-footer-left">
            Paso <b>{{ step }}</b> de <b>5</b>
            <span v-if="draft?.id"> · Producto <b>#{{ draft.id }}</b></span>
          </div>

          <div class="pf-footer-right d-flex ga-2">
            <v-btn class="pf-btn" variant="tonal" @click="prevStep" :disabled="busy || step === 1">
              <v-icon start size="18">mdi-chevron-left</v-icon>
              ANTERIOR
            </v-btn>

            <v-btn v-if="step < 5" class="pf-btn" color="primary" variant="flat" @click="nextStep" :disabled="busy">
              SIGUIENTE
              <v-icon end size="18">mdi-chevron-right</v-icon>
            </v-btn>

            <v-btn
              v-else
              class="pf-btn"
              color="primary"
              variant="flat"
              @click="isEdit ? saveAll() : createAll()"
              :loading="busy"
              :disabled="busy"
            >
              <v-icon start size="18">{{ isEdit ? "mdi-content-save" : "mdi-plus" }}</v-icon>
              {{ isEdit ? "GUARDAR" : "CREAR" }}
            </v-btn>
          </div>
        </v-card-actions>
      </div>

      <!-- Snack -->
      <v-snackbar v-model="snack.open" :timeout="2600" location="bottom right">
        {{ snack.text }}
        <template #actions>
          <v-btn variant="text" @click="snack.open=false">OK</v-btn>
        </template>
      </v-snackbar>

      <!-- Modal validación -->
      <v-dialog v-model="vModal.open" max-width="520">
        <v-card rounded="xl">
          <v-card-title class="d-flex align-center ga-2">
            <v-icon color="warning">mdi-alert-circle</v-icon>
            <span class="font-weight-bold">Faltan datos obligatorios</span>
          </v-card-title>
          <v-card-text>
            <div v-if="vModal.message" class="mb-2">{{ vModal.message }}</div>
            <ul class="pf-ul">
              <li v-for="(m, i) in vModal.items" :key="i">{{ m }}</li>
            </ul>
            <div class="text-caption text-medium-emphasis mt-3">
              Completá lo indicado y volvé a intentar.
            </div>
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn variant="flat" color="primary" @click="vModal.open=false">Entendido</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </v-dialog>
</template>



<script setup>
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import http from "../../../app/api/http";
import { useProductsStore } from "../../../app/store/products.store";

import ProductDataPanel from "./form/ProductDataPanel.vue";
import ProductPricesPanel from "./panels/ProductPricesPanel.vue";
import ProductStockPanel from "./panels/ProductStockPanel.vue";
import ProductImagesPanel from "./panels/ProductImagesPanel.vue";
import ProductVideosPanel from "./panels/ProductVideosPanel.vue";
import ProductBarcodeCard from "./form/ProductBarcodeCard.vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: "create" }, // create|edit
  item: { type: Object, default: null },
});

const emit = defineEmits(["update:open", "saved", "cancel"]);

const products = useProductsStore();
const busy = ref(false);
const isEdit = computed(() => props.mode === "edit");

const openLocal = computed({
  get: () => props.open,
  set: (v) => emit("update:open", v),
});

const { mdAndUp, smAndDown } = useDisplay();
const isMobile = computed(() => !!smAndDown.value);

const step = ref(1);
const nextCodePreview = ref(null);

/* ===================== Taxonomías ===================== */
const categoriesList = ref([]);
const subcategoriesList = ref([]);

/* ===================== Queues (BLINDADAS) ===================== */
const stockMatrix = ref([]);
const queuedImages = ref([]);         // File[]
const queuedYoutubeVideos = ref([]);  // [{key,url,title?}]
const queuedVideoFiles = ref([]);     // File[]

function arr(v) {
  return Array.isArray(v) ? v : [];
}

const imagesCount = computed(() => arr(queuedImages.value).length);
const youtubeCount = computed(() => arr(queuedYoutubeVideos.value).length);
const videoFilesCount = computed(() => arr(queuedVideoFiles.value).length);
const videosCount = computed(() => youtubeCount.value + videoFilesCount.value);

/* ===================== UI ===================== */
const ytUrl = ref("");
const ytError = ref("");

const snack = ref({ open: false, text: "" });
function toast(t) {
  snack.value = { open: true, text: String(t || "") };
}

const vModal = ref({ open: false, message: "", items: [] });
function showValidation(items = [], message = "") {
  vModal.value = {
    open: true,
    message: message || "",
    items: (Array.isArray(items) ? items : []).filter(Boolean),
  };
}

/* ===================== Utils ===================== */
function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}
function num(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}
function toBool(v, d = false) {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "true" || s === "1") return true;
  if (s === "false" || s === "0") return false;
  return d;
}
function deepClone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj || {}));
  } catch {
    return { ...(obj || {}) };
  }
}
function safe(v) {
  const s = String(v ?? "").trim();
  return s ? s : "—";
}

function normalizeList(arrIn) {
  const a = Array.isArray(arrIn) ? arrIn : [];
  return a
    .map((x) => {
      const id =
        toInt(x?.id, 0) ||
        toInt(x?.value, 0) ||
        toInt(x?.category_id, 0) ||
        toInt(x?.subcategory_id, 0) ||
        toInt(x?.rubro_id, 0) ||
        toInt(x?.subrubro_id, 0);

      const name = String(
        x?.name ??
          x?.nombre ??
          x?.title ??
          x?.label ??
          x?.text ??
          x?.descripcion ??
          x?.category_name ??
          x?.subcategory_name ??
          x?.rubro ??
          x?.subrubro ??
          ""
      ).trim();

      const category_id =
        toInt(x?.category_id, 0) ||
        toInt(x?.categoryId, 0) ||
        toInt(x?.rubro_id, 0) ||
        toInt(x?.parent_id, 0) ||
        0;

      return { id, name, category_id };
    })
    .filter((x) => x.id > 0 && x.name);
}

function extractArray(res) {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.rows)) return d.rows;
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

async function tryGetFirstOk(label, urls = []) {
  const tried = [];
  for (const url of urls) {
    tried.push(url);
    try {
      const res = await http.get(url);
      const arr = extractArray(res);
      if (arr.length) {
        console.log(`[taxonomies] OK ${label}:`, url, arr.length);
        return arr;
      }
    } catch {}
  }
  console.warn(`[taxonomies] FAIL ${label}. Endpoints probados:`, tried);
  return [];
}

const TAXONOMY_ENDPOINTS = {
  categories: [
    "/admin/categories",
    "/admin/product-categories",
    "/admin/products/categories",
    "/admin/meta/categories",
    "/categories",
  ],
  subcategories: [
    "/admin/subcategories",
    "/admin/product-subcategories",
    "/admin/products/subcategories",
    "/admin/meta/subcategories",
    "/subcategories",
  ],
};

async function ensureTaxonomies() {
  // 1) store
  const cStore = normalizeList(products?.categories || products?.meta?.categories || []);
  const sStore = normalizeList(products?.subcategories || products?.meta?.subcategories || []);
  if (cStore.length) categoriesList.value = cStore;
  if (sStore.length) subcategoriesList.value = sStore;

  // 2) store methods (si existen)
  try {
    if (!categoriesList.value.length && typeof products.fetchCategories === "function") {
      await products.fetchCategories();
      categoriesList.value = normalizeList(products?.categories || products?.meta?.categories || []);
    }
  } catch {}
  try {
    if (!subcategoriesList.value.length && typeof products.fetchSubcategories === "function") {
      await products.fetchSubcategories();
      subcategoriesList.value = normalizeList(products?.subcategories || products?.meta?.subcategories || []);
    }
  } catch {}

  // 3) http fallback
  if (!categoriesList.value.length) {
    categoriesList.value = normalizeList(
      await tryGetFirstOk("categories", TAXONOMY_ENDPOINTS.categories)
    );
  }
  if (!subcategoriesList.value.length) {
    subcategoriesList.value = normalizeList(
      await tryGetFirstOk("subcategories", TAXONOMY_ENDPOINTS.subcategories)
    );
  }

  console.log("[taxonomies] categories:", categoriesList.value.length, categoriesList.value.slice(0, 3));
  console.log("[taxonomies] subcategories:", subcategoriesList.value.length, subcategoriesList.value.slice(0, 3));

  if (!categoriesList.value.length || !subcategoriesList.value.length) {
    toast("⚠️ No se cargan Rubros/Subrubros. Mirá consola: [taxonomies] FAIL ...");
  }
}

/* ===================== Draft ===================== */
function pickId(maybe) {
  if (maybe === null || maybe === undefined) return 0;
  if (typeof maybe === "number") return toInt(maybe, 0);
  if (typeof maybe === "string") return toInt(maybe.trim(), 0);
  if (typeof maybe === "object") {
    return (
      toInt(maybe.id, 0) ||
      toInt(maybe.value, 0) ||
      toInt(maybe.subcategory_id, 0) ||
      toInt(maybe.subcategoryId, 0) ||
      toInt(maybe.category_id, 0) ||
      0
    );
  }
  return 0;
}
function getSubcategoryIdFromDraft(d) {
  let sid =
    pickId(d?.subcategory_id) ||
    pickId(d?.subcategoryId) ||
    pickId(d?.sub_category_id) ||
    pickId(d?.subrubro_id) ||
    pickId(d?.subrubroId);

  if (!sid) sid = pickId(d?.subcategory) || pickId(d?.subCategory) || pickId(d?.subrubro);
  return sid || null;
}
function getCategoryIdFromDraft(d) {
  let cid =
    pickId(d?.category_id) ||
    pickId(d?.categoryId) ||
    pickId(d?.rubro_id) ||
    pickId(d?.rubroId) ||
    pickId(d?.category);
  return cid || null;
}
function defaultDraft() {
  return {
    id: null,
    name: "",
    sku: "",
    code: null,
    barcode: null,
    branch_id: null,
    description: "",
    category_id: null,
    subcategory_id: null,
    is_active: true,
    track_stock: true,
    brand: "",
    model: "",
    price_list: 0,
    price_discount: 0,
    price_reseller: 0,
  };
}
const draft = ref(defaultDraft());

/* ===================== SKU preview/final ===================== */
const skuPreviewHint = ref("");
function getCategoryNameById(id) {
  const iid = toInt(id, 0);
  if (!iid) return "";
  const hit = arr(categoriesList.value).find((x) => toInt(x?.id, 0) === iid);
  return String(hit?.name || "").trim();
}
function getSubcategoryNameById(id) {
  const iid = toInt(id, 0);
  if (!iid) return "";
  const hit = arr(subcategoriesList.value).find((x) => toInt(x?.id, 0) === iid);
  return String(hit?.name || "").trim();
}
function lettersOnly(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .trim();
}
function makeInitials(label, take = 2) {
  const clean = lettersOnly(label);
  if (!clean) return "";
  const stop = new Set(["DE", "DEL", "LA", "LAS", "EL", "LOS", "Y", "EN", "POR", "PARA"]);
  const parts = clean
    .split(/\s+/)
    .map((x) => x.toUpperCase())
    .filter((x) => x && !stop.has(x));

  let out = "";
  for (const p of parts) {
    out += (p[0] || "");
    if (out.length >= take) break;
  }
  if (out.length < take) out += parts.join("").slice(out.length, take);
  return out.slice(0, take).toUpperCase();
}
function buildSku(d, forceId = null) {
  const cid = getCategoryIdFromDraft(d);
  const sid = getSubcategoryIdFromDraft(d);

  const cat2 = makeInitials(getCategoryNameById(cid), 2) || "XX";
  const sub2 = makeInitials(getSubcategoryNameById(sid), 2) || "XX";

  const idReal = toInt(forceId ?? d?.id, 0);
  if (idReal) {
    skuPreviewHint.value = "";
    return `${cat2}${sub2}${String(idReal).padStart(6, "0")}`;
  }

  const prev = toInt(nextCodePreview.value, 0);
  skuPreviewHint.value = "preview";
  return `${cat2}${sub2}${String(prev || 0).padStart(6, "0")}`;
}

const skuPreview = computed(() => {
  const cid = toInt(getCategoryIdFromDraft(draft.value), 0);
  const sid = toInt(getSubcategoryIdFromDraft(draft.value), 0);
  if (!cid || !sid) return "";
  return buildSku(draft.value, null);
});

const finalSku = computed(() => {
  // si ya existe SKU real guardado (edit) lo mostramos
  const s = String(draft.value?.sku || "").trim();
  if (s) return s;

  // si no, mostramos preview (create)
  return skuPreview.value;
});

/* ===================== Next code ===================== */
async function reloadNextCode() {
  if (isEdit.value) return;
  const code = await products.fetchNextCode();
  nextCodePreview.value = code || null;
}

/* ===================== Hydrate ===================== */
async function hydrateDraft() {
  products.error = null;
  products.lastFieldErrors = null;

  nextCodePreview.value = null;
  queuedImages.value = [];
  queuedYoutubeVideos.value = [];
  queuedVideoFiles.value = [];
  stockMatrix.value = [];
  ytUrl.value = "";
  ytError.value = "";
  skuPreviewHint.value = "";

  await ensureTaxonomies();

  if (isEdit.value && props.item && typeof props.item === "object") {
    draft.value = { ...defaultDraft(), ...deepClone(props.item) };
    step.value = 2;
  } else {
    draft.value = defaultDraft();
    step.value = 1;
    await reloadNextCode();
  }

  if (Array.isArray(draft.value?.stock_matrix)) {
    stockMatrix.value = deepClone(draft.value.stock_matrix);
  }
}

watch(
  () => props.open,
  (v) => {
    if (!v) return;
    hydrateDraft();
  },
  { immediate: true }
);

watch(
  () => props.item,
  () => {
    if (!props.open) return;
    if (isEdit.value) hydrateDraft();
  },
  { deep: true }
);

function onCancel() {
  emit("cancel");
  openLocal.value = false;
}

/* ===================== Validación ===================== */
function validateDatos() {
  const errs = [];
  const name = String(draft.value?.name || "").trim();
  const cat = toInt(getCategoryIdFromDraft(draft.value), 0);
  const sub = toInt(getSubcategoryIdFromDraft(draft.value), 0);

  if (!name) errs.push("• Falta el **Nombre** del producto.");
  if (!cat) errs.push("• Falta seleccionar el **Rubro**.");
  if (!sub) errs.push("• Falta seleccionar el **Subrubro**.");

  return errs.length ? errs : null;
}

const canGoAfterStep1 = computed(() => !validateDatos());
const isReadyToCreate = computed(() => !validateDatos());

/* ===================== Stock preview ===================== */
const stockPreviewList = computed(() => {
  const a = arr(stockMatrix.value);
  return a
    .map((r) => ({
      branch_id: toInt(r.branch_id, 0),
      branch_name: String(r.branch_name || "").trim(),
      qty: num(r.qty, 0),
      enabled: toBool(r.enabled, false),
    }))
    .filter((x) => x.branch_id > 0 && x.branch_name && Number.isFinite(x.qty) && x.qty !== 0);
});

/* ===================== Navegación ===================== */
const steps = [
  { value: 1, title: "Datos" },
  { value: 2, title: "Precios" },
  { value: 3, title: "Stock" },
  { value: 4, title: "Media" },
  { value: 5, title: "Resumen" },
];

function canGoTo(target) {
  const t = toInt(target, 1);
  if (t <= 1) return true;
  return !!canGoAfterStep1.value;
}
function goToStep(target) {
  const t = toInt(target, 1);
  if (!canGoTo(t)) return;
  step.value = Math.min(5, Math.max(1, t));
}
function prevStep() {
  step.value = Math.max(1, step.value - 1);
}
function nextStep() {
  if (step.value === 1) {
    const errs = validateDatos();
    if (errs) return showValidation(errs, "Antes de continuar, completá estos campos:");
  }
  step.value = Math.min(5, step.value + 1);
}

/* ===================== Queue handlers (BLINDADOS) ===================== */
function onQueuedChanged(files) {
  queuedImages.value = arr(files);
}
function normalizeYoutubeQueue(a) {
  return arr(a)
    .map((x) => ({
      key: String(x?.key || `${Date.now()}-${Math.random()}`),
      url: String(x?.url || "").trim(),
      title: x?.title ? String(x.title).trim() : "",
    }))
    .filter((x) => !!x.url);
}
function normalizeFilesQueue(a) {
  return arr(a).filter(Boolean);
}

/* ===================== YouTube ===================== */
function parseYoutubeUrl(raw) {
  const url = String(raw || "").trim();
  if (!url) return { ok: false, url: "", reason: "Pegá una URL." };

  const low = url.toLowerCase();
  const looksYoutube =
    low.includes("youtube.com/") || low.includes("youtu.be/") || low.includes("m.youtube.com/");
  if (!looksYoutube) return { ok: false, url: "", reason: "La URL no parece de YouTube." };

  return { ok: true, url, reason: "" };
}
function addYoutubeUrl() {
  ytError.value = "";
  const p = parseYoutubeUrl(ytUrl.value);
  if (!p.ok) return (ytError.value = p.reason || "URL inválida.");

  const already = normalizeYoutubeQueue(queuedYoutubeVideos.value).some((x) => x.url === p.url);
  if (already) return (ytError.value = "Esa URL ya está en la cola.");

  queuedYoutubeVideos.value = normalizeYoutubeQueue([
    ...normalizeYoutubeQueue(queuedYoutubeVideos.value),
    { key: `${Date.now()}-${Math.random().toString(16).slice(2)}`, url: p.url, title: "" },
  ]);

  ytUrl.value = "";
  toast("✅ YouTube agregado a la cola");
}
function removeYoutubeAt(idx) {
  const a = normalizeYoutubeQueue(queuedYoutubeVideos.value);
  a.splice(idx, 1);
  queuedYoutubeVideos.value = a;
}
function clearVideosQueue() {
  queuedYoutubeVideos.value = [];
  queuedVideoFiles.value = [];
  ytUrl.value = "";
  ytError.value = "";
  toast("✅ Cola de videos limpia");
}
function onVideosChanged() {}

/* ===================== Commit videos ===================== */
async function commitVideos(productId) {
  const pid = toInt(productId, 0);
  if (!pid) return;

  const yq = normalizeYoutubeQueue(queuedYoutubeVideos.value);
  const fq = normalizeFilesQueue(queuedVideoFiles.value);

  for (const it of yq) {
    try {
      await http.post(`/admin/products/${pid}/videos/youtube`, { url: it.url, title: it?.title || null });
    } catch (e) {
      toast("⚠️ Video YouTube: " + (e?.friendlyMessage || e?.message || "Falló"));
    }
  }

  for (const f of fq) {
    try {
      const fd = new FormData();
      fd.append("file", f);
      await http.post(`/admin/products/${pid}/videos/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (e) {
      toast("⚠️ Video upload: " + (e?.friendlyMessage || e?.message || "Falló"));
    }
  }

  if (yq.length || fq.length) {
    queuedYoutubeVideos.value = [];
    queuedVideoFiles.value = [];
    toast("✅ Videos procesados");
  }
}

/* ===================== Payload ===================== */
function buildPayload() {
  const payload = {
    ...draft.value,
    name: String(draft.value?.name || "").trim(),
    description: String(draft.value?.description || "").trim(),
    brand: String(draft.value?.brand || "").trim(),
    model: String(draft.value?.model || "").trim(),
    category_id: toInt(getCategoryIdFromDraft(draft.value), 0) || null,
    subcategory_id: toInt(getSubcategoryIdFromDraft(draft.value), 0) || null,
    price_list: num(draft.value?.price_list, 0),
    price_discount: num(draft.value?.price_discount, 0),
    price_reseller: num(draft.value?.price_reseller, 0),
  };

  if (payload.barcode === "") payload.barcode = null;
  if (payload.branch_id === "" || payload.branch_id === 0) payload.branch_id = null;

  return payload;
}

function buildBranchIdsFromStockMatrix() {
  const rows = arr(stockMatrix.value);
  const bids = [];

  for (const r of rows) {
    const bid = toInt(r.branch_id, 0);
    if (!bid) continue;

    const enabled = toBool(r.enabled, false);
    const qty = num(r.qty, 0);
    if (enabled || qty !== 0) bids.push(bid);
  }

  const owner = toInt(draft.value?.branch_id, 0);
  if (owner) bids.push(owner);

  return Array.from(new Set(bids));
}

/* ===================== Create/Edit ===================== */
async function createAll() {
  if (isEdit.value) return;

  const errs = validateDatos();
  if (errs) {
    step.value = 1;
    showValidation(errs, "No se puede crear el producto todavía.");
    return;
  }

  busy.value = true;
  products.error = null;
  products.lastFieldErrors = null;

  try {
    const payload = buildPayload();
    payload.branch_ids = buildBranchIdsFromStockMatrix();

    // NO mandamos sku acá (se fija al final con ID real)
    delete payload.sku;

    const ok = await products.create(payload);
    if (!ok) {
      showValidation(["• Hay errores de validación del servidor."], "No se pudo crear.");
      return;
    }

    const created = products.current;
    const pid = toInt(created?.id, 0);
    if (!pid) {
      showValidation(["• La API no devolvió un ID válido del producto."], "No se pudo crear.");
      return;
    }

    // fijamos sku real con id real
    const skuReal = buildSku({ ...draft.value, ...created }, pid);
    try {
      await products.update(pid, { sku: skuReal });
      draft.value = { ...draft.value, ...deepClone(created), sku: skuReal };
    } catch (e) {
      toast("⚠️ No se pudo fijar SKU final: " + (e?.friendlyMessage || e?.message || "Falló"));
      draft.value = { ...draft.value, ...deepClone(created) };
    }

    // imágenes
    if (imagesCount.value) {
      const up = await products.uploadImages(pid, arr(queuedImages.value));
      if (!up) toast("⚠️ Imágenes: " + (products.error || "No se pudieron subir"));
      else toast("✅ Imágenes subidas");
    }

    // videos
    await commitVideos(pid);

    emit("saved");
    toast("✅ Producto creado");
    openLocal.value = false;
  } finally {
    busy.value = false;
  }
}

async function saveAll() {
  if (!isEdit.value) return;

  const pid = toInt(draft.value?.id, 0);
  if (!pid) {
    showValidation(["• No hay ID de producto para editar."], "No se pudo guardar.");
    return;
  }

  const errs = validateDatos();
  if (errs) {
    step.value = 1;
    showValidation(errs, "No se puede guardar todavía.");
    return;
  }

  busy.value = true;
  products.error = null;
  products.lastFieldErrors = null;

  try {
    const payload = buildPayload();
    payload.branch_ids = buildBranchIdsFromStockMatrix();

    // en edit, si no hay sku lo calculamos con id real
    if (!String(payload.sku || "").trim()) payload.sku = buildSku(draft.value, pid);

    const ok = await products.update(pid, payload);
    if (!ok) {
      showValidation(["• Hay errores de validación del servidor."], "No se pudo guardar.");
      return;
    }

    // imágenes (edit)
    if (imagesCount.value) {
      const up = await products.uploadImages(pid, arr(queuedImages.value));
      if (!up) toast("⚠️ Imágenes: " + (products.error || "No se pudieron subir"));
      else toast("✅ Imágenes subidas");
      queuedImages.value = [];
    }

    // videos
    await commitVideos(pid);

    emit("saved");
    toast("✅ Cambios guardados");
    openLocal.value = false;
  } finally {
    busy.value = false;
  }
}
</script>

<style>
.pf-overlay .pf-card {
  height: 100vh;
  max-height: 100vh;
  width: 100vw;
  max-width: 100vw;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0 !important;
}

.pf-overlay .pf-top,
.pf-overlay .pf-footer {
  background: rgb(var(--v-theme-surface));
}

.pf-overlay .pf-top {
  position: sticky;
  top: 0;
  z-index: 30;
}

.pf-overlay .pf-footer {
  position: sticky;
  bottom: 0;
  z-index: 30;
}

.pf-overlay .pf-body {
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  background: rgb(var(--v-theme-background));
}

.pf-appbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
}

.pf-appbar-left {
  display: grid;
  gap: 2px;
}

.pf-h1 {
  font-size: 18px;
  font-weight: 900;
  line-height: 1.1;
}

.pf-sub {
  font-size: 13px;
  opacity: 0.85;
}

.pf-progress {
  padding: 0 16px 10px 16px;
}

.pf-stepper-head {
  padding: 10px 12px;
}

.pf-stepper-mobile {
  padding: 10px 10px 8px 10px;
}

.pf-slide {
  max-width: 100%;
}

.pf-stepchip {
  margin-right: 8px;
  border-radius: 999px !important;
  padding: 0 10px;
  user-select: none;
}

.pf-stepchip-n {
  font-weight: 900;
  margin-right: 8px;
}

.pf-stepchip-t {
  font-weight: 800;
}

.pf-stephint {
  margin-top: 8px;
  padding: 0 6px;
  opacity: 0.9;
}

.pf-overlay .pf-pad {
  padding: 16px;
}
@media (max-width: 600px) {
  .pf-overlay .pf-pad {
    padding: 12px;
  }
  .pf-appbar {
    padding: 12px 12px;
  }
  .pf-progress {
    padding: 0 12px 10px 12px;
  }
}

.pf-overlay .pf-step {
  display: grid;
  gap: 12px;
}

.pf-overlay .pf-meta {
  font-size: 12px;
  opacity: 0.9;
}

.pf-overlay .pf-actions {
  padding: 12px 16px;
  gap: 10px;
}

.pf-footer-left {
  min-width: 160px;
}

.pf-btn {
  border-radius: 12px !important;
}

@media (max-width: 600px) {
  .pf-overlay .pf-actions {
    padding: 10px 12px;
    flex-direction: column;
    align-items: stretch;
  }

  .pf-footer-left {
    width: 100%;
    min-width: 0;
  }

  .pf-footer-right {
    width: 100%;
    display: grid !important;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .pf-footer-right .pf-btn {
    width: 100%;
  }
}

.pf-summary-grid {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 12px;
}
@media (max-width: 1100px) {
  .pf-summary-grid {
    grid-template-columns: 1fr;
  }
}

.pf-summary-card {
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.pf-kv {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 8px 12px;
  align-items: baseline;
}
@media (max-width: 600px) {
  .pf-kv {
    grid-template-columns: 120px 1fr;
  }
}
.pf-kv .k {
  font-size: 12px;
  opacity: 0.75;
}
.pf-kv .v {
  font-weight: 700;
  word-break: break-word;
}

.pf-desc {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  min-height: 52px;
  white-space: pre-wrap;
}

.pf-stock-preview {
  display: grid;
  gap: 8px;
}
.pf-stock-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
}
.pf-stock-row .n {
  font-weight: 800;
}
.pf-stock-row .q {
  font-weight: 900;
}

.pf-ul {
  margin: 0;
  padding-left: 18px;
}

.pf-media-card {
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.pf-video-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 960px) {
  .pf-video-grid {
    grid-template-columns: 1fr;
  }
}

.pf-queue {
  display: grid;
  gap: 8px;
}
.pf-queue-list {
  display: grid;
  gap: 8px;
}
.pf-queue-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
}
.pf-queue-title {
  font-weight: 800;
  font-size: 12px;
}
.pf-queue-sub {
  font-size: 12px;
  opacity: 0.8;
}
</style>