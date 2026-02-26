<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/ProductFormDialog.vue -->
<!-- FIX MOBILE UI:
  ✅ Footer: botones NO se rompen (stack real + safe-area + widths)
  ✅ Stepper mobile: NO se deforma (sin arrows superpuestos, scroll por swipe)
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
          <!-- ✅ FIX: sin show-arrows (en mobile se superponen / deforman)
               scroll por swipe + chips "no wrap" -->
          <v-slide-group
            class="pf-slide"
            center-active
          >
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
            <ProductDataPanel
              v-model="draft"
              :disabled="busy"
              :product-id="draft?.id || null"
              :categories="categoriesList"
              :subcategories="subcategoriesList"
              :sku-preview="skuPreview"
              @reload-taxonomies="ensureTaxonomies"
            />

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

          <!-- STEP 5 ✅ RESUMEN (NO SE TOCA) -->
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
                  <div class="k">Rubro</div><div class="v">{{ safe(getCategoryNameById(getCategoryIdFromDraft(draft))) }}</div>
                  <div class="k">Subrubro</div><div class="v">{{ safe(getSubcategoryNameById(getSubcategoryIdFromDraft(draft))) }}</div>
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

            <v-btn
              v-if="step < 5"
              class="pf-btn"
              color="primary"
              variant="flat"
              @click="nextStep"
              :disabled="busy"
            >
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
import { CategoriesService } from "../../../app/services/categories.service";

import ProductDataPanel from "./form/ProductDataPanel.vue";
import ProductPricesPanel from "./panels/ProductPricesPanel.vue";
import ProductStockPanel from "./panels/ProductStockPanel.vue";
import ProductImagesPanel from "./panels/ProductImagesPanel.vue";
import ProductVideosPanel from "./panels/ProductVideosPanel.vue";
import ProductBarcodeCard from "./form/ProductBarcodeCard.vue";

/* ===================== Props/Emit ===================== */
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

/* ===================== UI state ===================== */
const step = ref(1);
const nextCodePreview = ref(null);

// taxonomies
const categoriesList = ref([]);
const subcategoriesList = ref([]);

// stock + media queues
const stockMatrix = ref([]);
const queuedImages = ref([]); // File[]
const queuedYoutubeVideos = ref([]); // [{key,url,title?}]
const queuedVideoFiles = ref([]); // File[]

// YouTube input
const ytUrl = ref("");
const ytError = ref("");

// toast
const snack = ref({ open: false, text: "" });
function toast(t) {
  snack.value = { open: true, text: String(t || "") };
}

// validation modal
const vModal = ref({ open: false, message: "", items: [] });
function showValidation(items = [], message = "") {
  vModal.value = {
    open: true,
    message: message || "",
    items: (Array.isArray(items) ? items : []).filter(Boolean),
  };
}

/* ===================== Utils ===================== */
function arr(v) {
  return Array.isArray(v) ? v : [];
}
const imagesCount = computed(() => arr(queuedImages.value).length);
const youtubeCount = computed(() => arr(queuedYoutubeVideos.value).length);
const videoFilesCount = computed(() => arr(queuedVideoFiles.value).length);
const videosCount = computed(() => youtubeCount.value + videoFilesCount.value);

