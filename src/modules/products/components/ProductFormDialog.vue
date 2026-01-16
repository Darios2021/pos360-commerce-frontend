<!-- src/modules/products/components/ProductFormDialog.vue -->
<template>
  <v-dialog v-model="openLocal" max-width="1100" persistent>
    <v-card rounded="xl">
      <!-- HEADER -->
      <v-card-title class="d-flex align-center justify-space-between">
        <div>
          <div class="text-h6 font-weight-bold">
            {{ isEdit ? "Editar producto" : "Nuevo producto" }}
          </div>
          <div class="text-caption text-medium-emphasis">
            Rubro/Subrubro · Stock por sucursal · Imágenes MinIO.
          </div>
        </div>

        <v-btn icon variant="text" @click="onCancel" :disabled="busy">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <!-- TABS -->
      <v-tabs v-model="tab" grow>
        <v-tab value="datos"><v-icon start>mdi-form-textbox</v-icon>DATOS</v-tab>
        <v-tab value="precios"><v-icon start>mdi-currency-usd</v-icon>PRECIOS</v-tab>
        <v-tab value="stock"><v-icon start>mdi-warehouse</v-icon>STOCK</v-tab>
        <v-tab value="imagenes"><v-icon start>mdi-image-multiple</v-icon>IMÁGENES</v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text class="pa-0">
        <v-window v-model="tab">
          <v-window-item value="datos">
            <div class="pa-4">
              <ProductDataPanel
                v-model="draft"
                :disabled="busy"
                :product-id="draft?.id || null"
              />

              <div class="text-caption text-medium-emphasis mt-2 d-flex align-center flex-wrap ga-2">
                <div>
                  ID producto: <b>{{ draft?.id || "—" }}</b>
                </div>
                <div>
                  · Código (auto): <b>{{ draft?.code || nextCodePreview || "—" }}</b>
                  <span v-if="!draft?.id" class="ml-1">(preview)</span>
                </div>

                <v-btn
                  size="small"
                  variant="tonal"
                  class="ml-auto"
                  @click="reloadNextCode"
                  :disabled="busy || isEdit"
                >
                  <v-icon start>mdi-refresh</v-icon>
                  Recalcular código
                </v-btn>
              </div>

              <div class="mt-4">
                <ProductBarcodeCard
                  :value="draft?.code || ''"
                  :preview="nextCodePreview || ''"
                  :label="draft?.id ? 'AUTO' : 'PREVIEW'"
                />
              </div>

              <div v-if="products.error" class="mt-3">
                <v-alert type="error" variant="tonal" density="comfortable">
                  {{ products.error }}
                </v-alert>

                <div v-if="products.lastFieldErrors" class="mt-2 text-caption text-medium-emphasis">
                  <div v-for="(msg, field) in products.lastFieldErrors" :key="field">
                    • <b>{{ field }}</b>: {{ msg }}
                  </div>
                </div>
              </div>
            </div>
          </v-window-item>

          <v-window-item value="precios">
            <div class="pa-4">
              <ProductPricesPanel v-model="draft" :disabled="busy" />
            </div>
          </v-window-item>

          <v-window-item value="stock">
            <div class="pa-4">
              <ProductStockPanel
                :product-id="draft?.id || null"
                v-model="stockMatrix"
                :ensure-id="ensureProductId"
                @applied="onStockApplied"
              />
            </div>
          </v-window-item>

          <v-window-item value="imagenes">
            <div class="pa-4">
              <ProductImagesPanel
                :product-id="draft?.id || null"
                :ensure-id="ensureProductId"
              />
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider />

      <!-- FOOTER -->
      <v-card-actions class="pa-4 d-flex align-center justify-space-between">
        <v-btn variant="tonal" @click="emitReload" :disabled="busy">
          <v-icon start>mdi-refresh</v-icon>
          RECARGAR DATOS
        </v-btn>

        <div class="d-flex ga-2">
          <v-btn variant="tonal" @click="onCancel" :disabled="busy">CANCELAR</v-btn>

          <v-btn color="primary" variant="flat" @click="onSave" :loading="busy" :disabled="busy">
            <v-icon start>mdi-content-save</v-icon>
            GUARDAR
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useProductsStore } from "../../../app/store/products.store";

import ProductDataPanel from "./form/ProductDataPanel.vue";
import ProductPricesPanel from "./panels/ProductPricesPanel.vue";
import ProductStockPanel from "./panels/ProductStockPanel.vue";
import ProductImagesPanel from "./panels/ProductImagesPanel.vue";
import ProductBarcodeCard from "./form/ProductBarcodeCard.vue";

const props = defineProps({
  open: { type: Boolean, default: false },   // v-model:open
  mode: { type: String, default: "create" }, // create | edit
  item: { type: Object, default: null },     // :item="formItem"
});

const emit = defineEmits(["update:open", "saved", "deleted", "reload", "cancel"]);

