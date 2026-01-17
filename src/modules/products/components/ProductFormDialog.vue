<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/ProductFormDialog.vue -->
<template>
  <v-dialog
    v-model="openLocal"
    :max-width="dialogMaxWidth"
    :fullscreen="isMobile"
    persistent
    content-class="pf-overlay"
  >
    <v-card class="pf-card" rounded="xl">
      <!-- HEADER -->
      <div class="pf-top">
        <v-card-title class="pf-title d-flex align-center justify-space-between">
          <div class="minw-0">
            <div class="pf-h1 text-truncate">
              {{ isEdit ? "Editar producto" : "Nuevo producto" }}
            </div>
            <div class="pf-sub text-truncate">
              Carga guiada por pasos (Anterior / Siguiente)
            </div>
          </div>

          <v-btn icon variant="text" @click="onCancel" :disabled="busy">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider />

        <!-- STEPPER -->
        <div class="pf-stepper-head">
          <v-stepper v-model="step" alt-labels class="pf-stepper" density="comfortable">
            <v-stepper-header>
              <v-stepper-item :value="1" title="Datos" subtitle="Obligatorio" />
              <v-divider />
              <v-stepper-item :value="2" title="Precios" subtitle="Opcional" :disabled="!canGoAfterStep1" />
              <v-divider />
              <v-stepper-item :value="3" title="Stock" subtitle="Sucursal" :disabled="!canGoAfterStep1" />
              <v-divider />
              <v-stepper-item :value="4" title="Imágenes" subtitle="MinIO" :disabled="!canGoAfterStep1" />
              <v-divider />
              <v-stepper-item :value="5" title="Resumen" subtitle="Preview" :disabled="!canGoAfterStep1" />
            </v-stepper-header>
          </v-stepper>
        </div>

        <v-divider />
      </div>

      <!-- BODY -->
      <div class="pf-body">
        <div class="pf-pad">
          <!-- STEP 1 -->
          <div v-show="step === 1" class="pf-step">
            <ProductDataPanel v-model="draft" :disabled="busy" :product-id="draft?.id || null" />

            <div class="pf-meta mt-3 d-flex align-center flex-wrap ga-2">
              <div>ID: <b>{{ draft?.id || "—" }}</b></div>
              <div>
                · Código:
                <b>{{ draft?.code || nextCodePreview || "—" }}</b>
                <span v-if="!draft?.id && nextCodePreview" class="ml-1">(preview)</span>
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
                <div class="text-subtitle-1 font-weight-bold">Imágenes</div>
                <div class="text-caption text-medium-emphasis">
                  Elegí imágenes ahora. Quedan en cola y se suben al tocar <b>{{ isEdit ? "GUARDAR" : "CREAR" }}</b>.
                </div>
              </div>

              <v-chip v-if="queuedImages.length" size="small" color="primary" variant="tonal">
                {{ queuedImages.length }} en cola
              </v-chip>
              <v-chip v-else size="small" variant="tonal">Sin cola</v-chip>
            </div>

            <ProductImagesPanel
              :product-id="draft?.id || null"
              v-model="queuedImages"
              @changed="onQueuedChanged"
            />
          </div>

          <!-- STEP 5 -->
          <div v-show="step === 5" class="pf-step">
            <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
              <div>
                <div class="text-subtitle-1 font-weight-bold">Resumen final</div>
                <div class="text-caption text-medium-emphasis">
                  Al tocar <b>{{ isEdit ? "GUARDAR" : "CREAR" }}</b> se registra el producto y se aplica stock.
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
                  <div class="k">SKU</div><div class="v">{{ safe(draft.sku) }}</div>
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

                <div class="text-subtitle-2 font-weight-bold mb-2">Imágenes en cola</div>
                <div v-if="queuedImages.length" class="text-caption">
                  {{ queuedImages.length }} imagen(es) se subirán al {{ isEdit ? "guardar" : "crear" }}.
                </div>
                <div v-else class="text-caption text-medium-emphasis">Sin imágenes.</div>
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
          <div class="text-caption text-medium-emphasis">
            Paso <b>{{ step }}</b> de <b>5</b>
            <span v-if="draft?.id"> · Producto <b>#{{ draft.id }}</b></span>
          </div>

          <div class="d-flex ga-2">
            <v-btn variant="tonal" @click="prevStep" :disabled="busy || step === 1">
              <v-icon start size="18">mdi-chevron-left</v-icon>
              ANTERIOR
            </v-btn>

            <v-btn v-if="step < 5" color="primary" variant="flat" @click="nextStep" :disabled="busy">
              SIGUIENTE
              <v-icon end size="18">mdi-chevron-right</v-icon>
            </v-btn>

            <v-btn
              v-else
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
    </v-card>

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
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import { useProductsStore } from "../../../app/store/products.store";