/* ✅ FIX CLAVE: toInt robusto (soporta objetos de v-select return-object) */
function toInt(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;

  if (typeof v === "object") {
    const cand =
      v?.id ??
      v?.value ??
      v?.category_id ??
      v?.subcategory_id ??
      v?.rubro_id ??
      v?.subrubro_id ??
      v?.categoryId ??
      v?.subcategoryId ??
      null;

    if (cand !== null && cand !== undefined && cand !== "") {
      const n2 = parseInt(String(cand), 10);
      return Number.isFinite(n2) ? n2 : d;
    }
    return d;
  }

  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

function num(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}
function safe(v) {
  const s = String(v ?? "").trim();
  return s ? s : "—";
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

function normalizeTaxo(raw) {
  const a = arr(raw);
  return a
    .map((x) => {
      const id =
        toInt(x?.id, 0) ||
        toInt(x?.value, 0) ||
        toInt(x?.category_id, 0) ||
        toInt(x?.subcategory_id, 0) ||
        toInt(x?.rubro_id, 0) ||
        toInt(x?.subrubro_id, 0);

      const name = String(x?.name ?? x?.nombre ?? x?.title ?? x?.label ?? x?.text ?? "").trim();

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

/* ===================== Load taxonomies ===================== */
async function loadCategories() {
  const data = await CategoriesService.list();
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.rows)
        ? data.rows
        : [];
  return normalizeTaxo(list);
}

async function loadSubcategories() {
  const { data } = await http.get("/subcategories");
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.rows)
        ? data.rows
        : [];
  return normalizeTaxo(list);
}

async function ensureTaxonomies() {
  try {
    const [cats, subs] = await Promise.all([loadCategories(), loadSubcategories()]);
    categoriesList.value = cats;
    subcategoriesList.value = subs;

    if (!categoriesList.value.length) toast("⚠️ No hay rubros cargados (API /categories devolvió vacío).");
    if (!subcategoriesList.value.length) toast("⚠️ No hay subrubros cargados (API /subcategories devolvió vacío).");
  } catch (e) {
    console.error("[taxo] ERROR loading taxonomies:", e);
    toast("❌ Error cargando Rubros/Subrubros (mirá consola).");
    categoriesList.value = [];
    subcategoriesList.value = [];
  }
}

/* ===================== Draft helpers ===================== */
function pickId(maybe) {
  return toInt(maybe, 0);
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
    sku: "", // ✅ NO tocar acá, se fija al final
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

/* ✅ FIX: si el panel devuelve objeto, lo convertimos a ID (para que Stepper/preview no se rompa) */
watch(
  () => draft.value?.category_id,
  (v) => {
    if (v && typeof v === "object") draft.value.category_id = toInt(v, 0) || null;
  }
);
watch(
  () => draft.value?.subcategory_id,
  (v) => {
    if (v && typeof v === "object") draft.value.subcategory_id = toInt(v, 0) || null;
  }
);

/* ===================== SKU (preview + final) ===================== */
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
    out += p[0] || "";
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
  const s = String(draft.value?.sku || "").trim();
  return s || skuPreview.value;
});

/* ===================== Stepper mobile ===================== */
const steps = [
  { value: 1, title: "Datos" },
  { value: 2, title: "Precios" },
  { value: 3, title: "Stock" },
  { value: 4, title: "Media" },
  { value: 5, title: "Resumen" },
];

/* ===================== Validation ===================== */
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

/* ===================== Navigation ===================== */
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

/* ===================== Cancel ===================== */
function onCancel() {
  emit("cancel");
  openLocal.value = false;
}

/* ===================== Images queue ===================== */
function onQueuedChanged(files) {
  queuedImages.value = arr(files);
}

/* ===================== Videos queue ===================== */
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

  // IMPORTANT: SKU se fija AL FINAL
  delete payload.sku;

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

/* ===================== Create ===================== */
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

    // ✅ fijar SKU final con ID real
    const skuReal = buildSku({ ...draft.value, ...created }, pid);
    try {
      await products.update(pid, { sku: skuReal });
      draft.value = { ...draft.value, ...deepClone(created), sku: skuReal };
    } catch (e) {
      toast("⚠️ No se pudo fijar SKU final: " + (e?.friendlyMessage || e?.message || "Falló"));
      draft.value = { ...draft.value, ...deepClone(created) };
    }

    // stock init (create)
    const rows = arr(stockMatrix.value);
    for (const r of rows) {
      const bid = toInt(r.branch_id, 0);
      const wid = toInt(r.warehouse_id, 0);

      const enabled = toBool(r.enabled, false);
      const qty = num(r.qty, NaN);
      if (!Number.isFinite(qty)) continue;

      if (!enabled && qty === 0) continue;

      const ok2 = await products.initStock({
        product_id: pid,
        branch_id: bid || null,
        warehouse_id: wid || null,
        qty,
      });

      if (!ok2) toast("⚠️ Stock: " + (products.error || `Falló sucursal ${bid || "—"}`));
    }

    // images
    if (imagesCount.value) {
      const up = await products.uploadImages(pid, arr(queuedImages.value));
      if (!up) toast("⚠️ Imágenes: " + (products.error || "No se pudieron subir"));
      else toast("✅ Imágenes subidas");
    }

    await commitVideos(pid);

    emit("saved");
    toast("✅ Producto creado");
    openLocal.value = false;
  } finally {
    busy.value = false;
  }
}