const products = useProductsStore();

const tab = ref("datos");
const busy = ref(false);
const isEdit = computed(() => props.mode === "edit");

const openLocal = computed({
  get: () => props.open,
  set: (v) => emit("update:open", v),
});

const stockMatrix = ref([]);

// ✅ SINGLE-FLIGHT: evita 10 POST /products en paralelo
const ensureCreatePromise = ref(null);

// preview code
const nextCodePreview = ref(null);

// =====================
// Draft producto
// =====================
function defaultDraft() {
  return {
    id: null,
    name: "",
    sku: "",
    code: null,       // lo genera backend
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

async function reloadNextCode() {
  // solo en create
  if (isEdit.value) return;
  const code = await products.fetchNextCode();
  nextCodePreview.value = code || null;
}

function hydrateDraft() {
  if (isEdit.value && props.item && typeof props.item === "object") {
    const base = defaultDraft();
    const it = deepClone(props.item);
    draft.value = { ...base, ...it };
  } else {
    draft.value = defaultDraft();
  }

  stockMatrix.value = Array.isArray(draft.value?.stock_matrix)
    ? deepClone(draft.value.stock_matrix)
    : [];

  // reset single-flight al abrir
  ensureCreatePromise.value = null;
  products.error = null;

  // preview code
  nextCodePreview.value = null;
  if (!isEdit.value) reloadNextCode();
}

watch(
  () => props.open,
  (v) => {
    if (!v) return;
    tab.value = "datos";
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

function emitReload() {
  emit("reload");
}

function onStockApplied() {
  // hook opcional
}

// =====================
// Validación mínima para permitir "auto-crear"
// =====================
function validateForCreate() {
  const name = String(draft.value?.name || "").trim();
  const sku = String(draft.value?.sku || "").trim();
  if (!name) return "Falta Nombre";
  if (!sku) return "Falta SKU";
  return null;
}

function buildPayload() {
  const payload = {
    ...draft.value,
    name: String(draft.value?.name || "").trim(),
    sku: String(draft.value?.sku || "").trim(),
    description: String(draft.value?.description || "").trim(),
    brand: String(draft.value?.brand || "").trim(),
    model: String(draft.value?.model || "").trim(),
  };

  // ✅ Seguridad: el cliente NO setea code
  delete payload.code;

  // ✅ normalizar vacíos
  if (payload.barcode === "") payload.barcode = null;
  if (payload.category_id === "") payload.category_id = null;
  if (payload.subcategory_id === "") payload.subcategory_id = null;

  return payload;
}

/**
 * ✅ asegura que exista product_id.
 * - Si ya existe, lo devuelve.
 * - Si no existe, valida mínimo y CREA el producto.
 * - ✅ FIX: single-flight (una sola creación en paralelo)
 */
async function ensureProductId() {
  const currentId = Number(draft.value?.id || 0);
  if (currentId > 0) return currentId;

  // si ya hay una creación en curso, esperala
  if (ensureCreatePromise.value) return ensureCreatePromise.value;

  const err = validateForCreate();
  if (err) throw new Error(err);

  products.error = null;

  ensureCreatePromise.value = (async () => {
    busy.value = true;
    try {
      const payload = buildPayload();

      const res = await products.create(payload);
      if (!res) throw new Error(products.error || "No se pudo crear el producto");

      const created = products.current;
      const id = Number(created?.id || 0);
      if (!id) throw new Error("La API no devolvió ID de producto");

      // ✅ merge: backend devuelve code correcto
      draft.value = { ...draft.value, ...deepClone(created) };
      nextCodePreview.value = null; // ya tenemos el real
      emit("saved");

      return id;
    } finally {
      busy.value = false;
      // liberar el lock SIEMPRE
      ensureCreatePromise.value = null;
    }
  })();

  return ensureCreatePromise.value;
}

// =====================
// Save manual (botón Guardar)
// =====================
async function onSave() {
  // si en paralelo se estaba creando por ensureProductId, evitamos doble create
  if (!isEdit.value && ensureCreatePromise.value) {
    try {
      await ensureCreatePromise.value;
      tab.value = "stock";
      return;
    } catch {
      // sigue al flujo normal
    }
  }

  busy.value = true;
  products.error = null;

  try {
    const payload = buildPayload();
    const isEditing = isEdit.value && Number(draft.value?.id || 0) > 0;

    const res = isEditing
      ? await products.update(Number(draft.value.id), payload)
      : await products.create(payload);

    if (!res) throw new Error(products.error || "No se pudo guardar");

    if (products.current?.id) {
      draft.value = { ...draft.value, ...deepClone(products.current) };
      nextCodePreview.value = null;
    }

    emit("saved");

    if (!isEditing) {
      tab.value = "stock";
      return;
    }

    openLocal.value = false;
  } catch (e) {
    products.error = products.error || e?.message || "No se pudo guardar";
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
/* limpio */
</style>