import ProductDataPanel from "./form/ProductDataPanel.vue";
import ProductPricesPanel from "./panels/ProductPricesPanel.vue";
import ProductStockPanel from "./panels/ProductStockPanel.vue";
import ProductImagesPanel from "./panels/ProductImagesPanel.vue";
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

const { smAndDown } = useDisplay();
const isMobile = computed(() => !!smAndDown.value);
const dialogMaxWidth = computed(() => (isMobile.value ? "100%" : 980));

const step = ref(1);
const nextCodePreview = ref(null);

const stockMatrix = ref([]); // [{branch_id, branch_name, warehouse_id, current_qty, qty}]
const queuedImages = ref([]); // File[]

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

function toInt(v, d = 0) {
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

/**
 * ✅ NEW: lee IDs aunque vengan como objeto / variantes de nombre
 */
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

function deepClone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj || {}));
  } catch {
    return { ...(obj || {}) };
  }
}

const draft = ref(defaultDraft());

const canGoAfterStep1 = computed(() => !validateDatos());
const isReadyToCreate = computed(() => !validateDatos());

const stockPreviewList = computed(() => {
  const arr = Array.isArray(stockMatrix.value) ? stockMatrix.value : [];
  return arr
    .map((r) => ({
      branch_id: toInt(r.branch_id, 0),
      branch_name: String(r.branch_name || "").trim(),
      qty: num(r.qty, 0),
    }))
    .filter((x) => x.branch_id > 0 && x.branch_name && Number.isFinite(x.qty) && x.qty !== 0);
});

async function reloadNextCode() {
  if (isEdit.value) return;
  const code = await products.fetchNextCode();
  nextCodePreview.value = code || null;
}

function hydrateDraft() {
  products.error = null;
  products.lastFieldErrors = null;

  nextCodePreview.value = null;
  queuedImages.value = [];
  stockMatrix.value = [];

  if (isEdit.value && props.item && typeof props.item === "object") {
    draft.value = { ...defaultDraft(), ...deepClone(props.item) };
    step.value = 2;
  } else {
    draft.value = defaultDraft();
    step.value = 1;
    reloadNextCode();
  }

  // si el item trae stock_matrix previo
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

/* ====== Validación paso 1 ====== */
function validateDatos() {
  const errs = [];

  const name = String(draft.value?.name || "").trim();
  const sku = String(draft.value?.sku || "").trim();
  const cat = toInt(getCategoryIdFromDraft(draft.value), 0);

  if (!name) errs.push("• Falta el **Nombre** del producto (Paso 1 → Datos).");
  if (!sku) errs.push("• Falta el **SKU** (código interno) (Paso 1 → Datos).");
  if (!cat) errs.push("• Falta seleccionar el **Rubro** (Paso 1 → Datos).");

  return errs.length ? errs : null;
}

function buildPayload() {
  const category_id = getCategoryIdFromDraft(draft.value);
  const subcategory_id = getSubcategoryIdFromDraft(draft.value);

  const payload = {
    ...draft.value,
    name: String(draft.value?.name || "").trim(),
    sku: String(draft.value?.sku || "").trim(),
    description: String(draft.value?.description || "").trim(),
    brand: String(draft.value?.brand || "").trim(),
    model: String(draft.value?.model || "").trim(),

    category_id: category_id ? toInt(category_id, 0) : null,
    subcategory_id: subcategory_id ? toInt(subcategory_id, 0) : null,

    price_list: num(draft.value?.price_list, 0),
    price_discount: num(draft.value?.price_discount, 0),
    price_reseller: num(draft.value?.price_reseller, 0),
  };

  delete payload.code;

  delete payload.category;
  delete payload.subcategory;
  delete payload.subCategory;
  delete payload.subrubro;

  if (payload.barcode === "") payload.barcode = null;
  if (payload.branch_id === "" || payload.branch_id === 0) payload.branch_id = null;

  return payload;
}

/* ====== Navegación ====== */
function prevStep() {
  step.value = Math.max(1, step.value - 1);
}
function nextStep() {
  if (step.value === 1) {
    const errs = validateDatos();
    if (errs) {
      showValidation(errs, "Antes de continuar, completá estos campos:");
      return;
    }
  }
  step.value = Math.min(5, step.value + 1);
}

/* ====== Cola imágenes ====== */
function onQueuedChanged(files) {
  queuedImages.value = Array.isArray(files) ? files : [];
}

/* ====== Create ====== */
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
    // 1) crear producto
    const payload = buildPayload();
    const res = await products.create(payload);

    if (!res) {
      showValidation(["• Hay errores de validación del servidor (mirá el mensaje en rojo)."], "No se pudo crear.");
      return;
    }

    const created = products.current;
    const pid = toInt(created?.id, 0);
    if (!pid) {
      showValidation(["• La API no devolvió un ID válido del producto."], "No se pudo crear.");
      return;
    }

    draft.value = { ...draft.value, ...deepClone(created) };
    nextCodePreview.value = null;

    // 2) aplicar stock (solo qty != 0)
    const rows = Array.isArray(stockMatrix.value) ? stockMatrix.value : [];
    for (const r of rows) {
      const bid = toInt(r.branch_id, 0);
      const wid = toInt(r.warehouse_id, 0);

      const qty = num(r.qty, NaN);
      if (!Number.isFinite(qty)) continue;
      if (qty === 0) continue;

      const ok = await products.initStock({
        product_id: pid,
        branch_id: bid || null,
        warehouse_id: wid || null,
        qty,
      });

      if (!ok) toast("⚠️ Stock: " + (products.error || `Falló sucursal ${bid || "—"}`));
    }

    // 3) subir imágenes en cola (create)
    if (queuedImages.value.length) {
      const up = await products.uploadImages(pid, queuedImages.value);
      if (!up) toast("⚠️ Imágenes: " + (products.error || "No se pudieron subir"));
      else toast("✅ Imágenes subidas");
    }

    emit("saved");
    toast("✅ Producto creado");
    openLocal.value = false;
  } finally {
    busy.value = false;
  }
}