/* ===================== Edit ===================== */
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

    const ok = await products.update(pid, payload);
    if (!ok) {
      showValidation(["• Hay errores de validación del servidor."], "No se pudo guardar.");
      return;
    }

    // ✅ si el producto edit NO tenía sku, lo fijamos igual
    if (!String(draft.value?.sku || "").trim()) {
      const skuReal = buildSku(draft.value, pid);
      try {
        await products.update(pid, { sku: skuReal });
        draft.value.sku = skuReal;
      } catch {}
    }

    // stock set absoluto (edit)
    const rows = arr(stockMatrix.value);
    for (const r of rows) {
      const bid = toInt(r.branch_id, 0);
      const wid = toInt(r.warehouse_id, 0);

      const enabled = toBool(r.enabled, false);
      const desiredQty = enabled ? num(r.qty, NaN) : 0;

      if (enabled && !Number.isFinite(desiredQty)) continue;

      const cur = num(r.current_qty, NaN);
      if (Number.isFinite(cur) && desiredQty === cur) continue;

      const ok2 = await products.initStock({
        product_id: pid,
        branch_id: bid || null,
        warehouse_id: wid || null,
        qty: desiredQty,
      });

      if (!ok2) toast("⚠️ Stock: " + (products.error || `Falló sucursal ${bid || "—"}`));
    }

    // images
    if (imagesCount.value) {
      const up = await products.uploadImages(pid, arr(queuedImages.value));
      if (!up) toast("⚠️ Imágenes: " + (products.error || "No se pudieron subir"));
      else toast("✅ Imágenes subidas");
      queuedImages.value = [];
    }

    await commitVideos(pid);

    emit("saved");
    toast("✅ Cambios guardados");
    openLocal.value = false;
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
/* =========================================================
   ✅ UI REFRESH (LIGHT + DARK) — ProductFormDialog
   + FIX MOBILE:
   - Stepper chips sin deformar (scroll)
   - Footer sticky con safe-area y botones 100% (no se rompen)
========================================================= */

.pf-card {
  /* tokens base */
  --pf-surface: rgb(var(--v-theme-surface));
  --pf-surface2: rgb(var(--v-theme-surface-variant));
  --pf-on: rgb(var(--v-theme-on-surface));
  --pf-outline: rgb(var(--v-theme-outline));
  --pf-outline2: rgb(var(--v-theme-outline-variant));

  /* bordes adaptativos */
  --pf-b1: color-mix(in srgb, var(--pf-outline) 26%, transparent);
  --pf-b2: color-mix(in srgb, var(--pf-outline) 16%, transparent);

  /* fondos suaves */
  --pf-fill: color-mix(in srgb, var(--pf-surface2) 42%, var(--pf-surface));
  --pf-fill2: color-mix(in srgb, var(--pf-surface2) 65%, var(--pf-surface));

  /* texto */
  --pf-muted: color-mix(in srgb, var(--pf-on) 70%, transparent);
  --pf-muted2: color-mix(in srgb, var(--pf-on) 55%, transparent);

  /* sombras (suaves en light, más marcadas en dark) */
  --pf-shadow-1: 0 10px 26px color-mix(in srgb, rgba(0,0,0,.18) 55%, transparent);
  --pf-shadow-2: 0 18px 48px color-mix(in srgb, rgba(0,0,0,.22) 60%, transparent);
}

/* ================= OVERLAY ================= */
:deep(.pf-overlay) {
  background: color-mix(in srgb, var(--pf-surface) 35%, rgba(0, 0, 0, 1));
}

:deep(.pf-overlay .v-overlay__content) {
  width: 100vw;
  height: 100vh;
  margin: 0 !important;
  max-width: none !important;
  max-height: none !important;
  display: flex;
}

/* Card raíz */
.pf-card {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--pf-surface);
}

/* ================= HEADER ================= */
.pf-top {
  background: var(--pf-surface);
}

.pf-appbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
}

.pf-h1 {
  font-weight: 900;
  font-size: 18px;
  line-height: 1.2;
  letter-spacing: 0.2px;
}

.pf-sub {
  font-size: 12px;
  color: var(--pf-muted);
}

.pf-progress {
  padding: 0 16px 10px;
}

/* Stepper desktop */
.pf-stepper-head {
  padding: 10px 16px 12px;
}

.pf-stepper {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--pf-b2);
  background: color-mix(in srgb, var(--pf-surface) 70%, var(--pf-fill));
  box-shadow: 0 8px 18px color-mix(in srgb, rgba(0,0,0,.12) 50%, transparent);
}

.pf-stepper :deep(.v-stepper-item) {
  padding-top: 10px;
  padding-bottom: 10px;
}
.pf-stepper :deep(.v-stepper-item__title) {
  font-weight: 800;
  letter-spacing: 0.1px;
}
.pf-stepper :deep(.v-stepper-item__subtitle) {
  color: var(--pf-muted2);
}

/* ================= Stepper mobile ================= */
.pf-stepper-mobile {
  padding: 10px 12px 12px;
}

/* ✅ FIX: que el slide-group sea scrolleable y no “aplastado” */
.pf-slide {
  width: 100%;
}
.pf-slide :deep(.v-slide-group__container) {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.pf-slide :deep(.v-slide-group__content) {
  gap: 8px;
  padding: 2px 2px;
}
.pf-slide :deep(.v-slide-group__prev),
.pf-slide :deep(.v-slide-group__next) {
  display: none !important; /* por si Vuetify decide mostrarlos */
}

.pf-stepchip {
  border-radius: 999px;
  font-weight: 900;
  flex: 0 0 auto;
  max-width: none;
}
.pf-stepchip-t {
  white-space: nowrap;
}

.pf-stepchip-n {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  margin-right: 8px;
  font-size: 12px;
  background: color-mix(in srgb, var(--pf-on) 12%, transparent);
}

.pf-stephint {
  margin-top: 8px;
}

/* ================= BODY ================= */
.pf-body {
  flex: 1;
  overflow-y: auto;
  /* ✅ FIX: padding extra para que el footer sticky no tape contenido + safe-area */
  padding-bottom: calc(118px + env(safe-area-inset-bottom, 0px));
}

.pf-pad {
  max-width: 1040px;
  margin: 0 auto;
  padding: 20px 14px;
}

.pf-step {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--pf-surface) 82%, var(--pf-fill2));
  border: 1px solid var(--pf-b1);
  box-shadow: var(--pf-shadow-1);
}

.pf-step :deep(.v-card),
.pf-step :deep(.v-sheet),
.pf-step :deep(.v-alert),
.pf-step :deep(.v-expansion-panel),
.pf-step :deep(.v-table),
.pf-step :deep(.v-list) {
  background: var(--pf-surface) !important;
}

.pf-step :deep(.v-card),
.pf-step :deep(.v-expansion-panel),
.pf-step :deep(.v-alert),
.pf-step :deep(.v-table),
.pf-step :deep(.v-sheet) {
  border: 1px solid var(--pf-b2);
  border-radius: 14px !important;
  box-shadow: none;
}

.pf-step :deep(.v-field) {
  background: color-mix(in srgb, var(--pf-surface) 75%, var(--pf-fill)) !important;
  border-radius: 12px;
}
.pf-step :deep(.v-field__outline) {
  opacity: 1 !important;
}
.pf-step :deep(.v-field--focused .v-field__outline) {
  filter: saturate(1.05);
}

.pf-meta {
  font-size: 12.5px;
  color: var(--pf-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

/* ================= FOOTER ================= */
.pf-footer {
  position: sticky;
  bottom: 0;
  z-index: 5;
  border-top: 1px solid var(--pf-b2);
  background: color-mix(in srgb, var(--pf-surface) 88%, transparent);
  backdrop-filter: blur(8px);
}

.pf-actions {
  padding: 12px 14px;
  /* ✅ FIX: si falta espacio, que no reviente */
  flex-wrap: wrap;
  row-gap: 10px;
}

.pf-footer-left {
  min-width: 0;
}

.pf-footer-right {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.pf-btn {
  border-radius: 12px !important;
}

/* ================= RESUMEN ================= */
.pf-summary-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 14px;
}

@media (max-width: 1100px) {
  .pf-summary-grid {
    grid-template-columns: 1fr;
  }
}

.pf-summary-card {
  padding: 16px;
  border-radius: 16px;
  border: 1px solid var(--pf-b2);
  background: var(--pf-surface);
  box-shadow: var(--pf-shadow-1);
}

.pf-kv {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 8px 12px;
  align-items: start;
}

.pf-kv .k {
  font-size: 12px;
  color: var(--pf-muted2);
}

.pf-kv .v {
  font-weight: 800;
  word-break: break-word;
}

.pf-desc {
  padding: 12px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--pf-on) 7%, transparent);
  border: 1px solid var(--pf-b2);
  min-height: 60px;
  white-space: pre-wrap;
}

.pf-stock-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--pf-on) 7%, transparent);
  border: 1px solid var(--pf-b2);
}

.pf-video-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

@media (max-width: 960px) {
  .pf-video-grid {
    grid-template-columns: 1fr;
  }
}

/* ✅ Mobile: footer perfecto */
@media (max-width: 600px) {
  .pf-pad {
    padding: 14px 10px;
  }

  .pf-step {
    padding: 14px;
    border-radius: 16px;
  }

  .pf-kv {
    grid-template-columns: 120px 1fr;
  }

  .pf-actions {
    flex-direction: column;
    align-items: stretch !important;
    justify-content: flex-start !important;
    /* ✅ safe area */
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  }

  .pf-footer-left {
    width: 100%;
    text-align: center;
    order: 0;
  }

  .pf-footer-right {
    width: 100%;
    flex-direction: column;
    order: 1;
    gap: 10px;
  }

  .pf-btn {
    width: 100%;
  }
}

/* helpers */
.minw-0 {
  min-width: 0;
}
</style>