/* ====== Edit: update + stock real ====== */
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
    // 1) update producto
    const payload = buildPayload();
    const res = await products.update(pid, payload);

    if (!res) {
      showValidation(["• Hay errores de validación del servidor (mirá el mensaje en rojo)."], "No se pudo guardar.");
      return;
    }

    // 2) aplicar stock SET ABSOLUTO donde haya cambios (incluye 0)
    const rows = Array.isArray(stockMatrix.value) ? stockMatrix.value : [];
    for (const r of rows) {
      const bid = toInt(r.branch_id, 0);
      const wid = toInt(r.warehouse_id, 0);

      const qty = num(r.qty, NaN);
      const cur = num(r.current_qty, NaN);

      if (!Number.isFinite(qty)) continue;
      if (!Number.isFinite(cur)) continue;

      if (qty === cur) continue; // solo cambios reales

      const ok = await products.initStock({
        product_id: pid,
        branch_id: bid || null,
        warehouse_id: wid || null,
        qty,
      });

      if (!ok) toast("⚠️ Stock: " + (products.error || `Falló sucursal ${bid || "—"}`));
    }

    // ⚠️ Imágenes en edit: lo dejo apagado para no tocar tu flujo actual.
    // Si querés, lo habilitamos con un "replace/add" controlado.

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
  height: 90vh;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pf-overlay .pf-top,
.pf-overlay .pf-footer {
  background: rgb(var(--v-theme-surface));
}

.pf-overlay .pf-top {
  position: sticky;
  top: 0;
  z-index: 10;
}

.pf-overlay .pf-footer {
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.pf-overlay .pf-body {
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.pf-overlay .pf-title,
.pf-overlay .pf-actions {
  padding: 14px 16px;
}

.pf-overlay .pf-pad {
  padding: 16px;
}

.pf-overlay .pf-h1 {
  font-size: 18px;
  font-weight: 900;
  line-height: 1.1;
}

.pf-overlay .pf-sub {
  font-size: 13px;
  opacity: 0.85;
  margin-top: 2px;
}

.pf-overlay .pf-stepper-head {
  padding: 10px 12px;
}

.pf-overlay .pf-step {
  display: grid;
  gap: 12px;
}

.pf-overlay .pf-meta {
  font-size: 12px;
  opacity: 0.9;
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
</style>
